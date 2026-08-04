// Server-only UPCitemdb client. The free "trial" tier needs no API key —
// verified live: no auth headers, CORS locked to upcitemdb.com's own origin
// (so browser calls are impossible anyway), 100 lookups/day shared across
// this entire app (rate-limited by IP, not per end user), 6/minute burst.
// That budget is tiny, which is why every caller must check the
// barcode_lookups cache table before ever reaching this — see services/barcode.ts.
import { ServiceError } from "@/lib/types";

const TRIAL_LOOKUP_URL = "https://api.upcitemdb.com/prod/trial/lookup";

export interface UpcItem {
  upc: string;
  ean: string;
  title: string;
  brand: string;
  category: string;
  images: string[];
}

interface UpcLookupResponse {
  code: string;
  total: number;
  items: UpcItem[];
}

export interface UpcLookupOutcome {
  item: UpcItem | null;
  /** From the X-RateLimit-Remaining response header — null if the header
   * was somehow missing rather than 0, so callers can tell "unknown" apart
   * from "exhausted". */
  rateLimitRemaining: number | null;
}

/** Looks up a UPC/EAN against UPCitemdb's retail product database. `item`
 * is null for "not found" (a very common outcome for single issues — comics
 * are a long-tail category most UPC databases cover poorly; collected
 * editions/TPBs with real bookstore ISBNs do much better). */
export async function lookupUpc(upc: string): Promise<UpcLookupOutcome> {
  const url = new URL(TRIAL_LOOKUP_URL);
  url.searchParams.set("upc", upc);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  const remainingHeader = response.headers.get("X-RateLimit-Remaining");
  const rateLimitRemaining = remainingHeader !== null ? Number(remainingHeader) : null;

  if (response.status === 429) {
    throw new ServiceError(
      "Barcode lookup limit reached for today — try again tomorrow, or add this comic by searching for it.",
      { code: "RATE_LIMITED" },
    );
  }
  if (!response.ok) {
    throw new ServiceError(`UPCitemdb request failed: ${response.status}`);
  }

  const payload = (await response.json()) as UpcLookupResponse;
  const item = payload.code === "OK" && payload.items.length > 0 ? payload.items[0] : null;
  return { item, rateLimitRemaining };
}
