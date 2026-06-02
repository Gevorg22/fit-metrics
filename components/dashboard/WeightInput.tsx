'use client';

import { useState } from 'react';
import { InputNumber, Button, Space, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import styles from './WeightInput.module.scss';

interface Props {
  todayWeight?: number | null;
}

export function WeightInput({ todayWeight }: Props) {
  const [value, setValue] = useState<number | null>(todayWeight ?? null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSave = async () => {
    if (!value || value <= 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: value }),
      });
      if (!res.ok) throw new Error();
      messageApi.success('Вес сохранён!');
    } catch {
      messageApi.error('Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      {contextHolder}
      <div className={styles.row}>
        <Space.Compact size="large" className={styles.input}>
          <InputNumber
            value={value}
            onChange={(v) => setValue(v)}
            min={20}
            max={300}
            precision={1}
            step={0.1}
            placeholder="75.0"
            onPressEnter={handleSave}
            className={styles.inputNumber}
          />
          <span className={styles.addon}>кг</span>
        </Space.Compact>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          size="large"
          loading={loading}
          onClick={handleSave}
          disabled={!value}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
}
