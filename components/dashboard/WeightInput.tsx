'use client';

import { useState } from 'react';
import { Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import styles from './WeightInput.module.scss';

interface WeightEntry {
  id: string;
  weight: number;
}

interface Props {
  todayWeight?: number | null;
  onSaved?: (entry: WeightEntry) => void;
}

export function WeightInput({ todayWeight, onSaved }: Props) {
  const [value, setValue] = useState<string>(todayWeight != null ? String(todayWeight) : '');
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const parseWeight = (raw: string): number | null => {
    const normalized = raw.trim().replace(/,/g, '.');
    const num = parseFloat(normalized);
    return isNaN(num) || num <= 0 ? null : num;
  };

  const handleSave = async () => {
    const num = parseWeight(value);
    if (num === null) {
      messageApi.warning('Введи корректный вес');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: num }),
      });
      if (!res.ok) throw new Error();
      const entry: WeightEntry = await res.json();
      setValue(String(num));
      messageApi.success('Вес сохранён!');
      onSaved?.(entry);
    } catch {
      messageApi.error('Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className={styles.wrap}>
      {contextHolder}
      <div className={styles.row}>
        <div className={`${styles.input} ${styles.inputWrap}`}>
          <input
            type="text"
            inputMode="decimal"
            className={styles.textInput}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="75.0"
          />
          <span className={styles.addon}>кг</span>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          size="large"
          loading={loading}
          onClick={handleSave}
          disabled={!value.trim()}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
}
