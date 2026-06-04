import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Feedback, mockFeedback } from "../data/mockData";
import { feedbackApi } from "../api/rest";

interface IdeaStats {
  avgRating: number;
  feedbackCount: number;
}

interface FeedbackContextType {
  feedback: Feedback[];
  addFeedback: (data: Omit<Feedback, "id" | "createdAt">) => void;
  updateFeedback: (id: string, data: Pick<Feedback, "rating" | "comment">) => void;
  deleteFeedback: (id: string) => void;
  getIdeaStats: (ideaId: string) => IdeaStats;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

const CACHE_KEY = "vl_feedback_v3";

function loadCache(): Feedback[] {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? JSON.parse(stored) : mockFeedback;
  } catch {
    return mockFeedback;
  }
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback[]>(loadCache);

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(feedback));
  }, [feedback]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === CACHE_KEY && e.newValue) {
        try { setFeedback(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await feedbackApi.listAll();
        if (!cancelled) setFeedback(fresh);
      } catch (e) {
        console.warn("[FeedbackContext] initial fetch failed; using cache", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refetch = useCallback(async () => {
    try {
      const fresh = await feedbackApi.listAll();
      setFeedback(fresh);
    } catch (e) {
      console.warn("[FeedbackContext] refetch failed", e);
    }
  }, []);

  function addFeedback(data: Omit<Feedback, "id" | "createdAt">) {
    (async () => {
      try {
        const created = await feedbackApi.create(data);
        setFeedback((prev) => [...prev, created]);
      } catch (e) {
        console.error("[FeedbackContext] create failed", e);
      }
    })();
  }

  function updateFeedback(id: string, data: Pick<Feedback, "rating" | "comment">) {
    (async () => {
      try {
        const updated = await feedbackApi.update(id, data);
        setFeedback((prev) => prev.map((f) => (f.id === id ? { ...f, ...updated } : f)));
      } catch (e) {
        console.error("[FeedbackContext] update failed", e);
        refetch();
      }
    })();
  }

  function deleteFeedback(id: string) {
    (async () => {
      try {
        await feedbackApi.delete(id);
        setFeedback((prev) => prev.filter((f) => f.id !== id));
      } catch (e) {
        console.error("[FeedbackContext] delete failed", e);
        refetch();
      }
    })();
  }

  const getIdeaStats = useCallback((ideaId: string): IdeaStats => {
    const ideaFeedback = feedback.filter((f) => f.ideaId === ideaId);
    const feedbackCount = ideaFeedback.length;
    const avgRating =
      feedbackCount > 0
        ? ideaFeedback.reduce((sum, f) => sum + f.rating, 0) / feedbackCount
        : 0;
    return { avgRating, feedbackCount };
  }, [feedback]);

  return (
    <FeedbackContext.Provider value={{ feedback, addFeedback, updateFeedback, deleteFeedback, getIdeaStats }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextType {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used within FeedbackProvider");
  return ctx;
}
