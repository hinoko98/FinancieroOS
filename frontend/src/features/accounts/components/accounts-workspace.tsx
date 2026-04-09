'use client';

import { useMemo, useState } from 'react';
import { Landmark, Plus, Wallet } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

type DepositRow = {
  id: number;
  destino: string;
  mes: string;
  banco: string;
  monto: number;
  estado: string;
};

type BankRow = {
  id: number;
  nombre: string;
  tipo: string;
};

const monthOptions = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const yearOptions = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

const initialDeposits: DepositRow[] = [
  {
    id: 1,
    destino: 'Caja principal',
    mes: 'Marzo 2026',
    banco: 'Bancolombia',
    monto: 1800000,
    estado: 'Activo',
  },
  {
    id: 2,
    destino: 'Internet hogar',
    mes: 'Abril 2026',
    banco: 'Nequi',
    monto: 320000,
    estado: 'Activo',
  },
  {
    id: 3,
    destino: 'Fondo servicios',
    mes: 'Abril 2026',
    banco: 'Davivienda',
    monto: 950000,
    estado: 'Activo',
  },
];

const initialBanks: BankRow[] = [
  { id: 1, nombre: 'Bancolombia', tipo: 'Banco' },
  { id: 2, nombre: 'Nequi', tipo: 'Billetera' },
  { id: 3, nombre: 'Davivienda', tipo: 'Banco' },
];

function money(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AccountsWorkspace() {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [deposits, setDeposits] = useState(initialDeposits);
  const [banks, setBanks] = useState(initialBanks);

  const availableTargets: string[] = [];

  const [depositForm, setDepositForm] = useState({
    destino: '',
    mes: 'Abril',
    anio: '2026',
    banco: initialBanks[0].nombre,
    monto: '0',
  });

  const [bankForm, setBankForm] = useState({
    nombre: '',
    tipo: 'Banco',
  });

  const total = useMemo(
    () => deposits.reduce((acc, item) => acc + item.monto, 0),
    [deposits],
  );

  const submitDeposit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!depositForm.destino) {
      return;
    }

    setDeposits((current) => [
      {
        id: Date.now(),
        destino: depositForm.destino,
        mes: `${depositForm.mes} ${depositForm.anio}`,
        banco: depositForm.banco,
        monto: Number(depositForm.monto),
        estado: 'Activo',
      },
      ...current,
    ]);

    setDepositForm({
      destino: '',
      mes: 'Abril',
      anio: '2026',
      banco: banks[0]?.nombre ?? '',
      monto: '0',
    });
    setDepositModalOpen(false);
  };

  const submitBank = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newBank = {
      id: Date.now(),
      nombre: bankForm.nombre,
      tipo: bankForm.tipo,
    };

    setBanks((current) => [...current, newBank]);
    setDepositForm((current) => ({ ...current, banco: newBank.nombre }));
    setBankForm({ nombre: '', tipo: 'Banco' });
    setBankModalOpen(false);
  };

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-[var(--color-muted)]">Total asignado</p>
              <h2 className="mt-2 text-3xl font-bold text-[var(--color-success)]">
                {money(total)}
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDepositModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-deep)]"
              >
                <Wallet className="h-4 w-4" />
                Registrar saldo
              </button>
              <button
                type="button"
                onClick={() => setBankModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)] transition hover:bg-[var(--color-brand-soft)]"
              >
                <Plus className="h-4 w-4" />
                Nuevo banco
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--color-line)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f4e6d8] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Destino</th>
                  <th className="px-4 py-3 font-semibold">Mes</th>
                  <th className="px-4 py-3 font-semibold">Banco</th>
                  <th className="px-4 py-3 font-semibold">Monto</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {deposits.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--color-line)]">
                    <td className="px-4 py-4 font-semibold">{row.destino}</td>
                    <td className="px-4 py-4 text-[var(--color-muted)]">{row.mes}</td>
                    <td className="px-4 py-4">{row.banco}</td>
                    <td className="px-4 py-4 font-bold text-[var(--color-success)]">
                      {money(row.monto)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[rgba(31,122,69,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-success)]">
                        {row.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Bancos</h3>
              <p className="text-sm text-[var(--color-muted)]">{banks.length} registrados</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3"
              >
                <p className="font-semibold">{bank.nombre}</p>
                <p className="text-sm text-[var(--color-muted)]">{bank.tipo}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <Modal
        open={depositModalOpen}
        title="Registrar saldo"
        onClose={() => setDepositModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitDeposit}>
          <label className="space-y-2 text-sm">
            <span className="font-semibold">Cuenta o servicio</span>
            <select
              value={depositForm.destino}
              onChange={(event) =>
                setDepositForm((current) => ({
                  ...current,
                  destino: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none disabled:bg-[#f7f1ea] disabled:text-[var(--color-muted)]"
              disabled={availableTargets.length === 0}
            >
              <option value="">
                {availableTargets.length === 0
                  ? 'Crea una cuenta o servicio primero'
                  : 'Selecciona una opcion'}
              </option>
              {availableTargets.map((destino) => (
                <option key={destino} value={destino}>
                  {destino}
                </option>
              ))}
            </select>
            {availableTargets.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">
                Este campo se llenara con las cuentas o servicios creados por el usuario desde sus modulos.
              </p>
            ) : null}
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Mes</span>
              <select
                value={depositForm.mes}
                onChange={(event) =>
                  setDepositForm((current) => ({
                    ...current,
                    mes: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Ano</span>
              <select
                value={depositForm.anio}
                onChange={(event) =>
                  setDepositForm((current) => ({
                    ...current,
                    anio: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Banco</span>
              <select
                value={depositForm.banco}
                onChange={(event) =>
                  setDepositForm((current) => ({
                    ...current,
                    banco: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.nombre}>
                    {bank.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Monto</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={depositForm.monto}
              onChange={(event) =>
                setDepositForm((current) => ({
                  ...current,
                  monto: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
            />
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={availableTargets.length === 0}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-deep)] disabled:cursor-not-allowed disabled:opacity-55"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={bankModalOpen}
        title="Nuevo banco"
        onClose={() => setBankModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitBank}>
          <label className="space-y-2 text-sm">
            <span className="font-semibold">Nombre</span>
            <input
              value={bankForm.nombre}
              onChange={(event) =>
                setBankForm((current) => ({
                  ...current,
                  nombre: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              placeholder="Banco de Bogota"
              required
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Tipo</span>
            <select
              value={bankForm.tipo}
              onChange={(event) =>
                setBankForm((current) => ({
                  ...current,
                  tipo: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
            >
              <option value="Banco">Banco</option>
              <option value="Billetera">Billetera</option>
              <option value="Ahorro">Ahorro</option>
            </select>
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-deep)]"
            >
              Crear
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
