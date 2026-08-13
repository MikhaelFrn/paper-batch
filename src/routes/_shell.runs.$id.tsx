import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, Link2, Waypoints, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComicCard } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateRunRelationship,
  useDeleteRunRelationship,
  useRun,
  useSearchRunsForLinking,
} from "@/hooks/useRuns";
import { useFavoriteRuns, useToggleFavoriteRun } from "@/hooks/useFavorites";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { issueToComic } from "@/lib/comic-adapters";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import type { RelationshipType } from "@/lib/types";

export const Route = createFileRoute("/_shell/runs/$id")({
  head: () => ({
    meta: [
      { title: "Run · Comic Vault" },
      { name: "description", content: "Reading run detail — issues and related runs." },
    ],
  }),
  component: RunDetail,
});

const RELATIONSHIP_TYPES: RelationshipType[] = [
  "continuation",
  "required_before",
  "recommended_before",
  "tie_in",
  "concurrent",
  "inspired_by",
  "alternate_take",
];

function LinkRunDialog({ runId }: { runId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const candidates = useSearchRunsForLinking(debouncedQuery, runId);
  const createRelationship = useCreateRunRelationship();
  const [chosenType, setChosenType] = useState<Record<string, RelationshipType>>({});

  const handleLink = (targetRunId: string, targetName: string) => {
    const relationship = chosenType[targetRunId];
    if (!relationship) return;
    createRelationship.mutate(
      { sourceRunId: runId, targetRunId, relationship },
      {
        onSuccess: () => {
          toast.success(t.runDetail.linkedTo(targetName));
          setQuery("");
        },
        onError: () => toast.error(t.runDetail.linkToFailed(targetName)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link2 className="h-4 w-4" />{t.runDetail.linkToAnotherRun}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.runDetail.linkToAnotherRun}</DialogTitle>
          <DialogDescription>
            {t.runDetail.linkDialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="run-link-search">{t.runDetail.searchRunsByName}</Label>
          <Input
            id="run-link-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.runDetail.searchRunsPlaceholder}
          />
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {debouncedQuery.trim().length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.runDetail.startTypingToFindRun}</p>
            ) : candidates.isLoading ? (
              <p className="text-sm text-muted-foreground">{t.runDetail.searching}</p>
            ) : (candidates.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.runDetail.noMatchingRuns}</p>
            ) : (
              (candidates.data ?? []).map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Select
                      value={chosenType[r.id]}
                      onValueChange={(value) =>
                        setChosenType((prev) => ({ ...prev, [r.id]: value as RelationshipType }))
                      }
                    >
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue placeholder={t.runDetail.relationshipPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t.runDetail.relationships[type].outgoing}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!chosenType[r.id] || createRelationship.isPending}
                      onClick={() => handleLink(r.id, r.name)}
                    >
                      {t.runDetail.link}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RunDetail() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const runQ = useRun(id);
  const deleteRelationship = useDeleteRunRelationship();
  const favoriteRuns = useFavoriteRuns();
  const toggleFavoriteRun = useToggleFavoriteRun();

  if (runQ.isLoading) {
    return <p className="text-sm text-muted-foreground">{t.runDetail.loadingRun}</p>;
  }
  const run = runQ.data;
  if (!run) {
    return <p className="text-sm text-muted-foreground">{t.runDetail.runNotFound}</p>;
  }

  const isFavorite = (favoriteRuns.data ?? []).some((r) => r.id === run.id);
  const handleToggleFavorite = () => {
    toggleFavoriteRun.mutate(
      { runId: run.id, isFavorite },
      { onError: () => toast.error(t.runDetail.updateFavoriteFailed) },
    );
  };

  const writers = run.run_creators
    .map((rc) => [rc.creator?.first_name, rc.creator?.last_name].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ");

  const relatedRuns = [
    ...run.outgoing_relationships.map((rel) => ({
      relId: rel.id,
      otherRun: rel.target_run,
      label: t.runDetail.relationships[rel.relationship].outgoing,
      sourceRunId: run.id,
      targetRunId: rel.target_run_id,
    })),
    ...run.incoming_relationships.map((rel) => ({
      relId: rel.id,
      otherRun: rel.source_run,
      label: t.runDetail.relationships[rel.relationship].incoming,
      sourceRunId: rel.source_run_id,
      targetRunId: run.id,
    })),
  ].filter((r) => r.otherRun);

  const handleUnlink = (relId: string, sourceRunId: string, targetRunId: string, name: string) => {
    deleteRelationship.mutate(
      { id: relId, sourceRunId, targetRunId },
      {
        onSuccess: () => toast.success(t.runDetail.removedLinkTo(name)),
        onError: () => toast.error(t.runDetail.removeLinkFailed(name)),
      },
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow={[run.start_year, run.end_year].filter(Boolean).join("–") || t.runDetail.run}
        title={run.name}
        description={`${t.common.issuesCount(run.run_items.length)} · ${t.volumeDetail.confidence(Math.round((run.confidence ?? 0) * 100))}${writers ? ` · ${writers}` : ""}`}
        actions={
          <>
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              onClick={handleToggleFavorite}
              disabled={toggleFavoriteRun.isPending}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
              {isFavorite ? t.runDetail.favorited : t.runDetail.favorite}
            </Button>
            <Badge variant={run.status === "verified" ? "default" : "outline"}>
              {run.status === "verified" ? t.common.runStatus.verified : t.common.runStatus.draft}
            </Badge>
          </>
        }
      />

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-xl tracking-wide">{t.runDetail.relatedRuns}</h2>
          <LinkRunDialog runId={run.id} />
        </div>
        {relatedRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.runDetail.noRelatedRuns}
          </p>
        ) : (
          <div className="space-y-2">
            {relatedRuns.map((r) => (
              <div
                key={r.relId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm"
              >
                <Link
                  to="/runs/$id"
                  params={{ id: r.otherRun!.id }}
                  className="flex min-w-0 items-center gap-2 hover:underline"
                >
                  <Waypoints className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="shrink-0 text-muted-foreground">{r.label}</span>
                  <span className="truncate font-medium">{r.otherRun!.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnlink(r.relId, r.sourceRunId, r.targetRunId, r.otherRun!.name)}
                  title={t.runDetail.removeLinkTo(r.otherRun!.name)}
                  aria-label={t.runDetail.removeLinkTo(r.otherRun!.name)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator className="mb-6" />

      <section>
        <h2 className="font-display mb-3 text-xl tracking-wide">{t.runDetail.issuesHeading}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {run.run_items
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((item) => item.issue && <ComicCard key={item.issue.id} comic={issueToComic(item.issue)} compact />)}
        </div>
      </section>
    </div>
  );
}
