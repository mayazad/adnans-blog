-- ============================================================
-- 007_taxonomy_and_series.sql
-- Introduces relational tags/series to replace the plain text[] tags column.
-- The old posts.tags column is kept (not dropped) for backward compatibility.
-- It will be cleaned up in 008_cleanup.sql after verification.
-- ============================================================

-- ─── Tags ─────────────────────────────────────────────────────────────────────

create table public.tags (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  category   text,
  aliases    text[] not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.tags is 'Canonical tag list with alias support for flexible search resolution.';

-- ─── Post → Tags Junction ─────────────────────────────────────────────────────

create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id  uuid not null references public.tags(id)  on delete cascade,
  primary key (post_id, tag_id)
);

comment on table public.post_tags is 'Many-to-many join between posts and tags.';

-- ─── Series ───────────────────────────────────────────────────────────────────

create table public.series (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

comment on table public.series is 'Named, ordered collections of posts that form a reading path.';

-- ─── Series → Posts Junction ──────────────────────────────────────────────────

create table public.series_posts (
  series_id uuid    not null references public.series(id) on delete cascade,
  post_id   uuid    not null references public.posts(id)  on delete cascade,
  position  integer not null default 0,
  primary key (series_id, post_id)
);

comment on table public.series_posts is 'Ordered list of posts within a series.';

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index tags_slug_idx           on public.tags(slug);
create index post_tags_post_idx      on public.post_tags(post_id);
create index post_tags_tag_idx       on public.post_tags(tag_id);
create index series_slug_idx         on public.series(slug);
create index series_posts_series_idx on public.series_posts(series_id);
create index series_posts_post_idx   on public.series_posts(post_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.tags         enable row level security;
alter table public.post_tags    enable row level security;
alter table public.series       enable row level security;
alter table public.series_posts enable row level security;

-- Tags: public reads, admin writes
create policy "tags_select_public" on public.tags for select using (true);
create policy "tags_insert_admin"  on public.tags for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "tags_update_admin"  on public.tags for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "tags_delete_admin"  on public.tags for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- post_tags: public reads, admin writes
create policy "post_tags_select_public" on public.post_tags for select using (true);
create policy "post_tags_insert_admin"  on public.post_tags for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "post_tags_delete_admin"  on public.post_tags for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- series: public reads, admin writes
create policy "series_select_public" on public.series for select using (true);
create policy "series_insert_admin"  on public.series for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "series_update_admin"  on public.series for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "series_delete_admin"  on public.series for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- series_posts: public reads, admin writes
create policy "series_posts_select_public" on public.series_posts for select using (true);
create policy "series_posts_insert_admin"  on public.series_posts for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "series_posts_update_admin"  on public.series_posts for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "series_posts_delete_admin"  on public.series_posts for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ─── Data Migration ───────────────────────────────────────────────────────────
-- Backfill tags + post_tags from legacy posts.tags text[] column.

do $$
declare
  r          record;
  tag_name   text;
  tag_slug   text;
  tag_id_val uuid;
begin
  for r in
    select id, unnest(tags) as tag_name
    from public.posts
    where tags is not null and array_length(tags, 1) > 0
  loop
    tag_name := trim(r.tag_name);
    continue when tag_name = '';

    tag_slug := lower(regexp_replace(tag_name, '[^a-zA-Z0-9]+', '-', 'g'));
    tag_slug := trim(both '-' from tag_slug);

    insert into public.tags (name, slug)
    values (tag_name, tag_slug)
    on conflict (slug) do nothing;

    select id into tag_id_val from public.tags where slug = tag_slug;

    insert into public.post_tags (post_id, tag_id)
    values (r.id, tag_id_val)
    on conflict do nothing;
  end loop;
end $$;
