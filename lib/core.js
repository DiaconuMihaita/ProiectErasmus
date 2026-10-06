/* MathInfo 9 H2H — nucleul API (fără stare în memorie → rulează și ca funcție serverless pe Vercel).
   Baza de date: libSQL (Turso în producție, fișier local în dezvoltare). Dueluri online: polling + mașină de stări pe baza timpului. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createClient } = require('@libsql/client');
const { QUESTIONS } = require('../public/js/data.js');
const { LESSONS } = require('../public/js/lessons.js');

const ROOT = path.join(__dirname, '..');
try { // .env local (pe Vercel variabilele vin din dashboard)
  for (const ln of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(ln);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) { /* fără .env */ }
const TEACHER_CODE = process.env.TEACHER_CODE || 'profesor-ler';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/* ---------- baza de date ---------- */
const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DB_URL || 'file:' + path.join(ROOT, 'data', 'mathinfo.db').replace(/\\/g, '/');
if (dbUrl.startsWith('file:')) fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
const client = createClient({ url: dbUrl, authToken: process.env.TURSO_AUTH_TOKEN });
const all = async (sql, args = []) => (await client.execute({ sql, args })).rows.map(r => ({ ...r }));
const get = async (sql, args = []) => (await all(sql, args))[0];
const run = async (sql, args = []) => { const r = await client.execute({ sql, args }); return { changes: r.rowsAffected, id: r.lastInsertRowid == null ? 0 : Number(r.lastInsertRowid) }; };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, display TEXT NOT NULL, role TEXT NOT NULL,
  salt TEXT NOT NULL, hash TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL DEFAULT '{}', created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY, teacher_id INTEGER NOT NULL, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS members (class_id INTEGER NOT NULL, user_id INTEGER NOT NULL, joined INTEGER NOT NULL, PRIMARY KEY (class_id, user_id));
CREATE TABLE IF NOT EXISTS assignments (id INTEGER PRIMARY KEY, class_id INTEGER NOT NULL, title TEXT NOT NULL, descr TEXT NOT NULL DEFAULT '', due INTEGER, lesson_id TEXT, questions TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY, assignment_id INTEGER NOT NULL, user_id INTEGER NOT NULL, answers TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, created INTEGER NOT NULL, UNIQUE (assignment_id, user_id));
CREATE TABLE IF NOT EXISTS matches (id INTEGER PRIMARY KEY, p1 INTEGER, p2 INTEGER, s1 INTEGER, s2 INTEGER, winner INTEGER, subject TEXT, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS live (id INTEGER PRIMARY KEY, p1 INTEGER NOT NULL, p2 INTEGER NOT NULL, names TEXT NOT NULL, subject TEXT NOT NULL, qs TEXT NOT NULL,
  i INTEGER NOT NULL, phase TEXT NOT NULL, t0 INTEGER NOT NULL, sc TEXT NOT NULL, cor TEXT NOT NULL, ans TEXT NOT NULL, rev TEXT, winner INTEGER NOT NULL DEFAULT -1,
  reason TEXT, ack TEXT NOT NULL DEFAULT '[]', ver INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS queue (user_id INTEGER PRIMARY KEY, subject TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, user_id INTEGER NOT NULL UNIQUE, subject TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_live_p1 ON live(p1); CREATE INDEX IF NOT EXISTS idx_live_p2 ON live(p2);
`;
let ready = null;
const init = () => ready || (ready = client.executeMultiple(SCHEMA).then(() => run('DELETE FROM sessions WHERE created < ?', [Date.now() - 30 * 86400000])).catch(e => { ready = null; throw e; }));

/* ---------- utilitare ---------- */
class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const fail = (code, msg) => { throw new HttpError(code, msg); };
const send = (res, code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); };
const now = () => Date.now();
async function readBody(req) {
  let b; try { b = req.body; } catch (e) { fail(400, 'JSON invalid'); }
  if (b !== undefined && b !== null) {
    if (Buffer.isBuffer(b)) b = b.toString('utf8');
    if (typeof b === 'string') { try { return b ? JSON.parse(b) : {}; } catch (e) { fail(400, 'JSON invalid'); } }
    return b;
  }
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > 1e6) fail(413, 'Cerere prea mare'); chunks.push(c); }
  try { return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}; } catch (e) { fail(400, 'JSON invalid'); }
}
const str = (v, min, max, label) => { if (typeof v !== 'string') fail(400, `${label} lipsește`); const t = v.trim(); if (t.length < min || t.length > max) fail(400, `${label}: între ${min} și ${max} caractere`); return t; };
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };
const hits = new Map();   // limitare „cât de bine se poate” (în serverless, per instanță)
function limit(key, max, ms) {
  const t = now(), arr = (hits.get(key) || []).filter(x => t - x < ms);
  if (arr.length >= max) fail(429, 'Prea multe cereri. Încearcă din nou în câteva momente.');
  arr.push(t); hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
}
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const level = xp => Math.floor(xp / 150) + 1;
const publicUser = u => ({ id: u.id, username: u.username, display: u.display, role: u.role, xp: u.xp });
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = n => Array.from({ length: n }, () => CODE_CH[crypto.randomInt(CODE_CH.length)]).join('');

async function auth(req, url, required = true) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : url.searchParams.get('token');
  let user = null;
  if (token) user = await get('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?', [token]);
  if (!user && required) fail(401, 'Trebuie să fii autentificat');
  return user;
}
const needTeacher = u => { if (u.role !== 'teacher') fail(403, 'Doar profesorii pot face asta'); };
async function newSession(uid) { const t = crypto.randomBytes(24).toString('hex'); await run('INSERT INTO sessions (token, user_id, created) VALUES (?, ?, ?)', [t, uid, now()]); return t; }

/* ---------- AI (Gemini; cheia rămâne pe server) ---------- */
const SYSTEM = 'Ești tutorul MathInfo 9, pentru elevi de clasa a IX-a de la Liceul Teoretic „Emil Racoviță” Vaslui. Răspunzi doar în limba română, clar și prietenos, la Matematică (algebră, funcții, șiruri, vectori, trigonometrie) și Informatică (C++, algoritmi) de clasa a IX-a. Explică pas cu pas, ghidează elevul să înțeleagă (nu doar să copieze rezultatul), folosește exemple scurte și formatare simplă (**bold**, `cod`, liste, blocuri ``` pentru cod). Dacă întrebarea nu ține de aceste materii, redirecționează politicos.';
const noTicks = s => s.replace(/`/g, '');
function lessonText(l) {
  return `Lecția „${l.title}” (${l.s === 'mate' ? 'Matematică' : 'Informatică'}):\n` + l.body.map(([t, c]) => t === 'ul' ? c.map(x => '- ' + noTicks(x)).join('\n') : t === 'code' ? '```\n' + c + '\n```' : noTicks(c)).join('\n');
}
async function gemini(contents, system, json = false) {
  if (!GEMINI_KEY) fail(503, 'AI indisponibil: serverul nu are cheie Gemini configurată');
  const body = { systemInstruction: { parts: [{ text: system }] }, contents };
  if (json) body.generationConfig = { responseMimeType: 'application/json' };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY }, body: JSON.stringify(body), signal: AbortSignal.timeout(50000)
  });
  if (!r.ok) { let m = 'eroare ' + r.status; try { m = (await r.json()).error.message; } catch (e) { /* ignorat */ } fail(502, 'Gemini: ' + m); }
  const d = await r.json();
  const parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
  if (!parts) fail(502, 'Gemini a returnat un răspuns gol');
  return parts.map(p => p.text || '').join('');
}
function cleanQuestions(arr, max = 30) {
  if (!Array.isArray(arr) || !arr.length || arr.length > max) fail(400, `Trebuie între 1 și ${max} întrebări`);
  return arr.map((x, i) => {
    const o = Array.isArray(x.o) ? x.o.map(s => String(s).trim().slice(0, 200)).filter(Boolean) : [];
    if (o.length < 2 || o.length > 6) fail(400, `Întrebarea ${i + 1}: între 2 și 6 variante`);
    if (!Number.isInteger(x.a) || x.a < 0 || x.a >= o.length) fail(400, `Întrebarea ${i + 1}: răspuns corect invalid`);
    return { q: str(String(x.q || ''), 3, 500, `Întrebarea ${i + 1}`), o, a: x.a, e: String(x.e || '').slice(0, 500) };
  });
}

/* ---------- dueluri online: mașină de stări bazată pe timp, stocată în DB ---------- */
const ROUNDS = 7, ASK = 15000, GRACE = 400, REVEAL = 5200, LOBBY = 3500, QUEUE_FRESH = 25000;
const SUBJECTS = ['mix', 'mate', 'info'];
const parseLive = r => ({ ...r, names: JSON.parse(r.names), qs: JSON.parse(r.qs), sc: JSON.parse(r.sc), cor: JSON.parse(r.cor), ans: JSON.parse(r.ans), rev: r.rev ? JSON.parse(r.rev) : null, ack: JSON.parse(r.ack) });

function startRound(m, t) { m.i++; m.ans = [null, null]; m.phase = 'ask'; m.t0 = t; m.rev = null; }
function doReveal(m, at) {
  const x = m.qs[m.i], gain = [0, 0];
  for (const p of [0, 1]) { const a = m.ans[p]; if (a && a.idx === x.a) { gain[p] = 100 + Math.round(a.left / (ASK / 1000) * 50); m.cor[p]++; } m.sc[p] += gain[p]; }
  m.rev = { i: m.i, correct: x.a, e: x.e, picks: m.ans.map(a => a ? a.idx : null), gain, sc: [...m.sc], cor: [...m.cor], last: m.i === m.qs.length - 1 };
  m.phase = 'reveal'; m.t0 = at;
}
function finish(m, reason, forceWinner = -1) {
  m.phase = 'done'; m.reason = reason;
  m.winner = forceWinner >= 0 ? forceWinner : m.sc[0] > m.sc[1] ? 0 : m.sc[1] > m.sc[0] ? 1 : -1;
}
/** Avansează meciul până la starea corespunzătoare momentului `t` (deterministic, fără cronometre). */
function advance(m, t) {
  for (let g = 0; g < 40; g++) {
    if (m.phase === 'lobby') { if (t >= m.t0 + LOBBY) startRound(m, m.t0 + LOBBY); else break; }
    else if (m.phase === 'ask') {
      const both = m.ans[0] && m.ans[1], deadline = m.t0 + ASK + GRACE;
      if (both || t >= deadline) doReveal(m, both ? Math.min(Math.max(m.ans[0].at, m.ans[1].at), deadline) : deadline); else break;
    } else if (m.phase === 'reveal') {
      if (t >= m.t0 + REVEAL) { if (m.i + 1 >= m.qs.length) finish(m, 'finished'); else startRound(m, m.t0 + REVEAL); } else break;
    } else break;
  }
}
/** Încarcă meciul, îl avansează și îl salvează cu control de concurență (versiune). Aplică `mutate` opțional. */
async function syncMatch(id, mutate) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await get('SELECT * FROM live WHERE id = ?', [id]); if (!row) return null;
    const m = parseLive(row), was = m.phase, snapshot = JSON.stringify([m.i, m.phase, m.ans, m.sc, m.winner, m.t0]);
    if (mutate && mutate(m) === false) return m;
    advance(m, now());
    if (JSON.stringify([m.i, m.phase, m.ans, m.sc, m.winner, m.t0]) === snapshot) return m;
    const r = await run('UPDATE live SET i=?, phase=?, t0=?, sc=?, cor=?, ans=?, rev=?, winner=?, reason=?, ver=ver+1 WHERE id=? AND ver=?',
      [m.i, m.phase, m.t0, JSON.stringify(m.sc), JSON.stringify(m.cor), JSON.stringify(m.ans), m.rev ? JSON.stringify(m.rev) : null, m.winner, m.reason || null, m.id, row.ver]);
    if (r.changes) {
      if (m.phase === 'done' && was !== 'done') await run('INSERT INTO matches (p1, p2, s1, s2, winner, subject, created) VALUES (?,?,?,?,?,?,?)', [m.p1, m.p2, m.sc[0], m.sc[1], m.winner >= 0 ? (m.winner === 0 ? m.p1 : m.p2) : null, m.subject, now()]);
      return m;
    }
  }
  fail(409, 'Meciul se actualizează, mai încearcă o dată');
}
function viewFor(m, uid) {
  const you = m.p1 === uid ? 0 : 1;
  const v = { id: m.id, names: m.names, you, subject: m.subject, rounds: m.qs.length, time: ASK / 1000, phase: m.phase, i: m.i, sc: m.sc, cor: m.cor };
  if (m.phase === 'lobby') v.startsIn = Math.max(0, (m.t0 + LOBBY - now()) / 1000);
  if (m.phase === 'ask') { const x = m.qs[m.i]; v.n = m.qs.length; v.q = { q: x.q, t: x.t, s: x.s, o: x.o }; v.left = Math.max(0, (m.t0 + ASK - now()) / 1000); v.picked = m.ans[you] ? m.ans[you].idx : null; v.oppDone = !!m.ans[1 - you]; }
  if (m.phase === 'reveal') { const x = m.qs[m.i]; v.n = m.qs.length; v.q = { q: x.q, t: x.t, s: x.s, o: x.o }; v.rev = m.rev; }
  if (m.phase === 'done') v.end = { sc: m.sc, cor: m.cor, names: m.names, winner: m.winner, reason: m.reason };
  return v;
}
async function currentMatchId(uid, activeOnly = false) {
  const row = await get('SELECT id, ack, phase FROM live WHERE p1 = ? OR p2 = ? ORDER BY id DESC LIMIT 1', [uid, uid]);
  if (!row) return null;
  if (row.phase === 'done' && (activeOnly || JSON.parse(row.ack).includes(uid))) return null;
  return row.id;
}
async function createMatch(a, b, subject) {
  const pool = QUESTIONS.filter(x => subject === 'mix' || x.s === subject);
  const qs = shuffle(pool).slice(0, ROUNDS).map(x => { const order = shuffle(x.o.map((_, i) => i)); return { s: x.s, t: x.t, q: x.q, e: x.e, o: order.map(i => x.o[i]), a: order.indexOf(x.a) }; });
  const na = (await get('SELECT display FROM users WHERE id = ?', [a])).display, nb = (await get('SELECT display FROM users WHERE id = ?', [b])).display;
  await run('DELETE FROM queue WHERE user_id IN (?, ?)', [a, b]); await run('DELETE FROM rooms WHERE user_id IN (?, ?)', [a, b]);
  const r = await run('INSERT INTO live (p1, p2, names, subject, qs, i, phase, t0, sc, cor, ans, created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [a, b, JSON.stringify([na, nb]), subject, JSON.stringify(qs), -1, 'lobby', now(), '[0,0]', '[0,0]', '[null,null]', now()]);
  return r.id;
}

/* ---------- rute ---------- */
const routes = [];
const route = (method, pattern, fn, authReq = false) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn, auth: authReq });

route('GET', '/api/config', async () => ({ ai: !!GEMINI_KEY, model: GEMINI_MODEL, rounds: ROUNDS, transport: 'poll' }));

route('POST', '/api/register', async ({ body, ip }) => {
  limit('reg:' + ip, 10, 600000);
  const username = str(body.username, 3, 20, 'Utilizator');
  if (!/^[A-Za-z0-9_.-]+$/.test(username)) fail(400, 'Utilizator: doar litere, cifre, _ . -');
  const pw = str(body.password, 6, 100, 'Parola');
  const display = str(body.display || username, 2, 24, 'Nume afișat');
  const role = body.role === 'teacher' ? 'teacher' : 'student';
  if (role === 'teacher' && body.teacherCode !== TEACHER_CODE) fail(403, 'Cod de profesor incorect');
  if (await get('SELECT 1 AS x FROM users WHERE username = ?', [username])) fail(409, 'Numele de utilizator este deja luat');
  const salt = crypto.randomBytes(16).toString('hex');
  const r = await run('INSERT INTO users (username, display, role, salt, hash, created) VALUES (?,?,?,?,?,?)', [username, display, role, salt, hashPw(pw, salt), now()]);
  const user = await get('SELECT * FROM users WHERE id = ?', [r.id]);
  return { token: await newSession(user.id), user: publicUser(user), data: {} };
});
route('POST', '/api/login', async ({ body, ip }) => {
  limit('login:' + ip, 15, 300000);
  const u = await get('SELECT * FROM users WHERE username = ?', [String(body.username || '').trim()]);
  const ok = u && crypto.timingSafeEqual(Buffer.from(hashPw(String(body.password || ''), u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
  if (!ok) fail(401, 'Utilizator sau parolă greșite');
  return { token: await newSession(u.id), user: publicUser(u), data: JSON.parse(u.data || '{}') };
});
route('POST', '/api/logout', async ({ req }) => {
  const h = req.headers.authorization || ''; if (h.startsWith('Bearer ')) await run('DELETE FROM sessions WHERE token = ?', [h.slice(7)]);
  return { ok: true };
}, true);
route('GET', '/api/me', async ({ user }) => ({ user: publicUser(user), data: JSON.parse(user.data || '{}') }), true);
route('PUT', '/api/me', async ({ user, body }) => {
  const data = JSON.stringify(body.data || {});
  if (data.length > 300000) fail(413, 'Date prea mari');
  const xp = Math.max(0, Math.min(1e6, Math.floor(+body.xp || 0)));
  await run('UPDATE users SET data = ?, xp = ? WHERE id = ?', [data, xp, user.id]);
  if (typeof body.display === 'string' && body.display.trim().length >= 2) await run('UPDATE users SET display = ? WHERE id = ?', [body.display.trim().slice(0, 24), user.id]);
  return { ok: true };
}, true);
route('GET', '/api/leaderboard', async () => ({
  rows: (await all(`SELECT u.display, u.xp, (SELECT COUNT(*) FROM matches m WHERE m.winner = u.id) AS wins FROM users u WHERE u.role = 'student' AND u.xp > 0 ORDER BY u.xp DESC LIMIT 20`)).map(r => ({ ...r, level: level(r.xp) }))
}));

/* ----- clase ----- */
async function classFor(user, id) {
  const c = await get('SELECT * FROM classes WHERE id = ?', [id]);
  if (!c) fail(404, 'Clasa nu există');
  const isOwner = user.role === 'teacher' && c.teacher_id === user.id;
  const isMember = !!(await get('SELECT 1 AS x FROM members WHERE class_id = ? AND user_id = ?', [id, user.id]));
  if (!isOwner && !isMember) fail(403, 'Nu ai acces la această clasă');
  return { c, isOwner };
}
route('POST', '/api/classes', async ({ user, body }) => {
  needTeacher(user);
  const name = str(body.name, 2, 60, 'Numele clasei');
  let code; do { code = genCode(6); } while (await get('SELECT 1 AS x FROM classes WHERE code = ?', [code]));
  const r = await run('INSERT INTO classes (teacher_id, name, code, created) VALUES (?,?,?,?)', [user.id, name, code, now()]);
  return { id: r.id, name, code };
}, true);
route('GET', '/api/classes', async ({ user }) => {
  if (user.role === 'teacher') return { classes: await all('SELECT c.id, c.name, c.code, (SELECT COUNT(*) FROM members m WHERE m.class_id = c.id) AS students, (SELECT COUNT(*) FROM assignments a WHERE a.class_id = c.id) AS assignments FROM classes c WHERE c.teacher_id = ? ORDER BY c.id DESC', [user.id]) };
  return { classes: await all('SELECT c.id, c.name, t.display AS teacher FROM members m JOIN classes c ON c.id = m.class_id JOIN users t ON t.id = c.teacher_id WHERE m.user_id = ? ORDER BY c.id DESC', [user.id]) };
}, true);
route('POST', '/api/classes/join', async ({ user, body }) => {
  if (user.role !== 'student') fail(403, 'Doar elevii se pot alătura unei clase');
  const c = await get('SELECT * FROM classes WHERE code = ?', [String(body.code || '').trim().toUpperCase()]);
  if (!c) fail(404, 'Cod de clasă invalid');
  await run('INSERT OR IGNORE INTO members (class_id, user_id, joined) VALUES (?,?,?)', [c.id, user.id, now()]);
  return { id: c.id, name: c.name };
}, true);
route('GET', '/api/classes/:id', async ({ user, params }) => {
  const { c, isOwner } = await classFor(user, +params.id);
  const teacher = (await get('SELECT display FROM users WHERE id = ?', [c.teacher_id])).display;
  const asg = await all('SELECT id, title, descr, due, lesson_id, created, json_array_length(questions) AS n FROM assignments WHERE class_id = ? ORDER BY id DESC', [c.id]);
  if (isOwner) {
    const members = await all('SELECT u.id, u.display, u.username, u.xp, (SELECT COUNT(*) FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.user_id = u.id AND a.class_id = ?) AS done FROM members m JOIN users u ON u.id = m.user_id WHERE m.class_id = ? ORDER BY u.xp DESC', [c.id, c.id]);
    const counts = await all('SELECT s.assignment_id AS id, COUNT(*) AS n FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.class_id = ? GROUP BY s.assignment_id', [c.id]);
    const cm = Object.fromEntries(counts.map(r => [r.id, r.n]));
    return { class: { id: c.id, name: c.name, code: c.code, teacher }, owner: true, members, assignments: asg.map(a => ({ ...a, submitted: cm[a.id] || 0 })) };
  }
  const mine = await all('SELECT s.assignment_id AS id, s.score, s.total, s.created FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.class_id = ? AND s.user_id = ?', [c.id, user.id]);
  const mm = Object.fromEntries(mine.map(r => [r.id, { score: r.score, total: r.total, created: r.created }]));
  return { class: { id: c.id, name: c.name, teacher }, owner: false, assignments: asg.map(a => ({ ...a, mine: mm[a.id] || null })) };
}, true);
route('DELETE', '/api/classes/:id', async ({ user, params }) => {
  const { c, isOwner } = await classFor(user, +params.id); if (!isOwner) fail(403, 'Doar profesorul clasei poate șterge clasa');
  await client.batch([
    { sql: 'DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE class_id = ?)', args: [c.id] },
    { sql: 'DELETE FROM assignments WHERE class_id = ?', args: [c.id] }, { sql: 'DELETE FROM members WHERE class_id = ?', args: [c.id] }, { sql: 'DELETE FROM classes WHERE id = ?', args: [c.id] }]);
  return { ok: true };
}, true);
route('POST', '/api/classes/:id/assignments', async ({ user, params, body }) => {
  const { c, isOwner } = await classFor(user, +params.id); if (!isOwner) fail(403, 'Doar profesorul clasei poate da teme');
  const title = str(body.title, 2, 100, 'Titlul temei'), descr = String(body.descr || '').slice(0, 1000);
  const questions = cleanQuestions(body.questions);
  const due = body.due ? Math.floor(+body.due) : null;
  const lesson = LESSONS.some(l => l.id === body.lessonId) ? body.lessonId : null;
  const r = await run('INSERT INTO assignments (class_id, title, descr, due, lesson_id, questions, created) VALUES (?,?,?,?,?,?,?)', [c.id, title, descr, due, lesson, JSON.stringify(questions), now()]);
  return { id: r.id };
}, true);
async function assignmentFor(user, id) {
  const a = await get('SELECT * FROM assignments WHERE id = ?', [id]);
  if (!a) fail(404, 'Tema nu există');
  const { c, isOwner } = await classFor(user, a.class_id);
  return { a, c, isOwner, questions: JSON.parse(a.questions) };
}
route('GET', '/api/assignments/:id', async ({ user, params }) => {
  const { a, c, isOwner, questions } = await assignmentFor(user, +params.id);
  const head = { id: a.id, title: a.title, descr: a.descr, due: a.due, lessonId: a.lesson_id, className: c.name, classId: c.id };
  if (isOwner) {
    const subs = await all('SELECT s.user_id, u.display, s.score, s.total, s.created, s.answers FROM submissions s JOIN users u ON u.id = s.user_id WHERE s.assignment_id = ? ORDER BY s.score DESC, s.created', [a.id]);
    const missing = (await all('SELECT u.display FROM members m JOIN users u ON u.id = m.user_id WHERE m.class_id = ? AND u.id NOT IN (SELECT user_id FROM submissions WHERE assignment_id = ?)', [c.id, a.id])).map(r => r.display);
    const stats = questions.map((qq, i) => ({ q: qq.q, pct: subs.length ? Math.round(subs.filter(s => JSON.parse(s.answers)[i] === qq.a).length / subs.length * 100) : null }));
    return { ...head, owner: true, questions, submissions: subs.map(s => ({ user: s.display, score: s.score, total: s.total, created: s.created })), missing, stats };
  }
  const mine = await get('SELECT * FROM submissions WHERE assignment_id = ? AND user_id = ?', [a.id, user.id]);
  if (mine) { const ans = JSON.parse(mine.answers); return { ...head, owner: false, done: true, score: mine.score, total: mine.total, review: questions.map((x, i) => ({ ...x, picked: ans[i] })) }; }
  return { ...head, owner: false, done: false, questions: questions.map(x => ({ q: x.q, o: x.o })) };
}, true);
route('POST', '/api/assignments/:id/submit', async ({ user, params, body }) => {
  if (user.role !== 'student') fail(403, 'Doar elevii pot trimite teme');
  const { a, questions } = await assignmentFor(user, +params.id);
  if (await get('SELECT 1 AS x FROM submissions WHERE assignment_id = ? AND user_id = ?', [a.id, user.id])) fail(409, 'Ai trimis deja această temă');
  const ans = Array.isArray(body.answers) ? body.answers.slice(0, questions.length).map(v => Number.isInteger(v) ? v : null) : [];
  while (ans.length < questions.length) ans.push(null);
  const score = questions.filter((x, i) => ans[i] === x.a).length;
  try { await run('INSERT INTO submissions (assignment_id, user_id, answers, score, total, created) VALUES (?,?,?,?,?,?)', [a.id, user.id, JSON.stringify(ans), score, questions.length, now()]); }
  catch (e) { fail(409, 'Ai trimis deja această temă'); }
  return { score, total: questions.length, review: questions.map((x, i) => ({ ...x, picked: ans[i] })) };
}, true);
route('DELETE', '/api/assignments/:id', async ({ user, params }) => {
  const { a, isOwner } = await assignmentFor(user, +params.id); if (!isOwner) fail(403, 'Doar profesorul poate șterge tema');
  await client.batch([{ sql: 'DELETE FROM submissions WHERE assignment_id = ?', args: [a.id] }, { sql: 'DELETE FROM assignments WHERE id = ?', args: [a.id] }]);
  return { ok: true };
}, true);

/* ----- AI ----- */
route('POST', '/api/ai', async ({ body, ip, user }) => {
  limit('ai:' + (user ? user.id : ip), 20, 60000);
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12).map(m => ({ role: m.r === 'u' ? 'user' : 'model', parts: [{ text: String(m.t || '').slice(0, 2000) }] }));
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') fail(400, 'Mesaj lipsă');
  const lesson = LESSONS.find(l => l.id === body.lessonId);
  const system = SYSTEM + (lesson ? '\n\nElevul studiază acum această lecție; folosește-o ca referință principală și leag-o de întrebare:\n' + lessonText(lesson) : '');
  return { text: await gemini(msgs, system) };
});
route('POST', '/api/ai/questions', async ({ user, body }) => {
  needTeacher(user); limit('aiq:' + user.id, 10, 60000);
  const topic = str(body.topic, 3, 200, 'Tema'), n = Math.max(1, Math.min(10, +body.n || 5));
  const lesson = LESSONS.find(l => l.id === body.lessonId);
  const prompt = `Generează ${n} întrebări grilă (cu exact 4 variante, un singur răspuns corect) pentru elevi de clasa a IX-a, despre: ${topic}. ${lesson ? 'Bazează-te pe această lecție:\n' + lessonText(lesson) : ''}\nReturnează DOAR un array JSON de obiecte de forma {"q": "enunț", "o": ["varianta A","varianta B","varianta C","varianta D"], "a": 0, "e": "explicația rezolvării"}, unde "a" este indexul (0-3) variantei corecte. Verifică atent calculele și ordinea variantelor.`;
  const text = await gemini([{ role: 'user', parts: [{ text: prompt }] }], SYSTEM, true);
  let arr; try { arr = JSON.parse(text.replace(/^```json|```$/g, '').trim()); } catch (e) { fail(502, 'AI-ul a returnat un format neașteptat. Încearcă din nou.'); }
  return { questions: cleanQuestions(Array.isArray(arr) ? arr.slice(0, n) : arr, 10) };
}, true);

/* ----- H2H online (polling) ----- */
const subjectOf = b => SUBJECTS.includes(b.subject) ? b.subject : 'mix';
async function stateFor(uid) {
  const mid = await currentMatchId(uid);
  if (mid) { const m = await syncMatch(mid); if (m) return { state: 'match', view: viewFor(m, uid) }; }
  const t = now();
  const room = await get('SELECT code FROM rooms WHERE user_id = ?', [uid]);
  if (room) { await run('UPDATE rooms SET ts = ? WHERE user_id = ?', [t, uid]); return { state: 'room', code: room.code }; }
  const qu = await get('SELECT subject FROM queue WHERE user_id = ?', [uid]);
  if (qu) { await run('UPDATE queue SET ts = ? WHERE user_id = ?', [t, uid]); return { state: 'queue', subject: qu.subject }; }
  return { state: 'idle' };
}
route('GET', '/api/h2h/poll', async ({ user }) => stateFor(user.id), true);
route('POST', '/api/h2h/queue', async ({ user, body }) => {
  const subject = subjectOf(body);
  if (await currentMatchId(user.id, true)) fail(409, 'Ești deja într-un meci');
  await run('DELETE FROM rooms WHERE user_id = ?', [user.id]); await run('DELETE FROM queue WHERE user_id = ?', [user.id]);
  const waiter = await get('SELECT user_id FROM queue WHERE subject = ? AND user_id <> ? AND ts > ? ORDER BY ts LIMIT 1', [subject, user.id, now() - QUEUE_FRESH]);
  if (waiter) { const claim = await run('DELETE FROM queue WHERE user_id = ?', [waiter.user_id]); if (claim.changes) { await createMatch(waiter.user_id, user.id, subject); return { status: 'matched' }; } }
  await run('INSERT OR REPLACE INTO queue (user_id, subject, ts) VALUES (?,?,?)', [user.id, subject, now()]);
  return { status: 'waiting' };
}, true);
route('POST', '/api/h2h/room', async ({ user, body }) => {
  const subject = subjectOf(body);
  if (await currentMatchId(user.id, true)) fail(409, 'Ești deja într-un meci');
  await run('DELETE FROM rooms WHERE user_id = ?', [user.id]); await run('DELETE FROM queue WHERE user_id = ?', [user.id]);
  await run('DELETE FROM rooms WHERE ts < ?', [now() - 600000]);
  let code; do { code = genCode(5); } while (await get('SELECT 1 AS x FROM rooms WHERE code = ?', [code]));
  await run('INSERT INTO rooms (code, user_id, subject, ts) VALUES (?,?,?,?)', [code, user.id, subject, now()]);
  return { code };
}, true);
route('POST', '/api/h2h/join', async ({ user, body }) => {
  const code = String(body.code || '').trim().toUpperCase();
  const r = await get('SELECT * FROM rooms WHERE code = ? AND ts > ?', [code, now() - QUEUE_FRESH]);
  if (!r) fail(404, 'Camera nu există sau a expirat');
  if (r.user_id === user.id) fail(400, 'Nu poți intra în propria cameră');
  if (await currentMatchId(user.id, true)) fail(409, 'Ești deja într-un meci');
  const claim = await run('DELETE FROM rooms WHERE code = ?', [code]);
  if (!claim.changes) fail(404, 'Camera nu mai este disponibilă');
  await createMatch(r.user_id, user.id, r.subject); return { status: 'matched' };
}, true);
route('POST', '/api/h2h/cancel', async ({ user }) => { await run('DELETE FROM rooms WHERE user_id = ?', [user.id]); await run('DELETE FROM queue WHERE user_id = ?', [user.id]); return { ok: true }; }, true);
route('POST', '/api/h2h/leave', async ({ user }) => {
  await run('DELETE FROM rooms WHERE user_id = ?', [user.id]); await run('DELETE FROM queue WHERE user_id = ?', [user.id]);
  const mid = await currentMatchId(user.id);
  if (mid) await syncMatch(mid, m => { if (m.phase === 'done') return false; finish(m, 'forfeit', m.p1 === user.id ? 1 : 0); });
  return { ok: true };
}, true);
route('POST', '/api/h2h/ack', async ({ user }) => {
  const row = await get('SELECT id, ack, phase FROM live WHERE p1 = ? OR p2 = ? ORDER BY id DESC LIMIT 1', [user.id, user.id]);
  if (row && row.phase === 'done') { const ack = JSON.parse(row.ack); if (!ack.includes(user.id)) { ack.push(user.id); await run('UPDATE live SET ack = ? WHERE id = ?', [JSON.stringify(ack), row.id]); } }
  return { ok: true };
}, true);
route('POST', '/api/h2h/answer', async ({ user, body }) => {
  const mid = await currentMatchId(user.id); if (!mid) return { ok: false };
  const idx = body.idx; if (!Number.isInteger(idx) || idx < 0 || idx > 3) return { ok: false };
  let ok = false;
  const m = await syncMatch(mid, m => {
    const p = m.p1 === user.id ? 0 : 1, t = now();
    advance(m, t);                                               // aduce meciul la momentul curent înainte de a accepta răspunsul
    if (m.phase !== 'ask' || m.id !== body.match || m.i !== body.i || m.ans[p]) return;
    m.ans[p] = { idx, left: Math.max(0, (ASK - (t - m.t0)) / 1000), at: t }; ok = true;
  });
  return { ok, view: m ? viewFor(m, user.id) : null };
}, true);

/* ---------- intrare HTTP ---------- */
async function handle(req, res) {
  const url = new URL(req.url, 'http://x'), ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').toString().split(',')[0].trim();
  try {
    if (url.pathname === '/api/config') {   // răspunde mereu, chiar dacă baza de date nu este accesibilă (diagnostic)
      let dbError = null; try { await init(); } catch (e) { dbError = String(e.message || e).slice(0, 300); }
      return send(res, 200, { ai: !!GEMINI_KEY, model: GEMINI_MODEL, rounds: ROUNDS, transport: 'poll', db: dbUrl.startsWith('file:') ? 'local' : 'turso', dbError });
    }
    await init();
    const r = routes.find(x => x.method === req.method && x.re.test(url.pathname));
    if (!r) return send(res, 404, { error: 'Rută inexistentă' });
    const params = r.re.exec(url.pathname).groups || {};
    const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readBody(req);
    const user = await auth(req, url, r.auth);
    send(res, 200, await r.fn({ req, url, params, body, ip, user }));
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.code, { error: e.message });
    console.error(e); send(res, 500, { error: 'Eroare internă' });
  }
}

module.exports = { handle, init, config: { TEACHER_CODE, GEMINI_KEY, GEMINI_MODEL, dbUrl } };
