/* ============================================
   Admin Timetable Page
   SPA fragment: admin/page/timetable.html
============================================ */
(function () {
  'use strict';

  const LS_PERIODS = 'lms_tt_periods_v1';

  const S = {
    inited: false,
    view: 'class',
    page: 1,
    pageSize: 20,
    periods: [],
    schedules: [],
    filtered: [],
    classSubjects: [],
    classesById: new Map(),
    teachersById: new Map(),
    coursesById: new Map(),
    activeYearId: null,
    activeSemesterId: null,
    isPublished: false,
    importRows: [],
  };

  function titleCaseDay(v) {
    const raw = String(v || '').trim().toLowerCase();
    if (!raw) return '';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function esc(v) {
    const s = String(v ?? '');
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function getUserInstitutionId() {
    const user = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    return user && user.institution_id ? user.institution_id : null;
  }

  function getUserInstitutionKey() {
    const user = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    if (!user) return '';
    return String(user.institution_uuid || user.institution_id || '').trim();
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function readJsonLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function writeJsonLS(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // ignore quota/storage errors
    }
  }

  async function init() {
    const root = document.getElementById('adminTimetableRoot');
    if (!root) return;
    // In SPA navigation, this page can be destroyed and recreated.
    // Bind events per rendered root instance instead of once globally.
    if (root.getAttribute('data-tt-bound') !== '1') {
      bindEvents();
      root.setAttribute('data-tt-bound', '1');
    }

    S.periods = [];

    await loadReferenceData();
    await loadSchedules();
    await loadPublishState();
    await loadPeriodSlots();
    renderPeriodList();
    renderAll();
  }

  function bindEvents() {
    on('ttRefreshBtn', 'click', async function () {
      await loadReferenceData();
      await loadSchedules();
      await loadPeriodSlots();
      renderAll();
      toast('Timetable refreshed', 'success');
    });

    on('ttViewClassBtn', 'click', function () {
      S.view = 'class';
      S.page = 1;
      syncViewTabs();
      renderTable();
    });

    on('ttViewTeacherBtn', 'click', function () {
      S.view = 'teacher';
      S.page = 1;
      syncViewTabs();
      renderTable();
    });

    ['ttClassFilter', 'ttTeacherFilter', 'ttDayFilter', 'ttAcademicYear', 'ttSemester'].forEach(function (id) {
      on(id, 'change', function () {
        if (id === 'ttAcademicYear') S.activeYearId = document.getElementById('ttAcademicYear').value || null;
        if (id === 'ttSemester') S.activeSemesterId = document.getElementById('ttSemester').value || null;
        S.page = 1;
        applyFilters();
        renderAll();
      });
    });

    on('ttAddPeriodBtn', 'click', addPeriod);
    on('ttAssignBtn', 'click', createSchedule);

    on('ttPublishBtn', 'click', async function () {
      try {
        await setPublishState(true);
        renderPublishState();
        toast('Timetable published', 'success');
      } catch (e) {
        toast((e && e.message) || 'Failed to publish timetable', 'error');
      }
    });

    on('ttUnpublishBtn', 'click', async function () {
      try {
        await setPublishState(false);
        renderPublishState();
        toast('Timetable unpublished', 'warning');
      } catch (e) {
        toast((e && e.message) || 'Failed to unpublish timetable', 'error');
      }
    });

    on('ttImportBtn', 'click', openImportModal);

    on('ttExportPdfBtn', 'click', handleExportPdfClick);
  }

  async function handleExportPdfClick() {
    const mode = await openExportModeModal();
    if (!mode) return;
    exportPdf(mode);
  }

  function openExportModeModal() {
    return new Promise(function (resolve) {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'rgba(15, 23, 42, 0.55)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '16px';
      overlay.style.zIndex = '3200';

      const modal = document.createElement('div');
      modal.style.width = '100%';
      modal.style.maxWidth = '520px';
      modal.style.background = '#ffffff';
      modal.style.borderRadius = '14px';
      modal.style.boxShadow = '0 20px 45px rgba(2, 6, 23, 0.25)';
      modal.style.overflow = 'hidden';

      modal.innerHTML = ''
        + '<div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc">'
        + '<strong style="font-size:1rem;color:#0f172a"><i class="fas fa-file-pdf" style="margin-right:6px;color:#dc2626"></i>Export Timetable PDF</strong>'
        + '</div>'
        + '<div style="padding:16px;display:grid;gap:10px">'
        + '<label style="display:flex;gap:8px;align-items:flex-start;padding:10px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer">'
        + '<input type="radio" name="ttExportMode" value="combined" checked>'
        + '<span><strong>Combined Long List</strong><br><small style="color:#64748b">One continuous table of all rows.</small></span>'
        + '</label>'
        + '<label style="display:flex;gap:8px;align-items:flex-start;padding:10px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer">'
        + '<input type="radio" name="ttExportMode" value="by_class">'
        + '<span><strong>Divide by Classes</strong><br><small style="color:#64748b">One PDF with a section per class.</small></span>'
        + '</label>'
        + '<label style="display:flex;gap:8px;align-items:flex-start;padding:10px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer">'
        + '<input type="radio" name="ttExportMode" value="by_teacher">'
        + '<span><strong>Divide by Teachers</strong><br><small style="color:#64748b">One PDF with a section per teacher.</small></span>'
        + '</label>'
        + '</div>'
        + '<div style="padding:12px 16px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:8px">'
        + '<button type="button" id="ttExportModeCancel" class="btn btn-sm btn-outline">Cancel</button>'
        + '<button type="button" id="ttExportModeConfirm" class="btn btn-sm btn-primary">Export</button>'
        + '</div>';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const cancelBtn = modal.querySelector('#ttExportModeCancel');
      const confirmBtn = modal.querySelector('#ttExportModeConfirm');

      function cleanup(result) {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener('keydown', onKeydown);
        resolve(result);
      }

      function onKeydown(e) {
        if (e.key === 'Escape') cleanup(null);
      }

      if (cancelBtn) cancelBtn.addEventListener('click', function () { cleanup(null); });
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
          const selected = modal.querySelector('input[name="ttExportMode"]:checked');
          cleanup(selected ? selected.value : 'combined');
        });
      }

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) cleanup(null);
      });

      document.addEventListener('keydown', onKeydown);
      if (confirmBtn) confirmBtn.focus();
    });
  }

  function on(id, evt, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, handler);
  }

  async function loadReferenceData() {
    const institutionId = getUserInstitutionId();
    const csParams = { limit: 1000 };
    const clParams = { page: 1, limit: 1000 };
    if (institutionId) {
      csParams.institution_id = institutionId;
      clParams.institution_id = institutionId;
    }

    const [classSubjectsRes, classesRes, yearCurrentRes, semCurrentRes] = await Promise.all([
      API.get(API_ENDPOINTS.CLASS_SUBJECTS, csParams),
      API.get(API_ENDPOINTS.CLASSES, clParams),
      API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT),
      API.get(API_ENDPOINTS.SEMESTER_CURRENT),
    ]);

    const classSubjects = toArray(classSubjectsRes);
    const classesPayload = classesRes && classesRes.data ? classesRes.data : classesRes;
    const classes = Array.isArray(classesPayload && classesPayload.classes) ? classesPayload.classes : toArray(classesRes);
    const yearCurrent = (yearCurrentRes && (yearCurrentRes.data || yearCurrentRes)) || null;
    const semCurrent = (semCurrentRes && (semCurrentRes.data || semCurrentRes)) || null;

    const years = yearCurrent
      ? [{
          academic_year_id: yearCurrent.academic_year_id || yearCurrent.id || '',
          year_name: yearCurrent.year_name || yearCurrent.name || 'Current Academic Year',
        }]
      : [];

    const semesters = semCurrent
      ? [{
          semester_id: semCurrent.semester_id || semCurrent.id || '',
          semester_name: semCurrent.semester_name || semCurrent.name || 'Current Semester',
        }]
      : [];

    S.classSubjects = classSubjects;
    S.classesById = new Map();
    S.teachersById = new Map();
    S.coursesById = new Map();

    classes.forEach(function (c) {
      if (c && c.class_id != null) S.classesById.set(String(c.class_id), c);
    });

    classSubjects.forEach(function (cs) {
      if (cs.teacher_id != null) {
        S.teachersById.set(String(cs.teacher_id), {
          teacher_id: cs.teacher_id,
          teacher_name: cs.teacher_name || 'Unassigned teacher',
        });
      }
      if (cs.course_id != null) {
        S.coursesById.set(String(cs.course_id), cs);
      }
    });

    renderYearSemesterFilters(years, semesters);
    renderCourseSelect();
    renderClassTeacherFilters();
  }

  async function loadSchedules() {
    const all = [];
    for (let i = 0; i < S.classSubjects.length; i++) {
      const cs = S.classSubjects[i];
      if (!cs || !cs.course_id) continue;
      try {
        const res = await ClassScheduleAPI.getByCourse(cs.course_id);
        const rows = toArray(res).map(function (r) {
          const merged = Object.assign({}, r, {
            course_id: r.course_id || cs.course_id,
            day_of_week: titleCaseDay(r.day_of_week),
            period_label: r.period_label || '',
            class_id: cs.class_id,
            class_name: cs.class_name || getClassName(cs.class_id),
            teacher_id: cs.teacher_id,
            teacher_name: cs.teacher_name || getTeacherName(cs.teacher_id),
            subject_name: cs.subject_name || cs.course_name || 'Subject',
            room_name: r.room_name || r.room || '',
          });
          return merged;
        });
        all.push.apply(all, rows);
      } catch (_) {
        // ignore schedule fetch failures per class-subject
      }
    }
    S.schedules = all;
    applyFilters();
  }

  function applyFilters() {
    const classId = value('ttClassFilter');
    const teacherId = value('ttTeacherFilter');
    const day = value('ttDayFilter');

    S.filtered = S.schedules.filter(function (r) {
      if (classId && String(r.class_id) !== classId) return false;
      if (teacherId && String(r.teacher_id) !== teacherId) return false;
      if (day && String(r.day_of_week || '') !== day) return false;
      return true;
    });
  }

  function value(id) {
    const el = document.getElementById(id);
    return el ? (el.value || '') : '';
  }

  function renderAll() {
    renderStats();
    renderTable();
    renderConflicts();
    renderPublishState();
  }

  function renderStats() {
    const total = S.filtered.length;
    const activeClasses = new Set(S.filtered.map(function (r) { return String(r.class_id || ''); }).filter(Boolean)).size;
    const conflicts = detectConflicts(S.filtered).length;

    setText('ttTotalSchedules', String(total));
    setText('ttActiveClasses', String(activeClasses));
    setText('ttConflictCount', String(conflicts));
  }

  function renderTable() {
    const thead = document.getElementById('ttTableHead');
    const tbody = document.getElementById('ttTableBody');
    if (!thead || !tbody) return;

    const totalPages = Math.max(1, Math.ceil(S.filtered.length / S.pageSize));
    if (S.page > totalPages) S.page = totalPages;
    if (S.page < 1) S.page = 1;

    const startIdx = (S.page - 1) * S.pageSize;
    const endIdx = startIdx + S.pageSize;
    const pageRows = S.filtered
      .slice()
      .sort(sortByDayThenTime)
      .slice(startIdx, endIdx);

    if (!pageRows.length) {
      thead.innerHTML = '';
      tbody.innerHTML = '<tr><td class="tt-empty" colspan="8"><i class="fas fa-inbox"></i>No timetable records yet.</td></tr>';
      renderTablePagination(0, 0, 0);
      return;
    }

    if (S.view === 'class') {
      thead.innerHTML = '<tr>'
        + '<th>Class</th><th>Day</th><th>Time</th><th>Period</th><th>Subject</th><th>Teacher</th><th>Room</th><th>Status</th><th>Actions</th>'
        + '</tr>';
      tbody.innerHTML = pageRows
        .map(function (r) {
          const status = isPublished() ? '<span class="tt-chip published">Published</span>' : '<span class="tt-chip unpublished">Draft</span>';
          const scheduleId = r.schedule_id || r.id || '';
          return '<tr>'
            + '<td>' + esc(r.class_name || getClassName(r.class_id)) + '</td>'
            + '<td>' + esc(r.day_of_week && typeof r.day_of_week.toUpperCase === 'function' ? r.day_of_week.toUpperCase() : '-') + '</td>'
            + '<td>' + esc(formatTimeRange(r.start_time, r.end_time)) + '</td>'
            + '<td>' + esc(r.period_label || '-') + '</td>'
            + '<td>' + esc(r.subject_name || '-') + '</td>'
            + '<td>' + esc(r.teacher_name || '-') + '</td>'
            + '<td>' + esc(r.room_name || '-') + '</td>'
            + '<td>' + status + '</td>'
            + '<td>'
            + '<button class="btn btn-sm btn-outline tt-edit" data-course-id="' + esc(String(r.course_id || '')) + '" data-schedule-id="' + esc(String(scheduleId)) + '"><i class="fas fa-pen"></i></button> '
            + '<button class="btn btn-sm btn-outline tt-del" data-course-id="' + esc(String(r.course_id || '')) + '" data-schedule-id="' + esc(String(scheduleId)) + '"><i class="fas fa-trash"></i></button>'
            + '</td>'
            + '</tr>';
        }).join('');
    } else {
      thead.innerHTML = '<tr>'
        + '<th>Teacher</th><th>Day</th><th>Time</th><th>Period</th><th>Class</th><th>Subject</th><th>Room</th><th>Status</th><th>Actions</th>'
        + '</tr>';
      tbody.innerHTML = pageRows
        .map(function (r) {
          const status = isPublished() ? '<span class="tt-chip published">Published</span>' : '<span class="tt-chip unpublished">Draft</span>';
          const scheduleId = r.schedule_id || r.id || '';
          return '<tr>'
            + '<td>' + esc(r.teacher_name && typeof r.teacher_name.toUpperCase === 'function' ? r.teacher_name.toUpperCase() : '-') + '</td>'
            + '<td>' + esc(r.day_of_week && typeof r.day_of_week.toUpperCase === 'function' ? r.day_of_week.toUpperCase() : '-') + '</td>'
            + '<td>' + esc(formatTimeRange(r.start_time, r.end_time)) + '</td>'
            + '<td>' + esc(r.period_label || '-') + '</td>'
            + '<td>' + esc(r.class_name && typeof r.class_name.toTitleCase === 'function' ? r.class_name.toTitleCase() : getClassName(r.class_id)) + '</td>'
            + '<td>' + esc(r.subject_name && typeof r.subject_name.toUpperCase === 'function' ? r.subject_name.toUpperCase() : '-') + '</td>'
            + '<td>' + esc(r.room_name && typeof r.room_name.toUpperCase === 'function' ? r.room_name.toUpperCase() : '-') + '</td>'
            + '<td>' + status + '</td>'
            + '<td>'
            + '<button class="btn btn-sm btn-outline tt-edit" data-course-id="' + esc(String(r.course_id || '')) + '" data-schedule-id="' + esc(String(scheduleId)) + '"><i class="fas fa-pen"></i></button> '
            + '<button class="btn btn-sm btn-outline tt-del" data-course-id="' + esc(String(r.course_id || '')) + '" data-schedule-id="' + esc(String(scheduleId)) + '"><i class="fas fa-trash"></i></button>'
            + '</td>'
            + '</tr>';
        }).join('');
    }

    bindEditButtons();
    bindDeleteButtons();
    renderTablePagination(startIdx + 1, Math.min(endIdx, S.filtered.length), S.filtered.length);
  }

  function renderTablePagination(from, to, total) {
    const tableWrap = document.querySelector('.tt-card .tt-card-body .tt-table-wrap');
    if (!tableWrap || !tableWrap.parentNode) return;

    let bar = document.getElementById('ttTablePager');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'ttTablePager';
      bar.style.display = 'flex';
      bar.style.justifyContent = 'space-between';
      bar.style.alignItems = 'center';
      bar.style.gap = '8px';
      bar.style.flexWrap = 'wrap';
      bar.style.marginTop = '10px';
      tableWrap.parentNode.appendChild(bar);
    }

    if (!total) {
      bar.innerHTML = '<span style="font-size:.8rem;color:#64748b">No records</span>';
      return;
    }

    const totalPages = Math.max(1, Math.ceil(total / S.pageSize));
    let buttons = '';
    buttons += '<button type="button" class="btn btn-sm btn-outline" data-page="' + (S.page - 1) + '" ' + (S.page === 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';

    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= S.page - 2 && p <= S.page + 2)) {
        const isActive = p === S.page;
        buttons += '<button type="button" class="btn btn-sm ' + (isActive ? 'btn-primary' : 'btn-outline') + '" data-page="' + p + '">' + p + '</button>';
      } else if (p === S.page - 3 || p === S.page + 3) {
        buttons += '<button type="button" class="btn btn-sm btn-outline" disabled>...</button>';
      }
    }

    buttons += '<button type="button" class="btn btn-sm btn-outline" data-page="' + (S.page + 1) + '" ' + (S.page === totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';

    bar.innerHTML = ''
      + '<span style="font-size:.8rem;color:#64748b">Showing ' + from + '-' + to + ' of ' + total + ' records</span>'
      + '<div id="ttPageButtons" style="display:flex;gap:6px;flex-wrap:wrap">' + buttons + '</div>';

    const pageButtons = bar.querySelectorAll('#ttPageButtons button[data-page]');
    pageButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = Number(btn.getAttribute('data-page'));
        if (!target || target < 1 || target > totalPages || target === S.page) return;
        S.page = target;
        renderTable();
      });
    });
  }

  function bindEditButtons() {
    const buttons = document.querySelectorAll('.tt-edit');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const courseId = btn.getAttribute('data-course-id');
        const scheduleId = btn.getAttribute('data-schedule-id');
        if (!courseId || !scheduleId) return;

        const current = S.schedules.find(function (r) {
          return String(r.schedule_id || r.id) === String(scheduleId);
        });
        if (!current) {
          toast('Schedule record not found in view.', 'warning');
          return;
        }

        const editData = await openScheduleEditModal(current);
        if (!editData) return;

        try {
          const payload = {
            day_of_week: editData.day,
            start_time: editData.start,
            end_time: editData.end,
            period_label: editData.periodLabel || null,
            room: editData.room || null,
            status: editData.status,
          };

          await ClassScheduleAPI.updateForCourse(courseId, scheduleId, payload);

          current.day_of_week = editData.day;
          current.start_time = editData.start;
          current.end_time = editData.end;
          current.period_label = editData.periodLabel;
          current.room = editData.room;
          current.room_name = editData.room;
          current.status = editData.status;

          applyFilters();
          renderAll();
          toast('Schedule updated', 'success');
        } catch (e) {
          toast((e && e.message) || 'Failed to update schedule', 'error');
        }
      });
    });
  }

  function openScheduleEditModal(current) {
    return new Promise(function (resolve) {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'rgba(15, 23, 42, 0.55)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '16px';
      overlay.style.zIndex = '3000';

      const modal = document.createElement('div');
      modal.style.width = '100%';
      modal.style.maxWidth = '540px';
      modal.style.background = '#ffffff';
      modal.style.borderRadius = '14px';
      modal.style.boxShadow = '0 20px 45px rgba(2, 6, 23, 0.25)';
      modal.style.overflow = 'hidden';

      const currentDay = titleCaseDay(current.day_of_week) || 'Monday';
      const currentStart = String(current.start_time || '');
      const currentEnd = String(current.end_time || '');
      const currentPeriod = String(current.period_label || '');
      const currentRoom = String(current.room_name || current.room || '');
      const currentStatus = String(current.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';

      modal.innerHTML = ''
        + '<div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc">'
        + '<strong style="font-size:1rem;color:#0f172a">Edit Schedule</strong>'
        + '</div>'
        + '<div style="padding:16px;display:grid;gap:12px">'
        + '<label style="display:grid;gap:6px;font-size:.86rem;color:#334155">'
        + '<span>Day</span>'
        + '<select id="ttEditDay" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px">'
        + ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(function (d) {
          const selected = d === currentDay ? ' selected' : '';
          return '<option value="' + esc(d) + '"' + selected + '>' + esc(d) + '</option>';
        }).join('')
        + '</select>'
        + '</label>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        + '<label style="display:grid;gap:6px;font-size:.86rem;color:#334155">'
        + '<span>Start Time</span>'
        + '<input id="ttEditStart" type="time" step="1" value="' + esc(currentStart) + '" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px">'
        + '</label>'
        + '<label style="display:grid;gap:6px;font-size:.86rem;color:#334155">'
        + '<span>End Time</span>'
        + '<input id="ttEditEnd" type="time" step="1" value="' + esc(currentEnd) + '" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px">'
        + '</label>'
        + '</div>'
        + '<label style="display:grid;gap:6px;font-size:.86rem;color:#334155">'
        + '<span>Period Label (optional)</span>'
        + '<input id="ttEditPeriod" type="text" value="' + esc(currentPeriod) + '" placeholder="e.g. Period 2" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px">'
        + '</label>'
        + '<label style="display:grid;gap:6px;font-size:.86rem;color:#334155">'
        + '<span>Room (optional)</span>'
        + '<input id="ttEditRoom" type="text" value="' + esc(currentRoom) + '" placeholder="e.g. Room A101" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px">'
        + '</label>'
        + '<label style="display:grid;gap:6px;font-size:.86rem;color:#334155">'
        + '<span>Status</span>'
        + '<select id="ttEditStatus" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px">'
        + '<option value="active"' + (currentStatus === 'active' ? ' selected' : '') + '>Active</option>'
        + '<option value="inactive"' + (currentStatus === 'inactive' ? ' selected' : '') + '>Inactive</option>'
        + '</select>'
        + '</label>'
        + '<div id="ttEditErr" style="display:none;color:#b91c1c;font-size:.82rem"></div>'
        + '</div>'
        + '<div style="padding:12px 16px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:8px">'
        + '<button type="button" id="ttEditCancel" class="btn btn-sm btn-outline">Cancel</button>'
        + '<button type="button" id="ttEditSave" class="btn btn-sm btn-primary">Save Changes</button>'
        + '</div>';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const dayEl = modal.querySelector('#ttEditDay');
      const startEl = modal.querySelector('#ttEditStart');
      const endEl = modal.querySelector('#ttEditEnd');
      const periodEl = modal.querySelector('#ttEditPeriod');
      const roomEl = modal.querySelector('#ttEditRoom');
      const statusEl = modal.querySelector('#ttEditStatus');
      const errorEl = modal.querySelector('#ttEditErr');
      const cancelEl = modal.querySelector('#ttEditCancel');
      const saveEl = modal.querySelector('#ttEditSave');

      function cleanup(result) {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener('keydown', onKeydown);
        resolve(result);
      }

      function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
      }

      function onKeydown(e) {
        if (e.key === 'Escape') cleanup(null);
      }

      function onSave() {
        const day = titleCaseDay(dayEl && dayEl.value);
        const start = String(startEl && startEl.value || '').trim();
        const end = String(endEl && endEl.value || '').trim();
        const periodLabel = String(periodEl && periodEl.value || '').trim();
        const room = String(roomEl && roomEl.value || '').trim();
        const status = String(statusEl && statusEl.value || '').trim().toLowerCase();

        if (!day) {
          showError('Day is required.');
          return;
        }
        if (!start || !end) {
          showError('Start and end times are required.');
          return;
        }
        if (start >= end) {
          showError('End time must be after start time.');
          return;
        }
        if (status !== 'active' && status !== 'inactive') {
          showError('Status must be active or inactive.');
          return;
        }

        cleanup({
          day: day,
          start: start,
          end: end,
          periodLabel: periodLabel,
          room: room,
          status: status,
        });
      }

      if (cancelEl) cancelEl.addEventListener('click', function () { cleanup(null); });
      if (saveEl) saveEl.addEventListener('click', onSave);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) cleanup(null);
      });
      document.addEventListener('keydown', onKeydown);

      if (startEl) startEl.focus();
    });
  }

  function bindDeleteButtons() {
    const buttons = document.querySelectorAll('.tt-del');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const courseId = btn.getAttribute('data-course-id');
        const scheduleId = btn.getAttribute('data-schedule-id');
        if (!courseId || !scheduleId) return;
        const approved = await openDeleteConfirmModal();
        if (!approved) return;
        try {
          await ClassScheduleAPI.deleteForCourse(courseId, scheduleId);
          S.schedules = S.schedules.filter(function (r) {
            return String(r.schedule_id || r.id) !== String(scheduleId);
          });
          applyFilters();
          renderAll();
          toast('Schedule deleted', 'success');
        } catch (e) {
          toast((e && e.message) || 'Failed to delete schedule', 'error');
        }
      });
    });
  }

  function openDeleteConfirmModal() {
    return new Promise(function (resolve) {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'rgba(15, 23, 42, 0.55)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '16px';
      overlay.style.zIndex = '3000';

      const modal = document.createElement('div');
      modal.style.width = '100%';
      modal.style.maxWidth = '460px';
      modal.style.background = '#ffffff';
      modal.style.borderRadius = '14px';
      modal.style.boxShadow = '0 20px 45px rgba(2, 6, 23, 0.25)';
      modal.style.overflow = 'hidden';

      modal.innerHTML = ''
        + '<div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#fef2f2">'
        + '<strong style="font-size:1rem;color:#7f1d1d">Delete Schedule</strong>'
        + '</div>'
        + '<div style="padding:16px;color:#334155;font-size:.92rem">'
        + 'Are you sure you want to delete this timetable entry? This action cannot be undone.'
        + '</div>'
        + '<div style="padding:12px 16px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:8px">'
        + '<button type="button" id="ttDelCancel" class="btn btn-sm btn-outline">Cancel</button>'
        + '<button type="button" id="ttDelConfirm" class="btn btn-sm btn-danger">Delete</button>'
        + '</div>';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const cancelEl = modal.querySelector('#ttDelCancel');
      const confirmEl = modal.querySelector('#ttDelConfirm');

      function cleanup(result) {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener('keydown', onKeydown);
        resolve(result);
      }

      function onKeydown(e) {
        if (e.key === 'Escape') cleanup(false);
      }

      if (cancelEl) cancelEl.addEventListener('click', function () { cleanup(false); });
      if (confirmEl) confirmEl.addEventListener('click', function () { cleanup(true); });

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) cleanup(false);
      });
      document.addEventListener('keydown', onKeydown);

      if (confirmEl) confirmEl.focus();
    });
  }

  function renderConflicts() {
    const tbody = document.getElementById('ttConflictBody');
    if (!tbody) return;
    const conflicts = detectConflicts(S.filtered);
    if (!conflicts.length) {
      tbody.innerHTML = '<tr><td class="tt-empty" colspan="4"><i class="fas fa-check-circle"></i>No conflicts detected.</td></tr>';
      return;
    }

    tbody.innerHTML = conflicts.map(function (c) {
      return '<tr>'
        + '<td>' + esc(c.teacher_name && typeof c.teacher_name.toUpperCase === 'function' ? c.teacher_name.toUpperCase() : '-') + '</td>'
        + '<td>' + esc(c.day && typeof c.day.toUpperCase === 'function' ? c.day.toUpperCase() : '-') + '</td>'
        + '<td><span class="tt-chip conflict">Overlapping</span> ' + esc(c.time) + '</td>'
        + '<td>' + esc(c.classes.join(' | ')) + '</td>'
        + '</tr>';
    }).join('');
  }

  function detectConflicts(rows) {
    const byTeacherDay = new Map();
    rows.forEach(function (r) {
      const teacherId = String(r.teacher_id || '');
      const day = String(r.day_of_week || '');
      if (!teacherId || !day) return;
      const key = teacherId + '|' + day;
      if (!byTeacherDay.has(key)) byTeacherDay.set(key, []);
      byTeacherDay.get(key).push(r);
    });

    const conflicts = [];
    byTeacherDay.forEach(function (list) {
      list.sort(function (a, b) {
        return String(a.start_time || '').localeCompare(String(b.start_time || ''));
      });
      for (let i = 0; i < list.length - 1; i++) {
        const current = list[i];
        const next = list[i + 1];
        if (overlap(current.start_time, current.end_time, next.start_time, next.end_time)) {
          conflicts.push({
            teacher_name: current.teacher_name || next.teacher_name || '-',
            day: current.day_of_week || next.day_of_week || '-',
            time: formatTimeRange(current.start_time, current.end_time) + ' vs ' + formatTimeRange(next.start_time, next.end_time),
            classes: [
              current.class_name || getClassName(current.class_id),
              next.class_name || getClassName(next.class_id),
            ],
          });
        }
      }
    });
    return conflicts;
  }

  function overlap(aStart, aEnd, bStart, bEnd) {
    const aS = String(aStart || '');
    const aE = String(aEnd || '');
    const bS = String(bStart || '');
    const bE = String(bEnd || '');
    if (!aS || !aE || !bS || !bE) return false;
    return aS < bE && bS < aE;
  }

  function sortByDayThenTime(a, b) {
    const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const da = dayOrder.indexOf(String(a.day_of_week || ''));
    const db = dayOrder.indexOf(String(b.day_of_week || ''));
    if (da !== db) return da - db;
    return String(a.start_time || '').localeCompare(String(b.start_time || ''));
  }

  function formatTimeRange(start, end) {
    if (!start && !end) return '-';
    return String(start || '-') + ' - ' + String(end || '-');
  }

  function getClassName(classId) {
    const c = S.classesById.get(String(classId));
    return c ? (c.class_name || c.name || ('Class ' + classId)) : ('Class ' + classId);
  }

  function getTeacherName(teacherId) {
    const t = S.teachersById.get(String(teacherId));
    return t ? (t.teacher_name || ('Teacher ' + teacherId)) : ('Teacher ' + teacherId);
  }

  function renderCourseSelect() {
    const sel = document.getElementById('ttCourseSelect');
    if (!sel) return;
    if (!S.classSubjects.length) {
      sel.innerHTML = '<option value="">No class-subject records found</option>';
      return;
    }
    sel.innerHTML = '<option value="">Select class + subject</option>'
      + S.classSubjects.map(function (cs) {
        const text = (cs.class_name || getClassName(cs.class_id))
          + ' - '
          + (cs.subject_name || cs.course_name || 'Subject')
          + ' ('
          + (cs.teacher_name || 'No teacher')
          + ')';
        return '<option value="' + esc(String(cs.course_id)) + '">' + esc(text) + '</option>';
      }).join('');
  }

  function renderClassTeacherFilters() {
    const classSel = document.getElementById('ttClassFilter');
    const teacherSel = document.getElementById('ttTeacherFilter');
    if (classSel) {
      const seenClasses = new Map();
      S.classSubjects.forEach(function (cs) {
        if (cs.class_id != null) seenClasses.set(String(cs.class_id), cs.class_name || getClassName(cs.class_id));
      });
      classSel.innerHTML = '<option value="">All Classes</option>'
        + Array.from(seenClasses.entries()).map(function (entry) {
          return '<option value="' + esc(entry[0]) + '">' + esc(entry[1]) + '</option>';
        }).join('');
    }

    if (teacherSel) {
      teacherSel.innerHTML = '<option value="">All Teachers</option>'
        + Array.from(S.teachersById.values()).map(function (t) {
          return '<option value="' + esc(String(t.teacher_id)) + '">' + esc(t.teacher_name || ('Teacher ' + t.teacher_id)) + '</option>';
        }).join('');
    }
  }

  function renderYearSemesterFilters(years, semesters) {
    const ySel = document.getElementById('ttAcademicYear');
    const sSel = document.getElementById('ttSemester');
    if (ySel) {
      ySel.innerHTML = (years.length ? years : [{ academic_year_id: '', year_name: 'All Academic Years' }]).map(function (y) {
        const id = y.academic_year_id != null ? y.academic_year_id : '';
        const name = y.year_name || y.name || 'Academic Year';
        return '<option value="' + esc(String(id)) + '">' + esc(name) + '</option>';
      }).join('');
      S.activeYearId = ySel.value || null;
    }

    if (sSel) {
      sSel.innerHTML = (semesters.length ? semesters : [{ semester_id: '', name: 'All Semesters' }]).map(function (s) {
        const id = s.semester_id != null ? s.semester_id : '';
        const name = s.semester_name || s.name || 'Semester';
        return '<option value="' + esc(String(id)) + '">' + esc(name) + '</option>';
      }).join('');
      S.activeSemesterId = sSel.value || null;
    }
  }

  function syncViewTabs() {
    const classBtn = document.getElementById('ttViewClassBtn');
    const teacherBtn = document.getElementById('ttViewTeacherBtn');
    if (classBtn) classBtn.classList.toggle('active', S.view === 'class');
    if (teacherBtn) teacherBtn.classList.toggle('active', S.view === 'teacher');
  }

  function addPeriod() {
    void addPeriodAsync();
  }

  async function addPeriodAsync() {
    const label = value('ttPeriodLabel').trim();
    const start = value('ttPeriodStart');
    const end = value('ttPeriodEnd');

    if (!label || !start || !end) {
      toast('Provide period label, start, and end time.', 'warning');
      return;
    }
    if (start >= end) {
      toast('Period end time must be after start time.', 'warning');
      return;
    }

    S.periods.push({
      id: Date.now(),
      label: label,
      start: start,
      end: end,
    });

    await persistPeriodSlots();
    renderPeriodList();

    const tag = document.getElementById('ttPeriodTag');
    if (tag && !tag.value) tag.value = label;
    const st = document.getElementById('ttStartTime');
    const en = document.getElementById('ttEndTime');
    if (st && !st.value) st.value = start;
    if (en && !en.value) en.value = end;
  }

  function renderPeriodList() {
    const wrap = document.getElementById('ttPeriodList');
    if (!wrap) return;
    if (!S.periods.length) {
      wrap.innerHTML = '<div class="tt-empty" style="grid-column:1/-1"><i class="fas fa-clock"></i>No period slots yet.</div>';
      return;
    }

    wrap.innerHTML = S.periods.map(function (p) {
      return '<div class="tt-period" data-period-id="' + esc(String(p.id)) + '" style="cursor:pointer;transition:all .2s ease;position:relative" onmouseover="this.style.boxShadow=\'0 4px 12px rgba(59, 130, 246, 0.2)\';" onmouseout="this.style.boxShadow=\'\';">'
        + '<div><strong>' + esc(p.label) + '</strong><br><span style="font-size:.74rem;color:#64748b">' + esc(p.start + ' - ' + p.end) + '</span></div>'
        + '<button class="btn btn-sm btn-outline tt-period-del" data-id="' + esc(String(p.id)) + '" style="position:absolute;top:8px;right:8px"><i class="fas fa-xmark"></i></button>'
        + '</div>';
    }).join('');

    const periods = wrap.querySelectorAll('.tt-period');
    periods.forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.tt-period-del')) return;

        const periodId = card.getAttribute('data-period-id');
        const period = S.periods.find(function (p) { return String(p.id) === String(periodId); });
        if (!period) return;

        const periodTagEl = document.getElementById('ttPeriodTag');
        const startTimeEl = document.getElementById('ttStartTime');
        const endTimeEl = document.getElementById('ttEndTime');

        if (periodTagEl) periodTagEl.value = period.label;
        if (startTimeEl) startTimeEl.value = period.start;
        if (endTimeEl) endTimeEl.value = period.end;

        toast('Period "' + period.label + '" selected', 'info');
      });
    });

    const buttons = wrap.querySelectorAll('.tt-period-del');
    buttons.forEach(function (b) {
      b.addEventListener('click', async function (e) {
        e.stopPropagation();
        const id = b.getAttribute('data-id');
        S.periods = S.periods.filter(function (p) { return String(p.id) !== String(id); });
        await persistPeriodSlots();
        renderPeriodList();
      });
    });
  }

  async function loadPeriodSlots() {
    const institutionKey = getUserInstitutionKey();
    const fallback = readJsonLS(LS_PERIODS, []);

    if (!institutionKey) {
      S.periods = fallback;
      return;
    }

    try {
      const res = await InstitutionTimetableAPI.getPeriodSlots(institutionKey);
      const payload = (res && res.data) ? res.data : res;
      const periodSlots = Array.isArray(payload && payload.period_slots)
        ? payload.period_slots
        : (Array.isArray(payload && payload.data && payload.data.period_slots) ? payload.data.period_slots : []);
      S.periods = periodSlots;
      writeJsonLS(LS_PERIODS, periodSlots);
    } catch (_) {
      S.periods = fallback;
    }
  }

  async function persistPeriodSlots() {
    const institutionKey = getUserInstitutionKey();

    writeJsonLS(LS_PERIODS, S.periods);

    if (!institutionKey) {
      return;
    }

    try {
      await InstitutionTimetableAPI.updatePeriodSlots(institutionKey, {
        period_slots: S.periods
      });
    } catch (e) {
      toast((e && e.message) || 'Failed to save period slots to server. Saved locally only.', 'warning');
    }
  }

  async function createSchedule() {
    const courseId = value('ttCourseSelect');
    const day = value('ttDaySelect');
    const start = value('ttStartTime');
    const end = value('ttEndTime');
    const room = value('ttRoom').trim();
    const periodTag = value('ttPeriodTag').trim();

    if (!courseId || !day || !start || !end) {
      toast('Please select class-subject, day, and time.', 'warning');
      return;
    }
    if (start >= end) {
      toast('End time must be after start time.', 'warning');
      return;
    }

    // Mirror DB unique key (course_id, day_of_week, start_time, end_time)
    const dayNorm = titleCaseDay(day);
    const alreadyExists = S.schedules.some(function (r) {
      return String(r.course_id) === String(courseId)
        && titleCaseDay(r.day_of_week) === dayNorm
        && String(r.start_time || '') === start
        && String(r.end_time || '') === end;
    });
    if (alreadyExists) {
      toast('This exact schedule slot already exists for the selected class-subject.', 'warning');
      return;
    }

    try {
      const payload = {
        day_of_week: day,
        start_time: start,
        end_time: end,
      };
      if (room) {
        payload.room = room;
        payload.room_name = room;
      }
      if (periodTag) payload.period_label = periodTag;

      const res = await ClassScheduleAPI.createForCourse(courseId, payload);
      const scheduleId = res && res.data ? (res.data.schedule_id || null) : null;

      const cs = S.coursesById.get(String(courseId)) || {};
      S.schedules.push({
        schedule_id: scheduleId || Date.now(),
        course_id: Number(courseId),
        day_of_week: day,
        start_time: start,
        end_time: end,
        period_label: periodTag,
        room_name: room,
        class_id: cs.class_id,
        class_name: cs.class_name || getClassName(cs.class_id),
        teacher_id: cs.teacher_id,
        teacher_name: cs.teacher_name || getTeacherName(cs.teacher_id),
        subject_name: cs.subject_name || cs.course_name || 'Subject',
      });

      applyFilters();
      renderAll();
      toast('Schedule created successfully', 'success');
    } catch (e) {
      const rawMsg = (e && e.message) ? String(e.message) : '';
      if (/duplicate entry|integrity constraint|1062/i.test(rawMsg)) {
        toast('Duplicate schedule: this course already has the same day and time slot.', 'warning');
        return;
      }
      const msg = rawMsg || 'Failed to create schedule';
      toast(msg, 'error');
    }
  }

  function openImportModal() {
    ensureImportUi();
    S.importRows = [];

    const fi = document.getElementById('ttImportFileInput');
    if (fi) fi.value = '';

    hideEl('ttImportPreview');
    hideEl('ttImportErrors');

    const btn = document.getElementById('ttImportConfirmBtn');
    if (btn) btn.disabled = true;
    setElText('ttImportConfirmText', 'Import');
    hideEl('ttImportConfirmSpinner');

    openOverlay('ttImportModalOverlay');
  }

  function closeImportModal() {
    closeOverlay('ttImportModalOverlay');
  }

  function closeImportResults() {
    closeOverlay('ttImportResultsOverlay');
  }

  function ensureImportUi() {
    if (document.getElementById('ttImportModalOverlay')) return;

    const modal = document.createElement('div');
    modal.id = 'ttImportModalOverlay';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(15, 23, 42, 0.55)';
    modal.style.zIndex = '3200';
    modal.innerHTML = ''
      + '<div style="width:min(760px,94vw);max-height:88vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 20px 45px rgba(2,6,23,.25)">'
      + '<div style="padding:12px 14px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">'
      + '<strong style="font-size:1rem;color:#0f172a"><i class="fas fa-file-import" style="margin-right:6px;color:#2563eb"></i>Import Timetable CSV</strong>'
      + '<button id="ttImportModalClose" class="btn btn-sm btn-outline" type="button">Close</button>'
      + '</div>'
      + '<div style="padding:14px;display:grid;gap:10px">'
      + '<div id="ttImportDropZone" style="border:2px dashed #cbd5e1;border-radius:10px;padding:16px;text-align:center;background:#f8fafc;cursor:pointer">'
      + '<div style="font-weight:600;color:#334155">Drop CSV here or click to select</div>'
      + '<div style="font-size:.82rem;color:#64748b;margin-top:4px">Expected columns: course_id, day_of_week, start_time, end_time, room, period_label</div>'
      + '<div style="font-size:.8rem;color:#64748b;margin-top:2px">Alternative mapping: class_name + subject_name (if course_id not provided)</div>'
      + '</div>'
      + '<input id="ttImportFileInput" type="file" accept=".csv" style="display:none">'
      + '<div style="font-size:.82rem;color:#475569">Need a sample? <a href="#" id="ttImportTemplateLink">Download template</a></div>'
      + '<div id="ttImportPreview" style="display:none;border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#fff">'
      + '<div><strong id="ttImportFileName"></strong></div>'
      + '<div id="ttImportRowCount" style="font-size:.82rem;color:#64748b"></div>'
      + '</div>'
      + '<div id="ttImportErrors" style="display:none;border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;border-radius:10px;padding:10px;font-size:.82rem"></div>'
      + '<div style="display:flex;justify-content:flex-end;gap:8px">'
      + '<button id="ttImportCancelBtn" type="button" class="btn btn-sm btn-outline">Cancel</button>'
      + '<button id="ttImportConfirmBtn" type="button" class="btn btn-sm btn-primary" disabled>'
      + '<span id="ttImportConfirmSpinner" style="display:none"><i class="fas fa-spinner fa-spin"></i> </span>'
      + '<span id="ttImportConfirmText">Import</span>'
      + '</button>'
      + '</div>'
      + '</div>'
      + '</div>';

    const results = document.createElement('div');
    results.id = 'ttImportResultsOverlay';
    results.style.position = 'fixed';
    results.style.inset = '0';
    results.style.display = 'none';
    results.style.alignItems = 'center';
    results.style.justifyContent = 'center';
    results.style.background = 'rgba(15, 23, 42, 0.55)';
    results.style.zIndex = '3200';
    results.innerHTML = ''
      + '<div style="width:min(860px,95vw);max-height:88vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 20px 45px rgba(2,6,23,.25)">'
      + '<div style="padding:12px 14px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">'
      + '<strong style="font-size:1rem;color:#0f172a"><i class="fas fa-list-check" style="margin-right:6px;color:#2563eb"></i>Import Results</strong>'
      + '<button id="ttImportResultsClose" class="btn btn-sm btn-outline" type="button">Close</button>'
      + '</div>'
      + '<div style="padding:12px 14px;display:grid;gap:10px">'
      + '<div id="ttImportResultsSummary" style="display:flex;gap:8px;flex-wrap:wrap"></div>'
      + '<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:auto">'
      + '<table style="width:100%;border-collapse:collapse;font-size:.83rem">'
      + '<thead><tr style="background:#f8fafc"><th style="text-align:left;padding:8px">#</th><th style="text-align:left;padding:8px">Row</th><th style="text-align:left;padding:8px">Status</th><th style="text-align:left;padding:8px">Message</th></tr></thead>'
      + '<tbody id="ttImportResultsBody"></tbody>'
      + '</table>'
      + '</div>'
      + '<div style="display:flex;justify-content:flex-end"><button id="ttImportResultsDoneBtn" type="button" class="btn btn-sm btn-primary">Done</button></div>'
      + '</div>'
      + '</div>';

    document.body.appendChild(modal);
    document.body.appendChild(results);

    on('ttImportDropZone', 'click', function () {
      const input = document.getElementById('ttImportFileInput');
      if (input) input.click();
    });
    on('ttImportFileInput', 'change', function (e) {
      handleImportFile(e.target && e.target.files ? e.target.files[0] : null);
    });
    on('ttImportTemplateLink', 'click', function (e) {
      e.preventDefault();
      downloadTimetableCsvTemplate();
    });
    on('ttImportConfirmBtn', 'click', confirmImport);
    on('ttImportCancelBtn', 'click', closeImportModal);
    on('ttImportModalClose', 'click', closeImportModal);
    on('ttImportResultsClose', 'click', closeImportResults);
    on('ttImportResultsDoneBtn', 'click', closeImportResults);

    const dz = document.getElementById('ttImportDropZone');
    if (dz) {
      dz.addEventListener('dragover', function (e) {
        e.preventDefault();
        dz.style.borderColor = '#2563eb';
      });
      dz.addEventListener('dragleave', function () {
        dz.style.borderColor = '#cbd5e1';
      });
      dz.addEventListener('drop', function (e) {
        e.preventDefault();
        dz.style.borderColor = '#cbd5e1';
        handleImportFile(e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files[0] : null);
      });
    }

    const modalOverlay = document.getElementById('ttImportModalOverlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) closeImportModal();
      });
    }

    const resultOverlay = document.getElementById('ttImportResultsOverlay');
    if (resultOverlay) {
      resultOverlay.addEventListener('click', function (e) {
        if (e.target === resultOverlay) closeImportResults();
      });
    }
  }

  function handleImportFile(file) {
    if (!file) return;
    if (!String(file.name || '').toLowerCase().endsWith('.csv')) {
      toast('Please choose a CSV file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const parsed = parseCsv((e && e.target && e.target.result) ? e.target.result : '');
      S.importRows = parsed.rows;

      setElText('ttImportFileName', file.name);
      setElText('ttImportRowCount', parsed.rows.length + ' row' + (parsed.rows.length === 1 ? '' : 's') + ' found');
      showEl('ttImportPreview');

      const errEl = document.getElementById('ttImportErrors');
      if (errEl && parsed.errors.length) {
        errEl.innerHTML = parsed.errors.map(esc).join('<br>');
        showEl('ttImportErrors');
      } else {
        hideEl('ttImportErrors');
      }

      const btn = document.getElementById('ttImportConfirmBtn');
      if (btn) btn.disabled = parsed.rows.length === 0;
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!S.importRows.length) return;

    const btn = document.getElementById('ttImportConfirmBtn');
    if (btn) btn.disabled = true;
    showEl('ttImportConfirmSpinner');
    setElText('ttImportConfirmText', 'Importing...');

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const results = [];
    let successCount = 0;

    for (let i = 0; i < S.importRows.length; i++) {
      const row = Object.assign({}, S.importRows[i]);
      const rowName = row.class_name && row.subject_name
        ? (row.class_name + ' - ' + row.subject_name)
        : ('Row ' + (i + 2));

      let courseId = row.course_id != null ? String(row.course_id).trim() : '';
      if (!courseId && row.class_name && row.subject_name) {
        const classNeedle = String(row.class_name).trim().toLowerCase();
        const subjectNeedle = String(row.subject_name).trim().toLowerCase();
        const match = S.classSubjects.find(function (cs) {
          const csClass = String(cs.class_name || '').trim().toLowerCase();
          const csSubject = String(cs.subject_name || cs.course_name || '').trim().toLowerCase();
          return csClass === classNeedle && csSubject === subjectNeedle;
        });
        if (match && match.course_id != null) courseId = String(match.course_id);
      }

      if (!courseId) {
        results.push({ name: rowName, status: 'failed', reason: 'Missing or unresolved course_id (or class_name + subject_name).' });
        continue;
      }

      const day = titleCaseDay(row.day_of_week || row.day || '');
      const start = String(row.start_time || row.start || '').trim();
      const end = String(row.end_time || row.end || '').trim();
      const room = String(row.room || row.room_name || '').trim();
      const periodLabel = String(row.period_label || row.period || '').trim();

      if (!day || validDays.indexOf(day) === -1) {
        results.push({ name: rowName, status: 'failed', reason: 'Invalid day_of_week.' });
        continue;
      }
      if (!start || !end) {
        results.push({ name: rowName, status: 'failed', reason: 'Missing start_time or end_time.' });
        continue;
      }
      if (start >= end) {
        results.push({ name: rowName, status: 'failed', reason: 'end_time must be after start_time.' });
        continue;
      }

      const payload = {
        day_of_week: day,
        start_time: start,
        end_time: end,
      };
      if (room) {
        payload.room = room;
        payload.room_name = room;
      }
      if (periodLabel) payload.period_label = periodLabel;

      try {
        const res = await ClassScheduleAPI.createForCourse(encodeURIComponent(courseId), payload);
        if (res && res.success !== false) {
          successCount++;
          results.push({ name: rowName, status: 'success', reason: '' });
        } else {
          results.push({ name: rowName, status: 'failed', reason: (res && res.message) ? String(res.message) : 'Unknown error' });
        }
      } catch (err) {
        const rawMsg = (err && err.message) ? String(err.message) : '';
        const duplicate = (err && err.status === 409)
          || /duplicate|duplicate entry|integrity constraint|1062|already exists/i.test(rawMsg);
        results.push({
          name: rowName,
          status: duplicate ? 'skipped' : 'failed',
          reason: rawMsg || 'Request failed'
        });
      }
    }

    hideEl('ttImportConfirmSpinner');
    setElText('ttImportConfirmText', 'Import');
    if (btn) btn.disabled = false;

    closeImportModal();
    if (successCount > 0) {
      await loadSchedules();
      applyFilters();
      renderAll();
    }
    showImportResults(results);
  }

  function showImportResults(results) {
    const success = results.filter(function (r) { return r.status === 'success'; }).length;
    const failed = results.filter(function (r) { return r.status === 'failed'; }).length;
    const skipped = results.filter(function (r) { return r.status === 'skipped'; }).length;

    const summaryEl = document.getElementById('ttImportResultsSummary');
    if (summaryEl) {
      summaryEl.innerHTML = ''
        + '<span style="display:inline-flex;align-items:center;gap:.35rem;background:#dcfce7;color:#166534;border-radius:999px;padding:.25rem .7rem;font-size:.78rem;font-weight:600"><i class="fas fa-check-circle"></i> ' + success + ' Successful</span>'
        + (skipped ? '<span style="display:inline-flex;align-items:center;gap:.35rem;background:#fef9c3;color:#854d0e;border-radius:999px;padding:.25rem .7rem;font-size:.78rem;font-weight:600"><i class="fas fa-minus-circle"></i> ' + skipped + ' Skipped</span>' : '')
        + (failed ? '<span style="display:inline-flex;align-items:center;gap:.35rem;background:#fee2e2;color:#991b1b;border-radius:999px;padding:.25rem .7rem;font-size:.78rem;font-weight:600"><i class="fas fa-times-circle"></i> ' + failed + ' Failed</span>' : '')
        + '<span style="display:inline-flex;align-items:center;gap:.35rem;background:#f8fafc;color:#64748b;border-radius:999px;padding:.25rem .7rem;font-size:.78rem"><i class="fas fa-list"></i> ' + results.length + ' Total</span>';
    }

    const body = document.getElementById('ttImportResultsBody');
    if (body) {
      body.innerHTML = results.map(function (r, i) {
        const ok = r.status === 'success';
        const skippedRow = r.status === 'skipped';
        const color = ok ? '#15803d' : (skippedRow ? '#854d0e' : '#b91c1c');
        const bg = ok ? '#f8fff9' : (skippedRow ? '#fffbeb' : '#fff7f7');
        const label = ok ? 'Created' : (skippedRow ? 'Skipped' : 'Failed');
        return '<tr style="background:' + bg + ';border-bottom:1px solid #e2e8f0">'
          + '<td style="padding:8px;color:#64748b">' + (i + 2) + '</td>'
          + '<td style="padding:8px;font-weight:600">' + esc(r.name || '') + '</td>'
          + '<td style="padding:8px;color:' + color + ';font-weight:600">' + esc(label) + '</td>'
          + '<td style="padding:8px;color:' + (ok ? '#64748b' : color) + '">' + esc(r.reason || '-') + '</td>'
          + '</tr>';
      }).join('');
    }

    openOverlay('ttImportResultsOverlay');
  }

  function downloadTimetableCsvTemplate() {
    const headers = 'course_id,class_name,subject_name,day_of_week,start_time,end_time,room,period_label';
    const first = S.classSubjects && S.classSubjects.length ? S.classSubjects[0] : null;
    const sampleCourseId = first && first.course_id != null ? String(first.course_id) : '';
    const sampleClassName = first ? String(first.class_name || 'SHS 1 Science A') : 'SHS 1 Science A';
    const sampleSubjectName = first ? String(first.subject_name || first.course_name || 'Mathematics') : 'Mathematics';
    const sample = [sampleCourseId, sampleClassName, sampleSubjectName, 'Monday', '08:00', '08:45', 'Room A1', 'Period 1'].join(',');
    const help = '# Use course_id directly, or leave it blank and provide class_name + subject_name for matching.';
    const content = [help, headers, sample].join('\n');
    downloadCsv(content, 'timetable_import_template.csv');
  }

  function parseCsv(text) {
    const lines = String(text || '').trim().split(/\r?\n/);
    const errors = [];
    if (lines.length < 2) {
      return { rows: [], errors: ['CSV file appears empty.'] };
    }

    const headerLine = lines.find(function (l) { return !String(l).trimStart().startsWith('#'); });
    if (!headerLine) {
      return { rows: [], errors: ['CSV header row not found.'] };
    }

    const headers = headerLine.split(',').map(function (h) {
      return String(h || '').trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_');
    });
    const startIdx = lines.indexOf(headerLine) + 1;
    const rows = [];

    for (let i = startIdx; i < lines.length; i++) {
      const raw = String(lines[i] || '');
      if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
      const cols = raw.split(',').map(function (c) {
        return String(c || '').trim().replace(/^"|"$/g, '');
      });
      const row = {};
      headers.forEach(function (h, idx) {
        row[h] = cols[idx] != null ? cols[idx] : '';
      });
      rows.push(row);
    }

    return { rows: rows, errors: errors };
  }

  function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showEl(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  }

  function hideEl(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function openOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  function closeOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  async function loadPublishState() {
    const institutionKey = getUserInstitutionKey();
    if (!institutionKey) {
      S.isPublished = false;
      return;
    }

    try {
      const res = await InstitutionTimetableAPI.getPublishState(institutionKey);
      const payload = (res && res.data) ? res.data : res;
      S.isPublished = Boolean(payload && payload.is_timetable_published);
    } catch (_) {
      S.isPublished = false;
    }
  }

  function isPublished() {
    return Boolean(S.isPublished);
  }

  async function setPublishState(value) {
    const institutionKey = getUserInstitutionKey();
    if (!institutionKey) {
      throw new Error('Institution context not found');
    }

    await InstitutionTimetableAPI.updatePublishState(institutionKey, {
      is_timetable_published: Boolean(value)
    });

    S.isPublished = Boolean(value);
  }

  function renderPublishState() {
    const published = isPublished();
    setText('ttPublishState', published ? 'Published' : 'Draft');

    const publishBtn = document.getElementById('ttPublishBtn');
    const unpublishBtn = document.getElementById('ttUnpublishBtn');

    if (publishBtn) {
      publishBtn.disabled = published;
      publishBtn.style.display = published ? 'none' : '';
      publishBtn.setAttribute('aria-hidden', published ? 'true' : 'false');
    }

    if (unpublishBtn) {
      unpublishBtn.disabled = !published;
      unpublishBtn.style.display = published ? '' : 'none';
      unpublishBtn.setAttribute('aria-hidden', published ? 'false' : 'true');
    }
  }

  function exportPdf(mode) {
    if (typeof jsPDF === 'undefined' && typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
      window.jsPDF = window.jspdf.jsPDF;
    }
    if (typeof jsPDF === 'undefined') {
      toast('PDF export requires jsPDF library.', 'error');
      return;
    }

    const rows = S.filtered.slice().sort(sortByDayThenTime);
    if (!rows.length) {
      toast('No timetable rows to export for current filters.', 'warning');
      return;
    }

    const exportMode = mode || 'combined';
    const doc = new jsPDF({ orientation: 'landscape' });

    const titleMap = {
      combined: 'Admin Timetable Report - Combined',
      by_class: 'Admin Timetable Report - By Classes',
      by_teacher: 'Admin Timetable Report - By Teachers'
    };

    const head = [['Class', 'Teacher', 'Subject', 'Day', 'Start', 'End', 'Period', 'Room']];

    function rowToPdfRow(r) {
      return [
        r.class_name || getClassName(r.class_id),
        r.teacher_name || '-',
        r.subject_name && typeof r.subject_name.toUpperCase === 'function' ? r.subject_name.toUpperCase() : '-',
        r.day_of_week && typeof r.day_of_week.toUpperCase === 'function' ? r.day_of_week.toUpperCase() : '-',
        r.start_time || '-',
        r.end_time || '-',
        r.period_label || '-',
        r.room_name || '-',
      ];
    }

    function drawHeader() {
      doc.setFontSize(15);
      doc.text(titleMap[exportMode] || 'Admin Timetable Report', 14, 14);
      doc.setFontSize(10);
      doc.text('Generated: ' + new Date().toLocaleString(), 14, 21);
    }

    function drawRowsTable(startY, sectionRows) {
      const body = sectionRows.map(rowToPdfRow);
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          head: head,
          body: body,
          startY: startY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 14, right: 14 },
        });
        return (doc.lastAutoTable && doc.lastAutoTable.finalY) ? (doc.lastAutoTable.finalY + 8) : (startY + 8);
      }

      let y = startY;
      doc.setFont('courier', 'normal');
      body.forEach(function (r) {
        doc.text(r.join(' | '), 14, y);
        y += 6;
      });
      return y;
    }

    drawHeader();

    if (exportMode === 'combined') {
      drawRowsTable(26, rows);
    } else {
      const groupByTeacher = exportMode === 'by_teacher';
      const groups = new Map();

      rows.forEach(function (r) {
        const groupKey = groupByTeacher
          ? String(r.teacher_id != null ? r.teacher_id : 'unassigned')
          : String(r.class_id != null ? r.class_id : 'unassigned');

        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey).push(r);
      });

      let firstSection = true;
      groups.forEach(function (sectionRows) {
        const first = sectionRows[0] || {};
        const sectionTitle = groupByTeacher
          ? ('Teacher: ' + (first.teacher_name || 'Unassigned'))
          : ('Class: ' + (first.class_name || getClassName(first.class_id)));

        if (!firstSection) {
          doc.addPage();
          drawHeader();
        }
        firstSection = false;

        doc.setFontSize(12);
        doc.text(sectionTitle, 14, 30);
        drawRowsTable(34, sectionRows.slice().sort(sortByDayThenTime));
      });
    }

    const modeToken = exportMode === 'by_class' ? 'by_class' : (exportMode === 'by_teacher' ? 'by_teacher' : 'combined');
    doc.save('admin_timetable_' + modeToken + '_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  function toArray(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    if (Array.isArray(res.class_subjects)) return res.class_subjects;
    if (res.data && Array.isArray(res.data.class_subjects)) return res.data.class_subjects;
    if (res.data && Array.isArray(res.data.items)) return res.data.items;
    if (Array.isArray(res.items)) return res.items;
    return [];
  }

  document.addEventListener('page:loaded', function (e) {
    if (e && e.detail && e.detail.page === 'timetable') init();
  });
})();
