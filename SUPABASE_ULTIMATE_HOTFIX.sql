-- ═══════════════════════════════════════════════════════════════════════════
-- 🛡️ ULTIMATE PLATFORM DATABASE HOTFIX & RECOVERY SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════
-- RUN THIS IN YOUR SUPABASE DASHBOARD SQL EDITOR (https://supabase.com/dashboard)
-- This fixes:
--   1. Broken signup trigger (role constraint violation and affiliate trigger crashes).
--   2. Missing profiles for users who signed up while the trigger was failing.
--   3. Missing student enrollments for paid course orders.
--   4. RLS policies preventing frontend from creating enrollments and processing orders.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. CLEAN UP CRASH-PRONE TRIGGERS ON PROFILES ──────────────────────────
-- Drop triggers that fire BEFORE/AFTER profiles insert and cause the transaction to fail.
DROP TRIGGER IF EXISTS trigger_assign_affiliate_code ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_role ON public.profiles;
DROP TRIGGER IF EXISTS trigger_create_affiliate ON public.profiles;

-- ── 2. CREATE ROBUST AUTH SIGNUP TRIGGER FUNCTION ─────────────────────────
-- Uses 'user' (valid role) and wraps in exception block to never crash signups.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log warning to DB logs and let auth signup transaction complete
  RAISE WARNING 'handle_new_user error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. BACKFILL MISSING PROFILES ──────────────────────────────────────────
-- Create profile rows for any users who signed up but do not have a profile row.
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
  'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ── 4. FIX ENROLLMENTS TABLE RLS POLICIES ─────────────────────────────────
-- Allows the frontend to query and insert enrollments during checkout and dashboard recovery.
DROP POLICY IF EXISTS "enrollments_self"           ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_self_upd"       ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_admin_all"      ON public.enrollments;
DROP POLICY IF EXISTS "users can read own enrollments"    ON public.enrollments;
DROP POLICY IF EXISTS "users can insert own enrollments"  ON public.enrollments;
DROP POLICY IF EXISTS "users can update own enrollments"  ON public.enrollments;
DROP POLICY IF EXISTS "service role can insert enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "admins full access to enrollments"   ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_read_own"       ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update_own"     ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_authenticated" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_anon"     ON public.enrollments;

-- Select policy: User can view their own enrollments
CREATE POLICY "enrollments_read_own"
  ON public.enrollments FOR SELECT
  TO authenticated, anon
  USING (user_id = auth.uid());

-- Update policy: User can update their own progress
CREATE POLICY "enrollments_update_own"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Insert policy: Authenticated users can insert their own enrollments
CREATE POLICY "enrollments_insert_authenticated"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Insert policy: Anon checkout can insert enrollments
CREATE POLICY "enrollments_insert_anon"
  ON public.enrollments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admin policy: Admins can do anything
CREATE POLICY "enrollments_admin_all"
  ON public.enrollments FOR ALL
  USING (
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );

-- ── 5. FIX ORDERS TABLE RLS POLICIES ──────────────────────────────────────
DROP POLICY IF EXISTS "orders_anon_ins" ON public.orders;
DROP POLICY IF EXISTS "orders_self_update" ON public.orders;
DROP POLICY IF EXISTS "anyone can insert orders" ON public.orders;

-- Allow anyone (guest checkout or authenticated) to create orders
CREATE POLICY "anyone can insert orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow updates (marking order as paid / cancelled)
CREATE POLICY "orders_self_update"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (status IN ('paid', 'abandoned', 'cancelled'));

-- ── 6. BACKFILL MISSING ENROLLMENTS FOR PAID ORDERS ───────────────────────
-- Finds all paid orders for courses, matches them with profiles, and grants access.
INSERT INTO public.enrollments (user_id, course_id, progress)
SELECT DISTINCT
  p.id          AS user_id,
  o.product_id  AS course_id,
  '[]'::jsonb   AS progress
FROM public.orders o
JOIN public.profiles p   ON LOWER(p.email) = LOWER(o.customer_email)
JOIN public.products pr  ON pr.id = o.product_id AND pr.type = 'course'
WHERE o.status = 'paid'
  AND o.product_id IS NOT NULL
  AND p.id IS NOT NULL
ON CONFLICT (user_id, course_id) DO NOTHING;

-- ── 7. VERIFY RECOVERY STATUS ─────────────────────────────────────────────
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) AS total_profiles,
  (SELECT COUNT(*) FROM public.enrollments) AS total_enrollments,
  (SELECT COUNT(*) FROM public.orders WHERE status = 'paid') AS total_paid_orders;
