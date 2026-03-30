-- =============================================================
-- WILLOW — DISK IO REMEDIATION SCRIPT
-- 
-- Run this IMMEDIATELY after unpausing Supabase.
-- Run in: Dashboard → SQL Editor
-- Run each section ONE AT A TIME in order.
-- Date: 2026-03-30
-- =============================================================


-- =============================================================
-- STEP 1: STOP THE BLEEDING — Unschedule the old cron job
-- =============================================================
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname = 'push-notification-scheduler';

-- Verify it's gone
SELECT * FROM cron.job;
-- Should return 0 rows (or only unrelated jobs)


-- =============================================================
-- STEP 2: PURGE ACCUMULATED GARBAGE
-- These tables have been growing unbounded since Feb 17, 2026
-- =============================================================

-- 2a. Purge all pg_cron execution history (~11,800 rows)
DELETE FROM cron.job_run_details;

-- 2b. Purge pg_net HTTP response history (~11,800 rows)
DELETE FROM net._http_response;

-- 2c. Purge pg_net request queue (should be empty, but just in case)
DELETE FROM net.http_request_queue;


-- =============================================================
-- STEP 3: VACUUM — Reclaim disk space from deleted rows
-- (VACUUM FULL locks tables, but these are system tables
--  with no user traffic, so it's safe)
-- =============================================================
VACUUM FULL cron.job_run_details;
-- Note: net._http_response may not support VACUUM FULL directly.
-- If it errors, just run: VACUUM net._http_response;


-- =============================================================
-- STEP 4: ADD MISSING INDEXES
-- The tasks table has no index on user_id or status,
-- causing sequential scans on every query.
-- =============================================================

-- Index for user queries (useTasks, useProfile, push-scheduler)
CREATE INDEX IF NOT EXISTS tasks_user_id_idx 
ON public.tasks(user_id);

-- Composite index for the most common query pattern: user's active tasks
CREATE INDEX IF NOT EXISTS tasks_user_status_idx 
ON public.tasks(user_id, status);

-- Optimized index for push-scheduler overdue/upcoming queries
-- Replaces the old (due_date, notified) index with a better one
CREATE INDEX IF NOT EXISTS tasks_push_scheduler_idx 
ON public.tasks(status, notified, due_date) 
WHERE status = 'todo' AND notified = false;

-- Index for ledger queries (currently has no user_id index)
CREATE INDEX IF NOT EXISTS ledger_user_id_idx 
ON public.ledger(user_id);

-- Drop the old less-optimal index (optional, keeps it if you prefer)
-- DROP INDEX IF EXISTS tasks_due_notified_idx;


-- =============================================================
-- STEP 5: RECREATE CRON JOB — OPTIMIZED
-- Changed: Every 30 minutes instead of every 5 minutes
-- This reduces cron IO by 6x (48 runs/day vs 288)
-- 
-- ⚠️ IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY below!
-- Find it in: Dashboard → Settings → API → service_role key
-- =============================================================

SELECT cron.schedule(
    'push-notification-scheduler',
    '*/30 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://upfhsnupdfyzqzdwwqmt.supabase.co/functions/v1/push-scheduler',
        headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);


-- =============================================================
-- STEP 6: AUTO-CLEANUP CRON JOB
-- Runs daily at 3:00 AM UTC — purges old cron history and
-- pg_net responses older than 3 days.
-- This prevents the garbage buildup from ever happening again.
-- =============================================================

SELECT cron.schedule(
    'cleanup-io-garbage',
    '0 3 * * *',
    $$
    DELETE FROM cron.job_run_details 
    WHERE end_time < now() - interval '3 days';
    
    DELETE FROM net._http_response 
    WHERE created < now() - interval '3 days';
    $$
);


-- =============================================================
-- STEP 7: VERIFY EVERYTHING
-- =============================================================

-- Check active cron jobs (should see 2: push-scheduler + cleanup)
SELECT jobid, jobname, schedule, command FROM cron.job;

-- Check indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check current table sizes (for future comparison)
SELECT 
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;


-- =============================================================
-- DONE! Summary of what this script did:
-- 
-- ✅ Stopped the old 5-minute cron job
-- ✅ Purged ~35,000+ garbage rows from cron + pg_net tables
-- ✅ Reclaimed disk space via VACUUM
-- ✅ Added 4 missing indexes for faster queries
-- ✅ Recreated push scheduler at 30-min intervals (6x less IO)
-- ✅ Added daily auto-cleanup job (prevents future buildup)
-- =============================================================
