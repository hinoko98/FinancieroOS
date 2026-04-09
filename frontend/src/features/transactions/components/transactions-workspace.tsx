import { ArrowLeftRight, Funnel, Plus } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';

const transactions = [
  {
    code: 'TRX-1052',
    type: 'Gasto',
    detail: 'Internet hogar',
    source: 'Bancolombia',
    amount: '$ 320.000',
    status: 'Publicado',
    user: 'Admin principal',
  },
  {
    code: 'TRX-1051',
    type: 'Transferencia',
    detail: 'Servicios',
    source: 'Caja principal',
    amount: '$ 900.000',
    status: 'Publicado',
    user: 'Manager casa',
  },
  {
    code: 'TRX-1049',
    type: 'Ingreso',
    detail: 'Venta externa',
    source: 'Nequi',
    amount: '$ 1.250.000',
    status: 'Publicado',
    user: 'Admin principal',
  },
];

export function TransactionsWorkspace() {
  return (
    <div className="space-y-6">
      <SectionCard title="Control" subtitle="Motor transaccional">
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            Nueva transaccion
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)]">
            <Funnel className="h-4 w-4" />
            Filtros
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Registro" subtitle="Ultimos movimientos">
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.code}
              className="grid gap-4 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-4 md:grid-cols-[1.2fr_1fr_0.8fr_auto]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">{transaction.detail}</p>
                  <p className="text-sm text-[var(--color-muted)]">{transaction.code}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">{transaction.type}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {transaction.source} · {transaction.user}
                </p>
              </div>
              <p className="text-lg font-bold text-[var(--color-success)]">
                {transaction.amount}
              </p>
              <div className="md:text-right">
                <StatusPill label={transaction.status} tone="success" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
