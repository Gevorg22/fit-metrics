'use client';

import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './PwaInstallPrompt.module.scss';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'fitmetrics-pwa-dismissed';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.icon}>💪</div>
        <div className={styles.text}>
          <span className={styles.title}>Установить fitMetrics</span>
          <span className={styles.sub}>Работает быстрее как приложение</span>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          type="primary"
          size="small"
          icon={<DownloadOutlined />}
          loading={installing}
          onClick={handleInstall}
        >
          Установить
        </Button>
        <button className={styles.close} onClick={handleDismiss} aria-label="Закрыть">
          <CloseOutlined />
        </button>
      </div>
    </div>
  );
}
