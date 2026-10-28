# Supabase setup (The Scroll)

## Phase 0 — Create or pick a project

You need **one** Supabase project for this app.

### If you already have a project (e.g. “Akhansha’s Project” on Free)

1. [Open your projects](https://supabase.com/dashboard/projects) and click the project.
2. Copy **PROJECT_REF** from the address bar:  
   `https://supabase.com/dashboard/project/<PROJECT_REF>`
3. In this repo:

```bash
echo 'PASTE_YOUR_REF_HERE' > supabase/.project-ref
npm run supabase:configure
```

4. In the dashboard: **Connect** (top) → **Framework** tab → **Framework: React**, **Variant: Vite** → copy the `.env` block into `.env.local` (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`). Older API pages may label the same key **anon public** as `VITE_SUPABASE_ANON_KEY` — either works.

### If you need a new project

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**.
2. Organization: your account (Free).
3. Name (e.g. `Akhansha's Project`), **database password** (save it), region → **Create**.
4. Wait until status is **Active**, then follow “If you already have a project” above.

### Optional: link Supabase CLI

```bash
npx supabase login
npm run supabase:link
```

---

## Phase 1 — Database, auth, local app

1. **SQL Editor** → run [`../supabase/migrations/001_scrolls_and_sends.sql`](../supabase/migrations/001_scrolls_and_sends.sql).
2. **Authentication → Sign In / Providers** → enable **Email**.
3. **Authentication → URL configuration** → Site URL `http://localhost:5173`, redirect `http://localhost:5173`.
4. `npm run dev` → sign in from the app.

See [README](../README.md) Phase 2 for Resend and `send-scroll` deploy.

Also run:

- [`../supabase/migrations/003_multi_recipient.sql`](../supabase/migrations/003_multi_recipient.sql) — `category` + `sender_email` on `sends`
- [`../supabase/migrations/004_view_tokens.sql`](../supabase/migrations/004_view_tokens.sql) — `view_token` + `image_data` (required for email view links)
- [`../supabase/migrations/005_sender_display_name.sql`](../supabase/migrations/005_sender_display_name.sql) — guest sender name on `sends`
- [`../supabase/migrations/006_soft_delete.sql`](../supabase/migrations/006_soft_delete.sql) — `is_deleted` on `scrolls` and `sends` (desk hides rows; database keeps them)

**Resend:** set secret `SEND_FROM` to `Paper scroll studio <onboarding@resend.dev>`. Until you verify a domain, send only to your Resend account email.

## Sign-in: Supabase mail (default)

Magic links are sent by **Supabase Auth** (any email, within rate limits). Parchment HTML lives in [`../supabase/templates/`](../supabase/templates/) and is wired from [`../supabase/config.toml`](../supabase/config.toml) `[auth.email.template.*]`.

In `config.toml`, `[auth.hook.send_email] enabled = false`. Apply with:

```bash
npx supabase config push --project-ref "$(tr -d '[:space:]' < supabase/.project-ref)" --yes
```

**Once you tap a sign-in letter, you stay signed in on that computer** until you sign out or clear site data.

OTP rate limits show a live countdown in the app (“Try again in N seconds…”).

## Sealed-scroll mail (Resend) — still required for Send by mail

Sending a scroll to someone else uses the `send-scroll` Edge Function + **Resend**. Supabase has no API to deliver arbitrary “note” emails to friends.

1. Deploy `send-scroll` (`npm run supabase:deploy-send`).
2. Edge secrets: `RESEND_API_KEY`, `SEND_FROM` (use `Paper scroll studio <onboarding@resend.dev>` while testing), `VIEW_BASE_URL`, optionally `ALLOWED_ORIGINS`.
3. Until a domain is verified, Resend’s test sender can only deliver to your **Resend signup email** (see the Send sheet hint).

## Optional: Resend Send Email hook (parchment via auth-email)

To route **sign-in** letters through Resend again (same family as sealed scrolls):

1. Set `[auth.hook.send_email] enabled = true` in `config.toml`.
2. Deploy `auth-email` with `--no-verify-jwt`.
3. Set `SEND_EMAIL_HOOK_SECRET`, `RESEND_API_KEY`, `SEND_FROM`; then `export SEND_EMAIL_HOOK_SECRET=...` and `config push`.
4. Prefer `npm run security:hook-secret` for the printed commands.

### Fix magic-link hook 500 (only when the Resend hook is enabled)

If the app shows `Unexpected status code returned from hook: 500`, Auth called `auth-email` and got a failure.

| Cause | What to do |
|-------|------------|
| Missing `SEND_EMAIL_HOOK_SECRET` on Edge | `npm run security:hook-secret`, then run the printed `secrets set` |
| Auth hook secret ≠ Edge secret | `export SEND_EMAIL_HOOK_SECRET=...` then `config push` |
| Missing `RESEND_API_KEY` / bad `SEND_FROM` | Set Edge secrets; keep test `SEND_FROM` |
| Hook 500 + non-Resend email | Use Resend signup email, or keep the hook **off** and use Supabase mail |

Then: `npm run supabase:deploy-auth-email`. Check **Edge Functions → auth-email → Logs** if it still fails.

## Soft-delete

Throwing a roll away sets `scrolls.is_deleted = true` (and matching `sends` rows). The desk and library hide them; SQL Editor still shows the rows. Recipients who already have a view link can still open the letter.

## Guest send (optional — off by default)

Guest send is **off** for a personal desk (magic-link sign-in only). Defaults: `VITE_ALLOW_GUEST_SEND=false`, Edge `ALLOW_GUEST_SEND=false`, `enable_anonymous_sign_ins = false` in `supabase/config.toml`.

To enable later (all three required):

1. Set `VITE_ALLOW_GUEST_SEND=true` in `.env.local` (and GitHub Actions secret `VITE_ALLOW_GUEST_SEND=true` for Pages).
2. Enable **Authentication → Providers → Anonymous** (or `enable_anonymous_sign_ins = true` in `supabase/config.toml` then `npx supabase config push --yes`).
3. Edge Function secret `ALLOW_GUEST_SEND=true`, then redeploy `send-scroll`.
4. Guests pick a **display name** used in the email “From” line; magic-link sign-in still available.

See [SECURITY.md](SECURITY.md) for the full free personal checklist.

## GitHub Pages (production)

1. **Repository → Settings → Secrets and variables → Actions** — add:
   - `VITE_SUPABASE_URL` (same as `.env.local`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (same as `.env.local`)
2. Push to `main` — workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs `npm run build` with those secrets.
3. Auth redirect URLs and site URL are defined in [`../supabase/config.toml`](../supabase/config.toml); apply with:
   ```bash
   npx supabase config push --project-ref "$(tr -d '[:space:]' < supabase/.project-ref)" --yes
   ```
4. Edge secrets for production links: `VIEW_BASE_URL=https://akhanshasen.github.io/The-Scroll`, `ALLOWED_ORIGINS` includes `https://akhanshasen.github.io`.

## Custom domain (free hosting)

**GitHub Pages hosting is free.** Wiring a custom hostname in GitHub Pages is free. **Buying `something.com` is not free** (usually a few dollars per year). There is no trustworthy $0 private `.com`.

### Paths

1. **Keep the live URL (zero cost)** — already works: `https://akhanshasen.github.io/The-Scroll/`
2. **Free subdomain** — e.g. [is-a.dev](https://is-a.dev) (or similar) with a CNAME to `akhanshasen.github.io`. Then GitHub → repo → **Settings → Pages → Custom domain** → that hostname. Enable HTTPS when GitHub offers it.
3. **Paid domain, free hosting** — buy a name (Cloudflare Registrar, Namecheap, Porkbun, etc.), point DNS at GitHub Pages (`CNAME` to `akhanshasen.github.io`, or the A records GitHub documents for apex domains). Same Pages custom-domain setting; enable HTTPS.

### After any new hostname

Update these or magic-link redirects and view links break:

1. GitHub Pages custom domain (above).
2. [`../supabase/config.toml`](../supabase/config.toml) — set `site_url` and add the new origin to `additional_redirect_urls`, then:
   ```bash
   npx supabase config push --project-ref "$(tr -d '[:space:]' < supabase/.project-ref)" --yes
   ```
3. Edge secrets: `VIEW_BASE_URL=https://your-hostname` (no trailing slash issues — match how the app is served), `ALLOWED_ORIGINS` includes `https://your-hostname`.
4. Redeploy `send-scroll` if it caches origins only from secrets (secrets apply without redeploy; redeploy only if you changed function code).

Do not invent a domain in the app until you have chosen one and finished DNS + Pages.

Legacy note: an older doc referenced project `kaiffjdbfjkjqisumklh`. Use **your** project ref in `.project-ref` instead.
