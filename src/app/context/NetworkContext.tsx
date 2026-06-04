import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { API_BASE } from "../api/auth";

// Same base the REST client uses: explicit VITE_API_URL wins, else same-origin
// in production and localhost in dev. "" ⇒ the health check hits relative /health.
const API = API_BASE;

type QueuedOp = {
  id: string;
  method: string;
  url: string;
  body?: unknown;
  resolve: (v: Response) => void;
  reject: (e: unknown) => void;
};

interface NetworkContextType {
  online: boolean;
  syncing: boolean;
  apiBase: string;
  lastError: string | null;
  queueFetch: (method: string, url: string, body?: unknown) => Promise<Response>;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const queue = useRef<QueuedOp[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(`${API}/health`, { signal: ctrl.signal, cache: "no-store" });
      if (!r.ok) {
        setLastError(`HTTP ${r.status}`);
        return false;
      }
      setLastError(null);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      setLastError(msg);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (queue.current.length === 0) return;
    setSyncing(true);
    const ops = [...queue.current];
    queue.current = [];
    for (const op of ops) {
      try {
        const r = await fetch(op.url, {
          method: op.method,
          headers: op.body ? { "Content-Type": "application/json" } : undefined,
          body: op.body ? JSON.stringify(op.body) : undefined,
        });
        op.resolve(r);
      } catch (e) {
        queue.current.push(op);
        op.reject(e);
      }
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    const poll = async () => {
      const reachable = await checkHealth();
      if (reachable !== online) {
        setOnline(reachable);
        if (reachable) flushQueue();
      }
    };

    pollRef.current = setInterval(poll, 5000);
    checkHealth().then((ok) => setOnline(ok));

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [online, checkHealth, flushQueue]);

  const queueFetch = useCallback(
    (method: string, url: string, body?: unknown): Promise<Response> => {
      if (online) {
        return fetch(url, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
      }
      return new Promise((resolve, reject) => {
        queue.current.push({ id: crypto.randomUUID(), method, url, body, resolve, reject });
      });
    },
    [online]
  );

  return (
    <NetworkContext.Provider value={{ online, syncing, apiBase: API, lastError, queueFetch }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
