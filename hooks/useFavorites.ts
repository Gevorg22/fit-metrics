'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const LS_KEY = 'fitmetrics-favorites';

function lsGet(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function lsSet(set: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {}
}

export function useFavorites() {
  const { data: session, status } = useSession();
  const isAuth = status === 'authenticated';
  const isGuest = status !== 'authenticated';

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (isAuth) {
      fetch('/api/favorites')
        .then((r) => r.json())
        .then((ids: string[]) => {
          if (Array.isArray(ids)) setFavorites(new Set(ids));
        })
        .catch(() => {})
        .finally(() => setMounted(true));
    } else {
      setFavorites(lsGet());
      setMounted(true);
    }
  }, [status, isAuth]);

  const toggle = useCallback(
    async (exerciseId: string) => {
      const isFav = favorites.has(exerciseId);

      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(exerciseId);
        else next.add(exerciseId);
        if (isGuest) lsSet(next);
        return next;
      });

      if (isAuth) {
        try {
          await fetch('/api/favorites', {
            method: isFav ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exerciseId }),
          });
        } catch {}
      }
    },
    [favorites, isAuth, isGuest]
  );

  return { favorites, toggle, mounted };
}
