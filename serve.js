const http = require('http');
const fs   = require('fs');
const path = require('path');

// .env 자동 로딩 (UTF-8 / UTF-16 LE BOM 모두 처리)
(function loadEnv() {
  const envFile = path.join(__dirname, '.env');
  if (!fs.existsSync(envFile)) return;
  let raw = fs.readFileSync(envFile);
  let text;
  if (raw[0] === 0xFF && raw[1] === 0xFE) {
    text = raw.slice(2).toString('utf16le');        // UTF-16 LE BOM
  } else {
    text = raw.toString('utf8').replace(/^﻿/, ''); // UTF-8 (BOM 제거)
  }
  text.split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq < 1) return;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  });
  console.log('.env 로드 완료');
})();

const SECURITY_HEADERS = {
  'Strict-Transport-Security':   'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options':      'nosniff',
  'X-Frame-Options':             'DENY',
  'X-XSS-Protection':            '1; mode=block',
  'Referrer-Policy':             'strict-origin-when-cross-origin',
  'Permissions-Policy':          'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy':     "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://api.resend.com; img-src 'self' data: https:; font-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.pdf':  'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function readBody(req) {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

function makeResHelpers(res) {
  res.status = code => { res.statusCode = code; return res; };
  res.json   = data => {
    if (!res.headersSent) {
      res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify(data));
  };
}

http.createServer(async (req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/')        urlPath = '/index.html';
  if (urlPath === '/admin')   urlPath = '/admin.html';
  if (urlPath === '/place')   urlPath = '/index.html';
  if (urlPath === '/store')   urlPath = '/index.html';
  if (urlPath === '/store/')  urlPath = '/index.html';

  // ── API routes ──────────────────────────────────
  if (urlPath.startsWith('/api/')) {
    req.body = await readBody(req);
    makeResHelpers(res);

    const name        = urlPath.slice(5); // strip /api/
    const handlerPath = path.join(__dirname, 'api', name + '.js');

    if (fs.existsSync(handlerPath)) {
      try {
        delete require.cache[require.resolve(handlerPath)];
        await require(handlerPath)(req, res);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(404).json({ error: 'API not found' });
    }
    return;
  }

  // ── Static files ────────────────────────────────
  const file = path.join(__dirname, urlPath);
  const ext  = path.extname(file);

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', ...SECURITY_HEADERS });
      res.end(data);
    }
  });
}).listen(3000, () => console.log('Server running at http://localhost:3000'));
