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
  the session and hands off into the app. Still needs the redirect URL
  added in Supabase's dashboard (Authentication → URL Configuration) —
  `http://localhost:8080/auth/callback` for dev, plus the production
  domain's version once hosted — and an actual end-to-end click-through
  hasn't been confirmed yet.
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

- **Editable-title-before-search review step** for barcode/cover-hash
  imports. Designed in detail (trim retail boilerplate like `" - by Author
  & Author (Paperback)"`, keep the result editable before it hits
  ComicVine search) but never built — the most concrete unfinished thread.
- **Auto-schedule the cover-hash backfill** (e.g. weekly). Blocked on
  having real hosting to run a cron job against.
- **Re-check `MIN_SIMILARITY = 45`** (`src/services/coverHash.ts`) now that
  similarity percentages are trustworthy — that threshold was picked back
  when the base-64 hash-encoding bug was silently deflating every score.
- **"Skip issues already known locally"** optimization for `analyzeVolume`
  (`src/services/runs.ts`), and an **issue-range / "block run"** analysis
  option for huge volumes — both discussed as cost-saving ideas, not built.
- **Cross-volume run continuation** (`run_relationships` —
  `continuation` / `recommended_before` / `tie-in` typed links between
  runs). The table exists in the schema already; nothing in the app reads
  or writes it yet.

## Found this session, deliberately left alone

- `PublisherBadge` / `publisherAccent` (`src/components/comic-card.tsx`,
  `src/lib/comic-adapters.ts`) key for DC is `"DC"`, matching New Arrivals'
  ComicVine-shorthand publisher names — but the local `publishers` table
  stores `"DC Comics"`, so DC badges on your own collection render
  unstyled. Needs a real naming-normalization decision, not a one-line
  swap, since both paths currently depend on being different strings.
- `covers.issue_id` has no unique DB constraint. Nothing's broken by it
  today (app logic prevents duplicates), but worth adding before this
  becomes a multi-device or concurrent-import setup.
- A gap-merged run's display name (e.g. `"Writer's Run #1-#6"`) reads as a
  continuous range even when the issues in between actually belong to a
  different run — cosmetic only, not a data bug.

## Never decided, still open (from the original design notes)

- Co-writer "primary writer" rule for run derivation — currently just
  takes the first writer credit found.
- Series matching for annuals/specials/one-shots — "decide once, apply
  consistently" was the plan, never actually decided.
- New Arrivals: personalized via favorites, or stay a global feed.

## Pre-launch hygiene not yet raised

- No test suite exists anywhere in the repo. For logic as fiddly as run
  derivation or search matching, even light regression coverage would
  catch silent breakage from future edits.
- A real secrets audit before hosting: confirm the ComicVine key, Supabase
  service-role key, and anything else server-only genuinely never reaches
  the client bundle.
- Graceful behavior when UPCitemdb's 100/day shared quota or ComicVine's
  rate limit actually gets hit in real use, not just in theory.
- No accessibility pass has happened beyond one reactive `aria-hidden`
  fix — worth a real pass if this goes in front of people other than you.
