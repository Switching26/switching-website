'use strict';

// Counts HTTP document responses, never people. No browser code, identifier,
// IP address, referrer, query string, cookie or request log is retained.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const DAY = 86400000;
const RETENTION_DAYS = 365;
const BOT = /bot|crawler|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|curl|wget|python|checkos|monitor|uptime/i;

function createAudience({ file, sitemap, token, now = Date.now, flushMs = 15000 }) {
  const aliases = new Map();
  let enabled = typeof token === 'string' && token.length >= 32;
  let healthy = true;
  let dirty = false;
  let lastSavedAt = null;
  let state = { version: 1, started_on: day(), counts: {} };
  function day(time = now()) { return new Date(time).toISOString().slice(0, 10); }
  function prune() {
    const cutoff = day(now() - (RETENTION_DAYS - 1) * DAY);
    for (const d of Object.keys(state.counts)) {
      if (d < cutoff || d > day()) { delete state.counts[d]; dirty = true; }
    }
  }
  try {
    for (const match of fs.readFileSync(sitemap, 'utf8').matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)) {
      const url = new URL(match[1]);
      if (url.origin !== 'https://www.switching-formation.fr' || url.search || url.hash) continue;
      const p = url.pathname === '/index.html' ? '/' : url.pathname;
      if (p !== '/' && !/^\/[a-z0-9/-]+\.html$/.test(p)) continue;
      if (p.startsWith('/admin') || p.startsWith('/api/')) continue;
      aliases.set(p, p);
      if (p.endsWith('.html')) aliases.set(p.slice(0, -5), p);
    }
    if (aliases.has('/')) aliases.set('/index.html', '/');
    if (!aliases.size) throw new Error('empty sitemap');
    if (enabled && fs.existsSync(file)) {
      const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (saved.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(saved.started_on) ||
          !saved.counts || typeof saved.counts !== 'object' || Array.isArray(saved.counts)) throw new Error('invalid store');
      // Rebuild from allowlisted dimensions; never retain arbitrary disk fields.
      state.started_on = saved.started_on;
      for (const [d, rows] of Object.entries(saved.counts)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !rows || typeof rows !== 'object') continue;
        const clean = {};
        for (const [p, count] of Object.entries(rows)) {
          if (aliases.get(p) === p && Number.isSafeInteger(count) && count > 0) clean[p] = count;
        }
        if (Object.keys(clean).length) state.counts[d] = clean;
      }
      prune();
    }
  } catch {
    enabled = false;
    healthy = false;
    console.error('Audience counters unavailable; website continues without counting.');
  }

  function flush() {
    if (!enabled || !dirty) return;
    prune();
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file + '.tmp', JSON.stringify(state), { mode: 0o600 });
      fs.renameSync(file + '.tmp', file);
      dirty = false;
      healthy = true;
      lastSavedAt = new Date(now()).toISOString();
    } catch {
      healthy = false;
      console.error('Audience counters could not be saved; retry scheduled.');
    }
  }
  const timer = enabled ? setInterval(() => { prune(); flush(); }, flushMs) : null;
  timer?.unref();

  function middleware(req, res, next) {
    if (!enabled || req.method !== 'GET') return next();
    // Drop all parameters before choosing an allowlisted public document.
    const page = aliases.get(req.url.split('?')[0]);
    const h = req.headers;
    if (!page || h.dnt === '1' || h['sec-gpc'] === '1' ||
        !h['user-agent'] || BOT.test(h['user-agent']) ||
        !String(h.accept || '').includes('text/html') ||
        (h['sec-fetch-dest'] && h['sec-fetch-dest'] !== 'document') ||
        /prefetch|prerender/i.test(String(h.purpose || '') + String(h['sec-purpose'] || ''))) return next();
    // The callback retains only the approved page and the response, not req.
    res.once('finish', () => {
      if (res.statusCode !== 200 && res.statusCode !== 304) return;
      if (res.statusCode === 200 && !String(res.getHeader('content-type') || '').includes('text/html')) return;
      prune();
      const d = day();
      const rows = state.counts[d] || (state.counts[d] = {});
      rows[page] = Math.min((rows[page] || 0) + 1, Number.MAX_SAFE_INTEGER);
      dirty = true;
    });
    next();
  }

  function report(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    if (typeof token !== 'string' || token.length < 32) return res.status(503).json({ error: 'Mesure indisponible' });
    const supplied = req.headers['x-audience-token'];
    const digest = value => crypto.createHash('sha256').update(value).digest();
    if (typeof supplied !== 'string' || !crypto.timingSafeEqual(digest(supplied), digest(token))) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
    if (!enabled) return res.status(503).json({ error: 'Mesure indisponible' });
    const rawDays = req.query.days === undefined ? '28' : req.query.days;
    if (typeof rawDays !== 'string' || !/^\d{1,3}$/.test(rawDays) || Number(rawDays) < 1 || Number(rawDays) > RETENTION_DAYS) {
      return res.status(400).json({ error: 'days doit être compris entre 1 et 365' });
    }
    prune();
    const from = day(now() - (Number(rawDays) - 1) * DAY);
    const totals = {};
    const daily = [];
    for (const d of Object.keys(state.counts).sort()) {
      if (d < from) continue;
      let count = 0;
      for (const [page, value] of Object.entries(state.counts[d])) {
        totals[page] = (totals[page] || 0) + value;
        count += value;
      }
      daily.push({ day: d, document_requests: count });
    }
    res.json({
      metric: 'document_requests', timezone: 'UTC', started_on: state.started_on,
      from, through: day(), current_day_partial: true, retention_days: RETENTION_DAYS,
      persistence: { healthy, pending: dirty, last_saved_at: lastSavedAt },
      total: Object.values(totals).reduce((sum, value) => sum + value, 0),
      pages: Object.entries(totals).map(([page, count]) => ({ page, document_requests: count }))
        .sort((a, b) => b.document_requests - a.document_requests || a.page.localeCompare(b.page)),
      daily,
      limits: ['Not unique visitors or sessions', 'Known bots excluded heuristically',
        'Browser/cache-only loads are not counted', 'No attribution or conversion tracking',
        'A sudden crash can lose the last 15 seconds of increments'],
    });
  }
  function close() { if (timer) clearInterval(timer); flush(); }
  return { middleware, report, close, flush };
}

module.exports = { createAudience };
