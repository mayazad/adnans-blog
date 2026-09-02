-- ============================================================
-- 005_storage_policies.sql
-- Configure RLS policies for the public-assets storage bucket
-- ============================================================

-- Ensure the bucket exists and is public
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = true;

-- ─── storage.objects policies ──────────────────────────────────────────────

-- Allow anyone to read files from the public-assets bucket
create policy "public_assets_select"
  on storage.objects for select
  using (bucket_id = 'public-assets');

-- Allow admins to insert files into public-assets
create policy "public_assets_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'public-assets' 
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Allow admins to update files in public-assets
create policy "public_assets_update"
  on storage.objects for update
  using (
    bucket_id = 'public-assets' 
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Allow admins to delete files from public-assets
create policy "public_assets_delete"
  on storage.objects for delete
  using (
    bucket_id = 'public-assets' 
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );
