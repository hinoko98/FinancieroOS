'use client';

import {
  CssBaseline,
  StyledEngineProvider,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { useMemo } from 'react';

export function MuiProvider({ children }: { children: React.ReactNode }) {
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
          mode: 'light',
          primary: {
            main: '#6f4e37',
          },
          secondary: {
            main: '#9a6a1f',
          },
          success: {
            main: '#1f7a45',
          },
          error: {
            main: '#a63f2e',
          },
          background: {
            default: '#eadfce',
            paper: '#fffaf4',
          },
          text: {
            primary: '#3e2c23',
            secondary: '#7a6558',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                minHeight: '100vh',
              },
            },
          },
        },
      }),
    [],
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
