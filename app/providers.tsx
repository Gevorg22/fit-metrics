'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  colorPrimary: '#ffa751',
  colorBgBase: '#171310',
  colorBgContainer: '#221b16',
  colorBgElevated: '#2b2119',
  colorBorder: '#3d2e24',
  colorText: '#fbf1e4',
  colorTextSecondary: '#c2a184',
  borderRadius: 14,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
} as const;

const LIGHT_TOKENS = {
  colorPrimary: '#e8791f',
  colorBgBase: '#fdf6ec',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#f7ede0',
  colorBorder: '#ecdcc4',
  colorText: '#2b1c10',
  colorTextSecondary: '#7a5c42',
  borderRadius: 14,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
} as const;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [appTheme, setAppTheme] = useState<AppTheme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('fitmetrics-theme') as AppTheme | null;
    const initial = saved === 'light' || saved === 'dark' ? saved : 'dark';
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <QueryClientProvider client={queryClient}>
    <SessionProvider>
    <ThemeContext.Provider value={{ appTheme, toggleTheme }}>
      <ConfigProvider
        locale={ruRU}
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: isDark ? DARK_TOKENS : LIGHT_TOKENS,
          components: isDark
            ? {
                Menu: {
                  darkItemBg: '#221b16',
                  darkSubMenuItemBg: '#171310',
                  darkItemSelectedBg: 'rgba(255,167,81,0.14)',
                  darkItemSelectedColor: '#ffa751',
                },
                Layout: {
                  siderBg: '#221b16',
                  bodyBg: '#171310',
                  headerBg: '#221b16',
                },
                Card: {
                  colorBgContainer: '#221b16',
                },
              }
            : {},
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
    </SessionProvider>
    </QueryClientProvider>
  );
}
