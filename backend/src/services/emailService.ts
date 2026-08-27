import nodemailer from 'nodemailer';

export interface SendOtpEmailParams {
  to: string;
  userName: string;
  otpCode: string;
}

/**
 * Servicio robusto de envío de correos electrónicos para Chunna Accesorios
 * 
 * Soporta múltiples estrategias de envío:
 * 1. Resend API (HTTP REST vía HTTPS - 100% inmune a bloqueos de puertos en Render)
 * 2. Brevo API (HTTP REST vía HTTPS)
 * 3. Custom SMTP (Nodemailer con servidor personalizado)
 * 4. Gmail SMTP (Nodemailer forzando IPv4 en puertos 465 SSL y 587 STARTTLS)
 */
class EmailService {
  /**
   * Genera el HTML y texto plano para el correo de código OTP 2FA
   */
  private generateOtpEmailTemplate(userName: string, otpCode: string) {
    const textContent = `Hola ${userName},\n\nTu código de verificación para ingresar como Administrador en Chunna Accesorios es: ${otpCode}\n\nEste código tiene una validez de 10 minutos.\nSi no solicitaste este código, por favor ignora este mensaje.\n\n— Equipo de Chunna Accesorios`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificación Administrador</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f6f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2c2523;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f6f4; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="520" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #efe8e4;" cellspacing="0" cellpadding="0" border="0">
          
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
                  Hola <strong>${userName}</strong>, usa el siguiente código de seguridad para iniciar sesión:
                </p>
              </div>

              <!-- Caja del Código OTP -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                <tr>
                  <td align="center" style="background-color: #fbf7f4; border: 2px dashed #d97757; border-radius: 12px; padding: 22px 15px;">
                    <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #d97757; font-family: 'Courier New', Courier, monospace;">
                      ${otpCode}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Información de Seguridad -->
              <div style="background-color: #f8fafc; border-left: 4px solid #d97757; padding: 12px 15px; border-radius: 6px; margin: 20px 0 10px 0;">
                <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                  ⏳ <strong>Tiempo de validez:</strong> 10 minutos.<br>
                  🛡️ <strong>Seguridad:</strong> Nunca compartas este código con nadie.
                </p>
              </div>

              <p style="margin: 25px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5; text-align: center;">
                Si tú no intentaste iniciar sesión en el panel de administración, puedes ignorar este mensaje con total seguridad.
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
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

    return { textContent, htmlContent };
  }

  /**
   * Intento 1: Envío mediante Resend API (HTTP REST vía HTTPS)
   * Extremadamente confiable en Render (no usa puertos SMTP, usa HTTPS nativo).
   */
  private async sendViaResend(to: string, userName: string, otpCode: string, html: string, text: string): Promise<boolean> {
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    if (!resendApiKey) return false;

    const fromEmail = process.env.RESEND_FROM || 'Chunna Accesorios <onboarding@resend.dev>';

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: `🔐 Código de acceso Admin: ${otpCode} - Chunna Accesorios`,
          html,
          text
        })
      });

      if (response.ok) {
        console.log(`✅ [EMAIL SERVICE] Correo OTP enviado exitosamente a ${to} mediante Resend API (HTTP REST).`);
        return true;
      } else {
        const errorData = await response.text();
        console.warn(`⚠️ [EMAIL SERVICE] Resend API devolvió error (${response.status}): ${errorData}`);
      }
    } catch (err: any) {
      console.warn(`⚠️ [EMAIL SERVICE] Falló el envío por Resend API:`, err?.message || err);
    }
    return false;
  }

  /**
   * Intento 2: Envío mediante Brevo API (HTTP REST vía HTTPS)
   */
  private async sendViaBrevo(to: string, userName: string, otpCode: string, html: string, text: string): Promise<boolean> {
    const brevoApiKey = process.env.BREVO_API_KEY?.trim();
    if (!brevoApiKey) return false;

    const senderEmail = process.env.EMAIL_USER?.trim() || 'cunna.accs@gmail.com';

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Chunna Accesorios', email: senderEmail },
          to: [{ email: to, name: userName }],
          subject: `🔐 Código de acceso Admin: ${otpCode} - Chunna Accesorios`,
          htmlContent: html,
          textContent: text
        })
      });

      if (response.ok) {
        console.log(`✅ [EMAIL SERVICE] Correo OTP enviado exitosamente a ${to} mediante Brevo API (HTTP REST).`);
        return true;
      } else {
        const errorData = await response.text();
        console.warn(`⚠️ [EMAIL SERVICE] Brevo API devolvió error (${response.status}): ${errorData}`);
      }
    } catch (err: any) {
      console.warn(`⚠️ [EMAIL SERVICE] Falló el envío por Brevo API:`, err?.message || err);
    }
    return false;
  }

  /**
   * Intento 3: Envío mediante Custom SMTP si está definido
   */
  private async sendViaCustomSmtp(to: string, userName: string, otpCode: string, html: string, text: string): Promise<boolean> {
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();

    if (!smtpHost || !smtpUser || !smtpPass) return false;

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000
      } as any);

      await transporter.sendMail({
        from: `"Chunna Accesorios" <${smtpUser}>`,
        to,
        subject: `🔐 Código de acceso Admin: ${otpCode} - Chunna Accesorios`,
        html,
        text
      });

      console.log(`✅ [EMAIL SERVICE] Correo OTP enviado exitosamente a ${to} mediante SMTP Personalizado (${smtpHost}:${smtpPort}).`);
      return true;
    } catch (err: any) {
      console.warn(`⚠️ [EMAIL SERVICE] Falló el envío por Custom SMTP (${smtpHost}):`, err?.message || err);
    }
    return false;
  }

  /**
   * Intento 4: Envío mediante Gmail SMTP forzando IPv4 en puertos 465 (SSL) y 587 (STARTTLS)
   */
  private async sendViaGmailSmtp(to: string, userName: string, otpCode: string, html: string, text: string): Promise<boolean> {
    const emailUser = (process.env.EMAIL_USER || 'cunna.accs@gmail.com').trim();
    // Limpiar todos los espacios de la contraseña de aplicación de Google
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

    if (!emailPass) {
      console.warn('\n================================================================');
      console.warn('⚠️ [AVISO DE CONFIGURACIÓN DE CORREO EN RENDER]');
      console.warn('La variable EMAIL_PASS (Contraseña de aplicación de Google) no está configurada en Render.');
      console.warn('Para recibir los correos de 2FA en tu bandeja de entrada:');
      console.warn('1. Ve a tu Cuenta de Google -> Seguridad -> Contraseñas de aplicaciones.');
      console.warn('2. Genera una nueva contraseña (16 letras).');
      console.warn('3. Agrégala en Render Dashboard -> Environment: EMAIL_PASS = tu_contraseña_sin_espacios');
      console.warn('================================================================\n');
      return false;
    }

    const mailOptions = {
      from: `"Chunna Accesorios" <${emailUser}>`,
      to,
      subject: `🔐 Código de acceso Admin: ${otpCode} - Chunna Accesorios`,
      html,
      text
    };

    // Sub-intento 4a: Puerto 465 (SSL directo) forzando IPv4 (family: 4)
    try {
      const transporter465 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4,
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 9000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      } as any);

      await transporter465.sendMail(mailOptions);
      console.log(`✅ [EMAIL SERVICE] Correo OTP enviado exitosamente a ${to} vía Gmail SMTP (Puerto 465 SSL IPv4).`);
      return true;
    } catch (err465: any) {
      console.warn(`⚠️ [EMAIL SERVICE] Puerto 465 SSL falló (${err465?.message}). Probando con Puerto 587 STARTTLS...`);
    }

    // Sub-intento 4b: Puerto 587 (STARTTLS) forzando IPv4 (family: 4)
    try {
      const transporter587 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        family: 4,
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 9000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      } as any);

      await transporter587.sendMail(mailOptions);
      console.log(`✅ [EMAIL SERVICE] Correo OTP enviado exitosamente a ${to} vía Gmail SMTP (Puerto 587 STARTTLS IPv4).`);
      return true;
    } catch (err587: any) {
      console.error(`❌ [EMAIL SERVICE ERROR] Falló el envío por Gmail SMTP en ambos puertos: ${err587?.message || err587}`);
      if (String(err587?.message || '').includes('535') || String(err587?.message || '').includes('BadCredentials')) {
        console.error('👉 Tip: El error 535 indica que la contraseña de aplicación de Google (EMAIL_PASS) es incorrecta o expiró.');
      }
    }

    return false;
  }

  /**
   * Método público para enviar el código de verificación 2FA
   * Ejecuta las estrategias en cascada e imprime el código de rescate en consola.
   */
  public async sendAdminOtpEmail({ to, userName, otpCode }: SendOtpEmailParams): Promise<boolean> {
    const { htmlContent, textContent } = this.generateOtpEmailTemplate(userName, otpCode);

    // Banner de seguridad en consola de Render para acceso instantáneo de emergencia
    console.log('\n================================================================');
    console.log('🔑 [ADMIN 2FA - CÓDIGO DE VERIFICACIÓN GENERADO]');
    console.log(`   Destinatario: ${to} (${userName})`);
    console.log(`   Código OTP:   >>> ${otpCode} <<<`);
    console.log(`   Validez:      10 minutos`);
    console.log('================================================================\n');

    // 1. Probar Resend API (HTTP REST)
    if (process.env.RESEND_API_KEY) {
      const sent = await this.sendViaResend(to, userName, otpCode, htmlContent, textContent);
      if (sent) return true;
    }

    // 2. Probar Brevo API (HTTP REST)
    if (process.env.BREVO_API_KEY) {
      const sent = await this.sendViaBrevo(to, userName, otpCode, htmlContent, textContent);
      if (sent) return true;
    }

    // 3. Probar Custom SMTP si está definido
    if (process.env.SMTP_HOST) {
      const sent = await this.sendViaCustomSmtp(to, userName, otpCode, htmlContent, textContent);
      if (sent) return true;
    }

    // 4. Probar Gmail SMTP con IPv4
    const sentGmail = await this.sendViaGmailSmtp(to, userName, otpCode, htmlContent, textContent);
    return sentGmail;
  }
}

export const emailService = new EmailService();
export default emailService;
