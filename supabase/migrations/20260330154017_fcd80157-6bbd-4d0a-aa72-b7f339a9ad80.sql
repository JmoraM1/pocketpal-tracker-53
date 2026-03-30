
CREATE TABLE public.installment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  num_installments integer NOT NULL DEFAULT 1,
  installment_amount numeric NOT NULL DEFAULT 0,
  paid_installments integer NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anonymous installment_plans" ON public.installment_plans
  FOR SELECT TO anon USING (false);

CREATE POLICY "Users manage own installment plans" ON public.installment_plans
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.installment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  payment_number integer NOT NULL,
  due_month date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anonymous installment_payments" ON public.installment_payments
  FOR SELECT TO anon USING (false);

CREATE POLICY "Users manage own installment payments" ON public.installment_payments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
