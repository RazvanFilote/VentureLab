import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface BookmarksContextType {
  savedIdeaIds: string[];
  toggleBookmark: (ideaId: string) => void;
  isBookmarked: (ideaId: string) => boolean;
}

const BookmarksContext = createContext<BookmarksContextType | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  // Map of userId -> ideaId[]
  const [bookmarks, setBookmarks] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem("vl_bookmarks");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("vl_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const userId = currentUser?.id ?? "";
  const savedIdeaIds = bookmarks[userId] ?? [];

  function toggleBookmark(ideaId: string) {
    setBookmarks((prev) => {
      const current = prev[userId] ?? [];
      const updated = current.includes(ideaId)
        ? current.filter((id) => id !== ideaId)
        : [...current, ideaId];
      return { ...prev, [userId]: updated };
    });
  }

  function isBookmarked(ideaId: string) {
    return savedIdeaIds.includes(ideaId);
  }

  return (
    <BookmarksContext.Provider value={{ savedIdeaIds, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
