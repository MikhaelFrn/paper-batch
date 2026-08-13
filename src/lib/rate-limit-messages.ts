// Single source of truth for rate-limit/quota error messages that need to
// survive a createServerFn round trip and still be recognized as safe to
// show a user verbatim on the client.
//
// This can't be done via a `code` field on ServiceError: TanStack Start's
// server-function error serialization (ShallowErrorPlugin, see
// node_modules/@tanstack/router-core's ssr/serializer) only preserves
// `.message` across that boundary — it reconstructs a plain `new
// Error(message)` client-side, dropping `.code`, `.name`, and `instanceof`
// entirely (confirmed by reading the plugin itself, not assumed). So the
// only channel that survives is the message text — matched here by exact
// string rather than duplicating the same wording in every call site that
// needs to recognize it.
//
// These wire strings are always English and never shown directly — the
// server has no notion of the caller's locale, so it always throws the
// same fixed text. Callers get back a `kind`, not the message itself, and
// look up the actual (localized) display text via `t.errors[kind]`.

export const UPCITEMDB_QUOTA_MESSAGE =
  "Barcode lookup limit reached for today — try again tomorrow, or add this comic by searching for it.";

export const COMICVINE_RATE_LIMIT_MESSAGE =
  "ComicVine is temporarily rate-limited (a shared limit across everyone using this app) — try again in a few minutes.";

export type KnownSafeErrorKind = "upcitemdbQuota" | "comicvineRateLimit";

const KNOWN_SAFE_MESSAGES: ReadonlyMap<string, KnownSafeErrorKind> = new Map([
  [UPCITEMDB_QUOTA_MESSAGE, "upcitemdbQuota"],
  [COMICVINE_RATE_LIMIT_MESSAGE, "comicvineRateLimit"],
]);

/** Identifies which known, deliberately human-written error this is — safe
 * to show a user directly (via `t.errors[kind]`), since it's explaining a
 * real, recoverable situation rather than leaking internals. Returns null
 * for anything else (a raw Postgres error, an unexpected exception, etc.),
 * which callers should show a generic fallback for instead. */
export function getKnownSafeErrorKind(error: unknown): KnownSafeErrorKind | null {
  if (error instanceof Error && KNOWN_SAFE_MESSAGES.has(error.message)) {
    return KNOWN_SAFE_MESSAGES.get(error.message) ?? null;
  }
  return null;
}
