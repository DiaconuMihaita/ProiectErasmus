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

  /* ---------- rezolvări locale suplimentare: funcție, inecuații, progresii, trigonometrie ---------- */
  const norm = s => s.toLowerCase().replace(/−|–/g, '-').replace(/²/g, '^2').replace(/₁/g, '1').replace(/₂/g, '2').replace(/,/g, '.').replace(/\s+/g, '');
  const num = s => parseFloat(String(s).replace(',', '.'));
  const interval = (lo, hi, loClosed, hiClosed) => (lo === null ? '(−∞' : (loClosed ? '[' : '(') + fmt(lo)) + ', ' + (hi === null ? '∞)' : fmt(hi) + (hiClosed ? ']' : ')'));
  const evalPoly = (c, x) => c[2] * x * x + c[1] * x + c[0];

  /** f(x) = ... : analiză completă (gradul I sau II) + valori f(n) cerute. */
  function analyzeFunction(text) {
    const n = norm(text), m0 = /(?:^|[^a-zăâîșț])([fgh])\s*\(\s*x\s*\)\s*=\s*([0-9x²^+\-−–*.,\s]+)/i.exec(text.toLowerCase());
    if (!m0) return null;
    const m = [null, m0[1], norm(m0[2]).replace(/\.$/, '')];
    const c = parsePoly(m[2]); if (!c) return null;
    const [c0, c1, c2] = c, name = m[1];
    const vals = [...n.matchAll(new RegExp(name + '\\((-?\\d+(?:\\.\\d+)?)\\)', 'g'))].map(x => parseFloat(x[1])).slice(0, 4);
    const valLines = vals.map(v => `**${name}(${fmt(v)}) = ${fmt(evalPoly(c, v))}**`).join('\n');
    const head = `**${T('Funcția', 'The function')} ${name}(x) = ${poly(c2, c1, c0).replace(/ = 0$/, '')}**`;
    if (c2 === 0) {
      if (c1 === 0) return null;
      const root = -c0 / c1;
      return head + T(` (gradul I)\n\n1. Panta a = ${fmt(c1)}, ordonata la origine b = ${fmt(c0)}\n2. Graficul este o dreaptă ${c1 > 0 ? 'strict **crescătoare**' : 'strict **descrescătoare**'}\n3. Intersecția cu Ox: ${fmt(c1)}x + ${par(c0)} = 0 → x = ${fmt(root)}, punctul (${fmt(root)}, 0)\n4. Intersecția cu Oy: (0, ${fmt(c0)})\n5. Semn: ${name}(x) ${c1 > 0 ? '> 0 pentru x > ' : '> 0 pentru x < '}${fmt(root)}${vals.length ? '\n\n' + valLines : ''}`,
        ` (linear)\n\n1. Slope a = ${fmt(c1)}, y-intercept b = ${fmt(c0)}\n2. The graph is a line, strictly **${c1 > 0 ? 'increasing' : 'decreasing'}**\n3. Intersection with Ox: ${fmt(c1)}x + ${par(c0)} = 0 → x = ${fmt(root)}, the point (${fmt(root)}, 0)\n4. Intersection with Oy: (0, ${fmt(c0)})\n5. Sign: ${name}(x) ${c1 > 0 ? '> 0 for x > ' : '> 0 for x < '}${fmt(root)}${vals.length ? '\n\n' + valLines : ''}`);
    }
    const d = c1 * c1 - 4 * c2 * c0, vx = -c1 / (2 * c2), vy = -d / (4 * c2), up = c2 > 0;
    let rootsRo, rootsEn, sign;
    if (d > 0) {
      const sq = Math.sqrt(d), r1 = Math.min((-c1 - sq) / (2 * c2), (-c1 + sq) / (2 * c2)), r2 = Math.max((-c1 - sq) / (2 * c2), (-c1 + sq) / (2 * c2));
      rootsRo = `x = (${fmt(-c1)} ± ${Number.isInteger(sq) ? fmt(sq) : '√' + fmt(d)})/${fmt(2 * c2)} → x₁ = ${fmt(r1)}, x₂ = ${fmt(r2)}`; rootsEn = rootsRo;
      sign = [T(`${name}(x) ${up ? '>' : '<'} 0 pentru x ∈ (−∞, ${fmt(r1)}) ∪ (${fmt(r2)}, ∞); ${name}(x) ${up ? '<' : '>'} 0 pentru x ∈ (${fmt(r1)}, ${fmt(r2)})`,
        `${name}(x) ${up ? '>' : '<'} 0 for x ∈ (−∞, ${fmt(r1)}) ∪ (${fmt(r2)}, ∞); ${name}(x) ${up ? '<' : '>'} 0 for x ∈ (${fmt(r1)}, ${fmt(r2)})`)];
    } else if (d === 0) {
      rootsRo = `x = ${fmt(vx)} (${T('rădăcină dublă', 'double root')})`; rootsEn = rootsRo;
      sign = [T(`${name}(x) ${up ? '≥' : '≤'} 0 pentru orice x, cu egalitate doar în x = ${fmt(vx)}`, `${name}(x) ${up ? '≥' : '≤'} 0 for every x, with equality only at x = ${fmt(vx)}`)];
    } else {
      rootsRo = T('nu are rădăcini reale (graficul nu taie axa Ox)', 'no real roots (the graph does not cross Ox)'); rootsEn = rootsRo;
      sign = [T(`${name}(x) ${up ? '> 0' : '< 0'} pentru orice x`, `${name}(x) ${up ? '> 0' : '< 0'} for every x`)];
    }
    return head + T(` (gradul II)\n\n1. a = ${fmt(c2)}, b = ${fmt(c1)}, c = ${fmt(c0)} → parabola are ramurile în ${up ? 'sus (a > 0)' : 'jos (a < 0)'}\n2. Δ = b² − 4ac = ${par(c1)}² − 4·${par(c2)}·${par(c0)} = ${fmt(d)}\n3. Rădăcinile (intersecția cu Ox): ${rootsRo}\n4. Intersecția cu Oy: (0, ${fmt(c0)})\n5. Vârful: V(−b/2a, −Δ/4a) = V(${fmt(vx)}, ${fmt(vy)})\n6. ${up ? 'Minim' : 'Maxim'} ${fmt(vy)} în x = ${fmt(vx)}; imaginea: ${up ? interval(vy, null, true, false) : interval(null, vy, false, true)}\n7. Monotonie: ${up ? 'descrescătoare pe (−∞, ' + fmt(vx) + '], crescătoare pe [' + fmt(vx) + ', ∞)' : 'crescătoare pe (−∞, ' + fmt(vx) + '], descrescătoare pe [' + fmt(vx) + ', ∞)'}\n8. Semn: ${sign[0]}${vals.length ? '\n\n' + valLines : ''}`,
      ` (quadratic)\n\n1. a = ${fmt(c2)}, b = ${fmt(c1)}, c = ${fmt(c0)} → the parabola opens ${up ? 'upward (a > 0)' : 'downward (a < 0)'}\n2. Δ = b² − 4ac = ${par(c1)}² − 4·${par(c2)}·${par(c0)} = ${fmt(d)}\n3. Roots (intersection with Ox): ${rootsEn}\n4. Intersection with Oy: (0, ${fmt(c0)})\n5. Vertex: V(−b/2a, −Δ/4a) = V(${fmt(vx)}, ${fmt(vy)})\n6. ${up ? 'Minimum' : 'Maximum'} ${fmt(vy)} at x = ${fmt(vx)}; image: ${up ? interval(vy, null, true, false) : interval(null, vy, false, true)}\n7. Monotonicity: ${up ? 'decreasing on (−∞, ' + fmt(vx) + '], increasing on [' + fmt(vx) + ', ∞)' : 'increasing on (−∞, ' + fmt(vx) + '], decreasing on [' + fmt(vx) + ', ∞)'}\n8. Sign: ${sign[0]}${vals.length ? '\n\n' + valLines : ''}`);
  }

  /** Inecuații de gradul I și II: ax²+bx+c ⋚ 0 (cu orice membru drept). */
  function solveInequality(text) {
    let t = norm(text).replace(/≤/g, '<=').replace(/≥/g, '>=');
    t = t.replace(/^(rezolva|rezolvă|solve|inecuatia|inequality)[:]?/, '');
    const m = /^([0-9x+\-*^.]+)(<=|>=|<|>)([0-9x+\-*^.]+)$/.exec(t); if (!m) return null;
    const L = parsePoly(m[1]), R = parsePoly(m[3]); if (!L || !R || (!m[1].includes('x') && !m[3].includes('x'))) return null;
    const rel = m[2], c = L[0] - R[0], b = L[1] - R[1], a = L[2] - R[2];
    const strict = rel.length === 1, gt = rel[0] === '>', relTxt = rel.replace('<=', '≤').replace('>=', '≥');
    const head = T(`**Inecuația** \`${poly(a, b, c).replace(/ = 0$/, '')} ${relTxt} 0\`\n\n`, `**The inequality** \`${poly(a, b, c).replace(/ = 0$/, '')} ${relTxt} 0\`\n\n`);
    const fin = v => T(`Soluția: **x ∈ ${v}**`, `Solution: **x ∈ ${v}**`);
    if (a === 0) {
      if (b === 0) { const ok = gt ? (strict ? c > 0 : c >= 0) : (strict ? c < 0 : c <= 0); return head + (ok ? T('Este adevărată pentru orice x: **x ∈ ℝ**', 'It is true for every x: **x ∈ ℝ**') : T('Nu are soluții: **x ∈ ∅**', 'It has no solutions: **x ∈ ∅**')); }
      const root = -c / b, flip = b < 0, wantGreater = gt !== flip;
      const set = wantGreater ? interval(root, null, !strict, false) : interval(null, root, false, !strict);
      return head + T(`1. ${fmt(b)}x ${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))} ${relTxt} 0 → ${fmt(b)}x ${relTxt} ${fmt(-c)}\n2. ${flip ? 'Împart la ' + fmt(b) + ' < 0, deci **inversez sensul** inegalității' : 'Împart la ' + fmt(b) + ' > 0, sensul rămâne'} → x ${wantGreater ? (strict ? '>' : '≥') : (strict ? '<' : '≤')} ${fmt(root)}\n3. ${fin(set)}`,
        `1. ${fmt(b)}x ${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))} ${relTxt} 0 → ${fmt(b)}x ${relTxt} ${fmt(-c)}\n2. ${flip ? 'Dividing by ' + fmt(b) + ' < 0, so I **reverse the direction** of the inequality' : 'Dividing by ' + fmt(b) + ' > 0, the direction stays'} → x ${wantGreater ? (strict ? '>' : '≥') : (strict ? '<' : '≤')} ${fmt(root)}\n3. ${fin(set)}`);
    }
    const d = b * b - 4 * a * c, up = a > 0;
    const pos = gt, step1 = T(`1. Ecuația asociată \`${poly(a, b, c)}\`: Δ = ${par(b)}² − 4·${par(a)}·${par(c)} = ${fmt(d)}\n`, `1. Associated equation \`${poly(a, b, c)}\`: Δ = ${par(b)}² − 4·${par(a)}·${par(c)} = ${fmt(d)}\n`);
    if (d > 0) {
      const sq = Math.sqrt(d), r1 = Math.min((-b - sq) / (2 * a), (-b + sq) / (2 * a)), r2 = Math.max((-b - sq) / (2 * a), (-b + sq) / (2 * a));
      // f > 0 în afara rădăcinilor dacă a > 0; între rădăcini dacă a < 0
      const outside = pos === up;
      const set = outside ? `(−∞, ${fmt(r1)}${strict ? ')' : ']'} ∪ ${strict ? '(' : '['}${fmt(r2)}, ∞)` : `${strict ? '(' : '['}${fmt(r1)}, ${fmt(r2)}${strict ? ')' : ']'}`;
      return head + step1 + T(`2. Rădăcinile: x₁ = ${fmt(r1)}, x₂ = ${fmt(r2)}\n3. Semnul: a = ${fmt(a)} ${up ? '> 0' : '< 0'} → funcția are semnul lui a în afara rădăcinilor și semn contrar între ele\n4. ${fin(set)}`,
        `2. Roots: x₁ = ${fmt(r1)}, x₂ = ${fmt(r2)}\n3. Sign: a = ${fmt(a)} ${up ? '> 0' : '< 0'} → the function has the sign of a outside the roots and the opposite sign between them\n4. ${fin(set)}`);
    }
    if (d === 0) {
      const x0 = -b / (2 * a); let set;
      if (up) set = pos ? (strict ? `ℝ \\ {${fmt(x0)}}` : 'ℝ') : (strict ? '∅' : `{${fmt(x0)}}`); else set = pos ? (strict ? '∅' : `{${fmt(x0)}}`) : (strict ? `ℝ \\ {${fmt(x0)}}` : 'ℝ');
      return head + step1 + T(`2. Rădăcină dublă x = ${fmt(x0)}; funcția are mereu semnul lui a (≠ 0 doar în rădăcină)\n3. ${fin(set)}`, `2. Double root x = ${fmt(x0)}; the function always has the sign of a (zero only at the root)\n3. ${fin(set)}`);
    }
    const all = (pos && up) || (!pos && !up), set = all ? 'ℝ' : '∅';
    return head + step1 + T(`2. Δ < 0 → fără rădăcini reale; funcția are semnul lui a (${up ? 'pozitiv' : 'negativ'}) pentru orice x\n3. ${fin(set)}`, `2. Δ < 0 → no real roots; the function has the sign of a (${up ? 'positive' : 'negative'}) for every x\n3. ${fin(set)}`);
  }

  /** Progresii aritmetice / geometrice: termenul general și suma primilor n termeni. */
  function solveProgression(text) {
    const n0 = norm(text), pick = re => { const m = re.exec(n0); return m ? parseFloat(m[1]) : null; };
    const nTerms = pick(/(?:n=|primii|primilor|first)(\d+)/) ?? pick(/a(?:_?n)?\((\d+)\)/);
    const geo = /geometri/.test(strip(text)) || (/b1=/.test(n0) && /q=/.test(n0));
    const ar = /aritmetic|arithmetic/.test(strip(text)) || (/a1=/.test(n0) && /r=/.test(n0));
    if (!geo && !ar) return null;
    const idx = pick(/(?:[ab]_?)(\d+)(?:\?|$|=\?)/) ?? nTerms;
    if (geo) {
      const b1 = pick(/b1=(-?\d+(?:\.\d+)?)/) ?? pick(/primul(?:termen)?=(-?\d+(?:\.\d+)?)/), q = pick(/q=(-?\d+(?:\.\d+)?)/);
      if (b1 === null || q === null) return null;
      const n = Math.round(nTerms ?? idx ?? 5); if (n < 1 || n > 60) return null;
      const bn = b1 * Math.pow(q, n - 1), S = q === 1 ? n * b1 : b1 * (Math.pow(q, n) - 1) / (q - 1);
      return T(`**Progresie geometrică** cu b₁ = ${fmt(b1)}, q = ${fmt(q)}, n = ${n}\n\n1. Termenul general: bₙ = b₁·qⁿ⁻¹ → b${n} = ${fmt(b1)}·${par(q)}^${n - 1} = **${fmt(bn)}**\n2. Suma: Sₙ = ${q === 1 ? 'n·b₁' : 'b₁·(qⁿ − 1)/(q − 1)'} = ${q === 1 ? `${n}·${fmt(b1)}` : `${fmt(b1)}·(${par(q)}^${n} − 1)/(${par(q)} − 1)`} = **${fmt(S)}**\n3. Primii termeni: ${Array.from({ length: Math.min(n, 6) }, (_, i) => fmt(b1 * Math.pow(q, i))).join(', ')}${n > 6 ? ', …' : ''}`,
        `**Geometric progression** with b₁ = ${fmt(b1)}, q = ${fmt(q)}, n = ${n}\n\n1. General term: bₙ = b₁·qⁿ⁻¹ → b${n} = ${fmt(b1)}·${par(q)}^${n - 1} = **${fmt(bn)}**\n2. Sum: Sₙ = ${q === 1 ? 'n·b₁' : 'b₁·(qⁿ − 1)/(q − 1)'} = ${q === 1 ? `${n}·${fmt(b1)}` : `${fmt(b1)}·(${par(q)}^${n} − 1)/(${par(q)} − 1)`} = **${fmt(S)}**\n3. First terms: ${Array.from({ length: Math.min(n, 6) }, (_, i) => fmt(b1 * Math.pow(q, i))).join(', ')}${n > 6 ? ', …' : ''}`);
    }
    const a1 = pick(/a1=(-?\d+(?:\.\d+)?)/) ?? pick(/primul(?:termen)?=(-?\d+(?:\.\d+)?)/), r = pick(/r=(-?\d+(?:\.\d+)?)/);
    if (a1 === null || r === null) return null;
    const n = Math.round(nTerms ?? idx ?? 5); if (n < 1 || n > 100000) return null;
    const an = a1 + (n - 1) * r, S = n * (a1 + an) / 2;
    return T(`**Progresie aritmetică** cu a₁ = ${fmt(a1)}, r = ${fmt(r)}, n = ${n}\n\n1. Termenul general: aₙ = a₁ + (n − 1)·r → a${n} = ${fmt(a1)} + ${n - 1}·${par(r)} = **${fmt(an)}**\n2. Suma: Sₙ = n·(a₁ + aₙ)/2 = ${n}·(${fmt(a1)} + ${par(an)})/2 = **${fmt(S)}**\n3. Primii termeni: ${Array.from({ length: Math.min(n, 6) }, (_, i) => fmt(a1 + i * r)).join(', ')}${n > 6 ? ', …' : ''}`,
      `**Arithmetic progression** with a₁ = ${fmt(a1)}, r = ${fmt(r)}, n = ${n}\n\n1. General term: aₙ = a₁ + (n − 1)·r → a${n} = ${fmt(a1)} + ${n - 1}·${par(r)} = **${fmt(an)}**\n2. Sum: Sₙ = n·(a₁ + aₙ)/2 = ${n}·(${fmt(a1)} + ${par(an)})/2 = **${fmt(S)}**\n3. First terms: ${Array.from({ length: Math.min(n, 6) }, (_, i) => fmt(a1 + i * r)).join(', ')}${n > 6 ? ', …' : ''}`);
  }

  /** sin / cos / tg / ctg pentru unghiuri multiple de 30° și 45° (0°–360°), cu reducere la primul cadran. */
  const TRIG = { sin: { 0: '0', 30: '1/2', 45: '√2/2', 60: '√3/2', 90: '1' }, cos: { 0: '1', 30: '√3/2', 45: '√2/2', 60: '1/2', 90: '0' }, tg: { 0: '0', 30: '√3/3', 45: '1', 60: '√3', 90: null }, ctg: { 0: null, 30: '√3', 45: '1', 60: '√3/3', 90: '0' } };
  function trigValue(text) {
    const m = /\b(sin|cos|tg|tan|ctg|cot)\s*\(?\s*(\d{1,3})\s*(?:°|º|grade|degrees|deg)?\s*\)?/i.exec(text.replace(/\s+/g, ' ')); if (!m) return null;
    const fn = { tan: 'tg', cot: 'ctg' }[m[1].toLowerCase()] || m[1].toLowerCase(), A = parseInt(m[2], 10); if (A > 360) return null;
    let ref, neg, how;
    if (A <= 90) { ref = A; neg = false; how = ''; }
    else if (A <= 180) { ref = 180 - A; neg = fn !== 'sin'; how = `${fn}(180° − ${ref}°)`; }
    else if (A <= 270) { ref = A - 180; neg = fn === 'sin' || fn === 'cos'; how = `${fn}(180° + ${ref}°)`; }
    else { ref = 360 - A; neg = fn !== 'cos'; how = `${fn}(360° − ${ref}°)`; }
    if (!(ref in TRIG[fn])) return null;
    const base = TRIG[fn][ref];
    if (base === null) return T(`**${fn} ${A}° nu este definit** (împărțire la 0).`, `**${fn} ${A}° is undefined** (division by zero).`);
    const val = (neg && base !== '0' ? '−' : '') + base;
    const sgnWhy = how ? T(`\n\nSemnul: în cadranul ${A <= 180 ? 'II' : A <= 270 ? 'III' : 'IV'}, ${fn} este ${neg ? 'negativ' : 'pozitiv'}.`, `\n\nSign: in quadrant ${A <= 180 ? 'II' : A <= 270 ? 'III' : 'IV'}, ${fn} is ${neg ? 'negative' : 'positive'}.`) : '';
    return `**${fn} ${A}° = ${val}**\n\n` + (how ? `${fn} ${A}° = ${how} = ${neg && base !== '0' ? '−' : ''}${fn} ${ref}° = **${val}**` : T(`Valoare remarcabilă: ${fn} ${A}° = **${val}**`, `Special value: ${fn} ${A}° = **${val}**`)) + sgnWhy
      + T(`\n\nTabel: sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2; cos 30° = √3/2, cos 45° = √2/2, cos 60° = 1/2; tg 30° = √3/3, tg 45° = 1, tg 60° = √3.`, `\n\nTable: sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2; cos 30° = √3/2, cos 45° = √2/2, cos 60° = 1/2; tg 30° = √3/3, tg 45° = 1, tg 60° = √3.`);
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
    const fa = analyzeFunction(text); if (fa) return fa;
    const ineq = solveInequality(text); if (ineq) return ineq;
    const prog = solveProgression(text); if (prog) return prog;
    const trig = trigValue(text); if (trig) return trig;

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

  const DEPTH_LINE = { short: 'Be concise (max ~150 words).', detailed: 'Be thorough: show every step, explain why, include a check and an example.', deep: 'Give an in-depth lesson-style answer: intuition, exact definitions, full worked solution, an alternative method, a second worked example, common mistakes and 2–3 practice exercises with answers at the end.' };
  async function gemini(history, key, model, depth) {
    const contents = history.slice(-12).map(m => ({ role: m.r === 'u' ? 'user' : 'model', parts: [{ text: m.t }] }));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM() + ' ' + (DEPTH_LINE[depth] || DEPTH_LINE.detailed) }] }, contents })
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

  async function serverAI(history, lessonId, depth) {
    const r = await fetch('/api/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(API.st.token ? { Authorization: 'Bearer ' + API.st.token } : {}) },
      body: JSON.stringify({ messages: history.slice(-12), lessonId: lessonId || null, lang: EN() ? 'en' : 'ro', depth: depth || 'detailed' }), signal: AbortSignal.timeout(62000)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(I18N.tx(j.error || (T('eroare ', 'error ') + r.status)));
    return j;
  }

  /** Răspuns în flux: draftul ajunge imediat (onDraft), apoi verdictul verificării. */
  async function serverAIStream(history, lessonId, depth, onDraft) {
    const r = await fetch('/api/ai/stream', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(API.st.token ? { Authorization: 'Bearer ' + API.st.token } : {}) },
      body: JSON.stringify({ messages: history.slice(-12), lessonId: lessonId || null, lang: EN() ? 'en' : 'ro', depth: depth || 'detailed' }), signal: AbortSignal.timeout(65000)
    });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(I18N.tx(j.error || (T('eroare ', 'error ') + r.status))); }
    const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '', final = null, draft = null;
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
        let ev; try { ev = JSON.parse(line); } catch (e) { continue; }
        if (ev.type === 'draft') { draft = ev.text; if (onDraft) onDraft(ev.text); }
        else if (ev.type === 'final') final = ev;
        else if (ev.type === 'error') { if (draft) final = { text: draft, src: 'draft' }; else throw new Error(I18N.tx(ev.error)); }
      }
    }
    if (!final && draft) final = { text: draft, src: 'draft' };
    if (!final) throw new Error(T('răspuns incomplet', 'incomplete answer'));
    return final;
  }
  const srcTag = j => (j.src === 'verified' ? T(' · verificat ✓', ' · verified ✓') : j.src === 'corrected' ? T(' · corectat la verificare ✓', ' · corrected on review ✓') : '');

  /** Doar rezolvarea locală (instant): { text, exact, src } sau null. */
  function localInfo(text) {
    qlang = detectLang(text);
    const loc = local(text);
    if (!loc) return null;
    return { text: loc, exact: !kbHit, src: T('Local · răspuns instant', 'Local · instant answer'), lang: qlang || I18N.lang };
  }

  /** Doar calea AI (server în flux → cheie proprie → text de rezervă). Nu aruncă erori: returnează { text, src, ok }. */
  async function ai(history, settings, opts = {}) {
    const last = history[history.length - 1].t;
    qlang = detectLang(last);
    let note = '';
    if (opts.serverAI) {
      try {
        const j = await serverAIStream(history, opts.lessonId, opts.depth, opts.onDraft);
        return { text: j.text, src: 'AI' + srcTag(j) + (opts.lessonId ? T(' · cu lecția', ' · with the lesson') : ''), ok: true };
      } catch (e) { note = e.message; }
    }
    if (settings.key) {
      try { return { text: await gemini(history, settings.key, settings.model || 'gemini-2.5-flash', opts.depth), src: 'Gemini', ok: true }; }
      catch (e) { note = e.message; }
    }
    const tail = note ? T('\n\n_AI indisponibil (' + note + ')._', '\n\n_AI unavailable (' + note + ')._') : '';
    if (opts.more) return { text: T('Nu am putut obține explicația detaliată de la AI acum. Încearcă din nou în câteva momente.', 'I could not get the detailed AI explanation right now. Please try again in a moment.') + tail, src: 'Local', ok: false };
    if (opts.fallbackLocal) return { text: opts.fallbackLocal + tail, src: T('Local · răspuns instant', 'Local · instant answer'), ok: false };
    if (opts.lessonId) { const l = LESSONS.find(x => x.id === opts.lessonId); if (l) return { text: lessonMd(l) + tail, src: T('Local · lecția', 'Local · lesson'), ok: false }; }
    return { text: FALLBACK() + tail, src: 'Local', ok: false };
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
          const j = await serverAI(history, opts.lessonId, opts.depth);
          const tag = j.src === 'verified' ? T(' · verificat ✓', ' · verified ✓') : j.src === 'corrected' ? T(' · corectat la verificare ✓', ' · corrected on review ✓') : '';
          return { text: j.text, src: 'AI' + tag + (opts.lessonId ? T(' · cu lecția', ' · with the lesson') : '') };
        }
        catch (e) { note = e.message; }
      }
      if (settings.key) {
        try { return { text: await gemini(history, settings.key, settings.model || 'gemini-2.5-flash', opts.depth), src: 'Gemini' }; }
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

  return { reply, local, localInfo, ai, evaluate, gcd, toBinary };
})();
