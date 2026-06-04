# Deploying VentureLab (Vercel + Supabase)

This deploys the **React SPA** and the **FastAPI REST backend** together on
Vercel, with **Supabase Postgres** as the database.

> The live idea-generator (WebSocket) feature is intentionally **disabled** in
> this deployment — Vercel serverless functions cannot hold WebSocket
> connections or run background loops. The UI degrades gracefully (the
> Analytics "Live" badge just shows *Disconnected*). To keep it, host the
> backend on a WS-capable platform instead and set `VITE_ENABLE_WS=true`.

---

## 1. Create the Supabase database

1. Create a project at <https://supabase.com>.
2. **Project Settings → Database → Connect**. Copy the **Transaction pooler**
   connection string (host `…pooler.supabase.com`, port **6543**) — this is the
   one to use for serverless. It looks like:
   ```
   postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
   Append `?sslmode=require`.

## 2. Create the schema (one time, from your machine)

The app can auto-migrate on boot, but for serverless it's best to run it once
up front and then turn auto-migrate off.

```powershell
cd backend
python -m venv venv; .\venv\Scripts\Activate.ps1   # if not already
pip install -r requirements.txt
$env:DATABASE_URL = "postgresql://postgres.<ref>:<pwd>@...pooler.supabase.com:6543/postgres?sslmode=require"
alembic upgrade head
```

This creates the `users / ideas / offers / feedback / milestones /
offer_status_audit` tables. (The SQL Server stored procedures & triggers in
migration `0002` are skipped on Postgres — all rules are also enforced in the
API code.) Demo data is seeded automatically on first boot, or run
`python -m app.seed`.

## 3. Deploy to Vercel

Push the repo to GitHub and **Import** it in Vercel (or run `vercel` from the
CLI). The included `vercel.json` already wires it up:

- `package.json` → `@vercel/static-build` builds the Vite SPA into `dist/`.
- `api/index.py` → `@vercel/python` serves the FastAPI app.
- Routes: `/api/*` and `/health` hit the Python function; real files are served
  from `dist/`; everything else falls back to `index.html` (SPA routing).
- Python deps install from the root `requirements.txt` (which re-exports
  `backend/requirements.txt`).

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Supabase pooled string (`…6543…?sslmode=require`) | Backend |
| `VENTURELAB_JWT_SECRET` | a long random string | Backend — replaces the insecure default |
| `VENTURELAB_AUTO_MIGRATE` | `false` | Backend — schema already created in step 2 |
| `VITE_API_MODE` | `rest` | Frontend (build-time) |
| `VITE_API_URL` | *(empty string)* | Frontend — empty ⇒ same-origin relative `/api` calls |
| `VENTURELAB_TOKEN_TTL_SEC` | `7200` *(optional)* | Backend — session token lifetime (default 2h) |

> `VITE_*` vars are read at **build time**, so set them before deploying. Leave
> `VITE_API_URL` empty so the SPA calls the API on its own Vercel domain.

## 4. Verify

- Open the deployment URL → the SPA loads.
- `GET /health` → `{"status":"ok"}`.
- Log in with a seeded account, browse ideas, submit/accept an offer — confirm
  the equity-cap rule and "accepted offers can't be deleted" rule fire.
- The Analytics view loads; the "Live" badge shows *Disconnected* (expected).

## Local development (unchanged)

```powershell
# Frontend
npm run dev:rest            # SPA in REST mode against http://localhost:8000

# Backend (SQL Server or Postgres or SQLite via DATABASE_URL)
cd backend; uvicorn app.main:app --reload --port 8000
```

Unit/e2e tests still run against SQLite with no DB setup:
`npm test`, `npm run test:e2e`, and `cd backend; pytest`.
