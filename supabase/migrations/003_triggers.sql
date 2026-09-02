-- ============================================================
-- 003_triggers.sql
-- Automated triggers: profile creation on signup, updated_at
-- ============================================================

-- ─── Auto-create profile on auth.users insert ─────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'username', null),
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    'reader'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Fire after every new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ─── Auto-update updated_at on posts ─────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on public.posts
  for each row
  execute procedure public.set_updated_at();

-- ─── Auto-set published_at when status flips to published ────────────────

create or replace function public.handle_post_publish()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status != 'published' then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger posts_set_published_at
  before update on public.posts
  for each row
  execute procedure public.handle_post_publish();
