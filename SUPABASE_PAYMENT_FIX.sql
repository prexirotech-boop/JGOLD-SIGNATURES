-- ═══════════════════════════════════════════════════════════════════════════
-- CRITICAL: Run this in your Supabase SQL Editor
-- Fixes the payment → enrollment pipeline end-to-end
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Fix: orders table product_id foreign key (enables join to products) ──
-- Uses a DO block to safely skip if the constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_product_id_fkey'
      AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 2. Fix: RLS on orders table ──
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own orders (dashboard purchase history)
DROP POLICY IF EXISTS "users can read own orders" ON orders;
CREATE POLICY "users can read own orders"
  ON orders FOR SELECT
  USING (customer_email = auth.jwt() ->> 'email');

-- Allow anyone to insert orders (Paystack callback runs client-side)
DROP POLICY IF EXISTS "anyone can insert orders" ON orders;
CREATE POLICY "anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Admins have full access to orders
DROP POLICY IF EXISTS "admins full access to orders" ON orders;
CREATE POLICY "admins full access to orders"
  ON orders FOR ALL
  USING (
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );

-- ── 3. Fix: RLS on enrollments table ──
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own enrollments" ON enrollments;
CREATE POLICY "users can read own enrollments"
  ON enrollments FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users can insert own enrollments" ON enrollments;
CREATE POLICY "users can insert own enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users can update own enrollments" ON enrollments;
CREATE POLICY "users can update own enrollments"
  ON enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- Allow service role / anon to insert enrollments (for post-payment flow)
DROP POLICY IF EXISTS "service role can insert enrollments" ON enrollments;
CREATE POLICY "service role can insert enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (true);

-- Admins have full access to enrollments
DROP POLICY IF EXISTS "admins full access to enrollments" ON enrollments;
CREATE POLICY "admins full access to enrollments"
  ON enrollments FOR ALL
  USING (
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );

-- ── 4. Fix: Storage RLS for course-assets bucket ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "course-assets auth upload" ON storage.objects;
CREATE POLICY "course-assets auth upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-assets');

DROP POLICY IF EXISTS "course-assets public read" ON storage.objects;
CREATE POLICY "course-assets public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'course-assets');

DROP POLICY IF EXISTS "course-assets auth delete" ON storage.objects;
CREATE POLICY "course-assets auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-assets');

-- ── 5. Fix: Profiles trigger — auto-creates profile row on new signup ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. Backfill profiles for existing auth users that don't have one ──
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) AS full_name,
  COALESCE(u.raw_app_meta_data->>'role', 'student') AS role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ── 7. MOST IMPORTANT: Recover enrollments for users who already paid ──
-- This immediately grants course access to everyone who has a paid order
-- but is missing an enrollment row (fixes all existing broken purchases)
INSERT INTO enrollments (user_id, course_id, progress)
SELECT
  p.id          AS user_id,
  o.product_id  AS course_id,
  '{}'          AS progress
FROM orders o
JOIN profiles  p  ON LOWER(p.email)  = LOWER(o.customer_email)
JOIN products  pr ON pr.id           = o.product_id AND pr.type = 'course'
WHERE o.status = 'paid'
  AND o.product_id IS NOT NULL
ON CONFLICT (user_id, course_id) DO NOTHING;
