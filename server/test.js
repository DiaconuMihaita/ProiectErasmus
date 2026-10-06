/* Test de integrare: pornește serverul separat (PORT=3100 DB_FILE=/tmp/t.db) și rulează: node server/test.js */
const BASE = process.env.BASE || 'http://localhost:3100';
let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
async function api(method, url, body, token) {
  const r = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) { /* gol */ }
  return { s: r.status, ...j };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const sfx = Date.now().toString(36);
  let r = await api('POST', '/api/register', { username: 'prof' + sfx, password: 'parola1', role: 'teacher', teacherCode: 'gresit' });
  ok(r.s === 403, 'profesor cu cod greșit respins');
  const T = await api('POST', '/api/register', { username: 'prof' + sfx, password: 'parola1', role: 'teacher', teacherCode: 'profesor-ler', display: 'Dna Prof' });
  ok(T.token && T.user.role === 'teacher', 'profesor înregistrat');
  const A = await api('POST', '/api/register', { username: 'ana' + sfx, password: 'parola1', display: 'Ana' });
  const B = await api('POST', '/api/register', { username: 'bob' + sfx, password: 'parola1', display: 'Bob' });
  ok(A.token && B.token, 'elevi înregistrați');
  r = await api('POST', '/api/login', { username: 'ana' + sfx, password: 'gresita' }); ok(r.s === 401, 'login cu parolă greșită respins');
  r = await api('POST', '/api/login', { username: 'ANA' + sfx, password: 'parola1' }); ok(r.token, 'login (nume insensibil la litere)');

  r = await api('POST', '/api/classes', { name: 'IX A' }, A.token); ok(r.s === 403, 'elev nu poate crea clasă');
  const C = await api('POST', '/api/classes', { name: 'IX A' }, T.token); ok(C.code && C.code.length === 6, 'clasă creată, cod ' + C.code);
  r = await api('POST', '/api/classes/join', { code: C.code.toLowerCase() }, A.token); ok(r.id === C.id, 'Ana intră în clasă');
  r = await api('POST', '/api/classes/join', { code: 'ZZZZZZ' }, B.token); ok(r.s === 404, 'cod invalid respins');
  await api('POST', '/api/classes/join', { code: C.code }, B.token);

  const qs = [{ q: '2 + 2 = ?', o: ['3', '4', '5', '6'], a: 1, e: 'patru' }, { q: '3 · 3 = ?', o: ['6', '9'], a: 1 }];
  r = await api('POST', `/api/classes/${C.id}/assignments`, { title: 'Test', questions: [{ q: 'x', o: ['a'], a: 0 }] }, T.token); ok(r.s === 400, 'întrebare invalidă respinsă');
  const AS = await api('POST', `/api/classes/${C.id}/assignments`, { title: 'Temă 1', descr: 'Rezolvați', questions: qs, lessonId: 'm1' }, T.token); ok(AS.id, 'temă creată');
  r = await api('GET', `/api/assignments/${AS.id}`, null, A.token);
  ok(r.questions.length === 2 && r.questions[0].a === undefined, 'elevul vede întrebările fără răspunsuri');
  r = await api('POST', `/api/assignments/${AS.id}/submit`, { answers: [1, 0] }, A.token); ok(r.score === 1 && r.total === 2, 'notare corectă 1/2');
  r = await api('POST', `/api/assignments/${AS.id}/submit`, { answers: [1, 1] }, A.token); ok(r.s === 409, 'a doua trimitere respinsă');
  r = await api('GET', `/api/assignments/${AS.id}`, null, A.token); ok(r.done && r.review[0].a === 1, 'după trimitere vede corectura');
  r = await api('GET', `/api/assignments/${AS.id}`, null, T.token); ok(r.owner && r.submissions.length === 1 && r.missing.includes('Bob'), 'profesorul vede rezultate + cine nu a făcut');
  r = await api('GET', `/api/classes/${C.id}`, null, T.token); ok(r.members.length === 2 && r.assignments[0].submitted === 1, 'detalii clasă pentru profesor');
  const other = await api('POST', '/api/register', { username: 'cip' + sfx, password: 'parola1' });
  r = await api('GET', `/api/classes/${C.id}`, null, other.token); ok(r.s === 403, 'străinul nu vede clasa');

  r = await api('PUT', '/api/me', { data: { xp: 50, done: { m1: 1 } }, xp: 50 }, A.token); ok(r.ok, 'sincronizare profil');
  r = await api('GET', '/api/me', null, A.token); ok(r.data.done.m1 === 1, 'profil citit înapoi');
  r = await api('POST', '/api/ai', { messages: [{ r: 'u', t: 'salut' }] }); ok(r.s === 503, 'AI fără cheie → 503 (clientul face fallback local)');

  // duel online (polling)
  const poll = async (t) => (await api('GET', '/api/h2h/poll', null, t));
  r = await api('POST', '/api/h2h/room', { subject: 'info' }, A.token); ok(r.code, 'cameră creată ' + r.code);
  const code = r.code;
  r = await poll(A.token); ok(r.state === 'room' && r.code === code, 'gazda vede camera în poll');
  r = await api('POST', '/api/h2h/join', { code }, B.token); ok(r.status === 'matched', 'Bob intră în cameră');
  r = await poll(A.token); ok(r.state === 'match' && r.view.phase === 'lobby' && r.view.you === 0, 'Ana vede meciul (lobby)');
  await sleep(3800);
  r = await poll(A.token); const v = r.view;
  ok(v.phase === 'ask' && v.q.o.length === 4 && v.q.a === undefined && v.left > 10, 'runda 1 pornește, fără răspuns corect în payload');
  const rb = await poll(B.token); ok(rb.view.you === 1 && rb.view.names[1] === 'Bob', 'indici de jucător corecți');
  r = await api('POST', '/api/h2h/answer', { match: v.id, i: 0, idx: 0 }, A.token); ok(r.ok, 'Ana răspunde');
  r = await api('POST', '/api/h2h/answer', { match: v.id, i: 0, idx: 2 }, A.token); ok(!r.ok, 'al doilea răspuns ignorat');
  r = await poll(B.token); ok(r.view.oppDone === true && r.view.phase === 'ask', 'Bob vede că adversarul a răspuns');
  r = await api('POST', '/api/h2h/answer', { match: v.id, i: 0, idx: 1 }, B.token); ok(r.ok && r.view.phase === 'reveal', 'după ambele răspunsuri → reveal imediat');
  const rev = r.view.rev;
  ok(rev.picks[0] === 0 && rev.picks[1] === 1 && typeof rev.correct === 'number', 'reveal cu alegerile ambilor jucători');
  const pts = rev.gain[0] + rev.gain[1]; ok(pts === 0 || (pts >= 100 && pts <= 150), 'punctaj în interval: ' + JSON.stringify(rev.gain));
  await sleep(5400);
  r = await poll(A.token); ok(r.view.phase === 'ask' && r.view.i === 1, 'runda 2 pornește automat după reveal');
  r = await api('POST', '/api/h2h/leave', {}, B.token);
  r = await poll(A.token); ok(r.view.phase === 'done' && r.view.end.reason === 'forfeit' && r.view.end.winner === 0, 'abandon → victorie pentru Ana');
  r = await api('POST', '/api/h2h/room', { subject: 'mix' }, A.token); ok(r.code, 'după un meci terminat se poate crea altă cameră (fără ack)');
  await api('POST', '/api/h2h/ack', {}, A.token); await api('POST', '/api/h2h/ack', {}, B.token);
  r = await poll(B.token); ok(r.state === 'idle', 'după ack, Bob e liber');
  r = await api('GET', '/api/leaderboard'); ok(r.rows.some(x => x.display === 'Ana' && x.wins === 1), 'clasament global cu victorii');

  // meci rapid
  r = await api('POST', '/api/h2h/queue', { subject: 'mate' }, A.token); ok(r.status === 'waiting', 'Ana în coadă');
  r = await poll(A.token); ok(r.state === 'queue', 'Ana vede coada în poll');
  r = await api('POST', '/api/h2h/queue', { subject: 'mate' }, B.token); ok(r.status === 'matched', 'Bob e împerecheat cu Ana');
  r = await poll(B.token); ok(r.state === 'match' && r.view.subject === 'mate', 'Bob vede meciul rapid');
  // timp expirat: nimeni nu răspunde — întrebarea trece singură
  await sleep(3500 + 15600);
  r = await poll(A.token); ok(r.view.phase === 'reveal' && r.view.rev.picks[0] === null, 'timeout: reveal fără răspunsuri');
  console.log(fails ? `\n${fails} teste eșuate` : '\nToate testele au trecut'); process.exit(fails ? 1 : 0);
})();
