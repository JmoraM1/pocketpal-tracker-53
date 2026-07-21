ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE OR REPLACE FUNCTION public.sync_installment_plan_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_plan_id uuid;
  paid_count integer;
  total_installments integer;
  was_completed boolean;
  will_complete boolean;
BEGIN
  target_plan_id := COALESCE(NEW.plan_id, OLD.plan_id);

  SELECT COUNT(*) FILTER (WHERE is_paid)
  INTO paid_count
  FROM public.installment_payments
  WHERE plan_id = target_plan_id;

  SELECT num_installments, is_completed
  INTO total_installments, was_completed
  FROM public.installment_plans
  WHERE id = target_plan_id;

  will_complete := total_installments > 0 AND paid_count >= total_installments;

  UPDATE public.installment_plans
  SET
    paid_installments = paid_count,
    is_completed = CASE
      WHEN was_completed THEN true
      WHEN will_complete THEN true
      ELSE false
    END,
    completed_at = CASE
      WHEN was_completed THEN completed_at
      WHEN will_complete THEN now()
      ELSE NULL
    END
  WHERE id = target_plan_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;