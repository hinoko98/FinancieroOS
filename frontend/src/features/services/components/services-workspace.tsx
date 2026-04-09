'use client';

import { useMemo, useState } from 'react';
import { Landmark, PlusCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';

type ServiceGroup = {
  id: number;
  name: string;
};

type ServiceItem = {
  id: number;
  groupId: number;
  name: string;
  amount: string;
  next: string;
  status: string;
};

const initialGroups: ServiceGroup[] = [
  { id: 1, name: 'Casa principal' },
  { id: 2, name: 'Apto centro' },
];

const initialServices: ServiceItem[] = [
  { id: 1, groupId: 1, name: 'Agua', amount: '$ 120.000', next: '06 Abr 2026', status: 'Activo' },
  { id: 2, groupId: 1, name: 'Luz', amount: '$ 220.000', next: '09 Abr 2026', status: 'Activo' },
  { id: 3, groupId: 2, name: 'Gas', amount: '$ 95.000', next: '13 Abr 2026', status: 'Activo' },
];

export function ServicesWorkspace() {
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [groups, setGroups] = useState(initialGroups);
  const [services, setServices] = useState(initialServices);
  const [groupForm, setGroupForm] = useState({ name: '' });
  const [serviceForm, setServiceForm] = useState({
    groupId: String(initialGroups[0].id),
    name: '',
    amount: '',
    next: '',
  });

  const groupedServices = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        services: services.filter((service) => service.groupId === group.id),
      })),
    [groups, services],
  );

  const submitGroup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newGroup = { id: Date.now(), name: groupForm.name };
    setGroups((current) => [...current, newGroup]);
    setServiceForm((current) => ({ ...current, groupId: String(newGroup.id) }));
    setGroupForm({ name: '' });
    setGroupModalOpen(false);
  };

  const submitService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServices((current) => [
      ...current,
      {
        id: Date.now(),
        groupId: Number(serviceForm.groupId),
        name: serviceForm.name,
        amount: serviceForm.amount,
        next: serviceForm.next,
        status: 'Activo',
      },
    ]);
    setServiceForm({
      groupId: String(groups[0]?.id ?? ''),
      name: '',
      amount: '',
      next: '',
    });
    setServiceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Servicios" subtitle="Propiedades y pagos">
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => setGroupModalOpen(true)}
            type="button"
          >
            <PlusCircle className="h-4 w-4" />
            Nueva categoria
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)]"
            onClick={() => setServiceModalOpen(true)}
            type="button"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo servicio
          </button>
        </div>
      </SectionCard>

      <div className="space-y-4">
        {groupedServices.map((group) => (
          <SectionCard key={group.id} title={group.name}>
            <div className="grid gap-4 xl:grid-cols-3">
              {group.services.length > 0 ? (
                group.services.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xl font-bold">{service.name}</p>
                        <p className="mt-2 text-sm text-[var(--color-muted)]">
                          Proximo pago: {service.next}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                        <Landmark className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-5 text-2xl font-bold">{service.amount}</p>
                    <div className="mt-4">
                      <StatusPill label={service.status} tone="success" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-muted)]">
                  Sin servicios registrados.
                </div>
              )}
            </div>
          </SectionCard>
        ))}
      </div>

      <Modal
        open={groupModalOpen}
        title="Nueva categoria"
        onClose={() => setGroupModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitGroup}>
          <label className="space-y-2 text-sm">
            <span className="font-semibold">Nombre</span>
            <input
              value={groupForm.name}
              onChange={(event) =>
                setGroupForm({ name: event.target.value })
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              placeholder="Casa principal"
              required
            />
          </label>
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

      <Modal
        open={serviceModalOpen}
        title="Nuevo servicio"
        onClose={() => setServiceModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitService}>
          <label className="space-y-2 text-sm">
            <span className="font-semibold">Categoria</span>
            <select
              value={serviceForm.groupId}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, groupId: event.target.value }))
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Servicio</span>
              <input
                value={serviceForm.name}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="Agua"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Monto</span>
              <input
                value={serviceForm.amount}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, amount: event.target.value }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="$ 120.000"
                required
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Proximo pago</span>
            <input
              value={serviceForm.next}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, next: event.target.value }))
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              placeholder="10 Abr 2026"
              required
            />
          </label>

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
