-- =====================================================================
-- HOTFIX: Add user_id to traffic_events if missing and reload schema cache
-- Run this in your Supabase Dashboard SQL Editor to resolve the PostgREST 400 error.
-- =====================================================================

-- 1. Ensure the user_id column exists on traffic_events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'traffic_events' 
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.traffic_events 
        ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Force PostgREST to reload the schema cache so client libraries see the column immediately
NOTIFY pgrst, 'reload schema';
