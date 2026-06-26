'use client';

import { useEffect, useRef, useState } from 'react';

// Only shown on regular web — hidden inside Telegram Mini App (initData handles auth there)
export function TelegramLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitingConfirm, setWaitingConfirm] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if ((globalThis as any).Telegram?.WebApp?.initData) {
      setIsMiniApp(true);
      return;
    }
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

    // Desktop: load Telegram Login Widget
    (globalThis as any).onTelegramAuth = async (user: object) => {
      setLoading(true);
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

  const handleMobileLogin = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/telegram/login-token', { method: 'POST' });
      const { token } = await res.json();

      // Open Telegram bot with login token
      globalThis.open(`https://t.me/fitmetrics_app_bot?start=login_${token}`, '_blank');

      setWaitingConfirm(true);
      setLoading(false);

      // Poll every 2 seconds for confirmation
      const interval = setInterval(async () => {
        const check = await fetch(`/api/telegram/check-token?token=${token}`);
        const data = await check.json();
        if (data.status === 'ok') {
          clearInterval(interval);
          globalThis.location.href = '/dashboard';
        } else if (data.status === 'expired' || data.status === 'not_found') {
          clearInterval(interval);
          setWaitingConfirm(false);
          setError(true);
        }
      }, 2000);

      // Stop polling after 10 minutes
      setTimeout(() => {
        clearInterval(interval);
        setWaitingConfirm(false);
      }, 10 * 60 * 1000);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  if (isMiniApp) return null;

  if (error) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ant-color-error)', textAlign: 'center' }}>
        Ошибка входа. Попробуй снова.
      </p>
    );
  }

  if (waitingConfirm) {
    return (
      <p style={{ margin: 0, fontSize: 13, opacity: 0.7, textAlign: 'center' }}>
        Подтверди вход в Telegram...
      </p>
    );
  }

  if (isMobile) {
    return (
      <button
        onClick={handleMobileLogin}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: '#2AABEE',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 600,
          fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          opacity: loading ? 0.7 : 1,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
        </svg>
        {loading ? 'Открываем Telegram...' : 'Войти через Telegram'}
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
