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
  const [isMobile, setIsMobile] = useState(false);

  const handleTelegramAuth = async (user: TelegramUser) => {
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

  useEffect(() => {
    if ((globalThis as any).Telegram?.WebApp?.initData) {
      setIsMiniApp(true);
      return;
    }

    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Handle OAuth redirect callback — Telegram returns #tgAuthResult=BASE64_JSON
    if (globalThis.location.hash.startsWith('#tgAuthResult=')) {
      const encoded = globalThis.location.hash.slice('#tgAuthResult='.length);
      try {
        const userData = JSON.parse(atob(encoded));
        history.replaceState(null, '', globalThis.location.pathname);
        handleTelegramAuth(userData);
      } catch {
        setError(true);
      }
      return;
    }

    if (mobile) return;

    // Desktop: load Telegram Login Widget
    (globalThis as any).onTelegramAuth = (user: TelegramUser) => handleTelegramAuth(user);

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.dataset.telegramLogin = 'fitmetrics_app_bot';
    script.dataset.size = 'large';
    script.dataset.onauth = 'onTelegramAuth(user)';
    script.dataset.requestAccess = 'write';
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      delete (globalThis as any).onTelegramAuth;
    };
  }, []);

  if (isMiniApp) return null;

  if (loading) {
    return <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>Входим через Telegram...</p>;
  }

  if (error) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ant-color-error)' }}>
        Ошибка входа. Попробуй снова.
      </p>
    );
  }

  // Mobile: redirect to Telegram OAuth
  if (isMobile) {
    const handleMobileLogin = () => {
      const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
      const origin = globalThis.location.origin;
      const returnTo = `${origin}/login`;
      globalThis.location.href = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&return_to=${encodeURIComponent(returnTo)}&request_access=write`;
    };

    return (
      <button
        onClick={handleMobileLogin}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#2AABEE',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
        </svg>
        Войти через Telegram
      </button>
    );
  }

  // Desktop: Telegram Login Widget
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div ref={containerRef} />
    </div>
  );
}
