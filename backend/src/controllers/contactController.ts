import { Request, Response } from 'express';
import { emailService } from '../services/emailService.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Controlador para procesar y enviar mensajes del formulario de contacto
 */
export const handleContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, nombre, email, mail, message, mensaje } = req.body;

    const contactName = String(name || nombre || '').trim();
    const contactEmail = String(email || mail || '').trim().toLowerCase();
    const contactMessage = String(message || mensaje || '').trim();

    if (!contactName) {
      res.status(400).json({
        success: false,
        message: 'Por favor, ingresa tu nombre.'
      });
      return;
    }

    if (!contactEmail || !EMAIL_REGEX.test(contactEmail)) {
      res.status(400).json({
        success: false,
        message: 'Por favor, ingresa un correo electrónico válido.'
      });
      return;
    }

    if (!contactMessage) {
      res.status(400).json({
        success: false,
        message: 'Por favor, ingresa tu mensaje.'
      });
      return;
    }

    // Enviar el correo mediante el servicio de email (Resend)
    await emailService.sendContactFormEmail({
      name: contactName,
      email: contactEmail,
      message: contactMessage
    });

    res.status(200).json({
      success: true,
      message: '¡Datos enviados correctamente! Muchas gracias por ponerte en contacto con Chunna Accesorios.'
    });
  } catch (error: any) {
    console.error('❌ [CONTACT ERROR] Error procesando formulario de contacto:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Ocurrió un error al enviar tu mensaje. Por favor, intenta nuevamente.'
    });
  }
};
