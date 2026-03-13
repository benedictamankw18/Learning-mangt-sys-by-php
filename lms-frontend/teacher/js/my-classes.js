/* ============================================
   Teacher My Classes Page
   SPA fragment: teacher/page/my-classes.html
============================================ */
(function () {
  'use strict';

  const S = {
    rawCourses: [],
    classes: [],
    filtered: [],
    classUuidById: new Map(),
    classMetaById: new Map(),
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

  function getTeacherUuid() {
    const u = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    return u?.teacher_uuid || null;
  }

  async function loadClassUuidMap() {
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
          S.classMetaById.set(String(c.class_id), {
            uuid: c.uuid || null,
            status: String(c.status || '').toLowerCase(),
          });
        }
      });
    } catch (e) {
      console.warn('Failed to preload class UUID map', e);
    }
  }

  function aggregateClasses(courses) {
    const byClass = new Map();

    courses.forEach(c => {
      const meta = S.classMetaById.get(String(c.class_id));
      if (meta && meta.status && meta.status !== 'active') return;

      const key = String(c.class_id ?? c.class_name ?? Math.random());
      if (!byClass.has(key)) {
        byClass.set(key, {
          class_id: c.class_id,
          class_name: c.class_name || 'Unnamed Class',
          program_name: c.program_name || 'Unassigned Program',
          student_count: Number(c.enrolled_students) || 0,
          subjects: new Set(),
          active_courses: 0,
          total_courses: 0,
        });
      }

      const row = byClass.get(key);
      row.student_count = Math.max(row.student_count, Number(c.enrolled_students) || 0);
      row.total_courses += 1;
      if (String(c.status || '').toLowerCase() === 'active') row.active_courses += 1;

      const subjectLabel = c.subject_name || c.subject_code;
      if (subjectLabel) row.subjects.add(subjectLabel);
    });

    return Array.from(byClass.values())
      .map(r => ({ ...r, subject_count: r.subjects.size }))
      .sort((a, b) => String(a.class_name).localeCompare(String(b.class_name)));
  }

  function renderStats(rows) {
    const classesEl = document.getElementById('tmcTotalClasses');
    const studentsEl = document.getElementById('tmcTotalStudents');
    const subjectsEl = document.getElementById('tmcTotalSubjects');

    const totalClasses = rows.length;
    const totalStudents = rows.reduce((sum, r) => sum + (Number(r.student_count) || 0), 0);
    const totalSubjects = rows.reduce((sum, r) => sum + (Number(r.subject_count) || 0), 0);

    if (classesEl) classesEl.textContent = String(totalClasses);
    if (studentsEl) studentsEl.textContent = String(totalStudents);
    if (subjectsEl) subjectsEl.textContent = String(totalSubjects);
  }

  function renderList(rows) {
    const list = document.getElementById('tmcList');
    if (!list) return;

    if (!rows.length) {
        list.style = 'grid-template-columns: none;';
      list.innerHTML = '<div class="tmc-empty"><i class="fas fa-inbox"></i> No classes found.</div>';
      return;
    }

    list.innerHTML = rows.map((r, idx) => {
      const healthy = r.active_courses >= 1;
      const statusCls = healthy ? 'ok' : 'warn';
      const statusTxt = healthy ? 'Active' : 'No active courses';

      return `
        <section class="tmc-card" data-idx="${idx}">
          <div class="tmc-head">
            <div>
              <h4>${esc(r.class_name)}</h4>
              <p>${esc(r.program_name)}</p>
            </div>
            <span class="tmc-badge ${statusCls}">${statusTxt}</span>
          </div>

          <div class="tmc-body">
            <div class="tmc-row"><span>Students</span><strong>${r.student_count}</strong></div>
            <div class="tmc-row"><span>Subjects</span><strong>${r.subject_count}</strong></div>
            <div class="tmc-row"><span>Course Records</span><strong>${r.active_courses}/${r.total_courses} active</strong></div>
          </div>

          <div class="tmc-actions">
            <button class="btn btn-sm btn-outline" data-action="roster" data-idx="${idx}"><i class="fas fa-users"></i> Class Roster</button>
            <button class="btn btn-sm btn-outline" data-action="attendance" data-idx="${idx}"><i class="fas fa-user-check"></i> Take Attendance</button>
            <button class="btn btn-sm btn-outline" data-action="schedule" data-idx="${idx}"><i class="fas fa-calendar-alt"></i> Class Schedule</button>
          </div>

        </section>
      `;
    }).join('');
  }

  function getCoursesForClass(classId) {
    return S.rawCourses.filter(c => String(c.class_id) === String(classId));
  }

  function getClassUuid(row) {
    return S.classUuidById.get(String(row.class_id));
  }

  function openModal(title) {
    const overlay = document.getElementById('tmcModalOverlay');
    const titleEl = document.getElementById('tmcModalTitle');
    if (titleEl) titleEl.textContent = title;
    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal() {
    const overlay = document.getElementById('tmcModalOverlay');
    const body = document.getElementById('tmcModalBody');
    const foot = document.getElementById('tmcModalFoot');
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

  async function fetchClassStudents(row) {
    const classUuid = getClassUuid(row);
    if (!classUuid) {
      throw new Error('Class UUID not found');
    }
    const res = await API.get(`/api/classes/${classUuid}/students`, { page: 1, limit: 200 });
    return res?.data?.data || res?.data || [];
  }

  async function openRosterPopup(row) {
    S.activeClass = row;
    openModal(`Class Roster - ${row.class_name}`);

    const body = document.getElementById('tmcModalBody');
    const foot = document.getElementById('tmcModalFoot');
    if (foot) {
      foot.innerHTML = '<button class="btn btn-sm btn-outline" id="tmcCloseRosterBtn">Close</button>';
      document.getElementById('tmcCloseRosterBtn')?.addEventListener('click', closeModal);
    }
    if (!body) return;
    body.innerHTML = '<div class="tmc-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading class roster...</div>';

    try {
      const students = await fetchClassStudents(row);
      const activeStudents = students.filter(s => String(s.status || '').toLowerCase() !== 'inactive');

      if (!activeStudents.length) {
        body.innerHTML = '<div class="tmc-empty">No active students enrolled in this class.</div>';
        return;
      }

      body.innerHTML = `
        <div class="tmc-table-wrap">
          <table class="tmc-table">
            <thead>
              <tr><th>#</th><th>Student</th><th>Index Number</th></tr>
            </thead>
            <tbody>
              ${activeStudents.map((s, i) => {
                const nm = s.full_name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.username || 'Student';
                return `<tr>
                  <td>${i + 1}</td>
                  <td>${esc(nm)}</td>
                  <td>${esc(s.student_id_number || s.admission_number || '-')}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (err) {
      console.error('Roster popup load failed', err);
      body.innerHTML = `<div class="tmc-error">${esc(err.message || 'Failed to load class roster')}</div>`;
    }
  }

  async function fetchCourseAttendance(courseId, dateStr) {
    try {
      const res = await API.get(`/api/courses/${courseId}/attendance`, { date: dateStr });
      const rows = res?.data || [];
      const map = new Map();
      rows.forEach(a => map.set(String(a.student_id), a.status || 'present'));
      return map;
    } catch (err) {
      console.warn('Could not fetch existing attendance', err);
      return new Map();
    }
  }

  async function openAttendancePopup(row) {
    S.activeClass = row;
    openModal(`Take Attendance - ${row.class_name}`);

    const body = document.getElementById('tmcModalBody');
    const foot = document.getElementById('tmcModalFoot');
    if (!body || !foot) return;

    const classCourses = getCoursesForClass(row.class_id);
    if (!classCourses.length) {
      body.innerHTML = '<div class="tmc-empty">No class-subject records found for this class.</div>';
      foot.innerHTML = '<button class="btn btn-sm btn-outline" id="tmcCloseAttendanceBtn">Close</button>';
      document.getElementById('tmcCloseAttendanceBtn')?.addEventListener('click', closeModal);
      return;
    }

    body.innerHTML = `
      <div class="tmc-modal-toolbar">
        <label for="tmcAttendanceDate">Date</label>
        <input class="tmc-input" type="date" id="tmcAttendanceDate">
        <label for="tmcAttendanceCourse">Subject</label>
        <select class="tmc-select" id="tmcAttendanceCourse">
          ${classCourses.map(c => `<option value="${c.course_id}">${esc(c.subject_name || c.subject_code || 'Subject')}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-outline" id="tmcMarkAllPresentBtn"><i class="fas fa-check-double"></i> Mark All Present</button>
      </div>
      <div id="tmcAttendanceArea" class="tmc-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading students...</div>
    `;

    foot.innerHTML = `
      <button class="btn btn-sm btn-outline" id="tmcCloseAttendanceBtn">Cancel</button>
      <button class="btn btn-sm btn-primary" id="tmcSaveAttendanceBtn"><i class="fas fa-floppy-disk"></i> Save Attendance</button>
    `;

    const dateEl = document.getElementById('tmcAttendanceDate');
    const courseEl = document.getElementById('tmcAttendanceCourse');
    const area = document.getElementById('tmcAttendanceArea');

    const today = new Date().toISOString().slice(0, 10);
    if (dateEl) dateEl.value = today;

    async function renderAttendanceRows() {
      if (!area || !courseEl || !dateEl) return;
      area.innerHTML = '<div class="tmc-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading attendance grid...</div>';
      try {
        const [students, current] = await Promise.all([
          fetchClassStudents(row),
          fetchCourseAttendance(Number(courseEl.value), dateEl.value || today),
        ]);

        if (!students.length) {
          area.innerHTML = '<div class="tmc-empty">No students enrolled in this class.</div>';
          return;
        }

        area.innerHTML = `
          <div class="tmc-table-wrap">
            <table class="tmc-table">
              <thead><tr><th>Index Number</th><th>Student</th><th>Status</th></tr></thead>
              <tbody>
              ${students.map((s, i) => {
                const nm = s.full_name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.username || 'Student';
                const selected = current.get(String(s.student_id)) || 'present';
                return `<tr>
                  <td>${esc(s.student_id_number || s.admission_number || '-')}</td>
                  <td>${esc(nm)}</td>
                  <td>
                    <select class="tmc-select tmc-att-status" data-student-id="${s.student_id}">
                      ${['present', 'absent', 'late', 'excused'].map(opt => `<option value="${opt}" ${selected === opt ? 'selected' : ''}>${opt.charAt(0).toUpperCase() + opt.slice(1)}</option>`).join('')}
                    </select>
                  </td>
                </tr>`;
              }).join('')}
              </tbody>
            </table>
          </div>`;
      } catch (err) {
        console.error('Failed to render attendance', err);
        area.innerHTML = '<div class="tmc-error">Failed to load attendance table.</div>';
      }
    }

    await renderAttendanceRows();

    courseEl?.addEventListener('change', renderAttendanceRows);
    dateEl?.addEventListener('change', renderAttendanceRows);

    document.getElementById('tmcMarkAllPresentBtn')?.addEventListener('click', () => {
      document.querySelectorAll('.tmc-att-status').forEach(sel => {
        sel.value = 'present';
      });
    });

    document.getElementById('tmcCloseAttendanceBtn')?.addEventListener('click', closeModal);

    document.getElementById('tmcSaveAttendanceBtn')?.addEventListener('click', async () => {
      const saveBtn = document.getElementById('tmcSaveAttendanceBtn');
      const students = Array.from(document.querySelectorAll('.tmc-att-status')).map(sel => ({
        student_id: Number(sel.getAttribute('data-student-id')),
        status: sel.value,
      }));

      if (!students.length) {
        toast('No attendance rows to save', 'warning');
        return;
      }

      try {
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';
        }
        await API.post('/api/attendance/bulk', {
          course_id: Number(courseEl.value),
          attendance_date: dateEl.value || today,
          students,
        });
        toast('Attendance saved successfully', 'success');
      } catch (err) {
        console.error('Save attendance failed', err);
        toast(err.message || 'Failed to save attendance', 'error');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-floppy-disk"></i> Save Attendance';
        }
      }
    });
  }

  async function openSchedulePopup(row) {
    S.activeClass = row;
    openModal(`Class Schedule - ${row.class_name}`);

    const body = document.getElementById('tmcModalBody');
    const foot = document.getElementById('tmcModalFoot');
    if (foot) {
      foot.innerHTML = '<button class="btn btn-sm btn-outline" id="tmcCloseScheduleBtn">Close</button>';
      document.getElementById('tmcCloseScheduleBtn')?.addEventListener('click', closeModal);
    }
    if (!body) return;

    body.innerHTML = '<div class="tmc-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading class schedule...</div>';

    try {
      const teacherUuid = getTeacherUuid();
      if (!teacherUuid) throw new Error('Teacher UUID not found in session');

      const res = await API.get(API_ENDPOINTS.TEACHER_SCHEDULE(teacherUuid));
      const all = res?.data || [];
      const rows = all.filter(s => String(s.class_name || '').toLowerCase() === String(row.class_name || '').toLowerCase());

      if (!rows.length) {
        body.innerHTML = '<div class="tmc-empty">No schedule entries found for this class.</div>';
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
        <div class="tmc-schedule-grid">
          ${rows.map(s => `
            <div class="tmc-slot">
              <h4>${esc(s.subject_name || s.subject_code || 'Subject')}</h4>
              <p>
                <span class="tmc-time">${fmtTime(s.start_time)} - ${fmtTime(s.end_time)}</span>
                ${esc(s.day_of_week || 'Day')}
              </p>
              <p>Room: ${esc(s.room || 'TBA')}</p>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      console.error('Schedule popup load failed', err);
      body.innerHTML = `<div class="tmc-error">${esc(err.message || 'Failed to load class schedule')}</div>`;
    }
  }

  function applyFilter() {
    const q = (document.getElementById('tmcSearchInput')?.value || '').trim().toLowerCase();
    if (!q) {
      S.filtered = [...S.classes];
    } else {
      S.filtered = S.classes.filter(r =>
        String(r.class_name).toLowerCase().includes(q) ||
        String(r.program_name).toLowerCase().includes(q)
      );
    }
    renderStats(S.filtered);
    renderList(S.filtered);
  }

  async function loadMyClasses() {
    if (S.loading) return;
    S.loading = true;

    const list = document.getElementById('tmcList');
    if (list) {
      list.innerHTML = '<div class="tmc-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading classes...</div>';
    }

    try {
      const teacherUuid = getTeacherUuid();
      if (!teacherUuid) {
        throw new Error('Teacher UUID not found in session');
      }

      const res = await API.get(API_ENDPOINTS.TEACHER_COURSES(teacherUuid));
      const courses = res?.data || [];
      S.rawCourses = Array.isArray(courses) ? courses : [];
      S.classes = aggregateClasses(Array.isArray(courses) ? courses : []);
      applyFilter();
    } catch (err) {
      console.error('Failed to load my classes', err);
      if (list) {
        list.innerHTML = `<div class="tmc-error"><i class="fas fa-exclamation-circle"></i> ${esc(err.message || 'Failed to load classes')}</div>`;
      }
      renderStats([]);
      toast('Failed to load classes', 'error');
    } finally {
      S.loading = false;
    }
  }

  function wireActions() {
    const list = document.getElementById('tmcList');
    if (!list || list.dataset.wired === '1') return;

    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const idx = Number(btn.getAttribute('data-idx'));
      const row = S.filtered[idx];
      if (!row) return;

      if (action === 'roster') {
        await openRosterPopup(row);
        return;
      }

      if (action === 'attendance') {
        await openAttendancePopup(row);
        return;
      }
      if (action === 'schedule') {
        await openSchedulePopup(row);
        return;
      }
    });

    list.dataset.wired = '1';
  }

  async function reloadPageData() {
    await loadClassUuidMap();
    await loadMyClasses();
  }

  function initMyClassesPage() {
    const root = document.getElementById('myClassesPageRoot');
    if (!root || root.dataset.inited === '1') return;

    root.dataset.inited = '1';

    document.getElementById('tmcRefreshBtn')?.addEventListener('click', reloadPageData);
    document.getElementById('tmcSearchInput')?.addEventListener('input', applyFilter);
    document.getElementById('tmcModalClose')?.addEventListener('click', closeModal);
    document.getElementById('tmcModalOverlay')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'tmcModalOverlay') closeModal();
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
