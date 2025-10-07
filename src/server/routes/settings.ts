import express from 'express';
import { withEndpointLogging } from '../utils/logger.js';
import { readCurrencies, readSubscriptionSettings } from '../utils/settings.js';

export const settingsRouter = express.Router();

settingsRouter.get(
  '/currencies',
  withEndpointLogging('settings.currencies', async (req, res) => {
    try {
      const currencies = await readCurrencies();
      res.json(currencies);
    } catch (error) {
      console.error('Error reading currencies:', error);
      res.status(500).json({ error: 'Failed to read currencies settings' });
    }
  }),
);

settingsRouter.get(
  '/subscriptions',
  withEndpointLogging('settings.subscriptions', async (req, res) => {
    try {
      const subscriptions = await readSubscriptionSettings();
      res.json(subscriptions);
    } catch (error) {
      console.error('Error reading subscription settings:', error);
      res.status(500).json({ error: 'Failed to read subscription settings' });
    }
  }),
);
