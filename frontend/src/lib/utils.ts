import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const WHATSAPP_NUMBER = '351934292082';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}