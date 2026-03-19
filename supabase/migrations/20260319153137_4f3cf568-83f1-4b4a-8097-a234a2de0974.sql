
CREATE POLICY "Deny anonymous moto_expenses" ON public.moto_expenses FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous moto_savings_goals" ON public.moto_savings_goals FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous moto_savings_contributions" ON public.moto_savings_contributions FOR SELECT TO anon USING (false);
