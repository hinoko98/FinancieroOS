import { Prisma } from '@prisma/client';
import { PrismaService } from '../lib/prisma';
import type {
  UpdatePlatformSettingsInput,
  UpdateSettingsInput,
} from '../lib/validation';
import { AuditService } from './audit.service';

type UserSettingsRow = {
  id: string;
  userId: string;
  themePreset: 'LIGHT' | 'DARK' | 'CUSTOM';
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
  createdAt: Date;
  updatedAt: Date;
};

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
    const existingSettings = await this.findPlatformSettings();

    if (existingSettings) {
      return existingSettings;
    }

    return this.upsertPlatformSettings(DEFAULT_PLATFORM_SETTINGS);
  }

  async updatePlatformSettings(
    userId: string,
    dto: UpdatePlatformSettingsInput,
  ) {
    const settings = await this.upsertPlatformSettings(dto);

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

  private async findPlatformSettings() {
    const [settings] = await this.prisma.$queryRaw<
      PlatformSettingsRow[]
    >(Prisma.sql`
      SELECT
        "id",
        "platformName",
        "platformLabel",
        "platformMotto",
        "timezone",
        "currencyCode",
        "supportEmail",
        "createdAt",
        "updatedAt"
      FROM "PlatformSetting"
      WHERE "id" = 'default'
      LIMIT 1
    `);

    return settings ?? null;
  }

  private async upsertPlatformSettings(
    dto: Partial<Omit<PlatformSettingsRow, 'id' | 'createdAt' | 'updatedAt'>>,
  ) {
    const [settings] = await this.prisma.$queryRaw<
      PlatformSettingsRow[]
    >(Prisma.sql`
      INSERT INTO "PlatformSetting" (
        "id",
        "platformName",
        "platformLabel",
        "platformMotto",
        "timezone",
        "currencyCode",
        "supportEmail",
        "updatedAt"
      )
      VALUES (
        'default',
        ${dto.platformName ?? DEFAULT_PLATFORM_SETTINGS.platformName},
        ${dto.platformLabel ?? DEFAULT_PLATFORM_SETTINGS.platformLabel},
        ${dto.platformMotto ?? DEFAULT_PLATFORM_SETTINGS.platformMotto},
        ${dto.timezone ?? DEFAULT_PLATFORM_SETTINGS.timezone},
        ${dto.currencyCode ?? DEFAULT_PLATFORM_SETTINGS.currencyCode},
        ${dto.supportEmail ?? DEFAULT_PLATFORM_SETTINGS.supportEmail},
        NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "platformName" = COALESCE(${dto.platformName}, "PlatformSetting"."platformName"),
        "platformLabel" = COALESCE(${dto.platformLabel}, "PlatformSetting"."platformLabel"),
        "platformMotto" = COALESCE(${dto.platformMotto}, "PlatformSetting"."platformMotto"),
        "timezone" = COALESCE(${dto.timezone}, "PlatformSetting"."timezone"),
        "currencyCode" = COALESCE(${dto.currencyCode}, "PlatformSetting"."currencyCode"),
        "supportEmail" = COALESCE(${dto.supportEmail}, "PlatformSetting"."supportEmail"),
        "updatedAt" = NOW()
      RETURNING
        "id",
        "platformName",
        "platformLabel",
        "platformMotto",
        "timezone",
        "currencyCode",
        "supportEmail",
        "createdAt",
        "updatedAt"
    `);

    return settings;
  }
}
