# ComicVine ingestion & Runs — design notes

Status: design only, nothing implemented yet. Not a current priority — the
base usable website comes first. This exists so the decisions made while
thinking it through aren't lost.

## Schema bug to fix whenever runs gets built

`run_status` enum is `draft` | `vevrified` — typo for `verified`.

## Ingestion pipeline

ComicVine's real hierarchy is **Publisher → Volume → Issue**. There is no
"Series" concept in CV — a CV "volume" already corresponds to a single
run/printing of a title (e.g. *Amazing Spider-Man* (1963) and *Amazing
Spider-Man* (2018) are two separate CV volumes). `series` in this schema is
an app-level concept layered on top, purely for user-facing filtering — "every
comic ever published under this name."

Practical order: **Publisher → Volume (from CV) → match/create Series →
Issue + Creators**.

### Series matching

Match on `normalized_name` alone (strip "The", year/volume suffixes,
casefold) — **not** scoped by `publisher_id`. Reason: some series move
publishers but stay the same continuity (e.g. *Star Wars*, Dark Horse →
Marvel in 2015) and should still group together. Accept the rare
false-positive collision (unrelated book, same title) as a "fix it when it
happens" problem — add a manual "reassign volume to series" action rather
than trying to engineer around it up front.

Open question: do annuals/specials/one-shots count as part of the parent
series for filtering purposes? Decide once, apply consistently.

### Architecture constraint

ComicVine calls must be server-only — same reasoning as the Supabase
auth split (`src/integrations/supabase/server-client.ts`): API key can't
reach the browser, and CV doesn't do permissive CORS for direct browser
calls. Any CV call goes through a `createServerFn`, never a client fetch.

### Rate limits

CV's key is tightly rate-limited. Two known risks:
- Search-as-you-type needs debouncing.
- **New Arrivals must not be a live per-request CV call.** It's the same
  data for every user, every time — this should be a scheduled ingestion
  job that populates `issues` once, with the home page/new-arrivals page
  just reading Supabase like any other page. Treat this as a different
  pipeline from search, not "search logic with a date filter."
  Also open: should New Arrivals be personalized using the existing
  `favorite_series`/`favorite_publishers` tables, or stay a single global
  feed?

### Search flow (use case 1) — open items

- Click-to-save must be `upsert ... on conflict (comicvine_id)`, not a
  plain insert (concurrent clicks on the same result would otherwise throw).
- Ingestion depth per entity type on click isn't defined yet — clicking an
  Issue presumably cascades Publisher→Volume→Issue→Creators, but what does
  clicking a bare Volume or Creator pull in?
- No staleness policy on `synced_at` — undefined when/if a saved record
  gets re-fetched from CV.
- Undefined whether a repeat search re-hits CV or checks the local DB first.

### Data quality notes

- CV creators are a single `name` string; schema splits `first_name`/
  `last_name`. That split is lossy (single-name pseudonyms, suffixes,
  multi-word surnames) — consider keeping the raw name in
  `external_metadata` as a fallback of record.
- `issue_creators.role` / `run_creators.role` are free text and CV's credit
  role strings are inconsistently formatted ("Writer" vs "writer" vs
  "script") — needs a normalization map at ingestion time or role-based
  queries will silently miss variants.
- `covers` table's purpose (vs. `issues.cover_url`) isn't defined by either
  use case yet — variant covers? Perceptual-hash dedup via `image_hash`?
- `issues.volume_id` is nullable — confirm whether that's an intentional
  two-phase insert state or should be NOT NULL.
- `creators.api_source` is the only non-nullable `api_source` column of the
  bunch — looks like an inconsistency rather than a deliberate choice.

## Runs

Not derived from ComicVine structure — a separate, applicative,
user-facing concept: "if I'm reading X, what else belongs with it."
Primary client is personal use, so some false positives/negatives are
acceptable if a manual fix path exists.

### Relationship model

`runs` are nodes; `run_relationships` links two *separate* runs with a
typed edge (`continuation`, `recommended_before`, `tie_in`, `concurrent`,
etc.) — tie-in issues don't get folded into one mega-run's `run_items`,
they form their own run linked to the main one.

If two runs have nothing to do with each other (e.g. Peach Momoko's
*Demon Days* and *Demon Wars* — same author, no narrative connection),
there is simply **no row** in `run_relationships`. Absence of a row *is*
"unrelated" — no explicit "none" value needed.

At a genuine (non-noise) writer-handoff boundary, the outcome is one of:
- `continuation` — the new run is directly connected to what came before.
- `recommended_before` — same franchise/umbrella, not really connected
  (e.g. *Avengers: Disassembled* → *New Avengers* (2015)).
- Nothing — an unrelated new direction that happens to follow
  chronologically.

Deciding *which* of the three applies is a harder classification problem
than boundary detection itself — treated as a manual/AI-verification step,
not something the scoring formula decides.

### Derivation algorithm — writer-segment approach

CV may already solve part of this: it has a **story arc** concept (issues
tagged with a named arc/event, e.g. "Civil War," "Extremis" as first-class
CV entities with their own issue lists). This is unverified against the
live API so far — worth checking before assuming the scoring model below
is the only path. If story arcs cover this, the scoring model becomes a
tool for *extending* a run beyond the official arc, not for defining its
core membership.

Absent that, the working model is **run-length encoding with proportional
small-segment merging** (1D equivalent of a "closing" operation):

1. Build the ordered (issue → primary writer) sequence for a volume/series.
   This requires the full sequence up front — it cannot be computed as an
   incremental "score the next issue against the last accepted one" stream,
   because a short interruption can't be judged as noise until you've seen
   whether the original writer returns and holds for a long stretch after
   it.
2. Run-length encode into segments: `(writer, issue_range, length)`.
3. For each foreign segment interrupting a same-writer stretch, compute its
   length as a **proportion of the combined surrounding same-writer
   segment** (e.g. 5 issues by another writer inside a 523-issue stretch =
   noise/absorb; 15 issues inside a 30-issue stretch = likely a real split).
   Denominator is the surrounding same-writer run, not a fixed issue count
   or fixed time window (elapsed time is explicitly *not* a valid cap —
   long single-continuity runs like Chris Claremont's ~16-year X-Men stint
   are legitimate and must not be fragmented just for being long).
4. Fill-ins at the very end of a sequence (no subsequent issues to confirm
   "the writer returned") need a fallback — default to absorbing a trailing
   short segment into the preceding one rather than leaving it orphaned.
5. Co-writer credits (multiple `writer`-role rows per issue in
   `issue_creators`) need a defined rule for "the" writer of an issue in
   this sequence — not yet decided (first-listed? tolerate partial overlap?).

### Draft/verified gate

- **Homogeneous run** (no writer changes inside it at all — e.g. Demon
  Days: one writer, one volume, sequential issues, no unusual gaps): no
  boundary decision is ever made, so the floor rule below doesn't apply.
  Scores high directly and can auto-verify on its own.
- **Closed boundary** (writer change confirmed permanent, not touching the
  unresolved present): run the proportional calculation from above —
  low ratio auto-absorbs (silent), high ratio auto-splits into a new run,
  middle band stays `draft` pending verification.
- **Under 12 issues** (rough average length of many real runs): forced
  `draft`, never auto-verifies — but **only when the run's classification
  came from resolving a writer-change boundary in the first place.** A
  short, entirely homogeneous run (single writer throughout) is not
  subject to this floor.
- **Ongoing** (the run touches the unresolved present — the writer hasn't
  been supplanted for a confirmed long stretch, or the volume hasn't
  ended): same proportional math runs for bookkeeping, but status is
  forced `draft` regardless of the result, since more issues could still
  land and change the answer.

`runs.confidence` is currently a single value per run, not per
`run_items` row — worth deciding whether a per-item match score is also
needed (to explain *why* a specific issue is in a run, and to support
pruning a weak member later) versus keeping confidence as a whole-run
aggregate only.

AI-assisted verification of `draft` runs (having a model review a
candidate run's item list and flag anything that doesn't belong) is a
plausible v2 layer on top of whichever gate above lands a run in `draft` —
not designed further yet.

## Still open

- Verify ComicVine's story-arc data against the real API before assuming
  the writer-segmentation algorithm is the primary path.
- Co-writer "primary writer" selection rule for the run-derivation sequence.
- Per-item vs. run-level confidence storage.
- How AI verification of drafts would actually work.
- New Arrivals: personalized (via favorites) or global feed.
