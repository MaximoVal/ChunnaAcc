import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../config/jwt.js';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware para proteger rutas que requieren autenticación JWT
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No autorizado. Se requiere un token de acceso válido en formato Bearer.'
      });
      return;
    }

    const token = authHeader.split(' ')[1]?.trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acceso no proporcionado.'
      });
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.id || !decoded.role) {
      res.status(401).json({
        success: false,
        message: 'Token con estructura o payload no válido.'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.'
    });
  }
};
