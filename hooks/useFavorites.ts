'use client';

import { useState, useEffect, useCallback } from 'react';

const KEY = 'fitmetrics-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored) as string[]));
    } catch {}
    setMounted(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  return { favorites, toggle, mounted };
}
