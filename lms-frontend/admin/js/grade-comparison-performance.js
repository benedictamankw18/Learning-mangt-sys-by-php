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
      class_a_id: '',
      subject_a_id: '',
      class_b_id: '',
      subject_b_id: '',
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
      classA: document.getElementById('cmpClassA'),
      subjectA: document.getElementById('cmpSubjectA'),
      classB: document.getElementById('cmpClassB'),
      subjectB: document.getElementById('cmpSubjectB'),
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
      state.filters.class_a_id = params.class_a_id || params.class_id || state.filters.class_a_id || '';
      state.filters.subject_a_id = params.subject_a_id || params.subject_id || state.filters.subject_a_id || '';
      state.filters.class_b_id = params.class_b_id || state.filters.class_b_id || '';
      state.filters.subject_b_id = params.subject_b_id || state.filters.subject_b_id || '';
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
      destroyCharts();
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
    const selectionA = buildSelectionStats(state.filters.class_a_id, state.filters.subject_a_id, filtered);
    const selectionB = buildSelectionStats(state.filters.class_b_id, state.filters.subject_b_id, filtered);

    renderMetrics(selectionA, selectionB);
    renderSelectionList(dom.classList, selectionA, 'A');
    renderSelectionList(dom.subjectList, selectionB, 'B');
    renderScaleList();
    renderComparisonTable(selectionA, selectionB);
    renderCharts(selectionA, selectionB);
  }

  function renderMetrics(selectionA, selectionB) {
    const aAvg = Number.isFinite(selectionA.average) ? selectionA.average : NaN;
    const bAvg = Number.isFinite(selectionB.average) ? selectionB.average : NaN;
    const delta = Number.isFinite(aAvg) && Number.isFinite(bAvg) ? (aAvg - bAvg) : NaN;

    setText(dom.metrics.classes, Number.isFinite(aAvg) ? formatNumber(aAvg, 2) + '%' : '--');
    setText(dom.metrics.subjects, Number.isFinite(bAvg) ? formatNumber(bAvg, 2) + '%' : '--');
    setText(dom.metrics.avgGpa, Number.isFinite(delta) ? formatSigned(delta, 2) + '%' : '--');

    if (Number.isFinite(delta)) {
      if (delta > 0) {
        setText(dom.metrics.best, 'Selection A');
      } else if (delta < 0) {
        setText(dom.metrics.best, 'Selection B');
      } else {
        setText(dom.metrics.best, 'Tie');
      }
      return;
    }

    setText(dom.metrics.best, '-');
  }

  function renderSelectionList(container, selection, label) {
    if (!container) return;

    if (!selection || !selection.hasSelection) {
      container.innerHTML = '<div class="empty">Choose class and subject for selection ' + esc(label) + '.</div>';
      return;
    }

    if (!selection.reportCount) {
      container.innerHTML = '<div class="empty">No report data found for selection ' + esc(label) + '.</div>';
      return;
    }

    const workflow = selection.workflow || [0, 0, 0, 0];
    container.innerHTML = [
      '<div class="list-item"><span><strong>' + esc(selection.className) + '</strong><br /><small>Class ' + esc(label) + '</small></span><span class="chip muted">Class</span></div>',
      '<div class="list-item"><span><strong>' + esc(selection.subjectName) + '</strong><br /><small>Subject ' + esc(label) + '</small></span><span class="chip muted">Subject</span></div>',
      '<div class="list-item"><span><strong>Reports</strong><br /><small>Matched report cards</small></span><span class="chip">' + esc(String(selection.reportCount)) + '</span></div>',
      '<div class="list-item"><span><strong>Average</strong><br /><small>Subject percentage</small></span><span class="chip ' + esc(selection.trendClass) + '">' + esc(formatNumber(selection.average, 2)) + '%</span></div>',
      '<div class="list-item"><span><strong>High / Low</strong><br /><small>Observed spread</small></span><span class="chip muted">' + esc(formatNumber(selection.highest, 2)) + '% / ' + esc(formatNumber(selection.lowest, 2)) + '%</span></div>',
      '<div class="list-item"><span><strong>Workflow</strong><br /><small>Pnd/App/Pub/Fix</small></span><span class="chip muted">' + esc(workflow.join(' / ')) + '</span></div>',
    ].join('');
  }

  function renderComparisonTable(selectionA, selectionB) {
    if (!dom.tableBody) return;

    const rows = [
      buildMetricRow('Class', selectionA.className, selectionB.className, ''),
      buildMetricRow('Subject', selectionA.subjectName, selectionB.subjectName, ''),
      buildMetricRow('Reports', String(selectionA.reportCount), String(selectionB.reportCount), formatSigned(selectionA.reportCount - selectionB.reportCount, 0)),
      buildMetricRow('Average %', formatMaybePercent(selectionA.average), formatMaybePercent(selectionB.average), formatDeltaPercent(selectionA.average, selectionB.average)),
      buildMetricRow('Highest %', formatMaybePercent(selectionA.highest), formatMaybePercent(selectionB.highest), formatDeltaPercent(selectionA.highest, selectionB.highest)),
      buildMetricRow('Lowest %', formatMaybePercent(selectionA.lowest), formatMaybePercent(selectionB.lowest), formatDeltaPercent(selectionA.lowest, selectionB.lowest)),
      buildMetricRow('Pending', String(selectionA.workflow[0] || 0), String(selectionB.workflow[0] || 0), formatSigned((selectionA.workflow[0] || 0) - (selectionB.workflow[0] || 0), 0)),
      buildMetricRow('Approved', String(selectionA.workflow[1] || 0), String(selectionB.workflow[1] || 0), formatSigned((selectionA.workflow[1] || 0) - (selectionB.workflow[1] || 0), 0)),
      buildMetricRow('Published', String(selectionA.workflow[2] || 0), String(selectionB.workflow[2] || 0), formatSigned((selectionA.workflow[2] || 0) - (selectionB.workflow[2] || 0), 0)),
      buildMetricRow('Needs correction', String(selectionA.workflow[3] || 0), String(selectionB.workflow[3] || 0), formatSigned((selectionA.workflow[3] || 0) - (selectionB.workflow[3] || 0), 0)),
    ];

    dom.tableBody.innerHTML = rows.map(function (row) {
      return '<tr><td>' + esc(row.metric) + '</td><td>' + esc(row.a) + '</td><td>' + esc(row.b) + '</td><td>' + esc(row.delta) + '</td></tr>';
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

  function renderCharts(selectionA, selectionB) {
    if (typeof Chart === 'undefined') return;

    destroyCharts();

    const classCanvas = getCanvasContext(dom.classCanvas);
    const subjectCanvas = getCanvasContext(dom.subjectCanvas);
    const workflowCanvas = getCanvasContext(dom.workflowCanvas);
    const bandCanvas = getCanvasContext(dom.bandCanvas);

    if (classCanvas) {
      state.classChart = safeCreateChart(classCanvas, {
        type: 'bar',
        data: {
          labels: ['Selection A', 'Selection B'],
          datasets: [{
            label: 'Average %',
            data: [toFiniteNumber(selectionA.average, 0), toFiniteNumber(selectionB.average, 0)],
            backgroundColor: ['#0f766e', '#f59e0b'],
          }],
        },
        options: chartOptions('bar-vertical'),
      });
    }

    if (subjectCanvas) {
      state.subjectChart = safeCreateChart(subjectCanvas, {
        type: 'bar',
        data: {
          labels: ['Selection A', 'Selection B'],
          datasets: [{
            label: 'Highest %',
            data: [toFiniteNumber(selectionA.highest, 0), toFiniteNumber(selectionB.highest, 0)],
            backgroundColor: '#16a34a',
          }, {
            label: 'Lowest %',
            data: [toFiniteNumber(selectionA.lowest, 0), toFiniteNumber(selectionB.lowest, 0)],
            backgroundColor: '#be123c',
          }],
        },
        options: chartOptions('bar-vertical'),
      });
    }

    if (workflowCanvas) {
      state.workflowChart = safeCreateChart(workflowCanvas, {
        type: 'bar',
        data: {
          labels: ['Pending', 'Approved', 'Published', 'Needs correction'],
          datasets: [{
            label: 'Selection A',
            data: (selectionA.workflow || []).map(function (value) { return toFiniteNumber(value, 0); }),
            backgroundColor: '#0f766e',
          }, {
            label: 'Selection B',
            data: (selectionB.workflow || []).map(function (value) { return toFiniteNumber(value, 0); }),
            backgroundColor: '#f59e0b',
          }],
        },
        options: chartOptions('bar-vertical'),
      });
    }

    if (bandCanvas) {
      const labels = getBandLabels(selectionA, selectionB);
      const safeLabels = labels.length ? labels : ['No band data'];
      state.bandChart = safeCreateChart(bandCanvas, {
        type: 'bar',
        data: {
          labels: safeLabels,
          datasets: [{
            label: 'Selection A',
            data: safeLabels.map(function (label) { return toFiniteNumber(selectionA.bandCounts[label], 0); }),
            backgroundColor: '#134e4a',
          }, {
            label: 'Selection B',
            data: safeLabels.map(function (label) { return toFiniteNumber(selectionB.bandCounts[label], 0); }),
            backgroundColor: '#fb923c',
          }],
        },
        options: chartOptions('bar-vertical'),
      });
    }
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

  function chartOptions(kind) {
    const base = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      normalized: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    };

    if (kind === 'bar-horizontal') {
      return {
        ...base,
        indexAxis: 'y',
        scales: {
          x: { beginAtZero: true },
          y: { beginAtZero: true },
        },
      };
    }

    if (kind === 'bar-vertical') {
      return {
        ...base,
        scales: {
          x: { beginAtZero: true },
          y: { beginAtZero: true },
        },
      };
    }

    return {
      ...base,
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true },
      },
    };
  }

  function getCanvasContext(canvas) {
    if (!canvas || typeof canvas.getContext !== 'function') {
      return null;
    }
    return canvas;
  }

  function safeCreateChart(canvas, config) {
    try {
      return new Chart(canvas, config);
    } catch (error) {
      console.warn('Chart render skipped:', error);
      return null;
    }
  }

  function toFiniteNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : (fallback == null ? 0 : fallback);
  }

  function buildSelectionStats(classId, subjectId, reports) {
    const className = selectedClassName(classId);
    const subjectName = selectedSubjectName(subjectId);
    const hasSelection = !!className && !!subjectName;
    const scores = [];
    const workflow = [0, 0, 0, 0];
    const bandCounts = {};
    getBandDefinitions().forEach(function (band) {
      bandCounts[getBandLabel(band)] = 0;
    });

    if (!hasSelection) {
      return {
        hasSelection: false,
        className: className || '-',
        subjectName: subjectName || '-',
        reportCount: 0,
        average: NaN,
        highest: NaN,
        lowest: NaN,
        workflow: workflow,
        bandCounts: bandCounts,
        trendClass: 'muted',
      };
    }

    let reportCount = 0;
    (Array.isArray(reports) ? reports : []).forEach(function (report) {
      if (normalizeText(report.class_name) !== normalizeText(className)) {
        return;
      }

      const details = Array.isArray(report.details) ? report.details : [];
      const matched = details.filter(function (detail) {
        return detailMatchesSubject(detail, subjectName);
      });

      if (!matched.length) {
        return;
      }

      reportCount += 1;
      bumpWorkflow(workflow, deriveStatus(report));

      matched.forEach(function (detail) {
        const pct = toNumber(detail.percentage);
        if (!Number.isFinite(pct)) {
          return;
        }
        scores.push(pct);
        const band = getBandForScore(pct);
        if (band) {
          const key = getBandLabel(band);
          bandCounts[key] = (bandCounts[key] || 0) + 1;
        }
      });
    });

    const average = scores.length ? scores.reduce(function (sum, val) { return sum + val; }, 0) / scores.length : NaN;
    const highest = scores.length ? Math.max.apply(null, scores) : NaN;
    const lowest = scores.length ? Math.min.apply(null, scores) : NaN;

    return {
      hasSelection: true,
      className: className,
      subjectName: subjectName,
      reportCount: reportCount,
      average: average,
      highest: highest,
      lowest: lowest,
      workflow: workflow,
      bandCounts: bandCounts,
      trendClass: Number.isFinite(average) && average >= 70 ? 'good' : Number.isFinite(average) && average >= 50 ? 'warn' : 'muted',
    };
  }

  function bandMatchesScore(band, value) {
    const min = toNumber(band.min_score);
    const max = toNumber(band.max_score);
    if (!Number.isFinite(value)) return false;
    if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
    return value >= min && value <= max;
  }

  function getFilteredReports() {
    return state.reports.filter(function (report) {
      if (state.filters.status && deriveStatus(report) !== state.filters.status) return false;
      return true;
    });
  }

  function populateFilters() {
    setSelect(dom.filters.year, state.academicYears, state.filters.academic_year_id, function (row) { return row.academic_year_id; }, function (row) { return row.year_name || row.name || row.academic_year_id; }, 'All years');
    setSelect(dom.filters.semester, state.semesters, state.filters.semester_id, function (row) { return row.semester_id; }, function (row) { return row.semester_name || row.name || row.semester_id; }, 'All semesters');
    setSelect(dom.filters.classA, state.classes, state.filters.class_a_id, function (row) { return row.class_id; }, function (row) { return row.class_name || row.class_code || row.class_id; }, 'Select class A');
    setSelect(dom.filters.classB, state.classes, state.filters.class_b_id, function (row) { return row.class_id; }, function (row) { return row.class_name || row.class_code || row.class_id; }, 'Select class B');

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
    ensureSelectionDefaults();

    const subjectsForClassA = getSubjectsForClass(state.filters.class_a_id);
    if (state.filters.subject_a_id && !subjectsForClassA.some(function (item) {
      return String(item.subject_id) === String(state.filters.subject_a_id);
    })) {
      state.filters.subject_a_id = subjectsForClassA.length ? String(subjectsForClassA[0].subject_id) : '';
    }

    const subjectsForClassB = getSubjectsForClass(state.filters.class_b_id);
    if (state.filters.subject_b_id && !subjectsForClassB.some(function (item) {
      return String(item.subject_id) === String(state.filters.subject_b_id);
    })) {
      state.filters.subject_b_id = subjectsForClassB.length ? String(subjectsForClassB[0].subject_id) : '';
    }

    setSelect(dom.filters.subjectA, subjectsForClassA, state.filters.subject_a_id, function (row) { return row.subject_id; }, function (row) { return [row.subject_name, row.subject_code].filter(Boolean).join(' - ') || row.subject_id; }, 'Select subject A');
    setSelect(dom.filters.subjectB, subjectsForClassB, state.filters.subject_b_id, function (row) { return row.subject_id; }, function (row) { return [row.subject_name, row.subject_code].filter(Boolean).join(' - ') || row.subject_id; }, 'Select subject B');

    if (dom.filters.classA) dom.filters.classA.value = state.filters.class_a_id || '';
    if (dom.filters.subjectA) dom.filters.subjectA.value = state.filters.subject_a_id || '';
    if (dom.filters.classB) dom.filters.classB.value = state.filters.class_b_id || '';
    if (dom.filters.subjectB) dom.filters.subjectB.value = state.filters.subject_b_id || '';
    if (dom.filters.status) dom.filters.status.value = state.filters.status || '';
  }

  function ensureSelectionDefaults() {
    if (!state.filters.class_a_id && state.classes.length) {
      state.filters.class_a_id = String(state.classes[0].class_id || '');
    }
    if (!state.filters.subject_a_id && state.subjects.length) {
      state.filters.subject_a_id = String(state.subjects[0].subject_id || '');
    }

    if (!state.filters.class_b_id && state.classes.length) {
      const candidate = state.classes.find(function (item) {
        return String(item.class_id) !== String(state.filters.class_a_id);
      });
      state.filters.class_b_id = String((candidate || state.classes[0]).class_id || '');
    }
    if (!state.filters.subject_b_id && state.subjects.length) {
      const candidate = state.subjects.find(function (item) {
        return String(item.subject_id) !== String(state.filters.subject_a_id);
      });
      state.filters.subject_b_id = String((candidate || state.subjects[0]).subject_id || '');
    }
  }

  function getSubjectsForClass(classId) {
    if (!classId) {
      return Array.isArray(state.subjects) ? state.subjects.slice() : [];
    }

    const className = selectedClassName(classId);
    const offeredById = new Set();
    const offeredByName = new Set();

    (Array.isArray(state.reports) ? state.reports : []).forEach(function (report) {
      const sameClassId = report && report.class_id != null
        && String(report.class_id) === String(classId);
      const sameClassName = normalizeText(report?.class_name) === normalizeText(className);

      if (!sameClassId && !sameClassName) {
        return;
      }

      const details = Array.isArray(report.details) ? report.details : [];
      details.forEach(function (detail) {
        if (detail && detail.subject_id != null && String(detail.subject_id).trim() !== '') {
          offeredById.add(String(detail.subject_id));
        }
        const name = normalizeText(detail?.subject_name);
        const code = normalizeText(detail?.subject_code);
        if (name) offeredByName.add(name);
        if (code) offeredByName.add(code);
      });
    });

    if (!offeredById.size && !offeredByName.size) {
      return Array.isArray(state.subjects) ? state.subjects.slice() : [];
    }

    return (Array.isArray(state.subjects) ? state.subjects : []).filter(function (subject) {
      const subjectId = String(subject?.subject_id || '');
      const subjectName = normalizeText(subject?.subject_name);
      const subjectCode = normalizeText(subject?.subject_code);
      return offeredById.has(subjectId)
        || offeredByName.has(subjectName)
        || offeredByName.has(subjectCode);
    });
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

  function selectedClassName(classId) {
    const row = state.classes.find(function (item) { return String(item.class_id) === String(classId); });
    return row ? (row.class_name || row.class_code || '') : '';
  }

  function selectedSubjectName(subjectId) {
    const row = state.subjects.find(function (item) { return String(item.subject_id) === String(subjectId); });
    return row ? (row.subject_name || row.subject_code || '') : '';
  }

  async function onFilterChange() {
    const previousYear = state.filters.academic_year_id;
    const previousSemester = state.filters.semester_id;

    state.filters.academic_year_id = dom.filters.year?.value || '';
    state.filters.semester_id = dom.filters.semester?.value || '';
    state.filters.class_a_id = dom.filters.classA?.value || '';
    state.filters.subject_a_id = dom.filters.subjectA?.value || '';
    state.filters.class_b_id = dom.filters.classB?.value || '';
    state.filters.subject_b_id = dom.filters.subjectB?.value || '';
    state.filters.status = dom.filters.status?.value || '';

    const periodChanged = previousYear !== state.filters.academic_year_id
      || previousSemester !== state.filters.semester_id;

    if (!periodChanged) {
      renderAll();
      return;
    }

    showLoading();
    try {
      await loadReports();
      renderAll();
    } catch (error) {
      destroyCharts();
      showEmpty('Failed to load comparison data: ' + (error?.message || 'Unknown error'));
    }
  }

  function exportComparison() {
    const selectionA = buildSelectionStats(state.filters.class_a_id, state.filters.subject_a_id, getFilteredReports());
    const selectionB = buildSelectionStats(state.filters.class_b_id, state.filters.subject_b_id, getFilteredReports());
    if (!selectionA.reportCount && !selectionB.reportCount) {
      toast('No comparison data to export.', 'info');
      return;
    }

    const tableRows = [
      ['Class', selectionA.className, selectionB.className, ''],
      ['Subject', selectionA.subjectName, selectionB.subjectName, ''],
      ['Reports', selectionA.reportCount, selectionB.reportCount, selectionA.reportCount - selectionB.reportCount],
      ['Average %', formatMaybePercent(selectionA.average), formatMaybePercent(selectionB.average), formatDeltaPercent(selectionA.average, selectionB.average)],
      ['Highest %', formatMaybePercent(selectionA.highest), formatMaybePercent(selectionB.highest), formatDeltaPercent(selectionA.highest, selectionB.highest)],
      ['Lowest %', formatMaybePercent(selectionA.lowest), formatMaybePercent(selectionB.lowest), formatDeltaPercent(selectionA.lowest, selectionB.lowest)],
    ];

    const csv = [
      ['Metric', 'Selection A', 'Selection B', 'Difference'].map(csvCell).join(','),
      ...tableRows.map(function (row) { return row.map(csvCell).join(','); }),
    ].join('\n');

    downloadText(csv, 'grade-comparison.csv', 'text/csv');
  }

  function readQueryDefaults() {
    const params = new URLSearchParams(window.location.search || '');
    return {
      academic_year_id: params.get('academic_year_id') || '',
      semester_id: params.get('semester_id') || '',
      class_a_id: params.get('class_a_id') || '',
      subject_a_id: params.get('subject_a_id') || '',
      class_b_id: params.get('class_b_id') || '',
      subject_b_id: params.get('subject_b_id') || '',
      status: params.get('status') || '',
    };
  }

  function detailMatchesSubject(detail, subjectName) {
    const name = normalizeText(detail?.subject_name);
    const code = normalizeText(detail?.subject_code);
    const target = normalizeText(subjectName);
    if (!target) return false;
    return name === target || code === target || name.includes(target) || code.includes(target);
  }

  function bumpWorkflow(workflow, status) {
    if (status === 'pending') workflow[0] += 1;
    else if (status === 'approved') workflow[1] += 1;
    else if (status === 'published') workflow[2] += 1;
    else if (status === 'rejected') workflow[3] += 1;
  }

  function getBandDefinitions() {
    return state.activeBands[0] ? state.activeBands[0].rows : [];
  }

  function getBandLabel(band) {
    return String(band?.grade || band?.grade_letter || 'Band');
  }

  function getBandForScore(score) {
    const bands = getBandDefinitions();
    for (let i = 0; i < bands.length; i += 1) {
      const band = bands[i];
      if (bandMatchesScore(band, score)) {
        return band;
      }
    }
    return null;
  }

  function getBandLabels(selectionA, selectionB) {
    const labels = new Set();
    Object.keys(selectionA.bandCounts || {}).forEach(function (label) { labels.add(label); });
    Object.keys(selectionB.bandCounts || {}).forEach(function (label) { labels.add(label); });
    return Array.from(labels.values());
  }

  function buildMetricRow(metric, a, b, delta) {
    return {
      metric: metric,
      a: a,
      b: b,
      delta: delta,
    };
  }

  function formatMaybePercent(value) {
    return Number.isFinite(value) ? formatNumber(value, 2) + '%' : '--';
  }

  function formatDeltaPercent(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return '--';
    }
    return formatSigned(a - b, 2) + '%';
  }

  function formatSigned(value, precision) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return '--';
    }
    const abs = Math.abs(n);
    const sign = n > 0 ? '+' : n < 0 ? '-' : '';
    return sign + formatNumber(abs, precision == null ? 2 : precision);
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
      dom.tableBody.innerHTML = '<tr><td colspan="4"><div class="empty">Loading comparison data...</div></td></tr>';
    }
    if (dom.classList) dom.classList.innerHTML = '<div class="empty">Loading...</div>';
    if (dom.subjectList) dom.subjectList.innerHTML = '<div class="empty">Loading...</div>';
    if (dom.scaleList) dom.scaleList.innerHTML = '<div class="empty">Loading...</div>';
  }

  function showEmpty(message) {
    if (dom.tableBody) {
      dom.tableBody.innerHTML = '<tr><td colspan="4"><div class="empty">' + esc(message) + '</div></td></tr>';
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
    if (!Number.isFinite(n)) return '--';
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
