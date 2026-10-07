/* Teste pentru tutorul local (rulează tutor.js în vm, fără browser): node server/test-tutor.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const pub = p => fs.readFileSync(path.join(__dirname, '..', 'public', 'js', p), 'utf8');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

function load(uiLang) {
  const ctx = { console, fetch: async () => { throw new Error('fără rețea'); }, AbortSignal };
  ctx.I18N = { lang: uiLang, tx: x => x, t: (ro, en) => uiLang === 'en' ? en : ro };
  ctx.API = { st: { token: '' } };
  vm.createContext(ctx);
  vm.runInContext(pub('data.js') + '\n' + pub('lessons.js') + '\n' + pub('i18n-lessons.js') + '\n' + pub('i18n-questions.js') + '\n' + pub('tutor.js') + '\n;this.Tutor = Tutor; this.KB = KB; this.KB_EN = KB_EN; this.LESSONS = LESSONS;', ctx);
  return ctx;
}
const ro = load('ro'), en = load('en');
const ask = async (ctx, q) => (await ctx.Tutor.reply([{ r: 'u', t: q }], {}, {})).text;

(async () => {
  ok(ro.KB.length === ro.KB_EN.length, `KB și KB_EN au aceeași lungime (${ro.KB.length})`);

  // --- funcția de gradul II
  let t = await ask(ro, 'Vârful parabolei f(x) = x² − 4x + 3');
  ok(/V\(2, −1\)/.test(t) && /x₁ = 1/.test(t) && /x₂ = 3/.test(t) && /\[−1, ∞\)/.test(t) && /Minim −1/.test(t), 'analiză f(x)=x²−4x+3: vârf, rădăcini, minim, imagine');
  t = await ask(ro, 'f(x) = 2x - 3. Cât este f(4)?');
  ok(/f\(4\) = 5/.test(t) && /crescătoare/.test(t), 'f(x)=2x−3: f(4)=5 și monotonie');
  t = await ask(en, 'Find the vertex of f(x) = -x^2 + 2x + 3');
  ok(/V\(1, 4\)/.test(t) && /Maximum 4/.test(t) && /opens downward/.test(t), 'EN: f(x)=−x²+2x+3 → vârf (1,4), maxim 4');

  // --- inecuații
  t = await ask(ro, 'x^2 - 5x + 6 < 0'); ok(/x ∈ \(2, 3\)/.test(t), 'inecuație x²−5x+6<0 → (2, 3)');
  t = await ask(ro, 'x^2 - 5x + 6 >= 0'); ok(/\(−∞, 2\] ∪ \[3, ∞\)/.test(t), 'inecuație ≥ 0 → (−∞,2] ∪ [3,∞)');
  t = await ask(ro, '-2x + 6 > 0'); ok(/x ∈ \(−∞, 3\)/.test(t) && /inversez/.test(t), 'inecuație liniară cu inversarea sensului');
  t = await ask(ro, 'x^2 + 1 > 0'); ok(/x ∈ ℝ/.test(t), 'x²+1>0 → ℝ');
  t = await ask(ro, 'x^2 + 1 < 0'); ok(/x ∈ ∅/.test(t), 'x²+1<0 → ∅');
  t = await ask(en, '2x - 1 < 5'); ok(/x ∈ \(−∞, 3\)/.test(t), 'EN: 2x−1<5 → (−∞, 3)');
  t = await ask(ro, 'x^2 - 4x + 4 <= 0'); ok(/x ∈ \{2\}/.test(t), 'rădăcină dublă, ≤ 0 → {2}');

  // --- progresii
  t = await ask(ro, 'Progresie aritmetică a1 = 3, r = 5, n = 10');
  ok(/a10 = 3 \+ 9·5 = \*\*48\*\*/.test(t) && /\*\*255\*\*/.test(t), 'progresie aritmetică: a10=48, S10=255');
  t = await ask(ro, 'progresie geometrică b1 = 2, q = 3, primii 4 termeni');
  ok(/\*\*54\*\*/.test(t) && /\*\*80\*\*/.test(t), 'progresie geometrică: b4=54, S4=80');
  t = await ask(en, 'arithmetic progression a1 = 2, r = 3, n = 5');
  ok(/a5 = 2 \+ 4·3 = \*\*14\*\*/.test(t) && /\*\*40\*\*/.test(t) && /Arithmetic/.test(t), 'EN: a5=14, S5=40');

  // --- trigonometrie
  t = await ask(ro, 'sin 150°'); ok(/sin 150° = \*\*1\/2\*\*|\*\*sin 150° = 1\/2\*\*/.test(t) && /180° − 30°/.test(t), 'sin 150° = 1/2 cu reducere');
  t = await ask(ro, 'cos 120°'); ok(/−1\/2/.test(t), 'cos 120° = −1/2');
  t = await ask(ro, 'tg 45'); ok(/\*\*tg 45° = 1\*\*/.test(t), 'tg 45° = 1');
  t = await ask(en, 'what is sin 210'); ok(/−1\/2/.test(t) && /quadrant III/.test(t), 'EN: sin 210° = −1/2');
  t = await ask(ro, 'tg 90'); ok(/nu este definit/.test(t), 'tg 90° nedefinit');

  // --- vechile solvere rămân corecte
  t = await ask(ro, 'x^2 - 5x + 6 = 0'); ok(/\*\*2\*\*/.test(t) && /\*\*3\*\*/.test(t), 'ecuația x²−5x+6=0 încă funcționează');
  t = await ask(ro, 'cmmdc 48 36'); ok(/cmmdc = 12/.test(t), 'cmmdc încă funcționează');
  t = await ask(ro, '(3 + 4) * 2^3 - sqrt(49)'); ok(/= 49/.test(t), 'expresii încă funcționează');

  // --- limba întrebării
  t = await ask(ro, 'what is a prime number'); ok(/A prime number|prime number/i.test(t) && !/Număr prim/.test(t), 'întrebare în engleză pe interfață română → răspuns în engleză');
  t = await ask(en, 'Care este discriminantul?'); ok(/Ecuația de gradul II|Δ/.test(t) && /Calculezi/.test(t), 'întrebare în română pe interfață engleză → răspuns în română');

  // --- noile intrări din baza de cunoștințe
  const kbQ = [['Ce este o progresie aritmetică?', /rația|rație/i], ['Explică teorema cosinusului', /a² = b² \+ c²/], ['Ce este injectivitatea?', /injectiv/i], ['Cum funcționează switch?', /break/], ['Ce este un cuantificator?', /∀/], ['Ce înseamnă sinus, cosinus și tangentă?', /cateta/i]];
  for (const [q, re] of kbQ) { t = await ask(ro, q); ok(re.test(t) && t.length > 220, `KB: „${q}” → răspuns explicit (${t.length} caractere)`); }
  // fiecare intrare KB are exemplu sau pași (răspuns suficient de consistent)
  const short = ro.KB.map((k, i) => [i, k.a.length]).filter(([i, n]) => n < 260);
  ok(short.length === 0, `toate răspunsurile KB au cel puțin 260 de caractere${short.length ? ' (scurte: ' + short.map(x => x[0]).join(',') + ')' : ''}`);
  const shortEn = ro.KB_EN.map((k, i) => [i, k.a.length]).filter(([i, n]) => n < 260);
  ok(shortEn.length === 0, 'la fel pentru engleză');

  console.log(fails ? `\n${fails} teste eșuate` : '\nToate testele tutorului au trecut'); process.exit(fails ? 1 : 0);
})();
