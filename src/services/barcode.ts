import { createServerFn } from "@tanstack/react-start";
import { searchIssuesAndVolumes } from "@/integrations/comicvine/client";
import type { CvSearchIssue } from "@/integrations/comicvine/types";
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

export interface BarcodeLookupResult {
  upc: string;
  /** "matched": already scanned before, issueId is ready to navigate to.
   * "candidates": UPCitemdb had a product title, matched against ComicVine
   * search — user picks the right one (or none). "not_found": no product
   * data at all for this barcode (common for single issues). */
  status: "matched" | "candidates" | "not_found";
  issueId?: string;
  query?: string;
  candidates?: CvSearchIssue[];
  /** Only set on "candidates"/"not_found" — a cache hit never calls
   * UPCitemdb, so there's no fresh count to report. */
  rateLimitRemaining?: number | null;
}

/** Resolves a scanned barcode to a comic. Cache-first (see barcode_lookups
 * table) so a repeat scan — by this user or anyone else — never touches
 * UPCitemdb's tiny 100/day free-tier budget again once someone has
 * confirmed a match for that physical UPC. */
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

    const query = item.title;
    const results = await searchIssuesAndVolumes(query, 12);
    if (results.issues.length === 0) {
      return { upc, status: "not_found", query, rateLimitRemaining };
    }
    return { upc, status: "candidates", query, candidates: results.issues, rateLimitRemaining };
  });

/** Caches a confirmed UPC → issue match once the user picks (or the import
 * flow resolves) a candidate. Plain insert, not upsert: two people scanning
 * the same physical comic for the first time within moments of each other
 * can both reach this, so a duplicate-key race is expected and harmless —
 * whoever's row lands first wins, which is exactly the intended "shared,
 * write-once, no ownership" semantics. */
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
