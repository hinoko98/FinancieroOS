import { Activity, BarChart3, Clock3, UserRound } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';

const monthlyBars = [
  { month: 'Ene', income: 70, expense: 42 },
  { month: 'Feb', income: 86, expense: 58 },
  { month: 'Mar', income: 78, expense: 51 },
  { month: 'Abr', income: 92, expense: 67 },
];

const payments = [
  { name: 'Internet hogar', amount: '$ 320.000', due: '05 Abr', status: 'Pagado' },
  { name: 'Energia', amount: '$ 280.000', due: '11 Abr', status: 'Pendiente' },
  { name: 'Credito moto', amount: '$ 860.000', due: '15 Abr', status: 'Pendiente' },
];

const auditItems = [
  { user: 'Admin principal', action: 'Ajuste manual', time: 'Hoy 09:10' },
  { user: 'Admin principal', action: 'Pago de servicio', time: 'Hoy 08:42' },
  { user: 'Manager casa', action: 'Asignacion a fondo', time: 'Ayer 17:30' },
];

export function DashboardWorkspace() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Flujo mensual" subtitle="Ingresos vs gastos">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[var(--color-brand)]" />
                Ingresos
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[var(--color-warning)]" />
                Gastos
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {monthlyBars.map((bar) => (
                <div key={bar.month} className="space-y-3 text-center">
                  <div className="flex h-44 items-end justify-center gap-2 rounded-[var(--radius-card)] bg-[#f7efe4] px-3 py-4">
                    <div
                      className="w-6 rounded-full bg-[var(--color-brand)]"
                      style={{ height: `${bar.income}%` }}
                    />
                    <div
                      className="w-6 rounded-full bg-[var(--color-warning)]"
                      style={{ height: `${bar.expense}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold">{bar.month}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pagos" subtitle="Resumen">
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.name}
                className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{payment.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {payment.amount}
                    </p>
                  </div>
                  <StatusPill
                    label={payment.status}
                    tone={payment.status === 'Pagado' ? 'success' : 'warning'}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <Clock3 className="h-4 w-4" />
                  {payment.due}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Ingresos" className="bg-[var(--color-panel-strong)]">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-[var(--color-success)]">$ 8.420.000</p>
            <BarChart3 className="h-6 w-6 text-[var(--color-brand)]" />
          </div>
        </SectionCard>
        <SectionCard title="Gastos" className="bg-[var(--color-panel-strong)]">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-[var(--color-danger)]">$ 5.420.000</p>
            <Activity className="h-6 w-6 text-[var(--color-warning)]" />
          </div>
        </SectionCard>
        <SectionCard title="Auditoria" subtitle="Ultimos movimientos por usuario">
          <div className="space-y-3">
            {auditItems.map((item, index) => (
              <div key={`${item.user}-${index}`} className="flex items-start gap-3">
                <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-2 text-[var(--color-brand-deep)]">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">{item.action}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {item.user} · {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
