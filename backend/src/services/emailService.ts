// backend/src/services/emailService.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: any;
}

export const sendEmail = async ({ to, subject, template, data }: EmailOptions) => {
  const templates: Record<string, (data: any) => string> = {
    welcome: (data) => `
      <h1>Bem-vindo ${data.name}!</h1>
      <p>Obrigado por se registar na Arisa Express.</p>
      <p>Estamos prontos para ajudar com as suas encomendas entre Angola e Portugal.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard">Aceder ao Dashboard</a>
    `,
    'shipment-created': (data) => `
      <h1>Encomenda Registada</h1>
      <p>Código de rastreamento: <strong>${data.trackingCode}</strong></p>
      <p>Origem: ${data.origin}</p>
      <p>Destino: ${data.destination}</p>
      <a href="${process.env.FRONTEND_URL}/track/${data.trackingCode}">Acompanhar Encomenda</a>
    `,
    'shipment-updated': (data) => `
      <h1>Atualização da Encomenda</h1>
      <p>Código: ${data.trackingCode}</p>
      <p>Status: ${data.status}</p>
      <p>Localização: ${data.location}</p>
      <p>${data.description}</p>
    `,
    'reset-password': (data) => `
      <h1>Recuperação de Senha</h1>
      <p>Clique no link abaixo para redefinir sua senha:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password?token=${data.token}">Redefinir Senha</a>
      <p>Este link expira em 1 hora.</p>
    `
  };
  
  const html = templates[template](data);
  
  await transporter.sendMail({
    from: `"Arisa Express" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html
  });
};