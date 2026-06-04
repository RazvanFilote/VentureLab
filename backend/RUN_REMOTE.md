# Running the API on a different machine from the client

The Bronze rubric requires the **client app** to be run from a different
real or virtual machine from the **server** — not localhost. This file is a
checklist for getting that working with the VentureLab API.

Two roles in the setup:

- **Server machine** — has Python, SQL Server, and this `backend/` folder.
- **Client machine** — runs the React frontend (`npm run dev` or a
  production build).

---

## 1. Server machine — preparation

### 1.1 SQL Server

1. Open SSMS and connect to your local SQL Server instance.
2. Create an empty database:
   ```sql
   CREATE DATABASE venturelab;
   ```
3. (Recommended) Enable TCP/IP for the instance via **SQL Server
   Configuration Manager → SQL Server Network Configuration → Protocols
   for SQLEXPRESS** (or `MSSQLSERVER`). Restart the SQL Server service
   after enabling.

### 1.2 Python environment

```bash
cd backend
python -m pip install -r requirements.txt
```

`pyodbc` requires the **ODBC Driver 17 for SQL Server** (or 18) to be
installed on the machine. Download from
[https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server).

### 1.3 Configure the connection string

Create `backend/.env` (or set the env var in your shell). Pick one:

**Windows authentication (default in `app/db/session.py`):**
```
DATABASE_URL=mssql+pyodbc://@localhost\SQLEXPRESS/venturelab?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes
```

**SQL authentication:**
```
DATABASE_URL=mssql+pyodbc://sa:YourPassword@localhost/venturelab?driver=ODBC+Driver+17+for+SQL+Server
```

Replace `localhost\SQLEXPRESS` with your actual server name (visible in the
SSMS *Connect to Server* dialog).

### 1.4 Find the server's LAN IP

PowerShell:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | Select-Object IPAddress, InterfaceAlias
```

Note the IPv4 of your real network adapter, e.g. `192.168.1.42`.

### 1.5 Open the firewall

Allow inbound TCP on port 8000:

```powershell
New-NetFirewallRule -DisplayName "VentureLab API" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

### 1.6 Start the server bound to *all* interfaces

`localhost` (`127.0.0.1`) is unreachable from another machine. Use
`0.0.0.0`:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

On startup the app:

1. Runs `alembic upgrade head` — creates tables, stored procedures,
   triggers (idempotent).
2. Seeds the same mock data the frontend was using.
3. Listens on `http://<server-ip>:8000`.

Smoke-test from the *server* itself first:
```
http://localhost:8000/health        → {"status":"ok"}
http://localhost:8000/docs          → Swagger UI
```

Then from another machine on the LAN:
```
http://<server-ip>:8000/health
```

If this fails, the firewall rule is the most likely culprit.

---

## 2. Client machine — preparation

### 2.1 Point the frontend at the server's IP

In the React project, set the API base URL via env var. With Vite, create
`frontend/.env.local`:

```
VITE_API_BASE=http://192.168.1.42:8000
```

(Adjust to your server's actual IP.)

Make sure your `fetch` / `axios` calls use that base, not a hardcoded
`http://localhost:8000`.

### 2.2 Run the frontend

```bash
cd frontend
npm install
npm run dev -- --host       # bind to LAN if you also want the dev server reachable
```

Open the printed URL on the client machine. Every API call now traverses
the network to the server machine.

### 2.3 CORS

`app/main.py` already allows any origin (`allow_origins=["*"]`,
`allow_credentials=False`) which is what you need for two-machine
development. Lock this down to the client IP for production.

---

## 3. Demo checklist

When showing the lab:

1. SSMS open on the server machine, showing the `venturelab` database with
   the tables, stored procedures, and triggers — proves the DB exists and
   the migrations ran.
2. Run a CRUD operation in the React UI (create idea / offer / feedback)
   and reload — it persists across uvicorn restarts (proves it's hitting
   the DB, not RAM).
3. In SSMS run:
   ```sql
   EXEC sp_global_stats;
   EXEC sp_idea_stats '<some-idea-id>';
   ```
   to demonstrate the stats stored procedures.
4. Try `INSERT INTO offers (...)` with `equity = 999` — the trigger
   `trg_offers_validate_equity` rejects it with a `RAISERROR`.
5. UPDATE an offer's status in SSMS, then `SELECT * FROM offer_status_audit`
   to show `trg_offers_status_audit` populated the audit table.
6. Show the React frontend on a *separate* machine — `ipconfig` on both
   machines proves they have different IPs.

---

## 4. Troubleshooting

| Symptom                                         | Likely cause / fix                                                  |
|-------------------------------------------------|----------------------------------------------------------------------|
| `pyodbc.OperationalError ... Login failed`      | Wrong instance name or auth mode in `DATABASE_URL`.                  |
| `Could not open a connection to SQL Server`     | TCP/IP disabled on the SQL Server instance, or service stopped.      |
| Frontend shows network error                    | Server bound to `127.0.0.1` instead of `0.0.0.0`, or firewall closed. |
| `CORS policy` error in browser console          | Backend not running, or `app/main.py` CORS list narrowed.            |
| `405 Method Not Allowed` on OPTIONS             | Older Starlette; upgrade or relax CORS preflight settings.           |
