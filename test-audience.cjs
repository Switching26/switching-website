'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { once } = require('node:events');
const express = require('express');
const { createAudience } = require('./audience.cjs');

async function main() {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'switching-audience-'));
  const file = path.join(scratch, 'private', 'counts.json');
  const sitemap = path.join(scratch, 'sitemap.xml');
  const token = 'isolated-test-read-key-32-characters-long';
  let time = Date.parse('2026-09-30T12:00:00Z');
  fs.writeFileSync(sitemap, '<urlset><url><loc>https://www.switching-formation.fr/</loc></url><url><loc>https://www.switching-formation.fr/formation-excel-cpf.html</loc></url><url><loc>https://foreign.example/private.html</loc></url><url><loc>https://www.switching-formation.fr/admin.html</loc></url></urlset>');
  const options = { file, sitemap, token, now: () => time, flushMs: 3600000 };
  let counter = createAudience(options);
  const app = express();
  app.use((req, res, next) => counter.middleware(req, res, next));
  app.get('/api/audience', (req, res) => counter.report(req, res));
  app.get('/redirect', (req, res) => res.redirect('/'));
  app.use((req, res) => {
    if (req.headers['if-none-match']) return res.status(304).end();
    if (req.headers.range) return res.status(206).type('html').send('partial');
    if (req.headers['x-test-failure']) return res.status(500).type('html').send('error');
    if (req.path === '/missing.html') return res.status(404).send('missing');
    res.type('html').send('<h1>Test</h1>');
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  const browser = { 'User-Agent': 'Mozilla/5.0 Safari/605.1', Accept: 'text/html', 'Sec-Fetch-Dest': 'document' };
  async function get(url, extra = {}, method = 'GET') {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path: url, method, headers: { ...browser, ...extra } }, res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.setTimeout(5000, () => req.destroy(new Error('local test timeout')));
      req.on('error', reject);
      req.end();
    });
  }
  const report = async (query = '') => JSON.parse((await get('/api/audience' + query, { 'X-Audience-Token': token })).body);
  try {
    assert.equal((await get('/api/audience')).status, 401);
    assert.equal((await get('/api/audience', { 'X-Audience-Token': 'wrong' })).status, 401);
    assert.equal((await get('/api/audience?token=' + token)).status, 401);
    const auth = await get('/api/audience', { 'X-Audience-Token': token });
    assert.equal(auth.status, 200);
    assert.equal(auth.headers['cache-control'], 'private, no-store');
    assert.equal(auth.headers['set-cookie'], undefined);
    assert.equal(JSON.parse(auth.body).total, 0);
    for (const query of ['?days=0', '?days=366', '?days=no', '?days=1&days=2', '?days[]=2']) {
      assert.equal((await get('/api/audience' + query, { 'X-Audience-Token': token })).status, 400);
    }
    const doc = await get('/?email=secret@example.test&utm_source=secret-campaign', {
      Cookie: 'existing_secret=should-not-retain', Referer: 'https://private.example/?person=secret',
      'X-Forwarded-For': '198.51.100.10',
    });
    assert.equal(doc.body, '<h1>Test</h1>');
    assert.equal(doc.headers['set-cookie'], undefined);
    await get('/index.html');
    await get('/formation-excel-cpf');
    await get('/formation-excel-cpf.html', { 'If-None-Match': 'test' });
    assert.equal((await report()).total, 4);
    for (const url of ['/admin.html', '/api/stats', '/private.html', '/missing.html', '/redirect', '/unlisted-preview.html', '/%73ecret.html']) await get(url);
    for (const headers of [{ DNT: '1' }, { 'Sec-GPC': '1' }, { 'User-Agent': 'Googlebot' }, { 'User-Agent': 'CheckOS-QA' },
      { 'User-Agent': '' }, { Accept: 'application/json' }, { 'Sec-Fetch-Dest': 'iframe' },
      { Purpose: 'prefetch' }, { 'Sec-Purpose': 'prefetch;prerender' }, { Range: 'bytes=0-3' }, { 'X-Test-Failure': '1' }]) await get('/', headers);
    await get('/', {}, 'HEAD');
    await get('/', {}, 'POST');
    assert.equal((await report()).total, 4, 'bots, opt-outs, assets, private/error pages, previews and non-GET never count');
    counter.close();
    const saved = fs.readFileSync(file, 'utf8');
    for (const forbidden of ['secret', 'example.test', 'campaign', '198.51.', 'Cookie', 'Mozilla', 'Referer', 'User-Agent']) assert(!saved.includes(forbidden));
    assert.deepEqual(Object.keys(JSON.parse(saved)).sort(), ['counts', 'started_on', 'version']);
    assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    counter = createAudience(options);
    assert.equal((await report()).total, 4, 'restart restores only aggregate counts');
    time += 2 * 86400000;
    await get('/');
    assert.equal((await report('?days=1')).total, 1);
    assert.equal((await report('?days=3')).total, 5);
    time += 365 * 86400000;
    assert.equal((await report('?days=365')).total, 0, 'old days expire even without new traffic');
    counter.close();
    assert.deepEqual(JSON.parse(fs.readFileSync(file)).counts, {});
    fs.writeFileSync(file, '{corrupt');
    counter = createAudience(options);
    assert.equal((await get('/')).status, 200, 'broken metrics never break website');
    assert.equal((await get('/api/audience', { 'X-Audience-Token': token })).status, 503);
    counter.close();
    assert.equal(fs.readFileSync(file, 'utf8'), '{corrupt', 'do not overwrite a damaged store');
    counter = createAudience({ ...options, token: undefined });
    assert.equal((await get('/')).status, 200);
    assert.equal((await get('/api/audience')).status, 503);
    console.log('PASS: counting, aliases, 304, authentication, exclusions, privacy, persistence, retention and fail-open website');
  } finally {
    counter.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
