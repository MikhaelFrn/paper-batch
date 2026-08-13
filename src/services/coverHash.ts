import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServiceClient } from "@/integrations/supabase/service-client";
import { ISSUE_WITH_RELATIONS } from "./issues";
import type { IssueWithRelations } from "@/lib/types";
import { ServiceError } from "@/lib/types";
import { unwrap } from "./_utils";
import { requireAuthenticatedUser } from "./_serverUtils";

// jimp must be loaded dynamically, not statically imported — turns out
// createServerFn's client/server code-splitting doesn't fully protect a
// service file's *top-level imports* from being pulled into the client
// dependency graph even though the functions using them only ever run
// server-side (confirmed live: a static import here broke the browser with
// "does not provide an export named 'Jimp'", since Vite resolves jimp's
// separate "browser" build for the client bundle, which doesn't have the
// same named exports as the Node build). Same fix as @zxing/library and
// tesseract.js in the barcode/OCR hooks — dynamic import, called only from
// code that only ever runs on the server.
async function loadJimp() {
  return import("jimp");
}

/** Perceptual hash of an image via Jimp's built-in pHash plugin — robust to
 * resizing/recompression, not to rotation, cropping, or lighting changes.
 * That's the actual, honest scope of this feature: it's comparing hashes,
 * not real image recognition.
 *
 * `hash(2)` — base 2, i.e. the raw 64-bit string — not the default
 * `hash()` (base 64). `compareHashes` (below) computes similarity by
 * comparing hash strings *character by character*, which only equals a
 * real bit-level Hamming distance when each character *is* one bit.
 * Base-64-encoding the 64 bits first (Jimp's default) re-expresses them in
 * a different radix, and radix conversion doesn't preserve bit-position
 * locality — a handful of differing bits can cascade into most of the
 * encoded characters changing, the same way 999999→1000000 differs in
 * every digit despite being adjacent integers. Confirmed live: two
 * synthetic images with a true 61%-similar bit hash (25/64 bits differing,
 * a realistic amount for a real phone photo vs. a clean reference image)
 * scored 9% through the base-64 path — base 2 is what makes the reported
 * percentage mean what it claims to mean. */
export async function hashCoverImage(source: Buffer | ArrayBuffer): Promise<string> {
  const { Jimp } = await loadJimp();
  const image = await Jimp.read(source as never);
  return image.hash(2);
}

export interface CoverMatch {
  issue: IssueWithRelations;
  /** 0-100, derived from Jimp's normalized 0-1 Hamming distance. */
  similarity: number;
}

// Below this, a "match" is more likely coincidence than signal — still
// shown-with-score rather than silently hidden matches would be worse,
// since the user is the one who should judge whether a low-confidence hit
// is worth a look, not this threshold pretending to know for certain.
const MIN_SIMILARITY = 45;
const MAX_RESULTS = 8;

/** Matches an uploaded cover photo against every locally-catalogued issue
 * that has a stored hash (see backfillCoverHashes) — NOT all of ComicVine.
 * A comic that's never been imported here (via search, barcode, or volume
 * analysis) can't be matched, because there's no hash to compare against. */
export const findCoverMatches = createServerFn({ method: "POST" })
  .validator((input: FormData) => input)
  .handler(async ({ data }): Promise<CoverMatch[]> => {
    await requireAuthenticatedUser();
    const file = data.get("image");
    if (!(file instanceof File)) {
      throw new ServiceError("No image provided");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadedHash = await hashCoverImage(buffer);
    const { compareHashes } = await loadJimp();

    const client = getSupabaseServiceClient();
    const covers = unwrap(
      await client.from("covers").select("issue_id, image_hash"),
      "Failed to load stored cover hashes",
    );

    const scored = covers
      .filter((c): c is { issue_id: string; image_hash: string } => !!c.issue_id && !!c.image_hash)
      .map((c) => ({
        issueId: c.issue_id,
        similarity: Math.round((1 - compareHashes(uploadedHash, c.image_hash)) * 100),
      }))
      .filter((m) => m.similarity >= MIN_SIMILARITY)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, MAX_RESULTS);

    if (scored.length === 0) return [];

    const issues = unwrap(
      await client
        .from("issues")
        .select(ISSUE_WITH_RELATIONS)
        .in(
          "id",
          scored.map((s) => s.issueId),
        ),
      "Failed to load matched issues",
    ) as unknown as IssueWithRelations[];
    const issueById = new Map(issues.map((i) => [i.id, i]));

    return scored
      .map((s) => ({ issue: issueById.get(s.issueId), similarity: s.similarity }))
      .filter((m): m is CoverMatch => !!m.issue);
  });

export interface BackfillCoverHashesResult {
  processed: number;
  alreadyHashed: number;
  failed: number;
}

const BACKFILL_BATCH_SIZE = 5;

/** Catch-up for issues imported before cover hashing existed (default,
 * `force: false`) — skips issues that already have a hash. `force: true`
 * instead re-hashes *every* issue with a cover, wiping existing rows
 * first: there's no unique constraint on `covers.issue_id` to upsert
 * against, and a forced re-hash exists specifically for cases (like the
 * base64→binary hash-encoding fix) where every existing row is stale, not
 * just the missing ones. Hits ComicVine's image CDN, not their JSON API —
 * a different, far less constrained resource than what search/analyze/
 * barcode lookups use, so it's safe to run even while the API itself is
 * rate-limited. */
export const backfillCoverHashes = createServerFn({ method: "POST" })
  .validator((input?: { force?: boolean }) => input ?? {})
  .handler(async ({ data }): Promise<BackfillCoverHashesResult> => {
    await requireAuthenticatedUser();
    const client = getSupabaseServiceClient();
    const force = data.force ?? false;

    const issues = unwrap(
      await client.from("issues").select("id, cover_url").not("cover_url", "is", null),
      "Failed to load issues",
    );

    let alreadyHashedCount = 0;
    let toProcess: { id: string; cover_url: string }[];
    if (force) {
      const { error } = await client.from("covers").delete().gte("id", 0);
      if (error) throw new ServiceError("Failed to clear existing cover hashes", { cause: error });
      toProcess = issues.filter((i): i is { id: string; cover_url: string } => !!i.cover_url);
    } else {
      const existing = unwrap(
        await client.from("covers").select("issue_id"),
        "Failed to load existing covers",
      );
      const alreadyHashed = new Set(existing.map((c) => c.issue_id));
      alreadyHashedCount = alreadyHashed.size;
      toProcess = issues.filter(
        (i): i is { id: string; cover_url: string } => !!i.cover_url && !alreadyHashed.has(i.id),
      );
    }

    let processed = 0;
    let failed = 0;
    for (let i = 0; i < toProcess.length; i += BACKFILL_BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BACKFILL_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (issue) => {
          const response = await fetch(issue.cover_url);
          if (!response.ok) {
            throw new Error(`Cover fetch failed: ${response.status}`);
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          const hash = await hashCoverImage(buffer);
          const { error } = await client
            .from("covers")
            .insert({ issue_id: issue.id, image_hash: hash });
          if (error) throw error;
        }),
      );
      for (const result of results) {
        if (result.status === "fulfilled") processed++;
        else failed++;
      }
    }

    return { processed, alreadyHashed: alreadyHashedCount, failed };
  });
