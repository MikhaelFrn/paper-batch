import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ImageUp, RotateCcw, ScanBarcode, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ComicCard } from "@/components/comic-card";
import { decodeBarcodeFromImage, useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useLookupBarcode, useRecordBarcodeMatch } from "@/hooks/useBarcode";
import { cvIssueToComic } from "@/lib/comic-adapters";
import { cn } from "@/lib/utils";
import type { BarcodeLookupResult } from "@/services/barcode";

const RATE_LIMIT_WARNING_THRESHOLD = 10;

function RateLimitWarning({ remaining }: { remaining: number | null | undefined }) {
  if (remaining == null || remaining >= RATE_LIMIT_WARNING_THRESHOLD) return null;
  return (
    <p className="mb-3 text-center text-xs font-medium text-destructive">
      Daily scans almost depleted — {remaining} lookup{remaining === 1 ? "" : "s"} left today.
    </p>
  );
}

export const Route = createFileRoute("/_shell/scan")({
  head: () => ({
    meta: [
      { title: "Scan barcode · Comic Vault" },
      { name: "description", content: "Scan a comic's barcode to add it to your vault." },
    ],
  }),
  component: ScanPage,
});

type Phase =
  | { kind: "scanning" }
  | { kind: "decoding-image" }
  | { kind: "looking-up"; upc: string }
  | { kind: "result"; result: BarcodeLookupResult }
  | { kind: "error"; message: string };

/** Drag-and-drop (or click-to-browse) alternative to the live camera — for
 * webcams too low-res or unfocused to pick up a barcode live. Decodes a
 * single still photo instead of a video stream. */
function ImageDropZone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm outline-none transition-colors",
        isDragOver ? "border-primary bg-primary/5" : "border-border/60 text-muted-foreground hover:border-primary/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <ImageUp className="h-6 w-6" />
      <div>
        <span className="font-medium text-foreground">Drop a photo</span> of the barcode here, or click to browse
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ScanPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>({ kind: "scanning" });
  const lookup = useLookupBarcode();
  const recordMatch = useRecordBarcodeMatch();

  const handleDetect = (upc: string) => {
    setPhase({ kind: "looking-up", upc });
    lookup.mutate(upc, {
      onSuccess: (result) => {
        if (result.status === "matched" && result.issueId) {
          navigate({ to: "/comic/$id", params: { id: result.issueId } });
          return;
        }
        setPhase({ kind: "result", result });
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
          <ImageDropZone onFile={handleImageFile} />
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

      {phase.kind === "result" && phase.result.status === "not_found" && (
        <div className="mx-auto max-w-md py-16 text-center">
          <RateLimitWarning remaining={phase.result.rateLimitRemaining} />
          <div className="font-medium">No product data for this barcode.</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {phase.result.query
              ? `Found "${phase.result.query}" but couldn't match it to anything on ComicVine.`
              : "This UPC isn't in the barcode database — common for single issues."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={reset}><RotateCcw className="h-4 w-4" />Scan again</Button>
            <Button variant="outline" asChild><Link to="/search"><Search className="h-4 w-4" />Search manually</Link></Button>
          </div>
        </div>
      )}

      {phase.kind === "result" && phase.result.status === "candidates" && (
        <div>
          <RateLimitWarning remaining={phase.result.rateLimitRemaining} />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Matched from "{phase.result.query}" — pick the right issue, or scan again if none of these are it.
            </p>
            <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-4 w-4" />Scan again</Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {(phase.result.candidates ?? []).map((cv) => (
              <ComicCard
                key={cv.id}
                comic={cvIssueToComic(cv)}
                onImported={(issueId) => handleImported(phase.result.upc, issueId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
