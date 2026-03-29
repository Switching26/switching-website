const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin hash (switching2026 by default, override via env var ADMIN_HASH)
const ADMIN_HASH = process.env.ADMIN_HASH || '8996bd75d6e4094d491883145c6e5c510698072c853c0e86ff817fdad44aaf44';

// Database setup
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'submissions.db');
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    source TEXT DEFAULT 'accueil',
    secteur TEXT,
    statut TEXT,
    financement TEXT,
    prenom TEXT,
    nom TEXT,
    email TEXT,
    indicatif TEXT,
    tel TEXT,
    message TEXT,
    lu INTEGER DEFAULT 0
  )
`);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(__dirname, { extensions: ['html'] }));

// Auth middleware
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  if (hash !== ADMIN_HASH) return res.status(403).json({ error: 'Code incorrect' });
  next();
}

// ─── API ROUTES ───

// Submit form (public)
app.post('/api/submit', (req, res) => {
  const { source, secteur, statut, financement, prenom, nom, email, indicatif, tel, message } = req.body;

  if (!prenom && !email && !tel) {
    return res.status(400).json({ error: 'Au moins un champ de contact requis' });
  }

  const stmt = db.prepare(`
    INSERT INTO submissions (date, source, secteur, statut, financement, prenom, nom, email, indicatif, tel, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    new Date().toISOString(),
    source || 'accueil',
    secteur || null,
    statut || null,
    financement || null,
    prenom || null,
    nom || null,
    email || null,
    indicatif || null,
    tel || null,
    message || null
  );

  res.json({ ok: true, id: result.lastInsertRowid });
});

// Get all submissions (admin only)
app.get('/api/submissions', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM submissions ORDER BY id DESC').all();
  res.json(rows);
});

// Get stats (admin only)
app.get('/api/stats', requireAdmin, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM submissions').get().c;
  const today = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE date >= date('now')").get().c;
  const week = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE date >= date('now', '-7 days')").get().c;
  const unread = db.prepare('SELECT COUNT(*) as c FROM submissions WHERE lu = 0').get().c;
  const topRow = db.prepare("SELECT secteur, COUNT(*) as c FROM submissions WHERE secteur IS NOT NULL GROUP BY secteur ORDER BY c DESC LIMIT 1").get();

  res.json({ total, today, week, unread, topSecteur: topRow ? topRow.secteur : null });
});

// Mark as read (admin only)
app.patch('/api/submissions/:id/read', requireAdmin, (req, res) => {
  db.prepare('UPDATE submissions SET lu = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Delete one (admin only)
app.delete('/api/submissions/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM submissions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Delete all (admin only)
app.delete('/api/submissions', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM submissions').run();
  res.json({ ok: true });
});

// Export CSV (admin only, supports token via query param for download links)
app.get('/api/export', (req, res, next) => {
  const token = req.query.token || req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  if (hash !== ADMIN_HASH) return res.status(403).json({ error: 'Code incorrect' });
  next();
}, (req, res) => {
  const rows = db.prepare('SELECT * FROM submissions ORDER BY id DESC').all();
  const headers = ['Date', 'Source', 'Secteur', 'Statut', 'Financement', 'Prenom', 'Nom', 'Email', 'Indicatif', 'Telephone', 'Message', 'Lu'];
  let csv = '\ufeff' + headers.join(';') + '\n';
  rows.forEach(r => {
    csv += [r.date, r.source, r.secteur, r.statut, r.financement, r.prenom, r.nom, r.email, r.indicatif, r.tel, r.message, r.lu ? 'Oui' : 'Non'].map(v => v || '').join(';') + '\n';
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=switching-demandes.csv');
  res.send(csv);
});

// Fallback: serve index.html for root only, 404 for unknown routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Switching Formation server running on port ${PORT}`);
});
