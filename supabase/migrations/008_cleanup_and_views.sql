-- ============================================================
-- 008_cleanup_and_views.sql
-- Cleanup deprecated columns, add bio, and create view increment RPC
-- ============================================================

-- 1. Add bio column to profiles
alter table public.profiles add column if not exists bio text;

-- 2. Drop the old tags text array column from posts and its index
drop index if exists idx_posts_tags;
alter table public.posts drop column if exists tags;

-- 3. Create an RPC function to safely increment view_count
create or replace function increment_view_count(post_id uuid)
returns void
language plpgsql
security definer -- runs as the function creator (admin) to bypass RLS if needed
as $$
begin
  update public.posts
  set view_count = view_count + 1
  where id = post_id;
end;
$$;
