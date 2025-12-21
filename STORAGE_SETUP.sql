-- Create a private bucket for receipt uploads
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Set up Row Level Security (RLS) for the bucket

-- 1. Allow authenticated users to upload their own receipts
-- We organize files by user_id: 'receipts/USER_ID/filename.jpg'
create policy "Users can upload their own receipts"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow authenticated users to view their own receipts
create policy "Users can view their own receipts"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to delete their own receipts
create policy "Users can delete their own receipts"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
