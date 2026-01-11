// ============================================================================
// Vitest Test Setup
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-06
// ============================================================================

import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';
import { createSupabaseMock, createSimpleMockQuery, mockDataByTable } from './mocks/supabase-mock';

// ============================================================================
// GLOBAL SETUP
// ============================================================================

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after the tests are finished.
afterAll(() => {
  server.close();
});

// ============================================================================
// GLOBAL MOCKS
// ============================================================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.ResizeObserver = mockResizeObserver as unknown as typeof ResizeObserver;

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// ============================================================================
// SUPABASE MOCK
// ============================================================================

const supabaseMock = createSupabaseMock();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock,
}));

// Export the mock and helpers for test files that need to override specific behaviors
export { supabaseMock, createSimpleMockQuery, mockDataByTable };

// ============================================================================
// CONSOLE SUPPRESSION FOR CLEANER TEST OUTPUT
// ============================================================================

// Suppress console.error and console.warn in tests unless needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Allow React Query errors through for debugging
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React Query') || args[0].includes('Warning:'))
    ) {
      originalError(...args);
    }
  };
  console.warn = (...args: unknown[]) => {
    // Allow specific warnings through
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('React Router'))
    ) {
      // Suppress React Router future flag warnings in tests
      if (!args[0].includes('Future Flag Warning')) {
        originalWarn(...args);
      }
    }
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// ============================================================================
// GLOBAL TEST HELPERS
// ============================================================================

/**
 * Utility to wait for all pending promises to resolve.
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Utility to wait for a specific duration.
 *
 * Parameters
 * ----------
 * ms : number
 *     The number of milliseconds to wait.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
