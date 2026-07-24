import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { customLists as mockLists } from "@/lib/mock-data";
import type { CustomList } from "./types";

export const listsService = {
  async list(): Promise<CustomList[]> {
    if (!isSupabaseConfigured) return mockLists;
    const { data } = await supabase.from("lists").select("*");
    return (data as CustomList[] | null) ?? mockLists;
  },

  async getById(id: string): Promise<CustomList | null> {
    if (!isSupabaseConfigured) return mockLists.find((l) => l.id === id) ?? null;
    const { data } = await supabase.from("lists").select("*").eq("id", id).maybeSingle();
    return (data as CustomList | null) ?? null;
  },

  async create(input: Omit<CustomList, "id">): Promise<CustomList> {
    if (!isSupabaseConfigured) {
      const created: CustomList = { ...input, id: crypto.randomUUID() };
      mockLists.push(created);
      return created;
    }
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("lists")
      .insert({ ...input, owner_id: user.user.id })
      .select("*")
      .single();
    if (error) throw error;
    return data as CustomList;
  },

  async update(id: string, patch: Partial<CustomList>): Promise<CustomList> {
    if (!isSupabaseConfigured) {
      const l = mockLists.find((x) => x.id === id);
      if (!l) throw new Error("List not found");
      Object.assign(l, patch);
      return l;
    }
    const { data, error } = await supabase
      .from("lists")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as CustomList;
  },

  async remove(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const i = mockLists.findIndex((l) => l.id === id);
      if (i >= 0) mockLists.splice(i, 1);
      return;
    }
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (error) throw error;
  },
};
