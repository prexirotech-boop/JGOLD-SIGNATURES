-- ═══════════════════════════════════════════════════════════════════════════
-- ADDITIONAL AMPLIFIED SKILLS FIXES
-- Paste and execute this script inside your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. STORAGE BUCKET FOR AVATARS ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar auth upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar auth update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar auth delete" ON storage.objects;

-- Create policies for avatars bucket
CREATE POLICY "Avatar public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Avatar auth upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatar auth update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Avatar auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');


-- ─── 2. COUPONS ACCESS POLICY ───────────────────────────────────────────────
DROP POLICY IF EXISTS "anyone can read active coupons" ON coupons;
CREATE POLICY "anyone can read active coupons"
  ON coupons FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));


-- ─── 3. SAFE COUPON USAGE INCREMENT HELPER ──────────────────────────────────
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET usage_count = usage_count + 1
  WHERE LOWER(code) = LOWER(coupon_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 4. CASE INSENSITIVE ENROLLMENT TRIGGER ────────────────────────────────
CREATE OR REPLACE FUNCTION grant_enrollment_on_order() RETURNS TRIGGER AS $$
DECLARE v_user_id UUID; v_type TEXT;
BEGIN
  IF NEW.status = 'paid' AND NEW.product_id IS NOT NULL THEN
    SELECT type INTO v_type FROM products WHERE id = NEW.product_id;
    IF v_type = 'course' THEN
      SELECT id INTO v_user_id FROM profiles WHERE LOWER(email) = LOWER(NEW.customer_email) LIMIT 1;
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


-- ─── 5. LESSONS PUBLIC SELECT POLICY ─────────────────────────────────────────
DROP POLICY IF EXISTS "lessons_preview_read" ON lessons;
DROP POLICY IF EXISTS "lessons_enrolled_read" ON lessons;
DROP POLICY IF EXISTS "lessons_public_read" ON lessons;

CREATE POLICY "lessons_public_read" ON lessons FOR SELECT USING (true);


-- ─── 6. ADMIN DASHBOARD STATS RPC ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  users_count INT;
  total_orders INT;
  paid_orders_count INT;
  products_count INT;
  unresolved_qna INT;
  total_revenue INT;
  recent_orders JSONB;
  recent_users JSONB;
  course_stats JSONB;
BEGIN
  -- Count users
  SELECT COUNT(*) INTO users_count FROM profiles;
  
  -- Count total orders
  SELECT COUNT(*) INTO total_orders FROM orders;
  
  -- Count paid orders
  SELECT COUNT(*) INTO paid_orders_count FROM orders WHERE status = 'paid';
  
  -- Count products
  SELECT COUNT(*) INTO products_count FROM products;
  
  -- Count unresolved Q&A
  SELECT COUNT(*) INTO unresolved_qna FROM qna_questions WHERE is_resolved = false;
  
  -- Sum total revenue
  SELECT COALESCE(SUM(amount), 0) INTO total_revenue FROM orders WHERE status = 'paid';
  
  -- Get recent orders (last 5)
  SELECT COALESCE(json_agg(t), '[]'::json) INTO recent_orders
  FROM (
    SELECT o.id, o.reference, o.customer_email, o.customer_name, o.amount, o.status, o.created_at,
           (SELECT title FROM products p WHERE p.id = o.product_id) as product_title
    FROM orders o
    ORDER BY o.created_at DESC
    LIMIT 5
  ) t;
  
  -- Get recent users (last 5)
  SELECT COALESCE(json_agg(t), '[]'::json) INTO recent_users
  FROM (
    SELECT id, full_name, email, role, created_at
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 5
  ) t;
  
  -- Course stats (enrollment counts)
  SELECT COALESCE(json_agg(t), '[]'::json) INTO course_stats
  FROM (
    SELECT c.id, c.level, p.title, 
           (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollment_count
    FROM courses c
    JOIN products p ON c.id = p.id
    ORDER BY enrollment_count DESC
  ) t;
  
  RETURN jsonb_build_object(
    'users_count', users_count,
    'total_orders', total_orders,
    'paid_orders_count', paid_orders_count,
    'products_count', products_count,
    'unresolved_qna', unresolved_qna,
    'total_revenue', total_revenue,
    'recent_orders', recent_orders,
    'recent_users', recent_users,
    'course_stats', course_stats
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


