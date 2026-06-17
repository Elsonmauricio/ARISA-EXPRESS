// backend/src/services/emailService.ts
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  template: 'welcome' | 'shipment-created' | 'shipment-updated' | 'reset-password';
  data: any;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

export const sendEmail = async ({ to, subject, template, data }: EmailOptions) => {
  const templates: Record<EmailOptions['template'], (data: any) => string> = {
    welcome: (data: any) => `<h1>Bem-vindo ${data.name}!</h1><p>Obrigado por se registar na Arisa Express.</p>`,
    'shipment-created': (data: any) => `<h1>Encomenda Registada</h1><p>Código: ${data.trackingCode}</p>`,
    'shipment-updated': (data: any) => `<h1>Atualização</h1><p>Status: ${data.status}</p>`,
    'reset-password': (data: any) => `<h1>Recuperação de Senha</h1><p>Token: ${data.token}</p>`
  };
  
  if (!templates[template]) {
    throw new Error(`Template de e-mail '${template}' não encontrado.`);
  }

  const html = templates[template](data);
  
  await transporter.sendMail({
    from: `"Arisa Express" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html
  });
};