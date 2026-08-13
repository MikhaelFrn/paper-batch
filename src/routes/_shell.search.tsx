import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { Card, CardContent } from "@/components/ui/card";
import { useSearch } from "@/hooks/useSearch";
import { useComicVineSearch, useLoadMoreComicVineIssues } from "@/hooks/useComicVine";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { issueToComic, cvIssueToComic } from "@/lib/comic-adapters";
import { getKnownSafeErrorKind } from "@/lib/rate-limit-messages";
import { useTranslation } from "@/i18n";
import type { CvSearchIssue } from "@/integrations/comicvine/types";

export const Route = createFileRoute("/_shell/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search · Comic Vault" },
      { name: "description", content: "Search comics, series, runs, writers, artists, publishers, characters, and teams." },
      { property: "og:title", content: "Search comics — Comic Vault" },
      { property: "og:description", content: "Find any issue, creator, or character in one search." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { t } = useTranslation();
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  // Re-seed when arriving with a new ?q= (e.g. a second topbar search while
  // already on this page) — but only in response to that, never overwrite
  // what the user is actively typing here.
  useEffect(() => {
    if (initialQ !== undefined && initialQ !== q) {
      setQ(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);
  const debouncedQ = useDebouncedValue(q, 400);
  const search = useSearch(debouncedQ, { limit: 20 });
  const cvSearch = useComicVineSearch(debouncedQ);
  const data = search.data;

  // "Load more" pages further into the same matched volumes the search
  // already found (see sampledVolumeIds), accumulating on top of the
  // initial batch. `offset` is only ever set explicitly (on a fresh query,
  // or after a successful load-more) — it must NOT be re-derived from
  // cvSearch.data via an effect, since React Query can refetch that query
  // in the background (window refocus, staleness) and a fresh `data`
  // reference would silently reset offset back to the start, discarding
  // any "Load more" progress already made.
  const [moreIssues, setMoreIssues] = useState<CvSearchIssue[]>([]);
  const [offset, setOffset] = useState<number | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const loadMore = useLoadMoreComicVineIssues();
  const effectiveOffset = offset ?? cvSearch.data?.nextOffset ?? 0;

  useEffect(() => {
    setMoreIssues([]);
    setOffset(null);
    setExhausted(false);
  }, [debouncedQ]);

  // ComicVine results already present locally (by comicvine_id) are dropped
  // in favor of the richer local row — the local one already has relations
  // and (if owned) collection state; the CV one is a bare search hit.
  const localIssueCvIds = useMemo(
    () => new Set((data?.issues ?? []).map((i) => i.comicvine_id).filter((id): id is number => id != null)),
    [data?.issues],
  );
  const localVolumeCvIds = useMemo(
    () => new Set((data?.volumes ?? []).map((v) => v.comicvine_id).filter((id): id is number => id != null)),
    [data?.volumes],
  );

  const allCvIssues = useMemo(
    () => [...(cvSearch.data?.issues ?? []), ...moreIssues],
    [cvSearch.data?.issues, moreIssues],
  );

  const issueComics = useMemo(() => {
    const local = (data?.issues ?? []).map((i) => issueToComic(i));
    const seen = new Set<number>();
    const fromCv = [];
    for (const i of allCvIssues) {
      if (localIssueCvIds.has(i.id) || seen.has(i.id)) continue;
      seen.add(i.id);
      fromCv.push(cvIssueToComic(i));
    }
    return [...local, ...fromCv];
  }, [data?.issues, allCvIssues, localIssueCvIds]);

  const cvVolumesOnly = useMemo(
    () => (cvSearch.data?.volumes ?? []).filter((v) => !localVolumeCvIds.has(v.id)),
    [cvSearch.data?.volumes, localVolumeCvIds],
  );

  const sampledVolumeIds = cvSearch.data?.sampledVolumeIds ?? [];
  const canLoadMore = sampledVolumeIds.length > 0 && !exhausted;

  const handleLoadMore = () => {
    loadMore.mutate(
      { volumeIds: sampledVolumeIds, offset: effectiveOffset },
      {
        onSuccess: (result) => {
          setMoreIssues((prev) => [...prev, ...result.issues]);
          setOffset(result.nextOffset);
          if (result.issues.length === 0) {
            setExhausted(true);
            toast.info(t.search.noMoreIssues);
          } else {
            toast.success(t.search.moreIssuesAdded(result.issues.length));
          }
        },
        onError: () => {
          toast.error(t.search.loadMoreFailed);
        },
      },
    );
  };

  const Group = ({ title, children, count }: { title: string; children: React.ReactNode; count: number }) =>
    count === 0 ? null : (
      <section className="mb-8">
        <h2 className="font-display mb-3 text-lg tracking-wide">{title} <span className="text-xs text-muted-foreground">· {count}</span></h2>
        {children}
      </section>
    );

  return (
    <div>
      <PageHeader eyebrow={t.search.eyebrow} title={t.search.title} description={t.search.description} />
      <div className="relative mb-8 max-w-2xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search.placeholder}
          aria-label={t.search.ariaLabel}
          className="h-12 pl-10 text-base"
        />
      </div>

      {q.trim() === "" ? (
        <p className="text-sm text-muted-foreground">{t.search.startTyping}</p>
      ) : search.isLoading ? (
        <p className="text-sm text-muted-foreground">{t.search.searching}</p>
      ) : !data ? null : (
        <>
          {cvSearch.isError && (
            // Local-DB results (below) are unaffected by this — only the
            // ComicVine-sourced portion (not-yet-catalogued comics/volumes)
            // is missing, so this is a small notice, not a blocking error.
            <p className="mb-6 text-sm text-muted-foreground">
              {(() => {
                const kind = getKnownSafeErrorKind(cvSearch.error);
                return kind ? t.errors[kind] : t.search.cvUnreachable;
              })()}
            </p>
          )}
          <Group title={t.search.comics} count={issueComics.length}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {issueComics.map((c) => <ComicCard key={c.id} comic={c} />)}
            </div>
            {canLoadMore && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={handleLoadMore} disabled={loadMore.isPending}>
                  {loadMore.isPending ? t.search.loadingMore : t.search.loadMore}
                </Button>
              </div>
            )}
          </Group>
          <Group title={t.search.series} count={data.series.length}>
            <div className="flex flex-wrap gap-2">{data.series.map((s) => <Card key={s.id} className="border-border/60"><CardContent className="p-3 text-sm">{s.name}</CardContent></Card>)}</div>
          </Group>
          <Group title={t.search.runs} count={data.runs.length}>
            <div className="flex flex-wrap gap-2">
              {data.runs.map((r) => (
                <Link
                  key={r.id}
                  to="/runs/$id"
                  params={{ id: r.id }}
                  className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm hover:border-primary/40"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </Group>
          <Group title={t.search.volumes} count={data.volumes.length + cvVolumesOnly.length}>
            <div className="flex flex-wrap gap-2">
              {data.volumes.map((v) => (
                <Link key={v.id} to="/volumes/$id" params={{ id: v.id }} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm hover:border-primary/40">
                  {v.name}
                </Link>
              ))}
              {cvVolumesOnly.map((v) => (
                <Link key={`cv-${v.id}`} to="/volumes/$id" params={{ id: `cv-${v.id}` }} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm hover:border-primary/40">
                  {v.name}{v.start_year ? ` (${v.start_year})` : ""}
                </Link>
              ))}
            </div>
          </Group>
          <Group title={t.search.creators} count={data.creators.length}>
            <div className="flex flex-wrap gap-2">{data.creators.map((c) => <span key={c.id} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">{[c.first_name, c.last_name].filter(Boolean).join(" ")}</span>)}</div>
          </Group>
          <Group title={t.search.publishers} count={data.publishers.length}>
            <div className="flex flex-wrap gap-2">{data.publishers.map((p) => <PublisherBadge key={p.id} publisher={p.name} />)}</div>
          </Group>
        </>
      )}
    </div>
  );
}
