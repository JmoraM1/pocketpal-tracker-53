-- 1. A passkey credential can never be claimed by two accounts
DELETE FROM public.webauthn_credentials a
USING public.webauthn_credentials b
WHERE a.credential_id = b.credential_id AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS webauthn_credentials_credential_id_key
  ON public.webauthn_credentials (credential_id);

-- 2. Restrict permissive PUBLIC-role policies to authenticated users only
DROP POLICY IF EXISTS "Users can select own webauthn credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can insert own webauthn credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can update own webauthn credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can delete own webauthn credentials" ON public.webauthn_credentials;

CREATE POLICY "Users can select own webauthn credentials" ON public.webauthn_credentials
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own webauthn credentials" ON public.webauthn_credentials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own webauthn credentials" ON public.webauthn_credentials
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own webauthn credentials" ON public.webauthn_credentials
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own savings_goals" ON public.savings_goals;
CREATE POLICY "own savings_goals" ON public.savings_goals
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own goal contribs" ON public.savings_goal_contributions;
CREATE POLICY "own goal contribs" ON public.savings_goal_contributions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own free_savings" ON public.free_savings;
CREATE POLICY "own free_savings" ON public.free_savings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own free contribs" ON public.free_savings_contributions;
CREATE POLICY "own free contribs" ON public.free_savings_contributions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own budgets" ON public.monthly_budgets;
CREATE POLICY "Users manage own budgets" ON public.monthly_budgets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own categories" ON public.user_categories;
CREATE POLICY "Users manage own categories" ON public.user_categories
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Ensure anon has no table privileges on sensitive tables
REVOKE ALL ON public.webauthn_credentials FROM anon;
REVOKE ALL ON public.webauthn_challenges FROM anon;
REVOKE ALL ON public.savings_goals FROM anon;
REVOKE ALL ON public.savings_goal_contributions FROM anon;
REVOKE ALL ON public.free_savings FROM anon;
REVOKE ALL ON public.free_savings_contributions FROM anon;
REVOKE ALL ON public.monthly_budgets FROM anon;
REVOKE ALL ON public.user_categories FROM anon;
REVOKE ALL ON public.expenses FROM anon;
REVOKE ALL ON public.installment_plans FROM anon;
REVOKE ALL ON public.installment_payments FROM anon;
REVOKE ALL ON public.profiles FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webauthn_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_goal_contributions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.free_savings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.free_savings_contributions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_categories TO authenticated;
GRANT ALL ON public.webauthn_credentials TO service_role;
GRANT ALL ON public.webauthn_challenges TO service_role;