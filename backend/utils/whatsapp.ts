// backend/src/utils/whatsapp.ts
export type LocationType = 'lisbon' | 'luanda';

export interface WhatsAppMessageData {
  destination?: string;
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

export interface PickupNotificationData extends WhatsAppMessageData {
  location: LocationType;
  destination: string;
}

export function isLuandaDestination(destination: string): boolean {
  return (destination || '').toLowerCase().includes('luanda') ||
         (destination || '').toLowerCase().includes('angola');
}

export function getLocationType(destination: string): LocationType {
  return isLuandaDestination(destination) ? 'luanda' : 'lisbon';
}

export function getPickupImage(location: LocationType): string {
  if (location === 'luanda') {
    return 'frontend/src/assets/Luanda.jpeg';
  }
  return 'frontend/src/assets/Lisboa.jpeg';
}

export function generateWhatsAppMessage(data: WhatsAppMessageData): string {
  const address = data.pickupAddress || 'Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo Ant�nio dos Cavaleiros';
  const contact = data.pickupContact || '+351 934 292 082';
  const schedule = data.pickupSchedule || 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00';
  const location = isLuandaDestination(data.destination || '') ? 'Luanda' : 'Lisboa';

  return ` ARISA EXPRESS - Encomenda Disponível para Levantamento!

A sua encomenda já se encontra em ${location} disponível para levantamento!

  Endereço: ${address}
  Contacto: ${contact}
  Horário: ${schedule}

  N de Encomenda: ${data.trackingCode}
  Data de Envio: ${data.shipmentDate}
  Prazo Limite sem Multa: ${data.deadline} (5 dias uteis)

  Remetente: ${data.senderName}
  Destinatário: ${data.receiverName}

  Aviso: Deve efetuar o levantamento no prazo máximo de 5 diasteis. Após este período, será cobrada uma taxa de ocupação de espaço de 5€ por semana no ato do levantamento.`;
}

export function generatePickupMessage(data: PickupNotificationData): string {
  const address = data.pickupAddress || getAddressForLocation(data.location);
  const contact = data.pickupContact || getContactForLocation(data.location);
  const schedule = data.pickupSchedule || getScheduleForLocation(data.location);

  const headers = {
    lisbon: ' ARISA EXPRESS - Encomenda Disponível para Levantamento!\n\nA sua encomenda chegou a Lisboa e já está disponível para levantamento!',
    luanda: ' ARISA EXPRESS - Encomenda Disponível para Levantamento!\n\nA sua encomenda chegou a Luanda e já está disponível para levantamento!'
  };

  return `${headers[data.location]}

  Endereço: ${address}
  Contacto: ${contact}
  Horário: ${schedule}

  Nº de Encomenda: ${data.trackingCode}
  Data de Envio: ${data.shipmentDate}
  Prazo Limite sem Multa: ${data.deadline} (5 dias úteis)

  Remetente: ${data.senderName}
  Destinatário: ${data.receiverName}

  Aviso: Deve efetuar o levantamento no prazo máximo de 5 dias úteis. Após este período, será cobrada uma taxa de ocupação de espaço de 5€ por semana no ato do levantamento.`;
}

function getAddressForLocation(location: LocationType): string {
  if (location === 'luanda') {
    return 'Morro Bento\nAvenida 21 de Janeiro\nDefronte ao Hotel Ágatha\nNo lado oposto ao Hotel Ágatha\nNa entrada esquerda da farmcia Elvice, antes do Colégio GAB 2 está a Arisa Express';
  }
  return 'Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros';
}

function getContactForLocation(location: LocationType): string {
  return location === 'luanda' ? '+244 948 440 920' : '+351 934 292 082';
}

function getScheduleForLocation(location: LocationType): string {
  if (location === 'luanda') {
    return 'Segunda a sexta-feira\n08:00 a 12:00\n13:00 a 17:00\nEncerrados aos finais de semana e feriados';
  }
  return 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00';
}

export function generateWhatsAppLink(phone: string, message: string, location?: LocationType): string {
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 9) {
    const countryCode = location === 'luanda' ? '244' : '351';
    return `https://wa.me/${countryCode}${cleanPhone}?text=${encodedMessage}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
