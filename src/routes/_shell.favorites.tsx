import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Heart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import {
  useFavoriteSeries,
  useFavoritePublishers,
  useFavoriteCreators,
} from "@/hooks/useFavorites";
import { useUserCollection } from "@/hooks/useUserComics";
import { userComicToComic } from "@/lib/comic-adapters";
import { isFavoriteIssue } from "@/lib/favorite-match";

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
  const favSeries = useFavoriteSeries();
  const favPublishers = useFavoritePublishers();
  const favCreators = useFavoriteCreators();
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
      <PageHeader eyebrow="Your taste" title="Favorites" description="Series, publishers, creators, and the comics that match them." />
      <Tabs defaultValue="series">
        <TabsList>
          <TabsTrigger value="series">Series</TabsTrigger>
          <TabsTrigger value="publishers">Publishers</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="comics">Comics</TabsTrigger>
        </TabsList>

        <TabsContent value="series" className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(favSeries.data ?? []).map((s) => (
              <Card key={s.id} className="border-border/60">
                <CardHeader className="flex-row items-center gap-3">
                  <Heart className="h-5 w-5 fill-primary text-primary" />
                  <CardTitle className="font-display text-lg tracking-wide">{s.name}</CardTitle>
                </CardHeader>
              </Card>
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

        <TabsContent value="comics" className="mt-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Comics from a favorite series or publisher, or with a favorite creator credited on them.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {favComics.map((c) => <ComicCard key={c.id} comic={c} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
