# Security model (Supabase)

## Transport and keys

- Browser traffic uses **HTTPS** to `*.supabase.co` (TLS terminated by Supabase).
- The app embeds only the **anon (public) key** in `VITE_SUPABASE_ANON_KEY`. That key is designed to be public; it cannot bypass Row Level Security.
- **Never** commit `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `.env.local`. Service role and Resend keys live only in Supabase Edge Function secrets and your local deploy environment.

## SQL injection

- The React app uses `@supabase/supabase-js`, which sends **parameterized** filters (`.eq('id', id)`) and JSON bodies to PostgREST. User text is not concatenated into SQL strings.
- Custom SQL exists only in **migrations** you run once in the Supabase SQL editor, not from user input.

## Database access control

| Role | `scrolls` | `sends` |
|------|-----------|---------|
| `anon` | No privileges | No privileges |
| `authenticated` | CRUD own rows (RLS) | **Select** own rows only |
| `service_role` | Full (server only) | Insert/update for email pipeline |

**Row Level Security** is enabled on both tables. Policies require `auth.uid() = user_id`.

**Trigger `scrolls_enforce_owner`** sets `user_id = auth.uid()` on every insert/update so a signed-in user cannot assign scrolls to someone else’s account, even if they tamper with the request body.

**CHECK constraints** cap payload size, title length, form enum, email format, and note length so oversized or malformed rows are rejected by Postgres.

## Send by mail

- The `send-scroll` Edge Function has **`verify_jwt = true`** (see `supabase/functions/send-scroll/config.toml`).
- It validates the user JWT, confirms the scroll belongs to that user, then uses the **service role** only on the server to write `sends` and call Resend.
- Clients cannot insert fake “sent” records or change send status; those policies were removed for `authenticated`.
- CORS is limited to `ALLOWED_ORIGINS` (optional secret, comma-separated) plus localhost and GitHub Pages defaults.
- HTML in email uses `escapeHtml` for user-provided title and note.

## What you should configure in Supabase Dashboard

1. Run [`001_scrolls_and_sends.sql`](../supabase/migrations/001_scrolls_and_sends.sql). If you ran an older version, also run [`002_security_hardening.sql`](../supabase/migrations/002_security_hardening.sql).
2. **Authentication → URL configuration**: add only your real app origins (localhost, GitHub Pages).
3. **Authentication → Providers**: keep Email on; disable unused providers.
4. **Edge Function secrets**: `RESEND_API_KEY`, `SEND_FROM` (use `Paper scroll studio <onboarding@resend.dev>` while testing), `VIEW_BASE_URL`, optionally `ALLOWED_ORIGINS`, optionally `ALLOW_GUEST_SEND` (`true`/`false` — gates anonymous guest sends).
5. **Guest send**: optional via `VITE_ALLOW_GUEST_SEND`. Guests use Supabase anonymous auth + a display name (no reply-to). Turn off both client and Edge flags to disable.
5. Do not expose the database connection string or service role key in the frontend or GitHub Actions logs.

## Local data

Unsigned users still use **localStorage** only; that data never hits Supabase until they sign in and sync.
