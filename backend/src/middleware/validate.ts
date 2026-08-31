import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Drop this after any express-validator chain.
 * Returns 422 with all field errors if validation fails.
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.type === 'field' ? e.path : e.type, message: e.msg })),
    });
    return;
  }
  next();
}
