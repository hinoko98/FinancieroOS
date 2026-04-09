import { ArrowDownToLine, ArrowUpFromLine, PiggyBank } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';

const funds = [
  { name: 'Servicios', amount: '$ 2.980.000', status: 'Activo' },
  { name: 'Compras', amount: '$ 1.450.000', status: 'Activo' },
  { name: 'Emergencia', amount: '$ 4.200.000', status: 'Activo' },
];

const movements = [
  { type: 'Entrada', origin: 'Banco principal', target: 'Fondo servicios', amount: '$ 900.000' },
  { type: 'Salida', origin: 'Fondo servicios', target: 'Internet hogar', amount: '$ 320.000' },
  { type: 'Entrada', origin: 'Caja principal', target: 'Fondo compras', amount: '$ 450.000' },
];

export function FundsWorkspace() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {funds.map((fund) => (
          <SectionCard key={fund.name} title={fund.name}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-[var(--color-success)]">
                  {fund.amount}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Saldo actual</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                <PiggyBank className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5">
              <StatusPill label={fund.status} tone="success" />
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Movimientos" subtitle="Asignaciones y retiros">
        <div className="space-y-3">
          {movements.map((movement, index) => (
            <div
              key={`${movement.origin}-${index}`}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                  {movement.type === 'Entrada' ? (
                    <ArrowDownToLine className="h-4 w-4" />
                  ) : (
                    <ArrowUpFromLine className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{movement.target}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {movement.origin}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill
                  label={movement.type}
                  tone={movement.type === 'Entrada' ? 'success' : 'warning'}
                />
                <p className="font-bold text-[var(--color-success)]">{movement.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
