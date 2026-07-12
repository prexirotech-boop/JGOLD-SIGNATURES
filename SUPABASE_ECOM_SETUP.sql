-- ═══════════════════════════════════════════════════════════════════════════
-- E-COM WEB — FULL PLATFORM E-COMMERCE SCHEMA v1.0
-- Run this in your new Supabase SQL Editor. Safe to run (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. PROFILES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email                TEXT UNIQUE NOT NULL,
  full_name            TEXT,
  avatar_url           TEXT,
  bio                  TEXT,
  role                 TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  affiliate_code       TEXT UNIQUE,
  affiliate_enabled    BOOLEAN DEFAULT TRUE,
  shipping_street      TEXT,
  shipping_city        TEXT,
  shipping_state       TEXT,
  shipping_postal_code TEXT,
  shipping_phone       TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. SETTINGS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  id         TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. CATEGORIES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. PRODUCTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('course','ebook','blueprint','bundle','physical')),
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
  stock_quantity INTEGER DEFAULT NULL, -- NULL means unlimited/digital
  weight        DECIMAL(10,2) DEFAULT 0.00,
  meta_title    TEXT,
  meta_desc     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. COURSES (extends products 1:1) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id               UUID REFERENCES public.products(id) ON DELETE CASCADE PRIMARY KEY,
  category_id      UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  level            TEXT DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced','all')),
  language         TEXT DEFAULT 'English',
  what_you_learn   JSONB DEFAULT '[]',
  requirements     JSONB DEFAULT '[]',
  who_is_for       JSONB DEFAULT '[]',
  preview_video    TEXT,
  certificate_enabled BOOLEAN DEFAULT TRUE,
  completion_threshold INTEGER DEFAULT 80,
  total_duration   TEXT,
  instructor       TEXT DEFAULT 'E-Com Web',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. MODULES (sections inside a course) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.modules (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id   UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. LESSONS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lessons (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id     UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
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

-- ─── 8. ENROLLMENTS (digital products access) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enrollments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  progress    JSONB DEFAULT '[]',
  completed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── 9. ORDERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                   BIGSERIAL PRIMARY KEY,
  reference            TEXT UNIQUE NOT NULL,
  customer_email       TEXT NOT NULL,
  customer_name        TEXT,
  customer_phone       TEXT,
  user_id              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id           UUID REFERENCES public.products(id) ON DELETE SET NULL,
  amount               INTEGER NOT NULL,
  currency             TEXT DEFAULT 'NGN',
  status               TEXT DEFAULT 'pending', -- pending, paid, cancelled, refunded, processing, shipped, delivered, returned
  payment_method       TEXT DEFAULT 'paystack',
  shipping_name        TEXT,
  shipping_phone       TEXT,
  shipping_street      TEXT,
  shipping_city        TEXT,
  shipping_state       TEXT,
  shipping_country     TEXT DEFAULT 'Nigeria',
  shipping_postal_code TEXT,
  shipping_notes       TEXT,
  shipping_status      TEXT DEFAULT NULL CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
  tracking_number      TEXT,
  delivery_fee         INTEGER DEFAULT 0,
  affiliate_code       TEXT,
  affiliate_id         UUID,
  paid_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_email_idx ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS orders_ref_idx   ON public.orders (reference);

-- ─── 10. REVIEWS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── 11. Q&A ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.qna_questions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id   UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  question    TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.qna_answers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.qna_questions(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  answer      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 12. CERTIFICATES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificates (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id       UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  certificate_url TEXT,
  issued_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── 13. COUPONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  type           TEXT DEFAULT 'percentage' CHECK (type IN ('percentage','fixed')),
  value          INTEGER NOT NULL,
  usage_limit    INTEGER,
  usage_count    INTEGER DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN DEFAULT TRUE,
  product_id     UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 14. ANNOUNCEMENTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id   UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 15. BLOG POSTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
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

-- ─── 16. WISHLIST ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─── 17. STUDENT NOTES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id   UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  content     TEXT,
  timestamp   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 18. AFFILIATES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliates (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  affiliate_code     TEXT UNIQUE NOT NULL,
  status             TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  tier               TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  commission_rate    NUMERIC(5,2) DEFAULT 20.00,
  custom_rate        NUMERIC(5,2),
  total_clicks       INTEGER DEFAULT 0,
  total_referrals    INTEGER DEFAULT 0,
  total_earnings     BIGINT DEFAULT 0, -- in kobo
  total_paid         BIGINT DEFAULT 0, -- in kobo
  payout_method      TEXT,
  payout_details     JSONB DEFAULT '{}',
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id    UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  affiliate_code  TEXT NOT NULL,
  visitor_ip      TEXT,
  landing_page    TEXT,
  user_agent      TEXT,
  converted       BOOLEAN DEFAULT FALSE,
  order_id        BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id    UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  order_id        BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
  order_amount    BIGINT NOT NULL, -- in kobo
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount BIGINT NOT NULL, -- in kobo
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
  payout_id       UUID,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id      UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  amount            BIGINT NOT NULL, -- total payout in kobo
  commission_ids    UUID[],
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  payout_method     TEXT,
  transaction_ref   TEXT,
  payout_details    JSONB DEFAULT '{}',
  notes             TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_referrals_affiliate_id_idx ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_referrals_code_idx ON public.affiliate_referrals(affiliate_code);
CREATE INDEX IF NOT EXISTS affiliate_commissions_affiliate_id_idx ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_commissions_status_idx ON public.affiliate_commissions(status);

-- ─── 19. UPSELLS & CROSS-SELLS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.upsell_offers (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('order_bump', 'post_purchase', 'cross_sell', 'bundle_deal', 'homepage_banner')),
  trigger_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  offered_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  headline         TEXT NOT NULL,
  description      TEXT,
  cta_text         TEXT DEFAULT 'Add to Order',
  discount_type    TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'none')),
  discount_value   NUMERIC(10,2) DEFAULT 0,
  original_price   INTEGER,
  display_order    INTEGER DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  show_on_pages    TEXT[] DEFAULT '{}',
  total_impressions BIGINT DEFAULT 0,
  total_conversions BIGINT DEFAULT 0,
  total_revenue    BIGINT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.upsell_impressions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id    UUID REFERENCES public.upsell_offers(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  page        TEXT,
  converted   BOOLEAN DEFAULT FALSE,
  order_id    BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 20. ANALYTICS & CAMPAIGNS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.traffic_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      TEXT,
  event_name      TEXT NOT NULL, -- page_view, initiate_checkout, purchase, etc.
  url_path        TEXT,
  referrer        TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  customer_email  TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.funnel_campaigns (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT NOT NULL,
  utm_source     TEXT NOT NULL,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  budget         INTEGER DEFAULT 0, -- in kobo
  starts_at      TIMESTAMPTZ,
  ends_at        TIMESTAMPTZ,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 21. DEBUG LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.debug_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level       TEXT DEFAULT 'info',
  category    TEXT,
  message     TEXT NOT NULL,
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS, FUNCTIONS & PROCEDURES
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE tbl TEXT; BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'settings', 'products', 'courses', 'modules', 'lessons', 
    'orders', 'blog_posts', 'notes', 'affiliates', 'affiliate_commissions', 
    'affiliate_payouts', 'upsell_offers'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', tbl, tbl);
  END LOOP;
END $$;

-- ─── AFFILIATE CODE GENERATOR ───
CREATE OR REPLACE FUNCTION public.generate_affiliate_code(user_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  base TEXT;
  code TEXT;
  suffix TEXT;
  attempts INT := 0;
BEGIN
  base := upper(regexp_replace(split_part(coalesce(user_name, 'USER'), ' ', 1), '[^A-Za-z0-9]', '', 'g'));
  base := left(base, 6);
  IF length(base) < 2 THEN base := 'USER'; END IF;

  LOOP
    suffix := upper(substring(replace(user_id::text, '-', ''), attempts * 4 + 1, 4));
    code := base || '-' || suffix;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE affiliate_code = code) THEN
      RETURN code;
    END IF;

    attempts := attempts + 1;
    IF attempts > 10 THEN
      code := base || '-' || upper(substring(md5(random()::text), 1, 4));
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── HANDLERS FOR NEW USERS ───
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  v_code TEXT;
BEGIN
  v_code := public.generate_affiliate_code(NEW.raw_user_meta_data->>'full_name', NEW.id);
  
  INSERT INTO public.profiles (id, email, full_name, role, affiliate_code)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    'user',
    v_code
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.affiliates (user_id, affiliate_code, status)
  VALUES (NEW.id, v_code, 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── ROLE SYNCHRONIZATION ───
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth()
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
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_auth();

-- ─── COURSE ACCESS TRIGGER ON PAID ORDERS ───
CREATE OR REPLACE FUNCTION public.grant_enrollment_on_order() RETURNS TRIGGER AS $$
DECLARE v_user_id UUID; v_type TEXT;
BEGIN
  IF NEW.status = 'paid' AND NEW.product_id IS NOT NULL THEN
    SELECT type INTO v_type FROM public.products WHERE id = NEW.product_id;
    IF v_type = 'course' THEN
      SELECT id INTO v_user_id FROM public.profiles WHERE email = NEW.customer_email LIMIT 1;
      IF v_user_id IS NOT NULL THEN
        INSERT INTO public.enrollments (user_id, course_id)
        VALUES (v_user_id, NEW.product_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_grant_enrollment ON public.orders;
CREATE TRIGGER trigger_grant_enrollment
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.grant_enrollment_on_order();

-- ─── AFFILIATE COMMISSION TRIGGER ON ORDERS ───
CREATE OR REPLACE FUNCTION public.create_affiliate_commission_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_affiliate RECORD;
  v_rate NUMERIC(5,2);
  v_commission BIGINT;
BEGIN
  IF NEW.status = 'paid' AND NEW.affiliate_code IS NOT NULL THEN
    SELECT a.* INTO v_affiliate
    FROM public.affiliates a
    WHERE a.affiliate_code = NEW.affiliate_code
      AND a.status = 'active'
    LIMIT 1;

    IF FOUND THEN
      v_rate := COALESCE(v_affiliate.custom_rate, v_affiliate.commission_rate);
      v_commission := ROUND((NEW.amount::NUMERIC * v_rate) / 100);

      INSERT INTO public.affiliate_commissions (
        affiliate_id,
        order_id,
        order_amount,
        commission_rate,
        commission_amount,
        status
      ) VALUES (
        v_affiliate.id,
        NEW.id,
        NEW.amount,
        v_rate,
        v_commission,
        'pending'
      )
      ON CONFLICT DO NOTHING;

      UPDATE public.affiliates
      SET
        total_referrals = total_referrals + 1,
        total_earnings  = total_earnings + v_commission,
        tier = CASE
          WHEN total_referrals + 1 >= 50 THEN 'platinum'
          WHEN total_referrals + 1 >= 21 THEN 'gold'
          WHEN total_referrals + 1 >= 6  THEN 'silver'
          ELSE 'bronze'
        END,
        updated_at = NOW()
      WHERE id = v_affiliate.id;

      UPDATE public.affiliate_referrals
      SET converted = TRUE, order_id = NEW.id
      WHERE id = (
        SELECT id
        FROM public.affiliate_referrals
        WHERE affiliate_code = NEW.affiliate_code
          AND converted = FALSE
        ORDER BY created_at DESC
        LIMIT 1
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_affiliate_commission ON public.orders;
CREATE TRIGGER trigger_affiliate_commission
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_affiliate_commission_on_order();

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna_answers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_offers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_impressions   ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies
DO $$ 
DECLARE 
  tbl TEXT;
  pol RECORD;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'products', 'courses', 'modules', 'lessons', 
    'enrollments', 'orders', 'reviews', 'qna_questions', 'qna_answers', 
    'certificates', 'coupons', 'announcements', 'blog_posts', 'wishlist', 
    'notes', 'settings', 'categories', 'affiliates', 'affiliate_referrals',
    'affiliate_commissions', 'affiliate_payouts', 'upsell_offers', 'upsell_impressions'
  ] LOOP
    FOR pol IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = tbl AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- Admin role helper function
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
    ''
  ) = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── POLICIES BY TABLE ───

-- PROFILES
CREATE POLICY "profiles_self_read"   ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all"   ON public.profiles FOR ALL    USING (public.is_admin());

-- SETTINGS
CREATE POLICY "settings_admin" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT USING (true);

-- CATEGORIES
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL    USING (public.is_admin());

-- PRODUCTS
CREATE POLICY "products_public_read"  ON public.products FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "products_admin_all"    ON public.products FOR ALL    USING (public.is_admin());

-- COURSES
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_admin_all"   ON public.courses FOR ALL    USING (public.is_admin());

-- MODULES
CREATE POLICY "modules_public_read" ON public.modules FOR SELECT USING (true);
CREATE POLICY "modules_admin_all"   ON public.modules FOR ALL    USING (public.is_admin());

-- LESSONS (enrolled students or admin)
CREATE POLICY "lessons_preview_read"  ON public.lessons FOR SELECT USING (is_free_preview = true);
CREATE POLICY "lessons_enrolled_read" ON public.lessons FOR SELECT USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.modules m ON e.course_id = m.course_id
    WHERE e.user_id = auth.uid() AND m.id = public.lessons.module_id
  )
);
CREATE POLICY "lessons_admin_all" ON public.lessons FOR ALL USING (public.is_admin());

-- ENROLLMENTS
CREATE POLICY "enrollments_self"      ON public.enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "enrollments_self_upd"  ON public.enrollments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "enrollments_admin_all" ON public.enrollments FOR ALL    USING (public.is_admin());

-- ORDERS
CREATE POLICY "orders_self_read"  ON public.orders FOR SELECT USING (customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR public.is_admin());
CREATE POLICY "orders_anon_ins"   ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "orders_auth_ins"   ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orders_admin_all"  ON public.orders FOR ALL    USING (public.is_admin());

-- REVIEWS
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (is_approved = true OR public.is_admin());
CREATE POLICY "reviews_self_write"  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_admin_all"   ON public.reviews FOR ALL    USING (public.is_admin());

-- Q&A
CREATE POLICY "qna_q_enrolled_read" ON public.qna_questions FOR SELECT USING (public.is_admin() OR EXISTS(SELECT 1 FROM public.enrollments WHERE user_id=auth.uid() AND course_id=public.qna_questions.course_id));
CREATE POLICY "qna_q_enrolled_ins"  ON public.qna_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "qna_q_admin_all"     ON public.qna_questions FOR ALL    USING (public.is_admin());

CREATE POLICY "qna_a_read"      ON public.qna_answers FOR SELECT USING (true);
CREATE POLICY "qna_a_admin_all" ON public.qna_answers FOR ALL    USING (public.is_admin());

-- CERTIFICATES
CREATE POLICY "certs_self"      ON public.certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "certs_admin_all" ON public.certificates FOR ALL    USING (public.is_admin());

-- COUPONS
CREATE POLICY "coupons_admin" ON public.coupons FOR ALL USING (public.is_admin());
CREATE POLICY "coupons_public_read" ON public.coupons FOR SELECT USING (is_active = true);

-- ANNOUNCEMENTS
CREATE POLICY "ann_enrolled_read" ON public.announcements FOR SELECT USING (
  public.is_admin() OR course_id IS NULL OR
  EXISTS(SELECT 1 FROM public.enrollments WHERE user_id=auth.uid() AND course_id=public.announcements.course_id)
);
CREATE POLICY "ann_admin_all" ON public.announcements FOR ALL USING (public.is_admin());

-- BLOG POSTS
CREATE POLICY "blog_public_read" ON public.blog_posts FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "blog_admin_all"   ON public.blog_posts FOR ALL    USING (public.is_admin());

-- WISHLIST
CREATE POLICY "wishlist_self" ON public.wishlist FOR ALL USING (user_id = auth.uid());

-- NOTES
CREATE POLICY "notes_self" ON public.notes FOR ALL USING (user_id = auth.uid());

-- AFFILIATES
CREATE POLICY "affiliates_self_read"  ON public.affiliates FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "affiliates_self_update" ON public.affiliates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "affiliates_admin_all"  ON public.affiliates FOR ALL USING (public.is_admin());

-- REFERRALS
CREATE POLICY "referrals_self_read"  ON public.affiliate_referrals FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "referrals_anon_ins"   ON public.affiliate_referrals FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "referrals_auth_ins"   ON public.affiliate_referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "referrals_admin_all"  ON public.affiliate_referrals FOR ALL USING (public.is_admin());

-- COMMISSIONS
CREATE POLICY "commissions_self_read" ON public.affiliate_commissions FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "commissions_admin_all" ON public.affiliate_commissions FOR ALL USING (public.is_admin());

-- PAYOUTS
CREATE POLICY "payouts_self_read"  ON public.affiliate_payouts FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "payouts_admin_all"  ON public.affiliate_payouts FOR ALL USING (public.is_admin());

-- UPSELL OFFERS
CREATE POLICY "upsell_offers_public_read" ON public.upsell_offers FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "upsell_offers_admin_all"   ON public.upsell_offers FOR ALL USING (public.is_admin());

-- UPSELL IMPRESSIONS
CREATE POLICY "upsell_impressions_anon_ins"  ON public.upsell_impressions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "upsell_impressions_auth_ins"  ON public.upsell_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "upsell_impressions_admin_all" ON public.upsell_impressions FOR ALL USING (public.is_admin());

-- TRAFFIC EVENTS
CREATE POLICY "traffic_events_anon_ins"  ON public.traffic_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "traffic_events_auth_ins"  ON public.traffic_events FOR INSERT WITH CHECK (true);
CREATE POLICY "traffic_events_admin_all" ON public.traffic_events FOR ALL USING (public.is_admin());

-- FUNNEL CAMPAIGNS
CREATE POLICY "funnel_campaigns_admin" ON public.funnel_campaigns FOR ALL USING (public.is_admin());

-- DEBUG LOGS
CREATE POLICY "debug_logs_admin" ON public.debug_logs FOR ALL USING (public.is_admin());
CREATE POLICY "debug_logs_insert" ON public.debug_logs FOR INSERT WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.settings (id, value) VALUES
  ('site_config', '{"platform_name":"E-Com Web","support_email":"support@ecomweb.com","refund_days":30}'),
  ('certificate_config', '{"completion_threshold":80,"template":"default"}'),
  ('affiliate_config', '{
    "enabled": true,
    "default_commission_rate": 20,
    "bronze_rate": 20,
    "silver_rate": 25,
    "gold_rate": 30,
    "platinum_rate": 35,
    "cookie_duration_days": 30,
    "min_payout_amount": 5000,
    "payout_currency": "NGN"
  }')
ON CONFLICT (id) DO NOTHING;

-- ─── SEED ADMIN USER ───
DO $$
DECLARE
  admin_id UUID := 'd0d93708-3cb7-4d7a-8fcd-1a89c8a98b47';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@ecomweb.com') THEN
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
      'admin@ecomweb.com',
      extensions.crypt('password123', extensions.gen_salt('bf', 10)),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "E-Com Web Administrator"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@ecomweb.com';
  END IF;

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
      format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@ecomweb.com')::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (admin_id, 'admin@ecomweb.com', 'E-Com Web Administrator', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@ecomweb.com';
END $$;
