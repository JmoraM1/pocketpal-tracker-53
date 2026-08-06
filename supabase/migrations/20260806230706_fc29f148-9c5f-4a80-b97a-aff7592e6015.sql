ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'unico';

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  alias TEXT,
  currency TEXT NOT NULL DEFAULT 'COP',
  language TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own profile" ON public.profiles;
CREATE POLICY "Users manage their own profile" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();