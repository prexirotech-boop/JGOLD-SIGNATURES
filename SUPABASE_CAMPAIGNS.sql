-- ═══════════════════════════════════════════════════════════════════════════
-- CAMPAIGNS SCHEMA & MIGRATION
-- Run this in your Supabase Dashboard SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Create funnel_campaigns table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.funnel_campaigns (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,
    product_id    UUID REFERENCES public.products(id) ON DELETE CASCADE,
    lander_paths  TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    webinar_paths TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    checkout_paths TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    utm_campaign  TEXT,
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── Enable Row Level Security (RLS) ──────────────────────────────────────────
ALTER TABLE public.funnel_campaigns ENABLE ROW LEVEL SECURITY;

-- ── Security Policies ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow admins all actions on funnel_campaigns" ON public.funnel_campaigns;
CREATE POLICY "Allow admins all actions on funnel_campaigns"
    ON public.funnel_campaigns FOR ALL
    TO authenticated, anon
    USING (
        coalesce(
            nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
            ''
        ) = 'admin'
    )
    WITH CHECK (
        coalesce(
            nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
            ''
        ) = 'admin'
    );
