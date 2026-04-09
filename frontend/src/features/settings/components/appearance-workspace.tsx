'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { RefreshCcw, SlidersHorizontal } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { apiClient } from '@/lib/api/client';
import {
  type DashboardSettings,
  useSettings,
} from '@/lib/settings/settings-provider';
import {
  darkThemeColors,
  lightThemeColors,
  themePresetOptions,
  type DashboardColorSet,
  type ThemeBasePreset,
  type ThemePreset,
} from '@/lib/settings/theme-presets';
import { UserIcon, userIconOptions } from '@/lib/settings/user-icons';

type PaletteField = {
  key: keyof DashboardColorSet;
  label: string;
};

const paletteFields: PaletteField[] = [
  { key: 'dashboardSurfaceColor', label: 'Fondo general' },
  { key: 'dashboardPanelColor', label: 'Panel principal' },
  { key: 'dashboardPanelStrongColor', label: 'Panel fuerte' },
  { key: 'dashboardInkColor', label: 'Texto principal' },
  { key: 'dashboardMutedColor', label: 'Texto secundario' },
  { key: 'dashboardLineColor', label: 'Bordes' },
  { key: 'dashboardBrandColor', label: 'Color marca' },
  { key: 'dashboardBrandSoftColor', label: 'Marca suave' },
  { key: 'dashboardBrandDeepColor', label: 'Marca intensa' },
  { key: 'dashboardSuccessColor', label: 'Exito' },
  { key: 'dashboardDangerColor', label: 'Peligro' },
  { key: 'dashboardWarningColor', label: 'Advertencia' },
];

function extractErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data;

    if (Array.isArray(payload?.message)) {
      return payload.message.join(', ');
    }

    if (typeof payload?.message === 'string') {
      return payload.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'No fue posible completar la operacion.';
}

function getBasePalette(base: ThemeBasePreset) {
  return base === 'DARK' ? darkThemeColors : lightThemeColors;
}

export function AppearanceWorkspace() {
  const {
    settings,
    loading,
    refreshSettings,
    applyPreview,
    resetPreview,
    defaults,
  } = useSettings();

  const [themePreset, setThemePreset] = useState<ThemePreset>('LIGHT');
  const [customThemeBase, setCustomThemeBase] = useState<ThemeBasePreset>('LIGHT');
  const [userIcon, setUserIcon] = useState('user-round');
  const [paletteForm, setPaletteForm] = useState<DashboardColorSet>(defaults);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setThemePreset(settings.themePreset);
      setCustomThemeBase(settings.customThemeBase);
      setUserIcon(settings.userIcon);
      setPaletteForm({
        dashboardSurfaceColor: settings.dashboardSurfaceColor,
        dashboardPanelColor: settings.dashboardPanelColor,
        dashboardPanelStrongColor: settings.dashboardPanelStrongColor,
        dashboardInkColor: settings.dashboardInkColor,
        dashboardMutedColor: settings.dashboardMutedColor,
        dashboardLineColor: settings.dashboardLineColor,
        dashboardBrandColor: settings.dashboardBrandColor,
        dashboardBrandSoftColor: settings.dashboardBrandSoftColor,
        dashboardBrandDeepColor: settings.dashboardBrandDeepColor,
        dashboardSuccessColor: settings.dashboardSuccessColor,
        dashboardDangerColor: settings.dashboardDangerColor,
        dashboardWarningColor: settings.dashboardWarningColor,
      });
      return;
    }

    setThemePreset('LIGHT');
    setCustomThemeBase('LIGHT');
    setUserIcon('user-round');
    setPaletteForm(defaults);
  }, [defaults, settings]);

  const updateAppearanceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch('/settings', {
        themePreset,
        customThemeBase,
        userIcon,
        ...paletteForm,
      });
      return response.data as DashboardSettings;
    },
    onSuccess: async (nextSettings) => {
      applyPreview({
        ...nextSettings,
      });
      await refreshSettings();
      setMessage('Configuracion visual guardada para tu usuario.');
      setError(null);
    },
    onError: (nextError) => {
      setError(extractErrorMessage(nextError));
      setMessage(null);
      resetPreview();
    },
  });

  const setThemeWithBase = (
    nextPreset: ThemePreset,
    nextBase: ThemeBasePreset,
    nextPalette: DashboardColorSet,
  ) => {
    setThemePreset(nextPreset);
    setCustomThemeBase(nextBase);
    setPaletteForm(nextPalette);
    applyPreview({
      themePreset: nextPreset,
      customThemeBase: nextBase,
      ...nextPalette,
    });
  };

  const selectThemePreset = (preset: ThemePreset) => {
    if (preset === 'CUSTOM') {
      setThemePreset('CUSTOM');
      applyPreview({
        themePreset: 'CUSTOM',
        customThemeBase,
        ...paletteForm,
      });
      return;
    }

    const nextBase = preset === 'DARK' ? 'DARK' : 'LIGHT';
    setThemeWithBase(preset, nextBase, getBasePalette(nextBase));
  };

  const handlePaletteChange = (
    key: keyof DashboardColorSet,
    value: string,
  ) => {
    const nextBase =
      themePreset === 'DARK'
        ? 'DARK'
        : themePreset === 'LIGHT'
          ? 'LIGHT'
          : customThemeBase;
    const nextPalette = {
      ...paletteForm,
      [key]: value,
    };

    setThemePreset('CUSTOM');
    setCustomThemeBase(nextBase);
    setPaletteForm(nextPalette);
    applyPreview({
      themePreset: 'CUSTOM',
      customThemeBase: nextBase,
      ...nextPalette,
    });
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Configuracion visual"
        subtitle="Este panel es solo para colores, icono y apariencia del usuario actual."
      >
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setMessage(null);
            updateAppearanceMutation.mutate();
          }}
        >
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 text-sm text-[var(--color-muted)]">
            Aqui ajustas tema, icono y paleta personal. No modifica nombre,
            contrasena ni configuracion global de la plataforma.
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Tema del panel</p>
            <div className="grid gap-4 md:grid-cols-3">
              {themePresetOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectThemePreset(option.id)}
                  className={`rounded-[var(--radius-card)] border p-5 text-left transition ${
                    themePreset === option.id
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)]'
                      : 'border-[var(--color-line)] bg-white'
                  }`}
                >
                  <p className="font-bold">{option.label}</p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <p className="text-sm font-semibold">Icono del usuario</p>
              <div className="grid gap-4 md:grid-cols-2">
                {userIconOptions.map((option) => {
                  const Icon = option.icon;
                  const active = userIcon === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setUserIcon(option.id)}
                      className={`rounded-[var(--radius-card)] border p-4 text-left transition ${
                        active
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)]'
                          : 'border-[var(--color-line)] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-[var(--radius-control)] bg-[var(--color-panel)] p-3 text-[var(--color-brand-deep)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold">{option.label}</p>
                          <p className="text-sm text-[var(--color-muted)]">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                  <UserIcon iconId={userIcon} className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">Vista previa del perfil</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    El icono y los colores se aplican solo a tu sesion.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  Base del tema personalizado
                </p>
                <div className="mt-3 flex gap-3">
                  {(['LIGHT', 'DARK'] as ThemeBasePreset[]).map((base) => (
                    <button
                      key={base}
                      type="button"
                      onClick={() => {
                        setCustomThemeBase(base);
                        if (themePreset === 'CUSTOM') {
                          applyPreview({
                            themePreset: 'CUSTOM',
                            customThemeBase: base,
                            ...paletteForm,
                          });
                        }
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        customThemeBase === base
                          ? 'bg-[var(--color-brand)] text-white'
                          : 'border border-[var(--color-line)] bg-white text-[var(--color-brand-deep)]'
                      }`}
                    >
                      {base === 'LIGHT' ? 'Claro' : 'Oscuro'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">Paleta manual</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Si modificas colores, se conserva la base clara u oscura para que
                el resultado siga coherente.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {paletteFields.map((field) => (
                <label key={field.key} className="space-y-2 text-sm">
                  <span className="font-semibold">{field.label}</span>
                  <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3">
                    <input
                      type="color"
                      value={paletteForm[field.key]}
                      onChange={(event) =>
                        handlePaletteChange(field.key, event.target.value)
                      }
                      className="h-10 w-12 rounded-xl border-0 bg-transparent p-0"
                    />
                    <input
                      value={paletteForm[field.key]}
                      onChange={(event) =>
                        handlePaletteChange(field.key, event.target.value)
                      }
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          {message ? <p className="text-sm text-[var(--color-success)]">{message}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={updateAppearanceMutation.isPending || loading}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateAppearanceMutation.isPending
                ? 'Guardando...'
                : 'Guardar configuracion'}
            </button>
            <button
              type="button"
              onClick={() => {
                setThemeWithBase('LIGHT', 'LIGHT', lightThemeColors);
                setUserIcon('user-round');
                setMessage(null);
                setError(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)]"
            >
              <RefreshCcw className="h-4 w-4" />
              Restaurar
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Alcance"
        subtitle="Lo que si entra en esta configuracion."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-[var(--color-brand)]" />
              Tema e interfaz
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Tema claro, oscuro o manual con vista previa inmediata.
            </p>
          </div>
          <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
            <p className="text-sm font-semibold">Identidad personal</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Icono del usuario y acentos visuales de tu panel.
            </p>
          </div>
          <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
            <p className="text-sm font-semibold">Solo tu sesion</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              No cambia ni la plataforma completa ni el perfil de otros usuarios.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
