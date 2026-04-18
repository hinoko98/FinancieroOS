'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';
import { extractApiErrorMessage } from '@/features/entities/lib/entities';
import {
  FINANCE_CATALOG_QUERY_KEY,
  getFinancialPeriodStatusLabel,
} from '@/features/finance/lib/finance';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import {
  ADMIN_FINANCE_STRUCTURE_QUERY_KEY,
  getAdminFinancialDirectionLabel,
  type AdminFinanceStructure,
} from '@/features/admin/lib/admin';

const periodStatusOptions = ['OPEN', 'CLOSED', 'ARCHIVED'] as const;
const directionOptions = ['INCOME', 'EXPENSE'] as const;

export function AdminFinanceStructureWorkspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [periodForm, setPeriodForm] = useState({
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1),
    status: 'OPEN' as (typeof periodStatusOptions)[number],
  });
  const [categoryForm, setCategoryForm] = useState({
    direction: 'INCOME' as (typeof directionOptions)[number],
    name: '',
    description: '',
  });
  const [subcategoryForm, setSubcategoryForm] = useState({
    categoryId: '',
    name: '',
    description: '',
  });
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [subcategoryError, setSubcategoryError] = useState<string | null>(null);

  const structureQuery = useQuery({
    queryKey: ADMIN_FINANCE_STRUCTURE_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<AdminFinanceStructure>(
        '/admin/finance-structure',
      );
      return response.data;
    },
    enabled: user?.role === 'ADMIN',
    staleTime: 30_000,
  });

  const createPeriodMutation = useMutation({
    mutationFn: async (payload: {
      year: number;
      month: number;
      status: (typeof periodStatusOptions)[number];
    }) => {
      await apiClient.post('/admin/financial-periods', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_FINANCE_STRUCTURE_QUERY_KEY,
      });
      await queryClient.invalidateQueries({
        queryKey: FINANCE_CATALOG_QUERY_KEY,
      });
      setPeriodError(null);
    },
    onError: (error) => {
      setPeriodError(extractApiErrorMessage(error));
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (payload: {
      direction: (typeof directionOptions)[number];
      name: string;
      description?: string;
    }) => {
      await apiClient.post('/admin/financial-categories', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_FINANCE_STRUCTURE_QUERY_KEY,
      });
      await queryClient.invalidateQueries({
        queryKey: FINANCE_CATALOG_QUERY_KEY,
      });
      setCategoryForm({
        direction: 'INCOME',
        name: '',
        description: '',
      });
      setCategoryError(null);
    },
    onError: (error) => {
      setCategoryError(extractApiErrorMessage(error));
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: async (payload: {
      categoryId: string;
      name: string;
      description?: string;
    }) => {
      await apiClient.post('/admin/financial-subcategories', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_FINANCE_STRUCTURE_QUERY_KEY,
      });
      await queryClient.invalidateQueries({
        queryKey: FINANCE_CATALOG_QUERY_KEY,
      });
      setSubcategoryForm((current) => ({
        ...current,
        name: '',
        description: '',
      }));
      setSubcategoryError(null);
    },
    onError: (error) => {
      setSubcategoryError(extractApiErrorMessage(error));
    },
  });

  const categories = useMemo(
    () => structureQuery.data?.categories ?? [],
    [structureQuery.data?.categories],
  );

  const incomeCategories = useMemo(
    () => categories.filter((category) => category.direction === 'INCOME'),
    [categories],
  );

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.direction === 'EXPENSE'),
    [categories],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeZone: 'America/Bogota',
      }),
    [],
  );

  if (user?.role !== 'ADMIN') {
    return (
      <SectionCard
        title="Estructura financiera"
        subtitle="Acceso restringido al rol administrador."
      >
        <p className="text-sm text-[var(--color-danger)]">
          Tu usuario no tiene permisos para administrar la estructura financiera.
        </p>
      </SectionCard>
    );
  }

  if (structureQuery.isLoading) {
    return (
      <SectionCard
        title="Estructura financiera"
        subtitle="Cargando periodos y catalogo contable."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (structureQuery.isError || !structureQuery.data) {
    return (
      <SectionCard
        title="Estructura financiera"
        subtitle="No fue posible cargar la base contable."
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-danger)]">
            {extractApiErrorMessage(structureQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => structureQuery.refetch()}
            className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  const { summary, periods } = structureQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estructura financiera"
        description="Base inicial de la fase 1 para organizar periodos mensuales, categorias, subcategorias e ingresos y egresos tipificados."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 shadow-[var(--shadow-panel)]">
          <p className="text-sm text-[var(--color-muted)]">Periodos creados</p>
          <p className="mt-3 text-3xl font-bold">{summary.periodsCount}</p>
        </div>
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 shadow-[var(--shadow-panel)]">
          <p className="text-sm text-[var(--color-muted)]">Categorias</p>
          <p className="mt-3 text-3xl font-bold">{summary.categoriesCount}</p>
        </div>
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 shadow-[var(--shadow-panel)]">
          <p className="text-sm text-[var(--color-muted)]">Subcategorias</p>
          <p className="mt-3 text-3xl font-bold">{summary.subcategoriesCount}</p>
        </div>
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 shadow-[var(--shadow-panel)]">
          <p className="text-sm text-[var(--color-muted)]">Movimientos registrados</p>
          <p className="mt-3 text-3xl font-bold">{summary.classifiedMovementsCount}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Nuevo periodo"
          subtitle="Crea periodos mensuales para cierres, conciliacion y presupuestos."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setPeriodError(null);
              createPeriodMutation.mutate({
                year: Number(periodForm.year),
                month: Number(periodForm.month),
                status: periodForm.status,
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-semibold">Ano</span>
                <input
                  type="number"
                  min="2000"
                  value={periodForm.year}
                  onChange={(event) =>
                    setPeriodForm((current) => ({
                      ...current,
                      year: event.target.value,
                    }))
                  }
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                  required
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-semibold">Mes</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={periodForm.month}
                  onChange={(event) =>
                    setPeriodForm((current) => ({
                      ...current,
                      month: event.target.value,
                    }))
                  }
                  className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                  required
                />
              </label>
            </div>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Estado</span>
              <select
                value={periodForm.status}
                onChange={(event) =>
                  setPeriodForm((current) => ({
                    ...current,
                    status: event.target.value as (typeof periodStatusOptions)[number],
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                {periodStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getFinancialPeriodStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            {periodError ? (
              <p className="text-sm text-[var(--color-danger)]">{periodError}</p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createPeriodMutation.isPending}
                className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createPeriodMutation.isPending ? 'Guardando...' : 'Crear periodo'}
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Nueva categoria"
          subtitle="Define si pertenece a ingresos o egresos tipificados."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setCategoryError(null);
              createCategoryMutation.mutate({
                direction: categoryForm.direction,
                name: categoryForm.name,
                description: categoryForm.description || undefined,
              });
            }}
          >
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Tipo</span>
              <select
                value={categoryForm.direction}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    direction: event.target.value as (typeof directionOptions)[number],
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                {directionOptions.map((direction) => (
                  <option key={direction} value={direction}>
                    {getAdminFinancialDirectionLabel(direction)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Nombre</span>
              <input
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="Sueldo / Servicios / Impuestos"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Descripcion</span>
              <textarea
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-28 w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="Uso esperado para reportes y clasificacion contable."
              />
            </label>

            {categoryError ? (
              <p className="text-sm text-[var(--color-danger)]">{categoryError}</p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createCategoryMutation.isPending}
                className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createCategoryMutation.isPending ? 'Guardando...' : 'Crear categoria'}
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Nueva subcategoria"
          subtitle="Desglosa la categoria para reportes mas finos."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubcategoryError(null);
              createSubcategoryMutation.mutate({
                categoryId: subcategoryForm.categoryId,
                name: subcategoryForm.name,
                description: subcategoryForm.description || undefined,
              });
            }}
          >
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Categoria madre</span>
              <select
                value={subcategoryForm.categoryId}
                onChange={(event) =>
                  setSubcategoryForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                required
              >
                <option value="">Selecciona una categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({getAdminFinancialDirectionLabel(category.direction)})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Nombre</span>
              <input
                value={subcategoryForm.name}
                onChange={(event) =>
                  setSubcategoryForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="Nomina fija / Comisiones / Arriendos"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Descripcion</span>
              <textarea
                value={subcategoryForm.description}
                onChange={(event) =>
                  setSubcategoryForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-28 w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="Detalle para reportes, presupuesto y flujo de caja."
              />
            </label>

            {subcategoryError ? (
              <p className="text-sm text-[var(--color-danger)]">{subcategoryError}</p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createSubcategoryMutation.isPending}
                className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createSubcategoryMutation.isPending
                  ? 'Guardando...'
                  : 'Crear subcategoria'}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Periodos mensuales"
          subtitle="Ventana inicial para cierres y conciliacion."
        >
          <div className="space-y-3">
            {periods.length ? (
              periods.map((period) => (
                <article
                  key={period.id}
                  className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">{period.label}</h3>
                        <StatusPill label={getFinancialPeriodStatusLabel(period.status)} />
                      </div>
                      <p className="text-sm text-[var(--color-muted)]">
                        Desde {dateFormatter.format(new Date(period.startsAt))} hasta{' '}
                        {dateFormatter.format(new Date(period.endsAt))}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-brand-deep)]">
                      {period.month}/{period.year}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-muted)]">
                Aun no hay periodos creados.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Catalogo financiero"
          subtitle="Clasificacion base para ingresos, egresos y reporteria futura."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            {[{ title: 'Ingresos', items: incomeCategories }, { title: 'Egresos', items: expenseCategories }].map(
              (group) => (
                <div key={group.title} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{group.title}</h3>
                    <StatusPill label={`${group.items.length} categorias`} />
                  </div>

                  {group.items.length ? (
                    group.items.map((category) => (
                      <article
                        key={category.id}
                        className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white p-4"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold">{category.name}</h4>
                            <StatusPill
                              label={getAdminFinancialDirectionLabel(category.direction)}
                              tone={category.direction === 'INCOME' ? 'success' : 'warning'}
                            />
                          </div>
                          {category.description ? (
                            <p className="text-sm text-[var(--color-muted)]">
                              {category.description}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            {category.subcategories.length ? (
                              category.subcategories.map((subcategory) => (
                                <span
                                  key={subcategory.id}
                                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-deep)]"
                                >
                                  {subcategory.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-[var(--color-muted)]">
                                Sin subcategorias.
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] bg-white p-4 text-sm text-[var(--color-muted)]">
                      No hay categorias en este grupo.
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
