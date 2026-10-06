/* Traducere RO ⇄ EN. Româna este sursa; engleza se aplică (1) pe date: lecții, întrebări, tutor și (2) pe interfață,
   prin dicționar + reguli, la nivel de noduri de text. Schimbarea limbii reîncarcă pagina. */
const I18N = (() => {
  let lang = 'ro';
  try { lang = localStorage.getItem('mi9-lang') || 'ro'; } catch (e) { /* ignorat */ }
  if (lang !== 'en') lang = 'ro';

  /* ---------------- dicționar: textul exact (spații normalizate) → engleză ---------------- */
  const DICT = {
    // meniu, subsol, general
    'Învață': 'Learn', 'Tutor AI': 'AI Tutor', 'Arena': 'Arena', 'Clase': 'Classes', 'Laborator': 'Lab', 'Profil': 'Profile', 'Intră': 'Sign in',
    'Principal': 'Main', 'Schimbă tema': 'Toggle theme', 'Nivel și XP': 'Level and XP', 'Închide': 'Close', 'Cont': 'Account',
    'Proiect DIGI-EQUAL · digitalizare și egalitate de șanse în educație': 'DIGI-EQUAL project · digitalisation and equal opportunities in education',
    'Cu cont, progresul și temele se salvează pe server.': 'With an account, your progress and homework are saved on the server.',
    'Liceul Teoretic „Emil Racoviță” Vaslui · clasa a IX-a': 'Emil Racoviță Theoretical High School, Vaslui · 9th grade',
    'Matematică': 'Mathematics', 'Informatică': 'Computer Science', 'Mix': 'Mix', 'Toate': 'All',
    // acasă
    'Învață.': 'Learn.', 'Întreabă.': 'Ask.', 'Învinge.': 'Win.',
    'Matematică și Informatică într-un singur loc: lecții scurte, un tutor care răspunde oricând și dueluri H2H cu cronometru. Fără meditații plătite, fără frica de greșeală.': 'Maths and Computer Science in one place: short lessons, a tutor that answers anytime and timed H2H duels. No paid tutoring, no fear of making mistakes.',
    'Intră în arenă': 'Enter the arena', 'Întreabă tutorul': 'Ask the tutor',
    '01 · Lecții': '01 · Lessons', '02 · Tutor AI': '02 · AI Tutor', '03 · Arena H2H': '03 · H2H Arena', '04 · Laborator': '04 · Lab',
    'De la mulțimi și funcția de gradul II, până la Euclid, baze de numerație și sortări în C++.': 'From sets and quadratic functions to Euclid, number bases and sorting in C++.',
    'Răspunde pe loc, pas cu pas': 'Answers on the spot, step by step',
    ', deci x₁ =': ', so x₁ =', 'și x₂ =': 'and x₂ =', '. Verificare Viète: S = 5, P = 6 ✓': '. Viète check: S = 5, P = 6 ✓',
    'Duel de cunoștințe. 15 secunde pe întrebare.': 'A knowledge duel. 15 seconds per question.',
    'Contra unui rival digital sau față în față cu un coleg, pe același ecran. Răspunsul corect și rapid aduce cele mai multe puncte.': 'Against a digital rival or face to face with a classmate on the same screen. A correct, fast answer earns the most points.',
    'Tu': 'You', 'Rival': 'Rival', 'VS': 'VS',
    'Mișcă parabola': 'Move the parabola', 'Schimbă a, b, c și vezi vârful, discriminantul și rădăcinile live.': 'Change a, b, c and see the vertex, discriminant and roots live.',
    'Cum funcționează': 'How it works', 'Înveți': 'You learn', 'Întrebi': 'You ask', 'Te măsori': 'You compete',
    'Citești lecția, vezi exemplul și o marchezi ca învățată pentru XP.': 'Read the lesson, see the example and mark it as learned for XP.',
    'Nu ai înțeles ceva? Scrii ecuația sau întrebarea și primești rezolvarea cu pași.': 'Did not understand something? Type the equation or the question and get a step-by-step solution.',
    'Intri într-un duel, aduni puncte, deblochezi insigne și urci în clasament.': 'Join a duel, collect points, unlock badges and climb the leaderboard.',
    'cmmdc(48, 36) = 12': 'gcd(48, 36) = 12', '25 → 11001 (baza 2)': '25 → 11001 (base 2)',
    // învață
    'Programa clasei a IX-a': '9th grade curriculum',
    'Lecții scurte, cu exemple. Marchează-le ca învățate (+20 XP) și deblochează insigne.': 'Short lessons with examples. Mark them as learned (+20 XP) and unlock badges.',
    'Marchează ca învățată': 'Mark as learned', 'Parcursă ✓ (anulează)': 'Done ✓ (undo)', 'Întreabă AI despre lecție': 'Ask AI about this lesson',
    'Deschide graficul': 'Open the graph', 'Antrenează-te în arenă': 'Practise in the arena', 'neparcursă': 'not completed', 'parcursă': 'completed',
    'Lecție parcursă · +20 XP': 'Lesson completed · +20 XP',
    // tutor
    'Asistent AI · 24/7 · gratuit': 'AI assistant · 24/7 · free',
    'Scrie o ecuație, un calcul sau o nelămurire. Rezolv pas cu pas și îți explic de ce.': 'Type an equation, a calculation or a question. I solve step by step and explain why.',
    'Întreabă despre lecție': 'Ask about a lesson', 'Lecție': 'Lesson', 'Orice subiect': 'Any topic',
    'Alege o lecție și AI-ul răspunde pornind de la ea.': 'Pick a lesson and the AI answers based on it.',
    'Încearcă': 'Try', 'Șterge': 'Clear', '⚙ Setări': '⚙ Settings', 'Mesaj': 'Message', 'Trimite': 'Send',
    'Scrie aici… ex: x^2 - 4x + 3 = 0': 'Type here… e.g. x^2 - 4x + 3 = 0',
    'Tutorul local rezolvă ecuații, calcule și algoritmi fără internet. Pentru răspunsuri la orice întrebare, adaugă o cheie gratuită Gemini (de la Google AI Studio). Cheia rămâne doar în browserul tău.': 'The local tutor solves equations, calculations and algorithms offline. For answers to any question, add a free Gemini key (from Google AI Studio). The key stays only in your browser.',
    'Cheie API Gemini': 'Gemini API key', 'Model': 'Model', 'Salvează': 'Save', 'Șterge cheia': 'Delete key',
    'AI școală + tutor local': 'School AI + local tutor', 'Gemini + tutor local': 'Gemini + local tutor', 'Tutor local · fără internet': 'Local tutor · offline',
    'Gemini activat': 'Gemini enabled', 'Folosesc tutorul local': 'Using the local tutor', 'Cheia a fost ștearsă': 'The key was deleted',
    'x^2 - 5x + 6 = 0': 'x^2 - 5x + 6 = 0', '3x + 2 = 11': '3x + 2 = 11', '(3 + 4) * 2^3 - sqrt(49)': '(3 + 4) * 2^3 - sqrt(49)',
    'cmmdc 48 36': 'gcd 48 36', 'Este 97 număr prim?': 'Is 97 a prime number?', 'binar 25': 'binary 25',
    'Explică-mi discriminantul': 'Explain the discriminant to me', 'Cum funcționează bubble sort?': 'How does bubble sort work?',
    'Distanța dintre A(0,0) și B(3,4)': 'Distance between A(0,0) and B(3,4)',
    // arena
    'Head-to-Head': 'Head-to-Head', 'Materie': 'Subject', 'Adversar': 'Opponent',
    '7 întrebări, 15 secunde fiecare. Corect = 100 puncte + bonus de viteză până la 50.': '7 questions, 15 seconds each. Correct = 100 points + a speed bonus of up to 50.',
    'Contra rivalului digital': 'Against the digital rival', 'Doi jucători, același ecran': 'Two players, same screen',
    'Dificultate rival': 'Rival difficulty', 'Ușor': 'Easy', 'Mediu': 'Medium', 'Greu': 'Hard',
    'Numele tău': 'Your name', 'ex: Andrei': 'e.g. Andrew', 'Jucător 2': 'Player 2', 'ex: Maria': 'e.g. Maria',
    'Jucător 1: tastele A S D F · Jucător 2: tastele J K L ; (sau atingi răspunsul pe ecran).': 'Player 1: keys A S D F · Player 2: keys J K L ; (or tap the answer on screen).',
    'Răspunzi cu mouse-ul/atingere sau cu tastele 1 2 3 4 (ori A S D F).': 'Answer with the mouse/touch or with keys 1 2 3 4 (or A S D F).',
    'Începe duelul': 'Start the duel', 'Clasament local': 'Local leaderboard', 'Clasament școală · XP': 'School leaderboard · XP',
    'Elev': 'Student', 'Dueluri': 'Duels', 'Puncte': 'Points', 'Nivel': 'Level', 'XP': 'XP',
    'Încă nu a jucat nimeni. Primul duel te pune în clasament.': 'Nobody has played yet. Your first duel puts you on the leaderboard.',
    'gândește…': 'thinking…', 'se gândește…': 'thinking…', 'a răspuns': 'answered', 'greșit': 'wrong', 'timp expirat': 'time is up',
    'Explicație': 'Explanation', 'Următoarea': 'Next', 'Vezi rezultatul': 'See the result', 'TU': 'YOU', 'RIVAL': 'RIVAL',
    'Rezultat final': 'Final result', 'Rezultat final · online': 'Final result · online', 'Ai câștigat.': 'You won.', 'Egal.': 'Draw.', 'Rivalul câștigă.': 'The rival wins.',
    'Adversarul a abandonat.': 'Your opponent gave up.', 'Ai abandonat.': 'You gave up.',
    'Revanșă': 'Rematch', 'Meniu': 'Menu', 'Înapoi în arenă': 'Back to the arena', 'Abandonează duelul': 'Give up the duel',
    'Adversar găsit': 'Opponent found', 'Pregătește-te…': 'Get ready…', 'Rezultatul apare imediat…': 'The result appears in a moment…', 'Următoarea întrebare imediat…': 'Next question in a moment…',
    'Rival ușor': 'Easy rival', 'Rival mediu': 'Medium rival', 'Rival greu': 'Hard rival',
    'Fără greșeală +30': 'No mistakes +30',
    // online
    'Duel online': 'Online duel', 'Joacă în timp real împotriva unui coleg de pe alt telefon sau calculator.': 'Play in real time against a classmate on another phone or computer.',
    'Intră în cont': 'Sign in', 'Împotriva unui coleg, în timp real. Același set de întrebări, același cronometru.': 'Against a classmate, in real time. Same set of questions, same timer.',
    'conectat': 'connected', 'Meci rapid': 'Quick match', 'Creează cameră': 'Create a room', 'COD CAMERĂ': 'ROOM CODE',
    'Se caută un adversar…': 'Looking for an opponent…', 'Rămâi pe această pagină. Un alt elev trebuie să apese „Meci rapid” la aceeași materie.': 'Stay on this page. Another student has to press “Quick match” for the same subject.',
    'Anulează': 'Cancel', 'Camera ta este deschisă': 'Your room is open', 'Dă-i prietenului acest cod:': 'Give your friend this code:', 'Închide camera': 'Close the room',
    'Dueluri între dispozitive diferite au nevoie de server. Pornește-l cu': 'Duels between different devices need the server. Start it with', 'sau publică proiectul pe Vercel.': 'or publish the project on Vercel.',
    'Serverul rulează, dar nu poate folosi baza de date:': 'The server is running but cannot use the database:',
    'Verifică variabilele TURSO_DATABASE_URL și TURSO_AUTH_TOKEN în Vercel și fă Redeploy.': 'Check the TURSO_DATABASE_URL and TURSO_AUTH_TOKEN variables in Vercel and Redeploy.',
    'Abandonezi duelul? Adversarul câștigă.': 'Give up the duel? Your opponent wins.',
    // lab
    'Experimentează': 'Experiment', 'Instrumente interactive ca să vezi cum se comportă formulele, nu doar să le știi.': 'Interactive tools to see how formulas behave, not just to know them.',
    'Funcția de gradul II': 'Quadratic function', 'f(x) = ax² + bx + c — mișcă glisoarele.': 'f(x) = ax² + bx + c — move the sliders.', 'Graficul funcției de gradul II': 'Graph of the quadratic function',
    'Algoritmul lui Euclid': "Euclid's algorithm", 'cmmdc și cmmmc cu toți pașii.': 'GCD and LCM with all the steps.', 'Calculează': 'Calculate',
    'Primul număr': 'First number', 'Al doilea număr': 'Second number', 'Numărul': 'The number',
    'Convertor de baze': 'Base converter', 'Introdu un număr într-o bază, vezi-l în toate.': 'Enter a number in one base and see it in all of them.',
    'Introdu două numere naturale nenule.': 'Enter two non-zero natural numbers.',
    'ramuri în sus · minim': 'opens upward · minimum', 'ramuri în jos · maxim': 'opens downward · maximum', 'fără rădăcini reale': 'no real roots',
    // profil
    'Progresul tău': 'Your progress', 'Nume': 'Name', 'ex: Andrei P.': 'e.g. Andrew P.', 'Resetează tot progresul': 'Reset all progress',
    'Dueluri ': 'Duels', 'Victorii': 'Wins', 'Acuratețe': 'Accuracy', 'Serie maximă': 'Best streak', 'Lecții parcurse': 'Lessons completed', 'Întrebări AI': 'AI questions',
    'Nume salvat': 'Name saved',
    'Sigur ștergi tot progresul (XP, insigne, clasament, chat)?': 'Delete all progress (XP, badges, leaderboard, chat)?',
    // insigne
    'Prima luptă': 'First fight', 'Termină primul duel H2H.': 'Finish your first H2H duel.',
    'Învingător': 'Winner', 'Câștigă un duel.': 'Win a duel.', 'Veteran H2H': 'H2H veteran', 'Câștigă 5 dueluri.': 'Win 5 duels.',
    'Fără greșeală': 'Flawless', 'Răspunde corect la toate întrebările unui duel.': 'Answer every question of a duel correctly.',
    'Pe val': 'On a roll', '5 răspunsuri corecte la rând.': '5 correct answers in a row.',
    'Față în față': 'Face to face', 'Joacă un duel în doi pe același ecran.': 'Play a two-player duel on the same screen.',
    'Curios': 'Curious', 'Pune prima întrebare tutorului.': 'Ask the tutor your first question.',
    'Studios': 'Studious', 'Marchează 3 lecții ca fiind învățate.': 'Mark 3 lessons as learned.',
    'Absolvent': 'Graduate', 'Termină toate lecțiile.': 'Finish all the lessons.',
    // cont
    'Contul meu': 'My account', 'Intră în cont ': 'Sign in', 'Cont nou': 'New account', 'Am cont': 'I have an account', 'Profesor': 'Teacher',
    'Utilizator': 'Username', 'Nume afișat': 'Display name', 'Parolă': 'Password', 'Parolă (minim 6 caractere)': 'Password (at least 6 characters)',
    'Cod profesor (de la administratorul școlii)': 'Teacher code (from the school administrator)', 'Creează cont': 'Create account',
    'Profesor — poți crea clase și da teme.': 'Teacher — you can create classes and assign homework.',
    'Elev — alătură-te unei clase cu codul primit de la profesor.': 'Student — join a class with the code from your teacher.',
    'Clasele mele': 'My classes', 'Ieși din cont': 'Sign out', 'Ai ieșit din cont': 'You signed out',
    // clase
    'Clasă virtuală': 'Virtual classroom', 'Serverul nu este pornit': 'The server is not running',
    'Clasele, temele și dueluri online au nevoie de server. Pornește-l cu': 'Classes, homework and online duels need the server. Start it with', 'și deschide': 'and open',
    'Profesorii creează clase și dau teme; elevii se alătură cu un cod și rezolvă temele. Progresul tău se salvează pe server.': 'Teachers create classes and assign homework; students join with a code and solve it. Your progress is saved on the server.',
    'Intră sau creează cont': 'Sign in or create an account', 'Baza de date nu răspunde': 'The database is not responding', 'Ceva nu a mers': 'Something went wrong', 'Înapoi la clase': 'Back to classes',
    'Profesor · clasă virtuală': 'Teacher · virtual classroom', 'Elev · clasă virtuală': 'Student · virtual classroom',
    'Creează o clasă, dă elevilor codul de înscriere și trimite-le teme cu auto-corectare.': 'Create a class, give students the join code and send them auto-graded homework.',
    'Alătură-te clasei profesorului cu codul primit și rezolvă temele.': "Join your teacher's class with the code you received and solve the homework.",
    'Nume clasă nouă': 'New class name', 'ex: IX B — Matematică': 'e.g. 9th B — Mathematics', 'Cod de clasă': 'Class code', 'ex: K55B4G': 'e.g. K55B4G',
    'Creează clasa': 'Create class', 'Intră în clasă': 'Join class', 'Cod de înscriere': 'Join code',
    'Nicio clasă încă. Creează prima clasă mai sus.': 'No classes yet. Create your first class above.', 'Nu ești în nicio clasă încă.': 'You are not in any class yet.',
    '← Toate clasele': '← All classes', 'Clasa ta': 'Your class', 'Copiază': 'Copy', 'Cod copiat': 'Code copied',
    '+ Temă nouă': '+ New assignment', 'Șterge clasa': 'Delete class', 'Clasă ștearsă': 'Class deleted',
    'Nicio temă încă. Apasă „Temă nouă”.': 'No assignments yet. Press “New assignment”.', 'Profesorul nu a dat nicio temă încă.': 'The teacher has not set any assignments yet.',
    'Niciun elev încă. Dă-le codul': 'No students yet. Give them the code', 'Elev ': 'Student', 'Teme predate': 'Submitted', 'De făcut': 'To do', 'Termen depășit': 'Overdue',
    'Rezultate': 'Results', 'Predat': 'Submitted', 'Scor': 'Score', 'Au predat': 'Submitted', 'Nu au predat': 'Not submitted', 'Medie': 'Average',
    'Nimeni nu a predat încă.': 'Nobody has submitted yet.', 'Cât de bine au răspuns, pe întrebări': 'How well they answered, per question',
    'Șterge tema': 'Delete assignment', 'Temă ștearsă': 'Assignment deleted', 'Ștergi tema și toate rezultatele ei?': 'Delete the assignment and all its results?',
    'Predă tema': 'Submit homework', 'Rezultatul tău': 'Your result', 'Ai predat această temă': 'You submitted this assignment', 'răspunsul tău': 'your answer',
    '← Înapoi la clasă': '← Back to class', 'Temă nouă': 'New assignment', 'Dă o temă': 'Set an assignment',
    'Titlu': 'Title', 'ex: Funcția de gradul II — exerciții': 'e.g. Quadratic function — exercises', 'Indicații (opțional)': 'Instructions (optional)', 'Termen': 'Due date',
    'Lecție recomandată': 'Recommended lesson', 'Fără': 'None', 'Din bancă': 'From the bank', 'Scrie singur': 'Write your own', 'Generează cu AI': 'Generate with AI',
    'Caută în întrebări…': 'Search questions…', 'Adaugă': 'Add', 'Nicio întrebare găsită.': 'No questions found.', 'Întrebarea': 'Question', 'Explicația rezolvării (opțional)': 'Solution explanation (optional)',
    'Adaugă întrebarea': 'Add the question', 'Bifează varianta corectă.': 'Tick the correct option.',
    'AI-ul nu este configurat pe server (lipsește': 'AI is not configured on the server (missing', '). Poți folosi banca sau întrebările scrise de tine.': '). You can use the bank or your own questions.',
    'Subiect': 'Topic', 'ex: ecuația de gradul II, discriminant': 'e.g. quadratic equation, discriminant', 'Număr de întrebări': 'Number of questions', 'Pe baza lecției': 'Based on the lesson',
    'Generează': 'Generate', 'Se generează…': 'Generating…', 'Verifică întrebările generate înainte să trimiți tema — AI-ul poate greși.': 'Check the generated questions before sending the assignment — the AI can make mistakes.',
    'Întrebările temei ·': 'Assignment questions ·', 'Trimite tema elevilor': 'Send the assignment to students', 'Nicio întrebare încă. Alege din bancă, scrie-ți propriile întrebări sau generează cu AI.': 'No questions yet. Pick from the bank, write your own or generate with AI.',
    'Temă trimisă elevilor': 'Assignment sent to students', 'Adaugă un titlu': 'Add a title', 'Adaugă cel puțin o întrebare': 'Add at least one question',
    'Maximum 30 de întrebări': 'Maximum 30 questions', 'Întrebarea este deja în temă': 'The question is already in the assignment',
    'Scrie întrebarea și cel puțin două variante': 'Write the question and at least two options', 'Varianta bifată ca fiind corectă este goală': 'The option marked as correct is empty',
    'Varianta A': 'Option A', 'Varianta B': 'Option B', 'Varianta C (opțional)': 'Option C (optional)', 'Varianta D (opțional)': 'Option D (optional)',
    'Varianta A este corectă': 'Option A is correct', 'Varianta B este corectă': 'Option B is correct', 'Varianta C este corectă': 'Option C is correct', 'Varianta D este corectă': 'Option D is correct',
    // erori server
    'AI indisponibil: serverul nu are cheie Gemini configurată': 'AI unavailable: the server has no Gemini key configured',
    'AI-ul a returnat un format neașteptat. Încearcă din nou.': 'The AI returned an unexpected format. Try again.',
    'Ai trimis deja această temă': 'You already submitted this assignment', 'Camera nu există sau a expirat': 'The room does not exist or has expired',
    'Camera nu mai este disponibilă': 'The room is no longer available', 'Cerere prea mare': 'Request too large', 'Clasa nu există': 'The class does not exist',
    'Cod de clasă invalid': 'Invalid class code', 'Cod de profesor incorect': 'Incorrect teacher code', 'Date prea mari': 'Data too large',
    'Doar elevii pot trimite teme': 'Only students can submit homework', 'Doar elevii se pot alătura unei clase': 'Only students can join a class',
    'Doar profesorii pot face asta': 'Only teachers can do this', 'Doar profesorul clasei poate da teme': 'Only the class teacher can assign homework',
    'Doar profesorul clasei poate șterge clasa': 'Only the class teacher can delete the class', 'Doar profesorul poate șterge tema': 'Only the teacher can delete the assignment',
    'Ești deja într-un meci': 'You are already in a match', 'Gemini a returnat un răspuns gol': 'Gemini returned an empty answer', 'JSON invalid': 'Invalid JSON',
    'Meciul se actualizează, mai încearcă o dată': 'The match is updating, try once more', 'Mesaj lipsă': 'Missing message',
    'Nu ai acces la această clasă': 'You do not have access to this class', 'Nu poți intra în propria cameră': 'You cannot enter your own room',
    'Numele de utilizator este deja luat': 'That username is already taken', 'Prea multe cereri. Încearcă din nou în câteva momente.': 'Too many requests. Try again in a moment.',
    'Tema nu există': 'The assignment does not exist', 'Trebuie să fii autentificat': 'You must be signed in', 'Utilizator sau parolă greșite': 'Wrong username or password',
    'Utilizator: doar litere, cifre, _ . -': 'Username: letters, digits, _ . - only', 'Rută inexistentă': 'Route not found', 'Eroare internă': 'Internal error',
    'Lipsește TURSO_DATABASE_URL (pe Vercel nu se poate folosi un fișier local). Adaugă variabilele Turso și fă Redeploy.': 'TURSO_DATABASE_URL is missing (a local file cannot be used on Vercel). Add the Turso variables and Redeploy.',
    // tipuri întrebări (chip)
    'Module': 'Absolute value', 'Funcții': 'Functions', 'Gradul II': 'Quadratics', 'Sume': 'Sums', 'Mulțimi': 'Sets', 'Radicali': 'Radicals', 'Calcul': 'Algebra', 'Inecuații': 'Inequalities',
    'Geometrie': 'Geometry', 'Vectori': 'Vectors', 'Coordonate': 'Coordinates', 'Viète': 'Viète', 'Partea întreagă': 'Integer part', 'Puteri': 'Powers', 'Șiruri': 'Sequences',
    'Prog. aritmetică': 'Arithmetic prog.', 'Prog. geometrică': 'Geometric prog.', 'Trigonometrie': 'Trigonometry', 'Logică': 'Logic',
    'Operatori': 'Operators', 'Tipuri': 'Types', 'Repetitive': 'Loops', 'Tablouri': 'Arrays', 'Baze': 'Bases', 'Complexitate': 'Complexity', 'Cifre': 'Digits', 'Euclid': 'Euclid',
    'Numere prime': 'Prime numbers', 'Condiții': 'Conditions', 'Sortări': 'Sorting', 'Switch': 'Switch', 'do-while': 'do-while',
    'Insignă nouă:': 'New badge:', 'Lecții': 'Lessons',
    // diverse
    'în': 'in', 'Se încarcă…': 'Loading…', 'Se generează': 'Generating', 'Înapoi': 'Back'
  };

  /* ---------------- reguli pentru texte cu numere / nume ---------------- */
  const RULES = [
    [/^(\d+) \/ (\d+) parcurse$/, '$1 / $2 completed'],
    [/^(\d+) \/ (\d+) răspunsuri$/, '$1 / $2 answered'],
    [/^(\d+) lecții cât să le citești în pauză$/, '$1 lessons short enough for a break'],
    [/^(\d+) \/ 150 XP până la nivelul (\d+) · total (\d+) XP$/, '$1 / 150 XP to level $2 · total $3 XP'],
    [/^Nv (\d+)$/, 'Lv $1'], [/^Nv (\d+) · (\d+) victorii$/, 'Lv $1 · $2 wins'], [/^Nivel (\d+) deblocat!$/, 'Level $1 unlocked!'],
    [/^Insigne · (\d+) \/ (\d+)$/, 'Badges · $1 / $2'], [/^Insignă nouă: (.+)$/, (m, n) => 'New badge: ' + tx(n)],
    [/^(\d+) întrebări(?: · termen (.+?))?(?: · (.*))?$/, (m, n, d, x) => `${n} questions${d ? ' · due ' + d : ''}${x ? ' · ' + x : ''}`],
    [/^Temă · (.+?)(?: · termen (.+))?$/, (m, c, d) => `Assignment · ${c}${d ? ' · due ' + d : ''}`],
    [/^Întrebarea (\d+) \/ (\d+)$/, 'Question $1 / $2'], [/^Întrebarea (\d+)$/, 'Question $1'], [/^Șterge întrebarea (\d+)$/, 'Delete question $1'],
    [/^(.+) · (\d+)\/(\d+) corecte$/, (m, n, a, b) => tx(n) + ' · ' + a + '/' + b + ' correct'], [/^Serie maximă: (\d+)$/, 'Best streak: $1'], [/^\+(\d+) puncte$/, '+$1 points'],
    [/^(Matematică|Informatică) · (.+)$/, (m, s, t) => tx(s) + ' · ' + tx(t)],
    [/^(\d+)% corect$/, '$1% correct'], [/^(\d+)V \/ (\d+)$/, '$1W / $2'],
    [/^Clasa creată · cod (\w+)$/, 'Class created · code $1'], [/^Ai intrat în (.+)$/, 'You joined $1'], [/^Bine ai venit, (.+)$/, 'Welcome, $1'],
    [/^Temă predată: (\d+)\/(\d+) · \+(\d+) XP$/, 'Homework submitted: $1/$2 · +$3 XP'],
    [/^(\d+) întrebări adăugate — verifică-le$/, '$1 questions added — please check them'],
    [/^Teme \((\d+)\)$/, 'Assignments ($1)'], [/^Elevi \((\d+)\)$/, 'Students ($1)'], [/^(\d+) elevi · (\d+) teme$/, '$1 students · $2 assignments'],
    [/^Profesor: (.+)$/, 'Teacher: $1'], [/^(\d+) predate$/, '$1 submitted'], [/^(\d+) \/ (\d+)$/, '$1 / $2'],
    [/^Recitește lecția „(.+)”$/, (m, t) => 'Re-read the lesson “' + tx(t) + '”'],
    [/^(\d\d) · (.+)$/, (m, n, t) => n + ' · ' + tx(t)],
    [/^Vârf \((.*)\)$/, 'Vertex ($1)'], [/^a = 0 → funcție de gradul I(?:, rădăcina x = (.*))?$/, (m, r) => 'a = 0 → linear function' + (r ? ', root x = ' + r : '')],
    [/^„(.+)” nu este un număr valid în baza (\d+)\.$/, '“$1” is not a valid number in base $2.'],
    [/^Răspunsul nu a ajuns: (.+)$/, (m, e) => 'Your answer did not arrive: ' + tx(e)],
    [/^Gemini: (.+)$/, 'Gemini: $1'],
    [/^(.+) lipsește$/, '$1 is missing'], [/^(.+): între (\d+) și (\d+) caractere$/, (m, l, a, b) => `${tx(l)}: between ${a} and ${b} characters`],
    [/^Ștergi clasa „(.+)” cu toate temele și rezultatele\?$/, 'Delete the class “$1” with all its assignments and results?'],
    [/^(\d+) întrebări rămân fără răspuns\. Predai oricum\? Nu mai poți reveni\.$/, '$1 questions are unanswered. Submit anyway? You cannot go back.'],
    [/^Jucător (\d)$/, 'Player $1'], [/^Rival (ușor|mediu|greu)$/, (m, l) => 'Rival ' + { 'ușor': 'easy', mediu: 'medium', greu: 'hard' }[l]],
    [/^Întrebarea (\d+): răspuns corect invalid$/, 'Question $1: invalid correct answer'], [/^Întrebarea (\d+): între 2 și 6 variante$/, 'Question $1: between 2 and 6 options'],
    [/^Trebuie între 1 și (\d+) întrebări$/, 'Between 1 and $1 questions are required'],
    [/^(\d+) \/ (\d+) corecte$/, '$1 / $2 correct']
  ];

  const ws = s => s.replace(/\s+/g, ' ').trim();
  function tx(s) {
    if (lang !== 'en' || !s) return s;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), key = ws(m[2]);
    if (!key) return s;
    if (Object.prototype.hasOwnProperty.call(DICT, key)) return m[1] + DICT[key] + m[3];
    for (const [re, rep] of RULES) { if (re.test(key)) return m[1] + key.replace(re, rep) + m[3]; }
    return s;
  }
  const hasRo = s => /[ăâîșțĂÂÎȘȚşţ]/.test(s) || /\b(și|sau|pentru|este|nu|din|cu)\b/.test(s);

  /* ---------------- DOM: traduce nodurile de text și atributele ---------------- */
  const SKIP = '.msg, .qtext, .qq, .ro, .bq p, .dq-t, .dq-o, .ans, script, style, noscript, textarea, [data-i18n="skip"]';
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  const last = new WeakMap();   // nod → ultimul text pus de noi

  function doText(n) {
    const p = n.parentElement; if (!p || p.closest(SKIP)) return;
    const cur = n.nodeValue; if (last.get(n) === cur) return;
    let out;
    if (p.closest('.tool-out')) out = cur.replace(/cmmdc/g, 'GCD').replace(/cmmmc/g, 'LCM').replace(/baza (\d+)/g, 'base $1');
    else out = tx(cur);
    if (out !== cur) { n.nodeValue = out; }
    last.set(n, out);
  }
  function doAttrs(e) {
    if (!e.getAttribute) return;
    for (const a of ATTRS) { const v = e.getAttribute(a); if (v) { const o = tx(v); if (o !== v) e.setAttribute(a, o); } }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches('script, style')) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function start() {
    document.documentElement.lang = 'en';
    document.title = tx(document.title) === document.title ? 'MathInfo 9 H2H — Learn & Arena' : tx(document.title);
    walk(document.body);
    // sincron, în microtask (înainte de desenare → fără clipire în română); înregistrările produse de noi se aruncă
    const obs = new MutationObserver(ms => {
      const todo = new Set();
      for (const m of ms) {
        if (m.type === 'childList') m.addedNodes.forEach(n => todo.add(n));
        else todo.add(m.target);
      }
      for (const n of todo) if (n.isConnected) walk(n);
      obs.takeRecords();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  /* ---------------- date: lecții, întrebări, KB ---------------- */
  function swapData() {
    if (lang !== 'en' || typeof LESSONS_EN === 'undefined') return;
    for (const l of LESSONS) { const e = LESSONS_EN[l.id]; if (e) Object.assign(l, e); }
    QUESTIONS.forEach((q, i) => { const e = QUESTIONS_EN[i]; if (e) { q.q = e.q; if (e.o) q.o = e.o; q.e = e.e; } });
    KB.forEach((k, i) => { const e = KB_EN[i]; if (e) { k.a = e.a; k.kEn = e.k; } });
    if (typeof BADGES !== 'undefined') BADGES.forEach(b => { b.name = tx(b.name); b.desc = tx(b.desc); });
  }

  function set(l) {
    try { localStorage.setItem('mi9-lang', l); } catch (e) { /* ignorat */ }
    location.reload();
  }
  const api = { get lang() { return lang; }, get locale() { return lang === 'en' ? 'en-GB' : 'ro-RO'; }, tx, t: (ro, en) => lang === 'en' ? en : ro, set, hasRo, swapData, start, DICT };
  swapData();
  // confirm()/alert() traduse
  const _confirm = window.confirm.bind(window), _alert = window.alert.bind(window);
  window.confirm = m => _confirm(tx(String(m))); window.alert = m => _alert(tx(String(m)));
  return api;
})();
