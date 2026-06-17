import styles from './loading.module.scss';

export default function LeaderboardLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.titleBone} />
      <div className={styles.tabsBone} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.rowBone} />
      ))}
    </div>
  );
}
