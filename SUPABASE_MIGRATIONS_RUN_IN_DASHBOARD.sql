-- ═══════════════════════════════════════════════════════════════════════════
-- AMPLIFIED SKILLS — REQUIRED SUPABASE SQL MIGRATIONS
-- Run this ENTIRE script in your Supabase Dashboard → SQL Editor
-- It is safe to re-run (idempotent using IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. ENSURE is_free COLUMN ON PRODUCTS ────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;

-- ─── 2. ENSURE COUPONS TABLE HAS ALL NEEDED COLUMNS ─────────────────────────
-- The coupons table columns used by the app: code, type, value, usage_limit, usage_count, expires_at, is_active
-- Supabase schema has: code, type, value, usage_limit, usage_count, expires_at, is_active
-- If using old schema with 'discount_type' / 'discount_value' column names, add aliases:
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;

-- ─── 3. RLS POLICIES FOR COUPONS (Allow public reads for coupon validation) ──
-- Allow anyone (including unauthenticated) to read active coupons for checkout validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'coupons' 
    AND policyname = 'Public can read active coupons'
  ) THEN
    CREATE POLICY "Public can read active coupons"
    ON coupons FOR SELECT
    TO public
    USING (is_active = TRUE);
  END IF;
END $$;

-- Enable RLS on coupons if not enabled
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- ─── 4. AVATARS STORAGE BUCKET ───────────────────────────────────────────────
-- Create the avatars bucket for profile photos (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  TRUE,
  3145728,  -- 3MB limit
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own avatar'
  ) THEN
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own avatar'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can read avatars'
  ) THEN
    CREATE POLICY "Public can read avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- ─── 5. WISHLIST TABLE + RLS (if not already created) ────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'wishlist' 
    AND policyname = 'Users manage their own wishlist'
  ) THEN
    CREATE POLICY "Users manage their own wishlist"
    ON wishlist FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ─── 6. FIX ENROLLMENT TRIGGER (case-insensitive email matching) ─────────────
-- Drop and recreate the trigger to ensure case-insensitive email matching

CREATE OR REPLACE FUNCTION grant_enrollment_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_product_type TEXT;
BEGIN
  -- Only handle 'paid' status orders
  IF NEW.status <> 'paid' THEN
    RETURN NEW;
  END IF;

  -- Look up user by email (case-insensitive)
  SELECT id INTO v_user_id
  FROM profiles
  WHERE LOWER(email) = LOWER(NEW.customer_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    -- No user yet; enrollment will be handled post-signup
    RETURN NEW;
  END IF;

  -- Get product type
  SELECT type INTO v_product_type
  FROM products
  WHERE id = NEW.product_id;

  -- Only enroll for courses
  IF v_product_type = 'course' AND NEW.product_id IS NOT NULL THEN
    INSERT INTO enrollments (user_id, course_id, progress)
    VALUES (v_user_id, NEW.product_id, '[]'::jsonb)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_order_paid ON orders;
CREATE TRIGGER on_order_paid
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION grant_enrollment_on_order();

-- ─── 7. INSTRUCTOR COLUMN ON COURSES ──────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor TEXT DEFAULT 'Amplified Skills';

-- ─── 8. LESSONS PUBLIC SELECT POLICY ─────────────────────────────────────────
DROP POLICY IF EXISTS "lessons_preview_read" ON lessons;
DROP POLICY IF EXISTS "lessons_enrolled_read" ON lessons;
DROP POLICY IF EXISTS "lessons_public_read" ON lessons;

CREATE POLICY "lessons_public_read" ON lessons FOR SELECT USING (true);

-- ─── DONE ────────────────────────────────────────────────────────────────────
-- All migrations applied. Your platform is ready.
