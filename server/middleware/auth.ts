import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.js';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  req.user = user;
  next();
}
