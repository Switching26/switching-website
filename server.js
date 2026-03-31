// Force IPv4 globally — Railway IPv6 cannot reach external SMTP servers
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const initSqlJs = require('sql.js');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_HASH = process.env.ADMIN_HASH || '8996bd75d6e4094d491883145c6e5c510698072c853c0e86ff817fdad44aaf44';

// ─── SMTP / EMAIL SETUP ───
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 587;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'contact@switchingformation.com';
const FROM_EMAIL = SMTP_USER || 'contact@switchingformation.com';

// Log SMTP config at startup
console.log('=== SMTP CONFIG ===');
console.log('SMTP_HOST:', SMTP_HOST);
console.log('SMTP_PORT:', SMTP_PORT);
console.log('SMTP_USER:', SMTP_USER ? SMTP_USER : '❌ NOT SET');
console.log('SMTP_PASS:', SMTP_PASS ? '✓ SET (' + SMTP_PASS.length + ' chars)' : '❌ NOT SET');
console.log('NOTIFY_EMAIL:', NOTIFY_EMAIL);
console.log('===================');

let smtpTransport = null;
if (SMTP_USER && SMTP_PASS) {
  const usePort = 465;
  // Resolve smtp.gmail.com to IPv4 manually since Railway forces IPv6
  const dns = require('dns');
  const net = require('net');

  function createSmtp(host) {
    console.log('Connecting to SMTP:', host + ':' + usePort, '(secure: true)');
    smtpTransport = nodemailer.createTransport({
      host: host,
      port: usePort,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com'
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000
    });
    smtpTransport.verify()
      .then(() => console.log('✓ SMTP connection verified — emails will be sent'))
      .catch(err => console.error('✗ SMTP connection FAILED:', err.message));
  }

  // Force DNS lookup to IPv4 only
  dns.resolve4('smtp.gmail.com', (err, addresses) => {
    if (err || !addresses || !addresses.length) {
      console.error('DNS resolve4 failed, trying hardcoded IPv4:', err ? err.message : 'no addresses');
      createSmtp('142.250.115.108'); // Known Gmail SMTP IPv4
    } else {
      console.log('Resolved smtp.gmail.com to IPv4:', addresses[0]);
      createSmtp(addresses[0]);
    }
  });
} else {
  console.log('⚠ SMTP not configured — emails will NOT be sent');
}

function formatDateFR() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return d + '/' + m + '/' + y + ' à ' + h + 'h' + min;
}

function getPageLabel(source) {
  if (source === 'documentation') return 'Page Documentation';
  if (source === 'inscription' || source === 'devis') return 'Page Devis';
  return 'Page Accueil';
}

function buildProspectEmail(data) {
  const vars = {
    '{{PRENOM}}': data.prenom || '',
    '{{NOM}}': data.nom || '',
    '{{FORMATION}}': data.secteur || 'Non précisée'
  };
  let html = TEMPLATE_PROSPECT;
  for (const [k, v] of Object.entries(vars)) {
    html = html.split(k).join(v);
  }
  return html;
}

function buildAdminEmail(data, dateFR, pageLabel) {
  const tel = data.tel ? ((data.indicatif ? data.indicatif.replace(/[^+0-9]/g, '') + ' ' : '') + data.tel) : 'Non renseigné';
  const vars = {
    '{{PRENOM}}': data.prenom || '',
    '{{NOM}}': data.nom || '',
    '{{EMAIL}}': data.email || 'Non renseigné',
    '{{TEL}}': tel,
    '{{FORMATION}}': data.secteur || 'Non précisée',
    '{{FINANCEMENT}}': data.financement || 'Non précisé',
    '{{MESSAGE}}': data.message || 'Aucun message',
    '{{DATE}}': dateFR,
    '{{PAGE}}': pageLabel
  };
  let html = TEMPLATE_ADMIN;
  for (const [k, v] of Object.entries(vars)) {
    html = html.split(k).join(v);
  }
  return html;
}

async function sendEmails(data) {
  if (!smtpTransport) {
    console.log('SMTP not configured — skipping emails');
    return;
  }
  console.log('📧 Sending emails for submission:', data.prenom, data.nom, '| source:', data.source);
  const dateFR = formatDateFR();
  const pageLabel = getPageLabel(data.source);
  const promises = [];

  // 1) Email to prospect (only if they provided an email)
  if (data.email) {
    console.log('  → Prospect email to:', data.email);
    promises.push(
      smtpTransport.sendMail({
        from: '"Switching Formation" <' + FROM_EMAIL + '>',
        to: data.email,
        subject: 'Switching Formation — Votre demande a bien été reçue',
        html: buildProspectEmail(data)
      }).then(info => console.log('  ✓ Prospect email sent:', info.messageId))
       .catch(err => console.error('  ✗ Prospect email FAILED:', err.message, err.code, err.response))
    );
  }

  // 2) Email to admin
  const adminSubject = '🎯 Nouveau prospect — ' + (data.prenom || '') + ' ' + (data.nom || '') + ' — ' + (data.secteur || 'Non précisée');
  console.log('  → Admin email to:', NOTIFY_EMAIL);
  promises.push(
    smtpTransport.sendMail({
      from: '"Switching Formation" <' + FROM_EMAIL + '>',
      to: NOTIFY_EMAIL,
      subject: adminSubject,
      html: buildAdminEmail(data, dateFR, pageLabel)
    }).then(info => console.log('  ✓ Admin email sent:', info.messageId))
     .catch(err => console.error('  ✗ Admin email FAILED:', err.message, err.code, err.response))
  );

  await Promise.all(promises);
}

// ─── EMAIL TEMPLATES (inline HTML) ───
const TEMPLATE_PROSPECT = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f3ef;font-family:Arial,Helvetica,sans-serif;">
<tr><td align="center" style="padding:32px 16px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:560px;max-width:560px;">
<tr><td align="center" style="padding-bottom:24px;">
<img src="https://web-production-0c02.up.railway.app/static/fav-sf-web.png" alt="Switching Formation" width="48" height="48" style="border-radius:12px;display:block;">
</td></tr>
<tr><td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="padding:32px 36px 0;">
<h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 6px;letter-spacing:-.3px;">Demande bien reçue ✓</h1>
<p style="font-size:13px;color:#999;margin:0 0 24px;">Nous revenons vers vous très rapidement.</p>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr><td style="height:1px;background:#eee;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
</td></tr>
<tr><td style="padding:24px 36px;">
<p style="margin:0 0 14px;line-height:1.7;font-size:14px;color:#444;">Bonjour <strong style="color:#1a1a1a;">{{PRENOM}} {{NOM}}</strong>,</p>
<p style="margin:0 0 14px;line-height:1.7;font-size:14px;color:#444;">Merci pour votre intérêt pour la formation <strong style="color:#10ABAF;">{{FORMATION}}</strong>. Votre demande a bien été enregistrée.</p>
<p style="margin:0 0 18px;line-height:1.7;font-size:14px;color:#444;">Un conseiller pédagogique vous <strong style="color:#1a1a1a;">recontactera sous 24h</strong> pour :</p>
</td></tr>
<tr><td style="padding:0 36px 4px;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr><td style="padding:16px 0;border-bottom:1px solid #f0f0ee;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
<td style="vertical-align:middle;padding-right:16px;" width="40"><div style="width:36px;height:36px;border-radius:50%;background:#f4f3ef;text-align:center;line-height:36px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#10ABAF;">1</div></td>
<td style="vertical-align:middle;"><p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">Échange sur vos objectifs</p><p style="margin:3px 0 0;font-size:12px;color:#999;line-height:1.5;">On fait le point sur votre niveau et vos besoins.</p></td>
</tr></table>
</td></tr>
<tr><td style="padding:16px 0;border-bottom:1px solid #f0f0ee;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
<td style="vertical-align:middle;padding-right:16px;" width="40"><div style="width:36px;height:36px;border-radius:50%;background:#f4f3ef;text-align:center;line-height:36px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#10ABAF;">2</div></td>
<td style="vertical-align:middle;"><p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">Programme personnalisé</p><p style="margin:3px 0 0;font-size:12px;color:#999;line-height:1.5;">On vous envoie le programme détaillé et le devis.</p></td>
</tr></table>
</td></tr>
<tr><td style="padding:16px 0;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
<td style="vertical-align:middle;padding-right:16px;" width="40"><div style="width:36px;height:36px;border-radius:50%;background:#f4f3ef;text-align:center;line-height:36px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#10ABAF;">3</div></td>
<td style="vertical-align:middle;"><p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">Aide au financement</p><p style="margin:3px 0 0;font-size:12px;color:#999;line-height:1.5;">CPF, OPCO, France Travail — on identifie la meilleure option.</p></td>
</tr></table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 36px 28px;">
<p style="margin:0 0 20px;line-height:1.7;font-size:14px;color:#444;">Une question ? Appelez-nous au <strong><a href="tel:+33695185057" style="color:#10ABAF;text-decoration:none;">06 95 18 50 57</a></strong></p>
<div style="text-align:center;">
<a href="https://www.switching-formation.fr/formations.html" style="display:inline-block;padding:14px 36px;background:#10ABAF;color:#fff;text-decoration:none;font-weight:700;font-size:14px;border-radius:100px;">Voir nos formations</a>
</div>
</td></tr>
</table>
</td></tr>
<tr><td style="padding-top:16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff;border-radius:14px;overflow:hidden;">
<tr><td style="padding:22px 28px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
<td style="vertical-align:top;padding-right:16px;"><img src="https://web-production-0c02.up.railway.app/static/fav-sf-web.png" alt="SF" width="40" height="40" style="border-radius:10px;display:block;"></td>
<td style="vertical-align:top;">
<p style="margin:0;font-size:15px;font-weight:700;color:#1a1a1a;">Switching Formation</p>
<p style="margin:3px 0 0;font-size:10px;color:#10ABAF;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;">Organisme certifié Qualiopi</p>
<p style="margin:6px 0 0;font-size:11px;color:#999;">18 rue Coriolis, 75012 Paris</p>
</td></tr></table>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:14px;"><tr><td style="height:1px;background:#eee;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:12px;"><tr>
<td style="padding-right:6px;"><img src="https://web-production-0c02.up.railway.app/static/icon-phone.png" alt="" width="12" height="12" style="display:inline-block;vertical-align:middle;"></td>
<td style="font-size:12px;color:#888;padding-right:16px;"><a href="tel:+33695185057" style="color:#888;text-decoration:none;">06 95 18 50 57</a></td>
<td style="padding-right:6px;"><img src="https://web-production-0c02.up.railway.app/static/icon-email.png" alt="" width="12" height="12" style="display:inline-block;vertical-align:middle;"></td>
<td style="font-size:12px;color:#888;padding-right:16px;"><a href="mailto:contact@switchingformation.com" style="color:#888;text-decoration:none;">contact&#64;switchingformation.com</a></td>
</tr></table>
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:8px;"><tr>
<td style="padding-right:6px;"><img src="https://web-production-0c02.up.railway.app/static/icon-globe.png" alt="" width="12" height="12" style="display:inline-block;vertical-align:middle;"></td>
<td style="font-size:12px;"><a href="https://www.switching-formation.fr" style="color:#1a1a1a;text-decoration:none;font-weight:600;">switching-formation.fr</a></td>
</tr></table>
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:14px;"><tr>
<td style="padding-right:5px;"><div style="display:inline-block;padding:3px 9px;border-radius:5px;background:#E6F9F9;font-size:9px;color:#0E9599;font-weight:700;letter-spacing:.4px;">QUALIOPI</div></td>
<td style="padding-right:5px;"><div style="display:inline-block;padding:3px 9px;border-radius:5px;background:#EEF2FF;font-size:9px;color:#4F46E5;font-weight:700;letter-spacing:.4px;">CPF</div></td>
<td style="padding-right:5px;"><div style="display:inline-block;padding:3px 9px;border-radius:5px;background:#FFF7ED;font-size:9px;color:#EA580C;font-weight:700;letter-spacing:.4px;">OPCO</div></td>
<td><div style="display:inline-block;padding:3px 9px;border-radius:5px;background:#F0F4FF;font-size:9px;color:#3B82F6;font-weight:700;letter-spacing:.4px;">FRANCE TRAVAIL</div></td>
</tr></table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding-top:12px;text-align:center;">
<p style="font-size:9px;color:#bbb;letter-spacing:.2px;">SIRET 910 375 716 00016 · NDA 11 94 11 18 99 4 · Actions de formation et bilan de compétences</p>
</td></tr>
</table>
</td></tr>
</table>`;

const TEMPLATE_ADMIN = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f3ef;font-family:Arial,Helvetica,sans-serif;">
<tr><td align="center" style="padding:32px 16px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:560px;max-width:560px;">
<tr><td align="center" style="padding-bottom:24px;">
<img src="https://web-production-0c02.up.railway.app/static/fav-sf-web.png" alt="SF" width="40" height="40" style="border-radius:10px;display:block;">
</td></tr>
<tr><td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff;border-radius:16px;overflow:hidden;">
<tr><td>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#0F172A;border-radius:12px;overflow:hidden;margin:0;">
<tr><td style="padding:20px 28px;">
<p style="margin:0;font-size:18px;font-weight:700;color:#fff;">🎯 Nouveau prospect</p>
<p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">Formulaire rempli le {{DATE}} via {{PAGE}}</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 28px 0;">
<p style="margin:0 0 2px;font-size:9px;font-weight:700;color:#bbb;text-transform:uppercase;letter-spacing:1.2px;">Prospect</p>
<p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a;">{{PRENOM}} {{NOM}}</p>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr><td style="height:1px;background:#eee;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
</td></tr>
<tr><td style="padding:16px 28px;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td style="font-size:11px;color:#bbb;padding:6px 0;width:100px;vertical-align:top;">Email</td>
<td style="font-size:14px;padding:6px 0;"><a href="mailto:{{EMAIL}}" style="color:#10ABAF;text-decoration:none;font-weight:600;">{{EMAIL}}</a></td>
</tr>
<tr>
<td style="font-size:11px;color:#bbb;padding:6px 0;width:100px;vertical-align:top;">Téléphone</td>
<td style="font-size:14px;padding:6px 0;"><a href="tel:{{TEL}}" style="color:#10ABAF;text-decoration:none;font-weight:600;">{{TEL}}</a></td>
</tr>
<tr>
<td style="font-size:11px;color:#bbb;padding:6px 0;width:100px;vertical-align:top;">Formation</td>
<td style="font-size:14px;color:#1a1a1a;font-weight:600;padding:6px 0;">{{FORMATION}}</td>
</tr>
<tr>
<td style="font-size:11px;color:#bbb;padding:6px 0;width:100px;vertical-align:top;">Financement</td>
<td style="font-size:14px;color:#1a1a1a;font-weight:600;padding:6px 0;">{{FINANCEMENT}}</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:0 28px 20px;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr><td style="height:1px;background:#eee;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
<p style="margin:14px 0 0;font-size:9px;font-weight:700;color:#bbb;text-transform:uppercase;letter-spacing:1.2px;">Message</p>
<p style="margin:6px 0 0;font-size:13px;color:#666;line-height:1.6;font-style:italic;background:#f9f9f7;padding:12px 16px;border-radius:8px;">{{MESSAGE}}</p>
</td></tr>
<tr><td style="padding:0 28px 28px;text-align:center;">
<a href="mailto:{{EMAIL}}" style="display:inline-block;padding:12px 32px;background:#10ABAF;color:#fff;text-decoration:none;font-weight:700;font-size:13px;border-radius:100px;">Répondre au prospect →</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding-top:12px;text-align:center;">
<p style="font-size:9px;color:#bbb;letter-spacing:.2px;">SIRET 910 375 716 00016 · NDA 11 94 11 18 99 4</p>
</td></tr>
</table>
</td></tr>
</table>`;

// Database setup — use volume mount if available, fallback to local
// Database path: check env, then common Railway volume mounts, then local
function findDBDir() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  // Try common Railway volume mount paths
  const candidates = ['/data', '/app/data', '/var/data'];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      console.log('Using database directory:', dir);
      return dir;
    } catch(e) {}
  }
  // Fallback to local (will be wiped on redeploy)
  console.log('WARNING: No persistent volume found, using local ./data (data will be lost on redeploy)');
  return path.join(__dirname, 'data');
}
const DB_DIR = findDBDir();
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
  // Send emails in background (don't block the response)
  sendEmails({ source, secteur, statut, financement, prenom, nom, email, indicatif, tel, message })
    .then(() => console.log('Emails sent for:', prenom, nom))
    .catch(err => console.error('Email sending failed:', err.message));
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

// ─── EMAIL TEST ENDPOINT (admin only) ───
app.get('/api/test-email', requireAdmin, async (req, res) => {
  if (!smtpTransport) {
    return res.json({ ok: false, error: 'SMTP not configured', smtp_user: SMTP_USER ? 'set' : 'missing', smtp_pass: SMTP_PASS ? 'set' : 'missing' });
  }
  try {
    await smtpTransport.verify();
    const info = await smtpTransport.sendMail({
      from: '"Switching Formation" <' + FROM_EMAIL + '>',
      to: NOTIFY_EMAIL,
      subject: '✅ Test email — Switching Formation',
      html: '<h2>Test réussi</h2><p>Les emails fonctionnent correctement.</p><p>Envoyé le ' + formatDateFR() + '</p>'
    });
    res.json({ ok: true, messageId: info.messageId, to: NOTIFY_EMAIL, from: FROM_EMAIL });
  } catch (err) {
    res.json({ ok: false, error: err.message, code: err.code, response: err.response });
  }
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
