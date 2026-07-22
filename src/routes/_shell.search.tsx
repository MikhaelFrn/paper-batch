import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { Card, CardContent } from "@/components/ui/card";
import { comics } from "@/lib/mock-data";

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
  const [q, setQ] = useState("bat");

  const results = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return { comics: [], series: [], writers: [], artists: [], publishers: [], characters: [], teams: [] };
    const cs = comics.filter((c) => c.title.toLowerCase().includes(s) || c.series.toLowerCase().includes(s));
    const uniq = <T,>(a: T[]) => Array.from(new Set(a));
    return {
      comics: cs,
      series: uniq(comics.filter((c) => c.series.toLowerCase().includes(s)).map((c) => c.series)),
      writers: uniq(comics.flatMap((c) => c.writers).filter((w) => w.toLowerCase().includes(s))),
      artists: uniq(comics.flatMap((c) => c.artists).filter((a) => a.toLowerCase().includes(s))),
      publishers: uniq(comics.map((c) => c.publisher).filter((p) => p.toLowerCase().includes(s))),
      characters: uniq(comics.flatMap((c) => c.characters).filter((c) => c.toLowerCase().includes(s))),
      teams: uniq(comics.flatMap((c) => c.teams).filter((t) => t.toLowerCase().includes(s))),
    };
  }, [q]);

  const Group = ({ title, children, count }: any) =>
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
      ) : (
        <>
          <Group title="Comics" count={results.comics.length}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {results.comics.map((c) => <ComicCard key={c.id} comic={c} />)}
            </div>
          </Group>
          <Group title="Series" count={results.series.length}>
            <div className="flex flex-wrap gap-2">{results.series.map((s) => <Card key={s} className="border-border/60"><CardContent className="p-3 text-sm">{s}</CardContent></Card>)}</div>
          </Group>
          <Group title="Writers" count={results.writers.length}>
            <div className="flex flex-wrap gap-2">{results.writers.map((s) => <span key={s} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">{s}</span>)}</div>
          </Group>
          <Group title="Artists" count={results.artists.length}>
            <div className="flex flex-wrap gap-2">{results.artists.map((s) => <span key={s} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">{s}</span>)}</div>
          </Group>
          <Group title="Publishers" count={results.publishers.length}>
            <div className="flex flex-wrap gap-2">{results.publishers.map((p: any) => <PublisherBadge key={p} publisher={p} />)}</div>
          </Group>
          <Group title="Characters" count={results.characters.length}>
            <div className="flex flex-wrap gap-2">{results.characters.map((s) => <span key={s} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">{s}</span>)}</div>
          </Group>
          <Group title="Teams" count={results.teams.length}>
            <div className="flex flex-wrap gap-2">{results.teams.map((s) => <span key={s} className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">{s}</span>)}</div>
          </Group>
        </>
      )}
    </div>
  );
}
