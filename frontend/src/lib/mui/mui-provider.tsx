'use client';

import {
  CssBaseline,
  StyledEngineProvider,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

export function MuiProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') {
      return 'light';
    }

    return document.documentElement.dataset.dashboardTheme === 'dark'
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const syncThemeMode = () => {
      setThemeMode(root.dataset.dashboardTheme === 'dark' ? 'dark' : 'light');
    };

    syncThemeMode();

    const observer = new MutationObserver(syncThemeMode);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-dashboard-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: true,
        typography: {
          fontFamily: 'Manrope, sans-serif',
          button: {
            textTransform: 'none',
            fontWeight: 700,
          },
        },
        shape: {
          borderRadius: 14,
        },
        palette: {
          mode: themeMode,
          primary: {
            main: 'var(--color-brand)',
          },
          secondary: {
            main: 'var(--color-warning)',
          },
          success: {
            main: 'var(--color-success)',
          },
          error: {
            main: 'var(--color-danger)',
          },
          background: {
            default: 'var(--color-surface)',
            paper: 'var(--color-panel-strong)',
          },
          text: {
            primary: 'var(--color-ink)',
            secondary: 'var(--color-muted)',
          },
          divider: 'var(--color-line)',
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                minHeight: '100vh',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: 'var(--color-panel-strong)',
                color: 'var(--color-ink)',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderColor: 'var(--color-line)',
                color: 'var(--color-ink)',
              },
              head: {
                color: 'var(--color-muted)',
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor: 'var(--color-panel-strong)',
                color: 'var(--color-ink)',
              },
              notchedOutline: {
                borderColor: 'var(--color-line)',
              },
            },
          },
        },
      }),
    [themeMode],
  );

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
