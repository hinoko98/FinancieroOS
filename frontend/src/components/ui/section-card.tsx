import { cn } from '@/lib/utils/cn';

export function SectionCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-panel)]',
        className,
      )}
    >
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
