import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { ComicCover } from "@/components/comic-cover";
import { Progress } from "@/components/ui/progress";
import { useUserCollection } from "@/hooks/useUserComics";
import { userComicToComic } from "@/lib/mock-data";

export const Route = createFileRoute("/_shell/reading-list")({
  head: () => ({
    meta: [
      { title: "Reading List · Longbox" },
      { name: "description", content: "Comics you're actively reading, with progress tracking." },
      { property: "og:title", content: "My reading list — Longbox" },
      { property: "og:description", content: "Pick up where you left off." },
    ],
  }),
  component: ReadingList,
});

function ReadingList() {
  const collection = useUserCollection();
  const entries = collection.data ?? [];
  const inProgress = entries
    .filter((e) => e.owned && !e.read && !!e.issue)
    .slice(0, 3)
    .map((e) => ({ comic: userComicToComic(e)!, progress: 0 }));
  const queued = entries
    .filter((e) => e.owned && !e.read && !!e.issue)
    .slice(0, 8)
    .map((e) => userComicToComic(e)!)
    .filter(Boolean);

  return (
    <div>
      <PageHeader eyebrow="Default list" title="Reading List" description="In-progress and up next." />

      <h2 className="font-display mb-3 text-xl tracking-wide">In progress</h2>
      {collection.isLoading ? (
        <div className="py-6 text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {inProgress.map(({ comic: c, progress }) => (
            <Link key={c.id} to="/comic/$id" params={{ id: c.id }} className="flex gap-3 rounded-xl border border-border/60 bg-card/60 p-3 hover:border-primary/40">
              <ComicCover comic={c} size="sm" className="w-20 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.series} #{c.issue}</div>
                <div className="text-xs text-muted-foreground">{c.writers[0]}</div>
                <Progress value={progress} className="mt-3 h-1.5" />
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{progress}% read</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="font-display mt-10 mb-3 text-xl tracking-wide">Up next</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {queued.map((c) => (
          <Link key={c.id} to="/comic/$id" params={{ id: c.id }} className="group space-y-1.5">
            <ComicCover comic={c} className="transition-transform group-hover:-translate-y-1" />
            <div className="truncate text-xs">{c.series} #{c.issue}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
