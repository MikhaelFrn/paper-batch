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

## Found from your own browser testing

- **Keyboard focus was invisible on comic cards.** `outline-none` with
  nothing replacing it, and the only visual state was `group-hover:*` —
  mouse-only. Fixed: a real `focus-visible` ring (keyboard-only, doesn't
  show on mouse clicks) plus mirroring the hover lift/highlight for
  `group-focus-visible:*` (`src/components/comic-card.tsx`).
- **"spider"/"spid"/"spider-" barely returning Spider-Man results** turned
  out to be mostly ComicVine's own search engine, not our code — verified
  live against their real API: `"spid"` returns **zero** results from CV
  itself (their index doesn't do prefix/substring matching — `"batm"` and
  `"batma"` also return nothing, while `"bat"` works), and bare `"spider"`
  ranks an unrelated pulp-hero series called *The Spider* above Spider-Man
  in CV's own relevance engine. Not fixable on our end.
- **The bugged Batman result (Spanish, 2026, issue #199805) was real and
  fixed.** Two compounding bugs: (1) the foreign-market publisher denylist
  (built earlier for exactly this problem) only filtered *volume* search
  results — issue search has no `publisher` field on CV's response at
  all, so that path had zero filtering; fixed by reusing the cached
  volume→publisher lookup for issues too. (2) The denylist itself was
  incomplete — live-searching "Batman"/"Spider-Man" turned up 9 more
  foreign reprint publishers not yet caught (Ediciones Zinco, Norma
  Editorial, Epucol, Editions Interpresse S.A., TM-Semic, Panini France,
  Hjemmet, Bladkompaniet A.S., JuniorPress BV, Éditions de l'Occident) —
  added. Both in `src/integrations/comicvine/client.ts`.

## Security audit, round 2

A second, independent security review (from another source) came back —
went through everything actually actionable in it. Its central point was
fair: the first pass verified RLS by *reasoning about policy SQL*, not by
actually hitting every table the way an attacker would. This round fixed
that gap directly.

- **Found and fixed: `is_list_member` RPC callable with zero
  authentication.** It's a `SECURITY DEFINER` helper meant only for
  internal use inside `lists`/`list_items`/`list_members`'s own RLS
  policies, but Postgres grants `EXECUTE` to `PUBLIC` by default on
  function creation, and PostgREST exposes every public-schema function
  as an RPC endpoint unless revoked. Confirmed live: `POST
  /rest/v1/rpc/is_list_member` was callable with **no auth at all** and
  arbitrary `{p_list_id, p_user_id}` — leaking "is user X a member of
  list Y" for any UUID pair. Low severity (boolean-only, no row content,
  both params are non-guessable UUIDs) but a real, needless hole.
  **Migration not yet run:**
  `supabase/migrations/20260813000000_restrict_is_list_member_rpc.sql`.
  Can't just revoke `EXECUTE` entirely — Postgres requires the querying
  role to hold `EXECUTE` on a function even when it's only invoked
  *indirectly* through a policy expression, so revoking from
  `authenticated` would break viewing a list you're a member of (not
  owner), app-wide. The migration revokes the default `PUBLIC` grant
  (what `anon` was riding on) and re-grants explicitly to `authenticated`
  only.
- **Comprehensive per-table live audit** (the actual "curl every table"
  exercise) — every table in `public` tested unauthenticated and as a
  real logged-in session, comparing what came back against what the
  table actually contains (via service-role) to catch any cross-user
  leakage, not just presence/absence:
  - Catalog tables (`issues`, `volumes`, `series`, `publishers`,
    `creators`, `covers`, `issue_creators`, `runs`, `run_items`,
    `run_creators`, `run_relationships`, `profiles`): readable
    unauthenticated, as intended.
  - `barcode_lookups`/`app_counters`: correctly blocked unauthenticated;
    `barcode_lookups` correctly opens up once authenticated (shared
    cache, no per-user data).
  - Every user-owned table (`user_comics`, `favorite_creators`,
    `favorite_publishers`, `favorite_runs`, `favorite_series`, `lists`,
    `list_items`, `list_members`): zero rows unauthenticated (except
    `lists`/`list_items`, see next point), and as the real authenticated
    user, zero rows returned belonged to anyone else — this is what
    actually proves isolation, not just "some rows came back."
  - `lists`/`list_items` *did* return rows unauthenticated at first
    glance — turned out to be exactly the public-list feature working as
    designed; double-checked every row returned really was
    `visibility: 'public'`, not a mix. No leak.
  - No `CREATE VIEW` exists anywhere in the schema (the other RLS-bypass
    vector raised — views running as their creator can silently ignore
    RLS on the underlying tables). Only 4 `SECURITY DEFINER` functions
    exist; 3 are fine as-is (`handle_new_user` is trigger-only,
    `rls_auto_enable` is an event trigger, `increment_app_counter` takes
    an arbitrary key but the worst case is junk rows in a counter table,
    not data exposure); `is_list_member` is the one above.
- **XSS: confirmed clean, not just "no `dangerouslySetInnerHTML`."**
  Session lives in a cookie this app's own custom adapter reads via
  `document.cookie` (not `httpOnly` — it has to be readable for the
  browser client to attach the auth header), so XSS would still be full
  account takeover if it existed anywhere. It doesn't: the only
  `dangerouslySetInnerHTML` in the whole codebase is in an **unused**
  shadcn `chart.tsx` boilerplate file, fed a developer-authored color
  config, never user or API data. And the app doesn't even fetch
  ComicVine's `description` field (the one CV returns as raw HTML) — not
  in any `field_list`, not in any type. Zero exposure either way.
- **Every ComicVine-touching server function requires auth** — checked
  all 14 `createServerFn` endpoints in the app (`comicvine.ts`,
  `coverHash.ts`, `barcode.ts`, `runs.ts`, `account.ts`); every one that
  should require login does (`fetchServerUser` is the only exception,
  correctly so — it's the "am I logged in" check itself). This app uses
  TanStack Start server functions, not Supabase Edge Functions, so the
  "was `--no-verify-jwt` left on" question doesn't apply, but the
  underlying concern (an unauthenticated path that burns ComicVine quota)
  was worth checking directly rather than assuming — confirmed there
  isn't one. `deleteMyAccount` also specifically confirmed to read the
  target user id from the caller's *own* session, never from client
  input.
- **PostgREST filter injection (`.or()`), tested with real payloads** —
  not just re-read the escaping code. Threw `a,id.gt.0` and
  `a),name.neq.` at the real search endpoint; both came back as literal
  search text, zero rows, no injected filter. `esc()`'s comma/paren
  stripping holds.
- **Git history: clean.** The only env-related commits ever made touched
  `.env.example`, and its actual content has only ever been placeholder
  text (`spbkey`, `comicvinekey`, etc.), confirmed by reading it, not
  guessed from the filename.
- **GitHub repo: confirmed private** via an unauthenticated call to
  GitHub's public API (404, not 403 — GitHub deliberately returns 404
  for private repos to avoid confirming they exist to non-owners). Can't
  confirm it was *never* public in the past — that needs GitHub's own
  audit log, not visible from here.
- **`npm audit`: 4 high/moderate findings, all in build tooling**
  (`brace-expansion` via typescript-eslint, `js-yaml`, `nanoid`,
  `postcss` — dev-time only, never shipped or reachable by an end user).
  Ran `npm audit fix`; all 4 resolved with no breaking changes,
  `tsc`/`npm test`/`npm run build` all still clean afterward.
- **Client bundle re-checked for secrets after all of today's changes** —
  still zero occurrences of the service-role key, the ComicVine key,
  their identifiers, or `process.env`.

### Still needs you (dashboard-only, not visible from code)

- Run the new `is_list_member` migration, same as the others.
- Supabase Auth settings: redirect URL allowlist restricted to your real
  domain (the Google OAuth callback URL note above already covers this
  for production), email confirmation on, leaked-password protection
  (HaveIBeenPwned check) on, and confirm signup is restricted to however
  broad you actually want it right now.
- Ops, not urgent pre-launch but worth knowing about: a separate staging
  Supabase project before you run migrations against real data going
  forward, point-in-time recovery, and some form of error monitoring
  (Sentry or similar) so you hear about a prod break from a dashboard
  instead of a user.

## Accessibility pass

Went through every custom interactive element in the app (icon-only
buttons, form labels, non-semantic click handlers, focus visibility,
images) rather than just the one component you'd already found. Radix
primitives (Dialog/AlertDialog/Select/Dropdown/etc.) already handle focus
trapping and keyboard activation correctly by construction — verified no
custom modal/overlay exists outside them, so that class of bug isn't
possible here. What needed fixing was all hand-written:

- **Icon-only buttons/links with no accessible name**: the three "X"
  remove buttons (collaborator, list item, run link) had only a mouse-hover
  `title`, nothing a screen reader or keyboard-focus indicator picks up —
  added matching `aria-label` to all three. Same for the topbar's avatar
  menu trigger, the profile page's camera/avatar-upload button, and the
  Inventory grid/list view-toggle buttons (added `aria-pressed` too, since
  they're a two-state toggle).
- **A remove button that was literally unreachable by keyboard at all** —
  found while fixing the label issue above. The per-item remove button on
  a list's comic grid was `hidden` with only `group-hover:flex` to reveal
  it; since a `display:none` element can't receive focus, there was no way
  to reach it without a mouse, full stop. Added `group-focus-within:flex`
  alongside the hover variant, so tabbing to the comic card (which already
  has a focus ring from the earlier fix) reveals the button for the next
  Tab press.
- **Sidebar nav links losing their accessible name when collapsed to
  icon-only mode** — the visible text label gets `display:none`'d in that
  state, and a Radix tooltip's content isn't a reliable substitute for a
  real accessible name. Added an unconditional `aria-label` so it holds
  regardless of sidebar state.
- **Labels not programmatically associated with their inputs** — the
  biggest one. `<Label>Email</Label><Input .../>` with no `htmlFor`/`id`
  pairing appeared across login, signup, profile, list creation/editing,
  the collaborator picker, and the run-linking search — meaning a screen
  reader announces nothing when focusing the field, and clicking the label
  text doesn't focus the input for anyone, sighted or not. Fixed every
  instance found (paired `id`/`htmlFor`, including on a `Select` trigger
  and a `Switch`, which both support it the same way as a plain input).
  Two placeholder-only search inputs (topbar, main search page, barcode
  scan, Inventory's quick filter, the volume-analysis range inputs) got
  `aria-label` instead, since a placeholder alone isn't a reliable label
  (it disappears once you start typing).
- **Another invisible-focus-ring case**, same root cause as the comic-card
  fix from your own testing: the drag-and-drop image zone (barcode/cover
  scan) is keyboard-operable (`role="button"`, `tabIndex`, and it already
  correctly wires Enter/Space — someone did that part right) but had
  `outline-none` with nothing replacing it. Added the same focus-visible
  ring treatment.
- **Added a skip-to-content link** — previously every page load put a
  keyboard user at the top of the sidebar, meaning the full nav had to be
  tabbed through before reaching any actual page content. Standard
  visually-hidden-until-focused link, first focusable element on every
  authenticated page.
- **Found, not fixed — a real gap, but a bigger one**: the avatar crop
  dialog's pan (drag-to-reposition-the-image) has no keyboard equivalent
  at all. Fixing that properly (arrow-key nudging, with sensible step
  size and clamping to the same bounds the drag handler already enforces)
  is a real feature addition, not a label fix — flagging it rather than
  rushing it in.
- Confirmed clean by construction, not just spot-checked: swept every
  `outline-none` usage in the codebase — all the shadcn primitive
  components already pair it correctly with `focus-visible:ring` (that's
  the standard shadcn pattern), so the only real gaps were the two
  hand-written components above. Also checked every `<img>`/`AvatarImage`
  for alt text (all correct, including a deliberate empty `alt=""` on the
  crop dialog's preview image) and grepped for non-semantic
  `<div>`/`<span onClick>` interactive elements (none found beyond the
  drop-zone, which was already correctly built as `role="button"`).

`tsc`, `eslint`, `npm test`, and `npm run build` all clean throughout.

## i18n (French) — foundation + auth flow

Started the actual i18n work. Built the system and fully wired it through
the entire logged-out auth flow (login, signup, forgot-password,
reset-password, goodbye, the OAuth callback page) — the rest of the
authenticated app (`_shell`'s ~15 pages) still has hardcoded English and
is a separate, later pass; translating the whole app in one sitting
wasn't attempted, on purpose.

- **`src/i18n/`** — its own dedicated folder, as asked: `locales/en.ts` +
  `locales/fr.ts` (Quebec French), a `LocaleContext.tsx` provider, and a
  barrel `index.ts`. `t` is exposed as the whole current-language
  dictionary object (`t.auth.login.title`), not a `t("auth.login.title")`
  string-key function — a typo or missing translation is a TypeScript
  compile error this way, not a silent runtime fallback.
  `fr.ts`'s type is pinned to `typeof en` so the two dictionaries can
  never drift out of shape; confirmed live by temporarily breaking it
  during development — TypeScript caught it immediately.
- **Persistence**: a cookie, not localStorage — matches the pattern
  `ui/sidebar.tsx` already uses in this app for its own collapsed-state
  preference, rather than introducing a second mechanism for the same
  kind of problem. Not read back during SSR (same tradeoff the sidebar
  cookie already accepts), so the very first server-rendered frame is
  always English, corrected to the stored/detected language in a layout
  effect before the browser paints — verified live that this produces no
  visible flash in practice, not just assumed. First-ever visit (no
  cookie yet) falls back to `navigator.language`.
  Also updates `<html lang>` on every change — that attribute isn't just
  metadata, screen readers use it to pick pronunciation rules, so it
  needs to track the actual displayed language.
- **`LanguageSwitcher`** (`src/components/language-switcher.tsx`) — a
  plain two-button EN/FR toggle rather than a dropdown (only two options,
  so a dropdown would just add an extra click for no benefit). Placed in
  `AuthShell` (top-right corner, so it's on every logged-out page as
  asked) and in the authenticated sidebar's footer, so switching isn't
  only possible before logging in.
- **Terms/Privacy acceptance on signup** — a required "I accept the
  [Terms of Use & Privacy Policy]" checkbox, where the bracketed part
  opens a dialog (`src/components/terms-dialog.tsx`). Both the
  email/password submit button *and* the "Continue with Google" button
  are disabled until it's checked — found and closed a real gap in the
  process: the Google path didn't originally check acceptance at all,
  meaning it was possible to create an account via Google without ever
  seeing the checkbox.
  **The dialog's content is a placeholder, not the real policy** — you
  decided that explicitly (choosing between "ship a placeholder now" and
  "ship the actual draft now"): the real text is still a private,
  gitignored draft pending your sister's legal review
  (`docs/legal-draft-privacy-and-terms.md`), and putting it in
  `src/i18n/locales/*.ts` would make it real shipped, public,
  bundled-and-built app content — a fundamentally different thing than a
  private planning doc, regardless of the .md file's own gitignore
  status. Swapping the placeholder for the real text later needs zero UI
  changes, just filling in `terms.placeholderBody` (both languages) once
  it's ready.
- **Contact footer on the auth pages** — added to `AuthShell` (so it's on
  login/signup/forgot-password/reset-password/goodbye, as asked), same
  `mailto:comicvault.support@gmail.com` link and icon as the sidebar's.
- Verified live, not just by reading the code: started the dev server,
  fetched the real server-rendered HTML for `/login` and `/signup`, and
  confirmed the translated strings, the EN/FR buttons, the contact link,
  and the terms checkbox are actually present in the DOM output, not
  just compiling.

### Left for later, on purpose

- The rest of the app (`_shell`'s pages — dashboard, inventory, search,
  volumes, runs, lists, favorites, profile, settings, scan flows, etc.)
  still has hardcoded English throughout. Same `t.foo.bar` pattern
  extends cleanly to all of it; it's a large, mechanical pass, not a
  design problem, but genuinely large enough to warrant its own session
  rather than rushing it in alongside the auth-flow work.
- Real Terms/Privacy content, once your sister has reviewed the draft.
- Whether IP-level (not just account-level) enforcement is ever worth
  building — see the answer already given about `ban_duration` via
  Supabase's Admin API vs. real IP banning needing Vercel's layer
  instead, not Supabase's.

`tsc`, `eslint`, `npm test`, and `npm run build` all clean; auth pages
verified live against real server-rendered output.
