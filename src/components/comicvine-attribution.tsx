import { useTranslation } from "@/i18n";

/** Required-in-spirit credit, not just etiquette — the issue/volume pages
 * display ComicVine's metadata and cover art as if it were the site's own
 * content otherwise. */
export function ComicVineAttribution() {
  const { t } = useTranslation();
  return (
    <p className="mt-10 text-center text-xs text-muted-foreground">
      {t.common.comicVineAttribution}{" "}
      <a
        href="https://comicvine.gamespot.com"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-primary"
      >
        comicvine.gamespot.com
      </a>
    </p>
  );
}
