
-- Savings goals
CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_goals TO authenticated;
GRANT ALL ON public.savings_goals TO service_role;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own savings_goals" ON public.savings_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.savings_goal_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_goal_contributions TO authenticated;
GRANT ALL ON public.savings_goal_contributions TO service_role;
ALTER TABLE public.savings_goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal contribs" ON public.savings_goal_contributions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_goal_contribs_goal ON public.savings_goal_contributions(goal_id);

-- Free savings (no goal)
CREATE TABLE public.free_savings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.free_savings TO authenticated;
GRANT ALL ON public.free_savings TO service_role;
ALTER TABLE public.free_savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own free_savings" ON public.free_savings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.free_savings_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  saving_id UUID NOT NULL REFERENCES public.free_savings(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.free_savings_contributions TO authenticated;
GRANT ALL ON public.free_savings_contributions TO service_role;
ALTER TABLE public.free_savings_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own free contribs" ON public.free_savings_contributions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_free_contribs_saving ON public.free_savings_contributions(saving_id);

-- Triggers updated_at
CREATE TRIGGER trg_savings_goals_updated BEFORE UPDATE ON public.savings_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_goal_contribs_updated BEFORE UPDATE ON public.savings_goal_contributions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_free_savings_updated BEFORE UPDATE ON public.free_savings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_free_contribs_updated BEFORE UPDATE ON public.free_savings_contributions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
