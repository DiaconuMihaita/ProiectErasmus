/* Test: /api/ai/stream trimite întâi draftul, apoi verdictul (Gemini simulat). node server/test-stream.js */
process.env.GEMINI_API_KEY = 'test-key'; process.env.AI_VERIFY = 'always'; process.env.DB_URL = 'file:data/stream-test.db';
const http = require('http');
const core = require('../lib/core.js');
const realFetch = global.fetch;
let script = [];
global.fetch = async (url, opts) => {
  if (!String(url).includes('generativelanguage')) return realFetch(url, opts);
  const next = script.shift(); if (!next) throw new Error('apel neașteptat');
  if (next.delay) await new Promise(r => setTimeout(r, next.delay));
  return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: next.text }] } }] }) };
};
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

const server = http.createServer((req, res) => core.handle(req, res)).listen(0, async () => {
  const base = 'http://localhost:' + server.address().port;
  async function stream(body) {
    const r = await realFetch(base + '/api/ai/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const events = [], t0 = Date.now(); let draftAt = null, finalAt = null;
    if (!r.ok) return { status: r.status, json: await r.json() };
    const dec = new TextDecoder(); let buf = '';
    for await (const ch of r.body) {
      buf += dec.decode(ch, { stream: true }); let i;
      while ((i = buf.indexOf('\n')) >= 0) { const ln = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!ln) continue; const ev = JSON.parse(ln); events.push(ev); if (ev.type === 'draft') draftAt = Date.now() - t0; if (ev.type === 'final') finalAt = Date.now() - t0; }
    }
    return { status: r.status, ct: r.headers.get('content-type'), events, draftAt, finalAt };
  }
  const msg = t => [{ r: 'u', t }];
  try {
    // draft rapid, verificarea lentă (400 ms): draftul trebuie să ajungă înaintea verdictului
    script = [{ text: 'DRAFT răspuns' }, { text: 'VERDICT: OK', delay: 400 }];
    let r = await stream({ messages: msg('Calculează 2+2'), lang: 'ro', depth: 'detailed' });
    ok(r.status === 200 && /ndjson/.test(r.ct), 'răspuns NDJSON');
    ok(r.events[0].type === 'draft' && r.events[0].text === 'DRAFT răspuns', 'primul eveniment: draftul');
    ok(r.events[1].type === 'final' && r.events[1].src === 'verified', 'al doilea eveniment: final verificat');
    ok(r.finalAt - r.draftAt >= 300, `draftul a sosit cu ${r.finalAt - r.draftAt} ms înaintea verdictului`);

    script = [{ text: 'DRAFT greșit' }, { text: 'VERDICT: FIX\n' + 'Răspuns corectat, suficient de lung ca să treacă de pragul minim de lungime al filtrului. '.repeat(2) }];
    r = await stream({ messages: msg('Calculează 3+3') });
    ok(r.events.map(e => e.type).join() === 'draft,final' && r.events[1].src === 'corrected' && /corectat/.test(r.events[1].text), 'FIX → final corectat');

    script = [];
    r = await stream({ messages: msg('Calculează 1+1') });
    ok(r.events.some(e => e.type === 'error'), 'eroare Gemini → eveniment error (nu cade conexiunea)');

    r = await stream({ messages: [] }); ok(r.status === 400, 'fără mesaj → 400');
    const keep = process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY = '';
    r = await stream({ messages: msg('x') }); ok(r.status === 503, 'fără cheie → 503 înainte de flux');
    process.env.GEMINI_API_KEY = keep;
  } catch (e) { console.error(e); fails++; }
  console.log(fails ? `\n${fails} teste eșuate` : '\nToate testele de flux au trecut');
  server.close();
  process.exit(fails ? 1 : 0);
});
