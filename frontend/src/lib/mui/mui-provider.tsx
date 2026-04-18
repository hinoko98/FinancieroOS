'use client';

import {
  CssBaseline,
  StyledEngineProvider,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { lightThemeColors } from '@/lib/settings/theme-presets';

type MuiThemeSnapshot = {
  mode: 'light' | 'dark';
  palette: {
    brand: string;
    warning: string;
    success: string;
    danger: string;
    surface: string;
    panelStrong: string;
    ink: string;
    muted: string;
    line: string;
  };
};

const fallbackThemeSnapshot: MuiThemeSnapshot = {
  mode: 'light',
  palette: {
    brand: lightThemeColors.dashboardBrandColor,
    warning: lightThemeColors.dashboardWarningColor,
    success: lightThemeColors.dashboardSuccessColor,
    danger: lightThemeColors.dashboardDangerColor,
    surface: lightThemeColors.dashboardSurfaceColor,
    panelStrong: lightThemeColors.dashboardPanelStrongColor,
    ink: lightThemeColors.dashboardInkColor,
    muted: lightThemeColors.dashboardMutedColor,
    line: lightThemeColors.dashboardLineColor,
  },
};

function readCssColor(
  styles: CSSStyleDeclaration,
  variableName: string,
  fallback: string,
) {
  const value = styles.getPropertyValue(variableName).trim();
  return value || fallback;
}

function readThemeSnapshot(): MuiThemeSnapshot {
  if (typeof document === 'undefined') {
    return fallbackThemeSnapshot;
  }

  const root = document.documentElement;
  const styles = window.getComputedStyle(root);

  return {
    mode: root.dataset.dashboardTheme === 'dark' ? 'dark' : 'light',
    palette: {
      brand: readCssColor(
        styles,
        '--color-brand',
        fallbackThemeSnapshot.palette.brand,
      ),
      warning: readCssColor(
        styles,
        '--color-warning',
        fallbackThemeSnapshot.palette.warning,
      ),
      success: readCssColor(
        styles,
        '--color-success',
        fallbackThemeSnapshot.palette.success,
      ),
      danger: readCssColor(
        styles,
        '--color-danger',
        fallbackThemeSnapshot.palette.danger,
      ),
      surface: readCssColor(
        styles,
        '--color-surface',
        fallbackThemeSnapshot.palette.surface,
      ),
      panelStrong: readCssColor(
        styles,
        '--color-panel-strong',
        fallbackThemeSnapshot.palette.panelStrong,
      ),
      ink: readCssColor(styles, '--color-ink', fallbackThemeSnapshot.palette.ink),
      muted: readCssColor(
        styles,
        '--color-muted',
        fallbackThemeSnapshot.palette.muted,
      ),
      line: readCssColor(styles, '--color-line', fallbackThemeSnapshot.palette.line),
    },
  };
}

export function MuiProvider({ children }: { children: React.ReactNode }) {
  const [themeSnapshot, setThemeSnapshot] = useState<MuiThemeSnapshot>(() =>
    readThemeSnapshot(),
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const syncThemeMode = () => {
      setThemeSnapshot(readThemeSnapshot());
    };

    syncThemeMode();

    const observer = new MutationObserver(syncThemeMode);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-dashboard-theme', 'style'],
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
          mode: themeSnapshot.mode,
          primary: {
            main: themeSnapshot.palette.brand,
          },
          secondary: {
            main: themeSnapshot.palette.warning,
          },
          success: {
            main: themeSnapshot.palette.success,
          },
          error: {
            main: themeSnapshot.palette.danger,
          },
          background: {
            default: themeSnapshot.palette.surface,
            paper: themeSnapshot.palette.panelStrong,
          },
          text: {
            primary: themeSnapshot.palette.ink,
            secondary: themeSnapshot.palette.muted,
          },
          divider: themeSnapshot.palette.line,
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
    [themeSnapshot],
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
