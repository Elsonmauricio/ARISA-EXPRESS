// backend/src/services/whatsappService.ts
export class WhatsAppService {
  async sendTrackingUpdate(phone: string, trackingCode: string, status: string, location: string) {
    const message = `📦 Arisa Express\nSua encomenda ${trackingCode} está ${status}\n📍 ${location}`;
    console.log(`WhatsApp message to ${phone}: ${message}`);
    // Implement actual WhatsApp API integration here
  }
}