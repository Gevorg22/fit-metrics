'use client';

import { useEffect } from 'react';

// Auto-authenticates when the app is opened inside Telegram as a Mini App.
// Polls for SDK readiness since the script loads asynchronously.
export function TelegramAutoLogin() {
  useEffect(() => {
    let attempts = 0;

    function tryAuth() {
      const tg = (globalThis as any).Telegram?.WebApp;

      if (!tg?.initData) {
        if (attempts++ < 20) setTimeout(tryAuth, 100);
        return;
      }

      tg.ready();
      tg.expand();

      fetch('/api/telegram/miniapp-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      }).then(res => {
        if (res.ok) {
          // Full reload so the new session cookie is picked up by middleware
          globalThis.location.href = '/dashboard';
        }
      });
    }

    tryAuth();
  }, []);

  return null;
}
