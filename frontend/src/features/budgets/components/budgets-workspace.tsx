import { SectionCard } from '@/components/ui/section-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusPill } from '@/components/ui/status-pill';

const budgets = [
  { name: 'Servicios', limit: '$ 3.200.000', used: '$ 2.980.000', progress: 93, tone: 'warning' as const },
  { name: 'Compras', limit: '$ 2.000.000', used: '$ 1.150.000', progress: 57, tone: 'brand' as const },
  { name: 'Suscripciones', limit: '$ 150.000', used: '$ 168.000', progress: 100, tone: 'danger' as const },
];

export function BudgetsWorkspace() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {budgets.map((budget) => (
        <SectionCard key={budget.name} title={budget.name}>
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-[var(--color-muted)]">Usado</p>
                <p className="text-2xl font-bold">{budget.used}</p>
              </div>
              <StatusPill
                label={budget.tone === 'danger' ? 'Excedido' : 'En curso'}
                tone={budget.tone === 'danger' ? 'danger' : budget.tone === 'warning' ? 'warning' : 'success'}
              />
            </div>
            <ProgressBar value={budget.progress} tone={budget.tone} />
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Limite</span>
              <span className="font-semibold">{budget.limit}</span>
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
