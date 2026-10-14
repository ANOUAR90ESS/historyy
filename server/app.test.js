import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './app.js';
import { hash } from './auth.js';

const dir = mkdtempSync(join(tmpdir(), 'forma-test-'));
const origin = 'http://localhost:3000';
const config = { appUrl: origin, dbPath: join(dir, 'test.sqlite'), storagePath: join(dir, 'media'), replicateToken: 'unit-test-only' };
const predictions = new Map();
const provider = {
  async create(row) {
    if (row.prompt === 'Provider failure') throw new Error('Mock provider unavailable');
    const prediction = { id: row.id, status: 'processing' };
    predictions.set(row.id, prediction);
    return prediction;
  },
  async get(id) { return predictions.get(id); },
  async download(output, row, path) {
    writeFileSync(join(path, `${row.id}.webp`), 'test fixture');
    return { filename: `${row.id}.webp`, type: 'image/webp' };
  },
};
const { app, db, service } = createApp(config, { provider });
let server, base;
const ids = [];
async function request(path, { user = 'alice', method = 'GET', body, requestOrigin = origin } = {}) {
  return fetch(`${base}/api${path}`, { method, redirect: 'manual', headers: {
    'Content-Type': 'application/json', ...(user ? { Cookie: `forma_session=${user}-test-session` } : {}),
    ...(requestOrigin ? { Origin: requestOrigin } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
async function create(prompt = 'A misty mountain', type = 'image') {
  const response = await request('/generations', { method: 'POST', body: { type, prompt, aspectRatio: '1:1' } });
  const data = await response.json();
  if (data.generation) ids.push(data.generation.id);
  return { response, ...data };
}
before(async () => {
  for (const name of ['alice','bob']) {
    db.prepare('INSERT INTO users (id,google_id,name,email) VALUES (?,?,?,?)').run(name, `${name}-mock-google`, name, `${name}@example.test`);
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(`${name}-test-session`), name, Date.now() + 60000);
  }
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test('anonymous visitors cannot access private data or create/favorite media', async () => {
  for (const path of ['/generations','/usage','/generations/unknown/media']) assert.equal((await request(path, { user: null })).status, 401);
  assert.equal((await request('/generations', { user: null, method: 'POST', body: {} })).status, 401);
  assert.equal((await request('/generations/unknown/favorite', { user: null, method: 'PATCH', body: { favorite: true } })).status, 401);
  const session = await (await request('/session', { user: null })).json();
  assert.equal(session.user, null);
  assert.equal(session.googleConfigured, false);
});
test('missing Google configuration and forged callbacks fail safely', async () => {
  const start = await request('/auth/google', { user: null });
  assert.equal(start.status, 302);
  assert.equal(start.headers.get('location'), '/?authError=not_configured');
  const callback = await request('/auth/google/callback?state=forged&code=forged', { user: null });
  assert.equal(callback.headers.get('location'), '/?authError=invalid_state');
});
test('cross-origin and missing-origin writes are rejected', async () => {
  for (const requestOrigin of ['https://attacker.example', null]) {
    assert.equal((await request('/generations', { method: 'POST', requestOrigin, body: {} })).status, 403);
  }
});
test('invalid requests do not spend credits', async () => {
  for (const body of [{ type: 'image', prompt: 'a' }, { type: 'other', prompt: 'a sunset' }, { type: 'image', prompt: 'a sunset', aspectRatio: 'evil' }]) {
    assert.equal((await request('/generations', { method: 'POST', body })).status, 400);
  }
  assert.equal(db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits, 100);
});
test('creation persists, spends credits once, and is isolated by owner', async () => {
  const { response, generation } = await create();
  assert.equal(response.status, 202);
  assert.equal(generation.cost, 1);
  assert.equal(db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits, 99);
  const mine = await (await request('/generations')).json();
  assert.equal(mine.generations[0].id, generation.id);
  assert.deepEqual((await (await request('/generations', { user: 'bob' })).json()).generations, []);
  assert.equal((await request(`/generations/${generation.id}/favorite`, { user: 'bob', method: 'PATCH', body: { favorite: true } })).status, 404);
  assert.equal((await request(`/generations/${generation.id}/media`, { user: 'bob' })).status, 404);
});
test('favorites persist and can be removed', async () => {
  for (const favorite of [true,false]) {
    assert.equal((await request(`/generations/${ids[0]}/favorite`, { method: 'PATCH', body: { favorite } })).status, 200);
    const list = await (await request('/generations')).json();
    assert.equal(list.generations.find(row => row.id === ids[0]).favorite, favorite);
  }
});
test('completed predictions persist private media for their owner only', async () => {
  predictions.set(ids[0], { id: ids[0], status: 'succeeded', output: 'mock-file' });
  await service.tick();
  const row = (await (await request('/generations')).json()).generations.find(row => row.id === ids[0]);
  assert.equal(row.status, 'succeeded');
  assert.ok(row.mediaUrl);
  assert.equal((await request(`/generations/${row.id}/media`)).status, 200);
  assert.equal((await request(`/generations/${row.id}/media`, { user: 'bob' })).status, 404);
});
test('video uses ten credits and failed predictions refund exactly once', async () => {
  const before = db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits;
  const { response, generation } = await create('A camera moves through a forest', 'video');
  assert.equal(response.status, 202);
  assert.equal(generation.cost, 10);
  assert.equal(generation.aspectRatio, '16:9');
  assert.equal(db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits, before - 10);
  predictions.set(generation.id, { id: generation.id, status: 'failed' });
  await service.tick();
  service.fail(generation.id, 'A repeated failure');
  assert.equal(db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits, before);
  assert.equal(db.prepare('SELECT refunded FROM generations WHERE id=?').get(generation.id).refunded, 1);
});
test('provider submission failures are persisted and refunded', async () => {
  const before = db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits;
  const { generation } = await create('Provider failure');
  assert.equal(db.prepare('SELECT status FROM generations WHERE id=?').get(generation.id).status, 'failed');
  assert.equal(db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits, before);
});
test('missing integration cannot charge credits', async () => {
  config.replicateToken = undefined;
  const before = db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits;
  assert.equal((await create()).response.status, 503);
  assert.equal(db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits, before);
  config.replicateToken = 'unit-test-only';
});
test('concurrent submissions cannot overspend the balance', async () => {
  const original = db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits;
  db.prepare('UPDATE users SET credits=1 WHERE id=?').run('alice');
  const results = await Promise.all([create('First simultaneous prompt'), create('Second simultaneous prompt')]);
  assert.deepEqual(results.map(result => result.response.status).sort(), [202,402]);
  assert.equal(db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits, 0);
  db.prepare('UPDATE users SET credits=? WHERE id=?').run(original - 1, 'alice');
});
test('usage matches persisted balances and logout invalidates the session', async () => {
  const usage = await (await request('/usage')).json();
  assert.equal(usage.credits, db.prepare('SELECT credits FROM users WHERE id=?').get('alice').credits);
  assert.equal(usage.spent + usage.credits, 100);
  assert.equal((await request('/auth/logout', { method: 'POST' })).status, 200);
  assert.equal((await request('/generations')).status, 401);
});
