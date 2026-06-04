/**
 * ActivityContext – Silver Challenge
 * Tracks user activity and preferences using cookies.
 * Records: page visits, ideas viewed, offers sent, last-used filters, theme preference.
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// ── Cookie helpers ──────────────────────────────────────────────────────────
function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface PageVisit {
  path: string;
  timestamp: string;
}

export interface ActivityData {
  pageVisits: PageVisit[];
  recentlyViewedIdeas: string[];   // idea ids, max 10
  lastFilter: string;              // last industry filter used
  offersSentCount: number;
  feedbackGivenCount: number;
  sessionStartedAt: string;
  totalSessions: number;
}

interface ActivityContextType {
  activity: ActivityData;
  trackPageVisit: (path: string) => void;
  trackIdeaView: (ideaId: string) => void;
  trackFilterUsed: (filter: string) => void;
  trackOfferSent: () => void;
  trackFeedbackGiven: () => void;
  clearActivity: () => void;
}

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_ACTIVITY: ActivityData = {
  pageVisits: [],
  recentlyViewedIdeas: [],
  lastFilter: "",
  offersSentCount: 0,
  feedbackGivenCount: 0,
  sessionStartedAt: new Date().toISOString(),
  totalSessions: 1,
};

const COOKIE_KEY = "vl_activity";

function loadActivity(): ActivityData {
  try {
    const raw = getCookie(COOKIE_KEY);
    if (!raw) return DEFAULT_ACTIVITY;
    const parsed: ActivityData = JSON.parse(raw);
    // Increment session count when page loads
    return {
      ...parsed,
      sessionStartedAt: new Date().toISOString(),
      totalSessions: (parsed.totalSessions ?? 0) + 1,
    };
  } catch {
    return DEFAULT_ACTIVITY;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────
const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<ActivityData>(loadActivity);

  // Persist to cookie whenever activity changes
  useEffect(() => {
    setCookie(COOKIE_KEY, JSON.stringify(activity));
  }, [activity]);

  const trackPageVisit = useCallback((path: string) => {
    setActivity((prev) => ({
      ...prev,
      pageVisits: [
        ...prev.pageVisits.slice(-49), // keep last 50
        { path, timestamp: new Date().toISOString() },
      ],
    }));
  }, []);

  const trackIdeaView = useCallback((ideaId: string) => {
    setActivity((prev) => {
      const filtered = prev.recentlyViewedIdeas.filter((id) => id !== ideaId);
      return {
        ...prev,
        recentlyViewedIdeas: [ideaId, ...filtered].slice(0, 10),
      };
    });
  }, []);

  const trackFilterUsed = useCallback((filter: string) => {
    setActivity((prev) => ({ ...prev, lastFilter: filter }));
  }, []);

  const trackOfferSent = useCallback(() => {
    setActivity((prev) => ({ ...prev, offersSentCount: prev.offersSentCount + 1 }));
  }, []);

  const trackFeedbackGiven = useCallback(() => {
    setActivity((prev) => ({ ...prev, feedbackGivenCount: prev.feedbackGivenCount + 1 }));
  }, []);

  const clearActivity = useCallback(() => {
    deleteCookie(COOKIE_KEY);
    setActivity({ ...DEFAULT_ACTIVITY, totalSessions: 1 });
  }, []);

  return (
    <ActivityContext.Provider
      value={{
        activity,
        trackPageVisit,
        trackIdeaView,
        trackFilterUsed,
        trackOfferSent,
        trackFeedbackGiven,
        clearActivity,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity(): ActivityContextType {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider");
  return ctx;
}
