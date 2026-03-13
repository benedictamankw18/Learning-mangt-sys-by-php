/* ============================================
   Teacher My Subjects Page
   SPA fragment: teacher/page/my-subjects.html
============================================ */
(function () {
  'use strict';

  const S = {
    rawCourses: [],       // flat array of all teacher course records
    subjects: [],         // aggregated per-subject data
    filtered: [],         // search-filtered view
    classUuidById: new Map(), // class_id (string) → uuid
    subjectMetaById: new Map(), // subject_id (string) → { is_core }
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

  function getTeacherUuid() {
    const u = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    return u?.teacher_uuid || null;
  }

  // Pre-load class UUID map so we can look up class uuid by class_id
  async function loadClassUuidMap() {
    try {
      const res = await API.get(API_ENDPOINTS.CLASSES, { page: 1, limit: 500 });
      const rows = res?.data?.data || res?.data || [];
      S.classUuidById.clear();
      rows.forEach(c => {
        if (c?.class_id != null && c?.uuid) {
          S.classUuidById.set(String(c.class_id), c.uuid);
        }
      });
    } catch (e) {
      console.warn('Failed to preload class UUID map', e);
    }
  }

  // Fetch extra subject metadata (is_core) from teacher subjects endpoint
  async function loadSubjectMeta(teacherUuid) {
    try {
      const res = await API.get(API_ENDPOINTS.TEACHER_SUBJECTS(teacherUuid));
      const rows = res?.data || [];
      S.subjectMetaById.clear();
      rows.forEach(s => {
        if (s?.subject_id != null) {
          S.subjectMetaById.set(String(s.subject_id), {
            is_core: s.is_core != null ? Boolean(Number(s.is_core)) : null,
            credits: s.credits || null,
          });
        }
      });
    } catch (e) {
      console.warn('Failed to load subject meta', e);
    }
  }

  function aggregateSubjects(courses) {
    const bySubject = new Map();

    courses.forEach(c => {
      const key = String(c.subject_id || c.subject_code || c.subject_name || Math.random());
      const classUuid = S.classUuidById.get(String(c.class_id)) || null;
      const courseMeta = S.subjectMetaById.get(String(c.subject_id));

      if (!bySubject.has(key)) {
        bySubject.set(key, {
          subject_id: c.subject_id,
          subject_name: c.subject_name || 'Unnamed Subject',
          subject_code: c.subject_code || '',
          is_core: courseMeta?.is_core ?? null,
          credits: courseMeta?.credits ?? null,
          classes: [],
          total_students: 0,
          active_count: 0,
        });
      }

      const row = bySubject.get(key);

      // Enrich is_core if we got it later
      if (row.is_core === null && courseMeta?.is_core != null) {
        row.is_core = courseMeta.is_core;
      }

      row.classes.push({
        class_id: c.class_id,
        class_name: c.class_name || 'Unnamed Class',
        program_name: c.program_name || '',
        enrolled_students: Number(c.enrolled_students) || 0,
        course_id: c.course_id,
        status: String(c.status || '').toLowerCase(),
        class_uuid: classUuid,
      });

      row.total_students += Number(c.enrolled_students) || 0;
      if (String(c.status || '').toLowerCase() === 'active') row.active_count += 1;
    });

    return Array.from(bySubject.values())
      .sort((a, b) => String(a.subject_name).localeCompare(String(b.subject_name)));
  }

  function renderStats(rows) {
    const subjectsEl = document.getElementById('tmsTotalSubjects');
    const classesEl  = document.getElementById('tmsTotalClasses');
    const studentsEl = document.getElementById('tmsTotalStudents');

    const totalSubjects = rows.length;
    const totalClasses  = rows.reduce((s, r) => s + r.classes.length, 0);
    const totalStudents = rows.reduce((s, r) => s + r.total_students, 0);

    if (subjectsEl) subjectsEl.textContent = String(totalSubjects);
    if (classesEl)  classesEl.textContent  = String(totalClasses);
    if (studentsEl) studentsEl.textContent = String(totalStudents);
  }

  function renderList(rows) {
    const list = document.getElementById('tmsList');
    if (!list) return;

    if (!rows.length) {
      list.style = 'grid-template-columns: none;';
      list.innerHTML = '<div class="tms-empty"><i class="fas fa-inbox"></i> No subjects found.</div>';
      return;
    }

    list.style = '';
    list.innerHTML = rows.map((r, idx) => {
      const healthy = r.active_count >= 1;
      const coreBadge = r.is_core === true
        ? '<span class="tms-badge core">Core</span>'
        : r.is_core === false
          ? '<span class="tms-badge elective">Elective</span>'
          : '';
      const statusBadge = healthy
        ? '<span class="tms-badge active">Active</span>'
        : '<span class="tms-badge warn">No Active Courses</span>';

      // Show up to 4 class chips, then overflow count
      const chips = r.classes.slice(0, 4).map(cl =>
        `<span class="tms-class-chip">${esc(cl.class_name)}</span>`
      );
      if (r.classes.length > 4) {
        chips.push(`<span class="tms-class-chip">+${r.classes.length - 4} more</span>`);
      }

      return `
        <section class="tms-card" data-idx="${idx}">
          <div class="tms-head">
            <div class="tms-head-top">
              <h4>${esc(r.subject_name)}</h4>
              <div class="tms-badges">${coreBadge}${statusBadge}</div>
            </div>
            ${r.subject_code ? `<p class="tms-code">${esc(r.subject_code)}</p>` : ''}
          </div>

          <div class="tms-body">
            <div class="tms-row"><span>Classes Assigned</span><strong>${r.classes.length}</strong></div>
            <div class="tms-row"><span>Total Students</span><strong>${r.total_students}</strong></div>
            <div class="tms-row"><span>Active Courses</span><strong>${r.active_count} / ${r.classes.length}</strong></div>
            ${r.credits ? `<div class="tms-row"><span>Credits</span><strong>${esc(String(r.credits))}</strong></div>` : ''}
            <div class="tms-classes-pill">${chips.join('')}</div>
          </div>

          <div class="tms-actions">
            <button class="btn btn-sm btn-outline" data-action="classes" data-idx="${idx}"><i class="fas fa-chalkboard"></i> Assigned Classes</button>
            <button class="btn btn-sm btn-outline" data-action="schedule" data-idx="${idx}"><i class="fas fa-calendar-alt"></i> Subject Schedule</button>
          </div>
        </section>
      `;
    }).join('');
  }

  /* ---- Modal helpers ---- */

  function openModal(title) {
    const overlay = document.getElementById('tmsModalOverlay');
    const titleEl = document.getElementById('tmsModalTitle');
    if (titleEl) titleEl.textContent = title;
    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal() {
    const overlay = document.getElementById('tmsModalOverlay');
    const body    = document.getElementById('tmsModalBody');
    const foot    = document.getElementById('tmsModalFoot');
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

  /* ---- Popup: Assigned Classes ---- */

  async function openClassesPopup(row) {
    S.activeSubject = row;
    openModal(`Assigned Classes — ${row.subject_name}`);

    const body = document.getElementById('tmsModalBody');
    const foot = document.getElementById('tmsModalFoot');

    if (foot) {
      foot.innerHTML = '<button class="btn btn-sm btn-outline" id="tmsCloseClassesBtn">Close</button>';
      document.getElementById('tmsCloseClassesBtn')?.addEventListener('click', closeModal);
    }
    if (!body) return;

    if (!row.classes.length) {
      body.innerHTML = '<div class="tms-empty">No classes are assigned to this subject.</div>';
      return;
    }

    // Sort: active first, then by class name
    const sorted = [...row.classes].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return String(a.class_name).localeCompare(String(b.class_name));
    });

    body.innerHTML = `
      <div class="tms-table-wrap">
        <table class="tms-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Class</th>
              <th>Program</th>
              <th>Students</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((cl, i) => {
              const isActive = cl.status === 'active';
              const statusHtml = isActive
                ? '<span class="tms-badge active">Active</span>'
                : `<span class="tms-badge warn">${esc(cl.status || 'inactive')}</span>`;
              return `<tr>
                <td>${i + 1}</td>
                <td>${esc(cl.class_name)}</td>
                <td>${esc(cl.program_name || '—')}</td>
                <td>${cl.enrolled_students}</td>
                <td>${statusHtml}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  /* ---- Popup: Subject Schedule ---- */

  async function openSchedulePopup(row) {
    S.activeSubject = row;
    openModal(`Subject Schedule — ${row.subject_name}`);

    const body = document.getElementById('tmsModalBody');
    const foot = document.getElementById('tmsModalFoot');

    if (foot) {
      foot.innerHTML = '<button class="btn btn-sm btn-outline" id="tmsCloseScheduleBtn">Close</button>';
      document.getElementById('tmsCloseScheduleBtn')?.addEventListener('click', closeModal);
    }
    if (!body) return;

    body.innerHTML = '<div class="tms-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading schedule...</div>';

    try {
      const teacherUuid = getTeacherUuid();
      if (!teacherUuid) throw new Error('Teacher UUID not found in session');

      const res = await API.get(API_ENDPOINTS.TEACHER_SCHEDULE(teacherUuid));
      const all = res?.data || [];

      // Filter schedule entries that match this subject by name or code
      const subjectNameLow = String(row.subject_name || '').toLowerCase();
      const subjectCodeLow = String(row.subject_code || '').toLowerCase();

      const entries = all.filter(s => {
        const sName = String(s.subject_name || '').toLowerCase();
        const sCode = String(s.subject_code || '').toLowerCase();
        return sName === subjectNameLow || (subjectCodeLow && sCode === subjectCodeLow);
      });

      if (!entries.length) {
        body.innerHTML = '<div class="tms-empty">No schedule entries found for this subject.</div>';
        return;
      }

      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      entries.sort((a, b) => {
        const da = dayOrder.indexOf(String(a.day_of_week || '').toLowerCase());
        const db = dayOrder.indexOf(String(b.day_of_week || '').toLowerCase());
        if (da !== db) return da - db;
        return String(a.start_time || '').localeCompare(String(b.start_time || ''));
      });

      body.innerHTML = `
        <div class="tms-schedule-grid">
          ${entries.map(s => `
            <div class="tms-slot">
              <h4>${esc(s.class_name || 'Class')}</h4>
              <p>
                <span class="tms-time">${fmtTime(s.start_time)} – ${fmtTime(s.end_time)}</span>
                ${esc(s.day_of_week ? s.day_of_week.charAt(0).toUpperCase() + s.day_of_week.slice(1).toLowerCase() : 'Day')}
              </p>
              <p>Room: ${esc(s.room || 'TBA')}</p>
            </div>
          `).join('')}
        </div>`;
    } catch (err) {
      console.error('Schedule popup load failed', err);
      body.innerHTML = `<div class="tms-error">${esc(err.message || 'Failed to load schedule')}</div>`;
    }
  }

  /* ---- Search / Filter ---- */

  function applyFilter() {
    const q = (document.getElementById('tmsSearchInput')?.value || '').trim().toLowerCase();
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

  /* ---- Data Load ---- */

  async function loadMySubjects() {
    if (S.loading) return;
    S.loading = true;

    const list = document.getElementById('tmsList');
    if (list) {
      list.innerHTML = '<div class="tms-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading subjects...</div>';
    }

    try {
      const teacherUuid = getTeacherUuid();
      if (!teacherUuid) throw new Error('Teacher UUID not found in session');

      const res = await API.get(API_ENDPOINTS.TEACHER_COURSES(teacherUuid));
      const courses = res?.data || [];
      S.rawCourses = Array.isArray(courses) ? courses : [];
      S.subjects   = aggregateSubjects(S.rawCourses);
      applyFilter();
    } catch (err) {
      console.error('Failed to load my subjects', err);
      if (list) {
        list.innerHTML = `<div class="tms-error"><i class="fas fa-exclamation-circle"></i> ${esc(err.message || 'Failed to load subjects')}</div>`;
      }
      renderStats([]);
      toast('Failed to load subjects', 'error');
    } finally {
      S.loading = false;
    }
  }

  async function reloadPageData() {
    const teacherUuid = getTeacherUuid();
    await Promise.all([
      loadClassUuidMap(),
      teacherUuid ? loadSubjectMeta(teacherUuid) : Promise.resolve(),
    ]);
    await loadMySubjects();
  }

  /* ---- Event Wiring ---- */

  function wireActions() {
    const list = document.getElementById('tmsList');
    if (!list || list.dataset.wired === '1') return;

    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const idx    = Number(btn.getAttribute('data-idx'));
      const row    = S.filtered[idx];
      if (!row) return;

      if (action === 'classes') {
        await openClassesPopup(row);
        return;
      }
      if (action === 'schedule') {
        await openSchedulePopup(row);
        return;
      }
    });

    list.dataset.wired = '1';
  }

  function initMySubjectsPage() {
    const root = document.getElementById('mySubjectsPageRoot');
    if (!root || root.dataset.inited === '1') return;

    root.dataset.inited = '1';

    document.getElementById('tmsRefreshBtn')?.addEventListener('click', reloadPageData);
    document.getElementById('tmsSearchInput')?.addEventListener('input', applyFilter);
    document.getElementById('tmsModalClose')?.addEventListener('click', closeModal);
    document.getElementById('tmsModalOverlay')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'tmsModalOverlay') closeModal();
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
