import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_shell/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites · Comic Vault" },
      { name: "description", content: "Your favorite series, publishers, writers, and artists." },
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

  const favComics = (collection.data ?? [])
    .filter((e) => (e.rating ?? 0) >= 4)
    .map((e) => userComicToComic(e))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const writers = (favCreators.data ?? []).filter((c) => (c.api_source ?? "").includes("writer") || true);
  // The creator role isn't stored on the creator row itself, so show all favorite creators in one list.
  const artists = writers;

  return (
    <div>
      <PageHeader eyebrow="Your taste" title="Favorites" description="Series, publishers, writers, artists, and issues you've starred." />
      <Tabs defaultValue="series">
        <TabsList>
          <TabsTrigger value="series">Series</TabsTrigger>
          <TabsTrigger value="publishers">Publishers</TabsTrigger>
          <TabsTrigger value="writers">Writers</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
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

        <TabsContent value="writers" className="mt-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {writers.map((w) => (
              <Card key={w.id} className="border-border/60"><CardContent className="p-4">{[w.first_name, w.last_name].filter(Boolean).join(" ")}</CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="artists" className="mt-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((a) => (
              <Card key={a.id} className="border-border/60"><CardContent className="p-4">{[a.first_name, a.last_name].filter(Boolean).join(" ")}</CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comics" className="mt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {favComics.map((c) => <ComicCard key={c.id} comic={c} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
