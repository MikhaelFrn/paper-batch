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

export const UPCITEMDB_QUOTA_MESSAGE =
  "Barcode lookup limit reached for today — try again tomorrow, or add this comic by searching for it.";

export const COMICVINE_RATE_LIMIT_MESSAGE =
  "ComicVine is temporarily rate-limited (a shared limit across everyone using this app) — try again in a few minutes.";

const KNOWN_SAFE_MESSAGES: ReadonlySet<string> = new Set([
  UPCITEMDB_QUOTA_MESSAGE,
  COMICVINE_RATE_LIMIT_MESSAGE,
]);

/** Returns the message if this error is one of the known, deliberately
 * human-written messages above — safe to show a user directly, since it's
 * explaining a real, recoverable situation rather than leaking internals.
 * Returns null for anything else (a raw Postgres error, an unexpected
 * exception, etc.), which callers should show a generic fallback for
 * instead. */
export function getKnownSafeErrorMessage(error: unknown): string | null {
  if (error instanceof Error && KNOWN_SAFE_MESSAGES.has(error.message)) {
    return error.message;
  }
  return null;
}
