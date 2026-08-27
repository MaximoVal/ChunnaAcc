import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

/**
 * Middleware para proteger rutas exclusivas de administración
 * Requiere que la petición haya pasado previamente por authMiddleware
 */
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'No autenticado. Inicia sesión para continuar.'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de Administrador para realizar esta acción.'
    });
    return;
  }

  next();
};
