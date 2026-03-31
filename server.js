const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const initSqlJs = require('sql.js');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_HASH = process.env.ADMIN_HASH || '8996bd75d6e4094d491883145c6e5c510698072c853c0e86ff817fdad44aaf44';

// ─── GMAIL API SETUP ───
const GMAIL_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GMAIL_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GMAIL_FROM = process.env.GMAIL_FROM || 'contact@switchingformation.com';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'contact@switchingformation.com';

let gmailReady = false;

console.log('=== GMAIL API CONFIG ===');
console.log('GOOGLE_CLIENT_ID:', GMAIL_CLIENT_ID ? '✓ SET' : '❌ NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', GMAIL_CLIENT_SECRET ? '✓ SET' : '❌ NOT SET');
console.log('GOOGLE_REFRESH_TOKEN:', GMAIL_REFRESH_TOKEN ? '✓ SET (' + GMAIL_REFRESH_TOKEN.length + ' chars)' : '❌ NOT SET');
console.log('GMAIL_FROM:', GMAIL_FROM);
console.log('NOTIFY_EMAIL:', NOTIFY_EMAIL);
console.log('========================');

if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN) {
  gmailReady = true;
  console.log('✓ Gmail API configured — emails will be sent via HTTPS');
} else {
  console.log('⚠ Gmail API not configured — emails will NOT be sent');
}

// ─── CHATBOT AI SETUP ───
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
let anthropicClient = null;
if (ANTHROPIC_API_KEY) {
  anthropicClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  console.log('✓ Anthropic API configured — chatbot enabled');
} else {
  console.log('⚠ ANTHROPIC_API_KEY not set — chatbot disabled');
}

const CHAT_SYSTEM_PROMPT = `Tu es l'Assistant Switching Formation, le conseiller pédagogique virtuel de Switching Formation, un centre de formation professionnelle certifié Qualiopi à Paris 12ᵉ.

COMPORTEMENT :
- Tu es professionnel, bienveillant et tu vouvoies toujours le prospect.
- Tu réponds en français, de manière concise (2-4 phrases max par message).
- Tu dois TOUJOURS orienter la conversation vers la collecte d'informations du prospect.
- Quand tu proposes des choix, utilise le format [BUTTONS: choix1 | choix2 | choix3] à la fin de ton message (sur une nouvelle ligne). Le frontend affichera ces boutons comme des options cliquables.
- Ne mets JAMAIS les boutons au milieu du texte, toujours à la fin.

INFORMATIONS SUR LE CENTRE :
- Adresse : 18 rue Coriolis, 75012 Paris
- Téléphone : 06 95 18 50 57
- Email : contact@switchingformation.com
- Horaires : Lundi-Vendredi 9h-18h
- Certifications : Qualiopi (Actions de formation + Bilans de compétences)
- Modalités : 100% individuel — Présentiel (Paris 12ᵉ), Visioconférence, E-learning
- Certifications délivrées : ENI, RNCP, Linguaskill, TOSA, VTest

CATALOGUE DE FORMATIONS (7 domaines, 57 formations) :

1. LANGUES (8 formations) : Anglais Niveau 1 (A1-A2), Anglais Niveau 2 (B1-B2), Anglais Niveau 3 (C1-C2), Anglais Niveaux 1-2-3 (A1-C2), Français Niveau 1 (A1-A2), Français Niveau 2 (B1-B2), Français Niveau 3 (C1-C2), Français Niveaux 1-2-3 (A1-C2)

2. BUREAUTIQUE (11 formations) : Bases Informatiques, Excel Complet (CPF/ENI), Excel VBA, Word Complet, PowerPoint Complet, Outlook Complet, Pack Office Complet, Power BI, Outils Collaboratifs Google, Microsoft 365

3. GRAPHISME & DESIGN (13 formations) : Photoshop, Illustrator, InDesign, Canva, Webdesigner, Première Pro CC, After Effects, Final Cut Pro X, SketchUp Pro, Autodesk Revit, SolidWorks, AutoCAD, Permis de construire PCMI

4. WEB & DIGITAL (9 formations) : WordPress, WooCommerce, Marketing digital, Réseaux sociaux & Ads, Réseaux sociaux, Développeur Web, Développeur informatique, SEO, SEA Google Ads

5. COMPTABILITÉ & PAIE (5 formations) : Gestion de la paie Silae (CPF/RNCP), Gestion de la paie Ciel Paie, Gestion de la paie Segid, Secrétaire Assistant Comptable, Comptabilité Générale

6. INTELLIGENCE ARTIFICIELLE (9 formations) : ChatGPT (Gratuit & Plus), Midjourney PRO, IA conversationnelle cycle de vente (RS6792), Copilot Microsoft 365, L'Art de créer des vidéos avec l'IA, Contenus rédactionnels & visuels IA (26h, RS6776), IA Business Pro OptimIA, Contenus rédactionnels & visuels IA (10h, RS6776), CapCut Montages vidéos IA

7. BILAN DE COMPÉTENCES (2 formations) : Bilan 24h (CPF), Bilan 16h (CPF)

FINANCEMENT :
- CPF (Mon Compte Formation) : la plupart des formations sont éligibles
- OPCO : pour les salariés, l'entreprise peut financer via son OPCO
- France Travail (ex Pôle Emploi) : AIF, CSP pour les demandeurs d'emploi
- Financement personnel : possible
- Financement entreprise : plan de développement des compétences

TARIFS ET DURÉES :
- Tu ne communiques JAMAIS de tarif ni de durée précise.
- Réponds : "Un conseiller pédagogique vous communiquera un programme personnalisé avec les tarifs et la durée adaptés à votre niveau et vos objectifs."

OBJECTIF PRINCIPAL — COLLECTE D'INFORMATIONS :
Tu dois collecter ces informations naturellement dans la conversation :
1. Formation souhaitée (secteur/domaine)
2. Statut professionnel (Salarié, Demandeur d'emploi, Indépendant, Intermittent, Étudiant, Autre)
3. Mode de financement (CPF, OPCO, France Travail, Personnel, Entreprise, Je ne sais pas)
4. Prénom
5. Nom
6. Email
7. Téléphone

Quand tu as collecté TOUTES ces 7 informations, tu dois :
1. Récapituler les infos et demander confirmation
2. Si le prospect confirme, écrire exactement ce marqueur sur une nouvelle ligne :
[SUBMIT: {"secteur":"...","statut":"...","financement":"...","prenom":"...","nom":"...","email":"...","tel":"..."}]
3. Puis écrire un message de confirmation : "Votre demande a bien été envoyée ! Un conseiller pédagogique vous recontactera sous 24h."

IMPORTANT :
- Ne demande pas toutes les infos d'un coup. Commence par la formation, puis le statut, etc.
- Si le prospect pose une question, réponds d'abord puis ramène naturellement vers la collecte.
- Si le prospect refuse de donner ses infos, respecte-le et propose d'appeler le 06 95 18 50 57.
- N'invente JAMAIS d'informations. Si tu ne sais pas, dis-le et oriente vers un conseiller.
- Maximum 20 échanges par conversation. Après 15 échanges, propose de finaliser ou d'appeler.`;

// Rate limiting for chat
const chatRateLimit = new Map();
function checkChatRate(ip) {
  const now = Date.now();
  const entries = chatRateLimit.get(ip) || [];
  const recent = entries.filter(t => now - t < 60000);
  if (recent.length >= 10) return false;
  recent.push(now);
  chatRateLimit.set(ip, recent);
  return true;
}
// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entries] of chatRateLimit) {
    const recent = entries.filter(t => now - t < 60000);
    if (recent.length === 0) chatRateLimit.delete(ip);
    else chatRateLimit.set(ip, recent);
  }
}, 300000);

// Get a fresh access token from Google using the refresh token
async function getAccessToken() {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  const data = await resp.json();
  if (!data.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

// Build a RFC 2822 email message and encode as base64url
function buildMimeMessage(to, subject, htmlBody) {
  const boundary = 'boundary_' + Date.now();
  const lines = [
    'From: "Switching Formation" <' + GMAIL_FROM + '>',
    'To: ' + to,
    'Subject: =?UTF-8?B?' + Buffer.from(subject).toString('base64') + '?=',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary=' + boundary,
    '',
    '--' + boundary,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(htmlBody).toString('base64'),
    '',
    '--' + boundary + '--'
  ];
  const raw = lines.join('\r\n');
  // base64url encode
  return Buffer.from(raw).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Send an email via Gmail API
async function gmailSend(to, subject, htmlBody) {
  const token = await getAccessToken();
  const raw = buildMimeMessage(to, subject, htmlBody);
  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: raw })
  });
  const result = await resp.json();
  if (result.error) {
    throw new Error(result.error.message || JSON.stringify(result.error));
  }
  return result;
}

// ─── EMAIL HELPERS ───

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
    '{{STATUT}}': data.statut || 'Non précisé',
    '{{FINANCEMENT}}': data.financement || 'Non précisé',
    '{{VILLE}}': data.ville || 'Non renseignée',
    '{{ENTREPRISE}}': data.entreprise || 'Non renseignée',
    '{{MODALITE}}': data.modalite || 'Non précisée',
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
  if (!gmailReady) {
    console.log('Gmail API not configured — skipping emails');
    return;
  }
  console.log('📧 Sending emails for submission:', data.prenom, data.nom, '| source:', data.source);
  const dateFR = formatDateFR();
  const pageLabel = getPageLabel(data.source);
  const promises = [];

  // 1) Email to prospect
  if (data.email) {
    console.log('  → Prospect email to:', data.email);
    promises.push(
      gmailSend(
        data.email,
        'Switching Formation — Votre demande a bien été reçue',
        buildProspectEmail(data)
      ).then(r => console.log('  ✓ Prospect email sent:', r.id))
       .catch(err => console.error('  ✗ Prospect email FAILED:', err.message))
    );
  }

  // 2) Email to admin
  const adminSubject = '🎯 Nouveau prospect — ' + (data.prenom || '') + ' ' + (data.nom || '') + ' — ' + (data.secteur || 'Non précisée');
  console.log('  → Admin email to:', NOTIFY_EMAIL);
  promises.push(
    gmailSend(
      NOTIFY_EMAIL,
      adminSubject,
      buildAdminEmail(data, dateFR, pageLabel)
    ).then(r => console.log('  ✓ Admin email sent:', r.id))
     .catch(err => console.error('  ✗ Admin email FAILED:', err.message))
  );

  await Promise.all(promises);
}

// ─── EMAIL TEMPLATES (inline HTML) ───
const TEMPLATE_PROSPECT = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f3ef;font-family:Arial,Helvetica,sans-serif;">
<tr><td align="center" style="padding:12px 16px 24px;">
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
<a href="https://www.switching-formation.fr/formations" style="display:inline-block;padding:14px 36px;background:#10ABAF;color:#fff;text-decoration:none;font-weight:700;font-size:14px;border-radius:100px;">Voir nos formations</a>
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
<tr><td align="center" style="padding:12px 16px 24px;">
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
<td style="font-size:11px;color:#bbb;padding:6px 0;width:100px;vertical-align:top;">Statut</td>
<td style="font-size:14px;color:#1a1a1a;font-weight:600;padding:6px 0;">{{STATUT}}</td>
</tr>
<tr>
<td style="font-size:11px;color:#bbb;padding:6px 0;width:100px;vertical-align:top;">Financement</td>
<td style="font-size:14px;color:#1a1a1a;font-weight:600;padding:6px 0;">{{FINANCEMENT}}</td>
</tr>
<tr>
<td style="font-size:11px;color:#bbb;padding:6px 0;width:100px;vertical-align:top;">Modalité</td>
<td style="font-size:14px;color:#1a1a1a;font-weight:600;padding:6px 0;">{{MODALITE}}</td>
</tr>
<tr>
<td style="font-size:11px;color:#bbb;padding:6px 0;width:100px;vertical-align:top;">Ville</td>
<td style="font-size:14px;color:#1a1a1a;font-weight:600;padding:6px 0;">{{VILLE}}</td>
</tr>
<tr>
<td style="font-size:11px;color:#bbb;padding:6px 0;width:100px;vertical-align:top;">Entreprise</td>
<td style="font-size:14px;color:#1a1a1a;font-weight:600;padding:6px 0;">{{ENTREPRISE}}</td>
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

// ─── DATABASE SETUP ───

function findDBDir() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const candidates = ['/data', '/app/data', '/var/data'];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      console.log('Using database directory:', dir);
      return dir;
    } catch(e) {}
  }
  console.log('WARNING: No persistent volume found, using local ./data');
  return path.join(__dirname, 'data');
}
const DB_DIR = findDBDir();
fs.mkdirSync(DB_DIR, { recursive: true });
const DB_FILE = path.join(DB_DIR, 'submissions.db');

let db;

async function initDB() {
  const SQL = await initSqlJs();
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
      secteur TEXT, statut TEXT, financement TEXT,
      prenom TEXT, nom TEXT, email TEXT,
      indicatif TEXT, tel TEXT, message TEXT,
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

// ─── MIDDLEWARE ───

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname, { extensions: ['html'] }));

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  if (hash !== ADMIN_HASH) return res.status(403).json({ error: 'Code incorrect' });
  next();
}

// ─── API ROUTES ───

app.post('/api/submit', (req, res) => {
  const { source, secteur, statut, financement, prenom, nom, email, indicatif, tel, message, ville, entreprise, modalite } = req.body;
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
  sendEmails({ source, secteur, statut, financement, prenom, nom, email, indicatif, tel, message, ville, entreprise, modalite })
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

// ─── CHATBOT ENDPOINT (SSE streaming) ───
app.post('/api/chat', async (req, res) => {
  if (!anthropicClient) {
    return res.status(503).json({ error: 'Chatbot not configured' });
  }
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!checkChatRate(ip)) {
    return res.status(429).json({ error: 'Trop de messages. Réessayez dans une minute.' });
  }
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages requis' });
  }
  // Limit conversation length
  const trimmed = messages.slice(-40); // Keep last 20 exchanges (40 messages user+assistant)

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  try {
    let fullText = '';
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: CHAT_SYSTEM_PROMPT,
      messages: trimmed,
      stream: true
    });

    for await (const event of response) {
      if (event.type === 'content_block_delta' && event.delta && event.delta.text) {
        fullText += event.delta.text;
        res.write('data: ' + JSON.stringify({ type: 'text', text: event.delta.text }) + '\n\n');
      }
    }

    // Parse special markers from the full response
    const btnMatch = fullText.match(/\[BUTTONS:\s*(.+?)\]/);
    if (btnMatch) {
      const buttons = btnMatch[1].split('|').map(b => b.trim());
      res.write('data: ' + JSON.stringify({ type: 'buttons', buttons: buttons }) + '\n\n');
    }
    const submitMatch = fullText.match(/\[SUBMIT:\s*(\{.+?\})\]/s);
    if (submitMatch) {
      try {
        const data = JSON.parse(submitMatch[1]);
        data.source = 'chatbot';
        db.run(
          'INSERT INTO submissions (date, source, secteur, statut, financement, prenom, nom, email, indicatif, tel, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [new Date().toISOString(), 'chatbot', data.secteur || null, data.statut || null, data.financement || null,
           data.prenom || null, data.nom || null, data.email || null, null, data.tel || null, 'Via chatbot IA']
        );
        saveDB();
        sendEmails({ ...data, source: 'chatbot' })
          .then(() => console.log('Chatbot submission emails sent for:', data.prenom, data.nom))
          .catch(err => console.error('Chatbot email error:', err.message));
        res.write('data: ' + JSON.stringify({ type: 'submit', data: data }) + '\n\n');
      } catch (e) {
        console.error('Failed to parse submit data:', e.message);
      }
    }
    res.write('data: ' + JSON.stringify({ type: 'done' }) + '\n\n');
    res.end();
  } catch (err) {
    if (err.name === 'APIUserAbortError' || err.message?.includes('aborted')) {
      console.log('Chat request aborted by client');
    } else {
      console.error('Chat error:', err.message);
    }
    if (!res.writableEnded) {
      try {
        res.write('data: ' + JSON.stringify({ type: 'error', message: 'Une erreur est survenue.' }) + '\n\n');
        res.write('data: ' + JSON.stringify({ type: 'done' }) + '\n\n');
        res.end();
      } catch(e) {}
    }
  }
});

// ─── EMAIL TEST ENDPOINT (admin only) ───
app.get('/api/test-email', requireAdmin, async (req, res) => {
  if (!gmailReady) {
    return res.json({ ok: false, error: 'Gmail API not configured', client_id: GMAIL_CLIENT_ID ? 'set' : 'missing', client_secret: GMAIL_CLIENT_SECRET ? 'set' : 'missing', refresh_token: GMAIL_REFRESH_TOKEN ? 'set' : 'missing' });
  }
  try {
    const result = await gmailSend(
      NOTIFY_EMAIL,
      '✅ Test email — Switching Formation',
      '<h2>Test réussi</h2><p>Les emails fonctionnent correctement via l\'API Gmail.</p><p>Envoyé le ' + formatDateFR() + '</p>'
    );
    res.json({ ok: true, messageId: result.id, to: NOTIFY_EMAIL });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ─── FALLBACK ───
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.use((req, res) => { res.status(404).sendFile(path.join(__dirname, 'index.html')); });

// ─── START ───
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Switching Formation server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
