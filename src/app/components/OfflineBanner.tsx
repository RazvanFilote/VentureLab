import { WifiOff, RefreshCw, CheckCircle } from "lucide-react";
import { useNetwork } from "../context/NetworkContext";
import { useState, useEffect } from "react";

export function OfflineBanner() {
  const { online, syncing, apiBase, lastError } = useNetwork();
  const [justSynced, setJustSynced] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) setWasOffline(true);
  }, [online]);

  useEffect(() => {
    if (online && wasOffline && !syncing) {
      setJustSynced(true);
      setWasOffline(false);
      const t = setTimeout(() => setJustSynced(false), 3000);
      return () => clearTimeout(t);
    }
  }, [online, syncing, wasOffline]);

  if (online && !syncing && !justSynced) return null;

  if (!online) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 bg-gray-900 text-white px-4 py-2.5 rounded-2xl shadow-lg text-sm font-medium max-w-[92vw]">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-red-400" />
          You are offline — changes will sync when reconnected
        </div>
        <div className="text-[10px] opacity-70 break-all text-center">
          API: {apiBase}{lastError ? ` — ${lastError}` : ""}
        </div>
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#4F46E5] text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Syncing queued changes…
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium">
      <CheckCircle className="w-4 h-4" />
      Back online — all changes synced
    </div>
  );
}
