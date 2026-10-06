/* Adversar de test pentru dueluri online:  node server/bot.js COD_CAMERĂ [http://localhost:3000]
   Se înregistrează ca „Bot”, intră în cameră și răspunde la întâmplare, după 2-6 secunde. */
const code = (process.argv[2] || '').toUpperCase(), BASE = process.argv[3] || 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let token = '';
const call = async (method, u, b) => (await fetch(BASE + u, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: method === 'GET' ? undefined : JSON.stringify(b || {}) })).json();
(async () => {
  const name = 'bot' + Math.random().toString(36).slice(2, 7);
  token = (await call('POST', '/api/register', { username: name, password: 'botbot123', display: 'Bot ' + name.slice(3, 5).toUpperCase() })).token;
  console.log('join:', JSON.stringify(await call('POST', '/api/h2h/join', { code })));
  let answered = -1, delay = 0, since = 0;
  for (;;) {
    const r = await call('GET', '/api/h2h/poll'), v = r.view;
    if (r.state !== 'match') { await sleep(1000); continue; }
    if (v.phase === 'done') { console.log('final', v.end.sc, v.end.reason); await call('POST', '/api/h2h/ack'); return; }
    if (v.phase === 'ask' && v.i !== answered && v.picked === null) {
      if (since !== v.i) { since = v.i; delay = Date.now() + 2000 + Math.random() * 4000; }
      if (Date.now() >= delay) { await call('POST', '/api/h2h/answer', { match: v.id, i: v.i, idx: Math.floor(Math.random() * 4) }); answered = v.i; }
    }
    await sleep(700);
  }
})();
