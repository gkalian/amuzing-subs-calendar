import type { CurrencySetting, SubscriptionSetting } from '../types/settings';

const BASE_URL = '/api/settings';

async function fetchJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch settings from ${endpoint}: ${response.statusText}`);
  }
  return response.json();
}

export class SettingsAdapter {
  async getCurrencies(): Promise<CurrencySetting[]> {
    return fetchJson<CurrencySetting[]>('/currencies');
  }

  async getSubscriptions(): Promise<SubscriptionSetting[]> {
    return fetchJson<SubscriptionSetting[]>('/subscriptions');
  }
}
