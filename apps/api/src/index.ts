import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './app';

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.CORS_ORIGIN?.split(',').map((origin) => stripTrailingSlash(origin.trim())).filter(Boolean) ?? [])
];

const app = createApp(allowedOrigins);

const port = Number(process.env.PORT || 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on port ${port}`);
  console.log(`CORS allowed origins: ${JSON.stringify(allowedOrigins)}`);
});
