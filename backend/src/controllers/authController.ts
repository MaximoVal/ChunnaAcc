import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/userModel.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { generateToken, generateTrustDeviceToken, verifyTrustDeviceToken } from '../config/jwt.js';
import { emailService } from '../services/emailService.js';

/**
 * Registro de un nuevo usuario
 * SEGURIDAD: Siempre fuerza el rol a 'cliente' para impedir registros no autorizados como administrador
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, address, city, notes } = req.body;

    // Verificar si el correo ya existe en la base de datos
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'El correo electrónico ya se encuentra registrado.'
      });
      return;
    }

    // Hashear la contraseña con bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el usuario SIEMPRE con rol 'cliente'
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'cliente',
      phone,
      address,
      city,
      notes
    });

    // Generar el token JWT
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    });

    res.status(201).json({
      success: true,
      message: '¡Registro exitoso! Bienvenido a Chunna Accesorios.',
      token,
      user: newUser.toSafeObject()
    });
  } catch (error: any) {
    console.error('❌ [AUTH ERROR] Error en registro:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Ocurrió un error al procesar el registro en el servidor.'
    });
  }
};

/**
 * Helper para verificar la contraseña de forma segura con bcrypt.
 * Soporta hashes bcrypt y fallback con auto-migración para contraseñas en texto plano.
 */
const verifyUserPassword = async (plainPassword: string, user: any): Promise<boolean> => {
  const storedPassword = String(user.password || user.getDataValue?.('password') || '').trim();
  if (!storedPassword || !plainPassword) return false;

  let isValid = false;

  // 1. Comparación con bcrypt
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
    try {
      isValid = await bcrypt.compare(plainPassword, storedPassword);
    } catch (err) {
      console.warn('⚠️ Error al verificar hash bcrypt:', err);
    }
  }

  // 2. Fallback: Verificación en texto plano (ej: cuentas migradas o creadas por script inicial)
  if (!isValid && storedPassword === plainPassword) {
    isValid = true;
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      await UserModel.updatePassword(user.id, hashedPassword);
      console.log(`🔒 Contraseña migrada automáticamente a hash bcrypt para usuario ID ${user.id}`);
    } catch (err) {
      console.error('Error al migrar contraseña a bcrypt:', err);
    }
  }

  return isValid;
};

/**
 * Inicio de sesión con soporte 2FA y dispositivos de confianza (recordar dispositivo por 30 días)
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, trust_token } = req.body;

    // Buscar al usuario por email normalizado
    const user = await UserModel.findByEmail(email);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario y/o contraseña invalidos.'
      });
      return;
    }

    // Verificar la contraseña encriptada con bcrypt
    const isPasswordValid = await verifyUserPassword(password, user);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Usuario y/o contraseña invalidos.'
      });
      return;
    }

    // FLUJO ADMIN: Autenticación de dos factores o Dispositivo de Confianza (30 días)
    if (user.role === 'admin') {
      // 1. Comprobar si el navegador/dispositivo ya fue verificado en los últimos 30 días
      if (trust_token) {
        const trustPayload = verifyTrustDeviceToken(String(trust_token));
        if (trustPayload && trustPayload.userId === user.id && trustPayload.email === user.email) {
          console.log(`🛡️ [ADMIN LOGIN] Dispositivo de confianza verificado (30 días) para: ${user.email}`);

          const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'admin'
          });

          // Refrescar el token de dispositivo de confianza (extender 30 días adicionales)
          const newTrustToken = generateTrustDeviceToken(user.id, user.email);

          res.status(200).json({
            success: true,
            message: `¡Bienvenido de nuevo, ${user.name}!`,
            token,
            adminTrustToken: newTrustToken,
            user: user.toSafeObject()
          });
          return;
        }
      }

      // 2. Si no es un dispositivo de confianza o el token expiró (> 30 días): solicitar OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Guardar OTP en BD
      await UserModel.setOtp(user.id, otpCode, otpExpires);

      // Enviar correo con Resend (asíncrono con manejo interno de errores)
      emailService.sendAdminOtpEmail({
        to: user.email,
        userName: user.name,
        otpCode
      }).catch((err) => {
        console.error('❌ [EMAIL BACKGROUND ERROR]', err);
      });

      res.status(200).json({
        success: true,
        requires2FA: true,
        message: `Por seguridad, te enviamos un código de verificación de 6 dígitos a ${user.email}.`
      });
      return;
    }

    // FLUJO CLIENTE: Emitir token de acceso JWT directamente
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: `¡Bienvenido/a de nuevo, ${user.name}!`,
      token,
      user: user.toSafeObject()
    });
  } catch (error: any) {
    console.error('❌ [AUTH ERROR] Error en login:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Ocurrió un error en el servidor al intentar iniciar sesión.'
    });
  }
};

/**
 * Verificar código 2FA para administradores y registrar el dispositivo como confiable (30 días)
 */
export const verifyAdminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, otp_code } = req.body;

    const user = await UserModel.findByEmail(email);

    if (!user || user.role !== 'admin') {
      res.status(401).json({
        success: false,
        message: 'No se encontró una cuenta de Administrador con el correo electrónico proporcionado.'
      });
      return;
    }

    // Si se adjunta contraseña, validarla
    if (password) {
      const isPasswordValid = await verifyUserPassword(password, user);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'La contraseña ingresada es incorrecta.'
        });
        return;
      }
    }

    // Validar código OTP
    const storedOtp = String(user.otp_code || '').trim();
    if (!storedOtp || storedOtp !== otp_code) {
      res.status(401).json({
        success: false,
        message: 'El código de verificación ingresado es incorrecto.'
      });
      return;
    }

    // Validar expiración del OTP
    const isExpired = !user.otp_expires || new Date(user.otp_expires).getTime() < Date.now();
    if (isExpired) {
      res.status(401).json({
        success: false,
        message: 'El código de verificación ha expirado (validez de 10 minutos). Solicita uno nuevo.'
      });
      return;
    }

    // Limpiar el código OTP una vez usado
    await UserModel.clearOtp(user.id);

    // Emitir el token JWT de sesión
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'admin'
    });

    // Generar token de dispositivo de confianza (30 días)
    const adminTrustToken = generateTrustDeviceToken(user.id, user.email);

    console.log(`👑 [ADMIN 2FA EXITOSO] Sesión concedida y dispositivo registrado por 30 días: ${user.email}`);

    res.status(200).json({
      success: true,
      message: `¡Acceso de administrador concedido, ${user.name}!`,
      token,
      adminTrustToken,
      user: user.toSafeObject()
    });
  } catch (error: any) {
    console.error('❌ [AUTH ERROR] Error al verificar 2FA:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Ocurrió un error en el servidor al verificar el código.'
    });
  }
};

/**
 * Reenviar código OTP 2FA para el administrador
 */
export const resendAdminOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);

    if (!user || user.role !== 'admin') {
      res.status(401).json({
        success: false,
        message: 'No se encontró la cuenta de Administrador.'
      });
      return;
    }

    if (password) {
      const isPasswordValid = await verifyUserPassword(password, user);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Contraseña incorrecta.'
        });
        return;
      }
    }

    // Generar nuevo código OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await UserModel.setOtp(user.id, otpCode, otpExpires);

    // Enviar correo con Resend
    emailService.sendAdminOtpEmail({
      to: user.email,
      userName: user.name,
      otpCode
    }).catch((err) => {
      console.error('❌ [EMAIL BACKGROUND ERROR]', err);
    });

    res.status(200).json({
      success: true,
      message: `Hemos enviado un nuevo código de verificación a ${user.email}.`
    });
  } catch (error: any) {
    console.error('❌ [AUTH ERROR] Error al reenviar OTP:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al reenviar el código.'
    });
  }
};

/**
 * Obtener el perfil del usuario autenticado
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'No autenticado.'
      });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('❌ [AUTH ERROR] Error al obtener perfil:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la información del perfil.'
    });
  }
};

/**
 * Actualizar datos del perfil de usuario autenticado
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'No autenticado.'
      });
      return;
    }

    const { name, phone, address, city, notes } = req.body;

    const updated = await UserModel.updateProfile(req.user.id, {
      name,
      phone,
      address,
      city,
      notes
    });

    if (!updated) {
      res.status(400).json({
        success: false,
        message: 'No se pudieron actualizar los datos del perfil.'
      });
      return;
    }

    const updatedUser = await UserModel.findById(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente.',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('❌ [AUTH ERROR] Error al actualizar perfil:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el perfil en el servidor.'
    });
  }
};
