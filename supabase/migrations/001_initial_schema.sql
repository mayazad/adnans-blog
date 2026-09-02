-- ============================================================
-- 001_initial_schema.sql
-- Creates all core tables for the Latent blog platform
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────

create type user_role as enum ('admin', 'editor', 'reader');
create type post_status as enum ('draft', 'pending_review', 'published', 'archived');
create type post_source as enum ('manual', 'ai');
create type reaction_type as enum ('like', 'insightful', 'love');

-- ─── profiles ─────────────────────────────────────────────────────────────
-- Extends auth.users — one row per user, created automatically on signup

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  username    text unique,
  avatar_url  text,
  role        user_role not null default 'reader',
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'One profile per authenticated user. Role controls admin access.';

-- ─── posts ────────────────────────────────────────────────────────────────

create table public.posts (
  id                    uuid primary key default uuid_generate_v4(),
  slug                  text not null unique,
  title                 text not null,
  excerpt               text,
  content               text,
  cover_image           text,
  author_id             uuid references public.profiles(id) on delete set null,
  source                post_source not null default 'manual',
  status                post_status not null default 'draft',
  category              text,
  tags                  text[] not null default '{}',
  scheduled_at          timestamptz,
  published_at          timestamptz,
  view_count            integer not null default 0,
  reading_time_minutes  integer,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.posts is 'All blog posts — both manually written and AI-drafted.';
comment on column public.posts.source is 'manual = written by admin; ai = AI-generated draft';
comment on column public.posts.status is 'Only published posts are visible to public readers.';

-- ─── comments ─────────────────────────────────────────────────────────────

create table public.comments (
  id                uuid primary key default uuid_generate_v4(),
  post_id           uuid not null references public.posts(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  content           text not null,
  created_at        timestamptz not null default now()
);

comment on table public.comments is 'Reader comments on published posts. Threaded via parent_comment_id.';

-- ─── reactions ────────────────────────────────────────────────────────────

create table public.reactions (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       reaction_type not null,
  created_at timestamptz not null default now(),

  -- One reaction of each type per user per post
  unique (post_id, user_id, type)
);

comment on table public.reactions is 'Emoji reactions on posts. One of each type per user.';

-- ─── settings ─────────────────────────────────────────────────────────────

create table public.settings (
  key   text primary key,
  value jsonb not null
);

comment on table public.settings is 'Site-wide feature toggles and config — editable from admin UI without redeploying.';

-- Seed default settings
insert into public.settings (key, value) values
  ('comments_enabled', 'true'),
  ('newsletter_enabled', 'false'),
  ('site_name', '"Adnan''s Blog"'),
  ('allow_registrations', 'true');

-- ─── indexes ──────────────────────────────────────────────────────────────

create index idx_posts_status       on public.posts(status);
create index idx_posts_published_at on public.posts(published_at desc);
create index idx_posts_slug         on public.posts(slug);
create index idx_posts_author_id    on public.posts(author_id);
create index idx_posts_tags         on public.posts using gin(tags);
create index idx_comments_post_id   on public.comments(post_id);
create index idx_reactions_post_id  on public.reactions(post_id);
