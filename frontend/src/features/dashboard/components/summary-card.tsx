import { cn } from '@/lib/utils/cn';
import type { DashboardMetric } from '@/types/dashboard';

const toneStyles: Record<DashboardMetric['tone'], string> = {
  brand: 'bg-[#e5d1bf] text-[#5d3d28]',
  warning: 'bg-[#f1e0b8] text-[#8b5e17]',
  danger: 'bg-[#ead0c8] text-[#944232]',
};

export function SummaryCard({ metric }: { metric: DashboardMetric }) {
  return (
    <article className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-panel)] backdrop-blur">
      <span
        className={cn(
          'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]',
          toneStyles[metric.tone],
        )}
      >
        {metric.label}
      </span>
      <p className="mt-4 text-3xl font-bold tracking-tight">{metric.value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        {metric.description}
      </p>
    </article>
  );
}
