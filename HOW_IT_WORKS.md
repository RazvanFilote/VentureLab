# VentureLab — How it works (Bronze Assignments 3 + 4)

This is the single-page tour of the prototype. It explains, in plain English,
what each piece does and where the corresponding code lives — so you can show
the lab assistant any requirement on demand.

The app is a startup ↔ investor marketplace with two front-end roles
(Investor / Startup Owner) plus an Admin. It runs as:

```
   Phone / second machine            Laptop (server)
   ──────────────────────            ──────────────────────────────
   browser  ──── HTTPS 5174 ───►     Vite dev server (React SPA)
                                       │
                                       ▼ SPA loaded on phone
   browser JS ── HTTPS 8000 ──►      FastAPI (uvicorn + TLS)
                                       │ SQLAlchemy ORM
                                       ▼
                                     SQL Server (Express)
```

---

## 1. Tech stack

| Layer            | Choice                                                             |
|------------------|--------------------------------------------------------------------|
| Backend language | Python 3.13                                                        |
| Web framework    | FastAPI + uvicorn                                                  |
| ORM              | SQLAlchemy 2.x                                                     |
| Migrations       | Alembic                                                            |
| Database         | Microsoft SQL Server Express (via `pyodbc` + ODBC Driver 18)       |
| Auth             | bcrypt (passlib) for password hashes, JWT (HS256, python-jose)     |
| Transport        | HTTPS with a self-signed cert (`backend/certs/dev-*.pem`)          |
| Frontend         | React 18 + Vite 6 + Tailwind                                       |
| Tests            | pytest (backend), vitest (frontend) — **124 + 191 = 315 tests**    |

---

## 2. Bronze Assignment 3 — Database & persistence

### 2.1 Source of truth: the ORM domain objects

The schema is **defined exactly once** as Python classes in
`backend/app/db/models.py`. The relevant tables are:

| Table                | Purpose                                                                | Key columns                                                 |
|----------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `users`              | Accounts with a role (Admin / StartupOwner / Investor)                 | `id`, `name`, `email` (unique), `password_hash`, `role`     |
| `ideas`              | Startup ideas posted by owners                                         | `id`, `title`, `industry`, `stage`, `description`, `created_by`, `created_at` |
| `offers`             | Investment offers an investor makes on an idea                         | `id`, `idea_id` FK, `investor_name`, `amount`, `equity`, `message`, `status`, `created_at` |
| `feedback`           | Comments + 1–5 ratings on ideas                                        | `id`, `idea_id` FK, `user`, `rating`, `comment`, `created_at` |
| `milestones`         | Roadmap items per idea                                                 | `id`, `idea_id` FK, `title`, `status`, `due_date`           |
| `offer_status_audit` | Trigger-populated change log of `offers.status`                        | `id`, `offer_id`, `old_status`, `new_status`, `changed_at`  |

### 2.2 Schema is **migrated from the objects**, not hand-written

```bash
cd backend
alembic upgrade head        # apply all migrations
```

- `alembic/versions/0001_initial.py` — schema generated from `Base.metadata`
  of `app/db/models.py`. (The file in the repo mirrors what
  `alembic revision --autogenerate` would emit; we hand-checked it once so it
  reads cleanly in the demo.)
- `alembic/versions/0002_procs_triggers.py` — T-SQL stored procedures and
  triggers (see §2.4).
- `alembic/versions/0003_password_hash.py` — renames `users.password` to
  `users.password_hash` when Assignment 4 (auth) was added.

`backend/app/main.py` calls `run_migrations()` in the FastAPI lifespan, so
launching the server against an empty database is enough — Alembic creates
the schema, then `seed.py` inserts the demo rows.

### 2.3 CRUD, filters, statistics

| Operation                  | HTTP endpoint                         | Backed by                                                                  |
|----------------------------|---------------------------------------|----------------------------------------------------------------------------|
| Create / Read / Update / Delete on each entity | `GET/POST/PUT/PATCH/DELETE /api/{ideas,offers,feedback,milestones,users}` | `app/routers/*.py` → `app/store/*.py` (SQLAlchemy)         |
| Filter offers by status     | `GET /api/offers?status=Pending`      | `OfferStore.by_status()`                                                   |
| Filter feedback by idea     | `GET /api/feedback?idea_id=<uuid>`    | `FeedbackStore.by_idea()`                                                  |
| Pagination on every list    | `?page=N&page_size=M`                 | `app/schemas/pagination.py`                                                |
| Global statistics           | `GET /api/stats`                      | Stored procedure `sp_global_stats` on SQL Server                           |
| Per-idea statistics         | `GET /api/stats/ideas/{idea_id}`      | Stored procedure `sp_idea_stats`                                           |

### 2.4 Stored procedures & triggers

Defined in `alembic/versions/0002_procs_triggers.py` and applied to SQL
Server on migration. (On SQLite the migration is a no-op, which is what the
unit tests run against.)

**Procedures**
- `sp_global_stats` — one-row aggregate (counts, average rating, milestone
  completion %).
- `sp_owner_percent @idea_id` — OUTPUT parameter: `100 − Σ equity of accepted offers`.
- `sp_idea_stats @idea_id` — per-idea aggregate (counts, owner %, avg rating, milestones).

**Triggers (on `offers`)**
- `trg_offers_validate_equity` (INSTEAD OF INSERT) — rejects an INSERT whose
  `equity` would over-allocate the idea. Defence-in-depth: even a raw
  `INSERT` from SSMS is blocked.
- `trg_offers_status_audit` (AFTER UPDATE) — appends a row to
  `offer_status_audit` whenever `status` changes.
- `trg_offers_block_accepted_delete` (INSTEAD OF DELETE) — refuses to delete
  an offer whose status is `Accepted`. The application returns 409 first;
  the trigger guarantees the rule even on direct DB access.

### 2.5 3NF proof (short version)

For every table, **the primary key (`id`) is the only determinant of every
non-key column**. Concrete check:

- `users`: `id → name, email, password_hash, role`. `email` is also a
  candidate key (UNIQUE) and determines only itself. ✓
- `ideas`: `id → title, industry, stage, description, created_by, created_at`. ✓
- `offers`: we explicitly **removed `idea_title`** from this table (it would
  have given `id → idea_id → idea_title`, a transitive dependency). The
  serializer joins on `ideas` instead. ✓
- `feedback`, `milestones`, `offer_status_audit`: single-column PK and no
  non-key column determines another. ✓

Full table-by-table proof in `backend/BRONZE_DB.md §3`.

### 2.6 Tests

```bash
cd backend
python -m pytest tests/ --ignore=tests/test_db_procs_triggers.py -q
# → 124 passed   (ORM/CRUD/filters/stats/auth — runs against SQLite)
```

The stored-procedure/trigger tests need a real SQL Server:

```bash
set DATABASE_URL=mssql+pyodbc://@localhost\SQLEXPRESS/venturelab_test?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
python -m pytest tests/test_db_procs_triggers.py -v
# → 6 passed
```

Frontend test suite (CRUD UI + validation + auth + idle logout):

```bash
npm test          # 191 passed
```

---

## 3. Bronze Assignment 4 — Authentication / authorization / HTTPS / sessions

### 3.1 Passwords

- `app/auth.py` — `passlib` with bcrypt: `hash_password()` / `verify_password()`.
- The seed runs `hash_password("admin123")` for Sarah and `hash_password("password123")` for everyone else — same demo credentials you saw before.
- The `users.password_hash` column never stores plaintext. Confirmed by `tests/test_auth.py::test_hash_password_is_not_plaintext`.

### 3.2 Tokens & sessions

- JWT, HS256, signed with `VENTURELAB_JWT_SECRET` env var (dev fallback in code).
- TTL: **2 minutes** (`VENTURELAB_TOKEN_TTL_MIN=2`).
- `/api/auth/login` returns `{ access_token, expires_in, user }`.
- `/api/auth/me` is the canonical refresh check — the SPA polls it on mount
  to validate a stored token, and uses `/api/auth/refresh` mid-session.
- Every protected router declares `dependencies=[Depends(get_current_user)]`;
  `/api/users` declares `Depends(require_admin)`.
- Tested in `backend/tests/test_auth.py` — 26 tests cover register, login (wrong
  pw / unknown email / case-insensitive), `/me` with missing / garbage /
  expired / deleted-user tokens, refresh, and role guards.

### 3.3 Inactivity logout (frontend)

`src/app/context/AuthContext.tsx`:

- Tracks `mousedown`, `keydown`, `touchstart`, `click`, `scroll` to reset an
  idle timer set to **2 minutes** (`IDLE_TIMEOUT_MS`).
- On expiry, `logout()` is called → token cleared from `localStorage` →
  `currentUser` set to `null` → the user is bounced to `/login`.
- Mid-session, a refresh timer fires every minute and POSTs
  `/api/auth/refresh` so an active user's session stays alive — but if the
  user goes idle, refresh stops and the server-side TTL kicks in too.
- Tested in `src/app/context/AuthContext.test.tsx` —
  `auto-logs-out after IDLE_TIMEOUT_MS of inactivity` and
  `user activity resets the idle timer`.

### 3.4 HTTPS

- One self-signed cert covers both the backend and the Vite dev server, so
  the phone only has to accept the warning once per host:
  ```bash
  cd backend && python scripts/gen_cert.py
  # writes backend/certs/dev-cert.pem and dev-key.pem
  # SAN: DNS:localhost + 127.0.0.1 + <auto-detected LAN IP>
  ```
- Uvicorn:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000 \
      --ssl-certfile certs/dev-cert.pem --ssl-keyfile certs/dev-key.pem
  ```
- Vite (`vite.config.ts`) reads the same cert/key files and serves HTTPS on
  `https://<LAN IP>:5174`.
- All `fetch()` calls in the SPA go to `https://<LAN IP>:8000` (set via
  `.env.rest.local`).

### 3.5 Why this satisfies the rubric

> **secure login/register**: bcrypt + HTTPS → §3.1 + §3.4
> **use tokens to manage role permissions**: JWT with role claim, `require_admin` on `/api/users` → §3.2
> **implement sessions / inactivity logout**: 2-min idle timer + 2-min JWT TTL → §3.2 + §3.3
> **server on a different machine than the client**: see §4

---

## 4. Running the demo (server + phone on the same Wi-Fi)

The "second machine" the rubric demands can be **your phone on the same
Wi-Fi as the laptop**.

### 4.1 On the server laptop

1. **SQL Server** — make sure `SQL Server (SQLEXPRESS)` is running. The
   connection string lives in `backend/.env`:
   ```
   DATABASE_URL=mssql+pyodbc://@localhost\SQLEXPRESS/venturelab?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
   ```
   (Create the empty database in SSMS once: `CREATE DATABASE venturelab;`.)

2. **Regenerate the cert whenever your LAN IP changes** (different Wi-Fi,
   hotspot, etc.):
   ```bash
   cd backend
   python scripts/gen_cert.py
   ```
   The script auto-detects the current LAN IP and bakes it into the cert
   SAN. Look at the printed `SAN: …` line to confirm.

3. **Update the frontend's API URL** to match the same IP. Edit
   `.env.rest.local` at the project root:
   ```
   VITE_API_MODE=rest
   VITE_API_URL=https://<LAN IP>:8000
   ```

4. **Open the firewall for ports 8000 and 5174** (one-time, requires admin):
   ```powershell
   New-NetFirewallRule -DisplayName "VentureLab API"  -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
   New-NetFirewallRule -DisplayName "VentureLab Vite" -Direction Inbound -Protocol TCP -LocalPort 5174 -Action Allow
   ```
   On a **Public** Wi-Fi profile, Windows blocks unregistered apps even when
   port rules exist. If `/health` is unreachable from the phone, switch the
   profile in Settings → Network → Wi-Fi → click the SSID →
   *Network profile type → Private*.

5. **Start the backend**:
   ```bash
   cd backend
   .\venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 ^
       --ssl-certfile certs/dev-cert.pem --ssl-keyfile certs/dev-key.pem
   ```

6. **Start the frontend** (in a second terminal, from the project root):
   ```bash
   npm run dev:rest
   ```

### 4.2 On the phone

1. Connect to the same Wi-Fi.
2. Open `https://<LAN IP>:5174/` — tap *Advanced → Proceed* on the cert
   warning.
3. The first `/health` call will trigger one more cert warning at
   `https://<LAN IP>:8000` — accept that one too.
4. Log in with `sarah@venturelab.com` / `admin123` (or any seeded account —
   list at the bottom of this doc).
5. Create an idea / offer / feedback. Stop+restart the backend and reload
   the page — your changes are still there, proving they hit the database.
6. Stop interacting with the page for 2 minutes — you are auto-logged-out.

### 4.3 Seeded demo credentials

| Email                       | Password    | Role         |
|-----------------------------|-------------|--------------|
| sarah@venturelab.com        | admin123    | Admin        |
| michael@venturelab.com      | password123 | StartupOwner |
| david@venturelab.com        | password123 | StartupOwner |
| emily@venturelab.com        | password123 | Investor     |
| alex@venturelab.com         | password123 | Investor     |
| priya@venturelab.com        | password123 | Investor     |
| marcus@venturelab.com       | password123 | Investor     |
| sofia@venturelab.com        | password123 | Investor     |
| james@venturelab.com        | password123 | Investor     |

---

## 5. Quick "everything still works" check (handy if Wi-Fi changes mid-demo)

From the laptop, after restarting both servers:

```powershell
# Trust the self-signed cert for this PowerShell session
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(ServicePoint sp, X509Certificate cert, WebRequest req, int problem) { return true; }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

$base = 'https://<LAN IP>:8000'
Invoke-RestMethod -Uri "$base/health"
$t = (Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' `
        -Body '{"email":"sarah@venturelab.com","password":"admin123"}').access_token
Invoke-RestMethod -Uri "$base/api/auth/me" -Headers @{ Authorization = "Bearer $t" }
```

If you get `{"status":"ok"}` and your user back, everything is wired.

---

## 6. Where things live (one-line recap)

```
backend/
  app/main.py                     ← FastAPI app, mounts routers, lifespan = run_migrations() + seed_all()
  app/db/session.py               ← SQLAlchemy engine (DATABASE_URL env)
  app/db/models.py                ← ORM domain — single source of truth for schema (3NF)
  app/seed.py                     ← bcrypt-hashed demo users + ideas + offers + feedback
  app/auth.py                     ← hash_password / verify_password / JWT / get_current_user / require_admin
  app/routers/*.py                ← REST endpoints (auth, ideas, offers, feedback, milestones, stats, users)
  app/store/*.py                  ← SQLAlchemy CRUD wrappers
  alembic/versions/0001..0003     ← migrations (initial, procs+triggers, password_hash rename)
  scripts/gen_cert.py             ← regenerates the dev TLS cert with the current LAN IP
  certs/dev-{cert,key}.pem        ← TLS material shared with the Vite dev server
  tests/                          ← pytest (CRUD + auth + procs/triggers)

src/app/
  api/auth.ts                     ← token store, login/register/me/refresh, admin user CRUD
  api/rest.ts                     ← every fetch attaches Authorization; intercepts 401 → logout
  context/AuthContext.tsx         ← async login/register, 2-min idle timer, refresh loop
  context/{Ideas,Offers,Feedback,Milestones}Context.tsx  ← optimistic state + backend sync
  pages/Login.tsx, Register.tsx   ← async forms with submit state
  pages/UserManagement.tsx        ← admin-only, calls /api/users with the JWT
  components/OfflineBanner.tsx    ← surfaces network state + last fetch error

vite.config.ts                    ← server.https loads backend/certs/dev-*.pem
.env.rest, .env.rest.local        ← VITE_API_MODE=rest, VITE_API_URL points at LAN IP
```
