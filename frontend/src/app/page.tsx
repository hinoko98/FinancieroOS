'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Building2,
  ClipboardList,
  ReceiptText,
  UserRound,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { SectionCard } from '@/components/ui/section-card';
import { SummaryCard } from '@/features/dashboard/components/summary-card';
import { dashboardModules } from '@/features/dashboard/data/dashboard-data';
import {
  ENTITIES_QUERY_KEY,
  formatCurrency,
  formatDateTime,
  getRecentEntityRecords,
  summarizeEntities,
  type Entity,
} from '@/features/entities/lib/entities';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-provider';

export default function HomePage() {
  const { user } = useAuth();

  const entitiesQuery = useQuery({
    queryKey: ENTITIES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<Entity[]>('/entities');
      return response.data;
    },
    enabled: Boolean(user),
  });

  const summary = useMemo(
    () => summarizeEntities(entitiesQuery.data ?? []),
    [entitiesQuery.data],
  );

  const recentRecords = useMemo(
    () => getRecentEntityRecords(entitiesQuery.data ?? []),
    [entitiesQuery.data],
  );

  const topEntities = useMemo(
    () =>
      [...(entitiesQuery.data ?? [])]
        .sort((left, right) => right.spentAmount - left.spentAmount)
        .slice(0, 5),
    [entitiesQuery.data],
  );

  return (
    <AppShell>
      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard general</h2>
          <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
            Vista resumida de las entidades a las que tienes acceso, el dinero
            asignado, los pagos realizados y los accesos principales del sistema.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <SummaryCard
            metric={{
              label: 'Entidades',
              value: `${summary.entitiesCount}`,
              description: 'Agrupaciones activas',
              tone: 'brand',
            }}
          />
          <SummaryCard
            metric={{
              label: 'Servicios',
              value: `${summary.itemsCount}`,
              description: 'Servicios registrados',
              tone: 'warning',
            }}
          />
          <SummaryCard
            metric={{
              label: 'Total asignado',
              value: formatCurrency(summary.totalAssigned),
              description: `${summary.entitiesCount} entidades`,
              tone: 'danger',
            }}
          />
          <SummaryCard
            metric={{
              label: 'Saldo disponible',
              value: formatCurrency(summary.totalAvailable),
              description: `${summary.recordsCount} pagos registrados`,
              tone: 'warning',
            }}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Entidades con mayor gasto"
            subtitle="Entra directo al detalle de cada entidad."
          >
            {topEntities.length ? (
              <div className="space-y-3">
                {topEntities.map((entity) => (
                  <Link
                    key={entity.id}
                    href={`/entidades/${entity.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 transition hover:border-[var(--color-brand)] md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-bold">{entity.name}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {entity.itemsCount} servicios / {entity.recordsCount} pagos
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[var(--color-success)]">
                        {formatCurrency(entity.spentAmount)}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-[var(--color-brand)]" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">
                Aun no hay entidades creadas. Crea la primera desde el modulo de
                entidades para empezar a registrar servicios y pagos.
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Actividad reciente"
            subtitle="Ultimos pagos cargados por los usuarios."
          >
            {recentRecords.length ? (
              <div className="space-y-3">
                {recentRecords.map((record) => (
                  <Link
                    key={record.id}
                    href={`/entidades/${record.entityId}`}
                    className="block rounded-2xl border border-[var(--color-line)] bg-white p-4 transition hover:border-[var(--color-brand)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold">{record.itemName}</p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {record.entityName}
                        </p>
                      </div>
                      <p className="font-bold text-[var(--color-success)]">
                        {formatCurrency(record.amount)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      <span className="inline-flex items-center gap-2">
                        <ReceiptText className="h-3.5 w-3.5" />
                        {formatDateTime(record.occurredAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-3.5 w-3.5" />
                        {record.performedBy.fullName}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">
                Cuando registres pagos en una entidad apareceran aqui.
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {dashboardModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-[28px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 transition hover:-translate-y-1 hover:border-[var(--color-brand)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-brand)]">
                    {module.description}
                  </p>
                  <h4 className="mt-4 text-2xl font-bold tracking-tight">
                    {module.emphasis}
                  </h4>
                </div>
                <div className="rounded-full bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                  {module.href === '/entidades' ? (
                    <Building2 className="h-5 w-5" />
                  ) : module.href === '/registro-general' ? (
                    <ClipboardList className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
