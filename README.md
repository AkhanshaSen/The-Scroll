# The Scroll

**Paper scroll studio** — an offline-first web app for clumsy words, poems, and free writing on textured paper that unrolls like a scroll. Sign in with Supabase to sync your library and **fold a scroll into an envelope** to email it.

- Local poem generation (sonnet, haiku, couplets, limerick, free verse, note) or **Blank** canvas
- Handwriting fonts, papers, inks, stickers, pen strokes
- Library drawer, print / PDF export of the sheet as you see it
- **Send by mail**: fold animation → envelope → email (Resend via Supabase Edge Function)
- Local cache in `localStorage`; cloud sync when signed in

**Developer:** Akhansha Sen

## Run locally

```bash
npm install
npm run supabase:open-dashboard   # pick or create a project (Free plan is fine)
# Copy project ref from URL into supabase/.project-ref (see docs/SUPABASE_SETUP.md)
npm run supabase:configure
# Paste anon key into .env.local from Dashboard → Connect → API
npm run dev
```

Open http://localhost:5173/

Full walkthrough: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

### One-time Supabase setup

1. **SQL** — run [`supabase/migrations/001_scrolls_and_sends.sql`](supabase/migrations/001_scrolls_and_sends.sql) in the SQL editor. If you applied an older version of that file earlier, also run [`002_security_hardening.sql`](supabase/migrations/002_security_hardening.sql). See [docs/SECURITY.md](docs/SECURITY.md) for RLS, triggers, and key handling.
2. **Auth** — Authentication → Providers → enable **Email** (magic link / OTP).
3. **Edge Function secrets** (Project Settings → Edge Functions → Secrets, or CLI):
   - `RESEND_API_KEY` — from [resend.com](https://resend.com)
   - `SEND_FROM` — display name + address, e.g. `Paper scroll studio <onboarding@resend.dev>` (inbox shows **Paper scroll studio**; replies use `reply_to` = signed-in sender). With Resend’s test address you can only send **to your Resend signup email** until you verify a domain.
   - `ALLOWED_ORIGINS` (optional) — comma-separated CORS origins, e.g. `http://localhost:5173,https://akhanshasen.github.io`
   - `VIEW_BASE_URL` — base URL for recipient view links, e.g. `http://localhost:5173` (dev) or `https://akhanshasen.github.io/The-Scroll` (Pages)
4. **Deploy the function:**

```bash
npx supabase login
npm run supabase:deploy-send
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to Edge Functions.

## Build

```bash
npm run build
npm run preview
```

## Live site

GitHub Pages (after Actions on `main`):

https://akhanshasen.github.io/The-Scroll/

For Pages builds that need Auth, add the same `VITE_SUPABASE_*` values as repository **Actions secrets** and wire them into the deploy workflow `env` for `npm run build`.

In the repo **Settings → Pages**, set **Source** to **GitHub Actions**.

## License

MIT
