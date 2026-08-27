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

export interface TrustDevicePayload {
  userId: number;
  email: string;
  type: 'trusted_device';
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'chunna_secreto_super_seguro_2026';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '365d') as SignOptions['expiresIn'];
const TRUST_DEVICE_EXPIRES_IN: SignOptions['expiresIn'] = '30d'; // 1 mes (30 días)

/**
 * Genera un token JWT de sesión firmado con el payload del usuario
 */
export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Verifica y decodifica un token JWT de sesión
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/**
 * Genera un token de dispositivo de confianza para el administrador (validez de 30 días)
 */
export const generateTrustDeviceToken = (userId: number, email: string): string => {
  const payload: TrustDevicePayload = {
    userId,
    email: email.trim().toLowerCase(),
    type: 'trusted_device'
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TRUST_DEVICE_EXPIRES_IN
  });
};

/**
 * Verifica el token de dispositivo de confianza
 * Retorna el payload si es válido y no ha expirado, o null en caso contrario
 */
export const verifyTrustDeviceToken = (token: string): TrustDevicePayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TrustDevicePayload;
    if (decoded && decoded.type === 'trusted_device' && decoded.userId && decoded.email) {
      return decoded;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export { JWT_SECRET, JWT_EXPIRES_IN, TRUST_DEVICE_EXPIRES_IN };
