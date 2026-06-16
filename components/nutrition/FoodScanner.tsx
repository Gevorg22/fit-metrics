'use client';

import { useRef, useState } from 'react';
import { Button, Spin, message } from 'antd';
import { CameraOutlined, PlusOutlined } from '@ant-design/icons';
import styles from './FoodScanner.module.scss';

interface ScanResult {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Props {
  onAdd: (entry: ScanResult) => void;
}

export function FoodScanner({ onAdd }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const handleFile = async (file: File) => {
    setResult(null);
    setPreview(URL.createObjectURL(file));
    setScanning(true);

    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await fetch('/api/nutrition/scan', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        messageApi.error(data.error ?? 'Ошибка распознавания');
        setPreview(null);
      } else {
        setResult(data);
      }
    } catch {
      messageApi.error('Ошибка соединения');
      setPreview(null);
    } finally {
      setScanning(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleAdd = async () => {
    if (!result) return;
    setAdding(true);
    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error();
      onAdd(result);
      setResult(null);
      setPreview(null);
      messageApi.success('Добавлено в дневник');
    } catch {
      messageApi.error('Ошибка добавления');
    } finally {
      setAdding(false);
    }
  };

  const reset = () => { setResult(null); setPreview(null); };

  return (
    <div className={styles.wrap}>
      {contextHolder}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className={styles.hidden}
      />

      {!preview && (
        <button className={styles.scanBtn} onClick={() => fileRef.current?.click()}>
          <CameraOutlined className={styles.scanIcon} />
          <span>Сфотографировать еду</span>
          <span className={styles.scanSub}>AI посчитает калории и КБЖУ</span>
        </button>
      )}

      {preview && (
        <div className={styles.previewWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Фото еды" className={styles.preview} />
          {scanning && (
            <div className={styles.overlay}>
              <Spin size="large" />
              <span className={styles.overlayText}>Анализирую...</span>
            </div>
          )}
        </div>
      )}

      {result && !scanning && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <span className={styles.resultName}>✦ {result.name}</span>
          </div>
          <div className={styles.resultMacros}>
            <div className={styles.resultStat}>
              <span className={styles.resultVal}>{result.calories}</span>
              <span className={styles.resultLabel}>ккал</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.resultVal}>{result.protein}г</span>
              <span className={styles.resultLabel}>белки</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.resultVal}>{result.fat}г</span>
              <span className={styles.resultLabel}>жиры</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.resultVal}>{result.carbs}г</span>
              <span className={styles.resultLabel}>углеводы</span>
            </div>
          </div>
          <div className={styles.resultActions}>
            <Button type="primary" icon={<PlusOutlined />} loading={adding} onClick={handleAdd} block>
              Добавить в дневник
            </Button>
            <Button onClick={reset} block>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
