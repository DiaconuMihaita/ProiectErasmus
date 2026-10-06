/* Server local (dezvoltare / școală): fișiere statice + același API ca pe Vercel (lib/core.js) */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../lib/core.js');

const PUBLIC = path.join(__dirname, '..', 'public');
const PORT = +process.env.PORT || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end('Interzis'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 — pagina nu există'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) return core.handle(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res, url);
}).listen(PORT, () => {
  const c = core.config;
  console.log(`\nMathInfo 9 H2H rulează pe http://localhost:${PORT}`);
  console.log(`  bază de date: ${c.dbUrl.startsWith('file:') ? 'fișier local (data/mathinfo.db)' : 'Turso (' + c.dbUrl + ')'}`);
  console.log(`  cod profesor: ${c.TEACHER_CODE}${process.env.TEACHER_CODE ? '' : '   <- schimbă-l cu variabila TEACHER_CODE'}`);
  console.log(`  AI Gemini: ${c.GEMINI_KEY ? 'activ (' + c.GEMINI_MODEL + ')' : 'oprit (setează GEMINI_API_KEY în .env)'}\n`);
});
