'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ChevronRight, CircleHelp, PlusCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { SectionCard } from '@/components/ui/section-card';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-provider';
import {
  ENTITIES_QUERY_KEY,
  extractApiErrorMessage,
  formatCurrency,
  formatDateTime,
  summarizeEntities,
  type Entity,
} from '../lib/entities';

export function EntitiesWorkspace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [entityForm, setEntityForm] = useState({
    name: '',
    description: '',
  });

  const entitiesQuery = useQuery({
    queryKey: ENTITIES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<Entity[]>('/entities');
      return response.data;
    },
    enabled: Boolean(user),
  });

  const createEntityMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      await apiClient.post('/entities', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
      setEntityForm({ name: '', description: '' });
      setEntityError(null);
      setEntityModalOpen(false);
    },
    onError: (error) => {
      setEntityError(extractApiErrorMessage(error));
    },
  });

  const ownedEntities = useMemo(
    () => (entitiesQuery.data ?? []).filter((entity) => entity.isOwner),
    [entitiesQuery.data],
  );

  const sharedEntitiesCount = useMemo(
    () => (entitiesQuery.data ?? []).filter((entity) => !entity.isOwner).length,
    [entitiesQuery.data],
  );

  const summary = useMemo(
    () => summarizeEntities(ownedEntities),
    [ownedEntities],
  );

  const submitEntity = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEntityError(null);
    createEntityMutation.mutate({
      name: entityForm.name,
      description: entityForm.description || undefined,
    });
  };

  if (entitiesQuery.isLoading) {
    return (
      <SectionCard
        title="Resumen de entidades"
        subtitle="Cargando el inventario de proyectos y controles creados."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (entitiesQuery.isError) {
    return (
      <SectionCard
        title="Resumen de entidades"
        subtitle="No se pudo cargar la informacion de tus entidades."
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Resumen de entidades</h2>
          <div className="flex max-w-3xl items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm leading-6 text-[var(--color-muted)] sm:text-base">
            <div className="rounded-full bg-[var(--color-brand-soft)] p-2 text-[var(--color-brand-deep)]">
              <CircleHelp className="h-4 w-4" />
            </div>
            <p>
              Cada entidad agrupa un proyecto, inmueble o frente de gasto. Desde
              la tabla puedes entrar a su vista, revisar servicios,
              asignaciones, pagos y saldo disponible.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEntityError(null);
            setEntityModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          Nueva entidad
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Entidades activas</p>
          <p className="mt-3 text-3xl font-bold">{summary.entitiesCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Servicios registrados</p>
          <p className="mt-3 text-3xl font-bold">{summary.itemsCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Dinero asignado</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-brand-deep)]">
            {formatCurrency(summary.totalAssigned)}
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Saldo disponible</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-brand)]">
            {formatCurrency(summary.totalAvailable)}
          </p>
        </div>
      </div>

      {sharedEntitiesCount ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-5 py-4 text-sm text-[var(--color-muted)]">
          Tienes {sharedEntitiesCount} {sharedEntitiesCount === 1 ? 'entidad compartida' : 'entidades compartidas'}.
          {' '}
          <Link
            href="/compartidos"
            className="font-semibold text-[var(--color-brand-deep)] underline decoration-[var(--color-line)] underline-offset-4"
          >
            Ir a compartidos
          </Link>
        </div>
      ) : null}

      <SectionCard
        title="Tabla general"
        subtitle="Consulta servicios, fondos asignados, pagos y saldo de las entidades que administras."
      >
        {ownedEntities.length ? (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                  <tr className="text-sm">
                    <th className="px-5 py-4 font-semibold">Entidad</th>
                    <th className="px-5 py-4 font-semibold">Servicios</th>
                    <th className="px-5 py-4 font-semibold">Asignado</th>
                    <th className="px-5 py-4 font-semibold">Ultimo pago</th>
                    <th className="px-5 py-4 font-semibold">Gastado</th>
                    <th className="px-5 py-4 font-semibold">Saldo</th>
                    <th className="px-5 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--color-panel-strong)]">
                  {ownedEntities.map((entity) => {
                    const latestRecordAt =
                      entity.items
                        .flatMap((item) => item.records)
                        .sort(
                          (left, right) =>
                            new Date(right.occurredAt).getTime() -
                            new Date(left.occurredAt).getTime(),
                        )[0]?.occurredAt ?? null;

                    return (
                      <tr
                        key={entity.id}
                        className="border-t border-[var(--color-line)]/40 text-sm"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold">{entity.name}</p>
                            <p className="mt-1 text-[var(--color-muted)]">
                              {entity.description ?? 'Sin descripcion'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold">{entity.itemsCount}</td>
                        <td className="px-5 py-4 font-semibold text-[var(--color-brand-deep)]">
                          {formatCurrency(entity.assignedAmount)}
                        </td>
                        <td className="px-5 py-4 text-[var(--color-muted)]">
                          {formatDateTime(latestRecordAt)}
                        </td>
                        <td className="px-5 py-4 font-bold text-[var(--color-success)]">
                          {formatCurrency(entity.spentAmount)}
                        </td>
                        <td className="px-5 py-4 font-bold text-[var(--color-brand)]">
                          {formatCurrency(entity.availableBalance)}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/entidades/${entity.id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-semibold text-[var(--color-brand-deep)] transition hover:border-[var(--color-brand)]"
                          >
                            Ver detalle
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-dashed border-[var(--color-line)] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Crea tu primera entidad</h3>
                <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
                  Ejemplos: Construccion Torre B, Recibos Casa 1, Apartamento 302
                  o Mantenimiento Local Norte.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEntityError(null);
                setEntityModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
            >
              <PlusCircle className="h-4 w-4" />
              Crear entidad
            </button>
          </div>
        )}
      </SectionCard>

      <Modal
        open={entityModalOpen}
        title="Nueva entidad"
        onClose={() => setEntityModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitEntity}>
          <p className="text-sm text-[var(--color-muted)]">
            Crea una entidad para llevar el control de una obra, una casa, un
            apartamento o cualquier agrupacion de gastos.
          </p>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Nombre de la entidad</span>
            <input
              value={entityForm.name}
              onChange={(event) =>
                setEntityForm((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              placeholder="Recibos casa principal"
              required
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Descripcion</span>
            <textarea
              value={entityForm.description}
              onChange={(event) =>
                setEntityForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="min-h-28 w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              placeholder="Ejemplo: pagos y compras de la obra principal"
            />
          </label>

          {entityError ? (
            <p className="text-sm text-[var(--color-danger)]">{entityError}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createEntityMutation.isPending}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createEntityMutation.isPending ? 'Guardando...' : 'Guardar entidad'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
