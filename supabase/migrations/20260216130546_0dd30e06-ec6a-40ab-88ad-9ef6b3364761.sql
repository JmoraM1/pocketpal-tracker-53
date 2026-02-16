-- Explicitly deny anonymous/public SELECT access to expenses
CREATE POLICY "Deny anonymous access"
ON public.expenses
FOR SELECT
TO anon
USING (false);