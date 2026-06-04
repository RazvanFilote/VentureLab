import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  apiLogin,
  apiMe,
  apiRefresh,
  apiRegister,
  AuthUser,
  clearToken,
  getStoredUser,
  getToken,
  onUnauthorized,
  setStoredUser,
  setToken,
} from "../api/auth";

/**
 * 2-hour idle timeout. Any meaningful user input (mouse, key, touch) resets
 * the timer; expiry calls logout(). Same window as the backend JWT TTL, so
 * the SPA enforces idleness even if the user keeps a single page open.
 */
export const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousedown",
  "keydown",
  "touchstart",
  "click",
  "scroll",
];

export type User = AuthUser;

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: () => void;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: "StartupOwner" | "Investor";
  }) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => !!getToken() && !!getStoredUser());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback(() => {
    clearToken();
    setCurrentUser(null);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  }, []);

  // 401 from any rest.ts call triggers a forced logout.
  useEffect(() => onUnauthorized(logout), [logout]);

  // On mount, if a token survives a reload, validate it via /me.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    apiMe(token)
      .then((u) => {
        if (cancelled) return;
        setCurrentUser(u);
        setStoredUser(u);
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setCurrentUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Idle timer + activity listeners — only active while logged in.
  useEffect(() => {
    if (!currentUser) return;

    const resetIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT_MS);
    };

    resetIdle();
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, resetIdle, { passive: true });
    }

    // Refresh the JWT every half-window so an active user keeps a valid
    // token; if they go idle, refresh stops and the backend TTL expires too.
    refreshTimer.current = setInterval(async () => {
      const token = getToken();
      if (!token) return;
      try {
        const r = await apiRefresh(token);
        setToken(r.access_token);
        setStoredUser(r.user);
      } catch {
        logout();
      }
    }, IDLE_TIMEOUT_MS / 2);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, resetIdle);
      }
    };
  }, [currentUser, logout]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiLogin(email, password);
      setToken(res.access_token);
      setStoredUser(res.user);
      setCurrentUser(res.user);
      return { success: true, user: res.user };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid email or password";
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async (data: {
    name: string;
    email: string;
    password: string;
    role: "StartupOwner" | "Investor";
  }) => {
    try {
      const res = await apiRegister(data);
      setToken(res.access_token);
      setStoredUser(res.user);
      setCurrentUser(res.user);
      return { success: true, user: res.user };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      return { success: false, error: msg };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, loading, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
