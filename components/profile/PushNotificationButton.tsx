'use client';

import { useState } from 'react';
import { Switch } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import styles from './ProfileView.module.scss';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

interface Props {
  initialEnabled: boolean;
}

export function PushNotificationButton({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);

  const savePreference = async (value: boolean) => {
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationsEnabled: value }),
    });
  };

  const attemptPushSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
    } catch {
    }
  };

  const attemptPushUnsubscribe = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
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
    } catch {
    }
  };

  const handleToggle = async (checked: boolean) => {
    setBusy(true);
    try {
      if (checked) {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        await savePreference(true);
        await attemptPushSubscription();
        setEnabled(true);
      } else {
        await savePreference(false);
        await attemptPushUnsubscribe();
        setEnabled(false);
      }
    } catch {
      setEnabled(!checked);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.notifRow}>
      <BellOutlined className={styles.notifIcon} />
      <div className={styles.notifInfo}>
        <span className={styles.notifLabel}>Уведомления</span>
        <span className={styles.notifSub}>
          {enabled ? 'Включены' : 'Выключены'}
        </span>
      </div>
      <Switch checked={enabled} loading={busy} onChange={handleToggle} />
    </div>
  );
}
