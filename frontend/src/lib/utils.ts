import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const WHATSAPP_NUMBER_LISBOA = '351934292082';
export const WHATSAPP_NUMBER_LUANDA = '244948440920';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function whatsappUrl(message: string, number: string = WHATSAPP_NUMBER_LISBOA): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}