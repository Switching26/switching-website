'use strict';

const path = require('node:path');
const compression = require('compression');

// Keep private/API responses and media ranges outside compression. In
// particular, the chatbot stream must not acquire a compression buffer.
const compressPublic = compression({
  threshold: 1024,
  filter(req, res) {
    if (req.headers.range || res.statusCode !== 200) return false;
    return compression.filter(req, res);
  },
});

function privatePathname(pathname) {
  let decoded;
  try {
    decoded = path.posix.normalize(decodeURIComponent(pathname)).toLowerCase();
  } catch {
    return true;
  }
  return decoded === '/api' || decoded.startsWith('/api/') ||
    decoded === '/admin' || decoded === '/admin.html';
}

function publicCompression(req, res, next) {
  if (!['GET', 'HEAD'].includes(req.method) || privatePathname(req.path)) return next();
  return compressPublic(req, res, next);
}

function staticHeaders(res, filePath) {
  const fileName = path.basename(filePath).toLowerCase();
  const ext = path.extname(fileName);
  if (fileName === 'admin.html') {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return;
  }
  // HTML and executable assets retain immediate revalidation: a deployment
  // must not leave an old form/chatbot script cached under its existing name.
  if (['.html', '.css', '.js', '.xml', '.txt'].includes(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  } else {
    // Existing media/fonts are not content-hashed. Avoid immutable/year-long
    // caching even when a caller appends an arbitrary ?v= query parameter.
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
}

module.exports = { publicCompression, staticHeaders };
