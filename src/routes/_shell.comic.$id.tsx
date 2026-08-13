import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, BookOpen, Heart, ListPlus, Plus, Star, Waypoints } from "lucide-react";
import { ComicCard, PublisherBadge, RatingStars } from "@/components/comic-card";
import { ComicCover } from "@/components/comic-cover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useIssue, useRecentIssues } from "@/hooks/useIssues";
import { useMyUserComicByIssue, useUpsertMyUserComic, useUserCollection } from "@/hooks/useUserComics";
import {
  useAddIssueToDefaultList,
  useAddIssueToList,
  useIsIssueInList,
  useMyLists,
  useRemoveIssueFromList,
} from "@/hooks/useLists";
import { useRunsForIssue } from "@/hooks/useRuns";
import {
  useFavoriteCreators,
  useFavoritePublishers,
  useFavoriteSeries,
  useToggleFavoriteCreator,
  useToggleFavoritePublisher,
  useToggleFavoriteSeries,
} from "@/hooks/useFavorites";
import { issueToComic, normalizeSeriesName } from "@/lib/comic-adapters";
import type { Comic } from "@/lib/comic-adapters";
import type { IssueWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

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

interface CreatorRef {
  id: string;
  name: string;
}

/** Extracts {id, name} pairs (not just display strings, unlike
 * comic-adapters.ts's pickCreators) for a given credit role — favoriting
 * needs the real creator id, which the flattened Comic type doesn't
 * carry. Role predicates mirror pickCreators exactly so "Writer(s)" here
 * means the same thing it means everywhere else. */
function pickCreatorRefs(
  issueCreators: IssueWithRelations["issue_creators"],
  matcher: (role: string) => boolean,
  unknownLabel: string,
): CreatorRef[] {
  const byId = new Map<string, CreatorRef>();
  for (const ic of issueCreators) {
    if (!ic.creator || !matcher((ic.role ?? "").toLowerCase())) continue;
    const name = [ic.creator.first_name, ic.creator.last_name].filter(Boolean).join(" ").trim() || unknownLabel;
    byId.set(ic.creator.id, { id: ic.creator.id, name });
  }
  return [...byId.values()];
}

/** Credit names as links into global search, so "who else did this run" is
 * one click away instead of a manual retype — the search box ends up with
 * exactly the name you clicked, same as typing it yourself.
 *
 * `showFavorite` adds a per-creator favorite toggle — Credits card only,
 * not the hero byline (too dense a line to also carry an icon per name).
 * This is a deliberate per-click favorite, not derived from ownership:
 * owning a comic a creator worked on doesn't mean you liked their part in
 * it, so favoriting is never inferred from the collection. */
function CreatorLinks({
  creators,
  favoriteIds,
  onToggleFavorite,
  showFavorite = false,
  className,
}: {
  creators: CreatorRef[];
  favoriteIds?: Set<string>;
  onToggleFavorite?: (creator: CreatorRef, isFavorite: boolean) => void;
  showFavorite?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  if (creators.length === 0) return <>—</>;
  return (
    <>
      {creators.map((creator, i) => {
        const isFavorite = !!favoriteIds?.has(creator.id);
        return (
          <span key={creator.id} className="inline-flex items-center">
            {i > 0 && <span className="mr-1">,</span>}
            <Link to="/search" search={{ q: creator.name }} className={className ?? "hover:underline"}>
              {creator.name}
            </Link>
            {showFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite?.(creator, isFavorite)}
                aria-label={isFavorite ? t.comicDetail.favoriteCreatorRemove(creator.name) : t.comicDetail.favoriteCreatorAdd(creator.name)}
                className={cn(
                  "ml-1 transition-colors",
                  isFavorite ? "text-primary" : "text-muted-foreground/40 hover:text-primary",
                )}
              >
                <Heart className={cn("h-3 w-3", isFavorite && "fill-current")} />
              </button>
            )}
          </span>
        );
      })}
    </>
  );
}

/** Every other list besides the default wishlist — that one already has its
 * own quick button. Viewer-only collaborators are excluded since they can
 * see but not add to a shared list (owners/editors only, enforced by RLS
 * regardless, but no point offering an action that'll just fail). */
function AddToListMenu({ issueId }: { issueId: string }) {
  const { t } = useTranslation();
  const lists = useMyLists();
  const addToList = useAddIssueToList();
  const addableLists = (lists.data ?? []).filter((l) => l.myRole !== "viewer");

  const handleAdd = (listId: string, listName: string) => {
    addToList.mutate(
      { listId, issueId },
      {
        onSuccess: () => toast.success(t.comicDetail.addedToList(listName)),
        onError: () => toast.error(t.comicDetail.addToListFailed(listName)),
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={addToList.isPending}>
          <ListPlus className="h-4 w-4" />{t.comicDetail.addToList}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {addableLists.length === 0 ? (
          <DropdownMenuItem disabled>{t.comicDetail.noListsYet}</DropdownMenuItem>
        ) : (
          addableLists.map((l) => (
            <DropdownMenuItem key={l.id} onClick={() => handleAdd(l.id, l.name)}>
              {l.name}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/lists"><Plus className="mr-2 h-4 w-4" />{t.comicDetail.newList}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ComicDetail() {
  const { t, locale } = useTranslation();
  const { id } = Route.useParams();
  const issueQ = useIssue(id);
  const userComicQ = useMyUserComicByIssue(id);
  const recent = useRecentIssues(24);
  const runsQ = useRunsForIssue(id);
  const collection = useUserCollection();
  const lists = useMyLists();
  const wishlistList = lists.data?.find((l) => l.type === "wishlist");
  // `id` (the route param) rather than `comic.id` — comic isn't defined
  // until after the loading/not-found early returns below, and hooks can't
  // be called conditionally. They're the same value once comic exists.
  const isWishlistedQ = useIsIssueInList(wishlistList?.id, id);
  const favSeries = useFavoriteSeries();
  const favPublishers = useFavoritePublishers();
  const favCreators = useFavoriteCreators();
  const addToWishlist = useAddIssueToDefaultList();
  const removeFromList = useRemoveIssueFromList();
  const upsertUserComic = useUpsertMyUserComic();
  const toggleFavSeries = useToggleFavoriteSeries();
  const toggleFavPublisher = useToggleFavoritePublisher();
  const toggleFavCreator = useToggleFavoriteCreator();
  const [similarOwned, setSimilarOwned] = useState<Comic | null>(null);

  if (issueQ.isLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">{t.comicDetail.loading}</div>;
  }
  if (!issueQ.data) {
    return (
      <div className="py-20 text-center">
        <div className="font-display text-4xl">{t.comicDetail.notFound}</div>
        <p className="mt-2 text-muted-foreground">{t.comicDetail.notFoundDescription}</p>
        <Link to="/inventory" className="mt-4 inline-block text-primary">{t.comicDetail.backToInventory}</Link>
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

  const issueRuns = runsQ.data ?? [];
  const primaryRun = issueRuns[0];
  const volumeId = issueQ.data.volume?.id;

  const seriesId = issueQ.data.volume?.series?.id;
  const publisherId = issueQ.data.volume?.series?.publisher?.id;
  const isFavSeries = !!seriesId && (favSeries.data ?? []).some((s) => s.id === seriesId);
  const isFavPublisher = !!publisherId && (favPublishers.data ?? []).some((p) => p.id === publisherId);
  const isWishlisted = !!isWishlistedQ.data;

  const favCreatorIds = new Set((favCreators.data ?? []).map((c) => c.id));
  const writerRefs = pickCreatorRefs(issueQ.data.issue_creators, (r) => r.includes("writer"), t.common.unknown);
  const artistRefs = pickCreatorRefs(
    issueQ.data.issue_creators,
    (r) =>
      r.includes("artist") ||
      r.includes("penciler") ||
      r.includes("penciller") ||
      r.includes("inker") ||
      r.includes("colorist"),
    t.common.unknown,
  );
  const coverArtistRefs = pickCreatorRefs(issueQ.data.issue_creators, (r) => r.includes("cover"), t.common.unknown);

  const handleWishlist = () => {
    if (isWishlisted && wishlistList) {
      removeFromList.mutate(
        { listId: wishlistList.id, issueId: comic.id },
        {
          onSuccess: () => toast.success(t.comicDetail.removedFromWishlist),
          onError: () => toast.error(t.comicDetail.removeFromWishlistFailed),
        },
      );
      return;
    }
    addToWishlist.mutate(
      { type: "wishlist", issueId: comic.id },
      {
        onSuccess: () => toast.success(t.comicDetail.addedToWishlist),
        onError: () => toast.error(t.comicDetail.addToWishlistFailed),
      },
    );
  };

  const markOwned = () => {
    upsertUserComic.mutate(
      { issueId: comic.id, owned: !comic.owned },
      {
        onSuccess: () => toast.success(comic.owned ? t.comicDetail.removedFromOwned : t.comicDetail.markedAsOwned),
        onError: () => toast.error(t.comicDetail.updateFailed),
      },
    );
  };

  /** Different local issue row, same series + issue number, already owned
   * — the case that comes up when ComicVine tracks a variant cover or
   * reprint as a separate issue entirely. Matched on issue *number*, not
   * fuzzy title similarity, specifically so e.g. #1 and #2 of the same
   * series never get flagged against each other. */
  const findSimilarOwnedIssue = (): Comic | null => {
    const targetSeries = normalizeSeriesName(comic.series);
    const targetIssueNum = String(comic.issue).trim().toLowerCase();
    for (const entry of collection.data ?? []) {
      if (!entry.owned || !entry.issue || entry.issue.id === comic.id) continue;
      const other = issueToComic(entry.issue);
      if (
        normalizeSeriesName(other.series) === targetSeries &&
        String(other.issue).trim().toLowerCase() === targetIssueNum
      ) {
        return other;
      }
    }
    return null;
  };

  const handleToggleOwned = () => {
    if (!comic.owned) {
      const similar = findSimilarOwnedIssue();
      if (similar) {
        setSimilarOwned(similar);
        return;
      }
    }
    markOwned();
  };

  const handleToggleRead = () => {
    upsertUserComic.mutate(
      { issueId: comic.id, read: !comic.read },
      {
        onSuccess: () => toast.success(comic.read ? t.comicDetail.markedAsUnread : t.comicDetail.markedAsRead),
        onError: () => toast.error(t.comicDetail.updateFailed),
      },
    );
  };

  const handleToggleFavSeries = () => {
    if (!seriesId) return;
    toggleFavSeries.mutate(
      { seriesId, isFavorite: isFavSeries },
      {
        onSuccess: () => toast.success(isFavSeries ? t.comicDetail.unfavorited(comic.series) : t.comicDetail.favorited(comic.series)),
        onError: () => toast.error(t.comicDetail.updateFavoritesFailed),
      },
    );
  };

  const handleToggleFavPublisher = () => {
    if (!publisherId) return;
    toggleFavPublisher.mutate(
      { publisherId, isFavorite: isFavPublisher },
      {
        onSuccess: () => toast.success(isFavPublisher ? t.comicDetail.unfavorited(comic.publisher) : t.comicDetail.favorited(comic.publisher)),
        onError: () => toast.error(t.comicDetail.updateFavoritesFailed),
      },
    );
  };

  const handleToggleFavCreator = (creator: CreatorRef, isFavorite: boolean) => {
    toggleFavCreator.mutate(
      { creatorId: creator.id, isFavorite },
      {
        onSuccess: () => toast.success(isFavorite ? t.comicDetail.unfavorited(creator.name) : t.comicDetail.favorited(creator.name)),
        onError: () => toast.error(t.comicDetail.updateFavoritesFailed),
      },
    );
  };

  const dateLocale = locale === "fr" ? "fr-CA" : "en-US";

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
              <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-xs">{t.comicDetail.volumeLabel} {comic.volume}</span>
              <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-xs">#{comic.issue}</span>
              {primaryRun && <span className="rounded-md bg-black/40 px-2 py-0.5 text-xs">{primaryRun.name}</span>}
            </div>
            <div className="text-xs uppercase tracking-widest text-white/80">{comic.series}</div>
            <h1 className="font-display mt-1 text-4xl leading-tight tracking-wide sm:text-5xl">{comic.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/85">
              <span>{t.comicDetail.by} <CreatorLinks creators={writerRefs} /></span>
              <span>·</span>
              <span>{t.comicDetail.art} <CreatorLinks creators={artistRefs} /></span>
              <span>·</span>
              <span>{new Date(comic.releaseDate).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })}</span>
              {comic.rating && <><span>·</span><RatingStars value={comic.rating} /></>}
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85">{comic.synopsis}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant={isWishlisted ? "default" : "secondary"}
                onClick={handleWishlist}
                disabled={addToWishlist.isPending || removeFromList.isPending || isWishlistedQ.isFetching}
              >
                <Bookmark className="h-4 w-4" />
                {addToWishlist.isPending
                  ? t.comicDetail.adding
                  : removeFromList.isPending
                    ? t.comicDetail.removing
                    : isWishlisted
                      ? t.comicDetail.inWishlist
                      : t.comicDetail.addToWishlist}
              </Button>
              <AddToListMenu issueId={comic.id} />
              <Button variant={comic.owned ? "default" : "secondary"} onClick={handleToggleOwned} disabled={upsertUserComic.isPending}>
                {comic.owned ? t.comicDetail.ownedYes : t.comicDetail.markAsOwned}
              </Button>
              <Button variant={comic.read ? "default" : "secondary"} onClick={handleToggleRead} disabled={upsertUserComic.isPending}>
                <BookOpen className="h-4 w-4" />{comic.read ? t.comicDetail.readYes : t.comicDetail.markRead}
              </Button>
              <Button variant={isFavSeries ? "default" : "outline"} onClick={handleToggleFavSeries} disabled={toggleFavSeries.isPending}>
                <Heart className="h-4 w-4" />{isFavSeries ? t.comicDetail.seriesFavorited : t.comicDetail.favoriteSeries}
              </Button>
              <Button variant={isFavPublisher ? "default" : "outline"} onClick={handleToggleFavPublisher} disabled={toggleFavPublisher.isPending}>
                <Star className="h-4 w-4" />{isFavPublisher ? t.comicDetail.publisherFavorited : t.comicDetail.favoritePublisher}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-5">
            <h2 className="font-display text-lg tracking-wide">{t.comicDetail.credits}</h2>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.comicDetail.seriesLabel} value={comic.series} />
              <Field label={t.comicDetail.volumeFieldLabel} value={comic.volume} />
              <Field label={t.comicDetail.issueLabel} value={`#${comic.issue}`} />
              <Field label={t.comicDetail.runLabel} value={primaryRun?.name ?? "—"} />
              <Field label={t.comicDetail.publisherLabel} value={comic.publisher} />
              <Field label={t.comicDetail.releasedLabel} value={new Date(comic.releaseDate).toLocaleDateString(dateLocale)} />
              <Field
                label={t.comicDetail.writersLabel}
                value={
                  <CreatorLinks
                    creators={writerRefs}
                    favoriteIds={favCreatorIds}
                    onToggleFavorite={handleToggleFavCreator}
                    showFavorite
                    className="text-primary hover:underline"
                  />
                }
              />
              <Field
                label={t.comicDetail.artistsLabel}
                value={
                  <CreatorLinks
                    creators={artistRefs}
                    favoriteIds={favCreatorIds}
                    onToggleFavorite={handleToggleFavCreator}
                    showFavorite
                    className="text-primary hover:underline"
                  />
                }
              />
              <Field
                label={t.comicDetail.coverLabel}
                value={
                  <CreatorLinks
                    creators={coverArtistRefs}
                    favoriteIds={favCreatorIds}
                    onToggleFavorite={handleToggleFavCreator}
                    showFavorite
                    className="text-primary hover:underline"
                  />
                }
              />
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-5">
            <h2 className="font-display text-lg tracking-wide">{t.comicDetail.runsHeading}</h2>
            <Separator />
            {runsQ.isLoading ? (
              <p className="text-sm text-muted-foreground">{t.comicDetail.loading}</p>
            ) : issueRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.comicDetail.notAnalyzedYet}
                {volumeId && (
                  <>
                    {" "}
                    <Link to="/volumes/$id" params={{ id: volumeId }} className="text-primary hover:underline">
                      {t.comicDetail.analyzeTheVolume}
                    </Link>{" "}
                    {t.comicDetail.toFindIt}
                  </>
                )}
              </p>
            ) : (
              <div className="space-y-2">
                {issueRuns.map((run) => (
                  <Link
                    key={run.id}
                    to="/runs/$id"
                    params={{ id: run.id }}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm hover:border-primary/40"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Waypoints className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate font-medium">{run.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {t.common.issuesCount(run.run_items.length)}
                      <Badge variant={run.status === "verified" ? "default" : "outline"} className="text-[10px]">
                        {run.status === "verified" ? t.common.runStatus.verified : t.common.runStatus.draft}
                      </Badge>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-display mb-4 text-xl tracking-wide">{t.comicDetail.related}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {related.map((c) => <ComicCard key={c.id} comic={c} />)}
          </div>
        </section>

        <section>
          <h2 className="font-display mb-4 text-xl tracking-wide">{t.comicDetail.youMightAlsoLike}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {recommended.map((c) => <ComicCard key={c.id} comic={c} />)}
          </div>
        </section>
      </div>

      <AlertDialog open={!!similarOwned} onOpenChange={(open) => { if (!open) setSimilarOwned(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.comicDetail.similarOwnedTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {similarOwned && t.comicDetail.similarOwnedDescription(similarOwned.series, similarOwned.issue)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSimilarOwned(null);
                markOwned();
              }}
            >
              {t.comicDetail.proceedAnyway}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
