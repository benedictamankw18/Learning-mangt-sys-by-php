/* ============================================
   Student My Classes Page
   SPA fragment: student/page/my-classes.html
============================================ */
(function () {
  'use strict';

  const S = {
    rawCourses: [],
    classes: [],
    filtered: [],
    classUuidById: new Map(),
    loading: false,
    activeClass: null,
  };

  function esc(v) {
    return typeof escHtml === 'function'
      ? escHtml(String(v ?? ''))
      : String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function toast(msg, type = 'info') {
    if (typeof showToast === 'function') showToast(msg, type);
  }

  function getStudentUuid() {
    const u = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    return u?.student_uuid || u?.uuid || null;
  }

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

  // Ghana SHS model: each student is assigned to one class.
  // If API returns multiple class IDs, keep only the primary class (most records).
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

  function aggregateClasses(courses) {
    const byClass = new Map();

    courses.forEach(c => {
      const key = String(c.class_id ?? c.class_name ?? Math.random());
      if (!byClass.has(key)) {
        byClass.set(key, {
          class_id: c.class_id,
          class_name: c.class_name || 'Unnamed Class',
          semester_name: c.semester_name || 'Current Semester',
          enrollment_date: c.enrollment_date || null,
          enrollment_status: String(c.enrollment_status || c.status || 'active').toLowerCase(),
          teachers: new Set(),
          course_count: 0,
        });
      }

      const row = byClass.get(key);
      const teacherName = [c.teacher_first_name, c.teacher_last_name].filter(Boolean).join(' ') || 'Unassigned Teacher';
      row.course_count += 1;
      if (!row.enrollment_date && c.enrollment_date) row.enrollment_date = c.enrollment_date;
      row.teachers.add(teacherName);
    });

    return Array.from(byClass.values())
      .map(r => ({
        ...r,
        teacher_count: r.teachers.size,
      }))
      .sort((a, b) => String(a.class_name).localeCompare(String(b.class_name)));
  }

  function renderStats(rows) {
    const classesEl = document.getElementById('smcTotalClasses');
    const teachersEl = document.getElementById('smcTotalTeachers');
    const coursesEl = document.getElementById('smcTotalCourses');

    const totalClasses = rows.length ? 1 : 0;
    const totalTeachers = rows.reduce((sum, r) => sum + (Number(r.teacher_count) || 0), 0);
    const totalCourses = rows.reduce((sum, r) => sum + (Number(r.course_count) || 0), 0);

    if (classesEl) classesEl.textContent = String(totalClasses);
    if (teachersEl) teachersEl.textContent = String(totalTeachers);
    if (coursesEl) coursesEl.textContent = String(totalCourses);
  }

  function renderList(rows) {
    const list = document.getElementById('smcList');
    if (!list) return;

    if (!rows.length) {
      list.style = 'grid-template-columns: none;';
      list.innerHTML = '<div class="smc-empty"><i class="fas fa-inbox"></i> No class found.</div>';
      return;
    }

    const assigned = rows[0];
    if (!assigned) {
      list.style = 'grid-template-columns: none;';
      list.innerHTML = '<div class="smc-empty"><i class="fas fa-inbox"></i> No class found.</div>';
      return;
    }

    list.style = '';
    list.innerHTML = [assigned].map((r, idx) => {
      const active = r.enrollment_status === 'active';
      const statusCls = active ? 'ok' : 'warn';
      const statusTxt = active ? 'Active Enrollment' : 'Enrollment Inactive';

      return `
        <section class="smc-card" data-idx="${idx}">
          <div class="smc-head">
            <div>
              <h4>${esc(r.class_name)}</h4>
              <p>${esc(r.semester_name)}</p>
            </div>
            <span class="smc-badge ${statusCls}">${statusTxt}</span>
          </div>

          <div class="smc-body">
            <div class="smc-row"><span>Teachers Assigned</span><strong>${r.teacher_count}</strong></div>
            <div class="smc-row"><span>Course Records</span><strong>${r.course_count}</strong></div>
            <div class="smc-row"><span>Enrollment Date</span><strong>${esc(fmtDate(r.enrollment_date))}</strong></div>
          </div>

          <div class="smc-actions">
            <button class="btn btn-sm btn-outline" data-action="details" data-idx="${idx}"><i class="fas fa-school"></i> Class Profile</button>
            <button class="btn btn-sm btn-outline" data-action="schedule" data-idx="${idx}"><i class="fas fa-calendar-alt"></i> Class Schedule</button>
          </div>
        </section>
      `;
    }).join('');
  }

  function openModal(title) {
    const overlay = document.getElementById('smcModalOverlay');
    const titleEl = document.getElementById('smcModalTitle');
    if (titleEl) titleEl.textContent = title;
    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal() {
    const overlay = document.getElementById('smcModalOverlay');
    const body = document.getElementById('smcModalBody');
    const foot = document.getElementById('smcModalFoot');
    if (body) body.innerHTML = '';
    if (foot) foot.innerHTML = '';
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    S.activeClass = null;
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

  function fmtDate(dateValue) {
    if (!dateValue) return '-';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return String(dateValue);
    return d.toLocaleDateString();
  }

  function getClassUuid(row) {
    return S.classUuidById.get(String(row.class_id)) || null;
  }

  async function fetchClassProfile(row) {
    const classUuid = getClassUuid(row);
    if (!classUuid) throw new Error('Class UUID not found');
    const res = await API.get(`/api/classes/${classUuid}`);
    return res?.data || null;
  }

  async function openDetailsPopup(row) {
    S.activeClass = row;
    openModal(`Class Profile - ${row.class_name}`);

    const body = document.getElementById('smcModalBody');
    const foot = document.getElementById('smcModalFoot');
    if (foot) {
      foot.innerHTML = '<button class="btn btn-sm btn-outline" id="smcCloseDetailsBtn">Close</button>';
      document.getElementById('smcCloseDetailsBtn')?.addEventListener('click', closeModal);
    }
    if (!body) return;

    body.innerHTML = '<div class="smc-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading class profile...</div>';

    try {
      const p = await fetchClassProfile(row);
      body.innerHTML = `
        <div class="smc-table-wrap">
          <table class="smc-table">
            <tbody>
              <tr><th>Class Name</th><td>${esc(p?.class_name || row.class_name || '-')}</td></tr>
              <tr><th>Class Code</th><td>${esc(p?.class_code || '-')}</td></tr>
              <tr><th>Program</th><td>${esc(p?.program_name || '-')}</td></tr>
              <tr><th>Room</th><td>${esc(p?.room_number || p?.room || '-')}</td></tr>
              <tr><th>Class Teacher</th><td>${esc(p?.class_teacher_name || '-')}</td></tr>
              <tr><th>Semester</th><td>${esc(row.semester_name || '-')}</td></tr>
              <tr><th>Enrollment Date</th><td>${esc(fmtDate(row.enrollment_date))}</td></tr>
              <tr><th>Teachers Assigned</th><td>${row.teacher_count}</td></tr>
              <tr><th>Course Records</th><td>${row.course_count}</td></tr>
            </tbody>
          </table>
        </div>`;
    } catch (err) {
      console.error('Class profile load failed', err);
      body.innerHTML = `<div class="smc-error">${esc(err.message || 'Failed to load class profile')}</div>`;
    }
  }

  async function openSchedulePopup(row) {
    S.activeClass = row;
    openModal(`Class Schedule - ${row.class_name}`);

    const body = document.getElementById('smcModalBody');
    const foot = document.getElementById('smcModalFoot');
    if (foot) {
      foot.innerHTML = '<button class="btn btn-sm btn-outline" id="smcCloseScheduleBtn">Close</button>';
      document.getElementById('smcCloseScheduleBtn')?.addEventListener('click', closeModal);
    }
    if (!body) return;

    body.innerHTML = '<div class="smc-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading class schedule...</div>';

    try {
      const classUuid = getClassUuid(row);
      if (!classUuid) throw new Error('Class UUID not found');

      const res = await API.get(`/api/classes/${classUuid}/schedule`);
      const rows = res?.data || [];

      if (!rows.length) {
        body.innerHTML = '<div class="smc-empty">No schedule entries found for this class.</div>';
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
        <div class="smc-schedule-grid">
          ${rows.map(s => `
            <div class="smc-slot">
              <h4>${esc(s.subject_name || s.subject_code || 'Subject')}</h4>
              <p>
                <span class="smc-time">${fmtTime(s.start_time)} - ${fmtTime(s.end_time)}</span>
                ${esc(s.day_of_week || 'Day')}
              </p>
              <p>Teacher: ${esc(s.teacher_name || 'Unassigned')}</p>
              <p>Room: ${esc(s.room || 'TBA')}</p>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      console.error('Schedule popup load failed', err);
      body.innerHTML = `<div class="smc-error">${esc(err.message || 'Failed to load class schedule')}</div>`;
    }
  }

  function applyFilter() {
    // Page is strictly about the assigned class.
    S.filtered = S.classes.length ? [S.classes[0]] : [];
    renderStats(S.filtered);
    renderList(S.filtered);
  }

  async function loadMyClasses() {
    if (S.loading) return;
    S.loading = true;

    const list = document.getElementById('smcList');
    if (list) {
      list.innerHTML = '<div class="smc-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading classes...</div>';
    }

    try {
      const studentUuid = getStudentUuid();
      if (!studentUuid) throw new Error('Student UUID not found in session');

      const res = await API.get(API_ENDPOINTS.STUDENT_COURSES(studentUuid));
      const courses = res?.data || [];

      const allCourses = Array.isArray(courses) ? courses : [];
      const distinctClassIds = new Set(allCourses.map(c => String(c.class_id ?? '')).filter(Boolean));
      S.rawCourses = keepPrimaryClassCourses(allCourses);

      if (distinctClassIds.size > 1) {
        toast('Multiple class records detected. Showing your primary assigned class only.', 'warning');
      }

      const aggregated = aggregateClasses(S.rawCourses);
      S.classes = aggregated.length ? [aggregated[0]] : [];
      applyFilter();
    } catch (err) {
      console.error('Failed to load my classes', err);
      if (list) {
        list.innerHTML = `<div class="smc-error"><i class="fas fa-exclamation-circle"></i> ${esc(err.message || 'Failed to load classes')}</div>`;
      }
      renderStats([]);
      toast('Failed to load classes', 'error');
    } finally {
      S.loading = false;
    }
  }

  async function reloadPageData() {
    await loadClassUuidMap();
    await loadMyClasses();
  }

  function wireActions() {
    const list = document.getElementById('smcList');
    if (!list || list.dataset.wired === '1') return;

    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const idx = Number(btn.getAttribute('data-idx'));
      const row = S.filtered[idx];
      if (!row) return;

      if (action === 'details') {
        await openDetailsPopup(row);
        return;
      }
      if (action === 'schedule') {
        await openSchedulePopup(row);
        return;
      }
    });

    list.dataset.wired = '1';
  }

  function initMyClassesPage() {
    const root = document.getElementById('myStudentClassesPageRoot');
    if (!root || root.dataset.inited === '1') return;

    root.dataset.inited = '1';

    document.getElementById('smcRefreshBtn')?.addEventListener('click', reloadPageData);
    document.getElementById('smcModalClose')?.addEventListener('click', closeModal);
    document.getElementById('smcModalOverlay')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'smcModalOverlay') closeModal();
    });
    wireActions();

    reloadPageData().catch(() => {});
  }

  document.addEventListener('page:loaded', (e) => {
    if (e.detail?.page === 'my-classes') {
      initMyClassesPage();
    }
  });
})();
