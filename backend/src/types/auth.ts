import type { Request } from 'express';

export type AuthUser = {
  sub: string;
  username: string;
  role: string;
  fullName: string;
  firstName: string;
  lastName: string;
};

export type RequestMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuthenticatedRequest = Request & {
  authUser?: AuthUser;
};
