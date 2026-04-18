'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, ShieldUser, Users } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';
import {
  extractApiErrorMessage,
  formatDateTime,
} from '@/features/entities/lib/entities';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import {
  ADMIN_USERS_QUERY_KEY,
  getManagedUserRoleLabel,
  getManagedUserStatusLabel,
  type ManagedUser,
  type ManagedUserRole,
  type ManagedUserStatus,
} from '../lib/admin';

const roleOptions: ManagedUserRole[] = [
  'ADMIN',
  'MANAGER',
  'ANALYST',
  'OPERATOR',
];

const statusOptions: ManagedUserStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
];

type EditUserFormState = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  role: ManagedUserRole;
  status: ManagedUserStatus;
  newPassword: string;
};

function getStatusTone(status: ManagedUserStatus) {
  if (status === 'ACTIVE') {
    return 'success' as const;
  }

  if (status === 'INACTIVE') {
    return 'warning' as const;
  }

  return 'danger' as const;
}

export function AdminUsersWorkspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditUserFormState | null>(null);

  const usersQuery = useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ManagedUser[]>('/admin/users');
      return response.data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const updateUserMutation = useMutation({
    mutationFn: async (payload: EditUserFormState) => {
      await apiClient.patch(`/admin/users/${payload.id}`, {
        username: payload.username,
        firstName: payload.firstName,
        lastName: payload.lastName,
        nationalId: payload.nationalId,
        birthDate: payload.birthDate,
        role: payload.role,
        status: payload.status,
        newPassword: payload.newPassword || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      setEditError(null);
      setEditForm(null);
      setEditModalOpen(false);
    },
    onError: (error) => {
      setEditError(extractApiErrorMessage(error));
    },
  });

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((managedUser) =>
      [
        managedUser.username,
        managedUser.fullName,
        managedUser.nationalId,
        managedUser.role,
        managedUser.status,
      ].some((value) => value.toLowerCase().includes(normalizedSearch)),
    );
  }, [search, usersQuery.data]);

  const totals = useMemo(() => {
    const users = usersQuery.data ?? [];

    return {
      total: users.length,
      admins: users.filter((managedUser) => managedUser.role === 'ADMIN').length,
      active: users.filter((managedUser) => managedUser.status === 'ACTIVE').length,
      inactive: users.filter((managedUser) => managedUser.status !== 'ACTIVE').length,
    };
  }, [usersQuery.data]);

  const openViewModal = (managedUser: ManagedUser) => {
    setSelectedUser(managedUser);
    setViewModalOpen(true);
  };

  const openEditModal = (managedUser: ManagedUser) => {
    setSelectedUser(managedUser);
    setEditError(null);
    setEditForm({
      id: managedUser.id,
      username: managedUser.username,
      firstName: managedUser.firstName,
      lastName: managedUser.lastName,
      nationalId: managedUser.nationalId,
      birthDate: managedUser.birthDate.slice(0, 10),
      role: managedUser.role,
      status: managedUser.status,
      newPassword: '',
    });
    setEditModalOpen(true);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <SectionCard
        title="Administracion"
        subtitle="Este panel esta disponible solo para administradores."
      >
        <p className="text-sm text-[var(--color-muted)]">
          Tu usuario no tiene permisos para gestionar usuarios del sistema.
        </p>
      </SectionCard>
    );
  }

  if (usersQuery.isLoading) {
    return (
      <SectionCard
        title="Administracion"
        subtitle="Cargando usuarios registrados."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (usersQuery.isError) {
    return (
      <SectionCard
        title="Administracion"
        subtitle="No fue posible cargar el control de usuarios."
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-danger)]">
            {extractApiErrorMessage(usersQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => usersQuery.refetch()}
            className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Administracion"
          description="Panel exclusivo para administradores con control de usuarios registrados, roles, estados y restablecimiento de acceso."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
            <p className="text-sm text-[var(--color-muted)]">Usuarios registrados</p>
            <p className="mt-3 text-3xl font-bold">{totals.total}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
            <p className="text-sm text-[var(--color-muted)]">Administradores</p>
            <p className="mt-3 text-3xl font-bold text-[var(--color-brand-deep)]">
              {totals.admins}
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
            <p className="text-sm text-[var(--color-muted)]">Activos</p>
            <p className="mt-3 text-3xl font-bold text-[var(--color-success)]">
              {totals.active}
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
            <p className="text-sm text-[var(--color-muted)]">No activos</p>
            <p className="mt-3 text-3xl font-bold text-[var(--color-warning)]">
              {totals.inactive}
            </p>
          </div>
        </div>

        <SectionCard
          title="Usuarios del sistema"
          subtitle="Puedes revisar datos clave, editar perfil administrativo y definir una nueva contrasena cuando sea necesario."
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="block w-full max-w-xl space-y-2 text-sm">
                <span className="font-semibold">Buscar usuario</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                  placeholder="Usuario, nombre, cedula, rol o estado"
                />
              </label>

              <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-muted)]">
                <span className="font-semibold text-[var(--color-brand-deep)]">
                  Seguridad:
                </span>{' '}
                la contrasena actual no se muestra; desde editar puedes asignar una nueva.
              </div>
            </div>

            {filteredUsers.length ? (
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)]">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                      <tr className="text-sm">
                        <th className="px-5 py-4 font-semibold">Usuario</th>
                        <th className="px-5 py-4 font-semibold">Nombre</th>
                        <th className="px-5 py-4 font-semibold">Rol</th>
                        <th className="px-5 py-4 font-semibold">Estado</th>
                        <th className="px-5 py-4 font-semibold">Ultimo ingreso</th>
                        <th className="px-5 py-4 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--color-panel-strong)]">
                      {filteredUsers.map((managedUser) => (
                        <tr
                          key={managedUser.id}
                          className="border-t border-[var(--color-line)]/40 text-sm"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold">@{managedUser.username}</p>
                              <p className="text-xs text-[var(--color-muted)]">
                                Creado {formatDateTime(managedUser.createdAt)}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold">{managedUser.fullName}</p>
                              <p className="text-xs text-[var(--color-muted)]">
                                CC {managedUser.nationalId}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill
                              label={getManagedUserRoleLabel(managedUser.role)}
                            />
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill
                              label={getManagedUserStatusLabel(managedUser.status)}
                              tone={getStatusTone(managedUser.status)}
                            />
                          </td>
                          <td className="px-5 py-4 text-[var(--color-muted)]">
                            {managedUser.lastLoginAt
                              ? formatDateTime(managedUser.lastLoginAt)
                              : 'Sin ingreso'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openViewModal(managedUser)}
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-semibold text-[var(--color-brand-deep)]"
                              >
                                <Eye className="h-4 w-4" />
                                Ver
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(managedUser)}
                                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-4 py-2 font-semibold text-white"
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">
                No hay usuarios que coincidan con la busqueda.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <Modal
        open={viewModalOpen}
        title="Detalle del usuario"
        onClose={() => {
          setViewModalOpen(false);
          setSelectedUser(null);
        }}
      >
        {selectedUser ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-muted)]">Nombre completo</p>
                <p className="mt-2 text-lg font-bold">{selectedUser.fullName}</p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-muted)]">Usuario</p>
                <p className="mt-2 text-lg font-bold">@{selectedUser.username}</p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-muted)]">Cedula</p>
                <p className="mt-2 text-lg font-bold">{selectedUser.nationalId}</p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-muted)]">Fecha de nacimiento</p>
                <p className="mt-2 text-lg font-bold">
                  {formatDateTime(selectedUser.birthDate)}
                </p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-muted)]">Fecha de creacion</p>
                <p className="mt-2 text-lg font-bold">
                  {formatDateTime(selectedUser.createdAt)}
                </p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-muted)]">Ultimo ingreso</p>
                <p className="mt-2 text-lg font-bold">
                  {selectedUser.lastLoginAt
                    ? formatDateTime(selectedUser.lastLoginAt)
                    : 'Sin ingreso registrado'}
                </p>
              </div>
            </div>

            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <ShieldUser className="h-4 w-4 text-[var(--color-brand)]" />
                Seguridad de acceso
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                Contrasena actual: <strong>protegida</strong>. El sistema no expone
                contrasenas almacenadas. Si necesitas cambiarla, usa la accion
                <strong> Editar</strong> para asignar una nueva.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={editModalOpen}
        title="Editar usuario"
        onClose={() => {
          setEditModalOpen(false);
          setEditForm(null);
          setEditError(null);
        }}
        className="max-w-4xl"
      >
        {editForm ? (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setEditError(null);
              updateUserMutation.mutate(editForm);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-semibold">Usuario</span>
                <input
                  value={editForm.username}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, username: event.target.value }
                        : current,
                    )
                  }
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                  required
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-semibold">Cedula</span>
                <input
                  value={editForm.nationalId}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            nationalId: event.target.value.replace(/\D/g, ''),
                          }
                        : current,
                    )
                  }
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-semibold">Nombre</span>
                <input
                  value={editForm.firstName}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, firstName: event.target.value }
                        : current,
                    )
                  }
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                  required
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-semibold">Apellido</span>
                <input
                  value={editForm.lastName}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, lastName: event.target.value }
                        : current,
                    )
                  }
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm">
                <span className="font-semibold">Fecha de nacimiento</span>
                <input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, birthDate: event.target.value }
                        : current,
                    )
                  }
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                  required
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-semibold">Rol</span>
                <select
                  value={editForm.role}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            role: event.target.value as ManagedUserRole,
                          }
                        : current,
                    )
                  }
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {getManagedUserRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-semibold">Estado</span>
                <select
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            status: event.target.value as ManagedUserStatus,
                          }
                        : current,
                    )
                  }
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {getManagedUserStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Nueva contrasena opcional</span>
              <input
                type="password"
                value={editForm.newPassword}
                onChange={(event) =>
                  setEditForm((current) =>
                    current
                      ? { ...current, newPassword: event.target.value }
                      : current,
                  )
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                minLength={8}
                placeholder="Deja vacio si no deseas cambiarla"
              />
            </label>

            {editError ? (
              <p className="text-sm text-[var(--color-danger)]">{editError}</p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Users className="h-4 w-4" />
                {updateUserMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
