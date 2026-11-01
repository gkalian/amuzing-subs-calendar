import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

let dataDir: string;
let server: Server;
let base: string;

beforeAll(async () => {
  dataDir = await mkdtemp(path.join(os.tmpdir(), 'asc-test-'));
  // DATA_DIR is read when fileStorage is loaded, so set it before importing the app
  process.env.DATA_DIR = dataDir;
  const { createApp } = await import('./app.js');
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((r) => server.close(r));
  await rm(dataDir, { recursive: true, force: true });
});

const json = (method: string, body: unknown) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const valid = { serviceId: 'netflix', startDate: '2026-11-02', amount: 9.99, currency: 'EUR' };

describe('subscriptions API', () => {
  it('creates, updates and deletes a subscription', async () => {
    const created = await fetch(`${base}/api/subscriptions`, json('POST', { ...valid, userId: 'x', id: 'y' }));
    expect(created.status).toBe(201);
    const sub = await created.json();
    expect(sub.userId).toBe('default');
    expect(sub.id).not.toBe('y');

    const patched = await fetch(`${base}/api/subscriptions/${sub.id}`, json('PATCH', { amount: 15, id: 'hijack' }));
    expect(patched.status).toBe(200);
    expect(await patched.json()).toMatchObject({ id: sub.id, amount: 15 });

    const deleted = await fetch(`${base}/api/subscriptions/${sub.id}`, { method: 'DELETE' });
    expect(deleted.status).toBe(204);
  });

  it('rejects path traversal in startDate and writes nothing outside DATA_DIR', async () => {
    const res = await fetch(`${base}/api/subscriptions`, json('POST', { ...valid, startDate: '/../../evil' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ field: 'startDate' });
    const files = await readdir(path.dirname(dataDir));
    expect(files.some((f) => f.includes('evil'))).toBe(false);
  });

  it('returns 400 JSON for invalid fields, malformed JSON and bad ids', async () => {
    const bad = await fetch(`${base}/api/subscriptions`, json('POST', { ...valid, amount: 'lots' }));
    expect(bad.status).toBe(400);
    expect(await bad.json()).toMatchObject({ field: 'amount' });

    const broken = await fetch(`${base}/api/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(broken.status).toBe(400);
    expect(await broken.json()).toMatchObject({ field: 'body' });

    const badId = await fetch(`${base}/api/subscriptions/bad%20id`, { method: 'DELETE' });
    expect(badId.status).toBe(400);
  });

  it('rejects a cross-site form post (text/plain body is not parsed)', async () => {
    const res = await fetch(`${base}/api/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(valid),
    });
    expect(res.status).toBe(400);
  });

  it('sends no CORS headers', async () => {
    const res = await fetch(`${base}/api/subscriptions`, { headers: { Origin: 'https://evil.example' } });
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
    const preflight = await fetch(`${base}/api/subscriptions`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'DELETE' },
    });
    expect(preflight.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await fetch(`${base}/api/nope`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });
});
