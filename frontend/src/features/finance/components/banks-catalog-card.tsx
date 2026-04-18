'use client';

import { Landmark } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';
import { COLOMBIA_BANK_OPTIONS } from '@/features/finance/lib/colombia-banks';

export function BanksCatalogCard() {
  return (
    <SectionCard
      title="Catalogo de bancos"
      subtitle="Listado disponible para el formulario de ingresos y cuentas financieras."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Bancos usados en ingresos</p>
              <p className="text-sm text-[var(--color-muted)]">
                Este listado alimenta el selector cuando registras una cuenta
                receptora.
              </p>
            </div>
          </div>
          <div className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand-deep)]">
            {COLOMBIA_BANK_OPTIONS.length} opciones
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {COLOMBIA_BANK_OPTIONS.map((bank) => (
            <div
              key={bank}
              className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)]"
            >
              {bank}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
