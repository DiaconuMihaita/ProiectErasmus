/* Lecții clasa a IX-a — Matematică și Informatică.
   Blocuri: ['p', text] · ['h', titlu] · ['ul', [..]] · ['f', formulă] · ['ex', exemplu] · ['code', cod C++]
   În text: `cod` și **bold**. Folosit și de server (context pentru AI). */

const LESSONS = [
  /* ===================== MATEMATICĂ ===================== */
  { id: 'm1', s: 'mate', n: '01', title: 'Mulțimi, logică, inducție', blurb: 'Operații cu mulțimi, conectori logici, cuantificatori, inducția matematică.',
    ask: 'Explică-mi mulțimile, logica matematică și inducția',
    body: [
      ['p', 'O **mulțime** este o colecție de elemente distincte: `A = {1, 2, 3}`. Scriem `2 ∈ A`, `5 ∉ A`, `B ⊂ A` (B este submulțime a lui A). Mulțimea fără elemente este `∅`.'],
      ['h', 'Operații cu mulțimi'],
      ['ul', ['Reuniunea `A ∪ B` = elementele care sunt în A **sau** în B.', 'Intersecția `A ∩ B` = elementele comune.', 'Diferența `A \\ B` = elementele din A care nu sunt în B.', 'Complementara față de E: `C_E(A) = E \\ A`.', 'Produsul cartezian `A × B` = perechile `(x, y)` cu `x ∈ A`, `y ∈ B`; `|A × B| = |A|·|B|`.']],
      ['f', '|A ∪ B| = |A| + |B| − |A ∩ B|      ·      o mulțime cu n elemente are 2ⁿ submulțimi'],
      ['ex', 'A = {1, 2, 3, 4}, B = {3, 4, 5}\nA ∩ B = {3, 4} · A ∪ B = {1, 2, 3, 4, 5} · A \\ B = {1, 2} · |A × B| = 12'],
      ['h', 'Logică matematică'],
      ['p', 'O **propoziție** este un enunț care poate fi doar adevărat (1) sau fals (0). Conectori: negația `¬p`, conjuncția `p ∧ q` („și”), disjuncția `p ∨ q` („sau”), implicația `p → q`, echivalența `p ↔ q`.'],
      ['p', 'Implicația `p → q` este **falsă doar când p este adevărat și q fals**. Echivalența este adevărată când p și q au aceeași valoare de adevăr.'],
      ['p', '**Cuantificatori:** `∀` („oricare ar fi”) și `∃` („există”). Negarea lor: `¬(∀x, P(x)) ≡ ∃x, ¬P(x)` și `¬(∃x, P(x)) ≡ ∀x, ¬P(x)`.'],
      ['h', 'Inducția matematică'],
      ['p', 'Pentru a arăta că `P(n)` este adevărată pentru orice `n ≥ n₀`: **(1)** verifici `P(n₀)`; **(2)** presupui `P(k)` adevărată și demonstrezi `P(k+1)`.'],
      ['ex', 'Demonstrăm 1 + 2 + … + n = n(n+1)/2.\nn = 1: 1 = 1·2/2 ✓\nPresupunem pentru k. Atunci pentru k+1:\n1 + … + k + (k+1) = k(k+1)/2 + (k+1) = (k+1)(k+2)/2 ✓']
    ] },

  { id: 'm2', s: 'mate', n: '02', title: 'Numere reale: intervale, modul, radicali', blurb: 'Intervale, valoare absolută, partea întreagă și fracționară, radicali.',
    ask: 'Cum rezolv ecuații cu modul și cum folosesc partea întreagă?',
    body: [
      ['p', 'Mulțimile de numere: `ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ`. Numerele reale care nu sunt raționale (`√2`, `π`) se numesc **iraționale**.'],
      ['h', 'Intervale'],
      ['p', 'Paranteza rotundă **exclude** capătul, cea pătrată îl **include**. La ±∞ paranteza este mereu rotundă.'],
      ['ul', ['`[a, b]` = {x | a ≤ x ≤ b}', '`(a, b)` = {x | a < x < b}', '`[a, ∞)` = {x | x ≥ a} · `(−∞, b)` = {x | x < b}']],
      ['h', 'Modulul'],
      ['f', '|x| = x dacă x ≥ 0   ·   |x| = −x dacă x < 0'],
      ['ul', ['`|a·b| = |a|·|b|` și `|a + b| ≤ |a| + |b|`', '`|x − a| = b` (b ≥ 0) ⇒ `x = a ± b`', '`|x − a| < b` ⇒ `x ∈ (a − b, a + b)`', '`|x − a| > b` ⇒ `x ∈ (−∞, a − b) ∪ (a + b, ∞)`']],
      ['ex', '|x − 2| = 3 ⇒ x = 5 sau x = −1\n|2x − 1| < 5 ⇒ −5 < 2x − 1 < 5 ⇒ −2 < x < 3 ⇒ x ∈ (−2, 3)'],
      ['h', 'Partea întreagă și partea fracționară'],
      ['p', '`[x]` este cel mai mare întreg `≤ x`; `{x} = x − [x] ∈ [0, 1)`.'],
      ['ex', '[3,7] = 3 · {3,7} = 0,7 · [−2,5] = −3 · {−2,5} = 0,5'],
      ['h', 'Radicali'],
      ['f', '√(a·b) = √a·√b   ·   √(a²) = |a|   ·   √(a/b) = √a/√b'],
      ['ex', '√50 = √(25·2) = 5√2\nRaționalizare: 6/√3 = 6√3/3 = 2√3']
    ] },

  { id: 'm3', s: 'mate', n: '03', title: 'Șiruri. Progresii aritmetice', blurb: 'Șiruri de numere, monotonie, termenul general și suma într-o progresie aritmetică.',
    ask: 'Explică progresiile aritmetice cu formule și un exemplu',
    body: [
      ['p', 'Un **șir** este o funcție definită pe numerele naturale: `a₁, a₂, a₃, …`. Se poate da prin **formula termenului general** (`aₙ = 2n + 1`) sau prin **recurență** (`a₁ = 3`, `aₙ₊₁ = aₙ + 5`).'],
      ['p', 'Șirul este **crescător** dacă `aₙ₊₁ ≥ aₙ` pentru orice n și **descrescător** dacă `aₙ₊₁ ≤ aₙ`.'],
      ['h', 'Progresia aritmetică'],
      ['p', 'Fiecare termen se obține din precedentul adunând aceeași **rație** `r`: `aₙ₊₁ = aₙ + r`.'],
      ['f', 'aₙ = a₁ + (n − 1)·r        Sₙ = n·(a₁ + aₙ)/2        aₙ = (aₙ₋₁ + aₙ₊₁)/2'],
      ['ul', ['r > 0: șir crescător; r < 0: șir descrescător.', 'Trei numere a, b, c sunt în progresie aritmetică dacă și numai dacă `2b = a + c`.']],
      ['ex', 'a₁ = 3, r = 5 ⇒ a₄ = 3 + 3·5 = 18, a₁₀ = 3 + 9·5 = 48\nS₁₀ = 10·(3 + 48)/2 = 255'],
      ['ex', 'Suma 1 + 2 + … + 100: a₁ = 1, r = 1, n = 100 ⇒ S = 100·101/2 = 5050']
    ] },

  { id: 'm4', s: 'mate', n: '04', title: 'Progresii geometrice', blurb: 'Rația, termenul general și suma unei progresii geometrice.',
    ask: 'Explică progresiile geometrice cu formule și un exemplu',
    body: [
      ['p', 'Fiecare termen se obține din precedentul **înmulțind** cu aceeași **rație** `q`: `bₙ₊₁ = bₙ · q`.'],
      ['f', 'bₙ = b₁ · qⁿ⁻¹        Sₙ = b₁ · (qⁿ − 1)/(q − 1), q ≠ 1        bₙ² = bₙ₋₁ · bₙ₊₁'],
      ['ul', ['Dacă q = 1, toți termenii sunt egali și `Sₙ = n·b₁`.', 'Trei numere nenule a, b, c sunt în progresie geometrică dacă `b² = a·c`.']],
      ['ex', 'b₁ = 2, q = 3: b₄ = 2·3³ = 54, S₄ = 2·(3⁴ − 1)/2 = 80   (verificare: 2 + 6 + 18 + 54 = 80)'],
      ['ex', 'Suma 1 + 2 + 4 + 8 + 16 = 1·(2⁵ − 1)/(2 − 1) = 31']
    ] },

  { id: 'm5', s: 'mate', n: '05', title: 'Funcții: noțiuni fundamentale', blurb: 'Domeniu, grafic, injectivitate, paritate, compunere.',
    ask: 'Explică noțiunile fundamentale despre funcții: injectivă, surjectivă, pară, compunere',
    body: [
      ['p', 'O **funcție** `f : A → B` asociază fiecărui element `x ∈ A` exact un element `f(x) ∈ B`. `A` este **domeniul**, `B` este **codomeniul**, iar mulțimea valorilor luate este **imaginea** `Im f`. **Graficul** este mulțimea punctelor `(x, f(x))`.'],
      ['h', 'Tipuri de funcții'],
      ['ul', ['**Injectivă:** `x₁ ≠ x₂ ⇒ f(x₁) ≠ f(x₂)` (valori diferite pentru argumente diferite).', '**Surjectivă:** `Im f = B` (fiecare element din B este atins).', '**Bijectivă:** injectivă și surjectivă; are **funcție inversă** `f⁻¹`.']],
      ['h', 'Paritate și monotonie'],
      ['ul', ['**Pară:** `f(−x) = f(x)` (graficul este simetric față de Oy), ex: `x²`.', '**Impară:** `f(−x) = −f(x)` (simetrie față de origine), ex: `x³`.', '**Crescătoare:** `x₁ < x₂ ⇒ f(x₁) ≤ f(x₂)`; **descrescătoare:** inegalitatea se inversează.']],
      ['h', 'Compunerea funcțiilor'],
      ['f', '(g ∘ f)(x) = g(f(x))'],
      ['ex', 'f(x) = 2x + 1, g(x) = x²\n(g ∘ f)(x) = (2x + 1)²   ·   (f ∘ g)(x) = 2x² + 1   — compunerea nu este comutativă'],
      ['ex', 'Funcția inversă a lui f(x) = 2x + 1: scrii y = 2x + 1, scoți x = (y − 1)/2 ⇒ f⁻¹(x) = (x − 1)/2']
    ] },

  { id: 'm6', s: 'mate', n: '06', title: 'Funcția de gradul I', blurb: 'Dreapta, panta, semnul și monotonia, intersecția cu axele.',
    ask: 'Explică funcția de gradul I, panta și cum aflu ecuația dreptei prin două puncte',
    body: [
      ['p', '`f(x) = ax + b`, cu `a ≠ 0`. Graficul este o **dreaptă**. `a` este **panta**, iar `b` este ordonata la origine (punctul `(0, b)`).'],
      ['ul', ['`a > 0` ⇒ funcția este strict crescătoare; `a < 0` ⇒ strict descrescătoare.', 'Intersecția cu Ox: `ax + b = 0 ⇒ x = −b/a`. Intersecția cu Oy: `(0, b)`.', 'Semnul: `f(x)` are semnul lui `a` la dreapta rădăcinii și semn opus la stânga.']],
      ['h', 'Dreapta prin două puncte'],
      ['f', 'a = (y₂ − y₁)/(x₂ − x₁)   apoi b din y₁ = a·x₁ + b'],
      ['ex', 'A(0, 4), B(1, 6): a = (6 − 4)/(1 − 0) = 2, b = 4 ⇒ f(x) = 2x + 4'],
      ['h', 'Inecuații'],
      ['p', '`ax + b > 0`: dacă `a > 0`, `x > −b/a`; dacă `a < 0`, sensul inegalității se **inversează**: `x < −b/a`.'],
      ['ex', '−2x + 6 > 0 ⇒ −2x > −6 ⇒ x < 3 ⇒ x ∈ (−∞, 3)']
    ] },

  { id: 'm7', s: 'mate', n: '07', title: 'Funcția și ecuația de gradul II', blurb: 'Discriminant, rădăcini, vârf, Viète, semnul funcției.',
    ask: 'Explică funcția de gradul II, discriminantul și relațiile lui Viète',
    lab: true,
    body: [
      ['p', '`f(x) = ax² + bx + c`, `a ≠ 0`. Graficul este o **parabolă**: ramuri în sus pentru `a > 0`, în jos pentru `a < 0`.'],
      ['h', 'Ecuația ax² + bx + c = 0'],
      ['f', 'Δ = b² − 4ac        x₁,₂ = (−b ± √Δ) / 2a'],
      ['ul', ['`Δ > 0`: două rădăcini reale distincte.', '`Δ = 0`: o rădăcină dublă `x = −b/2a`.', '`Δ < 0`: nu are rădăcini reale.']],
      ['h', 'Relațiile lui Viète'],
      ['f', 'x₁ + x₂ = −b/a        x₁ · x₂ = c/a'],
      ['h', 'Vârful, forma canonică, imaginea'],
      ['f', 'V(−b/2a , −Δ/4a)        f(x) = a(x − x_V)² + y_V'],
      ['ul', ['Dacă `a > 0`: minim `y_V`, `Im f = [y_V, ∞)`.', 'Dacă `a < 0`: maxim `y_V`, `Im f = (−∞, y_V]`.', 'Axa de simetrie: dreapta `x = −b/2a`.']],
      ['h', 'Semnul funcției'],
      ['p', 'Între rădăcini `f` are semn **contrar** lui `a`, iar în afara rădăcinilor are semnul lui `a`. Pentru `Δ < 0`, `f` are mereu semnul lui `a`.'],
      ['ex', 'x² − 5x + 6 = 0: Δ = 25 − 24 = 1, x = (5 ± 1)/2 ⇒ x ∈ {2, 3}; V(2,5; −0,25)\nx² − 5x + 6 < 0 ⇒ x ∈ (2, 3)']
    ] },

  { id: 'm8', s: 'mate', n: '08', title: 'Vectori în plan', blurb: 'Operații cu vectori, coliniaritate, coordonate, distanță, centrul de greutate.',
    ask: 'Explică vectorii în plan: sumă, coordonate, distanță, mijloc, centrul de greutate',
    body: [
      ['p', 'Un **vector** `vec(AB)` are direcție, sens și lungime (modul) `|vec(AB)|`. Doi vectori sunt egali dacă au aceeași direcție, același sens și același modul.'],
      ['ul', ['**Suma:** regula triunghiului `vec(AB) + vec(BC) = vec(AC)` și regula paralelogramului.', '**Înmulțirea cu un scalar:** `k·vec(v)` are modulul `|k|·|vec(v)|`; pentru `k < 0` sensul se inversează.', '**Coliniari:** `vec(u) = k·vec(v)` pentru un număr real k.', 'Relația lui Chasles: `vec(AB) + vec(BC) = vec(AC)`.']],
      ['h', 'Vectori în coordonate'],
      ['f', 'vec(AB) = (x_B − x_A , y_B − y_A)        |vec(AB)| = √((x_B − x_A)² + (y_B − y_A)²)'],
      ['ul', ['Adunare pe componente: `(a, b) + (c, d) = (a + c, b + d)`; `k·(a, b) = (ka, kb)`.', 'Mijlocul segmentului AB: `M((x_A + x_B)/2 , (y_A + y_B)/2)`.', 'Centrul de greutate al triunghiului ABC: `G((x_A + x_B + x_C)/3 , (y_A + y_B + y_C)/3)`.', 'Vectorii `(a, b)` și `(c, d)` sunt coliniari ⇔ `a·d − b·c = 0`.']],
      ['ex', 'A(0, 0), B(3, 4): vec(AB) = (3, 4), |vec(AB)| = √(9 + 16) = 5, mijlocul = (1,5; 2)'],
      ['ex', 'A(0,0), B(6,0), C(0,3) ⇒ G = ((0+6+0)/3 , (0+0+3)/3) = (2, 1)']
    ] },

  { id: 'm9', s: 'mate', n: '09', title: 'Trigonometrie: cercul trigonometric', blurb: 'Sinus, cosinus, tangentă, valori remarcabile, reducerea la primul cadran.',
    ask: 'Explică sin, cos și tg în triunghiul dreptunghic și valorile remarcabile',
    body: [
      ['p', 'În triunghiul dreptunghic, pentru unghiul ascuțit `x`:'],
      ['f', 'sin x = cateta opusă / ipotenuza   ·   cos x = cateta alăturată / ipotenuza   ·   tg x = opusă / alăturată'],
      ['h', 'Valori remarcabile'],
      ['code', 'x        0°    30°     45°     60°     90°\nsin x    0     1/2     √2/2    √3/2    1\ncos x    1     √3/2    √2/2    1/2     0\ntg x     0     √3/3    1       √3      —'],
      ['h', 'Cercul trigonometric'],
      ['p', 'Cercul de rază 1 centrat în origine: unghiului `x` îi corespunde punctul `(cos x, sin x)`. Radianii: `180° = π rad`, deci `30° = π/6`, `45° = π/4`, `60° = π/3`, `90° = π/2`.'],
      ['ul', ['Cadranul I: sin, cos, tg pozitive. Cadranul II: doar sin pozitiv. Cadranul III: doar tg pozitiv. Cadranul IV: doar cos pozitiv.', 'Reducere la primul cadran: `sin(180° − x) = sin x`, `cos(180° − x) = −cos x`, `tg(180° − x) = −tg x`.']],
      ['ex', 'sin 150° = sin(180° − 30°) = sin 30° = 1/2\ncos 120° = −cos 60° = −1/2']
    ] },

  { id: 'm10', s: 'mate', n: '10', title: 'Formule trigonometrice și aplicații în geometrie', blurb: 'Relația fundamentală, teorema sinusurilor, teorema cosinusului, aria triunghiului.',
    ask: 'Explică teorema sinusurilor și teorema cosinusului cu exemple',
    body: [
      ['f', 'sin²x + cos²x = 1        tg x = sin x / cos x'],
      ['h', 'Teoreme într-un triunghi oarecare ABC'],
      ['ul', ['**Teorema cosinusului:** `a² = b² + c² − 2bc·cos A` (generalizează Pitagora; pentru A = 90° dă `a² = b² + c²`).', '**Teorema sinusurilor:** `a / sin A = b / sin B = c / sin C = 2R` (R = raza cercului circumscris).', '**Aria:** `S = (1/2)·b·c·sin A`.']],
      ['ex', 'b = 3, c = 4, A = 60°: a² = 9 + 16 − 2·3·4·(1/2) = 13 ⇒ a = √13\nAria = (1/2)·3·4·sin 60° = 6·(√3/2) = 3√3'],
      ['ex', 'Dacă sin x = 3/5 și x este ascuțit: cos²x = 1 − 9/25 = 16/25 ⇒ cos x = 4/5, tg x = 3/4']
    ] },

  /* ===================== INFORMATICĂ ===================== */
  { id: 'i1', s: 'info', n: '11', title: 'Structura unui program C++, variabile și tipuri', blurb: 'Programul minimal, citire/afișare, tipurile de date.',
    ask: 'Explică structura unui program C++ și tipurile de date',
    body: [
      ['p', 'Un program C++ începe execuția din funcția `main`. Mai jos este un program care citește două numere și afișează suma lor.'],
      ['code', '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;          // citire\n    cout << a + b << "\\n";  // afișare\n    return 0;\n}'],
      ['h', 'Tipuri de date'],
      ['code', 'int         întreg (≈ ±2·10⁹)         int n = 25;\nlong long   întreg mare (≈ ±9·10¹⁸)    long long s = 3000000000LL;\ndouble      real                       double x = 3.14;\nchar        un caracter                char c = \'A\';\nbool        adevărat / fals            bool ok = true;'],
      ['p', 'O **variabilă** trebuie declarată înainte de folosire și are un tip. Numele începe cu literă sau `_`, conține litere, cifre, `_`, și nu poate fi cuvânt rezervat (`int`, `for`…). C++ face diferența între litere mari și mici.'],
      ['ex', 'Aria dreptunghiului:\ndouble L, l; cin >> L >> l; cout << L * l;']
    ] },

  { id: 'i2', s: 'info', n: '12', title: 'Operatori și expresii', blurb: 'Aritmetici, relaționali, logici; împărțirea întreagă; incrementarea.',
    ask: 'Explică diferența dintre / și % și cum funcționează ++ și operatorii logici',
    body: [
      ['ul', ['**Aritmetici:** `+ - * / %`. La `int / int` rezultatul este **întreg**: `7 / 2 = 3`; restul: `7 % 2 = 1`.', '**Relaționali:** `< <= > >= == !=` (rezultat `true`/`false`, adică 1/0).', '**Logici:** `&&` (și), `||` (sau), `!` (non).', '**Atribuire:** `=`, iar compusă: `+= -= *= /= %=`.', '**Incrementare:** `i++` (folosește apoi crește), `++i` (crește apoi folosește).']],
      ['f', '= atribuie · == compară   (o greșeală frecventă este să le confunzi)'],
      ['p', '**Conversii:** pentru rezultat real, cel puțin un operand trebuie să fie real: `7 / 2.0 = 3.5`, `(double)7 / 2 = 3.5`.'],
      ['p', '**Prioritate:** `!` > `* / %` > `+ -` > relaționali > `&&` > `||` > atribuire. Parantezele o schimbă.'],
      ['ex', 'int a = 5; int b = a++;   // b = 5, a = 6\nint c = 7 % 3;           // 1\nbool v = (3 > 2) && !(4 < 1);  // true'],
      ['code', '// n este par?       if (n % 2 == 0)\n// n divizibil cu 3 și 5?   if (n % 3 == 0 && n % 5 == 0)\n// x în [a, b]?        if (x >= a && x <= b)']
    ] },

  { id: 'i3', s: 'info', n: '13', title: 'Structura de decizie: if-else și switch', blurb: 'Ramuri de execuție, condiții compuse, switch.',
    ask: 'Explică if-else și switch în C++, inclusiv break',
    body: [
      ['code', 'if (conditie) {\n    // dacă e adevărată\n} else if (alta) {\n    // altfel, dacă...\n} else {\n    // altfel\n}'],
      ['ex', 'Maximul a două numere:\nif (a > b) cout << a; else cout << b;'],
      ['code', '// an bisect: divizibil cu 4, dar nu cu 100, sau divizibil cu 400\nif ((an % 4 == 0 && an % 100 != 0) || an % 400 == 0)\n    cout << "bisect";'],
      ['h', 'switch'],
      ['p', 'Alege între mai multe **valori** ale unei expresii întregi/char. Fără `break`, execuția „cade” în cazul următor!'],
      ['code', 'switch (zi) {\n    case 1: cout << "Luni"; break;\n    case 2: cout << "Marti"; break;\n    default: cout << "Alta zi";\n}'],
      ['p', 'Dacă lipsește `break`, după `case 2` se execută și instrucțiunile din `case 3` etc.']
    ] },

  { id: 'i4', s: 'info', n: '14', title: 'Structuri repetitive: while și do-while', blurb: 'Cicluri cu condiție inițială și finală.',
    ask: 'Explică while și do-while și când folosesc fiecare',
    body: [
      ['p', '`while` testează condiția **înainte** de fiecare iterație (poate să nu se execute deloc). `do-while` o testează **după** (corpul se execută cel puțin o dată).'],
      ['code', 'while (n > 0) {          do {\n    c++;                     cin >> x;\n    n /= 10;                 } while (x < 0);   // repetă cât timp x este negativ\n}'],
      ['ex', 'Câte cifre are n?\nint c = 0; while (n > 0) { c++; n /= 10; }   // pentru 1234 ⇒ c = 4'],
      ['ul', ['Ai grijă ca în corp să se schimbe ceva din condiție, altfel ciclul este **infinit**.', '`break;` iese din ciclu; `continue;` trece la următoarea iterație.']],
      ['code', '// citește numere până la 0 și afișează suma lor\nint x, s = 0;\ncin >> x;\nwhile (x != 0) { s += x; cin >> x; }\ncout << s;']
    ] },

  { id: 'i5', s: 'info', n: '15', title: 'Structura repetitivă for', blurb: 'Iterații cu contor: sumă, divizori, factorial.',
    ask: 'Explică for în C++ cu exemple: sumă, divizori, factorial',
    body: [
      ['code', 'for (initializare; conditie; pas)\n    instructiune;\n\nfor (int i = 1; i <= n; i++)  s += i;   // 1 + 2 + ... + n'],
      ['p', 'Se folosește când știi de câte ori repeți. Orice `for` se poate scrie cu `while`. Pasul poate fi altul: `i += 2`, `i--`, `i *= 2`.'],
      ['code', '// divizorii lui n\nfor (int d = 1; d <= n; d++)\n    if (n % d == 0) cout << d << " ";\n\n// factorial\nlong long f = 1;\nfor (int i = 2; i <= n; i++) f *= i;'],
      ['ex', 'for (int i = 0; i < 10; i += 3) se execută pentru i = 0, 3, 6, 9 — 4 iterații.\nfor (int i = 1; i <= 16; i *= 2) — i = 1, 2, 4, 8, 16 — 5 iterații.'],
      ['p', '**Cicluri imbricate:** un `for` în alt `for` (ex.: tabla înmulțirii) — dacă fiecare face n pași, în total sunt `n·n` pași.']
    ] },

  { id: 'i6', s: 'info', n: '16', title: 'Prelucrarea cifrelor unui număr', blurb: 'Suma cifrelor, oglinditul, palindrom, cifra maximă.',
    ask: 'Cum prelucrez cifrele unui număr? Suma cifrelor și oglinditul',
    body: [
      ['p', 'Ideea de bază: `n % 10` este **ultima cifră**, iar `n / 10` **elimină** ultima cifră. Repeți cât timp `n > 0`.'],
      ['code', '// suma cifrelor\nint s = 0;\nwhile (n > 0) { s += n % 10; n /= 10; }\n\n// oglinditul numărului\nint og = 0;\nwhile (n > 0) { og = og * 10 + n % 10; n /= 10; }\n\n// cifra maximă\nint mx = 0;\nwhile (n > 0) { if (n % 10 > mx) mx = n % 10; n /= 10; }'],
      ['ex', 'n = 4725: suma = 5 + 2 + 7 + 4 = 18; oglinditul = 5274'],
      ['p', '**Palindrom:** un număr egal cu oglinditul lui (121, 1331). Salvezi `n` într-o copie înainte să-l modifici!']
    ] },

  { id: 'i7', s: 'info', n: '17', title: 'Divizibilitate și numere prime', blurb: 'Divizori, test de primalitate, descompunere în factori primi, ciurul lui Eratostene.',
    ask: 'Explică testul de primalitate, descompunerea în factori primi și ciurul lui Eratostene',
    body: [
      ['p', 'Un număr `n > 1` este **prim** dacă are exact doi divizori: 1 și n. Este suficient să căutăm divizori până la `√n` (dacă `d | n`, atunci și `n/d | n`, iar unul dintre ei este `≤ √n`).'],
      ['code', 'bool prim(int n) {\n    if (n < 2) return false;\n    for (int d = 2; d * d <= n; d++)\n        if (n % d == 0) return false;\n    return true;\n}'],
      ['h', 'Descompunerea în factori primi'],
      ['code', 'for (int d = 2; d * d <= n; d++) {\n    int e = 0;\n    while (n % d == 0) { n /= d; e++; }\n    if (e) cout << d << "^" << e << " ";\n}\nif (n > 1) cout << n;   // a rămas un factor prim'],
      ['ex', '360 = 2³ · 3² · 5'],
      ['h', 'Ciurul lui Eratostene'],
      ['p', 'Găsește toate numerele prime până la `N`: marchezi multiplii fiecărui prim ca neprimi.'],
      ['code', 'bool nu[1001] = {};\nfor (int i = 2; i * i <= N; i++)\n    if (!nu[i])\n        for (int j = i * i; j <= N; j += i) nu[j] = true;\n// i este prim dacă i >= 2 și !nu[i]'],
      ['p', 'Primele numere prime: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 (între 1 și 20 sunt 8).']
    ] },

  { id: 'i8', s: 'info', n: '18', title: 'Algoritmul lui Euclid (cmmdc și cmmmc)', blurb: 'Cel mai mare divizor comun, cel mai mic multiplu comun, fracții ireductibile.',
    ask: 'Explică algoritmul lui Euclid pas cu pas',
    body: [
      ['p', '**Euclid:** `cmmdc(a, b) = cmmdc(b, a % b)`, iar `cmmdc(a, 0) = a`. Se repetă până când restul devine 0; ultimul rest nenul este cmmdc.'],
      ['code', 'int cmmdc(int a, int b) {\n    while (b != 0) {\n        int r = a % b;\n        a = b;\n        b = r;\n    }\n    return a;\n}'],
      ['f', 'cmmmc(a, b) = a / cmmdc(a, b) * b        (împarte întâi, ca să eviți depășirea)'],
      ['ex', 'cmmdc(48, 36): 48 = 1·36 + 12 ; 36 = 3·12 + 0 ⇒ cmmdc = 12, cmmmc = 144'],
      ['ul', ['Numere **prime între ele**: `cmmdc(a, b) = 1`.', 'Fracție **ireductibilă**: împarți numărătorul și numitorul la cmmdc.']]
    ] },

  { id: 'i9', s: 'info', n: '19', title: 'Tablouri unidimensionale (vectori)', blurb: 'Declarare, citire, parcurgere, sumă, maxim, căutare.',
    ask: 'Cum parcurg un vector și cum găsesc maximul și numărul de apariții?',
    body: [
      ['p', 'Un vector memorează mai multe valori de același tip. `int v[100];` — elementele sunt `v[0], v[1], …, v[99]`. **Indexarea începe de la 0**; accesarea în afara limitelor produce erori greu de găsit.'],
      ['code', 'int n, v[100];\ncin >> n;\nfor (int i = 0; i < n; i++) cin >> v[i];\n\nint mx = v[0], s = 0;\nfor (int i = 0; i < n; i++) {\n    s += v[i];\n    if (v[i] > mx) mx = v[i];\n}\ncout << "suma " << s << ", maxim " << mx;'],
      ['h', 'Căutare liniară'],
      ['code', 'bool gasit = false;\nfor (int i = 0; i < n && !gasit; i++)\n    if (v[i] == x) gasit = true;'],
      ['p', 'Numărarea elementelor cu o proprietate: `int c = 0; for (...) if (v[i] % 2 == 0) c++;`. Parcurgerea durează **O(n)**.']
    ] },

  { id: 'i10', s: 'info', n: '20', title: 'Operații pe vectori: inserare, ștergere, permutări', blurb: 'Inserarea și ștergerea unui element, inversarea, deplasarea circulară.',
    ask: 'Cum inserez și șterg un element dintr-un vector? Cum fac o permutare circulară?',
    body: [
      ['code', '// ștergerea elementului de pe poziția k\nfor (int i = k; i < n - 1; i++) v[i] = v[i + 1];\nn--;\n\n// inserarea valorii x pe poziția k\nfor (int i = n; i > k; i--) v[i] = v[i - 1];\nv[k] = x;\nn++;'],
      ['p', 'La **ștergere** elementele se mută spre stânga (de la `k+1` încolo); la **inserare** se mută spre dreapta, începând de la **sfârșit**, ca să nu se suprascrie valori.'],
      ['code', '// inversarea (oglindirea) vectorului\nfor (int i = 0; i < n / 2; i++) swap(v[i], v[n - 1 - i]);\n\n// permutare circulară la stânga cu o poziție\nint prim = v[0];\nfor (int i = 0; i < n - 1; i++) v[i] = v[i + 1];\nv[n - 1] = prim;'],
      ['ex', 'v = [1, 2, 3, 4, 5] ⇒ după permutarea circulară la stânga: [2, 3, 4, 5, 1]']
    ] },

  { id: 'i11', s: 'info', n: '21', title: 'Sortări: bubble sort și selecție', blurb: 'Două metode simple de sortare și complexitatea O(n²).',
    ask: 'Explică bubble sort și sortarea prin selecție',
    body: [
      ['h', 'Bubble sort (sortarea prin interschimbare)'],
      ['p', 'Compari repetat elementele vecine și le schimbi dacă sunt în ordine greșită. După fiecare trecere, cel mai mare element rămas ajunge la locul lui.'],
      ['code', 'for (int i = 0; i < n - 1; i++)\n    for (int j = 0; j < n - 1 - i; j++)\n        if (v[j] > v[j + 1])\n            swap(v[j], v[j + 1]);'],
      ['ex', '[4, 2, 5, 1] după prima trecere: (4,2) se schimbă → [2,4,5,1]; (4,5) rămân; (5,1) se schimbă → [2, 4, 1, 5]'],
      ['h', 'Sortarea prin selecție'],
      ['p', 'La pasul `i` găsești minimul din `v[i..n−1]` și îl muți pe poziția `i`.'],
      ['code', 'for (int i = 0; i < n - 1; i++) {\n    int p = i;\n    for (int j = i + 1; j < n; j++)\n        if (v[j] < v[p]) p = j;\n    swap(v[i], v[p]);\n}'],
      ['p', 'Ambele au **două cicluri imbricate**, deci complexitatea este `O(n²)`: dublezi n ⇒ timpul se înmulțește cu 4.']
    ] },

  { id: 'i12', s: 'info', n: '22', title: 'Baze de numerație', blurb: 'Conversii între baza 10 și baza 2.',
    ask: 'Cum convertesc un număr din baza 10 în baza 2 și invers?',
    body: [
      ['p', '**10 → 2:** împarți succesiv la 2, notezi resturile și le citești de jos în sus. Pentru 25: 25 : 2 = 12 r **1**; 12 : 2 = 6 r **0**; 6 : 2 = 3 r **0**; 3 : 2 = 1 r **1**; 1 : 2 = 0 r **1** ⇒ `11001`.'],
      ['p', '**2 → 10:** aduni puterile lui 2 corespunzătoare cifrelor 1. `1010₂ = 8 + 2 = 10`.'],
      ['code', '// 10 → 2 (cifrele ies în ordine inversă)\nint b[40], k = 0;\nwhile (n > 0) { b[k++] = n % 2; n /= 2; }\nfor (int i = k - 1; i >= 0; i--) cout << b[i];\n\n// 2 → 10 (cifră cu cifră)\nint r = 0;\nfor (cifra din stânga spre dreapta) r = r * 2 + cifra;'],
      ['ex', '255 în baza 2 = 11111111 · 1011₂ = 8 + 2 + 1 = 11'],
      ['p', 'Încearcă convertorul din [Laborator](#/lab).']
    ] }
];

if (typeof module !== 'undefined') module.exports = { LESSONS };
