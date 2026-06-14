// backend/src/services/whatsapp.ts
import axios from 'axios';

export class WhatsAppService {
  private apiKey: string;
  private phoneNumberId: string;
  
  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_ID || '';
  }
  
  async sendTrackingUpdate(phone: string, trackingCode: string, status: string, location: string) {
    const message = `📦 *Arisa Express*\n\nSua encomenda *${trackingCode}* está *${status}*\n📍 Localização: ${location}\n\nAcompanhe em tempo real: ${process.env.FRONTEND_URL}/track/${trackingCode}`;
    
    try {
      await axios.post(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('WhatsApp error:', error);
    }
  }
}