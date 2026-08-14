-- Marks the single wishlist/reading list getOrCreateDefaultList
-- auto-spawns per user, distinct from any other wishlist/reading-*type*
-- list the user creates themselves via the new-list dialog (nothing
-- previously stopped duplicates — there's no unique constraint on
-- (owner_id, type)). Needed so list deletion can protect only the true
-- default instead of every list sharing its type.
ALTER TABLE public.lists
  ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Backfill: for each user+type currently unambiguous (exactly one existing
-- wishlist or reading list), mark it as the default. Left unmarked where
-- ambiguous (a user already has more than one list of that type) — there's
-- no reliable way to tell which one was the original auto-spawned list, so
-- the next "add to wishlist"/"add to reading" simply establishes a fresh,
-- unambiguous default from that point on.
WITH candidate AS (
  SELECT id, count(*) OVER (PARTITION BY owner_id, type) AS cnt
  FROM public.lists
  WHERE type IN ('wishlist', 'reading')
)
UPDATE public.lists
SET is_default = true
WHERE id IN (SELECT id FROM candidate WHERE cnt = 1);
