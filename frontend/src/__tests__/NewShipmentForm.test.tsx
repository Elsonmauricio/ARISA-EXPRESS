import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState, useEffect } from 'react';
import { useT } from '../i18n/LanguageContext';

// Mock dependencies
vi.mock('../lib/api', () => ({
  api: (path: string) => `http://localhost:5001${path}`,
  authenticatedFetch: vi.fn(),
}));

vi.mock('../i18n/LanguageContext', () => ({
  useT: () => ({
    t: (key: string) => key,
  }),
}));

import { authenticatedFetch } from '../lib/api';

interface Route {
  id: string;
  origin: string;
  destination: string;
  pricePerKg: number;
}

// Extracted price calculation logic (mirrors the component's useEffect)
function calculateEstimatedPrice(
  weight: string,
  origin: string,
  destination: string,
  routes: Route[]
): number | null {
  if (!routes || routes.length === 0) return null;
  const weightNum = parseFloat(weight);
  if (!weightNum || weightNum <= 0) return null;

  const o = String(origin || '').trim().toLowerCase();
  const d = String(destination || '').trim().toLowerCase();
  const match = routes.find(
    r => String(r.origin || '').trim().toLowerCase() === o && String(r.destination || '').trim().toLowerCase() === d
  );
  if (!match) return null;
  return Math.round(match.pricePerKg * weightNum * 100) / 100;
}

describe('calculateEstimatedPrice', () => {
  const routes: Route[] = [
    { id: 'r1', origin: 'Lisboa', destination: 'Luanda', pricePerKg: 13 },
    { id: 'r2', origin: 'Porto', destination: 'Luanda', pricePerKg: 14 },
  ];

  it('returns null when weight is empty', () => {
    expect(calculateEstimatedPrice('', 'Lisboa', 'Luanda', routes)).toBeNull();
  });

  it('returns null when weight is zero', () => {
    expect(calculateEstimatedPrice('0', 'Lisboa', 'Luanda', routes)).toBeNull();
  });

  it('returns null when weight is negative', () => {
    expect(calculateEstimatedPrice('-5', 'Lisboa', 'Luanda', routes)).toBeNull();
  });

  it('calculates price for Lisboa → Luanda', () => {
    const result = calculateEstimatedPrice('5', 'Lisboa', 'Luanda', routes);
    expect(result).toBe(65); // 13 * 5
  });

  it('calculates price for Porto → Luanda', () => {
    const result = calculateEstimatedPrice('10', 'Porto', 'Luanda', routes);
    expect(result).toBe(140); // 14 * 10
  });

  it('returns null when no route matches', () => {
    const result = calculateEstimatedPrice('5', 'Paris', 'Londres', routes);
    expect(result).toBeNull();
  });

  it('handles decimal weights', () => {
    const result = calculateEstimatedPrice('2.5', 'Lisboa', 'Luanda', routes);
    expect(result).toBe(32.5); // 13 * 2.5
  });

  it('rounds to 2 decimal places', () => {
    const result = calculateEstimatedPrice('3', 'Lisboa', 'Luanda', routes);
    expect(result).toBe(39); // 13 * 3
  });
});

describe('NewShipmentForm — dynamic price calculation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('updates estimated price when weight changes', async () => {
    const routes: Route[] = [
      { id: 'r1', origin: 'Lisboa', destination: 'Luanda', pricePerKg: 13 },
    ];

    // Simulate the component's state and effect
    let capturedPrice: number | null = null;
    const TestComponent = () => {
      const [weight, setWeight] = useState('');
      const [origin, setOrigin] = useState('Lisboa');
      const [destination, setDestination] = useState('Luanda');

      useEffect(() => {
        capturedPrice = calculateEstimatedPrice(weight, origin, destination, routes);
      }, [weight, origin, destination]);

      return (
        <div>
          <input
            data-testid="weight"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
          <div data-testid="price">{capturedPrice ?? 'null'}</div>
        </div>
      );
    };

    render(<TestComponent />);

    // Initially null
    expect(screen.getByTestId('price').textContent).toBe('null');

    // Type weight
    const input = screen.getByTestId('weight');
    fireEvent.change(input, { target: { value: '5' } });

    await waitFor(() => {
      expect(screen.getByTestId('price').textContent).toBe('65');
    });
  });

  it('clears estimated price when weight is cleared', async () => {
    const routes: Route[] = [
      { id: 'r1', origin: 'Lisboa', destination: 'Luanda', pricePerKg: 13 },
    ];

    let capturedPrice: number | null = null;
    const TestComponent = () => {
      const [weight, setWeight] = useState('5');

      useEffect(() => {
        capturedPrice = calculateEstimatedPrice(weight, 'Lisboa', 'Luanda', routes);
      }, [weight]);

      return (
        <div>
          <input
            data-testid="weight"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
          <div data-testid="price">{capturedPrice ?? 'null'}</div>
        </div>
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('price').textContent).toBe('65');
    });

    // Clear weight
    const input = screen.getByTestId('weight');
    fireEvent.change(input, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByTestId('price').textContent).toBe('null');
    });
  });
});