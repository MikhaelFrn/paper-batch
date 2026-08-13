-- runs / run_items / run_creators / run_relationships previously granted
-- INSERT/UPDATE/DELETE to any authenticated user via `USING (true)` /
-- `WITH CHECK (true)` policies, with no ownership column to scope them by
-- (unlike user_comics/lists/favorites, which are correctly scoped to
-- auth.uid()). Confirmed live: any signed-in user could rename or delete
-- ANY run directly via the anon-key client, bypassing the app entirely —
-- not just what its own UI exposes.
--
-- All real writes to these tables already go through this app's own
-- server functions (analyzeVolume, createRunRelationship,
-- deleteRunRelationship), which use the service-role client and only
-- require the caller to be authenticated — so dropping the permissive
-- authenticated policies here doesn't change what the app itself can do,
-- it only removes the ability to hit these tables directly, bypassing the
-- app's own code, the same way issues/volumes/series/publishers/creators
-- already work (public read, service-role-only write).
--
-- This does NOT add per-user ownership of runs — any authenticated user
-- can still trigger a run mutation through the app itself, same as
-- before. Runs remain shared/global derived data, not per-user; adding
-- real per-run ownership is a separate, bigger product decision.

DROP POLICY "Authenticated users can add run creators" ON public.run_creators;
DROP POLICY "Authenticated users can delete run creators" ON public.run_creators;

DROP POLICY "Authenticated users can add run items" ON public.run_items;
DROP POLICY "Authenticated users can delete run items" ON public.run_items;
DROP POLICY "Authenticated users can update run items" ON public.run_items;

DROP POLICY "Authenticated users can add run relationships" ON public.run_relationships;
DROP POLICY "Authenticated users can delete run relationships" ON public.run_relationships;
DROP POLICY "Authenticated users can update run relationships" ON public.run_relationships;

DROP POLICY "Authenticated users can create runs" ON public.runs;
DROP POLICY "Authenticated users can delete runs" ON public.runs;
DROP POLICY "Authenticated users can update runs" ON public.runs;

-- Public SELECT policies ("Enable read access for all users" / "Anyone
-- can view run volumes") are untouched — runs are meant to be publicly
-- browsable, same as the rest of the catalog data.
