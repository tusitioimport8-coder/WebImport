import nodemailer from "nodemailer";

export const enviarCorreoRecuperacion = async (
  destinatario: string,
  codigo: string,
) => {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER || process.env.MAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.MAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "Faltan credenciales de correo (EMAIL_USER/EMAIL_PASS o MAIL_USER/MAIL_PASS) en el entorno",
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: `"Tu Sitio Import" <${user}>`,
    to: destinatario,
    subject: "Tu Sitio Import - Código de recuperación de contraseña",
    html: `
  <div style="background-color: #fdf2f8; padding: 30px 15px; font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937;">
    <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(219, 39, 119, 0.12); border: 1px solid #fbcfe8;">
      
      <!-- Encabezado magenta / rosado -->
      <div style="background: linear-gradient(135deg, #831843 0%, #db2777 55%, #ec4899 100%); padding: 24px 20px; text-align: center;">
        <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.18); color: #fce7f3; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;">
          Importaciones &amp; Compras
        </span>
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 0.5px;">
          Tu Sitio Import
        </h1>
      </div>

      <!-- Cuerpo del mensaje -->
      <div style="padding: 28px 24px; line-height: 1.6;">
        <h2 style="margin-top: 0; font-size: 19px; color: #111827;">
          Recuperación de contraseña
        </h2>
        <p style="margin: 0 0 18px; color: #4b5563; font-size: 15px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong style="color: #be185d;">Tu Sitio Import</strong>. Usa el siguiente código de verificación:
        </p>

        <!-- Caja del código en rosado / magenta -->
        <div style="background-color: #fdf2f8; border: 1.5px dashed #db2777; border-radius: 10px; padding: 18px; text-align: center; margin: 22px 0;">
          <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #be185d; font-weight: bold; margin-bottom: 6px;">
            Código de verificación
          </span>
          <div style="font-size: 32px; font-weight: 800; color: #9d174d; letter-spacing: 7px; font-family: monospace;">
            ${codigo}
          </div>
        </div>

        <p style="margin: 0 0 12px; color: #4b5563; font-size: 14px;">
          ⏳ Este código expirará en <strong>15 minutos</strong>.
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 13px;">
          Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura; tu cuenta seguirá protegida.
        </p>
      </div>

      <!-- Pie de página -->
      <div style="background-color: #fff1f2; padding: 16px 24px; text-align: center; border-top: 1px solid #fbcfe8; font-size: 12px; color: #6b7280;">
        <p style="margin: 0 0 6px;">
          <strong style="color: #831843;">Tu Sitio Import</strong> — Tus compras e importaciones en un solo lugar.
        </p>
        <p style="margin: 0;">
          Síguenos en Instagram:
          <a href="https://www.instagram.com/tusitioimport/?hl=es-la" target="_blank" style="color: #db2777; text-decoration: none; font-weight: 600;">
            @tusitioimport
          </a>
        </p>
      </div>

    </div>
  </div>
`,
  });
};
