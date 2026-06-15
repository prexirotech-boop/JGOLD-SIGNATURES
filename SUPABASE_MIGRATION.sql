-- ═══════════════════════════════════════════════════════════════════════════
-- AMPLIFIED SKILLS — SCHEMA MIGRATION / RECONCILIATION
-- Paste and execute this script inside your Supabase SQL Editor.
-- This script preserves your existing data while adding all columns and tables
-- required for Q&A, Coupons, Reviews, curriculum modules, and order relationships.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. PROFILES UPGRADE ─────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- ─── 2. PRODUCTS UPGRADE ─────────────────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_desc TEXT;

-- ─── 3. COURSES UPGRADE ──────────────────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced','all'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_you_learn JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS who_is_for JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_video TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_threshold INTEGER DEFAULT 80;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_duration TEXT;

-- ─── 4. ORDERS UPGRADE ───────────────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paystack';

-- ─── 5. NEW MODULES & TABLES ─────────────────────────────────────────────────

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id   UUID REFERENCES courses(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
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

-- Reviews
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

-- Q&A Questions
CREATE TABLE IF NOT EXISTS qna_questions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id   UUID REFERENCES lessons(id) ON DELETE SET NULL,
  question    TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Q&A Answers
CREATE TABLE IF NOT EXISTS qna_answers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES qna_questions(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  answer      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id          UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at          TIMESTAMPTZ DEFAULT NOW(),
  is_valid           BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, course_id)
);

-- Ensure RLS doesn't block local testing (safely enable public read/write policies or turn off RLS for testing)
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE qna_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE qna_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
