-- Multi-recipient send: category + sender email on each send row
-- Run in Supabase SQL Editor after 001 (and 002 if needed).

alter table public.sends
  add column if not exists category text not null default 'friend';

alter table public.sends
  drop constraint if exists sends_category_allowed;

alter table public.sends
  add constraint sends_category_allowed check (
    category in ('family', 'friend', 'colleague', 'acquaintance')
  );

alter table public.sends
  add column if not exists sender_email text not null default '';

comment on column public.sends.category is 'Relationship label: family | friend | colleague | acquaintance';
comment on column public.sends.sender_email is 'Signed-in user email at send time (for dashboard readability)';
