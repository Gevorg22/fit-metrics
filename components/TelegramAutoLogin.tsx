'use client';

import { useEffect, useState } from 'react';
import { Spin, Button, Typography } from 'antd';

type State = 'loading' | 'done' | 'error';

// When inside Telegram Mini App — auto-authenticates via initData.
// Renders a full-screen loader so user never sees the login form.
export function TelegramAutoLogin() {
  const [state, setState] = useState<State>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    let attempts = 0;

    function tryAuth() {
      const tg = (globalThis as any).Telegram?.WebApp;

      if (!tg?.initData) {
        if (attempts++ < 20) { setTimeout(tryAuth, 100); return; }
        // SDK never loaded — not a Mini App context, hide this component
        setIsMiniApp(false);
        setState('done');
        return;
      }

      setIsMiniApp(true);
      tg.ready();
      tg.expand();

      fetch('/api/telegram/miniapp-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      })
        .then(async res => {
          if (res.ok) {
            globalThis.location.href = '/dashboard';
          } else {
            const body = await res.json().catch(() => ({}));
            setErrorMsg(body.error ?? `Ошибка ${res.status}`);
            setState('error');
          }
        })
        .catch(e => {
          setErrorMsg(e?.message ?? 'Сеть недоступна');
          setState('error');
        });
    }

    tryAuth();
  }, []);

  if (!isMiniApp) return null;

  if (state === 'loading') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'var(--bg-card, #141414)',
      }}>
        <Spin size="large" />
        <Typography.Text type="secondary">Входим через Telegram...</Typography.Text>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        background: 'var(--bg-card, #141414)', padding: 24,
      }}>
        <Typography.Text type="danger">Не удалось войти: {errorMsg}</Typography.Text>
        <Button onClick={() => globalThis.location.reload()}>Попробовать снова</Button>
      </div>
    );
  }

  return null;
}
