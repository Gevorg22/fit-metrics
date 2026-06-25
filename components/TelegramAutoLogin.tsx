'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Auto-authenticates when the app is opened inside Telegram as a Mini App
export function TelegramAutoLogin() {
  const router = useRouter();

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.initData) return;

    tg.ready();
    tg.expand();

    fetch('/api/telegram/miniapp-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg.initData }),
    }).then(res => {
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
