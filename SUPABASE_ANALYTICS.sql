-- ═══════════════════════════════════════════════════════════════════════════
-- TRAFFIC EVENTS & ANALYTICS SCHEMA
-- Run this in your Supabase Dashboard SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Create traffic_events table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.traffic_events (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
    visitor_id    TEXT NOT NULL,
    session_id    TEXT NOT NULL,
    event_name    TEXT NOT NULL,
    page_path     TEXT NOT NULL,
    referrer      TEXT,
    utm_source    TEXT,
    utm_medium    TEXT,
    utm_campaign  TEXT,
    utm_content   TEXT,
    utm_term      TEXT,
    metadata      JSONB DEFAULT '{}'::jsonb NOT NULL,
    user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ── Indexes for high-performance dashboard querying ─────────────────────────
CREATE INDEX IF NOT EXISTS traffic_events_created_at_idx ON public.traffic_events(created_at);
CREATE INDEX IF NOT EXISTS traffic_events_event_name_idx ON public.traffic_events(event_name);
CREATE INDEX IF NOT EXISTS traffic_events_utm_campaign_idx ON public.traffic_events(utm_campaign);
CREATE INDEX IF NOT EXISTS traffic_events_session_visitor_idx ON public.traffic_events(session_id, visitor_id);

-- ── Enable Row Level Security (RLS) ──────────────────────────────────────────
ALTER TABLE public.traffic_events ENABLE ROW LEVEL SECURITY;

-- ── Security Policies ────────────────────────────────────────────────────────

-- Policy 1: Allow anyone (guests and logged-in users) to log analytics events
DROP POLICY IF EXISTS "Allow anonymous and authenticated to insert traffic events" ON public.traffic_events;
CREATE POLICY "Allow anonymous and authenticated to insert traffic events"
    ON public.traffic_events FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy 2: Allow admin accounts to query analytics data for the dashboard
DROP POLICY IF EXISTS "Allow admins to view all traffic events" ON public.traffic_events;
CREATE POLICY "Allow admins to view all traffic events"
    ON public.traffic_events FOR SELECT
    TO authenticated, anon
    USING (
        coalesce(
            nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role',
            ''
        ) = 'admin'
    );
