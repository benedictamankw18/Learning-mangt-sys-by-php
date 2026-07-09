/* ============================================
   Teacher Attendance Page
   SPA fragment: teacher/page/attendance.html
   Initialised on page:loaded event
============================================ */
(function () {
  'use strict';

  /* -------- API helpers -------- */
  const API_TEACHER     = (uuid, params) => TeacherAPI.getCourses(uuid, params);

  /* -------- module state -------- */
  const S = {
    mode: 'mark',           // 'mark' | 'history'
    courses: [],            // all teacher courses
    classCourseMap: {},     // className → [{course_id, subject_name, class_uuid, ...}]
    classIdToUuid: {},      // class_id (int) → uuid string
    students: [],           // [{student_id, name, student_no}]
    statuses: {},           // student_id → {status, remarks}
    selectedCourseId: null,
    selectedClassUuid: null,
    historyRows: [],
    importRows: [],
    importFileName: '',
    loading: false,
  };

  /* -------- helpers -------- */
  function esc(v) {
    return typeof escHtml === 'function'
      ? escHtml(String(v ?? ''))
      : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function toast(msg, type = 'info') {
    if (typeof showToast === 'function') showToast(msg, type);
  }

  function getTeacherUuid() {
    const u = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    return u?.teacher_uuid || null;
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function el(id) { return document.getElementById(id); }

  function toArray(res) {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  }

  /* ============================================================
     ENTRY POINT
  ============================================================ */
  document.addEventListener('page:loaded', function (e) {
    if (e.detail && e.detail.page === 'attendance') {
      init();
    }
  });

  function init() {
    /* set date defaults */
    const markDate = el('taMarkDate');
    if (markDate && !markDate.value) markDate.value = todayIso();
    const histFrom = el('taHistFrom');
    const histTo   = el('taHistTo');
    if (histFrom && !histFrom.value) histFrom.value = todayIso();
    if (histTo   && !histTo.value)   histTo.value   = todayIso();

    bindEvents();
    loadTeacherCourses();
  }

  /* ============================================================
     EVENTS
  ============================================================ */
  function bindEvents() {
    /* mode tabs */
    document.querySelectorAll('.ta-mode-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.ta-mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        switchMode(btn.dataset.mode);
      });
    });

    /* mark panel */
    const classFilter = el('taClassFilter');
    if (classFilter) classFilter.addEventListener('change', onMarkClassChange);

    const loadBtn = el('taLoadStudentsBtn');
    if (loadBtn) loadBtn.addEventListener('click', onLoadStudents);

    const submitBtn = el('taSubmitBtn');
    if (submitBtn) submitBtn.addEventListener('click', onSubmit);

    const bulkPresent = el('taBulkPresent');
    if (bulkPresent) bulkPresent.addEventListener('click', () => bulkMark('present'));
    const bulkAbsent = el('taBulkAbsent');
    if (bulkAbsent) bulkAbsent.addEventListener('click', () => bulkMark('absent'));
    const bulkClear = el('taBulkClear');
    if (bulkClear) bulkClear.addEventListener('click', () => bulkMark(null));

    /* history panel */
    const histClass = el('taHistClassFilter');
    if (histClass) histClass.addEventListener('change', onHistClassChange);

    const histLoad = el('taHistLoadBtn');
    if (histLoad) histLoad.addEventListener('click', onHistSearch);

    /* export */
    const importBtn = el('taImportCsvBtn');
    if (importBtn) importBtn.addEventListener('click', onImportCsvClick);
    const importInput = el('taImportCsvInput');
    if (importInput) importInput.addEventListener('change', onImportCsvSelected);
    const importCancelBtn = el('taImportCancelBtn');
    if (importCancelBtn) importCancelBtn.addEventListener('click', closeImportModal);
    const importCloseBtn = el('taImportModalClose');
    if (importCloseBtn) importCloseBtn.addEventListener('click', closeImportModal);
    const importConfirmBtn = el('taImportConfirmBtn');
    if (importConfirmBtn) importConfirmBtn.addEventListener('click', confirmImportCsv);
    const templateBtn = el('taDownloadImportTemplateBtn');
    if (templateBtn) templateBtn.addEventListener('click', downloadImportTemplate);
    const importOverlay = el('taImportModalOverlay');
    if (importOverlay) {
      importOverlay.addEventListener('click', function (evt) {
        if (evt.target === importOverlay) closeImportModal();
      });
    }

    (function wireImportDropZone() {
      const zone = el('taImportDropZone');
      if (!zone) return;

      zone.addEventListener('click', function () {
        const input = el('taImportCsvInput');
        if (input) input.click();
      });

      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (evtName) {
        zone.addEventListener(evtName, function (evt) {
          evt.preventDefault();
          evt.stopPropagation();
        });
      });

      zone.addEventListener('dragover', function () { zone.classList.add('dragover'); });
      zone.addEventListener('dragleave', function () { zone.classList.remove('dragover'); });
      zone.addEventListener('drop', function (evt) {
        zone.classList.remove('dragover');
        const file = evt.dataTransfer && evt.dataTransfer.files ? evt.dataTransfer.files[0] : null;
        if (file) handleImportFile(file);
      });
    })();

    const csvBtn = el('taExportCsvBtn');
    if (csvBtn) csvBtn.addEventListener('click', exportCsv);
    const pdfBtn = el('taExportPdfBtn');
    if (pdfBtn) pdfBtn.addEventListener('click', exportPdf);
  }

  function onImportCsvClick() {
    if (S.mode !== 'mark') {
      toast('Switch to Mark Attendance mode before importing CSV.', 'warning');
      return;
    }
    if (!S.students.length) {
      toast('Load students first, then import CSV.', 'warning');
      return;
    }
    openImportModal();
  }

  async function onImportCsvSelected(e) {
    const input = e && e.target ? e.target : null;
    const file = input && input.files && input.files[0] ? input.files[0] : null;

    if (!file) return;
    await handleImportFile(file);
    if (input) input.value = '';
  }

  function openImportModal() {
    const overlay = el('taImportModalOverlay');
    if (overlay) overlay.classList.add('open');
    S.importRows = [];
    S.importFileName = '';
    const preview = el('taImportPreview');
    if (preview) {
      preview.style.display = 'none';
      preview.innerHTML = '';
    }
    const confirmBtn = el('taImportConfirmBtn');
    if (confirmBtn) confirmBtn.disabled = true;
  }

  function closeImportModal() {
    const overlay = el('taImportModalOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  async function handleImportFile(file) {

    if (!/\.csv$/i.test(file.name)) {
      toast('Please choose a .csv file.', 'warning');
      const confirmBtn = el('taImportConfirmBtn');
      if (confirmBtn) confirmBtn.disabled = true;
      return;
    }

    try {
      const text = await readFileAsText(file);
      const rows = parseCsv(text);
      if (!rows.length) {
        toast('CSV file is empty.', 'warning');
        const confirmBtn = el('taImportConfirmBtn');
        if (confirmBtn) confirmBtn.disabled = true;
        return;
      }

      S.importRows = rows;
      S.importFileName = file.name;

      const preview = el('taImportPreview');
      if (preview) {
        preview.style.display = 'block';
        const sample = rows.slice(0, 3).map(function (r) {
          const id = String(r.rawStudentId || '').trim() || String(r.rawName || '').trim() || '-';
          const st = String(r.rawStatus || '').trim() || '-';
          return `<li><strong>${esc(id)}</strong> → ${esc(st)}</li>`;
        }).join('');
        preview.innerHTML = `
          <div><strong>File:</strong> ${esc(file.name)}</div>
          <div><strong>Rows detected:</strong> ${rows.length}</div>
          <div style="margin-top:.45rem"><strong>Sample:</strong><ul style="margin:.25rem 0 0 1rem;padding:0">${sample}</ul></div>
        `;
      }

      const confirmBtn = el('taImportConfirmBtn');
      if (confirmBtn) confirmBtn.disabled = false;
    } catch (err) {
      toast('Failed to import CSV. Check file format.', 'error');
      console.error('CSV import failed:', err);
      const confirmBtn = el('taImportConfirmBtn');
      if (confirmBtn) confirmBtn.disabled = true;
    }
  }

  function confirmImportCsv() {
    if (!S.importRows.length) {
      toast('Select a CSV file first.', 'warning');
      return;
    }

    const report = applyImportedAttendance(S.importRows);
    renderStudentTable();
    updateStats();

    toast(
      'CSV imported. Updated: ' + report.updated
      + ', Unmatched: ' + report.unmatched
      + ', Invalid status: ' + report.invalidStatus,
      report.updated > 0 ? 'success' : 'warning'
    );

    closeImportModal();
  }

  function downloadImportTemplate() {
    const rows = [
      ['student_id', 'status', 'remarks'],
      ['SHS00123', 'present', 'On time'],
      ['SHS00124', 'late', 'Arrived 10 minutes late'],
      ['SHS00125', 'absent', 'Sick leave'],
    ];
    const csv = rows.map(function (r) {
      return r.map(function (v) { return '"' + String(v ?? '').replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(reader.error || new Error('File read failed')); };
      reader.readAsText(file);
    });
  }

  function parseCsv(text) {
    const lines = String(text || '')
      .split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(Boolean);

    if (!lines.length) return [];

    const parsed = lines.map(parseCsvLine).filter(function (r) { return r.length > 0; });
    if (!parsed.length) return [];

    const first = parsed[0].map(normHeader);
    const hasHeader = first.includes('status')
      || first.includes('studentid')
      || first.includes('studentidnumber')
      || first.includes('student')
      || first.includes('name');

    if (hasHeader) {
      const map = {};
      first.forEach(function (h, idx) { map[h] = idx; });
      return parsed.slice(1).map(function (row) {
        return {
          rawStudentId: pickByHeaders(row, map, ['studentidnumber', 'studentid', 'admissionnumber', 'indexnumber', 'id']),
          rawName: pickByHeaders(row, map, ['student', 'name', 'studentname', 'fullname']),
          rawStatus: pickByHeaders(row, map, ['status', 'attendancestatus']),
          rawRemarks: pickByHeaders(row, map, ['remarks', 'remark', 'note', 'comment']),
        };
      });
    }

    return parsed.map(function (row) {
      return {
        rawStudentId: row[0] || '',
        rawName: row[0] || '',
        rawStatus: row[1] || '',
        rawRemarks: row[2] || '',
      };
    });
  }

  function parseCsvLine(line) {
    const out = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cell.trim());
        cell = '';
      } else {
        cell += ch;
      }
    }

    out.push(cell.trim());
    return out;
  }

  function normHeader(v) {
    return String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function pickByHeaders(row, map, headerKeys) {
    for (let i = 0; i < headerKeys.length; i++) {
      const key = headerKeys[i];
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        return String(row[map[key]] || '').trim();
      }
    }
    return '';
  }

  function normalizeStatus(raw) {
    const v = String(raw || '').trim().toLowerCase();
    if (!v) return '';
    const map = {
      present: 'present',
      p: 'present',
      '1': 'present',
      absent: 'absent',
      a: 'absent',
      '0': 'absent',
      late: 'late',
      l: 'late',
      excused: 'excused',
      e: 'excused',
    };
    return map[v] || '';
  }

  function applyImportedAttendance(rows) {
    const report = { updated: 0, unmatched: 0, invalidStatus: 0 };

    const byStudentNo = new Map();
    const byStudentId = new Map();
    const byName = new Map();

    S.students.forEach(function (s) {
      const sid = String(s.student_id || '').trim();
      const sno = String(s.student_no || '').trim().toLowerCase();
      const name = String(s.name || '').trim().toLowerCase();
      if (sid) byStudentId.set(sid, s);
      if (sno) byStudentNo.set(sno, s);
      if (name) byName.set(name, s);
    });

    rows.forEach(function (r) {
      const status = normalizeStatus(r.rawStatus);
      if (!status) {
        report.invalidStatus += 1;
        return;
      }

      const rawId = String(r.rawStudentId || '').trim();
      const rawName = String(r.rawName || '').trim().toLowerCase();

      let student = null;
      if (rawId && byStudentNo.has(rawId.toLowerCase())) student = byStudentNo.get(rawId.toLowerCase());
      if (!student && rawId && byStudentId.has(rawId)) student = byStudentId.get(rawId);
      if (!student && rawName && byName.has(rawName)) student = byName.get(rawName);

      if (!student) {
        report.unmatched += 1;
        return;
      }

      const key = String(student.student_id);
      if (!S.statuses[key]) S.statuses[key] = { status: '', remarks: '' };
      S.statuses[key].status = status;
      if (String(r.rawRemarks || '').trim()) {
        S.statuses[key].remarks = String(r.rawRemarks).trim();
      }
      report.updated += 1;
    });

    return report;
  }

  function switchMode(mode) {
    S.mode = mode;
    if (mode === 'mark') {
      el('taMarkPanel').style.display = '';
      el('taHistoryPanel').style.display = 'none';
    } else {
      el('taMarkPanel').style.display = 'none';
      el('taHistoryPanel').style.display = '';
    }
  }

  /* ============================================================
     LOAD TEACHER COURSES → POPULATE DROPDOWNS
  ============================================================ */
  async function loadTeacherCourses() {
    const uuid = getTeacherUuid();
    if (!uuid) {
      toast('Teacher profile not found. Please re-login.', 'error');
      return;
    }

    try {
      const [coursesRes, classesRes] = await Promise.all([
        API_TEACHER(uuid, { limit: 500 }),
        API.get(API_ENDPOINTS.CLASSES, { page: 1, limit: 1000 }).catch(() => []),
      ]);
      S.courses = toArray(coursesRes);

      /* build class_id → uuid map so we can fetch students by class UUID */
      S.classIdToUuid = {};
      const classesPayload = classesRes && classesRes.data ? classesRes.data : classesRes;
      const classRows = Array.isArray(classesPayload && classesPayload.classes)
        ? classesPayload.classes
        : toArray(classesRes);

      classRows.forEach(function (cls) {
        if (cls.class_id && cls.uuid) {
          S.classIdToUuid[String(cls.class_id)] = cls.uuid;
        }
      });
    } catch (err) {
      toast('Failed to load your courses.', 'error');
      console.error('loadTeacherCourses:', err);
      return;
    }

    /* group courses by class name */
    S.classCourseMap = {};
    S.courses.forEach(function (c) {
      const className = c.class_name || ('Class ' + c.class_id);
      if (!S.classCourseMap[className]) S.classCourseMap[className] = [];
      /* enrich with class UUID for student lookup */
      c._classUuid = S.classIdToUuid[String(c.class_id)] || null;
      S.classCourseMap[className].push(c);
    });

    const classNames = Object.keys(S.classCourseMap).sort();

    /* populate both class dropdowns */
    ['taClassFilter', 'taHistClassFilter'].forEach(function (selectId) {
      const sel = el(selectId);
      if (!sel) return;
      const existing = sel.querySelector('option[value=""]');
      sel.innerHTML = '';
      if (existing) sel.appendChild(existing);
      else {
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = '— Select Class —';
        sel.appendChild(blank);
      }
      classNames.forEach(function (name) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = esc(name);
        sel.appendChild(opt);
      });
    });
  }

  /* ---- populate subject for mark panel ---- */
  function onMarkClassChange() {
    const className = el('taClassFilter').value;
    populateSubjectDropdown('taSubjectFilter', className);
    resetMarkPanel();
  }

  /* ---- populate subject for history panel ---- */
  function onHistClassChange() {
    const className = el('taHistClassFilter').value;
    populateSubjectDropdown('taHistSubjectFilter', className);
  }

  function populateSubjectDropdown(selectId, className) {
    const sel = el(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select Subject —</option>';
    if (!className || !S.classCourseMap[className]) return;

    const courses = S.classCourseMap[className];
    courses.forEach(function (c) {
      const opt = document.createElement('option');
      opt.value = String(c.course_id);
      opt.textContent = esc(c.subject_name || c.subject_code || 'Subject ' + c.course_id);
      sel.appendChild(opt);
    });
  }

  /* ============================================================
     LOAD STUDENTS FOR MARKING
  ============================================================ */
  async function onLoadStudents() {
    const courseId = el('taSubjectFilter').value;
    const date     = el('taMarkDate').value;

    if (!courseId) { toast('Please select a subject first.', 'warning'); return; }
    if (!date)     { toast('Please pick a date.', 'warning'); return; }

    /* find the selected course to get its class UUID */
    const selectedCourse = S.courses.find(c => String(c.course_id) === String(courseId));
    const classUuid = selectedCourse?._classUuid || null;

    if (!classUuid) {
      toast('Could not resolve class for this subject. Please refresh and try again.', 'error');
      return;
    }

    S.selectedCourseId = courseId;
    S.selectedClassUuid = classUuid;
    S.statuses = {};
    S.students = [];

    setMarkLoading(true);

    try {
      /* Use class roster endpoint — students are enrolled per class,
         not per course, so course_enrollments is typically empty. */
      const [stuRes, attRes] = await Promise.all([
        ClassAPI.getStudents(classUuid),
        AttendanceAPI.getByCourse(courseId, { date }).catch(() => []),
      ]);

      const students = toArray(stuRes);
      const existing = toArray(attRes);

      /* build existing-status lookup keyed by student_id */
      const existingMap = {};
      existing.forEach(function (r) {
        if (r.student_id) existingMap[String(r.student_id)] = { status: r.status || 'present', remarks: r.remarks || '' };
      });

      S.students = students.map(function (s) {
        return {
          student_id: s.student_id,
          name: ((s.first_name || '') + ' ' + (s.last_name || '')).trim() || ('Student ' + s.student_id),
          student_no: s.student_id_number || s.student_no || '',
        };
      });

      /* pre-fill from existing records */
      S.students.forEach(function (s) {
        const key = String(s.student_id);
        if (existingMap[key]) {
          S.statuses[key] = existingMap[key];
        }
      });

      renderStudentTable();
      updateStats();

    } catch (err) {
      toast('Failed to load students. Please try again.', 'error');
      console.error('onLoadStudents:', err);
    } finally {
      setMarkLoading(false);
    }
  }

  /* ============================================================
     RENDER STUDENT TABLE
  ============================================================ */
  function renderStudentTable() {
    const table = el('taStudentTable');
    const empty = el('taEmptyMsg');
    const tbody  = el('taStudentTbody');
    const bulk   = el('taBulkBar');
    const footer = el('taSubmitFooter');
    const stats  = el('taStatsStrip');

    if (!S.students.length) {
      table.style.display = 'none';
      bulk.style.display = 'none';
      footer.style.display = 'none';
      stats.style.display = 'none';
      empty.innerHTML = '<i class="fas fa-users"></i><p>No students enrolled in this course.</p>';
      empty.style.display = '';
      return;
    }

    empty.style.display = 'none';
    table.style.display = '';
    bulk.style.display = '';
    footer.style.display = '';
    stats.style.display = '';

    const statuses = ['present', 'absent', 'late', 'excused'];
    tbody.innerHTML = S.students.map(function (s, idx) {
      const key = String(s.student_id);
      const current = (S.statuses[key] || {}).status || '';
      const remarks  = (S.statuses[key] || {}).remarks || '';

      const btns = statuses.map(function (st) {
        const active = current === st ? ' active ' + st : '';
        return `<button class="ta-status-btn${active}" data-student="${esc(key)}" data-status="${st}">${st.charAt(0).toUpperCase() + st.slice(1)}</button>`;
      }).join('');

      return `<tr>
        <td>${idx + 1}</td>
        <td><strong>${esc(s.name)}</strong></td>
        <td><span style="font-size:.8rem;color:#64748b">${esc(s.student_no || '—')}</span></td>
        <td><div class="ta-status-group">${btns}</div></td>
        <td><input type="text" style="width:100%;max-width:200px;padding:.3rem .6rem;border:1px solid #e2e8f0;border-radius:6px;font-size:.8rem"
             placeholder="Optional note" data-remark="${esc(key)}"
             value="${esc(remarks)}"></td>
      </tr>`;
    }).join('');

    /* status button events */
    tbody.querySelectorAll('.ta-status-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const studentId = btn.dataset.student;
        const status    = btn.dataset.status;
        setStudentStatus(studentId, status);
      });
    });

    /* remarks input events */
    tbody.querySelectorAll('input[data-remark]').forEach(function (input) {
      input.addEventListener('input', function () {
        const key = input.dataset.remark;
        if (!S.statuses[key]) S.statuses[key] = { status: '', remarks: '' };
        S.statuses[key].remarks = input.value.trim();
      });
    });
  }

  function setStudentStatus(studentId, status) {
    const key = String(studentId);
    if (!S.statuses[key]) S.statuses[key] = { status: '', remarks: '' };
    S.statuses[key].status = status;

    /* update UI buttons in this row */
    el('taStudentTbody').querySelectorAll(`.ta-status-btn[data-student="${key}"]`).forEach(function (btn) {
      btn.classList.remove('active', 'present', 'absent', 'late', 'excused');
      if (btn.dataset.status === status) btn.classList.add('active', status);
    });

    updateStats();
  }

  /* ============================================================
     BULK MARK
  ============================================================ */
  function bulkMark(status) {
    S.students.forEach(function (s) {
      const key = String(s.student_id);
      if (status === null) {
        delete S.statuses[key];
      } else {
        if (!S.statuses[key]) S.statuses[key] = { status: '', remarks: '' };
        S.statuses[key].status = status;
      }
    });
    renderStudentTable();
    updateStats();
  }

  /* ============================================================
     STATS
  ============================================================ */
  function updateStats() {
    let present = 0, absent = 0, late = 0, excused = 0, unmarked = 0;
    S.students.forEach(function (s) {
      const st = (S.statuses[String(s.student_id)] || {}).status || '';
      if      (st === 'present') present++;
      else if (st === 'absent')  absent++;
      else if (st === 'late')    late++;
      else if (st === 'excused') excused++;
      else                       unmarked++;
    });

    const total = S.students.length;
    const rate  = total > 0 ? Math.round((present / total) * 100) : 0;

    setText('taStatTotal',   total);
    setText('taStatPresent', present);
    setText('taStatAbsent',  absent);
    setText('taStatLate',    late);
    setText('taStatExcused', excused);
    setText('taStatRate',    total > 0 ? rate + '%' : '—');
    setText('taUnmarkedCount', unmarked);
  }

  function setText(id, val) {
    const e = el(id);
    if (e) e.textContent = String(val);
  }

  /* ============================================================
     SUBMIT ATTENDANCE
  ============================================================ */
  async function onSubmit() {
    if (!S.selectedCourseId) { toast('No course selected.', 'warning'); return; }
    const date = el('taMarkDate').value;
    if (!date) { toast('No date selected.', 'warning'); return; }

    /* warn if any student not marked */
    const unmarked = S.students.filter(s => !(S.statuses[String(s.student_id)] || {}).status);
    if (unmarked.length > 0) {
      toast(`${unmarked.length} student(s) not marked. Please mark all students before submitting.`, 'warning');
      return;
    }

    const students = S.students.map(function (s) {
      const key = String(s.student_id);
      return {
        student_id: s.student_id,
        status:     S.statuses[key]?.status || 'absent',
        remarks:    S.statuses[key]?.remarks || null,
      };
    });

    const submitBtn = el('taSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…'; }

    try {
      await AttendanceAPI.bulkCreate({
        course_id:       parseInt(S.selectedCourseId, 10),
        attendance_date: date,
        students:        students,
      });
      toast('Attendance submitted successfully!', 'success');
    } catch (err) {
      const msg = err?.message || 'Failed to submit attendance.';
      toast(msg, 'error');
      console.error('onSubmit:', err);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Attendance'; }
    }
  }

  /* ============================================================
     HISTORY
  ============================================================ */
  async function onHistSearch() {
    const courseId = el('taHistSubjectFilter').value;
    const from     = el('taHistFrom').value;
    const to       = el('taHistTo').value;

    if (!courseId) { toast('Please select a class and subject.', 'warning'); return; }
    if (!from)     { toast('Please select a From date.', 'warning'); return; }

    /* Use a single date (from) or iterate a range. API only supports per-day queries.
       If from === to, load one day. Otherwise load a range day-by-day (max 31 days). */
    const fromDate  = new Date(from);
    const toDate    = to ? new Date(to) : fromDate;
    if (fromDate > toDate) { toast('From date cannot be after To date.', 'warning'); return; }

    const dayDiff = Math.round((toDate - fromDate) / 86400000);
    if (dayDiff > 31) { toast('Please limit history search to 31 days at a time.', 'warning'); return; }

    setHistLoading(true);
    S.historyRows = [];

    try {
      const days = [];
      for (let d = 0; d <= dayDiff; d++) {
        const dt = new Date(fromDate);
        dt.setDate(dt.getDate() + d);
        days.push(dt.toISOString().slice(0, 10));
      }

      /* find course meta */
      const course = S.courses.find(c => String(c.course_id) === String(courseId)) || {};

      const results = await Promise.all(days.map(function (date) {
        return AttendanceAPI.getByCourse(courseId, { date })
          .then(function (res) {
            return toArray(res).map(r => Object.assign({}, r, { _date: date }));
          })
          .catch(() => []);
      }));

      S.historyRows = results.flat();
      renderHistoryTable(course);
    } catch (err) {
      toast('Failed to load history.', 'error');
      console.error('onHistSearch:', err);
    } finally {
      setHistLoading(false);
    }
  }

  function renderHistoryTable(course) {
    const table = el('taHistTable');
    const empty = el('taHistEmptyMsg');
    const tbody  = el('taHistTbody');

    if (!S.historyRows.length) {
      table.style.display = 'none';
      empty.innerHTML = '<i class="fas fa-calendar-alt"></i><p>No attendance records found for the selected period.</p>';
      empty.style.display = '';
      return;
    }

    empty.style.display = 'none';
    table.style.display = '';

    const className   = esc(course.class_name || '');
    const subjectName = esc(course.subject_name || '');

    tbody.innerHTML = S.historyRows.map(function (r) {
      const name = ((r.first_name || '') + ' ' + (r.last_name || '')).trim() || ('Student ' + r.student_id);
      const st   = String(r.status || '').toLowerCase();
      return `<tr>
        <td>${esc(r._date || '')}</td>
        <td>${className}</td>
        <td>${subjectName}</td>
        <td>${esc(name)}</td>
        <td><span class="ta-badge ${esc(st)}">${esc(st)}</span></td>
        <td style="color:#64748b;font-size:.82rem">${esc(r.remarks || '—')}</td>
      </tr>`;
    }).join('');
  }

  /* ============================================================
     EXPORT
  ============================================================ */
  function exportCsv() {
    if (S.mode === 'mark') exportMarkCsv();
    else exportHistoryCsv();
  }

  function exportMarkCsv() {
    if (!S.students.length) { toast('No data to export.', 'warning'); return; }
    const date = el('taMarkDate').value || todayIso();
    const rows = [['#', 'Student', 'Student ID', 'Status', 'Remarks']];
    S.students.forEach(function (s, idx) {
      const key = String(s.student_id);
      rows.push([
        idx + 1,
        s.name,
        s.student_no || '',
        (S.statuses[key] || {}).status || '',
        (S.statuses[key] || {}).remarks || '',
      ]);
    });
    downloadCsv(rows, 'attendance_' + date.replace(/-/g, '') + '.csv');
  }

  function exportHistoryCsv() {
    if (!S.historyRows.length) { toast('No history data to export.', 'warning'); return; }
    const rows = [['Date', 'Class', 'Subject', 'Student', 'Status', 'Remarks']];
    const course = S.courses.find(c => String(c.course_id) === (el('taHistSubjectFilter').value || '')) || {};
    S.historyRows.forEach(function (r) {
      const name = ((r.first_name || '') + ' ' + (r.last_name || '')).trim();
      rows.push([r._date || '', course.class_name || '', course.subject_name || '', name, r.status || '', r.remarks || '']);
    });
    downloadCsv(rows, 'attendance_history.csv');
  }

  function downloadCsv(rows, filename) {
    const content = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
      toast('PDF export requires jsPDF. Falling back to CSV.', 'warning');
      exportCsv();
      return;
    }

    const JsPDF = window.jspdf?.jsPDF || window.jsPDF;
    const doc   = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const date  = el('taMarkDate')?.value || todayIso();

    doc.setFontSize(14);
    doc.text('Attendance Report — ' + date, 14, 16);

    if (S.mode === 'mark' && S.students.length) {
      const heads = [['#', 'Student', 'Student ID', 'Status', 'Remarks']];
      const body  = S.students.map(function (s, idx) {
        const key = String(s.student_id);
        return [idx + 1, s.name, s.student_no || '', (S.statuses[key] || {}).status || '', (S.statuses[key] || {}).remarks || ''];
      });
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({ head: heads, body: body, startY: 22, styles: { fontSize: 9 }, headStyles: { fillColor: [0, 106, 63] } });
      }
    } else if (S.mode === 'history' && S.historyRows.length) {
      const course = S.courses.find(c => String(c.course_id) === (el('taHistSubjectFilter').value || '')) || {};
      const heads  = [['Date', 'Class', 'Subject', 'Student', 'Status', 'Remarks']];
      const body   = S.historyRows.map(function (r) {
        const name = ((r.first_name || '') + ' ' + (r.last_name || '')).trim();
        return [r._date || '', course.class_name || '', course.subject_name || '', name, r.status || '', r.remarks || ''];
      });
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({ head: heads, body: body, startY: 22, styles: { fontSize: 9 }, headStyles: { fillColor: [0, 106, 63] } });
      }
    } else {
      toast('No data to export as PDF.', 'warning');
      return;
    }

    doc.save('attendance_report.pdf');
  }

  /* ============================================================
     UI HELPERS
  ============================================================ */
  function setMarkLoading(on) {
    if (on) {
      el('taEmptyMsg').innerHTML  = '<div class="ta-loading"><i class="fas fa-spinner fa-spin"></i> Loading students…</div>';
      el('taEmptyMsg').style.display = '';
      el('taStudentTable').style.display = 'none';
      el('taBulkBar').style.display    = 'none';
      el('taSubmitFooter').style.display = 'none';
      el('taStatsStrip').style.display   = 'none';
    }
  }

  function setHistLoading(on) {
    const loading = el('taHistLoading');
    const empty   = el('taHistEmptyMsg');
    const table   = el('taHistTable');
    if (on) {
      if (loading) loading.style.display = '';
      if (empty)   empty.style.display   = 'none';
      if (table)   table.style.display   = 'none';
    } else {
      if (loading) loading.style.display = 'none';
    }
  }

  function resetMarkPanel() {
    S.statuses = {};
    S.students = [];
    S.selectedCourseId = null;
    S.selectedClassUuid = null;
    el('taStudentTable').style.display     = 'none';
    el('taBulkBar').style.display          = 'none';
    el('taSubmitFooter').style.display     = 'none';
    el('taStatsStrip').style.display       = 'none';
    el('taEmptyMsg').style.display         = '';
    el('taEmptyMsg').innerHTML = '<i class="fas fa-users"></i><p>Select a subject and date then click <strong>Load Students</strong> to begin.</p>';
  }

})();
