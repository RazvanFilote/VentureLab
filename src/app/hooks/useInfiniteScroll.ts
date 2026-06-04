import { useState, useEffect, useRef, useCallback } from "react";
import type { PageResult } from "../api/types";

interface UseInfiniteScrollOptions<T> {
  fetchPage: (page: number) => Promise<PageResult<T>>;
  pageSize?: number;
}

interface UseInfiniteScrollReturn<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  reset: () => void;
}

export function useInfiniteScroll<T>({ fetchPage, pageSize = 20 }: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const cache = useRef<Map<number, T[]>>(new Map());
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  const prefetch = useCallback(
    async (pageNum: number) => {
      if (cache.current.has(pageNum)) return;
      try {
        const result = await fetchPage(pageNum);
        cache.current.set(pageNum, result.items);
      } catch {}
    },
    [fetchPage]
  );

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        let pageItems: T[];
        let totalPages: number;

        if (cache.current.has(pageNum)) {
          pageItems = cache.current.get(pageNum)!;
          // We need total pages — peek ahead if cache doesn't have it
          // Use a sentinel: if cache has THIS page but no next-page result yet, fetch fresh for page count
          const result = await fetchPage(pageNum);
          totalPages = result.pages;
          pageItems = result.items;
          cache.current.set(pageNum, pageItems);
        } else {
          const result = await fetchPage(pageNum);
          pageItems = result.items;
          totalPages = result.pages;
          cache.current.set(pageNum, pageItems);
        }

        setItems((prev) => (pageNum === 1 ? pageItems : [...prev, ...pageItems]));
        const more = pageNum < totalPages;
        hasMoreRef.current = more;
        setHasMore(more);
        pageRef.current = pageNum;
        setPage(pageNum);

        // Prefetch next page silently
        if (more) prefetch(pageNum + 1);
      } catch {
        hasMoreRef.current = false;
        setHasMore(false);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [fetchPage, prefetch]
  );

  // Load first page on mount / fetchPage change
  useEffect(() => {
    cache.current.clear();
    hasMoreRef.current = true;
    pageRef.current = 1;
    loadPage(1);
  }, [loadPage]);

  // IntersectionObserver fires when sentinel comes into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          loadPage(pageRef.current + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadPage]);

  const reset = useCallback(() => {
    cache.current.clear();
    hasMoreRef.current = true;
    pageRef.current = 1;
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadPage(1);
  }, [loadPage]);

  return { items, loading, hasMore, sentinelRef, reset };
}
