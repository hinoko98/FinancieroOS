export type DashboardColorSet = {
  dashboardSurfaceColor: string;
  dashboardPanelColor: string;
  dashboardPanelStrongColor: string;
  dashboardInkColor: string;
  dashboardMutedColor: string;
  dashboardLineColor: string;
  dashboardBrandColor: string;
  dashboardBrandSoftColor: string;
  dashboardBrandDeepColor: string;
  dashboardSuccessColor: string;
  dashboardDangerColor: string;
  dashboardWarningColor: string;
};

export type ThemePreset = 'LIGHT' | 'DARK' | 'CUSTOM';
export type ThemeBasePreset = 'LIGHT' | 'DARK';

export const lightThemeColors: DashboardColorSet = {
  dashboardSurfaceColor: '#eadfce',
  dashboardPanelColor: '#faf4eb',
  dashboardPanelStrongColor: '#fffaf4',
  dashboardInkColor: '#3e2c23',
  dashboardMutedColor: '#7a6558',
  dashboardLineColor: '#70543e',
  dashboardBrandColor: '#6f4e37',
  dashboardBrandSoftColor: '#ead7c3',
  dashboardBrandDeepColor: '#4f3527',
  dashboardSuccessColor: '#1f7a45',
  dashboardDangerColor: '#a63f2e',
  dashboardWarningColor: '#9a6a1f',
};

export const darkThemeColors: DashboardColorSet = {
  dashboardSurfaceColor: '#050816',
  dashboardPanelColor: '#0c1324',
  dashboardPanelStrongColor: '#121b30',
  dashboardInkColor: '#edf3ff',
  dashboardMutedColor: '#8b99b2',
  dashboardLineColor: '#24314d',
  dashboardBrandColor: '#b88646',
  dashboardBrandSoftColor: '#1b2740',
  dashboardBrandDeepColor: '#e7bf7a',
  dashboardSuccessColor: '#34c38f',
  dashboardDangerColor: '#f26d7d',
  dashboardWarningColor: '#d9a441',
};

export const themePresetOptions: {
  id: ThemePreset;
  label: string;
  description: string;
}[] = [
  {
    id: 'LIGHT',
    label: 'Claro',
    description: 'Panel luminoso para trabajo diario.',
  },
  {
    id: 'DARK',
    label: 'Oscuro',
    description: 'Contraste alto para jornadas largas.',
  },
  {
    id: 'CUSTOM',
    label: 'Personalizado',
    description: 'Edita manualmente toda la paleta.',
  },
];

export function getThemeColors(
  preset: ThemePreset,
  customColors?: Partial<DashboardColorSet>,
  customThemeBase: ThemeBasePreset = 'LIGHT',
) {
  const baseColors =
    preset === 'DARK'
      ? darkThemeColors
      : preset === 'CUSTOM'
        ? customThemeBase === 'DARK'
          ? darkThemeColors
          : lightThemeColors
        : lightThemeColors;

  if (preset !== 'CUSTOM') {
    return baseColors;
  }

  return {
    ...baseColors,
    ...customColors,
  };
}
