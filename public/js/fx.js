/* Animații: apariție la scroll, numere care urcă, pastila din meniu, lumină pe carduri, confetti.
   Totul este opțional: dacă JS-ul eșuează, conținutul rămâne vizibil. Respectă „reduce motion”. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- apariție la scroll + contor ---------- */
  const REVEAL = '.bento > *, .step, .lesson, .class-card, .asg, .stat, .badge, .lab-grid > .card, .prof-grid > *, .two-col > *, .gate, .inline-form, .arena-grid > *, .chat-side > *, .score-card';
  const COUNT = '.big-n, .stat b, .score-card b, .vs b';
  let io = null;
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target; io.unobserve(el);
        if (el.classList.contains('rv')) {
          el.classList.add('in');
          setTimeout(() => { el.classList.remove('rv', 'in'); el.style.transitionDelay = ''; }, 1100 + (parseFloat(el.style.transitionDelay) || 0) * 1000);
        }
        if (el.dataset.count) countUp(el);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  function countUp(el) {
    const m = /^(\d+)(%?)$/.exec(el.dataset.count); if (!m) return;
    const to = +m[1], suf = m[2], t0 = performance.now(), dur = 900 + Math.min(to, 500);
    const step = t => { const k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = v + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function scan() {
    if (!io) return;
    $$(REVEAL).forEach(el => {
      if (el.dataset.fx || el.closest('#game, .msgs, #bank, #dlist, dialog')) return;
      el.dataset.fx = '1';
      const sibs = [...(el.parentElement ? el.parentElement.children : [])].filter(x => x.matches(REVEAL));
      el.style.transitionDelay = Math.min(sibs.indexOf(el), 8) * 0.07 + 's';
      el.classList.add('rv'); io.observe(el);
    });
    $$(COUNT).forEach(el => {
      if (el.dataset.fx || el.childElementCount || el.closest('#game')) return;
      const m = /^(\d+)(%?)$/.exec(el.textContent.trim()); if (!m) return;
      el.dataset.fx = '1'; el.dataset.count = el.textContent.trim(); el.textContent = '0' + m[2]; io.observe(el);
    });
  }
  let raf = 0;
  const main = $('#main');
  if (main) new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(scan); }).observe(main, { childList: true, subtree: true });

  /* ---------- pastila care alunecă în meniu ---------- */
  const nav = $('#nav');
  let pill = null;
  function placePill() {
    if (!nav) return;
    const a = $('a[aria-current="page"]', nav);
    if (!a) { if (pill) pill.style.opacity = '0'; return; }
    if (!pill) { pill = document.createElement('span'); pill.className = 'nav-pill'; nav.prepend(pill); nav.classList.add('has-pill'); pill.style.transition = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = ''; })); }
    pill.style.opacity = '1';
    pill.style.width = a.offsetWidth + 'px'; pill.style.height = a.offsetHeight + 'px'; pill.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
    const sc = nav.scrollLeft, l = a.offsetLeft - 40; if (Math.abs(sc - l) > 60 && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: l, behavior: reduce ? 'auto' : 'smooth' });
  }
  if (nav) {
    new MutationObserver(placePill).observe(nav, { attributes: true, attributeFilter: ['aria-current'], subtree: true });
    addEventListener('resize', placePill); addEventListener('load', placePill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePill);
    placePill();
  }

  /* ---------- lumină care urmărește mouse-ul pe carduri ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', e => {
      const c = e.target.closest && e.target.closest('.card, .class-card, .lesson');
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------- confetti ---------- */
  let cv = null, ctx = null, parts = [], running = false;
  function confetti(x = innerWidth / 2, y = innerHeight * 0.45, n = 90) {
    if (reduce) return;
    if (!cv) { cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.append(cv); ctx = cv.getContext('2d'); }
    const dpr = devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = ['#d2f53c', '#2f41ff', '#00b89c', '#ff5a36', '#f0eee6', '#11110e'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 5 + Math.random() * 10;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, g: 0.28 + Math.random() * 0.1, w: 6 + Math.random() * 7, h: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length], life: 0 });
    }
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life < 140 && p.y < innerHeight + 30);
    for (const p of parts) {
      p.life++; p.vx *= 0.985; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - p.life / 140);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (parts.length) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  // declanșatori: ecran de victorie, insigne, nivel nou
  const game = $('#v-arena');
  if (game) new MutationObserver(() => {
    const h = $('.result h2', game);
    if (!h || h.dataset.fx) return; h.dataset.fx = '1';
    if (/Ai câștigat|Adversarul a abandonat/.test(h.textContent)) { confetti(innerWidth / 2, innerHeight * 0.4, 140); setTimeout(() => confetti(innerWidth * 0.25, innerHeight * 0.5, 60), 250); setTimeout(() => confetti(innerWidth * 0.75, innerHeight * 0.5, 60), 400); }
  }).observe(game, { childList: true, subtree: true });
  const toasts = $('#toasts');
  if (toasts) new MutationObserver(ms => {
    for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && /Insignă nouă|Nivel \d+ deblocat/.test(n.textContent)) confetti(innerWidth / 2, innerHeight - 90, 70);
  }).observe(toasts, { childList: true });

  window.FX = { confetti, scan };
  scan();
})();
