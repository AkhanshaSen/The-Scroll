-- Paper Scroll Studio: scrolls + email sends (security-hardened)
-- Apply in Supabase SQL editor for YOUR project (see supabase/.project-ref)
-- or: npm run supabase:link && supabase db push
--
-- Model:
-- - All client access goes through Supabase PostgREST (HTTPS) with the anon key + user JWT.
-- - PostgREST uses parameterized queries; never concatenate user input into SQL on the client.
-- - Row Level Security (RLS) denies access by default; policies allow only auth.uid() = user_id.
-- - Triggers force user_id = auth.uid() on scroll writes so clients cannot impersonate another user.
-- - sends rows are created/updated only by the send-scroll Edge Function (service role), not by browsers.

-- ---------------------------------------------------------------------------
-- scrolls
-- ---------------------------------------------------------------------------

create table if not exists public.scrolls (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  title text not null default '',
  form text not null default 'sonnet',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint scrolls_title_len check (char_length(title) <= 500),
  constraint scrolls_form_allowed check (
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
  constraint scrolls_payload_size check (octet_length(payload::text) <= 524288)
);

create index if not exists scrolls_user_updated_idx
  on public.scrolls (user_id, updated_at desc);

alter table public.scrolls enable row level security;

-- Owner enforced in DB (defense in depth beside RLS and client upsert).
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
  on public.scrolls
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "scrolls_insert_own"
  on public.scrolls
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "scrolls_update_own"
  on public.scrolls
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "scrolls_delete_own"
  on public.scrolls
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- sends (read-only for signed-in users; writes via Edge Function + service role)
-- ---------------------------------------------------------------------------

create table if not exists public.sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scroll_id uuid not null references public.scrolls (id) on delete cascade,
  to_email text not null,
  note text not null default '',
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  constraint sends_note_len check (char_length(note) <= 2000),
  constraint sends_to_email_len check (char_length(to_email) <= 320),
  constraint sends_to_email_format check (
    to_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

create index if not exists sends_user_created_idx
  on public.sends (user_id, created_at desc);

alter table public.sends enable row level security;

drop policy if exists "Users read own sends" on public.sends;
drop policy if exists "Users insert own sends" on public.sends;
drop policy if exists "Users update own sends" on public.sends;
drop policy if exists "sends_select_own" on public.sends;

create policy "sends_select_own"
  on public.sends
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete policies for authenticated: only service_role (edge function) may write.

-- ---------------------------------------------------------------------------
-- Privileges: anonymous browsers must not touch these tables directly
-- ---------------------------------------------------------------------------

revoke all on table public.scrolls from anon;
revoke all on table public.sends from anon;

grant select, insert, update, delete on table public.scrolls to authenticated;
grant select on table public.sends to authenticated;
