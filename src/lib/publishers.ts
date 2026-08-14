// ComicVine's canonical names for the major publishers this app gives
// special treatment (accent colors, badge styling, the inventory "main
// publisher" filter, New Arrivals' allowlist) — each verified live against
// the real API, not guessed. Single source of truth for the spelling: every
// place that needs this list types itself against MainPublisherName instead
// of retyping the strings, so adding/renaming a publisher here is a
// compile error everywhere else until it's updated too, rather than a
// silent drift (previously used shorthand like "DC"/"Dark Horse" that
// matched neither ComicVine's own names nor what upsertPublisher stores,
// so badges rendered unstyled outside New Arrivals).
export const MAIN_PUBLISHER_NAMES = [
  "Marvel",
  "DC Comics",
  "Image",
  "Dark Horse Comics",
  "Boom! Studios",
  "IDW Publishing",
  "DMG/Valiant Entertainment",
] as const;

export type MainPublisherName = (typeof MAIN_PUBLISHER_NAMES)[number];
