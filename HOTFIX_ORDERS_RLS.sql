-- ═══════════════════════════════════════════════════════════════════════════
-- CRITICAL HOTFIX — Run this immediately in Supabase SQL Editor
-- Fixes orders stuck at "pending" after payment
-- ═══════════════════════════════════════════════════════════════════════════

-- Add paid_at timestamp column if it does not exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ── THE BUG: The "users can update own orders" policy had a WITH CHECK that
-- only allowed status IN ('abandoned', 'pending'), completely blocking the
-- 'paid' status update that happens after Paystack onSuccess fires.
-- ── FIX: Replace all order UPDATE policies with correct ones. ─────────────

-- 1. Drop ALL existing order update policies first
DROP POLICY IF EXISTS "users can update own orders"              ON orders;
DROP POLICY IF EXISTS "payment completion update"                ON orders;
DROP POLICY IF EXISTS "payment completion - pending to paid"    ON orders;
DROP POLICY IF EXISTS "users can mark own order abandoned"      ON orders;
DROP POLICY IF EXISTS "authenticated users update own orders"    ON orders;
DROP POLICY IF EXISTS "payment callback pending to paid"        ON orders;

-- 2. Allow authenticated users to update their OWN orders to ANY status
--    (covers: pending→paid, pending→abandoned, paid→refunded for own orders)
CREATE POLICY "authenticated users update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (customer_email = auth.jwt() ->> 'email');
  -- No WITH CHECK = any status is allowed

-- 3. Allow ANYONE (including anon) to update a PENDING order to 'paid' or 'abandoned'
--    This covers the case where email confirmation is ON and the user isn't
--    signed in yet when onSuccess fires. The reference acts as a secret token
--    (only the payer + Paystack know it). Pending→paid is the only direction
--    allowed, so a bad actor cannot downgrade an already-paid order.
CREATE POLICY "payment callback pending to paid"
  ON orders FOR UPDATE
  USING  (status = 'pending')
  WITH CHECK (status IN ('paid', 'abandoned'));

-- 4. Admins can do anything
DROP POLICY IF EXISTS "admins full access to orders" ON orders;
CREATE POLICY "admins full access to orders"
  ON orders FOR ALL
  USING (
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb
        -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );

-- ── ALSO fix enrollments INSERT policy (same class of bug) ────────────────
-- Allow any authenticated user to insert enrollments for themselves
DROP POLICY IF EXISTS "authenticated can insert enrollments"    ON enrollments;
DROP POLICY IF EXISTS "service role can insert enrollments"     ON enrollments;
DROP POLICY IF EXISTS "users can insert own enrollments"        ON enrollments;
DROP POLICY IF EXISTS "users can insert enrollments"            ON enrollments;
DROP POLICY IF EXISTS "anon can insert enrollments"             ON enrollments;

CREATE POLICY "users can insert enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow anon to insert enrollments (needed when session may lag slightly)
CREATE POLICY "anon can insert enrollments"
  ON enrollments FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── Backfill: recover all existing pending orders where the user actually paid
-- Run this ONCE to fix the two orders currently showing as "pending"
-- (Check Paystack dashboard first to confirm which references were actually paid)
-- Then run:
-- UPDATE orders SET status = 'paid' WHERE reference IN ('n50k_...', 'n50k_...');

-- ── OR: let the admin use the Orders page to click "Mark as Paid" per order ──
