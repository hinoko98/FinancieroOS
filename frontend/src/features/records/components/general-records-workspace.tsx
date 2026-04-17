'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';
import {
  ENTITIES_QUERY_KEY,
  extractApiErrorMessage,
  formatCurrency,
  formatDateTime,
  type Entity,
} from '@/features/entities/lib/entities';
import {
  FINANCE_ACCOUNTS_QUERY_KEY,
  type FinancialAccount,
} from '@/features/finance/lib/finance';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';

type GeneralMovement = {
  id: string;
  kind: 'income' | 'allocation' | 'payment';
  title: string;
  origin: string;
  destination: string;
  occurredAt: string;
  performedByName: string;
  amount: number;
  href: string;
};

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

  const financeAccountsQuery = useQuery({
    queryKey: FINANCE_ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<FinancialAccount[]>('/finance/accounts');
      return response.data;
    },
    enabled: Boolean(user),
  });

  const movements = useMemo(() => {
    const incomeMovements: GeneralMovement[] = (financeAccountsQuery.data ?? []).flatMap(
      (account) =>
        account.movements
          .filter((movement) => movement.movementType === 'INCOME')
          .map((movement) => ({
            id: `income-${movement.id}`,
            kind: 'income' as const,
            title: movement.category || 'Ingreso',
            origin: movement.sourceLabel || 'Ingreso registrado',
            destination: `${account.accountLabel} / ${account.bankName}`,
            occurredAt: movement.occurredAt,
            performedByName: movement.performedBy.fullName,
            amount: movement.amount,
            href: '/ingresos',
          })),
    );

    const allocationMovements: GeneralMovement[] = (entitiesQuery.data ?? []).flatMap(
      (entity) =>
        entity.allocations.map((allocation) => ({
          id: `allocation-${allocation.id}`,
          kind: 'allocation' as const,
          title: 'Asignacion',
          origin: allocation.sourceAccount
            ? `${allocation.sourceAccount.accountLabel} / ${allocation.sourceAccount.bankName}`
            : allocation.sourceLabel || 'Origen no definido',
          destination: entity.name,
          occurredAt: allocation.occurredAt,
          performedByName: allocation.performedBy.fullName,
          amount: allocation.amount,
          href: `/entidades/${entity.id}`,
        })),
    );

    const paymentMovements: GeneralMovement[] = (entitiesQuery.data ?? []).flatMap(
      (entity) =>
        entity.items.flatMap((item) =>
          item.records.map((record) => ({
            id: `payment-${record.id}`,
            kind: 'payment' as const,
            title: item.name,
            origin: entity.name,
            destination: item.paymentReference || item.name,
            occurredAt: record.occurredAt,
            performedByName: record.performedBy.fullName,
            amount: record.amount,
            href: `/entidades/${entity.id}`,
          })),
        ),
    );

    return [...incomeMovements, ...allocationMovements, ...paymentMovements].sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
  }, [entitiesQuery.data, financeAccountsQuery.data]);

  const incomeTotal = useMemo(
    () =>
      movements
        .filter((movement) => movement.kind === 'income')
        .reduce((total, movement) => total + movement.amount, 0),
    [movements],
  );

  const allocatedTotal = useMemo(
    () =>
      movements
        .filter((movement) => movement.kind === 'allocation')
        .reduce((total, movement) => total + movement.amount, 0),
    [movements],
  );

  const paymentTotal = useMemo(
    () =>
      movements
        .filter((movement) => movement.kind === 'payment')
        .reduce((total, movement) => total + movement.amount, 0),
    [movements],
  );

  if (entitiesQuery.isLoading || financeAccountsQuery.isLoading) {
    return (
      <SectionCard
        title="Registro general"
        subtitle="Cargando el historial unificado de ingresos, asignaciones y pagos."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (entitiesQuery.isError || financeAccountsQuery.isError) {
    const error = entitiesQuery.error ?? financeAccountsQuery.error;

    return (
      <SectionCard
        title="Registro general"
        subtitle="No fue posible cargar el historial consolidado."
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-danger)]">
            {extractApiErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => {
              void entitiesQuery.refetch();
              void financeAccountsQuery.refetch();
            }}
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
          Consolida ingresos recibidos, asignaciones hacia entidades y pagos
          registrados para mantener una sola trazabilidad del dinero.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Ingresos</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-success)]">
            {formatCurrency(incomeTotal)}
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Asignado a entidades</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-brand-deep)]">
            {formatCurrency(allocatedTotal)}
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Pagado</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-danger)]">
            {formatCurrency(paymentTotal)}
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Movimientos</p>
          <p className="mt-3 text-3xl font-bold">{movements.length}</p>
        </div>
      </div>

      <SectionCard
        title="Tabla unificada"
        subtitle="Cada movimiento muestra de donde sale, a donde llega y quien lo registro."
      >
        {movements.length ? (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                  <tr className="text-sm">
                    <th className="px-5 py-4 font-semibold">Fecha</th>
                    <th className="px-5 py-4 font-semibold">Tipo</th>
                    <th className="px-5 py-4 font-semibold">Origen</th>
                    <th className="px-5 py-4 font-semibold">Destino</th>
                    <th className="px-5 py-4 font-semibold">Responsable</th>
                    <th className="px-5 py-4 font-semibold">Valor</th>
                    <th className="px-5 py-4 font-semibold">Detalle</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--color-panel-strong)]">
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-t border-[var(--color-line)]/40 text-sm"
                    >
                      <td className="px-5 py-4 text-[var(--color-muted)]">
                        {formatDateTime(movement.occurredAt)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill
                          label={
                            movement.kind === 'income'
                              ? 'Ingreso'
                              : movement.kind === 'allocation'
                                ? 'Asignacion'
                                : 'Pago'
                          }
                          tone={
                            movement.kind === 'income'
                              ? 'success'
                              : movement.kind === 'allocation'
                                ? 'warning'
                                : 'danger'
                          }
                        />
                      </td>
                      <td className="px-5 py-4 font-semibold">{movement.origin}</td>
                      <td className="px-5 py-4">{movement.destination}</td>
                      <td className="px-5 py-4">{movement.performedByName}</td>
                      <td
                        className={`px-5 py-4 font-bold ${
                          movement.kind === 'income'
                            ? 'text-[var(--color-success)]'
                            : movement.kind === 'allocation'
                              ? 'text-[var(--color-brand-deep)]'
                              : 'text-[var(--color-danger)]'
                        }`}
                      >
                        {formatCurrency(movement.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={movement.href}
                          className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-semibold text-[var(--color-brand-deep)] transition hover:border-[var(--color-brand)]"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">
            Todavia no hay movimientos registrados en el sistema.
          </div>
        )}
      </SectionCard>
    </div>
  );
}
