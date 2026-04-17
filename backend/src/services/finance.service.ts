import { HttpError } from '../lib/http-error';
import type {
  CreateFinancialAccountInput,
  CreateFinancialIncomeInput,
} from '../lib/validation';
import { PrismaService } from '../lib/prisma';
import { AuditService } from './audit.service';

export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAccounts(userId: string) {
    const accounts = await this.prisma.financialAccount.findMany({
      where: {
        userId,
      },
      include: {
        movements: {
          include: {
            performedBy: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
            entityAllocation: {
              include: {
                entity: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return accounts.map((account) => {
      const balance = account.movements.reduce((accumulator, movement) => {
        const amount = Number(movement.amount);

        return movement.movementType === 'ALLOCATION_DEBIT'
          ? accumulator - amount
          : accumulator + amount;
      }, 0);

      return {
        id: account.id,
        bankName: account.bankName,
        accountLabel: account.accountLabel,
        accountType: account.accountType,
        accountMask: account.accountMask,
        balance,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        movements: account.movements.map((movement) => ({
          id: movement.id,
          movementType: movement.movementType,
          category: movement.category,
          amount: Number(movement.amount),
          sourceLabel: movement.sourceLabel,
          occurredAt: movement.occurredAt,
          createdAt: movement.createdAt,
          updatedAt: movement.updatedAt,
          performedBy: movement.performedBy,
          entityAllocation: movement.entityAllocation
            ? {
                id: movement.entityAllocation.id,
                entityId: movement.entityAllocation.entity.id,
                entityName: movement.entityAllocation.entity.name,
              }
            : null,
        })),
      };
    });
  }

  async createAccount(dto: CreateFinancialAccountInput, userId: string) {
    const normalizedLabel = dto.accountLabel
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

    const existingAccount = await this.prisma.financialAccount.findFirst({
      where: {
        userId,
        bankName: dto.bankName.trim(),
        accountLabel: dto.accountLabel.trim(),
      },
    });

    if (existingAccount) {
      throw new HttpError(400, 'Ya existe una cuenta con ese banco y nombre');
    }

    const account = await this.prisma.financialAccount.create({
      data: {
        userId,
        bankName: dto.bankName.trim(),
        accountLabel: dto.accountLabel.trim(),
        accountType: dto.accountType,
        accountMask: dto.accountMask?.trim() || null,
      },
    });

    await this.auditService.log({
      entityName: 'FinancialAccount',
      entityId: account.id,
      action: 'CREATE',
      summary: `Cuenta financiera creada: ${account.accountLabel}`,
      performedById: userId,
      after: {
        bankName: account.bankName,
        accountLabel: account.accountLabel,
        accountType: account.accountType,
        normalizedLabel,
      },
    });

    return account;
  }

  async createIncome(
    accountId: string,
    dto: CreateFinancialIncomeInput,
    userId: string,
  ) {
    const account = await this.prisma.financialAccount.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new HttpError(404, 'Cuenta financiera no encontrada');
    }

    const movement = await this.prisma.financialAccountMovement.create({
      data: {
        accountId: account.id,
        movementType: 'INCOME',
        category: dto.category?.trim() || null,
        amount: dto.amount,
        sourceLabel: dto.sourceLabel?.trim() || null,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        performedById: userId,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    await this.auditService.log({
      entityName: 'FinancialAccountMovement',
      entityId: movement.id,
      action: 'CREATE',
      summary: `Ingreso registrado en ${account.accountLabel}`,
      performedById: userId,
      after: {
        accountId: account.id,
        amount: Number(movement.amount),
        category: movement.category,
        sourceLabel: movement.sourceLabel,
        occurredAt: movement.occurredAt,
      },
    });

    return {
      id: movement.id,
      movementType: movement.movementType,
      category: movement.category,
      amount: Number(movement.amount),
      sourceLabel: movement.sourceLabel,
      occurredAt: movement.occurredAt,
      createdAt: movement.createdAt,
      updatedAt: movement.updatedAt,
      performedBy: movement.performedBy,
    };
  }
}
