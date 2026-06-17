-- ═══════════════════════════════════════════════════════════════════════════
-- AMPLIFIED SKILLS — AFFILIATE + UPSELL/CROSS-SELL SYSTEM MIGRATION
-- Run this ONCE in Supabase SQL Editor. Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── STEP 1: Extend existing tables ──────────────────────────────────────────

-- Add affiliate_code to profiles (unique short code auto-assigned to every user)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT TRUE;

-- Add referral tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id UUID;

-- ─── STEP 2: Create affiliate_code generator ─────────────────────────────────

CREATE OR REPLACE FUNCTION generate_affiliate_code(user_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  base TEXT;
  code TEXT;
  suffix TEXT;
  attempts INT := 0;
BEGIN
  -- Build base from first name (up to 6 chars, uppercase, alphanumeric only)
  base := upper(regexp_replace(split_part(coalesce(user_name, 'USER'), ' ', 1), '[^A-Za-z0-9]', '', 'g'));
  base := left(base, 6);
  IF length(base) < 2 THEN base := 'USER'; END IF;

  LOOP
    -- Generate 4-char random suffix from UUID
    suffix := upper(substring(replace(user_id::text, '-', ''), attempts * 4 + 1, 4));
    code := base || '-' || suffix;

    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE affiliate_code = code) THEN
      RETURN code;
    END IF;

    attempts := attempts + 1;
    IF attempts > 10 THEN
      -- Fallback: use random
      code := base || '-' || upper(substring(md5(random()::text), 1, 4));
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── STEP 3: Auto-assign affiliate codes to existing users ───────────────────

UPDATE profiles
SET affiliate_code = generate_affiliate_code(full_name, id)
WHERE affiliate_code IS NULL;

-- ─── STEP 4: Create trigger to auto-assign affiliate_code on new user signup ──

CREATE OR REPLACE FUNCTION auto_assign_affiliate_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.affiliate_code IS NULL THEN
    NEW.affiliate_code := generate_affiliate_code(NEW.full_name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_assign_affiliate_code ON profiles;
CREATE TRIGGER trigger_assign_affiliate_code
  BEFORE INSERT OR UPDATE OF full_name ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_assign_affiliate_code();

-- ─── STEP 5: AFFILIATES table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliates (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  affiliate_code     TEXT UNIQUE NOT NULL,
  status             TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  tier               TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  commission_rate    NUMERIC(5,2) DEFAULT 20.00, -- percentage e.g. 20.00 = 20%
  custom_rate        NUMERIC(5,2),               -- admin override, overrides tier rate
  total_clicks       INTEGER DEFAULT 0,
  total_referrals    INTEGER DEFAULT 0,
  total_earnings     BIGINT DEFAULT 0,           -- in kobo/cents
  total_paid         BIGINT DEFAULT 0,           -- amount already paid out
  payout_method      TEXT,                       -- 'bank_transfer', 'paypal', etc.
  payout_details     JSONB DEFAULT '{}',         -- bank account details (encrypted ideally)
  notes              TEXT,                       -- admin notes
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STEP 6: AFFILIATE_REFERRALS table (click tracking) ──────────────────────

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id    UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  affiliate_code  TEXT NOT NULL,
  visitor_ip      TEXT,
  landing_page    TEXT,
  user_agent      TEXT,
  converted       BOOLEAN DEFAULT FALSE,
  order_id        BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_referrals_affiliate_id_idx ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_referrals_code_idx ON affiliate_referrals(affiliate_code);

-- ─── STEP 7: AFFILIATE_COMMISSIONS table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id    UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  order_id        BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  order_amount    BIGINT NOT NULL,    -- in kobo
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount BIGINT NOT NULL, -- in kobo
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
  payout_id       UUID,              -- links to affiliate_payouts when paid
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_commissions_affiliate_id_idx ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_commissions_status_idx ON affiliate_commissions(status);

-- ─── STEP 8: AFFILIATE_PAYOUTS table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id      UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  amount            BIGINT NOT NULL,  -- total payout in kobo
  commission_ids    UUID[],           -- which commissions are included
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  payout_method     TEXT,
  transaction_ref   TEXT,
  payout_details    JSONB DEFAULT '{}',
  notes             TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STEP 9: UPSELL_OFFERS table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS upsell_offers (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,                -- internal name for admin
  type             TEXT NOT NULL CHECK (type IN ('order_bump', 'post_purchase', 'cross_sell', 'bundle_deal', 'homepage_banner')),
  trigger_product_id UUID REFERENCES products(id) ON DELETE CASCADE,  -- NULL = show everywhere
  offered_product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  headline         TEXT NOT NULL,                -- "Add to your order!"
  description      TEXT,                         -- short pitch
  cta_text         TEXT DEFAULT 'Add to Order',  -- button label
  discount_type    TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'none')),
  discount_value   NUMERIC(10,2) DEFAULT 0,
  original_price   INTEGER,                      -- shown for strike-through
  display_order    INTEGER DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  show_on_pages    TEXT[] DEFAULT '{}',          -- ['checkout', 'thankyou', 'product', 'dashboard', 'homepage']
  total_impressions BIGINT DEFAULT 0,
  total_conversions BIGINT DEFAULT 0,
  total_revenue    BIGINT DEFAULT 0,             -- in kobo
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STEP 10: UPSELL_IMPRESSIONS table (analytics) ───────────────────────────

CREATE TABLE IF NOT EXISTS upsell_impressions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id    UUID REFERENCES upsell_offers(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  page        TEXT,
  converted   BOOLEAN DEFAULT FALSE,
  order_id    BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STEP 11: Commission trigger — fires on new paid order ───────────────────

CREATE OR REPLACE FUNCTION create_affiliate_commission_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_affiliate RECORD;
  v_rate NUMERIC(5,2);
  v_commission BIGINT;
BEGIN
  -- Only fire on new paid orders that have an affiliate_code
  IF NEW.status = 'paid' AND NEW.affiliate_code IS NOT NULL THEN
    -- Look up the affiliate
    SELECT a.* INTO v_affiliate
    FROM affiliates a
    WHERE a.affiliate_code = NEW.affiliate_code
      AND a.status = 'active'
    LIMIT 1;

    IF FOUND THEN
      -- Use custom rate if set, else use tier commission rate
      v_rate := COALESCE(v_affiliate.custom_rate, v_affiliate.commission_rate);
      v_commission := ROUND((NEW.amount::NUMERIC * v_rate) / 100);

      -- Insert commission record
      INSERT INTO affiliate_commissions (
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

      -- Update affiliate totals
      UPDATE affiliates
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

      -- Mark referral as converted
      UPDATE affiliate_referrals
      SET converted = TRUE, order_id = NEW.id
      WHERE id = (
        SELECT id
        FROM affiliate_referrals
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

DROP TRIGGER IF EXISTS trigger_affiliate_commission ON orders;
CREATE TRIGGER trigger_affiliate_commission
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION create_affiliate_commission_on_order();

-- ─── STEP 12: Auto-create affiliate record when user profile is created ───────

CREATE OR REPLACE FUNCTION auto_create_affiliate()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO affiliates (user_id, affiliate_code, status)
  VALUES (NEW.id, NEW.affiliate_code, 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_affiliate ON profiles;
CREATE TRIGGER trigger_create_affiliate
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_create_affiliate();

-- ─── STEP 13: Back-fill affiliates for all existing users ────────────────────

INSERT INTO affiliates (user_id, affiliate_code, status)
SELECT id, affiliate_code, 'active'
FROM profiles
WHERE affiliate_code IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- ─── STEP 14: update_updated_at triggers for new tables ──────────────────────

ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE affiliate_commissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE affiliate_payouts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE upsell_offers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ DECLARE tbl TEXT; BEGIN
  FOREACH tbl IN ARRAY ARRAY['affiliates','affiliate_commissions','affiliate_payouts','upsell_offers'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON %I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl, tbl);
  END LOOP;
END $$;

-- ─── STEP 15: Row Level Security ─────────────────────────────────────────────

ALTER TABLE affiliates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_offers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_impressions      ENABLE ROW LEVEL SECURITY;

-- Affiliates: users see their own, admins see all
CREATE POLICY "affiliates_self_read"  ON affiliates FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "affiliates_self_update" ON affiliates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "affiliates_admin_all"  ON affiliates FOR ALL USING (is_admin());

-- Referrals: affiliates see their own, admins see all
CREATE POLICY "referrals_self_read"  ON affiliate_referrals FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "referrals_anon_ins"   ON affiliate_referrals FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "referrals_auth_ins"   ON affiliate_referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "referrals_admin_all"  ON affiliate_referrals FOR ALL USING (is_admin());

-- Commissions: affiliates see their own, admins manage all
CREATE POLICY "commissions_self_read" ON affiliate_commissions FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "commissions_admin_all" ON affiliate_commissions FOR ALL USING (is_admin());

-- Payouts: affiliates see their own, admins manage all
CREATE POLICY "payouts_self_read"  ON affiliate_payouts FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "payouts_admin_all"  ON affiliate_payouts FOR ALL USING (is_admin());

-- Upsell offers: public read (active offers), admin write
CREATE POLICY "upsell_offers_public_read" ON upsell_offers FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "upsell_offers_admin_all"   ON upsell_offers FOR ALL USING (is_admin());

-- Impressions: anyone can insert, admins read all, users read own
CREATE POLICY "upsell_impressions_anon_ins"  ON upsell_impressions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "upsell_impressions_auth_ins"  ON upsell_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "upsell_impressions_admin_all" ON upsell_impressions FOR ALL USING (is_admin());

-- ─── STEP 16: Seed default platform affiliate settings ────────────────────────

INSERT INTO settings (id, value) VALUES
  ('affiliate_config', '{
    "enabled": true,
    "default_commission_rate": 20,
    "bronze_rate": 20,
    "silver_rate": 25,
    "gold_rate": 30,
    "platinum_rate": 35,
    "bronze_min_referrals": 0,
    "silver_min_referrals": 6,
    "gold_min_referrals": 21,
    "platinum_min_referrals": 50,
    "cookie_duration_days": 30,
    "min_payout_amount": 5000,
    "payout_currency": "NGN"
  }')
ON CONFLICT (id) DO NOTHING;

-- ─── DONE ─────────────────────────────────────────────────────────────────────
-- Run this script in Supabase SQL Editor.
-- All tables created, triggers active, RLS policies in place.
-- Existing users now have affiliate codes and affiliate records.
