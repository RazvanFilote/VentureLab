import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useIdeas } from "./IdeasContext";
import { Idea } from "../data/mockData";
import { API_BASE } from "../api/auth";

const API_URL = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
const WS_URL = `${API_URL.replace(/^http/, "ws")}/ws`;

// The live idea-generator runs over a WebSocket + a long-running server loop,
// which serverless hosts (Vercel) can't run. It stays off unless explicitly
// enabled (set VITE_ENABLE_WS=true against a WS-capable backend). When off,
// the connection is never opened and the generator controls are inert — the
// Analytics view simply shows "Disconnected".
const WS_ENABLED = import.meta.env.VITE_ENABLE_WS === "true";

interface WebSocketContextType {
  wsConnected: boolean;
  generatorRunning: boolean;
  startGenerator: () => Promise<void>;
  stopGenerator: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { injectIdeas } = useIdeas();
  const [wsConnected, setWsConnected] = useState(false);
  const [generatorRunning, setGeneratorRunning] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!WS_ENABLED) return;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!destroyed) setWsConnected(true);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "BATCH_CREATED" && Array.isArray(msg.items)) {
            injectIdeas(msg.items as Idea[]);
          }
          if (msg.type === "GENERATOR_STATUS") {
            setGeneratorRunning(!!msg.running);
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!destroyed) {
          setWsConnected(false);
          retryRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [injectIdeas]);

  async function startGenerator() {
    if (!WS_ENABLED) return;
    await fetch(`${API_URL}/api/generator/start`, { method: "POST" });
    setGeneratorRunning(true);
  }

  async function stopGenerator() {
    if (!WS_ENABLED) return;
    await fetch(`${API_URL}/api/generator/stop`, { method: "POST" });
    setGeneratorRunning(false);
  }

  return (
    <WebSocketContext.Provider value={{ wsConnected, generatorRunning, startGenerator, stopGenerator }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
}
