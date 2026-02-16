-- Limit category name length
ALTER TABLE public.user_categories
ADD CONSTRAINT category_name_length
CHECK (char_length(name) > 0 AND char_length(name) <= 50);

-- Validate expense amounts (positive, reasonable range)
ALTER TABLE public.expenses
ADD CONSTRAINT expense_amount_positive
CHECK (amount >= 0 AND amount <= 999999999);

-- Limit description length
ALTER TABLE public.expenses
ADD CONSTRAINT description_length
CHECK (description IS NULL OR char_length(description) <= 200);

-- Validate budget income (positive, reasonable range)
ALTER TABLE public.monthly_budgets
ADD CONSTRAINT income_positive
CHECK (income >= 0 AND income <= 999999999);