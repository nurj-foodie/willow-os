-- =============================================================
-- PUSH NOTIFICATION SETUP
-- Run these in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Run each section one at a time to check for errors.
-- =============================================================

-- ========================
-- STEP 1: Add 'notified' column to tasks table
-- ========================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

-- ========================
-- STEP 2: Enable pg_cron extension
-- (Go to Dashboard → Database → Extensions → search "pg_cron" → Enable)
-- Or run this:
-- ========================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ========================
-- STEP 3: Enable pg_net extension  
-- (Go to Dashboard → Database → Extensions → search "pg_net" → Enable)
-- Or run this:
-- ========================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ========================
-- STEP 4: Create the cron job (idempotent — safe to run multiple times)
-- Replace YOUR_SERVICE_ROLE_KEY with your actual Supabase service role key
-- (Find it in: Dashboard → Settings → API → service_role key)
-- ========================

-- Remove existing job if it exists (makes this idempotent)
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname = 'push-notification-scheduler';

-- Create the cron job
SELECT cron.schedule(
    'push-notification-scheduler',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://upfhsnupdfyzqzdwwqmt.supabase.co/functions/v1/push-scheduler',
        headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);

-- ========================
-- STEP 5: Verify the cron job exists
-- ========================
SELECT * FROM cron.job;

-- ========================
-- To remove the cron job later (if needed):
-- SELECT cron.unschedule('push-notification-scheduler');
-- ========================
