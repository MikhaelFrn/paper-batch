-- Lets a user manually mark a run as confirmed correct — distinct from
-- runs.status/verified_at, which reflect the derivation algorithm's own
-- confidence score, not a human's judgment. Modeled on favorite_runs (same
-- per-user, auth.uid()-scoped write policies) with one deliberate
-- difference: SELECT is public-read, matching every other run-family
-- table (runs/run_items/run_creators/run_relationships), since the point
-- of a verification is for OTHER users deciding whether to trust a run to
-- see it — not to stay private to the person who verified it, the way a
-- favorite does.

CREATE TABLE public.run_verifications (
  user_id     uuid                     NOT NULL,
  run_id      uuid                     NOT NULL,
  verified_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.run_verifications IS 'A user vouching that a run is correct, independent of runs.status (the algorithm''s own confidence).';

ALTER TABLE public.run_verifications
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.run_verifications
  ADD CONSTRAINT run_verifications_pkey PRIMARY KEY (user_id, run_id);

ALTER TABLE public.run_verifications
  ADD CONSTRAINT run_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.run_verifications
  ADD CONSTRAINT run_verifications_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.runs(id) ON DELETE CASCADE;

GRANT ALL ON public.run_verifications TO anon;

GRANT ALL ON public.run_verifications TO authenticated;

GRANT ALL ON public.run_verifications TO service_role;

CREATE POLICY "Users can verify runs" ON public.run_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can unverify runs" ON public.run_verifications
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Enable read access for all users" ON public.run_verifications
  FOR SELECT
  USING (true);
