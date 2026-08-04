import { Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, BookOpen, Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { ComicCover } from "./comic-cover";
import { Badge } from "@/components/ui/badge";
import type { Comic } from "@/lib/comic-adapters";
import { cn } from "@/lib/utils";
import { useImportComicVineIssue } from "@/hooks/useComicVine";

function formatYear(releaseDate: string): number | null {
  if (!releaseDate) return null;
  const year = new Date(releaseDate).getFullYear();
  return Number.isFinite(year) ? year : null;
}

function ComicCardBody({
  comic,
  compact,
  extraBadge,
}: {
  comic: Comic;
  compact: boolean;
  extraBadge?: React.ReactNode;
}) {
  return (
    <>
      <div className="relative">
        <ComicCover comic={comic} size={compact ? "sm" : "md"} className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl" />
        {extraBadge && (
          <div className="pointer-events-none absolute left-1.5 top-1.5">{extraBadge}</div>
        )}
        <div className="pointer-events-none absolute right-1.5 top-1.5 flex flex-col gap-1">
          {comic.favorite && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-black/70 text-primary">
              <Heart className="h-3 w-3 fill-current" />
            </span>
          )}
          {comic.wishlist && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-black/70 text-gold">
              <Bookmark className="h-3 w-3 fill-current" />
            </span>
          )}
        </div>
        <div className="pointer-events-none absolute left-1.5 bottom-1.5 flex gap-1">
          {comic.owned && (
            <Badge className="h-5 border-0 bg-emerald-600/90 px-1.5 text-[9px] text-white">OWNED</Badge>
          )}
          {comic.read && (
            <Badge className="h-5 border-0 bg-accent/90 px-1.5 text-[9px]">READ</Badge>
          )}
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {comic.series} #{comic.issue}
        </div>
        <div className={cn("truncate text-xs text-muted-foreground", compact && "hidden")}>
          {comic.writers[0]}
          {formatYear(comic.releaseDate) ? ` · ${formatYear(comic.releaseDate)}` : ""}
        </div>
      </div>
    </>
  );
}

/** A ComicVine result not yet in the catalog — clicking imports it (see
 * services/comicvine.ts) and navigates to the newly created issue. */
function UnimportedComicCard({
  comic,
  compact,
  detailUrl,
  onImported,
}: {
  comic: Comic;
  compact: boolean;
  detailUrl: string;
  onImported?: (issueId: string) => void;
}) {
  const navigate = useNavigate();
  const importIssue = useImportComicVineIssue();

  const handleImport = () => {
    if (importIssue.isPending) return;
    importIssue.mutate(
      { detailUrl },
      {
        onSuccess: ({ issueId }) => {
          onImported?.(issueId);
          navigate({ to: "/comic/$id", params: { id: issueId } });
        },
        onError: () => {
          toast.error("Couldn't import this issue from ComicVine.");
        },
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleImport}
      disabled={importIssue.isPending}
      className="group block w-full space-y-2 text-left outline-none disabled:opacity-60"
    >
      <ComicCardBody
        comic={comic}
        compact={compact}
        extraBadge={
          <Badge className="h-5 border-0 bg-sky-600/90 px-1.5 text-[9px] text-white">
            {importIssue.isPending ? "Adding…" : "ComicVine"}
          </Badge>
        }
      />
    </button>
  );
}

export function ComicCard({
  comic,
  compact = false,
  onImported,
}: {
  comic: Comic;
  compact?: boolean;
  onImported?: (issueId: string) => void;
}) {
  if (comic.comicVineDetailUrl) {
    return (
      <UnimportedComicCard
        comic={comic}
        compact={compact}
        detailUrl={comic.comicVineDetailUrl}
        onImported={onImported}
      />
    );
  }

  return (
    <Link
      to="/comic/$id"
      params={{ id: comic.id }}
      className="group block space-y-2 outline-none"
    >
      <ComicCardBody comic={comic} compact={compact} />
    </Link>
  );
}

export function PublisherBadge({ publisher }: { publisher: Comic["publisher"] }) {
  const cls: Record<string, string> = {
    Marvel: "bg-primary/15 text-primary border-primary/30",
    DC: "bg-accent/15 text-accent border-accent/30",
    Image: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "Dark Horse": "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    "Boom Studios": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    IDW: "bg-red-500/15 text-red-300 border-red-500/30",
    Valiant: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", cls[publisher])}>
      {publisher}
    </span>
  );
}

export function RatingStars({ value }: { value?: number }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gold">
      <Star className="h-3.5 w-3.5 fill-current" />
      {value.toFixed(1)}
    </span>
  );
}

export function ReadIcon() {
  return <BookOpen className="h-3.5 w-3.5" />;
}
