// Re-export the typed Supabase client from the canonical integration path.
// Kept for backwards-compat with existing imports; new code should import
// from "@/integrations/supabase/client".
export { supabase } from "@/integrations/supabase/client";
export type { Database } from "@/integrations/supabase/database.types";
