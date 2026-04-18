import { Router } from 'express';
import { getProductBlueprint } from '../services/product-blueprint.service';
import { getSystemInfo } from '../services/system.service';

export function createSystemRouter() {
  const router = Router();

  router.get('/', (_request, response) => {
    response.json(getSystemInfo());
  });

  router.get('/product-blueprint', (_request, response) => {
    response.json(getProductBlueprint());
  });

  return router;
}
