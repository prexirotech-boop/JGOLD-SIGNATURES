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
