/* ============================================
   Parent Attendance Page
   SPA fragment: parent/page/attendance.html
============================================ */
(function () {
  'use strict';

  const S = {
    children:   [],      // [{student_id, name, …}]
    childId:    null,    // selected student_id
    all:        [],      // raw attendance rows for selected child
    filtered:   [],      // after subject / year filter
    calYear:    null,
    calMonth:   null,
    trendChart: null,
  };

  /* ── Helpers ──────────────────────────────────────────────── */
  function esc(v) {
    return typeof escHtml === 'function'
      ? escHtml(String(v ?? ''))
      : String(v ?? '').replace(/[&<>"']/g, c => ({
          '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[c]));
  }

  function toast(msg, type = 'info') {
    if (typeof showToast === 'function') showToast(msg, type);
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr).slice(0, 10);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function pctFillClass(n) {
    if (n >= 75) return 'good';
    if (n >= 50) return 'warn';
    return 'bad';
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ── Get parent's children ──────────────────────────────── */
  async function loadChildren() {
    // Prefer dashboard cache if available
    if (typeof cachedChildrenData !== 'undefined' && Array.isArray(cachedChildrenData) && cachedChildrenData.length) {
      S.children = cachedChildrenData;
      return;
    }
    // Fallback: fetch from API using parent_id on the user object
    const user = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    const parentId = user?.parent_id || user?.id;
    if (!parentId) return;
    try {
      const res = await API.get(API_ENDPOINTS.PARENT_STUDENTS(parentId));
      const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      S.children = rows.map(r => ({
        student_id: r.student_id || r.id,
        full_name:  r.full_name  || null,
        first_name: r.first_name || null,
        last_name:  r.last_name  || null,
        name:       r.name       || null,
      }));
    } catch (e) {
      console.error('Failed to load children', e);
    }
  }

  /* ── Populate child selector ───────────────────────────── */
  function childDisplayName(c) {
    return c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.name || `Student ${c.student_id}`;
  }

  function populateChildSelector() {
    const sel = document.getElementById('patChildSelector');
    if (!sel) return;
    if (!S.children.length) {
      sel.innerHTML = '<option value="">No children linked</option>';
      return;
    }
    sel.innerHTML = S.children.map(c =>
      `<option value="${esc(String(c.student_id))}">${esc(childDisplayName(c))}</option>`
    ).join('');
    // Default to first child
    S.childId = String(S.children[0].student_id);
    sel.value = S.childId;
  }

  /* ── Load attendance for selected child ─────────────────── */
  async function loadData() {
    if (!S.childId) {
      toast('Please select a child to view attendance.', 'info');
      return;
    }
    try {
      const res = await API.get(API_ENDPOINTS.STUDENT_ATTENDANCE(S.childId));
      const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      S.all = rows;
      S.calYear = null; S.calMonth = null;
      if (S.trendChart) { S.trendChart.destroy(); S.trendChart = null; }
      populateFilters(rows);
      applyFilter();
    } catch (e) {
      console.error('Failed to load attendance', e);
      toast(e.message || 'Failed to load attendance data.', 'error');
      setLoadingError();
    }
  }

  /* ── Filter population ──────────────────────────────────── */
  function populateFilters(rows) {
    const subjectSel = document.getElementById('patSubjectFilter');
    if (subjectSel) {
      const subjects = new Map();
      rows.forEach(r => {
        const id = String(r.course_id);
        subjects.set(id, r.course_name || r.subject_name || `Course ${id}`);
      });
      const prev = subjectSel.value;
      subjectSel.innerHTML = '<option value="">All Subjects</option>';
      subjects.forEach((name, id) => {
        const o = document.createElement('option');
        o.value = id; o.textContent = name;
        subjectSel.appendChild(o);
      });
      if (prev) subjectSel.value = prev;
    }

    const yearSel = document.getElementById('patYearFilter');
    if (yearSel) {
      const years = new Set();
      rows.forEach(r => {
        const y = String(r.attendance_date || '').slice(0, 4);
        if (y) years.add(y);
      });
      const prev = yearSel.value;
      yearSel.innerHTML = '<option value="">All Time</option>';
      Array.from(years).sort((a, b) => b - a).forEach(y => {
        const o = document.createElement('option');
        o.value = y; o.textContent = y;
        yearSel.appendChild(o);
      });
      if (prev) yearSel.value = prev;
    }
  }

  /* ── Apply filters & re-render ──────────────────────────── */
  function applyFilter() {
    const subject = document.getElementById('patSubjectFilter')?.value || '';
    const year    = document.getElementById('patYearFilter')?.value   || '';

    S.filtered = S.all.filter(r => {
      if (subject && String(r.course_id) !== subject) return false;
      if (year    && !String(r.attendance_date).startsWith(year)) return false;
      return true;
    });

    renderStats(S.filtered);
    renderAlerts(S.filtered);
    renderCalendar(S.filtered);
    renderSubjectTable(S.filtered);
    renderTrend(S.filtered);
    renderCompare(S.filtered);
    renderMonthlySummary(S.filtered);
    renderHistory(S.filtered);
  }

  /* ── Stat strip ─────────────────────────────────────────── */
  function renderStats(rows) {
    let total = rows.length, present = 0, absent = 0, late = 0, excused = 0;
    rows.forEach(r => {
      const s = String(r.status).toLowerCase();
      if (s === 'present')  present++;
      else if (s === 'absent')  absent++;
      else if (s === 'late')    late++;
      else if (s === 'excused') excused++;
    });
    const pct = total ? Math.round((present / total) * 100) : 0;
    setText('patPct',     `${pct}%`);
    setText('patPresent', String(present));
    setText('patAbsent',  String(absent));
    setText('patLate',    String(late));
    setText('patExcused', String(excused));
  }

  /* ── Absence alerts ─────────────────────────────────────── */
  function renderAlerts(rows) {
    const el = document.getElementById('patAlertsList');
    if (!el) return;

    const recent = rows
      .filter(r => {
        const s = String(r.status).toLowerCase();
        return s === 'absent' || s === 'late';
      })
      .sort((a, b) => String(b.attendance_date).localeCompare(String(a.attendance_date)))
      .slice(0, 8);

    if (!recent.length) {
      el.innerHTML = `<div class="pat-empty" style="padding:.6rem 0">
        <i class="fas fa-check-circle" style="color:#22c55e;font-size:1.6rem;"></i><br>No recent absences or late arrivals.
      </div>`;
      return;
    }

    el.innerHTML = recent.map(r => {
      const s = String(r.status).toLowerCase();
      const cls = s === 'late' ? 'late' : '';
      const icon = s === 'late' ? 'fa-clock' : 'fa-circle-xmark';
      const sub = r.course_name || r.subject_name || `Course ${r.course_id}`;
      return `<div class="pat-alert ${cls}">
        <i class="fas ${icon}"></i>
        <div>
          <strong>${esc(fmtDate(r.attendance_date))}</strong> — ${esc(sub)}
          <span class="pat-badge ${esc(s)}" style="margin-left:.4rem;">${esc(r.status)}</span>
          ${r.remarks ? `<br><span style="color:#64748b;font-size:.78rem;">${esc(r.remarks)}</span>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  /* ── Calendar ───────────────────────────────────────────── */
  function renderCalendar(rows) {
    const today = new Date();
    if (S.calYear === null)  S.calYear  = today.getFullYear();
    if (S.calMonth === null) S.calMonth = today.getMonth();

    const statusByDate = new Map();
    rows.forEach(r => {
      const d = String(r.attendance_date || '').slice(0, 10);
      if (!d) return;
      const s = String(r.status).toLowerCase();
      const prev = statusByDate.get(d);
      const severity = { absent: 3, late: 2, excused: 1, present: 0 };
      if (!prev || (severity[s] ?? -1) > (severity[prev] ?? -1)) statusByDate.set(d, s);
    });

    const labelEl = document.getElementById('patCalMonthLabel');
    const calEl   = document.getElementById('patCal');
    if (!labelEl || !calEl) return;

    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    labelEl.textContent = `${monthNames[S.calMonth]} ${S.calYear}`;

    const headers = Array.from(calEl.children).slice(0, 7);
    calEl.innerHTML = '';
    headers.forEach(h => calEl.appendChild(h));

    const firstDay = new Date(S.calYear, S.calMonth, 1).getDay();
    const daysInMonth = new Date(S.calYear, S.calMonth + 1, 0).getDate();
    const todayStr = today.toISOString().slice(0, 10);

    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'pat-day empty';
      calEl.appendChild(el);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${S.calYear}-${String(S.calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const status  = statusByDate.get(dateStr) || '';
      const el      = document.createElement('div');
      let cls = 'pat-day';
      if (status) cls += ` ${status}`;
      if (dateStr === todayStr) cls += ' today';
      el.className = cls;
      el.textContent = String(d);
      if (status) el.title = status.charAt(0).toUpperCase() + status.slice(1);
      calEl.appendChild(el);
    }
  }

  /* ── Subject table ──────────────────────────────────────── */
  function renderSubjectTable(rows) {
    const tbody = document.getElementById('patSubjectTable');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="pat-empty"><i class="fas fa-inbox"></i><br>No attendance records.</td></tr>';
      return;
    }
    const bySubject = new Map();
    rows.forEach(r => {
      const key = String(r.course_id);
      if (!bySubject.has(key)) bySubject.set(key, {
        name: r.course_name || r.subject_name || `Course ${r.course_id}`,
        total: 0, present: 0, absent: 0, late: 0, excused: 0
      });
      const s = bySubject.get(key);
      s.total++;
      const st = String(r.status).toLowerCase();
      if (st === 'present')  s.present++;
      else if (st === 'absent')  s.absent++;
      else if (st === 'late')    s.late++;
      else if (st === 'excused') s.excused++;
    });
    const subjects = Array.from(bySubject.values()).sort((a, b) => a.name.localeCompare(b.name));
    tbody.innerHTML = subjects.map(s => {
      const pct  = s.total ? Math.round((s.present / s.total) * 100) : 0;
      const fcls = pctFillClass(pct);
      return `<tr>
        <td>${esc(s.name)}</td>
        <td>${s.total}</td>
        <td style="color:#15803d;font-weight:600;">${s.present}</td>
        <td style="color:#b91c1c;font-weight:600;">${s.absent}</td>
        <td>
          <span class="pat-pct-bar"><span class="pat-pct-fill ${fcls}" style="width:${pct}%;"></span></span>
          <span style="margin-left:.4rem;font-weight:600;">${pct}%</span>
        </td>
      </tr>`;
    }).join('');
  }

  /* ── Trend chart ─────────────────────────────────────────── */
  function renderTrend(rows) {
    const canvas = document.getElementById('patTrendChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const byMonth = new Map();
    rows.forEach(r => {
      const ym = String(r.attendance_date || '').slice(0, 7);
      if (!ym) return;
      if (!byMonth.has(ym)) byMonth.set(ym, { total: 0, present: 0 });
      const m = byMonth.get(ym);
      m.total++;
      if (String(r.status).toLowerCase() === 'present') m.present++;
    });
    const sorted = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sorted.map(([ym]) => {
      const [y, mo] = ym.split('-');
      return new Date(Number(y), Number(mo) - 1, 1).toLocaleString('en', { month: 'short', year: '2-digit' });
    });
    const data = sorted.map(([, m]) => m.total ? Math.round((m.present / m.total) * 100) : 0);

    if (S.trendChart) {
      S.trendChart.data.labels = labels;
      S.trendChart.data.datasets[0].data = data;
      S.trendChart.update();
      return;
    }
    S.trendChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Attendance %', data,
          tension: 0.35, borderColor: '#a855f7',
          backgroundColor: 'rgba(168,85,247,.12)', fill: true,
          pointRadius: 4, pointBackgroundColor: '#a855f7',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } } },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}%` } }
        }
      }
    });
  }

  /* ── Compare with class average ──────────────────────────── */
  function renderCompare(rows) {
    const body = document.getElementById('patCompareBody');
    if (!body) return;

    if (!rows.length) {
      body.innerHTML = '<div class="pat-empty"><i class="fas fa-inbox"></i><br>No data available.</div>';
      return;
    }

    // Overall rate for this child
    const total   = rows.length;
    const present = rows.filter(r => String(r.status).toLowerCase() === 'present').length;
    const childPct = total ? Math.round((present / total) * 100) : 0;

    // Class average from API response if provided, otherwise use a contextual figure
    // We'll use the child's own data grouped by subject and show their rate vs a 75% benchmark
    const bySubject = new Map();
    rows.forEach(r => {
      const key = String(r.course_id);
      if (!bySubject.has(key)) bySubject.set(key, {
        name: r.course_name || r.subject_name || `Course ${r.course_id}`,
        total: 0, present: 0,
        class_avg: Number(r.class_attendance_rate) || null,
      });
      const s = bySubject.get(key);
      s.total++;
      if (String(r.status).toLowerCase() === 'present') s.present++;
      if (r.class_attendance_rate && !s.class_avg) s.class_avg = Number(r.class_attendance_rate);
    });

    const subjects = Array.from(bySubject.values()).sort((a, b) => a.name.localeCompare(b.name));
    const hasClassAvg = subjects.some(s => s.class_avg !== null);

    // Overall row
    body.innerHTML = `
      <div style="margin-bottom:.85rem;">
        <div class="pat-compare-row">
          <span class="pat-compare-label" style="font-weight:700;color:#0f172a;">Overall</span>
          <div style="flex:1;"></div>
        </div>
        <div class="pat-compare-row">
          <span class="pat-compare-label">This child</span>
          <div class="pat-compare-bar-bg">
            <div class="pat-compare-fill" style="width:${childPct}%;background:#a855f7;"></div>
          </div>
          <span class="pat-compare-val" style="color:#7e22ce;">${childPct}%</span>
        </div>
        ${hasClassAvg ? '' : `<div class="pat-compare-row">
          <span class="pat-compare-label">School target</span>
          <div class="pat-compare-bar-bg">
            <div class="pat-compare-fill" style="width:75%;background:#94a3b8;"></div>
          </div>
          <span class="pat-compare-val" style="color:#64748b;">75%</span>
        </div>`}
      </div>
      <div style="font-size:.78rem;font-weight:600;color:#475569;margin-bottom:.45rem;">By Subject</div>
      ${subjects.slice(0, 6).map(s => {
        const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
        const avg = s.class_avg !== null ? Math.round(s.class_avg) : null;
        return `
          <div style="margin-bottom:.5rem;">
            <div style="font-size:.76rem;color:#334155;margin-bottom:.18rem;">${esc(s.name)}</div>
            <div class="pat-compare-row" style="margin-bottom:.1rem;">
              <span class="pat-compare-label" style="font-size:.74rem;">Child</span>
              <div class="pat-compare-bar-bg">
                <div class="pat-compare-fill" style="width:${pct}%;background:#a855f7;"></div>
              </div>
              <span class="pat-compare-val" style="color:#7e22ce;font-size:.78rem;">${pct}%</span>
            </div>
            ${avg !== null ? `<div class="pat-compare-row">
              <span class="pat-compare-label" style="font-size:.74rem;">Class avg</span>
              <div class="pat-compare-bar-bg">
                <div class="pat-compare-fill" style="width:${avg}%;background:#94a3b8;"></div>
              </div>
              <span class="pat-compare-val" style="color:#64748b;font-size:.78rem;">${avg}%</span>
            </div>` : ''}
          </div>`;
      }).join('')}`;
  }

  /* ── Monthly summary ─────────────────────────────────────── */
  function renderMonthlySummary(rows) {
    const wrap = document.getElementById('patMonthlySummary');
    if (!wrap) return;
    if (!rows.length) {
      wrap.innerHTML = '<div class="pat-empty"><i class="fas fa-inbox"></i><br>No records.</div>';
      return;
    }
    const byMonth = new Map();
    rows.forEach(r => {
      const ym = String(r.attendance_date || '').slice(0, 7);
      if (!ym) return;
      if (!byMonth.has(ym)) byMonth.set(ym, { total: 0, present: 0, absent: 0, late: 0 });
      const m = byMonth.get(ym);
      m.total++;
      const st = String(r.status).toLowerCase();
      if (st === 'present') m.present++;
      else if (st === 'absent') m.absent++;
      else if (st === 'late')   m.late++;
    });
    const months = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    wrap.innerHTML = months.map(([ym, m]) => {
      const pct = m.total ? Math.round((m.present / m.total) * 100) : 0;
      const [y, mo] = ym.split('-');
      const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleString('en', { month: 'short', year: 'numeric' });
      return `<div class="pat-month-card">
        <h5>${esc(label)}</h5>
        <div class="pat-mc-row"><span>Attendance</span><strong style="color:${pct>=75?'#15803d':pct>=50?'#c2410c':'#b91c1c'}">${pct}%</strong></div>
        <div class="pat-mc-row"><span>Present</span><span>${m.present}</span></div>
        <div class="pat-mc-row"><span>Absent</span><span>${m.absent}</span></div>
        <div class="pat-mc-row"><span>Late</span><span>${m.late}</span></div>
      </div>`;
    }).join('');
  }

  /* ── History table ───────────────────────────────────────── */
  function renderHistory(rows) { applyHistoryFilter(rows); }

  function applyHistoryFilter(baseRows) {
    const start  = document.getElementById('patHistStart')?.value  || '';
    const end    = document.getElementById('patHistEnd')?.value    || '';
    const status = document.getElementById('patHistStatus')?.value || '';

    let filtered = (baseRows || S.filtered).filter(r => {
      const d = String(r.attendance_date || '').slice(0, 10);
      if (start  && d < start) return false;
      if (end    && d > end)   return false;
      if (status && String(r.status).toLowerCase() !== status) return false;
      return true;
    });
    filtered.sort((a, b) => String(b.attendance_date).localeCompare(String(a.attendance_date)));

    const tbody = document.getElementById('patHistoryTable');
    if (!tbody) return;
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="pat-empty"><i class="fas fa-inbox"></i><br>No matching records.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(r => `
      <tr>
        <td>${esc(fmtDate(r.attendance_date))}</td>
        <td>${esc(r.course_name || r.subject_name || `Course ${r.course_id}`)}</td>
        <td><span class="pat-badge ${esc(String(r.status).toLowerCase())}">${esc(r.status)}</span></td>
        <td>${esc(r.remarks || '—')}</td>
      </tr>`).join('');
  }

  /* ── PDF export ──────────────────────────────────────────── */
  function exportPdf() {
    if (typeof jsPDF === 'undefined' && typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
      window.jsPDF = window.jspdf.jsPDF;
    }
    if (typeof jsPDF === 'undefined') {
      toast('PDF export requires jsPDF library.', 'error');
      return;
    }
    const rows = S.filtered.slice().sort((a, b) =>
      String(b.attendance_date).localeCompare(String(a.attendance_date)));

    const child = S.children.find(c => String(c.student_id) === String(S.childId));
    const childName = child ? childDisplayName(child) : 'Child';

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`Attendance Report — ${childName}`, 14, 14);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const header = ['Date', 'Subject', 'Status', 'Remarks'];
    const data = rows.map(r => [
      String(r.attendance_date || '').slice(0, 10),
      r.course_name || r.subject_name || String(r.course_id),
      r.status,
      r.remarks || ''
    ]);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: [header], body: data, startY: 28,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [168, 85, 247] },
        margin: { left: 14, right: 14 }
      });
    } else {
      let y = 32;
      doc.setFont('courier', 'normal');
      doc.text(header.join(' | '), 14, y); y += 8;
      data.forEach(row => { doc.text(row.join(' | '), 14, y); y += 8; });
    }
    doc.save(`attendance_${childName.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  /* ── Calendar navigation ─────────────────────────────────── */
  function calPrev() {
    S.calMonth--;
    if (S.calMonth < 0) { S.calMonth = 11; S.calYear--; }
    renderCalendar(S.filtered);
  }
  function calNext() {
    S.calMonth++;
    if (S.calMonth > 11) { S.calMonth = 0; S.calYear++; }
    renderCalendar(S.filtered);
  }

  /* ── Error state ─────────────────────────────────────────── */
  function setLoadingError() {
    ['patSubjectTable', 'patMonthlySummary', 'patHistoryTable'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<tr><td colspan="99" class="pat-error"><i class="fas fa-triangle-exclamation"></i><br>Failed to load data</td></tr>';
    });
  }

  /* ── Init ────────────────────────────────────────────────── */
  async function init() {
    const root = document.getElementById('parentAttendancePageRoot');
    if (!root || root.dataset.inited === '1') return;
    root.dataset.inited = '1';

    await loadChildren();
    populateChildSelector();

    document.getElementById('patChildSelector')?.addEventListener('change', e => {
      S.childId = e.target.value || null;
      loadData();
    });
    document.getElementById('patSubjectFilter')?.addEventListener('change', applyFilter);
    document.getElementById('patYearFilter')   ?.addEventListener('change', applyFilter);
    document.getElementById('patCalPrev')      ?.addEventListener('click', calPrev);
    document.getElementById('patCalNext')      ?.addEventListener('click', calNext);
    document.getElementById('patHistFilterBtn')?.addEventListener('click', () => applyHistoryFilter());
    document.getElementById('patExportBtn')    ?.addEventListener('click', exportPdf);
    document.getElementById('patRefreshBtn')   ?.addEventListener('click', () => {
      if (S.trendChart) { S.trendChart.destroy(); S.trendChart = null; }
      S.calYear = null; S.calMonth = null;
      loadData();
    });

    await loadData();
  }

  document.addEventListener('page:loaded', e => {
    if (e.detail?.page === 'attendance') init();
  });
})();
