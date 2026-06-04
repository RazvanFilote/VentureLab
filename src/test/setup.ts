import '@testing-library/jest-dom';
import { vi } from 'vitest';
import {
  mockUsers,
  mockIdeas,
  mockOffers,
  mockFeedback,
  Idea,
  Offer,
  Feedback,
  User as MockUser,
} from '../app/data/mockData';

// ── localStorage shim for jsdom ──────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// jsdom doesn't ship IntersectionObserver — give the infinite-scroll hook a no-op.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = '';
  thresholds = [];
}
(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserverStub }).IntersectionObserver =
  IntersectionObserverStub;

// ── Global fetch mock ────────────────────────────────────────────────────────
//
// AuthContext calls the backend now, but unit tests can't hit a real server.
// Mock just the /api/auth/* (and admin /api/users) endpoints so the rest of
// the component tree behaves as if a real backend were online. Per-test files
// can still override `globalThis.fetch` with vi.fn() to assert specific calls.

type FetchInit = RequestInit & { headers?: HeadersInit };

interface RuntimeUser extends MockUser {
  password: string;
}

// Per-test mutable copies of the seed data so register/create/delete in one
// test doesn't leak into the next.
let runtimeUsers: RuntimeUser[] = [];
let runtimeIdeas: Idea[] = [];
let runtimeOffers: Offer[] = [];
let runtimeFeedback: Feedback[] = [];

function resetRuntimeUsers() {
  runtimeUsers = mockUsers.map((u) => ({ ...u }));
  runtimeIdeas = mockIdeas.map((i) => ({ ...i }));
  runtimeOffers = mockOffers.map((o) => ({ ...o }));
  runtimeFeedback = mockFeedback.map((f) => ({ ...f }));
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function snakeIdea(i: Idea) {
  return {
    id: i.id,
    title: i.title,
    industry: i.industry,
    stage: i.stage,
    description: i.description,
    created_by: i.createdBy,
    created_at: i.createdAt,
  };
}
function snakeOffer(o: Offer) {
  return {
    id: o.id,
    idea_id: o.ideaId,
    idea_title: o.ideaTitle,
    investor_name: o.investorName,
    amount: o.amount,
    equity: o.equity,
    message: o.message,
    status: o.status,
    created_at: o.createdAt,
  };
}
function snakeFeedback(f: Feedback) {
  return {
    id: f.id,
    idea_id: f.ideaId,
    user: f.user,
    rating: f.rating,
    comment: f.comment,
    created_at: f.createdAt,
  };
}

function makeToken(userId: string): string {
  return `test-token-${userId}`;
}

function userIdFromToken(token: string | null): string | null {
  if (!token) return null;
  const m = token.match(/^test-token-(.+)$/);
  return m ? m[1] : null;
}

function readHeader(headers: HeadersInit | undefined, name: string): string | null {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  if (Array.isArray(headers)) {
    const hit = headers.find(([k]) => k.toLowerCase() === name.toLowerCase());
    return hit ? hit[1] : null;
  }
  for (const [k, v] of Object.entries(headers as Record<string, string>)) {
    if (k.toLowerCase() === name.toLowerCase()) return v;
  }
  return null;
}

function bearerFromInit(init?: FetchInit): string | null {
  const auth = readHeader(init?.headers, 'Authorization');
  if (!auth) return null;
  return auth.replace(/^Bearer\s+/i, '');
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function publicUser(u: RuntimeUser) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

function tokenPayload(u: RuntimeUser) {
  return {
    access_token: makeToken(u.id),
    token_type: 'bearer',
    expires_in: 7200,
    user: publicUser(u),
  };
}

async function readBody(init?: FetchInit): Promise<Record<string, unknown>> {
  if (!init?.body) return {};
  if (typeof init.body === 'string') {
    try { return JSON.parse(init.body); } catch { return {}; }
  }
  return {};
}

function currentUser(init?: FetchInit): RuntimeUser | null {
  const id = userIdFromToken(bearerFromInit(init));
  return id ? runtimeUsers.find((u) => u.id === id) ?? null : null;
}

async function mockFetch(input: RequestInfo | URL, init?: FetchInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = (init?.method ?? 'GET').toUpperCase();
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  const body = await readBody(init);

  // ── /api/auth ────────────────────────────────────────────────────────────
  if (path === '/api/auth/login' && method === 'POST') {
    const email = String(body.email ?? '').toLowerCase();
    const pwd = String(body.password ?? '');
    const u = runtimeUsers.find((x) => x.email.toLowerCase() === email && x.password === pwd);
    if (!u) return jsonResponse({ detail: 'Invalid email or password' }, 401);
    return jsonResponse(tokenPayload(u));
  }

  if (path === '/api/auth/register' && method === 'POST') {
    const email = String(body.email ?? '').toLowerCase();
    if (runtimeUsers.some((u) => u.email.toLowerCase() === email)) {
      return jsonResponse({ detail: 'An account with this email already exists' }, 409);
    }
    const newUser: RuntimeUser = {
      id: `gen-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: String(body.name ?? ''),
      email,
      password: String(body.password ?? ''),
      role: (body.role as RuntimeUser['role']) ?? 'Investor',
    };
    runtimeUsers.push(newUser);
    return jsonResponse(tokenPayload(newUser), 201);
  }

  if (path === '/api/auth/me' && method === 'GET') {
    const u = currentUser(init);
    return u ? jsonResponse(publicUser(u)) : jsonResponse({ detail: 'Not authenticated' }, 401);
  }

  if (path === '/api/auth/refresh' && method === 'POST') {
    const u = currentUser(init);
    return u ? jsonResponse(tokenPayload(u)) : jsonResponse({ detail: 'Not authenticated' }, 401);
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return new Response(null, { status: 204 });
  }

  // ── /api/users (admin only) ──────────────────────────────────────────────
  if (path.startsWith('/api/users')) {
    const me = currentUser(init);
    if (!me) return jsonResponse({ detail: 'Not authenticated' }, 401);
    if (me.role !== 'Admin') return jsonResponse({ detail: 'Admin role required' }, 403);

    const usersBase = path.split('?')[0];
    if (usersBase === '/api/users' && method === 'GET') {
      return jsonResponse({
        items: runtimeUsers.map(publicUser),
        total: runtimeUsers.length,
        page: 1,
        page_size: runtimeUsers.length,
        pages: 1,
      });
    }
    if (usersBase === '/api/users' && method === 'POST') {
      const email = String(body.email ?? '').toLowerCase();
      if (runtimeUsers.some((u) => u.email.toLowerCase() === email)) {
        return jsonResponse({ detail: 'Email already registered' }, 409);
      }
      const newUser: RuntimeUser = {
        id: `adm-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: String(body.name ?? ''),
        email,
        password: String(body.password ?? ''),
        role: (body.role as RuntimeUser['role']) ?? 'Investor',
      };
      runtimeUsers.push(newUser);
      return jsonResponse(publicUser(newUser), 201);
    }
    const idMatch = path.match(/^\/api\/users\/([^/?]+)/);
    if (idMatch) {
      const id = idMatch[1];
      const idx = runtimeUsers.findIndex((u) => u.id === id);
      if (idx === -1) return jsonResponse({ detail: 'User not found' }, 404);
      if (method === 'PUT') {
        runtimeUsers[idx] = { ...runtimeUsers[idx], ...body } as RuntimeUser;
        return jsonResponse(publicUser(runtimeUsers[idx]));
      }
      if (method === 'DELETE') {
        runtimeUsers.splice(idx, 1);
        return new Response(null, { status: 204 });
      }
      if (method === 'GET') {
        return jsonResponse(publicUser(runtimeUsers[idx]));
      }
    }
  }

  // ── /api/ideas ───────────────────────────────────────────────────────────
  if (path.startsWith('/api/ideas')) {
    // /api/ideas/:idea_id/milestones (and subpaths) — handle separately below
    const milestoneMatch = path.match(/^\/api\/ideas\/([^/?]+)\/milestones/);
    if (milestoneMatch) {
      if (method === 'GET') return jsonResponse([]);
      if (method === 'POST') {
        const created = {
          id: nextId('mil'),
          idea_id: milestoneMatch[1],
          title: String(body.title ?? ''),
          description: String(body.description ?? ''),
          status: (body.status as string) ?? 'Pending',
          due_date: (body.due_date as string | null) ?? null,
          created_at: new Date().toISOString().slice(0, 10),
        };
        return jsonResponse(created, 201);
      }
      if (method === 'PUT') return jsonResponse({ ...body, id: 'placeholder' });
      if (method === 'DELETE') return new Response(null, { status: 204 });
    }

    if (path.startsWith('/api/ideas?') || path === '/api/ideas') {
      if (method === 'GET') {
        return jsonResponse({
          items: runtimeIdeas.map(snakeIdea),
          total: runtimeIdeas.length,
          page: 1,
          page_size: runtimeIdeas.length,
          pages: 1,
        });
      }
      if (method === 'POST') {
        const created: Idea = {
          id: nextId('idea'),
          title: String(body.title ?? ''),
          industry: String(body.industry ?? ''),
          stage: String(body.stage ?? ''),
          description: String(body.description ?? ''),
          createdBy: String(body.created_by ?? ''),
          createdAt: new Date().toISOString().slice(0, 10),
          avgRating: 0,
          feedbackCount: 0,
        };
        runtimeIdeas.push(created);
        return jsonResponse(snakeIdea(created), 201);
      }
    }
    const idMatch = path.match(/^\/api\/ideas\/([^/?]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      const idx = runtimeIdeas.findIndex((i) => i.id === id);
      if (idx === -1) return jsonResponse({ detail: 'Idea not found' }, 404);
      if (method === 'GET') return jsonResponse(snakeIdea(runtimeIdeas[idx]));
      if (method === 'PUT') {
        runtimeIdeas[idx] = {
          ...runtimeIdeas[idx],
          title: (body.title as string) ?? runtimeIdeas[idx].title,
          industry: (body.industry as string) ?? runtimeIdeas[idx].industry,
          stage: (body.stage as string) ?? runtimeIdeas[idx].stage,
          description: (body.description as string) ?? runtimeIdeas[idx].description,
        };
        return jsonResponse(snakeIdea(runtimeIdeas[idx]));
      }
      if (method === 'DELETE') {
        runtimeIdeas.splice(idx, 1);
        return new Response(null, { status: 204 });
      }
    }
  }

  // ── /api/offers ──────────────────────────────────────────────────────────
  if (path.startsWith('/api/offers')) {
    if (path.startsWith('/api/offers?') || path === '/api/offers') {
      if (method === 'GET') {
        return jsonResponse({
          items: runtimeOffers.map(snakeOffer),
          total: runtimeOffers.length,
          page: 1,
          page_size: runtimeOffers.length,
          pages: 1,
        });
      }
      if (method === 'POST') {
        const created: Offer = {
          id: nextId('off'),
          ideaId: String(body.idea_id ?? ''),
          ideaTitle: String(body.idea_title ?? ''),
          investorName: String(body.investor_name ?? ''),
          amount: Number(body.amount ?? 0),
          equity: Number(body.equity ?? 0),
          message: String(body.message ?? ''),
          status: 'Pending',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        runtimeOffers.push(created);
        return jsonResponse(snakeOffer(created), 201);
      }
    }
    const statusMatch = path.match(/^\/api\/offers\/([^/?]+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      const id = statusMatch[1];
      const idx = runtimeOffers.findIndex((o) => o.id === id);
      if (idx === -1) return jsonResponse({ detail: 'Offer not found' }, 404);
      runtimeOffers[idx] = { ...runtimeOffers[idx], status: body.status as Offer['status'] };
      return jsonResponse(snakeOffer(runtimeOffers[idx]));
    }
    const idMatch = path.match(/^\/api\/offers\/([^/?]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      const idx = runtimeOffers.findIndex((o) => o.id === id);
      if (idx === -1) return jsonResponse({ detail: 'Offer not found' }, 404);
      if (method === 'DELETE') {
        runtimeOffers.splice(idx, 1);
        return new Response(null, { status: 204 });
      }
    }
  }

  // ── /api/feedback ────────────────────────────────────────────────────────
  if (path.startsWith('/api/feedback')) {
    if (path.startsWith('/api/feedback?') || path === '/api/feedback') {
      if (method === 'GET') {
        return jsonResponse({
          items: runtimeFeedback.map(snakeFeedback),
          total: runtimeFeedback.length,
          page: 1,
          page_size: runtimeFeedback.length,
          pages: 1,
        });
      }
      if (method === 'POST') {
        const created: Feedback = {
          id: nextId('fb'),
          ideaId: String(body.idea_id ?? ''),
          user: String(body.user ?? ''),
          rating: Number(body.rating ?? 0),
          comment: String(body.comment ?? ''),
          createdAt: new Date().toISOString().slice(0, 10),
        };
        runtimeFeedback.push(created);
        return jsonResponse(snakeFeedback(created), 201);
      }
    }
    const idMatch = path.match(/^\/api\/feedback\/([^/?]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      const idx = runtimeFeedback.findIndex((f) => f.id === id);
      if (idx === -1) return jsonResponse({ detail: 'Feedback not found' }, 404);
      if (method === 'PUT') {
        runtimeFeedback[idx] = {
          ...runtimeFeedback[idx],
          rating: (body.rating as number) ?? runtimeFeedback[idx].rating,
          comment: (body.comment as string) ?? runtimeFeedback[idx].comment,
        };
        return jsonResponse(snakeFeedback(runtimeFeedback[idx]));
      }
      if (method === 'DELETE') {
        runtimeFeedback.splice(idx, 1);
        return new Response(null, { status: 204 });
      }
    }
  }

  // Anything else: 404. Per-test files can override globalThis.fetch with
  // a more specific spy when they need to assert non-auth calls.
  return jsonResponse({ detail: `Unmocked ${method} ${path}` }, 404);
}

// Reset state + reinstall the mock before every test so tests are isolated.
beforeEach(() => {
  localStorage.clear();
  resetRuntimeUsers();
  globalThis.fetch = vi.fn(mockFetch) as typeof fetch;
});
