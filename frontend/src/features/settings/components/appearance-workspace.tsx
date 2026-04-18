'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { CircleHelp, RefreshCcw, RotateCcw, Save } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { apiClient } from '@/lib/api/client';
import {
  type DashboardSettings,
  useSettings,
} from '@/lib/settings/settings-context';
import {
  graphiteThemeColors,
  darkThemeColors,
  lightThemeColors,
  themePresetOptions,
  type DashboardColorSet,
  type ThemeBasePreset,
  type ThemePreset,
} from '@/lib/settings/theme-presets';
import { userIconOptions } from '@/lib/settings/user-icon-options';
import { UserIcon } from '@/lib/settings/user-icons';

type PaletteField = {
  key: keyof DashboardColorSet;
  label: string;
  help: string;
};

const paletteFields: PaletteField[] = [
  {
    key: 'dashboardSurfaceColor',
    label: 'Fondo general',
    help: 'Color base del panel completo y del fondo principal.',
  },
  {
    key: 'dashboardPanelColor',
    label: 'Panel principal',
    help: 'Superficie base para bloques internos y contenedores.',
  },
  {
    key: 'dashboardPanelStrongColor',
    label: 'Panel fuerte',
    help: 'Superficie elevada para tarjetas y zonas destacadas.',
  },
  {
    key: 'dashboardInkColor',
    label: 'Texto principal',
    help: 'Color del contenido principal y encabezados.',
  },
  {
    key: 'dashboardMutedColor',
    label: 'Texto secundario',
    help: 'Color de apoyo para descripciones y datos menos prioritarios.',
  },
  {
    key: 'dashboardLineColor',
    label: 'Bordes',
    help: 'Líneas, divisores y contornos del sistema.',
  },
  {
    key: 'dashboardBrandColor',
    label: 'Color marca',
    help: 'Acento principal para acciones y estados activos.',
  },
  {
    key: 'dashboardBrandSoftColor',
    label: 'Marca suave',
    help: 'Version suave del acento para fondos activos o resaltados.',
  },
  {
    key: 'dashboardBrandDeepColor',
    label: 'Marca intensa',
    help: 'Version profunda del acento para contraste o texto sobre marca.',
  },
  {
    key: 'dashboardSuccessColor',
    label: 'Exito',
    help: 'Color para estados positivos, aprobados o saldo sano.',
  },
  {
    key: 'dashboardDangerColor',
    label: 'Peligro',
    help: 'Color para errores, alertas y acciones destructivas.',
  },
  {
    key: 'dashboardWarningColor',
    label: 'Advertencia',
    help: 'Color para estados de atencion o seguimiento.',
  },
];

function HelpHint({ message }: { message: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-line)]/30 bg-[var(--color-panel)] text-[var(--color-muted)] transition hover:border-[var(--color-brand)]/40 hover:text-[var(--color-brand-deep)] focus:border-[var(--color-brand)]/40 focus:text-[var(--color-brand-deep)] focus:outline-none"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-[var(--radius-control)] border border-[var(--color-line)]/40 bg-[var(--color-panel-strong)] px-3 py-2 text-xs leading-5 text-[var(--color-ink)] opacity-0 shadow-[var(--shadow-panel)] transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {message}
      </span>
    </span>
  );
}

function SectionHeading({
  title,
  help,
}: {
  title: string;
  help: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-sm font-semibold tracking-[0.02em]">{title}</p>
      <HelpHint message={help} />
    </div>
  );
}

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

function getInitialAppearanceState(
  settings: DashboardSettings | null,
  defaults: DashboardColorSet,
) {
  if (settings) {
    return {
      themePreset: settings.themePreset,
      customThemeBase: settings.customThemeBase,
      userIcon: settings.userIcon,
      paletteForm: {
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
      } satisfies DashboardColorSet,
    };
  }

  return {
    themePreset: 'LIGHT' as ThemePreset,
    customThemeBase: 'LIGHT' as ThemeBasePreset,
    userIcon: 'user-round',
    paletteForm: defaults,
  };
}

function AppearanceWorkspaceForm({
  settings,
  loading,
  refreshSettings,
  applyPreview,
  resetPreview,
  defaults,
}: {
  settings: DashboardSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  applyPreview: (preview: Partial<DashboardColorSet> & {
    themePreset?: ThemePreset;
    customThemeBase?: ThemeBasePreset;
  }) => void;
  resetPreview: () => void;
  defaults: DashboardColorSet;
}) {
  const initialState = getInitialAppearanceState(settings, defaults);

  const [themePreset, setThemePreset] = useState<ThemePreset>(
    initialState.themePreset,
  );
  const [customThemeBase, setCustomThemeBase] = useState<ThemeBasePreset>(
    initialState.customThemeBase,
  );
  const [userIcon, setUserIcon] = useState(initialState.userIcon);
  const [paletteForm, setPaletteForm] = useState<DashboardColorSet>(
    initialState.paletteForm,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const restoreSavedAppearance = () => {
    const savedState = getInitialAppearanceState(settings, defaults);

    setThemePreset(savedState.themePreset);
    setCustomThemeBase(savedState.customThemeBase);
    setUserIcon(savedState.userIcon);
    setPaletteForm(savedState.paletteForm);
    applyPreview({
      themePreset: savedState.themePreset,
      customThemeBase: savedState.customThemeBase,
      ...savedState.paletteForm,
    });
    setMessage(null);
    setError(null);
  };

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

    const nextBase =
      preset === 'DARK' || preset === 'GRAPHITE' ? 'DARK' : 'LIGHT';
    const nextPalette =
      preset === 'GRAPHITE' ? graphiteThemeColors : getBasePalette(nextBase);
    setThemeWithBase(preset, nextBase, nextPalette);
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
      <SectionCard title="Configuracion visual">
        <form
          className="space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setMessage(null);
            updateAppearanceMutation.mutate();
          }}
        >
          <div className="space-y-3">
            <SectionHeading
              title="Tema del panel"
              help="Elige una base rapida para tu interfaz. Si haces cambios manuales en la paleta, el tema pasa a personalizado."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {themePresetOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectThemePreset(option.id)}
                  className={`rounded-[var(--radius-card)] border px-5 py-4 text-left transition ${
                    themePreset === option.id
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] shadow-[0_12px_24px_rgba(0,0,0,0.06)]'
                      : 'border-[var(--color-line)] bg-[var(--color-panel)] hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-panel-strong)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{option.label}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className="h-2.5 w-8 rounded-full"
                          style={{
                            backgroundColor:
                              option.id === 'DARK'
                                ? darkThemeColors.dashboardBrandColor
                                : option.id === 'GRAPHITE'
                                  ? graphiteThemeColors.dashboardBrandColor
                                : option.id === 'LIGHT'
                                  ? lightThemeColors.dashboardBrandColor
                                  : paletteForm.dashboardBrandColor,
                          }}
                        />
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-line)]/40" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-line)]/20" />
                      </div>
                    </div>
                    <HelpHint message={option.description} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <SectionHeading
                title="Icono del usuario"
                help="Se muestra en tu encabezado, perfil y elementos asociados a tu sesion."
              />
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
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] shadow-[0_12px_24px_rgba(0,0,0,0.06)]'
                          : 'border-[var(--color-line)] bg-[var(--color-panel)] hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-panel-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-[var(--radius-control)] bg-[var(--color-panel-strong)] p-3 text-[var(--color-brand-deep)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="font-bold">{option.label}</p>
                        </div>
                        <HelpHint message={option.description} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel)] p-5 shadow-[0_16px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                    <UserIcon iconId={userIcon} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Vista previa del perfil</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      Icono y acentos activos
                    </p>
                  </div>
                </div>
                <HelpHint message="Vista rapida del estilo activo antes de guardar los cambios." />
              </div>

              <div className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-line)]/70 bg-[var(--color-panel-strong)] p-5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                    Base del tema personalizado
                  </p>
                  <HelpHint message="Define si la paleta manual parte de un esquema claro u oscuro." />
                </div>
                <div className="mt-4 flex gap-3">
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
                          : 'border border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-brand-deep)] hover:border-[var(--color-brand)]/40'
                      }`}
                    >
                      {base === 'LIGHT' ? 'Claro' : 'Oscuro'}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-control)] border border-[var(--color-line)]/60 bg-[var(--color-panel)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Superficie
                    </p>
                    <div
                      className="mt-3 h-8 rounded-[12px] border border-[var(--color-line)]/40"
                      style={{ backgroundColor: paletteForm.dashboardPanelColor }}
                    />
                  </div>
                  <div className="rounded-[var(--radius-control)] border border-[var(--color-line)]/60 bg-[var(--color-panel)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Marca
                    </p>
                    <div
                      className="mt-3 h-8 rounded-[12px]"
                      style={{ backgroundColor: paletteForm.dashboardBrandColor }}
                    />
                  </div>
                  <div className="rounded-[var(--radius-control)] border border-[var(--color-line)]/60 bg-[var(--color-panel)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Texto
                    </p>
                    <div
                      className="mt-3 flex h-8 items-center rounded-[12px] px-3 text-sm font-semibold"
                      style={{
                        backgroundColor: paletteForm.dashboardSurfaceColor,
                        color: paletteForm.dashboardInkColor,
                      }}
                    >
                      Aa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeading
              title="Paleta manual"
              help="Ajusta cada color del sistema. Cualquier cambio convierte el tema actual en personalizado."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {paletteFields.map((field) => (
                <label key={field.key} className="space-y-2 text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    {field.label}
                    <HelpHint message={field.help} />
                  </span>
                  <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 transition hover:border-[var(--color-brand)]/40">
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

          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-line)]/20 pt-3">
            <button
              type="submit"
              disabled={updateAppearanceMutation.isPending || loading}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {updateAppearanceMutation.isPending
                ? 'Guardando...'
                : 'Guardar configuracion'}
            </button>
            <button
              type="button"
              onClick={restoreSavedAppearance}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)] transition hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-brand-soft)]"
            >
              <RotateCcw className="h-4 w-4" />
              Volver a guardado
            </button>
            <button
              type="button"
              onClick={() => {
                setThemeWithBase('LIGHT', 'LIGHT', lightThemeColors);
                setUserIcon('user-round');
                setMessage(null);
                setError(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)] transition hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-panel-strong)]"
            >
              <RefreshCcw className="h-4 w-4" />
              Restaurar base clara
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
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

  const editorKey = settings
    ? `${settings.updatedAt}-${settings.themePreset}-${settings.userIcon}`
    : 'appearance-defaults';

  return (
    <AppearanceWorkspaceForm
      key={editorKey}
      settings={settings}
      loading={loading}
      refreshSettings={refreshSettings}
      applyPreview={applyPreview}
      resetPreview={resetPreview}
      defaults={defaults}
    />
  );
}
