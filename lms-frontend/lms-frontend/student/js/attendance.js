/* ============================================
   Student Attendance Page
   SPA fragment: student/page/attendance.html
============================================ */
(function () {
  'use strict';

  const S = {
    all: [],          // raw attendance rows from API
    filtered: [],     // after subject / year filter
    calYear: null,    // currently displayed calendar year
    calMonth: null,   // currently displayed calendar month (0-based)
    trendChart: null, // Chart.js instance
  };

  /* ── Helpers ───────────────────────────────────────────────── */
  function esc(v) {
    return typeof escHtml === 'function'
      ? escHtml(String(v ?? ''))
      : String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function toast(msg, type = 'info') {
    if (typeof showToast === 'function') showToast(msg, type);
  }

  function getStudentId() {
    const u = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    return u?.student_id || null;
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

  /* ── Data loading ──────────────────────────────────────────── */
  async function loadData() {
    const studentId = getStudentId();
    if (!studentId) {
      toast('Unable to identify student. Please refresh.', 'error');
      return;
    }

    try {
      const res = await API.get(API_ENDPOINTS.STUDENT_ATTENDANCE(studentId));
      const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      S.all = rows;
      populateFilters(rows);
      applyFilter();
    } catch (e) {
      console.error('Failed to load attendance', e);
      toast(e.message || 'Failed to load attendance data', 'error');
      setLoadingError();
    }
  }

  /* ── Filter population ─────────────────────────────────────── */
  function populateFilters(rows) {
    // Subject filter
    const subjectSel = document.getElementById('satSubjectFilter');
    if (subjectSel) {
      const subjects = new Map();
      rows.forEach(r => {
        const id = String(r.course_id);
        const name = r.course_name || r.subject_name || `Course ${id}`;
        subjects.set(id, name);
      });
      const prevSub = subjectSel.value;
      subjectSel.innerHTML = '<option value="">All Subjects</option>';
      subjects.forEach((name, id) => {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = name;
        subjectSel.appendChild(o);
      });
      if (prevSub) subjectSel.value = prevSub;
    }

    // Year filter
    const yearSel = document.getElementById('satYearFilter');
    if (yearSel) {
      const years = new Set();
      rows.forEach(r => {
        const y = String(r.attendance_date || '').slice(0, 4);
        if (y) years.add(y);
      });
      const prevYear = yearSel.value;
      yearSel.innerHTML = '<option value="">All Time</option>';
      Array.from(years).sort((a, b) => b - a).forEach(y => {
        const o = document.createElement('option');
        o.value = y;
        o.textContent = y;
        yearSel.appendChild(o);
      });
      if (prevYear) yearSel.value = prevYear;
    }
  }

  /* ── Filter / re-render ────────────────────────────────────── */
  function applyFilter() {
    const subject = document.getElementById('satSubjectFilter')?.value || '';
    const year    = document.getElementById('satYearFilter')?.value || '';

    S.filtered = S.all.filter(r => {
      if (subject && String(r.course_id) !== subject) return false;
      if (year   && !String(r.attendance_date).startsWith(year)) return false;
      return true;
    });

    renderStats(S.filtered);
    renderCalendar(S.filtered);
    renderSubjectTable(S.filtered);
    renderMonthlySummary(S.filtered);
    renderTrend(S.filtered);
    renderReasons(S.filtered);
    renderHistory(S.filtered);
  }

  /* ── Stats strip ───────────────────────────────────────────── */
  function renderStats(rows) {
    let total = rows.length, present = 0, absent = 0, late = 0, excused = 0;
    rows.forEach(r => {
      const s = String(r.status).toLowerCase();
      if (s === 'present')  present++;
      else if (s === 'absent') absent++;
      else if (s === 'late')   late++;
      else if (s === 'excused') excused++;
    });
    const pct = total ? Math.round((present / total) * 100) : 0;

    setText('satPct',     `${pct}%`);
    setText('satPresent', String(present));
    setText('satAbsent',  String(absent));
    setText('satLate',    String(late));
    setText('satExcused', String(excused));
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ── Calendar ──────────────────────────────────────────────── */
  function renderCalendar(rows) {
    const today = new Date();
    if (S.calYear === null) S.calYear  = today.getFullYear();
    if (S.calMonth === null) S.calMonth = today.getMonth();

    const statusByDate = new Map();
    rows.forEach(r => {
      const d = String(r.attendance_date || '').slice(0, 10);
      if (!d) return;
      // Use the most "severe" status if multiple records on same day (multiple subjects)
      const s = String(r.status).toLowerCase();
      const prev = statusByDate.get(d);
      const severity = { absent: 3, late: 2, excused: 1, present: 0 };
      if (!prev || (severity[s] ?? -1) > (severity[prev] ?? -1)) {
        statusByDate.set(d, s);
      }
    });

    const labelEl = document.getElementById('satCalMonthLabel');
    const calEl   = document.getElementById('satCal');
    if (!labelEl || !calEl) return;

    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    labelEl.textContent = `${monthNames[S.calMonth]} ${S.calYear}`;

    // Remove old day cells (keep the 7 weekday headers)
    const headers = Array.from(calEl.children).slice(0, 7);
    calEl.innerHTML = '';
    headers.forEach(h => calEl.appendChild(h));

    const firstDay = new Date(S.calYear, S.calMonth, 1).getDay(); // Sun=0
    const daysInMonth = new Date(S.calYear, S.calMonth + 1, 0).getDate();
    const todayStr = today.toISOString().slice(0, 10);

    // leading blanks
    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'sat-day empty';
      calEl.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${S.calYear}-${String(S.calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const status  = statusByDate.get(dateStr) || '';
      const el      = document.createElement('div');
      let cls = 'sat-day';
      if (status) cls += ` ${status}`;
      if (dateStr === todayStr) cls += ' today';
      el.className = cls;
      el.textContent = String(d);
      if (status) el.title = status.charAt(0).toUpperCase() + status.slice(1);
      calEl.appendChild(el);
    }
  }

  /* ── Subject breakdown table ───────────────────────────────── */
  function renderSubjectTable(rows) {
    const tbody = document.getElementById('satSubjectTable');
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="sat-empty"><i class="fas fa-inbox"></i><br>No attendance records.</td></tr>';
      return;
    }

    const bySubject = new Map();
    rows.forEach(r => {
      const key = String(r.course_id);
      if (!bySubject.has(key)) {
        bySubject.set(key, {
          name: r.course_name || r.subject_name || `Course ${r.course_id}`,
          total: 0, present: 0, absent: 0, late: 0, excused: 0
        });
      }
      const s = bySubject.get(key);
      s.total++;
      const st = String(r.status).toLowerCase();
      if (st === 'present') s.present++;
      else if (st === 'absent') s.absent++;
      else if (st === 'late')   s.late++;
      else if (st === 'excused') s.excused++;
    });

    const subjects = Array.from(bySubject.values()).sort((a, b) => a.name.localeCompare(b.name));

    tbody.innerHTML = subjects.map(s => {
      const pct  = s.total ? Math.round((s.present / s.total) * 100) : 0;
      const fcls = pctFillClass(pct);
      return `
        <tr>
          <td>${esc(s.name)}</td>
          <td>${s.total}</td>
          <td class="present" style="color:#15803d;font-weight:600;">${s.present}</td>
          <td class="absent"  style="color:#b91c1c;font-weight:600;">${s.absent}</td>
          <td>
            <span class="sat-pct-bar"><span class="sat-pct-fill ${fcls}" style="width:${pct}%;"></span></span>
            <span style="margin-left:.4rem;font-weight:600;">${pct}%</span>
          </td>
        </tr>`;
    }).join('');
  }

  /* ── Monthly summary ───────────────────────────────────────── */
  function renderMonthlySummary(rows) {
    const wrap = document.getElementById('satMonthlySummary');
    if (!wrap) return;

    if (!rows.length) {
      wrap.innerHTML = '<div class="sat-empty"><i class="fas fa-inbox"></i><br>No records.</div>';
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
      return `
        <div class="sat-month-card">
          <h5>${esc(label)}</h5>
          <div class="sat-mc-row"><span>Attendance</span><strong style="color:${pct >= 75 ? '#15803d' : pct >= 50 ? '#c2410c' : '#b91c1c'}">${pct}%</strong></div>
          <div class="sat-mc-row"><span>Present</span><span>${m.present}</span></div>
          <div class="sat-mc-row"><span>Absent</span><span>${m.absent}</span></div>
          <div class="sat-mc-row"><span>Late</span><span>${m.late}</span></div>
        </div>`;
    }).join('');
  }

  /* ── Trend chart ───────────────────────────────────────────── */
  function renderTrend(rows) {
    const canvas = document.getElementById('satTrendChart');
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
          label: 'Attendance %',
          data,
          tension: 0.35,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,.12)',
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#0ea5e9',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}%` } }
        }
      }
    });
  }

  /* ── Absence reasons ───────────────────────────────────────── */
  function renderReasons(rows) {
    const remarksRows = rows.filter(r => {
      const st = String(r.status).toLowerCase();
      return (st === 'absent' || st === 'late' || st === 'excused') && r.remarks;
    });

    const section = document.getElementById('satReasonsSection');
    const tbody   = document.getElementById('satReasonsTable');
    if (!section || !tbody) return;

    if (!remarksRows.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';
    tbody.innerHTML = remarksRows.sort((a, b) =>
      String(b.attendance_date).localeCompare(String(a.attendance_date))
    ).map(r => `
      <tr>
        <td>${esc(fmtDate(r.attendance_date))}</td>
        <td>${esc(r.course_name || r.subject_name || `Course ${r.course_id}`)}</td>
        <td><span class="sat-badge ${esc(String(r.status).toLowerCase())}">${esc(r.status)}</span></td>
        <td>${esc(r.remarks || '—')}</td>
      </tr>`).join('');
  }

  /* ── History table (with extra filters) ───────────────────── */
  function renderHistory(rows) {
    applyHistoryFilter(rows);
  }

  function applyHistoryFilter(baseRows) {
    const start  = document.getElementById('satHistStart')?.value  || '';
    const end    = document.getElementById('satHistEnd')?.value    || '';
    const status = document.getElementById('satHistStatus')?.value || '';

    let filtered = (baseRows || S.filtered).filter(r => {
      const d = String(r.attendance_date || '').slice(0, 10);
      if (start  && d < start) return false;
      if (end    && d > end)   return false;
      if (status && String(r.status).toLowerCase() !== status) return false;
      return true;
    });

    filtered.sort((a, b) => String(b.attendance_date).localeCompare(String(a.attendance_date)));

    const tbody = document.getElementById('satHistoryTable');
    if (!tbody) return;

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="sat-empty"><i class="fas fa-inbox"></i><br>No matching records.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(r => `
      <tr>
        <td>${esc(fmtDate(r.attendance_date))}</td>
        <td>${esc(r.course_name || r.subject_name || `Course ${r.course_id}`)}</td>
        <td><span class="sat-badge ${esc(String(r.status).toLowerCase())}">${esc(r.status)}</span></td>
        <td>${esc(r.remarks || '—')}</td>
      </tr>`).join('');
  }

  /* ── PDF export ────────────────────────────────────────────── */
  function exportPdf() {
    // Ensure jsPDF is available globally (for UMD build)
    if (typeof jsPDF === 'undefined' && typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
      window.jsPDF = window.jspdf.jsPDF;
    }
    if (typeof jsPDF === 'undefined') {
      toast('PDF export requires jsPDF library.', 'error');
      return;
    }
    const rows = S.filtered.slice().sort((a, b) =>
      String(b.attendance_date).localeCompare(String(a.attendance_date)));

    const doc = new jsPDF({ orientation: 'landscape' });
    const header = ['Date', 'Subject', 'Status', 'Remarks'];
    const data = rows.map(r => [
      String(r.attendance_date || '').slice(0, 10),
      r.course_name || r.subject_name || String(r.course_id),
      r.status,
      r.remarks || ''
    ]);

    // Title
    doc.setFontSize(16);
    doc.text('Attendance Report', 14, 14);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    // Table
    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: [header],
        body: data,
        startY: 28,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [14, 165, 233] },
        margin: { left: 14, right: 14 }
      });
    } else {
      // Fallback: simple text rows
      let y = 32;
      doc.setFont('courier', 'normal');
      doc.text(header.join(' | '), 14, y);
      y += 8;
      data.forEach(row => {
        doc.text(row.join(' | '), 14, y);
        y += 8;
      });
    }

    doc.save(`attendance_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /* ── Error state ───────────────────────────────────────────── */
  function setLoadingError() {
    ['satSubjectTable', 'satMonthlySummary', 'satHistoryTable'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<tr><td colspan="99" class="sat-error"><i class="fas fa-triangle-exclamation"></i><br>Failed to load data</td></tr>';
    });
  }

  /* ── Calendar navigation ───────────────────────────────────── */
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

  /* ── Init ──────────────────────────────────────────────────── */
  function init() {
    const root = document.getElementById('studentAttendancePageRoot');
    if (!root || root.dataset.inited === '1') return;
    root.dataset.inited = '1';

    document.getElementById('satRefreshBtn')   ?.addEventListener('click', () => {
      S.trendChart?.destroy(); S.trendChart = null;
      S.calYear = null; S.calMonth = null;
      loadData();
    });
    document.getElementById('satSubjectFilter')?.addEventListener('change', applyFilter);
    document.getElementById('satYearFilter')   ?.addEventListener('change', applyFilter);
    document.getElementById('satCalPrev')      ?.addEventListener('click', calPrev);
    document.getElementById('satCalNext')      ?.addEventListener('click', calNext);
    document.getElementById('satHistFilterBtn')?.addEventListener('click', () => applyHistoryFilter());
    document.getElementById('satExportBtn')    ?.addEventListener('click', exportPdf);

    loadData();
  }

  document.addEventListener('page:loaded', (e) => {
    if (e.detail?.page === 'attendance') init();
  });
})();
