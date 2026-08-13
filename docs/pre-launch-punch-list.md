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

## Pre-launch hygiene not yet raised

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
- **`analyzeVolume` skips already-known issues, plus issue-range analysis.**
  The actual waste: `getIssueDetailsBatch` fired one ComicVine call per
  issue *unconditionally*, even though `upsertIssue` right after it
  already skips re-inserting known issues — so for anything already
  imported (via search/barcode, or an earlier pass), the expensive fetch
  happened and its result was just discarded. `loadAlreadyKnownIssues`
  now reconstructs an issue's credits from the local DB (verified live
  against real data, including that writer-detection still picks the
  same first-listed credit the fresh-fetch path would) whenever
  `issue_creators` rows already exist, skipping the fetch entirely.
  Also added `issueRange` (optional `{from, to}`) so a long-running title
  can be analyzed in chunks over time instead of all at once — a
  whole-volume request still refuses to re-run once any run exists, but a
  ranged request never is, since re-analyzing a range on purpose is a
  deliberate choice at that point. The "is this volume still ongoing"
  flag now only applies when the analyzed range actually reaches the
  volume's true latest issue (by date, not array position — verified
  with synthetic data that an early chunk doesn't get treated as
  ongoing, and reversed `{from, to}` input normalizes correctly).
- **Failed login showed nothing.** Root cause wasn't the login page's
  error handling (that was already correct) — `<Toaster />` was only
  mounted in `_shell.tsx`, the authenticated-layout route, so any page
  outside it (login, signup, forgot-password, reset-password, goodbye,
  auth callback) had nowhere to render a toast at all; `toast.error(...)`
  on those pages was a silent no-op. Moved `<Toaster />` to
  `__root.tsx`, which wraps every route. (Sonner's toaster is a
  client-side portal, so this can't be confirmed via SSR HTML alone —
  worth a real click-through with a wrong password.)
- **Volume-analysis loading state.** Added a "this can take a while — one
  ComicVine call for every issue not already in your catalog" message
  while `analyzeVolume` is pending, and simplified the button labels
  that had gotten cluttered from the range-analysis work. The
  disclaimer paragraph already mentioned analyzing a range for large
  runs from the earlier `issueRange` work, so no change was needed
  there.
- **Cross-volume run continuation** (`run_relationships`). The table
  existed in the schema but nothing read or wrote it, and there was no
  run detail page for it to live on at all — clicking a run anywhere
  (volume page, comic page, search) went nowhere or landed on the parent
  volume instead. Added a real `/runs/$id` page (issue grid + a "Related
  runs" section) and wired every existing run mention to link there.
  Linking two runs is manual, on purpose — matches
  `docs/comicvine-and-runs.md`'s own framing that classifying
  *continuation* vs *recommended_before* vs a tie-in is a judgment call,
  not something a scoring formula should decide. The trickiest part was
  `run_relationships` self-referencing `runs` twice (source and target);
  PostgREST needs the FK constraint name (`fk_source_run`/
  `fk_target_run`) to disambiguate which embed is which — verified live
  against real data that outgoing/incoming resolve to the correct sides
  before trusting it. Also noticed in passing that `useFavoriteRuns`/
  `useToggleFavoriteRun` already existed but nothing called them — fixed
  right after (see below).
- **Favorite-run toggle + Favorites page "Runs" tab.** The hooks existed
  but had no UI: no heart anywhere, no runs tab. Added a heart toggle on
  the new run detail page (same pattern as the series/publisher toggles
  on the comic page) and a "Runs" tab on Favorites linking through to it.
  Deliberately didn't fold run-favorites into the "Comics" tab's
  favorite-match logic (`src/lib/favorite-match.ts`) — that would need a
  new issue↔run join that isn't there yet, and wasn't part of this ask.
- **`covers.issue_id` unique constraint** — turned out to already be live
  (`ADD CONSTRAINT covers_issue_id_key UNIQUE (issue_id)` in
  `supabase/migrations/20260810042433_remote_schema.sql:197`), applied
  sometime after the "safe to add, not run yet" note was written but
  before that note got updated. Doc was stale, not the DB.
- **Unit test suite** — none existed anywhere in the repo. Added Vitest
  (`vitest.config.ts`, separate from `vite.config.ts` on purpose — that
  one goes through the Lovable/TanStack Start/Nitro wrapper, irrelevant
  and unsafe to drag into plain unit tests) plus `tests/unit/`, covering
  the logic that's genuinely fiddly and already caused real bugs this
  session: `deriveRunSegments` (gap-merging, noise absorption, anthology
  collapse, ongoing-forcing), the range-analysis math added for
  `analyzeVolume` (`issueDateKey`/`parseIssueNumberForRange`/
  `filterIssuesByRange`/`computeRangeTouchesLatest` — the last two didn't
  exist as testable units before this; they were inline logic in
  `analyzeVolume`'s handler, pulled out into named exported functions
  specifically so this session's earlier "5 synthetic test cases" hand
  check could become permanent instead of a one-off), both
  `normalizeSeriesName` implementations (including a regression guard
  that they *stay* different on annuals — that divergence is
  intentional, not a bug waiting to be "fixed"), and `isFavoriteIssue`.
  40 tests, all passing (`npm test`). Deliberately skipped a cover-hash
  test: the only home-grown logic there is a thin wrapper around Jimp's
  own `compareHashes`, nothing pure enough to be worth mocking Jimp for.
  Scope is intentionally narrow — pure functions only, no DOM, no live
  Supabase/ComicVine calls; e2e/integration testing is a separate,
  bigger lift not attempted here.

## Security audit

Worked through a security checklist covering secrets, RLS, injection,
storage, auth, IDs, and CORS. One real finding, everything else confirmed
clean — several by live testing against the real DB/bundle, not just
reading code.

- **Found and fixed: `runs`/`run_items`/`run_creators`/`run_relationships`
  had no real write protection.** Their RLS policies granted INSERT/
  UPDATE/DELETE to any authenticated user via bare `USING (true)` /
  `WITH CHECK (true)`, with no ownership column to scope them by (unlike
  `user_comics`/`lists`/favorites, which are correctly scoped to
  `auth.uid()`). Confirmed live with a throwaway script: an authenticated
  session could rename or delete an arbitrary run directly via the
  anon-key client — not through the app's UI, straight through the raw
  API, the exact thing RLS is supposed to stop. Fixed two ways together:
  `createRunRelationship`/`deleteRunRelationship` (the only two writes to
  this table family that went through the plain browser client) became
  real `createServerFn` endpoints using the service-role client, matching
  `analyzeVolume`'s existing pattern; then
  `supabase/migrations/20260812000000_lock_down_run_write_policies.sql`
  drops the permissive authenticated policies entirely, so these tables
  are now public-read/service-role-write only — same posture as
  `issues`/`volumes`/`series`/`publishers`/`creators`. **This migration
  hasn't been run yet** — needs to be applied the same way as previous
  ones (SQL editor). This does *not* add per-run ownership — any
  authenticated user can still trigger a run mutation through the app
  itself, same as before; it only closes the "bypass the app entirely via
  devtools" hole. Whether runs should have real per-user ownership at all
  (they're currently shared/global derived data, which conflicts with
  "only the creator can edit their own run") is a separate product
  decision, not something to decide unilaterally here.
- **Everything else checked out, confirmed rather than assumed:**
  - Secrets: grepped the actual built client bundle (`.vercel/output/static`,
    not just source) for both the service-role and ComicVine key values,
    the identifiers themselves, and any `process.env` reference — zero
    hits. Confirms the dynamic-import pattern used for jimp/zxing/tesseract
    is actually keeping server-only code out of the client chunk, not just
    theoretically.
  - Storage (avatars bucket): live-tested as a real authenticated user
    (not service role) — uploading/deleting another user's avatar path is
    blocked by RLS, uploading your own succeeds, public read works. The
    policy itself only exists on the remote project, not in a local
    migration file — worth a `supabase db pull` at some point so it's
    reproducible from the repo, not just live on Supabase's dashboard.
  - Every other table's RLS was read end-to-end from the schema: all
    user-owned tables (`user_comics`, `favorite_*`, `lists`,
    `list_items`, `list_members`) correctly scope by `auth.uid()` or list
    membership; catalog tables (`issues`, `volumes`, `series`,
    `publishers`, `creators`, `covers`, `issue_creators`) are
    intentionally public-read/service-role-write only; `app_counters` has
    zero policies at all and is only reachable through its
    `SECURITY DEFINER` RPC, as designed.
  - Auth guarding: every private route lives under the single `_shell`
    layout route, gated by one `beforeLoad` that calls `auth.getUser()`
    (re-validates the JWT server-side) rather than trusting a cookie —
    there's no route that could accidentally skip the gate.
  - Injection: no raw SQL surface exists at all (Supabase's client always
    parameterizes real values); the one place user input feeds into
    *filter syntax* rather than a value (search's `.or()` calls) already
    strips the two characters that matter (`,` and `(`).
  - IDs: every table's primary key is a real UUID; nothing in a route
    param is a guessable sequential ID.
  - `console.log`/`console.error` calls: none dump the user, session, or
    a token — only generic error objects.
  - CORS/CSRF (the side question): no explicit CORS config exists
    anywhere in the app, which is actually correct — the app's own
    server functions are same-origin by default (Nitro/TanStack Start
    don't add permissive headers unless told to), so a third-party page
    can't read responses from them at all. Supabase's own API being
    cross-origin is by design; it's secured by RLS, not CORS — locking
    Supabase's CORS to one origin wouldn't add real protection since a
    non-browser client bypasses CORS entirely anyway. Checked the actual
    `@supabase/ssr` source (not assumed): the auth cookie defaults to
    `SameSite=Lax` and neither cookie adapter in this app overrides it,
    which is real CSRF protection — a cross-site POST from another origin
    won't carry the session cookie.
  - Unbounded queries: nothing security-relevant (every broad `select("*")`
    is already scoped by an owner/id filter or hits a genuinely small
    table). `listMyCollection()` has no `.limit()` — not a security issue
    since it's already scoped to `auth.uid()`, but worth watching when you
    do the "2000 comics" stress test below, since that's real unpaginated
    load.
  - Bundle size: checked the actual client output, not the server
    bundle — total client JS across every route is ~1.8MB uncompressed,
    and the heavy libraries (zxing for barcode scanning) are already
    route-split, only loading on the scan page rather than eagerly on
    every page load.

### What still needs a browser (can't verify these from here)

- **RLS, empirically**: log in as two different accounts (or the same
  account in two browser profiles) and try to read/update each other's
  `user_comics`/lists/favorites directly via the browser console — this
  session's live checks used a single real account plus disposable rows,
  which proves the *policy* behaves correctly but isn't the same as a
  true two-human click-through.
- **Auth persistence**: logout, then refresh — are you actually logged
  out? Direct-navigate to `/inventory` or `/profile` in a logged-out tab
  and confirm the redirect to `/login` actually happens (code review says
  it will, but it's worth seeing).
- **Offline handling**: disconnect the network mid-session — does
  anything crash outright, or does it degrade to an error message?
- **Lighthouse**: a real page-load run (images, lazy-loading, actual
  paint timing) — the bundle-size check above is necessary but not
  sufficient.
- **Keyboard-only navigation**: can you open/close every dialog and menu
  without a mouse?
- **Mobile**: iPhone SE / Pixel / iPad viewport sizes — this app hasn't
  had a dedicated mobile pass.
- **App-specific, from your own notes**:
  - Search behavior across `Spider` / `Spider-` / `spider` / `spid` —
    confirms debouncing and case-insensitivity feel right together, not
    just in isolation.
  - A search with a huge result set (`Batman`) — does the UI stay usable
    with however many rows come back?
  - Stress test: 100 lists, 2000 comics in the collection — does
    everything (Inventory, especially, given the unpaginated
    `listMyCollection()` above) stay responsive?
