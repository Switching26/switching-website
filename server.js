const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_HASH = process.env.ADMIN_HASH || '8996bd75d6e4094d491883145c6e5c510698072c853c0e86ff817fdad44aaf44';

// Database setup — use volume mount if available, fallback to local
const DB_DIR = process.env.DB_PATH || path.join(__dirname, 'data');
fs.mkdirSync(DB_DIR, { recursive: true });
const DB_FILE = path.join(DB_DIR, 'submissions.db');

let db;

async function initDB() {
  const SQL = await initSqlJs();

  // Load existing database or create new
  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
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
  saveDB();
}

function saveDB() {
  try {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (e) {
    console.error('DB save error:', e.message);
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.post('/api/submit', (req, res) => {
  const { source, secteur, statut, financement, prenom, nom, email, indicatif, tel, message } = req.body;
  if (!prenom && !email && !tel) {
    return res.status(400).json({ error: 'Au moins un champ de contact requis' });
  }
  db.run(
    `INSERT INTO submissions (date, source, secteur, statut, financement, prenom, nom, email, indicatif, tel, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [new Date().toISOString(), source || 'accueil', secteur || null, statut || null, financement || null,
     prenom || null, nom || null, email || null, indicatif || null, tel || null, message || null]
  );
  saveDB();
  res.json({ ok: true });
});

app.get('/api/submissions', requireAdmin, (req, res) => {
  const rows = db.exec('SELECT * FROM submissions ORDER BY id DESC');
  res.json(rows.length ? rows[0].values.map(r => ({
    id: r[0], date: r[1], source: r[2], secteur: r[3], statut: r[4], financement: r[5],
    prenom: r[6], nom: r[7], email: r[8], indicatif: r[9], tel: r[10], message: r[11], lu: r[12]
  })) : []);
});

app.get('/api/stats', requireAdmin, (req, res) => {
  const total = db.exec('SELECT COUNT(*) FROM submissions')[0]?.values[0][0] || 0;
  const today = db.exec("SELECT COUNT(*) FROM submissions WHERE date >= date('now')")[0]?.values[0][0] || 0;
  const week = db.exec("SELECT COUNT(*) FROM submissions WHERE date >= date('now', '-7 days')")[0]?.values[0][0] || 0;
  const unread = db.exec('SELECT COUNT(*) FROM submissions WHERE lu = 0')[0]?.values[0][0] || 0;
  const topRow = db.exec("SELECT secteur FROM submissions WHERE secteur IS NOT NULL GROUP BY secteur ORDER BY COUNT(*) DESC LIMIT 1");
  res.json({ total, today, week, unread, topSecteur: topRow.length ? topRow[0].values[0][0] : null });
});

app.patch('/api/submissions/:id/read', requireAdmin, (req, res) => {
  db.run('UPDATE submissions SET lu = 1 WHERE id = ?', [req.params.id]);
  saveDB();
  res.json({ ok: true });
});

app.delete('/api/submissions/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM submissions WHERE id = ?', [req.params.id]);
  saveDB();
  res.json({ ok: true });
});

app.delete('/api/submissions', requireAdmin, (req, res) => {
  db.run('DELETE FROM submissions');
  saveDB();
  res.json({ ok: true });
});

app.get('/api/export', (req, res) => {
  const token = req.query.token || req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  if (hash !== ADMIN_HASH) return res.status(403).json({ error: 'Code incorrect' });

  const rows = db.exec('SELECT * FROM submissions ORDER BY id DESC');
  const headers = ['Date', 'Source', 'Secteur', 'Statut', 'Financement', 'Prenom', 'Nom', 'Email', 'Indicatif', 'Telephone', 'Message', 'Lu'];
  let csv = '\ufeff' + headers.join(';') + '\n';
  if (rows.length) {
    rows[0].values.forEach(r => {
      csv += [r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12] ? 'Oui' : 'Non'].map(v => v || '').join(';') + '\n';
    });
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=switching-demandes.csv');
  res.send(csv);
});

// Fallback
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.use((req, res) => { res.status(404).sendFile(path.join(__dirname, 'index.html')); });

// Start server after DB init
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Switching Formation server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
