
-- Create user_categories table for dynamic category management
CREATE TABLE public.user_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users manage own categories"
ON public.user_categories
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Unique constraint per user
CREATE UNIQUE INDEX idx_user_categories_unique ON public.user_categories (user_id, name);
