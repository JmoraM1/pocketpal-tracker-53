
-- Table to store WebAuthn credentials (passkeys)
CREATE TABLE public.webauthn_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT DEFAULT 'Dispositivo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint on credential_id
ALTER TABLE public.webauthn_credentials ADD CONSTRAINT webauthn_credentials_credential_id_key UNIQUE (credential_id);

-- Enable RLS
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own credentials
CREATE POLICY "Users can select own webauthn credentials"
  ON public.webauthn_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webauthn credentials"
  ON public.webauthn_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webauthn credentials"
  ON public.webauthn_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webauthn credentials"
  ON public.webauthn_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Table to store temporary challenges
CREATE TABLE public.webauthn_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS - challenges accessed via edge functions with service role
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- No direct client access - edge functions use service role key
-- Clean up old challenges (older than 5 minutes) via a function
CREATE OR REPLACE FUNCTION public.cleanup_old_challenges()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.webauthn_challenges WHERE created_at < now() - interval '5 minutes';
END;
$$;
