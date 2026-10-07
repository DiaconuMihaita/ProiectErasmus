/* MathInfo 9 H2H — aplicația (router, stare, vederi, arena) */
(() => {
  'use strict';

  /* =============== utilitare =============== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rand = (a, b) => a + Math.random() * (b - a);
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>';

  /** Notație matematică într-un text deja escapat: x_A → x<sub>A</sub>, a^2 → a<sup>2</sup>, vec(AB) → vector cu săgeată. */
  const mathify = h => h
    .replace(/\bvec\(([A-Za-z]{1,3})\)/g, '<span class="vec">$1</span>')
    .replace(/\b([A-Za-z])_(\{[^}]{1,8}\}|[A-Za-z0-9]{1,3})\b/g, (m, a, b) => a + '<sub>' + b.replace(/[{}]/g, '') + '</sub>')
    .replace(/\^(\{[^}]{1,8}\}|\d{1,3}|[a-z])(?![A-Za-z0-9])/g, (m, e) => '<sup>' + e.replace(/[{}]/g, '') + '</sup>');

  function md(src) {
    const parts = String(src).split(/```/);
    return parts.map((p, i) => {
      if (i % 2) return '<pre><code>' + esc(p.replace(/^\w*\n/, '').replace(/\n$/, '')) + '</code></pre>';
      let t = mathify(esc(p));
      t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
        .replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,])/g, '$1<i>$2</i>');
      const lines = t.split('\n'); let html = '', inList = false, tbl = [];
      const flushTbl = () => {
        if (!tbl.length) return;
        const rows = tbl.filter(r => !/^\|[\s:|-]+\|?$/.test(r.trim())).map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
        html += '<table><thead><tr>' + rows[0].map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>' + rows.slice(1).map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
        tbl = [];
      };
      for (const ln of lines) {
        if (/^\s*\|.*\|\s*$/.test(ln)) { if (inList) { html += '</ul>'; inList = false; } tbl.push(ln); continue; }
        flushTbl();
        const li = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(ln);
        if (li) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + li[1] + '</li>'; }
        else { if (inList) { html += '</ul>'; inList = false; } html += ln + '<br>'; }
      }
      flushTbl();
      if (inList) html += '</ul>';
      return html.replace(/(<br>)+$/, '').replace(/<\/(ul|table)><br>/g, '</$1>').replace(/<br><(table|ul)>/g, '<$1>');
    }).join('');
  }

  const inl = t => mathify(esc(t)).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\((#[^)]+)\)/g, '<a href="$2">$1</a>');
  const blocksHtml = bl => bl.map(([t, c]) =>
    t === 'p' ? `<p>${inl(c)}</p>` : t === 'h' ? `<h4>${esc(c)}</h4>` : t === 'ul' ? `<ul>${c.map(x => `<li>${inl(x)}</li>`).join('')}</ul>`
      : t === 'f' ? `<div class="formula">${mathify(esc(c))}</div>` : t === 'ex' ? `<div class="ex"><span>Exemplu</span>${mathify(esc(c)).replace(/\n/g, '<br>')}</div>`
        : `<pre><code>${esc(c)}</code></pre>`).join('');
  const fmtDate = ms => ms ? new Date(ms).toLocaleDateString(I18N.locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const fmtDT = ms => new Date(ms).toLocaleString(I18N.locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  /* =============== stare =============== */
  const KEY = 'mi9-state-v1';
  const fresh = () => ({
    name: '', xp: 0, done: {}, badges: {}, board: [], chat: [],
    settings: { key: '', model: 'gemini-2.0-flash' },
    stats: { duels: 0, wins: 0, perfect: 0, pvp: 0, correct: 0, answered: 0, bestStreak: 0, aiMsgs: 0 }
  });
  let S = fresh();
  try { const raw = JSON.parse(localStorage.getItem(KEY)); if (raw) { const f = fresh(); S = { ...f, ...raw, stats: { ...f.stats, ...raw.stats }, settings: { ...f.settings, ...raw.settings } }; } } catch (e) { /* ignorat */ }
  let pushT = null;
  const pub = () => { const { settings, chat, ...rest } = S; return rest; };
  const pushNow = () => { if (API.st.user) API.put('/api/me', { data: pub(), xp: S.xp, display: S.name || undefined }).catch(() => { }); };
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignorat */ }
    if (API.st.user) { clearTimeout(pushT); pushT = setTimeout(pushNow, 1500); }
  };
  function mergeServer(d) {
    if (!d || !d.stats) return;
    const maxObj = (a, b) => { const o = { ...a }; for (const k in b) o[k] = Math.max(o[k] || 0, b[k] || 0); return o; };
    S.xp = Math.max(S.xp, d.xp || 0); S.done = { ...S.done, ...(d.done || {}) }; S.badges = { ...S.badges, ...(d.badges || {}) };
    S.stats = maxObj(S.stats, d.stats); if (Array.isArray(d.board) && d.board.length > S.board.length) S.board = d.board;
  }

  const levelOf = xp => Math.floor(xp / 150) + 1;

  function toast(g, text) {
    const el = document.createElement('div');
    el.className = 'toast'; el.innerHTML = `<i>${esc(g)}</i><span>${esc(text)}</span>`;
    $('#toasts').append(el); setTimeout(() => el.remove(), 3700);
  }
  function renderLvl() {
    const l = levelOf(S.xp);
    $('#lvl').innerHTML = `<span>Nv ${l}</span><em>· ${S.xp} XP</em>`;
  }
  function addXP(n) {
    const before = levelOf(S.xp); S.xp += n;
    if (levelOf(S.xp) > before) toast('↑', `Nivel ${levelOf(S.xp)} deblocat!`);
    renderLvl();
  }
  function checkBadges() {
    for (const b of BADGES) if (!S.badges[b.id] && b.ok(S)) { S.badges[b.id] = Date.now(); toast(b.g, `Insignă nouă: ${b.name}`); }
    save(); renderLvl();
  }

  /* =============== router =============== */
  const R = {};
  let current = '';
  function route() {
    const seg = (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0].split('/');
    const r = seg[0];
    const name = R[r] ? r : 'home';
    if (current === 'arena' && name !== 'arena') Arena.abort();
    current = name;
    $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + name));
    $$('#nav a').forEach(a => { if (a.dataset.r === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    R[name](seg.slice(1));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  const go = h => { location.hash = h; };

  /* =============== ACASĂ =============== */
  R.home = () => {
    const doneN = Object.keys(S.done).length, tot = LESSONS.length;
    const ticker = ['x² − 5x + 6 = 0', 'for (i = 0; i < n; i++)', 'Δ = b² − 4ac', 'cmmdc(48, 36) = 12', '√50 = 5√2', 'int main() { }', 'V(−b/2a, −Δ/4a)', '25 → 11001 (baza 2)', '|x − 2| = 3', 'while (n > 0) n /= 10;', 'A ∩ B = {3, 4}', 'O(n²)'];
    const tk = ticker.map(t => `<span>${esc(t)}</span>`).join('');
    $('#v-home').innerHTML = `
      <div class="hero">
        <div class="floaties" aria-hidden="true">
          <span style="--x:72%;--y:2%;--s:130px;--t:8s">∑</span><span style="--x:88%;--y:34%;--s:100px;--t:11s;--d:-3s">π</span>
          <span style="--x:58%;--y:58%;--s:90px;--t:9s;--d:-5s">√</span><span style="--x:80%;--y:72%;--s:120px;--t:12s;--d:-2s">Δ</span>
          <span style="--x:64%;--y:-3%;--s:70px;--t:10s;--d:-6s">∞</span><span style="--x:95%;--y:8%;--s:80px;--t:7s;--d:-1s">{ }</span>
        </div>
        <span class="eyebrow">Liceul Teoretic „Emil Racoviță” Vaslui · clasa a IX-a</span>
        <h1><span>Învață.</span><span class="out">Întreabă.</span><span><i class="hl" style="font-style:normal">Învinge.</i></span></h1>
        <div class="hero-row">
          <p class="lead">Matematică și Informatică într-un singur loc: lecții scurte, un tutor care răspunde oricând și dueluri H2H cu cronometru. Fără meditații plătite, fără frica de greșeală.</p>
          <div class="cta"><a class="btn lime" href="#/arena">Intră în arenă ${ARROW}</a><a class="btn ghost" href="#/tutor">Întreabă tutorul</a></div>
        </div>
      </div>
      <div class="ticker" aria-hidden="true"><div class="ticker-track">${tk}${tk}</div></div>

      <div class="bento">
        <a class="card b-learn" href="#/invata">
          <span class="go">${ARROW}</span><span class="eyebrow">01 · Lecții</span>
          <h3>${tot} lecții cât să le citești în pauză</h3>
          <p>De la mulțimi și funcția de gradul II, până la Euclid, baze de numerație și sortări în C++.</p>
          <div class="prog"><i style="width:${doneN / tot * 100}%"></i></div>
          <p style="margin-top:8px;font:500 13px var(--mono)">${doneN} / ${tot} parcurse</p>
          <div class="glyphs" aria-hidden="true">√</div>
        </a>
        <a class="card b-ai" href="#/tutor">
          <span class="go">${ARROW}</span><span class="eyebrow">02 · Tutor AI</span>
          <h3>Răspunde pe loc, pas cu pas</h3>
          <div class="mini-chat"><div class="me">x² − 5x + 6 = 0</div><div class="ai">Δ = 25 − 24 = <b>1</b>, deci x₁ = <b>2</b> și x₂ = <b>3</b>. Verificare Viète: S = 5, P = 6 ✓</div></div>
        </a>
        <a class="card b-arena" href="#/arena">
          <span class="go">${ARROW}</span><span class="eyebrow">03 · Arena H2H</span>
          <h3>Duel de cunoștințe. 15 secunde pe întrebare.</h3>
          <p>Contra unui rival digital sau față în față cu un coleg, pe același ecran. Răspunsul corect și rapid aduce cele mai multe puncte.</p>
          <div class="vs"><div><small>Tu</small><b>640</b></div><span class="x">VS</span><div><small>Rival</small><b>520</b></div></div>
        </a>
        <a class="card b-lab" href="#/lab">
          <span class="go">${ARROW}</span><span class="eyebrow">04 · Laborator</span>
          <h3>Mișcă parabola</h3>
          <p>Schimbă a, b, c și vezi vârful, discriminantul și rădăcinile live.</p>
          <div class="glyphs" aria-hidden="true">Δ</div>
        </a>
      </div>

      <h2 class="section-h">Cum funcționează</h2>
      <div class="steps">
        <div class="step"><b>01</b><h4>Înveți</h4><p>Citești lecția, vezi exemplul și o marchezi ca învățată pentru XP.</p></div>
        <div class="step"><b>02</b><h4>Întrebi</h4><p>Nu ai înțeles ceva? Scrii ecuația sau întrebarea și primești rezolvarea cu pași.</p></div>
        <div class="step"><b>03</b><h4>Te măsori</h4><p>Intri într-un duel, aduni puncte, deblochezi insigne și urci în clasament.</p></div>
      </div>`;
  };

  /* =============== ÎNVAȚĂ =============== */
  let lessonFilter = 'all';
  R.invata = () => {
    const doneN = Object.keys(S.done).length;
    $('#v-invata').innerHTML = `
      <span class="eyebrow">Programa clasei a IX-a</span>
      <h1 class="page-h">Învață</h1>
      <p class="lead">Lecții scurte, cu exemple. Marchează-le ca învățate (+20 XP) și deblochează insigne.</p>
      <div class="filters">
        <div class="seg" role="group" aria-label="Materie" id="lf">
          <button data-f="all" aria-pressed="${lessonFilter === 'all'}">Toate</button>
          <button data-f="mate" aria-pressed="${lessonFilter === 'mate'}">Matematică</button>
          <button data-f="info" aria-pressed="${lessonFilter === 'info'}">Informatică</button>
        </div>
        <span class="chip" id="lcount">${doneN} / ${LESSONS.length} parcurse</span>
      </div>
      <div class="lessons" id="lessons"></div>`;
    const list = $('#lessons');
    list.innerHTML = LESSONS.filter(l => lessonFilter === 'all' || l.s === lessonFilter).map(l => `
      <details class="lesson ${l.s} ${S.done[l.id] ? 'done' : ''}" id="L-${l.id}">
        <summary>
          <span class="num">${l.n}</span>
          <div><h3>${esc(l.title)}</h3><small>${esc(l.blurb)}</small></div>
          <span class="tick" aria-label="${S.done[l.id] ? 'parcursă' : 'neparcursă'}">${S.done[l.id] ? '✓' : ''}</span>
        </summary>
        <div class="lesson-body">
          <div><span class="chip ${l.s}"><i class="dot"></i>${l.s === 'mate' ? 'Matematică' : 'Informatică'}</span></div>
          ${blocksHtml(l.body)}
          <div class="lesson-actions">
            <button class="btn sm" data-done="${l.id}">${S.done[l.id] ? 'Parcursă ✓ (anulează)' : 'Marchează ca învățată'}</button>
            <button class="btn sm ghost" data-ask="${l.id}">Întreabă AI despre lecție</button>
            ${l.lab ? '<a class="btn sm ghost" href="#/lab">Deschide graficul</a>' : ''}
            <a class="btn sm ghost" href="#/arena" data-subj="${l.s}">Antrenează-te în arenă</a>
          </div>
        </div>
      </details>`).join('');
    $('#lf').onclick = e => { const b = e.target.closest('button'); if (b) { lessonFilter = b.dataset.f; R.invata(); } };
    list.onclick = e => {
      const d = e.target.closest('[data-done]');
      if (d) {
        const id = d.dataset.done, el = $('#L-' + id);
        if (S.done[id]) { delete S.done[id]; } else { S.done[id] = Date.now(); addXP(20); toast('✓', 'Lecție parcursă · +20 XP'); }
        el.classList.toggle('done', !!S.done[id]);
        $('.tick', el).textContent = S.done[id] ? '✓' : '';
        d.textContent = S.done[id] ? 'Parcursă ✓ (anulează)' : 'Marchează ca învățată';
        $('#lcount').textContent = `${Object.keys(S.done).length} / ${LESSONS.length} parcurse`;
        checkBadges(); return;
      }
      const a = e.target.closest('[data-ask]');
      if (a) { const l = LESSONS.find(x => x.id === a.dataset.ask); Tutor.pending = { text: l.ask, lessonId: l.id }; go('#/tutor'); return; }
      const s = e.target.closest('[data-subj]');
      if (s) Arena.subject = s.dataset.subj;
    };
  };

  /* =============== TUTOR =============== */
  let busy = false;
  const SUGGEST = ['x^2 - 5x + 6 = 0', '3x + 2 = 11', '(3 + 4) * 2^3 - sqrt(49)', 'cmmdc 48 36', 'Este 97 număr prim?', 'binar 25', 'Explică-mi discriminantul', 'Cum funcționează bubble sort?', 'Distanța dintre A(0,0) și B(3,4)'];
  R.tutor = () => {
    const host = $('#v-tutor');
    if (!host.dataset.ready) {
      host.dataset.ready = '1';
      host.innerHTML = `
        <span class="eyebrow">Asistent AI · 24/7 · gratuit</span>
        <h1 class="page-h">Tutor AI</h1>
        <p class="lead">Scrie o ecuație, un calcul sau o nelămurire. Rezolv pas cu pas și îți explic de ce.</p>
        <div class="chat-shell">
          <aside class="chat-side">
            <div class="card"><div class="eyebrow">Întreabă despre lecție</div>
              <div class="field" style="margin-top:12px"><label class="sr" for="ctx">Lecție</label><select id="ctx"><option value="">Orice subiect</option>${LESSONS.map(l => `<option value="${l.id}">${esc(l.n + ' · ' + l.title)}</option>`).join('')}</select></div>
              <p class="hint" style="margin-top:8px">Alege o lecție și AI-ul răspunde pornind de la ea.</p></div>
            <div class="card"><div class="eyebrow">Încearcă</div><div class="sugg" id="sugg" style="margin-top:12px">${SUGGEST.map(s => `<button>${esc(s)}</button>`).join('')}</div></div>
          </aside>
          <div class="card chat">
            <div class="chat-head"><div class="st"><i class="live"></i><span id="mode"></span></div>
              <div style="display:flex;gap:6px;align-items:center"><label class="sr" for="depth">Nivel de detaliu</label><select id="depth" class="depth-sel"><option value="short">Scurt</option><option value="detailed">Detaliat</option><option value="deep">Aprofundat</option></select><button class="btn sm ghost" id="clr">Șterge</button><button class="btn sm ghost" id="cfg">⚙ Setări</button></div></div>
            <div class="settings" id="settings">
              <p class="hint">Tutorul local rezolvă ecuații, calcule și algoritmi fără internet. Pentru răspunsuri la orice întrebare, adaugă o cheie gratuită Gemini (de la Google AI Studio). Cheia rămâne doar în browserul tău.</p>
              <div class="field"><label for="gk">Cheie API Gemini</label><input id="gk" type="password" autocomplete="off" placeholder="AIza…"></div>
              <div class="field"><label for="gm">Model</label><input id="gm" type="text" placeholder="gemini-2.5-flash"></div>
              <div style="display:flex;gap:8px"><button class="btn sm" id="gs">Salvează</button><button class="btn sm ghost" id="gc">Șterge cheia</button></div>
            </div>
            <div class="msgs" id="msgs" aria-live="polite"></div>
            <form class="composer" id="form"><label class="sr" for="inp">Mesaj</label><input id="inp" autocomplete="off" placeholder="Scrie aici… ex: x^2 - 4x + 3 = 0"><button class="btn lime" type="submit">Trimite</button></form>
          </div>
        </div>`;
      $('#sugg').onclick = e => { const b = e.target.closest('button'); if (b) send(b.textContent); };
      $('#form').onsubmit = e => { e.preventDefault(); const v = $('#inp').value.trim(); if (v) { $('#inp').value = ''; send(v); } };
      $('#cfg').onclick = () => $('#settings').classList.toggle('on');
      $('#ctx').onchange = e => { ctxLesson = e.target.value; };
      $('#msgs').addEventListener('click', e => {
        const b = e.target.closest('.more'); if (!b) return;
        const c = S.chat[+b.dataset.i]; if (!c || !c.more || busy) return;
        const q = c.more; delete c.more; save();
        send(I18N.t('Explică mai amănunțit: ', 'Explain in more detail: ') + q, { forceAI: true, q });
      });
      $('#depth').onchange = e => { S.settings.depth = e.target.value; save(); };
      $('#clr').onclick = () => { S.chat = []; save(); drawChat(); };
      $('#gs').onclick = () => { S.settings.key = $('#gk').value.trim(); S.settings.model = $('#gm').value.trim() || 'gemini-2.5-flash'; save(); modeLabel(); $('#settings').classList.remove('on'); toast('✓', S.settings.key ? 'Gemini activat' : 'Folosesc tutorul local'); };
      $('#gc').onclick = () => { S.settings.key = ''; $('#gk').value = ''; save(); modeLabel(); toast('✓', 'Cheia a fost ștearsă'); };
    }
    $('#gk').value = S.settings.key; $('#gm').value = S.settings.model;
    modeLabel(); drawChat();
    $('#ctx').value = ctxLesson; $('#depth').value = S.settings.depth || 'detailed';
    if (Tutor.pending) { const p = Tutor.pending; Tutor.pending = null; ctxLesson = p.lessonId || ctxLesson; $('#ctx').value = ctxLesson; send(p.text); }
  };
  let ctxLesson = '';
  const serverAI = () => API.st.reachable && API.st.ai;
  const modeLabel = () => { $('#mode').textContent = serverAI() ? 'AI școală + tutor local' : S.settings.key ? 'Gemini + tutor local' : 'Tutor local · fără internet'; };
  function drawChat() {
    const m = $('#msgs');
    if (!S.chat.length) {
      m.innerHTML = `<div class="msg a">${I18N.t('Salut', 'Hi')}${S.name ? ', ' + esc(S.name) : ''}! ${I18N.t('Sunt tutorul MathInfo 9. Încearcă una dintre sugestii sau scrie liber: o ecuație, un calcul sau „explică-mi for-ul în C++”.', 'I am the MathInfo 9 tutor. Try one of the suggestions or type freely: an equation, a calculation or “explain the for loop in C++”.')}</div>`;
    } else {
      m.innerHTML = S.chat.map((c, i) => `<div class="msg ${c.r}">${c.r === 'u' ? esc(c.t) : md(c.t)}${c.src ? `<span class="src">${esc(c.src)}</span>` : ''}${c.more ? `<button class="btn sm ghost more" data-i="${i}">${I18N.t('Explicație detaliată cu AI', 'Detailed explanation with AI')}</button>` : ''}</div>`).join('');
    }
    m.scrollTop = m.scrollHeight;
  }
  async function send(text, o = {}) {
    if (busy) return; busy = true;
    S.chat.push({ r: 'u', t: text }); drawChat();
    const li = o.forceAI ? null : Tutor.localInfo(o.q || text);
    const canAI = serverAI() || !!S.settings.key, depth = S.settings.depth || 'detailed';
    const m = $('#msgs');
    let msg;
    if (li && (li.exact || depth !== 'deep')) {
      // răspuns local instant (corect și cu pași); AI-ul detaliat este opțional, la cerere
      msg = { r: 'a', t: li.text, src: li.src, more: canAI ? (o.q || text) : undefined };
      await new Promise(r => setTimeout(r, 120));
    } else {
      const bubble = document.createElement('div'); bubble.className = 'msg a';
      bubble.innerHTML = `<span class="typing"><i></i><i></i><i></i></span><span class="src">${esc(I18N.t('se pregătește răspunsul…', 'preparing the answer…'))}</span>`;
      m.append(bubble); m.scrollTop = m.scrollHeight;
      const hist = S.chat.map(c => ({ r: c.r, t: c.t }));
      const res = await Tutor.ai(hist, S.settings, {
        serverAI: serverAI(), lessonId: ctxLesson, depth, fallbackLocal: li && li.text, more: !!o.forceAI,
        onDraft: t => { bubble.innerHTML = md(t) + `<span class="src">${esc(I18N.t('se verifică răspunsul…', 'verifying the answer…'))}</span>`; if (current === 'tutor') m.scrollTop = m.scrollHeight; }
      });
      msg = { r: 'a', t: res.text, src: res.src };
      if (o.forceAI && !res.ok && canAI) msg.more = o.q;   // reîncercare posibilă
    }
    S.chat.push(msg); if (S.chat.length > 60) S.chat = S.chat.slice(-60);
    const first = S.stats.aiMsgs === 0; S.stats.aiMsgs++;
    if (first) addXP(5);
    busy = false; checkBadges(); if (current === 'tutor') drawChat();
  }

  /* =============== ARENA =============== */
  const TIME = 15, ROUNDS = 7;
  const BOTS = { easy: { n: 'Ușor', acc: .55, min: 5, max: 12 }, mid: { n: 'Mediu', acc: .75, min: 3.5, max: 9 }, hard: { n: 'Greu', acc: .92, min: 2, max: 6 } };
  const KEYS = [['1', '2', '3', '4'], ['a', 's', 'd', 'f'], ['j', 'k', 'l', ';']];
  const KEYLABEL = [['A', 'S', 'D', 'F'], ['J', 'K', 'L', ';']];

  const Arena = (() => {
    const cfg = { subject: 'mix', mode: 'bot', bot: 'mid' };
    let G = null;

    const api = {
      get subject() { return cfg.subject; }, set subject(v) { cfg.subject = v; },
      abort() { if (G) { clearInterval(G.timer); clearTimeout(G.botT); G = null; } document.removeEventListener('keydown', onKey); },
      render
    };

    function render() {
      api.abort();
      const host = $('#v-arena'); host.classList.remove('playing');
      host.innerHTML = `
        <span class="eyebrow">Head-to-Head</span>
        <h1 class="page-h">Arena</h1>
        <p class="lead">${ROUNDS} întrebări, ${TIME} secunde fiecare. Corect = 100 puncte + bonus de viteză până la 50.</p>
        <div class="arena-grid" id="setupWrap">
          <div class="card setup">
            <div><h4>Materie</h4><div class="opts" data-k="subject">
              <button class="opt" data-v="mix">Mix</button><button class="opt" data-v="mate">Matematică</button><button class="opt" data-v="info">Informatică</button></div></div>
            <div><h4>Adversar</h4><div class="opts" data-k="mode">
              <button class="opt" data-v="bot">Contra rivalului digital</button><button class="opt" data-v="2p">Doi jucători, același ecran</button></div></div>
            <div id="botRow"><h4>Dificultate rival</h4><div class="opts" data-k="bot">
              ${Object.entries(BOTS).map(([k, b]) => `<button class="opt" data-v="${k}">${b.n}<small>${Math.round(b.acc * 100)}% corect</small></button>`).join('')}</div></div>
            <div class="field"><label for="pn1">Numele tău</label><input id="pn1" maxlength="18" value="${esc(S.name)}" placeholder="ex: Andrei"></div>
            <div class="field" id="p2Row"><label for="pn2">Jucător 2</label><input id="pn2" maxlength="18" placeholder="ex: Maria"></div>
            <p class="hint" id="keyHint"></p>
            <div><button class="btn lime" id="startBtn">Începe duelul ${ARROW}</button></div>
          </div>
          <div class="card board" id="board"></div>
          <div class="card online" id="onlineBox" style="grid-column:1/-1"></div>
        </div>
        <div class="game" id="game"></div>`;
      host.onclick = e => {
        const o = e.target.closest('.opt'); if (!o) return;
        cfg[o.parentElement.dataset.k] = o.dataset.v; syncSetup();
      };
      $('#startBtn').onclick = () => {
        const n1 = $('#pn1').value.trim() || 'Elev';
        S.name = n1; save();
        start(n1, cfg.mode === '2p' ? ($('#pn2').value.trim() || 'Jucător 2') : 'Rival ' + BOTS[cfg.bot].n.toLowerCase());
      };
      syncSetup(); drawBoard($('#board'));
    }

    function syncSetup() {
      $$('#v-arena .opt').forEach(o => o.setAttribute('aria-pressed', String(cfg[o.parentElement.dataset.k] === o.dataset.v)));
      $('#botRow').style.display = cfg.mode === 'bot' ? '' : 'none';
      $('#p2Row').style.display = cfg.mode === '2p' ? '' : 'none';
      $('#keyHint').textContent = cfg.mode === '2p' ? 'Jucător 1: tastele A S D F · Jucător 2: tastele J K L ; (sau atingi răspunsul pe ecran).' : 'Răspunzi cu mouse-ul/atingere sau cu tastele 1 2 3 4 (ori A S D F).';
    }

    function start(n1, n2) {
      const pool = QUESTIONS.filter(q => cfg.subject === 'mix' || q.s === cfg.subject);
      const qs = shuffle(pool).slice(0, ROUNDS).map(q => {
        const order = shuffle([0, 1, 2, 3]);
        return { ...q, o: order.map(i => q.o[i]), a: order.indexOf(q.a) };
      });
      G = { cfg: { ...cfg }, names: [n1, n2], qs, i: 0, sc: [0, 0], cor: [0, 0], ans: [null, null], streak: 0, best: 0, phase: 'ask', t0: 0, left: TIME, timer: null, botT: null, wrong: 0 };
      $('#setupWrap').style.display = 'none'; $('#v-arena').classList.add('playing');
      $('#game').classList.add('on');
      document.addEventListener('keydown', onKey);
      round();
    }

    function round() {
      const q = G.qs[G.i]; G.ans = [null, null]; G.phase = 'ask'; G.left = TIME;
      const two = G.cfg.mode === '2p';
      const grid = (p) => `<div class="pgrid" data-p="${p}">${two ? `<h5>${esc(G.names[p])}</h5>` : ''}${q.o.map((t, i) => `<button class="ans" data-p="${p}" data-i="${i}"><span class="k">${two ? KEYLABEL[p][i] : i + 1}</span><span>${esc(t)}</span><span class="tags"></span></button>`).join('')}</div>`;
      const C = 2 * Math.PI * 38;
      $('#game').innerHTML = `
        <div class="hud">
          <div class="pl" id="pl0"><div class="av">${esc(G.names[0][0].toUpperCase())}</div><div><div class="nm">${esc(G.names[0])}</div><div class="sc" id="sc0">${G.sc[0]}</div><div class="state" id="st0">gândește…</div></div></div>
          <div class="ring" id="ring"><svg viewBox="0 0 84 84"><circle class="bg" cx="42" cy="42" r="38"/><circle class="fg" id="rfg" cx="42" cy="42" r="38" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><b id="tnum">${TIME}</b></div>
          <div class="pl r" id="pl1"><div class="av">${two ? esc(G.names[1][0].toUpperCase()) : 'R'}</div><div><div class="nm">${esc(G.names[1])}</div><div class="sc" id="sc1">${G.sc[1]}</div><div class="state" id="st1">${two ? 'gândește…' : 'se gândește…'}</div></div></div>
        </div>
        <div class="card qcard">
          <div class="qmeta"><span class="chip ${q.s}"><i class="dot"></i>${q.s === 'mate' ? 'Matematică' : 'Informatică'} · ${esc(q.t)}</span><span class="chip">Întrebarea ${G.i + 1} / ${G.qs.length}</span></div>
          <div class="qtext">${esc(q.q)}</div>
          <div class="answers ${two ? 'two' : ''}">${grid(0)}${two ? grid(1) : ''}</div>
          <div class="reveal" id="reveal"></div>
        </div>`;
      $('#game').onclick = e => { const b = e.target.closest('.ans'); if (b && !b.disabled) submit(+b.dataset.p, +b.dataset.i); const n = e.target.closest('#next'); if (n) next(); };
      G.t0 = performance.now();
      clearInterval(G.timer); G.timer = setInterval(tick, 100);
      if (!two) {
        const b = BOTS[G.cfg.bot], correct = Math.random() < b.acc;
        const pick = correct ? q.a : shuffle([0, 1, 2, 3].filter(i => i !== q.a))[0];
        G.botT = setTimeout(() => submit(1, pick), rand(b.min, b.max) * 1000);
      }
    }

    function tick() {
      if (!G || G.phase !== 'ask') return;
      G.left = Math.max(0, TIME - (performance.now() - G.t0) / 1000);
      const C = 2 * Math.PI * 38;
      const fg = $('#rfg'); if (fg) fg.style.strokeDashoffset = String(C * (1 - G.left / TIME));
      const t = $('#tnum'); if (t) t.textContent = Math.ceil(G.left);
      $('#ring').classList.toggle('low', G.left <= 5);
      if (G.left <= 0) reveal();
    }

    function submit(p, idx) {
      if (!G || G.phase !== 'ask' || G.ans[p]) return;
      G.ans[p] = { idx, left: G.left };
      const two = G.cfg.mode === '2p';
      if (!(p === 1 && !two)) {
        $$(`.ans[data-p="${p}"]`).forEach(b => { b.disabled = true; b.classList.toggle('picked', +b.dataset.i === idx); });
      }
      const st = $('#st' + p); if (st) st.textContent = 'a răspuns';
      if (G.ans[0] && G.ans[1]) reveal();
    }

    function reveal() {
      if (!G || G.phase !== 'ask') return;
      G.phase = 'reveal'; clearInterval(G.timer); clearTimeout(G.botT);
      const q = G.qs[G.i], two = G.cfg.mode === '2p';
      const gain = [0, 0];
      for (const p of [0, 1]) {
        const a = G.ans[p];
        if (a && a.idx === q.a) { gain[p] = 100 + Math.round(a.left / TIME * 50); G.cor[p]++; }
      }
      // serie și statistici pentru jucătorul 1
      S.stats.answered++;
      if (gain[0]) { G.streak++; G.best = Math.max(G.best, G.streak); S.stats.correct++; } else G.streak = 0;
      G.sc[0] += gain[0]; G.sc[1] += gain[1];
      $('#sc0').textContent = G.sc[0]; $('#sc1').textContent = G.sc[1];
      $('#pl0').classList.toggle('lead-p', G.sc[0] > G.sc[1]); $('#pl1').classList.toggle('lead-p', G.sc[1] > G.sc[0]);
      $$('.ans').forEach(b => {
        b.disabled = true; const i = +b.dataset.i, p = +b.dataset.p;
        const tagsFor = [0, 1].filter(x => G.ans[x] && G.ans[x].idx === i);
        if (!two) { // în modul solo, panoul este unic: arătăm și alegerea rivalului
          b.classList.remove('picked');
          if (i === q.a) b.classList.add('right');
          else if (tagsFor.length) b.classList.add('wrong'); else b.classList.add('dim');
          b.querySelector('.tags').innerHTML = tagsFor.map(x => `<i>${x === 0 ? 'TU' : 'RIVAL'}</i>`).join('');
        } else {
          b.classList.remove('picked');
          const mine = G.ans[p] && G.ans[p].idx === i;
          if (i === q.a) b.classList.add('right'); else if (mine) b.classList.add('wrong'); else b.classList.add('dim');
          if (mine) b.querySelector('.tags').innerHTML = '<i>' + esc(G.names[p].slice(0, 8).toUpperCase()) + '</i>';
        }
      });
      for (const p of [0, 1]) {
        const a = G.ans[p]; const st = $('#st' + p);
        st.textContent = !a ? 'timp expirat' : gain[p] ? `+${gain[p]} puncte` : 'greșit';
        if (gain[p]) floatPts(p, gain[p]);
      }
      const last = G.i === G.qs.length - 1;
      const rv = $('#reveal'); rv.classList.add('on');
      rv.innerHTML = `<p><b>Explicație</b>${esc(q.e)}</p><button class="btn lime" id="next">${last ? 'Vezi rezultatul' : 'Următoarea'} ${ARROW}</button>`;
      $('#next').focus({ preventScroll: true });
    }

    function floatPts(p, n) {
      const el = $('#sc' + p); if (!el) return; const r = el.getBoundingClientRect();
      const f = document.createElement('div'); f.className = 'floatpts'; f.textContent = '+' + n;
      f.style.left = (r.left + (p ? -20 : 0)) + 'px'; f.style.top = (r.top - 8) + 'px';
      document.body.append(f); setTimeout(() => f.remove(), 1000);
    }

    function next() {
      if (!G || G.phase !== 'reveal') return;
      if (G.i < G.qs.length - 1) { G.i++; round(); } else finish();
    }

    function finish() {
      G.phase = 'done';
      const [a, b] = G.sc, two = G.cfg.mode === '2p', win = a > b, draw = a === b;
      const perfect = G.cor[0] === G.qs.length;
      S.stats.duels++; if (win) S.stats.wins++; if (perfect) S.stats.perfect++; if (two) S.stats.pvp++;
      S.stats.bestStreak = Math.max(S.stats.bestStreak, G.best);
      const xp = G.cor[0] * 10 + (win ? 50 : draw ? 20 : 10) + (perfect ? 30 : 0);
      addXP(xp);
      S.board.push({ n: G.names[0], p: a, w: win ? 1 : 0 });
      if (two) S.board.push({ n: G.names[1], p: b, w: b > a ? 1 : 0 });
      if (S.board.length > 300) S.board = S.board.slice(-300);
      checkBadges();
      const title = two ? (draw ? 'Egal.' : (win ? G.names[0] : G.names[1]) + ' câștigă.') : (draw ? 'Egal.' : win ? 'Ai câștigat.' : 'Rivalul câștigă.');
      $('#game').innerHTML = `
        <div class="card result">
          <span class="eyebrow">Rezultat final</span>
          <h2>${esc(title)}</h2>
          <div class="final">
            <div class="${a >= b ? 'win' : ''}"><b>${a}</b><span>${esc(G.names[0])} · ${G.cor[0]}/${G.qs.length} corecte</span></div>
            <div class="${b >= a ? 'win' : ''}"><b>${b}</b><span>${esc(G.names[1])} · ${G.cor[1]}/${G.qs.length} corecte</span></div>
          </div>
          <div class="gains"><span class="chip">+${xp} XP</span>${perfect ? '<span class="chip">Fără greșeală +30</span>' : ''}<span class="chip">Serie maximă: ${G.best}</span></div>
          <div class="cta" style="justify-content:center"><button class="btn lime" id="again">Revanșă</button><button class="btn ghost" id="menu">Meniu</button><a class="btn ghost" href="#/tutor">Întreabă tutorul</a></div>
        </div>`;
      document.removeEventListener('keydown', onKey);
      const saved = { ...G.cfg }, names = G.names;
      $('#again').onclick = () => { Object.assign(cfg, saved); start(names[0], names[1]); };
      $('#menu').onclick = () => render();
    }

    function onKey(e) {
      if (!G || current !== 'arena' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      const k = e.key.toLowerCase();
      if (G.phase === 'reveal' && (k === 'enter' || k === ' ' || k === 'arrowright')) { e.preventDefault(); next(); return; }
      if (G.phase !== 'ask') return;
      const two = G.cfg.mode === '2p';
      let i = KEYS[0].indexOf(k); if (i >= 0) return submit(0, i);
      i = KEYS[1].indexOf(k); if (i >= 0) return submit(0, i);
      if (two) { i = KEYS[2].indexOf(k); if (i >= 0) return submit(1, i); }
    }

    return api;
  })();

  function boardTable(el, title, rows, cols) {
    el.innerHTML = `<h4>${title}</h4>` + (rows.length ? `<table><thead><tr><th>#</th><th>Elev</th><th>${cols[0]}</th><th style="text-align:right">${cols[1]}</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.n)}</td><td class="mono">${r.sub}</td><td class="pts">${r.pts}</td></tr>`).join('')}</tbody></table>` : `<div class="empty"><b>—</b>Încă nu a jucat nimeni. Primul duel te pune în clasament.</div>`);
  }
  function drawBoard(el) {
    const m = new Map();
    for (const r of S.board) { const k = r.n.toLowerCase(); const e = m.get(k) || { n: r.n, p: 0, d: 0, w: 0 }; e.p += r.p; e.d++; e.w += r.w; e.n = r.n; m.set(k, e); }
    boardTable(el, 'Clasament local', [...m.values()].sort((a, b) => b.p - a.p).slice(0, 8).map(r => ({ n: r.n, sub: `${r.w}V / ${r.d}`, pts: r.p })), ['Dueluri', 'Puncte']);
    if (API.st.reachable) API.get('/api/leaderboard').then(r => { if (r.rows.length && el.isConnected) boardTable(el, 'Clasament școală · XP', r.rows.slice(0, 10).map(x => ({ n: x.display, sub: `Nv ${x.level} · ${x.wins} victorii`, pts: x.xp })), ['Nivel', 'XP']); }).catch(() => { });
  }
  R.arena = () => Arena.render();

  /* =============== LABORATOR =============== */
  const lab = { a: 1, b: -5, c: 6 };
  R.lab = () => {
    const host = $('#v-lab');
    if (!host.dataset.ready) {
      host.dataset.ready = '1';
      host.innerHTML = `
        <span class="eyebrow">Experimentează</span>
        <h1 class="page-h">Laborator</h1>
        <p class="lead">Instrumente interactive ca să vezi cum se comportă formulele, nu doar să le știi.</p>
        <div class="lab-grid lab">
          <div class="card lab-wide">
            <h3>Funcția de gradul II</h3><span class="hint">f(x) = ax² + bx + c — mișcă glisoarele.</span>
            <canvas class="plot" id="plot" aria-label="Graficul funcției de gradul II"></canvas>
            <div class="sliders">
              ${['a', 'b', 'c'].map(k => `<div class="sl"><label for="s-${k}">${k} <output id="o-${k}"></output></label><input type="range" id="s-${k}" min="-6" max="6" step="0.5"></div>`).join('')}
            </div>
            <div class="readout" id="readout"></div>
          </div>
          <div class="card">
            <h3>Algoritmul lui Euclid</h3><span class="hint">cmmdc și cmmmc cu toți pașii.</span>
            <div class="tool-in"><input id="eu-a" type="number" min="1" value="48" aria-label="Primul număr"><input id="eu-b" type="number" min="1" value="36" aria-label="Al doilea număr"><button class="btn sm" id="eu-go">Calculează</button></div>
            <div class="tool-out" id="eu-out"></div>
          </div>
          <div class="card">
            <h3>Convertor de baze</h3><span class="hint">Introdu un număr într-o bază, vezi-l în toate.</span>
            <div class="tool-in"><input id="cv-v" value="25" aria-label="Numărul" autocomplete="off"><div class="seg" id="cv-b">${[2, 8, 10, 16].map(b => `<button data-b="${b}" aria-pressed="${b === 10}">${b}</button>`).join('')}</div></div>
            <div class="tool-out" id="cv-out"></div>
          </div>
        </div>`;
      ['a', 'b', 'c'].forEach(k => $('#s-' + k).addEventListener('input', e => { lab[k] = +e.target.value; drawPlot(); }));
      $('#eu-go').onclick = () => euclidRun();
      ['eu-a', 'eu-b'].forEach(id => $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') euclidRun(); }));
      let base = 10;
      const conv = () => {
        const s = $('#cv-v').value.trim().toUpperCase(); const out = $('#cv-out');
        const valid = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9A-F]+$/ }[base];
        if (!s) { out.textContent = ''; return; }
        if (!valid.test(s) || s.length > 15) { out.textContent = `„${s}” nu este un număr valid în baza ${base}.`; return; }
        const n = parseInt(s, base);
        out.textContent = `baza 2   : ${n.toString(2)}\nbaza 8   : ${n.toString(8)}\nbaza 10  : ${n.toString(10)}\nbaza 16  : ${n.toString(16).toUpperCase()}`;
      };
      $('#cv-v').addEventListener('input', conv);
      $('#cv-b').onclick = e => { const b = e.target.closest('button'); if (!b) return; base = +b.dataset.b; $$('#cv-b button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); conv(); };
      conv(); euclidRun();
      window.addEventListener('resize', () => { if (current === 'lab') drawPlot(); });
      new MutationObserver(() => { if (current === 'lab') drawPlot(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    ['a', 'b', 'c'].forEach(k => { $('#s-' + k).value = lab[k]; });
    requestAnimationFrame(drawPlot);
  };
  function euclidRun() {
    const a = Math.floor(+$('#eu-a').value), b = Math.floor(+$('#eu-b').value), out = $('#eu-out');
    if (!(a > 0 && b > 0) || a > 1e9 || b > 1e9) { out.textContent = 'Introdu două numere naturale nenule.'; return; }
    let x = Math.max(a, b), y = Math.min(a, b), t = '';
    while (y) { t += `${x} = ${Math.floor(x / y)} · ${y} + ${x % y}\n`; [x, y] = [y, x % y]; }
    out.textContent = t + `\ncmmdc(${a}, ${b}) = ${x}\ncmmmc(${a}, ${b}) = ${a / x * b}`;
  }
  function drawPlot() {
    const cv = $('#plot'); if (!cv) return;
    const { a, b, c } = lab, dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
    cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement), col = n => css.getPropertyValue(n).trim();
    const xr = 10, yr = 10;
    const X = x => (x + xr) / (2 * xr) * W, Y = y => H / 2 - y / yr * (H / 2);
    g.clearRect(0, 0, W, H);
    g.lineWidth = 1; g.strokeStyle = col('--line');
    for (let i = -xr; i <= xr; i++) { g.beginPath(); g.moveTo(X(i), 0); g.lineTo(X(i), H); g.stroke(); }
    for (let j = -Math.floor(yr); j <= yr; j++) { g.beginPath(); g.moveTo(0, Y(j)); g.lineTo(W, Y(j)); g.stroke(); }
    g.strokeStyle = col('--ink'); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.moveTo(X(0), 0); g.lineTo(X(0), H); g.stroke();
    g.fillStyle = col('--muted'); g.font = '11px ' + col('--mono');
    for (let i = -xr + 2; i <= xr - 1; i += 2) if (i) g.fillText(i, X(i) - 4, Y(0) + 14);
    const f = x => a * x * x + b * x + c;
    g.beginPath(); g.lineWidth = 3.5; g.strokeStyle = col('--math'); g.lineJoin = 'round';
    for (let px = 0; px <= W; px += 2) { const x = px / W * 2 * xr - xr, y = Y(f(x)); px ? g.lineTo(px, y) : g.moveTo(px, y); }
    g.stroke();
    const d = b * b - 4 * a * c;
    const pt = (x, y, fill) => { g.beginPath(); g.arc(X(x), Y(y), 6, 0, 7); g.fillStyle = fill; g.fill(); g.lineWidth = 2; g.strokeStyle = col('--ink'); g.stroke(); };
    const fm = v => String(Math.round(v * 100) / 100).replace('.', ',');
    let chips = '';
    if (a !== 0) {
      const vx = -b / (2 * a), vy = -d / (4 * a);
      pt(vx, vy, '#d2f53c');
      if (d >= 0) { const r1 = (-b - Math.sqrt(d)) / (2 * a), r2 = (-b + Math.sqrt(d)) / (2 * a); pt(r1, 0, col('--bg')); if (d > 0) pt(r2, 0, col('--bg')); chips += d > 0 ? `<span class="chip">x₁ = ${fm(Math.min(r1, r2))}</span><span class="chip">x₂ = ${fm(Math.max(r1, r2))}</span>` : `<span class="chip">x₁ = x₂ = ${fm(r1)}</span>`; }
      else chips += '<span class="chip">fără rădăcini reale</span>';
      chips = `<span class="chip">Δ = ${fm(d)}</span>` + chips + `<span class="chip">Vârf (${fm(vx)}; ${fm(vy)})</span><span class="chip">${a > 0 ? 'ramuri în sus · minim' : 'ramuri în jos · maxim'}</span>`;
    } else chips = `<span class="chip">a = 0 → funcție de gradul I${b ? ', rădăcina x = ' + fm(-c / b) : ''}</span>`;
    $('#readout').innerHTML = chips;
    ['a', 'b', 'c'].forEach(k => $('#o-' + k).textContent = '= ' + String(lab[k]).replace('.', ','));
  }

  /* =============== PROFIL =============== */
  R.profil = () => {
    const l = levelOf(S.xp), into = S.xp % 150, st = S.stats;
    const acc = st.answered ? Math.round(st.correct / st.answered * 100) + '%' : '—';
    $('#v-profil').innerHTML = `
      <span class="eyebrow">Progresul tău</span>
      <h1 class="page-h">Profil</h1>
      <div class="prof-grid">
        <div class="card">
          <div class="field"><label for="pname">Nume</label><input id="pname" maxlength="18" value="${esc(S.name)}" placeholder="ex: Andrei"></div>
          <div style="margin-top:22px" class="eyebrow">Nivel</div>
          <div class="big-n">${l}</div>
          <div class="prog"><i style="width:${into / 150 * 100}%"></i></div>
          <p class="hint" style="margin-top:8px">${into} / 150 XP până la nivelul ${l + 1} · total ${S.xp} XP</p>
          <div class="stats">
            <div class="stat"><b>${st.duels}</b><span>Dueluri</span></div><div class="stat"><b>${st.wins}</b><span>Victorii</span></div>
            <div class="stat"><b>${acc}</b><span>Acuratețe</span></div><div class="stat"><b>${st.bestStreak}</b><span>Serie maximă</span></div>
            <div class="stat"><b>${Object.keys(S.done).length}</b><span>Lecții parcurse</span></div><div class="stat"><b>${st.aiMsgs}</b><span>Întrebări AI</span></div>
          </div>
          <div style="margin-top:22px"><button class="btn sm ghost danger" id="reset">Resetează tot progresul</button></div>
        </div>
        <div style="display:grid;gap:14px">
          <div class="card"><div class="eyebrow">Insigne · ${Object.keys(S.badges).length} / ${BADGES.length}</div>
            <div class="badges">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? 'on' : ''}"><i>${esc(b.g)}</i><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join('')}</div></div>
          <div class="card board" id="board"></div>
        </div>
      </div>`;
    drawBoard($('#board'));
    $('#pname').onchange = e => { S.name = e.target.value.trim().slice(0, 18); save(); pushNow(); toast('✓', 'Nume salvat'); };
    $('#reset').onclick = () => { if (confirm('Sigur ștergi tot progresul (XP, insigne, clasament, chat)?')) { const key = S.settings; S = fresh(); S.settings = key; save(); renderLvl(); R.profil(); } };
  };

  /* =============== cont (autentificare) =============== */
  const dlg = $('#authDlg'); let authTab = 'login', authRole = 'student';
  function renderAcct() {
    const b = $('#acct'); b.hidden = !API.st.reachable;
    b.textContent = API.st.user ? API.st.user.display : 'Intră';
    b.classList.toggle('on', !!API.st.user);
  }
  function openAuth() {
    const u = API.st.user, body = $('#authBody');
    $('#authTitle').textContent = u ? 'Contul meu' : authTab === 'login' ? 'Intră în cont' : 'Cont nou';
    if (u) {
      body.innerHTML = `<p><b>${esc(u.display)}</b> · @${esc(u.username)}</p><p class="hint">${u.role === 'teacher' ? 'Profesor — poți crea clase și da teme.' : 'Elev — alătură-te unei clase cu codul primit de la profesor.'}</p>
        <div class="dlg-actions"><a class="btn sm" href="#/clase" id="goClase">Clasele mele</a><button class="btn sm ghost" type="button" id="outBtn">Ieși din cont</button></div>`;
      $('#goClase').onclick = () => dlg.close();
      $('#outBtn').onclick = async () => { clearTimeout(pushT); pushNow(); await API.logout(); const keep = S.settings; S = fresh(); S.settings = keep; save(); renderLvl(); dlg.close(); renderAcct(); route(); toast('✓', 'Ai ieșit din cont'); };
    } else {
      const reg = authTab === 'reg';
      body.innerHTML = `<div class="seg" style="margin-bottom:16px"><button type="button" data-t="login" aria-pressed="${!reg}">Am cont</button><button type="button" data-t="reg" aria-pressed="${reg}">Cont nou</button></div>
        ${reg ? `<div class="seg" style="margin-bottom:12px"><button type="button" data-r="student" aria-pressed="${authRole === 'student'}">Elev</button><button type="button" data-r="teacher" aria-pressed="${authRole === 'teacher'}">Profesor</button></div>` : ''}
        <div class="field"><label for="au">Utilizator</label><input id="au" autocomplete="username" maxlength="20" required></div>
        ${reg ? `<div class="field"><label for="ad">Nume afișat</label><input id="ad" maxlength="24" placeholder="ex: Andrei P."></div>` : ''}
        <div class="field"><label for="ap">Parolă${reg ? ' (minim 6 caractere)' : ''}</label><input id="ap" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" required></div>
        ${reg && authRole === 'teacher' ? `<div class="field"><label for="ac">Cod profesor (de la administratorul școlii)</label><input id="ac" type="password" autocomplete="off"></div>` : ''}
        <p class="err" id="aerr" role="alert"></p>
        <button class="btn lime" type="submit" id="asub">${reg ? 'Creează cont' : 'Intră'}</button>`;
      body.onclick = e => { const t = e.target.closest('[data-t]'), r = e.target.closest('[data-r]'); if (t) { authTab = t.dataset.t; openAuth(); } if (r) { authRole = r.dataset.r; openAuth(); } };
    }
    if (!dlg.open) dlg.showModal();
  }
  $('#authX').onclick = () => dlg.close();
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  $('#authForm').onsubmit = async e => {
    e.preventDefault(); if (API.st.user) return;
    const err = $('#aerr'), btn = $('#asub'); err.textContent = ''; btn.disabled = true;
    try {
      const r = authTab === 'login'
        ? await API.login($('#au').value, $('#ap').value)
        : await API.register({ username: $('#au').value, password: $('#ap').value, display: $('#ad').value, role: authRole, teacherCode: $('#ac') ? $('#ac').value : undefined });
      mergeServer(r.data); S.name = r.user.display; save(); pushNow(); checkBadges(); renderLvl(); renderAcct();
      dlg.close(); toast('✓', 'Bine ai venit, ' + r.user.display); route();
    } catch (ex) { err.textContent = ex.message; } finally { btn.disabled = false; }
  };
  $('#acct').onclick = openAuth;

  /* =============== pornire =============== */
  window.MI = { S: () => S, save, pushNow, addXP, checkBadges, toast, md, esc, inl, blocksHtml, fmtDate, fmtDT, $, $$, go, ARROW, R, route, openAuth, renderAcct, shuffle, curr: () => current };
  $('#theme').onclick = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; try { localStorage.setItem('mi9-theme', next); } catch (e) { /* ignorat */ }
  };
  const langBtn = $('#lang');
  if (langBtn) { langBtn.textContent = I18N.lang === 'en' ? 'RO' : 'EN'; langBtn.title = I18N.lang === 'en' ? 'Switch to Romanian' : 'Switch to English'; langBtn.onclick = () => I18N.set(I18N.lang === 'en' ? 'ro' : 'en'); }
  if (I18N.lang === 'en') I18N.start();
  window.addEventListener('hashchange', route);
  window.addEventListener('load', async () => {
    renderLvl();
    const me = await API.init();
    if (me) { mergeServer(me.data); S.name = me.user.display; save(); }
    renderAcct(); checkBadges(); route();
  });
})();
