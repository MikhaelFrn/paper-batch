import { supabase } from "@/integrations/supabase/client";
import type {
  Creator,
  Publisher,
  Run,
  Series,
} from "@/lib/types";
import { requireUserId, unwrap } from "./_utils";

// ---------- Series favorites ----------
export async function listFavoriteSeries(): Promise<Series[]> {
  const uid = await requireUserId();
  const rows = unwrap(
    await supabase
      .from("favorite_series")
      .select("series:series(*)")
      .eq("user_id", uid),
    "Failed to load favorite series",
  ) as Array<{ series: Series | null }>;
  return rows.map((r) => r.series).filter((s): s is Series => !!s);
}

export async function addFavoriteSeries(seriesId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("favorite_series")
    .upsert({ user_id: uid, series_id: seriesId });
  if (error) throw new Error(error.message);
}

export async function removeFavoriteSeries(seriesId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("favorite_series")
    .delete()
    .eq("user_id", uid)
    .eq("series_id", seriesId);
  if (error) throw new Error(error.message);
}

// ---------- Creator favorites ----------
export async function listFavoriteCreators(): Promise<Creator[]> {
  const uid = await requireUserId();
  const rows = unwrap(
    await supabase
      .from("favorite_creators")
      .select("creator:creators(*)")
      .eq("user_id", uid),
    "Failed to load favorite creators",
  ) as Array<{ creator: Creator | null }>;
  return rows.map((r) => r.creator).filter((c): c is Creator => !!c);
}

export async function addFavoriteCreator(creatorId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("favorite_creators")
    .upsert({ user_id: uid, creator_id: creatorId });
  if (error) throw new Error(error.message);
}

export async function removeFavoriteCreator(creatorId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("favorite_creators")
    .delete()
    .eq("user_id", uid)
    .eq("creator_id", creatorId);
  if (error) throw new Error(error.message);
}

// ---------- Publisher favorites ----------
export async function listFavoritePublishers(): Promise<Publisher[]> {
  const uid = await requireUserId();
  const rows = unwrap(
    await supabase
      .from("favorite_publishers")
      .select("publisher:publishers(*)")
      .eq("user_id", uid),
    "Failed to load favorite publishers",
  ) as Array<{ publisher: Publisher | null }>;
  return rows.map((r) => r.publisher).filter((p): p is Publisher => !!p);
}

export async function addFavoritePublisher(publisherId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("favorite_publishers")
    .upsert({ user_id: uid, publisher_id: publisherId });
  if (error) throw new Error(error.message);
}

export async function removeFavoritePublisher(
  publisherId: string,
): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("favorite_publishers")
    .delete()
    .eq("user_id", uid)
    .eq("publisher_id", publisherId);
  if (error) throw new Error(error.message);
}

// ---------- Run favorites ----------
export async function listFavoriteRuns(): Promise<Run[]> {
  const uid = await requireUserId();
  const rows = unwrap(
    await supabase
      .from("favorite_runs")
      .select("run:runs(*)")
      .eq("user_id", uid),
    "Failed to load favorite runs",
  ) as Array<{ run: Run | null }>;
  return rows.map((r) => r.run).filter((r): r is Run => !!r);
}

export async function addFavoriteRun(runId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("favorite_runs")
    .upsert({ user_id: uid, run_id: runId });
  if (error) throw new Error(error.message);
}

export async function removeFavoriteRun(runId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("favorite_runs")
    .delete()
    .eq("user_id", uid)
    .eq("run_id", runId);
  if (error) throw new Error(error.message);
}
