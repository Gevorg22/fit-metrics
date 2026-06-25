'use client';

import { useEffect, useRef, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Only shown on regular web — hidden inside Telegram Mini App (initData handles auth there)
export function TelegramLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    // If running inside Telegram Mini App, don't show the widget — TelegramAutoLogin handles it
    if ((globalThis as any).Telegram?.WebApp?.initData) {
      setIsMiniApp(true);
      return;
    }

    (globalThis as any).onTelegramAuth = async (user: TelegramUser) => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch('/api/telegram/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });
        if (res.ok) {
          globalThis.location.href = '/dashboard';
        } else {
          setError(true);
          setLoading(false);
        }
      } catch {
        setError(true);
        setLoading(false);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'fitmetrics_app_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      delete (globalThis as any).onTelegramAuth;
    };
  }, []);

  if (isMiniApp) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {loading && (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>Входим через Telegram...</p>
      )}
      {error && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ant-color-error)' }}>
          Ошибка входа. Попробуй снова.
        </p>
      )}
      <div ref={containerRef} />
    </div>
  );
}
