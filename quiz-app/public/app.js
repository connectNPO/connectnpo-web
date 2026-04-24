import { QUESTIONS, CATEGORIES, GRADE_LABEL } from './questions.js';

const state = {
  step: 'landing',
  orgInfo: {},
  answers: new Array(QUESTIONS.length).fill(null),
  currentQuestion: 0,
  score: null,
  grade: null,
  categoryScores: {},
  weakCategories: [],
  email: null,
  contactName: null,
  utm: parseUtm()
};

function parseUtm() {
  const p = new URLSearchParams(window.location.search);
  return {
    source:   p.get('utm_source')   || null,
    medium:   p.get('utm_medium')   || null,
    campaign: p.get('utm_campaign') || null
  };
}

const SECTIONS = ['landing', 'org', 'quiz', 'results', 'email', 'thanks'];

function show(step) {
  state.step = step;
  SECTIONS.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.classList.toggle('hidden', s !== step);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ LANDING ============
document.getElementById('btn-start').addEventListener('click', () => show('org'));

// ============ ORG INFO ============
document.getElementById('form-org').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  state.orgInfo = {
    orgName:       fd.get('orgName')?.trim(),
    revenueRange:  fd.get('revenueRange'),
    orgType:       fd.get('orgType'),
    fiscalYearEnd: fd.get('fiscalYearEnd')
  };
  state.currentQuestion = 0;
  renderQuestion();
  show('quiz');
});

// ============ QUIZ ============
function renderQuestion() {
  const q = QUESTIONS[state.currentQuestion];
  const total = QUESTIONS.length;
  const n = state.currentQuestion + 1;

  document.getElementById('progress-label').textContent = `Question ${n} of ${total}`;
  document.getElementById('progress-category').textContent = CATEGORIES[q.category].label;
  document.getElementById('progress-fill').style.width = `${(n / total) * 100}%`;
  document.getElementById('question-text').textContent = q.text;

  const backBtn = document.getElementById('btn-back');
  backBtn.disabled = state.currentQuestion === 0;
}

document.querySelectorAll('.answer-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const value = parseInt(btn.dataset.value, 10);
    state.answers[state.currentQuestion] = value;

    if (state.currentQuestion < QUESTIONS.length - 1) {
      state.currentQuestion++;
      renderQuestion();
    } else {
      calculateScore();
      renderResults();
      show('results');
    }
  });
});

document.getElementById('btn-back').addEventListener('click', () => {
  if (state.currentQuestion > 0) {
    state.currentQuestion--;
    renderQuestion();
  }
});

// ============ SCORING ============
function calculateScore() {
  const catScores = {};
  for (const key of Object.keys(CATEGORIES)) catScores[key] = 0;

  QUESTIONS.forEach((q, i) => {
    const ans = state.answers[i] ?? 0;
    catScores[q.category] += ans;
  });

  const total = Object.values(catScores).reduce((a, b) => a + b, 0);
  state.score = total;
  state.categoryScores = catScores;
  state.grade = total >= 30 ? 'Green' : total >= 20 ? 'Yellow' : 'Red';

  state.weakCategories = Object.entries(catScores)
    .filter(([key, sc]) => sc < CATEGORIES[key].max * 0.5)
    .map(([key]) => key);
}

// ============ RESULTS ============
function renderResults() {
  animateScore(state.score);

  const badge = document.getElementById('grade-badge');
  badge.classList.remove('grade-green', 'grade-yellow', 'grade-red');
  badge.classList.add(`grade-${state.grade.toLowerCase()}`);
  document.getElementById('grade-label').textContent = GRADE_LABEL[state.grade];

  const bars = document.getElementById('category-bars');
  bars.innerHTML = '';
  for (const [key, meta] of Object.entries(CATEGORIES)) {
    const sc = state.categoryScores[key] || 0;
    const pct = (sc / meta.max) * 100;
    const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

    const row = document.createElement('div');
    row.innerHTML = `
      <div class="flex justify-between text-sm mb-1">
        <span class="font-medium">${meta.label}</span>
        <span class="text-slate-500">${sc} / ${meta.max}</span>
      </div>
      <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div class="bar-fill h-full ${color}" style="width: 0%"></div>
      </div>
    `;
    bars.appendChild(row);

    requestAnimationFrame(() => {
      row.querySelector('.bar-fill').style.width = `${pct}%`;
    });
  }
}

function animateScore(target) {
  const el = document.getElementById('score-number');
  const duration = 800;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.getElementById('btn-get-report').addEventListener('click', () => show('email'));

// ============ EMAIL SUBMIT ============
document.getElementById('form-email').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  state.contactName = fd.get('contactName')?.trim();
  state.email = fd.get('email')?.trim();

  const btn = document.getElementById('btn-submit');
  const errBox = document.getElementById('submit-error');
  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...state.orgInfo,
        contactName: state.contactName,
        email: state.email,
        score: state.score,
        grade: state.grade,
        weakCategories: state.weakCategories,
        answers: state.answers.map((val, i) => ({
          questionId: QUESTIONS[i].id,
          value: val
        })),
        utm: state.utm
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Submission failed');

    document.getElementById('confirm-email').textContent = state.email;

    const bookBtn = document.getElementById('btn-book');
    if (data.consultationUrl) bookBtn.href = data.consultationUrl;

    show('thanks');

  } catch (err) {
    errBox.textContent = `Something went wrong: ${err.message}. Please try again or email us directly.`;
    errBox.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Send My Report';
  }
});
