import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { AppConfig } from '../config/app-config';

export class EmailService {
  private readonly transporter: Transporter | null;

  constructor(private readonly config: AppConfig) {
    if (
      !config.mail.host ||
      !config.mail.port ||
      !config.mail.user ||
      !config.mail.password
    ) {
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: {
        user: config.mail.user,
        pass: config.mail.password,
      },
    });
  }

  async sendVerificationEmail(params: {
    to: string;
    fullName: string;
    username: string;
    verificationUrl: string;
  }) {
    if (!this.transporter) {
      this.logVerificationLink(params.to, params.verificationUrl);

      return { delivery: 'LOG' as const };
    }

    try {
      await this.transporter.sendMail({
        from: this.config.mail.from,
        to: params.to,
        subject: 'Valida tu correo en Control Financiero',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2f241e;">
            <h2>Valida tu correo</h2>
            <p>Hola ${params.fullName},</p>
            <p>Tu cuenta fue creada correctamente. Puedes iniciar sesion de inmediato, pero te recomendamos validar el correo dentro de las proximas 24 horas.</p>
            <p><strong>Usuario generado:</strong> ${params.username}</p>
            <p>
              <a href="${params.verificationUrl}" style="display:inline-block;padding:12px 20px;background:#6f4e37;color:#ffffff;text-decoration:none;border-radius:999px;">
                Validar correo
              </a>
            </p>
            <p>Si el enlace vence, puedes solicitar uno nuevo desde tu perfil.</p>
          </div>
        `,
      });
    } catch (error) {
      console.warn(
        `No fue posible enviar el correo de verificacion a ${params.to}. Se registrara el enlace en el servidor.`,
        error,
      );
      this.logVerificationLink(params.to, params.verificationUrl);
      return { delivery: 'LOG' as const };
    }

    return { delivery: 'EMAIL' as const };
  }

  private logVerificationLink(email: string, verificationUrl: string) {
    console.warn(
      `SMTP no configurado. Link de verificacion para ${email}: ${verificationUrl}`,
    );
  }
}
