import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComicCard } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVolume } from "@/hooks/useVolumes";
import { useIssuesByVolume } from "@/hooks/useIssues";
import { useRunsForVolume, useAnalyzeVolume } from "@/hooks/useRuns";
import { issueToComic } from "@/lib/comic-adapters";

export const Route = createFileRoute("/_shell/volumes/$id")({
  head: () => ({
    meta: [
      { title: "Volume · Comic Vault" },
      { name: "description", content: "Issue list and derived reading runs for a volume." },
    ],
  }),
  component: VolumeDetail,
});

/** ComicVine's resource-type prefix for volume detail URLs, confirmed
 * against the live API — see docs/comicvine-and-runs.md history. */
function volumeDetailUrlFromComicVineId(comicvineId: number): string {
  return `https://comicvine.gamespot.com/api/volume/4050-${comicvineId}/`;
}

function AnalyzeButton({
  detailUrl,
  hasExistingRuns,
}: {
  detailUrl: string;
  hasExistingRuns: boolean;
}) {
  const navigate = useNavigate();
  const analyze = useAnalyzeVolume();

  const handleAnalyze = () => {
    analyze.mutate(
      { volumeDetailUrl: detailUrl },
      {
        onSuccess: (result) => {
          if (result.alreadyAnalyzed) {
            toast.info("This volume was already analyzed.");
          } else {
            toast.success(
              `Found ${result.createdRuns} run${result.createdRuns === 1 ? "" : "s"} across ${result.totalIssues} issues.`,
            );
          }
          navigate({ to: "/volumes/$id", params: { id: result.volumeId } });
        },
        onError: () => toast.error("Couldn't analyze this volume — check the console for details."),
      },
    );
  };

  return (
    <Button onClick={handleAnalyze} disabled={analyze.isPending}>
      <Sparkles className="h-4 w-4" />
      {analyze.isPending
        ? "Analyzing… this can take a while for long-running volumes"
        : hasExistingRuns
          ? "Re-check for new runs"
          : "Analyze this volume"}
    </Button>
  );
}

function VolumeDetail() {
  const { id } = Route.useParams();
  const isCvOnly = id.startsWith("cv-");
  const cvId = isCvOnly ? Number(id.slice(3)) : null;

  const volume = useVolume(isCvOnly ? undefined : id);
  const issues = useIssuesByVolume(isCvOnly ? undefined : id);
  const runs = useRunsForVolume(isCvOnly ? undefined : id);

  if (isCvOnly) {
    if (cvId === null || Number.isNaN(cvId)) {
      return <div className="py-20 text-center text-sm text-muted-foreground">Invalid volume.</div>;
    }
    return (
      <div>
        <PageHeader
          eyebrow="Not yet in your catalog"
          title="Analyze this volume"
          description="Imports every issue and derives its run structure from ComicVine — this can take a little while for long-running titles."
        />
        <AnalyzeButton detailUrl={volumeDetailUrlFromComicVineId(cvId)} hasExistingRuns={false} />
      </div>
    );
  }

  if (volume.isLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!volume.data) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Volume not found.</div>;
  }

  const data = volume.data;
  const volumeIssues = issues.data ?? [];
  const derivedRuns = runs.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow={data.start_year ? String(data.start_year) : "Volume"}
        title={data.name}
        description={`${volumeIssues.length} issue${volumeIssues.length === 1 ? "" : "s"}`}
        actions={
          data.comicvine_id ? (
            <AnalyzeButton
              detailUrl={volumeDetailUrlFromComicVineId(data.comicvine_id)}
              hasExistingRuns={derivedRuns.length > 0}
            />
          ) : undefined
        }
      />

      {derivedRuns.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-3 text-xl tracking-wide">Runs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {derivedRuns.map((run) => (
              <Card key={run.id} className="border-border/60">
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <CardTitle className="font-display text-base tracking-wide">{run.name}</CardTitle>
                  <Badge variant={run.status === "verified" ? "default" : "outline"}>
                    {run.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 text-xs text-muted-foreground">
                    {run.run_items.length} issues · {Math.round((run.confidence ?? 0) * 100)}% confidence
                    {run.run_creators.length > 0 &&
                      ` · ${run.run_creators
                        .map((rc) => [rc.creator?.first_name, rc.creator?.last_name].filter(Boolean).join(" "))
                        .filter(Boolean)
                        .join(", ")}`}
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {run.run_items.slice(0, 12).map(
                      (item) =>
                        item.issue && <ComicCard key={item.issue.id} comic={issueToComic(item.issue)} compact />,
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display mb-3 text-xl tracking-wide">All issues</h2>
        {volumeIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No issues in your catalog for this volume yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {volumeIssues.map((issue) => (
              <ComicCard key={issue.id} comic={issueToComic(issue)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
