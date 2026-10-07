/* Tutor AI: solver local (calcule, ecuații, cmmdc, baze...) + bază de cunoștințe + AI (server sau cheie proprie).
   Bilingv: T(ro, en) alege textul după limba curentă. */

const Tutor = (() => {
  let qlang = null;                                   // limba întrebării curente (detectată), altfel limba interfeței
  const EN = () => (qlang || I18N.lang) === 'en';
  const EN_W = new Set(['what', 'whats', 'how', 'the', 'an', 'of', 'to', 'explain', 'does', 'why', 'when', 'which', 'can', 'me', 'my', 'give', 'show', 'solve', 'find', 'between', 'and', 'with', 'for', 'this', 'that', 'you', 'there', 'about', 'tell', 'number', 'numbers', 'equation', 'write', 'program', 'code', 'work', 'works', 'mean', 'means', 'difference', 'example', 'please', 'help', 'is', 'are', 'do']);
  const RO_W = new Set(['ce', 'cum', 'care', 'sunt', 'este', 'si', 'de', 'la', 'cu', 'pentru', 'explica', 'imi', 'mie', 'cat', 'cand', 'unde', 'fac', 'face', 'pot', 'poti', 'sau', 'nu', 'vreau', 'rezolva', 'arata', 'dintre', 'despre', 'numar', 'numere', 'ecuatia', 'scrie', 'program', 'cod', 'functioneaza', 'inseamna', 'diferenta', 'exemplu', 'te', 'rog', 'ajutor', 'un', 'o', 'pe', 'din', 'ai', 'am', 'mai', 'ma', 'sa']);
  /** Detectează limba întrebării (cuvinte funcționale); la egalitate se folosește limba interfeței. */
  function detectLang(t) {
    const words = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/).filter(Boolean);
    let e = 0, r = 0; for (const w of words) { if (EN_W.has(w)) e++; if (RO_W.has(w)) r++; }
    if (/[ăâîșț]/i.test(t)) r += 2;
    return e > r ? 'en' : r > e ? 'ro' : null;
  }
  const T = (ro, en) => EN() ? en : ro;
  const strip = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const fmt = (x) => {
    if (!isFinite(x)) return String(x);
    const r = Math.round(x * 1e9) / 1e9;
    return String(r).replace('.', EN() ? '.' : ',').replace('-', '−');
  };
  const par = x => x < 0 ? '(' + fmt(x) + ')' : fmt(x);
  const poly = (a, b, c) => {
    const parts = [[a, 'x²'], [b, 'x'], [c, '']].filter(([k]) => k !== 0);
    return parts.map(([k, v], i) => {
      const abs = Math.abs(k), body = (abs === 1 && v) ? v : fmt(abs) + v;
      return i === 0 ? (k < 0 ? '−' : '') + body : (k < 0 ? ' − ' : ' + ') + body;
    }).join('') + ' = 0';
  };
  const ints = s => (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const nums = s => (s.match(/-?\d+(?:[.,]\d+)?/g) || []).map(n => parseFloat(n.replace(',', '.')));

  /* ---------- parser de expresii (fără eval) ---------- */
  function evaluate(src) {
    const s = src.replace(/×|·/g, '*').replace(/÷|:/g, '/').replace(/−/g, '-').replace(/,/g, '.').replace(/√/g, 'sqrt')
      .replace(/\s+/g, '').toLowerCase();
    let i = 0;
    const peek = () => s[i];
    function expr() {
      let v = term();
      while (peek() === '+' || peek() === '-') { const o = s[i++]; const r = term(); v = o === '+' ? v + r : v - r; }
      return v;
    }
    function term() {
      let v = power();
      while (peek() === '*' || peek() === '/') {
        const o = s[i++]; const r = power();
        if (o === '/' && r === 0) throw new Error(T('Împărțire la zero', 'Division by zero'));
        v = o === '*' ? v * r : v / r;
      }
      return v;
    }
    function power() {
      const b = unary();
      if (peek() === '^') { i++; return Math.pow(b, power()); }
      return b;
    }
    function unary() {
      if (peek() === '-') { i++; return -unary(); }
      if (peek() === '+') { i++; return unary(); }
      return atom();
    }
    function atom() {
      if (peek() === '(') { i++; const v = expr(); if (peek() !== ')') throw new Error(T('Paranteză lipsă', 'Missing parenthesis')); i++; return v; }
      const f = /^(sqrt|abs)/.exec(s.slice(i));
      if (f) { i += f[0].length; const v = atom(); return f[0] === 'sqrt' ? Math.sqrt(v) : Math.abs(v); }
      const m = /^\d+(\.\d+)?/.exec(s.slice(i));
      if (!m) throw new Error(T('Expresie invalidă', 'Invalid expression'));
      i += m[0].length;
      return parseFloat(m[0]);
    }
    const v = expr();
    if (i < s.length) throw new Error(T('Expresie invalidă', 'Invalid expression'));
    return v;
  }

  /* ---------- polinoame de gradul ≤ 2 ---------- */
  function parsePoly(side) {
    const t = side.replace(/\*/g, '');
    if (!t) return null;
    const terms = t.replace(/(?!^)([+-])/g, ' $1').split(' ').filter(Boolean);
    const c = [0, 0, 0];
    for (const term of terms) {
      const m = /^([+-]?)(\d*\.?\d*)(x\^2|x)?$/.exec(term);
      if (!m || (m[2] === '' && !m[3]) || m[2] === '.') return null;
      const sign = m[1] === '-' ? -1 : 1;
      const val = sign * (m[2] === '' ? 1 : parseFloat(m[2]));
      c[m[3] === 'x^2' ? 2 : m[3] === 'x' ? 1 : 0] += val;
    }
    return c;
  }

  function solveEquation(text) {
    let t = text.toLowerCase().replace(/−/g, '-').replace(/²/g, '^2').replace(/,/g, '.').replace(/\s+/g, '');
    t = t.replace(/^(rezolva|rezolvă|calculeaza|calculează|ecuatia|ecuația|solve|equation|calculate)[:]?/, '');
    if (!/^[\dx+\-*^.=]+$/.test(t) || (t.match(/=/g) || []).length !== 1 || !t.includes('x')) return null;
    const [l, r] = t.split('=');
    const L = parsePoly(l), R = parsePoly(r);
    if (!L || !R) return null;
    const [c, b, a] = [L[0] - R[0], L[1] - R[1], L[2] - R[2]];
    const pretty = poly(a, b, c);

    if (a === 0) {
      if (b === 0) return c === 0
        ? T('**Egalitate adevărată pentru orice x.** Ecuația are o infinitate de soluții (x ∈ ℝ).', '**The equality is true for every x.** The equation has infinitely many solutions (x ∈ ℝ).')
        : T('**Ecuația nu are soluții:** ajunge la `' + fmt(c) + ' = 0`, fals.', '**The equation has no solutions:** it reduces to `' + fmt(c) + ' = 0`, which is false.');
      return T(`**Ecuație de gradul I**\n\nO aduc la forma \`${pretty}\`.\n\n\`${fmt(b)}x = ${fmt(-c)}\`\n\n**x = ${fmt(-c / b)}**`,
        `**Linear equation**\n\nI bring it to the form \`${pretty}\`.\n\n\`${fmt(b)}x = ${fmt(-c)}\`\n\n**x = ${fmt(-c / b)}**`);
    }
    const d = b * b - 4 * a * c;
    let out = T(`**Ecuație de gradul II**\n\nForma generală: \`${pretty}\`\n\n1. Coeficienți: a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}\n2. Discriminant: Δ = b² − 4ac = ${par(b)}² − 4·${par(a)}·${par(c)} = **${fmt(d)}**\n`,
      `**Quadratic equation**\n\nGeneral form: \`${pretty}\`\n\n1. Coefficients: a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}\n2. Discriminant: Δ = b² − 4ac = ${par(b)}² − 4·${par(a)}·${par(c)} = **${fmt(d)}**\n`);
    if (d > 0) {
      const sq = Math.sqrt(d), x1 = (-b - sq) / (2 * a), x2 = (-b + sq) / (2 * a);
      const exact = Number.isInteger(sq) ? fmt(sq) : '√' + fmt(d) + ' ≈ ' + fmt(sq);
      out += T(`3. Δ > 0 → două rădăcini reale distincte, \`√Δ = ${exact}\`\n4. x₁ = (−b − √Δ)/2a = **${fmt(Math.min(x1, x2))}**, x₂ = (−b + √Δ)/2a = **${fmt(Math.max(x1, x2))}**\n\nVerificare Viète: x₁ + x₂ = ${fmt(x1 + x2)} = −b/a ✓, x₁·x₂ = ${fmt(x1 * x2)} = c/a ✓`,
        `3. Δ > 0 → two distinct real roots, \`√Δ = ${exact}\`\n4. x₁ = (−b − √Δ)/2a = **${fmt(Math.min(x1, x2))}**, x₂ = (−b + √Δ)/2a = **${fmt(Math.max(x1, x2))}**\n\nViète check: x₁ + x₂ = ${fmt(x1 + x2)} = −b/a ✓, x₁·x₂ = ${fmt(x1 * x2)} = c/a ✓`);
    } else if (d === 0) {
      out += T(`3. Δ = 0 → o rădăcină dublă\n4. **x₁ = x₂ = ${fmt(-b / (2 * a))}**`, `3. Δ = 0 → one double root\n4. **x₁ = x₂ = ${fmt(-b / (2 * a))}**`);
    } else {
      out += T('3. Δ < 0 → **nu există rădăcini reale** (soluții doar în ℂ, la clasa a X-a).', '3. Δ < 0 → **there are no real roots** (solutions exist only in ℂ, covered in 10th grade).');
    }
    out += T(`\n\nVârful parabolei: V(${fmt(-b / (2 * a))}, ${fmt(-d / (4 * a))})`, `\n\nVertex of the parabola: V(${fmt(-b / (2 * a))}, ${fmt(-d / (4 * a))})`);
    return out;
  }

  /* ---------- aritmetică pe numere naturale ---------- */
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };

  function euclid(a, b) {
    let out = T(`**cmmdc(${a}, ${b}) prin algoritmul lui Euclid**\n\n`, `**gcd(${a}, ${b}) by Euclid's algorithm**\n\n`);
    let x = a, y = b;
    while (y) { out += `\`${x} = ${Math.floor(x / y)}·${y} + ${x % y}\`\n`; [x, y] = [y, x % y]; }
    out += T(`\nUltimul rest nenul este **${x}**, deci cmmdc = ${x}.\ncmmmc = (${a}·${b}) / ${x} = **${(a * b) / x}**`, `\nThe last non-zero remainder is **${x}**, so gcd = ${x}.\nlcm = (${a}·${b}) / ${x} = **${(a * b) / x}**`);
    return out;
  }

  function primeInfo(n) {
    if (n < 2) return T(`**${n} nu este prim** (numerele prime sunt ≥ 2).`, `**${n} is not prime** (prime numbers are ≥ 2).`);
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return T(
      `**${n} nu este prim.** Cel mai mic divizor propriu este ${d}: ${n} = ${d} · ${n / d}.\n\nAm testat divizori până la √${n} ≈ ${fmt(Math.sqrt(n))}.`,
      `**${n} is not prime.** The smallest proper divisor is ${d}: ${n} = ${d} · ${n / d}.\n\nI tested divisors up to √${n} ≈ ${fmt(Math.sqrt(n))}.`);
    return T(`**${n} este număr prim.** Nu are niciun divizor între 2 și √${n} ≈ ${fmt(Math.sqrt(n))}, deci singurii lui divizori sunt 1 și ${n}.`,
      `**${n} is a prime number.** It has no divisor between 2 and √${n} ≈ ${fmt(Math.sqrt(n))}, so its only divisors are 1 and ${n}.`);
  }

  function factorize(n) {
    const parts = []; let m = n;
    for (let d = 2; d * d <= m; d++) { let e = 0; while (m % d === 0) { m /= d; e++; } if (e) parts.push(e > 1 ? `${d}^${e}` : `${d}`); }
    if (m > 1) parts.push(String(m));
    return parts.join(' · ');
  }

  function divisors(n) {
    const r = [];
    for (let d = 1; d <= n; d++) if (n % d === 0) r.push(d);
    return r;
  }

  function toBinary(n) {
    let out = T(`**${n} în baza 2**\n\n`, `**${n} in base 2**\n\n`), m = n; const rem = [];
    if (n === 0) return T('**0 în baza 2 este 0.**', '**0 in base 2 is 0.**');
    while (m > 0) { out += `\`${m} : 2 = ${Math.floor(m / 2)}  ${T('rest', 'remainder')} ${m % 2}\`\n`; rem.push(m % 2); m = Math.floor(m / 2); }
    return out + T(`\nResturile citite de jos în sus: **${rem.reverse().join('')}₂**`, `\nThe remainders read from bottom to top: **${rem.reverse().join('')}₂**`);
  }
  function fromBinary(str) {
    const bits = str.split(''); const n = bits.length;
    const terms = bits.map((b, i) => b === '1' ? `2^${n - 1 - i}` : null).filter(Boolean);
    return `**${str}₂ ${T('în baza 10', 'in base 10')}**\n\n${terms.join(' + ')}\n= ${terms.map(t => Math.pow(2, +t.slice(2))).join(' + ')}\n= **${parseInt(str, 2)}**`;
  }

  /* ---------- rutare locală ---------- */
  let kbHit = false;
  function local(raw) {
    kbHit = false;
    const text = raw.trim();
    const t = strip(text);
    if (!t) return null;
    const n = nums(text);

    if (/^(salut|buna|hei|hello|hey|hi|servus|noroc)\b/.test(t) && t.length < 20)
      return T('Salut! Sunt tutorul MathInfo. Pot rezolva ecuații (`x^2 - 5x + 6 = 0`), calcule (`(3+4)*2^3`), `cmmdc 48 36`, `97 prim`, `binar 25`, sau să-ți explic orice din programa de clasa a IX-a la Mate și Info.',
        'Hi! I am the MathInfo tutor. I can solve equations (`x^2 - 5x + 6 = 0`), calculations (`(3+4)*2^3`), `gcd 48 36`, `97 prime`, `binary 25`, or explain anything from the 9th-grade Maths and Computer Science curriculum.');

    const eq = solveEquation(text);
    if (eq) return eq;

    if (/cmmdc|gcd|cel mai mare divizor|cmmmc|lcm|greatest common/.test(t) && n.length >= 2 && n.every(x => Number.isInteger(x) && x > 0))
      return euclid(Math.max(n[0], n[1]), Math.min(n[0], n[1]));
    if (/descompun|factori|factoris|factoriz|prime factors/.test(t) && n.length >= 1 && Number.isInteger(n[0]) && n[0] > 1)
      return T(`**Descompunerea în factori primi:** ${n[0]} = ${factorize(n[0])}`, `**Prime factorisation:** ${n[0]} = ${factorize(n[0])}`);
    if (/divizor|divisor/.test(t) && n.length >= 1 && Number.isInteger(n[0]) && n[0] > 0 && n[0] <= 100000) {
      const d = divisors(n[0]); return T(`**Divizorii lui ${n[0]}** (${d.length}): ${d.join(', ')}`, `**Divisors of ${n[0]}** (${d.length}): ${d.join(', ')}`);
    }
    if (/\bprim\b|prime/.test(t) && !/ciur|eratostene|sieve|eratosthenes|definitie|definition|ce este|ce sunt|what is a|what are/.test(t) && n.length >= 1 && Number.isInteger(n[0]) && n[0] <= 1e12)
      return primeInfo(n[0]);
    if (/zecimal|baza 10|din binar|decimal|base 10|from binary/.test(t)) {
      const m = /[01]{2,}/.exec(text); if (m) return fromBinary(m[0]);
    }
    if (/binar|baza 2|in 2\b|binary|base 2/.test(t) && n.length >= 1 && Number.isInteger(n[0]) && n[0] >= 0 && n[0] < 1e9) return toBinary(n[0]);
    if (/hexa|baza 16|base 16/.test(t) && n.length >= 1 && Number.isInteger(n[0]) && n[0] >= 0)
      return T(`**${n[0]} în baza 16** = **${n[0].toString(16).toUpperCase()}₁₆**`, `**${n[0]} in base 16** = **${n[0].toString(16).toUpperCase()}₁₆**`);
    if (/factorial|\d+!/.test(t) && n.length >= 1 && Number.isInteger(n[0]) && n[0] >= 0 && n[0] <= 20) {
      let f = 1; for (let i = 2; i <= n[0]; i++) f *= i; return `**${n[0]}! = ${f}**`;
    }
    if (/(suma|sum).*(primelor|numerelor|first|numbers)|1\s*\+\s*2\s*\+.*\+\s*n/.test(t) && n.length >= 1) {
      const k = n[n.length - 1];
      if (Number.isInteger(k) && k > 0) return T(`Suma 1 + 2 + … + ${k} = ${k}·${k + 1}/2 = **${k * (k + 1) / 2}**`, `The sum 1 + 2 + … + ${k} = ${k}·${k + 1}/2 = **${k * (k + 1) / 2}**`);
    }
    if (/distanta|distance/.test(t) && ints(text).length === 4) {
      const [x1, y1, x2, y2] = ints(text); const dd = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      return `**AB = √((${fmt(x2)} − ${fmt(x1)})² + (${fmt(y2)} − ${fmt(y1)})²) = √${fmt(dd)}** ≈ ${fmt(Math.sqrt(dd))}`;
    }
    if (/mijloc|midpoint/.test(t) && ints(text).length === 4) {
      const [x1, y1, x2, y2] = ints(text); return `**M((${fmt(x1)} + ${fmt(x2)})/2, (${fmt(y1)} + ${fmt(y2)})/2) = M(${fmt((x1 + x2) / 2)}, ${fmt((y1 + y2) / 2)})**`;
    }

    // expresie aritmetică
    const stripped = t.replace(/^(calculeaza|calculează|calculate|cat face|cat este|cat e|rezultatul lui|what is|how much is|compute)\s*/, '').replace(/[=?]+$/, '').trim();
    const bare = stripped.replace(/sqrt|abs/g, '');
    if (/\d/.test(stripped) && /[+\-*/^×÷:√(]/.test(stripped) && /^[\d\s+\-*/^().,×÷:√−·]+$/.test(bare)) {
      try { const v = evaluate(stripped); if (isFinite(v)) return `**${stripped.replace(/\s+/g, ' ')} = ${fmt(v)}**`; } catch (e) { return T(`Nu pot calcula expresia: ${e.message}.`, `I cannot compute the expression: ${e.message}.`); }
    }

    // bază de cunoștințe (cuvinte-cheie RO + EN)
    let best = null, bestScore = 0;
    KB.forEach((e, i) => {
      let sc = 0;
      for (const k of (EN() && typeof KB_EN !== 'undefined' && KB_EN[i] ? KB_EN[i].k : e.k)) { const kk = strip(k); if (t.includes(kk.trim())) sc += kk.trim().length; }
      if (sc > bestScore) { bestScore = sc; best = i; }
    });
    if (best !== null && bestScore >= 2) { kbHit = true; return EN() && typeof KB_EN !== 'undefined' && KB_EN[best] ? KB_EN[best].a : KB[best].a; }
    return null;
  }

  const FALLBACK = () => T('Nu am înțeles încă exact întrebarea, dar iată ce știu să fac fără conexiune la internet:\n\n- **Ecuații:** `x^2 - 5x + 6 = 0`, `3x + 2 = 11`\n- **Calcule:** `(3 + 4) * 2^3`, `sqrt(144)`\n- **Info:** `cmmdc 48 36`, `97 prim`, `binar 25`, `divizori 36`\n- **Teorie:** discriminant, modul, intervale, vectori, for/while, vectori în C++, bubble sort…\n\nPentru răspunsuri la orice întrebare ai nevoie de AI: fie serverul școlii are cheie Gemini, fie adaugi cheia ta în ⚙ Setări.',
    'I have not understood the question exactly, but here is what I can do without an internet connection:\n\n- **Equations:** `x^2 - 5x + 6 = 0`, `3x + 2 = 11`\n- **Calculations:** `(3 + 4) * 2^3`, `sqrt(144)`\n- **Computer science:** `gcd 48 36`, `97 prime`, `binary 25`, `divisors 36`\n- **Theory:** discriminant, absolute value, intervals, vectors, for/while, arrays in C++, bubble sort…\n\nFor answers to any question you need the AI: either the school server has a Gemini key, or you add your own in ⚙ Settings.');

  const SYSTEM = () => 'Ești tutorul MathInfo 9, pentru elevi de clasa a IX-a de la Liceul Teoretic „Emil Racoviță” Vaslui. ' + (EN() ? 'Answer in English (the student chose English) and keep standard terminology. ' : 'Răspunzi doar în limba română, clar și prietenos, ') + 'la Matematică (algebră, funcții, geometrie analitică) și Informatică (C++, algoritmi) de clasa a IX-a. Explică pas cu pas, ghidează elevul să înțeleagă (nu doar să copieze rezultatul), folosește exemple scurte și formatare simplă (**bold**, `cod`, liste). Dacă întrebarea nu ține de aceste materii, redirecționează politicos.';

  async function gemini(history, key, model) {
    const contents = history.slice(-12).map(m => ({ role: m.r === 'u' ? 'user' : 'model', parts: [{ text: m.t }] }));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM() }] }, contents })
    });
    if (!res.ok) {
      let msg = res.status + ''; try { msg = (await res.json()).error.message; } catch (e) { /* ignore */ }
      throw new Error(msg);
    }
    const data = await res.json();
    const out = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    if (!out) throw new Error(T('Răspuns gol', 'Empty answer'));
    return out.map(p => p.text || '').join('');
  }

  function lessonMd(l) {
    return `**${l.title}** — ${T('din lecție', 'from the lesson')}:\n\n` + l.body.map(([t, c]) => t === 'h' ? `**${c}**` : t === 'ul' ? c.map(x => '- ' + x).join('\n') : t === 'code' ? '```\n' + c + '\n```' : c).join('\n\n');
  }

  async function serverAI(history, lessonId) {
    const r = await fetch('/api/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(API.st.token ? { Authorization: 'Bearer ' + API.st.token } : {}) },
      body: JSON.stringify({ messages: history.slice(-12), lessonId: lessonId || null, lang: EN() ? 'en' : 'ro' }), signal: AbortSignal.timeout(62000)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(I18N.tx(j.error || (T('eroare ', 'error ') + r.status)));
    return j;
  }

  /* Ordine: calcul exact local → AI server → cheie proprie Gemini → bază locală → lecția curentă */
  async function reply(history, settings, opts = {}) {
    const last = history[history.length - 1].t;
    qlang = detectLang(last);
    const loc = local(last);
    const exact = !!loc && !kbHit;
    if (!exact) {
      let note = '';
      if (opts.serverAI) {
        try {
          const j = await serverAI(history, opts.lessonId);
          const tag = j.src === 'verified' ? T(' · verificat ✓', ' · verified ✓') : j.src === 'corrected' ? T(' · corectat la verificare ✓', ' · corrected on review ✓') : '';
          return { text: j.text, src: 'AI' + tag + (opts.lessonId ? T(' · cu lecția', ' · with the lesson') : '') };
        }
        catch (e) { note = e.message; }
      }
      if (settings.key) {
        try { return { text: await gemini(history, settings.key, settings.model || 'gemini-2.5-flash'), src: 'Gemini' }; }
        catch (e) { note = e.message; }
      }
      if (!loc && opts.lessonId) {
        const l = LESSONS.find(x => x.id === opts.lessonId);
        if (l) return { text: lessonMd(l) + (note ? T('\n\n_AI indisponibil (', '\n\n_AI unavailable (') + note + ')._' : ''), src: T('Local · lecția', 'Local · lesson') };
      }
      return { text: (loc || FALLBACK()) + (note ? T('\n\n_AI indisponibil (' + note + '). Am folosit tutorul local._', '\n\n_AI unavailable (' + note + '). I used the local tutor._') : ''), src: 'Local' };
    }
    return { text: loc, src: T('Local · calcul exact', 'Local · exact calculation') };
  }

  return { reply, local, evaluate, gcd, toBinary };
})();
