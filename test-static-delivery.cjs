'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const zlib = require('node:zlib');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

// A frozen copy of the server, disposable database and no mail/AI credentials.
// No requests are made to the production website or any external service.
async function main() {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'switching-static-'));
  const pages = ['index.html', 'admin.html', 'formation-excel-cpf.html',
    'formation-excel-vba-cpf.html', 'formation-word-cpf.html',
    'formation-powerpoint-cpf.html', 'formation-anglais-cpf.html',
    'formation-photoshop-cpf.html', 'formation-silae-paie-cpf.html'];
  for (const name of [...pages, 'server.js', 'ai-client.cjs', 'static-delivery.cjs',
    'style-index.css', 'chatbot.js', 'robots.txt', 'sitemap.xml',
    'google3a68c31226138741.html']) {
    fs.copyFileSync(path.join(__dirname, name), path.join(scratch, name));
  }
  fs.symlinkSync(path.join(__dirname, 'node_modules'), path.join(scratch, 'node_modules'));
  fs.writeFileSync(path.join(scratch, 'fixture.png'), Buffer.alloc(2048, 42));
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, ['server.js'], {
    cwd: scratch,
    env: { PATH: process.env.PATH, PORT: String(port), DB_PATH: path.join(scratch, 'db'), NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const childExit = once(child, 'exit');
  let log = '';
  child.stdout.on('data', b => { log += b; });
  child.stderr.on('data', b => { log += b; });
  function get(url, headers = {}, method = 'GET') {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path: url, headers, method }, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      });
      req.setTimeout(5000, () => req.destroy(new Error('request timeout')));
      req.on('error', reject);
      req.end();
    });
  }
  try {
    const deadline = Date.now() + 10000;
    while (!log.includes('server running on port')) {
      if (child.exitCode !== null || Date.now() > deadline) throw new Error('Isolated server failed to start: ' + log);
      await new Promise(r => setTimeout(r, 50));
    }
    const sizes = [];
    for (const name of [...pages.filter(p => p !== 'admin.html'), 'style-index.css', 'chatbot.js']) {
      const original = fs.readFileSync(path.join(scratch, name));
      const plain = await get('/' + name, { 'Accept-Encoding': 'identity' });
      assert.equal(plain.status, 200);
      assert.deepEqual(plain.body, original);
      assert.equal(plain.headers['content-encoding'], undefined);
      assert.equal(plain.headers['cache-control'], 'public, max-age=0, must-revalidate');
      for (const encoding of ['gzip', 'br']) {
        const compressed = await get('/' + name, { 'Accept-Encoding': encoding });
        assert.equal(compressed.status, 200);
        assert.equal(compressed.headers['content-encoding'], encoding);
        assert.match(compressed.headers.vary, /Accept-Encoding/i);
        const decoded = encoding === 'gzip' ? zlib.gunzipSync(compressed.body) : zlib.brotliDecompressSync(compressed.body);
        assert.deepEqual(decoded, original);
        assert(compressed.body.length < original.length);
        if (name === 'index.html') sizes.push({ encoding, before: original.length, after: compressed.body.length });
      }
      const unchanged = await get('/' + name, { 'If-None-Match': plain.headers.etag, 'Accept-Encoding': 'gzip' });
      assert.equal(unchanged.status, 304);
      assert.equal(unchanged.body.length, 0);
    }
    const head = await get('/formation-excel-cpf.html', { 'Accept-Encoding': 'gzip' }, 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.body.length, 0);
    const refused = await get('/', { 'Accept-Encoding': 'gzip;q=0, br;q=0, identity;q=1' });
    assert.equal(refused.headers['content-encoding'], undefined);
    for (const url of ['/admin.html', '/admin', '/%61dmin.html']) {
      const res = await get(url, { 'Accept-Encoding': 'gzip' });
      assert.equal(res.status, 200);
      assert.equal(res.headers['cache-control'], 'private, no-store');
      assert.equal(res.headers['x-robots-tag'], 'noindex, nofollow');
      assert.equal(res.headers['content-encoding'], undefined);
    }
    for (const url of ['/api/stats', '/api/submissions']) {
      const res = await get(url, { 'Accept-Encoding': 'gzip' });
      assert.equal(res.status, 401);
      assert.equal(res.headers['cache-control'], 'private, no-store');
      assert.equal(res.headers['content-encoding'], undefined);
    }
    const range = await get('/style-index.css', { Range: 'bytes=0-99', 'Accept-Encoding': 'gzip' });
    assert.equal(range.status, 206);
    assert.equal(range.body.length, 100);
    assert.equal(range.headers['content-encoding'], undefined);
    assert.deepEqual(range.body, fs.readFileSync(path.join(scratch, 'style-index.css')).subarray(0, 100));
    const media = await get('/fixture.png?v=123');
    assert.equal(media.headers['cache-control'], 'public, max-age=3600, must-revalidate');
    const verifier = await get('/google3a68c31226138741.html');
    assert.equal(verifier.status, 200);
    assert.deepEqual(verifier.body, fs.readFileSync(path.join(scratch, 'google3a68c31226138741.html')));
    for (const url of ['/robots.txt', '/sitemap.xml']) assert.equal((await get(url)).status, 200);
    for (const url of ['/not-a-real-page-seo', '/server.js', '/static-delivery.cjs', '/package.json', '/db/submissions.db']) {
      assert.equal((await get(url)).status, 404);
    }
    assert(log.includes('emails will NOT be sent'));
    assert(log.includes('Claude Code bridge unavailable'));
    console.log(JSON.stringify({ result: 'PASS', pages: 8, checks: 'identity/gzip/brotli, 304, HEAD, ranges, cache, private API/admin, verifier, 404', homepageBytes: sizes }));
  } finally {
    if (child.exitCode === null) {
      console.log('Stopping owned test server', { pid: child.pid, parentPid: process.pid, command: 'node server.js', cwd: scratch, port });
      child.kill('SIGTERM');
      await childExit;
    }
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
