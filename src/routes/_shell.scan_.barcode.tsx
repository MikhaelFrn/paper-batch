import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw, ScanBarcode, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComicCard } from "@/components/comic-card";
import { ImageDropZone } from "@/components/image-drop-zone";
import { decodeBarcodeFromImage, useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useCorrectBarcodeMatch, useLookupBarcode, useRecordBarcodeMatch } from "@/hooks/useBarcode";
import { useComicVineSearch } from "@/hooks/useComicVine";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useIssue } from "@/hooks/useIssues";
import { cvIssueToComic, issueToComic } from "@/lib/comic-adapters";

const RATE_LIMIT_WARNING_THRESHOLD = 10;

function RateLimitWarning({ remaining }: { remaining: number | null | undefined }) {
  if (remaining == null || remaining >= RATE_LIMIT_WARNING_THRESHOLD) return null;
  return (
    <p className="mb-3 text-center text-xs font-medium text-destructive">
      Daily scans almost depleted — {remaining} lookup{remaining === 1 ? "" : "s"} left today.
    </p>
  );
}

/** The actual "editable title before search" step. A raw UPCitemdb product
 * title only ever gets lightly, structurally cleaned (see
 * cleanRetailTitle) — never guessed into a single auto-picked result — so
 * the query is always shown and editable before it reaches ComicVine, and
 * the user picks from real results instead of trusting an invisible guess.
 * Search runs live (debounced) as the query changes, same pattern as the
 * main /search page's ComicVine section. Also reused (with an empty
 * starting query) for correcting a wrong cached match — see
 * CachedMatchStep. */
function BarcodeQueryStep({
  description,
  suggestedQuery,
  rateLimitRemaining,
  onImported,
  onRescan,
}: {
  description: string;
  suggestedQuery: string;
  rateLimitRemaining?: number | null;
  onImported: (issueId: string) => void;
  onRescan: () => void;
}) {
  const [query, setQuery] = useState(suggestedQuery);
  const debouncedQuery = useDebouncedValue(query, 400);
  const cvSearch = useComicVineSearch(debouncedQuery);
  const issues = cvSearch.data?.issues ?? [];

  return (
    <div>
      <RateLimitWarning remaining={rateLimitRemaining} />
      <div className="mx-auto mb-4 max-w-md">
        <p className="mb-2 text-sm text-muted-foreground">{description}</p>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ComicVine…"
        />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {query.trim() === ""
            ? "Type a title to search."
            : cvSearch.isLoading
              ? "Searching…"
              : issues.length === 0
                ? "No matches — try adjusting the search above."
                : `${issues.length} result${issues.length === 1 ? "" : "s"}`}
        </p>
        <Button variant="outline" size="sm" onClick={onRescan}><RotateCcw className="h-4 w-4" />Scan again</Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {issues.map((cv) => (
          <ComicCard key={cv.id} comic={cvIssueToComic(cv)} onImported={onImported} />
        ))}
      </div>
    </div>
  );
}

/** A cache hit means this exact barcode was already resolved before — but
 * "resolved before" isn't the same as "resolved correctly." Instant
 * navigation with no way to catch a bad cached match was the actual bug
 * report this fixes: once a wrong UPC → issue pairing landed in
 * barcode_lookups, every future scan of that barcode (by anyone) kept
 * landing on the wrong comic with no recourse. This shows what it matched
 * before committing to the navigation, and "Not this one?" leads to a
 * correction search that overwrites the bad cache entry instead of just
 * ignoring the problem. */
function CachedMatchStep({
  upc,
  issueId,
  onNotThisOne,
}: {
  upc: string;
  issueId: string;
  onNotThisOne: () => void;
}) {
  const navigate = useNavigate();
  const issueQ = useIssue(issueId);

  if (issueQ.isLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading matched comic…</div>;
  }

  if (!issueQ.data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="font-medium">Couldn't load the comic this barcode was matched to.</div>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={onNotThisOne}><Search className="h-4 w-4" />Search instead</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xs text-center">
      <p className="mb-4 text-sm text-muted-foreground">
        Barcode {upc} was scanned before — matched to:
      </p>
      <ComicCard comic={issueToComic(issueQ.data)} />
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={() => navigate({ to: "/comic/$id", params: { id: issueId } })}>Go to it</Button>
        <Button variant="outline" onClick={onNotThisOne}>Not this one?</Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_shell/scan_/barcode")({
  head: () => ({
    meta: [
      { title: "Scan barcode · Comic Vault" },
      { name: "description", content: "Scan a comic's barcode to add it to your vault." },
    ],
  }),
  component: ScanBarcodePage,
});

type Phase =
  | { kind: "scanning" }
  | { kind: "decoding-image" }
  | { kind: "looking-up"; upc: string }
  | { kind: "confirm-cached"; upc: string; issueId: string }
  | {
      kind: "needs-query";
      upc: string;
      suggestedQuery: string;
      rateLimitRemaining: number | null | undefined;
    }
  | { kind: "correcting"; upc: string }
  | { kind: "not-found"; rateLimitRemaining: number | null | undefined }
  | { kind: "error"; message: string };

function ScanBarcodePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>({ kind: "scanning" });
  const lookup = useLookupBarcode();
  const recordMatch = useRecordBarcodeMatch();
  const correctMatch = useCorrectBarcodeMatch();

  const handleDetect = (upc: string) => {
    setPhase({ kind: "looking-up", upc });
    lookup.mutate(upc, {
      onSuccess: (result) => {
        if (result.status === "matched" && result.issueId) {
          // Not an instant navigate — see CachedMatchStep for why: a cache
          // hit means "this barcode was resolved before," not "resolved
          // correctly," and a wrong cached match used to be a dead end.
          setPhase({ kind: "confirm-cached", upc: result.upc, issueId: result.issueId });
          return;
        }
        if (result.status === "needs_query" && result.suggestedQuery) {
          setPhase({
            kind: "needs-query",
            upc: result.upc,
            suggestedQuery: result.suggestedQuery,
            rateLimitRemaining: result.rateLimitRemaining,
          });
          return;
        }
        setPhase({ kind: "not-found", rateLimitRemaining: result.rateLimitRemaining });
      },
      onError: (error) => {
        // The underlying error (e.g. a raw Postgres/PostgREST message) is
        // developer detail, not something to put in front of a friend using
        // the app — log it for debugging, show a generic message instead.
        console.error("Barcode lookup failed:", error);
        setPhase({
          kind: "error",
          message: "Couldn't look up that barcode. Try again in a moment.",
        });
      },
    });
  };

  const scanner = useBarcodeScanner(phase.kind === "scanning", handleDetect);

  const reset = () => setPhase({ kind: "scanning" });

  const handleImageFile = async (file: File) => {
    setPhase({ kind: "decoding-image" });
    const code = await decodeBarcodeFromImage(file);
    if (!code) {
      setPhase({
        kind: "error",
        message: "Couldn't find a barcode in that photo — try a closer, sharper shot of just the barcode.",
      });
      return;
    }
    handleDetect(code);
  };

  // First-time confirm, from the editable-query step — write-once, never
  // overwrites (see recordBarcodeMatch).
  const handleImported = (upc: string, issueId: string) => {
    recordMatch.mutate(
      { upc, issueId },
      {
        // Best-effort cache write — the import itself already succeeded and
        // navigation already happened, so a failure here just means the next
        // scan of this UPC won't be instant. Not worth bothering the user.
        onError: (error) => console.error("Failed to cache barcode match:", error),
      },
    );
  };

  // "This cached match was wrong" — the explicit overwrite path, only
  // reachable from CachedMatchStep's "Not this one?" (see
  // correctBarcodeMatch for why this is a separate function from the
  // write-once handleImported above).
  const handleCorrected = (upc: string, issueId: string) => {
    correctMatch.mutate(
      { upc, issueId },
      { onError: (error) => console.error("Failed to correct barcode match:", error) },
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Add by barcode"
        title="Scan a comic"
        description="Point your camera at the barcode on the back cover. Works best on collected editions and TPBs — single issues are hit-or-miss in barcode databases."
      />

      {phase.kind === "scanning" && (
        <div className="mx-auto max-w-md">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border/60 bg-black">
            <video
              ref={scanner.videoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-lg border-2 border-primary/80" />
            {scanner.status === "starting" && (
              <div className="absolute inset-0 grid place-items-center bg-black/60 text-sm text-white">
                Starting camera…
              </div>
            )}
            {scanner.status === "error" && (
              <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center text-sm text-white">
                {scanner.error ?? "Couldn't access the camera."}
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <ScanBarcode className="mr-1 inline h-3.5 w-3.5" />
            Hold the barcode steady inside the frame.
          </p>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border/60" />
            or, if your camera's struggling
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <ImageDropZone onFile={handleImageFile} label="of the barcode here, or click to browse" />
        </div>
      )}

      {phase.kind === "decoding-image" && (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Reading barcode from image…
        </div>
      )}

      {phase.kind === "looking-up" && (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Looking up barcode {phase.upc}…
        </div>
      )}

      {phase.kind === "error" && (
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="text-sm text-destructive">{phase.message}</div>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={reset}><RotateCcw className="h-4 w-4" />Try again</Button>
            <Button variant="outline" asChild><Link to="/search"><Search className="h-4 w-4" />Search manually</Link></Button>
          </div>
        </div>
      )}

      {phase.kind === "not-found" && (
        <div className="mx-auto max-w-md py-16 text-center">
          <RateLimitWarning remaining={phase.rateLimitRemaining} />
          <div className="font-medium">No product data for this barcode.</div>
          <p className="mt-1 text-sm text-muted-foreground">
            This UPC isn't in the barcode database — common for single issues.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={reset}><RotateCcw className="h-4 w-4" />Scan again</Button>
            <Button variant="outline" asChild><Link to="/search"><Search className="h-4 w-4" />Search manually</Link></Button>
          </div>
        </div>
      )}

      {phase.kind === "confirm-cached" && (
        <CachedMatchStep
          upc={phase.upc}
          issueId={phase.issueId}
          onNotThisOne={() => setPhase({ kind: "correcting", upc: phase.upc })}
        />
      )}

      {phase.kind === "needs-query" && (
        <BarcodeQueryStep
          description={`Matched a product listing for barcode ${phase.upc} — the search below is a cleaned-up guess at the title, not a chosen result. Edit it if it doesn't look right, then pick the correct issue.`}
          suggestedQuery={phase.suggestedQuery}
          rateLimitRemaining={phase.rateLimitRemaining}
          onImported={(issueId) => handleImported(phase.upc, issueId)}
          onRescan={reset}
        />
      )}

      {phase.kind === "correcting" && (
        <BarcodeQueryStep
          description={`Fixing barcode ${phase.upc}'s match — search for the right issue and pick it below.`}
          suggestedQuery=""
          onImported={(issueId) => handleCorrected(phase.upc, issueId)}
          onRescan={reset}
        />
      )}
    </div>
  );
}
