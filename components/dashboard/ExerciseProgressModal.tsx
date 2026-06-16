'use client';

import { useEffect, useState } from 'react';
import { Modal, Spin } from 'antd';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import styles from './ExerciseProgressModal.module.scss';

interface DataPoint {
  date: string;
  maxWeight: number;
  maxReps: number;
  totalVolume: number;
}

type ChartMode = 'strength' | 'volume';

interface Props {
  exerciseId: string | null;
  exerciseName: string;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

export function ExerciseProgressModal({ exerciseId, exerciseName, onClose }: Props) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ChartMode>('strength');

  useEffect(() => {
    if (!exerciseId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setData([]);
    setMode('strength');
    fetch(`/api/analytics/exercise?exerciseId=${exerciseId}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setData(d) : setData([]))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  const formatted = data.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <Modal
      open={!!exerciseId}
      onCancel={onClose}
      footer={null}
      title={`Прогресс: ${exerciseName}`}
      width={600}
      styles={{ body: { paddingTop: 16 } }}
    >
      {loading && (
        <div className={styles.center}>
          <Spin />
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className={styles.center}>
          <span className={styles.empty}>Нет данных по этому упражнению</span>
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === 'strength' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('strength')}
            >
              Макс. вес
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'volume' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('volume')}
            >
              Объём (кг)
            </button>
          </div>

          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={260}>
              {mode === 'strength' ? (
                <LineChart data={formatted} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#999' }} />
                  <YAxis yAxisId="w" tick={{ fontSize: 11, fill: '#999' }} unit=" кг" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: '#999' }} unit=" пов" />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#fff', marginBottom: 4 }}
                    itemStyle={{ color: '#ccc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="w" type="monotone" dataKey="maxWeight" name="Макс. вес (кг)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="r" type="monotone" dataKey="maxReps" name="Макс. повторения" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <LineChart data={formatted} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#999' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#999' }} unit=" кг" width={64} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#fff', marginBottom: 4 }}
                    itemStyle={{ color: '#ccc' }}
                    formatter={(v) => [`${v} кг`, 'Объём']}
                  />
                  <Line type="monotone" dataKey="totalVolume" name="Объём (кг)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Modal>
  );
}
