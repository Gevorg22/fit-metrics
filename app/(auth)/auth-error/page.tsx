'use client';

import Link from 'next/link';
import { Button, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import styles from './page.module.css';

const { Title, Paragraph } = Typography;

export default function AuthErrorPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <WarningOutlined className={styles.icon} />
        </div>
        <Title level={3} className={styles.title}>
          Ошибка входа
        </Title>
        <Paragraph type="secondary" className={styles.desc}>
          Ссылка устарела или недействительна. Запроси новый Magic Link.
        </Paragraph>
        <Link href="/login">
          <Button type="primary" block>
            Попробовать снова
          </Button>
        </Link>
      </div>
    </div>
  );
}
