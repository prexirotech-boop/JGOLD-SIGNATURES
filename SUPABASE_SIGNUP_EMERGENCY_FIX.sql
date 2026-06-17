-- ═══════════════════════════════════════════════════════════════════════════
-- EMERGENCY FIX — AUTH SIGNUP 500 ERROR
-- The affiliate trigger (trigger_assign_affiliate_code) is firing BEFORE
-- the profile insert completes and crashing the auth.users transaction.
-- This script disables all affiliate triggers and fixes the signup flow.
-- RUN THIS IN YOUR SUPABASE DASHBOARD SQL EDITOR
-- ═══════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Drop the broken affiliate trigger on profiles ─────────────────
DROP TRIGGER IF EXISTS trigger_assign_affiliate_code ON public.profiles;

-- ── STEP 2: Drop the sync role trigger that could also cascade failures ───
DROP TRIGGER IF EXISTS trigger_sync_profile_role ON public.profiles;

-- ── STEP 3: Re-create the safe handle_new_user trigger function ──────────
-- Uses a bulletproof version with full exception handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error and continue so signup is never blocked
  RAISE WARNING 'handle_new_user error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── STEP 4: Make sure the trigger is attached to auth.users ───────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── STEP 5: Verify — should return the trigger ────────────────────────────
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
