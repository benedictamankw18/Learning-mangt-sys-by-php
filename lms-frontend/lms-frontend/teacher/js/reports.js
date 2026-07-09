/* ============================================
   Teacher Reports Page
============================================ */
(function () {
  'use strict';

  const state = {
    classSubjects: [],
    classSubjectMap: new Map(),
    students: [],
    reports: [],
    rows: [],
    filteredRows: [],
    academicYears: [],
    semesters: [],
    currentAcademicYearId: '',
    currentSemesterId: '',
    selectedAcademicYearId: '',
    selectedSemesterId: '',
    currentAcademicYearName: '',
    currentSemesterName: '',
    progressChart: null,
    statusChart: null,
    reportTypes: [],
    gradeCategories: [],
    gradeScales: [],
    gradeScalesLoaded: false,
    selectedGradeCategoryId: null,
    bound: false,
  };

  const DEFAULT_REPORT_TYPES = [
    { value: 'performance', label: 'Class-Subject Performance' },
    { value: 'analysis', label: 'Class-Subject Analysis' },
    { value: 'progress', label: 'Student Progress' },
    { value: 'summary', label: 'Semester Summary' },
  ];

  const DEFAULT_GRADE_CATEGORIES = [
    { grade_categories_id: 1, grade_categories_name: 'Standard Scale', set_as_primary: 1 },
  ];

  const dom = {};

  document.addEventListener('DOMContentLoaded', initIfPresent);
  document.addEventListener('page:loaded', function (event) {
    if (event?.detail?.page === 'reports') {
      initIfPresent();
    }
  });

  function initIfPresent() {
    const root = document.getElementById('teacherReportsRoot');
    if (!root || root.dataset.bound === '1') {
      return;
    }

    root.dataset.bound = '1';
    bindDom();
    bindEvents();
    loadBootstrapData();
  }

  function bindDom() {
    dom.root = document.getElementById('teacherReportsRoot');
    dom.academicYear = document.getElementById('trpAcademicYear');
    dom.semester = document.getElementById('trpSemester');
    dom.classSubject = document.getElementById('trpClassSubject');
    dom.reportMode = document.getElementById('trpReportMode');
    dom.gradeCategory = document.getElementById('trpGradeCategory');
    dom.student = document.getElementById('trpStudent');
    dom.search = document.getElementById('trpSearch');
    dom.loadBtn = document.getElementById('trpLoadBtn');
    dom.reportCardBtn = document.getElementById('trpReportCardBtn');
    dom.exportPdfBtn = document.getElementById('trpExportPdfBtn');
    dom.printBtn = document.getElementById('trpPrintBtn');
    dom.status = document.getElementById('trpStatus');
    dom.currentSemester = document.querySelector('.trp-current-semester');
    dom.currentTerm = document.querySelector('.trp-current-term');

    dom.avg = document.getElementById('trpAvg');
    dom.highest = document.getElementById('trpHighest');
    dom.lowest = document.getElementById('trpLowest');
    dom.passRate = document.getElementById('trpPassRate');
    dom.count = document.getElementById('trpCount');

    dom.tableBody = document.getElementById('trpTableBody');
    dom.progressChart = document.getElementById('trpProgressChart');
    dom.statusChart = document.getElementById('trpStatusChart');
  }

  function bindEvents() {
    dom.academicYear?.addEventListener('change', function () {
      state.selectedAcademicYearId = String(this.value || '');
      populateSemesterSelect();
      state.selectedSemesterId = String(dom.semester?.value || '');
      updateSelectedTermInfo();
      clearStatus();
    });

    dom.semester?.addEventListener('change', function () {
      state.selectedSemesterId = String(this.value || '');
      updateSelectedTermInfo();
      clearStatus();
    });

    dom.loadBtn?.addEventListener('click', loadReportData);
    dom.search?.addEventListener('input', function () {
      applySearchFilter();
      renderTable();
      renderCharts();
      renderStats();
    });

    dom.gradeCategory?.addEventListener('change', async function () {
      state.selectedGradeCategoryId = dom.gradeCategory.value;
      await loadGradeScalesForSelectedCategory();
      rebuildGradeRows();
      renderTable();
      renderStats();
      renderCharts();
    });

    dom.student?.addEventListener('change', function () {
      clearStatus();
    });

    dom.reportCardBtn?.addEventListener('click', openReportCardView);
    dom.exportPdfBtn?.addEventListener('click', exportCurrentPdf);
    dom.printBtn?.addEventListener('click', function () {
      window.print();
    });
  }

  async function loadBootstrapData() {
    showStatus('Loading report options...', 'info');

    try {
      const [classesSubjectsRes, yearRes, semesterRes, yearListRes, semesterListRes, reportTypesRes, categoriesRes] = await Promise.all([
        TeacherAssessmentAPI.getClassesSubjects(),
        API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT),
        API.get(API_ENDPOINTS.SEMESTER_CURRENT),
        API.get(API_ENDPOINTS.ACADEMIC_YEARS, { limit: 200 }).catch(function () { return null; }),
        API.get(API_ENDPOINTS.SEMESTERS, { limit: 200 }).catch(function () { return null; }),
        loadReportTypesFromDb(),
        loadGradeCategoriesFromDb(),
      ]);

      const currentYear = unwrapSingle(yearRes);
      const currentSemester = unwrapSingle(semesterRes);
      state.currentAcademicYearId = String(currentYear?.academic_year_id || currentYear?.id || '');
      state.currentSemesterId = String(currentSemester?.semester_id || currentSemester?.id || '');

      state.academicYears = toList(
        yearListRes?.data?.academic_years
        || yearListRes?.academic_years
        || yearListRes?.data?.data
        || yearListRes?.data
        || yearListRes
      );
      state.semesters = toList(
        semesterListRes?.data?.semesters
        || semesterListRes?.semesters
        || semesterListRes?.data?.data
        || semesterListRes?.data
        || semesterListRes
      );

      if (!state.academicYears.length && state.currentAcademicYearId) {
        state.academicYears = [{
          academic_year_id: state.currentAcademicYearId,
          year_name: String(currentYear?.year_name || currentYear?.name || 'Current Academic Year'),
        }];
      }

      if (!state.semesters.length && state.currentSemesterId) {
        state.semesters = [{
          semester_id: state.currentSemesterId,
          semester_name: String(currentSemester?.semester_name || currentSemester?.name || 'Current Semester'),
          academic_year_id: state.currentAcademicYearId,
        }];
      }

      if (!state.selectedAcademicYearId) {
        state.selectedAcademicYearId = String(
          dom.academicYear?.value
          || state.currentAcademicYearId
          || state.academicYears[0]?.academic_year_id
          || state.academicYears[0]?.id
          || ''
        );
      }

      if (!state.selectedSemesterId) {
        state.selectedSemesterId = String(
          dom.semester?.value
          || state.currentSemesterId
          || ''
        );
      }

      populateAcademicYearSelect();
      populateSemesterSelect();

      const selectedYear = findAcademicYearById(state.selectedAcademicYearId);
      const selectedSemester = findSemesterById(state.selectedSemesterId);

      state.currentAcademicYearId = String(state.selectedAcademicYearId || state.currentAcademicYearId || '');
      state.currentSemesterId = String(state.selectedSemesterId || state.currentSemesterId || '');
      state.currentAcademicYearName = String(currentYear?.year_name || currentYear?.name || '-');
      state.currentSemesterName = String(currentSemester?.semester_name || currentSemester?.name || '-');
      state.currentAcademicYearName = String(selectedYear?.year_name || selectedYear?.name || state.currentAcademicYearName || '-');
      state.currentSemesterName = String(selectedSemester?.semester_name || selectedSemester?.name || state.currentSemesterName || '-');

      renderCurrentTermInfo();

      state.classSubjects = flattenClassSubjects(classesSubjectsRes?.data?.classes_subjects || []);
      state.classSubjectMap.clear();
      state.classSubjects.forEach(function (entry) {
        state.classSubjectMap.set(String(entry.class_subject_id), entry);
      });

      state.reportTypes = normalizeReportTypes(reportTypesRes);
      state.gradeCategories = normalizeGradeCategories(categoriesRes);

      populateClassSubjectSelect();
      populateReportModeSelect();
      populateGradeCategorySelect();
      await loadGradeScalesForSelectedCategory();
      showStatus('Select a class-subject and click Load Reports.', 'success');
    } catch (error) {
      renderCurrentTermInfo();
      state.reportTypes = DEFAULT_REPORT_TYPES.slice();
      populateReportModeSelect();
      showStatus(error?.message || 'Failed to load report options.', 'error');
    }
  }

  async function loadReportTypesFromDb() {
    if (typeof ReportScheduleAPI !== 'undefined' && typeof ReportScheduleAPI.getTypes === 'function') {
      return ReportScheduleAPI.getTypes();
    }

    return API.get(API_ENDPOINTS.REPORT_SCHEDULE_TYPES);
  }

  async function loadGradeCategoriesFromDb() {
    if (typeof GradeCategoryAPI !== 'undefined' && typeof GradeCategoryAPI.getAll === 'function') {
      return GradeCategoryAPI.getAll();
    }

    return API.get(API_ENDPOINTS.GRADE_CATEGORIES);
  }

  function renderCurrentTermInfo() {
    if (dom.currentSemester) {
      dom.currentSemester.textContent = 'Selected semester: ' + (state.currentSemesterName || '-');
    }
    if (dom.currentTerm) {
      dom.currentTerm.textContent = 'Academic Year: ' + (state.currentAcademicYearName || '-');
    }
  }

  function updateSelectedTermInfo() {
    const selectedYear = findAcademicYearById(state.selectedAcademicYearId);
    const selectedSemester = findSemesterById(state.selectedSemesterId);

    state.currentAcademicYearId = String(state.selectedAcademicYearId || '');
    state.currentSemesterId = String(state.selectedSemesterId || '');
    state.currentAcademicYearName = String(selectedYear?.year_name || selectedYear?.name || '-');
    state.currentSemesterName = String(selectedSemester?.semester_name || selectedSemester?.name || '-');

    renderCurrentTermInfo();
  }

  function populateAcademicYearSelect() {
    if (!dom.academicYear) return;

    const rows = Array.isArray(state.academicYears) ? state.academicYears.slice() : [];
    const currentValue = String(state.selectedAcademicYearId || dom.academicYear.value || '');
    const options = ['<option value="">Select academic year</option>'];

    rows.forEach(function (row) {
      const id = String(row?.academic_year_id || row?.id || '');
      if (!id) return;
      const label = String(row?.year_name || row?.name || ('Academic Year ' + id));
      options.push('<option value="' + esc(id) + '">' + esc(label) + '</option>');
    });

    dom.academicYear.innerHTML = options.join('');
    dom.academicYear.value = currentValue || '';
  }

  function getSemestersForAcademicYear(academicYearId) {
    const yearId = String(academicYearId || '');
    const rows = Array.isArray(state.semesters) ? state.semesters.slice() : [];
    if (!yearId) return rows;

    return rows.filter(function (row) {
      const rowYearId = String(row?.academic_year_id || row?.academicYearId || row?.academic_year?.academic_year_id || '');
      return rowYearId === yearId;
    });
  }

  function populateSemesterSelect() {
    if (!dom.semester) return;

    const rows = getSemestersForAcademicYear(state.selectedAcademicYearId);
    const currentValue = String(state.selectedSemesterId || dom.semester.value || '');
    const options = ['<option value="">Select semester</option>'];

    rows.forEach(function (row) {
      const id = String(row?.semester_id || row?.id || '');
      if (!id) return;
      const label = String(row?.semester_name || row?.name || ('Semester ' + id));
      options.push('<option value="' + esc(id) + '">' + esc(label) + '</option>');
    });

    dom.semester.innerHTML = options.join('');

    const hasCurrent = rows.some(function (row) {
      return String(row?.semester_id || row?.id || '') === currentValue;
    });

    if (hasCurrent) {
      dom.semester.value = currentValue;
      state.selectedSemesterId = currentValue;
      return;
    }

    const preferredCurrent = String(state.currentSemesterId || '');
    const hasPreferredCurrent = rows.some(function (row) {
      return String(row?.semester_id || row?.id || '') === preferredCurrent;
    });

    const fallback = hasPreferredCurrent
      ? preferredCurrent
      : String(rows[0]?.semester_id || rows[0]?.id || '');

    dom.semester.value = fallback;
    state.selectedSemesterId = fallback;
  }

  function findAcademicYearById(id) {
    const key = String(id || '');
    return (Array.isArray(state.academicYears) ? state.academicYears : []).find(function (row) {
      return String(row?.academic_year_id || row?.id || '') === key;
    }) || null;
  }

  function findSemesterById(id) {
    const key = String(id || '');
    return (Array.isArray(state.semesters) ? state.semesters : []).find(function (row) {
      return String(row?.semester_id || row?.id || '') === key;
    }) || null;
  }

  function flattenClassSubjects(groups) {
    const rows = [];
    (Array.isArray(groups) ? groups : []).forEach(function (group) {
      const className = group?.class_name || '';
      const classId = group?.class_id || null;
      (Array.isArray(group?.subjects) ? group.subjects : []).forEach(function (subject) {
        rows.push({
          class_subject_id: subject?.class_subject_id,
          class_id: subject?.class_id || classId,
          class_name: subject?.class_name || className,
          subject_id: subject?.subject_id || null,
          subject_name: subject?.subject_name || subject?.name || 'Subject',
        });
      });
    });

    return rows;
  }

  function populateClassSubjectSelect() {
    if (!dom.classSubject) return;

    if (!state.classSubjects.length) {
      dom.classSubject.innerHTML = '<option value="">No class-subject assigned</option>';
      return;
    }

    dom.classSubject.innerHTML = '<option value="">Select class-subject</option>' + state.classSubjects.map(function (entry) {
      return '<option value="' + esc(String(entry.class_subject_id)) + '">' + esc(entry.class_name + ' - ' + entry.subject_name) + '</option>';
    }).join('');

    dom.classSubject.value = String(state.classSubjects[0].class_subject_id || '');
  }

  function populateReportModeSelect() {
    if (!dom.reportMode) return;

    const source = Array.isArray(state.reportTypes) && state.reportTypes.length
      ? state.reportTypes
      : DEFAULT_REPORT_TYPES;

    dom.reportMode.innerHTML = source.map(function (item) {
      return '<option value="' + esc(String(item.value || '')) + '">' + esc(String(item.label || item.value || 'Report')) + '</option>';
    }).join('');

    if (!dom.reportMode.value && source.length) {
      dom.reportMode.value = String(source[0].value || '');
    }
  }

  function populateGradeCategorySelect() {
    if (!dom.gradeCategory) return;

    const source = Array.isArray(state.gradeCategories) && state.gradeCategories.length
      ? state.gradeCategories
      : DEFAULT_GRADE_CATEGORIES;

    dom.gradeCategory.innerHTML = source.map(function (item) {
      return '<option value="' + esc(String(item.grade_categories_id || '')) + '">' + esc(String(item.grade_categories_name || 'Grade Scale')) + '</option>';
    }).join('');

    // Set default to primary category
    const primaryCategory = source.find(function (cat) {
      return cat.set_as_primary === 1 || cat.set_as_primary === '1';
    });
    if (primaryCategory) {
      dom.gradeCategory.value = String(primaryCategory.grade_categories_id || '');
      state.selectedGradeCategoryId = primaryCategory.grade_categories_id || null;
    } else if (source.length) {
      dom.gradeCategory.value = String(source[0].grade_categories_id || '');
      state.selectedGradeCategoryId = source[0].grade_categories_id || null;
    }
  }

  async function loadGradeScalesForSelectedCategory() {
    const categoryId = Number(dom.gradeCategory?.value || state.selectedGradeCategoryId);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      state.gradeScales = [];
      state.gradeScalesLoaded = false;
      return;
    }

    try {
      const response = typeof GradeScaleAPI !== 'undefined' && typeof GradeScaleAPI.getAll === 'function'
        ? await GradeScaleAPI.getAll()
        : await API.get(API_ENDPOINTS.GRADE_SCALES);

      state.gradeScales = normalizeGradeScales(response)
        .filter(function (scale) {
          return Number(scale.grade_categories_id) === categoryId;
        })
        .sort(function (a, b) {
          return Number(b.max_score) - Number(a.max_score);
        });
      state.gradeScalesLoaded = true;
    } catch (error) {
      state.gradeScales = [];
      state.gradeScalesLoaded = false;
    }
  }

  function normalizeReportTypes(response) {
    const rows = response?.data?.report_types;
    if (!Array.isArray(rows) || !rows.length) {
      return DEFAULT_REPORT_TYPES.slice();
    }

    const mapped = rows
      .map(function (row) {
        const value = String(row?.value || row?.report_type || '').trim().toLowerCase();
        const label = String(row?.label || '').trim();
        if (!value) return null;
        return {
          value: value,
          label: label || humanizeReportType(value),
        };
      })
      .filter(Boolean);

    return mapped.length ? mapped : DEFAULT_REPORT_TYPES.slice();
  }

  function humanizeReportType(value) {
    return String(value || '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
  }

  function normalizeGradeCategories(response) {
    const rows = response && Array.isArray(response) 
      ? response 
      : Array.isArray(response?.data) 
        ? response.data 
        : [];

    if (!rows.length) {
      return DEFAULT_GRADE_CATEGORIES.slice();
    }

    const categories = rows.filter(function (row) {
      const status = String(row?.status || 'active').toLowerCase();
      return status !== 'inactive' && status !== '0' && status !== 'false';
    });

    return categories.length ? categories : DEFAULT_GRADE_CATEGORIES.slice();
  }

  function normalizeGradeScales(response) {
    const payload = response && response.data ? response.data : response;
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.grade_scales)
          ? payload.grade_scales
          : [];

    return rows.filter(function (row) {
      const status = String(row?.status || 'active').toLowerCase();
      return status !== 'inactive' && status !== '0' && status !== 'false';
    });
  }

  async function loadReportData() {
    const selected = getSelectedClassSubject();
    if (!selected) {
      showStatus('Select a class-subject first.', 'error');
      return;
    }

    showStatus('Loading student reports for selected class-subject...', 'info');

    try {
      const user = getCurrentUser();
      const generatedBy = user?.user_id || user?.id || '';

      const [studentsRes, reportsRes] = await Promise.all([
        TeacherAssessmentAPI.getStudents({
          class_id: selected.class_id,
          class_subject_id: selected.class_subject_id,
        }),
        GradeReportAPI.getAll({
          page: 1,
          limit: 400,
          class_id: selected.class_id,
          class_subject_id: selected.class_subject_id,
          academic_year_id: state.selectedAcademicYearId || state.currentAcademicYearId,
          semester_id: state.selectedSemesterId || state.currentSemesterId,
          generated_by: generatedBy,
        }),
      ]);

      state.students = toList(studentsRes?.data?.students || studentsRes);
      state.reports = toReportList(reportsRes);

      await hydrateReportDetails(state.reports);
      buildRows(selected);
      applySearchFilter();
      populateStudentSelect();
      renderStats();
      renderTable();
      renderCharts();

      showStatus('Reports loaded successfully.', 'success');
    } catch (error) {
      state.students = [];
      state.reports = [];
      state.rows = [];
      state.filteredRows = [];
      populateStudentSelect();
      renderStats();
      renderTable();
      renderCharts();
      showStatus(error?.message || 'Failed to load reports.', 'error');
    }
  }

  async function hydrateReportDetails(reports) {
    const list = Array.isArray(reports) ? reports : [];
    const chunkSize = 8;

    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      const details = await Promise.all(chunk.map(function (report) {
        if (Array.isArray(report?.details) && report.details.length) {
          return report;
        }

        return GradeReportAPI.getById(report.uuid).then(unwrapSingle).catch(function () {
          return null;
        });
      }));

      details.forEach(function (detail, index) {
        const report = chunk[index];
        if (!detail || !report) return;
        report.details = Array.isArray(detail.details) ? detail.details : [];
        report.student_id = detail.student_id ?? report.student_id;
        report.student_name = detail.student_name ?? report.student_name;
        report.student_id_number = detail.student_id_number ?? report.student_id_number;
        report.Approved = detail.Approved ?? report.Approved;
        report.is_published = detail.is_published ?? report.is_published;
        report.principal_comment = detail.principal_comment ?? report.principal_comment;
        report.generated_at = detail.generated_at ?? report.generated_at;
      });
    }
  }

  function buildRows(selectedClassSubject) {
    const reportByStudent = new Map();

    state.reports.forEach(function (report) {
      const details = Array.isArray(report?.details) ? report.details : [];
      const scopedDetails = details.filter(function (detail) {
        return matchesSelectedSubject(detail, selectedClassSubject);
      });

      if (!scopedDetails.length) {
        return;
      }

      const studentId = Number(report?.student_id);
      if (Number.isFinite(studentId) && studentId > 0) {
        const nextReport = Object.assign({}, report, { details: scopedDetails });
        const currentReport = reportByStudent.get(studentId);

        if (!currentReport || reportTimestamp(nextReport) >= reportTimestamp(currentReport)) {
          reportByStudent.set(studentId, nextReport);
        }
      }
    });

    state.rows = state.students.map(function (student) {
      const studentId = Number(student?.student_id);
      const report = reportByStudent.get(studentId) || null;

      if (!report) {
        return {
          student_id: studentId,
          student_name: fullName(student),
          student_id_number: student?.student_id_number || studentId || '-',
          average: NaN,
          grade: '-',
          status: 'pending',
          statusLabel: 'No report',
          generated_at: '',
          comment: '',
          details: [],
          hasReport: false,
        };
      }

      const details = Array.isArray(report.details) ? report.details : [];
      const average = details.length
        ? details.reduce(function (sum, item) {
          return sum + toNumber(item.percentage);
        }, 0) / details.length
        : NaN;

      const status = deriveStatus(report);

      return {
        student_id: studentId,
        student_name: report?.student_name || fullName(student),
        student_id_number: report?.student_id_number || student?.student_id_number || studentId || '-',
        average: average,
        grade: scoreToGrade(average),
        status: status,
        statusLabel: statusLabel(status),
        generated_at: report?.generated_at || '',
        comment: String(report?.principal_comment || report?.teacher_comment || '').trim(),
        details: details,
        hasReport: true,
      };
    });
  }

  function rebuildGradeRows() {
    if (!Array.isArray(state.rows) || !state.rows.length) {
      state.filteredRows = [];
      return;
    }

    state.rows = state.rows.map(function (row) {
      if (!row || !Number.isFinite(row.average)) {
        return row;
      }

      return Object.assign({}, row, {
        grade: scoreToGrade(row.average),
      });
    });

    applySearchFilter();
  }

  function reportTimestamp(report) {
    const raw = report?.generated_at || report?.updated_at || report?.created_at || '';
    const ts = new Date(raw).getTime();
    return Number.isFinite(ts) ? ts : 0;
  }

  function applySearchFilter() {
    const term = String(dom.search?.value || '').trim().toLowerCase();
    if (!term) {
      state.filteredRows = state.rows.slice();
      return;
    }

    state.filteredRows = state.rows.filter(function (row) {
      const text = [
        row.student_name,
        row.student_id_number,
        row.grade,
        row.statusLabel,
      ].join(' ').toLowerCase();
      return text.includes(term);
    });
  }

  function populateStudentSelect() {
    if (!dom.student) return;

    const rowsWithData = state.rows.filter(function (row) {
      return row.hasReport;
    });

    dom.student.innerHTML = '<option value="">Select student</option>' + rowsWithData.map(function (row) {
      return '<option value="' + esc(String(row.student_id)) + '">' + esc(row.student_name + ' (' + row.student_id_number + ')') + '</option>';
    }).join('');
  }

  function renderStats() {
    const rows = state.filteredRows.filter(function (row) {
      return Number.isFinite(row.average);
    });

    if (!rows.length) {
      setText(dom.avg, '0%');
      setText(dom.highest, '0%');
      setText(dom.lowest, '0%');
      setText(dom.passRate, '0%');
      setText(dom.count, '0');
      return;
    }

    const scores = rows.map(function (row) {
      return Number(row.average);
    });
    const avg = scores.reduce(function (sum, score) { return sum + score; }, 0) / scores.length;
    const high = Math.max.apply(null, scores);
    const low = Math.min.apply(null, scores);
    const pass = scores.filter(function (score) { return score >= 50; }).length;
    const passRate = scores.length ? (pass / scores.length) * 100 : 0;

    setText(dom.avg, formatPct(avg));
    setText(dom.highest, formatPct(high));
    setText(dom.lowest, formatPct(low));
    setText(dom.passRate, formatPct(passRate));
    setText(dom.count, String(rows.length));
  }

  function renderTable() {
    if (!dom.tableBody) return;

    if (!state.filteredRows.length) {
      dom.tableBody.innerHTML = '<tr><td colspan="7"><div class="trp-empty">No matching rows for current filter.</div></td></tr>';
      return;
    }

    dom.tableBody.innerHTML = state.filteredRows.map(function (row) {
      return '<tr>'
        + '<td>' + esc(row.student_name) + '</td>'
        + '<td>' + esc(row.student_id_number) + '</td>'
        + '<td>' + esc(Number.isFinite(row.average) ? formatPct(row.average) : '--') + '</td>'
        + '<td>' + esc(row.grade || '-') + '</td>'
        + '<td><span class="trp-badge ' + esc(row.status) + '">' + esc(row.statusLabel) + '</span></td>'
        + '<td>' + esc(formatDateTime(row.generated_at)) + '</td>'
        + '<td>' + esc(row.comment || '-') + '</td>'
        + '</tr>';
    }).join('');
  }

  function renderCharts() {
    if (typeof Chart === 'undefined') return;

    if (state.progressChart) {
      state.progressChart.destroy();
      state.progressChart = null;
    }
    if (state.statusChart) {
      state.statusChart.destroy();
      state.statusChart = null;
    }

    const scoreRows = state.filteredRows
      .filter(function (row) { return Number.isFinite(row.average); })
      .sort(function (a, b) { return b.average - a.average; })
      .slice(0, 12);

    if (dom.progressChart && scoreRows.length) {
      state.progressChart = new Chart(dom.progressChart, {
        type: 'bar',
        data: {
          labels: scoreRows.map(function (row) { return truncate(row.student_name, 14); }),
          datasets: [{
            label: 'Average %',
            data: scoreRows.map(function (row) { return Number(row.average); }),
            backgroundColor: '#0f766e',
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 100 },
          },
        },
      });
    }

    const statusSummary = summarizeStatuses(state.filteredRows);
    if (dom.statusChart) {
      state.statusChart = new Chart(dom.statusChart, {
        type: 'doughnut',
        data: {
          labels: ['Pending', 'Approved', 'Published', 'Needs correction'],
          datasets: [{
            data: [statusSummary.pending, statusSummary.approved, statusSummary.published, statusSummary.rejected],
            backgroundColor: ['#f59e0b', '#0ea5e9', '#16a34a', '#be123c'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    }
  }

  function openReportCardView() {
    const studentId = String(dom.student?.value || '');
    if (!studentId) {
      showStatus('Select a student to generate report card.', 'error');
      return;
    }

    const row = state.rows.find(function (item) {
      return String(item.student_id) === studentId;
    });

    if (!row || !row.hasReport) {
      showStatus('No report data available for selected student.', 'error');
      return;
    }

    const selected = getSelectedClassSubject();
    const reportTitle = selected
      ? (selected.class_name + ' - ' + selected.subject_name)
      : 'Class-Subject';

    const detailsRows = row.details.map(function (detail) {
      return '<tr>'
        + '<td>' + esc(detail.subject_name || detail.subject_code || 'Subject') + '</td>'
        + '<td>' + esc(formatNumber(detail.total_score, 2)) + '</td>'
        + '<td>' + esc(formatPct(detail.percentage)) + '</td>'
        + '<td>' + esc(scoreToGrade(detail.percentage || detail.total_score)) + '</td>'
        + '</tr>';
    }).join('');

    const html = '<!doctype html><html><head><meta charset="utf-8">'
      + '<title>Student Report Card</title>'
      + '<style>'
      + 'body{font-family:Arial,sans-serif;padding:20px;color:#0f172a;}h1,h2{margin:0 0 8px;}'
      + '.meta{margin:0 0 16px;color:#475569;}table{width:100%;border-collapse:collapse;margin-top:12px;}'
      + 'th,td{border:1px solid #cbd5e1;padding:8px;font-size:13px;text-align:left;}th{background:#f8fafc;}'
      + '.pill{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;background:#ecfeff;border:1px solid #bae6fd;}'
      + '@media print{button{display:none;}}'
      + '</style></head><body>'
      + '<h1>Student Report Card</h1>'
      + '<p class="meta"><strong>' + esc(reportTitle) + '</strong><br>'
      + 'Student: ' + esc(row.student_name) + ' (' + esc(row.student_id_number) + ')<br>'
      + 'Average: ' + esc(formatPct(row.average)) + ' | Grade: ' + esc(row.grade) + ' | Status: '
      + '<span class="pill">' + esc(row.statusLabel) + '</span></p>'
      + '<table><thead><tr><th>Subject</th><th>Total Score</th><th>Percentage</th><th>Grade</th></tr></thead><tbody>'
      + (detailsRows || '<tr><td colspan="4">No detail rows available.</td></tr>')
      + '</tbody></table>'
      + '<p style="margin-top:14px;color:#64748b;">Generated: ' + esc(new Date().toLocaleString()) + '</p>'
      + '<button onclick="window.print()">Print Report Card</button>'
      + '</body></html>';

    const win = window.open('', '_blank', 'width=980,height=760');
    if (!win) {
      showStatus('Popup blocked. Please allow popups and try again.', 'error');
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function exportCurrentPdf() {
    if (!state.filteredRows.length) {
      showStatus('No rows to export.', 'error');
      return;
    }

    const jsPdfCtor = window?.jspdf?.jsPDF;
    if (!jsPdfCtor) {
      showStatus('PDF library unavailable. Opening print dialog instead.', 'info');
      window.print();
      return;
    }

    const selected = getSelectedClassSubject();
    const title = selected
      ? ('Teacher Reports - ' + selected.class_name + ' / ' + selected.subject_name)
      : 'Teacher Reports';

    const doc = new jsPdfCtor({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text(title, 36, 36);
    doc.setFontSize(10);
    doc.text('Generated: ' + new Date().toLocaleString(), 36, 52);

    const body = state.filteredRows.map(function (row) {
      return [
        row.student_name,
        row.student_id_number,
        Number.isFinite(row.average) ? formatPct(row.average) : '--',
        row.grade || '-',
        row.statusLabel,
        formatDateTime(row.generated_at),
      ];
    });

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 66,
        head: [['Student', 'Student ID', 'Average %', 'Grade', 'Status', 'Generated']],
        body: body,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [15, 118, 110] },
      });
    }

    doc.save('teacher-reports.pdf');
    showStatus('PDF exported.', 'success');
  }

  function getSelectedClassSubject() {
    const id = String(dom.classSubject?.value || '');
    if (!id) return null;
    return state.classSubjectMap.get(id) || null;
  }

  function matchesSelectedSubject(detail, selected) {
    if (!selected) return true;

    const detailSubjectId = String(detail?.subject_id || '');
    const selectedSubjectId = String(selected?.subject_id || '');
    if (detailSubjectId && selectedSubjectId && detailSubjectId === selectedSubjectId) {
      return true;
    }

    const detailName = normalizeText(detail?.subject_name || detail?.subject_code);
    const selectedName = normalizeText(selected?.subject_name);
    if (!selectedName) {
      return true;
    }

    return detailName === selectedName || detailName.includes(selectedName);
  }

  function deriveStatus(report) {
    const published = isTruthy(report?.is_published) || !!report?.published_at;
    const approved = isTruthy(report?.Approved);
    const rejected = !approved && !!String(report?.principal_comment || '').trim();

    if (published) return 'published';
    if (approved) return 'approved';
    if (rejected) return 'rejected';
    return 'pending';
  }

  function statusLabel(status) {
    if (status === 'published') return 'Published';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Needs correction';
    return 'Pending';
  }

  function summarizeStatuses(rows) {
    return rows.reduce(function (acc, row) {
      const status = String(row?.status || 'pending');
      if (status === 'published') acc.published += 1;
      else if (status === 'approved') acc.approved += 1;
      else if (status === 'rejected') acc.rejected += 1;
      else acc.pending += 1;
      return acc;
    }, { pending: 0, approved: 0, published: 0, rejected: 0 });
  }

  function getCurrentUser() {
    try {
      return typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    } catch (_) {
      return null;
    }
  }

  function scoreToWaecGrade(value) {
    const score = toNumber(value);
    if (!Number.isFinite(score)) return '-';
    if (score >= 75) return 'A1';
    if (score >= 70) return 'B2';
    if (score >= 65) return 'B3';
    if (score >= 60) return 'C4';
    if (score >= 55) return 'C5';
    if (score >= 50) return 'C6';
    if (score >= 45) return 'D7';
    if (score >= 40) return 'E8';
    return 'F9';
  }

  function scoreToGrade(value) {
    const score = toNumber(value);
    if (!Number.isFinite(score)) return '-';

    const scales = Array.isArray(state.gradeScales) ? state.gradeScales : [];
    if (scales.length) {
      const matched = scales.find(function (scale) {
        const min = Number(scale?.min_score);
        const max = Number(scale?.max_score);
        return Number.isFinite(min) && Number.isFinite(max) && score >= min && score <= max;
      });

      if (matched) {
        return String(matched.grade || matched.grade_letter || '-');
      }
    }

    return '-';
  }

  function unwrapSingle(response) {
    if (!response) return null;
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) return response.data;
    if (response.result && typeof response.result === 'object' && !Array.isArray(response.result)) return response.result;
    return response;
  }

  function toReportList(response) {
    const payload = response && response.data ? response.data : response;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.reports)) return payload.reports;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  }

  function toList(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.results)) return value.results;
    return [];
  }

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }

  function formatNumber(value, digits) {
    const n = toNumber(value);
    if (!Number.isFinite(n)) return '--';
    return n.toFixed(digits == null ? 2 : digits);
  }

  function formatPct(value) {
    const n = toNumber(value);
    if (!Number.isFinite(n)) return '--';
    return n.toFixed(2) + '%';
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function isTruthy(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const normalized = String(value == null ? '' : value).toLowerCase().trim();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'published';
  }

  function normalizeText(value) {
    return String(value == null ? '' : value).toLowerCase().trim();
  }

  function fullName(student) {
    return [student?.first_name, student?.last_name].filter(Boolean).join(' ').trim() || ('Student ' + String(student?.student_id || ''));
  }

  function truncate(text, max) {
    const value = String(text || '');
    if (value.length <= max) return value;
    return value.slice(0, Math.max(max - 1, 1)) + '...';
  }

  function setText(el, value) {
    if (el) el.textContent = String(value == null ? '' : value);
  }

  function showStatus(message, type) {
    if (!dom.status) return;
    dom.status.textContent = String(message || '');
    dom.status.className = 'trp-status show ' + String(type || 'info');
  }

  function clearStatus() {
    if (!dom.status) return;
    dom.status.textContent = '';
    dom.status.className = 'trp-status';
  }

  function esc(value) {
    if (typeof escHtml === 'function') {
      return escHtml(String(value ?? ''));
    }

    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }
})();
