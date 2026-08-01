// backend/src/utils/whatsapp.ts

export interface WhatsAppMessageData {
  trackingCode: string;
  shipmentDate: string;
  deadline: string;
  senderName: string;
  receiverName: string;
  phone: string;
  pickupAddress?: string;
  pickupContact?: string;
  pickupSchedule?: string;
}

export function generateWhatsAppMessage(data: WhatsAppMessageData): string {
  const address = data.pickupAddress || 'Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros';
  const contact = data.pickupContact || '+351 934 292 082';
  const schedule = data.pickupSchedule || 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00';

  return `📦 ARISA EXPRESS - Encomenda Disponível para Levantamento!

A sua encomenda já se encontra em *Lisboa* disponível para levantamento!

📍 *Endereço:* ${address}
📞 *Contacto:* ${contact}
🕒 *Horário:* ${schedule}

📄 N.º de Encomenda: ${data.trackingCode}
📅 Data de Envio: ${data.shipmentDate}
⏳ Prazo Limite sem Multa: ${data.deadline} (5 dias úteis)

👤 Remetente: ${data.senderName}
👤 Destinatário: ${data.receiverName}

⚠️ Aviso: Deve efetuar o levantamento no prazo máximo de 5 dias úteis. Após este período, será cobrada uma taxa de ocupação de espaço de 5€ por semana no ato do levantamento.`;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 9) {
    return `https://wa.me/351${cleanPhone}?text=${encodedMessage}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}