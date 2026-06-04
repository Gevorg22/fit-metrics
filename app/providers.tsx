'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';

type AppTheme = 'dark' | 'light';

interface ThemeCtx {
  appTheme: AppTheme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeCtx>({ appTheme: 'dark', toggleTheme: () => {} });

export function useAppTheme() {
  return useContext(ThemeContext);
}

const DARK_TOKENS = {
  colorPrimary: '#22c55e',
  colorBgBase: '#0d0d0d',
  colorBgContainer: '#161616',
  colorBgElevated: '#1f1f1f',
  colorBorder: '#2a2a2a',
  colorText: '#f5f5f5',
  colorTextSecondary: '#a3a3a3',
  borderRadius: 8,
  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
} as const;

const LIGHT_TOKENS = {
  colorPrimary: '#16a34a',
  colorBgBase: '#f4f6f8',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#f0f2f5',
  colorBorder: '#e2e8f0',
  colorText: '#0f172a',
  colorTextSecondary: '#475569',
  borderRadius: 8,
  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
} as const;

export function Providers({ children }: { children: React.ReactNode }) {
  const [appTheme, setAppTheme] = useState<AppTheme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('fitmetrics-theme') as AppTheme | null;
    const initial = saved === 'light' || saved === 'dark' ? saved : 'dark';
    setAppTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    setAppTheme((prev) => {
      const next: AppTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('fitmetrics-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  const isDark = appTheme === 'dark';

  return (
    <ThemeContext.Provider value={{ appTheme, toggleTheme }}>
      <ConfigProvider
        locale={ruRU}
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: isDark ? DARK_TOKENS : LIGHT_TOKENS,
          components: isDark
            ? {
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
              }
            : {},
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
