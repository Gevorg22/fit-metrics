'use client';

import { useState } from 'react';
import { Spin } from 'antd';
import styles from './WeeklyReportCard.module.scss';

interface ReportData {
  report: string;
  workoutsCount: number;
  totalVolume: number;
}

export function WeeklyReportCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/weekly-report');
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>✦</span>
        <span className={styles.title}>Еженедельный AI-отчёт</span>
        {data && (
          <button className={styles.refresh} onClick={generate} title="Обновить" disabled={loading}>
            ↻
          </button>
        )}
      </div>

      {!data && !loading && !error && (
        <div className={styles.idle}>
          <p className={styles.idleText}>
            AI проанализирует твои тренировки за последние 7 дней и даст рекомендации на следующую неделю.
          </p>
          <button className={styles.btn} onClick={generate}>
            Сгенерировать отчёт
          </button>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <Spin size="small" />
          <span>Анализирую тренировки...</span>
        </div>
      )}

      {error && !loading && (
        <div className={styles.error}>
          <span>{error}</span>
          <button className={styles.btn} onClick={generate}>Повторить</button>
        </div>
      )}

      {data && !loading && (
        <div className={styles.result}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data.workoutsCount}</span>
              <span className={styles.statLabel}>тренировок за неделю</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {data.totalVolume >= 1000
                  ? `${(data.totalVolume / 1000).toFixed(1)} т`
                  : `${data.totalVolume} кг`}
              </span>
              <span className={styles.statLabel}>объём</span>
            </div>
          </div>
          <div className={styles.reportText}>
            {data.report.split('\n').filter(Boolean).map((paragraph, i) => (
              <p key={i} className={styles.paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
