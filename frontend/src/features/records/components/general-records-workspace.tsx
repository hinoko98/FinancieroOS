'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { SectionCard } from '@/components/ui/section-card';
import {
  ENTITIES_QUERY_KEY,
  extractApiErrorMessage,
  formatCurrency,
  formatDateTime,
  getRecentEntityRecords,
  type Entity,
} from '@/features/entities/lib/entities';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-provider';

export function GeneralRecordsWorkspace() {
  const { user } = useAuth();

  const entitiesQuery = useQuery({
    queryKey: ENTITIES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<Entity[]>('/entities');
      return response.data;
    },
    enabled: Boolean(user),
  });

  const records = useMemo(
    () => getRecentEntityRecords(entitiesQuery.data ?? [], Number.MAX_SAFE_INTEGER),
    [entitiesQuery.data],
  );

  const totalSpent = records.reduce((total, record) => total + record.amount, 0);
  const highestExpense =
    records.reduce(
      (current, record) => (record.amount > current.amount ? record : current),
      records[0] ?? null,
    ) ?? null;

  if (entitiesQuery.isLoading) {
    return (
      <SectionCard
        title="Registro general"
        subtitle="Cargando la tabla consolidada de pagos."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (entitiesQuery.isError) {
    return (
      <SectionCard
        title="Registro general"
        subtitle="No fue posible cargar los pagos consolidados."
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
        <h2 className="text-3xl font-bold tracking-tight">Registro general</h2>
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          Tabla unificada con todos los pagos registrados en las entidades a las
          que tienes acceso.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Total gastado</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-success)]">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Cantidad de pagos</p>
          <p className="mt-3 text-3xl font-bold">{records.length}</p>
        </div>
        <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Mayor gasto</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-danger)]">
            {highestExpense ? formatCurrency(highestExpense.amount) : formatCurrency(0)}
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {highestExpense
              ? `${highestExpense.itemName} / ${highestExpense.entityName}`
              : 'Sin registros aun'}
          </p>
        </div>
      </div>

      <SectionCard
        title="Tabla de pagos"
        subtitle="Consulta cada pago con su entidad, servicio, fecha, responsable y valor."
      >
        {records.length ? (
          <div className="overflow-hidden rounded-[24px] border border-[var(--color-line)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                  <tr className="text-sm">
                    <th className="px-5 py-4 font-semibold">Entidad</th>
                    <th className="px-5 py-4 font-semibold">Servicio</th>
                    <th className="px-5 py-4 font-semibold">Fecha</th>
                    <th className="px-5 py-4 font-semibold">Responsable</th>
                    <th className="px-5 py-4 font-semibold">Valor</th>
                    <th className="px-5 py-4 font-semibold">Detalle</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--color-panel-strong)]">
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="border-t border-[var(--color-line)]/40 text-sm"
                    >
                      <td className="px-5 py-4 font-semibold">{record.entityName}</td>
                      <td className="px-5 py-4">{record.itemName}</td>
                      <td className="px-5 py-4 text-[var(--color-muted)]">
                        {formatDateTime(record.occurredAt)}
                      </td>
                      <td className="px-5 py-4">{record.performedBy.fullName}</td>
                      <td className="px-5 py-4 font-bold text-[var(--color-success)]">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/entidades/${record.entityId}`}
                          className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-semibold text-[var(--color-brand-deep)] transition hover:border-[var(--color-brand)]"
                        >
                          Ver entidad
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">
            Todavia no hay pagos cargados en las entidades.
          </div>
        )}
      </SectionCard>
    </div>
  );
}
