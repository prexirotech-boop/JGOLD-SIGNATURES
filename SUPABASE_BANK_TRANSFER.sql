-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE BANK TRANSFER PAYMENTS SETUP
-- Run this in your Supabase SQL Editor to support direct bank transfers
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add bank_receipt_url column to orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bank_receipt_url TEXT;

-- 2. Create the payment-receipts storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Setup permissive storage policies for uploading receipts
--    Allows both anonymous (guest checkouts) and authenticated users to upload and view receipts
DROP POLICY IF EXISTS "Anyone can upload payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view payment receipts" ON storage.objects;

CREATE POLICY "Anyone can upload payment receipts"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Anyone can view payment receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-receipts');
