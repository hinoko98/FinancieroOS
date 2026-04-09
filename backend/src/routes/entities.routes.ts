import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler';
import {
  parseCreateEntityAllocationInput,
  parseCreateEntityInput,
  parseCreateEntityItemInput,
  parseCreateEntityRecordInput,
  parseCreateEntityShareInput,
  parseUpdateEntityAllocationInput,
  parseUpdateEntityRecordInput,
  parseUpdateEntityShareInput,
} from '../lib/validation';
import {
  getAuthenticatedUser,
  requireAuth,
} from '../middlewares/auth.middleware';
import type { EntitiesService } from '../services/entities.service';
import type { AuthenticatedRequest } from '../types/auth';

function readRouteParam(value: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? '') : value;
}

export function createEntitiesRouter(
  entitiesService: EntitiesService,
  jwtSecret: string,
) {
  const router = Router();

  router.use(requireAuth(jwtSecret));

  router.get(
    '/',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const entities = await entitiesService.findAll(user.sub);
      response.json(entities);
    }),
  );

  router.post(
    '/',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const entity = await entitiesService.createEntity(
        parseCreateEntityInput(request.body),
        user.sub,
      );
      response.status(201).json(entity);
    }),
  );

  router.post(
    '/:entityId/allocations',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const allocation = await entitiesService.createAllocation(
        readRouteParam(request.params.entityId),
        parseCreateEntityAllocationInput(request.body),
        user.sub,
      );
      response.status(201).json(allocation);
    }),
  );

  router.post(
    '/:entityId/items',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const item = await entitiesService.createItem(
        readRouteParam(request.params.entityId),
        parseCreateEntityItemInput(request.body),
        user.sub,
      );
      response.status(201).json(item);
    }),
  );

  router.post(
    '/:entityId/shares',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const share = await entitiesService.createShare(
        readRouteParam(request.params.entityId),
        parseCreateEntityShareInput(request.body),
        user.sub,
      );
      response.status(201).json(share);
    }),
  );

  router.post(
    '/items/:itemId/records',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const record = await entitiesService.createRecord(
        readRouteParam(request.params.itemId),
        parseCreateEntityRecordInput(request.body),
        user.sub,
      );
      response.status(201).json(record);
    }),
  );

  router.patch(
    '/:entityId/shares/:shareId',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const share = await entitiesService.updateShare(
        readRouteParam(request.params.entityId),
        readRouteParam(request.params.shareId),
        parseUpdateEntityShareInput(request.body),
        user.sub,
      );
      response.json(share);
    }),
  );

  router.delete(
    '/:entityId/shares/:shareId',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const result = await entitiesService.deleteShare(
        readRouteParam(request.params.entityId),
        readRouteParam(request.params.shareId),
        user.sub,
      );
      response.json(result);
    }),
  );

  router.patch(
    '/allocations/:allocationId',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const allocation = await entitiesService.updateAllocation(
        readRouteParam(request.params.allocationId),
        parseUpdateEntityAllocationInput(request.body),
        user.sub,
      );
      response.json(allocation);
    }),
  );

  router.patch(
    '/records/:recordId',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const record = await entitiesService.updateRecord(
        readRouteParam(request.params.recordId),
        parseUpdateEntityRecordInput(request.body),
        user.sub,
      );
      response.json(record);
    }),
  );

  return router;
}
