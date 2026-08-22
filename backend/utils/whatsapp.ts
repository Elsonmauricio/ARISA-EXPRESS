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

export function isLuandaDestination(destination: string): boolean {
  return (destination || '').toLowerCase().includes('luanda') ||
         (destination || '').toLowerCase().includes('angola');
}

export function getLocationType(destination: string): LocationType {
  return isLuandaDestination(destination) ? 'luanda' : 'lisbon';
}

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function guessLocationType(
  destination?: string,
  pickupAddress?: string,
  pickupContact?: string
): LocationType {
  const loc = getLocationType(destination || '');
  if (loc === 'luanda') return 'luanda';

  const contact = normalize(pickupContact || '');
  if (contact.includes('+244')) return 'luanda';

  const address = normalize(pickupAddress || '');
  if (
    address.includes('luanda') ||
    address.includes('angola') ||
    address.includes('morro bento') ||
    address.includes('hotel agatha') ||
    address.includes('farmacia elvice') ||
    address.includes('colegio gab')
  ) {
    return 'luanda';
  }

  return 'lisbon';
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

function buildPickupBody(options: {
  trackingCode: string;
  shipmentDate: string;
  deadline: string;
  senderName: string;
  receiverName: string;
  address: string;
  contact: string;
  schedule: string;
  locationType: LocationType;
  price?: number;
}): string {
  const isLuanda = options.locationType === 'luanda';
  const angolaFine = (options.price || 0) * 0.1;
  const fineNotice = isLuanda
    ? `será cobrada uma taxa de ocupação de espaço de ${angolaFine.toFixed(2)}€ (10% do valor do envio)`
    : 'será cobrada uma taxa de ocupação de espaço de 5€ por semana';

  return `ARISA EXPRESS - Encomenda Disponível para Levantamento!

Endereço: ${options.address}
Contacto: ${options.contact}
Horário: ${options.schedule}

Nº de Encomenda: ${options.trackingCode}
Data de Envio: ${options.shipmentDate}
Prazo Limite sem Multa: ${options.deadline} (5 dias úteis)

Remetente: ${options.senderName}
Destinatário: ${options.receiverName}

Aviso: Deve efetuar o levantamento no prazo máximo de 5 dias úteis. Após este período, ${fineNotice} no ato do levantamento.`;
}

export function generateWhatsAppMessage(data: WhatsAppMessageData & { imageUrl?: string }): string {
  const locationType = guessLocationType(data.destination, data.pickupAddress, data.pickupContact);
  const address = data.pickupAddress || getAddressForLocation(locationType);
  const contact = data.pickupContact || getContactForLocation(locationType);
  const schedule = data.pickupSchedule || getScheduleForLocation(locationType);

  return buildPickupBody({
    trackingCode: data.trackingCode,
    shipmentDate: data.shipmentDate,
    deadline: data.deadline,
    senderName: data.senderName,
    receiverName: data.receiverName,
    address,
    contact,
    schedule,
    locationType,
    price: data.price
  });
}

export function generatePickupMessage(data: PickupNotificationData): string {
  const address = data.pickupAddress || getAddressForLocation(data.location);
  const contact = data.pickupContact || getContactForLocation(data.location);
  const schedule = data.pickupSchedule || getScheduleForLocation(data.location);

  return buildPickupBody({
    trackingCode: data.trackingCode,
    shipmentDate: data.shipmentDate,
    deadline: data.deadline,
    senderName: data.senderName,
    receiverName: data.receiverName,
    address,
    contact,
    schedule,
    locationType: data.location,
    price: data.price
  });
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

  if (digits.startsWith('244') || digits.startsWith('351')) {
    return '+' + digits;
  }

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
