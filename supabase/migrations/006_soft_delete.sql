-- Soft-delete: hide scrolls (and their send log) in the app without erasing rows.

alter table public.scrolls
  add column if not exists is_deleted boolean not null default false;

alter table public.sends
  add column if not exists is_deleted boolean not null default false;

create index if not exists scrolls_user_visible_idx
  on public.scrolls (user_id, is_deleted, updated_at desc);

create index if not exists sends_user_visible_idx
  on public.sends (user_id, is_deleted, created_at desc);

create or replace function public.scrolls_soft_delete_cascade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_deleted is true and old.is_deleted is distinct from true then
    update public.sends
      set is_deleted = true
      where scroll_id = new.id
        and is_deleted is distinct from true;
  end if;
  return new;
end;
$$;

drop trigger if exists scrolls_soft_delete_cascade on public.scrolls;
create trigger scrolls_soft_delete_cascade
  after update of is_deleted on public.scrolls
  for each row
  execute function public.scrolls_soft_delete_cascade();
