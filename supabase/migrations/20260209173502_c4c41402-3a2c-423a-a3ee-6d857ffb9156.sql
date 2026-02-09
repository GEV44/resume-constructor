
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Resumes table
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  original_text TEXT NOT NULL DEFAULT '',
  parsed_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);

-- Analyses table
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_role TEXT NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  skill_score INTEGER NOT NULL DEFAULT 0,
  experience_score INTEGER NOT NULL DEFAULT 0,
  project_score INTEGER NOT NULL DEFAULT 0,
  education_score INTEGER NOT NULL DEFAULT 0,
  impact_score INTEGER NOT NULL DEFAULT 0,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  grade TEXT NOT NULL DEFAULT 'F' CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.analyses FOR DELETE USING (auth.uid() = user_id);

-- Optimized resumes table
CREATE TABLE public.optimized_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_role TEXT NOT NULL,
  optimized_text TEXT NOT NULL DEFAULT '',
  improvement_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  before_score INTEGER NOT NULL DEFAULT 0,
  after_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.optimized_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own optimized resumes" ON public.optimized_resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own optimized resumes" ON public.optimized_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own optimized resumes" ON public.optimized_resumes FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for resume files
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

CREATE POLICY "Users can upload own resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own resumes" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
