-- Run this ONLY if you already applied an older 001_scrolls_and_sends.sql
-- (before triggers, split policies, sends write lockdown, and CHECK constraints).
-- Safe to run on a fresh 001 from the hardened version (uses IF EXISTS / IF NOT EXISTS).

-- Constraints (ignore errors if already present — run blocks individually in SQL editor if needed)

alter table public.scrolls
  drop constraint if exists scrolls_title_len,
  drop constraint if exists scrolls_form_allowed,
  drop constraint if exists scrolls_payload_size;

alter table public.scrolls
  add constraint scrolls_title_len check (char_length(title) <= 500),
  add constraint scrolls_form_allowed check (
    form in (
      'sonnet',
      'haiku',
      'couplets',
      'limerick',
      'freeverse',
      'note',
      'blank'
    )
  ),
  add constraint scrolls_payload_size check (octet_length(payload::text) <= 524288);

alter table public.sends
  drop constraint if exists sends_note_len,
  drop constraint if exists sends_to_email_len,
  drop constraint if exists sends_to_email_format;

alter table public.sends
  add constraint sends_note_len check (char_length(note) <= 2000),
  add constraint sends_to_email_len check (char_length(to_email) <= 320),
  add constraint sends_to_email_format check (
    to_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );

create or replace function public.scrolls_enforce_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if tg_op = 'UPDATE' and old.user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;

  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists scrolls_enforce_owner on public.scrolls;
create trigger scrolls_enforce_owner
  before insert or update on public.scrolls
  for each row
  execute function public.scrolls_enforce_owner();

drop policy if exists "Users manage own scrolls" on public.scrolls;
drop policy if exists "scrolls_select_own" on public.scrolls;
drop policy if exists "scrolls_insert_own" on public.scrolls;
drop policy if exists "scrolls_update_own" on public.scrolls;
drop policy if exists "scrolls_delete_own" on public.scrolls;

create policy "scrolls_select_own"
  on public.scrolls for select to authenticated
  using (auth.uid() = user_id);

create policy "scrolls_insert_own"
  on public.scrolls for insert to authenticated
  with check (auth.uid() = user_id);

create policy "scrolls_update_own"
  on public.scrolls for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "scrolls_delete_own"
  on public.scrolls for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read own sends" on public.sends;
drop policy if exists "Users insert own sends" on public.sends;
drop policy if exists "Users update own sends" on public.sends;
drop policy if exists "sends_select_own" on public.sends;

create policy "sends_select_own"
  on public.sends for select to authenticated
  using (auth.uid() = user_id);

revoke all on table public.scrolls from anon;
revoke all on table public.sends from anon;

grant select, insert, update, delete on table public.scrolls to authenticated;
grant select on table public.sends to authenticated;
