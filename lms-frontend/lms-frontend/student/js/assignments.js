/* ============================================
   Student Assignments Module
   SPA fragment: student/page/assignments.html
============================================ */

(function () {
  'use strict';

  const MAX_SUBMISSION_FILE_SIZE = 30 * 1024 * 1024;

  const S = {
    assignments: [],
    activeStatus: 'all',
    selectedSubject: '',
    search: '',
    selectedAssignment: null,
    searchDebounce: null,
  };

  let E = {};

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function el(id) {
    return document.getElementById(id);
  }

  function cacheEls() {
    E = {
      root: el('saRoot'),
      listBody: el('saListBody') || el('saTableBody'),
      statusTabs: el('saStatusTabs'),
      subjectFilter: el('saSubjectFilter'),
      searchInput: el('saSearchInput'),
      refreshBtn: el('saRefreshBtn'),
      pendingCount: el('saPendingCount'),
      submittedCount: el('saSubmittedCount'),
      gradedCount: el('saGradedCount'),
      modalBackdrop: el('saModalBackdrop'),
      modalTitle: el('saModalTitle'),
      modalCloseBtn: el('saModalCloseBtn'),
      modalCancelBtn: el('saModalCancelBtn'),
      detailTitle: el('saDetailTitle'),
      detailSubject: el('saDetailSubject'),
      detailDueDate: el('saDetailDueDate'),
      detailSubmissionType: el('saDetailSubmissionType'),
      detailDescription: el('saDetailDescription'),
      detailScore: el('saDetailScore'),
      detailFeedback: el('saDetailFeedback'),
      gradeBlock: el('saGradeBlock'),
      submittedFileBlock: el('saSubmittedFileBlock'),
      submitBlock: el('saSubmitBlock'),
      downloadInstructionBtn: el('saDownloadInstructionBtn'),
      viewSubmittedFileBtn: el('saViewSubmittedFileBtn'),
      submissionText: el('saSubmissionText'),
      submissionTextWrap: el('saSubmissionTextWrap'),
      submissionFile: el('saSubmissionFile'),
      submissionFileWrap: el('saSubmissionFileWrap'),
      submitBtn: el('saSubmitBtn'),
    };
  }

  function toast(message, type) {
    if (typeof showToast === 'function') {
      showToast(message, type || 'info');
      return;
    }
    console.log((type || 'info').toUpperCase() + ': ' + message);
  }

  function fmtDateTime(v) {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  }

  function getSubmissionTypeLabel(v) {
    const key = String(v || '').toLowerCase();
    if (key === 'file') return 'File Upload';
    if (key === 'text') return 'Text Response';
    if (key === 'both') return 'Text and/or File';
    return key || '-';
  }

  function normalizeStatus(v) {
    const s = String(v || '').toLowerCase();
    if (s === 'graded') return 'graded';
    if (s === 'submitted') return 'submitted';
    return 'pending';
  }

  function computeLate(row) {
    const due = row?.due_date ? new Date(row.due_date) : null;
    const submitted = row?.submitted_at ? new Date(row.submitted_at) : null;

    if (row && Number(row.is_late) === 1) {
      return { late: true, label: 'Late' };
    }

    if (submitted && due && submitted > due) {
      return { late: true, label: 'Late' };
    }

    if (!submitted && due && new Date() > due) {
      return { late: true, label: 'Overdue' };
    }

    return { late: false, label: 'On time' };
  }

  function isOverdue(row) {
    if (!row?.due_date) return false;
    const dueDate = new Date(row.due_date);
    const now = new Date();
    return now > dueDate;
  }

  function fileUrl(path) {
    const raw = String(path || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;

    const normalized = raw.replace(/^\/+/, '');
    const withUploadsPrefix = /^uploads\//i.test(normalized)
      ? normalized
      : 'uploads/' + normalized;

    return String(API_BASE_URL || '').replace(/\/$/, '') + '/' + withUploadsPrefix;
  }

  function setLoading(message) {
    if (!E.listBody) return;
    E.listBody.innerHTML = `<div class="sa-loading">${esc(message || 'Loading...')}</div>`;
  }

  function setError(message) {
    if (!E.listBody) return;
    E.listBody.innerHTML = `<div class="sa-error">${esc(message || 'Failed to load assignments.')}</div>`;
  }

  function setEmpty(message) {
    if (!E.listBody) return;
    E.listBody.innerHTML = `<div class="sa-empty">${esc(message || 'No assignments found.')}</div>`;
  }

  function updateSummary() {
    const pending = S.assignments.filter((a) => normalizeStatus(a.student_status) === 'pending').length;
    const submitted = S.assignments.filter((a) => normalizeStatus(a.student_status) === 'submitted').length;
    const graded = S.assignments.filter((a) => normalizeStatus(a.student_status) === 'graded').length;

    if (E.pendingCount) E.pendingCount.textContent = String(pending);
    if (E.submittedCount) E.submittedCount.textContent = String(submitted);
    if (E.gradedCount) E.gradedCount.textContent = String(graded);
  }

  function populateSubjectFilter() {
    if (!E.subjectFilter) return;

    const map = new Map();
    S.assignments.forEach((row) => {
      const id = String(row.subject_id || '');
      const name = String(row.subject_name || row.subject_code || '').trim();
      if (!id || !name) return;
      if (!map.has(id)) map.set(id, name);
    });

    const prev = E.subjectFilter.value;
    const options = ['<option value="">All subjects</option>'];

    Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([id, name]) => {
        options.push(`<option value="${esc(id)}">${esc(name)}</option>`);
      });

    E.subjectFilter.innerHTML = options.join('');
    const hasPrev = Array.from(E.subjectFilter.options).some((opt) => opt.value === prev);
    if (hasPrev) {
      E.subjectFilter.value = prev;
    }
  }

  function renderRows() {
    if (!E.listBody) return;

    let rows = S.assignments.slice();

    if (S.activeStatus !== 'all') {
      rows = rows.filter((r) => normalizeStatus(r.student_status) === S.activeStatus);
    }

    if (S.selectedSubject) {
      rows = rows.filter((r) => String(r.subject_id || '') === S.selectedSubject);
    }

    const search = String(S.search || '').trim().toLowerCase();
    if (search) {
      rows = rows.filter((r) => {
        const hay = [r.title, r.description, r.subject_name, r.subject_code].join(' ').toLowerCase();
        return hay.includes(search);
      });
    }

    if (!rows.length) {
      setEmpty('No assignments match the selected filters.');
      return;
    }

    E.listBody.innerHTML = rows
      .map((row) => {
        const status = normalizeStatus(row.student_status);
        const late = computeLate(row);
        const canSubmit = status === 'pending' && !isOverdue(row);
        const overdue = isOverdue(row);
        const score = row.score == null || row.score === '' ? '-' : `${row.score}/${row.max_score || 100}`;
        const dueLabel = fmtDateTime(row.due_date);

        return `
          <section class="sa-card">
            <div class="sa-head">
              <div>
                <h4>${esc(row.title || '-')}</h4>
                <p>${esc((row.description || '').slice(0, 180) || 'No description')}</p>
                <div class="sa-code">${esc(row.subject_code || 'NO-CODE')}</div>
              </div>
              <span class="sa-status ${status}">${esc(status)}</span>
            </div>

            <div class="sa-body">
              <div class="sa-row"><span>Subject</span><strong>${esc(row.subject_name || '-')}</strong></div>
              <div class="sa-row"><span>Due Date</span><strong>${esc(dueLabel)}</strong></div>
              <div class="sa-row"><span>Submission Type</span><strong>${esc(getSubmissionTypeLabel(row.submission_type))}</strong></div>
              <div class="sa-row"><span>Late Status</span><strong><span class="sa-late ${late.late ? 'yes' : 'no'}">${esc(late.label)}</span></strong></div>
              ${
                status === 'graded'
                  ? `<div class="sa-row"><span>Score</span><strong>${esc(score)}</strong></div>`
                  : '<div class="sa-row"><span>Score</span><strong>Not Graded</strong></div>'
              }
            </div>

            <div class="sa-actions">
              <button class="btn btn-outline btn-sm" data-action="view" data-uuid="${esc(row.uuid)}">
                <i class="fas fa-eye"></i> View
              </button>
              ${
                status === 'pending' && !overdue
                  ? `<button class="btn btn-primary btn-sm" data-action="submit" data-uuid="${esc(row.uuid)}"><i class="fas fa-upload"></i> Submit</button>`
                  : status === 'pending' && overdue
                    ? `<button class="btn btn-primary btn-sm" disabled title="Assignment is past due"><i class="fas fa-lock"></i> Past Due</button>`
                    : ''
              }
            </div>
          </section>
        `;
      })
      .join('');
  }

  function setActiveTab(status) {
    S.activeStatus = status;
    if (!E.statusTabs) return;

    E.statusTabs.querySelectorAll('.sa-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-status') === status);
    });
  }

  function openModal(row, focusSubmit) {
    S.selectedAssignment = row;

    if (E.modalTitle) E.modalTitle.textContent = focusSubmit ? 'Submit Assignment' : 'Assignment Details';
    if (E.detailTitle) E.detailTitle.textContent = row.title || '-';
    if (E.detailSubject) E.detailSubject.textContent = row.subject_name || '-';
    if (E.detailDueDate) E.detailDueDate.textContent = fmtDateTime(row.due_date);
    if (E.detailSubmissionType) E.detailSubmissionType.textContent = getSubmissionTypeLabel(row.submission_type);
    if (E.detailDescription) E.detailDescription.textContent = row.description || 'No description.';

    const status = normalizeStatus(row.student_status);
    const hasGrade = status === 'graded';
    const alreadySubmitted = status === 'submitted';
    const submissionType = String(row.submission_type || 'both').toLowerCase();
    const allowTextSubmission = submissionType === 'text' || submissionType === 'both';
    const allowFileSubmission = submissionType === 'file' || submissionType === 'both';
    const hasSubmittedFile = Boolean(String(row.submission_file || '').trim());

    if (E.gradeBlock) E.gradeBlock.style.display = hasGrade ? '' : 'none';
    if (E.submitBlock) E.submitBlock.style.display = hasGrade ? 'none' : '';
    if (E.submissionTextWrap) E.submissionTextWrap.style.display = allowTextSubmission ? '' : 'none';
    if (E.submissionFileWrap) E.submissionFileWrap.style.display = allowFileSubmission ? '' : 'none';
    if (E.submittedFileBlock) {
      E.submittedFileBlock.style.display = hasSubmittedFile ? '' : 'none';
    }
    if (E.viewSubmittedFileBtn) {
      E.viewSubmittedFileBtn.disabled = !hasSubmittedFile;
    }

    if (E.detailScore) {
      E.detailScore.textContent = hasGrade
        ? `${row.score == null ? '-' : row.score} / ${row.max_score || 100}`
        : '-';
    }
    if (E.detailFeedback) E.detailFeedback.textContent = row.feedback || 'No feedback yet.';

    if (E.submissionText) E.submissionText.value = status === 'submitted' ? (row.submission_text || '') : '';
    if (E.submissionFile) E.submissionFile.value = '';

    if (E.submissionText) {
      const isPastDue = isOverdue(row);
      E.submissionText.readOnly = alreadySubmitted || !allowTextSubmission || isPastDue;
      E.submissionText.disabled = alreadySubmitted || !allowTextSubmission || isPastDue;
    }
    if (E.submissionFile) {
      const isPastDue = isOverdue(row);
      E.submissionFile.disabled = alreadySubmitted || !allowFileSubmission || isPastDue;
    }

    if (E.submitBtn) {
      E.submitBtn.style.display = hasGrade ? 'none' : '';
      const isPastDue = !hasGrade && isOverdue(row);
      
      if (alreadySubmitted) {
        E.submitBtn.disabled = true;
        E.submitBtn.innerHTML = '<i class="fas fa-lock"></i> Already Submitted';
      } else if (isPastDue) {
        E.submitBtn.disabled = true;
        E.submitBtn.innerHTML = '<i class="fas fa-clock"></i> Past Due - Submission Closed';
      } else {
        E.submitBtn.disabled = false;
        E.submitBtn.innerHTML = '<i class="fas fa-upload"></i> Submit Assignment';
      }
    }

    if (E.modalBackdrop) {
      E.modalBackdrop.classList.add('show');
      E.modalBackdrop.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal() {
    if (E.modalBackdrop) {
      E.modalBackdrop.classList.remove('show');
      E.modalBackdrop.setAttribute('aria-hidden', 'true');
    }
    S.selectedAssignment = null;
  }

  async function submitSelectedAssignment() {
    if (!S.selectedAssignment || !S.selectedAssignment.uuid) {
      toast('No assignment selected.', 'error');
      return;
    }

    const status = normalizeStatus(S.selectedAssignment.student_status);
    if (status !== 'pending') {
      toast('This assignment has already been submitted.', 'warning');
      return;
    }

    // Double-check due date
    if (isOverdue(S.selectedAssignment)) {
      toast('This assignment is past the due date and cannot be submitted.', 'error');
      return;
    }

    const text = String(E.submissionText?.value || '').trim();
    const file = E.submissionFile?.files?.[0] || null;
    const type = String(S.selectedAssignment.submission_type || 'both').toLowerCase();

    if (type === 'file' && !file) {
      toast('This assignment requires a file upload.', 'warning');
      return;
    }

    if (type === 'text' && !text) {
      toast('This assignment requires a text response.', 'warning');
      return;
    }

    if (type === 'both' && !text && !file) {
      toast('Provide text or attach a file before submitting.', 'warning');
      return;
    }

    if (file && file.size > MAX_SUBMISSION_FILE_SIZE) {
      toast('File size exceeds 30MB. Please choose a smaller file.', 'warning');
      return;
    }

    if (E.submitBtn) {
      E.submitBtn.disabled = true;
      E.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }

    try {
      let uploadedPath = null;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', 'assignments');
        const uploadRes = await FileAPI.upload(fd);
        uploadedPath = uploadRes?.data?.path || uploadRes?.path || null;
        if (!uploadedPath) {
          throw new Error('File upload failed to return a path.');
        }
      }

      const submitFn =
        (typeof AssignmentAPI !== 'undefined' && typeof AssignmentAPI.submit === 'function')
          ? AssignmentAPI.submit.bind(AssignmentAPI)
          : (id, data) => API.post(`/api/assignments/${id}/submit`, data);

      await submitFn(S.selectedAssignment.uuid, {
        submission_text: text || null,
        submission_file: uploadedPath,
      });

      toast('Assignment submitted successfully.', 'success');
      closeModal();
      await loadAssignments();
    } catch (err) {
      console.error('Submit assignment error:', err);
      toast(err?.message || 'Failed to submit assignment.', 'error');
    } finally {
      if (E.submitBtn) {
        E.submitBtn.disabled = false;
        E.submitBtn.innerHTML = '<i class="fas fa-upload"></i> Submit Assignment';
      }
    }
  }

  function handleTableAction(event) {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const uuid = btn.getAttribute('data-uuid');
    const row = S.assignments.find((r) => String(r.uuid) === String(uuid));
    if (!row) return;

    if (action === 'view') {
      openModal(row, false);
      return;
    }

    if (action === 'submit') {
      openModal(row, true);
    }
  }

  function handleInstructionDownload() {
    if (!S.selectedAssignment) return;
    const url = fileUrl(S.selectedAssignment.file_path);
    if (!url) {
      toast('No instruction file available for this assignment.', 'warning');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleSubmittedFileView() {
    if (!S.selectedAssignment) return;
    const url = fileUrl(S.selectedAssignment.submission_file);
    if (!url) {
      toast('No submitted file available.', 'warning');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function loadAssignments() {
    if (!E.listBody) return;

    setLoading('Loading assignments...');

    try {
      const params = {};
      if (S.activeStatus !== 'all') params.status = S.activeStatus;
      if (S.selectedSubject) params.subject_id = S.selectedSubject;
      if (S.search) params.search = S.search;

      const getMyAssignmentsFn =
        (typeof AssignmentAPI !== 'undefined' && typeof AssignmentAPI.getMyAssignments === 'function')
          ? AssignmentAPI.getMyAssignments.bind(AssignmentAPI)
          : (query) => API.get('/api/assignments/my', query);

      const res = await getMyAssignmentsFn(params);
      const rows = Array.isArray(res?.data?.assignments)
        ? res.data.assignments
        : Array.isArray(res?.assignments)
          ? res.assignments
          : Array.isArray(res?.data)
            ? res.data
            : [];

      S.assignments = rows;
      populateSubjectFilter();
      updateSummary();
      renderRows();
    } catch (err) {
      console.error('Load student assignments error:', err);
      setError(err?.message || 'Failed to load assignments.');
    }
  }

  function bindEvents() {
    if (E.statusTabs) {
      E.statusTabs.addEventListener('click', (event) => {
        const btn = event.target.closest('.sa-tab[data-status]');
        if (!btn) return;
        const status = btn.getAttribute('data-status') || 'all';
        setActiveTab(status);
        loadAssignments().catch(() => {});
      });
    }

    E.subjectFilter?.addEventListener('change', () => {
      S.selectedSubject = E.subjectFilter.value || '';
      loadAssignments().catch(() => {});
    });

    E.searchInput?.addEventListener('input', () => {
      if (S.searchDebounce) {
        clearTimeout(S.searchDebounce);
      }

      S.searchDebounce = setTimeout(() => {
        S.search = String(E.searchInput.value || '').trim();
        loadAssignments().catch(() => {});
      }, 280);
    });

    E.refreshBtn?.addEventListener('click', () => {
      loadAssignments().catch(() => {});
    });

    E.listBody?.addEventListener('click', handleTableAction);
    E.modalCloseBtn?.addEventListener('click', closeModal);
    E.modalCancelBtn?.addEventListener('click', closeModal);
    E.modalBackdrop?.addEventListener('click', (event) => {
      if (event.target === E.modalBackdrop) closeModal();
    });

    E.downloadInstructionBtn?.addEventListener('click', handleInstructionDownload);
    E.viewSubmittedFileBtn?.addEventListener('click', handleSubmittedFileView);
    E.submitBtn?.addEventListener('click', submitSelectedAssignment);
  }

  async function init() {
    if (!Auth || !Auth.requireAuth || !Auth.requireAuth([USER_ROLES.STUDENT])) {
      return;
    }

    cacheEls();
    if (!E.root) return;

    bindEvents();
    await loadAssignments();
  }

  document.addEventListener('page:loaded', function (e) {
    if (e.detail && e.detail.page === 'assignments') {
      init().catch((err) => {
        console.error('Student assignments init error:', err);
      });
    }
  });
})();
