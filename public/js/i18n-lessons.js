/* English versions of the lessons (same block structure as lessons.js) */
const LESSONS_EN = {
  m1: { title: 'Sets, logic, induction', blurb: 'Set operations, logical connectives, quantifiers, mathematical induction.', ask: 'Explain sets, mathematical logic and induction to me',
    body: [
      ['p', 'A **set** is a collection of distinct elements written in braces: `A = {1, 2, 3}`. We write `2 ∈ A`, `5 ∉ A`, `B ⊂ A` (B is a subset of A). The set with no elements is `∅`.'],
      ['h', 'Operations on sets'],
      ['ul', ['The union `A ∪ B` = the elements that are in A **or** in B.', 'The intersection `A ∩ B` = the common elements.', 'The difference `A \\ B` = the elements of A that are not in B.', 'The complement with respect to E: `C_E(A) = E \\ A`.', 'The Cartesian product `A × B` = the pairs `(x, y)` with `x ∈ A`, `y ∈ B`; `|A × B| = |A|·|B|`.']],
      ['f', '|A ∪ B| = |A| + |B| − |A ∩ B|      ·      a set with n elements has 2ⁿ subsets'],
      ['ex', 'A = {1, 2, 3, 4}, B = {3, 4, 5}\nA ∩ B = {3, 4} · A ∪ B = {1, 2, 3, 4, 5} · A \\ B = {1, 2} · |A × B| = 12'],
      ['h', 'Mathematical logic'],
      ['p', 'A **proposition** is a statement that is either true (1) or false (0). Connectives: negation `¬p`, conjunction `p ∧ q` (“and”), disjunction `p ∨ q` (“or”), implication `p → q`, equivalence `p ↔ q`.'],
      ['p', 'The implication `p → q` is **false only when p is true and q is false**. The equivalence is true when p and q have the same truth value.'],
      ['p', '**Quantifiers:** `∀` (“for all”) and `∃` (“there exists”). Their negation: `¬(∀x, P(x)) ≡ ∃x, ¬P(x)` and `¬(∃x, P(x)) ≡ ∀x, ¬P(x)`.'],
      ['h', 'Mathematical induction'],
      ['p', 'To show that `P(n)` is true for every `n ≥ n₀`: **(1)** check `P(n₀)`; **(2)** assume `P(k)` is true and prove `P(k+1)`.'],
      ['ex', 'We prove 1 + 2 + … + n = n(n+1)/2.\nn = 1: 1 = 1·2/2 ✓\nAssume it holds for k. Then for k+1:\n1 + … + k + (k+1) = k(k+1)/2 + (k+1) = (k+1)(k+2)/2 ✓']
    ] },

  m2: { title: 'Real numbers: intervals, absolute value, radicals', blurb: 'Intervals, absolute value, integer and fractional part, radicals.', ask: 'How do I solve absolute value equations and use the integer part?',
    body: [
      ['p', 'Number sets: `ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ`. Real numbers that are not rational (`√2`, `π`) are called **irrational**.'],
      ['h', 'Intervals'],
      ['p', 'A round bracket **excludes** the endpoint, a square bracket **includes** it. At ±∞ the bracket is always round.'],
      ['ul', ['`[a, b]` = {x | a ≤ x ≤ b}', '`(a, b)` = {x | a < x < b}', '`[a, ∞)` = {x | x ≥ a} · `(−∞, b)` = {x | x < b}']],
      ['h', 'Absolute value'],
      ['f', '|x| = x if x ≥ 0   ·   |x| = −x if x < 0'],
      ['ul', ['`|a·b| = |a|·|b|` and `|a + b| ≤ |a| + |b|`', '`|x − a| = b` (b ≥ 0) ⇒ `x = a ± b`', '`|x − a| < b` ⇒ `x ∈ (a − b, a + b)`', '`|x − a| > b` ⇒ `x ∈ (−∞, a − b) ∪ (a + b, ∞)`']],
      ['ex', '|x − 2| = 3 ⇒ x = 5 or x = −1\n|2x − 1| < 5 ⇒ −5 < 2x − 1 < 5 ⇒ −2 < x < 3 ⇒ x ∈ (−2, 3)'],
      ['h', 'Integer part and fractional part'],
      ['p', '`[x]` is the greatest integer `≤ x`; `{x} = x − [x] ∈ [0, 1)`.'],
      ['ex', '[3.7] = 3 · {3.7} = 0.7 · [−2.5] = −3 · {−2.5} = 0.5'],
      ['h', 'Radicals'],
      ['f', '√(a·b) = √a·√b   ·   √(a²) = |a|   ·   √(a/b) = √a/√b'],
      ['ex', '√50 = √(25·2) = 5√2\nRationalising: 6/√3 = 6√3/3 = 2√3']
    ] },

  m3: { title: 'Sequences. Arithmetic progressions', blurb: 'Sequences of numbers, monotonicity, general term and sum of an arithmetic progression.', ask: 'Explain arithmetic progressions with formulas and an example',
    body: [
      ['p', 'A **sequence** is a function defined on the natural numbers: `a₁, a₂, a₃, …`. It can be given by a **general term formula** (`aₙ = 2n + 1`) or by **recurrence** (`a₁ = 3`, `aₙ₊₁ = aₙ + 5`).'],
      ['p', 'A sequence is **increasing** if `aₙ₊₁ ≥ aₙ` for every n and **decreasing** if `aₙ₊₁ ≤ aₙ`.'],
      ['h', 'The arithmetic progression'],
      ['p', 'Each term is obtained from the previous one by adding the same **common difference** `r`: `aₙ₊₁ = aₙ + r`.'],
      ['f', 'aₙ = a₁ + (n − 1)·r        Sₙ = n·(a₁ + aₙ)/2        aₙ = (aₙ₋₁ + aₙ₊₁)/2'],
      ['ul', ['r > 0: increasing sequence; r < 0: decreasing sequence.', 'Three numbers a, b, c are in arithmetic progression if and only if `2b = a + c`.']],
      ['ex', 'a₁ = 3, r = 5 ⇒ a₄ = 3 + 3·5 = 18, a₁₀ = 3 + 9·5 = 48\nS₁₀ = 10·(3 + 48)/2 = 255'],
      ['ex', 'The sum 1 + 2 + … + 100: a₁ = 1, r = 1, n = 100 ⇒ S = 100·101/2 = 5050']
    ] },

  m4: { title: 'Geometric progressions', blurb: 'The ratio, the general term and the sum of a geometric progression.', ask: 'Explain geometric progressions with formulas and an example',
    body: [
      ['p', 'Each term is obtained from the previous one by **multiplying** by the same **ratio** `q`: `bₙ₊₁ = bₙ · q`.'],
      ['f', 'bₙ = b₁ · qⁿ⁻¹        Sₙ = b₁ · (qⁿ − 1)/(q − 1), q ≠ 1        bₙ² = bₙ₋₁ · bₙ₊₁'],
      ['ul', ['If q = 1, all terms are equal and `Sₙ = n·b₁`.', 'Three non-zero numbers a, b, c are in geometric progression if `b² = a·c`.']],
      ['ex', 'b₁ = 2, q = 3: b₄ = 2·3³ = 54, S₄ = 2·(3⁴ − 1)/2 = 80   (check: 2 + 6 + 18 + 54 = 80)'],
      ['ex', 'The sum 1 + 2 + 4 + 8 + 16 = 1·(2⁵ − 1)/(2 − 1) = 31']
    ] },

  m5: { title: 'Functions: fundamental notions', blurb: 'Domain, graph, injectivity, parity, composition.', ask: 'Explain the fundamental notions about functions: injective, surjective, even, composition',
    body: [
      ['p', 'A **function** `f : A → B` assigns to every element `x ∈ A` exactly one element `f(x) ∈ B`. `A` is the **domain**, `B` is the **codomain**, and the set of values taken is the **image** `Im f`. The **graph** is the set of points `(x, f(x))`.'],
      ['h', 'Types of functions'],
      ['ul', ['**Injective:** `x₁ ≠ x₂ ⇒ f(x₁) ≠ f(x₂)` (different values for different arguments).', '**Surjective:** `Im f = B` (every element of B is reached).', '**Bijective:** injective and surjective; it has an **inverse function** `f⁻¹`.']],
      ['h', 'Parity and monotonicity'],
      ['ul', ['**Even:** `f(−x) = f(x)` (the graph is symmetric about Oy), e.g. `x²`.', '**Odd:** `f(−x) = −f(x)` (symmetric about the origin), e.g. `x³`.', '**Increasing:** `x₁ < x₂ ⇒ f(x₁) ≤ f(x₂)`; **decreasing:** the inequality is reversed.']],
      ['h', 'Composition of functions'],
      ['f', '(g ∘ f)(x) = g(f(x))'],
      ['ex', 'f(x) = 2x + 1, g(x) = x²\n(g ∘ f)(x) = (2x + 1)²   ·   (f ∘ g)(x) = 2x² + 1   — composition is not commutative'],
      ['ex', 'The inverse of f(x) = 2x + 1: write y = 2x + 1, solve for x = (y − 1)/2 ⇒ f⁻¹(x) = (x − 1)/2']
    ] },

  m6: { title: 'The linear function', blurb: 'The line, the slope, the sign and monotonicity, intersection with the axes.', ask: 'Explain the linear function, the slope and how to find the equation of a line through two points',
    body: [
      ['p', '`f(x) = ax + b`, with `a ≠ 0`. Its graph is a **line**. `a` is the **slope** and `b` is the y-intercept (the point `(0, b)`).'],
      ['ul', ['`a > 0` ⇒ the function is strictly increasing; `a < 0` ⇒ strictly decreasing.', 'Intersection with Ox: `ax + b = 0 ⇒ x = −b/a`. Intersection with Oy: `(0, b)`.', 'Sign: `f(x)` has the sign of `a` to the right of the root and the opposite sign to the left.']],
      ['h', 'The line through two points'],
      ['f', 'a = (y₂ − y₁)/(x₂ − x₁)   then b from y₁ = a·x₁ + b'],
      ['ex', 'A(0, 4), B(1, 6): a = (6 − 4)/(1 − 0) = 2, b = 4 ⇒ f(x) = 2x + 4'],
      ['h', 'Inequalities'],
      ['p', '`ax + b > 0`: if `a > 0`, `x > −b/a`; if `a < 0`, the direction of the inequality is **reversed**: `x < −b/a`.'],
      ['ex', '−2x + 6 > 0 ⇒ −2x > −6 ⇒ x < 3 ⇒ x ∈ (−∞, 3)']
    ] },

  m7: { title: 'The quadratic function and equation', blurb: 'Discriminant, roots, vertex, Viète\'s formulas, sign of the function.', ask: 'Explain the quadratic function, the discriminant and Viète\'s formulas',
    body: [
      ['p', '`f(x) = ax² + bx + c`, `a ≠ 0`. Its graph is a **parabola**: it opens upward for `a > 0` and downward for `a < 0`.'],
      ['h', 'The equation ax² + bx + c = 0'],
      ['f', 'Δ = b² − 4ac        x₁,₂ = (−b ± √Δ) / 2a'],
      ['ul', ['`Δ > 0`: two distinct real roots.', '`Δ = 0`: one double root `x = −b/2a`.', '`Δ < 0`: no real roots.']],
      ['h', "Viète's formulas"],
      ['f', 'x₁ + x₂ = −b/a        x₁ · x₂ = c/a'],
      ['h', 'The vertex, the canonical form, the image'],
      ['f', 'V(−b/2a , −Δ/4a)        f(x) = a(x − x_V)² + y_V'],
      ['ul', ['If `a > 0`: minimum `y_V`, `Im f = [y_V, ∞)`.', 'If `a < 0`: maximum `y_V`, `Im f = (−∞, y_V]`.', 'Axis of symmetry: the line `x = −b/2a`.']],
      ['h', 'The sign of the function'],
      ['p', 'Between the roots `f` has the sign **opposite** to `a`, and outside the roots it has the sign of `a`. For `Δ < 0`, `f` always has the sign of `a`.'],
      ['ex', 'x² − 5x + 6 = 0: Δ = 25 − 24 = 1, x = (5 ± 1)/2 ⇒ x ∈ {2, 3}; V(2.5; −0.25)\nx² − 5x + 6 < 0 ⇒ x ∈ (2, 3)']
    ] },

  m8: { title: 'Vectors in the plane', blurb: 'Operations with vectors, collinearity, coordinates, distance, centroid.', ask: 'Explain vectors in the plane: sum, coordinates, distance, midpoint, centroid',
    body: [
      ['p', 'A **vector** `AB` has a direction, a sense and a length (magnitude) `|AB|`. Two vectors are equal if they have the same direction, the same sense and the same magnitude.'],
      ['ul', ['**Sum:** the triangle rule `AB + BC = AC` and the parallelogram rule.', '**Scalar multiplication:** `k·v` has magnitude `|k|·|v|`; for `k < 0` the sense is reversed.', '**Collinear:** `u = k·v` for a real number k.', "Chasles' relation: `AB + BC = AC`."]],
      ['h', 'Vectors in coordinates'],
      ['f', 'AB = (x_B − x_A , y_B − y_A)        |AB| = √((x_B − x_A)² + (y_B − y_A)²)'],
      ['ul', ['Add component by component: `(a, b) + (c, d) = (a + c, b + d)`; `k·(a, b) = (ka, kb)`.', 'The midpoint of segment AB: `M((x_A + x_B)/2 , (y_A + y_B)/2)`.', 'The centroid of triangle ABC: `G((x_A + x_B + x_C)/3 , (y_A + y_B + y_C)/3)`.', 'The vectors `(a, b)` and `(c, d)` are collinear ⇔ `a·d − b·c = 0`.']],
      ['ex', 'A(0, 0), B(3, 4): AB = (3, 4), |AB| = √(9 + 16) = 5, midpoint = (1.5; 2)'],
      ['ex', 'A(0,0), B(6,0), C(0,3) ⇒ G = ((0+6+0)/3 , (0+0+3)/3) = (2, 1)']
    ] },

  m9: { title: 'Trigonometry: the unit circle', blurb: 'Sine, cosine, tangent, special values, reduction to the first quadrant.', ask: 'Explain sin, cos and tan in a right triangle and the special values',
    body: [
      ['p', 'In a right triangle, for an acute angle `x`:'],
      ['f', 'sin x = opposite / hypotenuse   ·   cos x = adjacent / hypotenuse   ·   tg x = opposite / adjacent'],
      ['h', 'Special values'],
      ['code', 'x        0°    30°     45°     60°     90°\nsin x    0     1/2     √2/2    √3/2    1\ncos x    1     √3/2    √2/2    1/2     0\ntg x     0     √3/3    1       √3      —'],
      ['h', 'The unit circle'],
      ['p', 'The circle of radius 1 centred at the origin: the angle `x` corresponds to the point `(cos x, sin x)`. Radians: `180° = π rad`, so `30° = π/6`, `45° = π/4`, `60° = π/3`, `90° = π/2`.'],
      ['ul', ['Quadrant I: sin, cos, tg positive. Quadrant II: only sin positive. Quadrant III: only tg positive. Quadrant IV: only cos positive.', 'Reduction to the first quadrant: `sin(180° − x) = sin x`, `cos(180° − x) = −cos x`, `tg(180° − x) = −tg x`.']],
      ['ex', 'sin 150° = sin(180° − 30°) = sin 30° = 1/2\ncos 120° = −cos 60° = −1/2']
    ] },

  m10: { title: 'Trigonometric formulas and applications in geometry', blurb: 'The fundamental identity, the law of sines, the law of cosines, the area of a triangle.', ask: 'Explain the law of sines and the law of cosines with examples',
    body: [
      ['f', 'sin²x + cos²x = 1        tg x = sin x / cos x'],
      ['h', 'Theorems in an arbitrary triangle ABC'],
      ['ul', ['**The law of cosines:** `a² = b² + c² − 2bc·cos A` (it generalises Pythagoras; for A = 90° it gives `a² = b² + c²`).', '**The law of sines:** `a / sin A = b / sin B = c / sin C = 2R` (R = radius of the circumscribed circle).', '**Area:** `S = (1/2)·b·c·sin A`.']],
      ['ex', 'b = 3, c = 4, A = 60°: a² = 9 + 16 − 2·3·4·(1/2) = 13 ⇒ a = √13\nArea = (1/2)·3·4·sin 60° = 6·(√3/2) = 3√3'],
      ['ex', 'If sin x = 3/5 and x is acute: cos²x = 1 − 9/25 = 16/25 ⇒ cos x = 4/5, tg x = 3/4']
    ] },

  i1: { title: 'Structure of a C++ program, variables and types', blurb: 'The minimal program, input/output, data types.', ask: 'Explain the structure of a C++ program and the data types',
    body: [
      ['p', 'A C++ program starts executing from the `main` function. Below is a program that reads two numbers and prints their sum.'],
      ['code', '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;          // input\n    cout << a + b << "\\n";  // output\n    return 0;\n}'],
      ['h', 'Data types'],
      ['code', 'int         integer (≈ ±2·10⁹)         int n = 25;\nlong long   large integer (≈ ±9·10¹⁸)  long long s = 3000000000LL;\ndouble      real number                double x = 3.14;\nchar        a single character         char c = \'A\';\nbool        true / false               bool ok = true;'],
      ['p', 'A **variable** must be declared before use and has a type. Its name starts with a letter or `_`, contains letters, digits and `_`, and cannot be a reserved word (`int`, `for`…). C++ is case-sensitive.'],
      ['ex', 'The area of a rectangle:\ndouble L, l; cin >> L >> l; cout << L * l;']
    ] },

  i2: { title: 'Operators and expressions', blurb: 'Arithmetic, relational, logical; integer division; incrementing.', ask: 'Explain the difference between / and % and how ++ and the logical operators work',
    body: [
      ['ul', ['**Arithmetic:** `+ - * / %`. With `int / int` the result is **an integer**: `7 / 2 = 3`; the remainder: `7 % 2 = 1`.', '**Relational:** `< <= > >= == !=` (result `true`/`false`, i.e. 1/0).', '**Logical:** `&&` (and), `||` (or), `!` (not).', '**Assignment:** `=`, and compound: `+= -= *= /= %=`.', '**Increment:** `i++` (use then increase), `++i` (increase then use).']],
      ['f', '= assigns · == compares   (a common mistake is to mix them up)'],
      ['p', '**Conversions:** for a real result, at least one operand must be real: `7 / 2.0 = 3.5`, `(double)7 / 2 = 3.5`.'],
      ['p', '**Precedence:** `!` > `* / %` > `+ -` > relational > `&&` > `||` > assignment. Parentheses change it.'],
      ['ex', 'int a = 5; int b = a++;   // b = 5, a = 6\nint c = 7 % 3;           // 1\nbool v = (3 > 2) && !(4 < 1);  // true'],
      ['code', '// is n even?         if (n % 2 == 0)\n// n divisible by 3 and 5?   if (n % 3 == 0 && n % 5 == 0)\n// x in [a, b]?        if (x >= a && x <= b)']
    ] },

  i3: { title: 'Decision structures: if-else and switch', blurb: 'Branches, compound conditions, switch.', ask: 'Explain if-else and switch in C++, including break',
    body: [
      ['code', 'if (condition) {\n    // if it is true\n} else if (other) {\n    // otherwise, if...\n} else {\n    // otherwise\n}'],
      ['ex', 'The maximum of two numbers:\nif (a > b) cout << a; else cout << b;'],
      ['code', '// leap year: divisible by 4 but not by 100, or divisible by 400\nif ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)\n    cout << "leap";'],
      ['h', 'switch'],
      ['p', 'It chooses between several **values** of an integer/char expression. Without `break`, execution “falls through” to the next case!'],
      ['code', 'switch (day) {\n    case 1: cout << "Monday"; break;\n    case 2: cout << "Tuesday"; break;\n    default: cout << "Another day";\n}'],
      ['p', 'If `break` is missing, after `case 2` the statements of `case 3` etc. are executed as well.']
    ] },

  i4: { title: 'Loops: while and do-while', blurb: 'Loops with an initial and a final condition.', ask: 'Explain while and do-while and when to use each',
    body: [
      ['p', '`while` tests the condition **before** each iteration (it may not run at all). `do-while` tests it **after** (the body runs at least once).'],
      ['code', 'while (n > 0) {          do {\n    c++;                     cin >> x;\n    n /= 10;                 } while (x < 0);   // repeat while x is negative\n}'],
      ['ex', 'How many digits does n have?\nint c = 0; while (n > 0) { c++; n /= 10; }   // for 1234 ⇒ c = 4'],
      ['ul', ['Make sure something in the condition changes inside the body, otherwise the loop is **infinite**.', '`break;` leaves the loop; `continue;` jumps to the next iteration.']],
      ['code', '// read numbers until 0 and print their sum\nint x, s = 0;\ncin >> x;\nwhile (x != 0) { s += x; cin >> x; }\ncout << s;']
    ] },

  i5: { title: 'The for loop', blurb: 'Counter-controlled iterations: sum, divisors, factorial.', ask: 'Explain for in C++ with examples: sum, divisors, factorial',
    body: [
      ['code', 'for (initialisation; condition; step)\n    statement;\n\nfor (int i = 1; i <= n; i++)  s += i;   // 1 + 2 + ... + n'],
      ['p', 'Use it when you know how many times to repeat. Any `for` can be written with `while`. The step can differ: `i += 2`, `i--`, `i *= 2`.'],
      ['code', '// the divisors of n\nfor (int d = 1; d <= n; d++)\n    if (n % d == 0) cout << d << " ";\n\n// factorial\nlong long f = 1;\nfor (int i = 2; i <= n; i++) f *= i;'],
      ['ex', 'for (int i = 0; i < 10; i += 3) runs for i = 0, 3, 6, 9 — 4 iterations.\nfor (int i = 1; i <= 16; i *= 2) — i = 1, 2, 4, 8, 16 — 5 iterations.'],
      ['p', '**Nested loops:** one `for` inside another (e.g. the multiplication table) — if each does n steps, there are `n·n` steps in total.']
    ] },

  i6: { title: 'Processing the digits of a number', blurb: 'Sum of digits, reversal, palindrome, largest digit.', ask: 'How do I process the digits of a number? Sum of digits and reversal',
    body: [
      ['p', 'The basic idea: `n % 10` is the **last digit**, and `n / 10` **removes** the last digit. Repeat while `n > 0`.'],
      ['code', '// sum of digits\nint s = 0;\nwhile (n > 0) { s += n % 10; n /= 10; }\n\n// reverse of the number\nint rev = 0;\nwhile (n > 0) { rev = rev * 10 + n % 10; n /= 10; }\n\n// largest digit\nint mx = 0;\nwhile (n > 0) { if (n % 10 > mx) mx = n % 10; n /= 10; }'],
      ['ex', 'n = 4725: the sum = 5 + 2 + 7 + 4 = 18; the reverse = 5274'],
      ['p', '**Palindrome:** a number equal to its reverse (121, 1331). Save `n` in a copy before modifying it!']
    ] },

  i7: { title: 'Divisibility and prime numbers', blurb: 'Divisors, primality test, prime factorisation, the sieve of Eratosthenes.', ask: 'Explain the primality test, prime factorisation and the sieve of Eratosthenes',
    body: [
      ['p', 'A number `n > 1` is **prime** if it has exactly two divisors: 1 and n. It is enough to look for divisors up to `√n` (if `d | n`, then `n/d | n` too, and one of them is `≤ √n`).'],
      ['code', 'bool prime(int n) {\n    if (n < 2) return false;\n    for (int d = 2; d * d <= n; d++)\n        if (n % d == 0) return false;\n    return true;\n}'],
      ['h', 'Prime factorisation'],
      ['code', 'for (int d = 2; d * d <= n; d++) {\n    int e = 0;\n    while (n % d == 0) { n /= d; e++; }\n    if (e) cout << d << "^" << e << " ";\n}\nif (n > 1) cout << n;   // a prime factor is left'],
      ['ex', '360 = 2³ · 3² · 5'],
      ['h', 'The sieve of Eratosthenes'],
      ['p', 'It finds all the primes up to `N`: mark the multiples of each prime as non-prime.'],
      ['code', 'bool no[1001] = {};\nfor (int i = 2; i * i <= N; i++)\n    if (!no[i])\n        for (int j = i * i; j <= N; j += i) no[j] = true;\n// i is prime if i >= 2 and !no[i]'],
      ['p', 'The first primes: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 (there are 8 between 1 and 20).']
    ] },

  i8: { title: "Euclid's algorithm (GCD and LCM)", blurb: 'Greatest common divisor, least common multiple, irreducible fractions.', ask: "Explain Euclid's algorithm step by step",
    body: [
      ['p', "**Euclid:** `gcd(a, b) = gcd(b, a % b)`, and `gcd(a, 0) = a`. Repeat until the remainder becomes 0; the last non-zero remainder is the gcd."],
      ['code', 'int gcd(int a, int b) {\n    while (b != 0) {\n        int r = a % b;\n        a = b;\n        b = r;\n    }\n    return a;\n}'],
      ['f', 'lcm(a, b) = a / gcd(a, b) * b        (divide first, to avoid overflow)'],
      ['ex', 'gcd(48, 36): 48 = 1·36 + 12 ; 36 = 3·12 + 0 ⇒ gcd = 12, lcm = 144'],
      ['ul', ['**Coprime** numbers: `gcd(a, b) = 1`.', '**Irreducible** fraction: divide the numerator and the denominator by their gcd.']]
    ] },

  i9: { title: 'One-dimensional arrays (vectors)', blurb: 'Declaring, reading, traversing, sum, maximum, searching.', ask: 'How do I traverse an array and find the maximum and the number of occurrences?',
    body: [
      ['p', 'An array stores several values of the same type. `int v[100];` — the elements are `v[0], v[1], …, v[99]`. **Indexing starts at 0**; accessing outside the bounds causes errors that are hard to find.'],
      ['code', 'int n, v[100];\ncin >> n;\nfor (int i = 0; i < n; i++) cin >> v[i];\n\nint mx = v[0], s = 0;\nfor (int i = 0; i < n; i++) {\n    s += v[i];\n    if (v[i] > mx) mx = v[i];\n}\ncout << "sum " << s << ", maximum " << mx;'],
      ['h', 'Linear search'],
      ['code', 'bool found = false;\nfor (int i = 0; i < n && !found; i++)\n    if (v[i] == x) found = true;'],
      ['p', 'Counting the elements with a property: `int c = 0; for (...) if (v[i] % 2 == 0) c++;`. A traversal takes **O(n)**.']
    ] },

  i10: { title: 'Operations on arrays: insertion, deletion, permutations', blurb: 'Inserting and deleting an element, reversing, circular shift.', ask: 'How do I insert and delete an element in an array? How do I do a circular shift?',
    body: [
      ['code', '// deleting the element at position k\nfor (int i = k; i < n - 1; i++) v[i] = v[i + 1];\nn--;\n\n// inserting the value x at position k\nfor (int i = n; i > k; i--) v[i] = v[i - 1];\nv[k] = x;\nn++;'],
      ['p', 'When **deleting**, the elements shift to the left (from `k+1` onward); when **inserting**, they shift to the right, starting from the **end**, so that no values are overwritten.'],
      ['code', '// reversing the array\nfor (int i = 0; i < n / 2; i++) swap(v[i], v[n - 1 - i]);\n\n// circular shift to the left by one position\nint first = v[0];\nfor (int i = 0; i < n - 1; i++) v[i] = v[i + 1];\nv[n - 1] = first;'],
      ['ex', 'v = [1, 2, 3, 4, 5] ⇒ after the circular shift to the left: [2, 3, 4, 5, 1]']
    ] },

  i11: { title: 'Sorting: bubble sort and selection sort', blurb: 'Two simple sorting methods and the O(n²) complexity.', ask: 'Explain bubble sort and selection sort',
    body: [
      ['h', 'Bubble sort (exchange sort)'],
      ['p', 'Repeatedly compare neighbouring elements and swap them if they are in the wrong order. After each pass, the largest remaining element reaches its place.'],
      ['code', 'for (int i = 0; i < n - 1; i++)\n    for (int j = 0; j < n - 1 - i; j++)\n        if (v[j] > v[j + 1])\n            swap(v[j], v[j + 1]);'],
      ['ex', '[4, 2, 5, 1] after the first pass: (4,2) swap → [2,4,5,1]; (4,5) stay; (5,1) swap → [2, 4, 1, 5]'],
      ['h', 'Selection sort'],
      ['p', 'At step `i` find the minimum of `v[i..n−1]` and move it to position `i`.'],
      ['code', 'for (int i = 0; i < n - 1; i++) {\n    int p = i;\n    for (int j = i + 1; j < n; j++)\n        if (v[j] < v[p]) p = j;\n    swap(v[i], v[p]);\n}'],
      ['p', 'Both have **two nested loops**, so the complexity is `O(n²)`: double n ⇒ the time is multiplied by 4.']
    ] },

  i12: { title: 'Number bases', blurb: 'Conversions between base 10 and base 2.', ask: 'How do I convert a number from base 10 to base 2 and back?',
    body: [
      ['p', '**10 → 2:** divide successively by 2, write down the remainders and read them from bottom to top. For 25: 25 : 2 = 12 r **1**; 12 : 2 = 6 r **0**; 6 : 2 = 3 r **0**; 3 : 2 = 1 r **1**; 1 : 2 = 0 r **1** ⇒ `11001`.'],
      ['p', '**2 → 10:** add the powers of 2 that correspond to the digits equal to 1. `1010₂ = 8 + 2 = 10`.'],
      ['code', '// 10 → 2 (the digits come out in reverse order)\nint b[40], k = 0;\nwhile (n > 0) { b[k++] = n % 2; n /= 2; }\nfor (int i = k - 1; i >= 0; i--) cout << b[i];\n\n// 2 → 10 (digit by digit)\nint r = 0;\nfor (digit from left to right) r = r * 2 + digit;'],
      ['ex', '255 in base 2 = 11111111 · 1011₂ = 8 + 2 + 1 = 11'],
      ['p', 'Try the converter in the [Lab](#/lab).']
    ] }
};
