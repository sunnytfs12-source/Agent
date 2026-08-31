import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthRequest } from '../types';

/**
 * Protects any route that requires a logged-in user.
 * Reads the Bearer token from the Authorization header,
 * verifies it, and attaches { userId, role } to req.user.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type.' });
      return;
    }
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid.' });
  }
}
