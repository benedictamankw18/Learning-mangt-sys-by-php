/* ============================================
   Grade Comparison Performance
============================================ */
(function () {
  'use strict';

  const state = {
    academicYears: [],
    semesters: [],
    classes: [],
    subjects: [],
    users: [],
    reports: [],
    scales: [],
    currentYearId: '',
    currentSemesterId: '',
    filters: {
      academic_year_id: '',
      semester_id: '',
      class_id: '',
      subject_id: '',
      status: '',
    },
    classChart: null,
    subjectChart: null,
    workflowChart: null,
    bandChart: null,
    activeBands: [],
  };

  const dom = {};

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof Auth !== 'undefined' && typeof Auth.requireAuth === 'function') {
      if (!Auth.requireAuth([USER_ROLES.ADMIN])) return;
    }

    bindDom();
    bindEvents();
    loadData();
  });

  function bindDom() {
    dom.refreshBtn = document.getElementById('compareRefreshBtn');
    dom.exportBtn = document.getElementById('compareExportBtn');
    dom.filters = {
      year: document.getElementById('cmpYear'),
      semester: document.getElementById('cmpSemester'),
      class: document.getElementById('cmpClass'),
      subject: document.getElementById('cmpSubject'),
      status: document.getElementById('cmpStatus'),
    };
    dom.metrics = {
      classes: document.getElementById('cmpMetricClasses'),
      subjects: document.getElementById('cmpMetricSubjects'),
      avgGpa: document.getElementById('cmpMetricAvgGpa'),
      best: document.getElementById('cmpMetricBest'),
    };
    dom.classList = document.getElementById('cmpClassList');
    dom.subjectList = document.getElementById('cmpSubjectList');
    dom.scaleList = document.getElementById('cmpScaleList');
    dom.tableBody = document.getElementById('cmpTableBody');
    dom.classCanvas = document.getElementById('classChart');
    dom.subjectCanvas = document.getElementById('subjectChart');
    dom.workflowCanvas = document.getElementById('workflowChart');
    dom.bandCanvas = document.getElementById('bandChart');
  }

  function bindEvents() {
    dom.refreshBtn?.addEventListener('click', function () {
      loadData(true);
    });

    dom.exportBtn?.addEventListener('click', exportComparison);

    Object.values(dom.filters).forEach(function (field) {
      field?.addEventListener('change', onFilterChange);
    });
  }

  async function loadData(forceReload) {
    if (state.loading && !forceReload) return;
    state.loading = true;
    showLoading();

    try {
      const params = readQueryDefaults();
      state.filters.academic_year_id = params.academic_year_id || state.filters.academic_year_id || '';
      state.filters.semester_id = params.semester_id || state.filters.semester_id || '';
      state.filters.class_id = params.class_id || state.filters.class_id || '';
      state.filters.subject_id = params.subject_id || state.filters.subject_id || '';
      state.filters.status = params.status || state.filters.status || '';

      const [yearsRes, semestersRes, classesRes, subjectsRes, usersRes, scalesRes] = await Promise.all([
        API.get('/api/academic-years', { limit: 200 }),
        API.get('/api/semesters', { limit: 200 }),
        ClassAPI.getAll ? ClassAPI.getAll({ limit: 500 }) : API.get(API_ENDPOINTS.CLASSES, { limit: 500 }),
        SubjectAPI.getAll ? SubjectAPI.getAll({ limit: 500 }) : API.get(API_ENDPOINTS.SUBJECTS, { limit: 500 }),
        UserAPI.getAll ? UserAPI.getAll({ limit: 500 }) : API.get(API_ENDPOINTS.USERS, { limit: 500 }),
        GradeScaleAPI.getAll ? GradeScaleAPI.getAll() : API.get(API_ENDPOINTS.GRADE_SCALES),
      ]);

      state.academicYears = toList(yearsRes);
      state.semesters = toList(semestersRes);
      state.classes = toList(classesRes);
      state.subjects = toList(subjectsRes);
      state.users = toList(usersRes);
      state.scales = toList(scalesRes);

      const currentYear = unwrapSingle(await API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT));
      const currentSemester = unwrapSingle(await API.get(API_ENDPOINTS.SEMESTER_CURRENT));
      state.currentYearId = String(currentYear?.academic_year_id || state.academicYears[0]?.academic_year_id || '');
      state.currentSemesterId = String(currentSemester?.semester_id || state.semesters[0]?.semester_id || '');

      if (!state.filters.academic_year_id) state.filters.academic_year_id = state.currentYearId;
      if (!state.filters.semester_id) state.filters.semester_id = state.currentSemesterId;

      populateFilters();
      await loadReports();
      renderAll();
    } catch (error) {
      showEmpty('Failed to load comparison data: ' + (error?.message || 'Unknown error'));
    } finally {
      state.loading = false;
    }
  }

  async function loadReports() {
    const params = {
      academic_year_id: state.filters.academic_year_id,
      semester_id: state.filters.semester_id,
      page: 1,
      limit: 60,
    };

    const res = await GradeReportAPI.getAll(params);
    const reports = toReportList(res);
    state.reports = reports;

    await hydrateReports(reports);
    state.activeBands = buildActiveBands(state.scales);
  }

  async function hydrateReports(reports) {
    const chunkSize = 8;
    for (let index = 0; index < reports.length; index += chunkSize) {
      const chunk = reports.slice(index, index + chunkSize);
      const details = await Promise.all(chunk.map(function (report) {
        return GradeReportAPI.getById(report.uuid).then(unwrapSingle).catch(function () { return null; });
      }));

      details.forEach(function (detail, offset) {
        const report = chunk[offset];
        if (!report || !detail) return;
        report.details = Array.isArray(detail.details) ? detail.details : [];
        report.generated_by = detail.generated_by ?? report.generated_by;
        report.Approved = detail.Approved ?? report.Approved;
        report.is_published = detail.is_published ?? report.is_published;
        report.principal_comment = detail.principal_comment ?? report.principal_comment;
      });
    }
  }

  function renderAll() {
    populateFilters();
    const filtered = getFilteredReports();
    const classRows = buildClassRows(filtered);
    const subjectRows = buildSubjectRows(filtered);
    const workflowRows = buildWorkflowRows(filtered);
    const bandRows = buildBandRows(filtered);

    renderMetrics(classRows, subjectRows, filtered);
    renderList(dom.classList, classRows, 'class');
    renderList(dom.subjectList, subjectRows, 'subject');
    renderScaleList();
    renderTable(classRows, subjectRows);
    renderCharts(classRows, subjectRows, workflowRows, bandRows);
  }

  function renderMetrics(classRows, subjectRows, filtered) {
    setText(dom.metrics.classes, String(classRows.length));
    setText(dom.metrics.subjects, String(subjectRows.length));

    const avgGpa = filtered.length ? filtered.reduce(function (sum, report) { return sum + toNumber(report.gpa); }, 0) / filtered.length : 0;
    setText(dom.metrics.avgGpa, formatNumber(avgGpa, 2));

    const bestClass = classRows[0];
    setText(dom.metrics.best, bestClass ? bestClass.name : '-');
  }

  function renderList(container, rows, kind) {
    if (!container) return;
    if (!rows.length) {
      container.innerHTML = '<div class="empty">No ' + kind + ' performance data found.</div>';
      return;
    }

    container.innerHTML = rows.slice(0, 6).map(function (row) {
      return '<div class="list-item"><span><strong>' + esc(row.name) + '</strong><br /><small>' + esc(row.count + ' report(s)') + '</small></span><span class="chip ' + esc(row.trendClass) + '">' + esc(formatNumber(row.average, 2)) + '</span></div>';
    }).join('');
  }

  function renderScaleList() {
    if (!dom.scaleList) return;
    const bands = state.activeBands[0] ? state.activeBands[0].rows : [];
    if (!bands.length) {
      dom.scaleList.innerHTML = '<div class="empty">No active grading scale available.</div>';
      return;
    }

    dom.scaleList.innerHTML = bands.map(function (band) {
      return '<div class="list-item"><span><strong>' + esc(band.grade || band.grade_letter || 'Band') + '</strong><br /><small>' + esc(formatRange(band.min_score, band.max_score)) + '</small></span><span class="chip muted">' + esc(band.Interpretation || band.remark || 'Configured') + '</span></div>';
    }).join('');
  }

  function renderTable(classRows, subjectRows) {
    if (!dom.tableBody) return;
    const rows = [];

    classRows.forEach(function (row) {
      rows.push('<tr><td>Class</td><td>' + esc(row.name) + '</td><td>' + esc(row.count) + '</td><td>' + esc(formatNumber(row.average, 2)) + '</td><td>' + esc(formatNumber(row.highest, 2)) + '</td><td>' + esc(formatNumber(row.lowest, 2)) + '</td></tr>');
    });

    subjectRows.forEach(function (row) {
      rows.push('<tr><td>Subject</td><td>' + esc(row.name) + '</td><td>' + esc(row.count) + '</td><td>' + esc(formatNumber(row.average, 2)) + '</td><td>' + esc(formatNumber(row.highest, 2)) + '</td><td>' + esc(formatNumber(row.lowest, 2)) + '</td></tr>');
    });

    dom.tableBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="6"><div class="empty">No filtered comparison data available.</div></td></tr>';
  }

  function renderCharts(classRows, subjectRows, workflowRows, bandRows) {
    if (typeof Chart === 'undefined') return;

    destroyCharts();

    state.classChart = new Chart(dom.classCanvas, {
      type: 'bar',
      data: {
        labels: classRows.map(function (row) { return row.name; }),
        datasets: [{
          label: 'Average GPA',
          data: classRows.map(function (row) { return row.average; }),
          backgroundColor: '#0f766e',
        }],
      },
      options: chartOptions('y'),
    });

    state.subjectChart = new Chart(dom.subjectCanvas, {
      type: 'radar',
      data: {
        labels: subjectRows.map(function (row) { return row.name; }),
        datasets: [{
          label: 'Average percentage',
          data: subjectRows.map(function (row) { return row.average; }),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.18)',
        }],
      },
      options: chartOptions(),
    });

    state.workflowChart = new Chart(dom.workflowCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Approved', 'Published', 'Needs correction'],
        datasets: [{
          data: workflowRows,
          backgroundColor: ['#f59e0b', '#0ea5e9', '#16a34a', '#be123c'],
          borderWidth: 0,
        }],
      },
      options: chartOptions(),
    });

    state.bandChart = new Chart(dom.bandCanvas, {
      type: 'bar',
      data: {
        labels: bandRows.map(function (row) { return row.label; }),
        datasets: [{
          label: 'Band count',
          data: bandRows.map(function (row) { return row.count; }),
          backgroundColor: '#134e4a',
        }],
      },
      options: chartOptions('y'),
    });
  }

  function destroyCharts() {
    [state.classChart, state.subjectChart, state.workflowChart, state.bandChart].forEach(function (chart) {
      if (chart) chart.destroy();
    });
    state.classChart = null;
    state.subjectChart = null;
    state.workflowChart = null;
    state.bandChart = null;
  }

  function chartOptions(indexAxis) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: indexAxis || 'x',
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
      scales: indexAxis === 'y' ? {
        x: { beginAtZero: true },
        y: { beginAtZero: true },
      } : {
        r: { beginAtZero: true },
        x: { beginAtZero: true },
        y: { beginAtZero: true },
      },
    };
  }

  function buildClassRows(reports) {
    const map = new Map();
    reports.forEach(function (report) {
      const name = report.class_name || 'Unassigned class';
      if (!map.has(name)) map.set(name, { name: name, count: 0, total: 0, highest: null, lowest: null });
      const row = map.get(name);
      row.count += 1;
      const gpa = toNumber(report.gpa);
      if (Number.isFinite(gpa)) {
        row.total += gpa;
        row.highest = row.highest == null ? gpa : Math.max(row.highest, gpa);
        row.lowest = row.lowest == null ? gpa : Math.min(row.lowest, gpa);
      }
    });

    return Array.from(map.values()).map(function (row) {
      row.average = row.count ? row.total / row.count : 0;
      row.trendClass = row.average >= 3 ? 'good' : row.average >= 2 ? 'warn' : 'muted';
      return row;
    }).sort(function (a, b) { return b.average - a.average; });
  }

  function buildSubjectRows(reports) {
    const map = new Map();
    reports.forEach(function (report) {
      const details = Array.isArray(report.details) ? report.details : [];
      details.forEach(function (detail) {
        const name = detail.subject_name || detail.subject_code || 'Subject';
        if (!map.has(name)) map.set(name, { name: name, count: 0, total: 0, highest: null, lowest: null });
        const row = map.get(name);
        row.count += 1;
        const percentage = toNumber(detail.percentage);
        if (Number.isFinite(percentage)) {
          row.total += percentage;
          row.highest = row.highest == null ? percentage : Math.max(row.highest, percentage);
          row.lowest = row.lowest == null ? percentage : Math.min(row.lowest, percentage);
        }
      });
    });

    return Array.from(map.values()).map(function (row) {
      row.average = row.count ? row.total / row.count : 0;
      row.trendClass = row.average >= 70 ? 'good' : row.average >= 50 ? 'warn' : 'muted';
      return row;
    }).sort(function (a, b) { return b.average - a.average; });
  }

  function buildWorkflowRows(reports) {
    const summary = reports.reduce(function (acc, report) {
      const status = deriveStatus(report);
      if (status === 'pending') acc[0] += 1;
      else if (status === 'approved') acc[1] += 1;
      else if (status === 'published') acc[2] += 1;
      else if (status === 'rejected') acc[3] += 1;
      return acc;
    }, [0, 0, 0, 0]);
    return summary;
  }

  function buildBandRows(reports) {
    const bands = state.activeBands[0] ? state.activeBands[0].rows : [];
    return bands.map(function (band) {
      const label = band.grade || band.grade_letter || 'Band';
      const count = reports.reduce(function (sum, report) {
        const details = Array.isArray(report.details) ? report.details : [];
        return sum + details.filter(function (detail) {
          const pct = toNumber(detail.percentage);
          return bandMatchesScore(band, pct);
        }).length;
      }, 0);
      return { label: label, count: count };
    });
  }

  function bandMatchesScore(band, value) {
    const min = toNumber(band.min_score);
    const max = toNumber(band.max_score);
    if (!Number.isFinite(value)) return false;
    if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
    return value >= min && value <= max;
  }

  function getFilteredReports() {
    const className = selectedClassName();
    const subjectName = selectedSubjectName();

    return state.reports.filter(function (report) {
      if (state.filters.class_id && normalizeText(report.class_name) !== normalizeText(className)) return false;
      if (state.filters.status && deriveStatus(report) !== state.filters.status) return false;
      if (state.filters.subject_id) {
        const details = Array.isArray(report.details) ? report.details : [];
        const match = details.some(function (detail) {
          return normalizeText(detail.subject_name).includes(normalizeText(subjectName)) || normalizeText(detail.subject_code).includes(normalizeText(subjectName));
        });
        if (!match) return false;
      }
      return true;
    });
  }

  function populateFilters() {
    setSelect(dom.filters.year, state.academicYears, state.filters.academic_year_id, function (row) { return row.academic_year_id; }, function (row) { return row.year_name || row.name || row.academic_year_id; }, 'All years');
    setSelect(dom.filters.semester, state.semesters, state.filters.semester_id, function (row) { return row.semester_id; }, function (row) { return row.semester_name || row.name || row.semester_id; }, 'All semesters');
    setSelect(dom.filters.class, state.classes, state.filters.class_id, function (row) { return row.class_id; }, function (row) { return row.class_name || row.class_code || row.class_id; }, 'All classes');
    setSelect(dom.filters.subject, state.subjects, state.filters.subject_id, function (row) { return row.subject_id; }, function (row) { return [row.subject_name, row.subject_code].filter(Boolean).join(' - ') || row.subject_id; }, 'All subjects');

    const statusOptions = ['', 'pending', 'approved', 'published', 'rejected'];
    if (dom.filters.status) {
      const current = dom.filters.status.value;
      dom.filters.status.innerHTML = statusOptions.map(function (status) {
        return '<option value="' + esc(status) + '">' + esc(status ? statusLabel(status) : 'All workflows') + '</option>';
      }).join('');
      dom.filters.status.value = current || state.filters.status || '';
    }

    if (dom.filters.year) dom.filters.year.value = state.filters.academic_year_id || '';
    if (dom.filters.semester) dom.filters.semester.value = state.filters.semester_id || '';
    if (dom.filters.class) dom.filters.class.value = state.filters.class_id || '';
    if (dom.filters.subject) dom.filters.subject.value = state.filters.subject_id || '';
    if (dom.filters.status) dom.filters.status.value = state.filters.status || '';
  }

  function setSelect(select, items, currentValue, valueGetter, labelGetter, defaultLabel) {
    if (!select) return;
    const current = currentValue != null ? String(currentValue) : '';
    const options = ['<option value="">' + esc(defaultLabel) + '</option>'];
    (Array.isArray(items) ? items : []).forEach(function (item) {
      options.push('<option value="' + esc(String(valueGetter(item))) + '">' + esc(labelGetter(item)) + '</option>');
    });
    select.innerHTML = options.join('');
    if (current) select.value = current;
  }

  function selectedClassName() {
    const row = state.classes.find(function (item) { return String(item.class_id) === String(state.filters.class_id); });
    return row ? (row.class_name || row.class_code || '') : '';
  }

  function selectedSubjectName() {
    const row = state.subjects.find(function (item) { return String(item.subject_id) === String(state.filters.subject_id); });
    return row ? (row.subject_name || row.subject_code || '') : '';
  }

  function onFilterChange() {
    state.filters.academic_year_id = dom.filters.year?.value || '';
    state.filters.semester_id = dom.filters.semester?.value || '';
    state.filters.class_id = dom.filters.class?.value || '';
    state.filters.subject_id = dom.filters.subject?.value || '';
    state.filters.status = dom.filters.status?.value || '';
    renderAll();
  }

  function exportComparison() {
    const rows = getFilteredReports();
    if (!rows.length) {
      toast('No comparison data to export.', 'info');
      return;
    }

    const csv = [
      ['Type', 'Name', 'Reports', 'Average', 'Highest', 'Lowest'].join(','),
      ...buildClassRows(rows).map(function (row) {
        return ['Class', row.name, row.count, formatNumber(row.average, 2), formatNumber(row.highest, 2), formatNumber(row.lowest, 2)].map(csvCell).join(',');
      }),
      ...buildSubjectRows(rows).map(function (row) {
        return ['Subject', row.name, row.count, formatNumber(row.average, 2), formatNumber(row.highest, 2), formatNumber(row.lowest, 2)].map(csvCell).join(',');
      }),
    ].join('\n');

    downloadText(csv, 'grade-comparison.csv', 'text/csv');
  }

  function readQueryDefaults() {
    const params = new URLSearchParams(window.location.search || '');
    return {
      academic_year_id: params.get('academic_year_id') || '',
      semester_id: params.get('semester_id') || '',
      class_id: params.get('class_id') || '',
      subject_id: params.get('subject_id') || '',
      status: params.get('status') || '',
    };
  }

  function deriveStatus(report) {
    const published = isTruthy(report.is_published) || !!report.published_at;
    const approved = isTruthy(report.Approved);
    const rejected = !approved && !!String(report.principal_comment || '').trim();
    if (published) return 'published';
    if (approved) return 'approved';
    if (rejected) return 'rejected';
    return 'pending';
  }

  function statusLabel(status) {
    const value = String(status || '').toLowerCase();
    if (!value) return 'All workflows';
    if (value === 'pending') return 'Pending';
    if (value === 'approved') return 'Approved';
    if (value === 'published') return 'Published';
    if (value === 'rejected') return 'Needs correction';
    return value;
  }

  function buildActiveBands(scales) {
    const groups = new Map();
    (Array.isArray(scales) ? scales : []).forEach(function (row) {
      const status = String(row.status || row.Status || row.is_active || 'active').toLowerCase();
      if (status === 'inactive' || status === '0' || status === 'false') return;
      const key = String(row.grade_categories_id || row.category_id || 'default');
      if (!groups.has(key)) {
        groups.set(key, {
          name: row.grade_categories_name || row.category_name || 'Active grading scale',
          rows: [],
        });
      }
      groups.get(key).rows.push(row);
    });

    return Array.from(groups.values()).map(function (group) {
      group.rows.sort(function (a, b) { return toNumber(b.max_score) - toNumber(a.max_score); });
      return group;
    }).sort(function (a, b) { return b.rows.length - a.rows.length; });
  }

  function showLoading() {
    if (dom.tableBody) {
      dom.tableBody.innerHTML = '<tr><td colspan="6"><div class="empty">Loading comparison data...</div></td></tr>';
    }
    if (dom.classList) dom.classList.innerHTML = '<div class="empty">Loading...</div>';
    if (dom.subjectList) dom.subjectList.innerHTML = '<div class="empty">Loading...</div>';
    if (dom.scaleList) dom.scaleList.innerHTML = '<div class="empty">Loading...</div>';
  }

  function showEmpty(message) {
    if (dom.tableBody) {
      dom.tableBody.innerHTML = '<tr><td colspan="6"><div class="empty">' + esc(message) + '</div></td></tr>';
    }
    if (dom.classList) dom.classList.innerHTML = '<div class="empty">' + esc(message) + '</div>';
    if (dom.subjectList) dom.subjectList.innerHTML = '<div class="empty">' + esc(message) + '</div>';
    if (dom.scaleList) dom.scaleList.innerHTML = '<div class="empty">' + esc(message) + '</div>';
  }

  function unwrapSingle(response) {
    if (!response) return null;
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) return response.data;
    if (response.result && typeof response.result === 'object' && !Array.isArray(response.result)) return response.result;
    return response;
  }

  function toList(response) {
    const data = response && response.data ? response.data : response;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  function toReportList(response) {
    const payload = response && response.data ? response.data : response;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.reports)) return payload.reports;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  }

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }

  function formatNumber(value, precision) {
    const n = toNumber(value);
    if (!Number.isFinite(n)) return '0.0';
    return n.toFixed(precision == null ? 1 : precision).replace(/\.0+$/, function () { return precision === 0 ? '' : ''; });
  }

  function formatRange(min, max) {
    const minText = min == null || min === '' ? '-' : formatNumber(min, 1);
    const maxText = max == null || max === '' ? '-' : formatNumber(max, 1);
    return minText + ' - ' + maxText;
  }

  function csvCell(value) {
    const text = String(value == null ? '' : value).replace(/"/g, '""');
    return '"' + text + '"';
  }

  function downloadText(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function normalizeText(value) {
    return String(value == null ? '' : value).toLowerCase().trim();
  }

  function formatUserName(user) {
    if (!user) return '';
    return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username || user.email || ('User ' + user.user_id);
  }

  function isTruthy(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const normalized = String(value == null ? '' : value).toLowerCase().trim();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'published';
  }

  function toast(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type || 'info');
      return;
    }
    console.log('[' + (type || 'info') + '] ' + message);
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }
})();
