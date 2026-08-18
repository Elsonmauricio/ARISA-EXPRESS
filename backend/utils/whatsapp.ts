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
  const backendUrl = process.env.BACKEND_URL || '';
  const envKey = location === 'luanda' ? 'WHATSAPP_IMAGE_URL_LUANDA' : 'WHATSAPP_IMAGE_URL_LISBOA';
  const configured = process.env[envKey];

  if (configured && !configured.includes('localhost')) {
    return configured;
  }

  if (backendUrl && !backendUrl.includes('localhost')) {
    return `${backendUrl}/api/assets/images/${location === 'luanda' ? 'Luanda' : 'Lisboa'}.jpeg`;
  }

  return location === 'luanda'
    ? '/api/assets/images/Luanda.jpeg'
    : '/api/assets/images/Lisboa.jpeg';
}

export function generateWhatsAppMessage(data: WhatsAppMessageData & { imageUrl?: string }): string {
  const address = data.pickupAddress || 'Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros';
  const contact = data.pickupContact || '+351 934 292 082';
  const schedule = data.pickupSchedule || 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00';
  const location = isLuandaDestination(data.destination || '') ? 'Luanda' : 'Lisboa';
  const locationType = getLocationType(data.destination || '');
  const imageUrl = data.imageUrl || getPickupImage(locationType);

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

  Aviso: Deve efetuar o levantamento no prazo máximo de 5 dias úteis. Após este período, será cobrada uma taxa de ocupação de espaço de 5€ por semana no ato do levantamento.`;
}

export function generatePickupMessage(data: PickupNotificationData): string {
  const address = data.pickupAddress || getAddressForLocation(data.location);
  const contact = data.pickupContact || getContactForLocation(data.location);
  const schedule = data.pickupSchedule || getScheduleForLocation(data.location);
  const imageUrl = getPickupImage(data.location);

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

export function generateWhatsAppLink(phone: string, message: string, location?: LocationType): string | null {
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 9) {
    const countryCode = location === 'luanda' ? '244' : '351';
    return `https://wa.me/${countryCode}${cleanPhone}?text=${encodedMessage}`;
  }

  if (!cleanPhone) return null;
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function formatPhoneToE164(phone: string, defaultCountry: 'br' | 'ao' | 'pt' = 'br'): string | null {
  if (!phone || typeof phone !== 'string') return null;

  let clean = phone.trim();

  clean = clean.replace(/[\s\-\(\)\.]/g, '');

  if (clean.startsWith('+')) {
    clean = clean.slice(1);
  }

  if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }

  if (clean.length >= 12 && clean.startsWith('55')) {
    return '+' + clean;
  }

  const digits = clean.replace(/\D/g, '');

  if (digits.length === 0) return null;

  switch (defaultCountry) {
    case 'br':
      return '+55' + digits;
    case 'ao':
      return '+244' + digits;
    case 'pt':
      return '+351' + digits;
    default:
      return '+' + digits;
  }
}

export function generateCustomWhatsAppLink(
  phone: string,
  message: string,
  defaultCountry: 'br' | 'ao' | 'pt' = 'br'
): string | null {
  const formattedPhone = formatPhoneToE164(phone, defaultCountry);

  if (!formattedPhone) {
    return null;
  }

  const phoneNumber = formattedPhone.replace('+', '');
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}
