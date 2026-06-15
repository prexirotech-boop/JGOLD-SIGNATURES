-- ═══════════════════════════════════════════════════════════════════════════
-- AMPLIFIED SKILLS — FULL PLATFORM SCHEMA v2.0
-- Run this in Supabase SQL Editor. Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  role        TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- ─── SETTINGS (key/value platform config) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id         TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('course','ebook','blueprint','bundle')),
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE,
  description   TEXT,
  price         INTEGER NOT NULL DEFAULT 0,
  old_price     INTEGER,
  cover_image   TEXT,
  features      JSONB DEFAULT '[]',
  is_published  BOOLEAN DEFAULT FALSE,
  is_featured   BOOLEAN DEFAULT FALSE,
  is_free       BOOLEAN DEFAULT FALSE,
  meta_title    TEXT,
  meta_desc     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;

-- ─── COURSES (extends products 1:1) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id               UUID REFERENCES products(id) ON DELETE CASCADE PRIMARY KEY,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  level            TEXT DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced','all')),
  language         TEXT DEFAULT 'English',
  what_you_learn   JSONB DEFAULT '[]',
  requirements     JSONB DEFAULT '[]',
  who_is_for       JSONB DEFAULT '[]',
  preview_video    TEXT,
  certificate_enabled BOOLEAN DEFAULT TRUE,
  completion_threshold INTEGER DEFAULT 80,
  total_duration   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MODULES (sections inside a course) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LESSONS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id     UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  title         TEXT NOT NULL,
  type          TEXT DEFAULT 'video' CHECK (type IN ('video','article','quiz')),
  video_url     TEXT,
  wistia_id     TEXT,
  article       TEXT,
  duration      TEXT DEFAULT '0m',
  overview      TEXT,
  resources     JSONB DEFAULT '[]',
  is_free_preview BOOLEAN DEFAULT FALSE,
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN DEFAULT FALSE;

-- ─── ENROLLMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  progress    JSONB DEFAULT '[]',
  completed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               BIGSERIAL PRIMARY KEY,
  reference        TEXT UNIQUE NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_name    TEXT,
  user_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
  amount           INTEGER NOT NULL,
  currency         TEXT DEFAULT 'NGN',
  status           TEXT DEFAULT 'paid',
  payment_method   TEXT DEFAULT 'paystack',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (customer_email);
CREATE INDEX IF NOT EXISTS orders_ref_idx   ON orders (reference);

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── Q&A ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qna_questions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id   UUID REFERENCES lessons(id) ON DELETE SET NULL,
  question    TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qna_answers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES qna_questions(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  answer      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CERTIFICATES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id       UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  certificate_url TEXT,
  issued_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── COUPONS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  type           TEXT DEFAULT 'percentage' CHECK (type IN ('percentage','fixed')),
  value          INTEGER NOT NULL,
  usage_limit    INTEGER,
  usage_count    INTEGER DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN DEFAULT TRUE,
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id   UUID REFERENCES courses(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BLOG POSTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  excerpt      TEXT,
  body         TEXT,
  cover_image  TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WISHLIST ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─── STUDENT NOTES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id   UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  content     TEXT,
  timestamp   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Ensure updated_at column exists on all tables that use the update trigger
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE modules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE tbl TEXT; BEGIN
  FOREACH tbl IN ARRAY ARRAY['profiles','products','courses','modules','lessons','orders','blog_posts','notes'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON %I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl, tbl);
  END LOOP;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Sync profile role to auth.users app_metadata to avoid RLS recursion
CREATE OR REPLACE FUNCTION sync_profile_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_profile_role ON public.profiles;
CREATE TRIGGER trigger_sync_profile_role
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_role_to_auth();

-- Auto-enroll + grant access when order is paid
CREATE OR REPLACE FUNCTION grant_enrollment_on_order() RETURNS TRIGGER AS $$
DECLARE v_user_id UUID; v_type TEXT;
BEGIN
  IF NEW.status = 'paid' AND NEW.product_id IS NOT NULL THEN
    SELECT type INTO v_type FROM products WHERE id = NEW.product_id;
    IF v_type = 'course' THEN
      SELECT id INTO v_user_id FROM profiles WHERE email = NEW.customer_email LIMIT 1;
      IF v_user_id IS NOT NULL THEN
        INSERT INTO enrollments (user_id, course_id)
        VALUES (v_user_id, NEW.product_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_grant_enrollment ON orders;
CREATE TRIGGER trigger_grant_enrollment
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION grant_enrollment_on_order();

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_answers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;

-- Clean up all existing policies on all tables to prevent duplicates and recursion from old setups
DO $$ 
DECLARE 
  tbl TEXT;
  pol RECORD;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'products', 'courses', 'modules', 'lessons', 
    'enrollments', 'orders', 'reviews', 'qna_questions', 'qna_answers', 
    'certificates', 'coupons', 'announcements', 'blog_posts', 'wishlist', 
    'notes', 'settings', 'categories'
  ] LOOP
    FOR pol IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = tbl AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- Helper: is current user an admin? Uses raw JWT claims to prevent table-level recursion.
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
    ''
  ) = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
DROP POLICY IF EXISTS "profiles_self_read"   ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all"   ON profiles;
CREATE POLICY "profiles_self_read"   ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all"   ON profiles FOR ALL    USING (is_admin());

-- SETTINGS
DROP POLICY IF EXISTS "settings_admin" ON settings;
CREATE POLICY "settings_admin" ON settings FOR ALL USING (is_admin());

-- CATEGORIES
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_write" ON categories;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON categories FOR ALL    USING (is_admin());

-- PRODUCTS
DROP POLICY IF EXISTS "products_public_read"  ON products;
DROP POLICY IF EXISTS "products_admin_all"    ON products;
CREATE POLICY "products_public_read"  ON products FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "products_admin_all"    ON products FOR ALL    USING (is_admin());

-- COURSES
DROP POLICY IF EXISTS "courses_public_read" ON courses;
DROP POLICY IF EXISTS "courses_admin_all"   ON courses;
CREATE POLICY "courses_public_read" ON courses FOR SELECT USING (true);
CREATE POLICY "courses_admin_all"   ON courses FOR ALL    USING (is_admin());

-- MODULES
DROP POLICY IF EXISTS "modules_public_read" ON modules;
DROP POLICY IF EXISTS "modules_admin_all"   ON modules;
CREATE POLICY "modules_public_read" ON modules FOR SELECT USING (true);
CREATE POLICY "modules_admin_all"   ON modules FOR ALL    USING (is_admin());

-- LESSONS (enrolled students or admin)
DROP POLICY IF EXISTS "lessons_enrolled_read" ON lessons;
DROP POLICY IF EXISTS "lessons_preview_read"  ON lessons;
DROP POLICY IF EXISTS "lessons_admin_all"     ON lessons;
CREATE POLICY "lessons_preview_read"  ON lessons FOR SELECT USING (is_free_preview = true);
CREATE POLICY "lessons_enrolled_read" ON lessons FOR SELECT USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN modules m ON e.course_id = m.course_id
    WHERE e.user_id = auth.uid() AND m.id = lessons.module_id
  )
);
CREATE POLICY "lessons_admin_all" ON lessons FOR ALL USING (is_admin());

-- ENROLLMENTS
DROP POLICY IF EXISTS "enrollments_self"      ON enrollments;
DROP POLICY IF EXISTS "enrollments_self_upd"  ON enrollments;
DROP POLICY IF EXISTS "enrollments_admin_all" ON enrollments;
CREATE POLICY "enrollments_self"      ON enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "enrollments_self_upd"  ON enrollments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "enrollments_admin_all" ON enrollments FOR ALL    USING (is_admin());

-- ORDERS
DROP POLICY IF EXISTS "orders_self_read"  ON orders;
DROP POLICY IF EXISTS "orders_anon_ins"   ON orders;
DROP POLICY IF EXISTS "orders_admin_all"  ON orders;
CREATE POLICY "orders_self_read"  ON orders FOR SELECT USING (customer_email = (SELECT email FROM profiles WHERE id = auth.uid()));
CREATE POLICY "orders_anon_ins"   ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "orders_admin_all"  ON orders FOR ALL    USING (is_admin());

-- REVIEWS
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
DROP POLICY IF EXISTS "reviews_self_write"  ON reviews;
DROP POLICY IF EXISTS "reviews_admin_all"   ON reviews;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (is_approved = true OR is_admin());
CREATE POLICY "reviews_self_write"  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_admin_all"   ON reviews FOR ALL    USING (is_admin());

-- Q&A
DROP POLICY IF EXISTS "qna_q_enrolled_read" ON qna_questions;
DROP POLICY IF EXISTS "qna_q_enrolled_ins"  ON qna_questions;
DROP POLICY IF EXISTS "qna_q_admin_all"     ON qna_questions;
CREATE POLICY "qna_q_enrolled_read" ON qna_questions FOR SELECT USING (is_admin() OR EXISTS(SELECT 1 FROM enrollments WHERE user_id=auth.uid() AND course_id=qna_questions.course_id));
CREATE POLICY "qna_q_enrolled_ins"  ON qna_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "qna_q_admin_all"     ON qna_questions FOR ALL    USING (is_admin());

DROP POLICY IF EXISTS "qna_a_read"      ON qna_answers;
DROP POLICY IF EXISTS "qna_a_admin_all" ON qna_answers;
CREATE POLICY "qna_a_read"      ON qna_answers FOR SELECT USING (true);
CREATE POLICY "qna_a_admin_all" ON qna_answers FOR ALL    USING (is_admin());

-- CERTIFICATES
DROP POLICY IF EXISTS "certs_self"      ON certificates;
DROP POLICY IF EXISTS "certs_admin_all" ON certificates;
CREATE POLICY "certs_self"      ON certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "certs_admin_all" ON certificates FOR ALL    USING (is_admin());

-- COUPONS
DROP POLICY IF EXISTS "coupons_admin" ON coupons;
CREATE POLICY "coupons_admin" ON coupons FOR ALL USING (is_admin());

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "ann_enrolled_read" ON announcements;
DROP POLICY IF EXISTS "ann_admin_all"     ON announcements;
CREATE POLICY "ann_enrolled_read" ON announcements FOR SELECT USING (
  is_admin() OR course_id IS NULL OR
  EXISTS(SELECT 1 FROM enrollments WHERE user_id=auth.uid() AND course_id=announcements.course_id)
);
CREATE POLICY "ann_admin_all" ON announcements FOR ALL USING (is_admin());

-- BLOG POSTS
DROP POLICY IF EXISTS "blog_public_read" ON blog_posts;
DROP POLICY IF EXISTS "blog_admin_all"   ON blog_posts;
CREATE POLICY "blog_public_read" ON blog_posts FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "blog_admin_all"   ON blog_posts FOR ALL    USING (is_admin());

-- WISHLIST
DROP POLICY IF EXISTS "wishlist_self" ON wishlist;
CREATE POLICY "wishlist_self" ON wishlist FOR ALL USING (user_id = auth.uid());

-- NOTES
DROP POLICY IF EXISTS "notes_self" ON notes;
CREATE POLICY "notes_self" ON notes FOR ALL USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: Default platform settings
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO settings (id, value) VALUES
  ('site_config', '{"platform_name":"Amplified Skills","support_email":"support@amplifiedskills.com","refund_days":30}'),
  ('certificate_config', '{"completion_threshold":80,"template":"default"}')
ON CONFLICT (id) DO NOTHING;

-- ─── SEED: Admin User ────────────────────────────────────────────────────────
DO $$
DECLARE
  admin_id UUID := 'd0d93708-3cb7-4d7a-8fcd-1a89c8a98b47';
BEGIN
  -- 1. Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@amplifiedskills.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'admin@amplifiedskills.com',
      extensions.crypt('Test123456', extensions.gen_salt('bf', 10)),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Admin User"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@amplifiedskills.com';
  END IF;

  -- 2. Insert into auth.identities if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = admin_id) THEN
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      admin_id,
      admin_id::text,
      admin_id,
      format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@amplifiedskills.com')::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  END IF;

  -- 3. Ensure public.profiles has admin role
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (admin_id, 'admin@amplifiedskills.com', 'Admin User', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@amplifiedskills.com';

END $$;

-- Force sync existing user roles to auth app_metadata
UPDATE public.profiles SET role = role;
