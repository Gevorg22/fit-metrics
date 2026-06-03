import styles from './loading.module.scss';

export default function DashboardLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.statsRow}>
        <div className={styles.card}>
          <div className={styles.cardSmallLine} />
          <div className={styles.cardBigLine} />
        </div>
        <div className={styles.card}>
          <div className={styles.cardSmallLine} />
          <div className={styles.cardBigLine} />
        </div>
      </div>

      <div className={styles.ctaCard}>
        <div className={styles.ctaText}>
          <div className={styles.ctaTitle} />
          <div className={styles.ctaSub} />
        </div>
        <div className={styles.ctaBtn} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle} />
        <div className={styles.prGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.prCard} />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle} />
        <div className={styles.weightInput} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle} />
        <div className={styles.chart} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.historyRow} />
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.historyRow} />
        ))}
      </div>
    </div>
  );
}
