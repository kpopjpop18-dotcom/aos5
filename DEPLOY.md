# Deploy Archive of Stars

## Option A — Netlify (recommended)

1. Push this project to GitHub (in Lovable: **+ menu → GitHub → Connect project**).
2. Go to https://app.netlify.com → **Add new site → Import from GitHub** → pick this repo.
3. Netlify auto-detects `netlify.toml`. Confirm:
   - Build command: `bun run build`
   - Publish directory: `dist`
4. Click **Deploy**. Done.

The SPA redirect (`/* → /index.html 200`) is handled by both `netlify.toml`
and `public/_redirects` so deep links work.

## Option B — Any static host (Vercel, Cloudflare Pages, GitHub Pages)

- Build command: `bun run build` (or `npm run build`)
- Output directory: `dist`
- SPA fallback: rewrite all unmatched paths to `/index.html`

## Admin

- Open the app → tap **⋮** in the top-right → password: **`atiny-admin`**
- Upload photocards, set rarity, view stats, ban users.
- Cards & user data are stored in the **browser's localStorage** — each device
  has its own library. For a real shared library across all players (GitHub /
  cloud sync, cross-user trading, chat, friends), a backend is required.
