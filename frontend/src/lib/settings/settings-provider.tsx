'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-provider';
import {
  getThemeColors,
  lightThemeColors,
  type DashboardColorSet,
  type ThemeBasePreset,
  type ThemePreset,
} from './theme-presets';

export type DashboardSettings = DashboardColorSet & {
  id: string;
  userId: string;
  themePreset: ThemePreset;
  customThemeBase: ThemeBasePreset;
  userIcon: string;
  createdAt: string;
  updatedAt: string;
};

type PreviewPayload = Partial<DashboardColorSet> & {
  themePreset?: ThemePreset;
  customThemeBase?: ThemeBasePreset;
};

type SettingsContextValue = {
  settings: DashboardSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  applyPreview: (preview: PreviewPayload) => void;
  resetPreview: () => void;
  defaults: DashboardColorSet;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyDashboardColors(
  colors: DashboardColorSet,
  mode: 'light' | 'dark' = 'light',
) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.dashboardTheme = mode;

  root.style.setProperty('--color-surface', colors.dashboardSurfaceColor);
  root.style.setProperty('--color-panel', colors.dashboardPanelColor);
  root.style.setProperty('--color-panel-strong', colors.dashboardPanelStrongColor);
  root.style.setProperty('--color-ink', colors.dashboardInkColor);
  root.style.setProperty('--color-muted', colors.dashboardMutedColor);
  root.style.setProperty('--color-line', colors.dashboardLineColor);
  root.style.setProperty('--color-brand', colors.dashboardBrandColor);
  root.style.setProperty('--color-brand-soft', colors.dashboardBrandSoftColor);
  root.style.setProperty('--color-brand-deep', colors.dashboardBrandDeepColor);
  root.style.setProperty('--color-success', colors.dashboardSuccessColor);
  root.style.setProperty('--color-danger', colors.dashboardDangerColor);
  root.style.setProperty('--color-warning', colors.dashboardWarningColor);
}

function resolveDashboardColors(
  settings: PreviewPayload &
    Partial<DashboardColorSet> & {
      themePreset?: ThemePreset;
      customThemeBase?: ThemeBasePreset;
    },
) {
  return getThemeColors(
    settings.themePreset ?? 'LIGHT',
    settings,
    settings.customThemeBase ?? 'LIGHT',
  );
}

function resolveThemeMode(
  settings:
    | (PreviewPayload & {
        themePreset?: ThemePreset;
        customThemeBase?: ThemeBasePreset;
      })
    | null
    | undefined,
) {
  const preset = settings?.themePreset ?? 'LIGHT';

  if (preset === 'DARK') {
    return 'dark' as const;
  }

  if (preset === 'CUSTOM' && settings?.customThemeBase === 'DARK') {
    return 'dark' as const;
  }

  return 'light' as const;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState<DashboardSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    if (!user || !token) {
      setSettings(null);
      applyDashboardColors(lightThemeColors, 'light');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.get<DashboardSettings>('/settings');
      setSettings(response.data);
      applyDashboardColors(
        resolveDashboardColors(response.data),
        resolveThemeMode(response.data),
      );
    } catch {
      setSettings(null);
      applyDashboardColors(lightThemeColors, 'light');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const applyPreview = useCallback(
    (preview: PreviewPayload) => {
      const nextSettings = {
        ...lightThemeColors,
        ...settings,
        ...preview,
      };
      applyDashboardColors(
        resolveDashboardColors(nextSettings),
        resolveThemeMode(nextSettings),
      );
    },
    [settings],
  );

  const resetPreview = useCallback(() => {
    applyDashboardColors(
      settings ? resolveDashboardColors(settings) : lightThemeColors,
      resolveThemeMode(settings),
    );
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      refreshSettings,
      applyPreview,
      resetPreview,
      defaults: lightThemeColors,
    }),
    [applyPreview, loading, refreshSettings, resetPreview, settings],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings debe usarse dentro de SettingsProvider');
  }

  return context;
}
