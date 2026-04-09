import { Router } from 'express';

export function createHealthRouter() {
  const router = Router();

  router.get('/', (_request, response) => {
    response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
