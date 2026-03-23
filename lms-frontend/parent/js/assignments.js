/* ============================================
   Parent Assignments Page
   SPA fragment: parent/page/assignments.html
============================================ */
(function () {
  'use strict';

  const S = {
    children: [],
    childId: null,
    status: '',
    search: '',
    assignments: [],
    summary: {
      pending: 0,
      submitted: 0,
      graded: 0,
      completion_rate: 0,
      total: 0,
    },
  };

  function esc(v) {
    if (typeof escapeHtml === 'function') return escapeHtml(String(v ?? ''));
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function childName(child) {
    return child?.full_name || [child?.first_name, child?.last_name].filter(Boolean).join(' ') || child?.name || `Student ${child?.student_id || ''}`;
  }

  function fmtDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  async function loadChildren() {
    if (typeof cachedChildrenData !== 'undefined' && Array.isArray(cachedChildrenData) && cachedChildrenData.length) {
      S.children = cachedChildrenData;
      return;
    }

    const user = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    const parentId = user?.parent_id || user?.id;
    if (!parentId) {
      S.children = [];
      return;
    }

    try {
      const res = await API.get(API_ENDPOINTS.PARENT_STUDENTS(parentId));
      const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      S.children = rows.map((r) => ({
        student_id: r.student_id || r.id,
        full_name: r.full_name || null,
        first_name: r.first_name || null,
        last_name: r.last_name || null,
        name: r.name || null,
      }));
    } catch (e) {
      console.error('Failed to load linked children:', e);
      S.children = [];
    }
  }

  function populateChildSelector() {
    const sel = document.getElementById('pasChildSelector');
    if (!sel) return;

    if (!S.children.length) {
      sel.innerHTML = '<option value="">No linked children</option>';
      S.childId = null;
      return;
    }

    sel.innerHTML = S.children
      .map((child) => `<option value="${esc(child.student_id)}">${esc(childName(child))}</option>`)
      .join('');

    S.childId = String(S.children[0].student_id);
    sel.value = S.childId;
  }

  async function loadAssignments() {
    const tbody = document.getElementById('pasTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="pas-empty">Loading assignments...</td></tr>';
    }

    if (!S.childId) {
      renderNoChildState();
      return;
    }

    const params = {
      child_id: S.childId,
    };
    if (S.status) params.status = S.status;
    if (S.search) params.search = S.search;

    try {
      const res = await ParentAssignmentAPI.getAssignments(params);
      const data = res?.data || {};
      S.assignments = Array.isArray(data.assignments) ? data.assignments : [];
      S.summary = {
        pending: Number(data.summary?.pending || 0),
        submitted: Number(data.summary?.submitted || 0),
        graded: Number(data.summary?.graded || 0),
        total: Number(data.summary?.total || S.assignments.length),
        completion_rate: Number(data.summary?.completion_rate || 0),
      };
      renderAll();
    } catch (e) {
      console.error('Failed to load assignments for parent:', e);
      toast(e.message || 'Failed to load assignments.', 'error');
      renderLoadError();
    }
  }

  function renderStats() {
    const pendingEl = document.getElementById('pasPendingCount');
    const submittedEl = document.getElementById('pasSubmittedCount');
    const gradedEl = document.getElementById('pasGradedCount');
    const completionEl = document.getElementById('pasCompletionRate');
    const completionBar = document.getElementById('pasCompletionBar');

    if (pendingEl) pendingEl.textContent = String(S.summary.pending);
    if (submittedEl) submittedEl.textContent = String(S.summary.submitted);
    if (gradedEl) gradedEl.textContent = String(S.summary.graded);
    if (completionEl) completionEl.textContent = `${S.summary.completion_rate}%`;
    if (completionBar) completionBar.style.width = `${Math.max(0, Math.min(100, S.summary.completion_rate))}%`;
  }

  function renderStatusList(containerId, status) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const rows = S.assignments
      .filter((item) => String(item.student_status || '').toLowerCase() === status)
      .slice(0, 8);

    if (!rows.length) {
      container.innerHTML = '<div class="pas-empty">No items in this status.</div>';
      return;
    }

    container.innerHTML = rows.map((item) => {
      const title = esc(item.title || 'Untitled Assignment');
      const subject = esc(item.subject_name || item.subject_code || '-');
      const due = esc(fmtDate(item.due_date));
      const score = item.score == null ? '-' : `${Number(item.score)} / ${Number(item.max_score || 0)}`;
      const scoreHtml = status === 'graded' ? `<p class="pas-item-score">Score: ${esc(score)}</p>` : '';
      return `
        <div class="pas-item">
          <p class="pas-item-title">${title}</p>
          <p class="pas-item-sub">${subject} • Due ${due}</p>
          ${scoreHtml}
        </div>
      `;
    }).join('');
  }

  function renderTable() {
    const tbody = document.getElementById('pasTableBody');
    if (!tbody) return;

    if (!S.assignments.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="pas-empty">No assignments found for this child/filter.</td></tr>';
      return;
    }

    tbody.innerHTML = S.assignments.map((item) => {
      const status = String(item.student_status || 'pending').toLowerCase();
      const title = esc(item.title || 'Untitled Assignment');
      const subject = esc(item.subject_name || item.subject_code || '-');
      const due = esc(fmtDate(item.due_date));
      const score = item.score == null ? '-' : `${Number(item.score)} / ${Number(item.max_score || 0)}`;
      return `
        <tr>
          <td>${title}</td>
          <td>${subject}</td>
          <td>${due}</td>
          <td><span class="pas-badge ${esc(status)}">${esc(status)}</span></td>
          <td>${esc(score)}</td>
        </tr>
      `;
    }).join('');
  }

  function renderAll() {
    renderStats();
    renderStatusList('pasPendingList', 'pending');
    renderStatusList('pasSubmittedList', 'submitted');
    renderStatusList('pasGradedList', 'graded');
    renderTable();
  }

  function renderNoChildState() {
    S.assignments = [];
    S.summary = { pending: 0, submitted: 0, graded: 0, total: 0, completion_rate: 0 };
    renderAll();
    const tbody = document.getElementById('pasTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="pas-empty">No linked child selected.</td></tr>';
    }
  }

  function renderLoadError() {
    const tbody = document.getElementById('pasTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="pas-empty">Failed to load assignments.</td></tr>';
    }
  }

  function bindEvents() {
    document.getElementById('pasChildSelector')?.addEventListener('change', (e) => {
      S.childId = e.target.value || null;
      loadAssignments();
    });

    document.getElementById('pasStatusFilter')?.addEventListener('change', (e) => {
      S.status = e.target.value || '';
      loadAssignments();
    });

    const searchEl = document.getElementById('pasSearchInput');
    if (searchEl) {
      let timer = null;
      searchEl.addEventListener('input', (e) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          S.search = (e.target.value || '').trim();
          loadAssignments();
        }, 300);
      });
    }

    document.getElementById('pasRefreshBtn')?.addEventListener('click', () => loadAssignments());
  }

  async function init() {
    const root = document.getElementById('parentAssignmentsPageRoot');
    if (!root || root.dataset.inited === '1') return;
    root.dataset.inited = '1';

    await loadChildren();
    populateChildSelector();
    bindEvents();
    await loadAssignments();
  }

  document.addEventListener('page:loaded', (e) => {
    if (e.detail?.page === 'assignments') init();
  });
})();
