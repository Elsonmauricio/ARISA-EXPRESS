const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

if (!API_BASE) {
  console.warn('[API] VITE_API_URL não definido — a usar caminhos relativos');
}

export const API_URL = API_BASE;

export function api(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

let refreshPromise: Promise<string | null> | null = null;
let redirecting = false;

async function getRefreshToken(): Promise<string | null> {
  return localStorage.getItem('refreshToken');
}

function clearAuthAndRedirect(): void {
  if (redirecting) return;
  redirecting = true;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.assign('/login');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('Refresh token ausente');
  }

  const response = await fetch(api('/api/auth/refresh'), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let message = 'Refresh failed';
    try {
      const json = await response.json();
      message = json.error || message;
    } catch {
      message = `Refresh failed (${response.status})`;
    }
    throw new Error(`${message} (${response.status})`);
  }

  const json = await response.json();
  if (json.success && json.data?.accessToken) {
    localStorage.setItem('token', json.data.accessToken);
    if (json.data.refreshToken) {
      localStorage.setItem('refreshToken', json.data.refreshToken);
    }
    return json.data.accessToken;
  }

  throw new Error('Resposta de refresh inválida');
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

  const response = await fetch(input, { ...init, headers });

  if (response.status !== 401) {
    return response;
  }

  console.warn('[API] 401 recebido, a tentar refresh...');

  try {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const pendingRefresh = refreshPromise;
    const newToken = await pendingRefresh;
    if (!newToken) {
      clearAuthAndRedirect();
      return response;
    }

    headers.set('Authorization', `Bearer ${newToken}`);
    const retryResponse = await fetch(input, { ...init, headers });

    if (retryResponse.status === 401) {
      console.warn('[API] Retry após refresh também retornou 401, a redirecionar para login...');
      clearAuthAndRedirect();
    }

    return retryResponse;
  } catch (err) {
    console.warn('[API] Refresh falhou, a redirecionar para login...', err);
    clearAuthAndRedirect();
    return response;
  }
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}
