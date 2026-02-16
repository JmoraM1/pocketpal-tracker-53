
ALTER TABLE public.user_categories
ADD COLUMN is_cumulative_savings boolean NOT NULL DEFAULT false;
