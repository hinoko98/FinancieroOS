export type ManagedUserRole = 'ADMIN' | 'MANAGER' | 'ANALYST' | 'OPERATOR';
export type ManagedUserStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type ManagedUser = {
  id: string;
  username: string;
  email: string | null;
  emailVerifiedAt: string | null;
  emailVerificationExpiresAt: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalId: string;
  birthDate: string;
  role: ManagedUserRole;
  status: ManagedUserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const ADMIN_USERS_QUERY_KEY = ['admin-users'];
export const ADMIN_OVERVIEW_QUERY_KEY = ['admin-overview'];
export const ADMIN_FINANCE_STRUCTURE_QUERY_KEY = ['admin-finance-structure'];

export type AdminOverview = {
  totals: {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    newUsersLast30Days: number;
    totalEntities: number;
    totalSharedRelations: number;
    totalFinancialAccounts: number;
    totalIncomes: number;
    totalAllocations: number;
    totalPayments: number;
    auditLogsLast24Hours: number;
  };
  recentLogins: {
    id: string;
    loggedInAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    user: {
      id: string;
      username: string;
      fullName: string;
      role: ManagedUserRole;
    };
  }[];
};

export type AdminFinancialPeriod = {
  id: string;
  year: number;
  month: number;
  label: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  startsAt: string;
  endsAt: string;
};

export type AdminFinancialSubcategory = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export type AdminFinancialCategory = {
  id: string;
  direction: 'INCOME' | 'EXPENSE';
  name: string;
  description: string | null;
  createdAt: string;
  subcategories: AdminFinancialSubcategory[];
};

export type AdminFinanceStructure = {
  summary: {
    periodsCount: number;
    categoriesCount: number;
    subcategoriesCount: number;
    incomeCategoriesCount: number;
    expenseCategoriesCount: number;
    classifiedMovementsCount: number;
  };
  periods: AdminFinancialPeriod[];
  categories: AdminFinancialCategory[];
};

export function getManagedUserRoleLabel(role: ManagedUserRole) {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'MANAGER':
      return 'Gestor';
    case 'ANALYST':
      return 'Analista';
    case 'OPERATOR':
      return 'Operador';
  }
}

export function getManagedUserStatusLabel(status: ManagedUserStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'Activo';
    case 'INACTIVE':
      return 'Inactivo';
    case 'ARCHIVED':
      return 'Archivado';
  }
}

export function getAdminFinancialDirectionLabel(
  direction: AdminFinancialCategory['direction'],
) {
  switch (direction) {
    case 'INCOME':
      return 'Ingreso';
    case 'EXPENSE':
      return 'Egreso';
  }
}
