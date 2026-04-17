export type ManagedUserRole = 'ADMIN' | 'MANAGER' | 'ANALYST' | 'OPERATOR';
export type ManagedUserStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type ManagedUser = {
  id: string;
  username: string;
  email: string | null;
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
