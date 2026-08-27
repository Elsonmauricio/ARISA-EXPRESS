const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const API_URL = API_BASE;

export function api(path: string): string {
  if (!API_BASE) {
    console.warn('VITE_API_URL is not defined. Please set it in your .env file.');
  }
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function getRefreshToken(): Promise<string | null> {
  return localStorage.getItem('refreshToken');
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await fetch(api('/api/auth/refresh'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Refresh failed');
  }

  const json = await response.json();
  if (json.success && json.data?.accessToken) {
    localStorage.setItem('token', json.data.accessToken);
    if (json.data.refreshToken) {
      localStorage.setItem('refreshToken', json.data.refreshToken);
    }
    return json.data.accessToken;
  }

  throw new Error('Invalid refresh response');
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');

  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    console.warn('[API] 401 recebido, a tentar refresh...');

    if (isRefreshing) {
      await refreshPromise;
      const newToken = localStorage.getItem('token');
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(input, { ...init, headers });
      }
      if (response.status === 401) {
        console.warn('[API] Retry após refresh também retornou 401, a redirecionar para login...');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return response;
    }

    isRefreshing = true;
    refreshPromise = refreshAccessToken().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

    try {
      await refreshPromise;
      const newToken = localStorage.getItem('token');
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(input, { ...init, headers });
      }
      if (response.status === 401) {
        console.warn('[API] Retry após refresh também retornou 401, a redirecionar para login...');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (err) {
      console.warn('[API] Refresh falhou, a redirecionar para login...', err);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return response;
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}
