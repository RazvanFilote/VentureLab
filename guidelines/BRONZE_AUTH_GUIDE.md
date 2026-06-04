# Bronze USER/FULLSTACK — Where it lives & how to run it

A pointer map for the lab demo. Every claim cites the file and line that
backs it.

---

## 1. HTTPS (encrypted communication)

### 1.1 The certificate itself

| Concern                       | File                                         |
|-------------------------------|----------------------------------------------|
| Self-signed cert (PEM)        | `backend/certs/dev-cert.pem`                 |
| Private key (PEM)             | `backend/certs/dev-key.pem`                  |
| Generator script              | `backend/scripts/gen_cert.py`                |

`gen_cert.py:62-103` builds an RSA-2048 / SHA-256 cert. The SAN list
(`gen_cert.py:80-84`) contains `localhost`, `127.0.0.1`, and the
auto-detected LAN IP (`detect_lan_ip()` at `gen_cert.py:28-37`). Validity
defaults to 825 days (`gen_cert.py:53-58`).

Regenerate whenever the LAN IP changes (different Wi-Fi, hotspot):
```powershell
cd backend
python scripts/gen_cert.py
```

Inspect the current cert's SAN:
```powershell
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("backend\certs\dev-cert.pem")
$cert.Extensions | ? { $_.Oid.FriendlyName -eq 'Subject Alternative Name' } | % { $_.Format($false) }
```

### 1.2 Backend (FastAPI / uvicorn) serves HTTPS

The cert is loaded by uvicorn at startup, not by FastAPI itself —
documented in `HOW_IT_WORKS.md:194-198` and `HOW_IT_WORKS.md:256-258`:
```bash
cd backend
.\venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 ^
    --ssl-certfile certs/dev-cert.pem --ssl-keyfile certs/dev-key.pem
```

`0.0.0.0` (not `127.0.0.1`) is what makes the server reachable from the
phone / second machine on the LAN.

### 1.3 Frontend (Vite dev server) serves HTTPS

`vite.config.ts:11-21` defines `loadCert()` which reads the same
`backend/certs/*.pem` files. `vite.config.ts:40-45` plugs it into the
dev server config (`https: loadCert()`, `host: true`, `port: 5174`).

One cert covers both servers, so the phone only has to dismiss the
"not private" warning once per host (`:5174` and `:8000`).

### 1.4 Frontend points its fetches at the HTTPS backend

`.env.rest.local` (project root):
```
VITE_API_MODE=rest
VITE_API_URL=https://172.30.245.117:8000
```

Read by `src/app/api/auth.ts:14`
(`export const API_BASE = import.meta.env.VITE_API_URL ?? ...`) and used
by every fetch in `src/app/api/auth.ts` and `src/app/api/rest.ts`.

---

## 2. Login & registration

### 2.1 Backend — endpoints

All under `backend/app/routers/auth.py`, prefix `/api/auth`:

| Method | Path                | Handler        | File:line                          |
|--------|---------------------|----------------|------------------------------------|
| POST   | `/api/auth/register`| `register`     | `backend/app/routers/auth.py:71-86`|
| POST   | `/api/auth/login`   | `login`        | `backend/app/routers/auth.py:89-101`|
| GET    | `/api/auth/me`      | `me`           | `backend/app/routers/auth.py:104-106`|
| POST   | `/api/auth/refresh` | `refresh`      | `backend/app/routers/auth.py:109-113`|
| POST   | `/api/auth/logout`  | `logout`       | `backend/app/routers/auth.py:116-119`|

### 2.2 Backend — primitives

`backend/app/auth.py` (everything reusable lives here):

- `hash_password` / `verify_password` — bcrypt via `passlib`
  (`backend/app/auth.py:29-43`).
- `create_access_token` — HS256 JWT, claims `sub` / `email` / `role` /
  `exp`, TTL from env `VENTURELAB_TOKEN_TTL_SEC` (default 7200 s / 2 h)
  (`backend/app/auth.py:24-26, 46-50`).
- `get_current_user` — FastAPI dependency that decodes the Bearer token
  and loads the user (`backend/app/auth.py:61-77`).
- `require_admin` — wraps `get_current_user` and rejects non-Admin
  (`backend/app/auth.py:80-84`).

### 2.3 Backend — role enforcement on protected routers

Each router declares its auth requirement once at the router level:

| Router                                | Requirement                  | File:line                                  |
|---------------------------------------|------------------------------|--------------------------------------------|
| `/api/ideas/*`                        | any authenticated user       | `backend/app/routers/ideas.py:10-14`       |
| `/api/offers/*`                       | any authenticated user       | `backend/app/routers/offers.py` (router)   |
| `/api/feedback/*`                     | any authenticated user       | `backend/app/routers/feedback.py` (router) |
| `/api/users/*`                        | **Admin only**               | `backend/app/routers/users.py:10-14`       |
| `/health`, `/`, `/api/auth/login` etc | public                       | n/a                                        |

### 2.4 Frontend — pages

| Page         | File                                |
|--------------|-------------------------------------|
| Login form   | `src/app/pages/Login.tsx`           |
| Register form| `src/app/pages/Register.tsx`        |

`Login.tsx:25-50` validates with `validateLogin` from
`src/app/data/validation.ts:135` and then calls `useAuth().login()`.
Role-based redirect happens at `Login.tsx:44-49`
(`Investor → /investor`, otherwise → `/app`).

### 2.5 Frontend — HTTP / token plumbing

`src/app/api/auth.ts` is the bridge:

- `apiLogin`, `apiRegister`, `apiMe`, `apiRefresh` — raw fetches that
  hit the backend (`src/app/api/auth.ts:98-150`).
- `getToken` / `setToken` / `clearToken` — localStorage at key `vl_jwt`
  (`src/app/api/auth.ts:32-55`).
- `triggerUnauthorized` — broadcast hook so any 401 from anywhere
  forces a logout (`src/app/api/auth.ts:84-93`).
- Admin-only user CRUD helpers attach `Authorization: Bearer …`
  (`src/app/api/auth.ts:154-214`).

### 2.6 Frontend — session lifecycle (inactivity logout + refresh)

`src/app/context/AuthContext.tsx`:

- `IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000` (`AuthContext.tsx:29`) — same window
  as the backend JWT TTL so the user really gets logged out after 2 h idle.
- Activity events watched: `mousedown`, `keydown`, `touchstart`,
  `click`, `scroll` (`AuthContext.tsx:30-36`).
- Idle timer + refresh loop set up while logged in
  (`AuthContext.tsx:100-136`). Refresh fires every `IDLE_TIMEOUT_MS / 2`
  (1 h) and calls `/api/auth/refresh` to extend the JWT — but only while
  the user is active. Go idle → no refresh → backend TTL expires too.
- On 401 from any rest call, the `onUnauthorized` listener
  (`AuthContext.tsx:70`) drops the user back to the login page.

### 2.7 End-to-end login flow in one paragraph

User types email + password → `Login.tsx` validates with
`validateLogin` → calls `useAuth().login()` → `AuthContext.login` calls
`apiLogin` → `POST https://<server>:8000/api/auth/login` →
`backend/app/routers/auth.py:login` verifies bcrypt hash → mints JWT
via `create_access_token` → returns `{access_token, user}` → frontend
stashes both in localStorage (`vl_jwt`, `vl_current_user`) →
`AuthContext` arms the 30-s idle timer + refresh loop → role decides
redirect (`/investor` vs `/app`). Every later request adds
`Authorization: Bearer <jwt>`; the backend decodes it in
`get_current_user`.

---

## 3. Tests

### 3.1 Backend — pytest (`backend/tests/`)

| File                                       | Tests | Covers                                                 |
|--------------------------------------------|-------|--------------------------------------------------------|
| `tests/test_auth.py`                       | 26    | bcrypt round-trip, register validation, login, /me, token expiry, refresh, role enforcement on /api/ideas + /api/users, public /health |
| `tests/test_users.py`                      | 17    | Admin-only CRUD on users                               |
| `tests/test_ideas.py`                      | 17    | CRUD + Pydantic validation on ideas                    |
| `tests/test_offers.py`                     | 21    | CRUD + status transitions + equity / 10% rules         |
| `tests/test_feedback.py`                   | 16    | CRUD + rating bounds + idea filter                     |
| `tests/test_milestones.py`                 | 21    | Nested CRUD under ideas                                |
| `tests/test_stats.py`                      | 6     | Global + per-idea stats aggregation                    |
| `tests/test_db_procs_triggers.py`          | 6     | SQL Server stored procedures + triggers                |
| **Total**                                  | **130** |                                                      |

Highlights from `tests/test_auth.py`:

- `test_hash_password_is_not_plaintext`, `test_verify_password_round_trip`
  — bcrypt primitives.
- `test_register_*` — duplicate email → 409, password < 6 → 422, invalid
  email → 422, default role is Investor, explicit role works.
- `test_login_*` — correct password → 200, case-insensitive email,
  wrong password → 401, unknown email → 401.
- `test_me_rejects_missing_token`, `test_me_rejects_garbage_token`,
  `test_me_rejects_expired_token`, `test_me_rejects_token_for_deleted_user`.
- `test_refresh_returns_new_token_for_authenticated_user`,
  `test_refresh_requires_token`.
- `test_ideas_endpoint_rejects_unauthenticated_request`,
  `test_users_endpoint_rejects_non_admin` (403),
  `test_users_endpoint_accepts_admin` (200).
- `test_admin_create_user_stores_hashed_password` — confirms password
  is hashed (round-trips through login).

**Run them:**
```bash
cd backend
.\venv\Scripts\activate
pytest tests/ -v --cov=app --cov-report=term
```

Run only the auth tests:
```bash
pytest tests/test_auth.py -v
```

### 3.2 Frontend — Vitest unit / component tests (`src/app/**/*.test.tsx`)

124 tests across 14 files.

| File                                              | Tests | Covers                                  |
|---------------------------------------------------|-------|-----------------------------------------|
| `src/app/context/AuthContext.test.tsx`            | 13    | login / logout / register / token persistence / **idle auto-logout** / activity resets idle timer / session restore from localStorage |
| `src/app/context/ActivityContext.test.tsx`        | 10    | cookie-based activity tracking          |
| `src/app/context/BookmarksContext.test.tsx`       | 5     | bookmark CRUD                           |
| `src/app/context/FeedbackContext.test.tsx`        | 6     | feedback context                        |
| `src/app/context/IdeasContext.test.tsx`           | 6     | ideas context                           |
| `src/app/context/OffersContext.test.tsx`          | 7     | offers context                          |
| `src/app/pages/Login.test.tsx`                    | 9     | form rendering, empty-email error, invalid email, wrong credentials |
| `src/app/pages/Register.test.tsx`                 | 11    | register form validation + role picker |
| `src/app/pages/CreateIdea.test.tsx`               | 6     | create-idea form                        |
| `src/app/pages/EditIdea.test.tsx`                 | 9     | edit-idea form                          |
| `src/app/pages/IdeaDetail.test.tsx`               | 12    | idea detail page                        |
| `src/app/pages/IdeasList.test.tsx`                | 8     | ideas list page                         |
| `src/app/pages/OffersReceived.test.tsx`           | 11    | offers received page                    |
| `src/app/pages/UserManagement.test.tsx`           | 11    | admin user management                   |
| `src/app/data/validation.test.ts`                 | —     | shared validators (`validateLogin`, `validateRegister`, etc.) |
| **Total**                                         | **124** |                                       |

Auth-specific subset in `AuthContext.test.tsx`:

- `starts with no current user`
- `login succeeds with correct credentials`
- `login fails with wrong password`
- `login is case-insensitive for email`
- `logout clears current user`
- `login persists a JWT in localStorage`
- `register adds a new user and logs them in`
- `register fails for duplicate email`
- `restores session from localStorage on mount`
- `clears the session if the stored token is invalid`
- `throws when useAuth is used outside provider`
- `auto-logs-out after IDLE_TIMEOUT_MS of inactivity`
- `user activity resets the idle timer`

**Run them** (from project root):
```bash
npm test                       # one shot
npm run test:watch             # watch mode
npm run test:coverage          # with v8 coverage report
```

Run only the auth-related unit tests:
```bash
npx vitest run src/app/context/AuthContext.test.tsx src/app/pages/Login.test.tsx src/app/pages/Register.test.tsx
```

### 3.3 Frontend — Playwright E2E (`e2e/`)

24 tests across 3 files.

| File                | Tests | Covers                                              |
|---------------------|-------|-----------------------------------------------------|
| `e2e/auth.spec.ts`  | 10    | landing buttons, empty-form validation, invalid email, wrong credentials, role-based redirect (StartupOwner → `/app`, Investor → `/investor`), register, logout |
| `e2e/ideas.spec.ts` | 5     | idea CRUD through the UI                            |
| `e2e/offers.spec.ts`| 9     | offer flow through the UI                           |

`playwright.config.ts:21-26` auto-spawns `npm run dev` at
`http://localhost:5174` if no dev server is already running.

**Run them:**
```bash
npm run test:e2e               # headless
npm run test:e2e:ui            # Playwright UI mode (great for debugging)
npx playwright test e2e/auth.spec.ts            # just the auth flow
npx playwright show-report                      # open last HTML report
```

---

## 4. Run-the-app cheat sheet

### 4.1 Quick standalone (no backend, no HTTPS)
```bash
npm run dev
# → http://localhost:5174 with in-memory contexts
```

### 4.2 Full Bronze HTTPS LAN demo

**Server machine:**
```bash
# (one-time) generate cert
cd backend && python scripts/gen_cert.py

# update .env.rest.local at the project root with the printed LAN IP:
#   VITE_API_MODE=rest
#   VITE_API_URL=https://<LAN IP>:8000

# (one-time) firewall — admin PowerShell
New-NetFirewallRule -DisplayName "VentureLab API"  -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
New-NetFirewallRule -DisplayName "VentureLab Vite" -Direction Inbound -Protocol TCP -LocalPort 5174 -Action Allow

# terminal 1 — backend
cd backend
.\venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 ^
    --ssl-certfile certs/dev-cert.pem --ssl-keyfile certs/dev-key.pem

# terminal 2 — frontend
npm run dev:rest
```

**Client machine / phone:** open `https://<LAN IP>:5174/` on the same
Wi-Fi, accept the cert warning twice (once for `:5174`, once for
`:8000`), log in with a seeded credential.

### 4.3 Seeded credentials

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

## 5. Quick smoke checks during the demo

```bash
# backend health (insecure flag because the cert is self-signed)
curl -k https://<LAN IP>:8000/health
# → {"status":"ok"}

# login as admin
curl -k -X POST https://<LAN IP>:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"sarah@venturelab.com","password":"admin123"}'
# → {"access_token":"...","token_type":"bearer","expires_in":7200,"user":{...,"role":"Admin"}}

# call a protected route with the token
TOKEN=...     # paste the access_token from above
curl -k -H "Authorization: Bearer $TOKEN" https://<LAN IP>:8000/api/ideas
```
