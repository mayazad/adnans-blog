-- ============================================================
-- 004_username_login.sql
-- Adds an RPC function to securely resolve a username to an email
-- so users can log in with either their username or email.
-- ============================================================

create or replace function public.get_email_for_username(p_username text)
returns text
language plpgsql
security definer -- Elevates privileges so it can read auth.users
set search_path = public
as $$
declare
  v_email text;
begin
  select u.email into v_email
  from auth.users u
  join public.profiles p on u.id = p.id
  where p.username = p_username;
  
  return v_email;
end;
$$;
