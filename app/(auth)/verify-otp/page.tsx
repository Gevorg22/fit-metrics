'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Typography } from 'antd';
import styles from './page.module.scss';

const { Title, Paragraph } = Typography;

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        if (data.error === 'expired') {
          setError('Код истёк. Запроси новый.');
        } else {
          setError('Неверный код. Попробуй ещё раз.');
        }
      }
    } catch {
      setError('Ошибка соединения. Попробуй снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <span className={styles.logo}>
            <span className={styles.logoAccent}>fit</span>Metrics
          </span>
        </div>

        <Title level={4} className={styles.heading}>
          Введи код из письма
        </Title>
        <Paragraph className={styles.desc}>
          Мы отправили 6-значный код на{' '}
          <span className={styles.email}>{email || 'твой email'}</span>
        </Paragraph>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setError(null);
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
            }}
            placeholder="000000"
            className={styles.codeInput}
            autoFocus
            autoComplete="one-time-code"
          />
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            disabled={code.length !== 6}
            loading={loading}
          >
            Войти
          </Button>
        </form>

        <button className={styles.backLink} onClick={() => router.push('/login')}>
          Отправить код повторно
        </button>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
