import type { AuditAction } from '@prisma/client';
import { PrismaService } from '../lib/prisma';

export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(params: {
    entityName: string;
    entityId: string;
    action: AuditAction;
    summary: string;
    performedById?: string;
    before?: unknown;
    after?: unknown;
    metadata?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        entityName: params.entityName,
        entityId: params.entityId,
        action: params.action,
        summary: params.summary,
        performedById: params.performedById,
        before: params.before as never,
        after: params.after as never,
        metadata: params.metadata as never,
      },
    });
  }

  findAll() {
    return this.prisma.auditLog.findMany({
      include: {
        performedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
