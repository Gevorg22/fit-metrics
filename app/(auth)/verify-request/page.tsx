'use client';

import Link from 'next/link';
import { Button, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import styles from './page.module.css';

const { Title, Paragraph } = Typography;

export default function VerifyRequestPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <MailOutlined className={styles.icon} />
        </div>
        <Title level={3} className={styles.title}>
          Проверь почту
        </Title>
        <Paragraph type="secondary" className={styles.desc}>
          Мы отправили тебе Magic Link. Нажми на ссылку в письме, чтобы войти в приложение.
        </Paragraph>
        <Paragraph type="secondary" className={styles.hint}>
          Письмо может попасть в папку «Спам» — не забудь проверить.
        </Paragraph>
        <Link href="/login">
          <Button block>Вернуться назад</Button>
        </Link>
      </div>
    </div>
  );
}
