import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock window.location.href
const originalLocation = window.location;
delete (window as any).location;
(window as any).location = {
  ...originalLocation,
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.clear();
});