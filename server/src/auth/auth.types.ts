import { Request } from 'express';
import { AuthenticatedUser } from '../users/user.types.js';

export type TokenType = 'access' | 'refresh';

export interface AuthTokenPayload {
  sub: string;
  type: TokenType;
  role?: AuthenticatedUser['role'];
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface RequestMetadata {
  deviceInfo?: string;
  ipAddress?: string;
}
