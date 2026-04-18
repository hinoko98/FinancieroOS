import { HttpError } from '../lib/http-error';
import type {
  CreateFinancialAccountInput,
  CreateFinancialIncomeInput,
} from '../lib/validation';
import { PrismaService } from '../lib/prisma';
import { AuditService } from './audit.service';

const DEFAULT_FINANCE_BANKS = [
  'Bancolombia',
  'Davivienda',
  'Banco de Bogota',
  'Banco Popular',
  'BBVA',
  'Banco de Occidente',
  'AV Villas',
  'Scotiabank Colpatria',
  'Banco Agrario',
  'Banco Caja Social',
  'Banco Falabella',
  'Banco Pichincha',
  'Banco Finandina',
  'Bancoomeva',
  'Banco GNB Sudameris',
  'Lulobank',
  'Nu',
  'Nequi',
  'Daviplata',
  'Dale!',
  'MOVii',
  'Uala',
  'RappiPay',
  'Tpaga',
] as const;

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
            period: true,
            financialCategory: true,
            financialSubcategory: true,
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
        movements: account.movements.map((movement) =>
          this.mapMovement(movement),
        ),
      };
    });
  }

  async findCatalog() {
    const [periods, categories, platformSettings] = await Promise.all([
      this.prisma.financialPeriod.findMany({
        take: 12,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      this.prisma.financialCategory.findMany({
        include: {
          subcategories: {
            orderBy: [{ name: 'asc' }],
          },
        },
        orderBy: [{ direction: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.platformSetting.upsert({
        where: { id: 'default' },
        update: {},
        create: {
          id: 'default',
          platformName: 'Control Financiero',
          platformLabel: 'Finance OS',
          platformMotto: 'Entidades, servicios y pagos organizados',
          timezone: 'America/Bogota',
          currencyCode: 'COP',
          supportEmail: null,
          bankCatalog: [...DEFAULT_FINANCE_BANKS],
        },
        select: { bankCatalog: true },
      }),
    ]);

    const banks = platformSettings.bankCatalog.length
      ? platformSettings.bankCatalog
      : (
          await this.prisma.platformSetting.update({
            where: { id: 'default' },
            data: {
              bankCatalog: {
                set: [...DEFAULT_FINANCE_BANKS],
              },
            },
            select: { bankCatalog: true },
          })
        ).bankCatalog;

    return {
      banks,
      periods: periods.map((period) => ({
        id: period.id,
        year: period.year,
        month: period.month,
        label: period.label,
        status: period.status,
        startsAt: period.startsAt,
        endsAt: period.endsAt,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        direction: category.direction,
        name: category.name,
        description: category.description,
        subcategories: category.subcategories.map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name,
          description: subcategory.description,
        })),
      })),
    };
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

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const [classification, period] = await Promise.all([
      this.resolveIncomeClassification(dto),
      this.ensurePeriodForDate(occurredAt),
    ]);

    const categoryLabel = classification.subcategory
      ? `${classification.category.name} / ${classification.subcategory.name}`
      : (classification.category?.name ?? null);

    const movement = await this.prisma.financialAccountMovement.create({
      data: {
        accountId: account.id,
        movementType: 'INCOME',
        category: categoryLabel,
        periodId: period.id,
        financialCategoryId: classification.category?.id ?? null,
        financialSubcategoryId: classification.subcategory?.id ?? null,
        amount: dto.amount,
        sourceLabel: dto.sourceLabel?.trim() || null,
        occurredAt,
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
        period: true,
        financialCategory: true,
        financialSubcategory: true,
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
        financialCategoryId: movement.financialCategoryId,
        financialSubcategoryId: movement.financialSubcategoryId,
        sourceLabel: movement.sourceLabel,
        occurredAt: movement.occurredAt,
        periodId: movement.periodId,
      },
    });

    return this.mapMovement(movement);
  }

  private mapMovement(movement: {
    id: string;
    movementType: 'INCOME' | 'ALLOCATION_DEBIT';
    category: string | null;
    amount: { toString(): string } | number;
    sourceLabel: string | null;
    occurredAt: Date;
    createdAt: Date;
    updatedAt: Date;
    performedBy: {
      id: string;
      username: string;
      fullName: string;
    };
    entityAllocation?: {
      id: string;
      entity: {
        id: string;
        name: string;
      };
    } | null;
    period?: {
      id: string;
      year: number;
      month: number;
      label: string;
      status: string;
    } | null;
    financialCategory?: {
      id: string;
      direction: string;
      name: string;
    } | null;
    financialSubcategory?: {
      id: string;
      name: string;
    } | null;
  }) {
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
      period: movement.period
        ? {
            id: movement.period.id,
            year: movement.period.year,
            month: movement.period.month,
            label: movement.period.label,
            status: movement.period.status,
          }
        : null,
      financialCategory: movement.financialCategory
        ? {
            id: movement.financialCategory.id,
            direction: movement.financialCategory.direction,
            name: movement.financialCategory.name,
          }
        : null,
      financialSubcategory: movement.financialSubcategory
        ? {
            id: movement.financialSubcategory.id,
            name: movement.financialSubcategory.name,
          }
        : null,
      entityAllocation: movement.entityAllocation
        ? {
            id: movement.entityAllocation.id,
            entityId: movement.entityAllocation.entity.id,
            entityName: movement.entityAllocation.entity.name,
          }
        : null,
    };
  }

  private async resolveIncomeClassification(dto: CreateFinancialIncomeInput) {
    if (!dto.categoryId) {
      return {
        category: null,
        subcategory: null,
      };
    }

    const category = await this.prisma.financialCategory.findUnique({
      where: {
        id: dto.categoryId,
      },
      include: {
        subcategories: true,
      },
    });

    if (!category || category.direction !== 'INCOME') {
      throw new HttpError(404, 'Categoria financiera de ingreso no encontrada');
    }

    if (!dto.subcategoryId) {
      return {
        category,
        subcategory: null,
      };
    }

    const subcategory = category.subcategories.find(
      (item) => item.id === dto.subcategoryId,
    );

    if (!subcategory) {
      throw new HttpError(
        400,
        'La subcategoria no pertenece a la categoria seleccionada',
      );
    }

    return {
      category,
      subcategory,
    };
  }

  private async ensurePeriodForDate(date: Date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const startsAt = new Date(Date.UTC(year, month - 1, 1));
    const endsAt = new Date(Date.UTC(year, month, 0));

    return this.prisma.financialPeriod.upsert({
      where: {
        year_month: {
          year,
          month,
        },
      },
      update: {},
      create: {
        year,
        month,
        label: this.buildPeriodLabel(year, month),
        startsAt,
        endsAt,
        status: 'OPEN',
      },
    });
  }

  private buildPeriodLabel(year: number, month: number) {
    const formatter = new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const rawLabel = formatter.format(new Date(Date.UTC(year, month - 1, 1)));

    return rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  }
}
