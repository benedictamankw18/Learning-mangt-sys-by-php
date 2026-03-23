/* ============================================
   Student Timetable Page
   SPA fragment: student/page/timetable.html
============================================ */
(function () {
  'use strict';

  const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DAY_LABEL = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };

  const SUBJECT_COLORS = [
    '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#e11d48'
  ];

  const S = {
    view: 'weekly',
    entries: [],
    weekValue: '',
    dateValue: '',
    classId: null,
    className: '',
    semesterEndDate: null,
    colorMap: new Map(),
  };

  function esc(v) {
    const text = String(v == null ? '' : v);
    if (typeof escHtml === 'function') return escHtml(text);
    return text.replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c;
    });
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function getStudentUuid() {
    if (typeof Auth === 'undefined' || typeof Auth.getUser !== 'function') return null;
    const u = Auth.getUser();
    return u && (u.student_uuid || u.uuid) ? (u.student_uuid || u.uuid) : null;
  }

  function normalizeDay(dayValue) {
    const raw = String(dayValue || '').trim().toLowerCase();
    if (!raw) return '';
    if (DAY_ORDER.indexOf(raw) >= 0) return raw;
    const first = raw.slice(0, 3);
    for (let i = 0; i < DAY_ORDER.length; i += 1) {
      if (DAY_ORDER[i].slice(0, 3) === first) return DAY_ORDER[i];
    }
    return raw;
  }

  function sortEntries(a, b) {
    const da = DAY_ORDER.indexOf(a.day_of_week);
    const db = DAY_ORDER.indexOf(b.day_of_week);
    if (da !== db) return da - db;
    return String(a.start_time || '').localeCompare(String(b.start_time || ''));
  }

  function fmtTime24(value) {
    return String(value || '').slice(0, 5);
  }

  function fmtTime(value) {
    const s = fmtTime24(value);
    const parts = s.split(':');
    if (parts.length < 2) return value || '--:--';

    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return s;

    const suffix = h >= 12 ? 'PM' : 'AM';
    const hh = ((h + 11) % 12) + 1;
    return String(hh) + ':' + String(m).padStart(2, '0') + ' ' + suffix;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toDateInputValue(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function toWeekInputValue(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return date.getUTCFullYear() + '-W' + pad2(weekNo);
  }

  function weekStartFromInput(weekValue) {
    if (!weekValue || !/^\d{4}-W\d{2}$/.test(weekValue)) return null;
    const year = Number(weekValue.slice(0, 4));
    const week = Number(weekValue.slice(6));

    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const dow = simple.getUTCDay();
    const isoWeekStart = new Date(simple);

    if (dow <= 4) isoWeekStart.setUTCDate(simple.getUTCDate() - (dow === 0 ? 6 : dow - 1));
    else isoWeekStart.setUTCDate(simple.getUTCDate() + (8 - dow));

    return new Date(isoWeekStart.getUTCFullYear(), isoWeekStart.getUTCMonth(), isoWeekStart.getUTCDate());
  }

  function getWeekDates(weekStartDate) {
    const out = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(weekStartDate);
      d.setDate(weekStartDate.getDate() + i);
      out.push(d);
    }
    return out;
  }

  function sameYMD(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function getTodayDayName() {
    const idx = new Date().getDay();
    return idx === 0 ? 'sunday' : DAY_ORDER[idx - 1];
  }

  function dayFromDateInput(value) {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    const idx = d.getDay();
    return idx === 0 ? 'sunday' : DAY_ORDER[idx - 1];
  }

  function dayTitle(day) {
    const key = normalizeDay(day);
    if (!key) return 'Day';
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  function hashText(text) {
    const s = String(text || '');
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function subjectColor(subject) {
    const key = String(subject || 'subject').toLowerCase();
    if (S.colorMap.has(key)) return S.colorMap.get(key);
    const color = SUBJECT_COLORS[hashText(key) % SUBJECT_COLORS.length];
    S.colorMap.set(key, color);
    return color;
  }

  function timeToMinutes(t) {
    const s = fmtTime24(t);
    const p = s.split(':');
    if (p.length < 2) return -1;
    const h = Number(p[0]);
    const m = Number(p[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return -1;
    return h * 60 + m;
  }

  function getCurrentAndNextClass() {
    const todayName = getTodayDayName();
    const now = new Date();
    const nowM = now.getHours() * 60 + now.getMinutes();

    const todayRows = S.entries
      .filter(function (e) { return e.day_of_week === todayName; })
      .slice()
      .sort(sortEntries);

    let current = null;
    let next = null;

    for (let i = 0; i < todayRows.length; i += 1) {
      const row = todayRows[i];
      const start = timeToMinutes(row.start_time);
      const end = timeToMinutes(row.end_time);
      if (start < 0 || end < 0) continue;

      if (nowM >= start && nowM < end) {
        current = row;
        next = todayRows[i + 1] || null;
        break;
      }

      if (nowM < start) {
        next = row;
        break;
      }
    }

    return { current: current, next: next };
  }

  function getDom() {
    return {
      root: document.getElementById('studentTimetablePageRoot'),
      tabs: document.getElementById('sttViewTabs'),
      weekWrap: document.getElementById('sttWeekFilterWrap'),
      dateWrap: document.getElementById('sttDateFilterWrap'),
      weekInput: document.getElementById('sttWeekFilter'),
      dateInput: document.getElementById('sttDateFilter'),
      refreshBtn: document.getElementById('sttRefreshBtn'),
      exportPdfBtn: document.getElementById('sttExportPdfBtn'),
      exportCsvBtn: document.getElementById('sttExportCsvBtn'),
      syncBtn: document.getElementById('sttSyncBtn'),
      statSessions: document.getElementById('sttTotalSessions'),
      statToday: document.getElementById('sttTodayCount'),
      statCurrent: document.getElementById('sttCurrentClass'),
      statNext: document.getElementById('sttNextClass'),
      rangeInfo: document.getElementById('sttRangeInfo'),
      contentArea: document.getElementById('sttContentArea'),
    };
  }

  function setLoading() {
    const dom = getDom();
    if (!dom.contentArea) return;
    dom.contentArea.innerHTML = '<div class="stt-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading timetable...</div>';
  }

  function currentRowsForView() {
    if (S.view === 'daily') {
      const day = dayFromDateInput(S.dateValue);
      return S.entries.filter(function (e) { return e.day_of_week === day; });
    }
    return S.entries.slice();
  }

  function renderStats() {
    const dom = getDom();
    const rows = currentRowsForView();
    const todayDay = getTodayDayName();

    const todayRows = rows.filter(function (r) { return r.day_of_week === todayDay; });
    const currentNext = getCurrentAndNextClass();

    if (dom.statSessions) dom.statSessions.textContent = String(rows.length);
    if (dom.statToday) dom.statToday.textContent = String(todayRows.length);
    if (dom.statCurrent) dom.statCurrent.textContent = currentNext.current ? String(currentNext.current.subject_name || currentNext.current.subject_code || '-') : '-';
    if (dom.statNext) dom.statNext.textContent = currentNext.next ? String(currentNext.next.subject_name || currentNext.next.subject_code || '-') : '-';
  }

  function entryFlags(entry) {
    const todayDay = getTodayDayName();
    if (entry.day_of_week !== todayDay) return { isCurrent: false, isNext: false };

    const now = new Date();
    const nowM = now.getHours() * 60 + now.getMinutes();
    const start = timeToMinutes(entry.start_time);
    const end = timeToMinutes(entry.end_time);

    if (start >= 0 && end >= 0 && nowM >= start && nowM < end) {
      return { isCurrent: true, isNext: false };
    }

    const currentNext = getCurrentAndNextClass();
    if (currentNext.next && currentNext.next.schedule_id === entry.schedule_id) {
      return { isCurrent: false, isNext: true };
    }

    return { isCurrent: false, isNext: false };
  }

  function entryCard(entry) {
    const dot = subjectColor(entry.subject_name || entry.subject_code);
    const flags = entryFlags(entry);
    const stateClass = flags.isCurrent ? ' stt-entry--current' : (flags.isNext ? ' stt-entry--next' : '');
    const badge = flags.isCurrent
      ? '<span class="stt-badge current">Current</span>'
      : (flags.isNext ? '<span class="stt-badge next">Next</span>' : '');

    return [
      '<article class="stt-entry' + stateClass + '">',
      badge,
      '  <div class="stt-entry-time">' + esc(fmtTime(entry.start_time)) + ' - ' + esc(fmtTime(entry.end_time)) + '</div>',
      '  <div class="stt-entry-subject"><span class="stt-subject-dot" style="background:' + esc(dot) + ';"></span>' + esc(entry.subject_name || entry.subject_code || 'Subject') + '</div>',
      '  <div class="stt-entry-meta">',
      '    <div><i class="fas fa-user"></i> ' + esc(entry.teacher_name || 'Teacher TBA') + '</div>',
      '    <div><i class="fas fa-location-dot"></i> ' + esc(entry.room || 'Room TBA') + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function renderWeekly() {
    const dom = getDom();
    if (!dom.contentArea) return;

    const weekStart = weekStartFromInput(S.weekValue) || new Date();
    const dates = getWeekDates(weekStart);
    const today = new Date();

    if (dom.rangeInfo) {
      const end = dates[6];
      const labelClass = S.className ? ' | Class: ' + S.className : '';
      dom.rangeInfo.textContent = 'Week: ' + dates[0].toLocaleDateString() + ' - ' + end.toLocaleDateString() + labelClass;
    }

    const html = DAY_ORDER.map(function (dayKey, idx) {
      const dayRows = S.entries.filter(function (e) { return e.day_of_week === dayKey; });
      const isTodayCol = sameYMD(dates[idx], today);
      const body = dayRows.length
        ? dayRows.map(function (row) { return entryCard(row); }).join('')
        : '<div class="stt-empty">No classes</div>';

      return [
        '<section class="stt-day-col' + (isTodayCol ? ' is-today' : '') + '">',
        '  <header class="stt-day-head">',
        '    <strong>' + DAY_LABEL[dayKey] + '</strong>',
        '    <span>' + dates[idx].toLocaleDateString() + '</span>',
        '  </header>',
        '  <div class="stt-day-body">' + body + '</div>',
        '</section>'
      ].join('');
    }).join('');

    dom.contentArea.innerHTML = '<div class="stt-week-grid">' + html + '</div>';
  }

  function renderDaily() {
    const dom = getDom();
    if (!dom.contentArea) return;

    const dayName = dayFromDateInput(S.dateValue);
    const dayRows = S.entries.filter(function (e) { return e.day_of_week === dayName; });
    const targetDate = S.dateValue ? new Date(S.dateValue + 'T00:00:00') : new Date();

    if (dom.rangeInfo) {
      const labelClass = S.className ? ' | Class: ' + S.className : '';
      dom.rangeInfo.textContent = dayTitle(dayName) + ' - ' + targetDate.toLocaleDateString() + labelClass;
    }

    if (!dayRows.length) {
      dom.contentArea.innerHTML = '<div class="stt-empty">No classes for this day.</div>';
      return;
    }

    dom.contentArea.innerHTML = '<div class="stt-week-grid"><section class="stt-day-col is-today"><header class="stt-day-head"><strong>' + esc(dayTitle(dayName)) + '</strong><span>' + esc(targetDate.toLocaleDateString()) + '</span></header><div class="stt-day-body">' + dayRows.map(function (row) { return entryCard(row); }).join('') + '</div></section></div>';
  }

  function renderSemesterTable() {
    const dom = getDom();
    if (!dom.contentArea) return;

    if (dom.rangeInfo) {
      const labelClass = S.className ? 'Class: ' + S.className + ' | ' : '';
      dom.rangeInfo.textContent = labelClass + 'Semester view: all recurring sessions';
    }

    if (!S.entries.length) {
      dom.contentArea.innerHTML = '<div class="stt-empty">No timetable sessions assigned yet.</div>';
      return;
    }

    const rows = S.entries.map(function (e) {
      const flags = entryFlags(e);
      const state = flags.isCurrent ? 'Current' : (flags.isNext ? 'Next' : '');
      const color = subjectColor(e.subject_name || e.subject_code);

      return [
        '<tr>',
        '  <td>' + esc(dayTitle(e.day_of_week)) + '</td>',
        '  <td>' + esc(fmtTime(e.start_time)) + ' - ' + esc(fmtTime(e.end_time)) + '</td>',
        '  <td><span class="stt-subject-dot" style="background:' + esc(color) + ';margin-right:.35rem;"></span>' + esc(e.subject_name || e.subject_code || 'Subject') + '</td>',
        '  <td>' + esc(e.teacher_name || 'Teacher TBA') + '</td>',
        '  <td>' + esc(e.room || 'Room TBA') + '</td>',
        '  <td>' + esc(state) + '</td>',
        '</tr>'
      ].join('');
    }).join('');

    dom.contentArea.innerHTML = [
      '<div class="stt-table-wrap">',
      '  <table class="stt-table">',
      '    <thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th><th>Status</th></tr></thead>',
      '    <tbody>' + rows + '</tbody>',
      '  </table>',
      '</div>'
    ].join('');
  }

  function renderViewControls() {
    const dom = getDom();
    if (!dom.tabs) return;

    const buttons = dom.tabs.querySelectorAll('.stt-view-btn');
    buttons.forEach(function (btn) {
      const view = btn.getAttribute('data-view');
      if (view === S.view) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    if (dom.weekWrap) dom.weekWrap.classList.toggle('stt-hidden', S.view !== 'weekly');
    if (dom.dateWrap) dom.dateWrap.classList.toggle('stt-hidden', S.view !== 'daily');
  }

  function render() {
    const dom = getDom();
    if (!dom.root) return;

    renderViewControls();
    renderStats();

    if (S.view === 'weekly') renderWeekly();
    else if (S.view === 'daily') renderDaily();
    else renderSemesterTable();
  }

  function keepPrimaryClassCourses(courses) {
    const rows = Array.isArray(courses) ? courses : [];
    if (!rows.length) return [];

    const byClass = new Map();
    rows.forEach(function (c) {
      const key = String(c.class_id || '');
      if (!key) return;
      byClass.set(key, (byClass.get(key) || 0) + 1);
    });

    if (byClass.size <= 1) return rows;

    let primaryClassId = null;
    let maxCount = -1;
    byClass.forEach(function (count, classId) {
      if (count > maxCount) {
        maxCount = count;
        primaryClassId = classId;
      }
    });

    return rows.filter(function (c) { return String(c.class_id || '') === primaryClassId; });
  }

  async function loadClassUuidMap() {
    const res = await API.get(API_ENDPOINTS.CLASSES, { page: 1, limit: 500 });
    const rows = res && res.data && res.data.data ? res.data.data : (res && res.data ? res.data : []);

    const map = new Map();
    rows.forEach(function (r) {
      if (r && r.class_id != null && r.uuid) map.set(String(r.class_id), r.uuid);
    });
    return map;
  }

  async function loadSchedule() {
    const studentUuid = getStudentUuid();
    if (!studentUuid) throw new Error('Student identity not found');

    const coursesRes = await API.get(API_ENDPOINTS.STUDENT_COURSES(studentUuid));
    const rawCourses = Array.isArray(coursesRes && coursesRes.data) ? coursesRes.data : (Array.isArray(coursesRes) ? coursesRes : []);
    const primaryCourses = keepPrimaryClassCourses(rawCourses);

    if (!primaryCourses.length) {
      S.entries = [];
      S.classId = null;
      S.className = '';
      S.semesterEndDate = null;
      return;
    }

    const classId = primaryCourses[0].class_id;
    S.classId = classId;
    S.className = String(primaryCourses[0].class_name || '');
    S.semesterEndDate = String(primaryCourses[0].end_date || primaryCourses[0].semester_end_date || '') || null;

    const classMap = await loadClassUuidMap();
    const classUuid = classMap.get(String(classId));
    if (!classUuid) throw new Error('Class UUID not found for assigned class');

    const schRes = await ClassScheduleAPI.getByClass(classUuid);
    const raw = Array.isArray(schRes && schRes.data) ? schRes.data : (Array.isArray(schRes) ? schRes : []);

    S.entries = raw.map(function (item) {
      return {
        schedule_id: item.schedule_id,
        day_of_week: normalizeDay(item.day_of_week),
        start_time: item.start_time || '',
        end_time: item.end_time || '',
        room: item.room || '',
        is_recurring: item.is_recurring,
        semester_end_date: item.semester_end_date || S.semesterEndDate,
        subject_name: item.subject_name || '',
        subject_code: item.subject_code || '',
        teacher_name: item.teacher_name || '',
      };
    }).filter(function (row) {
      return DAY_ORDER.indexOf(row.day_of_week) >= 0;
    }).sort(sortEntries);
  }

  function csvEscape(value) {
    const v = String(value == null ? '' : value);
    if (v.indexOf(',') >= 0 || v.indexOf('"') >= 0 || v.indexOf('\n') >= 0) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  }

  function buildExportRows() {
    if (S.view === 'daily') return currentRowsForView();
    return S.entries.slice();
  }

  function downloadCsv(rows, filename) {
    const header = ['Day', 'Start', 'End', 'Subject', 'Teacher', 'Room', 'Status'];
    const body = rows.map(function (r) {
      const flags = entryFlags(r);
      const state = flags.isCurrent ? 'Current' : (flags.isNext ? 'Next' : '');
      return [
        dayTitle(r.day_of_week),
        fmtTime(r.start_time),
        fmtTime(r.end_time),
        r.subject_name || r.subject_code,
        r.teacher_name || 'Teacher TBA',
        r.room || 'Room TBA',
        state,
      ].map(csvEscape).join(',');
    });

    const csv = [header.join(','), body.join('\n')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPdf(rows) {
    if (!window.jspdf || typeof window.jspdf.jsPDF !== 'function') return false;

    const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Student Timetable', 40, 36);
    doc.setFontSize(10);
    const subtitle = (S.className ? ('Class: ' + S.className + ' | ') : '') + 'Generated: ' + new Date().toLocaleString();
    doc.text(subtitle, 40, 54);

    const dataRows = rows.map(function (r) {
      const flags = entryFlags(r);
      const state = flags.isCurrent ? 'Current' : (flags.isNext ? 'Next' : '');
      return [
        dayTitle(r.day_of_week),
        fmtTime(r.start_time),
        fmtTime(r.end_time),
        r.subject_name || r.subject_code || '',
        r.teacher_name || 'Teacher TBA',
        r.room || 'Room TBA',
        state,
      ];
    });

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 68,
        head: [['Day', 'Start', 'End', 'Subject', 'Teacher', 'Room', 'Status']],
        body: dataRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [16, 185, 129] },
      });
    } else {
      let y = 78;
      dataRows.forEach(function (line) {
        doc.text(line.join(' | '), 40, y);
        y += 14;
      });
    }

    doc.save('student-timetable-' + toDateInputValue(new Date()) + '.pdf');
    return true;
  }

  function toIcsDate(dateObj, timeStr) {
    const s = fmtTime24(timeStr);
    const p = s.split(':');
    if (p.length < 2) return '';
    const h = Number(p[0]);
    const m = Number(p[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return '';

    const dt = new Date(dateObj);
    dt.setHours(h, m, 0, 0);

    return dt.getUTCFullYear() +
      pad2(dt.getUTCMonth() + 1) +
      pad2(dt.getUTCDate()) + 'T' +
      pad2(dt.getUTCHours()) +
      pad2(dt.getUTCMinutes()) +
      '00Z';
  }

  function toIcsUntilDate(dateValue, timeStr) {
    if (!dateValue) return '';
    const datePart = String(dateValue).slice(0, 10);
    const d = new Date(datePart + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '';
    return toIcsDate(d, timeStr || '23:59');
  }

  function parseIsoDateOnly(dateValue) {
    if (!dateValue) return null;
    const datePart = String(dateValue).slice(0, 10);
    const d = new Date(datePart + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function dayIndex(dayName) {
    const idx = DAY_ORDER.indexOf(normalizeDay(dayName));
    return idx < 0 ? 0 : idx;
  }

  function shiftToDayOnOrBefore(dateObj, dayName) {
    const d = new Date(dateObj);
    const target = dayIndex(dayName);
    const current = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const diff = (current - target + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }

  function icsEscape(value) {
    return String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function downloadIcsForWeek() {
    const weekStart = weekStartFromInput(S.weekValue) || new Date();
    const weekDates = getWeekDates(weekStart);
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ghana SHS LMS//Student Timetable//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    DAY_ORDER.forEach(function (day, idx) {
      const dateObj = weekDates[idx];
      const rows = S.entries.filter(function (r) { return r.day_of_week === day; });

      rows.forEach(function (r, i) {
        const isRecurring = Number(r.is_recurring) === 1;
        const semesterEnd = r.semester_end_date || S.semesterEndDate;
        const untilDateObj = isRecurring ? parseIsoDateOnly(semesterEnd) : null;

        let anchorDate = new Date(dateObj);
        if (isRecurring && untilDateObj && anchorDate > untilDateObj) {
          anchorDate = shiftToDayOnOrBefore(untilDateObj, r.day_of_week);
        }

        const dtStart = toIcsDate(anchorDate, r.start_time);
        const dtEnd = toIcsDate(anchorDate, r.end_time);
        if (!dtStart || !dtEnd) return;

        const until = isRecurring ? toIcsUntilDate(semesterEnd, r.end_time || '23:59') : '';
        if (isRecurring && until && until < dtStart) return;

        lines.push('BEGIN:VEVENT');
        lines.push('UID:' + String(r.schedule_id || day + '-' + i) + '-' + dateObj.getTime() + '@lms.local');
        lines.push('DTSTAMP:' + toIcsDate(new Date(), pad2(new Date().getHours()) + ':' + pad2(new Date().getMinutes())));
        lines.push('DTSTART:' + dtStart);
        lines.push('DTEND:' + dtEnd);
        if (isRecurring && until) {
          lines.push('RRULE:FREQ=WEEKLY;UNTIL=' + until);
        }
        lines.push('SUMMARY:' + icsEscape(String(r.subject_name || r.subject_code || 'Class')));
        lines.push('LOCATION:' + icsEscape(String(r.room || 'Room TBA')));
        lines.push('DESCRIPTION:' + icsEscape('Teacher - ' + String(r.teacher_name || 'TBA')));
        lines.push('END:VEVENT');
      });
    });

    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-timetable-week.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function renderOrNotifyExportPdf() {
    const rows = buildExportRows();
    if (!rows.length) {
      toast('No timetable data to export.', 'warning');
      return;
    }

    const ok = exportPdf(rows);
    if (!ok) {
      toast('PDF library unavailable.', 'warning');
      return;
    }

    toast('Timetable exported to PDF.', 'success');
  }

  function renderOrNotifyExportCsv() {
    const rows = buildExportRows();
    if (!rows.length) {
      toast('No timetable data to export.', 'warning');
      return;
    }

    downloadCsv(rows, 'student-timetable-' + toDateInputValue(new Date()) + '.csv');
    toast('Timetable exported to CSV.', 'success');
  }

  async function refreshAll() {
    setLoading();
    await loadSchedule();
    render();
  }

  function wire() {
    const dom = getDom();
    if (!dom.root || dom.root.dataset.wired === '1') return;

    dom.root.dataset.wired = '1';

    const today = new Date();
    S.weekValue = toWeekInputValue(today);
    S.dateValue = toDateInputValue(today);

    if (dom.weekInput) dom.weekInput.value = S.weekValue;
    if (dom.dateInput) dom.dateInput.value = S.dateValue;

    if (dom.tabs) {
      dom.tabs.addEventListener('click', function (e) {
        const btn = e.target.closest('.stt-view-btn');
        if (!btn) return;
        const view = btn.getAttribute('data-view');
        if (!view || view === S.view) return;
        S.view = view;
        render();
      });
    }

    if (dom.weekInput) {
      dom.weekInput.addEventListener('change', function () {
        S.weekValue = dom.weekInput.value || S.weekValue;
        if (S.view === 'weekly') render();
      });
    }

    if (dom.dateInput) {
      dom.dateInput.addEventListener('change', function () {
        S.dateValue = dom.dateInput.value || S.dateValue;
        if (S.view === 'daily') render();
      });
    }

    if (dom.refreshBtn) {
      dom.refreshBtn.addEventListener('click', function () {
        refreshAll().catch(function (err) {
          console.error('Timetable refresh failed', err);
          toast(err && err.message ? err.message : 'Failed to refresh timetable', 'error');
        });
      });
    }

    if (dom.exportPdfBtn) {
      dom.exportPdfBtn.addEventListener('click', renderOrNotifyExportPdf);
    }

    if (dom.exportCsvBtn) {
      dom.exportCsvBtn.addEventListener('click', renderOrNotifyExportCsv);
    }

    if (dom.syncBtn) {
      dom.syncBtn.addEventListener('click', function () {
        if (!S.entries.length) {
          toast('No timetable sessions to sync.', 'warning');
          return;
        }
        downloadIcsForWeek();
        toast('Calendar file downloaded (.ics).', 'success');
      });
    }

  }

  function init() {
    const dom = getDom();
    if (!dom.root) return;

    wire();

    refreshAll().catch(function (err) {
      console.error('Student timetable init failed', err);
      if (dom.contentArea) {
        dom.contentArea.innerHTML = '<div class="stt-empty">Failed to load timetable: ' + esc(err && err.message ? err.message : 'Unknown error') + '</div>';
      }
      toast('Failed to load timetable.', 'error');
    });
  }

  document.addEventListener('page:loaded', function (e) {
    if (!e || !e.detail || e.detail.page !== 'timetable') return;
    init();
  });

  if (window.location.hash === '#timetable') {
    init();
  }
})();
