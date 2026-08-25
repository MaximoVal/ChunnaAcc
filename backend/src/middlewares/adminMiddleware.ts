import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

/**
 * Middleware para proteger rutas exclusivas de administración
 */
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de Administrador.'
    });
    return;
  }
  next();
};
