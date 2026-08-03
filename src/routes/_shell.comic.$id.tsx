import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, BookOpen, Heart, Share2, Star } from "lucide-react";
import { ComicCard, PublisherBadge, RatingStars } from "@/components/comic-card";
import { ComicCover } from "@/components/comic-cover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useIssue, useRecentIssues } from "@/hooks/useIssues";
import { useMyUserComicByIssue, useUpsertMyUserComic } from "@/hooks/useUserComics";
import { useAddIssueToDefaultList } from "@/hooks/useLists";
import {
  useFavoritePublishers,
  useFavoriteSeries,
  useToggleFavoritePublisher,
  useToggleFavoriteSeries,
} from "@/hooks/useFavorites";
import { issueToComic } from "@/lib/comic-adapters";

export const Route = createFileRoute("/_shell/comic/$id")({
  head: () => ({
    meta: [
      { title: "Comic · Comic Vault" },
      { name: "description", content: "Comic detail" },
      { property: "og:title", content: "Comic — Comic Vault" },
      { property: "og:description", content: "Full metadata and credits for this issue." },
    ],
  }),
  component: ComicDetail,
});

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}

function ComicDetail() {
  const { id } = Route.useParams();
  const issueQ = useIssue(id);
  const userComicQ = useMyUserComicByIssue(id);
  const recent = useRecentIssues(24);
  const favSeries = useFavoriteSeries();
  const favPublishers = useFavoritePublishers();
  const addToWishlist = useAddIssueToDefaultList();
  const upsertUserComic = useUpsertMyUserComic();
  const toggleFavSeries = useToggleFavoriteSeries();
  const toggleFavPublisher = useToggleFavoritePublisher();

  if (issueQ.isLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!issueQ.data) {
    return (
      <div className="py-20 text-center">
        <div className="font-display text-4xl">Not found</div>
        <p className="mt-2 text-muted-foreground">That issue isn't in the database.</p>
        <Link to="/inventory" className="mt-4 inline-block text-primary">Back to inventory</Link>
      </div>
    );
  }

  const uc = userComicQ.data;
  const comic = issueToComic(issueQ.data, {
    owned: uc?.owned ?? false,
    read: uc?.read ?? false,
    rating: uc?.rating,
  });
  const related = (recent.data ?? [])
    .filter((i) => i.id !== comic.id && i.volume?.series?.name === comic.series)
    .slice(0, 6)
    .map((i) => issueToComic(i));
  const recommended = (recent.data ?? [])
    .filter((i) => i.id !== comic.id)
    .slice(0, 6)
    .map((i) => issueToComic(i));

  const seriesId = issueQ.data.volume?.series?.id;
  const publisherId = issueQ.data.volume?.series?.publisher?.id;
  const isFavSeries = !!seriesId && (favSeries.data ?? []).some((s) => s.id === seriesId);
  const isFavPublisher = !!publisherId && (favPublishers.data ?? []).some((p) => p.id === publisherId);

  const handleWishlist = () => {
    addToWishlist.mutate(
      { type: "wishlist", issueId: comic.id },
      {
        onSuccess: () => toast.success("Added to wishlist"),
        onError: () => toast.error("Couldn't add to wishlist"),
      },
    );
  };

  const handleToggleOwned = () => {
    upsertUserComic.mutate(
      { issueId: comic.id, owned: !comic.owned },
      {
        onSuccess: () => toast.success(comic.owned ? "Removed from owned" : "Marked as owned"),
        onError: () => toast.error("Couldn't update"),
      },
    );
  };

  const handleToggleRead = () => {
    upsertUserComic.mutate(
      { issueId: comic.id, read: !comic.read },
      {
        onSuccess: () => toast.success(comic.read ? "Marked as unread" : "Marked as read"),
        onError: () => toast.error("Couldn't update"),
      },
    );
  };

  const handleToggleFavSeries = () => {
    if (!seriesId) return;
    toggleFavSeries.mutate(
      { seriesId, isFavorite: isFavSeries },
      {
        onSuccess: () => toast.success(isFavSeries ? `${comic.series} unfavorited` : `${comic.series} favorited`),
        onError: () => toast.error("Couldn't update favorites"),
      },
    );
  };

  const handleToggleFavPublisher = () => {
    if (!publisherId) return;
    toggleFavPublisher.mutate(
      { publisherId, isFavorite: isFavPublisher },
      {
        onSuccess: () => toast.success(isFavPublisher ? `${comic.publisher} unfavorited` : `${comic.publisher} favorited`),
        onError: () => toast.error("Couldn't update favorites"),
      },
    );
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.55), var(--background)), var(--gradient-hero)` }} />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
          <ComicCover comic={comic} size="xl" className="w-full max-w-[240px] shadow-2xl" />
          <div className="min-w-0 pt-4 text-white">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <PublisherBadge publisher={comic.publisher} />
              <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-xs">Vol. {comic.volume}</span>
              <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-xs">#{comic.issue}</span>
              {comic.run && <span className="rounded-md bg-black/40 px-2 py-0.5 text-xs">{comic.run}</span>}
            </div>
            <div className="text-xs uppercase tracking-widest text-white/80">{comic.series}</div>
            <h1 className="font-display mt-1 text-4xl leading-tight tracking-wide sm:text-5xl">{comic.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/85">
              <span>By {comic.writers.join(", ")}</span>
              <span>·</span>
              <span>Art {comic.artists.join(", ") || "—"}</span>
              <span>·</span>
              <span>{new Date(comic.releaseDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
              {comic.rating && <><span>·</span><RatingStars value={comic.rating} /></>}
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85">{comic.synopsis}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={handleWishlist} disabled={addToWishlist.isPending}>
                <Bookmark className="h-4 w-4" />{addToWishlist.isPending ? "Adding…" : "Wishlist"}
              </Button>
              <Button variant={comic.owned ? "default" : "secondary"} onClick={handleToggleOwned} disabled={upsertUserComic.isPending}>
                {comic.owned ? "Owned ✓" : "Mark as owned"}
              </Button>
              <Button variant={comic.read ? "default" : "secondary"} onClick={handleToggleRead} disabled={upsertUserComic.isPending}>
                <BookOpen className="h-4 w-4" />{comic.read ? "Read ✓" : "Mark read"}
              </Button>
              <Button variant={isFavSeries ? "default" : "outline"} onClick={handleToggleFavSeries} disabled={toggleFavSeries.isPending}>
                <Heart className="h-4 w-4" />{isFavSeries ? "Series favorited" : "Favorite series"}
              </Button>
              <Button variant={isFavPublisher ? "default" : "outline"} onClick={handleToggleFavPublisher} disabled={toggleFavPublisher.isPending}>
                <Star className="h-4 w-4" />{isFavPublisher ? "Publisher favorited" : "Favorite publisher"}
              </Button>
              <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-5">
            <h2 className="font-display text-lg tracking-wide">Credits</h2>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Series" value={comic.series} />
              <Field label="Volume" value={comic.volume} />
              <Field label="Issue" value={`#${comic.issue}`} />
              <Field label="Run" value={comic.run ?? "—"} />
              <Field label="Publisher" value={comic.publisher} />
              <Field label="Released" value={new Date(comic.releaseDate).toLocaleDateString()} />
              <Field label="Writer(s)" value={comic.writers.join(", ")} />
              <Field label="Artist(s)" value={comic.artists.join(", ") || "—"} />
              <Field label="Cover" value={comic.coverArtist ?? "—"} />
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-5">
            <h2 className="font-display text-lg tracking-wide">Story</h2>
            <Separator />
            <Field label="Characters" value={comic.characters.length ? <div className="flex flex-wrap gap-1.5">{comic.characters.map((c) => <span key={c} className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs">{c}</span>)}</div> : "—"} />
            <Field label="Teams" value={comic.teams.length ? <div className="flex flex-wrap gap-1.5">{comic.teams.map((t) => <span key={t} className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs">{t}</span>)}</div> : "—"} />
            <Field label="Story arcs" value={comic.storyArcs.length ? <div className="flex flex-wrap gap-1.5">{comic.storyArcs.map((s) => <span key={s} className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent">{s}</span>)}</div> : "—"} />
          </div>
        </section>

        <section>
          <h2 className="font-display mb-4 text-xl tracking-wide">Related</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {related.map((c) => <ComicCard key={c.id} comic={c} />)}
          </div>
        </section>

        <section>
          <h2 className="font-display mb-4 text-xl tracking-wide">You might also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {recommended.map((c) => <ComicCard key={c.id} comic={c} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
