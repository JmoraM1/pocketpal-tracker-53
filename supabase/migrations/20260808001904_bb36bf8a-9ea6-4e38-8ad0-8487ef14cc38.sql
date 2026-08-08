ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'COP';
ALTER TABLE public.monthly_budgets ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'COP';
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'COP';
ALTER TABLE public.free_savings ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'COP';
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'COP';