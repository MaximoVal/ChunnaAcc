import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

export interface SendOtpEmailParams {
  to: string;
  userName: string;
  otpCode: string;
}

export interface SendContactEmailParams {
  name: string;
  email: string;
  message: string;
}

/**
 * Servicio de envío de correos electrónicos mediante el SDK oficial de Resend
 * 100% inmune a bloqueos de puertos SMTP en entornos cloud como Render (vía HTTPS REST API).
 */
class EmailService {
  private resendClient: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (apiKey) {
      this.resendClient = new Resend(apiKey);
    }
    this.fromEmail = process.env.RESEND_FROM?.trim() || 'Chunna Accesorios <onboarding@resend.dev>';
  }

  /**
   * Obtiene o inicializa la instancia de Resend bajo demanda
   */
  private getClient(): Resend | null {
    if (!this.resendClient) {
      const apiKey = process.env.RESEND_API_KEY?.trim();
      if (apiKey) {
        this.resendClient = new Resend(apiKey);
      }
    }
    return this.resendClient;
  }

  /**
   * Genera las plantillas de HTML y texto plano para el código OTP de Administrador
   */
  private generateOtpTemplate(userName: string, otpCode: string): { html: string; text: string } {
    const text = `Hola ${userName},\n\nTu código de verificación de 6 dígitos para ingresar como Administrador en Chunna Accesorios es: ${otpCode}\n\nEste código tiene una validez de 10 minutos.\nSi no solicitaste este código, por favor ignora este mensaje.\n\n— Equipo de Chunna Accesorios`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificación Administrador</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f6f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2c2523;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f6f4; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #efe8e4;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Encabezado de Marca -->
          <tr>
            <td style="background: linear-gradient(135deg, #2b3a4a 0%, #1a2530 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #d97757; text-transform: uppercase;">
                CHUNNA
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 3px; color: #d0d7de; text-transform: uppercase; font-weight: 500;">
                ACCESORIOS ARTESANALES
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 35px 30px;">
              <div style="text-align: center; margin-bottom: 25px;">
                <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #fdf2ee; color: #d97757; font-size: 22px; text-align: center;">
                  🔐
                </div>
                <h2 style="margin: 12px 0 0 0; font-size: 20px; color: #1a2530; font-weight: 700;">
                  Acceso de Administrador
                </h2>
                <p style="margin: 6px 0 0 0; font-size: 14px; color: #6e655f;">
                  Hola <strong>${userName}</strong>, usa el siguiente código de seguridad para iniciar sesión en tu panel:
                </p>
              </div>

              <!-- Código OTP -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                <tr>
                  <td align="center" style="background-color: #fbf7f4; border: 2px dashed #d97757; border-radius: 12px; padding: 22px 15px;">
                    <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #d97757; font-family: 'Courier New', Courier, monospace;">
                      ${otpCode}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Validez -->
              <div style="background-color: #f8fafc; border-left: 4px solid #d97757; padding: 12px 15px; border-radius: 6px; margin: 20px 0 10px 0;">
                <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                  ⏳ <strong>Validez:</strong> 10 minutos.<br>
                  🛡️ <strong>Seguridad:</strong> Nunca compartas este código con terceros.
                </p>
              </div>

              <p style="margin: 25px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5; text-align: center;">
                Si tú no solicitaste este código, puedes ignorar este correo de forma segura.
              </p>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color: #f8f6f4; padding: 20px 30px; border-top: 1px solid #efe8e4; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9c8e85;">
                © 2026 Chunna Accesorios. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return { html, text };
  }

  /**
   * Genera las plantillas de correo para mensajes del Formulario de Contacto
   */
  private generateContactTemplate(name: string, email: string, message: string): { html: string; text: string } {
    const formattedDate = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Cordoba' });

    const text = `📬 NUEVA CONSULTA DE CONTACTO - CHUNNA ACCESORIOS\n\nNombre: ${name}\nEmail: ${email}\nFecha: ${formattedDate}\n\nMensaje:\n${message}\n\n---\nPuedes responder directamente a este correo para contestarle al cliente.`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Consulta de Contacto</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f6f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2c2523;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f6f4; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #efe8e4;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Encabezado -->
          <tr>
            <td style="background: linear-gradient(135deg, #2b3a4a 0%, #1a2530 100%); padding: 25px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #d97757; text-transform: uppercase;">
                CHUNNA
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 3px; color: #d0d7de; text-transform: uppercase; font-weight: 500;">
                NUEVA CONSULTA DE CONTACTO
              </p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 30px 25px;">
              <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #1a2530; border-bottom: 2px solid #f2e9e4; padding-bottom: 10px;">
                💬 Detalles del Mensaje
              </h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 6px 0; color: #6e655f; font-size: 14px; width: 90px;"><strong>Cliente:</strong></td>
                  <td style="padding: 6px 0; color: #1a2530; font-size: 14px;"><strong>${name}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6e655f; font-size: 14px;"><strong>Email:</strong></td>
                  <td style="padding: 6px 0; color: #d97757; font-size: 14px;"><a href="mailto:${email}" style="color: #d97757; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6e655f; font-size: 14px;"><strong>Fecha:</strong></td>
                  <td style="padding: 6px 0; color: #6e655f; font-size: 14px;">${formattedDate}</td>
                </tr>
              </table>

              <div style="background-color: #fbf7f4; border-left: 4px solid #d97757; padding: 18px 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a44a2a; font-weight: 700;">Mensaje recibido:</p>
                <p style="margin: 0; font-size: 15px; color: #2c2523; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>

              <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-top: 25px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #475569;">
                  💡 Puedes responder directamente a este correo para contestarle a <strong>${name}</strong> (${email}).
                </p>
              </div>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color: #f8f6f4; padding: 15px 25px; border-top: 1px solid #efe8e4; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9c8e85;">
                Formulario de contacto de Chunna Accesorios
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return { html, text };
  }

  /**
   * Envía el código OTP de verificación 2FA al administrador mediante Resend SDK
   */
  public async sendAdminOtpEmail({ to, userName, otpCode }: SendOtpEmailParams): Promise<boolean> {
    // 1. Siempre registrar en los logs de la aplicación para acceso de emergencia
    console.log('\n================================================================');
    console.log('🔑 [ADMIN 2FA - CÓDIGO DE VERIFICACIÓN GENERADO]');
    console.log(`   Destinatario: ${to} (${userName})`);
    console.log(`   Código OTP:   >>> ${otpCode} <<<`);
    console.log(`   Validez:      10 minutos`);
    console.log('================================================================\n');

    const client = this.getClient();

    if (!client) {
      console.warn('⚠️ [RESEND EMAIL SERVICE] La variable RESEND_API_KEY no está configurada.');
      return false;
    }

    const { html, text } = this.generateOtpTemplate(userName, otpCode);

    try {
      const response = await client.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: `🔐 Código de acceso Admin: ${otpCode} - Chunna Accesorios`,
        html,
        text
      });

      if (response.error) {
        console.error('❌ [RESEND EMAIL ERROR] Falló el envío de correo:', response.error);
        return false;
      }

      console.log(`✅ [RESEND EMAIL SERVICE] Correo OTP enviado exitosamente a ${to} (Email ID: ${response.data?.id})`);
      return true;
    } catch (error: any) {
      console.error('❌ [RESEND EMAIL EXCEPTION] Error inesperado enviando correo:', error?.message || error);
      return false;
    }
  }

  /**
   * Envía el mensaje del formulario de contacto a la casilla del Administrador mediante Resend SDK
   */
  public async sendContactFormEmail({ name, email, message }: SendContactEmailParams): Promise<boolean> {
    const adminEmail = (process.env.ADMIN_EMAIL || 'cunna.accs@gmail.com').trim().toLowerCase();

    console.log(`\n📬 [CONTACT FORM] Nueva consulta de "${name}" (${email}) para ${adminEmail}`);

    const client = this.getClient();

    if (!client) {
      console.warn('⚠️ [RESEND EMAIL SERVICE] RESEND_API_KEY no configurada. Mensaje recibido en consola:');
      console.log(`   De: ${name} <${email}>\n   Mensaje: ${message}\n`);
      return true; // Retornar true para no bloquear la experiencia del usuario si aún no hay API key
    }

    const { html, text } = this.generateContactTemplate(name, email, message);

    try {
      const response = await client.emails.send({
        from: this.fromEmail,
        to: [adminEmail],
        replyTo: email,
        subject: `📬 Nueva consulta de contacto: ${name} - Chunna Accesorios`,
        html,
        text
      });

      if (response.error) {
        console.error('❌ [RESEND CONTACT ERROR] Falló el envío del formulario de contacto:', response.error);
        return false;
      }

      console.log(`✅ [RESEND CONTACT SERVICE] Formulario de contacto enviado a ${adminEmail} (Email ID: ${response.data?.id})`);
      return true;
    } catch (error: any) {
      console.error('❌ [RESEND CONTACT EXCEPTION] Error inesperado enviando formulario de contacto:', error?.message || error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
