/* ============================================
   Parent Timetable Page
   SPA fragment: parent/page/timetable.html
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

  const SUBJECT_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#e11d48'];

  const S = {
    view: 'weekly',
    children: [],
    selectedChildId: '',
    entries: [],
    weekValue: '',
    dateValue: '',
    classUuid: '',
    className: '',
    colorMap: new Map(),
  };

  let classMapCache = null;

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

  function childName(c) {
    return c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || ('Student ' + String(c.student_id || ''));
  }

  function getDom() {
    return {
      root: document.getElementById('parentTimetablePageRoot'),
      tabs: document.getElementById('pttViewTabs'),
      childInput: document.getElementById('pttChildFilter'),
      weekWrap: document.getElementById('pttWeekFilterWrap'),
      dateWrap: document.getElementById('pttDateFilterWrap'),
      weekInput: document.getElementById('pttWeekFilter'),
      dateInput: document.getElementById('pttDateFilter'),
      refreshBtn: document.getElementById('pttRefreshBtn'),
      exportPdfBtn: document.getElementById('pttExportPdfBtn'),
      exportCsvBtn: document.getElementById('pttExportCsvBtn'),
      statSessions: document.getElementById('pttTotalSessions'),
      statToday: document.getElementById('pttTodayCount'),
      statCurrent: document.getElementById('pttCurrentClass'),
      statNext: document.getElementById('pttNextClass'),
      rangeInfo: document.getElementById('pttRangeInfo'),
      contentArea: document.getElementById('pttContentArea'),
    };
  }

  function setLoading(message) {
    const dom = getDom();
    if (!dom.contentArea) return;
    dom.contentArea.innerHTML = '<div class="ptt-empty"><i class="fas fa-circle-notch fa-spin"></i> ' + esc(message || 'Loading timetable...') + '</div>';
  }

  function setEmpty(message) {
    const dom = getDom();
    if (!dom.contentArea) return;
    dom.contentArea.innerHTML = '<div class="ptt-empty">' + esc(message) + '</div>';
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
    const stateClass = flags.isCurrent ? ' ptt-entry--current' : (flags.isNext ? ' ptt-entry--next' : '');
    const badge = flags.isCurrent
      ? '<span class="ptt-badge current">Current</span>'
      : (flags.isNext ? '<span class="ptt-badge next">Next</span>' : '');

    return [
      '<article class="ptt-entry' + stateClass + '">',
      badge,
      '  <div class="ptt-entry-time">' + esc(fmtTime(entry.start_time)) + ' - ' + esc(fmtTime(entry.end_time)) + '</div>',
      '  <div class="ptt-entry-subject"><span class="ptt-subject-dot" style="background:' + esc(dot) + ';"></span>' + esc(entry.subject_name || entry.subject_code || 'Subject') + '</div>',
      '  <div class="ptt-entry-meta">',
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
      const child = S.children.find(function (c) { return String(c.student_id) === String(S.selectedChildId); });
      const childLabel = child ? (' | Child: ' + childName(child)) : '';
      const classLabel = S.className ? (' | Class: ' + S.className) : '';
      dom.rangeInfo.textContent = 'Week: ' + dates[0].toLocaleDateString() + ' - ' + end.toLocaleDateString() + childLabel + classLabel;
    }

    const html = DAY_ORDER.map(function (dayKey, idx) {
      const dayRows = S.entries.filter(function (e) { return e.day_of_week === dayKey; });
      const isTodayCol = sameYMD(dates[idx], today);
      const body = dayRows.length
        ? dayRows.map(function (row) { return entryCard(row); }).join('')
        : '<div class="ptt-empty">No classes</div>';

      return [
        '<section class="ptt-day-col' + (isTodayCol ? ' is-today' : '') + '">',
        '  <header class="ptt-day-head">',
        '    <strong>' + DAY_LABEL[dayKey] + '</strong>',
        '    <span>' + dates[idx].toLocaleDateString() + '</span>',
        '  </header>',
        '  <div class="ptt-day-body">' + body + '</div>',
        '</section>'
      ].join('');
    }).join('');

    dom.contentArea.innerHTML = '<div class="ptt-week-grid">' + html + '</div>';
  }

  function renderDaily() {
    const dom = getDom();
    if (!dom.contentArea) return;

    const dayName = dayFromDateInput(S.dateValue);
    const dayRows = S.entries.filter(function (e) { return e.day_of_week === dayName; });
    const targetDate = S.dateValue ? new Date(S.dateValue + 'T00:00:00') : new Date();

    if (dom.rangeInfo) {
      const child = S.children.find(function (c) { return String(c.student_id) === String(S.selectedChildId); });
      const childLabel = child ? (' | Child: ' + childName(child)) : '';
      const classLabel = S.className ? (' | Class: ' + S.className) : '';
      dom.rangeInfo.textContent = dayTitle(dayName) + ' - ' + targetDate.toLocaleDateString() + childLabel + classLabel;
    }

    if (!dayRows.length) {
      dom.contentArea.innerHTML = '<div class="ptt-empty">No classes for this day.</div>';
      return;
    }

    dom.contentArea.innerHTML = '<div class="ptt-week-grid"><section class="ptt-day-col is-today"><header class="ptt-day-head"><strong>' + esc(dayTitle(dayName)) + '</strong><span>' + esc(targetDate.toLocaleDateString()) + '</span></header><div class="ptt-day-body">' + dayRows.map(function (row) { return entryCard(row); }).join('') + '</div></section></div>';
  }

  function renderViewControls() {
    const dom = getDom();
    if (!dom.tabs) return;

    const buttons = dom.tabs.querySelectorAll('.ptt-view-btn');
    buttons.forEach(function (btn) {
      const view = btn.getAttribute('data-view');
      if (view === S.view) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    if (dom.weekWrap) dom.weekWrap.classList.toggle('ptt-hidden', S.view !== 'weekly');
    if (dom.dateWrap) dom.dateWrap.classList.toggle('ptt-hidden', S.view !== 'daily');
  }

  function render() {
    const dom = getDom();
    if (!dom.root) return;

    renderViewControls();
    renderStats();

    if (!S.entries.length) {
      const child = S.children.find(function (c) { return String(c.student_id) === String(S.selectedChildId); });
      const childText = child ? (' for ' + childName(child)) : '';
      setEmpty('No timetable sessions found' + childText + '.');
      return;
    }

    if (S.view === 'weekly') renderWeekly();
    else renderDaily();
  }

  function csvEscape(value) {
    const v = String(value == null ? '' : value);
    if (v.indexOf(',') >= 0 || v.indexOf('"') >= 0 || v.indexOf('\n') >= 0) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  }

  function downloadCsv(rows, filename) {
    const header = ['Child', 'Day', 'Start', 'End', 'Subject', 'Teacher', 'Room', 'Status'];
    const child = S.children.find(function (c) { return String(c.student_id) === String(S.selectedChildId); });
    const childLabel = child ? childName(child) : '';

    const body = rows.map(function (r) {
      const flags = entryFlags(r);
      const state = flags.isCurrent ? 'Current' : (flags.isNext ? 'Next' : '');
      return [
        childLabel,
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

    const child = S.children.find(function (c) { return String(c.student_id) === String(S.selectedChildId); });
    const childLabel = child ? childName(child) : 'Child';

    const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Parent Timetable', 40, 36);
    doc.setFontSize(10);
    const subtitle = 'Child: ' + childLabel + (S.className ? (' | Class: ' + S.className) : '') + ' | Generated: ' + new Date().toLocaleString();
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
        headStyles: { fillColor: [99, 102, 241] },
      });
    } else {
      let y = 78;
      dataRows.forEach(function (line) {
        doc.text(line.join(' | '), 40, y);
        y += 14;
      });
    }

    doc.save('parent-timetable-' + toDateInputValue(new Date()) + '.pdf');
    return true;
  }

  async function loadClassMap() {
    if (classMapCache) return classMapCache;

    const res = await API.get(API_ENDPOINTS.CLASSES, { page: 1, limit: 500 });
    const rows = res && res.data && res.data.data ? res.data.data : (res && res.data ? res.data : []);

    const byId = new Map();
    const byName = new Map();

    rows.forEach(function (r) {
      if (!r) return;
      const id = r.class_id != null ? String(r.class_id) : '';
      const uuid = r.uuid ? String(r.uuid) : '';
      const name = r.class_name ? String(r.class_name).trim().toLowerCase() : '';
      if (id && uuid) byId.set(id, uuid);
      if (name && uuid && !byName.has(name)) byName.set(name, uuid);
    });

    classMapCache = { byId: byId, byName: byName };
    return classMapCache;
  }

  function getParentIdFromUser() {
    const u = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    if (!u) return null;
    return u.parent_id || u.id || null;
  }

  async function loadChildren() {
    const statsRes = await DashboardAPI.getParentStats();
    const statsChildren = Array.isArray(statsRes && statsRes.data && statsRes.data.children_data)
      ? statsRes.data.children_data
      : [];

    const byId = new Map();
    statsChildren.forEach(function (c) {
      const key = String(c.student_id || '');
      if (key) byId.set(key, Object.assign({}, c));
    });

    const parentId = getParentIdFromUser();
    if (parentId) {
      try {
        const detailRes = await ParentAPI.getStudents(parentId);
        const detailRows = Array.isArray(detailRes && detailRes.data) ? detailRes.data : (Array.isArray(detailRes) ? detailRes : []);
        detailRows.forEach(function (r) {
          const sid = String(r.student_id || r.id || '');
          if (!sid) return;
          const existing = byId.get(sid) || { student_id: sid };
          byId.set(sid, Object.assign({}, r, existing, {
            student_id: Number(sid),
            student_uuid: r.student_uuid || r.uuid || existing.student_uuid || existing.uuid || null,
            class_id: r.class_id || existing.class_id || null,
            class_name: r.class_name || existing.class_name || null,
            full_name: existing.full_name || [r.first_name, r.last_name].filter(Boolean).join(' '),
            first_name: existing.first_name || r.first_name || null,
            last_name: existing.last_name || r.last_name || null,
          }));
        });
      } catch (e) {
        console.warn('Parent student details fallback failed', e);
      }
    }

    S.children = Array.from(byId.values()).sort(function (a, b) {
      return childName(a).localeCompare(childName(b));
    });

    const preferred = sessionStorage.getItem('parent:selectedChildId') || '';
    if (preferred && S.children.some(function (c) { return String(c.student_id) === String(preferred); })) {
      S.selectedChildId = String(preferred);
    } else if (S.children.length) {
      S.selectedChildId = String(S.children[0].student_id);
    } else {
      S.selectedChildId = '';
    }
  }

  function populateChildSelector() {
    const dom = getDom();
    if (!dom.childInput) return;

    if (!S.children.length) {
      dom.childInput.innerHTML = '<option value="">No linked children</option>';
      dom.childInput.value = '';
      return;
    }

    dom.childInput.innerHTML = S.children.map(function (c) {
      return '<option value="' + esc(String(c.student_id)) + '">' + esc(childName(c)) + '</option>';
    }).join('');
    dom.childInput.value = S.selectedChildId;
  }

  function pickPrimaryClassFromCourses(courses) {
    const rows = Array.isArray(courses) ? courses : [];
    if (!rows.length) return null;

    const byClass = new Map();
    rows.forEach(function (c) {
      const key = String(c.class_id || '');
      if (!key) return;
      if (!byClass.has(key)) byClass.set(key, { count: 0, row: c });
      const item = byClass.get(key);
      item.count += 1;
      if (!item.row || item.count > 1) item.row = c;
    });

    let best = null;
    byClass.forEach(function (v) {
      if (!best || v.count > best.count) best = v;
    });

    return best ? best.row : rows[0];
  }

  async function resolveChildClassUuid(child) {
    const classMap = await loadClassMap();

    if (child.class_uuid) {
      return { classUuid: String(child.class_uuid), className: String(child.class_name || '') };
    }

    if (child.class_id != null) {
      const byId = classMap.byId.get(String(child.class_id));
      if (byId) return { classUuid: byId, className: String(child.class_name || '') };
    }

    if (child.class_name) {
      const byName = classMap.byName.get(String(child.class_name).trim().toLowerCase());
      if (byName) return { classUuid: byName, className: String(child.class_name || '') };
    }

    const studentUuid = child.student_uuid || child.uuid || null;
    if (!studentUuid) return { classUuid: '', className: '' };

    const courseRes = await API.get(API_ENDPOINTS.STUDENT_COURSES(studentUuid));
    const rawCourses = Array.isArray(courseRes && courseRes.data) ? courseRes.data : (Array.isArray(courseRes) ? courseRes : []);
    const primary = pickPrimaryClassFromCourses(rawCourses);
    if (!primary) return { classUuid: '', className: '' };

    const courseClassId = primary.class_id != null ? String(primary.class_id) : '';
    if (courseClassId && classMap.byId.has(courseClassId)) {
      return {
        classUuid: classMap.byId.get(courseClassId),
        className: String(primary.class_name || child.class_name || ''),
      };
    }

    return { classUuid: '', className: String(primary.class_name || child.class_name || '') };
  }

  async function loadSelectedChildSchedule() {
    const child = S.children.find(function (c) { return String(c.student_id) === String(S.selectedChildId); });
    if (!child) {
      S.entries = [];
      S.classUuid = '';
      S.className = '';
      return;
    }

    const classInfo = await resolveChildClassUuid(child);
    S.classUuid = classInfo.classUuid;
    S.className = classInfo.className || String(child.class_name || '');

    if (!S.classUuid) {
      S.entries = [];
      return;
    }

    const schRes = await ClassScheduleAPI.getByClass(S.classUuid);
    const raw = Array.isArray(schRes && schRes.data) ? schRes.data : (Array.isArray(schRes) ? schRes : []);

    S.entries = raw.map(function (item) {
      return {
        schedule_id: item.schedule_id,
        day_of_week: normalizeDay(item.day_of_week),
        start_time: item.start_time || '',
        end_time: item.end_time || '',
        room: item.room || '',
        subject_name: item.subject_name || '',
        subject_code: item.subject_code || '',
        teacher_name: item.teacher_name || '',
      };
    }).filter(function (row) {
      return DAY_ORDER.indexOf(row.day_of_week) >= 0;
    }).sort(sortEntries);
  }

  async function refreshAll() {
    const dom = getDom();
    if (!dom.root) return;

    setLoading('Loading children...');
    await loadChildren();
    populateChildSelector();

    if (!S.selectedChildId) {
      S.entries = [];
      render();
      return;
    }

    setLoading('Loading timetable...');
    await loadSelectedChildSchedule();
    render();
  }

  async function reloadScheduleOnly() {
    if (!S.selectedChildId) {
      S.entries = [];
      render();
      return;
    }

    setLoading('Refreshing timetable...');
    await loadSelectedChildSchedule();
    render();
  }

  function buildExportRows() {
    if (S.view === 'daily') return currentRowsForView();
    return S.entries.slice();
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

    downloadCsv(rows, 'parent-timetable-' + toDateInputValue(new Date()) + '.csv');
    toast('Timetable exported to CSV.', 'success');
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
        const btn = e.target.closest('.ptt-view-btn');
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

    if (dom.childInput) {
      dom.childInput.addEventListener('change', function () {
        S.selectedChildId = dom.childInput.value || '';
        if (S.selectedChildId) sessionStorage.setItem('parent:selectedChildId', S.selectedChildId);
        reloadScheduleOnly().catch(function (err) {
          console.error('Child timetable load failed', err);
          toast(err && err.message ? err.message : 'Failed to load child timetable.', 'error');
          setEmpty('Unable to load timetable right now.');
        });
      });
    }

    if (dom.refreshBtn) {
      dom.refreshBtn.addEventListener('click', function () {
        reloadScheduleOnly().catch(function (err) {
          console.error('Timetable refresh failed', err);
          toast(err && err.message ? err.message : 'Failed to refresh timetable.', 'error');
          setEmpty('Unable to refresh timetable.');
        });
      });
    }

    if (dom.exportPdfBtn) dom.exportPdfBtn.addEventListener('click', renderOrNotifyExportPdf);
    if (dom.exportCsvBtn) dom.exportCsvBtn.addEventListener('click', renderOrNotifyExportCsv);
  }

  function init() {
    const dom = getDom();
    if (!dom.root) return;

    wire();

    refreshAll().catch(function (err) {
      console.error('Parent timetable init failed', err);
      setEmpty('Failed to load timetable: ' + (err && err.message ? err.message : 'Unknown error'));
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
