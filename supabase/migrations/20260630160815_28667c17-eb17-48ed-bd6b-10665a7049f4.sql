CREATE POLICY "No direct client access to webauthn challenges"
ON public.webauthn_challenges
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No anonymous access to webauthn challenges"
ON public.webauthn_challenges
FOR ALL
TO anon
USING (false)
WITH CHECK (false);