import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chunna_secreto_super_seguro_2026';
const JWT_EXPIRES_IN = '365d'; // Mantiene la sesión iniciada por 1 año

/**
 * Registro de un nuevo usuario
 * SEGURIDAD: Siempre fuerza el rol a 'cliente' para impedir registros no autorizados como administrador
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, address, city, notes } = req.body;

    // Verificar si el correo ya existe
    const existingUser = await UserModel.findByEmail(email);
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
    const userId = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'cliente',
      phone,
      address,
      city,
      notes
    });

    // Generar el token JWT incluyendo el rol
    const token = jwt.sign(
      { id: userId, email, name, role: 'cliente' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const createdUser = await UserModel.findById(userId);

    res.status(201).json({
      success: true,
      message: '¡Registro exitoso! Bienvenido a Chunna Accesorios.',
      token,
      user: createdUser
    });
  } catch (error: any) {
    console.error('Error en el registro:', error);
    res.status(500).json({
      success: false,
      message: 'Ocurrió un error al procesar el registro en el servidor.'
    });
  }
};

import nodemailer from 'nodemailer';
import { User } from '../models/userModel.js'; // To access sequelize model directly for updates

// Helper para instanciar transportador de nodemailer de forma segura y dinámica
const getMailTransporter = () => {
  const emailUser = (process.env.EMAIL_USER || 'cunna.accs@gmail.com').trim();
  const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, ''); // Elimina espacios si se copió "xxxx xxxx xxxx xxxx"

  return {
    emailUser,
    emailPass,
    transporter: nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL en puerto 465
      auth: {
        user: emailUser,
        pass: emailPass
      },
      connectionTimeout: 5000, // 5 segundos máximo para conectar
      greetingTimeout: 5000,
      socketTimeout: 8000
    })
  };
};

/**
 * Inicio de sesión con soporte 2FA para administradores
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Buscar al usuario por correo
    const user = await UserModel.findByEmail(email);
    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Verifica tu correo y contraseña.'
      });
      return;
    }

    // Comparar la contraseña ingresada con el hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Verifica tu correo y contraseña.'
      });
      return;
    }

    // SI ES ADMIN: Habilitar 2FA
    if (user.role === 'admin') {
      // Generar código OTP de 6 dígitos
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutos de validez

      // Guardar OTP en la base de datos
      await User.update({ otp_code: otpCode, otp_expires: otpExpires }, { where: { id: user.id } });

      const { emailUser, emailPass, transporter } = getMailTransporter();

      // Imprimir de inmediato en logs de Render para acceso instantáneo
      console.log(`🔑 [ADMIN 2FA CODE]: El código para ${user.email} es: ${otpCode}`);

      // Enviar correo de forma 100% asíncrona (no bloquea la respuesta HTTP al navegador)
      if (emailPass) {
        transporter.sendMail({
          from: `"Chunna Accesorios" <${emailUser}>`,
          to: user.email,
          subject: `🔐 Código de verificación Admin: ${otpCode}`,
          text: `Hola ${user.name},\n\nTu código de verificación para ingresar como Administrador es: ${otpCode}\n\nEste código expira en 10 minutos.\nSi no intentaste iniciar sesión, ignora este mensaje.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #c86d51; margin: 0; font-size: 24px; font-weight: 700;">Chunna Accesorios</h2>
                <p style="color: #666; font-size: 13px; margin-top: 4px;">Seguridad de la Cuenta Administrador</p>
              </div>
              <p style="font-size: 15px; color: #333; margin-bottom: 12px;">Hola <strong>${user.name}</strong>,</p>
              <p style="font-size: 14px; color: #555; line-height: 1.5;">Ingresa el siguiente código de verificación de 6 dígitos en la tienda para confirmar tu identidad:</p>
              <div style="background-color: #fcf4f1; border: 1.5px dashed #c86d51; padding: 18px; text-align: center; border-radius: 8px; margin: 22px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #c86d51;">${otpCode}</span>
              </div>
              <p style="color: #777; font-size: 13px; margin-bottom: 4px;">⏳ <strong>Tiempo de validez:</strong> 10 minutos.</p>
              <p style="color: #aaa; font-size: 12px; margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">Si tú no solicitaste este código, por favor ignora este correo.</p>
            </div>
          `
        }).then(() => {
          console.log(`✅ [2FA] Correo con código OTP enviado exitosamente a ${user.email}`);
        }).catch((mailError: any) => {
          console.error('❌ [2FA ERROR] No se pudo enviar el correo vía Gmail SMTP:', mailError?.message || mailError);
        });
      } else {
        console.warn('⚠️ [ALERTA 2FA]: La variable EMAIL_PASS no está configurada en Render.');
      }

      // Responder INMEDIATAMENTE al navegador para que muestre el campo del código al instante
      res.status(200).json({
        success: true,
        requires2FA: true,
        message: 'Por seguridad, te enviamos un código de verificación de 6 dígitos a tu correo.'
      });
      return;
    }

    // Generar el token JWT incluyendo el rol (para clientes normales)
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Retornar datos del usuario sin la contraseña
    const { password: _, ...userData } = user;

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

    const user = await User.findOne({ where: { email } });
    if (!user || user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'No autorizado' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      return;
    }

    // Verificar OTP
    if (user.otp_code !== otp_code || !user.otp_expires || new Date() > user.otp_expires) {
      res.status(401).json({ success: false, message: 'El código de verificación es inválido o ha expirado.' });
      return;
    }

    // Limpiar OTP
    await user.update({ otp_code: null, otp_expires: null });

    // Generar el token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, otp_code: __, otp_expires: ___, ...userData } = user.get({ plain: true });

    res.status(200).json({
      success: true,
      message: `¡Acceso de administrador concedido, ${user.name}!`,
      token,
      user: userData
    });
  } catch (error: any) {
    console.error('Error verificando 2FA:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor.' });
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
