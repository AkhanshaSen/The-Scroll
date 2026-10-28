-- Performance: wrap auth.uid() in (select ...) so Postgres uses an InitPlan
-- (evaluate once per statement) instead of re-evaluating per row (advisor lint 0003).
-- Also index sends.scroll_id for FK checks and soft-delete cascade (lint 0001).

-- ---------------------------------------------------------------------------
-- scrolls RLS
-- ---------------------------------------------------------------------------

drop policy if exists "scrolls_select_own" on public.scrolls;
drop policy if exists "scrolls_insert_own" on public.scrolls;
drop policy if exists "scrolls_update_own" on public.scrolls;
drop policy if exists "scrolls_delete_own" on public.scrolls;

create policy "scrolls_select_own"
  on public.scrolls
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "scrolls_insert_own"
  on public.scrolls
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "scrolls_update_own"
  on public.scrolls
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "scrolls_delete_own"
  on public.scrolls
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- sends RLS
-- ---------------------------------------------------------------------------

drop policy if exists "sends_select_own" on public.sends;

create policy "sends_select_own"
  on public.sends
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- FK covering index (sends_scroll_id_fkey)
-- ---------------------------------------------------------------------------

create index if not exists sends_scroll_id_idx on public.sends (scroll_id);
