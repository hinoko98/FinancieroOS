'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { KeyRound, LogIn } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';

type ProfileResponse = {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalId: string;
  birthDate: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
};

type LoginHistoryEntry = {
  id: string;
  usernameSnapshot: string;
  ipAddress: string | null;
  userAgent: string | null;
  loggedInAt: string;
};

const APP_TIME_ZONE = 'America/Bogota';

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

function formatDate(value: string | null) {
  if (!value) {
    return 'No disponible';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

export function ProfileWorkspace() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const response = await apiClient.get<ProfileResponse>('/auth/me');
      return response.data;
    },
    enabled: Boolean(user),
  });

  const loginHistoryQuery = useQuery({
    queryKey: ['login-history'],
    queryFn: async () => {
      const response = await apiClient.get<LoginHistoryEntry[]>(
        '/settings/login-history',
      );
      return response.data;
    },
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (profileQuery.data) {
      setProfileForm({
        firstName: profileQuery.data.firstName,
        lastName: profileQuery.data.lastName,
        birthDate: profileQuery.data.birthDate.slice(0, 10),
      });
    }
  }, [profileQuery.data]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch<ProfileResponse>(
        '/auth/profile',
        profileForm,
      );
      return response.data;
    },
    onSuccess: (nextProfile) => {
      updateUser({
        id: nextProfile.id,
        sub: nextProfile.id,
        username: nextProfile.username,
        role: nextProfile.role,
        fullName: nextProfile.fullName,
        firstName: nextProfile.firstName,
        lastName: nextProfile.lastName,
      });
      profileQuery.refetch();
      setProfileMessage('Perfil actualizado correctamente.');
      setProfileError(null);
    },
    onError: (error) => {
      setProfileError(extractErrorMessage(error));
      setProfileMessage(null);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/auth/change-password', passwordForm);
    },
    onSuccess: () => {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
      });
      setPasswordMessage('Contrasena actualizada correctamente.');
      setPasswordError(null);
    },
    onError: (error) => {
      setPasswordError(extractErrorMessage(error));
      setPasswordMessage(null);
    },
  });

  return (
    <div className="space-y-6">
      <SectionCard
        title="Informacion personal"
        subtitle="Edita tus datos basicos del usuario que inicio sesion."
      >
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            setProfileError(null);
            setProfileMessage(null);
            updateProfileMutation.mutate();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Nombre</span>
              <input
                value={profileForm.firstName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Apellido</span>
              <input
                value={profileForm.lastName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Fecha de nacimiento</span>
              <input
                type="date"
                value={profileForm.birthDate}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    birthDate: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Usuario</span>
              <input
                value={profileQuery.data?.username ?? user?.username ?? ''}
                readOnly
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-[var(--color-muted)] outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Rol</span>
              <input
                value={profileQuery.data?.role ?? user?.role ?? ''}
                readOnly
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-[var(--color-muted)] outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Cedula</span>
              <input
                value={profileQuery.data?.nationalId ?? ''}
                readOnly
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-[var(--color-muted)] outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Fecha de registro</span>
              <input
                value={formatDate(profileQuery.data?.createdAt ?? null)}
                readOnly
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-[var(--color-muted)] outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Ultimo ingreso</span>
              <input
                value={formatDate(profileQuery.data?.lastLoginAt ?? null)}
                readOnly
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-[var(--color-muted)] outline-none"
              />
            </label>
          </div>

          {profileError ? (
            <p className="text-sm text-[var(--color-danger)]">{profileError}</p>
          ) : null}
          {profileMessage ? (
            <p className="text-sm text-[var(--color-success)]">{profileMessage}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Seguridad"
        subtitle="Cambia la contrasena de acceso de tu cuenta."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPasswordError(null);
            setPasswordMessage(null);
            changePasswordMutation.mutate();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Contrasena actual</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Nueva contrasena</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                minLength={8}
                required
              />
            </label>
          </div>

          {passwordError ? (
            <p className="text-sm text-[var(--color-danger)]">{passwordError}</p>
          ) : null}
          {passwordMessage ? (
            <p className="text-sm text-[var(--color-success)]">{passwordMessage}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              {changePasswordMutation.isPending
                ? 'Actualizando...'
                : 'Actualizar contrasena'}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Actividad reciente"
        subtitle="Historial de los ultimos inicios de sesion de tu usuario."
      >
        <div className="space-y-3">
          {loginHistoryQuery.data?.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold">
                    <LogIn className="h-4 w-4 text-[var(--color-brand)]" />
                    @{entry.usernameSnapshot}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {entry.userAgent ?? 'Navegador no identificado'}
                  </p>
                </div>
                <div className="text-sm text-[var(--color-muted)]">
                  {formatDateTime(entry.loggedInAt)}
                </div>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                IP: {entry.ipAddress ?? 'No disponible'}
              </p>
            </div>
          ))}

          {profileQuery.isLoading || loginHistoryQuery.isLoading ? (
            <p className="text-sm text-[var(--color-muted)]">Cargando actividad...</p>
          ) : null}

          {!loginHistoryQuery.isLoading && !loginHistoryQuery.data?.length ? (
            <p className="text-sm text-[var(--color-muted)]">
              Aun no hay inicios de sesion registrados.
            </p>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
