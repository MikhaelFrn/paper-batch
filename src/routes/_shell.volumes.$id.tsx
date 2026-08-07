import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
 * this fetches full credits for every issue at once (see
 * getIssueDetailsBatch), which for a long-running volume is dozens of calls
 * fired in one go. Comic Vault is a small fan project running on that free
 * plan, shared across search, new arrivals, and every other feature that
 * hits ComicVine — running this back-to-back on multiple volumes can
 * temporarily rate-limit all of them for everyone using the app. */
function AnalyzeDisclaimer() {
  return (
    <p className="-mt-3 mb-6 max-w-2xl text-xs text-muted-foreground">
      This is a small fan project on ComicVine's free plan — analyzing a volume pulls credits for
      every issue in it at once, which can be dozens of calls. Please don't run it back-to-back on
      several volumes; doing so can temporarily break search and new arrivals for everyone using the
      app, not just you.
    </p>
  );
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
        onError: (error) => {
          console.error("Volume analysis failed:", error);
          toast.error("Couldn't analyze this volume — check the console for details.");
        },
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
  const lists = useMyLists();
  const bulkAddToList = useBulkAddIssuesToList();
  const addableLists = (lists.data ?? []).filter((l) => l.myRole !== "viewer");

  const handleAdd = (listId: string, listName: string) => {
    bulkAddToList.mutate(
      { listId, issueIds },
      {
        onSuccess: () => {
          toast.success(`Added ${issueIds.length} issue${issueIds.length === 1 ? "" : "s"} to ${listName}`);
          onAdded();
        },
        onError: () => toast.error(`Couldn't add to ${listName}`),
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={issueIds.length === 0 || bulkAddToList.isPending}>
          <ListPlus className="h-4 w-4" />Add to list
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {addableLists.length === 0 ? (
          <DropdownMenuItem disabled>No lists yet</DropdownMenuItem>
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
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
      <span className="font-medium">{selectedCount} selected</span>
      <Button variant="outline" size="sm" onClick={onSelectAll}>Select all</Button>
      <div className="flex items-center gap-1">
        <Input value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} placeholder="#1" className="h-8 w-16" />
        <span className="text-muted-foreground">to</span>
        <Input value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} placeholder="#45" className="h-8 w-16" />
        <Button variant="outline" size="sm" onClick={() => onSelectRange(rangeFrom, rangeTo)}>Select range</Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={selectedCount === 0}>Clear</Button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <BulkAddToListMenu issueIds={selectedIds} onAdded={onListAdded} />
        <Button variant="outline" size="sm" onClick={onMarkRead} disabled={selectedCount === 0 || isMarkingRead}>
          <BookOpen className="h-4 w-4" />
          {isMarkingRead ? "Marking…" : `Mark ${selectedCount} as read`}
        </Button>
        <Button size="sm" onClick={onMarkOwned} disabled={selectedCount === 0 || isMarkingOwned}>
          <CheckCheck className="h-4 w-4" />
          {isMarkingOwned ? "Marking…" : `Mark ${selectedCount} as owned`}
        </Button>
      </div>
    </div>
  );
}

function VolumeDetail() {
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
      return <div className="py-20 text-center text-sm text-muted-foreground">Invalid volume.</div>;
    }
    return (
      <div>
        <PageHeader
          eyebrow="Not yet in your catalog"
          title="Analyze this volume"
          description="Imports every issue and derives its run structure from ComicVine — this can take a little while for long-running titles."
        />
        <AnalyzeDisclaimer />
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
      toast.error("Enter valid issue numbers for the range.");
      return;
    }
    const [lo, hi] = fromNum <= toNum ? [fromNum, toNum] : [toNum, fromNum];
    const matched = volumeIssues.filter(
      (i) => i.sort_number != null && i.sort_number >= lo && i.sort_number <= hi,
    );
    if (matched.length === 0) {
      toast.info("No issues found in that range.");
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
          toast.success(`Marked ${issueIds.length} issue${issueIds.length === 1 ? "" : "s"} as owned.`);
          setSelected(new Set());
          setSelectionMode(false);
        },
        onError: () => toast.error("Couldn't update owned status."),
      },
    );
  };

  const handleMarkRead = () => {
    const issueIds = [...selected];
    bulkSetRead.mutate(
      { issueIds, read: true },
      {
        onSuccess: () => {
          toast.success(`Marked ${issueIds.length} issue${issueIds.length === 1 ? "" : "s"} as read.`);
          setSelected(new Set());
          setSelectionMode(false);
        },
        onError: () => toast.error("Couldn't update read status."),
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
      {data.comicvine_id && <AnalyzeDisclaimer />}

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl tracking-wide">All issues</h2>
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
              {selectionMode ? "Cancel" : "Select issues"}
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
          <p className="text-sm text-muted-foreground">No issues in your catalog for this volume yet.</p>
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
