import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler';
import {
  parseCreateFinancialAccountInput,
  parseCreateFinancialIncomeInput,
} from '../lib/validation';
import {
  getAuthenticatedUser,
  requireAuth,
} from '../middlewares/auth.middleware';
import type { FinanceService } from '../services/finance.service';
import type { AuthenticatedRequest } from '../types/auth';

function readRouteParam(value: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? '') : value;
}

export function createFinanceRouter(
  financeService: FinanceService,
  jwtSecret: string,
) {
  const router = Router();

  router.use(requireAuth(jwtSecret));

  router.get(
    '/accounts',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const accounts = await financeService.findAccounts(user.sub);
      response.json(accounts);
    }),
  );

  router.get(
    '/catalog',
    asyncHandler(async (_request, response) => {
      const catalog = await financeService.findCatalog();
      response.json(catalog);
    }),
  );

  router.post(
    '/accounts',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const account = await financeService.createAccount(
        parseCreateFinancialAccountInput(request.body),
        user.sub,
      );
      response.status(201).json(account);
    }),
  );

  router.post(
    '/accounts/:accountId/incomes',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const income = await financeService.createIncome(
        readRouteParam(request.params.accountId),
        parseCreateFinancialIncomeInput(request.body),
        user.sub,
      );
      response.status(201).json(income);
    }),
  );

  return router;
}
