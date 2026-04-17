'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CopyPlus,
  FolderSymlink,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import {
  ENTITIES_QUERY_KEY,
  extractApiErrorMessage,
  formatCurrency,
  formatDateTime,
  getEntityAccessLabel,
  type Entity,
  type EntitySharePermission,
} from '../lib/entities';

function getPermissionTone(permission: 'OWNER' | EntitySharePermission) {
  switch (permission) {
    case 'OWNER':
      return 'success' as const;
    case 'MANAGE':
      return 'warning' as const;
    case 'EDIT':
      return 'neutral' as const;
    case 'VIEW':
      return 'neutral' as const;
  }
}

export function SharedEntitiesWorkspace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [activeShareRowId, setActiveShareRowId] = useState<string | null>(null);
  const [shareForm, setShareForm] = useState({
    username: '',
    permission: 'VIEW' as EntitySharePermission,
  });

  const entitiesQuery = useQuery({
    queryKey: ENTITIES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<Entity[]>('/entities');
      return response.data;
    },
    enabled: Boolean(user),
  });

  const manageableEntities = useMemo(
    () => (entitiesQuery.data ?? []).filter((entity) => entity.canManageShares),
    [entitiesQuery.data],
  );

  const sharedEntities = useMemo(
    () => (entitiesQuery.data ?? []).filter((entity) => !entity.isOwner),
    [entitiesQuery.data],
  );

  const selectedEntity = useMemo(
    () =>
      manageableEntities.find((entity) => entity.id === selectedEntityId) ?? null,
    [manageableEntities, selectedEntityId],
  );

  const createShareMutation = useMutation({
    mutationFn: async (payload: {
      entityId: string;
      username: string;
      permission: EntitySharePermission;
    }) => {
      await apiClient.post(`/entities/${payload.entityId}/shares`, {
        username: payload.username,
        permission: payload.permission,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
      setShareForm({
        username: '',
        permission: 'VIEW',
      });
      setShareError(null);
    },
    onError: (error) => {
      setShareError(extractApiErrorMessage(error));
    },
  });

  const updateShareMutation = useMutation({
    mutationFn: async (payload: {
      entityId: string;
      shareId: string;
      permission: EntitySharePermission;
    }) => {
      await apiClient.patch(`/entities/${payload.entityId}/shares/${payload.shareId}`, {
        permission: payload.permission,
      });
    },
    onMutate: (payload) => {
      setActiveShareRowId(payload.shareId);
      setShareError(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
    },
    onError: (error) => {
      setShareError(extractApiErrorMessage(error));
    },
    onSettled: () => {
      setActiveShareRowId(null);
    },
  });

  const deleteShareMutation = useMutation({
    mutationFn: async (payload: { entityId: string; shareId: string }) => {
      await apiClient.delete(`/entities/${payload.entityId}/shares/${payload.shareId}`);
    },
    onMutate: (payload) => {
      setActiveShareRowId(payload.shareId);
      setShareError(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
    },
    onError: (error) => {
      setShareError(extractApiErrorMessage(error));
    },
    onSettled: () => {
      setActiveShareRowId(null);
    },
  });

  const grantedAccessesCount = useMemo(
    () =>
      manageableEntities.reduce(
        (accumulator, entity) => accumulator + entity.shares.length,
        0,
      ),
    [manageableEntities],
  );

  const openShareModal = (entityId: string) => {
    setSelectedEntityId(entityId);
    setShareError(null);
    setShareForm({
      username: '',
      permission: 'VIEW',
    });
    setShareModalOpen(true);
  };

  const submitShare = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedEntity) {
      return;
    }

    setShareError(null);
    createShareMutation.mutate({
      entityId: selectedEntity.id,
      username: shareForm.username,
      permission: shareForm.permission,
    });
  };

  if (entitiesQuery.isLoading) {
    return (
      <SectionCard
        title="Compartidos"
        subtitle="Cargando entidades compartidas y permisos."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (entitiesQuery.isError) {
    return (
      <SectionCard
        title="Compartidos"
        subtitle="No fue posible cargar las entidades compartidas."
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-danger)]">
            {extractApiErrorMessage(entitiesQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => entitiesQuery.refetch()}
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
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Compartidos</h2>
        <p className="max-w-4xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          Comparte entidades con otros usuarios por nombre unico, define si pueden
          solo ver, editar o gestionar permisos, y consulta lo que ya te
          compartieron desde un solo lugar.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Compartidas conmigo</p>
          <p className="mt-3 text-3xl font-bold">{sharedEntities.length}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Entidades gestionables</p>
          <p className="mt-3 text-3xl font-bold">{manageableEntities.length}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Accesos otorgados</p>
          <p className="mt-3 text-3xl font-bold">{grantedAccessesCount}</p>
        </div>
      </div>

      <SectionCard
        title="Compartido conmigo"
        subtitle="Entidades donde otro usuario te dio acceso para consultar, editar o gestionar."
      >
        {sharedEntities.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {sharedEntities.map((entity) => (
              <article
                key={entity.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold">{entity.name}</h3>
                      <StatusPill
                        label={getEntityAccessLabel(entity.accessLevel)}
                        tone={getPermissionTone(entity.accessLevel)}
                      />
                    </div>
                    <p className="text-sm text-[var(--color-muted)]">
                      {entity.description ?? 'Sin descripcion registrada.'}
                    </p>
                    <p className="text-sm text-[var(--color-muted)]">
                      Compartido por{' '}
                      <span className="font-semibold text-[var(--color-brand-deep)]">
                        {entity.sharedBy?.fullName ?? 'Usuario no disponible'}
                      </span>
                      {' '}@{entity.sharedBy?.username ?? 'sin-usuario'}
                    </p>
                  </div>

                  <Link
                    href={`/entidades/${entity.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand-deep)]"
                  >
                    Ver detalle
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3">
                    <p className="text-sm text-[var(--color-muted)]">Servicios</p>
                    <p className="mt-2 text-xl font-bold">{entity.itemsCount}</p>
                  </div>
                  <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3">
                    <p className="text-sm text-[var(--color-muted)]">Gastado</p>
                    <p className="mt-2 text-lg font-bold text-[var(--color-success)]">
                      {formatCurrency(entity.spentAmount)}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3">
                    <p className="text-sm text-[var(--color-muted)]">Disponible</p>
                    <p className="mt-2 text-lg font-bold text-[var(--color-brand)]">
                      {formatCurrency(entity.availableBalance)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">
            Todavia no te han compartido entidades.
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Gestionar permisos"
        subtitle="Comparte entidades usando el nombre unico del usuario. Puedes escribirlo como @usuario o sin @."
      >
        {manageableEntities.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {manageableEntities.map((entity) => (
              <article
                key={entity.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold">{entity.name}</h3>
                      <StatusPill
                        label={getEntityAccessLabel(entity.accessLevel)}
                        tone={getPermissionTone(entity.accessLevel)}
                      />
                    </div>
                    <p className="text-sm text-[var(--color-muted)]">
                      {entity.description ?? 'Sin descripcion registrada.'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
                      <span>{entity.shares.length} acceso(s) activos</span>
                      <span>{entity.itemsCount} servicio(s)</span>
                      <span>{formatDateTime(entity.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/entidades/${entity.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand-deep)]"
                    >
                      <FolderSymlink className="h-4 w-4" />
                      Ver entidad
                    </Link>
                    <button
                      type="button"
                      onClick={() => openShareModal(entity.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      <CopyPlus className="h-4 w-4" />
                      Compartir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">
            Aun no tienes entidades con permisos para administrar compartidos.
          </div>
        )}
      </SectionCard>

      <Modal
        open={shareModalOpen}
        title={
          selectedEntity
            ? `Compartidos de ${selectedEntity.name}`
            : 'Administrar compartidos'
        }
        onClose={() => {
          setShareModalOpen(false);
          setSelectedEntityId(null);
          setShareError(null);
        }}
        className="max-w-5xl"
      >
        {selectedEntity ? (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <form
                className="space-y-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5"
                onSubmit={submitShare}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                    <UserRoundPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Nuevo acceso</h3>
                    <p className="text-sm text-[var(--color-muted)]">
                      Usa el username unico del usuario.
                    </p>
                  </div>
                </div>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold">Usuario</span>
                  <input
                    value={shareForm.username}
                    onChange={(event) =>
                      setShareForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                    placeholder="@admin"
                    required
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold">Permiso</span>
                  <select
                    value={shareForm.permission}
                    onChange={(event) =>
                      setShareForm((current) => ({
                        ...current,
                        permission: event.target.value as EntitySharePermission,
                      }))
                    }
                    className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                  >
                    <option value="VIEW">Solo lectura</option>
                    <option value="EDIT">Puede editar</option>
                    <option value="MANAGE">Puede gestionar permisos</option>
                  </select>
                </label>

                {shareError ? (
                  <p className="text-sm text-[var(--color-danger)]">{shareError}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={createShareMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {createShareMutation.isPending ? 'Guardando...' : 'Guardar acceso'}
                </button>
              </form>

              <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                    <UsersRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Accesos activos</h3>
                    <p className="text-sm text-[var(--color-muted)]">
                      Cambia permisos o revoca acceso desde esta tabla.
                    </p>
                  </div>
                </div>

                {selectedEntity.shares.length ? (
                  <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)]">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-left">
                        <thead className="bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                          <tr className="text-sm">
                            <th className="px-4 py-3 font-semibold">Usuario</th>
                            <th className="px-4 py-3 font-semibold">Permiso</th>
                            <th className="px-4 py-3 font-semibold">Otorgado por</th>
                            <th className="px-4 py-3 font-semibold">Accion</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {selectedEntity.shares.map((share) => {
                            const rowBusy =
                              activeShareRowId === share.id &&
                              (updateShareMutation.isPending ||
                                deleteShareMutation.isPending);

                            return (
                              <tr
                                key={share.id}
                                className="border-t border-[var(--color-line)]/40 text-sm"
                              >
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-semibold">{share.user.fullName}</p>
                                    <p className="text-[var(--color-muted)]">
                                      @{share.user.username}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={share.permission}
                                    onChange={(event) =>
                                      updateShareMutation.mutate({
                                        entityId: selectedEntity.id,
                                        shareId: share.id,
                                        permission: event.target
                                          .value as EntitySharePermission,
                                      })
                                    }
                                    disabled={rowBusy}
                                    className="rounded-full border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <option value="VIEW">Solo lectura</option>
                                    <option value="EDIT">Puede editar</option>
                                    <option value="MANAGE">Gestiona permisos</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-[var(--color-muted)]">
                                  <div>
                                    <p>{share.grantedBy.fullName}</p>
                                    <p>@{share.grantedBy.username}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteShareMutation.mutate({
                                        entityId: selectedEntity.id,
                                        shareId: share.id,
                                      })
                                    }
                                    disabled={rowBusy}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#e8c2b9] bg-[#fff3f0] px-4 py-2 font-semibold text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Revocar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-muted)]">
                    Esta entidad aun no tiene accesos compartidos.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-muted)]">
            La entidad seleccionada ya no esta disponible para administrar.
          </div>
        )}
      </Modal>
    </div>
  );
}
