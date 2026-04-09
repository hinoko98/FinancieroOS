import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler';
import {
  parseUpdatePlatformSettingsInput,
  parseUpdateSettingsInput,
} from '../lib/validation';
import { HttpError } from '../lib/http-error';
import {
  getAuthenticatedUser,
  requireAuth,
} from '../middlewares/auth.middleware';
import type { SettingsService } from '../services/settings.service';
import type { AuthenticatedRequest } from '../types/auth';

export function createSettingsRouter(
  settingsService: SettingsService,
  jwtSecret: string,
) {
  const router = Router();

  router.use(requireAuth(jwtSecret));

  router.get(
    '/',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const settings = await settingsService.getSettings(user.sub);
      response.json(settings);
    }),
  );

  router.patch(
    '/',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const settings = await settingsService.updateSettings(
        user.sub,
        parseUpdateSettingsInput(request.body),
      );
      response.json(settings);
    }),
  );

  router.get(
    '/platform',
    asyncHandler(async (_request, response) => {
      const settings = await settingsService.getPlatformSettings();
      response.json(settings);
    }),
  );

  router.patch(
    '/platform',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);

      if (user.role !== 'ADMIN') {
        throw new HttpError(
          403,
          'Solo un administrador puede cambiar la configuracion de la plataforma',
        );
      }

      const settings = await settingsService.updatePlatformSettings(
        user.sub,
        parseUpdatePlatformSettingsInput(request.body),
      );
      response.json(settings);
    }),
  );

  router.get(
    '/login-history',
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const loginHistory = await settingsService.getLoginHistory(user.sub);
      response.json(loginHistory);
    }),
  );

  return router;
}
