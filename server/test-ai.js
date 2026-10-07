/* Teste pentru AI fără rețea: node server/test-ai.js  (Gemini este simulat cu un fetch fals) */
process.env.GEMINI_API_KEY = 'test-key';
const ai = require('../lib/ai.js');
const { facts } = require('../lib/mathtools.js');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

// ---- calculator exact
const f1 = facts('Rezolvă x^2 - 5x + 6 = 0');
ok(/x₁ = 2/.test(f1) && /x₂ = 3/.test(f1) && /Δ = 1/.test(f1), 'facts: ecuația de gradul II');
ok(/cmmdc\(48, 36\) = 12/.test(facts('cat este cmmdc 48 36?')) && /cmmmc\(48, 36\) = 144/.test(facts('cmmdc 48 36')), 'facts: cmmdc/cmmmc');
ok(/= 49/.test(facts('calculeaza (3 + 4) * 2^3 - sqrt(49)')), 'facts: expresie');
ok(/ESTE număr prim/.test(facts('Este 97 număr prim?')) && /NU este număr prim/.test(facts('este 91 prim?')), 'facts: numere prime');
ok(/11001/.test(facts('convertește 25 în binar')), 'facts: baza 2');
ok(/5/.test(facts('distanța dintre A(0,0) și B(3,4)')), 'facts: distanța');
ok(facts('Explică-mi ce este o funcție') === '', 'facts: nimic de calculat → gol');
ok(/fără soluții|nu are rădăcini/.test(facts('x^2 + 2x + 5 = 0')), 'facts: Δ<0');

// ---- fetch simulat
let calls = [], urls = [], script = [];
global.fetch = async (url, opts) => {
  const body = JSON.parse(opts.body); calls.push(body); urls.push(url);
  const next = script.shift();
  if (!next) throw new Error('apel neașteptat');
  if (next.status) return { ok: false, status: next.status, json: async () => ({ error: { message: next.msg || 'x' } }) };
  if (next.throw) throw new Error(next.throw);
  return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: next.parts || [{ text: next.text }] } }] }) };
};
const msgs = t => [{ role: 'user', parts: [{ text: t }] }];
const DRAFT = '**Date și ce se cere** ... Răspuns final: x ∈ {2, 3}';

(async () => {
  // 1) draft + verificare OK
  calls = []; script = [{ text: DRAFT }, { text: 'VERDICT: OK' }];
  let r = await ai.ask({ messages: msgs('x^2 - 5x + 6 = 0'), lang: 'ro' });
  ok(r.src === 'verified' && r.text === DRAFT, 'verificare OK → src verified, textul rămâne');
  ok(calls.length === 2, 'două apeluri (draft + verificare)');
  ok(calls[0].tools && calls[0].tools[0].codeExecution && calls[0].generationConfig.thinkingConfig, 'primul apel are execuție de cod + gândire');
  ok(/REZULTATE VERIFICATE/.test(calls[0].systemInstruction.parts[0].text) && /x₁ = 2/.test(calls[0].systemInstruction.parts[0].text), 'faptele calculate sunt în prompt');
  ok(calls[0].generationConfig.temperature <= 0.2, 'temperatură mică');
  ok(/DRAFT DE VERIFICAT/.test(calls[1].contents[0].parts[0].text) && /VERDICT/.test(calls[1].systemInstruction.parts[0].text), 'al doilea apel conține draftul și cere verdict');

  // 2) verificare FIX
  calls = []; const FIXED = '**Date și ce se cere** versiunea corectată, destul de lungă ca să fie acceptată de filtrul de lungime minimă. Răspuns final: x ∈ {2, 3}';
  script = [{ text: 'răspuns greșit x = 5' }, { text: 'VERDICT: FIX\n' + FIXED }];
  r = await ai.ask({ messages: msgs('rezolvă ceva'), lang: 'ro' });
  ok(r.src === 'corrected' && r.text === FIXED, 'verificare FIX → text corectat');

  // 3) verificarea cade → rămâne draftul
  script = [{ text: DRAFT }, { throw: 'rețea' }];
  r = await ai.ask({ messages: msgs('întrebare'), lang: 'ro' });
  ok(r.src === 'draft' && r.text === DRAFT, 'eșec la verificare → păstrează draftul');

  // 4) verdict neparsabil → draft
  script = [{ text: DRAFT }, { text: 'Cred că e bine.' }];
  r = await ai.ask({ messages: msgs('întrebare'), lang: 'ro' });
  ok(r.src === 'draft', 'verdict neparsabil → draft');

  // 5) modelul refuză instrumentele (400) → reîncercare simplă
  calls = []; script = [{ status: 400, msg: 'tools not supported' }, { text: DRAFT }, { status: 400 }, { text: 'VERDICT: OK' }];
  r = await ai.ask({ messages: msgs('întrebare'), lang: 'ro' });
  ok(r.text === DRAFT && !calls[1].tools && !calls[1].generationConfig.thinkingConfig, 'la 400 reîncearcă fără instrumente');

  // 6) cod de execuție + gânduri: se păstrează doar textul final
  script = [{ parts: [{ text: 'gândesc…', thought: true }, { executableCode: { code: '1+1' } }, { codeExecutionResult: { output: '2' } }, { text: 'Rezultat: 2' }] }, { text: 'VERDICT: OK' }];
  r = await ai.ask({ messages: msgs('1+1'), lang: 'ro' });
  ok(r.text === 'Rezultat: 2', 'se ignoră gândurile și codul, rămâne textul final');

  // 7) engleză + lecție aleasă
  calls = []; script = [{ text: 'Answer' }, { text: 'VERDICT: OK' }];
  await ai.ask({ messages: msgs('explain the discriminant'), lessonId: 'm7', lang: 'en' });
  ok(/English/.test(calls[0].systemInstruction.parts[0].text) && /Lecția „The quadratic|Lecția „Funcția și ecuația de gradul II/.test(calls[0].systemInstruction.parts[0].text), 'engleză + lecția aleasă în prompt');

  // 8) lecții relevante automat
  const rel = ai._t.relevantLessons('Cum rezolv o ecuație cu discriminant?');
  ok(rel.length > 0 && rel[0].id === 'm7', 'lecția potrivită este găsită automat (m7)');

  // 9) AI oprit
  AIKEY: { const k = process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY = ''; let err; try { await ai.ask({ messages: msgs('x'), lang: 'ro' }); } catch (e) { err = e; } process.env.GEMINI_API_KEY = k; ok(err && err.code === 503, 'fără cheie → 503'); }

  // 9b) model supraîncărcat (503 de două ori) → trece pe modelul de rezervă
  calls = []; urls = []; script = [{ status: 503, msg: 'high demand' }, { status: 503, msg: 'high demand' }, { text: DRAFT }, { text: 'VERDICT: OK' }];
  r = await ai.ask({ messages: msgs('întrebare'), lang: 'ro' });
  ok(r.text === DRAFT && /gemini-2\.5-flash:/.test(urls[0]) && /gemini-2\.0-flash:/.test(urls[2]), '503 repetat pe modelul principal → folosește modelul de rezervă');
  // 9c) limită depășită (429) → trece imediat pe următorul model
  urls = []; script = [{ status: 429, msg: 'quota' }, { text: DRAFT }, { text: 'VERDICT: OK' }];
  r = await ai.ask({ messages: msgs('întrebare'), lang: 'ro' });
  ok(r.text === DRAFT && urls.length === 3 && /gemini-2\.0-flash:/.test(urls[1]), '429 → următorul model fără pauză');
  // 9d) un 503 trecător se reîncearcă pe același model
  urls = []; script = [{ status: 503, msg: 'high demand' }, { text: DRAFT }, { text: 'VERDICT: OK' }];
  r = await ai.ask({ messages: msgs('întrebare'), lang: 'ro' });
  ok(r.text === DRAFT && /gemini-2\.5-flash:/.test(urls[1]), '503 trecător → reîncercare pe același model');
  // 9e) cheie respinsă (403) → eroare clară, fără a încerca alte modele
  urls = []; script = [{ status: 403, msg: 'API key invalid' }];
  { let err; try { await ai.ask({ messages: msgs('x'), lang: 'ro' }); } catch (e) { err = e; } ok(err && err.code === 502 && /API key invalid/.test(err.message) && urls.length === 1, '403 → eroare imediată'); }
  // 9f) toate modelele eșuează → eroare cu motivul
  script = []; for (let i = 0; i < 12; i++) script.push({ status: 503, msg: 'high demand' });
  { let err; try { await ai.ask({ messages: msgs('x'), lang: 'ro' }); } catch (e) { err = e; } ok(err && /high demand/.test(err.message), 'toate modelele supraîncărcate → eroare cu motivul'); }

  // 9g) nivelul de detaliu ajunge în prompt și în limita de tokeni
  calls = []; script = [{ text: DRAFT }, { text: 'VERDICT: OK' }];
  await ai.ask({ messages: msgs('explică funcția de gradul II'), lang: 'ro', depth: 'deep' });
  ok(/APROFUNDAT/.test(calls[0].systemInstruction.parts[0].text) && calls[0].generationConfig.maxOutputTokens === 12000 && /APROFUNDAT/.test(calls[1].contents[0].parts[0].text), 'depth=deep: prompt aprofundat, 12000 tokeni, verificatorul păstrează nivelul');
  calls = []; script = [{ text: DRAFT }, { text: 'VERDICT: OK' }];
  await ai.ask({ messages: msgs('ce e un vector?'), lang: 'ro' });
  ok(/DETALIAT/.test(calls[0].systemInstruction.parts[0].text), 'implicit: nivel detaliat');
  calls = []; script = [{ text: DRAFT }, { text: 'VERDICT: OK' }];
  await ai.ask({ messages: msgs('ce e un vector?'), lang: 'ro', depth: 'short' });
  ok(/SCURT/.test(calls[0].systemInstruction.parts[0].text) && calls[0].generationConfig.maxOutputTokens === 2048, 'depth=short: răspuns scurt');
  calls = []; script = [{ text: DRAFT }, { text: 'VERDICT: OK' }];
  await ai.ask({ messages: msgs('x'), lang: 'ro', depth: 'ceva-necunoscut' });
  ok(/DETALIAT/.test(calls[0].systemInstruction.parts[0].text), 'nivel necunoscut → detaliat');

  // 10) verificarea întrebărilor generate
  const qs = [
    { q: '2+2?', o: ['3', '4', '5', '6'], a: 1, e: '' },
    { q: '3·3?', o: ['6', '9', '8', '7'], a: 1, e: '' },   // cheia e bună
    { q: 'ceva?', o: ['a', 'b', 'c', 'd'], a: 0, e: '' }    // verificatorul nu e de acord
  ];
  script = [{ text: '[{"i":1,"answer":"B","single":true},{"i":2,"answer":"B","single":true},{"i":3,"answer":"C","single":true}]' }];
  let v = await ai.verifyQuestions(qs, 'ro');
  ok(v.verified && v.dropped === 1 && v.questions.length === 2, 'verifyQuestions elimină întrebarea cu cheie contestată');
  script = [{ text: '[{"i":1,"answer":"B","single":false}]' }];
  v = await ai.verifyQuestions([qs[0]], 'ro');
  ok(v.dropped === 1, 'verifyQuestions elimină întrebările ambigue (single:false)');
  script = [{ throw: 'rețea' }];
  v = await ai.verifyQuestions(qs, 'ro');
  ok(!v.verified && v.questions.length === 3, 'verificare indisponibilă → păstrează întrebările, marcate neverificate');

  console.log(fails ? `\n${fails} teste eșuate` : '\nToate testele AI au trecut'); process.exit(fails ? 1 : 0);
})();
