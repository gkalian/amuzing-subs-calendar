import express from 'express';
import { subscriptionsRouter } from './routes/subscriptions.js';
import { registerRequestLogger } from './middleware/requestLogger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
registerRequestLogger(app);

// CORS for dev mode
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/api/subscriptions', subscriptionsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
