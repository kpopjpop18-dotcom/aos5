# Shared Photocard Library

Every image listed in `manifest.json` here becomes a photocard **every player in the game can win**.

## How to add cards (as admin)

1. Drop image files into this folder (`public/cards/`). Supported: `.jpg`, `.png`, `.webp`, `.svg`.
2. Open `manifest.json` and add one entry per card:

   ```json
   {
     "id": "twice-momo-01",
     "image": "/cards/twice-momo-01.jpg",
     "rarity": "rare"
   }
   ```

3. `id` must be unique. `rarity` must be one of: `common`, `rare`, `ultra`, `impossible`.
4. Commit and push to GitHub. Netlify redeploys automatically. Every player who opens the app pulls the new library on load.

## How to remove a card

Delete its entry from `manifest.json` (and optionally the image file). Players who already own that card keep it in their binder — new spins just won't produce it.

## Odds

Weighted per rarity: common 70 / rare 50 / ultra 30 / impossible 10.

## Local uploads

Admin uploads made inside the running app go to that admin's browser only — this JSON file is the *shared* source of truth.
