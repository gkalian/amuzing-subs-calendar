import express from 'express';
import {
  readAllSubscriptions,
  readYearlySubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  type Subscription
} from '../utils/fileStorage.js';
import { withEndpointLogging } from '../utils/logger.js';

export const subscriptionsRouter = express.Router();

// GET /api/subscriptions - get all subscriptions across all years
subscriptionsRouter.get('/', withEndpointLogging('subscriptions.list', async (req, res) => {
  try {
    const subscriptions = await readAllSubscriptions();
    res.json(subscriptions);
  } catch (error) {
    console.error('Error reading subscriptions:', error);
    res.status(500).json({ error: 'Failed to read subscriptions' });
  }
}));

// GET /api/subscriptions/year/:year - get subscriptions for a specific year
subscriptionsRouter.get('/year/:year', withEndpointLogging('subscriptions.listByYear', async (req, res) => {
  try {
    const { year } = req.params;
    if (!/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: 'Invalid year format. Use YYYY' });
    }
    
    const subscriptions = await readYearlySubscriptions(year);
    res.json(subscriptions);
  } catch (error) {
    console.error(`Error reading subscriptions for year ${req.params.year}:`, error);
    res.status(500).json({ error: 'Failed to read subscriptions' });
  }
}));

// POST /api/subscriptions - add a new subscription
subscriptionsRouter.post('/', withEndpointLogging('subscriptions.create', async (req, res) => {
  try {
    const subscriptionData = {
      ...req.body,
      userId: req.body.userId || 'default', // for now always default
    };
    
    const newSubscription = await addSubscription(subscriptionData);
    // Pass endpoint-specific metadata to the logger wrapper
    (res.locals as any).endpointMeta = {
      id: newSubscription.id,
      startDate: newSubscription.startDate,
    };
    res.status(201).json(newSubscription);
  } catch (error) {
    console.error('Error adding subscription:', error);
    res.status(500).json({ error: 'Failed to add subscription' });
  }
}));

// PATCH /api/subscriptions/:id - update a subscription
subscriptionsRouter.patch('/:id', withEndpointLogging('subscriptions.update', async (req, res) => {
  try {
    const updated = await updateSubscription(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    (res.locals as any).endpointMeta = { id: updated.id, startDate: updated.startDate };
    res.json(updated);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
}));

// DELETE /api/subscriptions/:id - delete a subscription
subscriptionsRouter.delete('/:id', withEndpointLogging('subscriptions.delete', async (req, res) => {
  try {
    const deleted = await deleteSubscription(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    (res.locals as any).endpointMeta = { id: req.params.id };
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
}));
