import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useOffers } from "./OffersContext";

const STORAGE_KEY = "vl_wallets_v1";
const INITIAL_BALANCE = 100_000;

type Wallets = Record<string, number>;

interface WalletContextType {
  getTotal: (investorName: string) => number;
  getCommitted: (investorName: string) => number;
  getAvailable: (investorName: string) => number;
  topUp: (investorName: string, amount: number) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { offers } = useOffers();

  const [wallets, setWallets] = useState<Wallets>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setWallets(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function getTotal(investorName: string): number {
    return wallets[investorName] ?? INITIAL_BALANCE;
  }

  function getCommitted(investorName: string): number {
    return offers
      .filter(o => o.investorName === investorName && (o.status === "Pending" || o.status === "Accepted"))
      .reduce((sum, o) => sum + o.amount, 0);
  }

  function getAvailable(investorName: string): number {
    return getTotal(investorName) - getCommitted(investorName);
  }

  function topUp(investorName: string, amount: number) {
    setWallets(prev => ({
      ...prev,
      [investorName]: (prev[investorName] ?? INITIAL_BALANCE) + amount,
    }));
  }

  return (
    <WalletContext.Provider value={{ getTotal, getCommitted, getAvailable, topUp }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
