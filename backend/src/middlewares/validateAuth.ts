import { Request, Response, NextFunction } from 'express';
import { normalizeEmail } from '../models/userModel.js';

// Expresión regular robusta para validar formato de correo electrónico
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Middleware para validar datos en el Registro de usuarios
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  let { name, email, password, phone, address, city, notes } = req.body;

  // Validación de Nombre
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('El nombre es obligatorio.');
  } else {
    name = name.trim();
    if (name.length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres.');
    } else if (name.length > 100) {
      errors.push('El nombre no puede exceder los 100 caracteres.');
    }
  }

  // Validación y normalización de Email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('El correo electrónico es obligatorio.');
  } else {
    email = normalizeEmail(email);
    if (!EMAIL_REGEX.test(email)) {
      errors.push('El formato del correo electrónico no es válido.');
    } else if (email.length > 150) {
      errors.push('El correo electrónico no puede exceder los 150 caracteres.');
    }
  }

  // Validación de Contraseña
  if (!password || typeof password !== 'string') {
    errors.push('La contraseña es obligatoria.');
  } else if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres.');
  } else if (password.length > 128) {
    errors.push('La contraseña no puede exceder los 128 caracteres.');
  }

  // Sanitización de campos opcionales
  if (phone !== undefined && phone !== null) {
    phone = typeof phone === 'string' ? phone.trim() : String(phone).trim();
    if (phone.length > 50) errors.push('El teléfono no puede exceder los 50 caracteres.');
  } else {
    phone = null;
  }

  if (address !== undefined && address !== null) {
    address = typeof address === 'string' ? address.trim() : String(address).trim();
    if (address.length > 255) errors.push('La dirección no puede exceder los 255 caracteres.');
  } else {
    address = null;
  }

  if (city !== undefined && city !== null) {
    city = typeof city === 'string' ? city.trim() : String(city).trim();
    if (city.length > 100) errors.push('La ciudad no puede exceder los 100 caracteres.');
  } else {
    city = null;
  }

  if (notes !== undefined && notes !== null) {
    notes = typeof notes === 'string' ? notes.trim() : String(notes).trim();
    if (notes.length > 1000) errors.push('Las notas no pueden exceder los 1000 caracteres.');
  } else {
    notes = null;
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Datos de registro inválidos.',
      errors
    });
    return;
  }

  req.body = {
    name,
    email,
    password,
    phone,
    address,
    city,
    notes
  };

  next();
};

/**
 * Middleware para validar datos en el Login
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  let { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('El correo electrónico es obligatorio.');
  } else {
    email = normalizeEmail(email);
    if (!EMAIL_REGEX.test(email)) {
      errors.push('El formato del correo electrónico no es válido.');
    }
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('La contraseña es obligatoria.');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Datos de inicio de sesión incompletos.',
      errors
    });
    return;
  }

  req.body = {
    email,
    password
  };

  next();
};

/**
 * Middleware para validar verificación de 2FA de Administrador
 */
export const validateAdminVerify = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  let { email, password, otp_code } = req.body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('El correo electrónico es requerido.');
  } else {
    email = normalizeEmail(email);
  }

  const cleanOtp = String(otp_code || '').replace(/\D/g, '').trim();
  if (!cleanOtp || cleanOtp.length !== 6) {
    errors.push('El código de verificación debe tener exactamente 6 dígitos numéricos.');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Datos de verificación incompletos o inválidos.',
      errors
    });
    return;
  }

  req.body = {
    email,
    password: password ? String(password) : undefined,
    otp_code: cleanOtp
  };

  next();
};

/**
 * Middleware para validar reenvío de OTP
 */
export const validateResendOtp = (req: Request, res: Response, next: NextFunction): void => {
  let { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'El correo electrónico es obligatorio.'
    });
    return;
  }

  req.body = {
    email: normalizeEmail(email),
    password: password ? String(password) : undefined
  };

  next();
};

/**
 * Middleware para validar actualización de datos de perfil
 */
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  let { name, phone, address, city, notes } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push('El nombre no puede estar vacío.');
    } else {
      name = name.trim();
      if (name.length < 2 || name.length > 100) {
        errors.push('El nombre debe tener entre 2 y 100 caracteres.');
      }
    }
  }

  if (phone !== undefined && phone !== null) {
    phone = typeof phone === 'string' ? phone.trim() : String(phone).trim();
    if (phone.length > 50) errors.push('El teléfono no puede superar los 50 caracteres.');
  }

  if (address !== undefined && address !== null) {
    address = typeof address === 'string' ? address.trim() : String(address).trim();
    if (address.length > 255) errors.push('La dirección no puede superar los 255 caracteres.');
  }

  if (city !== undefined && city !== null) {
    city = typeof city === 'string' ? city.trim() : String(city).trim();
    if (city.length > 100) errors.push('La ciudad no puede superar los 100 caracteres.');
  }

  if (notes !== undefined && notes !== null) {
    notes = typeof notes === 'string' ? notes.trim() : String(notes).trim();
    if (notes.length > 1000) errors.push('Las notas no pueden superar los 1000 caracteres.');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Error de validación al actualizar perfil.',
      errors
    });
    return;
  }

  req.body = {
    name,
    phone: phone !== undefined ? (phone || null) : undefined,
    address: address !== undefined ? (address || null) : undefined,
    city: city !== undefined ? (city || null) : undefined,
    notes: notes !== undefined ? (notes || null) : undefined
  };

  next();
};
