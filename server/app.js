import express from 'express';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDatabase } from './db.js';
import { registerAuth } from './auth.js';
import { createReplicate } from './replicate.js';
import { createGenerationService, registerGenerations } from './generations.js';

export function createApp(config, options = {}) {
  const app = express();
  const db = options.db || openDatabase(config.dbPath);
  const provider = options.provider || createReplicate(config.replicateToken);
  const service = createGenerationService(db, provider, config.storagePath);
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.use(cookieParser());
  app.use('/api', (req, res, next) => {
    if (['POST','PATCH','DELETE','PUT'].includes(req.method) && req.get('origin') !== new URL(config.appUrl).origin) {
      return res.status(403).json({ error: 'Origen de la solicitud no permitido.' });
    }
    next();
  });
  registerAuth(app, db, config);
  registerGenerations(app, db, config, service);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  if (existsSync(resolve('dist/index.html'))) {
    app.use(express.static(resolve('dist')));
    app.get('/{*path}', (req, res) => res.sendFile(resolve('dist/index.html')));
  }
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error.status || 500).json({ error: error.status === 413 ? 'La solicitud es demasiado grande.' : 'No se pudo procesar la solicitud.' });
  });
  return { app, db, service };
}
