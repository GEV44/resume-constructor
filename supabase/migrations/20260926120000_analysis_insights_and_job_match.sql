-- Persist AI review findings and job-description matching on analyses
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS problems jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS structure_issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS job_description text,
  ADD COLUMN IF NOT EXISTS job_match jsonb;

DO $$ BEGIN
  ALTER TABLE public.analyses
    ADD CONSTRAINT analyses_job_description_length CHECK (job_description IS NULL OR char_length(job_description) <= 20000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Let users edit (e.g. fill in metric placeholders) and track edits of their optimized resumes
ALTER TABLE public.optimized_resumes
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS update_optimized_resumes_updated_at ON public.optimized_resumes;
CREATE TRIGGER update_optimized_resumes_updated_at
  BEFORE UPDATE ON public.optimized_resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Users can update own optimized resumes" ON public.optimized_resumes;
CREATE POLICY "Users can update own optimized resumes"
  ON public.optimized_resumes FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Indexes for the per-user, newest-first queries every dashboard page runs (and the edge-function rate limits)
CREATE INDEX IF NOT EXISTS analyses_user_created_idx ON public.analyses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS resumes_user_created_idx ON public.resumes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS optimized_resumes_user_created_idx ON public.optimized_resumes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analyses_resume_idx ON public.analyses (resume_id);
CREATE INDEX IF NOT EXISTS optimized_resumes_analysis_idx ON public.optimized_resumes (analysis_id);
