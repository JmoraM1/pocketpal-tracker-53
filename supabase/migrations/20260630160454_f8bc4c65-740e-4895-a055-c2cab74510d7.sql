CREATE OR REPLACE FUNCTION public.sync_savings_goal_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_goal_id uuid;
  saved_total numeric;
  target_total numeric;
BEGIN
  target_goal_id := COALESCE(NEW.goal_id, OLD.goal_id);

  SELECT COALESCE(SUM(amount), 0)
  INTO saved_total
  FROM public.savings_goal_contributions
  WHERE goal_id = target_goal_id;

  SELECT target_amount
  INTO target_total
  FROM public.savings_goals
  WHERE id = target_goal_id;

  UPDATE public.savings_goals
  SET is_completed = true
  WHERE id = target_goal_id
    AND is_completed = false
    AND target_total > 0
    AND saved_total >= target_total;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_savings_goal_completion_insert ON public.savings_goal_contributions;
DROP TRIGGER IF EXISTS trg_sync_savings_goal_completion_update ON public.savings_goal_contributions;
DROP TRIGGER IF EXISTS trg_sync_savings_goal_completion_delete ON public.savings_goal_contributions;

CREATE TRIGGER trg_sync_savings_goal_completion_insert
AFTER INSERT ON public.savings_goal_contributions
FOR EACH ROW
EXECUTE FUNCTION public.sync_savings_goal_completion();

CREATE TRIGGER trg_sync_savings_goal_completion_update
AFTER UPDATE OF amount, goal_id ON public.savings_goal_contributions
FOR EACH ROW
EXECUTE FUNCTION public.sync_savings_goal_completion();

CREATE TRIGGER trg_sync_savings_goal_completion_delete
AFTER DELETE ON public.savings_goal_contributions
FOR EACH ROW
EXECUTE FUNCTION public.sync_savings_goal_completion();

CREATE OR REPLACE FUNCTION public.sync_installment_plan_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_plan_id uuid;
  paid_count integer;
  total_installments integer;
BEGIN
  target_plan_id := COALESCE(NEW.plan_id, OLD.plan_id);

  SELECT COUNT(*) FILTER (WHERE is_paid)
  INTO paid_count
  FROM public.installment_payments
  WHERE plan_id = target_plan_id;

  SELECT num_installments
  INTO total_installments
  FROM public.installment_plans
  WHERE id = target_plan_id;

  UPDATE public.installment_plans
  SET
    paid_installments = paid_count,
    is_completed = CASE
      WHEN is_completed THEN true
      WHEN total_installments > 0 AND paid_count >= total_installments THEN true
      ELSE false
    END
  WHERE id = target_plan_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_installment_plan_completion_insert ON public.installment_payments;
DROP TRIGGER IF EXISTS trg_sync_installment_plan_completion_update ON public.installment_payments;
DROP TRIGGER IF EXISTS trg_sync_installment_plan_completion_delete ON public.installment_payments;

CREATE TRIGGER trg_sync_installment_plan_completion_insert
AFTER INSERT ON public.installment_payments
FOR EACH ROW
EXECUTE FUNCTION public.sync_installment_plan_completion();

CREATE TRIGGER trg_sync_installment_plan_completion_update
AFTER UPDATE OF is_paid, plan_id ON public.installment_payments
FOR EACH ROW
EXECUTE FUNCTION public.sync_installment_plan_completion();

CREATE TRIGGER trg_sync_installment_plan_completion_delete
AFTER DELETE ON public.installment_payments
FOR EACH ROW
EXECUTE FUNCTION public.sync_installment_plan_completion();

UPDATE public.savings_goals sg
SET is_completed = true
WHERE sg.is_completed = false
  AND sg.target_amount > 0
  AND COALESCE((
    SELECT SUM(sgc.amount)
    FROM public.savings_goal_contributions sgc
    WHERE sgc.goal_id = sg.id
  ), 0) >= sg.target_amount;

UPDATE public.installment_plans ip
SET
  paid_installments = counts.paid_count,
  is_completed = CASE
    WHEN ip.is_completed THEN true
    WHEN ip.num_installments > 0 AND counts.paid_count >= ip.num_installments THEN true
    ELSE false
  END
FROM (
  SELECT plan_id, COUNT(*) FILTER (WHERE is_paid) AS paid_count
  FROM public.installment_payments
  GROUP BY plan_id
) counts
WHERE counts.plan_id = ip.id;