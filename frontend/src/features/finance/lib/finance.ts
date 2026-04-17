export type FinancialAccountType =
  | 'AHORROS'
  | 'CORRIENTE'
  | 'BILLETERA'
  | 'OTRO';

export type FinancialMovementType = 'INCOME' | 'ALLOCATION_DEBIT';

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

export const FINANCE_ACCOUNTS_QUERY_KEY = ['finance-accounts'];

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
