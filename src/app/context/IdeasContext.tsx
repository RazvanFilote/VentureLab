import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Idea, mockIdeas } from "../data/mockData";
import { ideasApi } from "../api/rest";

interface IdeasContextType {
  ideas: Idea[];
  addIdea: (data: Pick<Idea, "title" | "industry" | "stage" | "description" | "createdBy">) => void;
  updateIdea: (id: string, data: Pick<Idea, "title" | "industry" | "stage" | "description">) => void;
  deleteIdea: (id: string) => void;
  injectIdeas: (items: Idea[]) => void;
}

const IdeasContext = createContext<IdeasContextType | null>(null);

const CACHE_KEY = "vl_ideas";

function loadCache(): Idea[] {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? JSON.parse(stored) : mockIdeas;
  } catch {
    return mockIdeas;
  }
}

export function IdeasProvider({ children }: { children: ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>(loadCache);

  // Persist whatever is currently in memory so a reload doesn't blank the UI
  // before the next fetch resolves.
  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(ideas));
  }, [ideas]);

  // Cross-tab sync (kept from the original; harmless when the API is the
  // source of truth).
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === CACHE_KEY && e.newValue) {
        try { setIdeas(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Initial fetch from the backend. If it fails (offline), we keep whatever
  // the cache gave us.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await ideasApi.listAll();
        if (!cancelled) setIdeas(fresh);
      } catch (e) {
        console.warn("[IdeasContext] initial fetch failed; using cache", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refetch = useCallback(async () => {
    try {
      const fresh = await ideasApi.listAll();
      setIdeas(fresh);
    } catch (e) {
      console.warn("[IdeasContext] refetch failed", e);
    }
  }, []);

  function addIdea(data: Pick<Idea, "title" | "industry" | "stage" | "description" | "createdBy">) {
    (async () => {
      try {
        const created = await ideasApi.create(data);
        setIdeas((prev) => [...prev, created]);
      } catch (e) {
        console.error("[IdeasContext] create failed", e);
      }
    })();
  }

  function updateIdea(
    id: string,
    data: Pick<Idea, "title" | "industry" | "stage" | "description">,
  ) {
    (async () => {
      try {
        const updated = await ideasApi.update(id, data);
        setIdeas((prev) => prev.map((idea) => (idea.id === id ? { ...idea, ...updated } : idea)));
      } catch (e) {
        console.error("[IdeasContext] update failed", e);
        refetch();
      }
    })();
  }

  function deleteIdea(id: string) {
    (async () => {
      try {
        await ideasApi.delete(id);
        setIdeas((prev) => prev.filter((idea) => idea.id !== id));
      } catch (e) {
        console.error("[IdeasContext] delete failed", e);
        refetch();
      }
    })();
  }

  const injectIdeas = useCallback((items: Idea[]) => {
    setIdeas((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const fresh = items.filter((i) => !existingIds.has(i.id));
      return fresh.length > 0 ? [...prev, ...fresh] : prev;
    });
  }, []);

  return (
    <IdeasContext.Provider value={{ ideas, addIdea, updateIdea, deleteIdea, injectIdeas }}>
      {children}
    </IdeasContext.Provider>
  );
}

export function useIdeas(): IdeasContextType {
  const ctx = useContext(IdeasContext);
  if (!ctx) throw new Error("useIdeas must be used within IdeasProvider");
  return ctx;
}
