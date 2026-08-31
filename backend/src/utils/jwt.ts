import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'fallback_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
const ACCESS_EXP     = process.env.JWT_ACCESS_EXPIRES_IN  || '15m';
const REFRESH_EXP    = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export function signAccessToken(userId: string, role: UserRole): string {
  return jwt.sign(
    { userId, role, type: 'access' } satisfies JwtPayload,
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXP } as jwt.SignOptions
  );
}

export function signRefreshToken(userId: string, role: UserRole): string {
  return jwt.sign(
    { userId, role, type: 'refresh' } satisfies JwtPayload,
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXP } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
