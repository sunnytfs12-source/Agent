import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

/** Must be used after authenticate(). Allows admin + superadmin only. */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'superadmin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
}

/** Must be used after authenticate(). Allows superadmin only. */
export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'superadmin') {
    res.status(403).json({ error: 'Superadmin access required.' });
    return;
  }
  next();
}
