/* ============================================
   Teacher Grading Page
============================================ */
(function () {
  'use strict';

  const state = {
    classesSubjects: [],
    categories: [],
    students: [],
    assessments: [],
    selectedClassSubject: null,
    selectedCategories: [],
    categoryMaxScores: {},
    draftScores: {},
    originalScores: {},
    finalScores: {},
    currentAcademicYear: null,
    currentSemester: null,
    loadingToken: 0,
    chart: null,
    gradeCategories: [],
    gradeScales: [],
    gradeScalesLoaded: false,
    gradeScalesLoading: false,
    selectedGradeCategoryId: null,
    submissionSummary: null,
    adminFeedback: [],
    gradeReportStatusByStudent: new Map(),
    initialized: false,
  };

  function hasPageRoot() {
    return !!document.getElementById('gradingPageRoot');
  }

  function esc(value) {
    if (typeof escHtml === 'function') {
      return escHtml(String(value ?? ''));
    }

    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[ch]);
  }

  function showStatus(message, type = 'info') {
    const el = document.getElementById('gradingStatus');
    if (!el) return;

    el.textContent = String(message || '');
    el.className = `gr-status show ${type}`;
  }

  function clearStatus() {
    const el = document.getElementById('gradingStatus');
    if (!el) return;

    el.textContent = '';
    el.className = 'gr-status';
  }

  function showToastMessage(message, type = 'info') {
    if (typeof showToast === 'function') {
      showToast(message, type);
      return;
    }

    showStatus(message, type);
  }

  async function confirmPopup(title, message) {
    if (typeof window.showModal === 'function') {
      return new Promise((resolve) => {
        window.showModal(
          String(title || 'Confirm action'),
          String(message || ''),
          () => resolve(true),
          () => resolve(false)
        );
      });
    }

    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  function setLoading(isLoading, message = 'Loading grade sheet...') {
    if (isLoading) {
      showStatus(message, 'info');
      return;
    }

    clearStatus();
  }

  function getCurrentUser() {
    try {
      return typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    } catch (_) {
      return null;
    }
  }

  function getGradeBandLabel(percentage) {
    return getGradeBandDetails(percentage).band;
  }

  function getSelectedGradeCategory() {
    return state.gradeCategories.find((category) => Number(category.grade_categories_id) === Number(state.selectedGradeCategoryId)) || null;
  }

  function getScalesForSelectedCategory() {
    const categoryId = Number(state.selectedGradeCategoryId);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      return [];
    }

    return state.gradeScales
      .filter(isActiveGradeScale)
      .filter((scale) => Number(scale.grade_categories_id) === categoryId)
      .sort((a, b) => Number(b.max_score) - Number(a.max_score));
  }

  function getActiveGradeScales() {
    return getScalesForSelectedCategory();
  }

  function getGradeBandDetails(percentage) {
    const score = Number(percentage);
    if (!Number.isFinite(score)) {
      return { band: 'N/A', min: null, max: null, label: 'Unavailable' };
    }

    const found = getActiveGradeScales().find((item) => {
      const min = Number(item.min_score);
      const max = Number(item.max_score);
      return Number.isFinite(min) && Number.isFinite(max) && score >= min && score <= max;
    });

    if (!found) {
      return { band: 'N/A', min: null, max: null, label: 'Unavailable' };
    }

    return {
      band: String(found.grade || 'N/A'),
      min: Number(found.min_score),
      max: Number(found.max_score),
      label: String(found.Interpretation || found.remark || '').trim() || 'Available',
    };
  }

  function getBandBadgeClass(band) {
    const label = String(band || '').trim();
    const scales = getActiveGradeScales();
    if (!label || !scales.length) {
      return 'warn';
    }

    const ordered = scales.map((scale) => String(scale.grade || '').trim());
    const index = ordered.findIndex((item) => item === label);
    if (index < 0) {
      return 'warn';
    }

    const topCutoff = Math.max(1, Math.ceil(ordered.length / 3));
    const bottomStart = Math.max(topCutoff, ordered.length - Math.ceil(ordered.length / 3));
    if (index < topCutoff) {
      return 'ok';
    }
    if (index >= bottomStart) {
      return 'bad';
    }
    return 'warn';
  }

  function getPassThreshold() {
    const selected = getSelectedGradeCategory();
    const threshold = Number(selected?.Pass_Threshold);
    return Number.isFinite(threshold) && threshold >= 0 ? threshold : 50;
  }

  function normalizeApiList(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.reports)) return response.data.reports;
    if (Array.isArray(response?.reports)) return response.reports;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    return [];
  }

  function toBool(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const normalized = String(value ?? '').trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'published';
  }

  function deriveReportWorkflow(report) {
    const published = toBool(report?.is_published) || !!report?.published_at;
    const approved = toBool(report?.Approved);
    const hasComment = String(report?.principal_comment || '').trim().length > 0;

    if (published) return 'Published';
    if (approved) return 'Approved (Ready to be Published)';
    if (hasComment) return 'Needs correction';
    return 'Pending';
  }

  function renderAdminFeedbackTable() {
    const summary = document.getElementById('gradingAdminFeedbackSummary');
    const body = document.getElementById('gradingAdminFeedbackBody');
    if (!summary || !body) {
      return;
    }

    const notes = Array.isArray(state.adminFeedback) ? state.adminFeedback : [];
    if (!notes.length) {
      summary.textContent = 'No admin correction notes found for the selected class and term.';
      body.innerHTML = '<tr><td colspan="3" class="gr-mini">No correction notes.</td></tr>';
      return;
    }

    summary.textContent = `${notes.length} feedback note(s) found.`;
    body.innerHTML = notes.map((report) => {
      const workflow = deriveReportWorkflow(report);
      const studentName = String(report.student_name || 'Student');
      const comment = String(report.principal_comment || '').trim() || '-';
      const studentId = String(report.student_id_number || report.student_id || '').trim();
      return `
        <tr>
          <td>${esc(studentName)} (${esc(studentId)})</td>
          <td>${esc(workflow)}</td>
          <td>${esc(comment)}</td>
        </tr>
      `;
    }).join('');
  }

  async function loadAdminFeedbackForCurrentContext() {
    const summary = document.getElementById('gradingAdminFeedbackSummary');
    const body = document.getElementById('gradingAdminFeedbackBody');

    if (!state.selectedClassSubject) {
      state.adminFeedback = [];
      state.gradeReportStatusByStudent = new Map();
      renderAdminFeedbackTable();
      return;
    }

    if (summary) {
      summary.textContent = 'Loading admin feedback notes...';
    }
    if (body) {
      body.innerHTML = '<tr><td colspan="3" class="gr-mini">Loading...</td></tr>';
    }

    const user = getCurrentUser();
    const generatedBy = user?.user_id || user?.id || '';
    const params = {
      page: 1,
      limit: 200,
      class_id: state.selectedClassSubject.class_id,
      academic_year_id: state.currentAcademicYear?.academic_year_id || '',
      semester_id: state.currentSemester?.semester_id || '',
      generated_by: generatedBy,
      has_feedback: 1,
    };

    try {
      const allReportsParams = {
        page: 1,
        limit: 500,
        class_id: state.selectedClassSubject.class_id,
        academic_year_id: state.currentAcademicYear?.academic_year_id || '',
        semester_id: state.currentSemester?.semester_id || '',
        generated_by: generatedBy,
      };
      const allReportsRes = await GradeReportAPI.getAll(allReportsParams);
      const allReports = normalizeApiList(allReportsRes);

      const latestByStudent = new Map();
      allReports
        .slice()
        .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
        .forEach((report) => {
          const studentId = Number(report?.student_id);
          if (!Number.isFinite(studentId) || studentId <= 0 || latestByStudent.has(studentId)) {
            return;
          }

          if (toBool(report?.is_published) || !!report?.published_at) {
            latestByStudent.set(studentId, { status: 'published', label: 'Published' });
            return;
          }

          if (toBool(report?.Approved)) {
            latestByStudent.set(studentId, { status: 'approved', label: 'Approved (Not Published)' });
            return;
          }

          if (String(report?.principal_comment || '').trim().length > 0) {
            latestByStudent.set(studentId, { status: 'needs_correction', label: 'Needs Correction' });
          }
        });

      state.gradeReportStatusByStudent = latestByStudent;

      const reportsRes = await GradeReportAPI.getAll(params);
      const reports = normalizeApiList(reportsRes);

      state.adminFeedback = reports
        .filter((report) => String(report?.principal_comment || '').trim().length > 0)
        .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
      renderAdminFeedbackTable();
    } catch (error) {
      console.error('Failed to load admin feedback:', error);
      state.adminFeedback = [];
      state.gradeReportStatusByStudent = new Map();
      if (summary) {
        summary.textContent = 'Failed to load admin feedback notes.';
      }
      if (body) {
        body.innerHTML = '<tr><td colspan="3" class="gr-mini">Failed to load feedback.</td></tr>';
      }
    }
  }

  function isTeacherUsableCategory(category) {
    const status = String(category?.status || 'active').toLowerCase();
    if (status === 'inactive') {
      return false;
    }

    const usedBy = String(category?.Used_By || '').trim().toLowerCase();
    if (!usedBy) {
      return true;
    }

    return usedBy.includes('teacher') || usedBy.includes('all') || usedBy.includes('both') || usedBy.includes('general');
  }

  function isActiveGradeScale(scale) {
    const status = String(scale?.status ?? scale?.Status ?? 'active').toLowerCase();
    return status !== 'inactive';
  }

  function renderGradeBoundaryLegend() {
    const legendTitle = document.getElementById('gradingBoundaryTitle');
    const legendGrid = document.getElementById('gradingBoundaryGuide');
    const hint = document.getElementById('gradingGradeCategoryHint');
    if (!legendGrid) {
      return;
    }

    const selected = getSelectedGradeCategory();
    const scales = getActiveGradeScales();
    const selectedCategoryScales = getScalesForSelectedCategory();
    if (legendTitle) {
      legendTitle.textContent = `Boundary Guide (${selected?.grade_categories_name || 'Unselected'})`;
    }

    if (hint) {
      if (state.gradeScalesLoading) {
        hint.textContent = 'Loading grade scales...';
      } else if (selected && selectedCategoryScales.length) {
        hint.textContent = `Using ${selectedCategoryScales.length} configured scale band(s).`;
      } else if (state.gradeScalesLoaded) {
        hint.textContent = 'No grade scale rows configured for the selected category.';
      } else {
        hint.textContent = 'Grade scales unavailable (timeout).';
      }
    }

    legendGrid.innerHTML = '';
    scales.forEach((scale) => {
      const min = Number(scale.min_score);
      const max = Number(scale.max_score);
      const item = document.createElement('div');
      item.textContent = `${scale.grade}: ${formatNumber(min, 0)}-${formatNumber(max, 0)}`;
      legendGrid.appendChild(item);
    });
  }

  async function fetchGradeScalesWithRetry(maxAttempts = 2) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await GradeScaleAPI.getAll();
      } catch (error) {
        lastError = error;
        if (attempt >= maxAttempts) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Failed to load grade scales');
  }

  async function loadGradeScalesBackground() {
    if (state.gradeScalesLoading || state.gradeScalesLoaded) {
      return;
    }

    state.gradeScalesLoading = true;
    renderGradeBoundaryLegend();

    try {
      const scalesResponse = await fetchGradeScalesWithRetry(2);
      state.gradeScales = normalizeApiList(scalesResponse).filter(isActiveGradeScale);
      state.gradeScalesLoaded = true;
    } catch (error) {
      console.error('Failed to load grade scales:', error);
      state.gradeScales = [];
      state.gradeScalesLoaded = false;
    } finally {
      state.gradeScalesLoading = false;
      renderGradeBoundaryLegend();
      state.students.forEach((student) => {
        updateRowDraftEstimate(student.student_id);
        updateFinalScoreRow(student.student_id);
      });
      renderInsights();
    }
  }

  async function loadGradeCategoriesAndScales() {
    const select = document.getElementById('gradingGradeCategorySelect');
    if (select) {
      select.innerHTML = '<option value="">Loading grade categories...</option>';
    }

    try {
      const categoriesResponse = await GradeCategoryAPI.getAll();

      state.gradeCategories = normalizeApiList(categoriesResponse).filter(isTeacherUsableCategory);
      state.gradeScales = [];
      state.gradeScalesLoaded = false;

      if (!state.gradeCategories.length) {
        if (select) {
          select.innerHTML = '<option value="">No grade categories</option>';
        }
        renderGradeBoundaryLegend();
        return;
      }

      const preferred = state.gradeCategories.find((category) => Number(category.set_as_primary) === 1) || state.gradeCategories[0];
      state.selectedGradeCategoryId = preferred?.grade_categories_id || null;

      if (select) {
        select.innerHTML = '';
        state.gradeCategories.forEach((category) => {
          const option = document.createElement('option');
          option.value = String(category.grade_categories_id);
          option.textContent = category.grade_categories_name;
          if (Number(category.grade_categories_id) === Number(state.selectedGradeCategoryId)) {
            option.selected = true;
          }
          select.appendChild(option);
        });
      }

      renderGradeBoundaryLegend();
      loadGradeScalesBackground();
    } catch (error) {
      console.error('Failed to load grade categories:', error);
      if (select) {
        select.innerHTML = '<option value="">Failed to load</option>';
      }
      renderGradeBoundaryLegend();
    }
  }

  function formatNumber(value, digits = 2) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : '--';
  }

  function buildKey(studentId, categoryId) {
    return `${studentId}_${categoryId}`;
  }

  function currentPeriodQuery() {
    const params = {};
    if (state.currentAcademicYear?.academic_year_id) {
      params.academic_year_id = state.currentAcademicYear.academic_year_id;
    }
    if (state.currentSemester?.semester_id) {
      params.semester_id = state.currentSemester.semester_id;
    }
    return params;
  }

  async function init() {
    const root = document.getElementById('gradingPageRoot');
    if (!root || root.dataset.initialized === '1') {
      return;
    }

    root.dataset.initialized = '1';
    state.initialized = true;

    bindEvents();
    await loadInitialData();
  }

  function bindEvents() {
    const loadBtn = document.getElementById('gradingLoadBtn');
    const saveBtn = document.getElementById('gradingSaveBtn');
    const submitBtn = document.getElementById('gradingSubmitBtn');
    const refreshBtn = document.getElementById('gradingRefreshBtn');
    const resetBtn = document.getElementById('gradingResetBtn');
    const exportCsvBtn = document.getElementById('gradingExportCsvBtn');
    const exportPdfBtn = document.getElementById('gradingExportPdfBtn');
    const openAssessmentsBtn = document.getElementById('gradingOpenAssessmentsBtn');
    const bulkFillBtn = document.getElementById('gradingBulkFillBtn');
    const bulkClearBtn = document.getElementById('gradingBulkClearBtn');
    const importBtn = document.getElementById('gradingImportBtn');
    const importInput = document.getElementById('gradingImportInput');
    const gradeCategorySelect = document.getElementById('gradingGradeCategorySelect');
    const searchInput = document.getElementById('gradingSearchInput');
    const classSubjectSelect = document.getElementById('gradingClassSubjectSelect');

    if (loadBtn) loadBtn.addEventListener('click', loadGradeSheet);
    if (saveBtn) saveBtn.addEventListener('click', saveDraft);
    if (submitBtn) submitBtn.addEventListener('click', submitForApproval);
    if (refreshBtn) refreshBtn.addEventListener('click', loadInitialData);
    if (resetBtn) resetBtn.addEventListener('click', resetSheet);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportExcel);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportPdf);
    if (openAssessmentsBtn) openAssessmentsBtn.addEventListener('click', () => { window.location.hash = '#assessments'; });
    if (bulkFillBtn) bulkFillBtn.addEventListener('click', applyBulkFill);
    if (bulkClearBtn) bulkClearBtn.addEventListener('click', clearBulkScores);
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', handleImportFile);
    }
    if (searchInput) searchInput.addEventListener('input', () => filterRows(searchInput.value));
    if (classSubjectSelect) classSubjectSelect.addEventListener('change', clearStatus);
    if (gradeCategorySelect) {
      gradeCategorySelect.addEventListener('change', () => {
        state.selectedGradeCategoryId = Number(gradeCategorySelect.value) || null;
        loadGradeScalesBackground();
        renderGradeBoundaryLegend();
        state.students.forEach((student) => {
          updateRowDraftEstimate(student.student_id);
          updateFinalScoreRow(student.student_id);
        });
        renderInsights();
      });
    }
  }

  function normalizeHeader(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function findCategoryForHeader(header) {
    const normalized = normalizeHeader(header);
    if (!normalized) return null;

    return state.selectedCategories.find((category) => {
      const name = normalizeHeader(category.category_name);
      const idKey = `category_${category.category_id}`;
      return normalized === name || normalized === idKey || normalized === String(category.category_id);
    }) || null;
  }

  function findStudentForImportRow(row, rowMap) {
    const studentId = (row['student id'] || row['student_id'] || row['studentid'] || '').trim();
    const studentName = (row.student || row.name || '').trim().toLowerCase();
    if (studentId && rowMap.byId.has(studentId)) {
      return rowMap.byId.get(studentId);
    }
    if (studentName && rowMap.byName.has(studentName)) {
      return rowMap.byName.get(studentName);
    }
    return null;
  }

  function applyBulkFill() {
    if (!state.selectedClassSubject) {
      showStatus('Load a grade sheet before using bulk fill.', 'error');
      return;
    }

    const categoryNames = state.selectedCategories.map((c) => `${c.category_id}: ${c.category_name}`).join('\n');
    const categoryInput = window.prompt(`Enter category ID to fill:\n${categoryNames}`);
    if (categoryInput === null) {
      return;
    }

    const categoryId = Number(categoryInput);
    const targetCategory = state.selectedCategories.find((c) => Number(c.category_id) === categoryId);
    if (!targetCategory) {
      showStatus('Invalid category ID for bulk fill.', 'error');
      return;
    }

    const valueInput = window.prompt(`Enter score value to apply for ${targetCategory.category_name}:`);
    if (valueInput === null) {
      return;
    }

    const value = Number(valueInput);
    if (!Number.isFinite(value) || value < 0) {
      showStatus('Bulk fill requires a valid non-negative score.', 'error');
      return;
    }

    let changed = 0;
    document.querySelectorAll(`.grading-score-input[data-category-id="${targetCategory.category_id}"]`).forEach((input) => {
      const max = Number(input.dataset.maxScore || 0);
      if (Number.isFinite(max) && max > 0 && value > max) {
        input.classList.add('invalid');
        return;
      }

      input.value = String(value);
      input.classList.remove('invalid');
      syncDraftScore(input);
      changed += 1;
    });

    updateStatistics();
    showToastMessage(`Bulk fill applied to ${changed} score cell(s).`, 'success');
  }

  function clearBulkScores() {
    if (!state.selectedClassSubject) {
      showStatus('Load a grade sheet before clearing scores.', 'error');
      return;
    }

    const confirmed = window.confirm('Clear all currently entered scores in this sheet?');
    if (!confirmed) {
      return;
    }

    document.querySelectorAll('.grading-score-input').forEach((input) => {
      input.value = '';
      input.classList.remove('invalid');
      syncDraftScore(input);
    });

    showToastMessage('All score inputs cleared.', 'info');
  }

  function parseDelimitedRows(text) {
    const lines = String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return [];
    }

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map((header) => normalizeHeader(header));

    return lines.slice(1).map((line) => {
      const cells = line.split(delimiter).map((cell) => cell.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = cells[index] || '';
      });
      return row;
    });
  }

  async function handleImportFile(event) {
    if (!state.selectedClassSubject) {
      showStatus('Load a grade sheet before importing values.', 'error');
      event.target.value = '';
      return;
    }

    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const rows = parseDelimitedRows(text);
      if (!rows.length) {
        showStatus('Import file must include a header row and at least one data row.', 'error');
        return;
      }

      const rowMap = {
        byId: new Map(),
        byName: new Map(),
      };

      state.students.forEach((student) => {
        rowMap.byId.set(String(student.student_id_number || student.student_id || '').trim(), student);
        const name = `${student.first_name || ''} ${student.last_name || ''}`.trim().toLowerCase();
        if (name) rowMap.byName.set(name, student);
      });

      let updated = 0;
      rows.forEach((row) => {
        const student = findStudentForImportRow(row, rowMap);
        if (!student) {
          return;
        }

        Object.keys(row).forEach((header) => {
          const category = findCategoryForHeader(header);
          if (!category) {
            return;
          }

          const rawValue = row[header];
          if (rawValue === '') {
            return;
          }

          const value = Number(rawValue);
          if (!Number.isFinite(value) || value < 0) {
            return;
          }

          const input = document.querySelector(
            `.grading-score-input[data-student-id="${student.student_id}"][data-category-id="${category.category_id}"]`
          );
          if (!input) {
            return;
          }

          const max = Number(input.dataset.maxScore || 0);
          if (Number.isFinite(max) && max > 0 && value > max) {
            input.classList.add('invalid');
            return;
          }

          input.value = String(value);
          input.classList.remove('invalid');
          syncDraftScore(input);
          updated += 1;
        });
      });

      updateStatistics();
      showToastMessage(`Imported ${updated} score value(s).`, 'success');
    } catch (error) {
      console.error('Import failed:', error);
      showStatus('Failed to import grade values.', 'error');
    } finally {
      event.target.value = '';
    }
  }

  function summarizeSubmissionStatus() {
    const statusMap = getStudentSubmissionStatusMap();

    const summary = {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      published: 0,
      needs_correction: 0,
      total: 0,
      status: 'draft',
    };

    statusMap.forEach((value) => {
      summary.total += 1;
      if (value.status === 'published') {
        summary.published += 1;
        return;
      }
      if (value.status === 'needs_correction') {
        summary.needs_correction += 1;
        return;
      }
      if (value.status === 'pending_approval') {
        summary.pending_approval += 1;
        return;
      }
      if (value.status === 'approved') {
        summary.approved += 1;
        return;
      }
      summary.draft += 1;
    });

    if (summary.needs_correction > 0) {
      summary.status = 'needs_correction';
    } else if (summary.published > 0 && summary.pending_approval === 0 && summary.draft === 0) {
      summary.status = 'published';
    } else if (summary.pending_approval > 0) {
      summary.status = 'pending_approval';
    } else if ((summary.approved > 0 || summary.published > 0) && summary.draft === 0) {
      summary.status = 'approved';
    } else {
      summary.status = 'draft';
    }

    state.submissionSummary = summary;
    return summary;
  }

  function isPendingStatus(rawStatus) {
    const status = String(rawStatus || '').toLowerCase();
    return status === 'pending_approval' || status === 'pending_approve';
  }

  function isApprovedStatus(rawStatus, isPublished) {
    const status = String(rawStatus || '').toLowerCase();
    return status === 'published' || status === 'graded' || status === 'approved' || Number(isPublished) === 1;
  }

  function getStudentSubmissionStatusMap() {
    const byStudent = new Map();
    const requiredCategoryIds = (state.selectedCategories || [])
      .map((category) => Number(category?.category_id))
      .filter((categoryId) => Number.isFinite(categoryId) && categoryId > 0);
    const requiredCategorySet = new Set(requiredCategoryIds);

    (state.assessments || []).forEach((group) => {
      const categoryId = Number(group?.category_id);
      if (!requiredCategorySet.has(categoryId)) {
        return;
      }

      (group.scores || []).forEach((score) => {
        const studentId = Number(score?.student_id);
        if (!Number.isFinite(studentId) || studentId <= 0) {
          return;
        }

        const bucket = byStudent.get(studentId) || {
          categoryStatuses: new Map(),
        };

        const currentCategoryStatus = bucket.categoryStatuses.get(categoryId);
        let nextCategoryStatus = 'draft';
        if (isPendingStatus(score?.status)) {
          nextCategoryStatus = 'pending_approval';
        } else if (isApprovedStatus(score?.status, score?.is_published)) {
          nextCategoryStatus = 'approved';
        }

        // If multiple rows appear for the same category/student, keep the strongest state.
        if (currentCategoryStatus === 'pending_approval') {
          nextCategoryStatus = 'pending_approval';
        } else if (currentCategoryStatus === 'approved' && nextCategoryStatus === 'draft') {
          nextCategoryStatus = 'approved';
        }

        bucket.categoryStatuses.set(categoryId, nextCategoryStatus);

        byStudent.set(studentId, bucket);
      });
    });

    // Ensure students with no submissions are represented as draft.
    (state.students || []).forEach((student) => {
      const studentId = Number(student?.student_id);
      if (!Number.isFinite(studentId) || studentId <= 0 || byStudent.has(studentId)) {
        return;
      }

      byStudent.set(studentId, {
        categoryStatuses: new Map(),
      });
    });

    const statusMap = new Map();
    byStudent.forEach((bucket, studentId) => {
      let status = 'draft';
      let label = 'Draft';

      const categoryStatuses = bucket.categoryStatuses instanceof Map
        ? Array.from(bucket.categoryStatuses.values())
        : [];
      const hasAllCategories = requiredCategoryIds.length > 0
        && bucket.categoryStatuses.size === requiredCategoryIds.length;
      const allPending = hasAllCategories && categoryStatuses.every((value) => value === 'pending_approval');
      const allApproved = hasAllCategories && categoryStatuses.every((value) => value === 'approved');

      if (allPending) {
        status = 'pending_approval';
        label = 'Pending Approval';
      } else if (allApproved) {
        status = 'approved';
        label = 'Approved (Not Published)';
      }

      const reportStatus = state.gradeReportStatusByStudent.get(studentId);
      if (reportStatus?.status === 'published') {
        status = 'published';
        label = 'Published';
      } else if (reportStatus?.status === 'approved') {
        status = 'approved';
        label = 'Approved (Not Published)';
      } else if (reportStatus?.status === 'needs_correction') {
        status = 'needs_correction';
        label = 'Needs Correction';
      }

      statusMap.set(studentId, { status, label });
    });

    return statusMap;
  }

  function renderSubmissionStatusTable(statusMap) {
    const body = document.getElementById('gradingSubmissionStatusBody');
    if (!body) {
      return;
    }

    const submittedStudents = state.students
      .filter((student) => {
        const studentStatus = statusMap.get(Number(student.student_id))?.status || 'draft';
        return studentStatus !== 'draft';
      })
      .sort((a, b) => {
        const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
        const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
        return aName.localeCompare(bName);
      });

    if (!submittedStudents.length) {
      body.innerHTML = '<tr><td colspan="3" class="gr-mini">No submitted students found for this sheet.</td></tr>';
      return;
    }

    body.innerHTML = submittedStudents.map((student) => {
      const studentId = Number(student.student_id);
      const status = statusMap.get(studentId)?.label || 'Pending Approval';
      const name = `${student.first_name || ''} ${student.last_name || ''}`.trim() || `Student ${studentId}`;
      const idNumber = student.student_id_number || student.student_id || 'N/A';

      return `
        <tr>
          <td>${esc(name)}</td>
          <td>${esc(idNumber)}</td>
          <td>${esc(status)}</td>
        </tr>
      `;
    }).join('');
  }

  function renderSubmissionStatus() {
    const badge = document.getElementById('gradingSubmissionStatusBadge');
    const counts = document.getElementById('gradingSubmissionStatusCounts');
    const statusMap = getStudentSubmissionStatusMap();
    const summary = summarizeSubmissionStatus();

    if (badge) {
      if (summary.status === 'published') {
        badge.className = 'gr-badge ok';
        badge.innerHTML = '<i class="fas fa-circle-check"></i> Published';
      } else if (summary.status === 'needs_correction') {
        badge.className = 'gr-badge bad';
        badge.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Needs Correction';
      } else if (summary.status === 'approved') {
        badge.className = 'gr-badge ok';
        badge.innerHTML = '<i class="fas fa-circle-check"></i> Approved (Not Published)';
      } else if (summary.status === 'pending_approval') {
        badge.className = 'gr-badge warn';
        badge.innerHTML = '<i class="fas fa-hourglass-half"></i> Pending Approval';
      } else {
        badge.className = 'gr-badge bad';
        badge.innerHTML = '<i class="fas fa-pen"></i> Draft';
      }
    }

    if (counts) {
      counts.textContent = `Draft ${summary.draft} | Pending ${summary.pending_approval} | Approved ${summary.approved} | Published ${summary.published} | Needs Correction ${summary.needs_correction}`;
    }

    renderSubmissionStatusTable(statusMap);
  }

  async function loadInitialData() {
    try {
      setLoading(true, 'Loading classes, categories, and current period...');

      await Promise.all([
        loadCurrentAcademicYear(),
        loadCurrentSemester(),
        loadClassesSubjects(),
        loadCategories(),
        loadGradeCategoriesAndScales(),
      ]);

      renderAdminFeedbackTable();

      setLoading(false);
    } catch (error) {
      console.error('Failed to load grading page data:', error);
      showStatus('Failed to load grading page data. Please refresh.', 'error');
    }
  }

  async function loadCurrentAcademicYear() {
    const el = document.getElementById('gradingAcademicYearValue');
    if (el) el.textContent = 'Academic year not set';

    try {
      const response = await API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT);
      state.currentAcademicYear = response?.data || response || null;
      const label = state.currentAcademicYear?.year_name || state.currentAcademicYear?.name || '';
      if (el && label) el.textContent = label;
    } catch (error) {
      console.warn('Failed to load current academic year for grading page.', error);
    }
  }

  async function loadCurrentSemester() {
    const el = document.getElementById('gradingSemesterValue');
    if (el) el.textContent = 'Semester not set';

    try {
      const response = await API.get(API_ENDPOINTS.SEMESTER_CURRENT);
      state.currentSemester = response?.data || response || null;
      const label = state.currentSemester?.semester_name || state.currentSemester?.name || '';
      if (el && label) el.textContent = label;
    } catch (error) {
      console.warn('Failed to load current semester for grading page.', error);
    }
  }

  async function loadClassesSubjects() {
    const select = document.getElementById('gradingClassSubjectSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select class and subject --</option>';

    try {
      const response = await TeacherAssessmentAPI.getClassesSubjects();
      state.classesSubjects = response?.data?.classes_subjects || [];

      state.classesSubjects.forEach((group) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.class_name;

        (group.subjects || []).forEach((subject) => {
          const option = document.createElement('option');
          option.value = JSON.stringify({
            class_id: group.class_id,
            class_name: group.class_name,
            class_subject_id: subject.class_subject_id,
            subject_name: subject.subject_name,
          });
          option.textContent = subject.subject_name;
          optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
      });
    } catch (error) {
      console.error('Failed to load classes and subjects for grading page:', error);
      showStatus('Failed to load classes and subjects.', 'error');
    }
  }

  async function loadCategories() {
    const container = document.getElementById('gradingCategoryList');
    if (container) {
      container.innerHTML = '<div class="gr-mini">Loading categories...</div>';
    }

    try {
      const response = await TeacherAssessmentAPI.getCategories();
      state.categories = response?.data?.categories || [];

      if (!container) {
        return;
      }

      if (!state.categories.length) {
        container.innerHTML = '<div class="gr-mini">No categories available.</div>';
        return;
      }

      container.innerHTML = '';

      // Display all categories as read-only (auto-selected, no manual selection)
      state.categories.forEach((category) => {
        const label = document.createElement('label');
        label.className = 'gr-check-item';
        label.style.pointerEvents = 'none';
        label.innerHTML = `<input type="checkbox" class="grading-category-checkbox" value="${category.category_id}" checked disabled> <span>${esc(category.category_name)} <span class="gr-mini">(${formatNumber(category.weight_percentage, 0)}% weight)</span></span>`;
        container.appendChild(label);
      });
    } catch (error) {
      console.error('Failed to load categories for grading page:', error);
      state.categories = [];
      if (container) {
        container.innerHTML = '<div class="gr-mini">Failed to load categories.</div>';
      }
    }
  }

  function getSelectedClassSubject() {
    const select = document.getElementById('gradingClassSubjectSelect');
    if (!select || !select.value) {
      return null;
    }

    try {
      return JSON.parse(select.value);
    } catch (_) {
      return null;
    }
  }

  function getSelectedCategories() {
    return Array.from(document.querySelectorAll('.grading-category-checkbox:checked')).map((checkbox) => {
      const categoryId = Number(checkbox.value);
      return state.categories.find((category) => Number(category.category_id) === categoryId) || {
        category_id: categoryId,
        category_name: checkbox.nextElementSibling ? checkbox.nextElementSibling.textContent.trim() : `Category ${categoryId}`,
        weight_percentage: 0,
      };
    });
  }

  function getAssessmentScore(studentId, categoryId) {
    for (const group of state.assessments) {
      if (Number(group.category_id) !== Number(categoryId)) {
        continue;
      }

      const score = (group.scores || []).find((item) => Number(item.student_id) === Number(studentId));
      if (score) {
        return score;
      }
    }

    return null;
  }

  function getCategoryMaxScore(categoryId) {
    const stored = state.categoryMaxScores[categoryId];
    if (Number.isFinite(Number(stored)) && Number(stored) > 0) {
      return Number(stored);
    }

    const score = (() => {
      for (const group of state.assessments) {
        if (Number(group.category_id) !== Number(categoryId)) {
          continue;
        }

        const first = Array.isArray(group.scores) && group.scores.length ? group.scores[0] : null;
        if (first && Number(first.max_score) > 0) {
          return Number(first.max_score);
        }
      }
      return 100;
    })();

    state.categoryMaxScores[categoryId] = score;
    return score;
  }

  function buildAssessmentPayload() {
    const payload = [];
    if (!state.selectedClassSubject) {
      return payload;
    }

    state.students.forEach((student) => {
      state.selectedCategories.forEach((category) => {
        const key = buildKey(student.student_id, category.category_id);
        const score = state.draftScores[key];
        if (score === '' || score === null || score === undefined || !Number.isFinite(Number(score))) {
          return;
        }

        payload.push({
          class_subject_id: state.selectedClassSubject.class_subject_id,
          student_id: Number(student.student_id),
          category_id: Number(category.category_id),
          score: Number(score),
          max_score: Number(getCategoryMaxScore(category.category_id) || 100),
        });
      });
    });

    return payload;
  }

  function validateSheet() {
    let ok = true;
    const errors = [];

    document.querySelectorAll('.grading-max-input').forEach((input) => {
      const value = Number(input.value);
      if (!Number.isFinite(value) || value <= 0) {
        ok = false;
        input.classList.add('invalid');
        errors.push(`${input.dataset.categoryName || 'Category'} max score is required`);
      } else {
        input.classList.remove('invalid');
      }
    });

    document.querySelectorAll('.grading-score-input').forEach((input) => {
      if (!input.value) {
        input.classList.remove('invalid');
        return;
      }

      const value = Number(input.value);
      const max = Number(input.dataset.maxScore || 0);
      if (!Number.isFinite(value) || value < 0 || (Number.isFinite(max) && max > 0 && value > max)) {
        ok = false;
        input.classList.add('invalid');
        errors.push(`${input.dataset.studentName || 'Student'} / ${input.dataset.categoryName || 'Category'}`);
      } else {
        input.classList.remove('invalid');
      }
    });

    if (!ok) {
      showStatus(`Validation failed:\n${errors.slice(0, 8).join('\n')}`, 'error');
    }

    return ok;
  }

  function syncDraftScore(input) {
    const key = buildKey(input.dataset.studentId, input.dataset.categoryId);
    const value = input.value === '' ? '' : Number(input.value);
    state.draftScores[key] = value;
    const studentId = Number(input.dataset.studentId);
    updateRowDraftEstimate(studentId);
    updateFinalScoreRow(studentId);
  }

  function getEnteredCategoryCount(studentId) {
    let entered = 0;
    state.selectedCategories.forEach((category) => {
      const key = buildKey(studentId, category.category_id);
      const raw = String(state.draftScores[key] ?? '').trim();
      if (raw === '') {
        return;
      }

      const numeric = Number(raw);
      if (Number.isFinite(numeric) && numeric >= 0) {
        entered += 1;
      }
    });

    return entered;
  }

  function getDraftEstimateValue(studentId) {
    let weightedSum = 0;
    let enteredCount = 0;

    state.selectedCategories.forEach((category) => {
      const key = buildKey(studentId, category.category_id);
      const rawScore = state.draftScores[key];
      if (rawScore === '' || rawScore === null || rawScore === undefined) {
        return;
      }

      const score = Number(rawScore);
      const max = Number(getCategoryMaxScore(category.category_id) || 0);
      const weight = Number(category.weight_percentage || 0);
      if (Number.isFinite(score) && Number.isFinite(max) && max > 0) {
        weightedSum += ((score / max) * weight);
        enteredCount += 1;
      }
    });

    return {
      enteredCount,
      weightedSum,
      hasEstimate: enteredCount > 0,
    };
  }

  function getStudentResultForDisplay(studentId) {
    const finalScore = state.finalScores[studentId];
    if (finalScore && finalScore.complete && Number.isFinite(Number(finalScore.final_percentage))) {
      return {
        available: true,
        score: Number(finalScore.final_percentage),
        source: 'published',
        finalScore,
      };
    }

    const estimate = getDraftEstimateValue(studentId);
    if (estimate.hasEstimate && Number.isFinite(Number(estimate.weightedSum))) {
      return {
        available: true,
        score: Number(estimate.weightedSum),
        source: 'draft',
        finalScore,
      };
    }

    return {
      available: false,
      score: null,
      source: 'none',
      finalScore,
    };
  }

  function updateRowDraftEstimate(studentId) {
    const row = document.querySelector(`tr[data-student-row="${studentId}"]`);
    if (!row) {
      return;
    }

    const estimate = getDraftEstimateValue(studentId);

    const estimateCell = row.querySelector('[data-draft-estimate]');
    const estimateGradeCell = row.querySelector('[data-draft-grade]');
    if (estimateCell) {
      estimateCell.textContent = estimate.hasEstimate ? `${formatNumber(estimate.weightedSum)}%` : '--';
    }
    if (estimateGradeCell) {
      estimateGradeCell.textContent = estimate.hasEstimate ? getGradeBandLabel(estimate.weightedSum) : '--';
    }
  }

  function renderSheet() {
    const sheet = document.getElementById('gradingSheetSection');
    const headRow = document.getElementById('gradingTableHeadRow');
    const body = document.getElementById('gradingTableBody');
    const subtitle = document.getElementById('gradingSheetSubtitle');
    const searchInput = document.getElementById('gradingSearchInput');

    if (!sheet || !headRow || !body || !subtitle) {
      return;
    }

    const classSubject = state.selectedClassSubject;
    const statusMap = getStudentSubmissionStatusMap();
    const visibleStudents = state.students.filter((student) => {
      const studentStatus = statusMap.get(Number(student.student_id))?.status || 'draft';
      return !isPendingStatus(studentStatus);
    });

    subtitle.textContent = classSubject
      ? `${classSubject.class_name} - ${classSubject.subject_name} | ${visibleStudents.length} in grade table, ${Math.max(state.students.length - visibleStudents.length, 0)} pending approval`
      : 'No class selected.';

    headRow.innerHTML = '<th>Student</th><th>Status</th>';

    state.selectedCategories.forEach((category) => {
      const th = document.createElement('th');
      const maxScore = getCategoryMaxScore(category.category_id);
      th.innerHTML = `
        <div class="gr-cell-wrap">
          <div class="gr-cell-head">
            <div class="gr-cat-name">${esc(category.category_name)}</div>
            <span class="gr-weight">${formatNumber(category.weight_percentage, 0)}%</span>
          </div>
          <div class="gr-mini"><strong>${formatNumber(maxScore)}</strong></div>
          <div class="gr-mini">Score / max score</div>
        </div>
      `;
      headRow.appendChild(th);
    });

    const estimatedHead = document.createElement('th');
    estimatedHead.textContent = 'Draft estimate';
    headRow.appendChild(estimatedHead);

    const publishedHead = document.createElement('th');
    publishedHead.textContent = 'Published final';
    headRow.appendChild(publishedHead);

    const gradeHead = document.createElement('th');
    gradeHead.textContent = `${getSelectedGradeCategory()?.grade_categories_name || 'Grade'} band`;
    headRow.appendChild(gradeHead);

    body.innerHTML = '';

    if (!visibleStudents.length) {
      const emptyMessage = state.students.length
        ? 'All submitted students are pending approval. Check Submission Status above for details.'
        : 'No students were found for the selected class and subject.';
      body.innerHTML = `
        <tr>
          <td colspan="${5 + state.selectedCategories.length}">
            <div class="gr-empty">
              <i class="fas fa-hourglass-half"></i>
              <div>${esc(emptyMessage)}</div>
            </div>
          </td>
        </tr>
      `;
      sheet.style.display = 'grid';
      updateStatistics();
      return;
    }

    visibleStudents.forEach((student) => {
      const tr = document.createElement('tr');
      tr.dataset.studentRow = student.student_id;
      tr.dataset.search = `${student.first_name || ''} ${student.last_name || ''} ${student.student_id_number || ''}`.toLowerCase();

      const nameTd = document.createElement('td');
      nameTd.className = 'gr-student-cell';
      nameTd.innerHTML = `
        <div class="gr-name">${esc(student.first_name || '')} ${esc(student.last_name || '')}</div>
        <div class="gr-meta">ID: ${esc(student.student_id_number || student.student_id || 'N/A')}</div>
      `;
      tr.appendChild(nameTd);

      const statusTd = document.createElement('td');
      statusTd.innerHTML = `<span class="gr-badge warn" data-status-cell="${student.student_id}"><i class="fas fa-clock"></i> Loading</span>`;
      tr.appendChild(statusTd);

      state.selectedCategories.forEach((category) => {
        const td = document.createElement('td');
        const existing = getAssessmentScore(student.student_id, category.category_id);
        const maxScore = getCategoryMaxScore(category.category_id);
        const key = buildKey(student.student_id, category.category_id);
        const value = existing ? existing.score : (state.draftScores[key] ?? '');

        if (existing) {
          state.originalScores[key] = Number(existing.score);
        }

        const scoreLabel = value === '' || value === null || value === undefined
          ? '--'
          : formatNumber(Number(value));
        td.innerHTML = `
          <div class="gr-cell-wrap">
            <span class="gr-input">${esc(scoreLabel)}</span>
            <div class="gr-mini">${formatNumber(existing ? existing.score : 0)} / ${formatNumber(maxScore)} ${existing && existing.status ? `| ${esc(existing.status)}` : ''}</div>
          </div>
        `;
        tr.appendChild(td);
      });

      const estimateTd = document.createElement('td');
      estimateTd.innerHTML = `<strong data-draft-estimate>--</strong><div class="gr-mini" data-draft-grade>--</div>`;
      tr.appendChild(estimateTd);

      const finalTd = document.createElement('td');
      finalTd.innerHTML = `<strong data-final-cell="${student.student_id}">Loading...</strong><div class="gr-mini" data-final-detail>Live result</div>`;
      tr.appendChild(finalTd);

      const bandTd = document.createElement('td');
      bandTd.innerHTML = `<span class="gr-badge warn" data-final-grade-cell="${student.student_id}">Loading</span>`;
      tr.appendChild(bandTd);

      body.appendChild(tr);
    });

    sheet.style.display = 'grid';

    visibleStudents.forEach((student) => updateRowDraftEstimate(student.student_id));

    if (searchInput) {
      filterRows(searchInput.value);
    }
  }

  function updateStatistics() {
    const totalStudents = state.students.length;
    let completeCount = 0;
    let incompleteCount = 0;
    let finalSum = 0;
    let highest = -Infinity;
    let lowest = Infinity;
    let passCount = 0;

    state.students.forEach((student) => {
      const display = getStudentResultForDisplay(student.student_id);
      if (display.available && Number.isFinite(Number(display.score))) {
        const finalValue = Number(display.score);
        completeCount += 1;
        finalSum += finalValue;
        highest = Math.max(highest, finalValue);
        lowest = Math.min(lowest, finalValue);
        if (finalValue >= getPassThreshold()) {
          passCount += 1;
        }
      } else {
        incompleteCount += 1;
      }
    });

    const avg = completeCount > 0 ? finalSum / completeCount : 0;
    const passRate = completeCount > 0 ? (passCount / completeCount) * 100 : 0;

    const totalEl = document.getElementById('gradingTotalStudents');
    const completeEl = document.getElementById('gradingCompleteCount');
    const avgEl = document.getElementById('gradingAverageFinal');
    const highestEl = document.getElementById('gradingHighestFinal');
    const lowestEl = document.getElementById('gradingLowestFinal');
    const passRateEl = document.getElementById('gradingPassRate');

    if (totalEl) totalEl.textContent = String(totalStudents);
    if (completeEl) completeEl.textContent = String(completeCount);
    if (avgEl) avgEl.textContent = `${formatNumber(avg)}%`;
    if (highestEl) highestEl.textContent = completeCount > 0 ? `${formatNumber(highest)}%` : '--';
    if (lowestEl) lowestEl.textContent = completeCount > 0 ? `${formatNumber(lowest)}%` : '--';
    if (passRateEl) passRateEl.textContent = `${formatNumber(passRate)}%`;
  }

  function updateFinalScoreRow(studentId) {
    const result = state.finalScores[studentId];
    const display = getStudentResultForDisplay(studentId);
    const scoreCell = document.querySelector(`[data-final-cell="${studentId}"]`);
    const gradeCell = document.querySelector(`[data-final-grade-cell="${studentId}"]`);
    const statusCell = document.querySelector(`[data-status-cell="${studentId}"]`);
    const detailCell = document.querySelector(`tr[data-student-row="${studentId}"] [data-final-detail]`);

    if (!scoreCell || !gradeCell || !statusCell) {
      return;
    }

    if (!result) {
      scoreCell.textContent = 'Loading...';
      gradeCell.className = 'gr-badge warn';
      gradeCell.textContent = 'Loading';
      statusCell.className = 'gr-badge warn';
      statusCell.innerHTML = '<i class="fas fa-clock"></i> Loading';
      return;
    }

    if (display.available && Number.isFinite(Number(display.score))) {
      const finalValue = Number(display.score);
      const bandDetails = getGradeBandDetails(finalValue);
      const band = bandDetails.band;
      scoreCell.textContent = `${formatNumber(finalValue)}%`;
      gradeCell.className = `gr-badge ${getBandBadgeClass(band)}`;
      gradeCell.textContent = `${band} (${formatNumber(bandDetails.min, 0)}-${formatNumber(bandDetails.max, 0)})`;
      if (display.source === 'published') {
        statusCell.className = 'gr-badge ok';
        statusCell.innerHTML = '<i class="fas fa-circle-check"></i> Published';
      } else {
        statusCell.className = 'gr-badge warn';
        statusCell.innerHTML = '<i class="fas fa-pen"></i> Draft result';
      }
      if (detailCell) {
        if (display.source === 'published') {
          detailCell.textContent = `Weights total ${formatNumber(result.weights_sum)}% | Published categories ${result.published_categories_count}`;
        } else {
          detailCell.textContent = 'Live estimate from entered category marks.';
        }
      }
    } else {
      const missingPublished = Array.isArray(result.missing_categories) ? result.missing_categories.length : 0;
      const totalCategories = state.selectedCategories.length;
      const enteredCount = getEnteredCategoryCount(studentId);
      const missingInput = Math.max(totalCategories - enteredCount, 0);

      gradeCell.className = 'gr-badge bad';
      gradeCell.textContent = 'N/A';

      if (missingInput > 0) {
        scoreCell.textContent = `Incomplete (${missingInput})`;
        statusCell.className = 'gr-badge bad';
        statusCell.innerHTML = `<i class="fas fa-triangle-exclamation"></i> Missing ${missingInput}`;
        if (detailCell) {
          detailCell.textContent = 'Enter scores for all selected assessment categories.';
        }
      } else {
        const estimate = getDraftEstimateValue(studentId);
        const draftBand = estimate.hasEstimate ? getGradeBandDetails(estimate.weightedSum) : null;
        const draftBandCode = draftBand?.band || 'N/A';

        scoreCell.textContent = 'Awaiting publish';
        statusCell.className = 'gr-badge warn';
        statusCell.innerHTML = '<i class="fas fa-hourglass-half"></i> All scores entered';
        gradeCell.className = `gr-badge ${getBandBadgeClass(draftBandCode)}`;
        gradeCell.textContent = estimate.hasEstimate
          ? `${draftBandCode} (${formatNumber(draftBand.min, 0)}-${formatNumber(draftBand.max, 0)})`
          : 'N/A';
        if (detailCell) {
          detailCell.textContent = missingPublished > 0
            ? 'All categories have marks. Result will remain as draft until published.'
            : 'All categories have marks. Result is pending final sync.';
        }
      }
    }
  }

  function renderInsights() {
    const breakdown = document.getElementById('gradingBreakdownList');
    if (!breakdown) {
      return;
    }

    const resultStudents = state.students
      .map((student) => ({
        student,
        display: getStudentResultForDisplay(student.student_id),
      }))
      .filter((item) => item.display.available && Number.isFinite(Number(item.display.score)));

    const average = resultStudents.length
      ? resultStudents.reduce((sum, item) => sum + Number(item.display.score || 0), 0) / resultStudents.length
      : 0;

    const scales = getActiveGradeScales();
    const counts = {};
    scales.forEach((scale) => {
      counts[String(scale.grade)] = 0;
    });
    resultStudents.forEach((item) => {
      const band = getGradeBandLabel(Number(item.display.score || 0));
      if (counts[band] !== undefined) {
        counts[band] += 1;
      }
    });

    const strongCount = scales.slice(0, 3).reduce((sum, scale) => sum + Number(counts[String(scale.grade)] || 0), 0);
    const lastScale = scales.length ? scales[scales.length - 1] : null;
    const weakCount = lastScale ? Number(counts[String(lastScale.grade)] || 0) : 0;

    breakdown.innerHTML = `
      <div class="gr-stat"><strong>${formatNumber(average)}%</strong><span>Average final score</span></div>
      <div class="gr-stat"><strong>${resultStudents.length}</strong><span>Students with live results</span></div>
      <div class="gr-stat"><strong>${strongCount}</strong><span>Top-band grades</span></div>
      <div class="gr-stat"><strong>${weakCount}</strong><span>Lowest-band grades</span></div>
      <div class="gr-mini">Results stay visible at all times. Published scores come from API; draft results use entered category marks.</div>
    `;

    renderChart(counts);
  }

  function renderChart(counts) {
    const canvas = document.getElementById('gradingDistributionChart');
    if (!canvas) {
      return;
    }

    const labels = getActiveGradeScales().map((scale) => String(scale.grade));
    const values = labels.map((label) => counts[label] || 0);

    if (state.chart) {
      state.chart.destroy();
      state.chart = null;
    }

    if (typeof Chart === 'undefined') {
      return;
    }

    state.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#16a34a', '#22c55e', '#4ade80', '#0ea5e9', '#38bdf8', '#7dd3fc', '#f59e0b', '#fb923c', '#ef4444', '#8b5cf6', '#6b7280'],
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

  async function loadGradeSheet() {
    const classSubject = getSelectedClassSubject();
    const selectedCategories = getSelectedCategories();
    const categories = selectedCategories.length ? selectedCategories : (state.categories || []);

    if (!classSubject) {
      showStatus('Select a class and subject before loading the grade sheet.', 'error');
      return;
    }

    if (!categories.length) {
      showStatus('No assessment categories are available for this class.', 'error');
      return;
    }

    state.selectedClassSubject = classSubject;
    state.selectedCategories = categories;
    state.finalScores = {};
    state.originalScores = {};
    state.draftScores = {};
    state.gradeReportStatusByStudent = new Map();

    const token = ++state.loadingToken;

    try {
      setLoading(true, 'Loading students and published final scores...');

      const [studentsResponse, assessmentsResponse] = await Promise.all([
        TeacherAssessmentAPI.getStudents({
          class_id: classSubject.class_id,
          class_subject_id: classSubject.class_subject_id,
        }),
        TeacherAssessmentAPI.getExistingAssessments({
          class_id: classSubject.class_id,
          class_subject_id: classSubject.class_subject_id,
        }),
      ]);

      if (token !== state.loadingToken) {
        return;
      }

      const allStudents = studentsResponse?.data?.students || [];
      state.assessments = assessmentsResponse?.data?.assessments || [];
      state.students = allStudents;
      state.categoryMaxScores = {};
      state.students.forEach((student) => {
        state.selectedCategories.forEach((category) => {
          const existing = getAssessmentScore(student.student_id, category.category_id);
          if (existing) {
            state.draftScores[buildKey(student.student_id, category.category_id)] = existing.score;
            state.categoryMaxScores[category.category_id] = Number(existing.max_score) > 0 ? Number(existing.max_score) : (state.categoryMaxScores[category.category_id] || 100);
          }
        });
      });

      renderSheet();
      await loadFinalScores(token);
      await loadAdminFeedbackForCurrentContext();
      renderSubmissionStatus();
      updateStatistics();
      renderInsights();
      setLoading(false);
      showToastMessage('Grade sheet loaded successfully.', 'success');
    } catch (error) {
      console.error('Failed to load grade sheet:', error);
      setLoading(false);
      showStatus('Failed to load grade sheet. Please try again.', 'error');
    }
  }

  async function loadFinalScores(token) {
    const classSubject = state.selectedClassSubject;
    if (!classSubject || !state.students.length) {
      return;
    }

    const params = currentPeriodQuery();
    const requests = state.students.map(async (student) => {
      try {
        const response = await GradeAPI.getFinalScore(classSubject.class_subject_id, student.student_id, params);
        if (token !== state.loadingToken) {
          return;
        }
        state.finalScores[student.student_id] = response?.data || response || null;
      } catch (error) {
        console.warn(`Failed to load final score for student ${student.student_id}:`, error);
        state.finalScores[student.student_id] = {
          complete: false,
          missing_categories: [],
          final_percentage: null,
          weights_sum: 0,
          published_categories_count: 0,
        };
      }

      updateFinalScoreRow(student.student_id);
    });

    await Promise.all(requests);

    if (token === state.loadingToken) {
      renderInsights();
      updateStatistics();
    }
  }

  async function saveDraft() {
    if (!state.selectedClassSubject) {
      showStatus('Load a grade sheet before saving draft scores.', 'error');
      return;
    }

    if (!validateSheet()) {
      return;
    }

    const assessments = buildAssessmentPayload();
    if (!assessments.length) {
      showStatus('Enter at least one score before saving.', 'error');
      return;
    }

    try {
      showStatus('Saving draft scores...', 'info');
      const response = await TeacherAssessmentAPI.saveAssessments({
        class_subject_id: state.selectedClassSubject.class_subject_id,
        assessments,
      });

      if (response?.success) {
        showToastMessage('Draft scores saved.', 'success');
        await loadGradeSheet();
        return;
      }

      showStatus(response?.message || 'Failed to save draft scores.', 'error');
    } catch (error) {
      console.error('Failed to save draft scores:', error);
      showStatus('Failed to save draft scores.', 'error');
    }
  }

  async function submitForApproval() {
    if (!state.selectedClassSubject) {
      showStatus('Load a grade sheet before submitting for approval.', 'error');
      return;
    }

    if (!validateSheet()) {
      return;
    }

    const report = buildSubmissionPrecheckReport();
    renderSubmitFeedback(report);

    if (!report.payload.length) {
      const preview = report.issues;
      if (!preview.length) {
        showStatus('All students are already pending approval. Nothing to submit.', 'info');
        return;
      }
      const message = preview.length > 5
        ? `Cannot submit: Missing scores for:\n${preview.slice(0, 5).join('\n')}\n...and ${preview.length - 5} more`
        : `Cannot submit: Missing scores for:\n${preview.join('\n')}`;
      showStatus(message, 'error');
      return;
    }

    const confirmed = await confirmPopup(
      'Submit for Approval',
      `Submit ${report.sentStudents.length} student(s) for approval? ${report.blockedStudents.length} student(s) will not be sent.`
    );

    if (!confirmed) {
      return;
    }

    try {
      showStatus('Submitting grade sheet for approval...', 'info');
      const payload = report.payload.map((item) => ({
        ...item,
        status: 'pending_approval',
      }));
      const response = await TeacherAssessmentAPI.submitAssessmentsForApproval({
        class_subject_id: state.selectedClassSubject.class_subject_id,
        assessments: payload,
      });

      if (response?.success) {
        showToastMessage(`Submitted ${report.sentStudents.length} student(s). Skipped ${report.blockedStudents.length}.`, 'success');
        await loadGradeSheet();
        return;
      }

      showStatus(response?.message || 'Failed to submit grade sheet.', 'error');
    } catch (error) {
      console.error('Failed to submit grade sheet:', error);
      showStatus('Failed to submit grade sheet.', 'error');
    }
  }

  function getStudentLabel(student) {
    return `${student.first_name || ''} ${student.last_name || ''}`.trim() || `Student ${student.student_id}`;
  }

  function buildSubmissionPrecheckReport() {
    const sentStudents = [];
    const blockedStudents = [];
    const payload = [];
    const issues = [];

    function getSubmissionStatusFlags(studentId) {
      let publishedCount = 0;
      let draftCount = 0;
      let pendingCount = 0;
      let trackedCount = 0;
      const requiredCount = (state.selectedCategories || []).length;

      (state.selectedCategories || []).forEach((category) => {
        const existing = getAssessmentScore(studentId, category.category_id);
        if (!existing) {
          return;
        }

        trackedCount += 1;
        const existingStatus = String(existing?.status || '').toLowerCase();
        if (existingStatus === 'published') {
          publishedCount += 1;
          return;
        }
        if (existingStatus === 'draft') {
          draftCount += 1;
          return;
        }
        if (isPendingStatus(existingStatus)) {
          pendingCount += 1;
        }
      });

      return {
        hasAtLeastOnePublishedSubmission: publishedCount > 0,
        hasOneOrMoreDraftSubmission: draftCount > 0,
        hasAllPendingApproval: requiredCount > 0 && trackedCount === requiredCount && pendingCount === requiredCount,
      };
    }

    state.students.forEach((student) => {
      const missingCategories = [];
      const invalidCategories = [];
      const readyAssessments = [];
      const statusFlags = getSubmissionStatusFlags(Number(student.student_id));

      state.selectedCategories.forEach((category) => {
        const key = buildKey(student.student_id, category.category_id);
        const raw = state.draftScores[key];
        const categoryName = category.category_name || `Category ${category.category_id}`;

        if (raw === '' || raw === null || raw === undefined || !Number.isFinite(Number(raw))) {
          missingCategories.push(categoryName);
          issues.push(`${getStudentLabel(student)} - ${categoryName}`);
          return;
        }

        const score = Number(raw);
        const maxScore = Number(getCategoryMaxScore(category.category_id) || 100);
        if (!Number.isFinite(score) || score < 0 || (Number.isFinite(maxScore) && maxScore > 0 && score > maxScore)) {
          invalidCategories.push(`${categoryName} (score ${formatNumber(score)} > max ${formatNumber(maxScore)})`);
          return;
        }

        readyAssessments.push({
          class_subject_id: state.selectedClassSubject.class_subject_id,
          student_id: Number(student.student_id),
          category_id: Number(category.category_id),
          score,
          max_score: maxScore,
        });
      });

      // Already fully pending: skip silently and do not show under blocked issues.
      if (statusFlags.hasAllPendingApproval) {
        return;
      }

      if (
        !missingCategories.length
        && !invalidCategories.length
        && readyAssessments.length === state.selectedCategories.length
        && statusFlags.hasAtLeastOnePublishedSubmission
        && !statusFlags.hasOneOrMoreDraftSubmission
        && !statusFlags.hasAllPendingApproval
      ) {
        sentStudents.push({
          student,
          categoriesCount: readyAssessments.length,
        });
        payload.push(...readyAssessments);
        return;
      }

      const issueParts = [];
      if (missingCategories.length) {
        issueParts.push(`Missing: ${missingCategories.join(', ')}`);
      }
      if (invalidCategories.length) {
        issueParts.push(`Invalid: ${invalidCategories.join(', ')}`);
      }
      if (statusFlags.hasOneOrMoreDraftSubmission) {
        issueParts.push('One or more assessment statuses are draft and must be published before submitting for approval');
      }
      if (!statusFlags.hasAtLeastOnePublishedSubmission) {
        issueParts.push('Requires at least one published assessment status before submission');
      }

      blockedStudents.push({
        student,
        issue: issueParts.join(' | ') || 'Incomplete category marks',
      });
    });

    return {
      sentStudents,
      blockedStudents,
      payload,
      issues,
    };
  }

  function renderSubmitFeedback(report) {
    const section = document.getElementById('gradingSubmitFeedback');
    const summary = document.getElementById('gradingSubmitFeedbackSummary');
    const sentBody = document.getElementById('gradingSubmitSentBody');
    const blockedBody = document.getElementById('gradingSubmitBlockedBody');

    if (!section || !summary || !sentBody || !blockedBody) {
      return;
    }

    const sentCount = report.sentStudents.length;
    const blockedCount = report.blockedStudents.length;
    const issueCount = report.issues.length;
    summary.textContent = `Ready to send: ${sentCount} student(s). Blocked: ${blockedCount} student(s). Missing issue rows: ${issueCount}.`;

    if (sentCount) {
      sentBody.innerHTML = report.sentStudents.map((item) => `
        <tr>
          <td>${esc(getStudentLabel(item.student))}</td>
          <td>${esc(item.student.student_id_number || item.student.student_id || 'N/A')}</td>
          <td>${esc(String(item.categoriesCount))}</td>
        </tr>
      `).join('');
    } else {
      sentBody.innerHTML = '<tr><td colspan="3" class="gr-mini">No students are ready for submission.</td></tr>';
    }

    if (blockedCount) {
      blockedBody.innerHTML = report.blockedStudents.map((item) => `
        <tr>
          <td>${esc(getStudentLabel(item.student))}</td>
          <td>${esc(item.student.student_id_number || item.student.student_id || 'N/A')}</td>
          <td>${esc(item.issue)}</td>
        </tr>
      `).join('');
    } else {
      blockedBody.innerHTML = '<tr><td colspan="3" class="gr-mini">No blocking issues found.</td></tr>';
    }

    section.classList.add('show');
  }

  function validateAllCategoryScoresEntered() {
      let incomplete = [];

      state.students.forEach((student) => {
        state.selectedCategories.forEach((category) => {
          const key = buildKey(student.student_id, category.category_id);
          const value = state.draftScores[key];
          if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value))) {
            incomplete.push(`${student.first_name || ''} ${student.last_name || ''} - ${category.category_name}`);
          }
        });
      });

      if (incomplete.length > 0) {
        const message = incomplete.length > 5
          ? `Cannot submit: Missing scores for:\n${incomplete.slice(0, 5).join('\n')}\n...and ${incomplete.length - 5} more`
          : `Cannot submit: Missing scores for:\n${incomplete.join('\n')}`;
        showStatus(message, 'error');
        return false;
      }
      return true;
  }

  function resetSheet() {
    if (!state.selectedClassSubject) {
      showStatus('Load a grade sheet before resetting.', 'error');
      return;
    }

    Object.keys(state.draftScores).forEach((key) => {
      const original = state.originalScores[key];
      if (original === undefined) {
        state.draftScores[key] = '';
      } else {
        state.draftScores[key] = Number(original);
      }
    });

    renderSheet();

    clearStatus();
    showToastMessage('Draft changes reset.', 'info');
  }

  function filterRows(term) {
    const text = String(term || '').trim().toLowerCase();
    document.querySelectorAll('#gradingTableBody tr[data-student-row]').forEach((row) => {
      const haystack = String(row.dataset.search || '');
      row.style.display = !text || haystack.includes(text) ? '' : 'none';
    });
  }

  function escapeCsv(value) {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function getExportRows() {
    return state.students.map((student) => {
      const finalScore = state.finalScores[student.student_id] || {};
      const row = {
        student: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        student_id: student.student_id_number || student.student_id || '',
      };

      state.selectedCategories.forEach((category) => {
        const score = getAssessmentScore(student.student_id, category.category_id);
        const maxScore = getCategoryMaxScore(category.category_id);
        row[category.category_name] = score ? `${formatNumber(score.score)} / ${formatNumber(maxScore)}` : '';
      });

      row.draft_estimate = (() => {
        let weightedSum = 0;
        let enteredCount = 0;
        state.selectedCategories.forEach((category) => {
          const key = buildKey(student.student_id, category.category_id);
          const rawScore = state.draftScores[key];
          if (rawScore === '' || rawScore === null || rawScore === undefined) {
            return;
          }

          const score = Number(rawScore);
          const max = Number(getCategoryMaxScore(category.category_id) || 0);
          if (Number.isFinite(score) && Number.isFinite(max) && max > 0) {
            weightedSum += ((score / max) * Number(category.weight_percentage || 0));
            enteredCount += 1;
          }
        });
        return enteredCount > 0 ? `${formatNumber(weightedSum)}%` : '';
      })();
      row.submission_status = state.submissionSummary?.status || 'draft';
      row.published_final = finalScore.complete && Number.isFinite(Number(finalScore.final_percentage)) ? `${formatNumber(finalScore.final_percentage)}%` : 'Incomplete';
      row.approved_result = (
        state.submissionSummary?.status === 'approved' &&
        finalScore.complete &&
        Number.isFinite(Number(finalScore.final_percentage))
      )
        ? `${formatNumber(finalScore.final_percentage)}%`
        : '';
      row.band = finalScore.complete && Number.isFinite(Number(finalScore.final_percentage)) ? getGradeBandLabel(Number(finalScore.final_percentage)) : 'N/A';

      return row;
    });
  }

  function exportExcel() {
    if (!state.selectedClassSubject) {
      showStatus('Load a grade sheet before exporting.', 'error');
      return;
    }

    const headers = ['Student', 'Student ID', ...state.selectedCategories.map((category) => category.category_name), 'Draft Estimate', 'Submission Status', 'Published Final', 'Approved Result', `${getSelectedGradeCategory()?.grade_categories_name || 'Grade'} Band`];
    const lines = [headers.join('\t')];

    getExportRows().forEach((row) => {
      lines.push([
        row.student,
        row.student_id,
        ...state.selectedCategories.map((category) => row[category.category_name] || ''),
        row.draft_estimate,
        row.submission_status,
        row.published_final,
        row.approved_result,
        row.band,
      ].join('\t'));
    });

    const blob = new Blob([lines.join('\n')], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teacher-grade-sheet.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (!state.selectedClassSubject) {
      showStatus('Load a grade sheet before exporting.', 'error');
      return;
    }

    const jsPdfCtor = typeof window !== 'undefined' && window.jspdf ? window.jspdf.jsPDF : null;
    if (!jsPdfCtor) {
      showStatus('PDF export is unavailable in this browser.', 'error');
      return;
    }

    const doc = new jsPdfCtor({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const rows = getExportRows();
    const columns = ['Student', 'Student ID', ...state.selectedCategories.map((category) => category.category_name), 'Draft Estimate', 'Submission Status', 'Published Final', 'Approved Result', `${getSelectedGradeCategory()?.grade_categories_name || 'Grade'} Band`];

    doc.setFontSize(14);
    doc.text('Teacher Grade Sheet', 36, 36);
    doc.setFontSize(10);
    doc.text(`${state.selectedClassSubject.class_name} - ${state.selectedClassSubject.subject_name}`, 36, 52);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 64,
        head: [columns],
        body: rows.map((row) => [
          row.student,
          row.student_id,
          ...state.selectedCategories.map((category) => row[category.category_name] || ''),
          row.draft_estimate,
          row.submission_status,
          row.published_final,
          row.approved_result,
          row.band,
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [15, 118, 110] },
      });
    }

    doc.save('teacher-grade-sheet.pdf');
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('page:loaded', (event) => {
    const page = event?.detail?.page || '';
    if (!page || page === 'grading') {
      init();
      return;
    }

    if (hasPageRoot()) {
      init();
    }
  });
})();
