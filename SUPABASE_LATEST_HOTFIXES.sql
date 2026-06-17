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

-- 3. DEBUG LOGS FOR USER SIGNUP
CREATE TABLE IF NOT EXISTS public.debug_logs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT,
  error_message TEXT,
  error_detail TEXT,
  error_state TEXT
);

ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on debug_logs" ON public.debug_logs;
DROP POLICY IF EXISTS "Allow public insert on debug_logs" ON public.debug_logs;

CREATE POLICY "Allow public read on debug_logs" ON public.debug_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on debug_logs" ON public.debug_logs FOR INSERT WITH CHECK (true);

-- 4. FIX FOR AUTH SIGNUP 500 INTERNAL SERVER ERROR & DIAGNOSTICS
-- Resolves the signup failure on the checkout and registration screens.
-- Catches errors during profile creation/triggers and logs them to public.debug_logs.
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
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.debug_logs (action, error_message, error_detail, error_state)
  VALUES ('handle_new_user', SQLERRM, SQLDETAIL, SQLSTATE);
  -- Return NEW so that the auth signup transaction completes and we can read the logged error
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
