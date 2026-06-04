/**
 * Token + auth bridge between AuthContext and rest.ts.
 *
 * Token lives in localStorage so reloads and tab navigations keep the
 * session alive (until the 2-hour backend TTL or the idle timer kicks in).
 * rest.ts imports `getToken` to attach Authorization headers and calls
 * `triggerUnauthorized` whenever the backend returns 401, which AuthContext
 * subscribes to so a stale session redirects to the login page.
 */

const TOKEN_KEY = "vl_jwt";
const USER_KEY = "vl_current_user";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "StartupOwner" | "Investor";
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

// ── Token storage ──────────────────────────────────────────────────────────

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode etc. — swallow */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* swallow */
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* swallow */
  }
}

// ── 401 broadcast ──────────────────────────────────────────────────────────

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export function onUnauthorized(fn: Listener): () => void {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

export function triggerUnauthorized(): void {
  clearToken();
  for (const fn of unauthorizedListeners) {
    try {
      fn();
    } catch {
      /* listener mustn't break the chain */
    }
  }
}

// ── Auth HTTP calls (don't go through the auth-aware fetch in rest.ts to
//    avoid recursive 401 handling on the login form itself) ────────────────

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const r = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail || "Invalid email or password");
  }
  return r.json();
}

export async function apiRegister(payload: {
  name: string;
  email: string;
  password: string;
  role?: "StartupOwner" | "Investor";
}): Promise<LoginResponse> {
  const r = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((d: { msg: string }) => d.msg).join(", ")
          : "Registration failed";
    throw new Error(msg);
  }
  return r.json();
}

export async function apiMe(token: string): Promise<AuthUser> {
  const r = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Token invalid");
  return r.json();
}

export async function apiRefresh(token: string): Promise<LoginResponse> {
  const r = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Refresh failed");
  return r.json();
}

// ── Admin-only user management (used by UserManagement page) ──────────────

function adminHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function checkOrUnauth<T>(r: Response, label: string): Promise<T> {
  if (r.status === 401) {
    triggerUnauthorized();
    throw new Error(`${label} → 401`);
  }
  if (!r.ok && r.status !== 204) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail || `${label} → ${r.status}`);
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

export async function apiAdminListUsers(): Promise<AuthUser[]> {
  const r = await fetch(`${API_BASE}/api/users?page=1&page_size=100`, {
    headers: adminHeaders(),
  });
  const data = await checkOrUnauth<{ items: AuthUser[] }>(r, "GET /api/users");
  return data.items ?? [];
}

export async function apiAdminCreateUser(payload: {
  name: string;
  email: string;
  password: string;
  role: AuthUser["role"];
}): Promise<AuthUser> {
  const r = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
  return checkOrUnauth<AuthUser>(r, "POST /api/users");
}

export async function apiAdminUpdateUser(
  id: string,
  patch: { name?: string; email?: string; role?: AuthUser["role"]; password?: string },
): Promise<AuthUser> {
  const r = await fetch(`${API_BASE}/api/users/${id}`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(patch),
  });
  return checkOrUnauth<AuthUser>(r, `PUT /api/users/${id}`);
}

export async function apiAdminDeleteUser(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/users/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  await checkOrUnauth<void>(r, `DELETE /api/users/${id}`);
}
