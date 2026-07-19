export function scrollToAnchor(hash: string) {
  const id = hash.startsWith('#') ? hash.slice(1) : hash;
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as any).__lenis;
  if (lenis) {
    lenis.scrollTo(el, { offset: -80 });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
