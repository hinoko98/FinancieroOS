import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler';
import {
  parseChangePasswordInput,
  parseLoginInput,
  parseRegisterInput,
  parseUpdateProfileInput,
} from '../lib/validation';
import {
  extractRequestMetadata,
  getAuthenticatedUser,
  requireAuth,
} from '../middlewares/auth.middleware';
import type { AuthenticatedRequest } from '../types/auth';
import type { AuthService } from '../services/auth.service';

export function createAuthRouter(authService: AuthService, jwtSecret: string) {
  const router = Router();

  router.post(
    '/register',
    asyncHandler(async (request, response) => {
      const result = await authService.register(
        parseRegisterInput(request.body),
        extractRequestMetadata(request as AuthenticatedRequest),
      );
      response.status(201).json(result);
    }),
  );

  router.post(
    '/login',
    asyncHandler(async (request, response) => {
      const result = await authService.login(
        parseLoginInput(request.body),
        extractRequestMetadata(request as AuthenticatedRequest),
      );
      response.json(result);
    }),
  );

  router.get(
    '/verify-email',
    asyncHandler(async (request, response) => {
      const rawToken = request.query.token;
      const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

      if (!token || typeof token !== 'string') {
        response.redirect(
          `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}/login?verified=0&reason=token`,
        );
        return;
      }

      try {
        await authService.verifyEmail(token);
        response.redirect(
          `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}/login?verified=1`,
        );
      } catch (error) {
        const reason =
          error instanceof Error
            ? encodeURIComponent(error.message)
            : 'verificacion';
        response.redirect(
          `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}/login?verified=0&reason=${reason}`,
        );
      }
    }),
  );

  router.get(
    '/me',
    requireAuth(jwtSecret),
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const profile = await authService.me(user.sub);
      response.json(profile);
    }),
  );

  router.patch(
    '/change-password',
    requireAuth(jwtSecret),
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const result = await authService.changePassword(
        user.sub,
        parseChangePasswordInput(request.body),
      );
      response.json(result);
    }),
  );

  router.patch(
    '/profile',
    requireAuth(jwtSecret),
    asyncHandler(async (request, response) => {
      const user = getAuthenticatedUser(request as AuthenticatedRequest);
      const result = await authService.updateProfile(
        user.sub,
        parseUpdateProfileInput(request.body),
      );
      response.json(result);
    }),
  );

  return router;
}
