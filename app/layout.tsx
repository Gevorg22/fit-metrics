import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'fitMetrics — трекер тренировок',
  description: 'Отслеживай тренировки, вес и прогресс в упражнениях',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#22c55e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={ruRU}
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#22c55e',
                colorBgBase: '#0d0d0d',
                colorBgContainer: '#161616',
                colorBgElevated: '#1f1f1f',
                colorBorder: '#2a2a2a',
                colorText: '#f5f5f5',
                colorTextSecondary: '#a3a3a3',
                borderRadius: 8,
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              },
              components: {
                Menu: {
                  darkItemBg: '#161616',
                  darkSubMenuItemBg: '#0d0d0d',
                  darkItemSelectedBg: 'rgba(34,197,94,0.12)',
                  darkItemSelectedColor: '#22c55e',
                },
                Layout: {
                  siderBg: '#161616',
                  bodyBg: '#0d0d0d',
                  headerBg: '#161616',
                },
                Card: {
                  colorBgContainer: '#161616',
                },
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
