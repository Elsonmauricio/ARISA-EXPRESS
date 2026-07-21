const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const API_URL = API_BASE;

export function api(path: string): string {
  if (!API_BASE) {
    console.warn('VITE_API_URL is not defined. Please set it in your .env file.');
  }
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
