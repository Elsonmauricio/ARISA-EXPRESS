import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock the api module: passthrough for `api`, spy-able `logout`.
vi.mock('../lib/api', () => ({
  logout: vi.fn(),
  api: (path: string) => path,
}));

import { logout } from '../lib/api';

describe('ProtectedRoute', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    global.fetch = originalFetch;
  });

  const mockMe = (role: string) => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: 'u1', email: 'u@x.com', name: 'U', role } }),
    } as any);
  };

  const mockMeFail = () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network')) as any;
  };

  it('redirects to /login when no token is present', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(logout).toHaveBeenCalled();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when token and user are present (non-admin)', () => {
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'CLIENT' }));

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to / when requireAdmin is true and /me returns a client role', async () => {
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'CLIENT' }));
    mockMe('client'); // lowercase, case-insensitive

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', expect.any(Object));
  });

  it('renders admin content when /me returns ADMIN (case-insensitive)', async () => {
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));
    mockMe('admin'); // lowercase variant from the source of truth

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(await screen.findByText('Admin Content')).toBeInTheDocument();
    // localStorage user role is re-synced to the normalized value.
    const stored = JSON.parse(localStorage.getItem('user') as string);
    expect(stored.role).toBe('ADMIN');
  });

  it('reflects a promotion (stale CLIENT in localStorage, ADMIN from /me)', async () => {
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'CLIENT' }));
    mockMe('ADMIN');

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(await screen.findByText('Admin Content')).toBeInTheDocument();
  });

  it('renders admin content when /me fails but localStorage holds an admin role (offline fallback)', async () => {
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'OPERATOR' }));
    mockMeFail();

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(await screen.findByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects to / when /me fails and localStorage holds a client role', async () => {
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'CLIENT' }));
    mockMeFail();

    render(
      <MemoryRouter>
        <ProtectedRoute requireAdmin>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });
});