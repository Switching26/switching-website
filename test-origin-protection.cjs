'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');

async function main() {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'switching-origin-'));
  const token = 'synthetic-origin-token-for-local-tests-only-64-chars';
  const admin = 'synthetic-admin-password';
  const cleanEnv = { PATH: process.env.PATH, NODE_ENV: 'production' };
  for (const secret of [undefined, 'too-short']) {
    const env = { ...cleanEnv };
    if (secret) env.SITE_ORIGIN_TOKEN = secret;
    const result = spawnSync(process.execPath, ['server.js'], { cwd: __dirname, env, encoding: 'utf8', timeout: 3000 });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SITE_ORIGIN_TOKEN/);
  }
  for (const name of ['server.js', 'static-delivery.cjs', 'audience.cjs', 'index.html', 'admin.html']) {
    fs.copyFileSync(path.join(__dirname, name), path.join(scratch, name));
  }
  // Local synthetic conversations exercise the route without calling AI or mail.
  fs.writeFileSync(path.join(scratch, 'ai-client.cjs'), 'module.exports={configured:()=>true,complete:async()=>"Bonjour de la simulation."};');
  fs.symlinkSync(path.join(__dirname, 'node_modules'), path.join(scratch, 'node_modules'));
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const child = spawn(process.execPath, ['server.js'], { cwd: scratch,
    env: { ...cleanEnv, PORT: String(port), DB_PATH: path.join(scratch, 'db'), SITE_ORIGIN_TOKEN: token,
      ADMIN_HASH: crypto.createHash('sha256').update(admin).digest('hex') }, stdio: ['ignore', 'pipe', 'pipe'] });
  const exited = once(child, 'exit');
  let log = '';
  child.stdout.on('data', b => { log += b; });
  child.stderr.on('data', b => { log += b; });
  const request = (url, method = 'GET', body, headers = {}) => new Promise((resolve, reject) => {
    const bytes = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port, path: url, method,
      headers: { ...(bytes ? { 'Content-Type': 'application/json' } : {}), ...headers } }, res => {
      let text = '';
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text }));
    });
    req.on('error', reject);
    req.setTimeout(4000, () => req.destroy(new Error('timeout')));
    req.end(bytes);
  });
  const trusted = { 'X-Switching-Origin': token, 'CF-Connecting-IP': '192.0.2.11' };
  let checks = 0;
  try {
    const deadline = Date.now() + 8000;
    while (!log.includes('server running on port')) {
      if (child.exitCode !== null || Date.now() > deadline) throw new Error('Test server startup failed');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    for (const [url, method] of [['/', 'GET'], ['/admin', 'GET'], ['/api/stats', 'GET'],
      ['/api/submit', 'POST'], ['/api/chat', 'POST'], ['/api/submit', 'OPTIONS']]) {
      for (const spoof of [{}, { 'X-Switching-Origin': 'wrong', 'CF-Connecting-IP': '192.0.2.11', 'X-Forwarded-For': '192.0.2.11', Host: 'www.switching-formation.fr' }]) {
        const result = await request(url, method, undefined, spoof);
        assert.equal(result.status, 403);
        assert.equal(result.headers['cache-control'], 'private, no-store');
        assert(!result.text.includes(token));
        checks++;
      }
    }
    assert.equal((await request('/', 'GET', undefined, trusted)).status, 200);
    assert.equal((await request('/api/submissions', 'GET', undefined, trusted)).status, 401);
    const preflight = await request('/api/submit', 'OPTIONS', undefined,
      { ...trusted, Origin: 'https://mesmeilleuresformationscpf.com' });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers['access-control-allow-origin'], 'https://mesmeilleuresformationscpf.com');
    for (let i = 0; i < 6; i++) {
      const result = await request('/api/submit', 'POST',
        { prenom: 'Synthetic', email: 'synthetic@example.test', source: 'mmfcpf' },
        { ...trusted, 'X-Forwarded-For': '198.51.100.' + (i + 1) });
      assert.equal(result.status, i < 5 ? 200 : 429);
      checks++;
    }
    assert.equal((await request('/api/submit', 'POST', {}, { ...trusted, 'CF-Connecting-IP': '192.0.2.12' })).status, 400);
    for (let i = 0; i < 11; i++) {
      const result = await request('/api/chat', 'POST', { messages: [{ role: 'user', content: 'Synthetic local test' }] },
        { ...trusted, 'X-Forwarded-For': '198.51.100.' + (i + 10) });
      assert.equal(result.status, i < 10 ? 200 : 429);
      checks++;
    }
    assert.equal((await request('/api/chat', 'POST', { messages: [{ role: 'user', content: 'Synthetic local test' }] },
      { ...trusted, 'CF-Connecting-IP': '192.0.2.13' })).status, 200);
    for (let i = 0; i < 11; i++) {
      const result = await request('/api/stats', 'GET', undefined,
        { ...trusted, 'X-Admin-Token': 'incorrect', 'X-Forwarded-For': '198.51.100.' + (i + 100) });
      assert.equal(result.status, i < 10 ? 403 : 429);
      checks++;
    }
    const stats = await request('/api/stats', 'GET', undefined, { ...trusted, 'X-Admin-Token': admin });
    assert.equal(stats.status, 200); // Valid admin access remains possible after abuse.
    assert.equal(stats.headers['cache-control'], 'private, no-store');
    assert(log.includes('emails will NOT be sent'));
    assert(!log.includes(token));
    console.log(JSON.stringify({ result: 'PASS', checks: checks + 9,
      scope: 'production config, direct-origin rejection, pages/admin, MMFCPF CORS, synthetic forms/chat, spoofed XFF rate limits',
      externalCalls: 0, realEmails: 0, realRecords: 0 }));
  } finally {
    if (child.exitCode === null) {
      console.log('Stopping owned origin-test server', { pid: child.pid, parentPid: process.pid, cwd: scratch, port });
      child.kill('SIGTERM');
      await exited;
    }
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
