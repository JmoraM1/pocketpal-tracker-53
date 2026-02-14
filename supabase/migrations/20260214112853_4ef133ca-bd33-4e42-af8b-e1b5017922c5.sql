
-- Drop the existing restrictive policy (which doesn't work correctly alone)
DROP POLICY IF EXISTS "Users manage own expenses" ON public.expenses;

-- Create proper permissive policies
CREATE POLICY "Users can select own expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
ON public.expenses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
ON public.expenses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
