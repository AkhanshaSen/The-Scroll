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

**Resend:** set secret `SEND_FROM` to `Paper scroll studio <onboarding@resend.dev>`. Until you verify a domain, send only to your Resend account email. Scroll emails are separate from Supabase Auth magic-link emails.

## Guest send (optional)

1. Set `VITE_ALLOW_GUEST_SEND=true` in `.env.local` (and GitHub Actions secret `VITE_ALLOW_GUEST_SEND=true` for Pages).
2. Enable **Authentication → Providers → Anonymous** (or `enable_anonymous_sign_ins = true` in `supabase/config.toml` then `npx supabase config push --yes`).
3. Edge Function secret `ALLOW_GUEST_SEND=true` (set to `false` to reject anonymous sends server-side).
4. Guests pick a **display name** used in the email “From” line; magic-link sign-in still available.

## GitHub Pages (production)

1. **Repository → Settings → Secrets and variables → Actions** — add:
   - `VITE_SUPABASE_URL` (same as `.env.local`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (same as `.env.local`)
2. Push to `main` — workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs `npm run build` with those secrets.
3. Auth redirect URLs and site URL are defined in [`../supabase/config.toml`](../supabase/config.toml); apply with:
   ```bash
   npx supabase config push --project-ref YOUR_REF --yes
   ```
4. Edge secrets for production links: `VIEW_BASE_URL=https://akhanshasen.github.io/The-Scroll`, `ALLOWED_ORIGINS` includes `https://akhanshasen.github.io`.

Legacy note: an older doc referenced project `kaiffjdbfjkjqisumklh`. Use **your** project ref in `.project-ref` instead.
