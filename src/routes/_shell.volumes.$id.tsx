import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpen, CheckCheck, ListChecks, ListPlus, Sparkles, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComicCard } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVolume } from "@/hooks/useVolumes";
import { useIssuesByVolume } from "@/hooks/useIssues";
import { useRunsForVolume, useAnalyzeVolume } from "@/hooks/useRuns";
import { useBulkSetOwned, useBulkSetRead, useUserCollection } from "@/hooks/useUserComics";
import { useBulkAddIssuesToList, useMyLists } from "@/hooks/useLists";
import { issueToComic } from "@/lib/comic-adapters";
import { getKnownSafeErrorKind } from "@/lib/rate-limit-messages";
import { useTranslation } from "@/i18n";

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

/** ComicVine's own API is free but rate-limited (per key, not per user) —
 * this fetches full credits for whatever isn't already known locally (see
 * loadAlreadyKnownIssues), which for a long-running volume you're just
 * starting on is still dozens of calls fired in one go. Comic Vault is a
 * small fan project running on that free plan, shared across search, new
 * arrivals, and every other feature that hits ComicVine — running this
 * back-to-back on multiple volumes (or a huge range on one) can
 * temporarily rate-limit all of them for everyone using the app. */
function AnalyzeDisclaimer() {
  const { t } = useTranslation();
  return (
    <p className="-mt-3 mb-6 max-w-2xl text-xs text-muted-foreground">
      {t.volumeDetail.disclaimer}
    </p>
  );
}

/** `issueRange`, when given, scopes analysis to just that slice instead of
 * the whole volume — the point for a long-running title is that #1-100
 * today and #101-200 next week both work, and each pass only pays for
 * whatever wasn't already known going in (see analyzeVolume's
 * skippedKnownIssues). Both actions share one mutation (can't run two
 * analyses at once anyway); `analyze.variables` tells which one is
 * actually in flight so only the button that was clicked shows as busy. */
function AnalyzeButton({
  detailUrl,
  hasExistingRuns,
}: {
  detailUrl: string;
  hasExistingRuns: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const analyze = useAnalyzeVolume();
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const isPendingRange = analyze.isPending && !!analyze.variables?.issueRange;
  const isPendingWhole = analyze.isPending && !analyze.variables?.issueRange;

  const runAnalyze = (issueRange?: { from: number; to: number }) => {
    analyze.mutate(
      { volumeDetailUrl: detailUrl, issueRange },
      {
        onSuccess: (result) => {
          if (result.alreadyAnalyzed) {
            toast.info(t.volumeDetail.alreadyAnalyzed);
          } else if (result.totalIssues === 0) {
            toast.info(t.volumeDetail.noIssuesInRange);
          } else {
            toast.success(
              t.volumeDetail.foundRuns(result.createdRuns, result.totalIssues, result.skippedKnownIssues),
            );
          }
          navigate({ to: "/volumes/$id", params: { id: result.volumeId } });
        },
        onError: (error) => {
          console.error("Volume analysis failed:", error);
          // Analysis is the single most likely thing in the app to
          // actually trip ComicVine's rate limit — it fires one call per
          // issue that isn't already known locally. Worth naming that
          // specifically instead of "check the console," which most
          // people never do.
          const kind = getKnownSafeErrorKind(error);
          toast.error(kind ? t.errors[kind] : t.volumeDetail.analyzeFailed);
        },
      },
    );
  };

  const handleAnalyzeRange = () => {
    const from = Number(rangeFrom);
    const to = Number(rangeTo);
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      toast.error(t.volumeDetail.enterValidRange);
      return;
    }
    runAnalyze({ from, to });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => runAnalyze()} disabled={analyze.isPending}>
          <Sparkles className="h-4 w-4" />
          {isPendingWhole ? t.volumeDetail.analyzing : hasExistingRuns ? t.volumeDetail.recheckForNewRuns : t.volumeDetail.analyzeThisVolumeButton}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setRangeMode((v) => !v)} disabled={analyze.isPending}>
          {rangeMode ? t.volumeDetail.cancelRange : t.volumeDetail.analyzeARangeInstead}
        </Button>
      </div>
      {analyze.isPending && (
        <p className="text-xs text-muted-foreground">
          {t.volumeDetail.analyzePending}
        </p>
      )}
      {rangeMode && (
        <div className="flex items-center gap-1">
          <Input
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
            placeholder="#1"
            aria-label={t.volumeDetail.fromIssueNumber}
            className="h-8 w-16"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
            placeholder="#100"
            aria-label={t.volumeDetail.toIssueNumber}
            className="h-8 w-16"
          />
          <Button size="sm" variant="outline" onClick={handleAnalyzeRange} disabled={analyze.isPending}>
            {isPendingRange ? t.volumeDetail.analyzing : t.volumeDetail.analyzeRange}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Same "add to list" dropdown as the comic detail page's AddToListMenu,
 * just bulk — lets a selection go straight to e.g. a wishlist without
 * also being marked owned or read (the actual point: #2-9 of something
 * you're missing shouldn't get flagged as owned just because you selected
 * them). Viewer-role lists are excluded, same reasoning as the single-issue
 * version — collaborators there can see but not add. */
function BulkAddToListMenu({
  issueIds,
  onAdded,
}: {
  issueIds: string[];
  onAdded: () => void;
}) {
  const { t } = useTranslation();
  const lists = useMyLists();
  const bulkAddToList = useBulkAddIssuesToList();
  const addableLists = (lists.data ?? []).filter((l) => l.myRole !== "viewer");

  const handleAdd = (listId: string, listName: string) => {
    bulkAddToList.mutate(
      { listId, issueIds },
      {
        onSuccess: () => {
          toast.success(t.volumeDetail.addedIssuesToList(issueIds.length, listName));
          onAdded();
        },
        onError: () => toast.error(t.volumeDetail.addToListFailed(listName)),
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={issueIds.length === 0 || bulkAddToList.isPending}>
          <ListPlus className="h-4 w-4" />{t.volumeDetail.addToList}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {addableLists.length === 0 ? (
          <DropdownMenuItem disabled>{t.volumeDetail.noListsYet}</DropdownMenuItem>
        ) : (
          addableLists.map((l) => (
            <DropdownMenuItem key={l.id} onClick={() => handleAdd(l.id, l.name)}>
              {l.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Controlled selection toolbar — "select a range" reads off issues.sort_number
 * (a numeric column populated on import) rather than the display issue
 * string, since issue numbers like "1AU" or "0.1" don't parse as a clean
 * range boundary but do sort correctly via that column. Owned/read/list
 * are independent actions, not a single "add these to my collection" combo
 * — e.g. filling a gap in a run belongs on a wishlist, not owned or read. */
function BulkActionsToolbar({
  selectedCount,
  selectedIds,
  onSelectAll,
  onSelectRange,
  onClear,
  onMarkOwned,
  onMarkRead,
  onListAdded,
  isMarkingOwned,
  isMarkingRead,
}: {
  selectedCount: number;
  selectedIds: string[];
  onSelectAll: () => void;
  onSelectRange: (from: string, to: string) => void;
  onClear: () => void;
  onMarkOwned: () => void;
  onMarkRead: () => void;
  onListAdded: () => void;
  isMarkingOwned: boolean;
  isMarkingRead: boolean;
}) {
  const { t } = useTranslation();
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
      <span className="font-medium">{t.common.selectedCount(selectedCount)}</span>
      <Button variant="outline" size="sm" onClick={onSelectAll}>{t.volumeDetail.selectAll}</Button>
      <div className="flex items-center gap-1">
        <Input
          value={rangeFrom}
          onChange={(e) => setRangeFrom(e.target.value)}
          placeholder="#1"
          aria-label={t.volumeDetail.fromIssueNumber}
          className="h-8 w-16"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          value={rangeTo}
          onChange={(e) => setRangeTo(e.target.value)}
          placeholder="#45"
          aria-label={t.volumeDetail.toIssueNumber}
          className="h-8 w-16"
        />
        <Button variant="outline" size="sm" onClick={() => onSelectRange(rangeFrom, rangeTo)}>{t.volumeDetail.selectRange}</Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={selectedCount === 0}>{t.volumeDetail.clear}</Button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <BulkAddToListMenu issueIds={selectedIds} onAdded={onListAdded} />
        <Button variant="outline" size="sm" onClick={onMarkRead} disabled={selectedCount === 0 || isMarkingRead}>
          <BookOpen className="h-4 w-4" />
          {isMarkingRead ? t.volumeDetail.marking : t.volumeDetail.markAsRead(selectedCount)}
        </Button>
        <Button size="sm" onClick={onMarkOwned} disabled={selectedCount === 0 || isMarkingOwned}>
          <CheckCheck className="h-4 w-4" />
          {isMarkingOwned ? t.volumeDetail.marking : t.volumeDetail.markAsOwned(selectedCount)}
        </Button>
      </div>
    </div>
  );
}

function VolumeDetail() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const isCvOnly = id.startsWith("cv-");
  const cvId = isCvOnly ? Number(id.slice(3)) : null;

  const volume = useVolume(isCvOnly ? undefined : id);
  const issues = useIssuesByVolume(isCvOnly ? undefined : id);
  const runs = useRunsForVolume(isCvOnly ? undefined : id);
  const collection = useUserCollection();
  const bulkSetOwned = useBulkSetOwned();
  const bulkSetRead = useBulkSetRead();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const ownedIds = useMemo(
    () => new Set((collection.data ?? []).filter((e) => e.owned).map((e) => e.issue_id)),
    [collection.data],
  );

  if (isCvOnly) {
    if (cvId === null || Number.isNaN(cvId)) {
      return <div className="py-20 text-center text-sm text-muted-foreground">{t.volumeDetail.invalidVolume}</div>;
    }
    return (
      <div>
        <PageHeader
          eyebrow={t.volumeDetail.notYetInCatalog}
          title={t.volumeDetail.analyzeThisVolume}
          description={t.volumeDetail.analyzeDescription}
        />
        <AnalyzeDisclaimer />
        <AnalyzeButton detailUrl={volumeDetailUrlFromComicVineId(cvId)} hasExistingRuns={false} />
      </div>
    );
  }

  if (volume.isLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">{t.volumeDetail.loading}</div>;
  }
  if (!volume.data) {
    return <div className="py-20 text-center text-sm text-muted-foreground">{t.volumeDetail.volumeNotFound}</div>;
  }

  const data = volume.data;
  const volumeIssues = issues.data ?? [];
  const derivedRuns = runs.data ?? [];

  const toggleSelected = (issueId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) next.delete(issueId);
      else next.add(issueId);
      return next;
    });
  };

  const handleSelectAll = () => setSelected(new Set(volumeIssues.map((i) => i.id)));

  const handleSelectRange = (from: string, to: string) => {
    const fromNum = Number(from);
    const toNum = Number(to);
    if (!Number.isFinite(fromNum) || !Number.isFinite(toNum)) {
      toast.error(t.volumeDetail.enterValidRange);
      return;
    }
    const [lo, hi] = fromNum <= toNum ? [fromNum, toNum] : [toNum, fromNum];
    const matched = volumeIssues.filter(
      (i) => i.sort_number != null && i.sort_number >= lo && i.sort_number <= hi,
    );
    if (matched.length === 0) {
      toast.info(t.volumeDetail.noIssuesInRange);
      return;
    }
    setSelected((prev) => new Set([...prev, ...matched.map((i) => i.id)]));
  };

  const handleMarkOwned = () => {
    const issueIds = [...selected];
    bulkSetOwned.mutate(
      { issueIds, owned: true },
      {
        onSuccess: () => {
          toast.success(t.volumeDetail.markedAsOwned(issueIds.length));
          setSelected(new Set());
          setSelectionMode(false);
        },
        onError: () => toast.error(t.volumeDetail.updateOwnedFailed),
      },
    );
  };

  const handleMarkRead = () => {
    const issueIds = [...selected];
    bulkSetRead.mutate(
      { issueIds, read: true },
      {
        onSuccess: () => {
          toast.success(t.volumeDetail.markedAsRead(issueIds.length));
          setSelected(new Set());
          setSelectionMode(false);
        },
        onError: () => toast.error(t.volumeDetail.updateReadFailed),
      },
    );
  };

  const handleListAdded = () => {
    setSelected(new Set());
    setSelectionMode(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow={data.start_year ? String(data.start_year) : t.volumeDetail.notYetInCatalog}
        title={data.name}
        description={t.common.issuesCount(volumeIssues.length)}
        actions={
          data.comicvine_id ? (
            <AnalyzeButton
              detailUrl={volumeDetailUrlFromComicVineId(data.comicvine_id)}
              hasExistingRuns={derivedRuns.length > 0}
            />
          ) : undefined
        }
      />
      {data.comicvine_id && <AnalyzeDisclaimer />}

      {derivedRuns.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-3 text-xl tracking-wide">{t.volumeDetail.runsHeading}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {derivedRuns.map((run) => (
              <Card key={run.id} className="border-border/60">
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <Link to="/runs/$id" params={{ id: run.id }} className="min-w-0">
                    <CardTitle className="font-display truncate text-base tracking-wide hover:underline">
                      {run.name}
                    </CardTitle>
                  </Link>
                  <Badge variant={run.status === "verified" ? "default" : "outline"}>
                    {run.status === "verified" ? t.common.runStatus.verified : t.common.runStatus.draft}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 text-xs text-muted-foreground">
                    {t.common.issuesCount(run.run_items.length)} · {t.volumeDetail.confidence(Math.round((run.confidence ?? 0) * 100))}
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl tracking-wide">{t.volumeDetail.allIssues}</h2>
          {volumeIssues.length > 0 && (
            <Button
              variant={selectionMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setSelectionMode((v) => !v);
                setSelected(new Set());
              }}
            >
              {selectionMode ? <X className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
              {selectionMode ? t.volumeDetail.cancelSelection : t.volumeDetail.selectIssues}
            </Button>
          )}
        </div>

        {selectionMode && (
          <BulkActionsToolbar
            selectedCount={selected.size}
            selectedIds={[...selected]}
            onSelectAll={handleSelectAll}
            onSelectRange={handleSelectRange}
            onClear={() => setSelected(new Set())}
            onMarkOwned={handleMarkOwned}
            onMarkRead={handleMarkRead}
            onListAdded={handleListAdded}
            isMarkingOwned={bulkSetOwned.isPending}
            isMarkingRead={bulkSetRead.isPending}
          />
        )}

        {volumeIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.volumeDetail.noIssuesYet}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {volumeIssues.map((issue) => (
              <div key={issue.id} className="relative">
                <ComicCard comic={issueToComic(issue, { owned: ownedIds.has(issue.id) })} />
                {selectionMode && (
                  <div className="absolute left-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-md bg-black/70">
                    <Checkbox
                      checked={selected.has(issue.id)}
                      onCheckedChange={() => toggleSelected(issue.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
