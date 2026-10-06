/* Dueluri H2H online. Serverul ține starea meciului; clientul o interoghează (polling) — merge și pe Vercel. */
(() => {
  'use strict';
  const { $, esc, toast, ARROW, go } = MI;
  const KEYS = ['1', '2', '3', '4'], KEYS2 = ['a', 's', 'd', 'f'];

  let M = null;                              // meciul curent (stare locală construită din răspunsurile serverului)
  const lobby = { state: 'idle', code: '', subject: 'mix' };
  let timer = null, pollT = null, polling = false;

  /* ---------- polling ---------- */
  const active = () => !!(API.st.user && API.st.reachable);
  function schedule(ms = 900) {
    clearTimeout(pollT);
    if (!active()) return;
    if (M && M.phase !== 'end' || lobby.state === 'queue' || lobby.state === 'room') pollT = setTimeout(tick, ms);
  }
  async function tick() {
    if (!active() || polling) return; polling = true;
    try { applyPoll(await API.get('/api/h2h/poll')); } catch (e) { /* rețea căzută: reîncercăm */ } finally { polling = false; }
    schedule();
  }

  function applyPoll(r) {
    if (r.state === 'match') return applyView(r.view);
    if (M && M.phase !== 'end') { M = null; if (MI.curr() === 'arena') MI.R.arena(); }   // meciul a dispărut (confirmat de pe alt dispozitiv)
    const before = lobby.state;
    lobby.state = r.state === 'idle' ? 'idle' : r.state; lobby.code = r.code || '';
    if (r.subject) lobby.subject = r.subject;
    if (before !== lobby.state && MI.curr() === 'arena' && !M) paintLobby();
  }

  function applyView(v) {
    if (!M || M.id !== v.id) {
      M = { id: v.id, names: v.names, you: v.you, subject: v.subject, rounds: v.rounds, time: v.time, sc: [0, 0], cor: [0, 0], phase: 'intro', i: -1, streak: 0, best: 0, picked: null, oppDone: false, rev: null, seenRev: -1 };
      lobby.state = 'idle';
      if (MI.curr() !== 'arena') { go('#/arena'); } else { MI.R.arena(); }
    }
    let repaint = false;
    if (v.phase === 'lobby') { M.phase = 'intro'; }
    else if (v.phase === 'ask') {
      if (M.phase !== 'ask' || M.i !== v.i) {
        Object.assign(M, { phase: 'ask', i: v.i, q: v.q, n: v.n, picked: v.picked, oppDone: v.oppDone, rev: null, sc: v.sc, cor: v.cor, endsAt: Date.now() + v.left * 1000 }); repaint = true;
      } else {
        if (v.oppDone && !M.oppDone) { M.oppDone = true; const s = $('#st-opp'); if (s) s.textContent = 'a răspuns'; }
        if (v.picked !== null && M.picked === null) { M.picked = v.picked; repaint = true; }
        M.endsAt = Date.now() + v.left * 1000;
      }
    } else if (v.phase === 'reveal') {
      if (M.seenRev !== v.i) {
        M.seenRev = v.i; Object.assign(M, { phase: 'reveal', i: v.i, q: v.q, n: v.n, rev: v.rev, sc: v.rev.sc, cor: v.rev.cor }); repaint = true;
        const S = MI.S(); S.stats.answered++;
        if (v.rev.gain[M.you]) { S.stats.correct++; M.streak++; M.best = Math.max(M.best, M.streak); } else M.streak = 0;
      }
    } else if (v.phase === 'done') {
      if (M.phase !== 'end') { Object.assign(M, { phase: 'end', end: v.end, sc: v.end.sc, cor: v.end.cor }); award(); repaint = true; }
    }
    if (M.phase === 'intro' && !M.introShown) { M.introShown = true; repaint = true; }
    if (repaint && MI.curr() === 'arena') paintGame();
  }

  function award() {
    if (M.awarded) return; M.awarded = true;
    const S = MI.S(), me = M.you, e = M.end, win = e.winner === me, draw = e.winner === -1;
    S.awarded = S.awarded || [];
    if (S.awarded.includes(M.id)) { M.xp = 0; return; }   // deja acordat (ex.: pagină reîncărcată pe ecranul de rezultat)
    S.awarded.push(M.id); if (S.awarded.length > 30) S.awarded.shift();
    S.stats.duels++; if (win) S.stats.wins++; if (M.cor[me] === M.rounds) S.stats.perfect++;
    S.stats.bestStreak = Math.max(S.stats.bestStreak, M.best);
    M.xp = M.cor[me] * 10 + (win ? 50 : draw ? 20 : 10) + (M.cor[me] === M.rounds ? 30 : 0);
    MI.addXP(M.xp); MI.checkBadges(); MI.pushNow();
  }

  /* ---------- lobby (în pagina Arena) ---------- */
  async function mount() {
    const box = $('#onlineBox'); if (!box) return;
    if (M) return paintGame();
    if (!API.st.reachable) { box.innerHTML = `<h4>Duel online</h4><p class="hint">Dueluri între dispozitive diferite au nevoie de server. Pornește-l cu <code>npm start</code> sau publică proiectul pe Vercel.</p>`; return; }
    if (!API.st.user) { box.innerHTML = `<h4>Duel online</h4><p class="lead" style="font-size:1rem">Joacă în timp real împotriva unui coleg de pe alt telefon sau calculator.</p><button class="btn lime" id="olog">Intră în cont</button>`; $('#olog').onclick = MI.openAuth; return; }
    paintLobby();
    try { applyPoll(await API.get('/api/h2h/poll')); } catch (e) { /* ignorat */ }
    if (!M) paintLobby();
    schedule();
  }

  function paintLobby() {
    const box = $('#onlineBox'); if (!box || M) return;
    const subj = ['mix', 'mate', 'info'].map(s => `<button class="opt" data-s="${s}" aria-pressed="${lobby.subject === s}">${s === 'mix' ? 'Mix' : s === 'mate' ? 'Matematică' : 'Informatică'}</button>`).join('');
    let body;
    if (lobby.state === 'queue') body = `<div class="waiting"><span class="spin"></span><div><b>Se caută un adversar…</b><p class="hint">Rămâi pe această pagină. Un alt elev trebuie să apese „Meci rapid” la aceeași materie.</p></div></div><button class="btn ghost" id="ocancel">Anulează</button>`;
    else if (lobby.state === 'room') body = `<div class="waiting"><span class="spin"></span><div><b>Camera ta este deschisă</b><p class="hint">Dă-i prietenului acest cod:</p><div class="room-code">${esc(lobby.code)}</div></div></div><button class="btn ghost" id="ocancel">Închide camera</button>`;
    else body = `<div class="opts" id="osubj">${subj}</div>
      <div class="cta"><button class="btn lime" id="oq">Meci rapid ${ARROW}</button><button class="btn ghost" id="oroom">Creează cameră</button></div>
      <form class="join-row" id="ojoin"><input id="ocode" maxlength="5" placeholder="COD CAMERĂ" autocomplete="off" style="text-transform:uppercase"><button class="btn" type="submit">Intră</button></form>`;
    box.innerHTML = `<div class="online-head"><div><h4>Duel online</h4><p class="lead" style="font-size:1.05rem">Împotriva unui coleg, în timp real. Același set de întrebări, același cronometru.</p></div><span class="chip live-chip"><i class="live"></i><span>conectat</span></span></div>${body}`;
    const c = $('#ocancel'); if (c) c.onclick = async () => { await API.post('/api/h2h/cancel').catch(() => { }); lobby.state = 'idle'; paintLobby(); };
    if (lobby.state !== 'idle') return;
    $('#osubj').onclick = e => { const b = e.target.closest('.opt'); if (b) { lobby.subject = b.dataset.s; paintLobby(); } };
    $('#oq').onclick = async () => { try { const r = await API.post('/api/h2h/queue', { subject: lobby.subject }); if (r.status === 'waiting') { lobby.state = 'queue'; paintLobby(); } schedule(300); } catch (e) { toast('!', e.message); } };
    $('#oroom').onclick = async () => { try { const r = await API.post('/api/h2h/room', { subject: lobby.subject }); lobby.state = 'room'; lobby.code = r.code; paintLobby(); schedule(); } catch (e) { toast('!', e.message); } };
    $('#ojoin').onsubmit = async e => { e.preventDefault(); try { await API.post('/api/h2h/join', { code: $('#ocode').value }); schedule(100); tick(); } catch (ex) { toast('!', ex.message); } };
  }

  /* ---------- ecranul de joc ---------- */
  function paintGame() {
    const g = $('#game'); if (!g || !M) return;
    $('#setupWrap').style.display = 'none'; $('#v-arena').classList.add('playing'); g.classList.add('on');
    clearInterval(timer);
    const me = M.you, op = 1 - me;
    if (M.phase === 'intro') {
      g.innerHTML = `<div class="card result"><span class="eyebrow">Adversar găsit</span><h2>${esc(M.names[me])} <span style="opacity:.3">vs</span> ${esc(M.names[op])}</h2><p class="lead" style="margin:0 auto">${M.rounds} întrebări · ${M.time} secunde fiecare. Pregătește-te…</p></div>`;
      return;
    }
    if (M.phase === 'end') {
      const e = M.end, win = e.winner === me, draw = e.winner === -1;
      const title = e.reason === 'forfeit' ? (win ? 'Adversarul a abandonat.' : 'Ai abandonat.') : draw ? 'Egal.' : win ? 'Ai câștigat.' : esc(M.names[op]) + ' câștigă.';
      g.innerHTML = `<div class="card result"><span class="eyebrow">Rezultat final · online</span><h2>${title}</h2>
        <div class="final"><div class="${M.sc[me] >= M.sc[op] ? 'win' : ''}"><b>${M.sc[me]}</b><span>${esc(M.names[me])} · ${M.cor[me]}/${M.rounds} corecte</span></div><div class="${M.sc[op] >= M.sc[me] ? 'win' : ''}"><b>${M.sc[op]}</b><span>${esc(M.names[op])} · ${M.cor[op]}/${M.rounds} corecte</span></div></div>
        <div class="gains"><span class="chip">+${M.xp} XP</span><span class="chip">Serie maximă: ${M.best}</span></div>
        <div class="cta" style="justify-content:center"><button class="btn lime" id="oback">Înapoi în arenă</button></div></div>`;
      $('#oback').onclick = async () => { await API.post('/api/h2h/ack').catch(() => { }); M = null; MI.R.arena(); };
      return;
    }
    const q = M.q, rev = M.rev, C = 2 * Math.PI * 38;
    const tags = i => rev ? [me, op].filter(p => rev.picks[p] === i).map(p => `<i>${p === me ? 'TU' : 'RIVAL'}</i>`).join('') : '';
    g.innerHTML = `
      <div class="hud">
        <div class="pl ${M.sc[me] > M.sc[op] ? 'lead-p' : ''}"><div class="av">${esc(M.names[me][0].toUpperCase())}</div><div><div class="nm">${esc(M.names[me])}</div><div class="sc">${M.sc[me]}</div><div class="state" id="st-me">${rev ? (rev.gain[me] ? '+' + rev.gain[me] + ' puncte' : rev.picks[me] === null ? 'timp expirat' : 'greșit') : M.picked !== null ? 'a răspuns' : 'gândește…'}</div></div></div>
        <div class="ring" id="ring"><svg viewBox="0 0 84 84"><circle class="bg" cx="42" cy="42" r="38"/><circle class="fg" id="rfg" cx="42" cy="42" r="38" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><b id="tnum">${M.time}</b></div>
        <div class="pl r ${M.sc[op] > M.sc[me] ? 'lead-p' : ''}"><div class="av">${esc(M.names[op][0].toUpperCase())}</div><div><div class="nm">${esc(M.names[op])}</div><div class="sc">${M.sc[op]}</div><div class="state" id="st-opp">${rev ? (rev.gain[op] ? '+' + rev.gain[op] + ' puncte' : rev.picks[op] === null ? 'timp expirat' : 'greșit') : M.oppDone ? 'a răspuns' : 'gândește…'}</div></div></div>
      </div>
      <div class="card qcard">
        <div class="qmeta"><span class="chip ${q.s}"><i class="dot"></i>${q.s === 'mate' ? 'Matematică' : 'Informatică'} · ${esc(q.t)}</span><span class="chip">Întrebarea ${M.i + 1} / ${M.n}</span></div>
        <div class="qtext">${esc(q.q)}</div>
        <div class="answers"><div class="pgrid">${q.o.map((t, i) => {
      let cls = ''; if (rev) cls = i === rev.correct ? 'right' : (rev.picks[me] === i || rev.picks[op] === i) ? 'wrong' : 'dim'; else if (M.picked === i) cls = 'picked';
      return `<button class="ans ${cls}" data-i="${i}" ${rev || M.picked !== null ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(t)}</span><span class="tags">${tags(i)}</span></button>`;
    }).join('')}</div></div>
        <div class="reveal ${rev ? 'on' : ''}" id="reveal">${rev ? `<p><b>Explicație</b>${esc(rev.e)}</p><span class="hint">${rev.last ? 'Rezultatul apare imediat…' : 'Următoarea întrebare imediat…'}</span>` : ''}</div>
      </div>
      <p style="margin-top:14px"><button class="btn sm ghost danger" id="oleave">Abandonează duelul</button></p>`;
    $('#oleave').onclick = async () => { if (confirm('Abandonezi duelul? Adversarul câștigă.')) { await API.post('/api/h2h/leave').catch(() => { }); tick(); } };
    g.querySelector('.pgrid').onclick = e => { const b = e.target.closest('.ans'); if (b && !b.disabled) answer(+b.dataset.i); };
    if (M.phase === 'ask') {
      timer = setInterval(() => {
        const left = Math.max(0, (M.endsAt - Date.now()) / 1000), fg = $('#rfg'); if (!fg) return clearInterval(timer);
        fg.style.strokeDashoffset = String(C * (1 - left / M.time)); $('#tnum').textContent = Math.ceil(left); $('#ring').classList.toggle('low', left <= 5);
      }, 100);
    }
  }

  async function answer(idx) {
    if (!M || M.phase !== 'ask' || M.picked !== null) return;
    M.picked = idx; paintGame();
    try {
      const r = await API.post('/api/h2h/answer', { match: M.id, i: M.i, idx });
      if (r.view) applyView(r.view);
    } catch (e) { toast('!', 'Răspunsul nu a ajuns: ' + e.message); }
  }
  document.addEventListener('keydown', e => {
    if (!M || M.phase !== 'ask' || MI.curr() !== 'arena' || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase(); const i = KEYS.indexOf(k) >= 0 ? KEYS.indexOf(k) : KEYS2.indexOf(k);
    if (i >= 0) answer(i);
  });

  API.on('auth', () => { M = null; lobby.state = 'idle'; clearTimeout(pollT); });

  /* integrare în Arena */
  const orig = MI.R.arena;
  MI.R.arena = (a) => { orig(a); mount(); };
  // la încărcare, dacă utilizatorul are deja un meci în desfășurare (refresh), îl reluăm
  window.addEventListener('load', () => setTimeout(() => { if (active() && !M) tick(); }, 1200));
})();
