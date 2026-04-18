'use client';

import { createContext, useContext } from 'react';
import type {
  DashboardColorSet,
  ThemeBasePreset,
  ThemePreset,
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

export type PreviewPayload = Partial<DashboardColorSet> & {
  themePreset?: ThemePreset;
  customThemeBase?: ThemeBasePreset;
};

export type SettingsContextValue = {
  settings: DashboardSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  applyPreview: (preview: PreviewPayload) => void;
  resetPreview: () => void;
  defaults: DashboardColorSet;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings debe usarse dentro de SettingsProvider');
  }

  return context;
}
