-- ============================================================
-- 006_comment_features.sql
-- Adds voting (upvote/downvote) and reporting for comments
-- ============================================================

-- ─── comment_votes ────────────────────────────────────────────────────────
create table public.comment_votes (
  id          uuid primary key default uuid_generate_v4(),
  comment_id  uuid not null references public.comments(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  vote_value  smallint not null check (vote_value in (-1, 1)),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One vote per user per comment
  unique (comment_id, user_id)
);

comment on table public.comment_votes is 'Upvotes and downvotes on comments.';

-- Enable RLS
alter table public.comment_votes enable row level security;

-- Policies
create policy "comment_votes_select_all"
  on public.comment_votes for select
  using (true);

create policy "comment_votes_insert_authenticated"
  on public.comment_votes for insert
  with check (auth.uid() = user_id);

create policy "comment_votes_update_own"
  on public.comment_votes for update
  using (auth.uid() = user_id);

create policy "comment_votes_delete_own"
  on public.comment_votes for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at for comment_votes
create trigger comment_votes_updated_at
  before update on public.comment_votes
  for each row
  execute procedure public.set_updated_at();

-- ─── reports ──────────────────────────────────────────────────────────────
create table public.reports (
  id          uuid primary key default uuid_generate_v4(),
  comment_id  uuid not null references public.comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  created_at  timestamptz not null default now(),

  -- One report per user per comment
  unique (comment_id, reporter_id)
);

comment on table public.reports is 'Reports made by users against comments.';

-- Enable RLS
alter table public.reports enable row level security;

-- Policies
-- Admins can see all reports
create policy "reports_select_admin"
  on public.reports for select
  using (public.current_user_role() = 'admin');

-- Users can insert their own reports
create policy "reports_insert_authenticated"
  on public.reports for insert
  with check (auth.uid() = reporter_id);
