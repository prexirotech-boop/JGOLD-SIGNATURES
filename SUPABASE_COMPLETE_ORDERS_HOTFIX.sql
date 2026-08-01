-- ═══════════════════════════════════════════════════════════════════════════
-- COMPLETE ORDERS TABLE SCHEMA HOTFIX
-- Adds all columns that the React app expects but that are missing from the
-- original CREATE TABLE statement in your database.
-- Run this in your Supabase Dashboard SQL Editor to allow full shipping/tracking setup.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Add all missing order columns ──────────────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at               TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone        TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_code        TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_id          UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity              INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_name          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_phone         TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_country       TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_postal_code  TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_notes         TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_status        TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number       TEXT;

-- ── 2. Verify that all columns exist on the table ──────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY column_name;
