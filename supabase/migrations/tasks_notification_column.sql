-- Add notified column to prevent duplicate alerts
alter table public.tasks 
add column if not exists notified boolean default false;

-- Create index for performance
create index if not exists tasks_due_notified_idx 
on public.tasks(due_date, notified);
