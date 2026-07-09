/* ============================================
   Student My Subjects Page
   SPA fragment: student/page/my-subjects.html
============================================ */
(function () {
  'use strict';

  const S = {
    rawCourses: [],
    rawResults: [],
    subjects: [],
    filtered: [],
    classUuidById: new Map(),
    classMetaById: new Map(),
    loading: false,
    activeSubject: null,
  };

  function esc(v) {
    return typeof escHtml === 'function'
      ? escHtml(String(v ?? ''))
      : String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function toast(msg, type = 'info') {
    if (typeof showToast === 'function') showToast(msg, type);
  }

  function getUser() {
    return typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
  }

  function getStudentUuid() {
    const u = getUser();
    return u?.student_uuid || u?.uuid || null;
  }

  function getStudentIdFromUser() {
    const u = getUser();
    return u?.student_id || null;
  }

  async function loadClassMaps() {
    try {
      const res = await API.get(API_ENDPOINTS.CLASSES, { page: 1, limit: 500 });
      const rows = res?.data?.data || res?.data || [];
      S.classUuidById.clear();
      S.classMetaById.clear();
      rows.forEach(c => {
        if (c?.class_id != null && c?.uuid) {
          S.classUuidById.set(String(c.class_id), c.uuid);
        }
        if (c?.class_id != null) {
          S.classMetaById.set(String(c.class_id), c);
        }
      });
    } catch (e) {
      console.warn('Failed to preload class maps', e);
    }
  }

  function keepPrimaryClassCourses(courses) {
    const rows = Array.isArray(courses) ? courses : [];
    if (!rows.length) return [];

    const byClass = new Map();
    rows.forEach(c => {
      const key = String(c.class_id ?? '');
      if (!key) return;
      byClass.set(key, (byClass.get(key) || 0) + 1);
    });

    if (byClass.size <= 1) return rows;

    let primaryClassId = null;
    let maxCount = -1;
    byClass.forEach((count, classId) => {
      if (count > maxCount) {
        maxCount = count;
        primaryClassId = classId;
      }
    });

    return rows.filter(c => String(c.class_id ?? '') === primaryClassId);
  }

  function pct(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
  }

  function normalizeKey(v) {
    return String(v ?? '').trim().toLowerCase();
  }

  function toArrayPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  }

  function trendInfo(scores) {
    if (!scores.length) return { label: 'No Data', cls: 'flat', delta: 0 };
    if (scores.length === 1) return { label: 'Stable', cls: 'flat', delta: 0 };
    const prev = scores[scores.length - 2];
    const curr = scores[scores.length - 1];
    const delta = curr - prev;
    if (delta > 0) return { label: `Up ${delta.toFixed(0)}%`, cls: 'up', delta };
    if (delta < 0) return { label: `Down ${Math.abs(delta).toFixed(0)}%`, cls: 'down', delta };
    return { label: 'Stable', cls: 'flat', delta: 0 };
  }

  function gradeBadgeClass(score) {
    if (score == null) return 'na';
    if (score >= 70) return 'good';
    if (score >= 50) return 'mid';
    return 'bad';
  }

  function aggregateSubjects(courses, results) {
    const bySubject = new Map();

    const resultRows = Array.isArray(results) ? results : [];
    const resultBySubjectId = new Map();
    const resultByCourseId = new Map();
    const resultBySubjectCode = new Map();
    const resultBySubjectName = new Map();

    function pushMap(m, key, row) {
      if (!key) return;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(row);
    }

    resultRows.forEach(r => {
      pushMap(resultBySubjectId, normalizeKey(r.subject_id), r);
      pushMap(resultByCourseId, normalizeKey(r.course_id), r);
      pushMap(resultBySubjectCode, normalizeKey(r.course_code), r);
      pushMap(resultBySubjectName, normalizeKey(r.subject_name || r.course_name), r);
    });

    [resultBySubjectId, resultByCourseId, resultBySubjectCode, resultBySubjectName].forEach(map => {
      map.forEach(rows => {
        rows.sort((a, b) => {
          const aDate = new Date(a.created_at || a.updated_at || 0).getTime();
          const bDate = new Date(b.created_at || b.updated_at || 0).getTime();
          if (aDate && bDate && aDate !== bDate) return aDate - bDate;
          return Number(a.result_id || 0) - Number(b.result_id || 0);
        });
      });
    });

    courses.forEach(c => {
      const key = String(c.subject_id ?? c.subject_code ?? c.subject_name ?? Math.random());

      const matchedRows = [
        ...(resultBySubjectId.get(normalizeKey(c.subject_id)) || []),
        ...(resultByCourseId.get(normalizeKey(c.course_id)) || []),
        ...(resultBySubjectCode.get(normalizeKey(c.subject_code)) || []),
        ...(resultBySubjectName.get(normalizeKey(c.subject_name)) || []),
      ];

      const seen = new Set();
      const resultRowsForSubject = matchedRows.filter(r => {
        const uniq = r?.result_id != null
          ? `id:${r.result_id}`
          : `raw:${JSON.stringify([r?.subject_id, r?.course_id, r?.total_score, r?.grade])}`;
        if (seen.has(uniq)) return false;
        seen.add(uniq);
        return true;
      });

      resultRowsForSubject.sort((a, b) => {
        const aDate = new Date(a.created_at || a.updated_at || 0).getTime();
        const bDate = new Date(b.created_at || b.updated_at || 0).getTime();
        if (aDate && bDate && aDate !== bDate) return aDate - bDate;
        return Number(a.result_id || 0) - Number(b.result_id || 0);
      });

      const scoreSeries = resultRowsForSubject
        .map(r => pct(r.total_score))
        .filter(v => v != null);

      const latestResult = resultRowsForSubject.length ? resultRowsForSubject[resultRowsForSubject.length - 1] : null;
      const latestScore = latestResult ? pct(latestResult.total_score) : null;

      bySubject.set(key, {
        subject_id: c.subject_id,
        subject_name: c.subject_name || 'Unnamed Subject',
        subject_code: c.subject_code || '-',
        teacher_name: [c.teacher_first_name, c.teacher_last_name].filter(Boolean).join(' ') || 'Unassigned Teacher',
        class_id: c.class_id,
        class_name: c.class_name || 'Class',
        semester_name: c.semester_name || 'Current Term',
        course_id: c.course_id,
        grade: latestResult?.grade || null,
        score: latestScore,
        remark: latestResult?.remark || null,
        trend: trendInfo(scoreSeries),
        scoreSeries,
        results: resultRowsForSubject,
      });
    });

    return Array.from(bySubject.values())
      .sort((a, b) => String(a.subject_name).localeCompare(String(b.subject_name)));
  }

  function renderStats(rows) {
    const subjectsEl = document.getElementById('smsTotalSubjects');
    const gradedEl = document.getElementById('smsGradedSubjects');
    const avgEl = document.getElementById('smsAvgScore');
    const trendEl = document.getElementById('smsTrendLabel');

    const totalSubjects = rows.length;
    const gradedSubjects = rows.filter(r => r.score != null).length;
    const scoreRows = rows.filter(r => r.score != null);
    const avgScore = scoreRows.length
      ? Math.round(scoreRows.reduce((sum, r) => sum + r.score, 0) / scoreRows.length)
      : 0;

    const trendSum = rows.reduce((sum, r) => sum + (r.trend?.delta || 0), 0);
    const trendLabel = rows.length === 0
      ? 'N/A'
      : trendSum > 0
        ? 'Improving'
        : trendSum < 0
          ? 'Declining'
          : 'Stable';

    if (subjectsEl) subjectsEl.textContent = String(totalSubjects);
    if (gradedEl) gradedEl.textContent = String(gradedSubjects);
    if (avgEl) avgEl.textContent = `${avgScore}%`;
    if (trendEl) trendEl.textContent = trendLabel;
  }

  function renderList(rows) {
    const list = document.getElementById('smsList');
    if (!list) return;

    if (!rows.length) {
      list.style = 'grid-template-columns: none;';
      list.innerHTML = '<div class="sms-empty"><i class="fas fa-inbox"></i> No subjects found.</div>';
      return;
    }

    list.style = '';
    list.innerHTML = rows.map((r, idx) => {
      const gradeLabel = r.grade || (r.score != null ? `${r.score}%` : 'No Grade');
      const trendClass = r.trend.cls === 'up' ? 'sms-trend-up' : r.trend.cls === 'down' ? 'sms-trend-down' : 'sms-trend-flat';
      return `
        <section class="sms-card" data-idx="${idx}">
          <div class="sms-head">
            <div>
              <h4>${esc(r.subject_name)}</h4>
              <p class="sms-code">${esc(r.subject_code)}</p>
            </div>
            <span class="sms-grade ${gradeBadgeClass(r.score)}">${esc(gradeLabel)}</span>
          </div>

          <div class="sms-body">
            <div class="sms-row"><span>Teacher</span><strong>${esc(r.teacher_name)}</strong></div>
            <div class="sms-row"><span>Class</span><strong>${esc(r.class_name)}</strong></div>
            <div class="sms-row"><span>Term</span><strong>${esc(r.semester_name)}</strong></div>
            <div class="sms-row"><span>Trend</span><strong class="${trendClass}">${esc(r.trend.label)}</strong></div>
          </div>

          <div class="sms-actions">
            <button class="btn btn-sm btn-outline" data-action="schedule" data-idx="${idx}"><i class="fas fa-calendar-alt"></i> Subject Schedule</button>
            <button class="btn btn-sm btn-outline" data-action="performance" data-idx="${idx}"><i class="fas fa-chart-line"></i> Performance Trend</button>
          </div>
        </section>
      `;
    }).join('');
  }

  function openModal(title) {
    const overlay = document.getElementById('smsModalOverlay');
    const titleEl = document.getElementById('smsModalTitle');
    if (titleEl) titleEl.textContent = title;
    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal() {
    const overlay = document.getElementById('smsModalOverlay');
    const body = document.getElementById('smsModalBody');
    const foot = document.getElementById('smsModalFoot');
    if (body) body.innerHTML = '';
    if (foot) foot.innerHTML = '';
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    S.activeSubject = null;
  }

  function fmtTime(timeValue) {
    if (!timeValue) return 'Time not set';
    const s = String(timeValue).slice(0, 5);
    const [h, m] = s.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return s;
    const hh = ((h + 11) % 12) + 1;
    const suffix = h >= 12 ? 'PM' : 'AM';
    return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  async function openSchedulePopup(row) {
    S.activeSubject = row;
    openModal(`Subject Schedule - ${row.subject_name}`);

    const body = document.getElementById('smsModalBody');
    const foot = document.getElementById('smsModalFoot');
    if (foot) {
      foot.innerHTML = '<button class="btn btn-sm btn-outline" id="smsCloseScheduleBtn">Close</button>';
      document.getElementById('smsCloseScheduleBtn')?.addEventListener('click', closeModal);
    }
    if (!body) return;

    body.innerHTML = '<div class="sms-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading subject schedule...</div>';

    try {
      const classUuid = S.classUuidById.get(String(row.class_id));
      if (!classUuid) throw new Error('Class UUID not found');

      const res = await ClassAPI.getSchedule(classUuid);
      const all = res?.data || [];
      const codeLow = String(row.subject_code || '').toLowerCase();
      const nameLow = String(row.subject_name || '').toLowerCase();

      const rows = all.filter(s => {
        const sc = String(s.subject_code || '').toLowerCase();
        const sn = String(s.subject_name || '').toLowerCase();
        return (codeLow && sc === codeLow) || sn === nameLow;
      });

      if (!rows.length) {
        body.innerHTML = '<div class="sms-empty">No schedule entries found for this subject.</div>';
        return;
      }

      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      rows.sort((a, b) => {
        const da = dayOrder.indexOf(String(a.day_of_week || '').toLowerCase());
        const db = dayOrder.indexOf(String(b.day_of_week || '').toLowerCase());
        if (da !== db) return da - db;
        return String(a.start_time || '').localeCompare(String(b.start_time || ''));
      });

      body.innerHTML = `
        <div class="sms-schedule-grid">
          ${rows.map(s => `
            <div class="sms-slot">
              <h4>${esc(s.subject_name || row.subject_name)}</h4>
              <p>
                <span class="sms-time">${fmtTime(s.start_time)} - ${fmtTime(s.end_time)}</span>
                ${esc(s.day_of_week || 'Day')}
              </p>
              <p>Teacher: ${esc(s.teacher_name || row.teacher_name || 'Unassigned')}</p>
              <p>Room: ${esc(s.room || 'TBA')}</p>
            </div>
          `).join('')}
        </div>`;
    } catch (err) {
      console.error('Subject schedule load failed', err);
      body.innerHTML = `<div class="sms-error">${esc(err.message || 'Failed to load subject schedule')}</div>`;
    }
  }

  async function openPerformancePopup(row) {
    S.activeSubject = row;
    openModal(`Performance Trend - ${row.subject_name}`);

    const body = document.getElementById('smsModalBody');
    const foot = document.getElementById('smsModalFoot');
    if (foot) {
      foot.innerHTML = '<button class="btn btn-sm btn-outline" id="smsClosePerfBtn">Close</button>';
      document.getElementById('smsClosePerfBtn')?.addEventListener('click', closeModal);
    }
    if (!body) return;

    if (!row.results.length) {
      body.innerHTML = '<div class="sms-empty">No result records yet for this subject.</div>';
      return;
    }

    body.innerHTML = `
      <div class="sms-table-wrap">
        <table class="sms-table">
          <thead>
            <tr><th>#</th><th>Total Score</th><th>Grade</th><th>Remark</th><th>Term</th></tr>
          </thead>
          <tbody>
            ${row.results.map((r, i) => `<tr>
              <td>${i + 1}</td>
              <td>${esc(String(r.total_score ?? '-'))}</td>
              <td>${esc(r.grade || '-')}</td>
              <td>${esc(r.remark || '-')}</td>
              <td>${esc(r.semester_name || row.semester_name || '-')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="sms-row"><span>Current Grade</span><strong>${esc(row.grade || (row.score != null ? `${row.score}%` : 'No Grade'))}</strong></div>
      <div class="sms-row"><span>Trend</span><strong class="${row.trend.cls === 'up' ? 'sms-trend-up' : row.trend.cls === 'down' ? 'sms-trend-down' : 'sms-trend-flat'}">${esc(row.trend.label)}</strong></div>
    `;
  }

  function applyFilter() {
    const q = (document.getElementById('smsSearchInput')?.value || '').trim().toLowerCase();
    if (!q) {
      S.filtered = [...S.subjects];
    } else {
      S.filtered = S.subjects.filter(r =>
        String(r.subject_name).toLowerCase().includes(q) ||
        String(r.subject_code).toLowerCase().includes(q)
      );
    }
    renderStats(S.filtered);
    renderList(S.filtered);
  }

  async function fetchStudentIdByUuid(studentUuid) {
    if (!studentUuid) return null;
    try {
      const res = await API.get(API_ENDPOINTS.STUDENT_BY_UUID(studentUuid));
      const row = res?.data?.student_id != null
        ? res.data
        : (res?.data?.data || res?.data || res || null);
      return row?.student_id || null;
    } catch (_) {
      return null;
    }
  }

  async function loadMySubjects() {
    if (S.loading) return;
    S.loading = true;

    const list = document.getElementById('smsList');
    if (list) {
      list.innerHTML = '<div class="sms-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading subjects...</div>';
    }

    try {
      const studentUuid = getStudentUuid();
      if (!studentUuid) throw new Error('Student UUID not found in session');

      const coursesRes = await API.get(API_ENDPOINTS.STUDENT_COURSES(studentUuid));
      const allCourses = toArrayPayload(coursesRes);
      const courses = keepPrimaryClassCourses(allCourses);
      S.rawCourses = courses;

      const distinctClassIds = new Set(allCourses.map(c => String(c.class_id ?? '')).filter(Boolean));
      if (distinctClassIds.size > 1) {
        toast('Multiple class records detected. Showing your assigned class subjects only.', 'warning');
      }

      let studentId = getStudentIdFromUser();
      if (!studentId) {
        studentId = await fetchStudentIdByUuid(studentUuid);
      }

      let results = [];
      if (studentId) {
        try {
          const resultsRes = await API.get(API_ENDPOINTS.STUDENT_RESULTS(studentId));
          results = toArrayPayload(resultsRes);
        } catch (err) {
          console.warn('Student results endpoint unavailable', err);
        }
      }

      S.rawResults = results;
      S.subjects = aggregateSubjects(courses, results);
      applyFilter();
    } catch (err) {
      console.error('Failed to load my subjects', err);
      if (list) {
        list.innerHTML = `<div class="sms-error"><i class="fas fa-exclamation-circle"></i> ${esc(err.message || 'Failed to load subjects')}</div>`;
      }
      renderStats([]);
      toast('Failed to load subjects', 'error');
    } finally {
      S.loading = false;
    }
  }

  function wireActions() {
    const list = document.getElementById('smsList');
    if (!list || list.dataset.wired === '1') return;

    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const idx = Number(btn.getAttribute('data-idx'));
      const row = S.filtered[idx];
      if (!row) return;

      if (action === 'schedule') {
        await openSchedulePopup(row);
        return;
      }
      if (action === 'performance') {
        await openPerformancePopup(row);
        return;
      }
    });

    list.dataset.wired = '1';
  }

  async function reloadPageData() {
    await loadClassMaps();
    await loadMySubjects();
  }

  function initMySubjectsPage() {
    const root = document.getElementById('myStudentSubjectsPageRoot');
    if (!root || root.dataset.inited === '1') return;

    root.dataset.inited = '1';

    document.getElementById('smsRefreshBtn')?.addEventListener('click', reloadPageData);
    document.getElementById('smsSearchInput')?.addEventListener('input', applyFilter);
    document.getElementById('smsModalClose')?.addEventListener('click', closeModal);
    document.getElementById('smsModalOverlay')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'smsModalOverlay') closeModal();
    });

    wireActions();
    reloadPageData().catch(() => {});
  }

  document.addEventListener('page:loaded', (e) => {
    if (e.detail?.page === 'my-subjects') {
      initMySubjectsPage();
    }
  });
})();
