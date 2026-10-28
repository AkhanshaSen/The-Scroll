-- Recipient view tokens: each send row gets a one-time-use UUID token.
-- Recipients open the scroll via /?view=<token> without needing to sign in.
-- image_data stores the base64-encoded paper snapshot embedded in the email.
-- Run after 001 (and 002/003 if applied).

alter table public.sends
  add column if not exists view_token uuid not null default gen_random_uuid(),
  add column if not exists image_data text not null default '';

-- Unique index so we can look up a send by its view_token efficiently.
create unique index if not exists sends_view_token_idx
  on public.sends (view_token);

comment on column public.sends.view_token is 'Opaque UUID used in the recipient view URL (/?view=<token>). No auth required.';
comment on column public.sends.image_data is 'Base64 paper snapshot stored at send time for the recipient view page.';
