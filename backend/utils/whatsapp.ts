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
  price?: number;
}

export interface PickupNotificationData extends WhatsAppMessageData {
  location: LocationType;
  destination: string;
}

// ==================== DETECÇÃO DE DESTINO ====================

export function isLuandaDestination(destination: string): boolean {
  return (destination || '').toLowerCase().includes('luanda') ||
         (destination || '').toLowerCase().includes('angola');
}

export function getLocationType(destination: string): LocationType {
  return isLuandaDestination(destination) ? 'luanda' : 'lisbon';
}

export function guessLocationType(destination?: string): LocationType {
  return getLocationType(destination || '');
}

// ==================== IMAGEM ====================

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

// ==================== ENDEREÇOS ====================

const LUANDA_ADDRESS = 'Morro Bento\nAvenida 21 de Janeiro\nDefronte ao Hotel Ágatha\nNo lado oposto ao Hotel Ágatha\nNa entrada à esquerda da farmácia Elvice, antes do Colégio GAB 2 está a Arisa Express';

const LISBOA_ADDRESS = 'Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros';

// ==================== CONTACTOS ====================

const LUANDA_CONTACT = '+244 948 440 920';
const LISBOA_CONTACT = '+351 934 292 082';

// ==================== HORÁRIOS ====================

const LUANDA_SCHEDULE = 'Segunda à sexta-feira\n08:00 – 12:00\n13:00 – 17:00\nEncerrados aos finais de semana e feriados';

const LISBOA_SCHEDULE = 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00';

// ==================== MENSAGENS COMPLETAS ====================

function buildLuandaMessage(data: {
  trackingCode: string;
  shipmentDate: string;
  deadline: string;
  senderName: string;
  receiverName: string;
  price?: number;
}): string {
  const fine = (data.price || 0) * 0.1;

  return `ARISA EXPRESS - Encomenda Disponível para Levantamento!

Endereço: ${LUANDA_ADDRESS}
Contacto: ${LUANDA_CONTACT}
Horário: ${LUANDA_SCHEDULE}

Nº de Encomenda: ${data.trackingCode}
Data de Envio: ${data.shipmentDate}
Prazo Limite sem Multa: ${data.deadline} (5 dias úteis)

Remetente: ${data.senderName}
Destinatário: ${data.receiverName}

Aviso: Deve efetuar o levantamento no prazo máximo de 5 dias úteis. Após este período, será cobrada uma taxa de ocupação de espaço de ${fine.toFixed(2)}€ (10% do valor do envio) no ato do levantamento.`;
}

function buildLisboaMessage(data: {
  trackingCode: string;
  shipmentDate: string;
  deadline: string;
  senderName: string;
  receiverName: string;
}): string {
  return `ARISA EXPRESS - Encomenda Disponível para Levantamento!

Endereço: ${LISBOA_ADDRESS}
Contacto: ${LISBOA_CONTACT}
Horário: ${LISBOA_SCHEDULE}

Nº de Encomenda: ${data.trackingCode}
Data de Envio: ${data.shipmentDate}
Prazo Limite sem Multa: ${data.deadline} (5 dias úteis)

Remetente: ${data.senderName}
Destinatário: ${data.receiverName}

Aviso: Deve efetuar o levantamento no prazo máximo de 5 dias úteis. Após este período, será cobrada uma taxa de ocupação de espaço de 5€ por semana no ato do levantamento.`;
}

// ==================== FUNÇÕES PÚBLICAS ====================

export function generateWhatsAppMessage(data: WhatsAppMessageData & { imageUrl?: string }): string {
  const locationType = guessLocationType(data.destination);
  const baseData = {
    trackingCode: data.trackingCode,
    shipmentDate: data.shipmentDate,
    deadline: data.deadline,
    senderName: data.senderName,
    receiverName: data.receiverName,
    price: data.price
  };

  if (locationType === 'luanda') {
    return buildLuandaMessage(baseData);
  }

  return buildLisboaMessage(baseData);
}

export function generatePickupMessage(data: PickupNotificationData): string {
  const baseData = {
    trackingCode: data.trackingCode,
    shipmentDate: data.shipmentDate,
    deadline: data.deadline,
    senderName: data.senderName,
    receiverName: data.receiverName,
    price: data.price
  };

  if (data.location === 'luanda') {
    return buildLuandaMessage(baseData);
  }

  return buildLisboaMessage(baseData);
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

export function formatPhoneToE164(phone: string, defaultCountry: 'ao' | 'pt' = 'ao'): string | null {
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

  if (digits.startsWith('244') || digits.startsWith('351')) {
    return '+' + digits;
  }

  switch (defaultCountry) {
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
  defaultCountry: 'ao' | 'pt' = 'ao'
): string | null {
  const formattedPhone = formatPhoneToE164(phone, defaultCountry);

  if (!formattedPhone) {
    return null;
  }

  const phoneNumber = formattedPhone.replace('+', '');
  const 
  encodedMessage = encodeURIComponent(message); 
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}
