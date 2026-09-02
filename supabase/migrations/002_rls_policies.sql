-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security policies for all tables
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles  enable row level security;
alter table public.posts      enable row level security;
alter table public.comments   enable row level security;
alter table public.reactions  enable row level security;
alter table public.settings   enable row level security;

-- ─── Helper function: get current user's role ─────────────────────────────

create or replace function public.current_user_role()
returns user_role
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ─── profiles ─────────────────────────────────────────────────────────────

-- Anyone can read all profiles (needed for comment display)
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Only admins can change roles
create policy "profiles_admin_full"
  on public.profiles for all
  using (public.current_user_role() = 'admin');

-- ─── posts ────────────────────────────────────────────────────────────────

-- Public: only published posts are visible to anonymous users
create policy "posts_select_published"
  on public.posts for select
  using (status = 'published');

-- Admin/editor: can see all posts regardless of status
create policy "posts_select_admin_editor"
  on public.posts for select
  using (public.current_user_role() in ('admin', 'editor'));

-- Admin/editor: can insert posts
create policy "posts_insert_admin_editor"
  on public.posts for insert
  with check (public.current_user_role() in ('admin', 'editor'));

-- Admin/editor: can update posts
create policy "posts_update_admin_editor"
  on public.posts for update
  using (public.current_user_role() in ('admin', 'editor'));

-- Admin only: can delete posts
create policy "posts_delete_admin"
  on public.posts for delete
  using (public.current_user_role() = 'admin');

-- ─── comments ─────────────────────────────────────────────────────────────

-- Anyone can read comments on published posts
create policy "comments_select_all"
  on public.comments for select
  using (
    exists (
      select 1 from public.posts
      where id = post_id and status = 'published'
    )
  );

-- Authenticated users can insert their own comments
create policy "comments_insert_authenticated"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- Users can delete their own comments; admins can delete any
create policy "comments_delete_own_or_admin"
  on public.comments for delete
  using (
    auth.uid() = user_id
    or public.current_user_role() = 'admin'
  );

-- ─── reactions ────────────────────────────────────────────────────────────

-- Anyone can see reaction counts
create policy "reactions_select_all"
  on public.reactions for select
  using (true);

-- Authenticated users can insert their own reactions
create policy "reactions_insert_authenticated"
  on public.reactions for insert
  with check (auth.uid() = user_id);

-- Users can delete their own reactions only
create policy "reactions_delete_own"
  on public.reactions for delete
  using (auth.uid() = user_id);

-- ─── settings ─────────────────────────────────────────────────────────────

-- Anyone can read settings (e.g. to check if comments are enabled)
create policy "settings_select_all"
  on public.settings for select
  using (true);

-- Only admins can change settings
create policy "settings_update_admin"
  on public.settings for all
  using (public.current_user_role() = 'admin');
