export type FinancialAccountType =
  | 'AHORROS'
  | 'CORRIENTE'
  | 'BILLETERA'
  | 'OTRO';

export type FinancialMovementType = 'INCOME' | 'ALLOCATION_DEBIT';
export type FinancialEntryDirection = 'INCOME' | 'EXPENSE';
export type FinancialPeriodStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';

export type FinancialPerformer = {
  id: string;
  username: string;
  fullName: string;
};

export type FinancialAccountMovement = {
  id: string;
  movementType: FinancialMovementType;
  category: string | null;
  amount: number;
  sourceLabel: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  performedBy: FinancialPerformer;
  period: {
    id: string;
    year: number;
    month: number;
    label: string;
    status: FinancialPeriodStatus;
  } | null;
  financialCategory: {
    id: string;
    direction: FinancialEntryDirection;
    name: string;
  } | null;
  financialSubcategory: {
    id: string;
    name: string;
  } | null;
  entityAllocation: {
    id: string;
    entityId: string;
    entityName: string;
  } | null;
};

export type FinancialAccount = {
  id: string;
  bankName: string;
  accountLabel: string;
  accountType: FinancialAccountType;
  accountMask: string | null;
  balance: number;
  createdAt: string;
  updatedAt: string;
  movements: FinancialAccountMovement[];
};

export type FinancialCatalogPeriod = {
  id: string;
  year: number;
  month: number;
  label: string;
  status: FinancialPeriodStatus;
  startsAt: string;
  endsAt: string;
};

export type FinancialCatalogSubcategory = {
  id: string;
  name: string;
  description: string | null;
};

export type FinancialCatalogCategory = {
  id: string;
  direction: FinancialEntryDirection;
  name: string;
  description: string | null;
  subcategories: FinancialCatalogSubcategory[];
};

export type FinancialCatalog = {
  banks: string[];
  periods: FinancialCatalogPeriod[];
  categories: FinancialCatalogCategory[];
};

export const FINANCE_ACCOUNTS_QUERY_KEY = ['finance-accounts'];
export const FINANCE_CATALOG_QUERY_KEY = ['finance-catalog'];

export function getFinancialAccountTypeLabel(type: FinancialAccountType) {
  switch (type) {
    case 'AHORROS':
      return 'Ahorros';
    case 'CORRIENTE':
      return 'Corriente';
    case 'BILLETERA':
      return 'Billetera';
    case 'OTRO':
      return 'Otra';
  }
}

export function getFinancialEntryDirectionLabel(direction: FinancialEntryDirection) {
  switch (direction) {
    case 'INCOME':
      return 'Ingreso';
    case 'EXPENSE':
      return 'Egreso';
  }
}

export function getFinancialPeriodStatusLabel(status: FinancialPeriodStatus) {
  switch (status) {
    case 'OPEN':
      return 'Abierto';
    case 'CLOSED':
      return 'Cerrado';
    case 'ARCHIVED':
      return 'Archivado';
  }
}
