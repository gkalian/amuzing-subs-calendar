import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../../data');

interface NodeJSError extends Error {
  code?: string;
}

export type Subscription = {
  id: string;
  userId: string;
  serviceId: string;
  startDate: string; // YYYY-MM-DD
  amount: number;
  currency: string;
};

type YearlySubscriptions = {
  [year: string]: Subscription[];
};

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    const nodeError = error as NodeJSError;
    if (nodeError.code !== 'EEXIST') {
      throw error;
    }
  }
}

// Get file path for a specific year
function getYearlyFilePath(year: string | number): string {
  return path.join(DATA_DIR, `subscriptions_${year}.json`);
}

// Extract year from date string (YYYY-MM-DD)
function getYearFromDate(dateStr: string): string {
  return dateStr.split('-')[0];
}

// Read all subscriptions (from all years)
export async function readAllSubscriptions(): Promise<Subscription[]> {
  await ensureDataDir();

  try {
    const files = await fs.readdir(DATA_DIR);
    const subscriptionFiles = files.filter(
      (file) => file.startsWith('subscriptions_') && file.endsWith('.json'),
    );

    let allSubscriptions: Subscription[] = [];

    for (const file of subscriptionFiles) {
      const filePath = path.join(DATA_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const { subscriptions } = JSON.parse(content);
      allSubscriptions = [...allSubscriptions, ...subscriptions];
    }

    return allSubscriptions;
  } catch (error) {
    const nodeError = error as NodeJSError;
    if (nodeError.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Read subscriptions for a specific year
export async function readYearlySubscriptions(year: string | number): Promise<Subscription[]> {
  await ensureDataDir();
  const filePath = getYearlyFilePath(year);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { subscriptions } = JSON.parse(content);
    return subscriptions;
  } catch (error) {
    const nodeError = error as NodeJSError;
    if (nodeError.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Save subscriptions for a specific year
async function saveYearlySubscriptions(
  year: string | number,
  subscriptions: Subscription[],
): Promise<void> {
  await ensureDataDir();
  const filePath = getYearlyFilePath(year);
  await fs.writeFile(filePath, JSON.stringify({ subscriptions }, null, 2), 'utf-8');
}

// Add a new subscription
export async function addSubscription(
  subscription: Omit<Subscription, 'id'>,
): Promise<Subscription> {
  const year = getYearFromDate(subscription.startDate);
  const subscriptions = await readYearlySubscriptions(year);

  const newSubscription: Subscription = {
    ...subscription,
    id: crypto.randomUUID(),
  };

  subscriptions.push(newSubscription);
  await saveYearlySubscriptions(year, subscriptions);

  return newSubscription;
}

// Update an existing subscription
export async function updateSubscription(
  id: string,
  updates: Partial<Subscription>,
): Promise<Subscription | null> {
  const allSubscriptions = await readAllSubscriptions();
  const index = allSubscriptions.findIndex((sub) => sub.id === id);

  if (index === -1) return null;

  const updatedSubscription = { ...allSubscriptions[index], ...updates };

  // If year changed, remove from old year and add to new year
  const oldYear = getYearFromDate(allSubscriptions[index].startDate);
  const newYear = getYearFromDate(updatedSubscription.startDate);

  if (oldYear !== newYear) {
    // Remove from old year
    const oldYearSubs = await readYearlySubscriptions(oldYear);
    const newOldYearSubs = oldYearSubs.filter((sub) => sub.id !== id);
    await saveYearlySubscriptions(oldYear, newOldYearSubs);

    // Add to new year
    const newYearSubs = await readYearlySubscriptions(newYear);
    newYearSubs.push(updatedSubscription);
    await saveYearlySubscriptions(newYear, newYearSubs);
  } else {
    // Update in the same year
    const yearSubs = await readYearlySubscriptions(oldYear);
    const subIndex = yearSubs.findIndex((sub) => sub.id === id);
    if (subIndex !== -1) {
      yearSubs[subIndex] = updatedSubscription;
      await saveYearlySubscriptions(oldYear, yearSubs);
    }
  }

  return updatedSubscription;
}

// Delete a subscription
export async function deleteSubscription(id: string): Promise<boolean> {
  const allSubscriptions = await readAllSubscriptions();
  const subscription = allSubscriptions.find((sub) => sub.id === id);

  if (!subscription) return false;

  const year = getYearFromDate(subscription.startDate);
  const yearSubs = await readYearlySubscriptions(year);
  const newSubs = yearSubs.filter((sub) => sub.id !== id);

  await saveYearlySubscriptions(year, newSubs);
  return true;
}
