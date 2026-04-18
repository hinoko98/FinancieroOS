import { Router } from 'express';
import { getSystemInfo } from '../services/system.service';

export function createSystemRouter() {
  const router = Router();

  router.get('/', (_request, response) => {
    response.json(getSystemInfo());
  });

  return router;
}
