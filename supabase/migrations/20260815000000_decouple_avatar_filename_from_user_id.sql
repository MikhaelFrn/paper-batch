-- Avatar objects have always been named after the uploader's own auth uid
-- (see src/services/avatars.ts), which makes the avatar's public URL a
-- stable identifier of the account, readable by anyone with the link.
-- This decouples the two: uploads now use a random key, authorized by
-- Storage's own ownership tracking (storage.objects.owner_id, auto-set to
-- the uploader's auth.uid() on an authenticated insert) instead of by
-- matching the filename. The random key is stored per-profile so a
-- re-upload can still overwrite the same object instead of orphaning the
-- previous one.
--
-- Additive, not a replacement: the existing name-based policies on the
-- avatars bucket (name = auth.uid()) are left in place, so avatars already
-- uploaded under the old scheme keep working untouched. Nothing needs a
-- forced migration; a user's avatar just moves to a random key the next
-- time they upload a new one.
--
-- owner_id is compared as text on both sides deliberately — Storage's
-- schema has changed this column's exact type across versions, and a text
-- comparison works regardless of which one this project is currently on.

ALTER TABLE public.profiles
  ADD COLUMN avatar_object_key text;

CREATE POLICY "Users can upload their own avatar by ownership" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (owner_id)::text = (auth.uid())::text);

CREATE POLICY "Users can update their own avatar by ownership" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (owner_id)::text = (auth.uid())::text)
  WITH CHECK (bucket_id = 'avatars' AND (owner_id)::text = (auth.uid())::text);

CREATE POLICY "Users can delete their own avatar by ownership" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (owner_id)::text = (auth.uid())::text);
