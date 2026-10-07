/* AI-ul tutor: Gemini cu (1) fapte calculate exact de server, (2) execuție de cod, (3) gândire extinsă,
   (4) prompt cu structură de răspuns, (5) a doua trecere de verificare. Cheia rămâne pe server. */
'use strict';
const { LESSONS } = require('../public/js/lessons.js');
const { facts } = require('./mathtools.js');

const cfg = () => ({
  key: process.env.GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  think: process.env.GEMINI_THINKING === undefined || process.env.GEMINI_THINKING === '' ? -1 : parseInt(process.env.GEMINI_THINKING, 10),   // -1 = dinamic
  verify: (process.env.AI_VERIFY || 'on').toLowerCase() !== 'off'
});
class AIError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const fail = (c, m) => { throw new AIError(c, m); };

const SYSTEM = [
  'Ești tutorul MathInfo 9 pentru elevi de clasa a IX-a (Liceul Teoretic „Emil Racoviță” Vaslui), la Matematică (mulțimi, logică, numere reale, șiruri și progresii, funcții, funcția de gradul I și II, vectori, trigonometrie) și Informatică (C++, algoritmi, vectori, sortări). Răspunzi în limba română (cu diacritice), clar, prietenos și riguros.',
  'PRECIZIE (obligatoriu):',
  '1. Orice calcul numeric, ecuație, sumă, valoare sau rezultat de program se verifică prin execuție de cod (instrumentul de cod). Dacă primești „REZULTATE VERIFICATE”, folosește exact acele valori și explică de unde vin. Nu calcula „din cap” ceea ce se poate verifica.',
  '2. Înainte de răspunsul final: înlocuiește soluția în enunț sau refă calculul pe altă cale. Dacă nu se potrivește, reia rezolvarea.',
  '3. Folosește doar notațiile și metodele clasei a IX-a (și ale lecției date). Fără derivate, integrale, matrice sau teoreme din clasele mai mari; dacă există o metodă mai simplă, preferă-o.',
  '4. Nu inventa. Dacă enunțul e ambiguu sau lipsesc date, spune ce lipsește și cere clarificarea (sau tratează pe cazuri). Dacă nu ești sigur de un fapt, spune-o clar.',
  '5. Codul C++ trebuie să fie complet și corect (#include, using namespace std, main), atent la împărțirea întreagă, depășiri și indici de la 0, și urmărit pe un exemplu.',
  'STRUCTURA RĂSPUNSULUI (adaptează după întrebare):',
  '- Problemă de calcul sau demonstrație: **Date și ce se cere** → **Idee / metodă** (de ce funcționează) → **Rezolvare pas cu pas** (fiecare transformare scrisă) → **Verificare** → **Răspuns final** (cu bold) → **De reținut** (greșeli frecvente).',
  '- Întrebare teoretică: definiția exactă → explicație intuitivă → exemplu rezolvat → contraexemplu sau greșeli frecvente → rezumat în 2 rânduri.',
  '- Programare: ideea algoritmului în cuvinte → cod complet → urmărire pe un exemplu (tabel cu valorile variabilelor) → complexitate → variante sau optimizări.',
  'Răspunsul trebuie să fie complet și aprofundat, dar fără umplutură. La final propune un mic exercițiu similar sau o întrebare de verificare (fără rezolvare), ca elevul să se verifice singur.',
  'FORMAT: **bold**, `cod`, liste, blocuri ``` pentru cod; formule cu simboluri Unicode (x², √, ≤, ∈, Δ) — nu LaTeX.',
  'Dacă întrebarea nu ține de aceste materii, redirecționează politicos.'
].join('\n');

const VERIFIER = [
  'Ești un corector riguros de Matematică și Informatică pentru clasa a IX-a. Primești o întrebare a unui elev și un răspuns-draft al unui tutor.',
  'Sarcina ta: (1) rezolvă tu independent problema, folosind execuția de cod pentru orice calcul numeric; (2) caută în draft erori de calcul, de raționament, de notație, formule greșite, metode din afara programei clasei a IX-a, cod C++ greșit sau incomplet, afirmații false; (3) decide.',
  'Răspunde STRICT în acest format:',
  '- prima linie `VERDICT: OK` dacă draftul este corect, complet și potrivit clasei a IX-a (nu scrie nimic altceva);',
  '- altfel prima linie `VERDICT: FIX`, iar pe liniile următoare răspunsul COMPLET corectat, în același stil și cu aceeași structură (date, metodă, pași, verificare, răspuns final, de reținut, exercițiu), fără nicio mențiune că este o corectură.'
].join('\n');

const noTicks = s => s.replace(/`/g, '');
function lessonText(l) {
  return `Lecția „${l.title}” (${l.s === 'mate' ? 'Matematică' : 'Informatică'}):\n` + l.body.map(([t, c]) => t === 'ul' ? c.map(x => '- ' + noTicks(x)).join('\n') : t === 'code' ? '```\n' + c + '\n```' : noTicks(c)).join('\n');
}
const fold = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const STOP = new Set(['care', 'este', 'sunt', 'cum', 'cat', 'unde', 'pentru', 'dintre', 'despre', 'explica', 'imi', 'poti', 'vreau', 'fac', 'face', 'cand', 'din', 'unui', 'unei', 'sau', 'dar', 'mai', 'foarte', 'exemplu', 'what', 'how', 'the', 'and', 'with', 'explain', 'about']);
/** Alege 1–2 lecții relevante pentru întrebare (potrivire pe cuvinte-cheie), ca sursă pentru AI. */
function relevantLessons(text) {
  const words = [...new Set(fold(text).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !STOP.has(w)).map(w => w.slice(0, 6)))];   // rădăcină: „ecuație” ~ „ecuația”
  if (!words.length) return [];
  return LESSONS.map(l => {
    const hay = fold(l.title + ' ' + l.blurb + ' ' + lessonText(l)), title = fold(l.title);
    return { l, score: words.reduce((sc, w) => sc + (hay.includes(w) ? (title.includes(w) ? 3 : 1) : 0), 0) };
  }).filter(x => x.score >= 3).sort((a, b) => b.score - a.score).slice(0, 2).map(x => x.l);
}

/** Un apel Gemini. Încearcă cu instrumente + gândire; dacă modelul le refuză (400), reia simplu. */
async function call({ contents, system, json = false, tools = true, timeout = 40000, maxTokens = 8192, temperature = 0.1 }) {
  const c = cfg();
  if (!c.key) fail(503, 'AI indisponibil: serverul nu are cheie Gemini configurată');
  let lastErr = 'eroare necunoscută';
  for (const extras of [true, false]) {
    const body = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature, maxOutputTokens: maxTokens } };
    if (json) body.generationConfig.responseMimeType = 'application/json';
    if (extras) {
      if (tools && !json) body.tools = [{ codeExecution: {} }];
      body.generationConfig.thinkingConfig = { thinkingBudget: c.think };
    }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': c.key }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout)
    });
    if (!r.ok) {
      try { lastErr = (await r.json()).error.message; } catch (e) { lastErr = 'eroare ' + r.status; }
      if (r.status === 400 && extras) continue;      // modelul nu acceptă instrumentele/gândirea → reîncerc simplu
      fail(502, 'Gemini: ' + lastErr);
    }
    const d = await r.json();
    const parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    const text = (parts || []).filter(p => typeof p.text === 'string' && p.thought !== true).map(p => p.text).join('').trim();
    if (!text) fail(502, 'Gemini a returnat un răspuns gol');
    return text;
  }
  fail(502, 'Gemini: ' + lastErr);
}

function parseVerdict(t) {
  const m = /^\s*(?:```[a-z]*\s*)?(?:\*\*)?VERDICT\s*:?\s*(OK|FIX)(?:\*\*)?[ \t]*\n?([\s\S]*)$/i.exec(t);
  if (!m) return null;
  const rest = m[2].replace(/```\s*$/, '').trim();
  return { ok: m[1].toUpperCase() === 'OK', rest };
}

/** Răspunde la întrebarea elevului. Returnează { text, src: 'verified' | 'corrected' | 'draft' }. */
async function ask({ messages, lessonId, lang }) {
  const t0 = Date.now(), c = cfg();
  const last = messages[messages.length - 1].parts[0].text;
  const chosen = LESSONS.find(l => l.id === lessonId);
  const refs = chosen ? [chosen] : relevantLessons(last);
  const f = facts(last);
  const en = lang === 'en';
  const system = SYSTEM
    + (en ? '\n\nThe student chose English: write your whole answer in English (keep standard terminology; the lessons below are in Romanian — translate what you use).' : '')
    + (refs.length ? '\n\n' + (chosen ? 'Elevul studiază acum această lecție; folosește-o ca referință principală și leag-o de întrebare:' : 'Lecții din programă posibil relevante (folosește-le doar dacă se potrivesc cu întrebarea):') + '\n\n' + refs.map(lessonText).join('\n\n') : '')
    + (f ? '\n\nREZULTATE VERIFICATE (calculate exact de un program; sunt corecte — folosește-le, explică-le și nu le contrazice):\n' + f : '');

  const draft = await call({ contents: messages, system, timeout: 42000 });
  const elapsed = Date.now() - t0;
  if (!c.verify || elapsed > 30000) return { text: draft, src: 'draft' };

  try {
    const ctx = messages.slice(-5, -1).map(m => (m.role === 'user' ? 'Elev: ' : 'Tutor: ') + m.parts[0].text.slice(0, 600)).join('\n');
    const prompt = `${ctx ? 'CONTEXT (mesaje anterioare):\n' + ctx + '\n\n' : ''}ÎNTREBAREA ELEVULUI:\n${last}\n\n${f ? 'REZULTATE VERIFICATE DE UN PROGRAM:\n' + f + '\n\n' : ''}RĂSPUNS-DRAFT DE VERIFICAT:\n${draft}\n\n${en ? 'Language of the final answer: English.' : 'Limba răspunsului: română.'}`;
    const v = await call({ contents: [{ role: 'user', parts: [{ text: prompt }] }], system: VERIFIER, timeout: Math.max(9000, 57000 - (Date.now() - t0)), maxTokens: 8192 });
    const verdict = parseVerdict(v);
    if (verdict && verdict.ok) return { text: draft, src: 'verified' };
    if (verdict && !verdict.ok && verdict.rest.length > 60) return { text: verdict.rest, src: 'corrected' };
  } catch (e) { /* verificarea a eșuat: păstrăm draftul */ }
  return { text: draft, src: 'draft' };
}

/** Generează întrebări grilă (JSON), apoi le verifică independent și elimină pe cele cu cheie îndoielnică. */
async function generateQuestions({ topic, n, lessonId, lang }) {
  const lesson = LESSONS.find(l => l.id === lessonId);
  const prompt = (lang === 'en' ? 'Write all the questions, options and explanations in English. ' : '') +
    `Generează ${n} întrebări grilă (cu exact 4 variante, un singur răspuns corect, distractori plauzibili bazați pe greșeli frecvente) pentru elevi de clasa a IX-a, despre: ${topic}. ${lesson ? 'Bazează-te pe această lecție:\n' + lessonText(lesson) : ''}\nÎntrebările trebuie să fie variate ca dificultate, fără ambiguități, rezolvabile cu metode din clasa a IX-a. Returnează DOAR un array JSON de obiecte de forma {"q": "enunț", "o": ["varianta A","varianta B","varianta C","varianta D"], "a": 0, "e": "explicația rezolvării pas cu pas"}, unde "a" este indexul (0-3) variantei corecte. Rezolvă fiecare problemă înainte să o scrii și verifică atent calculele.`;
  const text = await call({ contents: [{ role: 'user', parts: [{ text: prompt }] }], system: SYSTEM, json: true, temperature: 0.4, timeout: 40000 });
  let arr; try { arr = JSON.parse(text.replace(/^```json|```$/g, '').trim()); } catch (e) { fail(502, 'AI-ul a returnat un format neașteptat. Încearcă din nou.'); }
  return Array.isArray(arr) ? arr.slice(0, n) : arr;
}
async function verifyQuestions(qs, lang) {
  const list = qs.map((q, i) => `${i + 1}. ${q.q}\n` + q.o.map((o, j) => `   ${'ABCDEF'[j]}) ${o}`).join('\n')).join('\n\n');
  const prompt = `Rezolvă INDEPENDENT fiecare întrebare de mai jos (folosește execuția de cod pentru calcule). Pentru fiecare, spune care variantă este corectă și dacă există EXACT o variantă corectă și enunțul este lipsit de ambiguitate.\n\n${list}\n\nRăspunde DOAR cu un array JSON: [{"i":1,"answer":"B","single":true}, ...]`;
  try {
    const t = await call({ contents: [{ role: 'user', parts: [{ text: prompt }] }], system: VERIFIER.split('\n')[0] + ' Răspunzi doar cu JSON.', timeout: 40000 });
    const m = /\[[\s\S]*\]/.exec(t); if (!m) return { questions: qs, dropped: 0, verified: false };
    const res = JSON.parse(m[0]), byI = new Map(res.map(r => [r.i, r]));
    const keep = qs.filter((q, i) => { const r = byI.get(i + 1); return !r || (('ABCDEF'.indexOf(String(r.answer).trim().toUpperCase()[0]) === q.a) && r.single !== false); });
    return { questions: keep, dropped: qs.length - keep.length, verified: true };
  } catch (e) { return { questions: qs, dropped: 0, verified: false }; }
}

module.exports = { ask, generateQuestions, verifyQuestions, enabled: () => !!cfg().key, model: () => cfg().model, AIError, _t: { parseVerdict, call, relevantLessons, SYSTEM } };
