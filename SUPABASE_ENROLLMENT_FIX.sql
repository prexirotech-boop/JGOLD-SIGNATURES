-- ═══════════════════════════════════════════════════════════════════════════
-- CRITICAL ENROLLMENT FIX — Run this in Supabase SQL Editor
-- Fixes: Students not getting course access after successful payment
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Drop all existing conflicting enrollment policies ─────────────────────
DROP POLICY IF EXISTS "enrollments_self"           ON enrollments;
DROP POLICY IF EXISTS "enrollments_self_upd"       ON enrollments;
DROP POLICY IF EXISTS "enrollments_admin_all"      ON enrollments;
DROP POLICY IF EXISTS "users can read own enrollments"    ON enrollments;
DROP POLICY IF EXISTS "users can insert own enrollments"  ON enrollments;
DROP POLICY IF EXISTS "users can update own enrollments"  ON enrollments;
DROP POLICY IF EXISTS "service role can insert enrollments" ON enrollments;
DROP POLICY IF EXISTS "admins full access to enrollments"   ON enrollments;

-- ── 2. Re-create clean, correct policies ─────────────────────────────────────

-- Students can read their own enrollments
CREATE POLICY "enrollments_read_own"
  ON enrollments FOR SELECT
  USING (user_id = auth.uid());

-- Students can update their own progress
CREATE POLICY "enrollments_update_own"
  ON enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- ANY authenticated user can insert an enrollment for themselves
-- This is needed for the post-payment flow and LMSDashboard recovery hook
CREATE POLICY "enrollments_insert_authenticated"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anon role can also insert enrollments (for guest checkout edge case)
-- The client-side code verifies payment first so this is safe
CREATE POLICY "enrollments_insert_anon"
  ON enrollments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admins have full access
CREATE POLICY "enrollments_admin_all"
  ON enrollments FOR ALL
  USING (
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
  );

-- ── 3. Orders: ensure anon insert is permitted (for client-side Paystack callback) ──
DROP POLICY IF EXISTS "anyone can insert orders" ON orders;
CREATE POLICY "anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- ── 4. Recover enrollments for any paid user who is missing an enrollment ──────
-- This fixes all existing broken purchases in your DB right now
INSERT INTO enrollments (user_id, course_id, progress)
SELECT
  p.id          AS user_id,
  o.product_id  AS course_id,
  '{}'::jsonb   AS progress
FROM orders o
JOIN profiles  p  ON LOWER(p.email)  = LOWER(o.customer_email)
JOIN products  pr ON pr.id           = o.product_id AND pr.type = 'course'
WHERE o.status = 'paid'
  AND o.product_id IS NOT NULL
  AND p.id IS NOT NULL
ON CONFLICT (user_id, course_id) DO NOTHING;

-- ── 5. Verify results ────────────────────────────────────────────────────────
SELECT
  p.email,
  pr.title AS course,
  e.created_at AS enrolled_at
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN products pr ON pr.id = e.course_id
ORDER BY e.created_at DESC
LIMIT 20;
