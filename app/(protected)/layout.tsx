import { redirect } from 'next/navigation';
import { getSession, getIsGuest } from '@/lib/session';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import styles from './layout.module.scss';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isGuest = await getIsGuest();

  if (!session && !isGuest) redirect('/login');

  return (
    <div className={styles.root}>
      <Nav
        userEmail={session?.user?.email}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        isGuest={isGuest && !session}
      />
      <div className={styles.content}>{children}</div>
      <Footer />
    </div>
  );
}
