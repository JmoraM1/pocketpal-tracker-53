CREATE TABLE public.additional_incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  month date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  is_recurring boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'COP',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.additional_incomes TO authenticated;
GRANT ALL ON public.additional_incomes TO service_role;

ALTER TABLE public.additional_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own additional incomes"
ON public.additional_incomes FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous additional_incomes"
ON public.additional_incomes FOR SELECT TO anon
USING (false);

CREATE INDEX idx_additional_incomes_user_month ON public.additional_incomes (user_id, month);

CREATE TRIGGER trg_additional_incomes_updated
BEFORE UPDATE ON public.additional_incomes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();