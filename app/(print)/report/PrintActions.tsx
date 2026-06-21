'use client';

import styles from './page.module.scss';

export function PrintActions() {
  return (
    <div className={styles.printBtn}>
      <button className={styles.btn} onClick={() => window.print()}>
        Печать / Сохранить PDF
      </button>
      <a href="/dashboard" className={styles.backLink}>← Назад</a>
    </div>
  );
}
