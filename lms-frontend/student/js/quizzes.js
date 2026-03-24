/* ============================================
   Student Quizzes Module
   SPA fragment: student/page/quizzes.html
============================================ */

(function () {
  'use strict';

  const WARNING_THRESHOLD_SECONDS = 5 * 60;

  const S = {
    quizzes: [],
    filtered: [],
    status: 'all',
    subjectId: '',
    search: '',
    selectedQuiz: null,
    attemptsByQuiz: new Map(),
    attemptMetaByQuiz: new Map(),
    take: null,
    timerId: null,
    isSubmitting: false,
  };

  let E = {};

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toast(message, type) {
    if (typeof showToast === 'function') {
      showToast(message, type || 'info');
      return;
    }
    console.log((type || 'info').toUpperCase() + ': ' + message);
  }

  function getUser() {
    return typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
  }

  function getStudentUuid() {
    const user = getUser();
    return String(user?.student_uuid || user?.uuid || '').trim();
  }

  function toArrayPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  }

  function toNumber(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatDateTime(v) {
    if (!v) return '-';
    const dt = new Date(v);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleString();
  }

  function formatTimer(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function getApiBaseUrl() {
    return String(typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '').replace(/\/$/, '');
  }

  function toAccessibleImageUrl(rawPath) {
    const value = String(rawPath || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/api/upload/')) return value;
    if (value.startsWith('/uploads/')) {
      const parts = value.split('/').filter(Boolean);
      if (parts.length >= 3) {
        return '/api/upload/' + parts[1] + '/' + parts.slice(2).join('/');
      }
    }
    if (!value.includes('/')) {
      return '/api/upload/quiz-questions/' + value;
    }
    return value;
  }

  function toAbsoluteUrl(path) {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;

    const base = getApiBaseUrl();
    if (!base) return value;

    if (value.startsWith('/api/') && /\/api$/i.test(base)) {
      return base + value.slice(4);
    }

    if (value.startsWith('/')) {
      return base + value;
    }

    return base + '/' + value.replace(/^\/+/, '');
  }

  function quizIdOf(quiz) {
    return toNumber(quiz?.quiz_id || quiz?.id, 0);
  }

  function draftKey(quizId) {
    return 'student_quiz_draft_' + String(quizId);
  }

  function isQuizActivated(quiz) {
    return Number(quiz?.is_activated || 0) === 1 || String(quiz?.status || '').toLowerCase() === 'active';
  }

  function isDateBeforeNow(v) {
    if (!v) return false;
    const dt = new Date(v);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
  }

  function isDateAfterNow(v) {
    if (!v) return false;
    const dt = new Date(v);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() > Date.now();
  }

  function getQuizMeta(quiz) {
    const id = quizIdOf(quiz);
    return S.attemptMetaByQuiz.get(id) || {
      count: 0,
      submittedCount: 0,
      inProgressCount: 0,
      inProgressSubmissionId: 0,
      maxAttempts: toNumber(quiz?.max_attempts, 1),
      attemptsLeft: toNumber(quiz?.max_attempts, 1),
      bestPercent: null,
      avgPercent: null,
    };
  }

  function getQuizState(quiz) {
    const status = String(quiz?.status || '').toLowerCase();
    const meta = getQuizMeta(quiz);

    if (status !== 'active') {
      return 'hidden';
    }

    if (Number(quiz?.is_activated || 0) !== 1) {
      return 'locked';
    }

    if (meta.submittedCount > 0) {
      return 'completed';
    }

    return 'available';
  }

  function statusLabel(status) {
    if (status === 'available') return 'Available';
    if (status === 'locked') return 'Locked';
    if (status === 'completed') return 'Completed';
    return 'Hidden';
  }

  function cacheElements() {
    E = {
      root: document.getElementById('sqRoot'),
      list: document.getElementById('sqQuizList'),
      searchInput: document.getElementById('sqSearchInput'),
      subjectFilter: document.getElementById('sqSubjectFilter'),
      statusFilter: document.getElementById('sqStatusFilter'),
      refreshBtn: document.getElementById('sqRefreshBtn'),
      tabs: document.getElementById('sqStatusTabs'),
      statAvailable: document.getElementById('sqStatAvailable'),
      statCompleted: document.getElementById('sqStatCompleted'),
      statAverage: document.getElementById('sqStatAverage'),
      statBest: document.getElementById('sqStatBest'),

      detailModal: document.getElementById('sqDetailModal'),
      detailTitle: document.getElementById('sqDetailTitle'),
      detailInfo: document.getElementById('sqDetailInfo'),
      detailSummary: document.getElementById('sqDetailSummary'),
      attemptHistory: document.getElementById('sqAttemptHistory'),
      detailCloseBtn: document.getElementById('sqDetailCloseBtn'),
      startQuizBtn: document.getElementById('sqStartQuizBtn'),

      takeModal: document.getElementById('sqTakeModal'),
      takeTitle: document.getElementById('sqTakeTitle'),
      timer: document.getElementById('sqTimer'),
      questionNav: document.getElementById('sqQuestionNav'),
      questionTitle: document.getElementById('sqQuestionTitle'),
      questionMeta: document.getElementById('sqQuestionMeta'),
      questionImageWrap: document.getElementById('sqQuestionImageWrap'),
      questionImage: document.getElementById('sqQuestionImage'),
      questionOptions: document.getElementById('sqQuestionOptions'),
      prevBtn: document.getElementById('sqPrevQuestionBtn'),
      nextBtn: document.getElementById('sqNextQuestionBtn'),
      saveDraftBtn: document.getElementById('sqSaveDraftBtn'),
      submitQuizBtn: document.getElementById('sqSubmitQuizBtn'),

      resultModal: document.getElementById('sqResultModal'),
      resultTitle: document.getElementById('sqResultTitle'),
      resultGrid: document.getElementById('sqResultGrid'),
      reviewBody: document.getElementById('sqReviewBody'),
      resultCloseBtn: document.getElementById('sqResultCloseBtn'),
    };
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  function setLoading(message) {
    if (!E.list) return;
    E.list.innerHTML = '<div class="sq-loading"><i class="fas fa-circle-notch fa-spin"></i> ' + esc(message || 'Loading quizzes...') + '</div>';
  }

  function setEmpty(message) {
    if (!E.list) return;
    E.list.innerHTML = '<div class="sq-empty"><i class="fas fa-inbox"></i> ' + esc(message || 'No quizzes found.') + '</div>';
  }

  function setError(message) {
    if (!E.list) return;
    E.list.innerHTML = '<div class="sq-error"><i class="fas fa-triangle-exclamation"></i> ' + esc(message || 'Unable to load quizzes.') + '</div>';
  }

  function populateSubjectFilter() {
    if (!E.subjectFilter) return;

    const map = new Map();
    S.quizzes.forEach((q) => {
      const id = String(q.subject_id || q.course_id || '').trim();
      const label = String(q.subject_name || q.subject_code || q.class_name || '').trim();
      if (!id || !label) return;
      if (!map.has(id)) map.set(id, label);
    });

    const prev = E.subjectFilter.value;
    const options = ['<option value="">All subjects</option>'];

    Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([id, label]) => {
        options.push('<option value="' + esc(id) + '">' + esc(label) + '</option>');
      });

    E.subjectFilter.innerHTML = options.join('');
    const hasPrev = Array.from(E.subjectFilter.options).some((opt) => opt.value === prev);
    if (hasPrev) E.subjectFilter.value = prev;
  }

  function updateStats() {
    const available = S.quizzes.filter((q) => getQuizState(q) === 'available').length;
    const completed = S.quizzes.filter((q) => getQuizMeta(q).submittedCount > 0).length;

    const allPercents = [];
    S.quizzes.forEach((q) => {
      const attempts = S.attemptsByQuiz.get(quizIdOf(q)) || [];
      attempts.forEach((a) => {
        const score = toNumber(a.score, NaN);
        const maxScore = toNumber(a.max_score, NaN);
        if (Number.isFinite(score) && Number.isFinite(maxScore) && maxScore > 0) {
          allPercents.push((score / maxScore) * 100);
        }
      });
    });

    const avg = allPercents.length
      ? (allPercents.reduce((sum, v) => sum + v, 0) / allPercents.length)
      : 0;
    const best = allPercents.length ? Math.max.apply(null, allPercents) : 0;

    if (E.statAvailable) E.statAvailable.textContent = String(available);
    if (E.statCompleted) E.statCompleted.textContent = String(completed);
    if (E.statAverage) E.statAverage.textContent = avg.toFixed(1) + '%';
    if (E.statBest) E.statBest.textContent = best.toFixed(1) + '%';
  }

  function applyFilters() {
    let rows = S.quizzes.slice();

    const activeStatus = S.status === 'all' ? String(E.statusFilter?.value || 'all') : S.status;

    if (activeStatus !== 'all') {
      rows = rows.filter((q) => getQuizState(q) === activeStatus);
    }

    const subjectId = String(E.subjectFilter?.value || S.subjectId || '').trim();
    if (subjectId) {
      rows = rows.filter((q) => String(q.subject_id || q.course_id || '') === subjectId);
    }

    const q = String(E.searchInput?.value || S.search || '').trim().toLowerCase();
    if (q) {
      rows = rows.filter((quiz) => {
        const hay = [quiz.title, quiz.description, quiz.subject_name, quiz.subject_code, quiz.class_name]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    S.filtered = rows;
    renderList();
    updateStats();
  }

  function renderList() {
    if (!E.list) return;

    if (!S.filtered.length) {
      setEmpty('No quizzes match your filters.');
      return;
    }

    E.list.innerHTML = S.filtered.map((quiz) => {
      const id = quizIdOf(quiz);
      const state = getQuizState(quiz);
      const meta = getQuizMeta(quiz);
      const points = toNumber(quiz.total_points, 0);
      const questions = toNumber(quiz.question_count, 0);
      const duration = toNumber(quiz.duration_minutes, 0);
      const hasInProgress = toNumber(meta.inProgressCount, 0) > 0;
      const canStart = state !== 'locked' && (meta.attemptsLeft > 0 || hasInProgress);
      const startDisabledTitle = state === 'locked'
        ? 'Quiz is active but not activated yet'
        : 'You have reached the maximum number of attempts for this quiz';
      const startLabel = hasInProgress ? 'Continue' : 'Start';
      const startIcon = hasInProgress ? 'fa-rotate-right' : 'fa-play';
      const best = meta.bestPercent == null ? '-' : meta.bestPercent.toFixed(1) + '%';

      return [
        '<article class="sq-card">',
        '<div class="sq-head">',
        '<div>',
        '<h4>' + esc(quiz.title || ('Quiz #' + id)) + '</h4>',
        '<p>' + esc(quiz.subject_name || quiz.class_name || 'Subject not set') + '</p>',
        '</div>',
        '<span class="sq-badge ' + state + '">' + esc(statusLabel(state)) + '</span>',
        '</div>',
        '<div class="sq-meta">',
        '<div class="sq-row"><span>Questions</span><strong>' + questions + '</strong></div>',
        '<div class="sq-row"><span>Total Points</span><strong>' + points + '</strong></div>',
        '<div class="sq-row"><span>Duration</span><strong>' + (duration > 0 ? duration + ' min' : '-') + '</strong></div>',
        '<div class="sq-row"><span>Attempts</span><strong>' + meta.count + '/' + meta.maxAttempts + '</strong></div>',
        '<div class="sq-row"><span>Best Score</span><strong>' + esc(best) + '</strong></div>',
        '<div class="sq-row"><span>Available From</span><strong>' + esc(formatDateTime(quiz.start_date)) + '</strong></div>',
        '<div class="sq-row"><span>Available To</span><strong>' + esc(formatDateTime(quiz.end_date)) + '</strong></div>',
        '</div>',
        '<div class="sq-actions">',
        '<button class="sq-btn" data-action="details" data-id="' + id + '"><i class="fas fa-eye"></i> Details</button>',
        canStart
          ? '<button class="sq-btn" style="background:#2563eb;border-color:#2563eb;color:#fff;" data-action="start" data-id="' + id + '"><i class="fas ' + startIcon + '"></i> ' + startLabel + '</button>'
          : '<button class="sq-btn" disabled title="' + esc(startDisabledTitle) + '"><i class="fas fa-lock"></i> ' + (state === 'locked' ? 'Locked' : 'Max Attempts Reached') + '</button>',
        '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderDetail(quiz) {
    if (!quiz || !E.detailInfo || !E.detailSummary || !E.attemptHistory) return;

    const id = quizIdOf(quiz);
    const meta = getQuizMeta(quiz);
    const state = getQuizState(quiz);
    const hasInProgress = toNumber(meta.inProgressCount, 0) > 0;
    const canStart = state !== 'locked' && (meta.attemptsLeft > 0 || hasInProgress);

    if (E.detailTitle) {
      E.detailTitle.textContent = quiz.title || ('Quiz #' + id);
    }

    E.detailInfo.innerHTML = [
      '<div class="sq-row"><span>Subject</span><strong>' + esc(quiz.subject_name || '-') + '</strong></div>',
      '<div class="sq-row"><span>Class</span><strong>' + esc(quiz.class_name || '-') + '</strong></div>',
      '<div class="sq-row"><span>Status</span><strong>' + esc(statusLabel(state)) + '</strong></div>',
      '<div class="sq-row"><span>Description</span><strong>' + esc(quiz.description || '-') + '</strong></div>',
      '<div class="sq-row"><span>Duration</span><strong>' + esc(String(toNumber(quiz.duration_minutes, 0))) + ' min</strong></div>',
      '<div class="sq-row"><span>Total Points</span><strong>' + esc(String(toNumber(quiz.total_points, 0))) + '</strong></div>',
      '<div class="sq-row"><span>Questions</span><strong>' + esc(String(toNumber(quiz.question_count, 0))) + '</strong></div>',
      '<div class="sq-row"><span>Attempts Allowed</span><strong>' + esc(String(meta.maxAttempts)) + '</strong></div>',
      '<div class="sq-row"><span>Available From</span><strong>' + esc(formatDateTime(quiz.start_date)) + '</strong></div>',
      '<div class="sq-row"><span>Available To</span><strong>' + esc(formatDateTime(quiz.end_date)) + '</strong></div>'
    ].join('');

    E.detailSummary.innerHTML = [
      '<div class="sq-row"><span>Total Attempts</span><strong>' + esc(String(meta.count)) + '</strong></div>',
      '<div class="sq-row"><span>Submitted Attempts</span><strong>' + esc(String(meta.submittedCount)) + '</strong></div>',
      '<div class="sq-row"><span>Attempts Left</span><strong>' + esc(String(meta.attemptsLeft)) + '</strong></div>',
      '<div class="sq-row"><span>Best Score</span><strong>' + esc(meta.bestPercent == null ? '-' : meta.bestPercent.toFixed(1) + '%') + '</strong></div>',
      '<div class="sq-row"><span>Average Score</span><strong>' + esc(meta.avgPercent == null ? '-' : meta.avgPercent.toFixed(1) + '%') + '</strong></div>'
    ].join('');

    const attempts = S.attemptsByQuiz.get(id) || [];
    if (!attempts.length) {
      E.attemptHistory.innerHTML = 'No attempts yet.';
    } else {
      E.attemptHistory.innerHTML = [
        '<table class="sq-attempt-table">',
        '<thead><tr><th>Attempt</th><th>Status</th><th>Score</th><th>Percent</th><th>Submitted</th><th>Action</th></tr></thead>',
        '<tbody>',
        attempts.map((a) => {
          const score = toNumber(a.score, 0);
          const maxScore = toNumber(a.max_score, 0);
          const percent = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) + '%' : '-';
          const isSubmitted = String(a.status || '').toLowerCase() === 'submitted';
          return [
            '<tr>',
            '<td>' + esc(String(a.attempt || '-')) + '</td>',
            '<td>' + esc(String(a.status || '-')) + '</td>',
            '<td>' + esc(String(score)) + '/' + esc(String(maxScore)) + '</td>',
            '<td>' + esc(percent) + '</td>',
            '<td>' + esc(formatDateTime(a.submitted_at || a.created_at)) + '</td>',
            '<td>' + (isSubmitted
              ? '<button class="sq-btn" data-action="view-result" data-submission-id="' + esc(String(a.submission_id)) + '">View Result</button>'
              : (String(a.status || '').toLowerCase() === 'in_progress'
                ? '<button class="sq-btn" data-action="continue-attempt" data-submission-id="' + esc(String(a.submission_id)) + '">Continue</button>'
                : '-')) + '</td>',
            '</tr>'
          ].join('');
        }).join(''),
        '</tbody></table>'
      ].join('');
    }

    if (E.startQuizBtn) {
      E.startQuizBtn.disabled = !canStart;
      E.startQuizBtn.textContent = canStart
        ? (hasInProgress ? 'Continue Quiz' : 'Start Quiz')
        : (state === 'locked' ? 'Quiz Locked' : 'Max Attempts Reached');
    }
  }

  async function loadQuizAttempts(quiz) {
    const id = quizIdOf(quiz);
    if (!id) return;

    try {
      const res = await QuizAPI.getMyAttempts(id);
      const payload = res?.data || res || {};
      const attempts = Array.isArray(payload.attempts) ? payload.attempts : [];
      const maxAttempts = toNumber(payload.max_attempts, toNumber(quiz.max_attempts, 1));
      const submitted = attempts.filter((a) => String(a.status || '').toLowerCase() === 'submitted');
      const inProgress = attempts.filter((a) => String(a.status || '').toLowerCase() === 'in_progress');
      const inProgressSorted = inProgress
        .slice()
        .sort((a, b) => toNumber(b.attempt, 0) - toNumber(a.attempt, 0));
      const latestInProgress = inProgressSorted.length ? inProgressSorted[0] : null;
      const percents = submitted
        .map((a) => {
          const score = toNumber(a.score, NaN);
          const maxScore = toNumber(a.max_score, NaN);
          return Number.isFinite(score) && Number.isFinite(maxScore) && maxScore > 0
            ? (score / maxScore) * 100
            : null;
        })
        .filter((v) => v != null);

      S.attemptsByQuiz.set(id, attempts);
      S.attemptMetaByQuiz.set(id, {
        count: attempts.length,
        submittedCount: submitted.length,
        inProgressCount: inProgress.length,
        inProgressSubmissionId: toNumber(latestInProgress?.submission_id, 0),
        maxAttempts: maxAttempts,
        attemptsLeft: Math.max(0, maxAttempts - attempts.length),
        bestPercent: percents.length ? Math.max.apply(null, percents) : null,
        avgPercent: percents.length ? (percents.reduce((sum, v) => sum + v, 0) / percents.length) : null,
      });
    } catch (_) {
      S.attemptsByQuiz.set(id, []);
      S.attemptMetaByQuiz.set(id, {
        count: 0,
        submittedCount: 0,
        inProgressCount: 0,
        inProgressSubmissionId: 0,
        maxAttempts: toNumber(quiz.max_attempts, 1),
        attemptsLeft: toNumber(quiz.max_attempts, 1),
        bestPercent: null,
        avgPercent: null,
      });
    }
  }

  async function loadQuizzes() {
    setLoading('Loading quizzes...');

    try {
      const studentUuid = getStudentUuid();
      if (!studentUuid) {
        throw new Error('Student session is missing required identifiers.');
      }

      const coursesResponse = await API.get(API_ENDPOINTS.STUDENT_COURSES(studentUuid));
      const courses = toArrayPayload(coursesResponse);

      if (!courses.length) {
        S.quizzes = [];
        S.filtered = [];
        populateSubjectFilter();
        applyFilters();
        return;
      }

      const quizResponses = await Promise.allSettled(
        courses.map((course) => {
          const id = toNumber(course.course_id, 0);
          if (!id) {
            return Promise.resolve({ data: { quizzes: [] } });
          }
          return QuizAPI.getByCourse(id);
        })
      );

      const rows = [];
      quizResponses.forEach((result, idx) => {
        if (result.status !== 'fulfilled') {
          return;
        }

        const payload = result.value?.data || result.value || {};
        const quizzes = Array.isArray(payload.quizzes) ? payload.quizzes : [];
        const course = courses[idx] || {};

        quizzes.forEach((q) => {
          rows.push(Object.assign({}, q, {
            course_id: toNumber(q.course_id, toNumber(course.course_id, 0)),
            subject_id: q.subject_id || course.subject_id || null,
            subject_name: q.subject_name || course.subject_name || '-',
            subject_code: q.subject_code || course.subject_code || '-',
            class_name: q.class_name || course.class_name || '-',
          }));
        });
      });

      const uniqueByQuizId = new Map();
      rows.forEach((r) => {
        const id = quizIdOf(r);
        if (!id) return;
        uniqueByQuizId.set(id, r);
      });

      S.quizzes = Array.from(uniqueByQuizId.values())
        .filter((quiz) => String(quiz?.status || '').toLowerCase() === 'active')
        .sort((a, b) => {
        const aDate = new Date(a.start_date || a.created_at || 0).getTime();
        const bDate = new Date(b.start_date || b.created_at || 0).getTime();
        return bDate - aDate;
      });

      await Promise.all(S.quizzes.map((quiz) => loadQuizAttempts(quiz)));

      populateSubjectFilter();
      applyFilters();
    } catch (error) {
      console.error('Failed to load student quizzes', error);
      setError(error?.message || 'Failed to load quizzes.');
      toast('Failed to load quizzes.', 'error');
    }
  }

  function getQuestionType(question) {
    return String(question?.question_type || 'multiple_choice').toLowerCase();
  }

  function normalizeQuestionOptions(question) {
    if (!Array.isArray(question?.options)) {
      return [];
    }
    return question.options
      .map((opt) => ({
        label: String(opt?.option_label || opt?.label || '').trim().toUpperCase(),
        text: String(opt?.option_text || opt?.text || '').trim(),
      }))
      .filter((opt) => opt.label || opt.text)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  function setAnswer(questionId, answerValue) {
    if (!S.take) return;
    S.take.answers[String(questionId)] = String(answerValue || '');
    renderQuestionNav();
  }

  function getCurrentQuestion() {
    if (!S.take || !Array.isArray(S.take.questions) || !S.take.questions.length) {
      return null;
    }
    return S.take.questions[S.take.currentIndex] || null;
  }

  function renderQuestionNav() {
    if (!S.take || !E.questionNav) return;

    E.questionNav.innerHTML = S.take.questions.map((q, idx) => {
      const qid = String(q.question_id || idx);
      const answered = String(S.take.answers[qid] || '').trim() !== '';
      const classes = [
        'sq-qbtn',
        idx === S.take.currentIndex ? 'active' : '',
        answered ? 'answered' : ''
      ].filter(Boolean).join(' ');
      return '<button class="' + classes + '" data-q-index="' + idx + '">' + (idx + 1) + '</button>';
    }).join('');
  }

  function renderCurrentQuestion() {
    const question = getCurrentQuestion();
    if (!question || !E.questionTitle || !E.questionOptions) return;

    const idx = S.take.currentIndex;
    const total = S.take.questions.length;
    const type = getQuestionType(question);
    const qid = String(question.question_id || idx);
    const currentAnswer = String(S.take.answers[qid] || '');

    E.questionTitle.textContent = 'Q' + (idx + 1) + ' of ' + total + ': ' + String(question.question_text || '-');
    if (E.questionMeta) {
      const pts = toNumber(question.points, 0);
      E.questionMeta.textContent = 'Type: ' + type.replace(/_/g, ' ') + ' • Points: ' + pts;
    }

    const imagePath = toAccessibleImageUrl(question.image_question || question.image_name || '');
    const imageUrl = toAbsoluteUrl(imagePath);
    if (E.questionImageWrap && E.questionImage) {
      if (imageUrl) {
        E.questionImage.src = imageUrl;
        E.questionImageWrap.style.display = 'block';
      } else {
        E.questionImage.src = '';
        E.questionImageWrap.style.display = 'none';
      }
    }

    if (type === 'multiple_choice' || type === 'true_false') {
      let options = normalizeQuestionOptions(question);
      if (!options.length && type === 'true_false') {
        options = [
          { label: 'A', text: 'True' },
          { label: 'B', text: 'False' }
        ];
      }

      E.questionOptions.innerHTML = '<div class="sq-options">' + options.map((opt) => {
        const value = opt.label || opt.text;
        const selected = currentAnswer === value;
        return [
          '<label class="sq-option' + (selected ? ' selected' : '') + '">',
          '<input type="radio" name="sqQuestionOption" value="' + esc(value) + '" ' + (selected ? 'checked' : '') + '>',
          '<span><strong>' + esc(opt.label) + '.</strong> ' + esc(opt.text) + '</span>',
          '</label>'
        ].join('');
      }).join('') + '</div>';

      E.questionOptions.querySelectorAll('input[name="sqQuestionOption"]').forEach((input) => {
        input.addEventListener('change', (event) => {
          setAnswer(qid, event.target.value);
          renderCurrentQuestion();
        });
      });
    } else {
      E.questionOptions.innerHTML = '<textarea id="sqFreeAnswer" class="sq-textarea" placeholder="Type your answer here...">' + esc(currentAnswer) + '</textarea>';
      const ta = document.getElementById('sqFreeAnswer');
      if (ta) {
        ta.addEventListener('input', (event) => {
          setAnswer(qid, event.target.value || '');
        });
      }
    }

    if (E.prevBtn) E.prevBtn.disabled = idx <= 0;
    if (E.nextBtn) E.nextBtn.disabled = idx >= total - 1;
  }

  function updateTimerDisplay() {
    if (!E.timer || !S.take) return;
    E.timer.textContent = formatTimer(S.take.timeLeftSeconds);
  }

  function stopTimer() {
    if (S.timerId) {
      clearInterval(S.timerId);
      S.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    if (!S.take) return;

    updateTimerDisplay();
    S.timerId = setInterval(async () => {
      if (!S.take) {
        stopTimer();
        return;
      }

      S.take.timeLeftSeconds -= 1;
      if (S.take.timeLeftSeconds <= 0) {
        S.take.timeLeftSeconds = 0;
        updateTimerDisplay();
        stopTimer();
        toast('Time is up. Submitting your quiz now.', 'warning');
        await submitCurrentQuiz(true);
        return;
      }

      if (!S.take.warned && S.take.timeLeftSeconds <= WARNING_THRESHOLD_SECONDS) {
        S.take.warned = true;
        toast('Warning: less than 5 minutes remaining.', 'warning');
      }

      updateTimerDisplay();
    }, 1000);
  }

  function saveDraft() {
    if (!S.take || !S.take.quiz) return;

    const payload = {
      answers: S.take.answers,
      currentIndex: S.take.currentIndex,
      timeLeftSeconds: S.take.timeLeftSeconds,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(draftKey(quizIdOf(S.take.quiz)), JSON.stringify(payload));
      toast('Draft saved locally.', 'success');
    } catch (error) {
      toast('Unable to save draft on this browser.', 'error');
    }
  }

  function restoreDraft(quizId) {
    try {
      const raw = localStorage.getItem(draftKey(quizId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function clearDraft(quizId) {
    try {
      localStorage.removeItem(draftKey(quizId));
    } catch (_) {
      // Ignore storage cleanup errors.
    }
  }

  function canReviewAnswers(quiz) {
    const mode = String(quiz?.show_results || 'after_end').toLowerCase();
    if (mode === 'never') return false;
    if (mode === 'instant') return true;
    if (mode === 'after_end') {
      return isDateBeforeNow(quiz?.end_date);
    }
    return false;
  }

  function normalizeReviewAnswer(value, questionType) {
    const raw = String(value == null ? '' : value).trim().toLowerCase();
    const type = String(questionType || '').trim().toLowerCase();

    const booleanLikeValues = ['a', 'b', 'true', 'false', '1', '0', 't', 'f', 'yes', 'no'];
    const treatAsTrueFalse = type === 'true_false' || booleanLikeValues.includes(raw);

    if (!treatAsTrueFalse) {
      return raw;
    }

    if (['a', 'true', '1', 't', 'yes'].includes(raw)) return 'true';
    if (['b', 'false', '0', 'f', 'no'].includes(raw)) return 'false';
    return raw;
  }

  function renderResult(resultPayload) {
    if (!E.resultGrid || !E.reviewBody) return;

    const quiz = resultPayload.quiz || S.selectedQuiz;
    const submission = resultPayload.submission || {};
    const score = toNumber(submission.score, 0);
    const maxScore = toNumber(submission.max_score, 0);
    const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;

    if (E.resultTitle) {
      E.resultTitle.textContent = 'Result: ' + String(quiz?.title || 'Quiz');
    }

    E.resultGrid.innerHTML = [
      '<div class="sq-result-card"><p>Score</p><h4>' + esc(String(score)) + ' / ' + esc(String(maxScore)) + '</h4></div>',
      '<div class="sq-result-card"><p>Percentage</p><h4>' + percent.toFixed(1) + '%</h4></div>',
      '<div class="sq-result-card"><p>Attempt</p><h4>' + esc(String(submission.attempt || '-')) + '</h4></div>'
    ].join('');

    const questions = Array.isArray(resultPayload.questions) ? resultPayload.questions : [];
    const answers = resultPayload.answers || {};

    if (!canReviewAnswers(quiz)) {
      E.reviewBody.innerHTML = 'Review answers is disabled for this quiz.';
    } else if (!questions.length) {
      E.reviewBody.innerHTML = 'Detailed answer review is not available for this attempt.';
    } else {
      E.reviewBody.innerHTML = questions.map((q, idx) => {
        const qid = String(q.question_id || idx);
        const yourAnswer = String(q.student_answer != null ? q.student_answer : (answers[qid] || '-'));
        const correctAnswer = String(q.correct_answer || '-');
        const explanation = String(q.explanation || '-');
        const hasBackendCorrectness = q.is_correct !== undefined && q.is_correct !== null;
        const isCorrect = hasBackendCorrectness
          ? (q.is_correct === true || q.is_correct === 1 || q.is_correct === '1')
          : (yourAnswer !== '-' && normalizeReviewAnswer(yourAnswer, q.question_type) === normalizeReviewAnswer(correctAnswer, q.question_type));

        return [
          '<article class="sq-review-item">',
          '<h6>Q' + (idx + 1) + '. ' + esc(String(q.question_text || '-')) + '</h6>',
          '<p><strong>Your Answer:</strong> ' + esc(yourAnswer) + '</p>',
          '<p><strong>Correct Answer:</strong> ' + esc(correctAnswer) + '</p>',
          '<p><strong>Status:</strong> ' + (isCorrect ? '<span style="color:#166534;">Correct</span>' : '<span style="color:#991b1b;">Incorrect</span>') + '</p>',
          '<p><strong>Explanation:</strong> ' + esc(explanation) + '</p>',
          '</article>'
        ].join('');
      }).join('');
    }

    closeModal(E.takeModal);
    closeModal(E.detailModal);
    openModal(E.resultModal);
  }

  async function openSubmissionResult(submissionId) {
    try {
      const response = await QuizAPI.getSubmissionById(submissionId);
      const payload = response?.data || response || {};
      const questions = Array.isArray(payload.questions) ? payload.questions : [];
      const answers = payload.answers && typeof payload.answers === 'object' ? payload.answers : {};
      const submission = Object.assign({}, payload);
      delete submission.questions;
      delete submission.answers;
      renderResult({ quiz: S.selectedQuiz, submission: submission, questions: questions, answers: answers });
    } catch (error) {
      toast(error?.message || 'Unable to load attempt result.', 'error');
    }
  }

  async function refreshQuizAttempts(quiz) {
    await loadQuizAttempts(quiz);
    applyFilters();
    if (S.selectedQuiz && quizIdOf(S.selectedQuiz) === quizIdOf(quiz)) {
      renderDetail(quiz);
    }
  }

  async function submitCurrentQuiz(isAutoSubmit) {
    if (!S.take || S.isSubmitting) return;

    const quiz = S.take.quiz;
    const quizId = quizIdOf(quiz);
    const entries = Object.entries(S.take.answers || {});
    const answers = entries
      .map(([questionId, answer]) => ({
        question_id: toNumber(questionId, 0),
        answer: String(answer || '').trim(),
      }))
      .filter((row) => row.question_id > 0 && row.answer !== '');

    if (!answers.length && !isAutoSubmit) {
      const shouldContinue = window.confirm('You have not answered any question yet. Submit anyway?');
      if (!shouldContinue) return;
    }

    S.isSubmitting = true;
    if (E.submitQuizBtn) {
      E.submitQuizBtn.disabled = true;
      E.submitQuizBtn.textContent = 'Submitting...';
    }

    try {
      await QuizAPI.submit(S.take.submissionId, { answers: answers });
      const submissionRes = await QuizAPI.getSubmissionById(S.take.submissionId);
      const payload = submissionRes?.data || submissionRes || {};
      const questionsFromApi = Array.isArray(payload.questions) ? payload.questions : [];
      const answersFromApi = payload.answers && typeof payload.answers === 'object' ? payload.answers : {};
      const submission = Object.assign({}, payload);
      delete submission.questions;
      delete submission.answers;

      clearDraft(quizId);
      stopTimer();

      renderResult({
        quiz: quiz,
        submission: submission,
        questions: questionsFromApi.length ? questionsFromApi : S.take.questions,
        answers: Object.keys(answersFromApi).length ? answersFromApi : S.take.answers,
      });

      toast('Quiz submitted successfully.', 'success');
      S.take = null;
      await refreshQuizAttempts(quiz);
    } catch (error) {
      toast(error?.message || 'Failed to submit quiz.', 'error');
    } finally {
      S.isSubmitting = false;
      if (E.submitQuizBtn) {
        E.submitQuizBtn.disabled = false;
        E.submitQuizBtn.textContent = 'Submit Quiz';
      }
    }
  }

  async function startQuiz(quiz, resumeSubmissionId) {
    if (!quiz) return;

    const state = getQuizState(quiz);
    const meta = getQuizMeta(quiz);
    const forcedSubmissionId = toNumber(resumeSubmissionId, 0);
    const resumableSubmissionId = forcedSubmissionId > 0
      ? forcedSubmissionId
      : toNumber(meta.inProgressSubmissionId, 0);

    if (state === 'locked') {
      toast('This quiz is locked and not activated yet.', 'warning');
      return;
    }
    if (meta.attemptsLeft <= 0 && resumableSubmissionId <= 0) {
      toast('Maximum attempts reached for this quiz.', 'warning');
      return;
    }

    try {
      let submissionId = 0;
      let startPayload = {};

      if (resumableSubmissionId > 0) {
        submissionId = resumableSubmissionId;
      } else {
        const startRes = await QuizAPI.start(quizIdOf(quiz));
        startPayload = startRes?.data || startRes || {};
        submissionId = toNumber(startPayload.submission_id, 0);
      }

      if (!submissionId) {
        throw new Error('Unable to create quiz attempt.');
      }

      const qRes = await QuizAPI.getQuestions(quizIdOf(quiz));
      const qPayload = qRes?.data || qRes || {};
      const questions = Array.isArray(qPayload.questions) ? qPayload.questions : [];

      if (!questions.length) {
        throw new Error('This quiz has no questions yet.');
      }

      S.take = {
        quiz: quiz,
        submissionId: submissionId,
        questions: questions,
        currentIndex: 0,
        answers: {},
        timeLeftSeconds: Math.max(60, toNumber(startPayload.duration_minutes, toNumber(quiz.duration_minutes, 1)) * 60),
        warned: false,
      };

      const oldDraft = restoreDraft(quizIdOf(quiz));
      if (oldDraft) {
        S.take.answers = oldDraft.answers && typeof oldDraft.answers === 'object' ? oldDraft.answers : {};
        if (Number.isFinite(oldDraft.currentIndex)) {
          S.take.currentIndex = Math.max(0, Math.min(questions.length - 1, Number(oldDraft.currentIndex)));
        }
        if (Number.isFinite(oldDraft.timeLeftSeconds)) {
          S.take.timeLeftSeconds = Math.max(0, Number(oldDraft.timeLeftSeconds));
        }
      }

      if (E.takeTitle) {
        E.takeTitle.textContent = 'Take Quiz: ' + String(quiz.title || ('Quiz #' + quizIdOf(quiz)));
      }

      renderQuestionNav();
      renderCurrentQuestion();
      updateTimerDisplay();
      openModal(E.takeModal);
      closeModal(E.detailModal);
      startTimer();
    } catch (error) {
      toast(error?.message || 'Failed to start quiz.', 'error');
    }
  }

  function bindEvents() {
    if (E.root?.dataset.bound === '1') return;

    E.searchInput?.addEventListener('input', () => {
      S.search = String(E.searchInput.value || '');
      applyFilters();
    });

    E.subjectFilter?.addEventListener('change', () => {
      S.subjectId = String(E.subjectFilter.value || '');
      applyFilters();
    });

    E.statusFilter?.addEventListener('change', () => {
      S.status = String(E.statusFilter.value || 'all');
      E.tabs?.querySelectorAll('.sq-tab').forEach((tab) => {
        tab.classList.toggle('active', String(tab.dataset.status || '') === S.status);
      });
      applyFilters();
    });

    E.refreshBtn?.addEventListener('click', () => {
      loadQuizzes().catch(() => {});
    });

    E.tabs?.addEventListener('click', (event) => {
      const tab = event.target.closest('.sq-tab');
      if (!tab) return;

      const status = String(tab.dataset.status || 'all');
      S.status = status;

      E.tabs.querySelectorAll('.sq-tab').forEach((el) => {
        el.classList.toggle('active', el === tab);
      });

      if (E.statusFilter) {
        E.statusFilter.value = status;
      }

      applyFilters();
    });

    E.list?.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;

      const action = String(btn.dataset.action || '');
      const id = toNumber(btn.dataset.id, 0);
      const quiz = S.quizzes.find((q) => quizIdOf(q) === id);
      if (!quiz) return;

      S.selectedQuiz = quiz;

      if (action === 'details') {
        renderDetail(quiz);
        openModal(E.detailModal);
        return;
      }

      if (action === 'start') {
        startQuiz(quiz).catch(() => {});
      }
    });

    E.attemptHistory?.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-action]');
      if (!btn) return;
        const action = String(btn.dataset.action || '');
      const submissionId = toNumber(btn.dataset.submissionId, 0);
      if (!submissionId) return;
        if (action === 'view-result') {
          openSubmissionResult(submissionId).catch(() => {});
          return;
        }
        if (action === 'continue-attempt') {
          if (!S.selectedQuiz) return;
          startQuiz(S.selectedQuiz, submissionId).catch(() => {});
        }
    });

    E.detailCloseBtn?.addEventListener('click', () => closeModal(E.detailModal));
    E.resultCloseBtn?.addEventListener('click', () => closeModal(E.resultModal));

    E.startQuizBtn?.addEventListener('click', () => {
      if (!S.selectedQuiz) return;
      startQuiz(S.selectedQuiz).catch(() => {});
    });

    E.detailModal?.addEventListener('click', (event) => {
      if (event.target === E.detailModal) {
        closeModal(E.detailModal);
      }
    });

    E.resultModal?.addEventListener('click', (event) => {
      if (event.target === E.resultModal) {
        closeModal(E.resultModal);
      }
    });

    E.takeModal?.addEventListener('click', (event) => {
      if (event.target === E.takeModal) {
        const shouldClose = window.confirm('Closing now will keep your draft locally. Close quiz attempt window?');
        if (!shouldClose) return;
        saveDraft();
        stopTimer();
        closeModal(E.takeModal);
      }
    });

    E.questionNav?.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-q-index]');
      if (!btn || !S.take) return;
      const idx = toNumber(btn.dataset.qIndex, 0);
      if (idx < 0 || idx >= S.take.questions.length) return;
      S.take.currentIndex = idx;
      renderQuestionNav();
      renderCurrentQuestion();
    });

    E.prevBtn?.addEventListener('click', () => {
      if (!S.take) return;
      if (S.take.currentIndex <= 0) return;
      S.take.currentIndex -= 1;
      renderQuestionNav();
      renderCurrentQuestion();
    });

    E.nextBtn?.addEventListener('click', () => {
      if (!S.take) return;
      if (S.take.currentIndex >= S.take.questions.length - 1) return;
      S.take.currentIndex += 1;
      renderQuestionNav();
      renderCurrentQuestion();
    });

    E.saveDraftBtn?.addEventListener('click', saveDraft);
    E.submitQuizBtn?.addEventListener('click', () => {
      submitCurrentQuiz(false).catch(() => {});
    });

    E.root.dataset.bound = '1';
  }

  async function initQuizzesPage() {
    cacheElements();
    if (!E.root) return;
    bindEvents();
    await loadQuizzes();
  }

  document.addEventListener('page:loaded', function (event) {
    if (event?.detail?.page === 'quizzes') {
      initQuizzesPage().catch(() => {});
    }
  });
})();
