'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownToLine, PlusCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency, extractApiErrorMessage } from '@/features/entities/lib/entities';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { COLOMBIA_BANK_OPTIONS } from '@/features/finance/lib/colombia-banks';
import {
  FINANCE_ACCOUNTS_QUERY_KEY,
  getFinancialAccountTypeLabel,
  type FinancialAccount,
  type FinancialAccountType,
} from '@/features/finance/lib/finance';

const incomeCategoryOptions = [
  'Sueldo',
  'Ganancia extra',
  'Arriendo',
  'Venta',
  'Honorarios',
  'Reembolso',
  'Otro',
] as const;

const accountTypeOptions = ['AHORROS', 'CORRIENTE', 'BILLETERA', 'OTRO'] as const;

type AccountFormState = {
  bankName: (typeof COLOMBIA_BANK_OPTIONS)[number];
  accountLabel: string;
  accountType: FinancialAccountType;
  accountMask: string;
};

type IncomeFormState = {
  accountId: string;
  amount: string;
  occurredAt: string;
  category: (typeof incomeCategoryOptions)[number];
  sourceLabel: string;
};

export function IncomesWorkspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    bankName: COLOMBIA_BANK_OPTIONS[0],
    accountLabel: '',
    accountType: 'AHORROS',
    accountMask: '',
  });
  const [incomeForm, setIncomeForm] = useState<IncomeFormState>({
    accountId: '',
    amount: '',
    occurredAt: '',
    category: 'Sueldo',
    sourceLabel: '',
  });

  const accountsQuery = useQuery({
    queryKey: FINANCE_ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<FinancialAccount[]>('/finance/accounts');
      return response.data;
    },
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (payload: {
      bankName: string;
      accountLabel: string;
      accountType: string;
      accountMask?: string;
    }) => {
      await apiClient.post('/finance/accounts', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_ACCOUNTS_QUERY_KEY });
      setAccountForm({
        bankName: COLOMBIA_BANK_OPTIONS[0],
        accountLabel: '',
        accountType: 'AHORROS',
        accountMask: '',
      });
      setAccountError(null);
      setAccountModalOpen(false);
    },
    onError: (error) => {
      setAccountError(extractApiErrorMessage(error));
    },
  });

  const createIncomeMutation = useMutation({
    mutationFn: async (payload: {
      accountId: string;
      amount: number;
      occurredAt?: string;
      category?: string;
      sourceLabel?: string;
    }) => {
      await apiClient.post(`/finance/accounts/${payload.accountId}/incomes`, {
        amount: payload.amount,
        occurredAt: payload.occurredAt,
        category: payload.category,
        sourceLabel: payload.sourceLabel,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FINANCE_ACCOUNTS_QUERY_KEY });
      setIncomeForm({
        accountId: '',
        amount: '',
        occurredAt: '',
        category: 'Sueldo',
        sourceLabel: '',
      });
      setIncomeError(null);
      setIncomeModalOpen(false);
    },
    onError: (error) => {
      setIncomeError(extractApiErrorMessage(error));
    },
  });

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);

  const totalBalance = useMemo(
    () => accounts.reduce((accumulator, account) => accumulator + account.balance, 0),
    [accounts],
  );

  const totalIncome = useMemo(
    () =>
      accounts
        .flatMap((account) => account.movements)
        .filter((movement) => movement.movementType === 'INCOME')
        .reduce((accumulator, movement) => accumulator + movement.amount, 0),
    [accounts],
  );

  const connectedBanks = useMemo(
    () => new Set(accounts.map((account) => account.bankName)).size,
    [accounts],
  );

  const submitAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountError(null);
    createAccountMutation.mutate({
      bankName: accountForm.bankName,
      accountLabel: accountForm.accountLabel,
      accountType: accountForm.accountType,
      accountMask: accountForm.accountMask || undefined,
    });
  };

  const submitIncome = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIncomeError(null);
    createIncomeMutation.mutate({
      accountId: incomeForm.accountId,
      amount: Number(incomeForm.amount),
      occurredAt: incomeForm.occurredAt
        ? new Date(incomeForm.occurredAt).toISOString()
        : undefined,
      category: incomeForm.category,
      sourceLabel: incomeForm.sourceLabel || undefined,
    });
  };

  if (accountsQuery.isLoading) {
    return (
      <SectionCard title="Ingresos" subtitle="Cargando cuentas e ingresos.">
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (accountsQuery.isError) {
    return (
      <SectionCard title="Ingresos" subtitle="No fue posible cargar las cuentas.">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-danger)]">
            {extractApiErrorMessage(accountsQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => accountsQuery.refetch()}
            className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Ingresos"
          description="Administra las cuentas donde recibes sueldo, ganancias extra y otros ingresos. Las asignaciones a entidades pueden descontar directamente desde estas cuentas."
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setAccountError(null);
              setAccountModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-deep)]"
          >
            <PlusCircle className="h-4 w-4" />
            Nueva cuenta
          </button>
          <button
            type="button"
            onClick={() => {
              setIncomeError(null);
              setIncomeForm((current) => ({
                ...current,
                accountId: current.accountId || accounts[0]?.id || '',
                occurredAt: new Date().toISOString().slice(0, 16),
              }));
              setIncomeModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)] transition hover:bg-[var(--color-brand-soft)]"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Registrar ingreso
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 shadow-[var(--shadow-panel)]">
            <p className="text-sm text-[var(--color-muted)]">Saldo disponible</p>
            <p className="mt-3 text-3xl font-bold text-[var(--color-success)]">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 shadow-[var(--shadow-panel)]">
            <p className="text-sm text-[var(--color-muted)]">Ingresos registrados</p>
            <p className="mt-3 text-3xl font-bold">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 shadow-[var(--shadow-panel)]">
            <p className="text-sm text-[var(--color-muted)]">Cuentas activas</p>
            <p className="mt-3 text-3xl font-bold">{accounts.length}</p>
          </div>
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 shadow-[var(--shadow-panel)]">
            <p className="text-sm text-[var(--color-muted)]">Bancos conectados</p>
            <p className="mt-3 text-3xl font-bold">{connectedBanks}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Cuentas receptoras"
            subtitle="Cuentas donde entra el dinero y desde donde puedes financiar entidades."
          >
            <div className="space-y-4">
              {accounts.length ? (
                accounts.map((account) => {
                  const allocationsCount = account.movements.filter(
                    (movement) => movement.movementType === 'ALLOCATION_DEBIT',
                  ).length;

                  return (
                    <article
                      key={account.id}
                      className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold">{account.accountLabel}</h3>
                            <StatusPill label={account.bankName} />
                            <StatusPill
                              label={getFinancialAccountTypeLabel(account.accountType)}
                              tone="success"
                            />
                          </div>

                          <div className="grid gap-3 text-sm text-[var(--color-muted)] md:grid-cols-2">
                            <p>
                              <span className="font-semibold text-[var(--color-ink)]">
                                Banco:
                              </span>{' '}
                              {account.bankName}
                            </p>
                            <p>
                              <span className="font-semibold text-[var(--color-ink)]">
                                Tipo:
                              </span>{' '}
                              {getFinancialAccountTypeLabel(account.accountType)}
                            </p>
                            <p>
                              <span className="font-semibold text-[var(--color-ink)]">
                                Identificador:
                              </span>{' '}
                              {account.accountMask || 'Sin mascara'}
                            </p>
                            <p>
                              <span className="font-semibold text-[var(--color-ink)]">
                                Asignaciones hechas:
                              </span>{' '}
                              {allocationsCount}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] px-4 py-3 text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                            Saldo
                          </p>
                          <p className="mt-2 text-2xl font-bold text-[var(--color-brand-deep)]">
                            {formatCurrency(account.balance)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">
                  No hay cuentas creadas. Empieza registrando la cuenta o billetera
                  donde recibes tus ingresos.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Trazabilidad"
            subtitle="El detalle de ingresos y asignaciones ahora se consulta en el registro general."
          >
            <div className="space-y-4 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-5">
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                La lista de bancos fue movida a <strong>Configuracion</strong> y
                los movimientos detallados ya no se duplican aqui. Todo el
                historial consolidado se consulta en <strong>Registro general</strong>.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Cuentas con saldo
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--color-brand-deep)]">
                    {accounts.filter((account) => account.balance > 0).length}
                  </p>
                </div>
                <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Consulta centralizada
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-brand-deep)]">
                    Registro general
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <Modal
        open={accountModalOpen}
        title="Nueva cuenta de ingreso"
        onClose={() => setAccountModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitAccount}>
          <label className="space-y-2 text-sm">
            <span className="font-semibold">Banco</span>
            <select
              value={accountForm.bankName}
              onChange={(event) =>
                setAccountForm((current) => ({
                  ...current,
                  bankName: event.target.value as AccountFormState['bankName'],
                }))
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
            >
              {COLOMBIA_BANK_OPTIONS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Nombre interno</span>
              <input
                value={accountForm.accountLabel}
                onChange={(event) =>
                  setAccountForm((current) => ({
                    ...current,
                    accountLabel: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="Cuenta sueldo principal"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Tipo</span>
              <select
                value={accountForm.accountType}
                onChange={(event) =>
                  setAccountForm((current) => ({
                    ...current,
                    accountType: event.target.value as FinancialAccountType,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                {accountTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {getFinancialAccountTypeLabel(type)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Mascara o ultimos digitos</span>
            <input
              value={accountForm.accountMask}
              onChange={(event) =>
                setAccountForm((current) => ({
                  ...current,
                  accountMask: event.target.value,
                }))
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              placeholder="4589"
            />
          </label>

          {accountError ? (
            <p className="text-sm text-[var(--color-danger)]">{accountError}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createAccountMutation.isPending}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createAccountMutation.isPending ? 'Guardando...' : 'Guardar cuenta'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={incomeModalOpen}
        title="Registrar ingreso"
        onClose={() => setIncomeModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitIncome}>
          <label className="space-y-2 text-sm">
            <span className="font-semibold">Cuenta destino</span>
            <select
              value={incomeForm.accountId}
              onChange={(event) =>
                setIncomeForm((current) => ({
                  ...current,
                  accountId: event.target.value,
                }))
              }
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              required
            >
              <option value="">Selecciona una cuenta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountLabel} / {account.bankName} / Disponible{' '}
                  {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Categoria</span>
              <select
                value={incomeForm.category}
                onChange={(event) =>
                  setIncomeForm((current) => ({
                    ...current,
                    category: event.target.value as IncomeFormState['category'],
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                {incomeCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Monto</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={incomeForm.amount}
                onChange={(event) =>
                  setIncomeForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="2500000"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Fecha y hora</span>
              <input
                type="datetime-local"
                value={incomeForm.occurredAt}
                onChange={(event) =>
                  setIncomeForm((current) => ({
                    ...current,
                    occurredAt: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Detalle</span>
              <input
                value={incomeForm.sourceLabel}
                onChange={(event) =>
                  setIncomeForm((current) => ({
                    ...current,
                    sourceLabel: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="Nomina abril / Venta externa"
              />
            </label>
          </div>

          {incomeError ? (
            <p className="text-sm text-[var(--color-danger)]">{incomeError}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createIncomeMutation.isPending}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createIncomeMutation.isPending ? 'Guardando...' : 'Guardar ingreso'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
