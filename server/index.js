import { resolve } from 'node:path';
import { createApp } from './app.js';

const config = {
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  replicateToken: process.env.REPLICATE_API_TOKEN,
  dbPath: process.env.DATABASE_PATH || resolve('data/forma.sqlite'),
  storagePath: resolve(process.env.MEDIA_PATH || 'data/media'),
};
const { app, service } = createApp(config);
app.listen(Number(process.env.PORT || 3001), '0.0.0.0', () => console.log('Forma API ready'));
const timer = setInterval(() => void service.tick().catch(() => console.error('Generation reconciliation failed')), 5000);
timer.unref();
