import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { publicGeneration, transaction } from './db.js';
import { requireUser } from './auth.js';
import { MODELS } from './replicate.js';

export function createGenerationService(db, provider, storagePath) {
  mkdirSync(storagePath, { recursive: true });
  const inFlight = new Set();
  function fail(id, message) {
    transaction(db, () => {
      const row = db.prepare('SELECT * FROM generations WHERE id=?').get(id);
      if (!row || row.status === 'succeeded' || row.refunded) return;
      db.prepare('UPDATE users SET credits=credits+? WHERE id=?').run(row.cost, row.user_id);
      db.prepare("UPDATE generations SET status='failed',error=?,refunded=1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(message, id);
    });
  }
  async function apply(row, prediction) {
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      fail(row.id, 'No se pudo completar la generación. Tus créditos se han devuelto.');
    } else if (prediction.status === 'succeeded') {
      const media = await provider.download(prediction.output, row, storagePath);
      db.prepare("UPDATE generations SET status='succeeded',media_file=?,media_type=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(media.filename, media.type, row.id);
    } else {
      db.prepare("UPDATE generations SET status='processing',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(row.id);
    }
  }
  async function start(row) {
    inFlight.add(row.id);
    try {
      const prediction = await provider.create(row);
      if (!prediction.id) throw new Error('Missing prediction id');
      db.prepare('UPDATE generations SET prediction_id=? WHERE id=?').run(prediction.id, row.id);
      await apply(row, prediction);
    } catch { fail(row.id, 'No se pudo iniciar o guardar la generación. Tus créditos se han devuelto.'); }
    finally { inFlight.delete(row.id); }
  }
  let ticking = false;
  async function tick() {
    if (ticking) return;
    ticking = true;
    try {
      const rows = db.prepare("SELECT * FROM generations WHERE status IN ('starting','processing')").all();
      await Promise.all(rows.map(async row => {
        if (inFlight.has(row.id)) return;
        if (!row.prediction_id) {
          if (Date.now() - Date.parse(row.created_at) > 120000) fail(row.id, 'La solicitud se interrumpió. Tus créditos se han devuelto.');
          return;
        }
        inFlight.add(row.id);
        try { await apply(row, await provider.get(row.prediction_id)); }
        catch {
          if (Date.now() - Date.parse(row.created_at) > 24 * 3600 * 1000) fail(row.id, 'No se pudo recuperar el resultado. Tus créditos se han devuelto.');
        } finally { inFlight.delete(row.id); }
      }));
    } finally { ticking = false; }
  }
  return { start, tick, fail };
}

export function registerGenerations(app, db, config, service) {
  app.use('/api/generations', requireUser);
  app.get('/api/generations', (req, res) => {
    const rows = db.prepare('SELECT * FROM generations WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
    res.json({ generations: rows.map(publicGeneration) });
  });
  app.post('/api/generations', (req, res) => {
    if (!config.replicateToken) return res.status(503).json({ error: 'Falta configurar la clave de Replicate. No se han gastado créditos.' });
    const { type, prompt, aspectRatio = '1:1' } = req.body || {};
    if (!['image','video'].includes(type) || typeof prompt !== 'string' || prompt.trim().length < 3 || prompt.length > 2000 || !['1:1','16:9','9:16','4:3','3:4'].includes(aspectRatio)) {
      return res.status(400).json({ error: 'Escribe un prompt de entre 3 y 2000 caracteres y elige un formato válido.' });
    }
    const cost = type === 'image' ? 1 : 10;
    try {
      const row = transaction(db, () => {
        const active = db.prepare("SELECT count(*) AS count FROM generations WHERE user_id=? AND status IN ('starting','processing')").get(req.user.id).count;
        if (active >= 3) throw Object.assign(new Error('Tienes 3 creaciones en curso. Espera a que termine una.'), { status: 429 });
        const updated = db.prepare('UPDATE users SET credits=credits-? WHERE id=? AND credits>=?').run(cost, req.user.id, cost);
        if (!updated.changes) throw Object.assign(new Error('No tienes créditos suficientes para esta creación.'), { status: 402 });
        const id = randomUUID();
        db.prepare('INSERT INTO generations (id,user_id,type,prompt,aspect_ratio,model,cost) VALUES (?,?,?,?,?,?,?)')
          .run(id, req.user.id, type, prompt.trim(), type === 'video' ? '16:9' : aspectRatio, MODELS[type], cost);
        return db.prepare('SELECT * FROM generations WHERE id=?').get(id);
      });
      void service.start(row);
      res.status(202).json({ generation: publicGeneration(row) });
    } catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo crear la solicitud.' }); }
  });
  app.patch('/api/generations/:id/favorite', (req, res) => {
    if (typeof req.body?.favorite !== 'boolean') return res.status(400).json({ error: 'Selecciona un estado de favorito válido.' });
    const row = db.prepare('UPDATE generations SET favorite=? WHERE id=? AND user_id=? RETURNING *')
      .get(Number(req.body.favorite), req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: 'Creación no encontrada.' });
    res.json({ generation: publicGeneration(row) });
  });
  app.get('/api/generations/:id/media', (req, res) => {
    const row = db.prepare('SELECT * FROM generations WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
    if (!row?.media_file) return res.status(404).json({ error: 'Archivo no encontrado.' });
    res.type(row.media_type).set('Cache-Control', 'private, no-store');
    res.sendFile(join(config.storagePath, row.media_file));
  });
  app.get('/api/usage', requireUser, (req, res) => {
    const summary = db.prepare(`SELECT count(*) AS total, coalesce(sum(type='image'),0) AS images,
      coalesce(sum(type='video'),0) AS videos, coalesce(sum(CASE WHEN refunded=0 THEN cost ELSE 0 END),0) AS spent
      FROM generations WHERE user_id=?`).get(req.user.id);
    const credits = db.prepare('SELECT credits FROM users WHERE id=?').get(req.user.id).credits;
    res.json({ ...summary, credits, welcomeCredits: 100 });
  });
}
