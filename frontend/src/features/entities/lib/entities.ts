import { AxiosError } from 'axios';

const APP_TIME_ZONE = 'America/Bogota';

export type Performer = {
  id: string;
  username: string;
  fullName: string;
};

export type EntitySharePermission = 'VIEW' | 'EDIT' | 'MANAGE';
export type EntityAccessLevel = 'OWNER' | EntitySharePermission;

export type EntityShare = {
  id: string;
  permission: EntitySharePermission;
  createdAt: string;
  updatedAt: string;
  user: Performer;
  grantedBy: Performer;
};

export type EntityAllocation = {
  id: string;
  amount: number;
  sourceLabel: string | null;
  sourceAccount: {
    id: string;
    bankName: string;
    accountLabel: string;
    accountType: string;
  } | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  performedBy: Performer;
};

export type EntityRecord = {
  id: string;
  amount: number;
  occurredAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  period: {
    id: string;
    year: number;
    month: number;
    label: string;
    status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  } | null;
  financialCategory: {
    id: string;
    direction: 'INCOME' | 'EXPENSE';
    name: string;
  } | null;
  financialSubcategory: {
    id: string;
    name: string;
  } | null;
  performedBy: Performer;
};

export type EntityItem = {
  id: string;
  name: string;
  description: string | null;
  paymentReference: string | null;
  createdAt: string;
  updatedAt: string;
  totalValue: number;
  recordsCount: number;
  latestRecordAt: string | null;
  records: EntityRecord[];
};

export type Entity = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  accessLevel: EntityAccessLevel;
  isOwner: boolean;
  canEdit: boolean;
  canManageShares: boolean;
  sharedBy: Performer | null;
  shares: EntityShare[];
  allocationsCount: number;
  assignedAmount: number;
  spentAmount: number;
  availableBalance: number;
  itemsCount: number;
  recordsCount: number;
  totalValue: number;
  allocations: EntityAllocation[];
  items: EntityItem[];
};

export type EntityHistoryEntry = {
  id: string;
  movementType: 'allocation' | 'payment';
  occurredAt: string;
  createdAt: string;
  creditAmount: number;
  debitAmount: number;
  balanceAfter: number;
  label: string;
  secondaryLabel: string | null;
  classificationLabel: string | null;
  periodLabel: string | null;
  serviceId: string | null;
  serviceName: string | null;
  performedBy: Performer;
};

export const ENTITIES_QUERY_KEY = ['entities'];

export function getEntityAccessLabel(accessLevel: EntityAccessLevel) {
  switch (accessLevel) {
    case 'OWNER':
      return 'Propietario';
    case 'MANAGE':
      return 'Gestion';
    case 'EDIT':
      return 'Edicion';
    case 'VIEW':
      return 'Lectura';
  }
}

export function getEntitySharePermissionLabel(
  permission: EntitySharePermission,
) {
  switch (permission) {
    case 'MANAGE':
      return 'Gestion';
    case 'EDIT':
      return 'Edicion';
    case 'VIEW':
      return 'Lectura';
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return 'Sin registros';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

export function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function extractApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data;

    if (Array.isArray(payload?.message)) {
      return payload.message.join(', ');
    }

    if (typeof payload?.message === 'string') {
      return payload.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'No fue posible completar la operacion.';
}

export function summarizeEntities(entities: Entity[]) {
  return entities.reduce(
    (accumulator, entity) => ({
      entitiesCount: accumulator.entitiesCount + 1,
      itemsCount: accumulator.itemsCount + entity.itemsCount,
      recordsCount: accumulator.recordsCount + entity.recordsCount,
      totalAssigned: accumulator.totalAssigned + entity.assignedAmount,
      totalAvailable: accumulator.totalAvailable + entity.availableBalance,
      totalValue: accumulator.totalValue + entity.spentAmount,
    }),
    {
      entitiesCount: 0,
      itemsCount: 0,
      recordsCount: 0,
      totalAssigned: 0,
      totalAvailable: 0,
      totalValue: 0,
    },
  );
}

export function getRecentEntityRecords(entities: Entity[], limit = 6) {
  return entities
    .flatMap((entity) =>
      entity.items.flatMap((item) =>
        item.records.map((record) => ({
          ...record,
          entityId: entity.id,
          entityName: entity.name,
          itemId: item.id,
          itemName: item.name,
        })),
      ),
    )
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    )
    .slice(0, limit);
}

export function getEntityHistory(entity: Entity) {
  const entries = [
    ...entity.allocations.map((allocation) => ({
      id: allocation.id,
      movementType: 'allocation' as const,
      occurredAt: allocation.occurredAt,
      createdAt: allocation.createdAt,
      creditAmount: allocation.amount,
      debitAmount: 0,
      label: allocation.sourceLabel || 'Asignacion de fondos',
      secondaryLabel: allocation.sourceAccount
        ? `${allocation.sourceAccount.bankName} / ${allocation.sourceAccount.accountLabel}`
        : null,
      classificationLabel: null,
      periodLabel: null,
      serviceId: null,
      serviceName: null,
      performedBy: allocation.performedBy,
    })),
    ...entity.items.flatMap((item) =>
      item.records.map((record) => ({
        id: record.id,
        movementType: 'payment' as const,
        occurredAt: record.occurredAt,
        createdAt: record.createdAt,
        creditAmount: 0,
        debitAmount: record.amount,
        label: item.name,
        secondaryLabel: item.paymentReference,
        classificationLabel: record.financialSubcategory
          ? `${record.financialCategory?.name ?? 'Sin categoria'} / ${record.financialSubcategory.name}`
          : record.financialCategory?.name ?? null,
        periodLabel: record.period?.label ?? null,
        serviceId: item.id,
        serviceName: item.name,
        performedBy: record.performedBy,
      })),
    ),
  ].sort((left, right) => {
    const dateDifference =
      new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime();

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  let runningBalance = 0;

  return entries.map((entry) => {
    runningBalance += entry.creditAmount - entry.debitAmount;

    return {
      ...entry,
      balanceAfter: runningBalance,
    };
  });
}
