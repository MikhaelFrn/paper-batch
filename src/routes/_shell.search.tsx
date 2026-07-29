import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { Card, CardContent } from "@/components/ui/card";
import { useSearch } from "@/hooks/useSearch";
import { issueToComic } from "@/lib/mock-data";

export const Route = createFileRoute("/_shell/search")({
  head: () => ({
    meta: [
      { title: "Search · Longbox" },
      { name: "description", content: "Search comics, series, runs, writers, artists, publishers, characters, and teams." },
      { property: "og:title", content: "Search comics — Longbox" },
      { property: "og:description", content: "Find any issue, creator, or character in one search." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const search = useSearch(q, { limit: 20 });
  const data = search.data;

  const Group = ({ title, children, count }: { title: string; children: React.ReactNode; count: number }) =>
    count === 0 ? null : (
      <section className="mb-8">
        <h2 className="font-display mb-3 text-lg tracking-wide">{title} <span className="text-xs text-muted-foreground">· {count}</span></h2>
        {children}
      </section>
    );

  return (
    <div>
      <PageHeader eyebrow="Global search" title="Search" description="Comics, series, runs, creators, characters, and teams." />
      <div className="relative mb-8 max-w-2xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try 'batman', 'saga', 'Jim Lee'…" className="h-12 pl-10 text-base" />
      </div>

      {q.trim() === "" ? (
        <p className="text-sm text-muted-foreground">Start typing to search across the entire database.</p>
      ) : search.isLoading ? (
        <p className="text-sm text-muted-foreground">Searching…</p>
      ) : !data ? null : (
        <>
          <Group title="Comics" count={data.issues.length}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {data.issues.map((i) => <ComicCard key={i.id} comic={issueToComic(i)} />)}
            </div>
          </Group>
          <Group title="Series" count={data.series.length}>
            <div className="flex flex-wrap gap-2">{data.series.map((s) => <Card key={s.id} className="border-border/60"><CardContent className="p-3 text-sm">{s.name}</CardContent></Card>)}</div>
          </Group>
          <Group title="Runs" count={data.runs.length}>
            <div className="flex flex-wrap gap-2">{data.runs.map((r) => <span key={r.id} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">{r.name}</span>)}</div>
          </Group>
          <Group title="Volumes" count={data.volumes.length}>
            <div className="flex flex-wrap gap-2">{data.volumes.map((v) => <span key={v.id} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">{v.name}</span>)}</div>
          </Group>
          <Group title="Creators" count={data.creators.length}>
            <div className="flex flex-wrap gap-2">{data.creators.map((c) => <span key={c.id} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">{[c.first_name, c.last_name].filter(Boolean).join(" ")}</span>)}</div>
          </Group>
          <Group title="Publishers" count={data.publishers.length}>
            <div className="flex flex-wrap gap-2">{data.publishers.map((p) => <PublisherBadge key={p.id} publisher={p.name} />)}</div>
          </Group>
        </>
      )}
    </div>
  );
}
