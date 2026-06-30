CREATE OR REPLACE FUNCTION public.sync_savings_goal_completion_from_goal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  saved_total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO saved_total
  FROM public.savings_goal_contributions
  WHERE goal_id = NEW.id;

  IF NEW.is_completed THEN
    RETURN NEW;
  END IF;

  IF NEW.target_amount > 0 AND saved_total >= NEW.target_amount THEN
    NEW.is_completed := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_savings_goal_completion_from_goal ON public.savings_goals;

CREATE TRIGGER trg_sync_savings_goal_completion_from_goal
BEFORE UPDATE OF target_amount ON public.savings_goals
FOR EACH ROW
EXECUTE FUNCTION public.sync_savings_goal_completion_from_goal();

REVOKE ALL ON FUNCTION public.sync_savings_goal_completion_from_goal() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_savings_goal_completion_from_goal() FROM anon;
REVOKE ALL ON FUNCTION public.sync_savings_goal_completion_from_goal() FROM authenticated;