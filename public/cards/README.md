# Shared Photocard Library
Every image listed in `manifest.json` here becomes a photocard **every player in the game can win**.
Every image in this folder becomes a photocard **every player can win**.
## How to add cards (as admin)
## How to add cards
1. Drop image files into this folder (`public/cards/`). Supported: `.jpg`, `.png`, `.webp`, `.svg`.
2. Open `manifest.json` and add one entry per card:
1. Drop image files into this folder (`public/cards/`). Supported: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`, `.svg`.
2. Commit and push to GitHub. That's it.
   ```json
   {
     "id": "twice-momo-01",
     "image": "/cards/twice-momo-01.jpg",
     "rarity": "rare"
   }
   ```
On the next build, `scripts/generate-manifest.mjs` scans this folder and rewrites `manifest.json` automatically. Netlify redeploys, and every player pulls the new library on load.
3. `id` must be unique. `rarity` must be one of: `common`, `rare`, `ultra`, `impossible`.
4. Commit and push to GitHub. Netlify redeploys automatically. Every player who opens the app pulls the new library on load.
## Setting rarity (optional)
## How to remove a card
By default every card is **common**. To make a card rarer, prefix its filename:
Delete its entry from `manifest.json` (and optionally the image file). Players who already own that card keep it in their binder — new spins just won't produce it.
- `rare-anything.jpg`
- `ultra-anything.jpg`
- `impossible-anything.jpg`
- `common-anything.jpg` (or no prefix)
Anything after the prefix is up to you — spaces, weird characters, whatever. The `id` is auto-generated from the filename.
## Odds
Weighted per rarity: common 70 / rare 50 / ultra 30 / impossible 10.
## Local uploads
## Removing a card
Admin uploads made inside the running app go to that admin's browser only — this JSON file is the *shared* source of truth.
Delete the image file. Next build regenerates the manifest without it. Players who already own that card keep it.
## Run manually
```bash
bun run cards      # regenerate manifest.json from current files
```
