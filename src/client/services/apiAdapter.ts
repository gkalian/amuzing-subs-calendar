import type { Subscription } from '../types';
export type { Subscription };

/** Error from the API. For 4xx responses `message` is the server's explanation and safe to show. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly field?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }
}

async function request<T>(url: string, init: RequestInit | undefined, fallback: string): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    // Server answers errors as { error, field }; fall back to status text if the body is not JSON
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error || `${fallback}: ${response.statusText}`, response.status, body?.field);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export class ApiAdapter {
  private baseUrl = '/api/subscriptions';

  getAll(): Promise<Subscription[]> {
    return request(this.baseUrl, undefined, 'Failed to fetch subscriptions');
  }

  add(subscription: Omit<Subscription, 'id'>): Promise<Subscription> {
    return request(this.baseUrl, jsonInit('POST', subscription), 'Failed to add subscription');
  }

  update(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    return request(`${this.baseUrl}/${id}`, jsonInit('PATCH', updates), 'Failed to update subscription');
  }

  delete(id: string): Promise<void> {
    return request(`${this.baseUrl}/${id}`, { method: 'DELETE' }, 'Failed to delete subscription');
  }
}
