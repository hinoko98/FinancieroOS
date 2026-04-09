import { cn } from '@/lib/utils/cn';

const toneMap = {
  success: 'bg-[rgba(31,122,69,0.12)] text-[var(--color-success)]',
  warning: 'bg-[rgba(154,106,31,0.14)] text-[var(--color-warning)]',
  danger: 'bg-[rgba(166,63,46,0.12)] text-[var(--color-danger)]',
  neutral: 'bg-[rgba(111,78,55,0.10)] text-[var(--color-brand-deep)]',
} as const;

export function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: keyof typeof toneMap;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
        toneMap[tone],
      )}
    >
      {label}
    </span>
  );
}
