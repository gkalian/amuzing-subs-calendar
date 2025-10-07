import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_DIR = path.join(__dirname, '../../../data/.settings');

export type CurrencySetting = {
  code: string;
  name: string;
  symbol: string;
};

export type SubscriptionSetting = {
  id: string;
  name: string;
};

async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = path.join(SETTINGS_DIR, fileName);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

export async function readCurrencies(): Promise<CurrencySetting[]> {
  return readJsonFile<CurrencySetting[]>('currencies.json', []);
}

export async function readSubscriptionSettings(): Promise<SubscriptionSetting[]> {
  return readJsonFile<SubscriptionSetting[]>('subscriptions.json', []);
}
