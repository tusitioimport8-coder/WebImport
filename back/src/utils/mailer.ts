import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const enviarCorreoRecuperacion = async (
  destinatario: string,
  codigo: string,
) => {
  await transporter.sendMail({
    from: '"Mi E-commerce" <no-reply@tudominio.com>',
    to: destinatario,
    subject: "Código de recuperación de contraseña",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código de verificación:</p>
        <h1 style="color: #4F46E5; letter-spacing: 5px;">${codigo}</h1>
        <p>Este código expirará en 15 minutos.</p>
        <p>Si tú no solicitaste esto, puedes ignorar este mensaje.</p>
      </div>
    `,
  });
};
