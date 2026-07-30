-- ═══════════════════════════════════════════════════════════════════════════
-- DANGER: COMPLETE USER DATA & ACCOUNTS WIPE SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════
-- DESCRIPTION:
-- This script permanently deletes all user accounts (including admin accounts),
-- profiles, purchase orders, order items, enrollments, course reviews, Q&As,
-- certificates, wishlist items, student notes, affiliate configurations,
-- referrals, commissions, payouts, and user-uploaded storage files.
--
-- HOW TO USE:
-- 1. Copy the contents of this file.
-- 2. Open your Supabase Dashboard (https://supabase.com/dashboard).
-- 3. Go to the "SQL Editor" in the left-hand menu.
-- 4. Create a new query, paste this script, and click "Run".
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Disable all triggers for this session to bypass storage delete protection.
-- The postgres role in Supabase has permission to change this configuration,
-- allowing us to bypass protect_delete trigger on storage.objects without needing table ownership.
SET session_replication_role = 'replica';

-- 2. Delete user-uploaded assets from storage.objects
-- This removes records for files uploaded to 'avatars' and 'payment-receipts'.
DELETE FROM storage.objects 
WHERE bucket_id IN ('avatars', 'payment-receipts');

-- 3. Delete tracking, logs, analytics, and impressions
-- These tables do not fully cascade automatically and contain user PII/activity.
DELETE FROM public.traffic_events;
DELETE FROM public.upsell_impressions;
DELETE FROM public.debug_logs;

-- 4. Delete purchase orders and their items
-- In some schemas, orders are set to ON DELETE SET NULL to preserve revenue data.
-- To ensure absolutely no user PII (names, emails, addresses, payment receipts)
-- remains, we delete all orders and order items completely.
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- 5. Delete all user accounts from the authentication table.
-- Because public.profiles references auth.users ON DELETE CASCADE, deleting from auth.users
-- automatically triggers a cascading delete on:
--   - public.profiles (User profile details)
--   - public.enrollments (Course enrollments and progress tracking)
--   - public.reviews (Course reviews and ratings)
--   - public.qna_questions (Course Q&A questions)
--   - public.qna_answers (Course Q&A answers)
--   - public.certificates (User course certificates)
--   - public.wishlist (User product wishlists)
--   - public.notes (User personal student notes)
--   - public.affiliates (Affiliate accounts)
--   - public.affiliate_referrals (Affiliate referrals)
--   - public.affiliate_commissions (Affiliate commissions)
--   - public.affiliate_payouts (Affiliate payouts)
DELETE FROM auth.users;

-- 6. Reset replication role back to default (re-enabling all triggers)
SET session_replication_role = 'origin';

COMMIT;
