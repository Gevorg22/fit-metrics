import styles from './loading.module.scss';

export default function HistoryLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBone} />
        <div className={styles.countBone} />
      </div>
      <div className={styles.list}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.itemBone} />
        ))}
      </div>
    </div>
  );
}
