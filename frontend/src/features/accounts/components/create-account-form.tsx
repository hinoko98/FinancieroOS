'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  accountFormSchema,
  type AccountFormInput,
  type AccountFormValues,
} from '../schemas/account-form.schema';

const accountTypes = [
  { value: 'CASH', label: 'Caja' },
  { value: 'BANK', label: 'Banco' },
  { value: 'MOBILE_WALLET', label: 'Billetera digital' },
  { value: 'SAVINGS', label: 'Ahorro' },
  { value: 'CREDIT', label: 'Crédito' },
  { value: 'OTHER', label: 'Otro' },
];

export function CreateAccountForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormInput, unknown, AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: '',
      type: 'BANK',
      initialBalance: 0,
      currency: 'COP',
      description: '',
    },
  });

  const onSubmit = async (values: AccountFormValues) => {
    console.log('Cuenta lista para enviar a API', values);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4 rounded-[28px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold">Nombre de la cuenta</span>
          <input
            {...register('name')}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none ring-0"
            placeholder="Ej. Banco principal"
          />
          {errors.name && <p className="text-xs text-rose-700">{errors.name.message}</p>}
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-semibold">Tipo</span>
          <select
            {...register('type')}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
          >
            {accountTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold">Saldo inicial</span>
          <input
            type="number"
            step="0.01"
            {...register('initialBalance')}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
          />
          {errors.initialBalance && (
            <p className="text-xs text-rose-700">{errors.initialBalance.message}</p>
          )}
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-semibold">Moneda</span>
          <input
            {...register('currency')}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 uppercase outline-none"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm">
        <span className="font-semibold">Descripción</span>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
          placeholder="Notas operativas, banco, responsable o uso principal."
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-fit rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        {isSubmitting ? 'Guardando...' : 'Registrar cuenta'}
      </button>
    </form>
  );
}
