import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Heart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { ComicGrid } from "@/components/comic-grid";
import { Badge } from "@/components/ui/badge";
import {
  useFavoriteSeries,
  useFavoritePublishers,
  useFavoriteCreators,
  useFavoriteRuns,
} from "@/hooks/useFavorites";
import { useUserCollection } from "@/hooks/useUserComics";
import { userComicToComic } from "@/lib/comic-adapters";
import { isFavoriteIssue } from "@/lib/favorite-match";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/_shell/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites · Comic Vault" },
      { name: "description", content: "Your favorite series, publishers, and creators." },
      { property: "og:title", content: "My favorites — Comic Vault" },
      { property: "og:description", content: "The creators and stories you love most." },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const { t } = useTranslation();
  const favSeries = useFavoriteSeries();
  const favPublishers = useFavoritePublishers();
  const favCreators = useFavoriteCreators();
  const favRuns = useFavoriteRuns();
  const collection = useUserCollection();

  const favoriteIds = useMemo(
    () => ({
      seriesIds: new Set((favSeries.data ?? []).map((s) => s.id)),
      publisherIds: new Set((favPublishers.data ?? []).map((p) => p.id)),
      creatorIds: new Set((favCreators.data ?? []).map((c) => c.id)),
    }),
    [favSeries.data, favPublishers.data, favCreators.data],
  );

  // What favoriting a series/publisher/creator actually *does*: surfaces
  // which of your tracked comics belong to one. Previously this tab showed
  // comics rated 4+ stars — a rating, not a favorite, and disconnected
  // from every other tab on this page.
  const favComics = (collection.data ?? [])
    .filter((e) => e.issue && isFavoriteIssue(e.issue, favoriteIds))
    .map((e) => userComicToComic(e))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <div>
      <PageHeader eyebrow={t.favorites.eyebrow} title={t.favorites.title} description={t.favorites.description} />
      <Tabs defaultValue="series">
        <TabsList>
          <TabsTrigger value="series">{t.favorites.series}</TabsTrigger>
          <TabsTrigger value="publishers">{t.favorites.publishers}</TabsTrigger>
          <TabsTrigger value="creators">{t.favorites.creators}</TabsTrigger>
          <TabsTrigger value="runs">{t.favorites.runs}</TabsTrigger>
          <TabsTrigger value="comics">{t.favorites.comics}</TabsTrigger>
        </TabsList>

        <TabsContent value="series" className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(favSeries.data ?? []).map((s) => (
              <Link key={s.id} to="/search" search={{ q: s.name }}>
                <Card className="cursor-pointer border-border/60 transition hover:border-primary/40">
                  <CardHeader className="flex-row items-center gap-3">
                    <Heart className="h-5 w-5 fill-primary text-primary" />
                    <CardTitle className="font-display text-lg tracking-wide">{s.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="publishers" className="mt-6">
          <div className="flex flex-wrap gap-2">
            {(favPublishers.data ?? []).map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-card/60 px-4 py-3">
                <PublisherBadge publisher={p.name} />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="creators" className="mt-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(favCreators.data ?? []).map((c) => (
              <Card key={c.id} className="border-border/60"><CardContent className="p-4">{[c.first_name, c.last_name].filter(Boolean).join(" ")}</CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="runs" className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(favRuns.data ?? []).map((r) => (
              <Link key={r.id} to="/runs/$id" params={{ id: r.id }}>
                <Card className="cursor-pointer border-border/60 transition hover:border-primary/40">
                  <CardHeader className="flex-row items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <Heart className="h-5 w-5 shrink-0 fill-primary text-primary" />
                      <CardTitle className="font-display truncate text-lg tracking-wide">{r.name}</CardTitle>
                    </span>
                    <Badge variant={r.status === "verified" ? "default" : "outline"} className="shrink-0">
                      {r.status === "verified" ? t.common.runStatus.verified : t.common.runStatus.draft}
                    </Badge>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comics" className="mt-6">
          <p className="mb-4 text-sm text-muted-foreground">
            {t.favorites.comicsDescription}
          </p>
          <ComicGrid>
            {favComics.map((c) => <ComicCard key={c.id} comic={c} />)}
          </ComicGrid>
        </TabsContent>
      </Tabs>
    </div>
  );
}
