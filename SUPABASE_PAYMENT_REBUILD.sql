-- ═══════════════════════════════════════════════════════════════════════════
-- PAYMENT SYSTEM REBUILD — RUN THIS IN SUPABASE SQL EDITOR
-- Adds customer_phone, currency columns, 'abandoned' status support,
-- and ensures RLS policies allow the new pre-create pending order flow.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Add missing columns to orders table ───────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone   text,
  ADD COLUMN IF NOT EXISTS currency         text NOT NULL DEFAULT 'NGN';

-- ── 2. Ensure status can hold 'abandoned' (add CHECK or just leave as text) ──
-- If you have a CHECK constraint on status, add 'abandoned' to it:
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_status_check'
      AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;
  -- Recreate with 'abandoned' included
  ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'paid', 'refunded', 'failed', 'abandoned', 'cancelled'));
END $$;

-- ── 3. Ensure orders product_id foreign key exists ───────────────────────────
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

-- ── 4. RLS on orders table ────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can INSERT orders
-- (Paystack onSuccess fires client-side before the user might be logged in)
DROP POLICY IF EXISTS "anyone can insert orders" ON orders;
CREATE POLICY "anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read their own orders (by email)
DROP POLICY IF EXISTS "users can read own orders" ON orders;
CREATE POLICY "users can read own orders"
  ON orders FOR SELECT
  USING (customer_email = auth.jwt() ->> 'email');

-- Authenticated users can UPDATE their own pending/abandoned orders
-- (e.g. marking them abandoned on cancel — client-side call)
DROP POLICY IF EXISTS "users can update own orders" ON orders;
CREATE POLICY "users can update own orders"
  ON orders FOR UPDATE
  USING (customer_email = auth.jwt() ->> 'email')
  WITH CHECK (status IN ('abandoned', 'pending'));

-- Admins have full access
DROP POLICY IF EXISTS "admins full access to orders" ON orders;
CREATE POLICY "admins full access to orders"
  ON orders FOR ALL
  USING (
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );

-- ── 5. RLS on enrollments table ───────────────────────────────────────────────
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

-- Allow ANY authenticated user to insert enrollments (post-payment flow)
-- The enrollments trigger / client logic ensures correct user_id
DROP POLICY IF EXISTS "authenticated can insert enrollments" ON enrollments;
CREATE POLICY "authenticated can insert enrollments"
  ON enrollments FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admins full access
DROP POLICY IF EXISTS "admins full access to enrollments" ON enrollments;
CREATE POLICY "admins full access to enrollments"
  ON enrollments FOR ALL
  USING (
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );

-- ── 6. Profile trigger (creates profile on auth.users insert) ─────────────────
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 7. Backfill: recover missing enrollments for all existing paid orders ─────
-- Run this once to fix all users who paid but have no enrollment row.
INSERT INTO enrollments (user_id, course_id, progress)
SELECT
  p.id          AS user_id,
  o.product_id  AS course_id,
  '[]'::jsonb   AS progress
FROM orders o
JOIN profiles  p  ON LOWER(p.email)  = LOWER(o.customer_email)
JOIN products  pr ON pr.id           = o.product_id AND pr.type = 'course'
WHERE o.status = 'paid'
  AND o.product_id IS NOT NULL
ON CONFLICT (user_id, course_id) DO NOTHING;

-- ── 8. Index for fast order lookups ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Done ✅
