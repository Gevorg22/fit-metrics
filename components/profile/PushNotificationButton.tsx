'use client';

import { useState, useEffect } from 'react';
import { Button } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type SubState = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

export function PushNotificationButton() {
  const [state, setState] = useState<SubState>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? 'subscribed' : 'unsubscribed');
      })
    );
  }, []);

  const subscribe = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      const json = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setState('subscribed');
    } catch {
      if (Notification.permission === 'denied') setState('denied');
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState('unsubscribed');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'unsupported') return null;

  if (state === 'denied') {
    return (
      <Button disabled icon={<BellOutlined />} size="small">
        Уведомления заблокированы
      </Button>
    );
  }

  if (state === 'subscribed') {
    return (
      <Button icon={<BellFilled />} loading={busy} onClick={unsubscribe} size="small">
        Уведомления включены
      </Button>
    );
  }

  return (
    <Button icon={<BellOutlined />} loading={busy || state === 'loading'} onClick={subscribe} size="small">
      Включить уведомления
    </Button>
  );
}
