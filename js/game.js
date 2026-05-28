const YEAR_KEYS = { f2: 'f2', '34': '34', '56': '56' };

let state = {
  sport: null,        // 'bike' | 'basketball' | 'football'
  yearGroup: null,    // 'f2' | '34' | '56'
  subject: null,      // 'maths' | 'english' | 'stem'
  questions: [],      // 15 selected questions
  current: 0,         // index 0-14
  score: 0,
  correctThisLevel: 0,
  answered: false,
};

// ── Screen helpers ────────────────────────────────────────────────
function show(id) {
  ['screen-start','screen-game','screen-level','screen-end'].forEach(s => {
    document.getElementById(s).hidden = (s !== id);
  });
  const el = document.getElementById(id);
  el.classList.remove('screen-enter');
  void el.offsetWidth; // force reflow so animation re-fires
  el.classList.add('screen-enter');
}

// ── Question selection ────────────────────────────────────────────
function pickQuestions(subject, yearGroup) {
  const key = `${subject}_${yearGroup}`;
  const pool = QUESTIONS[key] || [];
  const byLevel = [1,2,3].map(l => pool.filter(q => q.l === l));
  const result = [];
  byLevel.forEach(group => {
    const shuffled = [...group].sort(() => Math.random() - 0.5);
    result.push(...shuffled.slice(0, 5));
  });
  return result;
}

// ── Start screen init ─────────────────────────────────────────────
function initStartScreen() {
  // Sport cards
  document.querySelectorAll('.sport-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.sport-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.sport = card.dataset.sport;
      document.body.dataset.sport = state.sport;
    });
  });
  // Year buttons
  document.querySelectorAll('.year-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.yearGroup = btn.dataset.year;
    });
  });
  // Subject buttons
  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.subject = btn.dataset.subject;
    });
  });
  // Play button
  document.getElementById('btn-play').addEventListener('click', () => {
    if (!state.sport || !state.yearGroup || !state.subject) {
      document.getElementById('start-warning').hidden = false;
      return;
    }
    document.getElementById('start-warning').hidden = true;
    startGame();
  });
}

// ── Game start ────────────────────────────────────────────────────
function startGame() {
  state.questions = pickQuestions(state.subject, state.yearGroup);
  state.current = 0;
  state.score = 0;
  state.correctThisLevel = 0;
  state.answered = false;
  updateGameHeader();
  show('screen-game');
  showQuestion();
}

function updateGameHeader() {
  const level = Math.floor(state.current / 5) + 1;
  const qInLevel = (state.current % 5) + 1;
  document.getElementById('hdr-level').textContent = `Level ${level}`;
  document.getElementById('hdr-q').textContent = `Q ${qInLevel}/5`;
  document.getElementById('hdr-score').textContent = `Score: ${state.score}`;
  // Progress bar
  const pct = (state.current / 15) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  // Show only the selected sport character
  document.querySelectorAll('.character-wrap').forEach(el => {
    el.classList.toggle('active', el.dataset.sport === state.sport);
  });
}

// ── Question display ──────────────────────────────────────────────
function showQuestion() {
  state.answered = false;
  const q = state.questions[state.current];
  document.getElementById('question-text').textContent = q.q;
  const btns = document.querySelectorAll('.answer-btn');
  btns.forEach((btn, i) => {
    btn.textContent = q.o[i];
    btn.className = 'answer-btn';
    btn.disabled = false;
    btn.onclick = () => handleAnswer(i);
  });
  document.getElementById('feedback-box').hidden = true;
  document.getElementById('btn-next').hidden = true;
  updateGameHeader();
}

// ── Answer handling ───────────────────────────────────────────────
function handleAnswer(chosen) {
  if (state.answered) return;
  state.answered = true;
  const q = state.questions[state.current];
  const correct = (chosen === q.a);
  const btns = document.querySelectorAll('.answer-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.a) btn.classList.add('correct');
    else if (i === chosen && !correct) btn.classList.add('wrong');
  });

  const fb = document.getElementById('feedback-box');
  const fbText = document.getElementById('feedback-text');

  if (correct) {
    state.score += 10;
    state.correctThisLevel++;
    document.getElementById('hdr-score').textContent = `Score: ${state.score}`;
    fbText.textContent = pickCorrectMessage();
    fb.className = 'feedback-box correct-fb';
    triggerCharacterAnim(true);
  } else {
    fbText.textContent = `The answer was: ${q.o[q.a]}`;
    fb.className = 'feedback-box wrong-fb';
    triggerCharacterAnim(false);
  }
  fb.hidden = false;
  document.getElementById('btn-next').hidden = false;
}

function pickCorrectMessage() {
  const msgs = ['Great work! 🎉','Nailed it! 💥','Awesome! ⭐','You got it! 🏆','Brilliant! 🌟','Yes! Keep going! 🔥'];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ── Character animation ───────────────────────────────────────────
function triggerCharacterAnim(isCorrect) {
  const wrap = document.querySelector(`.character-wrap[data-sport="${state.sport}"]`);
  if (!wrap) return;
  const cls = isCorrect ? 'anim-correct' : 'anim-wrong';
  wrap.classList.remove('anim-correct','anim-wrong');
  // Force reflow so animation re-triggers
  void wrap.offsetWidth;
  wrap.classList.add(cls);
  wrap.addEventListener('animationend', () => wrap.classList.remove(cls), { once: true });
}

// ── Next question / level transitions ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initStartScreen();

  document.getElementById('btn-next').addEventListener('click', () => {
    state.current++;
    if (state.current % 5 === 0 && state.current < 15) {
      // Level complete
      showLevelComplete();
    } else if (state.current >= 15) {
      showEndScreen();
    } else {
      showQuestion();
    }
  });

  document.getElementById('btn-continue').addEventListener('click', () => {
    state.correctThisLevel = 0;
    show('screen-game');
    showQuestion();
  });

  document.getElementById('btn-replay').addEventListener('click', () => {
    show('screen-start');
  });

  document.getElementById('btn-replay2').addEventListener('click', () => {
    startGame();
  });
});

// ── Level complete screen ─────────────────────────────────────────
function showLevelComplete() {
  const completedLevel = state.current / 5;
  document.getElementById('lc-level').textContent = completedLevel;
  document.getElementById('lc-score').textContent = `${state.correctThisLevel}/5 correct`;
  const stars = state.correctThisLevel >= 4 ? 3 : state.correctThisLevel >= 2 ? 2 : 1;
  document.getElementById('lc-stars').textContent = '⭐'.repeat(stars);
  document.getElementById('lc-next-level').textContent = completedLevel + 1;
  show('screen-level');
}

// ── End screen ────────────────────────────────────────────────────
function showEndScreen() {
  const pct = Math.round((state.score / 150) * 100);
  document.getElementById('end-score').textContent = state.score;
  document.getElementById('end-pct').textContent = pct + '%';
  const trophy = pct >= 80 ? '🥇' : pct >= 50 ? '🥈' : '🥉';
  document.getElementById('end-trophy').textContent = trophy;
  const msgs = {
    maths: 'Maths Champion', english: 'English Expert', stem: 'STEM Star'
  };
  document.getElementById('end-title').textContent = msgs[state.subject] || 'Great effort!';
  const encouragement = pct >= 80
    ? 'Amazing work! You\'re a superstar!'
    : pct >= 50
    ? 'Great effort! Keep practising!'
    : 'Good try! Play again to improve!';
  document.getElementById('end-msg').textContent = encouragement;
  show('screen-end');
}
