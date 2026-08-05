import { supabase } from "@/integrations/supabase/client";
import { requireUserId } from "./_utils";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** Uploads to a fixed per-user path (`{userId}`, no extension) so a
 * re-upload always overwrites the same object instead of orphaning the
 * previous file under a different name. Storage RLS scopes insert/update
 * on this bucket to `name = auth.uid()`, matching that same path — see
 * the "avatars" bucket setup. Returns a cache-busted public URL: the
 * object path never changes on re-upload, so without a query param the
 * browser (and any CDN in front of it) would keep serving the stale
 * image after a new one is uploaded.
 *
 * Takes a `Blob`, not just `File` — the actual caller is always the
 * cropped square output from AvatarCropDialog (a canvas-exported JPEG
 * blob), not the raw picked file. */
export async function uploadMyAvatar(file: Blob): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please choose a PNG, JPEG, WebP, or GIF image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("That image is too large — please choose one under 5MB.");
  }
  const uid = await requireUserId();
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(uid, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(uid);
  return `${data.publicUrl}?t=${Date.now()}`;
}
