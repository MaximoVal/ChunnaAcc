import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op, Sequelize } from 'sequelize';
import { User, UserModel } from '../models/userModel.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { emailService } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chunna_secreto_super_seguro_2026';
const JWT_EXPIRES_IN = '365d'; // Mantiene la sesión iniciada por 1 año

/**
 * Registro de un nuevo usuario
 * SEGURIDAD: Siempre fuerza el rol a 'cliente' para impedir registros no autorizados como administrador
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, address, city, notes } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawEmail = String(email || '').trim();

    // Verificar si el correo ya existe
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          { email: rawEmail }
        ]
      }
    }) || await UserModel.findByEmail(cleanEmail);

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'El correo electrónico ya se encuentra registrado.'
      });
      return;
    }

    // Hashear la contraseña de forma segura
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el usuario en la BD SIEMPRE con rol 'cliente'
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'cliente',
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
      city: city ? city.trim() : null,
      notes: notes ? notes.trim() : null
    });

    // Generar el token JWT incluyendo el rol
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, otp_code: __, otp_expires: ___, ...userData } = newUser.get({ plain: true });

    res.status(201).json({
      success: true,
      message: '¡Registro exitoso! Bienvenido a Chunna Accesorios.',
      token,
      user: userData
    });
  } catch (error: any) {
    console.error('Error en el registro:', error);
    res.status(500).json({
      success: false,
      message: 'Ocurrió un error al procesar el registro en el servidor.'
    });
  }
};

/**
 * Inicio de sesión con soporte 2FA para administradores
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawEmail = String(email || '').trim();

    console.log(`\n👉 [LOGIN INTENTO] Buscando usuario: "${cleanEmail}" (raw: "${rawEmail}")`);

    // Buscar al usuario de manera insensible a mayúsculas/minúsculas
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          { email: rawEmail }
        ]
      }
    }) || await User.findOne({
      where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('email')), cleanEmail)
    }) || await UserModel.findByEmail(cleanEmail);

    if (!user || !user.password) {
      console.warn(`⚠️ [LOGIN FALLIDO] Usuario no encontrado en la base de datos: "${cleanEmail}"`);
      res.status(401).json({
        success: false,
        message: 'No existe ninguna cuenta registrada con este correo electrónico.'
      });
      return;
    }

    console.log(`👤 [LOGIN USUARIO ENCONTRADO] ID=${user.id}, Nombre="${user.name}", Rol="${user.role}", Email="${user.email}"`);

    // Comparar la contraseña ingresada con el hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(`⚠️ [LOGIN FALLIDO] Contraseña incorrecta para el usuario: "${user.email}"`);
      res.status(401).json({
        success: false,
        message: 'La contraseña ingresada es incorrecta. Por favor verifícala.'
      });
      return;
    }

    console.log(`✅ [LOGIN CONTRASEÑA VÁLIDA] Autenticación de credenciales exitosa para: "${user.email}"`);

    // SI ES ADMIN: Habilitar autenticación de doble factor (2FA)
    if (user.role === 'admin') {
      // Generar código OTP de 6 dígitos numéricos
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de validez

      // Guardar OTP en la base de datos
      await User.update({ otp_code: otpCode, otp_expires: otpExpires }, { where: { id: user.id } });

      // Disparar envío de correo
      emailService.sendAdminOtpEmail({
        to: user.email,
        userName: user.name,
        otpCode
      });

      // Responder de inmediato al navegador para que solicite el código
      res.status(200).json({
        success: true,
        requires2FA: true,
        message: `Por seguridad, te enviamos un código de verificación de 6 dígitos a ${user.email}.`
      });
      return;
    }

    // Para clientes normales: Generar el token JWT directamente
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Retornar datos del usuario sin la contraseña ni tokens internos
    const { password: _, otp_code: __, otp_expires: ___, ...userData } = (user instanceof User ? user.get({ plain: true }) : user) as any;

    res.status(200).json({
      success: true,
      message: `¡Bienvenido/a de nuevo, ${user.name}!`,
      token,
      user: userData
    });
  } catch (error: any) {
    console.error('Error en el login:', error);
    res.status(500).json({
      success: false,
      message: 'Ocurrió un error en el servidor al intentar iniciar sesión.'
    });
  }
};

/**
 * Verificar código 2FA para administradores
 */
export const verifyAdminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, otp_code } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawEmail = String(email || '').trim();
    const cleanOtp = String(otp_code || '').replace(/\D/g, '').trim();

    console.log(`\n👉 [2FA VERIFY INTENTO] Buscando Admin: "${cleanEmail}", Código ingresado: "${cleanOtp}"`);

    if (!cleanEmail) {
      res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido.'
      });
      return;
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      res.status(400).json({
        success: false,
        message: 'El código de verificación debe tener 6 dígitos numéricos.'
      });
      return;
    }

    // Buscar al usuario administrador
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          { email: rawEmail }
        ]
      }
    }) || await User.findOne({
      where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('email')), cleanEmail)
    });

    if (!user || user.role !== 'admin') {
      console.warn(`⚠️ [2FA VERIFY FALLIDO] No se encontró cuenta de admin para: "${cleanEmail}"`);
      res.status(401).json({
        success: false,
        message: 'No se encontró una cuenta de Administrador con el correo electrónico proporcionado.'
      });
      return;
    }

    // Si se envía contraseña, verificarla opcionalmente por seguridad adicional
    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.warn(`⚠️ [2FA VERIFY FALLIDO] Contraseña incorrecta para: "${user.email}"`);
        res.status(401).json({
          success: false,
          message: 'La contraseña ingresada es incorrecta.'
        });
        return;
      }
    }

    // Verificar código OTP
    const storedOtp = String(user.otp_code || '').trim();
    if (!storedOtp || storedOtp !== cleanOtp) {
      console.warn(`⚠️ [2FA VERIFY FALLIDO] Código no coincide para '${user.email}'. Recibido: '${cleanOtp}', Esperado: '${storedOtp}'`);
      res.status(401).json({
        success: false,
        message: 'El código de verificación ingresado es incorrecto.'
      });
      return;
    }

    // Verificar si el código ha expirado
    const isExpired = !user.otp_expires || new Date(user.otp_expires).getTime() < Date.now();
    if (isExpired) {
      console.warn(`⚠️ [2FA VERIFY FALLIDO] Código expirado para '${user.email}'. Expiración: ${user.otp_expires}`);
      res.status(401).json({
        success: false,
        message: 'El código de verificación ha expirado (validez de 10 minutos). Solicita un nuevo código.'
      });
      return;
    }

    // Limpiar el código OTP tras una verificación exitosa
    await user.update({ otp_code: null, otp_expires: null });

    // Generar el token JWT para el administrador
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, otp_code: __, otp_expires: ___, ...userData } = user.get({ plain: true });

    console.log(`👑 [2FA VERIFY EXITOSO] ¡Sesión concedida al Administrador ${user.name} (${user.email})!`);

    res.status(200).json({
      success: true,
      message: `¡Acceso de administrador concedido, ${user.name}!`,
      token,
      user: userData
    });
  } catch (error: any) {
    console.error('Error verificando 2FA:', error);
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
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawEmail = String(email || '').trim();

    if (!cleanEmail) {
      res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido.'
      });
      return;
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          { email: rawEmail }
        ]
      }
    }) || await User.findOne({
      where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('email')), cleanEmail)
    });

    if (!user || user.role !== 'admin') {
      res.status(401).json({
        success: false,
        message: 'No se encontró la cuenta de Administrador.'
      });
      return;
    }

    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
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

    await user.update({ otp_code: otpCode, otp_expires: otpExpires });

    // Enviar nuevo correo
    emailService.sendAdminOtpEmail({
      to: user.email,
      userName: user.name,
      otpCode
    });

    res.status(200).json({
      success: true,
      message: `Hemos enviado un nuevo código de verificación a ${user.email}.`
    });
  } catch (error: any) {
    console.error('Error al reenviar OTP 2FA:', error);
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
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la información del perfil.'
    });
  }
};

/**
 * Actualizar datos simples del perfil (seguimiento de comprador)
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
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el perfil en el servidor.'
    });
  }
};
