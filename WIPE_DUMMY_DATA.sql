-- ============================================================================
-- JGOLD SIGNATURES - WIPE DUMMY ORDERS & CUSTOMER ACCOUNTS
-- ============================================================================
-- Copy and run this script inside your Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/figbzrnlgyrjkzxjwctj/sql/new)
-- ============================================================================

-- 1. Wipe all orders
TRUNCATE TABLE public.orders RESTART IDENTITY CASCADE;

-- 2. Delete all customer accounts (auth.users), retaining admin users.
-- We safeguard admins by checking:
--   a) role inside public.profiles is 'admin'
--   b) raw_app_meta_data role is 'admin'
--   c) email is 'admin@jgoldsignatures.com.ng' or 'ebonyjuliet15@yahoo.com'
DELETE FROM auth.users 
WHERE id NOT IN (
  SELECT id FROM public.profiles WHERE role = 'admin'
)
AND COALESCE(raw_app_meta_data->>'role', '') <> 'admin'
AND email NOT IN ('admin@jgoldsignatures.com.ng', 'ebonyjuliet15@yahoo.com');
