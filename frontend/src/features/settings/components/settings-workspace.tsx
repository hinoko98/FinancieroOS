'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Globe2, Mail, Settings2 } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';

type PlatformSettings = {
  id: string;
  platformName: string;
  platformLabel: string;
  platformMotto: string;
  timezone: string;
  currencyCode: string;
  supportEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

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

export function SettingsWorkspace() {
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    platformName: '',
    platformLabel: '',
    platformMotto: '',
    timezone: '',
    currencyCode: '',
    supportEmail: '',
  });

  const platformSettingsQuery = useQuery({
    queryKey: ['platform-settings-page'],
    queryFn: async () => {
      const response = await apiClient.get<PlatformSettings>('/settings/platform');
      return response.data;
    },
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!platformSettingsQuery.data) {
      return;
    }

    setForm({
      platformName: platformSettingsQuery.data.platformName,
      platformLabel: platformSettingsQuery.data.platformLabel,
      platformMotto: platformSettingsQuery.data.platformMotto,
      timezone: platformSettingsQuery.data.timezone,
      currencyCode: platformSettingsQuery.data.currencyCode,
      supportEmail: platformSettingsQuery.data.supportEmail ?? '',
    });
  }, [platformSettingsQuery.data]);

  const updatePlatformMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch<PlatformSettings>('/settings/platform', {
        ...form,
        supportEmail: form.supportEmail || '',
      });
      return response.data;
    },
    onSuccess: async () => {
      await platformSettingsQuery.refetch();
      setMessage('Configuracion de plataforma actualizada.');
      setError(null);
    },
    onError: (nextError) => {
      setError(extractErrorMessage(nextError));
      setMessage(null);
    },
  });

  const isAdmin = user?.role === 'ADMIN';

  if (platformSettingsQuery.isLoading) {
    return (
      <SectionCard
        title="Ajustes de plataforma"
        subtitle="Cargando la configuracion global del sistema."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (platformSettingsQuery.isError) {
    return (
      <SectionCard
        title="Ajustes de plataforma"
        subtitle="No fue posible cargar la configuracion global."
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-danger)]">
            {extractErrorMessage(platformSettingsQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => platformSettingsQuery.refetch()}
            className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Identidad de la plataforma"
        subtitle="Estos ajustes son globales y se reflejan para todos los usuarios."
      >
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setMessage(null);
            updatePlatformMutation.mutate();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Nombre principal</span>
              <input
                value={form.platformName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    platformName: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                disabled={!isAdmin}
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Etiqueta corta</span>
              <input
                value={form.platformLabel}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    platformLabel: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                disabled={!isAdmin}
                required
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Mensaje principal</span>
            <textarea
              value={form.platformMotto}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  platformMotto: event.target.value,
                }))
              }
              className="min-h-28 w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              disabled={!isAdmin}
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Zona horaria</span>
              <input
                value={form.timezone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    timezone: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                disabled={!isAdmin}
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Moneda base</span>
              <input
                value={form.currencyCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currencyCode: event.target.value.toUpperCase(),
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                disabled={!isAdmin}
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Correo de soporte</span>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    supportEmail: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                disabled={!isAdmin}
                placeholder="soporte@empresa.com"
              />
            </label>
          </div>

          {!isAdmin ? (
            <p className="text-sm text-[var(--color-muted)]">
              Tu usuario puede consultar esta configuracion, pero solo un
              administrador puede modificarla.
            </p>
          ) : null}

          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          {message ? (
            <p className="text-sm text-[var(--color-success)]">{message}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isAdmin || updatePlatformMutation.isPending}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatePlatformMutation.isPending
                ? 'Guardando...'
                : 'Guardar ajustes'}
            </button>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Uso"
          subtitle="Resumen rapido de la configuracion global activa."
        >
          <div className="space-y-4">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <Settings2 className="h-4 w-4 text-[var(--color-brand)]" />
                Etiqueta visible
              </p>
              <p className="mt-2 text-lg font-bold">
                {platformSettingsQuery.data?.platformLabel}
              </p>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <Globe2 className="h-4 w-4 text-[var(--color-brand)]" />
                Zona horaria
              </p>
              <p className="mt-2 text-lg font-bold">
                {platformSettingsQuery.data?.timezone}
              </p>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4 text-[var(--color-brand)]" />
                Soporte
              </p>
              <p className="mt-2 text-lg font-bold">
                {platformSettingsQuery.data?.supportEmail ?? 'Sin correo'}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Alcance"
          subtitle="Que entra realmente en este panel."
        >
          <div className="space-y-3 text-sm text-[var(--color-muted)]">
            <p>
              Aqui van solo ajustes globales de la plataforma: nombre, lema,
              zona horaria y datos de soporte.
            </p>
            <p>
              La apariencia visual se maneja en <strong>Configuracion</strong>,
              mientras que el perfil y la contrasena quedaron en <strong>Mi perfil</strong>.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Operacion"
          subtitle="Parametros base para todo el equipo."
        >
          <div className="space-y-3">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="text-sm text-[var(--color-muted)]">Moneda</p>
              <p className="mt-2 text-lg font-bold">
                {platformSettingsQuery.data?.currencyCode}
              </p>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="text-sm text-[var(--color-muted)]">Nombre visible</p>
              <p className="mt-2 text-lg font-bold">
                {platformSettingsQuery.data?.platformName}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
