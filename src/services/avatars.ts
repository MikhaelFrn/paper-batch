import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "./profiles";

export const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** Uploads under a random key unrelated to the account id — reused on
 * every re-upload (read back from the caller's own profile first) so a
 * re-upload still overwrites cleanly instead of orphaning the previous
 * file, without the object's name itself being a stable account
 * identifier. Storage RLS authorizes writes by *ownership*
 * (storage.objects.owner_id, auto-set to the uploader's auth.uid()), not
 * by matching the path, so the key can be anything. Returns a
 * cache-busted public URL alongside the key: the object path never
 * changes on re-upload, so without a query param the browser (and any CDN
 * in front of it) would keep serving the stale image after a new one is
 * uploaded.
 *
 * Takes a `Blob`, not just `File` — the actual caller is always the
 * cropped square output from AvatarCropDialog (a canvas-exported JPEG
 * blob), not the raw picked file. */
export async function uploadMyAvatar(file: Blob): Promise<{ url: string; objectKey: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please choose a PNG, JPEG, WebP, or GIF image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("That image is too large — please choose one under 5MB.");
  }
  const profile = await getMyProfile();
  const objectKey = profile?.avatar_object_key ?? crypto.randomUUID();

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectKey, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectKey);
  return { url: `${data.publicUrl}?t=${Date.now()}`, objectKey };
}
