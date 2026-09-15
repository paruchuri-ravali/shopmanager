import 'dotenv/config';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { createApp } from './app';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://your-frontend.vercel.app'
];

const app = createApp(allowedOrigins);

const port = Number(process.env.PORT || 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on port ${port}`);
});
