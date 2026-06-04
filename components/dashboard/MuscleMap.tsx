'use client';

import { useEffect, useState } from 'react';
import styles from './MuscleMap.module.scss';

type Counts = Record<string, number>;

interface Region {
  key: string;
  label: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  muscles: string[];
}

function mir(regions: Region[]): Region[] {
  const out: Region[] = [];
  for (const r of regions) {
    out.push(r);
    if (r.cx !== 100) out.push({ ...r, key: r.key + '-m', cx: 200 - r.cx });
  }
  return out;
}

const FRONT: Region[] = mir([
  { key: 'shoulders',  label: 'Плечи',        cx: 45,  cy: 88,  rx: 18, ry: 15, muscles: ['shoulders'] },
  { key: 'chest',      label: 'Грудь',         cx: 83,  cy: 106, rx: 19, ry: 18, muscles: ['chest'] },
  { key: 'biceps',     label: 'Бицепс',        cx: 44,  cy: 122, rx: 12, ry: 20, muscles: ['biceps'] },
  { key: 'forearms',   label: 'Предплечья',    cx: 37,  cy: 165, rx: 11, ry: 22, muscles: ['forearms'] },
  { key: 'abs',        label: 'Пресс',         cx: 100, cy: 150, rx: 20, ry: 28, muscles: ['abdominals'] },
  { key: 'quads',      label: 'Квадрицепс',    cx: 80,  cy: 255, rx: 20, ry: 38, muscles: ['quadriceps'] },
  { key: 'calves',     label: 'Икры',          cx: 80,  cy: 320, rx: 14, ry: 24, muscles: ['calves'] },
]);

const BACK: Region[] = mir([
  { key: 'traps',      label: 'Трапеции',          cx: 100, cy: 78,  rx: 32, ry: 14, muscles: ['traps'] },
  { key: 'sh-b',       label: 'Плечи',             cx: 45,  cy: 90,  rx: 18, ry: 15, muscles: ['shoulders'] },
  { key: 'lats',       label: 'Широчайшие',         cx: 70,  cy: 118, rx: 20, ry: 32, muscles: ['lats'] },
  { key: 'triceps',    label: 'Трицепс',            cx: 44,  cy: 123, rx: 12, ry: 20, muscles: ['triceps'] },
  { key: 'mid-back',   label: 'Средняя спина',      cx: 100, cy: 128, rx: 17, ry: 18, muscles: ['middle back'] },
  { key: 'low-back',   label: 'Нижняя спина',       cx: 100, cy: 162, rx: 15, ry: 12, muscles: ['lower back'] },
  { key: 'glutes',     label: 'Ягодицы',            cx: 82,  cy: 204, rx: 22, ry: 24, muscles: ['glutes'] },
  { key: 'hamstrings', label: 'Задняя поверхность', cx: 80,  cy: 251, rx: 20, ry: 36, muscles: ['hamstrings'] },
  { key: 'calves-b',   label: 'Икры',               cx: 80,  cy: 317, rx: 14, ry: 24, muscles: ['calves'] },
]);

function getCount(r: Region, data: Counts): number {
  return r.muscles.reduce((s, m) => s + (data[m] ?? 0), 0);
}

function lvl(count: number, max: number): 0 | 1 | 2 | 3 {
  if (!count || !max) return 0;
  const ratio = count / max;
  if (ratio < 0.2) return 1;
  if (ratio < 0.55) return 2;
  return 3;
}

interface Tip { label: string; count: number; x: number; y: number }

function BodyOutline() {
  return (
    <g className={styles.body}>
      <circle cx="100" cy="30" r="21" />
      <rect x="92" y="50" width="16" height="15" rx="4" />
      <rect x="63" y="63" width="74" height="130" rx="14" />
      <rect x="29" y="65" width="28" height="74" rx="12" />
      <rect x="143" y="65" width="28" height="74" rx="12" />
      <rect x="22" y="141" width="24" height="54" rx="10" />
      <rect x="154" y="141" width="24" height="54" rx="10" />
      <rect x="65" y="191" width="70" height="30" rx="10" />
      <rect x="57" y="217" width="44" height="82" rx="14" />
      <rect x="99" y="217" width="44" height="82" rx="14" />
      <rect x="61" y="299" width="36" height="57" rx="12" />
      <rect x="103" y="299" width="36" height="57" rx="12" />
    </g>
  );
}

function BodyView({ regions, data, maxSets, onHover, label }: {
  regions: Region[];
  data: Counts;
  maxSets: number;
  onHover: (t: Tip | null) => void;
  label: string;
}) {
  return (
    <div className={styles.svgWrap}>
      <span className={styles.viewLabel}>{label}</span>
      <svg viewBox="0 0 200 365" className={styles.svg}>
        <BodyOutline />
        {regions.map((r) => {
          const count = getCount(r, data);
          const lv = lvl(count, maxSets);
          return (
            <ellipse
              key={r.key}
              cx={r.cx}
              cy={r.cy}
              rx={r.rx}
              ry={r.ry}
              className={`${styles.muscle} ${styles[`lv${lv}`]}`}
              onMouseEnter={(e) =>
                onHover({ label: r.label, count, x: e.clientX, y: e.clientY })
              }
              onMouseLeave={() => onHover(null)}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function MuscleMap() {
  const [data, setData] = useState<Counts>({});
  const [loading, setLoading] = useState(true);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    fetch('/api/analytics/muscles')
      .then((r) => r.json())
      .then((d) => (typeof d === 'object' && !d.error ? setData(d) : setData({})))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  const maxSets = Math.max(...Object.values(data), 1);

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  const hasData = Object.values(data).some((v) => v > 0);

  return (
    <div className={styles.wrap}>
      {!hasData && (
        <p className={styles.empty}>Нет тренировок за последние 7 дней</p>
      )}
      <div className={styles.maps}>
        <BodyView regions={FRONT} data={data} maxSets={maxSets} onHover={setTip} label="Перед" />
        <BodyView regions={BACK}  data={data} maxSets={maxSets} onHover={setTip} label="Спина" />
      </div>
      <div className={styles.legend}>
        <span className={styles.legendTitle}>Нагрузка за 7 дней:</span>
        {([1, 2, 3] as const).map((lv, i) => (
          <span key={lv} className={styles.legendItem}>
            <span className={`${styles.dot} ${styles[`lv${lv}`]}`} />
            {['Слабо', 'Средне', 'Активно'][i]}
          </span>
        ))}
      </div>
      {tip && (
        <div
          className={styles.tooltip}
          style={{ left: tip.x, top: tip.y - 10, transform: 'translate(-50%,-100%)' }}
        >
          <strong>{tip.label}</strong>
          {tip.count > 0 && <span>{tip.count} подх.</span>}
        </div>
      )}
    </div>
  );
}
