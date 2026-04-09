import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler';
import { requireAuth } from '../middlewares/auth.middleware';
import type { AuditService } from '../services/audit.service';

export function createAuditRouter(
  auditService: AuditService,
  jwtSecret: string,
) {
  const router = Router();

  router.get(
    '/logs',
    requireAuth(jwtSecret),
    asyncHandler(async (_request, response) => {
      const logs = await auditService.findAll();
      response.json(logs);
    }),
  );

  return router;
}
