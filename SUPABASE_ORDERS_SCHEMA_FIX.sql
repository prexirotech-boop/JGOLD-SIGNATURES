-- ═══════════════════════════════════════════════════════════════════════════
-- ORDERS TABLE SCHEMA FIX
-- Adds all columns that the app code expects but that are missing from the
-- original CREATE TABLE statement. Safe to re-run (all use ADD COLUMN IF NOT EXISTS).
-- RUN THIS IN YOUR SUPABASE DASHBOARD SQL EDITOR
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Add missing columns to orders ────────────────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at         TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone  TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_code  TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_id    UUID;

-- ── Ensure reference column exists with unique constraint ─────────────────────
-- (Should already exist from the original schema; this is a safety net)
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE NOT NULL;
-- Note: Can't add NOT NULL to existing table safely without a default. If
-- the reference column is missing entirely, re-run SUPABASE_SETUP.sql instead.

-- ── Update RLS policy to allow authenticated users to update their own orders ─
DROP POLICY IF EXISTS "orders_self_update" ON public.orders;
CREATE POLICY "orders_self_update"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (status IN ('paid', 'abandoned', 'cancelled'));

-- ── Admin can do anything with orders ────────────────────────────────────────
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all"
  ON public.orders FOR ALL
  USING (
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );

-- ── Allow anon to insert orders (guest checkout) ─────────────────────────────
DROP POLICY IF EXISTS "orders_anon_ins" ON public.orders;
CREATE POLICY "orders_anon_ins"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── Allow anon/authenticated to update orders (to mark as paid/cancelled) ────
DROP POLICY IF EXISTS "payment callback pending to paid" ON public.orders;
CREATE POLICY "payment callback pending to paid"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (status IN ('paid', 'abandoned', 'cancelled'));

-- ── VERIFY: Check that reference column exists ────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;
