# Bronze Implementation — Code Walkthrough

This document maps each Bronze requirement to the exact files and lines where it
is implemented in the `backend/` Python project (FastAPI + Pydantic + pytest).

```
backend/
├── app/
│   ├── main.py                ← FastAPI app, CORS, router registration
│   ├── routers/               ← REST endpoints (HTTP layer only)
│   │   ├── ideas.py
│   │   ├── offers.py
│   │   ├── users.py
│   │   ├── feedback.py
│   │   ├── milestones.py
│   │   └── stats.py
│   ├── models/                ← Pydantic schemas (server-side validation)
│   │   ├── idea.py
│   │   ├── offer.py
│   │   ├── user.py
│   │   ├── feedback.py
│   │   └── milestone.py
│   ├── store/                 ← in-RAM data layer (Python dicts)
│   │   ├── base_store.py
│   │   ├── ideas_store.py
│   │   ├── offers_store.py
│   │   ├── users_store.py
│   │   ├── feedback_store.py
│   │   └── milestone_store.py
│   └── schemas/
│       └── pagination.py      ← reusable server-side pagination helper
├── tests/                     ← pytest suite (98 tests, 88% coverage)
└── requirements.txt
```

The four layers are deliberately separated so that an endpoint never reads or
writes a raw dict, and a store never knows what an HTTP request is.

---

## 1. Where the REST API is implemented

The whole application is mounted in **`app/main.py`**. This is the single
process that `uvicorn` launches — every endpoint in the project is reachable
through this `FastAPI` instance.

`app/main.py:15-20`
```python
app = FastAPI(
    title="VentureLab API",
    description="REST API for the VentureLab startup investment platform",
    version="1.0.0",
    lifespan=lifespan,
)
```

`app/main.py:30-36` — each resource lives in its own router module and is
attached here:
```python
app.include_router(ideas.router)
app.include_router(offers.router)
app.include_router(users.router)
app.include_router(feedback.router)
app.include_router(stats.router)
app.include_router(generator.router)
app.include_router(milestones.router)
```

CORS is opened for the Vite dev server (`app/main.py:22-28`) so the React
frontend at `http://localhost:5174` can call the API at `http://localhost:8000`.

**To run the API:**
```bash
cd backend
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs   (auto-generated Swagger UI)
```

---

## 2. Where server-side validation is made

Validation happens in **two places**, in this order:

### 2a. Pydantic models — `app/models/*`

Every `POST`, `PUT`, and `PATCH` body is parsed through a Pydantic class
*before* the router function body executes. If parsing fails, FastAPI
short-circuits the request and returns `422 Unprocessable Entity` with a
field-level error report — the handler never runs.

**`app/models/idea.py:23-28`** — required field lengths and enum types:
```python
class IdeaCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    industry: Industry                    # Enum: HealthTech / FinTech / EdTech / AI / SaaS / E-commerce / Other
    stage: Stage                          # Enum: Idea / MVP / Growth / Scale
    description: str = Field(..., min_length=10, max_length=2000)
    created_by: str = Field(..., min_length=1, max_length=100)
```

**`app/models/offer.py:11-17`** — numeric bounds:
```python
class OfferCreate(BaseModel):
    idea_id: str = Field(..., min_length=1)
    idea_title: str = Field(..., min_length=1, max_length=200)
    investor_name: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    equity: float = Field(..., gt=0, le=100)
    message: str = Field(..., min_length=5, max_length=1000)
```

**`app/models/offer.py:23-28`** — a custom `field_validator` that blocks an
illegal status transition:
```python
@field_validator("status")
@classmethod
def not_pending(cls, v: OfferStatus) -> OfferStatus:
    if v == OfferStatus.Pending:
        raise ValueError("Cannot set status back to Pending")
    return v
```

**`app/models/user.py:12-16`** — `EmailStr` runs a real RFC-compliant email check:
```python
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole                        # Enum: Admin / StartupOwner / Investor
```

**`app/models/feedback.py:5-9`** — rating is constrained to 1..5:
```python
class FeedbackCreate(BaseModel):
    idea_id: str = Field(..., min_length=1)
    user: str = Field(..., min_length=1, max_length=100)
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=10, max_length=500)
```

`PUT` schemas (`IdeaUpdate`, `UserUpdate`, `FeedbackUpdate`, …) make every
field `Optional[…]` while keeping the same constraints, so partial updates are
allowed but invalid values are still rejected.

### 2b. Business-rule validation — inside the router

Some checks need to look at the *current state* of the in-memory store, which
Pydantic alone can't do. Those rules live in the router functions and respond
with `409 Conflict` or `422 Unprocessable Entity`.

**`app/routers/offers.py:32-39`** — equity cannot exceed the owner's remaining share:
```python
@router.post("", response_model=OfferOut, status_code=201)
def create_offer(body: OfferCreate):
    owner_pct = offer_store.owner_percent(body.idea_id)
    if body.equity > owner_pct:
        raise HTTPException(
            status_code=422,
            detail=f"Equity {body.equity}% exceeds owner's available share of {owner_pct}%",
        )
```

**`app/routers/offers.py:47-56`** — only pending offers can change status, and
accepting must not drop ownership below 10%:
```python
if offer["status"] != OfferStatus.Pending.value:
    raise HTTPException(status_code=409, detail="Only pending offers can be updated")
if body.status == OfferStatus.Accepted:
    owner_pct = offer_store.owner_percent(offer["idea_id"])
    after = owner_pct - offer["equity"]
    if after < 10:
        raise HTTPException(
            status_code=422,
            detail=f"Accepting would drop ownership to {after:.1f}% (minimum 10%)",
        )
```

**`app/routers/offers.py:66-68`** — accepted offers may not be deleted:
```python
if offer["status"] == OfferStatus.Accepted.value:
    raise HTTPException(status_code=409, detail="Accepted offers cannot be deleted")
```

**`app/routers/users.py:27-28`** — duplicate email rejection:
```python
if user_store.get_by_email(body.email):
    raise HTTPException(status_code=409, detail="Email already registered")
```

### Validation summary

| Concern                         | Where it lives                       |
|--------------------------------|--------------------------------------|
| Required fields, types, lengths | `app/models/*.py` (Pydantic `Field`) |
| Enum membership                 | `app/models/*.py` (`Enum` classes)   |
| Email format                    | `pydantic.EmailStr` in `user.py`     |
| Numeric ranges (rating, equity) | `Field(ge=…, le=…, gt=…)`            |
| State-dependent rules           | router functions, raise `HTTPException` |

---

## 3. Where the endpoints are created

Each resource has its **own router file** under `app/routers/`. A router
declares its URL prefix once and then attaches HTTP handlers to it via
decorators. The handler bodies are kept thin — they validate (via the Pydantic
parameter), call the store, and translate failures into HTTP errors.

### Ideas — `app/routers/ideas.py`

```python
router = APIRouter(prefix="/api/ideas", tags=["Ideas"])

@router.get("",            response_model=PaginatedResponse[IdeaOut])  # list_ideas    line 9
@router.get("/{idea_id}",  response_model=IdeaOut)                     # get_idea      line 17
@router.post("",           response_model=IdeaOut, status_code=201)    # create_idea   line 25
@router.put("/{idea_id}",  response_model=IdeaOut)                     # update_idea   line 30
@router.delete("/{idea_id}", status_code=204)                          # delete_idea   line 38
```

### Offers — `app/routers/offers.py`

```python
router = APIRouter(prefix="/api/offers", tags=["Offers"])

@router.get("",                            response_model=PaginatedResponse[OfferOut])  # list_offers (with status filter) line 9
@router.get("/{offer_id}",                 response_model=OfferOut)                     # get_offer            line 21
@router.post("",                           response_model=OfferOut, status_code=201)    # create_offer         line 29
@router.patch("/{offer_id}/status",        response_model=OfferOut)                     # update_offer_status  line 42
@router.delete("/{offer_id}", status_code=204)                                          # delete_offer         line 61
```

### Users — `app/routers/users.py`

```python
router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("",            response_model=PaginatedResponse[UserOut])  # list_users    line 9
@router.get("/{user_id}",  response_model=UserOut)                     # get_user      line 17
@router.post("",           response_model=UserOut, status_code=201)    # create_user   line 25
@router.put("/{user_id}",  response_model=UserOut)                     # update_user   line 32
@router.delete("/{user_id}", status_code=204)                          # delete_user   line 44
```

### Feedback — `app/routers/feedback.py`

```python
router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

@router.get("",                response_model=PaginatedResponse[FeedbackOut])  # list_feedback (with idea_id filter) line 9
@router.get("/{feedback_id}",  response_model=FeedbackOut)                     # get_feedback     line 21
@router.post("",               response_model=FeedbackOut, status_code=201)    # create_feedback  line 29
@router.put("/{feedback_id}",  response_model=FeedbackOut)                     # update_feedback  line 34
@router.delete("/{feedback_id}", status_code=204)                              # delete_feedback  line 42
```

### Milestones (nested under ideas) — `app/routers/milestones.py`

```python
router = APIRouter(prefix="/api/ideas", tags=["Milestones"])

@router.get   ("/{idea_id}/milestones",                 response_model=List[MilestoneOut])
@router.post  ("/{idea_id}/milestones",                 response_model=MilestoneOut, status_code=201)
@router.get   ("/{idea_id}/milestones/{milestone_id}",  response_model=MilestoneOut)
@router.put   ("/{idea_id}/milestones/{milestone_id}",  response_model=MilestoneOut)
@router.delete("/{idea_id}/milestones/{milestone_id}",  status_code=204)
```

### Stats — `app/routers/stats.py`

```python
router = APIRouter(prefix="/api/stats", tags=["Stats"])

@router.get("")                       # global_stats line 10
@router.get("/ideas/{idea_id}")       # idea_stats   line 40
```

### Why this separation matters

A handler such as `app/routers/ideas.py:25-27`:
```python
@router.post("", response_model=IdeaOut, status_code=201)
def create_idea(body: IdeaCreate):
    return idea_store.create(body.model_dump())
```
contains **no** dict access, **no** `if`-validation, and **no** business logic.
Validation is upstream (Pydantic parses `body`), persistence is downstream
(`idea_store.create` mutates the in-memory dict). The router is purely the
HTTP boundary.

---

## 4. Where the endpoints are called

The endpoints are exercised from **three** places:

### 4a. The pytest suite — `backend/tests/`

This is the canonical caller and the basis of the coverage number. It uses
`fastapi.testclient.TestClient`, which talks to the app in-process without a
network socket.

`backend/tests/conftest.py:11-22`
```python
@pytest.fixture(autouse=True)
def reset_stores():
    idea_store.reset()
    offer_store.reset()
    user_store.reset()
    feedback_store.reset()
    milestone_store.reset()

@pytest.fixture
def client():
    return TestClient(app)
```

The `autouse` fixture wipes every store between tests — this is exactly why
the in-RAM design is testable: there is no database to truncate.

`backend/tests/test_ideas.py:20-28` shows a representative validation test:
```python
def test_create_idea_title_too_short(client):
    r = client.post("/api/ideas", json={
        "title": "",                                    # violates min_length=1
        "industry": "AI",
        "stage": "MVP",
        "description": "A long enough description here",
        "created_by": "Owner",
    })
    assert r.status_code == 422
```

The full suite covers:

| Test file                | What it exercises                                     |
|--------------------------|-------------------------------------------------------|
| `tests/test_ideas.py`    | CRUD + every Pydantic validation rule on `IdeaCreate` |
| `tests/test_offers.py`   | CRUD + status transitions + equity / 10% rules        |
| `tests/test_users.py`    | CRUD + duplicate email + email/password validation    |
| `tests/test_feedback.py` | CRUD + idea filter + rating bounds                    |
| `tests/test_milestones.py` | Nested CRUD under ideas                              |
| `tests/test_stats.py`    | Aggregation endpoints                                 |

Run with:
```bash
cd backend
python -m pytest tests/ -v --cov=app --cov-report=term
```

Latest run: **98 passed**, **88% overall coverage**, **100% on every
Bronze-relevant file** (`routers/*`, `models/*`, `store/*`,
`schemas/pagination.py`).

### 4b. Swagger UI — `http://localhost:8000/docs`

FastAPI auto-generates an interactive UI from the same Pydantic models used
for validation. Each endpoint has a "Try it out" button that fires real
requests against the running process — this is the demo path during the lab
defense.

### 4c. The React frontend (optional)

The frontend currently uses `localStorage`. To migrate, each context
(`OffersContext`, `IdeasContext`, …) replaces its `localStorage.getItem`
call with a `fetch` to the matching endpoint, e.g.:
```ts
const res = await fetch("http://localhost:8000/api/offers?page=1&page_size=10");
const { items, total, pages } = await res.json();
```
CORS is already configured for `localhost:5174` in `app/main.py:22-28`.

---

## 5. Where pagination is defined and how it works

### 5a. The reusable helper — `app/schemas/pagination.py`

This single module is the only place pagination math lives. It exposes a
typed response model and a pure function — both are reused by every list
endpoint.

`app/schemas/pagination.py:7-32` (full file):
```python
from typing import Generic, List, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PageParams(BaseModel):
    page: int = 1
    page_size: int = 10
    model_config = {"extra": "ignore"}


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int


def paginate(items: list, page: int, page_size: int) -> dict:
    total = len(items)
    pages = max(1, (total + page_size - 1) // page_size)
    start = (page - 1) * page_size
    return {
        "items": items[start : start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }
```

Three things are worth highlighting:

1. **`PaginatedResponse[T]` is generic.** It is parameterised per resource
   (`PaginatedResponse[IdeaOut]`, `PaginatedResponse[OfferOut]`, …), so the
   Swagger schema shows the correct item type for each list endpoint.
2. **The slicing happens server-side**, before the response is serialised.
   The client only ever receives `page_size` items at most.
3. **`pages` is computed with ceiling division** so a partial last page still
   counts (e.g. 5 items at `page_size=2` → 3 pages, not 2).

### 5b. How each list endpoint uses it

Every list route follows the same three-step pattern:

1. Declare `page` and `page_size` as `Query` params with bounds.
2. Apply optional filters in memory.
3. Return `paginate(items, page, page_size)`.

**Ideas — `app/routers/ideas.py:9-14`:**
```python
@router.get("", response_model=PaginatedResponse[IdeaOut])
def list_ideas(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    return paginate(idea_store.all(), page, page_size)
```

**Offers — `app/routers/offers.py:9-18`** (same helper, plus a `status` filter):
```python
@router.get("", response_model=PaginatedResponse[OfferOut])
def list_offers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: str = Query(None),
):
    items = offer_store.all()
    if status:
        items = [o for o in items if o["status"] == status]
    return paginate(items, page, page_size)
```

**Users — `app/routers/users.py:9-14`** and
**Feedback — `app/routers/feedback.py:9-18`** follow the same pattern;
`feedback` adds an `idea_id` filter.

### 5c. Validation of the pagination params themselves

The bounds in `Query(...)` are enforced by FastAPI before the function runs:

| Param       | Constraint              | Bad request → response |
|-------------|-------------------------|------------------------|
| `page`      | `ge=1`                  | `422`                  |
| `page_size` | `ge=1, le=100`          | `422`                  |

So `GET /api/ideas?page=0` or `?page_size=500` never reach the handler.

### 5d. How a client uses it

Request:
```
GET /api/ideas?page=2&page_size=10
```

Response (shape produced by `paginate(...)`):
```json
{
  "items":     [ { "id": "…", "title": "…", … }, … ],
  "total":     42,
  "page":      2,
  "page_size": 10,
  "pages":     5
}
```

Tests covering these flows: `test_list_ideas_pagination`,
`test_list_offers_pagination`, `test_list_users_pagination`,
`test_list_feedback_pagination`.

---

## 6. RAM-only storage (no persistence)

All data lives in plain Python dictionaries on the heap. There is **no**
database driver, **no** ORM, **no** file I/O, and **no** cache backend in the
project — see `backend/requirements.txt`.

`app/store/base_store.py:6-23` — the dictionary *is* the database:
```python
class BaseStore:
    def __init__(self) -> None:
        self._data: Dict[str, Dict[str, Any]] = {}

    def reset(self) -> None:
        self._data.clear()

    def all(self) -> List[Dict[str, Any]]:
        return list(self._data.values())

    def get(self, item_id: str) -> Optional[Dict[str, Any]]:
        return self._data.get(item_id)

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        item_id = str(uuid.uuid4())
        item = {"id": item_id, "created_at": date.today().isoformat(), **data}
        self._data[item_id] = item
        return item
```

Every concrete store inherits this and adds resource-specific queries:

| Store                          | Extra methods                                                |
|--------------------------------|--------------------------------------------------------------|
| `app/store/ideas_store.py`     | (uses base only)                                             |
| `app/store/offers_store.py`    | `by_idea`, `accepted_equity_for_idea`, `owner_percent`, `update_status` |
| `app/store/users_store.py`     | `get_by_email` (case-insensitive lookup)                     |
| `app/store/feedback_store.py`  | `by_idea`, `avg_rating`                                      |
| `app/store/milestone_store.py` | per-idea queries + completion rate                           |

The instances are **module-level singletons** (`idea_store = IdeaStore()` at
the bottom of each store file), so every router and every test sees the same
dictionary for the lifetime of the process — and a fresh, empty dictionary on
the next run.

---

## 7. Bronze checklist — quick map

| Bronze requirement                         | Where it is satisfied                                                           |
|--------------------------------------------|---------------------------------------------------------------------------------|
| Server-side data validation                | `app/models/*.py` (Pydantic) + business rules in `app/routers/*.py`             |
| Endpoints separated from the rest          | `app/routers/` (HTTP) ↔ `app/models/` (validation) ↔ `app/store/` (data)        |
| Tests with maximum coverage                | `tests/` — 98 tests, 88% overall, 100% on routers / models / stores / pagination |
| RAM-only storage                           | `app/store/base_store.py` `Dict[str, Dict[str, Any]]`, no DB / file dependencies |
| Server-side pagination                     | Defined in `app/schemas/pagination.py`, used in every list endpoint             |
