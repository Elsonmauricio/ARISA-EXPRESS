import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const originalLocation = window.location;
delete (window as any).location;
(window as any).location = {
  ...originalLocation,
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
};

const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

global.fetch = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.clear();
});
