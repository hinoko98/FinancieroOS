import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/http-error';
import { PrismaService } from '../lib/prisma';
import type {
  CreateEntityAllocationInput,
  CreateEntityInput,
  CreateEntityItemInput,
  CreateEntityRecordInput,
  CreateEntityShareInput,
  UpdateEntityAllocationInput,
  UpdateEntityRecordInput,
  UpdateEntityShareInput,
} from '../lib/validation';
import { AuditService } from './audit.service';

type SharePermission = 'VIEW' | 'EDIT' | 'MANAGE';
type EntityAccessLevel = 'OWNER' | SharePermission;

type AccessRow = {
  entityId: string;
  ownerId: string;
  accessLevel: EntityAccessLevel;
  sharedById: string | null;
  sharedByUsername: string | null;
  sharedByFullName: string | null;
};

type ShareRow = {
  id: string;
  entityId: string;
  userId: string;
  permission: SharePermission;
  createdAt: Date;
  updatedAt: Date;
  username: string;
  fullName: string;
  grantedById: string;
  grantedByUsername: string;
  grantedByFullName: string;
};

export class EntitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(userId: string) {
    const accessRows = await this.getAccessibleEntityAccessRows(userId);

    if (!accessRows.length) {
      return [];
    }

    const entityIds = accessRows.map((row) => row.entityId);
    const accessByEntityId = new Map(
      accessRows.map((row) => [row.entityId, row] as const),
    );

    const [entities, shares] = await Promise.all([
      this.prisma.trackingEntity.findMany({
        where: {
          id: {
            in: entityIds,
          },
        },
        include: {
          allocations: {
            include: {
              performedBy: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                },
              },
            },
            orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
          },
          items: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                },
              },
              records: {
                include: {
                  performedBy: {
                    select: {
                      id: true,
                      username: true,
                      fullName: true,
                    },
                  },
                },
                orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
              },
            },
            orderBy: [{ createdAt: 'asc' }],
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.findEntityShares(entityIds),
    ]);

    const sharesByEntityId = new Map<string, ShareRow[]>();

    for (const share of shares) {
      const currentShares = sharesByEntityId.get(share.entityId) ?? [];
      currentShares.push(share);
      sharesByEntityId.set(share.entityId, currentShares);
    }

    return entities.map((entity) => {
      const access = accessByEntityId.get(entity.id);

      if (!access) {
        throw new HttpError(500, 'No fue posible resolver los permisos');
      }

      const sharesForEntity = sharesByEntityId.get(entity.id) ?? [];
      const items = entity.items.map((item) => {
        const totalValue = item.records.reduce(
          (accumulator, record) => accumulator + Number(record.amount),
          0,
        );

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          paymentReference: item.paymentReference,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          createdBy: item.createdBy,
          totalValue,
          recordsCount: item.records.length,
          latestRecordAt: item.records[0]?.occurredAt ?? null,
          records: item.records.map((record) => ({
            id: record.id,
            amount: Number(record.amount),
            occurredAt: record.occurredAt,
            notes: record.notes,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            performedBy: record.performedBy,
          })),
        };
      });

      const spentAmount = items.reduce(
        (accumulator, item) => accumulator + item.totalValue,
        0,
      );
      const assignedAmount = entity.allocations.reduce(
        (accumulator, allocation) => accumulator + Number(allocation.amount),
        0,
      );
      const recordsCount = items.reduce(
        (accumulator, item) => accumulator + item.recordsCount,
        0,
      );
      const availableBalance = assignedAmount - spentAmount;

      return {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        allocationsCount: entity.allocations.length,
        assignedAmount,
        spentAmount,
        availableBalance,
        itemsCount: items.length,
        recordsCount,
        totalValue: spentAmount,
        accessLevel: access.accessLevel,
        isOwner: access.accessLevel === 'OWNER',
        canEdit: this.canEdit(access.accessLevel),
        canManageShares: this.canManageShares(access.accessLevel),
        sharedBy: access.sharedById
          ? {
              id: access.sharedById,
              username: access.sharedByUsername ?? '',
              fullName: access.sharedByFullName ?? '',
            }
          : null,
        shares: sharesForEntity.map((share) => ({
          id: share.id,
          permission: share.permission,
          createdAt: share.createdAt,
          updatedAt: share.updatedAt,
          user: {
            id: share.userId,
            username: share.username,
            fullName: share.fullName,
          },
          grantedBy: {
            id: share.grantedById,
            username: share.grantedByUsername,
            fullName: share.grantedByFullName,
          },
        })),
        allocations: entity.allocations.map((allocation) => ({
          id: allocation.id,
          amount: Number(allocation.amount),
          sourceLabel: allocation.sourceLabel,
          occurredAt: allocation.occurredAt,
          createdAt: allocation.createdAt,
          updatedAt: allocation.updatedAt,
          performedBy: allocation.performedBy,
        })),
        items,
      };
    });
  }

  async createEntity(dto: CreateEntityInput, userId: string) {
    const name = this.requireText(dto.name, 'El nombre de la entidad');
    const normalizedName = this.normalizeName(name);
    const existingEntity = await this.prisma.trackingEntity.findUnique({
      where: {
        ownerId_normalizedName: {
          ownerId: userId,
          normalizedName,
        },
      },
    });

    if (existingEntity) {
      throw new HttpError(400, 'Ya tienes una entidad con ese nombre');
    }

    const entity = await this.prisma.trackingEntity.create({
      data: {
        ownerId: userId,
        name,
        normalizedName,
        description: this.optionalText(dto.description),
      },
    });

    await this.auditService.log({
      entityName: 'TrackingEntity',
      entityId: entity.id,
      action: 'CREATE',
      summary: `Creacion de entidad ${entity.name}`,
      performedById: userId,
      after: {
        name: entity.name,
        description: entity.description,
      },
    });

    return entity;
  }

  async createItem(
    entityId: string,
    dto: CreateEntityItemInput,
    userId: string,
  ) {
    const access = await this.getEntityAccess(entityId, userId);
    this.assertEditableAccess(access.accessLevel);

    const entity = await this.prisma.trackingEntity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      throw new HttpError(404, 'Entidad no encontrada');
    }

    const name = this.requireText(dto.name, 'El nombre del servicio');
    const normalizedName = this.normalizeName(name);
    const existingItem = await this.prisma.trackingEntityItem.findUnique({
      where: {
        entityId_normalizedName: {
          entityId: entity.id,
          normalizedName,
        },
      },
    });

    if (existingItem) {
      throw new HttpError(400, 'Ese servicio ya existe en la entidad');
    }

    const item = await this.prisma.trackingEntityItem.create({
      data: {
        entityId: entity.id,
        name,
        normalizedName,
        paymentReference: this.optionalText(dto.paymentReference),
        createdById: userId,
      },
    });

    await this.auditService.log({
      entityName: 'TrackingEntityItem',
      entityId: item.id,
      action: 'CREATE',
      summary: `Creacion de servicio ${item.name} en ${entity.name}`,
      performedById: userId,
      after: {
        entityId: entity.id,
        name: item.name,
        paymentReference: item.paymentReference,
      },
    });

    return item;
  }

  async createAllocation(
    entityId: string,
    dto: CreateEntityAllocationInput,
    userId: string,
  ) {
    const access = await this.getEntityAccess(entityId, userId);
    this.assertEditableAccess(access.accessLevel);

    const entity = await this.prisma.trackingEntity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      throw new HttpError(404, 'Entidad no encontrada');
    }

    const allocation = await this.prisma.trackingEntityAllocation.create({
      data: {
        entityId: entity.id,
        amount: dto.amount,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        sourceLabel: this.optionalText(dto.sourceLabel),
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
      entityName: 'TrackingEntityAllocation',
      entityId: allocation.id,
      action: 'CREATE',
      summary: `Asignacion de fondos para ${entity.name}`,
      performedById: userId,
      after: {
        entityId: entity.id,
        amount: Number(allocation.amount),
        occurredAt: allocation.occurredAt,
        sourceLabel: allocation.sourceLabel,
      },
    });

    return {
      id: allocation.id,
      amount: Number(allocation.amount),
      sourceLabel: allocation.sourceLabel,
      occurredAt: allocation.occurredAt,
      createdAt: allocation.createdAt,
      updatedAt: allocation.updatedAt,
      performedBy: allocation.performedBy,
    };
  }

  async createRecord(
    itemId: string,
    dto: CreateEntityRecordInput,
    userId: string,
  ) {
    const item = await this.prisma.trackingEntityItem.findUnique({
      where: { id: itemId },
      include: {
        entity: true,
      },
    });

    if (!item) {
      throw new HttpError(404, 'Servicio no encontrado');
    }

    const access = await this.getEntityAccess(item.entityId, userId);
    this.assertEditableAccess(access.accessLevel);

    const record = await this.prisma.trackingEntityRecord.create({
      data: {
        itemId: item.id,
        amount: dto.amount,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        notes: this.optionalText(dto.notes),
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
      entityName: 'TrackingEntityRecord',
      entityId: record.id,
      action: 'CREATE',
      summary: `Pago registrado para ${item.name} en ${item.entity.name}`,
      performedById: userId,
      after: {
        itemId: item.id,
        amount: Number(record.amount),
        occurredAt: record.occurredAt,
      },
    });

    return {
      id: record.id,
      amount: Number(record.amount),
      occurredAt: record.occurredAt,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      performedBy: record.performedBy,
    };
  }

  async updateAllocation(
    allocationId: string,
    dto: UpdateEntityAllocationInput,
    userId: string,
  ) {
    const allocation = await this.prisma.trackingEntityAllocation.findUnique({
      where: { id: allocationId },
      include: {
        entity: true,
        performedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!allocation) {
      throw new HttpError(404, 'Movimiento no encontrado');
    }

    const access = await this.getEntityAccess(allocation.entityId, userId);
    this.assertEditableAccess(access.accessLevel);

    const updatedAllocation = await this.prisma.trackingEntityAllocation.update(
      {
        where: { id: allocation.id },
        data: {
          amount: dto.amount ?? undefined,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
          sourceLabel:
            dto.sourceLabel !== undefined
              ? this.optionalText(dto.sourceLabel)
              : undefined,
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
      },
    );

    await this.auditService.log({
      entityName: 'TrackingEntityAllocation',
      entityId: updatedAllocation.id,
      action: 'UPDATE',
      summary: `Actualizacion de asignacion en ${allocation.entity.name}`,
      performedById: userId,
      before: {
        amount: Number(allocation.amount),
        occurredAt: allocation.occurredAt,
        sourceLabel: allocation.sourceLabel,
      },
      after: {
        amount: Number(updatedAllocation.amount),
        occurredAt: updatedAllocation.occurredAt,
        sourceLabel: updatedAllocation.sourceLabel,
      },
    });

    return {
      id: updatedAllocation.id,
      amount: Number(updatedAllocation.amount),
      sourceLabel: updatedAllocation.sourceLabel,
      occurredAt: updatedAllocation.occurredAt,
      createdAt: updatedAllocation.createdAt,
      updatedAt: updatedAllocation.updatedAt,
      performedBy: updatedAllocation.performedBy,
    };
  }

  async updateRecord(
    recordId: string,
    dto: UpdateEntityRecordInput,
    userId: string,
  ) {
    const record = await this.prisma.trackingEntityRecord.findUnique({
      where: { id: recordId },
      include: {
        item: {
          include: {
            entity: true,
          },
        },
        performedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!record) {
      throw new HttpError(404, 'Movimiento no encontrado');
    }

    const access = await this.getEntityAccess(record.item.entityId, userId);
    this.assertEditableAccess(access.accessLevel);

    const updatedRecord = await this.prisma.trackingEntityRecord.update({
      where: { id: record.id },
      data: {
        amount: dto.amount ?? undefined,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
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
      entityName: 'TrackingEntityRecord',
      entityId: updatedRecord.id,
      action: 'UPDATE',
      summary: `Actualizacion de pago para ${record.item.name} en ${record.item.entity.name}`,
      performedById: userId,
      before: {
        amount: Number(record.amount),
        occurredAt: record.occurredAt,
      },
      after: {
        amount: Number(updatedRecord.amount),
        occurredAt: updatedRecord.occurredAt,
      },
    });

    return {
      id: updatedRecord.id,
      amount: Number(updatedRecord.amount),
      occurredAt: updatedRecord.occurredAt,
      notes: updatedRecord.notes,
      createdAt: updatedRecord.createdAt,
      updatedAt: updatedRecord.updatedAt,
      performedBy: updatedRecord.performedBy,
    };
  }

  async createShare(
    entityId: string,
    dto: CreateEntityShareInput,
    userId: string,
  ) {
    const access = await this.getEntityAccess(entityId, userId);
    this.assertShareManagementAccess(access.accessLevel);

    const entity = await this.prisma.trackingEntity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      throw new HttpError(404, 'Entidad no encontrada');
    }

    const normalizedUsername = this.normalizeUsername(dto.username);
    const targetUser = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        id: true,
        username: true,
        fullName: true,
      },
    });

    if (!targetUser) {
      throw new HttpError(404, 'Usuario no encontrado');
    }

    if (targetUser.id === entity.ownerId) {
      throw new HttpError(400, 'El propietario ya tiene acceso total');
    }

    if (targetUser.id === userId) {
      throw new HttpError(400, 'No puedes compartir una entidad contigo mismo');
    }

    const [share] = await this.prisma.$queryRaw<ShareRow[]>(Prisma.sql`
      INSERT INTO "TrackingEntityShare" (
        "entityId",
        "userId",
        "grantedById",
        "permission"
      )
      VALUES (
        ${entity.id},
        ${targetUser.id},
        ${userId},
        ${dto.permission}::"EntitySharePermission"
      )
      ON CONFLICT ("entityId", "userId") DO UPDATE SET
        "permission" = EXCLUDED."permission",
        "grantedById" = EXCLUDED."grantedById",
        "updatedAt" = NOW()
      RETURNING
        "id",
        "entityId",
        "userId",
        "permission"::text AS "permission",
        "createdAt",
        "updatedAt",
        ${targetUser.username} AS "username",
        ${targetUser.fullName} AS "fullName",
        "grantedById",
        '' AS "grantedByUsername",
        '' AS "grantedByFullName"
    `);

    const hydratedShare = await this.findShareById(entity.id, share.id);

    if (!hydratedShare) {
      throw new HttpError(500, 'No fue posible crear el compartido');
    }

    await this.auditService.log({
      entityName: 'TrackingEntityShare',
      entityId: hydratedShare.id,
      action: 'CREATE',
      summary: `Compartir entidad ${entity.name} con ${hydratedShare.username}`,
      performedById: userId,
      after: {
        entityId: entity.id,
        username: hydratedShare.username,
        permission: hydratedShare.permission,
      },
    });

    return this.serializeShare(hydratedShare);
  }

  async updateShare(
    entityId: string,
    shareId: string,
    dto: UpdateEntityShareInput,
    userId: string,
  ) {
    const access = await this.getEntityAccess(entityId, userId);
    this.assertShareManagementAccess(access.accessLevel);

    const share = await this.findShareById(entityId, shareId);

    if (!share) {
      throw new HttpError(404, 'Compartido no encontrado');
    }

    const [updatedShare] = await this.prisma.$queryRaw<ShareRow[]>(Prisma.sql`
      UPDATE "TrackingEntityShare"
      SET
        "permission" = ${dto.permission}::"EntitySharePermission",
        "grantedById" = ${userId},
        "updatedAt" = NOW()
      WHERE "id" = ${shareId}
        AND "entityId" = ${entityId}
      RETURNING
        "id",
        "entityId",
        "userId",
        "permission"::text AS "permission",
        "createdAt",
        "updatedAt",
        ${share.username} AS "username",
        ${share.fullName} AS "fullName",
        "grantedById",
        '' AS "grantedByUsername",
        '' AS "grantedByFullName"
    `);

    const hydratedShare = await this.findShareById(entityId, updatedShare.id);

    if (!hydratedShare) {
      throw new HttpError(500, 'No fue posible actualizar el compartido');
    }

    await this.auditService.log({
      entityName: 'TrackingEntityShare',
      entityId: hydratedShare.id,
      action: 'UPDATE',
      summary: `Actualizacion de permisos para ${hydratedShare.username}`,
      performedById: userId,
      before: {
        permission: share.permission,
      },
      after: {
        permission: hydratedShare.permission,
      },
    });

    return this.serializeShare(hydratedShare);
  }

  async deleteShare(entityId: string, shareId: string, userId: string) {
    const access = await this.getEntityAccess(entityId, userId);
    this.assertShareManagementAccess(access.accessLevel);

    const share = await this.findShareById(entityId, shareId);

    if (!share) {
      throw new HttpError(404, 'Compartido no encontrado');
    }

    await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM "TrackingEntityShare"
      WHERE "id" = ${shareId}
        AND "entityId" = ${entityId}
    `);

    await this.auditService.log({
      entityName: 'TrackingEntityShare',
      entityId: share.id,
      action: 'DEACTIVATE',
      summary: `Se revoco el acceso de ${share.username}`,
      performedById: userId,
      before: {
        permission: share.permission,
        username: share.username,
      },
    });

    return { success: true };
  }

  private async getAccessibleEntityAccessRows(userId: string) {
    return this.prisma.$queryRaw<AccessRow[]>(Prisma.sql`
      SELECT
        entity."id" AS "entityId",
        entity."ownerId" AS "ownerId",
        CASE
          WHEN entity."ownerId" = ${userId} THEN 'OWNER'
          ELSE share."permission"::text
        END AS "accessLevel",
        shared_by."id" AS "sharedById",
        shared_by."username" AS "sharedByUsername",
        shared_by."fullName" AS "sharedByFullName"
      FROM "TrackingEntity" AS entity
      LEFT JOIN "TrackingEntityShare" AS share
        ON share."entityId" = entity."id"
        AND share."userId" = ${userId}
      LEFT JOIN "User" AS shared_by
        ON shared_by."id" = share."grantedById"
      WHERE entity."ownerId" = ${userId}
        OR share."id" IS NOT NULL
      ORDER BY entity."createdAt" DESC
    `);
  }

  private async getEntityAccess(entityId: string, userId: string) {
    const [access] = await this.prisma.$queryRaw<AccessRow[]>(Prisma.sql`
      SELECT
        entity."id" AS "entityId",
        entity."ownerId" AS "ownerId",
        CASE
          WHEN entity."ownerId" = ${userId} THEN 'OWNER'
          ELSE share."permission"::text
        END AS "accessLevel",
        shared_by."id" AS "sharedById",
        shared_by."username" AS "sharedByUsername",
        shared_by."fullName" AS "sharedByFullName"
      FROM "TrackingEntity" AS entity
      LEFT JOIN "TrackingEntityShare" AS share
        ON share."entityId" = entity."id"
        AND share."userId" = ${userId}
      LEFT JOIN "User" AS shared_by
        ON shared_by."id" = share."grantedById"
      WHERE entity."id" = ${entityId}
        AND (
          entity."ownerId" = ${userId}
          OR share."id" IS NOT NULL
        )
      LIMIT 1
    `);

    if (!access) {
      throw new HttpError(404, 'Entidad no encontrada');
    }

    return access;
  }

  private async findEntityShares(entityIds: string[]) {
    if (!entityIds.length) {
      return [];
    }

    return this.prisma.$queryRaw<ShareRow[]>(Prisma.sql`
      SELECT
        share."id",
        share."entityId",
        share."userId",
        share."permission"::text AS "permission",
        share."createdAt",
        share."updatedAt",
        shared_user."username",
        shared_user."fullName",
        share."grantedById",
        granted_by."username" AS "grantedByUsername",
        granted_by."fullName" AS "grantedByFullName"
      FROM "TrackingEntityShare" AS share
      INNER JOIN "User" AS shared_user
        ON shared_user."id" = share."userId"
      INNER JOIN "User" AS granted_by
        ON granted_by."id" = share."grantedById"
      WHERE share."entityId" IN (${Prisma.join(entityIds)})
      ORDER BY shared_user."fullName" ASC, shared_user."username" ASC
    `);
  }

  private async findShareById(entityId: string, shareId: string) {
    const [share] = await this.prisma.$queryRaw<ShareRow[]>(Prisma.sql`
      SELECT
        share."id",
        share."entityId",
        share."userId",
        share."permission"::text AS "permission",
        share."createdAt",
        share."updatedAt",
        shared_user."username",
        shared_user."fullName",
        share."grantedById",
        granted_by."username" AS "grantedByUsername",
        granted_by."fullName" AS "grantedByFullName"
      FROM "TrackingEntityShare" AS share
      INNER JOIN "User" AS shared_user
        ON shared_user."id" = share."userId"
      INNER JOIN "User" AS granted_by
        ON granted_by."id" = share."grantedById"
      WHERE share."entityId" = ${entityId}
        AND share."id" = ${shareId}
      LIMIT 1
    `);

    return share ?? null;
  }

  private serializeShare(share: ShareRow) {
    return {
      id: share.id,
      permission: share.permission,
      createdAt: share.createdAt,
      updatedAt: share.updatedAt,
      user: {
        id: share.userId,
        username: share.username,
        fullName: share.fullName,
      },
      grantedBy: {
        id: share.grantedById,
        username: share.grantedByUsername,
        fullName: share.grantedByFullName,
      },
    };
  }

  private assertEditableAccess(accessLevel: EntityAccessLevel) {
    if (!this.canEdit(accessLevel)) {
      throw new HttpError(
        403,
        'No tienes permisos para modificar esta entidad',
      );
    }
  }

  private assertShareManagementAccess(accessLevel: EntityAccessLevel) {
    if (!this.canManageShares(accessLevel)) {
      throw new HttpError(
        403,
        'No tienes permisos para administrar compartidos en esta entidad',
      );
    }
  }

  private canEdit(accessLevel: EntityAccessLevel) {
    return (
      accessLevel === 'OWNER' ||
      accessLevel === 'EDIT' ||
      accessLevel === 'MANAGE'
    );
  }

  private canManageShares(accessLevel: EntityAccessLevel) {
    return accessLevel === 'OWNER' || accessLevel === 'MANAGE';
  }

  private requireText(value: string, label: string) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      throw new HttpError(400, `${label} es obligatorio`);
    }

    return trimmedValue;
  }

  private optionalText(value?: string) {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private normalizeName(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private normalizeUsername(value: string) {
    return value.trim().replace(/^@+/, '').toLowerCase();
  }
}
