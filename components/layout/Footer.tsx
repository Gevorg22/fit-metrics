import styles from './Footer.module.scss';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>Created by Gevorg Karagozian</span>
      <span className={styles.dot}>·</span>
      <a href="https://github.com/Gevorg22" target="_blank" rel="noopener noreferrer" className={styles.link}>GitHub</a>
      <span className={styles.dot}>·</span>
      <a href="https://t.me/Gevorg1989" target="_blank" rel="noopener noreferrer" className={styles.link}>Telegram</a>
      <span className={styles.dot}>·</span>
      <a href="mailto:gevorg227@gmail.com" className={styles.link}>Email</a>
    </footer>
  );
}
