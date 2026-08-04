import { useState } from "react";
import { cn } from "@/lib/utils";
import { getPublisherAccent, type Comic } from "@/lib/comic-adapters";

interface Props {
  comic: Comic;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "aspect-[2/3] text-[10px]",
  md: "aspect-[2/3] text-xs",
  lg: "aspect-[2/3] text-sm",
  xl: "aspect-[2/3] text-base",
};

// Real cover when we have one (ComicVine's image, fetched on import — see
// comic-adapters.ts). Falls back to a stylised faux cover, self-contained
// with no external image, for the issues ComicVine has no art for or if the
// image URL fails to load.
export function ComicCover({ comic, className, size = "md" }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!comic.coverUrl && !imageFailed;
  const gradient = getPublisherAccent(comic.publisher);

  if (showImage) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-md comic-cover-shadow ring-1 ring-white/5",
          sizes[size],
          className,
        )}
      >
        <img
          src={comic.coverUrl}
          alt={`${comic.series} #${comic.issue} cover`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md comic-cover-shadow ring-1 ring-white/5",
        sizes[size],
        className,
      )}
      style={{ backgroundImage: gradient }}
    >
      {/* halftone pattern */}
      <div
        className="absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "6px 6px",
        }}
      />
      {/* diagonal slash */}
      <div className="absolute -right-8 top-6 h-2 w-40 rotate-12 bg-white/25" />
      <div className="absolute -right-8 top-10 h-1 w-32 rotate-12 bg-black/40" />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-2 py-1.5">
        <span className="font-display text-[10px] tracking-widest text-white/95 drop-shadow">
          {comic.publisher.toUpperCase()}
        </span>
        <span className="rounded-sm bg-black/50 px-1 py-0.5 font-mono text-[9px] text-white/90">
          #{comic.issue}
        </span>
      </div>

      {/* title block */}
      <div className="absolute inset-x-0 bottom-0 space-y-0.5 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2 pt-6">
        <div className="font-display leading-none text-white drop-shadow" style={{ fontSize: "1.1em" }}>
          {comic.series}
        </div>
        <div className="line-clamp-1 text-[0.85em] text-white/85">{comic.title}</div>
      </div>
    </div>
  );
}
