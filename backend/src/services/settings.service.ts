import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/http-error';
import { PrismaService } from '../lib/prisma';
import type {
  CreatePlatformBankInput,
  UpdatePlatformSettingsInput,
  UpdateSettingsInput,
} from '../lib/validation';
import { AuditService } from './audit.service';

type UserSettingsRow = {
  id: string;
  userId: string;
  themePreset: 'LIGHT' | 'DARK' | 'GRAPHITE' | 'CUSTOM';
  customThemeBase: 'LIGHT' | 'DARK';
  userIcon: string;
  dashboardSurfaceColor: string;
  dashboardPanelColor: string;
  dashboardPanelStrongColor: string;
  dashboardInkColor: string;
  dashboardMutedColor: string;
  dashboardLineColor: string;
  dashboardBrandColor: string;
  dashboardBrandSoftColor: string;
  dashboardBrandDeepColor: string;
  dashboardSuccessColor: string;
  dashboardDangerColor: string;
  dashboardWarningColor: string;
  createdAt: Date;
  updatedAt: Date;
};

type PlatformSettingsRow = {
  id: string;
  platformName: string;
  platformLabel: string;
  platformMotto: string;
  timezone: string;
  currencyCode: string;
  supportEmail: string | null;
  bankCatalog: string[];
  createdAt: Date;
  updatedAt: Date;
};

const DEFAULT_PLATFORM_BANKS = [
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

const DEFAULT_USER_SETTINGS: Omit<
  UserSettingsRow,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
> = {
  themePreset: 'LIGHT',
  customThemeBase: 'LIGHT',
  userIcon: 'user-round',
  dashboardSurfaceColor: '#eadfce',
  dashboardPanelColor: '#faf4eb',
  dashboardPanelStrongColor: '#fffaf4',
  dashboardInkColor: '#3e2c23',
  dashboardMutedColor: '#7a6558',
  dashboardLineColor: '#70543e',
  dashboardBrandColor: '#6f4e37',
  dashboardBrandSoftColor: '#ead7c3',
  dashboardBrandDeepColor: '#4f3527',
  dashboardSuccessColor: '#1f7a45',
  dashboardDangerColor: '#a63f2e',
  dashboardWarningColor: '#9a6a1f',
};

const DEFAULT_PLATFORM_SETTINGS: Omit<
  PlatformSettingsRow,
  'id' | 'createdAt' | 'updatedAt'
> = {
  platformName: 'Control Financiero',
  platformLabel: 'Finance OS',
  platformMotto: 'Entidades, servicios y pagos organizados',
  timezone: 'America/Bogota',
  currencyCode: 'COP',
  supportEmail: null,
  bankCatalog: [...DEFAULT_PLATFORM_BANKS],
};

export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getSettings(userId: string) {
    const existingSettings = await this.findUserSettings(userId);

    if (existingSettings) {
      return existingSettings;
    }

    return this.upsertUserSettings(userId, DEFAULT_USER_SETTINGS);
  }

  async updateSettings(userId: string, dto: UpdateSettingsInput) {
    const settings = await this.upsertUserSettings(userId, dto);

    await this.auditService.log({
      entityName: 'UserSetting',
      entityId: settings.id,
      action: 'UPDATE',
      summary: 'Actualizacion de configuracion visual',
      performedById: userId,
      after: dto,
    });

    return settings;
  }

  async getLoginHistory(userId: string) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { loggedInAt: 'desc' },
      take: 20,
    });
  }

  async getPlatformSettings() {
    const settings = await this.prisma.platformSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        ...DEFAULT_PLATFORM_SETTINGS,
      },
    });

    if (settings.bankCatalog.length) {
      return settings;
    }

    return this.prisma.platformSetting.update({
      where: { id: 'default' },
      data: {
        bankCatalog: {
          set: DEFAULT_PLATFORM_SETTINGS.bankCatalog,
        },
      },
    });
  }

  async updatePlatformSettings(
    userId: string,
    dto: UpdatePlatformSettingsInput,
  ) {
    await this.getPlatformSettings();
    const settings = await this.prisma.platformSetting.update({
      where: { id: 'default' },
      data: {
        ...(dto.platformName !== undefined ? { platformName: dto.platformName } : {}),
        ...(dto.platformLabel !== undefined ? { platformLabel: dto.platformLabel } : {}),
        ...(dto.platformMotto !== undefined ? { platformMotto: dto.platformMotto } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.currencyCode !== undefined ? { currencyCode: dto.currencyCode } : {}),
        ...(dto.supportEmail !== undefined
          ? { supportEmail: dto.supportEmail || null }
          : {}),
      },
    });

    await this.auditService.log({
      entityName: 'PlatformSetting',
      entityId: settings.id,
      action: 'UPDATE',
      summary: 'Actualizacion de configuracion de plataforma',
      performedById: userId,
      after: dto,
    });

    return settings;
  }

  async createPlatformBank(userId: string, dto: CreatePlatformBankInput) {
    const settings = await this.getPlatformSettings();
    const normalizedName = this.normalizeBankName(dto.name);

    const alreadyExists = settings.bankCatalog.some(
      (bank) => this.normalizeBankName(bank) === normalizedName,
    );

    if (alreadyExists) {
      throw new HttpError(400, 'Ese banco o billetera ya existe en el catalogo');
    }

    const nextBankCatalog = [...settings.bankCatalog, this.formatBankName(dto.name)].sort(
      (left, right) => left.localeCompare(right, 'es'),
    );

    const updatedSettings = await this.prisma.platformSetting.update({
      where: { id: settings.id },
      data: {
        bankCatalog: {
          set: nextBankCatalog,
        },
      },
    });

    await this.auditService.log({
      entityName: 'PlatformSetting',
      entityId: updatedSettings.id,
      action: 'UPDATE',
      summary: `Se agrego un banco al catalogo global`,
      performedById: userId,
      after: {
        bankName: this.formatBankName(dto.name),
      },
    });

    return updatedSettings;
  }

  private async findUserSettings(userId: string) {
    const [settings] = await this.prisma.$queryRaw<
      UserSettingsRow[]
    >(Prisma.sql`
      SELECT
        "id",
        "userId",
        "themePreset",
        "customThemeBase",
        "userIcon",
        "dashboardSurfaceColor",
        "dashboardPanelColor",
        "dashboardPanelStrongColor",
        "dashboardInkColor",
        "dashboardMutedColor",
        "dashboardLineColor",
        "dashboardBrandColor",
        "dashboardBrandSoftColor",
        "dashboardBrandDeepColor",
        "dashboardSuccessColor",
        "dashboardDangerColor",
        "dashboardWarningColor",
        "createdAt",
        "updatedAt"
      FROM "UserSetting"
      WHERE "userId" = ${userId}
      LIMIT 1
    `);

    return settings ?? null;
  }

  private async upsertUserSettings(
    userId: string,
    dto: Partial<
      Omit<UserSettingsRow, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >,
  ) {
    const [settings] = await this.prisma.$queryRaw<
      UserSettingsRow[]
    >(Prisma.sql`
      INSERT INTO "UserSetting" (
        "userId",
        "themePreset",
        "customThemeBase",
        "userIcon",
        "dashboardSurfaceColor",
        "dashboardPanelColor",
        "dashboardPanelStrongColor",
        "dashboardInkColor",
        "dashboardMutedColor",
        "dashboardLineColor",
        "dashboardBrandColor",
        "dashboardBrandSoftColor",
        "dashboardBrandDeepColor",
        "dashboardSuccessColor",
        "dashboardDangerColor",
        "dashboardWarningColor",
        "updatedAt"
      )
      VALUES (
        ${userId},
        ${dto.themePreset ?? DEFAULT_USER_SETTINGS.themePreset}::"ThemePreset",
        ${dto.customThemeBase ?? DEFAULT_USER_SETTINGS.customThemeBase}::"ThemeBasePreset",
        ${dto.userIcon ?? DEFAULT_USER_SETTINGS.userIcon},
        ${dto.dashboardSurfaceColor ?? DEFAULT_USER_SETTINGS.dashboardSurfaceColor},
        ${dto.dashboardPanelColor ?? DEFAULT_USER_SETTINGS.dashboardPanelColor},
        ${dto.dashboardPanelStrongColor ?? DEFAULT_USER_SETTINGS.dashboardPanelStrongColor},
        ${dto.dashboardInkColor ?? DEFAULT_USER_SETTINGS.dashboardInkColor},
        ${dto.dashboardMutedColor ?? DEFAULT_USER_SETTINGS.dashboardMutedColor},
        ${dto.dashboardLineColor ?? DEFAULT_USER_SETTINGS.dashboardLineColor},
        ${dto.dashboardBrandColor ?? DEFAULT_USER_SETTINGS.dashboardBrandColor},
        ${dto.dashboardBrandSoftColor ?? DEFAULT_USER_SETTINGS.dashboardBrandSoftColor},
        ${dto.dashboardBrandDeepColor ?? DEFAULT_USER_SETTINGS.dashboardBrandDeepColor},
        ${dto.dashboardSuccessColor ?? DEFAULT_USER_SETTINGS.dashboardSuccessColor},
        ${dto.dashboardDangerColor ?? DEFAULT_USER_SETTINGS.dashboardDangerColor},
        ${dto.dashboardWarningColor ?? DEFAULT_USER_SETTINGS.dashboardWarningColor},
        NOW()
      )
      ON CONFLICT ("userId") DO UPDATE SET
        "themePreset" = COALESCE(${dto.themePreset}::"ThemePreset", "UserSetting"."themePreset"),
        "customThemeBase" = COALESCE(${dto.customThemeBase}::"ThemeBasePreset", "UserSetting"."customThemeBase"),
        "userIcon" = COALESCE(${dto.userIcon}, "UserSetting"."userIcon"),
        "dashboardSurfaceColor" = COALESCE(${dto.dashboardSurfaceColor}, "UserSetting"."dashboardSurfaceColor"),
        "dashboardPanelColor" = COALESCE(${dto.dashboardPanelColor}, "UserSetting"."dashboardPanelColor"),
        "dashboardPanelStrongColor" = COALESCE(${dto.dashboardPanelStrongColor}, "UserSetting"."dashboardPanelStrongColor"),
        "dashboardInkColor" = COALESCE(${dto.dashboardInkColor}, "UserSetting"."dashboardInkColor"),
        "dashboardMutedColor" = COALESCE(${dto.dashboardMutedColor}, "UserSetting"."dashboardMutedColor"),
        "dashboardLineColor" = COALESCE(${dto.dashboardLineColor}, "UserSetting"."dashboardLineColor"),
        "dashboardBrandColor" = COALESCE(${dto.dashboardBrandColor}, "UserSetting"."dashboardBrandColor"),
        "dashboardBrandSoftColor" = COALESCE(${dto.dashboardBrandSoftColor}, "UserSetting"."dashboardBrandSoftColor"),
        "dashboardBrandDeepColor" = COALESCE(${dto.dashboardBrandDeepColor}, "UserSetting"."dashboardBrandDeepColor"),
        "dashboardSuccessColor" = COALESCE(${dto.dashboardSuccessColor}, "UserSetting"."dashboardSuccessColor"),
        "dashboardDangerColor" = COALESCE(${dto.dashboardDangerColor}, "UserSetting"."dashboardDangerColor"),
        "dashboardWarningColor" = COALESCE(${dto.dashboardWarningColor}, "UserSetting"."dashboardWarningColor"),
        "updatedAt" = NOW()
      RETURNING
        "id",
        "userId",
        "themePreset",
        "customThemeBase",
        "userIcon",
        "dashboardSurfaceColor",
        "dashboardPanelColor",
        "dashboardPanelStrongColor",
        "dashboardInkColor",
        "dashboardMutedColor",
        "dashboardLineColor",
        "dashboardBrandColor",
        "dashboardBrandSoftColor",
        "dashboardBrandDeepColor",
        "dashboardSuccessColor",
        "dashboardDangerColor",
        "dashboardWarningColor",
        "createdAt",
        "updatedAt"
    `);

    return settings;
  }

  private normalizeBankName(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[!]+/g, '!');
  }

  private formatBankName(value: string) {
    const trimmedValue = value.trim().replace(/\s+/g, ' ');

    if (/^(nu|nequi|movii|uala)$/i.test(trimmedValue)) {
      return trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1).toLowerCase();
    }

    if (/^dale!?$/i.test(trimmedValue)) {
      return 'Dale!';
    }

    if (/^daviplata$/i.test(trimmedValue)) {
      return 'Daviplata';
    }

    return trimmedValue;
  }
}
