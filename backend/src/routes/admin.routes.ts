import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler';
import {
  parseCreateFinancialCategoryInput,
  parseCreateFinancialPeriodInput,
  parseCreateFinancialSubcategoryInput,
  parseUpdateManagedUserInput,
} from '../lib/validation';
import {
  getAuthenticatedUser,
  requireAdmin,
} from '../middlewares/auth.middleware';
import type { AuthenticatedRequest } from '../types/auth';
import type { AdminService } from '../services/admin.service';

export function createAdminRouter(
  adminService: AdminService,
  jwtSecret: string,
) {
  const router = Router();

  router.get(
    '/overview',
    requireAdmin(jwtSecret),
    asyncHandler(async (_request, response) => {
      const overview = await adminService.findOverview();
      response.json(overview);
    }),
  );

  router.get(
    '/users',
    requireAdmin(jwtSecret),
    asyncHandler(async (_request, response) => {
      const users = await adminService.findAllUsers();
      response.json(users);
    }),
  );

  router.get(
    '/finance-structure',
    requireAdmin(jwtSecret),
    asyncHandler(async (_request, response) => {
      const structure = await adminService.findFinanceStructure();
      response.json(structure);
    }),
  );

  router.post(
    '/financial-periods',
    requireAdmin(jwtSecret),
    asyncHandler(async (request, response) => {
      const authUser = getAuthenticatedUser(request as AuthenticatedRequest);
      const period = await adminService.createFinancialPeriod(
        parseCreateFinancialPeriodInput(request.body),
        authUser.sub,
      );
      response.status(201).json(period);
    }),
  );

  router.post(
    '/financial-categories',
    requireAdmin(jwtSecret),
    asyncHandler(async (request, response) => {
      const authUser = getAuthenticatedUser(request as AuthenticatedRequest);
      const category = await adminService.createFinancialCategory(
        parseCreateFinancialCategoryInput(request.body),
        authUser.sub,
      );
      response.status(201).json(category);
    }),
  );

  router.post(
    '/financial-subcategories',
    requireAdmin(jwtSecret),
    asyncHandler(async (request, response) => {
      const authUser = getAuthenticatedUser(request as AuthenticatedRequest);
      const subcategory = await adminService.createFinancialSubcategory(
        parseCreateFinancialSubcategoryInput(request.body),
        authUser.sub,
      );
      response.status(201).json(subcategory);
    }),
  );

  router.patch(
    '/users/:userId',
    requireAdmin(jwtSecret),
    asyncHandler(async (request, response) => {
      const authUser = getAuthenticatedUser(request as AuthenticatedRequest);
      const rawUserId = request.params.userId;
      const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
      const updatedUser = await adminService.updateUser(
        userId,
        parseUpdateManagedUserInput(request.body),
        authUser.sub,
      );
      response.json(updatedUser);
    }),
  );

  return router;
}
