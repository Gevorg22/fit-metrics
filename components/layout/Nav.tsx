'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useAppTheme } from '@/app/providers';
import styles from './Nav.module.scss';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Главная' },
  { href: '/workout', label: 'Тренировка' },
  { href: '/history', label: 'История' },
  { href: '/nutrition', label: 'Питание' },
  { href: '/leaderboard', label: 'Рейтинг' },
  { href: '/profile', label: 'Профиль' },
];

interface Props {
  userEmail?: string | null;
  userName?: string | null;
  userImage?: string | null;
  isGuest?: boolean;
}

export function Nav({ userEmail, userName, userImage, isGuest }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { appTheme, toggleTheme } = useAppTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = () => {
    if (isGuest) {
      document.cookie = 'fitmetrics-guest=; path=/; max-age=0';
      window.location.href = '/login';
    } else {
      signOut({ callbackUrl: '/login' });
    }
  };

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoAccent}>fit</span>Metrics
        </Link>

        <div className={styles.links}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${pathname === link.href ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.right}>
          {isGuest ? (
            <span className={styles.guestBadge}>Гостевой режим</span>
          ) : (
            userEmail && (
              <Link href="/profile" className={styles.userLink}>
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userImage} alt={userName ?? userEmail} className={styles.userAvatar} />
                ) : (
                  <span className={styles.userAvatarFallback}>
                    {(userName ?? userEmail).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className={styles.email}>{userName ?? userEmail}</span>
              </Link>
            )
          )}

          <button
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={appTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            title={appTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {appTheme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button className={styles.logoutBtn} onClick={handleLogout}>
            {isGuest ? 'Войти' : 'Выйти'}
          </button>

          <button
            className={styles.burger}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Меню"
          >
            <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineTop : ''}`} />
            <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineMid : ''}`} />
            <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineBot : ''}`} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href ? styles.mobileLinkActive : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className={styles.mobileDivider} />
          {isGuest ? (
            <span className={styles.mobileGuestBadge}>Гостевой режим</span>
          ) : (
            userEmail && (
              <Link href="/profile" className={styles.mobileUserLink} onClick={() => setMenuOpen(false)}>
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userImage} alt={userName ?? userEmail} className={styles.mobileUserAvatar} />
                ) : (
                  <span className={styles.mobileUserAvatarFallback}>
                    {(userName ?? userEmail).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className={styles.mobileEmail}>{userName ?? userEmail}</span>
              </Link>
            )
          )}
          <button
            className={styles.mobileThemeBtn}
            onClick={() => { toggleTheme(); setMenuOpen(false); }}
          >
            {appTheme === 'dark' ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
          </button>
          <button className={styles.mobileLogoutBtn} onClick={handleLogout}>
            {isGuest ? 'Войти' : 'Выйти'}
          </button>
        </div>
      )}
    </>
  );
}
