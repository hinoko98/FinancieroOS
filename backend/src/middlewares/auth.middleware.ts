import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../lib/http-error';
import type {
  AuthenticatedRequest,
  AuthUser,
  RequestMetadata,
} from '../types/auth';

export function requireAuth(jwtSecret: string): RequestHandler {
  return (request, _response, next) => {
    const authorizationHeader = request.headers.authorization;
    const bearerToken = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length).trim()
      : null;

    if (!bearerToken) {
      next(new HttpError(401, 'Token de acceso requerido'));
      return;
    }

    try {
      const payload = jwt.verify(bearerToken, jwtSecret) as AuthUser;
      (request as AuthenticatedRequest).authUser = payload;
      next();
    } catch {
      next(new HttpError(401, 'Token invalido o expirado'));
    }
  };
}

export function requireAdmin(jwtSecret: string): RequestHandler {
  return (request, _response, next) => {
    const authorizationHeader = request.headers.authorization;
    const bearerToken = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length).trim()
      : null;

    if (!bearerToken) {
      next(new HttpError(401, 'Token de acceso requerido'));
      return;
    }

    try {
      const payload = jwt.verify(bearerToken, jwtSecret) as AuthUser;

      if (payload.role !== 'ADMIN') {
        next(
          new HttpError(403, 'No tienes permisos para acceder a este recurso'),
        );
        return;
      }

      (request as AuthenticatedRequest).authUser = payload;
      next();
    } catch {
      next(new HttpError(401, 'Token invalido o expirado'));
    }
  };
}

export function getAuthenticatedUser(request: AuthenticatedRequest) {
  const user = request.authUser;

  if (!user) {
    throw new HttpError(401, 'Usuario no autenticado');
  }

  return user;
}

export function extractRequestMetadata(
  request: AuthenticatedRequest,
): RequestMetadata {
  const forwardedFor = request.headers['x-forwarded-for'];
  const ipAddress =
    typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : request.ip;

  return {
    ipAddress: ipAddress || null,
    userAgent: request.headers['user-agent'] ?? null,
  };
}
