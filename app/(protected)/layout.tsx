import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { Nav } from '@/components/layout/Nav';
import styles from './layout.module.scss';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const cookieStore = await cookies();
  const isGuest = cookieStore.get('fitmetrics-guest')?.value === '1';

  if (!session && !isGuest) redirect('/login');

  return (
    <div className={styles.root}>
      <Nav userEmail={session?.user?.email} isGuest={isGuest && !session} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
