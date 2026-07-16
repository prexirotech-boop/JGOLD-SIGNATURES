-- =====================================================================
-- MIFAS Store — Supabase Keep-Alive Cron Script
-- 
-- Prevents Supabase from pausing your database on the Free Plan
-- after 7 days of inactivity.
-- =====================================================================

-- 1. Enable the pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- 2. Schedule a daily query to run at 12:00 PM (noon) UTC.
-- This creates transaction activity inside the database engine,
-- keeping your database active permanently.
select cron.schedule(
  'supabase-keep-alive', -- name of the task
  '0 12 * * *',          -- runs every day at 12:00 PM UTC
  'SELECT 1;'            -- lightweight SQL query
);
