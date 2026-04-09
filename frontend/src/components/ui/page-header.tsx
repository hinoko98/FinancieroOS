export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {description ? (
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
