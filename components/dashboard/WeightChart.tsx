'use client';

import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { PeriodFilter } from '@/types';
import styles from './WeightChart.module.scss';

interface DataPoint {
  date: string;
  weight: number;
}

const PERIODS: { label: string; value: PeriodFilter }[] = [
  { label: '1 мес', value: '1m' },
  { label: '3 мес', value: '3m' },
  { label: '1 год', value: '1y' },
];

function formatDate(dateStr: string, period: PeriodFilter): string {
  const d = new Date(dateStr);
  if (period === '1y') return d.toLocaleDateString('ru', { month: 'short' });
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

interface WeightChartProps {
  refreshKey?: number;
}

export function WeightChart({ refreshKey }: WeightChartProps) {
  const [period, setPeriod] = useState<PeriodFilter>('1m');
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics/weight?period=${period}`)
      .then((r) => {
        if (!r.ok) return [];
        return r.json();
      })
      .then((raw: { weight: number; date: string }[]) => {
        if (cancelled) return;
        if (!Array.isArray(raw)) {
          setData([]);
        } else {
          setData(raw.map((d) => ({ weight: d.weight, date: d.date })));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, refreshKey]);

  const handlePeriodChange = (p: PeriodFilter) => {
    setLoading(true);
    setPeriod(p);
  };

  const min = data.length ? Math.floor(Math.min(...data.map((d) => d.weight)) - 2) : 0;
  const max = data.length ? Math.ceil(Math.max(...data.map((d) => d.weight)) + 2) : 100;

  return (
    <div className={styles.wrap}>
      <div className={styles.periodRow}>
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={`${styles.periodBtn} ${period === p.value ? styles.active : ''}`}
            onClick={() => handlePeriodChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.center}>
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <p className={styles.empty}>Нет данных за выбранный период</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDate(v, period)}
              tick={{ fontSize: 11, fill: '#a3a3a3' }}
              axisLine={{ stroke: '#2a2a2a' }}
              tickLine={false}
            />
            <YAxis
              domain={[min, max]}
              tickFormatter={(v) => `${v} кг`}
              tick={{ fontSize: 11, fill: '#a3a3a3' }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: '#1f1f1f',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(v) => [`${v} кг`, 'Вес']}
              labelFormatter={(l) =>
                new Date(l).toLocaleDateString('ru', { day: 'numeric', month: 'long' })
              }
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#weightGrad)"
              dot={{ fill: '#22c55e', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
