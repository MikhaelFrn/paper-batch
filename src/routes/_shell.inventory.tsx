import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, LayoutGrid, List as ListIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComicCard, PublisherBadge } from "@/components/comic-card";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUserCollection } from "@/hooks/useUserComics";
import { usePublishers } from "@/hooks/usePublishers";
import { useSeriesList } from "@/hooks/useSeries";
import { useFavoriteCreators, useFavoritePublishers, useFavoriteSeries } from "@/hooks/useFavorites";
import { userComicToComic } from "@/lib/comic-adapters";
import { isFavoriteIssue } from "@/lib/favorite-match";

export const Route = createFileRoute("/_shell/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory · Comic Vault" },
      { name: "description", content: "Browse, filter, and sort your entire comic collection." },
      { property: "og:title", content: "Your comic inventory — Comic Vault" },
      { property: "og:description", content: "Every issue you own, read, or want, in one clean library." },
    ],
  }),
  component: Inventory,
});

type Sort = "recent" | "publisher" | "release" | "alpha";

// Curated allowlist of major publishers, each verified against ComicVine's
// own `/publisher/` endpoint (not guessed) so a future import actually
// matches these strings exactly. Everything else in the local `publishers`
// table (small/regional imprints, foreign reprint editions like "Panini
// Verlag" or "Marvel UK/Panini UK") gets grouped under one "Others" filter
// option instead of cluttering the list with a checkbox per imprint.
const MAIN_PUBLISHERS = [
  "Marvel",
  "DC Comics",
  "Image",
  "Dark Horse Comics",
  "Boom! Studios",
  "IDW Publishing",
  "DMG/Valiant Entertainment",
];
const OTHERS_LABEL = "Others";

function Filters({ publisherNames, seriesNames, pubs, setPubs, seriesSel, setSeriesSel, readOnly, setReadOnly, ownedOnly, setOwnedOnly, wishlistOnly, setWishlistOnly, favoritesOnly, setFavoritesOnly }: {
  publisherNames: string[];
  seriesNames: string[];
  pubs: string[]; setPubs: (v: string[]) => void;
  seriesSel: string[]; setSeriesSel: (v: string[]) => void;
  readOnly: boolean; setReadOnly: (v: boolean) => void;
  ownedOnly: boolean; setOwnedOnly: (v: boolean) => void;
  wishlistOnly: boolean; setWishlistOnly: (v: boolean) => void;
  favoritesOnly: boolean; setFavoritesOnly: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6 text-sm">
      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Publisher</Label>
        <div className="mt-2 space-y-2">
          {publisherNames.map((p) => (
            <label key={p} className="flex items-center gap-2">
              <Checkbox checked={pubs.includes(p)} onCheckedChange={(v) => setPubs(v ? [...pubs, p] : pubs.filter((x) => x !== p))} />
              <PublisherBadge publisher={p} />
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Series</Label>
        <div className="mt-2 max-h-40 space-y-1.5 overflow-auto pr-1">
          {seriesNames.map((s) => (
            <label key={s} className="flex items-center gap-2">
              <Checkbox checked={seriesSel.includes(s)} onCheckedChange={(v) => setSeriesSel(v ? [...seriesSel, s] : seriesSel.filter((x) => x !== s))} />
              <span className="truncate">{s}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Status</Label>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2"><Checkbox checked={ownedOnly} onCheckedChange={(v) => setOwnedOnly(!!v)} /> Owned</label>
          <label className="flex items-center gap-2"><Checkbox checked={readOnly} onCheckedChange={(v) => setReadOnly(!!v)} /> Read</label>
          <label className="flex items-center gap-2"><Checkbox checked={wishlistOnly} onCheckedChange={(v) => setWishlistOnly(!!v)} /> Wishlist</label>
          <label className="flex items-center gap-2">
            <Checkbox checked={favoritesOnly} onCheckedChange={(v) => setFavoritesOnly(!!v)} />
            Favorites
          </label>
        </div>
      </div>
    </div>
  );
}

function Inventory() {
  const [pubs, setPubs] = useState<string[]>([]);
  const [seriesSel, setSeriesSel] = useState<string[]>([]);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");

  const collection = useUserCollection();
  const publishers = usePublishers();
  const seriesList = useSeriesList();
  const favSeries = useFavoriteSeries();
  const favPublishers = useFavoritePublishers();
  const favCreators = useFavoriteCreators();

  const publisherNames = useMemo(() => {
    const allNames = (publishers.data ?? []).map((p) => p.name);
    const mainPresent = MAIN_PUBLISHERS.filter((name) => allNames.includes(name));
    const hasOthers = allNames.some((name) => !MAIN_PUBLISHERS.includes(name));
    return hasOthers ? [...mainPresent, OTHERS_LABEL] : mainPresent;
  }, [publishers.data]);
  const seriesNames = useMemo(() => (seriesList.data ?? []).map((s) => s.name), [seriesList.data]);

  const allComics = useMemo(
    () =>
      (collection.data ?? [])
        .map((e) => userComicToComic(e))
        .filter((c): c is NonNullable<typeof c> => !!c),
    [collection.data],
  );

  const favoriteIds = useMemo(
    () => ({
      seriesIds: new Set((favSeries.data ?? []).map((s) => s.id)),
      publisherIds: new Set((favPublishers.data ?? []).map((p) => p.id)),
      creatorIds: new Set((favCreators.data ?? []).map((c) => c.id)),
    }),
    [favSeries.data, favPublishers.data, favCreators.data],
  );

  // Otherwise-inert favoriting (series/publisher/creator) finally does
  // something: surfaces which owned/tracked comics actually belong to it.
  const favoriteComicIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of collection.data ?? []) {
      if (entry.issue && isFavoriteIssue(entry.issue, favoriteIds)) {
        ids.add(entry.issue.id);
      }
    }
    return ids;
  }, [collection.data, favoriteIds]);

  const filtered = useMemo(() => {
    let list = allComics.slice();
    if (favoritesOnly) list = list.filter((c) => favoriteComicIds.has(c.id));
    if (pubs.length) {
      const othersSelected = pubs.includes(OTHERS_LABEL);
      list = list.filter(
        (c) => pubs.includes(c.publisher) || (othersSelected && !MAIN_PUBLISHERS.includes(c.publisher)),
      );
    }
    if (seriesSel.length) list = list.filter((c) => seriesSel.includes(c.series));
    if (ownedOnly) list = list.filter((c) => c.owned);
    if (readOnly) list = list.filter((c) => c.read);
    if (wishlistOnly) list = list.filter((c) => c.wishlist);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(s) ||
          c.series.toLowerCase().includes(s) ||
          c.writers.some((w) => w.toLowerCase().includes(s)) ||
          c.artists.some((a) => a.toLowerCase().includes(s)),
      );
    }
    switch (sort) {
      case "alpha":
        // Sort by series (with issue number as a tiebreak), not
        // `comic.title` — the per-issue title (e.g. a ComicVine story
        // title) that isn't even the text shown on these cards/rows
        // (both display `{series} #{issue}`). Sorting by the invisible
        // title field interleaved series alphabetically by issue-level
        // text instead of by what's actually on screen.
        list.sort((a, b) => {
          const seriesCompare = a.series.localeCompare(b.series);
          if (seriesCompare !== 0) return seriesCompare;
          return String(a.issue).localeCompare(String(b.issue), undefined, { numeric: true });
        });
        break;
      case "publisher":
        list.sort((a, b) => a.publisher.localeCompare(b.publisher));
        break;
      case "release":
        list.sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
        break;
      case "recent":
        list.sort((a, b) => +new Date(b.addedDate) - +new Date(a.addedDate));
        break;
    }
    return list;
  }, [allComics, favoritesOnly, favoriteComicIds, pubs, seriesSel, ownedOnly, readOnly, wishlistOnly, q, sort]);

  const filterProps = { publisherNames, seriesNames, pubs, setPubs, seriesSel, setSeriesSel, readOnly, setReadOnly, ownedOnly, setOwnedOnly, wishlistOnly, setWishlistOnly, favoritesOnly, setFavoritesOnly };

  return (
    <div>
      <PageHeader
        eyebrow="Your Comic Vault"
        title="Inventory"
        description={`${filtered.length} of ${allComics.length} issues`}
        actions={
          <>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden"><Filter className="h-4 w-4" />Filters</Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-4"><Filters {...filterProps} /></div>
              </SheetContent>
            </Sheet>
            <div className="hidden items-center gap-1 rounded-md border border-border p-0.5 sm:flex">
              <Button size="icon" variant={view === "grid" ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></Button>
              <Button size="icon" variant={view === "list" ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setView("list")}><ListIcon className="h-4 w-4" /></Button>
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently added</SelectItem>
                <SelectItem value="release">Release date</SelectItem>
                <SelectItem value="alpha">Alphabetical</SelectItem>
                <SelectItem value="publisher">Publisher</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <Card className="border-border/60 sticky top-20">
            <CardContent className="p-4">
              <Filters {...filterProps} />
            </CardContent>
          </Card>
        </aside>
        <div>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quick filter within your collection…" className="mb-4 max-w-md" />

          {collection.isLoading ? (
            <div className="py-10 text-sm text-muted-foreground">Loading your collection…</div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {filtered.map((c) => <ComicCard key={c.id} comic={c} />)}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Publisher</th>
                    <th className="p-3">Writer</th>
                    <th className="p-3">Released</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="p-3 font-medium">{c.series} #{c.issue}</td>
                      <td className="p-3"><PublisherBadge publisher={c.publisher} /></td>
                      <td className="p-3 text-muted-foreground">{c.writers[0]}</td>
                      <td className="p-3 text-muted-foreground">{new Date(c.releaseDate).toLocaleDateString()}</td>
                      <td className="p-3 text-xs">
                        {c.owned && <span className="mr-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-400">Owned</span>}
                        {c.read && <span className="mr-1 rounded bg-accent/15 px-1.5 py-0.5 text-accent">Read</span>}
                        {c.wishlist && <span className="mr-1 rounded bg-gold/15 px-1.5 py-0.5 text-gold">Wishlist</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
