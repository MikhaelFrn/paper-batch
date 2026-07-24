import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Bookmark, Heart, Library, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComicCard } from "@/components/comic-card";
import { ComicCover } from "@/components/comic-cover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  useComics,
  useCollectionStats,
  useCreatorSummary,
  useNewArrivals,
  useReadingProgress,
  useRecentlyAdded,
  useWishlist,
} from "@/hooks/queries";
import { favoritePublishers, favoriteSeries } from "@/lib/mock-data";

export const Route = createFileRoute("/_shell/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Longbox" },
      { name: "description", content: "Your comic collection at a glance — new arrivals, continue reading, wishlist, and stats." },
      { property: "og:title", content: "Longbox — Your comic collection HQ" },
      { property: "og:description", content: "Track, discover, and organize every issue in your longbox." },
    ],
  }),
  component: Dashboard,
});

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Library; label: string; value: number | string; tone: string }) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-2xl leading-none">{value}</div>
          <div className="truncate text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, to }: { title: string; to?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-2">
      <h2 className="font-display text-xl tracking-wide">{title}</h2>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function Dashboard() {
  const recent = [...comics].sort((a, b) => +new Date(b.addedDate) - +new Date(a.addedDate)).slice(0, 6);
  const arrivals = [...comics]
    .filter((c) => new Date(c.releaseDate) > new Date("2026-07-01"))
    .slice(0, 6);
  const wishlist = comics.filter((c) => c.wishlist).slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-hero p-6 sm:p-8">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "8px 8px" }} />
        <div className="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Welcome back, Peter</div>
            <h1 className="font-display mt-1 text-3xl tracking-wide text-white sm:text-5xl">
              {stats.owned} issues in your longbox.
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Pick up where you left off — you've got {readingProgress.length} comics mid-read and {arrivals.length} new arrivals waiting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary"><Link to="/new-arrivals"><Sparkles className="h-4 w-4" />What's new</Link></Button>
            <Button asChild className="bg-white text-black hover:bg-white/90"><Link to="/inventory">Browse collection</Link></Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Library} label="Owned" value={stats.owned} tone="bg-primary/15 text-primary" />
        <StatCard icon={BookOpen} label="Read" value={stats.read} tone="bg-accent/15 text-accent" />
        <StatCard icon={Bookmark} label="Wishlist" value={stats.wishlist} tone="bg-gold/15 text-gold" />
        <StatCard icon={Heart} label="Favorites" value={stats.favorites} tone="bg-emerald-500/15 text-emerald-400" />
      </div>

      {/* Continue reading */}
      <section>
        <SectionHeader title="Continue reading" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {readingProgress.map(({ comicId, progress }) => {
            const c = getComic(comicId);
            if (!c) return null;
            return (
              <Link
                key={comicId}
                to="/comic/$id"
                params={{ id: c.id }}
                className="group flex gap-3 rounded-xl border border-border/60 bg-card/60 p-3 hover:border-primary/40"
              >
                <ComicCover comic={c} size="sm" className="w-20 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium group-hover:text-primary">{c.series} #{c.issue}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.writers[0]}</div>
                  <div className="mt-3">
                    <Progress value={progress} className="h-1.5" />
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{progress}% read</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recently added */}
      <section>
        <SectionHeader title="Recently added" to="/inventory" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {recent.map((c) => (
            <ComicCard key={c.id} comic={c} />
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section>
        <SectionHeader title="New arrivals this week" to="/new-arrivals" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {arrivals.map((c) => (
            <ComicCard key={c.id} comic={c} />
          ))}
        </div>
      </section>

      {/* Wishlist + Favorites */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display tracking-wide">Wishlist preview</CardTitle>
            <Link to="/wishlist" className="text-xs text-muted-foreground hover:text-primary">Manage</Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {wishlist.map((c) => (
                <ComicCard key={c.id} comic={c} compact />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Favorite series</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {favoriteSeries.map((s) => (
                <div key={s} className="flex items-center justify-between text-sm">
                  <span className="truncate">{s}</span>
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Favorite publishers</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {favoritePublishers.map((p) => (
                <span key={p} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">{p}</span>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Favorite creators</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Writers</div>
              <div className="mb-2 text-sm">{favoriteWriters.join(" · ")}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Artists</div>
              <div className="text-sm">{favoriteArtists.join(" · ")}</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
