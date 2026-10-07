/* Calculator exact pe server: extrage din întrebarea elevului ecuații, expresii, cmmdc/cmmmc, numere prime, baze etc.
   și le rezolvă DETERMINIST. Rezultatele sunt date AI-ului ca „fapte verificate”, ca să nu greșească la calcule. */
'use strict';

const strip = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const fmt = x => { if (!isFinite(x)) return String(x); return String(Math.round(x * 1e9) / 1e9).replace('-', '−'); };

/** Evaluator de expresii aritmetice (fără eval): + − * / ^ ( ) sqrt abs; virgula = zecimală. */
function evaluate(src) {
  const s = src.replace(/×|·/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').replace(/√/g, 'sqrt').replace(/\s+/g, '').toLowerCase();
  let i = 0; const peek = () => s[i];
  const expr = () => { let v = term(); while (peek() === '+' || peek() === '-') { const o = s[i++], r = term(); v = o === '+' ? v + r : v - r; } return v; };
  const term = () => { let v = power(); while (peek() === '*' || peek() === '/') { const o = s[i++], r = power(); if (o === '/' && r === 0) throw new Error('div0'); v = o === '*' ? v * r : v / r; } return v; };
  const power = () => { const b = unary(); if (peek() === '^') { i++; return Math.pow(b, power()); } return b; };
  const unary = () => { if (peek() === '-') { i++; return -unary(); } if (peek() === '+') { i++; return unary(); } return atom(); };
  const atom = () => {
    if (peek() === '(') { i++; const v = expr(); if (peek() !== ')') throw new Error('paren'); i++; return v; }
    const f = /^(sqrt|abs)/.exec(s.slice(i));
    if (f) { i += f[0].length; const v = atom(); return f[0] === 'sqrt' ? Math.sqrt(v) : Math.abs(v); }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i)); if (!m) throw new Error('expr'); i += m[0].length; return parseFloat(m[0]);
  };
  const v = expr(); if (i < s.length) throw new Error('expr'); return v;
}

function parsePoly(side) {
  const t = side.replace(/\*/g, ''); if (!t) return null;
  const terms = t.replace(/(?!^)([+-])/g, ' $1').split(' ').filter(Boolean), c = [0, 0, 0];
  for (const term of terms) {
    const m = /^([+-]?)(\d*\.?\d*)(x\^2|x)?$/.exec(term);
    if (!m || (m[2] === '' && !m[3]) || m[2] === '.') return null;
    c[m[3] === 'x^2' ? 2 : m[3] === 'x' ? 1 : 0] += (m[1] === '-' ? -1 : 1) * (m[2] === '' ? 1 : parseFloat(m[2]));
  }
  return c;
}
function solveEq(raw) {
  const t = raw.toLowerCase().replace(/−/g, '-').replace(/²/g, '^2').replace(/,/g, '.').replace(/\s+/g, '');
  if (!/^[\dx+\-*^.=]+$/.test(t) || (t.match(/=/g) || []).length !== 1 || !t.includes('x')) return null;
  const [l, r] = t.split('='), L = parsePoly(l), R = parsePoly(r); if (!L || !R) return null;
  const a = L[2] - R[2], b = L[1] - R[1], c = L[0] - R[0];
  if (a === 0) { if (b === 0) return c === 0 ? 'identitate (orice x este soluție)' : 'fără soluții'; return `ecuație de gradul I: ${fmt(b)}x ${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))} = 0 ⇒ x = ${fmt(-c / b)}`; }
  const d = b * b - 4 * a * c, vx = -b / (2 * a), vy = -d / (4 * a);
  let out = `ecuație de gradul II, forma generală a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}; Δ = ${fmt(d)}`;
  if (d > 0) { const sq = Math.sqrt(d), x1 = (-b - sq) / (2 * a), x2 = (-b + sq) / (2 * a); out += `; două rădăcini reale: x₁ = ${fmt(Math.min(x1, x2))}, x₂ = ${fmt(Math.max(x1, x2))}; S = ${fmt(x1 + x2)}, P = ${fmt(x1 * x2)}`; }
  else if (d === 0) out += `; rădăcină dublă x = ${fmt(vx)}`; else out += '; nu are rădăcini reale';
  return out + `; vârful V(${fmt(vx)}, ${fmt(vy)}); ${a > 0 ? 'minim' : 'maxim'} = ${fmt(vy)}`;
}

const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
function factorize(n) { const p = []; let m = n; for (let d = 2; d * d <= m; d++) { let e = 0; while (m % d === 0) { m /= d; e++; } if (e) p.push(e > 1 ? `${d}^${e}` : `${d}`); } if (m > 1) p.push(String(m)); return p.join(' · '); }
const isPrime = n => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };

/** Returnează un text cu fapte calculate exact (sau '' dacă nu găsește nimic de calculat). */
function facts(message) {
  const text = String(message || '').slice(0, 1500), t = strip(text), lines = [];
  const nums = (text.match(/-?\d+(?:[.,]\d+)?/g) || []).map(x => parseFloat(x.replace(',', '.')));
  const ints = nums.filter(Number.isInteger);
  const pts = (text.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);   // coordonate: „A(0,0)” are virgulă între numere, nu zecimală

  // ecuații: segmente cu '=' și x
  const eqs = new Set();
  for (const m of text.matchAll(/[0-9x²^+\-−*.,\s]+=[0-9x²^+\-−*.,\s]+/gi)) {
    const seg = m[0].trim(); if (/x/i.test(seg)) { const r = solveEq(seg); if (r) eqs.add(`„${seg}” → ${r}`); }
    if (eqs.size >= 3) break;
  }
  eqs.forEach(e => lines.push('Ecuație: ' + e));

  // expresii aritmetice (cel puțin un operator între numere)
  const exprs = new Set();
  for (const m of text.matchAll(/(?:sqrt|√|abs)?\(?[\d.,]+\)?(?:\s*(?:[-+*/^×÷−·]|:)\s*(?:sqrt|√|abs)?\(?[\d.,]+\)?)+/gi)) {
    const seg = m[0].trim(); if (/=/.test(seg)) continue;
    try { const v = evaluate(seg.replace(/:/g, '/')); if (isFinite(v)) exprs.add(`${seg} = ${fmt(v)}`); } catch (e) { /* ignorat */ }
    if (exprs.size >= 4) break;
  }
  exprs.forEach(e => lines.push('Calcul: ' + e));

  if (/cmmdc|c\.m\.m\.d\.c|gcd|cel mai mare divizor|greatest common/.test(t) || /cmmmc|lcm|least common|cel mai mic multiplu/.test(t)) {
    const p = ints.filter(x => x > 0); if (p.length >= 2) { const g = gcd(p[0], p[1]); lines.push(`cmmdc(${p[0]}, ${p[1]}) = ${g}; cmmmc(${p[0]}, ${p[1]}) = ${p[0] / g * p[1]}`); }
  }
  if (/prim|prime|descompun|factori|divizor|divisor/.test(t)) {
    const n = ints.find(x => x > 1 && x <= 1e12);
    if (n) {
      lines.push(`${n} ${isPrime(n) ? 'ESTE' : 'NU este'} număr prim; descompunere în factori primi: ${n} = ${factorize(n)}`);
      if (n <= 100000) { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); lines.push(`Divizorii lui ${n} (${d.length}): ${d.join(', ')}`); }
    }
  }
  if (/binar|binary|baza|base|zecimal|decimal|hexa/.test(t)) {
    const n = ints.find(x => x >= 0 && x < 1e9);
    if (n !== undefined) lines.push(`${n} în baza 2 = ${n.toString(2)}; în baza 8 = ${n.toString(8)}; în baza 16 = ${n.toString(16).toUpperCase()}`);
    const b = /\b[01]{3,}\b/.exec(text); if (b && b[0].length <= 30) lines.push(`${b[0]} citit în baza 2 = ${parseInt(b[0], 2)} în baza 10`);
  }
  if (/distanta|distance/.test(t) && pts.length === 4) { const [x1, y1, x2, y2] = pts; const d2 = (x2 - x1) ** 2 + (y2 - y1) ** 2; lines.push(`Distanța dintre (${x1}, ${y1}) și (${x2}, ${y2}) este √${d2} ≈ ${fmt(Math.sqrt(d2))}`); }
  if (/mijloc|midpoint/.test(t) && pts.length === 4) { const [x1, y1, x2, y2] = pts; lines.push(`Mijlocul segmentului este (${fmt((x1 + x2) / 2)}, ${fmt((y1 + y2) / 2)})`); }
  return lines.join('\n');
}

module.exports = { facts, evaluate, solveEq, gcd, factorize, isPrime };
