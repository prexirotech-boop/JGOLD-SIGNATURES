-- ═══════════════════════════════════════════════════════════════════════════
-- MIFAS FARMS — SUPABASE ORDERS RLS POLICY HOTFIX
-- Run this in your Supabase SQL Editor if Paystack orders do not automatically 
-- update to "Paid" on successful transaction.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. DROP EXISTING CONFLICTING POLICIES IF PRESENT
DROP POLICY IF EXISTS "payment callback pending to paid" ON public.orders;
DROP POLICY IF EXISTS "orders_update_status" ON public.orders;

-- 2. CREATE THE AUTO-VERIFICATION PAYMENT POLICY
-- Allows anon and authenticated sessions (from Paystack popup callbacks) to 
-- update order statuses that are currently 'pending' to 'paid', 'abandoned', or 'cancelled'.
CREATE POLICY "payment callback pending to paid"
  ON public.orders
  FOR UPDATE
  TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (status IN ('paid', 'abandoned', 'cancelled'));

-- 3. ENABLE RLS FOR THE ORDERS TABLE (IN CASE DISABLED)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. CONFIRM ADMIN HAS ALL PRIVILEGES
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL USING (public.is_admin());
