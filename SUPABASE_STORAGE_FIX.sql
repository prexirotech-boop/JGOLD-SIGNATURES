-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE STORAGE FIX — Run this in your Supabase SQL Editor
-- Fixes: "new row violates row-level security policy" on course-assets bucket
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Allow authenticated users to upload files into course-assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. DROP existing storage object policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload course assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course assets" ON storage.objects;
DROP POLICY IF EXISTS "course-assets public read" ON storage.objects;
DROP POLICY IF EXISTS "course-assets auth upload" ON storage.objects;
DROP POLICY IF EXISTS "course-assets auth delete" ON storage.objects;

-- 3. CREATE storage policies for course-assets

-- Allow any authenticated user to upload (INSERT)
CREATE POLICY "course-assets auth upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-assets');

-- Allow public (anon + authenticated) to read/download objects (SELECT)
CREATE POLICY "course-assets public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-assets');

-- Allow authenticated users to update and delete their own uploads
CREATE POLICY "course-assets auth delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'course-assets');

-- ═══════════════════════════════════════════════════════════════════════════
-- SETTINGS TABLE — Fix: allow anonymous visitors to read branding config
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "settings_public_read" ON settings;
DROP POLICY IF EXISTS "settings_admin_write" ON settings;

ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_public_read"
ON settings FOR SELECT
USING (true);

CREATE POLICY "settings_admin_write"
ON settings FOR ALL
USING (
  coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
    ''
  ) = 'admin'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- FORCE SYNC ADMIN ROLE — Run to sync the admin's profile role to JWT claims
-- (Only needed if admin login was set up before the sync trigger was created)
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE public.profiles SET role = role WHERE role = 'admin';
