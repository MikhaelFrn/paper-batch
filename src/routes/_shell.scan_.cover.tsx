import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComicCard } from "@/components/comic-card";
import { ImageDropZone } from "@/components/image-drop-zone";
import { useFindCoverMatches } from "@/hooks/useCoverHash";
import { issueToComic } from "@/lib/comic-adapters";
import { useTranslation } from "@/i18n";
import type { CoverMatch } from "@/services/coverHash";

export const Route = createFileRoute("/_shell/scan_/cover")({
  head: () => ({
    meta: [
      { title: "Scan cover image · Comic Vault" },
      { name: "description", content: "Match a comic by comparing its cover image against your catalog." },
    ],
  }),
  component: ScanCoverPage,
});

type Phase =
  | { kind: "idle" }
  | { kind: "matching" }
  | { kind: "result"; matches: CoverMatch[] }
  | { kind: "error"; message: string };

function ScanCoverPage() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const findMatches = useFindCoverMatches();

  const handleFile = (file: File) => {
    setPhase({ kind: "matching" });
    findMatches.mutate(file, {
      onSuccess: (matches) => setPhase({ kind: "result", matches }),
      onError: (error) => {
        console.error("Cover match failed:", error);
        setPhase({ kind: "error", message: t.scan.couldntReadImage });
      },
    });
  };

  const reset = () => setPhase({ kind: "idle" });

  return (
    <div>
      <PageHeader eyebrow={t.scan.addByCoverImage} title={t.scan.scanCoverImage} />

      <div className="mx-auto mb-6 max-w-md rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        {t.scan.coverDisclaimer}
      </div>

      {phase.kind === "idle" && (
        <div className="mx-auto max-w-md">
          <ImageDropZone onFile={handleFile} label={t.scan.dropCoverLabel} />
        </div>
      )}

      {phase.kind === "matching" && (
        <div className="py-20 text-center text-sm text-muted-foreground">{t.scan.comparingCatalog}</div>
      )}

      {phase.kind === "error" && (
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="text-sm text-destructive">{phase.message}</div>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={reset}><RotateCcw className="h-4 w-4" />{t.scan.tryAgain}</Button>
            <Button variant="outline" asChild><Link to="/search"><Search className="h-4 w-4" />{t.scan.searchManually}</Link></Button>
          </div>
        </div>
      )}

      {phase.kind === "result" && phase.matches.length === 0 && (
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="font-medium">{t.scan.noCloseMatches}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.scan.noCloseMatchesDescription}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={reset}><RotateCcw className="h-4 w-4" />{t.scan.tryAgain}</Button>
            <Button variant="outline" asChild><Link to="/search"><Search className="h-4 w-4" />{t.scan.searchManually}</Link></Button>
          </div>
        </div>
      )}

      {phase.kind === "result" && phase.matches.length > 0 && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {t.scan.closestMatches}
            </p>
            <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-4 w-4" />{t.scan.tryAgain}</Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {phase.matches.map((match) => (
              <div key={match.issue.id} className="relative">
                <ComicCard comic={issueToComic(match.issue)} />
                <Badge
                  variant="secondary"
                  className="absolute right-1.5 top-1.5 z-10 text-[10px]"
                >
                  {match.similarity}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
