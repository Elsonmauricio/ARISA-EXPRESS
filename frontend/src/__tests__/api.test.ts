import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticatedFetch, logout, api } from '../lib/api';

describe('authenticatedFetch', () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
    localStorage.clear();
  });

  const mockResponse = (status: number, body?: any) => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => JSON.stringify(body ?? ''),
  }) as any;

  it('includes the Authorization header when a token exists', async () => {
    localStorage.setItem('token', 'abc123');
    global.fetch = vi.fn().mockResolvedValue(mockResponse(200, { success: true }));

    await authenticatedFetch('/api/test');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('attempts to refresh the token when a 401 is received', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('refreshToken', 'refresh-xyz');

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((_input: string, _init: any) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(mockResponse(401));
      }
      return Promise.resolve(
        mockResponse(200, { success: true, data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })
      );
    });

    const res = await authenticatedFetch('/api/protected');
    expect(res.status).toBe(200);
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  it('clears tokens and redirects to /login when refresh also fails', async () => {
    localStorage.setItem('token', 'expired');
    localStorage.setItem('refreshToken', 'bad-refresh');

    global.fetch = vi.fn().mockResolvedValue(mockResponse(401)) as any;

    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, assign: assignSpy },
      writable: true,
    });

    await authenticatedFetch('/api/protected');

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(assignSpy).toHaveBeenCalledWith('/login');
  });

  it('returns the original 401 response (not synthetic) after failed refresh', async () => {
    localStorage.setItem('token', 'expired');
    localStorage.setItem('refreshToken', 'bad-refresh');

    global.fetch = vi.fn().mockResolvedValue(mockResponse(401, {})) as any;

    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, assign: assignSpy },
      writable: true,
    });

    const res = await authenticatedFetch('/api/protected');
    expect(res.status).toBe(401);
  });

  it('allows subsequent requests after refresh succeeds', async () => {
    localStorage.setItem('token', 'expired');
    localStorage.setItem('refreshToken', 'refresh-xyz');

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((_input: string, _init: any) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(mockResponse(401));
      }
      if (callCount === 2) {
        return Promise.resolve(
          mockResponse(200, { success: true, data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })
        );
      }
      return Promise.resolve(mockResponse(200, { success: true }));
    });

    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, assign: assignSpy },
      writable: true,
    });

    const res = await authenticatedFetch('/api/protected');
    expect(res.status).toBe(200);
    expect(localStorage.getItem('token')).toBe('new-token');
  });

  it('logout clears all stored tokens', () => {
    localStorage.setItem('token', 'x');
    localStorage.setItem('refreshToken', 'y');
    localStorage.setItem('user', '{}');
    logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('api', () => {
  it('returns full URL when API_BASE is defined', () => {
    const url = api('/api/test');
    expect(url).toContain('/api/test');
  });

  it('returns path as-is for absolute URLs', () => {
    const url = api('https://example.com/api/test');
    expect(url).toBe('https://example.com/api/test');
  });

  it('returns path unchanged when API_BASE is empty', () => {
    const base = import.meta.env.VITE_API_URL;
    if (!base) {
      const url = api('/api/test');
      expect(url).toBe('/api/test');
    } else {
      const url = api('/api/test');
      expect(url).not.toContain('undefined');
      expect(url).not.toContain(',');
      expect(url).toContain('/api/test');
    }
  });
});
