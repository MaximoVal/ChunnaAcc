import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

// Asegurar que las variables de entorno estén disponibles
dotenv.config();

export interface TokenPayload {
  id: number;
  email: string;
  name: string;
  role: 'cliente' | 'admin';
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'chunna_secreto_super_seguro_2026';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '365d') as SignOptions['expiresIn'];

/**
 * Genera un token JWT firmado con el payload del usuario
 */
export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Verifica y decodifica un token JWT
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export { JWT_SECRET, JWT_EXPIRES_IN };
