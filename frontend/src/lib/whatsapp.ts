export function openWhatsAppLink(link: string): void {
  if (!link) return;
  window.open(link, '_blank', 'noopener,noreferrer');
}
