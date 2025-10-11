export type Subscription = {
  id: string;
  userId: string;
  serviceId: string;
  startDate: string; // YYYY-MM-DD
  amount: number;
  currency: string;
  monthly?: boolean;
};

export class ApiAdapter {
  private baseUrl = '/api/subscriptions';

  async getAll(): Promise<Subscription[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch subscriptions: ${response.statusText}`);
    }
    return response.json();
  }

  async add(subscription: Omit<Subscription, 'id'>): Promise<Subscription> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
    if (!response.ok) {
      throw new Error(`Failed to add subscription: ${response.statusText}`);
    }
    return response.json();
  }

  async update(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`Failed to update subscription: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete subscription: ${response.statusText}`);
    }
  }
}
