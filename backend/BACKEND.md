# REST API Backend — Purpose & Integration

## Why it was built

The frontend prototype stores all data in the browser's `localStorage` using React Context — this works for a single-user demo but has clear limitations: data is lost on cache clear, cannot be shared between users or devices, and has no real validation on the server side. The REST API backend was built to provide a proper, stateless server layer that any client (browser, mobile, Postman) can talk to.

**FastAPI (Python)** was chosen because:
- **Pydantic** enforces strict server-side validation automatically on every request
- **Swagger UI** is generated at `/docs` with zero configuration — every endpoint is testable live
- **pytest** gives clean, isolated tests with a single command and measurable coverage

---

## What was implemented

The backend exposes **22 REST endpoints** across 5 resources:

| Resource | Operations |
|---|---|
| `/api/ideas` | CRUD + server-side pagination |
| `/api/offers` | CRUD + status transition (Accept/Reject) + equity validation |
| `/api/users` | CRUD + duplicate email check |
| `/api/feedback` | CRUD + filter by idea |
| `/api/stats` | Global stats + per-idea ownership breakdown |

All business rules are enforced server-side: equity cannot exceed the owner's remaining share, accepted offers cannot be deleted, ownership cannot drop below 10%, duplicate emails are rejected.

---

## How it integrates with the app

The backend runs as a **separate process** alongside the frontend:

```
Browser (localhost:5174)  ──fetch──▶  FastAPI (localhost:8000)
```

CORS is already configured in `main.py` to accept requests from `localhost:5174`. To fully connect the frontend, each React Context (`OffersContext`, `IdeasContext`, etc.) would replace its `localStorage` read/write calls with `fetch` calls to the corresponding API endpoint — for example:

```ts
// currently (localStorage)
const stored = localStorage.getItem("vl_offers");

// with backend
const res = await fetch("http://localhost:8000/api/offers?page=1&page_size=10");
const { items } = await res.json();
```

The data shape returned by the API matches the shape the frontend already uses, so the migration path is straightforward. For the lab, both can run simultaneously — the frontend works standalone via localStorage while the backend demonstrates the full server-side implementation independently through the Swagger UI at `http://localhost:8000/docs`.

---

## Running the project

**Frontend:**
```bash
cd "VentureLab Prototype Structure"
npm run dev
# → http://localhost:5174
```

**Backend:**
```bash
cd "VentureLab Prototype Structure/backend"
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

**Tests:**
```bash
cd "VentureLab Prototype Structure/backend"
python -m pytest tests/ -v --cov=app
```
