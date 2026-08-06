# GetRider Break-It Server

Live consolidation endpoint + dashboard for Branch Test Day. The tester app
posts each result here; you watch results roll in and hand the India team a
single CSV/JSON at the end.

- `POST /breakit` — one result (the app calls this on every tap)
- `POST /breakit/batch` — many results (the app's retry queue flushes here)
- `GET  /dashboard?token=…` — live dashboard in a browser
- `GET  /export.csv?token=…` / `GET /export.json?token=…` — consolidated download
- `GET  /api/summary?token=…` — JSON the dashboard polls

Everything is guarded by a shared `INGEST_TOKEN`. Not production-grade auth —
a "don't let randoms post to it" key, which is right for a one-day internal test.

---

## Deploy to Railway (≈10 min, no local setup needed)

### 1. Get this code onto GitHub
Easiest path, no terminal:
1. Go to **github.com/new**, create an empty repo (e.g. `getrider-breakit-server`). Don't add a README — this folder has one.
2. On the new repo page, click **uploading an existing file**.
3. Drag in **everything in this folder** — `src/`, `package.json`, `tsconfig.json`, `nest-cli.json`, `.gitignore`, `.env.example`, `README.md`. (Do **not** upload `node_modules` or `dist` — they aren't here, and shouldn't be.)
4. Commit.

### 2. Create the Railway project + database
1. Railway → **New Project**.
2. Inside it → **New → Database → Add PostgreSQL**. Railway makes a `DATABASE_URL` automatically. You don't copy it.

### 3. Add the service
1. **New → GitHub Repo** → pick the repo you just made.
2. Railway detects Node, runs `npm install` then `npm run build` then `npm start`. (Build/start are already in `package.json`.)

### 4. Set the variables on the service
Service → **Variables**:
- `INGEST_TOKEN` → a long random string you invent (20+ chars). Write it down — you'll need it in the app and the dashboard URL.
- `DATABASE_URL` → click **Add Reference → Postgres → DATABASE_URL**. Don't paste it by hand.

### 5. Make it public
Service → **Settings → Networking → Generate Domain**. You get something like
`getrider-breakit-production.up.railway.app`. That's your base URL.

### 6. Confirm it's alive
Open `https://YOUR-DOMAIN/` in a browser → you should see
`{"ok":true,"service":"getrider-breakit",...}`.
Then open `https://YOUR-DOMAIN/dashboard?token=YOUR_TOKEN` → the live dashboard.

---

## Wire the tester app to it

Open the tester app, tap the **gear icon**, paste:
- **Endpoint:** `https://YOUR-DOMAIN` (no trailing slash)
- **Token:** the same `INGEST_TOKEN`

Tap **Test connection** — it should go green. From then on the app dual-writes:
every result saves on the phone **and** posts here. If the network drops, it
queues and retries; the CSV export still works as a backstop. No result is ever
lost.

To hand out an app that's already wired, do the gear-icon step once, then
re-share that file — the settings travel with it.

---

## During the day
- Keep `https://YOUR-DOMAIN/dashboard?token=…` open on the big screen.
- Failures rank by severity (S1 first). Per-tester progress shows who's moving.
- At the end: **CSV** button → one file for Hyderabad. Done.

## Notes
- Free Railway services sleep when idle. First request after a nap takes a few
  seconds to wake — harmless, the app's retry queue handles it.
- Re-submitting the same test by the same tester **updates** their row; it never
  duplicates. Testers can change a verdict freely.
