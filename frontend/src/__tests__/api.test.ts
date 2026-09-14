import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticatedFetch, logout } from '../lib/api';

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

  it('includes the Authorization header when a token exists', async () => {
    localStorage.setItem('token', 'abc123');
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ success: true }),
    }) as any;

    await authenticatedFetch('/api/test');

    const callArgs = (global.fetch as any).mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('attempts to refresh the token when a 401 is received', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('refreshToken', 'refresh-xyz');

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((input: string, init: any) => {
      callCount++;
      if (input.includes('/api/auth/refresh')) {
        return Promise.resolve({
          status: 200,
          json: async () => ({
            success: true,
            data: { accessToken: 'new-token', refreshToken: 'new-refresh' },
          }),
        });
      }
      if (callCount === 1) {
        return Promise.resolve({ status: 401, json: async () => ({}) });
      }
      return Promise.resolve({
        status: 200,
        json: async () => ({ success: true }),
      });
    }) as any;

    const res = await authenticatedFetch('/api/protected');
    expect(res.status).toBe(200);
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  it('clears tokens and redirects to /login when refresh also fails', async () => {
    localStorage.setItem('token', 'expired');
    localStorage.setItem('refreshToken', 'bad-refresh');

    global.fetch = vi.fn().mockResolvedValue({ status: 401, json: async () => ({}) }) as any;

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