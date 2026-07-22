import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { comics, favoriteArtists, favoritePublishers, favoriteSeries, favoriteWriters } from "@/lib/mock-data";

export const Route = createFileRoute("/_shell/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites · Longbox" },
      { name: "description", content: "Your favorite series, publishers, writers, and artists." },
      { property: "og:title", content: "My favorites — Longbox" },
      { property: "og:description", content: "The creators and stories you love most." },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const favComics = comics.filter((c) => c.favorite);
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
            {favoriteSeries.map((s) => (
              <Card key={s} className="border-border/60">
                <CardHeader className="flex-row items-center gap-3">
                  <Heart className="h-5 w-5 fill-primary text-primary" />
                  <CardTitle className="font-display text-lg tracking-wide">{s}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="publishers" className="mt-6">
          <div className="flex flex-wrap gap-2">
            {favoritePublishers.map((p) => (
              <div key={p} className="rounded-lg border border-border bg-card/60 px-4 py-3">
                <PublisherBadge publisher={p} />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="writers" className="mt-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteWriters.map((w) => (
              <Card key={w} className="border-border/60"><CardContent className="p-4">{w}</CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="artists" className="mt-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteArtists.map((a) => (
              <Card key={a} className="border-border/60"><CardContent className="p-4">{a}</CardContent></Card>
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
