'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { MailOutlined, EyeOutlined } from '@ant-design/icons';
import styles from './page.module.scss';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async ({ email }: { email: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch {
      setError('Не удалось отправить код. Проверь адрес и попробуй снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    document.cookie = 'fitmetrics-guest=1; path=/; max-age=86400; SameSite=Lax';
    window.location.href = '/dashboard';
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <span className={styles.logo}>
            <span className={styles.logoAccent}>fit</span>Metrics
          </span>
          <Text type="secondary" className={styles.tagline}>
            Трекер тренировок и веса тела
          </Text>
        </div>

        <Title level={4} className={styles.heading}>
          Войти в аккаунт
        </Title>
        <Paragraph type="secondary" className={styles.desc}>
          Введи email — пришлём одноразовый код для входа.
        </Paragraph>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className={styles.alert}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Введи email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="you@example.com"
              size="large"
              autoComplete="email"
              autoFocus
            />
          </Form.Item>

          <Form.Item className={styles.submitBtn}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Получить код
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" className={styles.dividerText}>или</Text>
        </Divider>

        <Button size="large" block icon={<EyeOutlined />} onClick={handleGuest} className={styles.guestBtn}>
          Гостевой режим
        </Button>
        <Text type="secondary" className={styles.guestNote}>
          Без регистрации — данные не сохраняются
        </Text>
      </div>
    </div>
  );
}
