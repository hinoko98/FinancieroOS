'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarClock,
  Eye,
  FolderPlus,
  HandCoins,
  History,
  Pencil,
  PlusCircle,
  ReceiptText,
  Search,
  UserRound,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { SectionCard } from '@/components/ui/section-card';
import { StatusPill } from '@/components/ui/status-pill';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-provider';
import {
  ENTITIES_QUERY_KEY,
  extractApiErrorMessage,
  formatCurrency,
  formatDateTime,
  getEntityHistory,
  getEntityAccessLabel,
  toDateTimeLocalValue,
  type Entity,
  type EntityHistoryEntry,
  type EntityItem,
} from '../lib/entities';

type HistoryRange = '1m' | '3m' | '6m' | '1y' | 'all';
type HistoryMovementType = 'all' | 'allocation' | 'payment';
type EditableMovement =
  | {
      movementType: 'allocation';
      id: string;
      label: string;
    }
  | {
      movementType: 'payment';
      id: string;
      label: string;
      serviceId: string;
    };

function getRangeStartDate(range: HistoryRange) {
  if (range === 'all') {
    return null;
  }

  const date = new Date();

  if (range === '1m') {
    date.setMonth(date.getMonth() - 1);
    return date;
  }

  if (range === '3m') {
    date.setMonth(date.getMonth() - 3);
    return date;
  }

  if (range === '6m') {
    date.setMonth(date.getMonth() - 6);
    return date;
  }

  date.setFullYear(date.getFullYear() - 1);
  return date;
}

function matchesSearch(entry: EntityHistoryEntry, search: string) {
  if (!search.trim()) {
    return true;
  }

  const normalizedSearch = search.trim().toLowerCase();

  return [
    entry.label,
    entry.secondaryLabel,
    entry.serviceName,
    entry.performedBy.fullName,
    entry.performedBy.username,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedSearch));
}

export function EntityDetailWorkspace({ entityId }: { entityId: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [serviceHistoryModalOpen, setServiceHistoryModalOpen] = useState(false);
  const [entityHistoryModalOpen, setEntityHistoryModalOpen] = useState(false);
  const [movementEditorOpen, setMovementEditorOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [editingMovement, setEditingMovement] = useState<EditableMovement | null>(
    null,
  );
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    paymentReference: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    itemId: '',
    itemName: '',
    amount: '',
    occurredAt: '',
  });
  const [allocationForm, setAllocationForm] = useState({
    amount: '',
    occurredAt: '',
    sourceLabel: '',
  });
  const [movementForm, setMovementForm] = useState({
    amount: '',
    occurredAt: '',
    sourceLabel: '',
  });
  const [historyFilters, setHistoryFilters] = useState({
    range: 'all' as HistoryRange,
    movementType: 'all' as HistoryMovementType,
    serviceId: 'all',
    performedById: 'all',
    search: '',
  });

  const entitiesQuery = useQuery({
    queryKey: ENTITIES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<Entity[]>('/entities');
      return response.data;
    },
    enabled: Boolean(user),
  });

  const entity = useMemo(
    () => entitiesQuery.data?.find((current) => current.id === entityId) ?? null,
    [entitiesQuery.data, entityId],
  );

  const selectedService = useMemo(
    () =>
      entity?.items.find((currentItem) => currentItem.id === selectedServiceId) ??
      null,
    [entity, selectedServiceId],
  );

  const createServiceMutation = useMutation({
    mutationFn: async (payload: { name: string; paymentReference?: string }) => {
      await apiClient.post(`/entities/${entityId}/items`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
      setServiceForm({ name: '', paymentReference: '' });
      setServiceError(null);
      setServiceModalOpen(false);
    },
    onError: (error) => {
      setServiceError(extractApiErrorMessage(error));
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payload: { itemId: string; amount: number; occurredAt?: string }) => {
      await apiClient.post(`/entities/items/${payload.itemId}/records`, {
        amount: payload.amount,
        occurredAt: payload.occurredAt,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
      setPaymentForm({
        itemId: '',
        itemName: '',
        amount: '',
        occurredAt: '',
      });
      setPaymentError(null);
      setPaymentModalOpen(false);
    },
    onError: (error) => {
      setPaymentError(extractApiErrorMessage(error));
    },
  });

  const createAllocationMutation = useMutation({
    mutationFn: async (payload: {
      amount: number;
      occurredAt?: string;
      sourceLabel?: string;
    }) => {
      await apiClient.post(`/entities/${entityId}/allocations`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
      setAllocationForm({
        amount: '',
        occurredAt: '',
        sourceLabel: '',
      });
      setAllocationError(null);
      setAllocationModalOpen(false);
    },
    onError: (error) => {
      setAllocationError(extractApiErrorMessage(error));
    },
  });

  const updateMovementMutation = useMutation({
    mutationFn: async (payload: {
      movement: EditableMovement;
      amount: number;
      occurredAt?: string;
      sourceLabel?: string;
    }) => {
      if (payload.movement.movementType === 'allocation') {
        await apiClient.patch(`/entities/allocations/${payload.movement.id}`, {
          amount: payload.amount,
          occurredAt: payload.occurredAt,
          sourceLabel: payload.sourceLabel ?? '',
        });
        return;
      }

      await apiClient.patch(`/entities/records/${payload.movement.id}`, {
        amount: payload.amount,
        occurredAt: payload.occurredAt,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ENTITIES_QUERY_KEY });
      setMovementForm({
        amount: '',
        occurredAt: '',
        sourceLabel: '',
      });
      setMovementError(null);
      setEditingMovement(null);
      setMovementEditorOpen(false);
    },
    onError: (error) => {
      setMovementError(extractApiErrorMessage(error));
    },
  });

  const openPaymentModal = (item: EntityItem) => {
    setPaymentError(null);
    setPaymentForm({
      itemId: item.id,
      itemName: item.name,
      amount: '',
      occurredAt: toDateTimeLocalValue(new Date()),
    });
    setPaymentModalOpen(true);
  };

  const openServiceHistoryModal = (item: EntityItem) => {
    setSelectedServiceId(item.id);
    setServiceHistoryModalOpen(true);
  };

  const openAllocationEditor = (entry: EntityHistoryEntry) => {
    if (entry.movementType !== 'allocation') {
      return;
    }

    setMovementError(null);
    setEditingMovement({
      movementType: 'allocation',
      id: entry.id,
      label: entry.label,
    });
    setMovementForm({
      amount: entry.creditAmount.toString(),
      occurredAt: toDateTimeLocalValue(new Date(entry.occurredAt)),
      sourceLabel: entry.label === 'Asignacion de fondos' ? '' : entry.label,
    });
    setMovementEditorOpen(true);
  };

  const openPaymentEditor = (record: {
    id: string;
    amount: number;
    occurredAt: string;
  }, item: EntityItem) => {
    setMovementError(null);
    setEditingMovement({
      movementType: 'payment',
      id: record.id,
      label: item.name,
      serviceId: item.id,
    });
    setMovementForm({
      amount: record.amount.toString(),
      occurredAt: toDateTimeLocalValue(new Date(record.occurredAt)),
      sourceLabel: '',
    });
    setMovementEditorOpen(true);
  };

  const openPaymentEditorFromHistory = (entry: EntityHistoryEntry) => {
    if (entry.movementType !== 'payment' || !entry.serviceId || !entity) {
      return;
    }

    const item = entity.items.find((currentItem) => currentItem.id === entry.serviceId);

    if (!item) {
      return;
    }

    openPaymentEditor(
      {
        id: entry.id,
        amount: entry.debitAmount,
        occurredAt: entry.occurredAt,
      },
      item,
    );
  };

  const submitService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServiceError(null);
    createServiceMutation.mutate({
      name: serviceForm.name,
      paymentReference: serviceForm.paymentReference || undefined,
    });
  };

  const submitPayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPaymentError(null);
    createPaymentMutation.mutate({
      itemId: paymentForm.itemId,
      amount: Number(paymentForm.amount),
      occurredAt: paymentForm.occurredAt
        ? new Date(paymentForm.occurredAt).toISOString()
        : undefined,
    });
  };

  const submitAllocation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAllocationError(null);
    createAllocationMutation.mutate({
      amount: Number(allocationForm.amount),
      occurredAt: allocationForm.occurredAt
        ? new Date(allocationForm.occurredAt).toISOString()
        : undefined,
      sourceLabel: allocationForm.sourceLabel || undefined,
    });
  };

  const submitMovementUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingMovement) {
      return;
    }

    setMovementError(null);
    updateMovementMutation.mutate({
      movement: editingMovement,
      amount: Number(movementForm.amount),
      occurredAt: movementForm.occurredAt
        ? new Date(movementForm.occurredAt).toISOString()
        : undefined,
      sourceLabel:
        editingMovement.movementType === 'allocation'
          ? movementForm.sourceLabel
          : undefined,
    });
  };

  const deferredHistorySearch = useDeferredValue(historyFilters.search);

  const historyEntries = useMemo(
    () => (entity ? getEntityHistory(entity) : []),
    [entity],
  );

  const filteredHistoryEntries = useMemo(() => {
    const rangeStartDate = getRangeStartDate(historyFilters.range);

    return historyEntries.filter((entry) => {
      const occurredAtDate = new Date(entry.occurredAt);

      if (rangeStartDate && occurredAtDate < rangeStartDate) {
        return false;
      }

      if (
        historyFilters.movementType !== 'all' &&
        entry.movementType !== historyFilters.movementType
      ) {
        return false;
      }

      if (
        historyFilters.serviceId !== 'all' &&
        entry.serviceId !== historyFilters.serviceId
      ) {
        return false;
      }

      if (
        historyFilters.performedById !== 'all' &&
        entry.performedBy.id !== historyFilters.performedById
      ) {
        return false;
      }

      return matchesSearch(entry, deferredHistorySearch);
    });
  }, [
    deferredHistorySearch,
    historyEntries,
    historyFilters.movementType,
    historyFilters.performedById,
    historyFilters.range,
    historyFilters.serviceId,
  ]);

  const historyStats = useMemo(
    () =>
      filteredHistoryEntries.reduce(
        (accumulator, entry) => ({
          creditAmount: accumulator.creditAmount + entry.creditAmount,
          debitAmount: accumulator.debitAmount + entry.debitAmount,
        }),
        { creditAmount: 0, debitAmount: 0 },
      ),
    [filteredHistoryEntries],
  );

  const serviceHistoryRecords = useMemo(
    () =>
      [...(selectedService?.records ?? [])].sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
      ),
    [selectedService],
  );

  const historyResponsibleOptions = useMemo(() => {
    const responsibleMap = new Map<string, { id: string; fullName: string }>();

    for (const entry of historyEntries) {
      responsibleMap.set(entry.performedBy.id, {
        id: entry.performedBy.id,
        fullName: entry.performedBy.fullName,
      });
    }

    return [...responsibleMap.values()];
  }, [historyEntries]);

  if (entitiesQuery.isLoading) {
    return (
      <SectionCard
        title="Entidad"
        subtitle="Cargando informacion detallada de la entidad."
      >
        <p className="text-sm text-[var(--color-muted)]">Cargando informacion...</p>
      </SectionCard>
    );
  }

  if (entitiesQuery.isError) {
    return (
      <SectionCard
        title="Entidad"
        subtitle="No fue posible cargar la entidad seleccionada."
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-danger)]">
            {extractApiErrorMessage(entitiesQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => entitiesQuery.refetch()}
            className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  if (!entity) {
    return (
      <SectionCard
        title="Entidad no encontrada"
        subtitle="La entidad solicitada no existe o ya no esta disponible."
      >
        <Link
          href="/entidades"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
        >
          Volver a entidades
        </Link>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{entity.name}</h2>
            <StatusPill
              label={getEntityAccessLabel(entity.accessLevel)}
              tone={entity.accessLevel === 'OWNER' ? 'success' : 'neutral'}
            />
          </div>
          <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
            {entity.description ??
              'Esta entidad agrupa los servicios y pagos asociados a este control.'}
          </p>
          {!entity.isOwner && entity.sharedBy ? (
            <p className="text-sm text-[var(--color-muted)]">
              Compartido por{' '}
              <span className="font-semibold text-[var(--color-brand-deep)]">
                {entity.sharedBy.fullName}
              </span>{' '}
              @{entity.sharedBy.username}
            </p>
          ) : null}
          {!entity.canEdit ? (
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-sm text-[var(--color-muted)]">
              Tienes acceso de solo lectura. Puedes revisar servicios, historial y
              movimientos, pero no crear ni editar registros.
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {entity.canEdit ? (
            <button
              type="button"
              onClick={() => {
                setAllocationError(null);
                setAllocationForm({
                  amount: '',
                  occurredAt: toDateTimeLocalValue(new Date()),
                  sourceLabel: '',
                });
                setAllocationModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)]"
            >
              <HandCoins className="h-4 w-4" />
              Asignar dinero
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setEntityHistoryModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)]"
          >
            <History className="h-4 w-4" />
            Ver historial
          </button>
          {entity.canEdit ? (
            <button
              type="button"
              onClick={() => {
                setServiceError(null);
                setServiceModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
            >
              <FolderPlus className="h-4 w-4" />
              Nuevo servicio
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Servicios activos</p>
          <p className="mt-3 text-3xl font-bold">{entity.itemsCount}</p>
        </div>
        <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Dinero asignado</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-brand-deep)]">
            {formatCurrency(entity.assignedAmount)}
          </p>
        </div>
        <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Valor total gastado</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-success)]">
            {formatCurrency(entity.spentAmount)}
          </p>
        </div>
        <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Saldo disponible</p>
          <p className="mt-3 text-2xl font-bold text-[var(--color-brand)]">
            {formatCurrency(entity.availableBalance)}
          </p>
        </div>
      </div>

      {entity.items.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {entity.items.map((item) => (
            <SectionCard
              key={item.id}
              title={item.name}
              subtitle={
                item.paymentReference
                  ? `Referencia ${item.paymentReference}`
                  : 'Sin referencia de pago'
              }
            >
              <div className="space-y-5">
                <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--color-line)] bg-white p-5 md:flex-row md:items-center md:justify-between">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-[var(--color-muted)]">Pagos</p>
                      <p className="mt-1 text-xl font-bold">{item.recordsCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-muted)]">Ultimo pago</p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatDateTime(item.latestRecordAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-muted)]">Total pagado</p>
                      <p className="mt-1 text-xl font-bold text-[var(--color-success)]">
                        {formatCurrency(item.totalValue)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openServiceHistoryModal(item)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-deep)]"
                    >
                      <Eye className="h-4 w-4" />
                      Historial
                    </button>
                    {entity.canEdit ? (
                      <button
                        type="button"
                        onClick={() => openPaymentModal(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-5 py-3 text-sm font-semibold text-[var(--color-brand-deep)]"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Registrar pago
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  {item.records.length ? (
                    [...item.records]
                      .sort(
                        (left, right) =>
                          new Date(right.occurredAt).getTime() -
                          new Date(left.occurredAt).getTime(),
                      )
                      .slice(0, 3)
                      .map((record) => (
                      <article
                        key={record.id}
                        className="rounded-2xl border border-[var(--color-line)] bg-white p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="rounded-2xl bg-[var(--color-brand-soft)] p-3 text-[var(--color-brand-deep)]">
                                <ReceiptText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-lg font-bold text-[var(--color-success)]">
                                  {formatCurrency(record.amount)}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                  <span className="inline-flex items-center gap-2">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    {formatDateTime(record.occurredAt)}
                                  </span>
                                  <span className="inline-flex items-center gap-2">
                                    <UserRound className="h-3.5 w-3.5" />
                                    {record.performedBy.fullName}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="max-w-sm text-sm text-[var(--color-muted)]">
                            Pago aplicado al servicio {item.name}.
                          </p>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-panel-strong)] p-4 text-sm text-[var(--color-muted)]">
                      Aun no hay pagos registrados para este servicio.
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <SectionCard
          title="Sin servicios"
          subtitle="Empieza agregando el primer servicio de esta entidad."
        >
          <div className="flex flex-col gap-4 rounded-[24px] border border-dashed border-[var(--color-line)] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold">Agrega el primer servicio</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Ejemplos: Energia, Agua, Administracion, Celular, Peaje o Gas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setServiceError(null);
                setServiceModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white"
            >
              <FolderPlus className="h-4 w-4" />
              Crear servicio
            </button>
          </div>
        </SectionCard>
      )}

      <Modal
        open={serviceModalOpen}
        title="Nuevo servicio"
        onClose={() => setServiceModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitService}>
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-sm">
            <span className="font-semibold">Entidad:</span> {entity.name}
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Nombre del servicio</span>
            <input
              value={serviceForm.name}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              placeholder="Energia local principal"
              required
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Codigo de pago o referencia</span>
            <input
              value={serviceForm.paymentReference}
              onChange={(event) =>
                setServiceForm((current) => ({
                  ...current,
                  paymentReference: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              placeholder="1643973"
            />
          </label>

          {serviceError ? (
            <p className="text-sm text-[var(--color-danger)]">{serviceError}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createServiceMutation.isPending}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createServiceMutation.isPending ? 'Guardando...' : 'Guardar servicio'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={paymentModalOpen}
        title="Registrar pago"
        onClose={() => setPaymentModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitPayment}>
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-sm">
            <span className="font-semibold">Servicio:</span> {paymentForm.itemName}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Valor</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.amount}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="185000"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Fecha y hora</span>
              <input
                type="datetime-local"
                value={paymentForm.occurredAt}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    occurredAt: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Realizado por</span>
            <input
              value={user?.fullName ?? ''}
              readOnly
              className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-[var(--color-muted)] outline-none"
            />
          </label>

          {paymentError ? (
            <p className="text-sm text-[var(--color-danger)]">{paymentError}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createPaymentMutation.isPending}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createPaymentMutation.isPending ? 'Registrando...' : 'Guardar pago'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={allocationModalOpen}
        title="Asignar dinero"
        onClose={() => setAllocationModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={submitAllocation}>
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-sm">
            <span className="font-semibold">Entidad:</span> {entity.name}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Valor asignado</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={allocationForm.amount}
                onChange={(event) =>
                  setAllocationForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="1000000"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Fecha y hora</span>
              <input
                type="datetime-local"
                value={allocationForm.occurredAt}
                onChange={(event) =>
                  setAllocationForm((current) => ({
                    ...current,
                    occurredAt: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Origen o detalle</span>
            <input
              value={allocationForm.sourceLabel}
              onChange={(event) =>
                setAllocationForm((current) => ({
                  ...current,
                  sourceLabel: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              placeholder="Retiro BBVA marzo"
            />
          </label>

          {allocationError ? (
            <p className="text-sm text-[var(--color-danger)]">{allocationError}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createAllocationMutation.isPending}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createAllocationMutation.isPending ? 'Guardando...' : 'Guardar asignacion'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={serviceHistoryModalOpen}
        title={selectedService ? `Historial de ${selectedService.name}` : 'Historial del servicio'}
        onClose={() => {
          setServiceHistoryModalOpen(false);
          setSelectedServiceId(null);
        }}
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-4">
              <p className="text-sm text-[var(--color-muted)]">Referencia</p>
              <p className="mt-2 text-lg font-bold">
                {selectedService?.paymentReference ?? 'Sin referencia'}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-4">
              <p className="text-sm text-[var(--color-muted)]">Pagos realizados</p>
              <p className="mt-2 text-lg font-bold">{selectedService?.recordsCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-4">
              <p className="text-sm text-[var(--color-muted)]">Total pagado</p>
              <p className="mt-2 text-lg font-bold text-[var(--color-success)]">
                {formatCurrency(selectedService?.totalValue ?? 0)}
              </p>
            </div>
          </div>

          {serviceHistoryRecords.length ? (
            <div className="overflow-hidden rounded-[24px] border border-[var(--color-line)]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead className="bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                    <tr className="text-sm">
                      <th className="px-5 py-4 font-semibold">Fecha</th>
                      <th className="px-5 py-4 font-semibold">Responsable</th>
                      <th className="px-5 py-4 font-semibold">Valor</th>
                      <th className="px-5 py-4 font-semibold">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--color-panel-strong)]">
                    {serviceHistoryRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="border-t border-[var(--color-line)]/40 text-sm"
                      >
                        <td className="px-5 py-4 text-[var(--color-muted)]">
                          {formatDateTime(record.occurredAt)}
                        </td>
                        <td className="px-5 py-4">{record.performedBy.fullName}</td>
                        <td className="px-5 py-4 font-bold text-[var(--color-success)]">
                          {formatCurrency(record.amount)}
                        </td>
                        <td className="px-5 py-4">
                          {selectedService && entity.canEdit ? (
                            <button
                              type="button"
                              onClick={() => openPaymentEditor(record, selectedService)}
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-semibold text-[var(--color-brand-deep)]"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </button>
                          ) : !entity.canEdit ? (
                            <span className="text-[var(--color-muted)]">Solo lectura</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 text-sm text-[var(--color-muted)]">
              Este servicio aun no tiene pagos registrados.
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={entityHistoryModalOpen}
        title="Historial de la entidad"
        onClose={() => setEntityHistoryModalOpen(false)}
        className="max-w-6xl"
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2 text-sm xl:col-span-2">
              <span className="font-semibold">Buscar</span>
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <Search className="h-4 w-4 text-[var(--color-muted)]" />
                <input
                  value={historyFilters.search}
                  onChange={(event) =>
                    setHistoryFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  className="w-full bg-transparent outline-none"
                  placeholder="Servicio, referencia, responsable u origen"
                />
              </div>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Periodo</span>
              <select
                value={historyFilters.range}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    range: event.target.value as HistoryRange,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                <option value="all">Todo</option>
                <option value="1m">Ultimo mes</option>
                <option value="3m">Ultimos 3 meses</option>
                <option value="6m">Ultimos 6 meses</option>
                <option value="1y">Ultimo ano</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Movimiento</span>
              <select
                value={historyFilters.movementType}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    movementType: event.target.value as HistoryMovementType,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                <option value="all">Todos</option>
                <option value="allocation">Asignaciones</option>
                <option value="payment">Pagos</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Servicio</span>
              <select
                value={historyFilters.serviceId}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    serviceId: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                <option value="all">Todos</option>
                {entity.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Responsable</span>
              <select
                value={historyFilters.performedById}
                onChange={(event) =>
                  setHistoryFilters((current) => ({
                    ...current,
                    performedById: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
              >
                <option value="all">Todos</option>
                {historyResponsibleOptions.map((responsible) => (
                  <option key={responsible.id} value={responsible.id}>
                    {responsible.fullName}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-4">
              <p className="text-sm text-[var(--color-muted)]">Asignado filtrado</p>
              <p className="mt-2 text-lg font-bold text-[var(--color-brand-deep)]">
                {formatCurrency(historyStats.creditAmount)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-4">
              <p className="text-sm text-[var(--color-muted)]">Pagado filtrado</p>
              <p className="mt-2 text-lg font-bold text-[var(--color-success)]">
                {formatCurrency(historyStats.debitAmount)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-4">
              <p className="text-sm text-[var(--color-muted)]">Saldo actual</p>
              <p className="mt-2 text-lg font-bold text-[var(--color-brand)]">
                {formatCurrency(entity.availableBalance)}
              </p>
            </div>
          </div>

          {filteredHistoryEntries.length ? (
            <div className="overflow-hidden rounded-[24px] border border-[var(--color-line)]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead className="bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                    <tr className="text-sm">
                      <th className="px-5 py-4 font-semibold">Fecha</th>
                      <th className="px-5 py-4 font-semibold">Movimiento</th>
                      <th className="px-5 py-4 font-semibold">Servicio / origen</th>
                      <th className="px-5 py-4 font-semibold">Responsable</th>
                      <th className="px-5 py-4 font-semibold">Debito</th>
                      <th className="px-5 py-4 font-semibold">Haber</th>
                      <th className="px-5 py-4 font-semibold">Saldo</th>
                      <th className="px-5 py-4 font-semibold">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--color-panel-strong)]">
                    {[...filteredHistoryEntries]
                      .sort(
                        (left, right) =>
                          new Date(left.occurredAt).getTime() -
                          new Date(right.occurredAt).getTime(),
                      )
                      .map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-t border-[var(--color-line)]/40 text-sm"
                        >
                          <td className="px-5 py-4 text-[var(--color-muted)]">
                            {formatDateTime(entry.occurredAt)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-2 font-semibold">
                              {entry.movementType === 'allocation' ? (
                                <BanknoteArrowUp className="h-4 w-4 text-[var(--color-brand)]" />
                              ) : (
                                <BanknoteArrowDown className="h-4 w-4 text-[var(--color-success)]" />
                              )}
                              {entry.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold">
                                {entry.serviceName ?? entry.secondaryLabel ?? 'Sin detalle'}
                              </p>
                              {entry.serviceName && entry.secondaryLabel ? (
                                <p className="mt-1 text-xs text-[var(--color-muted)]">
                                  {entry.secondaryLabel}
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-5 py-4">{entry.performedBy.fullName}</td>
                          <td className="px-5 py-4 font-semibold text-[var(--color-success)]">
                            {entry.debitAmount ? formatCurrency(entry.debitAmount) : '-'}
                          </td>
                          <td className="px-5 py-4 font-semibold text-[var(--color-brand-deep)]">
                            {entry.creditAmount ? formatCurrency(entry.creditAmount) : '-'}
                          </td>
                          <td className="px-5 py-4 font-bold">
                            {formatCurrency(entry.balanceAfter)}
                          </td>
                          <td className="px-5 py-4">
                            {entity.canEdit ? (
                              <button
                                type="button"
                                onClick={() =>
                                  entry.movementType === 'allocation'
                                    ? openAllocationEditor(entry)
                                    : openPaymentEditorFromHistory(entry)
                                }
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-semibold text-[var(--color-brand-deep)]"
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </button>
                            ) : (
                              <span className="text-[var(--color-muted)]">Solo lectura</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 text-sm text-[var(--color-muted)]">
              No hay movimientos para los filtros aplicados. Este historial separa
              asignaciones y pagos para seguir el saldo disponible.
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={movementEditorOpen}
        title={
          editingMovement?.movementType === 'allocation'
            ? 'Editar asignacion'
            : 'Editar pago'
        }
        onClose={() => {
          setMovementEditorOpen(false);
          setMovementError(null);
          setEditingMovement(null);
        }}
      >
        <form className="grid gap-4" onSubmit={submitMovementUpdate}>
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-sm">
            <span className="font-semibold">Movimiento:</span>{' '}
            {editingMovement?.label ?? 'Sin detalle'}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Valor</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={movementForm.amount}
                onChange={(event) =>
                  setMovementForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-semibold">Fecha y hora</span>
              <input
                type="datetime-local"
                value={movementForm.occurredAt}
                onChange={(event) =>
                  setMovementForm((current) => ({
                    ...current,
                    occurredAt: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                required
              />
            </label>
          </div>

          {editingMovement?.movementType === 'allocation' ? (
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Origen o detalle</span>
              <input
                value={movementForm.sourceLabel}
                onChange={(event) =>
                  setMovementForm((current) => ({
                    ...current,
                    sourceLabel: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 outline-none"
                placeholder="Retiro o fuente del dinero"
              />
            </label>
          ) : null}

          {movementError ? (
            <p className="text-sm text-[var(--color-danger)]">{movementError}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMovementMutation.isPending}
              className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateMovementMutation.isPending
                ? 'Guardando...'
                : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
