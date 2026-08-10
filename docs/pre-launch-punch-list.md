# Pre-launch punch list

Status snapshot as of 2026-08-05. i18n (French, for QC) is the intended
final step, after hosting, security testing, disclaimers, and publishing
Google sign-in (see below) — this list is everything else worth doing
before or around that point.

## Already planned (not detailed here)

- Hosting
- Security measures and testing
- Disclaimers

## Last step before i18n

- **Publish the Google OAuth consent screen** (currently in Testing mode,
  manually-added test users only). Publishing without verification makes
  it usable by any Google account but shows an ugly "Google hasn't
  verified this app" warning; removing that needs actual verification,
  which needs a real privacy policy URL and domain ownership — i.e. it's
  blocked on hosting and the disclaimers/privacy-policy work above, not
  something to do earlier. Do this right after those, right before i18n.

## Done

- **Profile picture upload** — was entirely decorative before (no bucket,
  no upload wiring, no `AvatarImage` render). Now a real Supabase Storage
  bucket, a Discord-style crop/zoom/pan step before upload (fixes a
  stretching bug from missing `object-cover`), and a 512×512 square
  output. The crop dialog's drag/zoom math was verified by hand, not in
  an actual browser (no interactive browser available here) — worth a
  real click-through to confirm it feels right.
- **Delete account** — was decorative (no handler at all). Confirmed live
  before building it that the schema's `ON DELETE CASCADE` already
  handles every user-referencing table correctly (profile, collection,
  favorites, owned lists and their items/members, membership on lists you
  don't own) — the button now confirms, deletes, signs out, and lands on
  a `/goodbye` page.
- **Google sign-in** — was decorative on login, missing entirely on
  signup. Now wired on both, landing at `/auth/callback` which waits for
  the session and hands off into the app. Redirect URL added in
  Supabase's dashboard, full account-creation-through-deletion flow
  confirmed working live. Still needs the *production* domain's callback
  URL added once hosted — `localhost` is the only one allowlisted so far.
- **Auto cover-hash backfill, without a cron job** — every 10th search
  app-wide (via a Postgres-backed counter + RPC, since this app has no
  scheduler and a serverless deploy can't hold an in-memory counter
  between requests) triggers a background catch-up run. Verified live
  under a real authenticated session, not just the service-role key.
  Also closed the existing gap this uncovered: 15 issues were missing
  their hash despite having a cover image; all re-hashed.
- **Vercel deploy target** — the Lovable-scaffolded Vite config defaults
  to a Cloudflare Workers build; confirmed live that `npm run build`
  produced a Wrangler bundle, not something Vercel can run. Pinned
  `nitro: { preset: "vercel" }` in `vite.config.ts`; rebuilding now
  correctly produces `.vercel/output/functions/...`.
- **Shared-list role colors** — lists you're an editor/viewer on (not
  owner) now get an orange/purple banner gradient in the Lists grid
  instead of blending in with everything else.
- **Inventory "Alphabetical" sort** — was sorting by the invisible
  per-issue title field instead of series name, interleaving series that
  looked alphabetized to the eye but weren't. Fixed, and the redundant
  "Title" dropdown entry (identical to "Alphabetical") was removed.
- **Publisher filter narrowed** — was every publisher in the DB,
  including one-off foreign reprint imprints. Now a curated main-publisher
  allowlist (verified against ComicVine's own API, not guessed) plus one
  "Others" bucket for everything else.
- **Barcode scan reliability** — two real bugs fixed: (1) a fresh scan's
  UPCitemdb title went straight into a ComicVine search with no review
  step, so a noisy retail title could silently import the wrong comic;
  (2) a *cached* match (a barcode scanned before) instantly navigated with
  no way to catch or correct a wrong pairing — confirmed this exact bug
  live (a real barcode was stuck pointing at the wrong issue). Both now
  show what they matched before committing, with an explicit "not this
  one" correction path for cached matches.
- **Cover-hash accuracy** — similarity scores were being computed by
  comparing base-64-*encoded* hash strings character-by-character, not the
  underlying bits, which systematically deflated scores (confirmed live:
  a real 61%-similar pair scored 9% through the old path). Fixed to
  compare raw bits, and every existing stored hash was re-migrated.
- **Run derivation for interrupted/anthology runs** — a writer returning
  after a fill-in arc used to fragment into separate runs instead of one
  run with a gap; a true anthology (every issue a different writer) used
  to fragment into one tiny run per issue. Both now collapse correctly.
- **Favorite filter in Inventory** — a "Favorites" checkbox now filters to
  comics belonging to a favorited series/publisher, or with a favorited
  creator credited in any role (`src/lib/favorite-match.ts`, shared with
  the Favorites page below).
- **Favorites page's "Comics" tab** — used to be comics rated 4+ stars, a
  rating, not a favorite, and disconnected from the rest of the page. Now
  shows comics matching a favorite series/publisher/creator, same
  definition as the Inventory filter. Also found and fixed while in
  there: the "Writers" and "Artists" tabs were showing identical content
  (favorited creators have no stored role, so the split was fake) —
  merged into one "Creators" tab instead of two tabs pretending to differ.

## Explicitly deferred feature work

- **"Skip issues already known locally"** optimization for `analyzeVolume`
  (`src/services/runs.ts`), and an **issue-range / "block run"** analysis
  option for huge volumes — both discussed as cost-saving ideas, not built.
- **Cross-volume run continuation** (`run_relationships` —
  `continuation` / `recommended_before` / `tie-in` typed links between
  runs). The table exists in the schema already; nothing in the app reads
  or writes it yet.

## Decided this session

- **Co-writer "primary writer" rule**: keep first-listed credit. No code
  change — this was already the behavior, just formally confirmed rather
  than an open question.
- **Annuals/specials/one-shots**: group into their parent series. Built —
  `normalizeSeriesName` (`src/services/comicvine.ts`) now strips a
  trailing "Annual"/"Special"/"One-Shot"/"Giant-Size", optionally followed
  by a year or issue number, before matching/creating a series. Verified
  against several real naming patterns, including that a volume genuinely
  just named "Annual" (no preceding word) isn't affected. Deliberately
  *not* mirrored into `comic-adapters.ts`'s copy of the same function —
  that one feeds "already own something similar?" duplicate detection,
  where an annual and a regular issue sharing a number are NOT the same
  physical comic.
- **New Arrivals scope**: stay a single global feed, no per-user
  personalization for now. No code change — already the current behavior.
- **Publisher naming consistency (found while resolving the above)**: the
  DC-badge mismatch turned out to be one symptom of a bigger issue —
  `NEW_ARRIVALS_PUBLISHERS` used shorthand names ("DC", "Dark Horse",
  "Boom Studios", "IDW", "Valiant") that matched neither ComicVine's own
  canonical names nor what `upsertPublisher` stores locally, so 5 of 7
  publishers displayed under two different names depending on whether a
  comic came from New Arrivals or was actually imported. Fixed by
  switching every publisher-name map (`NEW_ARRIVALS_PUBLISHERS`,
  `publisherAccent`, `PublisherBadge`'s color map) to the same
  ComicVine-verified canonical names used everywhere else.
- **Gap-merged run display name** (e.g. `"Writer's Run #1-#6"` even when
  #2-3 belong to a different run): keeping as-is, on purpose — the range
  framing is actually useful as-is, since it signals "a different writer
  interrupted this" without visually fragmenting a run that IS one
  creative run despite the gap.
- **`MIN_SIMILARITY = 45`** (`src/services/coverHash.ts`): keeping as-is.
  Worth flagging a mix-up first raised here — this threshold is cover-hash
  *image* matching (the "scan a cover to check what you own" feature), not
  related to run derivation's confidence scoring at all; keeping it as-is
  stands on its own regardless.
- **`database.types.ts` regenerated for real** — the file had been
  hand-augmented at some point with convenience type aliases
  (`ListType`, `ListMemberRole`, etc.) that aren't part of what
  `supabase gen types` actually outputs, which is exactly how it drifted
  silently (real enum name is `list_role`, not the `list_member_role` this
  file assumed). Now the file is the untouched generated output; the
  convenience aliases moved into `src/lib/types.ts` instead, deriving them
  via the generated `Enums<>` helper so a future regen never fights with
  hand edits again.

## Found this session, deliberately left alone

- `covers.issue_id` has no unique DB constraint — confirmed live no
  duplicates exist yet, so safe to add:
  `alter table covers add constraint covers_issue_id_key unique (issue_id);`
  Not run yet — needs real SQL access this session doesn't have.

## Pre-launch hygiene not yet raised

- No test suite exists anywhere in the repo. For logic as fiddly as run
  derivation or search matching, even light regression coverage would
  catch silent breakage from future edits.
- Secrets audit: confirmed live (grepped every env var reference in
  `src`) that only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
  are client-exposed by design; `SUPABASE_SERVICE_ROLE_KEY` and
  `COMICVINE_KEY` are server-only reads, never `VITE_`-prefixed. Still
  worth a real look at what actually ships in the client bundle once
  hosted, rather than trusting the naming convention alone.
- No accessibility pass has happened beyond one reactive `aria-hidden`
  fix — worth a real pass if this goes in front of people other than you.

## Done (continued)

- **Graceful UX for API quota/rate-limit exhaustion.** UPCitemdb's side
  already had a good, specific message — it just never reached the user;
  `_shell.scan_.barcode.tsx`'s `onError` always showed a hardcoded generic
  string regardless of the real error. ComicVine's client had no
  rate-limit detection at all (any non-ok response, including a 420,
  produced a raw `"ComicVine request failed: 420 ..."`). Bigger finding:
  New Arrivals and the search page's ComicVine section had *no* error
  handling whatsoever — a rate-limited failure silently rendered as
  "nothing found," actively misleading. Fixed by verifying (by reading
  TanStack Start's own `ShallowErrorPlugin` source, not assuming) that a
  `createServerFn`-thrown error only preserves `.message` across the
  client/server boundary — `.code`/`instanceof` are dropped, reconstructed
  as a plain `Error` — so `src/lib/rate-limit-messages.ts` recognizes safe
  messages by exact text instead. Applied everywhere ComicVine or
  UPCitemdb calls can surface: barcode lookup, the barcode flow's
  ComicVine-search step, importing any not-yet-catalogued comic
  (`ComicCard`), volume analysis, New Arrivals, and search.
