import { createServerFn } from "@tanstack/react-start";
import { lookupUpc } from "@/integrations/upcitemdb/client";
import { getSupabaseServerClient } from "@/integrations/supabase/server-client";
import { getSupabaseServiceClient } from "@/integrations/supabase/service-client";
import { ServiceError } from "@/lib/types";

async function requireAuthenticatedUser(): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ServiceError("Not authenticated", { code: "UNAUTHENTICATED" });
  }
}

function normalizeUpc(raw: string): string {
  return raw.replace(/\D/g, "");
}

// Retail titles from UPCitemdb are noisier than how ComicVine actually
// catalogues an issue — e.g. "Peach Momoko's Demon Saga: Demon Wars - by
// Peach Momoko & Zack Davisson (Paperback)". Trimming all the way down to
// just the bare series name is worse, not better: "Demon Wars" alone is
// vague enough to collide with unrelated same-named series (the real case
// this was built for). So this only strips two narrow, structural patterns
// that are near-always noise — a trailing format/edition tag, and a
// trailing "by Author & Author" credit clause — never a general free-text
// cleanup. It won't get every retail listing's phrasing right; that's what
// the editable search field in the UI is for, not something this function
// needs to solve alone.
const FORMAT_WORDS = [
  "paperback",
  "hardcover",
  "hardback",
  "tpb",
  "hc",
  "sc",
  "digest",
  "omnibus",
  "ashcan",
  "board book",
  "comic",
];

function stripTrailingCreditClause(title: string): string {
  const idx = title.toLowerCase().lastIndexOf(" by ");
  if (idx < 3) return title;
  const prefix = title
    .slice(0, idx)
    .replace(/[-–—:,\s]+$/, "")
    .trim();
  return prefix || title;
}

function stripTrailingFormatParenthetical(title: string): string {
  const match = title.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (!match) return title;
  const [, rest, inner] = match;
  const normalized = inner.trim().toLowerCase();
  if (!FORMAT_WORDS.some((w) => normalized === w || normalized.includes(w))) return title;
  return rest.trim() || title;
}

export function cleanRetailTitle(rawTitle: string): string {
  const withoutCredit = stripTrailingCreditClause(rawTitle.trim());
  return stripTrailingFormatParenthetical(withoutCredit).trim() || rawTitle.trim();
}

export interface BarcodeLookupResult {
  upc: string;
  /** "matched": already scanned before, issueId is ready to navigate to.
   * "needs_query": UPCitemdb had a product title, cleaned into a suggested
   * ComicVine search query — the caller runs (and can edit) that search
   * itself rather than this function guessing a single right answer.
   * "not_found": no product data at all for this barcode (common for
   * single issues). */
  status: "matched" | "needs_query" | "not_found";
  issueId?: string;
  suggestedQuery?: string;
  /** Only set on "needs_query"/"not_found" — a cache hit never calls
   * UPCitemdb, so there's no fresh count to report. */
  rateLimitRemaining?: number | null;
}

/** Resolves a scanned barcode to a comic. Cache-first (see barcode_lookups
 * table) so a repeat scan — by this user or anyone else — never touches
 * UPCitemdb's tiny 100/day free-tier budget again once someone has
 * confirmed a match for that physical UPC. Deliberately stops short of
 * running the ComicVine search itself — a fresh (uncached) lookup only
 * gets as far as a suggested query, so a wrong auto-picked candidate can
 * never silently reach the cache (and from there, every future scan of
 * that barcode) without a human actually confirming it first. */
export const lookupBarcode = createServerFn({ method: "POST" })
  .validator((input: { upc: string }) => input)
  .handler(async ({ data }): Promise<BarcodeLookupResult> => {
    await requireAuthenticatedUser();
    const upc = normalizeUpc(data.upc);
    if (!upc) {
      throw new ServiceError("Invalid barcode");
    }
    const client = getSupabaseServiceClient();

    const cached = await client
      .from("barcode_lookups")
      .select("issue_id")
      .eq("upc", upc)
      .maybeSingle();
    if (cached.error) {
      throw new ServiceError(`Failed to check barcode cache: ${cached.error.message}`, {
        cause: cached.error,
      });
    }
    if (cached.data) {
      return { upc, status: "matched", issueId: cached.data.issue_id };
    }

    const { item, rateLimitRemaining } = await lookupUpc(upc);
    if (!item || !item.title) {
      return { upc, status: "not_found", rateLimitRemaining };
    }

    return {
      upc,
      status: "needs_query",
      suggestedQuery: cleanRetailTitle(item.title),
      rateLimitRemaining,
    };
  });

/** Caches a confirmed UPC → issue match once the user picks (or the import
 * flow resolves) a candidate. Plain insert, not upsert: two people scanning
 * the same physical comic for the first time within moments of each other
 * can both reach this, so a duplicate-key race is expected and harmless —
 * whoever's row lands first wins, which is exactly the intended "shared,
 * write-once, no ownership" semantics. Deliberately does NOT overwrite an
 * existing row — see correctBarcodeMatch for that, a separate, explicit
 * action rather than a silent side effect of a normal confirm. */
export const recordBarcodeMatch = createServerFn({ method: "POST" })
  .validator((input: { upc: string; issueId: string }) => input)
  .handler(async ({ data }): Promise<void> => {
    await requireAuthenticatedUser();
    const upc = normalizeUpc(data.upc);
    if (!upc) return;
    const client = getSupabaseServiceClient();

    const { error } = await client
      .from("barcode_lookups")
      .insert({ upc, issue_id: data.issueId });
    if (error && error.code !== "23505") {
      throw new ServiceError("Failed to cache barcode match", { cause: error });
    }
  });

/** Overwrites a UPC's cached match — the explicit "this cached match is
 * wrong, use this issue instead" action. Separate from recordBarcodeMatch
 * on purpose: that one is write-once/first-wins by design (two people
 * confirming the same new barcode shouldn't be able to clobber each
 * other), but once a match is confirmed *wrong*, silently ignoring every
 * future correction attempt (the old insert-only behavior) means a bad
 * cache entry is permanent — every rescan of that barcode, by anyone,
 * keeps landing on the wrong comic with no way out. `upc` is the table's
 * primary key, so upsert-on-conflict cleanly replaces the old row. */
export const correctBarcodeMatch = createServerFn({ method: "POST" })
  .validator((input: { upc: string; issueId: string }) => input)
  .handler(async ({ data }): Promise<void> => {
    await requireAuthenticatedUser();
    const upc = normalizeUpc(data.upc);
    if (!upc) return;
    const client = getSupabaseServiceClient();

    const { error } = await client
      .from("barcode_lookups")
      .upsert({ upc, issue_id: data.issueId }, { onConflict: "upc" });
    if (error) {
      throw new ServiceError("Failed to correct barcode match", { cause: error });
    }
  });
