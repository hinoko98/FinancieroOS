'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Building2,
  HandCoins,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';
import {
  extractApiErrorMessage,
  formatCurrency,
  formatDateTime,
} from '@/features/entities/lib/entities';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import {
  ADMIN_OVERVIEW_QUERY_KEY,
  getManagedUserRoleLabel,
  type AdminOverview,
} from '../lib/admin';

export function AdminOverviewWorkspace() {
  const { user } = useAuth();

  const overviewQuery = useQuery({
    queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<AdminOverview>('/admin/overview');
      return response.data;
    },
    enabled: user?.role === 'ADMIN',
  });

  if (user?.role !== 'ADMIN') {
    return (
      <SectionCard
        title="Administracion"
        subtitle="Este panel esta disponible solo para administradores."
      >
        <p className="text-sm text-[var(--color-muted)]">
          Tu usuario no tiene permisos para consultar el dashboard administrativo.
        </p>
      </SectionCard>
    );
  }

  if (overviewQuery.isLoading) {
    return (
      <SectionCard
        title="Administracion"
        subtitle="Cargando el resumen general del sistema."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <SectionCard
        title="Administracion"
        subtitle="No fue posible cargar el rendimiento general del sistema."
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-danger)]">
            {extractApiErrorMessage(overviewQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => overviewQuery.refetch()}
            className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  const { totals, recentLogins } = overviewQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administracion"
        description="Resumen ejecutivo del sistema con usuarios, actividad operativa, fondos registrados y movimiento reciente."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Users className="h-4 w-4 text-[var(--color-brand)]" />
            Usuarios totales
          </p>
          <p className="mt-3 text-3xl font-bold">{totals.totalUsers}</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {totals.newUsersLast30Days} nuevos en los ultimos 30 dias
          </p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <UserCheck className="h-4 w-4 text-[var(--color-success)]" />
            Usuarios activos
          </p>
          <p className="mt-3 text-3xl font-bold text-[var(--color-success)]">
            {totals.activeUsers}
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {totals.adminUsers} administradores activos en la plataforma
          </p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Building2 className="h-4 w-4 text-[var(--color-brand-deep)]" />
            Entidades y compartidos
          </p>
          <p className="mt-3 text-3xl font-bold">{totals.totalEntities}</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {totals.totalSharedRelations} relaciones de acceso compartido
          </p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Activity className="h-4 w-4 text-[var(--color-warning)]" />
            Auditoria 24h
          </p>
          <p className="mt-3 text-3xl font-bold text-[var(--color-warning)]">
            {totals.auditLogsLast24Hours}
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Eventos de auditoria registrados en el ultimo dia
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Flujo financiero"
          subtitle="Totales consolidados del dinero registrado en el sistema."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
                <Wallet className="h-4 w-4 text-[var(--color-brand)]" />
                Cuentas financieras
              </p>
              <p className="mt-3 text-2xl font-bold">
                {totals.totalFinancialAccounts}
              </p>
            </div>

            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
                <HandCoins className="h-4 w-4 text-[var(--color-success)]" />
                Ingresos registrados
              </p>
              <p className="mt-3 text-2xl font-bold text-[var(--color-success)]">
                {formatCurrency(totals.totalIncomes)}
              </p>
            </div>

            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="text-sm text-[var(--color-muted)]">Asignado a entidades</p>
              <p className="mt-3 text-2xl font-bold text-[var(--color-brand-deep)]">
                {formatCurrency(totals.totalAllocations)}
              </p>
            </div>

            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="text-sm text-[var(--color-muted)]">Pagos registrados</p>
              <p className="mt-3 text-2xl font-bold text-[var(--color-danger)]">
                {formatCurrency(totals.totalPayments)}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Estado general"
          subtitle="Indicadores rapidos del uso actual del sistema."
        >
          <div className="space-y-4">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="text-sm text-[var(--color-muted)]">
                Usuarios no activos
              </p>
              <p className="mt-2 text-xl font-bold">
                {totals.totalUsers - totals.activeUsers}
              </p>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="text-sm text-[var(--color-muted)]">
                Promedio de cuentas por usuario
              </p>
              <p className="mt-2 text-xl font-bold">
                {totals.totalUsers
                  ? (totals.totalFinancialAccounts / totals.totalUsers).toFixed(1)
                  : '0.0'}
              </p>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4">
              <p className="text-sm text-[var(--color-muted)]">
                Relacion ingresos / pagos
              </p>
              <p className="mt-2 text-xl font-bold">
                {totals.totalPayments
                  ? `${(totals.totalIncomes / totals.totalPayments).toFixed(2)}x`
                  : 'Sin pagos'}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Ultimos ingresos al sistema"
        subtitle="Actividad reciente de acceso para monitoreo operativo."
      >
        {recentLogins.length ? (
          <div className="space-y-3">
            {recentLogins.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">
                      {entry.user.fullName} @{entry.user.username}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusPill label={getManagedUserRoleLabel(entry.user.role)} />
                      <span className="text-sm text-[var(--color-muted)]">
                        {entry.ipAddress ?? 'IP no disponible'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-[var(--color-muted)]">
                    {formatDateTime(entry.loggedInAt)}
                  </div>
                </div>
                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  {entry.userAgent ?? 'Navegador no identificado'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">
            No hay inicios de sesion recientes para mostrar.
          </div>
        )}
      </SectionCard>
    </div>
  );
}
