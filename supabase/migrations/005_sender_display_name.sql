-- Optional display name for guest / branded "From" line in scroll emails.
-- Run after 004_view_tokens.sql.

alter table public.sends
  add column if not exists sender_display_name text not null default '';

alter table public.sends
  drop constraint if exists sends_sender_display_name_len;

alter table public.sends
  add constraint sends_sender_display_name_len check (char_length(sender_display_name) <= 40);

comment on column public.sends.sender_display_name is 'Guest or preferred name shown in email From line (not an email address).';
