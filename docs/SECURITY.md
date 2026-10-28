# Security model (Supabase)

## Transport and keys

- Browser traffic uses **HTTPS** to `*.supabase.co` (TLS terminated by Supabase).
- The app embeds only the **anon / publishable (public) key** in `VITE_SUPABASE_PUBLISHABLE_KEY` (or legacy `VITE_SUPABASE_ANON_KEY`). That key is designed to be public; it cannot bypass Row Level Security.
- **Never** commit `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET`, or `.env.local`. Service role and Resend keys live only in Supabase Edge Function secrets.

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
- Failures return a generic client message; details stay in Edge Function logs.

## What you should configure in Supabase Dashboard

1. Run [`001_scrolls_and_sends.sql`](../supabase/migrations/001_scrolls_and_sends.sql). If you ran an older version, also run [`002_security_hardening.sql`](../supabase/migrations/002_security_hardening.sql).
2. **Authentication → URL configuration**: add only your real app origins (localhost, GitHub Pages). Prefer applying [`../supabase/config.toml`](../supabase/config.toml) with `npx supabase config push`.
3. **Authentication → Providers**: keep Email on; disable unused providers. Anonymous stays **off** unless you deliberately enable guest send.
4. **Edge Function secrets**: `RESEND_API_KEY`, `SEND_FROM` (use `Paper scroll studio <onboarding@resend.dev>` while testing), `VIEW_BASE_URL`, optionally `ALLOWED_ORIGINS`, and `ALLOW_GUEST_SEND=false` for a personal desk. Set `SEND_EMAIL_HOOK_SECRET` **only if** you re-enable `[auth.hook.send_email]` for Resend-backed sign-in.
5. Do not expose the database connection string or service role key in the frontend or GitHub Actions logs.

## Local data

Unsigned users still use **localStorage** only; that data never hits Supabase until they sign in and sync.

---

## Personal project checklist (free)

No paid scanners, rate-limit SaaS, or scheduled backup add-ons required.

### Where secrets live

| Secret | Location |
|--------|----------|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.local` (gitignored) + GitHub Actions secrets for Pages |
| `VITE_ALLOW_GUEST_SEND` | `.env.local` + GitHub Actions (default **false**) |
| `RESEND_API_KEY`, `SEND_FROM`, `VIEW_BASE_URL`, `ALLOWED_ORIGINS`, `ALLOW_GUEST_SEND` | Supabase Edge Function secrets only |
| `SEND_EMAIL_HOOK_SECRET` | Only if Send Email hook is enabled: Edge secrets + Auth hook (`config.toml` `env(SEND_EMAIL_HOOK_SECRET)`) |
| Service role key | Supabase only (injected into Edge Functions; never in Vite or GitHub) |

Generate and print set-commands for the hook secret: `npm run security:hook-secret`.

### Auth rate limits

Leave **Authentication → Rate Limits** at Supabase defaults. That is free brute-force / magic-link spam protection. Do not add a separate rate-limit product for this app.

### Guest send (off by default)

Personal desk = magic-link only:

1. `VITE_ALLOW_GUEST_SEND=false` (client + GitHub Actions).
2. Edge secret `ALLOW_GUEST_SEND=false` (server rejects anonymous sends when unset or false).
3. `enable_anonymous_sign_ins = false` in [`../supabase/config.toml`](../supabase/config.toml), then `config push`.

To turn guest send on later, flip all three to true and redeploy `send-scroll`.

### Backups (manual)

Scheduled daily backups need a paid Supabase plan. Free option: occasionally export from the Dashboard (or `npx supabase db dump`) and keep the file **outside this repo**. Open the dump once so you know it restores.

### Packages and advisor

```bash
npm run security:audit
```

Before treating a deploy as live, open Supabase **Security Advisor** (free) and skim findings.

### Auth URLs

[`../supabase/config.toml`](../supabase/config.toml) Site URL and redirect URLs are only localhost and GitHub Pages. After edits:

```bash
npx supabase config push --project-ref "$(tr -d '[:space:]' < supabase/.project-ref)" --yes
```

Keep unused Auth providers disabled.

### One-time apply (after cloning / hardening)

Run these **one command at a time**. Do not paste comment lines (`# …`) into the shell. Do not leave the placeholder `YOUR_REF` — the snippets below read `supabase/.project-ref`.

```bash
# 1) Guest send off (personal desk)
npx supabase secrets set ALLOW_GUEST_SEND=false --project-ref "$(tr -d '[:space:]' < supabase/.project-ref)"

# 2) Push auth URLs + Send Email hook off (sign-in via Supabase mail)
npx supabase config push --project-ref "$(tr -d '[:space:]' < supabase/.project-ref)" --yes

# 3) GitHub Actions public Vite vars
bash scripts/set-github-actions-secrets.sh

# 4) Redeploy send-scroll (scroll mail still uses Resend)
npm run supabase:deploy-send
```

Then in the Dashboard: leave **Authentication → Rate Limits** on; skim **Security Advisor**. Push `main` so Pages rebuilds with guest UI off.

Sign-in uses Supabase Auth + `supabase/templates/*.html` when the hook is off. Re-enabling the Resend hook requires `SEND_EMAIL_HOOK_SECRET` — see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
