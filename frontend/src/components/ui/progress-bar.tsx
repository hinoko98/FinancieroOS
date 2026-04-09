export function ProgressBar({
  value,
  tone = 'brand',
}: {
  value: number;
  tone?: 'brand' | 'warning' | 'danger';
}) {
  const width = Math.max(0, Math.min(100, value));
  const background =
    tone === 'danger'
      ? 'var(--color-danger)'
      : tone === 'warning'
        ? 'var(--color-warning)'
        : 'var(--color-brand)';

  return (
    <div className="h-3 overflow-hidden rounded-full bg-[#f1e7db]">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${width}%`, background }}
      />
    </div>
  );
}
