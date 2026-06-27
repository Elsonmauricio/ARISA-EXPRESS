// backend/src/services/emailService.ts
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: 'welcome' | 'shipment-created' | 'shipment-updated' | 'shipment-cancelled' | 'reset-password';
  data: any;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const templates: Record<EmailOptions['template'], (data: any) => string> = {
  welcome: (data: any) => `
    <h1>🌟 Bem-vindo à Arisa Express</h1>
    <p><strong>Olá ${data.name},</strong></p>
    <p>Obrigado por se registar na Arisa Express! Estamos felizes em tê-lo connosco.</p>
    <p>Com a Arisa Express, pode enviar encomendas entre Angola e Portugal com rapidez, segurança e total transparência.</p>
    <p>A qualquer momento, pode aceder ao seu <a href="${process.env.FRONTEND_URL}/dashboard">painel de controlo</a> para gerir as suas encomendas, orçamentos e muito mais.</p>
    <br/>
    <p>Equipa <strong>Arisa Express</strong></p>
    <p style="color: #7C3AED;">💜 Luanda • Lisboa</p>
  `,

  'shipment-created': (data: any) => `
  <h1>✅ Encomenda Registada com Sucesso</h1>
  <p><strong>Olá ${data.name},</strong></p>
  <p>A sua encomenda foi registada no sistema da <strong>Arisa Express</strong>.</p>
  <h2>📦 Detalhes da Encomenda</h2>
  <ul>
    <li><strong>Código de Rastreio:</strong> ${data.trackingCode}</li>
    <li><strong>Origem:</strong> ${data.origin}</li>
    <li><strong>Destino:</strong> ${data.destination}</li>
    <li><strong>Data do Voo:</strong> ${data.flightDate || 'N/A'}</li>
    <li><strong>Remetente:</strong> ${data.senderName} (${data.senderPhone})</li>
    <li><strong>Destinatário:</strong> ${data.receiverName} (${data.receiverPhone})</li>
    <li><strong>Peso:</strong> ${data.weight} kg</li>
    <li><strong>Dimensões:</strong> ${data.dimensions?.length || 'N/A'} × ${data.dimensions?.width || 'N/A'} × ${data.dimensions?.height || 'N/A'} cm</li>
    <li><strong>Descrição:</strong> ${data.description || 'N/A'}</li>
    <li><strong>Serviço:</strong> ${data.serviceType}</li>
    <li><strong>Valor:</strong> € ${data.price}</li>
  </ul>
  <p>🔗 <a href="${process.env.FRONTEND_URL}/rastrear?code=${data.trackingCode}">Acompanhar a encomenda</a></p>
  <br/>
  <p>Equipa <strong>Arisa Express</strong></p>
    <p style="color: #7C3AED;">💜 Luanda • Lisboa</p>
  `,

  'shipment-updated': (data: any) => `
    <h1>🔄 Atualização da Encomenda</h1>
    <p><strong>Olá ${data.name},</strong></p>
    <p>A sua encomenda <strong>${data.trackingCode}</strong> teve uma atualização importante.</p>
    <ul>
      <li><strong>Novo Estado:</strong> <span style="background: #7C3AED; color: white; padding: 2px 8px; border-radius: 4px;">${data.status.replace('_', ' ')}</span></li>
      <li><strong>Localização:</strong> ${data.location || 'N/A'}</li>
      <li><strong>Descrição:</strong> ${data.description || 'N/A'}</li>
    </ul>
    <p>🔗 <a href="${process.env.FRONTEND_URL}/rastrear?code=${data.trackingCode}" style="background: #D4AF37; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Detalhes</a></p>
    <br/>
    <p>Equipa <strong>Arisa Express</strong></p>
    <p style="color: #7C3AED;">💜 Luanda • Lisboa</p>
  `,

  'shipment-cancelled': (data: any) => `
    <h1>❌ Encomenda Cancelada</h1>
    <p><strong>Olá ${data.name},</strong></p>
    <p>A sua encomenda <strong>${data.trackingCode}</strong> foi cancelada conforme solicitado.</p>
    <ul>
      <li><strong>Origem:</strong> ${data.origin}</li>
      <li><strong>Destino:</strong> ${data.destination}</li>
    </ul>
    <p>Caso tenha dúvidas, entre em contacto connosco através do email <a href="mailto:${process.env.SMTP_FROM}">${process.env.SMTP_FROM}</a>.</p>
    <br/>
    <p>Equipa <strong>Arisa Express</strong></p>
    <p style="color: #7C3AED;">💜 Luanda • Lisboa</p>
  `,

  'reset-password': (data: any) => `
    <h1>🔐 Recuperação de Senha</h1>
    <p><strong>Olá ${data.name},</strong></p>
    <p>Recebemos um pedido para redefinir a sua senha na Arisa Express.</p>
    <p>Clique no botão abaixo para criar uma nova senha:</p>
    <p><a href="${process.env.FRONTEND_URL}/reset-password?token=${data.token}" style="background: #7C3AED; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a></p>
    <p>Este link é válido por <strong>1 hora</strong>.</p>
    <p>Se não solicitou esta alteração, ignore este email.</p>
    <br/>
    <p>Equipa <strong>Arisa Express</strong></p>
  `
};

export const sendEmail = async ({ to, subject, template, data }: EmailOptions): Promise<void> => {
  try {
    const html = templates[template](data);
    
    await transporter.sendMail({
      from: `"Arisa Express" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html
    });
    
    logger.info(`✅ Email enviado para ${to} (template: ${template})`);
  } catch (error) {
    logger.error(`❌ Erro ao enviar email para ${to}:`, error);
    throw error;
  }
};