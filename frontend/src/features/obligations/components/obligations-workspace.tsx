'use client';

import { useState } from 'react';
import { CalendarClock, PlusCircle, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { SectionCard } from '@/components/ui/section-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusPill } from '@/components/ui/status-pill';

const initialObligations = [
  {
    id: 1,
    name: 'Prestamo negocio',
    total: '$ 12.000.000',
    pending: '$ 4.200.000',
    next: '08 Abr 2026',
    progress: 65,
  },
  {
    id: 2,
    name: 'Credito moto',
    total: '$ 8.500.000',
    pending: '$ 2.000.000',
    next: '15 Abr 2026',
    progress: 76,
  },
];

export function ObligationsWorkspace() {
  const [modalOpen, setModalOpen] = useState(false);
  const [obligations, setObligations] = useState(initialObligations);
  const [form, setForm] = useState({
    name: '',
    total: '',
    pending: '',
    next: '',
    progress: '0',
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setObligations((current) => [
      ...current,
      {
        id: Date.now(),
        name: form.name,
        total: form.total,
        pending: form.pending,
        next: form.next,
        progress: Number(form.progress),
      },
    ]);
    setForm({ name: '', total: '', pending: '', next: '', progress: '0' });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Control" subtitle="Cuotas y vencimientos">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          Nueva obligacion
        </button>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {obligations.map((obligation) => (
          <SectionCard key={obligation.id} title={obligation.name}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--color-muted)]">Pendiente</p>
                  <p className="text-2xl font-bold text-[var(--color-danger)]">
                    {obligation.pending}
                  </p>
                </div>
                <div className="rounded-[var(--radius-control)] bg-[rgba(166,63,46,0.10)] p-3 text-[var(--color-danger)]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              <ProgressBar value={obligation.progress} tone="warning" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">{obligation.total}</span>
                <span className="font-semibold">{obligation.progress}% pagado</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <CalendarClock className="h-4 w-4" />
                  {obligation.next}
                </div>
                <StatusPill label="Activa" tone="warning" />
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <Modal open={modalOpen} title="Nueva obligacion" onClose={() => setModalOpen(false)}>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="space-y-2 text-sm">
            <span className="font-semibold">Nombre</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Total</span>
              <input
                value={form.total}
                onChange={(event) =>
                  setForm((current) => ({ ...current, total: event.target.value }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="$ 10.000.000"
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Pendiente</span>
              <input
                value={form.pending}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pending: event.target.value }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="$ 2.000.000"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Proximo pago</span>
              <input
                value={form.next}
                onChange={(event) =>
                  setForm((current) => ({ ...current, next: event.target.value }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="15 Abr 2026"
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">% pagado</span>
              <input
                type="number"
                min="0"
                max="100"
                value={form.progress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, progress: event.target.value }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                required
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
