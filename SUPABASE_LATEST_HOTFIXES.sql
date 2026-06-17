-- ═══════════════════════════════════════════════════════════════════════════
-- CONSOLIDATED HOTFIXES — RUN THIS IN YOUR SUPABASE DASHBOARD SQL EDITOR
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. FIX FOR LEAD COLLECTION FORM RLS ERROR
-- Allows both anonymous visitors and authenticated users to submit the free training signup form.
ALTER TABLE public.freelance_training_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert on freelance_training_list" ON public.freelance_training_list;
DROP POLICY IF EXISTS "Allow public insert on freelance_training_list" ON public.freelance_training_list;

CREATE POLICY "Allow public insert on freelance_training_list"
  ON public.freelance_training_list FOR INSERT
  WITH CHECK (true);

-- 2. FIX FOR PAYMENT CANCELLED STATUS stuck at "pending"
-- Allows updating the status of a pending order to 'cancelled' when a checkout session is closed.
DROP POLICY IF EXISTS "payment callback pending to paid" ON public.orders;

CREATE POLICY "payment callback pending to paid"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (status IN ('paid', 'abandoned', 'cancelled'));

-- 3. FIX FOR AUTH SIGNUP 500 INTERNAL SERVER ERROR
-- Resolves the signup failure on the checkout and registration screens.
-- The trigger public.handle_new_user() previously defaulted the role to 'student',
-- which violates the profiles check constraint CHECK (role IN ('user', 'admin')).
-- This fixes the default to 'user' so that all user account generation succeeds.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
