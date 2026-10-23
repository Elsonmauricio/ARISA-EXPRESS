import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../lib/api', () => ({
  api: (path: string) => `http://localhost:5001${path}`,
  authenticatedFetch: vi.fn(),
  logout: vi.fn(),
}));

import { authenticatedFetch } from '../lib/api';
import { NewShipmentForm } from '../pages/AdminDashboard';

function renderForm() {
  const utils = render(
    <MemoryRouter>
      <NewShipmentForm />
    </MemoryRouter>
  );
  return utils;
}

function inputByLabel(label: string): HTMLInputElement {
  const labelEl = screen.getByText(label);
  const input = labelEl.parentElement?.querySelector('input, select, textarea');
  if (!input) throw new Error(`Campo não encontrado para o label "${label}"`);
  return input as HTMLInputElement;
}

function getRequestBody(callIndex = 0): any {
  const calls = (authenticatedFetch as any).mock.calls;
  return JSON.parse(calls[callIndex][1].body);
}

describe('NewShipmentForm — registo de encomenda no escritório', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    (authenticatedFetch as any).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: { id: 'abc' } }),
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('não apresenta o campo Preço e apresenta o campo Valor Pago no Escritório', () => {
    renderForm();

    expect(screen.getByText('Valor Pago no Escritório')).toBeInTheDocument();
    expect(screen.queryByText('Preço')).not.toBeInTheDocument();
  });

  it('indica que o peso é opcional e não o exige no registo', () => {
    renderForm();

    const weightInput = inputByLabel('Peso (kg) (Opcional)');
    expect(weightInput).toBeInTheDocument();
    expect(weightInput).not.toBeRequired();
  });

  it('regista a encomenda sem peso e envia o valor pago no escritório', async () => {
    const { container } = renderForm();

    fireEvent.change(inputByLabel('Remetente'), { target: { value: 'Ana Silva' } });
    fireEvent.change(inputByLabel('Destinatário *'), { target: { value: 'Joao Costa' } });
    fireEvent.change(inputByLabel('Valor Pago no Escritório'), { target: { value: '75' } });

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(1));

    const [url, options] = (authenticatedFetch as any).mock.calls[0];
    expect(url).toContain('/api/admin/shipments');
    expect(options.method).toBe('POST');

    const body = getRequestBody();
    expect(body.paidAmount).toBe(75);
    expect(body.price).toBeUndefined();
    expect(body.weight).toBe(0);
    expect(body.senderName).toBe('Ana Silva');
    expect(body.receiverName).toBe('Joao Costa');
  });

  it('envia o peso quando é preenchido', async () => {
    const { container } = renderForm();

    fireEvent.change(inputByLabel('Remetente'), { target: { value: 'Ana Silva' } });
    fireEvent.change(inputByLabel('Destinatário *'), { target: { value: 'Joao Costa' } });
    fireEvent.change(inputByLabel('Peso (kg) (Opcional)'), { target: { value: '2.5' } });
    fireEvent.change(inputByLabel('Valor Pago no Escritório'), { target: { value: '40' } });

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(1));

    const body = getRequestBody();
    expect(body.weight).toBe(2.5);
    expect(body.paidAmount).toBe(40);
  });

  it('marca o estado financeiro como Pago quando existe valor pago', async () => {
    const { container } = renderForm();

    fireEvent.change(inputByLabel('Remetente'), { target: { value: 'Ana Silva' } });
    fireEvent.change(inputByLabel('Destinatário *'), { target: { value: 'Joao Costa' } });
    fireEvent.change(inputByLabel('Valor Pago no Escritório'), { target: { value: '120' } });

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(1));

    expect(getRequestBody().paymentStatus).toBe('PAID');
  });

  it('mantém o estado financeiro pendente quando não há valor pago', async () => {
    const { container } = renderForm();

    fireEvent.change(inputByLabel('Remetente'), { target: { value: 'Ana Silva' } });
    fireEvent.change(inputByLabel('Destinatário *'), { target: { value: 'Joao Costa' } });

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(1));

    const body = getRequestBody();
    expect(body.paidAmount).toBe(0);
    expect(body.paymentStatus).toBe('PENDING');
  });
});
