import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Offer, mockOffers } from "../data/mockData";
import { offersApi } from "../api/rest";

interface OffersContextType {
  offers: Offer[];
  addOffer: (data: Omit<Offer, "id" | "status" | "createdAt">) => void;
  updateOfferStatus: (id: string, status: "Accepted" | "Rejected") => void;
  deleteOffer: (id: string) => void;
}

const OffersContext = createContext<OffersContextType | null>(null);

const CACHE_KEY = "vl_offers_v3";

function loadCache(): Offer[] {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? JSON.parse(stored) : mockOffers;
  } catch {
    return mockOffers;
  }
}

export function OffersProvider({ children }: { children: ReactNode }) {
  const [offers, setOffers] = useState<Offer[]>(loadCache);

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === CACHE_KEY && e.newValue) {
        try { setOffers(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await offersApi.listAll();
        if (!cancelled) setOffers(fresh);
      } catch (e) {
        console.warn("[OffersContext] initial fetch failed; using cache", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refetch = useCallback(async () => {
    try {
      const fresh = await offersApi.listAll();
      setOffers(fresh);
    } catch (e) {
      console.warn("[OffersContext] refetch failed", e);
    }
  }, []);

  function addOffer(data: Omit<Offer, "id" | "status" | "createdAt">) {
    (async () => {
      try {
        const created = await offersApi.create(data);
        setOffers((prev) => [...prev, created]);
      } catch (e) {
        console.error("[OffersContext] create failed", e);
      }
    })();
  }

  function updateOfferStatus(id: string, status: "Accepted" | "Rejected") {
    (async () => {
      try {
        const updated = await offersApi.updateStatus(id, status);
        setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      } catch (e) {
        console.error("[OffersContext] status update failed", e);
        refetch();
      }
    })();
  }

  function deleteOffer(id: string) {
    (async () => {
      try {
        await offersApi.delete(id);
        setOffers((prev) => prev.filter((o) => o.id !== id));
      } catch (e) {
        console.error("[OffersContext] delete failed", e);
        refetch();
      }
    })();
  }

  return (
    <OffersContext.Provider value={{ offers, addOffer, updateOfferStatus, deleteOffer }}>
      {children}
    </OffersContext.Provider>
  );
}

export function useOffers(): OffersContextType {
  const ctx = useContext(OffersContext);
  if (!ctx) throw new Error("useOffers must be used within OffersProvider");
  return ctx;
}
