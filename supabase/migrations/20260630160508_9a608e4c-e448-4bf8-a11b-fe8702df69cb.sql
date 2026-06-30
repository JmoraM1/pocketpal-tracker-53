REVOKE ALL ON FUNCTION public.sync_savings_goal_completion() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_savings_goal_completion() FROM anon;
REVOKE ALL ON FUNCTION public.sync_savings_goal_completion() FROM authenticated;

REVOKE ALL ON FUNCTION public.sync_installment_plan_completion() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_installment_plan_completion() FROM anon;
REVOKE ALL ON FUNCTION public.sync_installment_plan_completion() FROM authenticated;