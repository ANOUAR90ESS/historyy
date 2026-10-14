import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';

export const MODELS = { image: 'black-forest-labs/flux-schnell', video: 'minimax/video-01' };

export function createReplicate(token) {
  async function request(path, options = {}) {
    const response = await fetch(`https://api.replicate.com/v1/${path}`, {
      ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new Error(`Replicate returned ${response.status}`);
    return response.json();
  }
  return {
    create: row => request(`models/${row.model}/predictions`, {
      method: 'POST', body: JSON.stringify({ input: row.type === 'image'
        ? { prompt: row.prompt, aspect_ratio: row.aspect_ratio, num_outputs: 1, output_format: 'webp' }
        : { prompt: row.prompt, prompt_optimizer: true } }),
    }),
    get: id => request(`predictions/${encodeURIComponent(id)}`),
    async download(output, row, directory) {
      const url = new URL(Array.isArray(output) ? output[0] : output);
      if (url.protocol !== 'https:' || !(url.hostname === 'replicate.delivery' || url.hostname.endsWith('.replicate.delivery'))) {
        throw new Error('Unsupported media host');
      }
      const response = await fetch(url, { signal: AbortSignal.timeout(120000), redirect: 'error' });
      if (!response.ok || !response.body) throw new Error('Media unavailable');
      const type = response.headers.get('content-type')?.split(';')[0];
      const extensions = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'video/mp4': 'mp4', 'video/webm': 'webm' };
      if (!extensions[type] || !type.startsWith(row.type === 'image' ? 'image/' : 'video/')) throw new Error('Unsupported media format');
      const filename = `${row.id}.${extensions[type]}`;
      let size = 0;
      const limiter = new Transform({ transform(chunk, encoding, callback) {
        size += chunk.length;
        callback(size > 200 * 1024 * 1024 ? new Error('Media too large') : null, chunk);
      } });
      try { await pipeline(Readable.fromWeb(response.body), limiter, createWriteStream(join(directory, filename), { flags: 'w' })); }
      catch (error) { await unlink(join(directory, filename)).catch(() => {}); throw error; }
      return { filename, type };
    },
  };
}
