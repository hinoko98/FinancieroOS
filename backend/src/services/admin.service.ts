import { RecordStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { HttpError } from '../lib/http-error';
import type { UpdateManagedUserInput } from '../lib/validation';
import { PrismaService } from '../lib/prisma';
import { AuditService } from './audit.service';

const managedUserSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  fullName: true,
  nationalId: true,
  birthDate: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAllUsers() {
    return this.prisma.user.findMany({
      select: managedUserSelect,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOverview() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      adminUsers,
      newUsersLast30Days,
      totalEntities,
      totalSharedRelations,
      totalFinancialAccounts,
      totalIncomesAggregate,
      totalAllocationsAggregate,
      totalPaymentsAggregate,
      auditLogsLast24Hours,
      recentLogins,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { status: RecordStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: last30Days } },
      }),
      this.prisma.trackingEntity.count(),
      this.prisma.trackingEntityShare.count(),
      this.prisma.financialAccount.count(),
      this.prisma.financialAccountMovement.aggregate({
        where: { movementType: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.trackingEntityAllocation.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.trackingEntityRecord.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.auditLog.count({
        where: { createdAt: { gte: last24Hours } },
      }),
      this.prisma.loginHistory.findMany({
        take: 6,
        orderBy: { loggedInAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      totals: {
        totalUsers,
        activeUsers,
        adminUsers,
        newUsersLast30Days,
        totalEntities,
        totalSharedRelations,
        totalFinancialAccounts,
        totalIncomes: Number(totalIncomesAggregate._sum.amount ?? 0),
        totalAllocations: Number(totalAllocationsAggregate._sum.amount ?? 0),
        totalPayments: Number(totalPaymentsAggregate._sum.amount ?? 0),
        auditLogsLast24Hours,
      },
      recentLogins: recentLogins.map((entry) => ({
        id: entry.id,
        loggedInAt: entry.loggedInAt,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        user: {
          id: entry.user.id,
          username: entry.user.username,
          fullName: entry.user.fullName,
          role: entry.user.role,
        },
      })),
    };
  }

  async updateUser(
    userId: string,
    dto: UpdateManagedUserInput,
    adminUserId: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new HttpError(404, 'Usuario no encontrado');
    }

    if (existingUser.id === adminUserId) {
      if (dto.role && dto.role !== UserRole.ADMIN) {
        throw new HttpError(
          400,
          'No puedes quitarte a ti mismo el rol de administrador',
        );
      }

      if (dto.status && dto.status !== RecordStatus.ACTIVE) {
        throw new HttpError(
          400,
          'No puedes cambiar tu propio usuario a un estado no activo',
        );
      }
    }

    const nextUsername =
      dto.username !== undefined
        ? this.normalizeUsername(dto.username)
        : existingUser.username;
    const nextNationalId = dto.nationalId?.trim() ?? existingUser.nationalId;
    const nextFirstName =
      dto.firstName !== undefined
        ? this.normalizePersonName(dto.firstName)
        : existingUser.firstName;
    const nextLastName =
      dto.lastName !== undefined
        ? this.normalizePersonName(dto.lastName)
        : existingUser.lastName;

    if (nextUsername !== existingUser.username) {
      const userWithSameUsername = await this.prisma.user.findUnique({
        where: { username: nextUsername },
      });

      if (userWithSameUsername) {
        throw new HttpError(400, 'Ese nombre de usuario ya existe');
      }
    }

    if (nextNationalId !== existingUser.nationalId) {
      const userWithSameNationalId = await this.prisma.user.findUnique({
        where: { nationalId: nextNationalId },
      });

      if (userWithSameNationalId) {
        throw new HttpError(400, 'Ya existe un usuario con esa cedula');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username !== undefined ? { username: nextUsername } : {}),
        ...(dto.nationalId !== undefined ? { nationalId: nextNationalId } : {}),
        ...(dto.firstName !== undefined || dto.lastName !== undefined
          ? {
              firstName: nextFirstName,
              lastName: nextLastName,
              fullName: `${nextFirstName} ${nextLastName}`,
            }
          : {}),
        ...(dto.birthDate !== undefined
          ? { birthDate: new Date(dto.birthDate) }
          : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.newPassword !== undefined
          ? { passwordHash: await bcrypt.hash(dto.newPassword, 10) }
          : {}),
      },
      select: managedUserSelect,
    });

    await this.auditService.log({
      entityName: 'User',
      entityId: updatedUser.id,
      action: 'UPDATE',
      summary: `Administrador actualizo usuario ${updatedUser.username}`,
      performedById: adminUserId,
      before: {
        username: existingUser.username,
        role: existingUser.role,
        status: existingUser.status,
        nationalIdMasked: this.maskNationalId(existingUser.nationalId),
      },
      after: {
        username: updatedUser.username,
        role: updatedUser.role,
        status: updatedUser.status,
        nationalIdMasked: this.maskNationalId(updatedUser.nationalId),
        passwordUpdated: dto.newPassword !== undefined,
      },
    });

    return updatedUser;
  }

  private normalizePersonName(value: string) {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private normalizeUsername(value: string) {
    return value.trim().toLowerCase();
  }

  private maskNationalId(value: string) {
    if (value.length <= 4) {
      return value;
    }

    return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
  }
}
