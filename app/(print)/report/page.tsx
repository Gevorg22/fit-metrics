import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PrintActions } from './PrintActions';
import styles from './page.module.scss';

export const metadata = { title: 'Отчёт — fitMetrics' };

function calcOrm(weight: number, reps: number): number {
  return reps > 1 ? Math.round(weight * (1 + reps / 30)) : weight;
}

export default async function ReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [user, workouts, prRaw, goals, weightLog, streakData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, heightCm: true, goalWeight: true },
    }),
    prisma.workout.findMany({
      where: { userId, startedAt: { gte: monthAgo }, finishedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      include: { sets: { select: { exerciseId: true, weight: true, reps: true } } },
    }),
    prisma.workoutSet.groupBy({
      by: ['exerciseId'],
      where: { workout: { userId } },
      _max: { weight: true, reps: true },
      orderBy: { _max: { weight: 'desc' } },
      take: 10,
    }),
    prisma.exerciseGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.weightLog.findMany({
      where: { userId, date: { gte: monthAgo } },
      orderBy: { date: 'asc' },
      select: { weight: true, date: true },
    }),
    prisma.workout.count({ where: { userId } }),
  ]);

  const allExerciseIds = [
    ...new Set([
      ...prRaw.map((r) => r.exerciseId),
      ...goals.map((g) => g.exerciseId),
    ]),
  ];
  const exercises = allExerciseIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: allExerciseIds } },
        select: { id: true, nameRu: true, name: true },
      })
    : [];
  const exName = Object.fromEntries(exercises.map((e) => [e.id, e.nameRu ?? e.name]));

  const goalsBest = await Promise.all(
    goals.map(async (g) => {
      const best = await prisma.workoutSet.aggregate({
        where: { workout: { userId }, exerciseId: g.exerciseId },
        _max: { weight: true },
      });
      return { ...g, currentWeight: best._max.weight ?? 0 };
    })
  );

  const totalVolume = workouts.reduce(
    (sum, w) => sum + w.sets.reduce((s2, s) => s2 + s.weight * s.reps, 0),
    0
  );
  const avgDuration =
    workouts.length > 0
      ? Math.round(
          workouts.reduce((sum, w) => {
            const dur = w.finishedAt
              ? (new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000
              : 0;
            return sum + dur;
          }, 0) / workouts.length
        )
      : 0;

  const displayName = user?.name || user?.email || '';
  const reportDate = now.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
  const periodLabel = `${monthAgo.toLocaleDateString('ru', { day: 'numeric', month: 'short' })} — ${now.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className={styles.page}>
      <PrintActions />

      <header className={styles.header}>
        <div className={styles.logo}>fitMetrics</div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>{displayName}</span>
          <span className={styles.reportDate}>{reportDate}</span>
        </div>
      </header>

      <h1 className={styles.title}>Отчёт о тренировках</h1>
      <p className={styles.period}>Период: {periodLabel}</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Статистика за месяц</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{workouts.length}</span>
            <span className={styles.statLabel}>тренировок</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)} т` : `${Math.round(totalVolume)} кг`}
            </span>
            <span className={styles.statLabel}>поднято</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{avgDuration} мин</span>
            <span className={styles.statLabel}>средняя тренировка</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{streakData}</span>
            <span className={styles.statLabel}>тренировок всего</span>
          </div>
        </div>
      </section>

      {prRaw.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Личные рекорды</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Упражнение</th>
                <th>Макс. вес</th>
                <th>Повторения</th>
                <th>1RM (Epley)</th>
              </tr>
            </thead>
            <tbody>
              {prRaw.filter((r) => r._max.weight).map((r) => (
                <tr key={r.exerciseId}>
                  <td>{exName[r.exerciseId] ?? r.exerciseId}</td>
                  <td>{r._max.weight} кг</td>
                  <td>{r._max.reps ?? '—'}</td>
                  <td>
                    {r._max.weight && r._max.reps
                      ? `≈ ${calcOrm(r._max.weight, r._max.reps)} кг`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {goalsBest.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Цели</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Упражнение</th>
                <th>Сейчас</th>
                <th>Цель</th>
                <th>Прогресс</th>
                <th>До</th>
              </tr>
            </thead>
            <tbody>
              {goalsBest.map((g) => {
                const pct = Math.min(100, Math.round((g.currentWeight / g.targetWeight) * 100));
                return (
                  <tr key={g.id}>
                    <td>{g.exerciseName}</td>
                    <td>{g.currentWeight} кг</td>
                    <td>{g.targetWeight} кг</td>
                    <td>
                      <div className={styles.miniBar}>
                        <div className={styles.miniBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.pctText}>{pct}%</span>
                    </td>
                    <td>{new Date(g.targetDate).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {weightLog.length > 1 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Динамика веса</h2>
          <div className={styles.weightRow}>
            <div className={styles.weightStat}>
              <span className={styles.weightStatLabel}>Начало периода</span>
              <span className={styles.weightStatValue}>{weightLog[0].weight} кг</span>
            </div>
            <div className={styles.weightArrow}>→</div>
            <div className={styles.weightStat}>
              <span className={styles.weightStatLabel}>Конец периода</span>
              <span className={styles.weightStatValue}>{weightLog[weightLog.length - 1].weight} кг</span>
            </div>
            <div className={styles.weightDiff}>
              {(() => {
                const diff = weightLog[weightLog.length - 1].weight - weightLog[0].weight;
                return (
                  <span style={{ color: diff < 0 ? '#22c55e' : diff > 0 ? '#f59e0b' : '#888' }}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} кг
                  </span>
                );
              })()}
            </div>
          </div>
          {user?.goalWeight && (
            <p className={styles.goalNote}>
              Целевой вес: {user.goalWeight} кг
            </p>
          )}
        </section>
      )}

      {workouts.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Тренировки за период</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Подходов</th>
                <th>Объём</th>
                <th>Длительность</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((w) => {
                const vol = w.sets.reduce((s, set) => s + set.weight * set.reps, 0);
                const dur = w.finishedAt
                  ? Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000)
                  : null;
                return (
                  <tr key={w.id}>
                    <td>{new Date(w.startedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</td>
                    <td>{w.sets.length}</td>
                    <td>{vol >= 1000 ? `${(vol / 1000).toFixed(1)} т` : `${Math.round(vol)} кг`}</td>
                    <td>{dur !== null ? `${dur} мин` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <footer className={styles.footer}>
        <span>fitMetrics — личный дневник тренировок</span>
        <span>fit-metrics-xi.vercel.app</span>
        <span>Created by Gevorg K</span>
      </footer>
    </div>
  );
}
