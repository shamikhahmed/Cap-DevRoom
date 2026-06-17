# Cap DevRoom — setup complete

The project lives at **`~/Desktop/Cap-DevRoom`** (sibling to Cap-Markroom on Desktop). Live Cap apps remain in **`~/Desktop/Projects/`**.

## Run

```bash
cd ~/Desktop/Cap-DevRoom
npm install && npm run rebuild:packages && npm run db:push
cp dashboard/.env.example dashboard/.env.local   # add CURSOR_API_KEY
npm run sync:sandboxes
npm run dev:stack
```

Open http://localhost:3000

## Optional: git init

```bash
cd ~/Desktop/Cap-DevRoom
git init
git add .
git commit -m "Cap DevRoom v3 — portfolio agent office for 8 Cap apps."
```

## Pair with Cap-Markroom

| Tool | Path |
|------|------|
| Cap DevRoom | `~/Desktop/Cap-DevRoom` |
| Cap Markroom | `~/Desktop/Cap-Markroom` |
| Cap apps | `~/Desktop/Projects/{VaultCap,...}` |
| Hub | `~/Desktop/Projects/shamikhahmed.github.io` |
