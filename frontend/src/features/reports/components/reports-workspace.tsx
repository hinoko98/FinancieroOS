import { BarChart3, CalendarRange, FileSpreadsheet } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';

const reportCards = [
  { title: 'Ingresos vs gastos', icon: BarChart3, value: '$ 5.420.000' },
  { title: 'Mensual', icon: CalendarRange, value: 'Abril 2026' },
  { title: 'Exportar', icon: FileSpreadsheet, value: 'Excel / PDF' },
];

const categories = [
  { name: 'Servicios', amount: '$ 2.980.000' },
  { name: 'Compras', amount: '$ 1.150.000' },
  { name: 'Obligaciones', amount: '$ 860.000' },
];

export function ReportsWorkspace() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-3">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <SectionCard key={card.title} title={card.title}>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{card.value}</p>
                <div className="rounded-2xl bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>

      <SectionCard title="Categorias" subtitle="Resumen general">
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center justify-between rounded-2xl border border-[var(--color-line)] bg-white px-4 py-4"
            >
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-sm text-[var(--color-muted)]">Ejecucion</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill label="Activo" tone="success" />
                <p className="font-bold text-[var(--color-success)]">{category.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
