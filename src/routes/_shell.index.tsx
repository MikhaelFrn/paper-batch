import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Bookmark, Heart, Library, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComicCard } from "@/components/comic-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserCollection } from "@/hooks/useUserComics";
import { useNewArrivals } from "@/hooks/useComicVine";
import {
  useFavoriteSeries,
  useFavoritePublishers,
  useFavoriteCreators,
} from "@/hooks/useFavorites";
import { useMyLists, useList } from "@/hooks/useLists";
import { useMyProfile } from "@/hooks/useProfiles";
import { cvIssueToComic, issueToComic, userComicToComic } from "@/lib/comic-adapters";
import { useTranslation } from "@/i18n";
export const Route = createFileRoute("/_shell/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Comic Vault" },
      { name: "description", content: "Your comic collection at a glance — new arrivals, continue reading, wishlist, and stats." },
      { property: "og:title", content: "Comic Vault — Your comic collection HQ" },
      { property: "og:description", content: "Track, discover, and organize every issue in your vault." },
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
  const { t } = useTranslation();
  return (
    <div className="mb-3 flex items-end justify-between gap-2">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          {t.dashboard.viewAll} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function Dashboard() {
  const { t } = useTranslation();
  const profile = useMyProfile();
  const collection = useUserCollection();
  const newArrivals = useNewArrivals();
  const favSeries = useFavoriteSeries();
  const favPublishers = useFavoritePublishers();
  const favCreators = useFavoriteCreators();
  const lists = useMyLists();
  const wishlistList = lists.data?.find((l) => l.type === "wishlist");
  const wishlistDetail = useList(wishlistList?.id);


  const entries = collection.data ?? [];
  const recent = entries
    .slice(0, 6)
    .map((e) => userComicToComic(e))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const arrivals = (newArrivals.data ?? [])
    .slice(0, 6)
    .map((i) => cvIssueToComic(i, i.publisherName));
  const wishlistPreview = (wishlistDetail.data?.list_items ?? [])
    .slice(0, 4)
    .map((it) => (it.issue ? issueToComic(it.issue, { wishlist: true }) : null))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const stats = {
    owned: entries.filter((e) => e.owned).length,
    read: entries.filter((e) => e.read).length,
    wishlist: wishlistDetail.data?.list_items?.length ?? 0,
    favorites: (favSeries.data?.length ?? 0) + (favPublishers.data?.length ?? 0) + (favCreators.data?.length ?? 0),
  };

  const displayName = profile.data?.display_name ?? profile.data?.username ?? t.dashboard.defaultCollectorName;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-hero p-6 sm:p-8">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "8px 8px" }} />
        <div className="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">{t.dashboard.welcomeBack(displayName)}</div>
            <h1 className="font-display mt-1 text-3xl tracking-wide text-white sm:text-5xl">
              {t.dashboard.issuesInVault(stats.owned)}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              {t.dashboard.newArrivalsWaiting(arrivals.length)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary"><Link to="/new-arrivals"><Sparkles className="h-4 w-4" />{t.dashboard.whatsNew}</Link></Button>
            <Button asChild className="bg-white text-black hover:bg-white/90"><Link to="/inventory">{t.dashboard.browseCollection}</Link></Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Library} label={t.dashboard.owned} value={stats.owned} tone="bg-primary/15 text-primary" />
        <StatCard icon={BookOpen} label={t.dashboard.read} value={stats.read} tone="bg-accent/15 text-accent" />
        <StatCard icon={Bookmark} label={t.dashboard.wishlist} value={stats.wishlist} tone="bg-gold/15 text-gold" />
        <StatCard icon={Heart} label={t.dashboard.favorites} value={stats.favorites} tone="bg-emerald-500/15 text-emerald-400" />
      </div>

      {/* Recently added */}
      <section>
        <SectionHeader title={t.dashboard.recentlyAdded} to="/inventory" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {recent.map((c) => (
            <ComicCard key={c.id} comic={c} />
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section>
        <SectionHeader title={t.dashboard.newArrivalsThisWeek} to="/new-arrivals" />
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
            <CardTitle className="text-lg">{t.dashboard.wishlistPreview}</CardTitle>
            <Link
              to={wishlistList ? "/lists/$id" : "/lists"}
              params={wishlistList ? { id: wishlistList.id } : undefined}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {t.dashboard.manage}
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {wishlistPreview.map((c) => (
                <ComicCard key={c.id} comic={c} compact />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">{t.dashboard.favoriteSeries}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(favSeries.data ?? []).map((s) => (
                <Link
                  key={s.id}
                  to="/search"
                  search={{ q: s.name }}
                  className="flex items-center justify-between text-sm hover:text-primary"
                >
                  <span className="truncate">{s.name}</span>
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">{t.dashboard.favoritePublishers}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(favPublishers.data ?? []).map((p) => (
                <span key={p.id} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">{p.name}</span>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">{t.dashboard.favoriteCreators}</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="text-sm">{(favCreators.data ?? []).map((c) => [c.first_name, c.last_name].filter(Boolean).join(" ")).join(" · ") || "—"}</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
