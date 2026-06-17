import styles from './loading.module.scss';

export default function NutritionLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div className={styles.titleBone} />
        <div className={styles.dateBone} />
      </div>
      <div className={styles.card} />
      <div className={styles.logCard} />
      <div className={styles.addCard} />
      <div className={styles.addCard} />
    </div>
  );
}
