# MathInfo 9 H2H – Learn & Arena

Platformă web pentru Matematică și Informatică de clasa a IX-a (LT „Emil Racoviță” Vaslui): lecții, tutor AI,
dueluri H2H (local și online), clase cu profesor și teme cu auto-corectare.

Frontend static (`public/`) + API Node (`lib/core.js`) care rulează **local** (`npm start`) sau ca **funcție serverless pe Vercel**
(`api/[...path].js`). Baza de date: libSQL — fișier local în dezvoltare, **Turso** în producție.

## Rulare locală

```
npm install
npm start            # sau dublu-click pe start.bat
```

Deschide http://localhost:3000. Fără `TURSO_DATABASE_URL` se folosește fișierul `data/mathinfo.db`.
Colegii din aceeași rețea intră pe `http://IP-ul-tău:3000`. Teste: pornești serverul pe alt port
(`PORT=3100 DB_URL=file:data/test.db npm start`), apoi `node server/test.js` (BASE implicit http://localhost:3100).

## Publicare pe Vercel

Vercel nu are disc persistent, de aceea baza de date este externă (Turso, gratuit).

**1. Baza de date (Turso)**
- cont gratuit pe https://turso.tech → creează o bază de date (ex. `mathinfo9`)
- copiază **Database URL** (`libsql://mathinfo9-…turso.io`) și creează un **Auth Token**
  (CLI: `turso db show mathinfo9 --url` și `turso db tokens create mathinfo9`)

**2. Proiectul pe Vercel**
- urcă folderul pe GitHub și importă-l în Vercel („Add New → Project”); *Framework Preset: Other* (se ia automat din `vercel.json`)
- sau din terminal: `npx vercel` în folderul proiectului

**3. Variabile de mediu** (Project → Settings → Environment Variables)

| Variabilă | Valoare |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://…` din pasul 1 |
| `TURSO_AUTH_TOKEN` | tokenul din pasul 1 |
| `TEACHER_CODE` | un cod secret pentru conturile de profesor (**obligatoriu de schimbat**) |
| `GEMINI_API_KEY` | cheia Google AI Studio (opțional; fără ea AI-ul răspunde doar din baza locală) |
| `GEMINI_MODEL` | opțional, implicit `gemini-2.5-flash`; pentru precizie maximă `gemini-2.5-pro` (mai lent, limite mai mici în planul gratuit) |
| `GEMINI_THINKING` | opțional: bugetul de „gândire” (implicit automat: 0 la „Scurt”, 1024 la „Detaliat”, 4096 la „Aprofundat”; `-1` = dinamic, nelimitat) |
| `AI_VERIFY` | `auto` (implicit: verificare doar la întrebări cu calcule/cod), `always`, sau `off` |
| `GEMINI_FALLBACK_MODELS` | modele de rezervă când cel principal e supraîncărcat (implicit `gemini-2.5-flash,gemini-2.0-flash,gemini-2.5-flash-lite`) |

**4. Deploy.** Tabelele se creează automat la prima cerere. Intră pe adresa `*.vercel.app`, creează un cont de
profesor cu `TEACHER_CODE` și ești gata.

Note:
- Duelurile online folosesc *polling* (câte o cerere pe secundă pe jucător, doar cât timp jucați). Timpul și punctajul sunt calculate pe server.
- Limitarea cererilor (anti-abuz la login/AI) este în memoria fiecărei instanțe: protejează de greșeli și abuz simplu, nu de atacuri serioase.
- Funcțiile au `maxDuration` 60 s (pentru Gemini). Pe planul Hobby poate fi nevoie să-l scazi dacă Vercel refuză valoarea.

## Ce poate face

- **Română / English:** buton RO/EN în meniu (lecții, întrebări, tutor, interfață, mesaje de eroare). Textele sunt în `public/js/i18n*.js`.
- **Cont** (elev / profesor); progresul (XP, insigne, lecții) se sincronizează pe server.
- **Clase:** profesorul creează o clasă și primește un cod; elevii intră cu codul.
- **Teme:** întrebări din bancă (72), scrise de profesor sau generate cu AI; auto-corectare; rezultate pe elev și pe întrebare.
- **Duel online:** meci rapid sau cameră cu cod.
- **Lecții:** 22 (10 mate + 12 info) cu formule, exemple și cod C++.
- **Tutor AI:** răspunsul **local apare instant** (ecuații, inecuații, progresii, funcții, trigonometrie, cmmdc, baze… cu pași, plus ~30 de explicații cu exemple) și un buton opțional „Explicație detaliată cu AI”. Întrebările fără răspuns local merg la Gemini, cu draftul afișat imediat și verificat în fundal; Gemini primește: calculator exact pe server (rezultate verificate date modelului), execuție de cod, gândire extinsă, lecții relevante ca sursă, structură fixă de răspuns și **a doua trecere de verificare** (răspunsul e marcat „verificat ✓” sau „corectat la verificare”). Întrebările generate pentru teme sunt rezolvate independent de AI și cele cu cheie îndoielnică se elimină.

## Structură

```
public/               frontend (index.html, css/, js/)  — servit static
public/js/lessons.js  lecțiile   ·   public/js/data.js  întrebările și baza tutorului
lib/core.js           tot API-ul (conturi, clase, teme, AI, dueluri) + schema bazei de date
api/index.js          intrarea serverless pentru Vercel (toate /api/* sunt redirecționate aici din vercel.json)
server/server.js      server local (static + același API)
server/test.js        teste de integrare   ·   server/bot.js  adversar de test pentru dueluri
vercel.json           configurare Vercel
```

## Limitări cunoscute

- XP-ul vine de la client (un elev tehnic poate să și-l falsifice); punctajul duelurilor și notele temelor sunt calculate pe server.
- O temă se poate trimite o singură dată; nu există încă ștergerea elevilor dintr-o clasă sau resetarea parolei.
- Un jucător în așteptare cu tab-ul în fundal (telefon blocat) poate ieși din coadă după ~25 s.
- Conținutul (lecții, întrebări) a fost scris automat și merită verificat de un profesor.
