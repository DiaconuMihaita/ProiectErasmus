/* Clase, teme și rezultate (profesor + elev) */
(() => {
  'use strict';
  const { $, $$, esc, toast, fmtDate, fmtDT, ARROW, go } = MI;
  const host = () => $('#v-clase');
  const S = () => MI.S();
  const subjName = s => s === 'mate' ? 'Matematică' : 'Informatică';

  const gate = (title, text, btn) => `<span class="eyebrow">Clasă virtuală</span><h1 class="page-h">Clase</h1>
    <div class="card gate"><h3>${title}</h3><p class="lead">${text}</p>${btn || ''}</div>`;

  MI.R.clase = async (args = []) => {
    const h = host();
    if (API.st.dbError) { h.innerHTML = gate('Baza de date nu răspunde', 'Serverul rulează, dar nu poate folosi baza de date: <code>' + esc(API.st.dbError) + '</code>. Verifică variabilele TURSO_DATABASE_URL și TURSO_AUTH_TOKEN în Vercel și fă Redeploy.'); return; }
    if (!API.st.reachable) { h.innerHTML = gate('Serverul nu este pornit', 'Clasele, temele și dueluri online au nevoie de server. Pornește-l cu <code>npm start</code> și deschide <code>http://localhost:3000</code>.'); return; }
    if (!API.st.user) { h.innerHTML = gate('Intră în cont', 'Profesorii creează clase și dau teme; elevii se alătură cu un cod și rezolvă temele. Progresul tău se salvează pe server.', '<button class="btn lime" id="gl">Intră sau creează cont</button>'); $('#gl').onclick = MI.openAuth; return; }
    h.innerHTML = '<p class="hint" style="margin-top:40px">Se încarcă…</p>';
    try {
      if (!args.length) await listPage();
      else if (args[0] === 't') await assignmentPage(+args[1]);
      else if (args[0] === 'nou') await newAssignmentPage(+args[1]);
      else await classPage(+args[0]);
    } catch (e) { h.innerHTML = gate('Ceva nu a mers', esc(e.message), '<a class="btn" href="#/clase">Înapoi la clase</a>'); }
  };

  /* ---------------- lista de clase ---------------- */
  async function listPage() {
    const teacher = API.st.user.role === 'teacher';
    const { classes } = await API.get('/api/classes');
    host().innerHTML = `
      <span class="eyebrow">${teacher ? 'Profesor' : 'Elev'} · clasă virtuală</span>
      <h1 class="page-h">Clase</h1>
      <p class="lead">${teacher ? 'Creează o clasă, dă elevilor codul de înscriere și trimite-le teme cu auto-corectare.' : 'Alătură-te clasei profesorului cu codul primit și rezolvă temele.'}</p>
      <form class="card inline-form" id="cf">
        <div class="field grow"><label for="cn">${teacher ? 'Nume clasă nouă' : 'Cod de clasă'}</label><input id="cn" ${teacher ? 'maxlength="60" placeholder="ex: IX B — Matematică"' : 'maxlength="6" placeholder="ex: K55B4G" style="text-transform:uppercase"'} required></div>
        <button class="btn lime" type="submit">${teacher ? 'Creează clasa' : 'Intră în clasă'}</button>
      </form>
      <div class="class-grid" id="cg">${classes.length ? classes.map(c => `
        <a class="card class-card" href="#/clase/${c.id}">
          <h3>${esc(c.name)}</h3>
          ${teacher ? `<div class="code" title="Cod de înscriere">${esc(c.code)}</div><p class="hint">${c.students} elevi · ${c.assignments} teme</p>` : `<p class="hint">Profesor: ${esc(c.teacher)}</p>`}
          <span class="go">${ARROW}</span>
        </a>`).join('') : `<div class="empty card"><b>—</b>${teacher ? 'Nicio clasă încă. Creează prima clasă mai sus.' : 'Nu ești în nicio clasă încă.'}</div>`}</div>`;
    $('#cf').onsubmit = async e => {
      e.preventDefault(); const v = $('#cn').value.trim(); if (!v) return;
      try {
        const r = teacher ? await API.post('/api/classes', { name: v }) : await API.post('/api/classes/join', { code: v });
        toast('✓', teacher ? `Clasa creată · cod ${r.code}` : `Ai intrat în ${r.name}`); go('#/clase/' + r.id);
      } catch (ex) { toast('!', ex.message); }
    };
  }

  /* ---------------- pagina unei clase ---------------- */
  let tab = 'teme';
  async function classPage(id) {
    const d = await API.get('/api/classes/' + id), c = d.class;
    const asgCards = d.assignments.map(a => {
      const late = a.due && Date.now() > a.due + 86400000;
      const status = d.owner ? `<span class="chip">${a.submitted} predate</span>` : a.mine ? `<span class="chip good">${a.mine.score}/${a.mine.total}</span>` : late ? '<span class="chip bad">Termen depășit</span>' : '<span class="chip warn">De făcut</span>';
      return `<a class="card asg" href="#/clase/t/${a.id}"><div><h3>${esc(a.title)}</h3><p class="hint">${a.n} întrebări${a.due ? ' · termen ' + fmtDate(a.due) : ''}${a.descr ? ' · ' + esc(a.descr.slice(0, 80)) : ''}</p></div>${status}</a>`;
    }).join('');
    host().innerHTML = `
      <a class="back" href="#/clase">← Toate clasele</a>
      <div class="class-head"><div><span class="eyebrow">${d.owner ? 'Clasa ta' : 'Profesor: ' + esc(c.teacher)}</span><h1 class="page-h" style="margin-bottom:0">${esc(c.name)}</h1></div>
        ${d.owner ? `<div class="code-big"><small>Cod de înscriere</small><b id="ccode">${esc(c.code)}</b><button class="btn sm ghost" id="copy">Copiază</button></div>` : ''}</div>
      ${d.owner ? `<div class="filters"><div class="seg" id="ct"><button data-t="teme" aria-pressed="${tab === 'teme'}">Teme (${d.assignments.length})</button><button data-t="elevi" aria-pressed="${tab === 'elevi'}">Elevi (${d.members.length})</button></div>
        <a class="btn lime sm" href="#/clase/nou/${c.id}">+ Temă nouă</a><button class="btn sm ghost danger" id="delc">Șterge clasa</button></div>` : '<div style="height:28px"></div>'}
      <div id="ctab"></div>`;
    const paint = () => {
      $('#ctab').innerHTML = d.owner && tab === 'elevi'
        ? (d.members.length ? `<div class="card board"><table><thead><tr><th>#</th><th>Elev</th><th>Teme predate</th><th style="text-align:right">XP</th></tr></thead><tbody>${d.members.map((m, i) => `<tr><td>${i + 1}</td><td>${esc(m.display)} <span class="hint">@${esc(m.username)}</span></td><td class="mono">${m.done} / ${d.assignments.length}</td><td class="pts">${m.xp}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty card"><b>—</b>Niciun elev încă. Dă-le codul <b style="display:inline;font:700 1rem var(--mono);opacity:1">${esc(c.code)}</b>.</div>`)
        : `<div class="asg-list">${asgCards || `<div class="empty card"><b>—</b>${d.owner ? 'Nicio temă încă. Apasă „Temă nouă”.' : 'Profesorul nu a dat nicio temă încă.'}</div>`}</div>`;
    };
    paint();
    if (d.owner) {
      $('#ct').onclick = e => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.t; $$('#ct button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(); };
      $('#copy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(c.code).then(() => toast('✓', 'Cod copiat')); };
      $('#delc').onclick = async () => { if (confirm(`Ștergi clasa „${c.name}” cu toate temele și rezultatele?`)) { await API.del('/api/classes/' + c.id); toast('✓', 'Clasă ștearsă'); go('#/clase'); } };
    }
  }

  /* ---------------- o temă (elev: rezolvare; profesor: rezultate) ---------------- */
  const reviewHtml = (rev) => rev.map((x, i) => `
    <div class="qrev"><div class="qn">${i + 1}</div><div>
      <p class="qq">${esc(x.q)}</p>
      <div class="rev-opts">${x.o.map((o, j) => `<div class="ro ${j === x.a ? 'right' : j === x.picked ? 'wrong' : ''}"><span>${'ABCDEF'[j]}</span>${esc(o)}${j === x.picked ? '<i>răspunsul tău</i>' : ''}</div>`).join('')}</div>
      ${x.e ? `<p class="hint">${esc(x.e)}</p>` : ''}</div></div>`).join('');

  async function assignmentPage(id) {
    const d = await API.get('/api/assignments/' + id);
    const back = `<a class="back" href="#/clase/${d.classId}">← ${esc(d.className)}</a>`;
    const head = `<span class="eyebrow">Temă · ${esc(d.className)}${d.due ? ' · termen ' + fmtDate(d.due) : ''}</span><h1 class="page-h">${esc(d.title)}</h1>${d.descr ? `<p class="lead">${esc(d.descr)}</p>` : ''}${d.lessonId ? `<p><a class="btn sm ghost" href="#/invata" id="lessonLink">Recitește lecția „${esc((LESSONS.find(l => l.id === d.lessonId) || {}).title || '')}”</a></p>` : ''}`;

    if (d.owner) {
      const avg = d.submissions.length ? (d.submissions.reduce((s, x) => s + x.score / x.total, 0) / d.submissions.length * 100).toFixed(0) : null;
      host().innerHTML = `${back}${head}
        <div class="stats" style="grid-template-columns:repeat(3,1fr);max-width:640px;margin:24px 0"><div class="stat"><b>${d.submissions.length}</b><span>Au predat</span></div><div class="stat"><b>${d.missing.length}</b><span>Nu au predat</span></div><div class="stat"><b>${avg === null ? '—' : avg + '%'}</b><span>Medie</span></div></div>
        <div class="two-col">
          <div class="card board"><h4>Rezultate</h4>${d.submissions.length ? `<table><thead><tr><th>Elev</th><th>Predat</th><th style="text-align:right">Scor</th></tr></thead><tbody>${d.submissions.map(s => `<tr><td>${esc(s.user)}</td><td class="mono">${fmtDT(s.created)}</td><td class="pts">${s.score}/${s.total}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Nimeni nu a predat încă.</div>'}
            ${d.missing.length ? `<p class="hint" style="margin-top:14px"><b>Nu au predat:</b> ${d.missing.map(esc).join(', ')}</p>` : ''}</div>
          <div class="card"><div class="board"><h4>Cât de bine au răspuns, pe întrebări</h4></div>${d.stats.map((s, i) => `<div class="bar-row"><span>${i + 1}. ${esc(s.q.slice(0, 70))}</span><div class="bar"><i style="width:${s.pct || 0}%"></i></div><b>${s.pct === null ? '—' : s.pct + '%'}</b></div>`).join('')}</div>
        </div>
        <div style="margin-top:20px"><button class="btn sm ghost danger" id="dela">Șterge tema</button></div>`;
      $('#dela').onclick = async () => { if (confirm('Ștergi tema și toate rezultatele ei?')) { await API.del('/api/assignments/' + id); toast('✓', 'Temă ștearsă'); go('#/clase/' + d.classId); } };
      return;
    }
    if (d.done) {
      host().innerHTML = `${back}${head}<div class="card score-card"><b>${d.score}<small>/${d.total}</small></b><span>Ai predat această temă</span></div><div class="card" style="margin-top:14px">${reviewHtml(d.review)}</div>`;
      return;
    }
    host().innerHTML = `${back}${head}
      <form class="card quiz" id="qz">${d.questions.map((x, i) => `
        <fieldset class="qrev"><legend class="sr">Întrebarea ${i + 1}</legend><div class="qn">${i + 1}</div><div>
          <p class="qq">${esc(x.q)}</p>
          <div class="rev-opts">${x.o.map((o, j) => `<label class="ro pick"><input type="radio" name="q${i}" value="${j}"><span>${'ABCDEF'[j]}</span>${esc(o)}</label>`).join('')}</div></div></fieldset>`).join('')}
        <div class="quiz-foot"><span class="hint" id="qcount">0 / ${d.questions.length} răspunsuri</span><button class="btn lime" type="submit">Predă tema</button></div></form>`;
    const form = $('#qz');
    form.onchange = () => { $('#qcount').textContent = `${$$('input:checked', form).length} / ${d.questions.length} răspunsuri`; };
    form.onsubmit = async e => {
      e.preventDefault();
      const answers = d.questions.map((_, i) => { const c = form.querySelector(`input[name="q${i}"]:checked`); return c ? +c.value : null; });
      const blank = answers.filter(a => a === null).length;
      if (blank && !confirm(`${blank} întrebări rămân fără răspuns. Predai oricum? Nu mai poți reveni.`)) return;
      try {
        const r = await API.post(`/api/assignments/${id}/submit`, { answers });
        MI.addXP(10 + r.score * 5); MI.checkBadges(); toast('✓', `Temă predată: ${r.score}/${r.total} · +${10 + r.score * 5} XP`);
        host().innerHTML = `${back}${head}<div class="card score-card"><b>${r.score}<small>/${r.total}</small></b><span>Rezultatul tău</span></div><div class="card" style="margin-top:14px">${reviewHtml(r.review)}</div>`;
        window.scrollTo({ top: 0 });
      } catch (ex) { toast('!', ex.message); }
    };
  }

  /* ---------------- temă nouă (profesor) ---------------- */
  let draft = null, src = 'banca';
  const blankDraft = () => ({ title: '', descr: '', due: '', lessonId: '', questions: [] });

  async function newAssignmentPage(classId) {
    if (API.st.user.role !== 'teacher') throw new Error('Doar profesorii pot da teme.');
    if (!draft || draft.classId !== classId) { draft = { ...blankDraft(), classId }; }
    host().innerHTML = `
      <a class="back" href="#/clase/${classId}">← Înapoi la clasă</a>
      <span class="eyebrow">Temă nouă</span><h1 class="page-h">Dă o temă</h1>
      <div class="two-col wide-left">
        <div class="card" style="display:grid;gap:14px">
          <div class="field"><label for="dt">Titlu</label><input id="dt" maxlength="100" placeholder="ex: Funcția de gradul II — exerciții" value="${esc(draft.title)}"></div>
          <div class="field"><label for="dd">Indicații (opțional)</label><input id="dd" maxlength="300" value="${esc(draft.descr)}"></div>
          <div class="row2"><div class="field"><label for="du">Termen</label><input id="du" type="date" value="${esc(draft.due)}"></div>
            <div class="field"><label for="dl">Lecție recomandată</label><select id="dl"><option value="">Fără</option>${LESSONS.map(l => `<option value="${l.id}" ${draft.lessonId === l.id ? 'selected' : ''}>${esc(l.n + ' · ' + l.title)}</option>`).join('')}</select></div></div>
          <div class="seg" id="srcTabs"><button data-s="banca" aria-pressed="${src === 'banca'}">Din bancă</button><button data-s="manual" aria-pressed="${src === 'manual'}">Scrie singur</button><button data-s="ai" aria-pressed="${src === 'ai'}">Generează cu AI</button></div>
          <div id="srcPanel"></div>
        </div>
        <div class="card" style="align-self:start;position:sticky;top:90px"><h4 class="mini-h">Întrebările temei · <span id="dcount">0</span></h4><div id="dlist"></div>
          <button class="btn lime" id="pub" style="margin-top:16px;width:100%;justify-content:center">Trimite tema elevilor</button></div>
      </div>`;
    const bind = (id, k) => { $('#' + id).oninput = e => { draft[k] = e.target.value; }; };
    bind('dt', 'title'); bind('dd', 'descr'); bind('du', 'due'); bind('dl', 'lessonId');
    $('#srcTabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; src = b.dataset.s; $$('#srcTabs button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); paintSrc(); };
    paintSrc(); paintDraft();
    $('#pub').onclick = async () => {
      if (!draft.title.trim()) return toast('!', 'Adaugă un titlu');
      if (!draft.questions.length) return toast('!', 'Adaugă cel puțin o întrebare');
      try {
        await API.post(`/api/classes/${classId}/assignments`, { title: draft.title, descr: draft.descr, lessonId: draft.lessonId || null, due: draft.due ? new Date(draft.due + 'T23:59:00').getTime() : null, questions: draft.questions });
        draft = null; toast('✓', 'Temă trimisă elevilor'); go('#/clase/' + classId);
      } catch (ex) { toast('!', ex.message); }
    };
  }

  function addQ(q) {
    if (draft.questions.some(x => x.q === q.q)) return toast('!', 'Întrebarea este deja în temă');
    if (draft.questions.length >= 30) return toast('!', 'Maximum 30 de întrebări');
    draft.questions.push({ q: q.q, o: [...q.o], a: q.a, e: q.e || '' }); paintDraft();
  }
  function paintDraft() {
    $('#dcount').textContent = draft.questions.length;
    $('#dlist').innerHTML = draft.questions.length ? draft.questions.map((x, i) => `
      <div class="dq"><div class="dq-t"><b>${i + 1}.</b> ${esc(x.q)}</div>
        <div class="dq-o">${x.o.map((o, j) => `<span class="${j === x.a ? 'right' : ''}">${esc(o)}</span>`).join('')}</div>
        <button class="rm" data-i="${i}" aria-label="Șterge întrebarea ${i + 1}">✕</button></div>`).join('') : '<p class="hint">Nicio întrebare încă. Alege din bancă, scrie-ți propriile întrebări sau generează cu AI.</p>';
    $('#dlist').onclick = e => { const b = e.target.closest('.rm'); if (b) { draft.questions.splice(+b.dataset.i, 1); paintDraft(); } };
  }

  let bankSubj = 'mix', bankText = '';
  function paintSrc() {
    const p = $('#srcPanel');
    if (src === 'banca') {
      p.innerHTML = `<div class="row2"><div class="seg" id="bs">${['mix', 'mate', 'info'].map(s => `<button data-s="${s}" aria-pressed="${bankSubj === s}">${s === 'mix' ? 'Toate' : subjName(s)}</button>`).join('')}</div>
        <input id="bq" class="search" placeholder="Caută în întrebări…" value="${esc(bankText)}"></div><div class="bank" id="bank"></div>`;
      const paintBank = () => {
        const list = QUESTIONS.filter(q => (bankSubj === 'mix' || q.s === bankSubj) && (!bankText || (q.q + ' ' + q.t).toLowerCase().includes(bankText.toLowerCase())));
        $('#bank').innerHTML = list.map(q => { const i = QUESTIONS.indexOf(q); return `<div class="bq"><div><span class="chip ${q.s}">${esc(q.t)}</span><p>${esc(q.q)}</p></div><button class="btn sm ghost" data-i="${i}">Adaugă</button></div>`; }).join('') || '<p class="hint">Nicio întrebare găsită.</p>';
      };
      paintBank();
      $('#bs').onclick = e => { const b = e.target.closest('button'); if (b) { bankSubj = b.dataset.s; paintSrc(); } };
      $('#bq').oninput = e => { bankText = e.target.value; paintBank(); };
      $('#bank').onclick = e => { const b = e.target.closest('[data-i]'); if (b) { addQ(QUESTIONS[+b.dataset.i]); } };
    } else if (src === 'manual') {
      p.innerHTML = `<div class="field"><label for="mq">Întrebarea</label><textarea id="mq" rows="2" maxlength="500"></textarea></div>
        ${[0, 1, 2, 3].map(i => `<div class="opt-row"><input type="radio" name="mc" value="${i}" ${i === 0 ? 'checked' : ''} aria-label="Varianta ${'ABCD'[i]} este corectă"><input class="mo" maxlength="200" placeholder="Varianta ${'ABCD'[i]}${i < 2 ? '' : ' (opțional)'}"></div>`).join('')}
        <div class="field"><label for="me">Explicația rezolvării (opțional)</label><input id="me" maxlength="500"></div>
        <button class="btn sm" id="madd" type="button">Adaugă întrebarea</button><p class="hint">Bifează varianta corectă.</p>`;
      $('#madd').onclick = () => {
        const opts = $$('.mo', p).map((x, i) => ({ t: x.value.trim(), i })).filter(x => x.t);
        const correct = +p.querySelector('input[name="mc"]:checked').value, ci = opts.findIndex(x => x.i === correct);
        const q = $('#mq').value.trim();
        if (q.length < 3 || opts.length < 2) return toast('!', 'Scrie întrebarea și cel puțin două variante');
        if (ci < 0) return toast('!', 'Varianta bifată ca fiind corectă este goală');
        addQ({ q, o: opts.map(x => x.t), a: ci, e: $('#me').value.trim() });
        $('#mq').value = ''; $$('.mo', p).forEach(x => x.value = ''); $('#me').value = '';
      };
    } else {
      const on = API.st.ai;
      p.innerHTML = `${on ? '' : '<p class="note">AI-ul nu este configurat pe server (lipsește <code>GEMINI_API_KEY</code> în <code>.env</code>). Poți folosi banca sau întrebările scrise de tine.</p>'}
        <div class="field"><label for="at">Subiect</label><input id="at" maxlength="200" placeholder="ex: ecuația de gradul II, discriminant" ${on ? '' : 'disabled'}></div>
        <div class="row2"><div class="field"><label for="an">Număr de întrebări</label><select id="an" ${on ? '' : 'disabled'}>${[3, 5, 8, 10].map(n => `<option ${n === 5 ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="field"><label for="al">Pe baza lecției</label><select id="al" ${on ? '' : 'disabled'}><option value="">Fără</option>${LESSONS.map(l => `<option value="${l.id}">${esc(l.n + ' · ' + l.title)}</option>`).join('')}</select></div></div>
        <button class="btn sm" id="agen" type="button" ${on ? '' : 'disabled'}>Generează</button>
        <p class="hint">Verifică întrebările generate înainte să trimiți tema — AI-ul poate greși.</p>`;
      $('#agen').onclick = async () => {
        const btn = $('#agen'); btn.disabled = true; btn.textContent = 'Se generează…';
        try {
          const r = await API.post('/api/ai/questions', { topic: $('#at').value || (LESSONS.find(l => l.id === $('#al').value) || {}).title || '', n: +$('#an').value, lessonId: $('#al').value || null });
          r.questions.forEach(addQ); toast('✓', `${r.questions.length} întrebări adăugate — verifică-le`);
        } catch (ex) { toast('!', ex.message); } finally { btn.disabled = false; btn.textContent = 'Generează'; }
      };
    }
  }
})();
