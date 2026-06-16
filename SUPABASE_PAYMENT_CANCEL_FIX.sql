-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE HOTFIX — RUN THIS IN YOUR SUPABASE DASHBOARD SQL EDITOR
-- ═══════════════════════════════════════════════════════════════════════════
--
-- THE PROBLEM:
-- The existing RLS policy "payment callback pending to paid" on the "orders"
-- table only allowed updating a pending order status to 'paid' or 'abandoned'.
-- When a user cancelled a checkout payment, the client tried to update the 
-- status to 'cancelled', which was blocked by the database's check constraint.
--
-- THE FIX:
-- Replace the policy with one that includes 'cancelled' in the permitted check.

-- 1. Drop the old restrictive update policy
DROP POLICY IF EXISTS "payment callback pending to paid" ON public.orders;

-- 2. Re-create the update policy with 'cancelled' included
CREATE POLICY "payment callback pending to paid"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (status IN ('paid', 'abandoned', 'cancelled'));
