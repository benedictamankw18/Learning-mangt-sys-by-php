/* ============================================
   Parents Management Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
  'use strict';

  const PREF_KEY = 'lms_admin_parent_prefs';

  const S = {
    parents: [],
    students: [],
    links: [],
    studentFiltered: [],
    filtered: [],
    search: '',
    studentSearch: '',
    selectedStudentIds: new Set(),
    page: 1,
    pageSize: 20,
    editingParentId: null,
    activeParent: null,
    prefs: {},
    linking: false,
    eventsBound: false,
  };

  document.addEventListener('page:loaded', function (e) {
    if (e.detail && e.detail.page === 'parents') {
      initParentsPage();
    }
  });

  function initParentsPage() {
    if (!document.getElementById('parentsPageRoot')) return;
    S.prefs = loadPrefs();
    bindEvents();
    Promise.all([loadStudents(), loadParents()]).catch(function (err) {
      console.error('Parents page init error:', err);
      toast('Failed to initialize parents page', 'error');
    });
  }

  function bindEvents() {
    if (S.eventsBound) return;
    S.eventsBound = true;

    on('parentsSearchInput', 'input', function (e) {
      S.search = String(e.target.value || '').trim().toLowerCase();
      S.page = 1;
      applyFilters();
    });

    on('refreshParentsBtn', 'click', function () {
      loadParents();
    });

    on('addParentBtn', 'click', function () {
      openParentForm(null);
    });

    on('closeParentFormBtn', 'click', closeParentForm);
    on('cancelParentFormBtn', 'click', closeParentForm);
    on('saveParentBtn', 'click', saveParent);
    on('pfPasswordToggle', 'click', toggleParentPasswordVisibility);
    on('exportParentsPdfBtn', 'click', exportParentsPdf);
    on('parentFormModal', 'click', function (e) {
      if (e.target && e.target.id === 'parentFormModal') closeParentForm();
    });

    on('closeParentLinkBtn', 'click', closeParentLinkModal);
    on('doneParentLinkBtn', 'click', closeParentLinkModal);
    on('addParentStudentLinkBtn', 'click', addLink);
    on('plStudentSearch', 'input', function (e) {
      S.studentSearch = String(e.target.value || '').trim().toLowerCase();
      renderStudentTable();
    });
    on('parentLinkModal', 'click', function (e) {
      if (e.target && e.target.id === 'parentLinkModal') closeParentLinkModal();
    });

    const tbody = document.getElementById('parentsTableBody');
    if (tbody) {
      tbody.addEventListener('click', onTableActionClick);
    }

    const linked = document.getElementById('linkedStudentsList');
    if (linked) {
      linked.addEventListener('click', onLinkedActionClick);
    }

    const studentTable = document.getElementById('plStudentTableBody');
    if (studentTable) {
      studentTable.addEventListener('click', onStudentTableActionClick);
    }
  }

  async function loadParents() {
    setParentsLoading();

    try {
      let page = 1;
      const limit = 100;
      const all = [];

      while (true) {
        const res = await API.get(API_ENDPOINTS.PARENTS, { page: page, limit: limit });
        const rows = extractParentsRows(res);
        const pagination = extractPagination(res, rows.length);

        if (!rows.length) break;
        all.push.apply(all, rows);
        if (all.length >= pagination.total) break;
        page += 1;
        if (page > 100) break;
      }

      S.parents = all;
      applyFilters();
    } catch (err) {
      console.error('Load parents error:', err);
      setParentsEmpty('Unable to load parents right now.');
      toast('Failed to load parents', 'error');
    }
  }

  async function loadStudents() {
    try {
      let page = 1;
      const limit = 100;
      const all = [];

      while (true) {
        const res = await API.get(API_ENDPOINTS.STUDENTS, { page: page, limit: limit });
        const rows = extractStudentsRows(res);
        const pagination = extractPagination(res, rows.length);

        if (!rows.length) break;
        all.push.apply(all, rows);
        if (all.length >= pagination.total) break;
        page += 1;
        if (page > 100) break;
      }

      S.students = all;
      renderStudentTable();
    } catch (err) {
      console.error('Load students for linking error:', err);
      S.students = [];
      renderStudentTable();
    }
  }

  function applyFilters() {
    S.filtered = S.parents.filter(function (p) {
      if (!S.search) return true;
      const haystack = [
        p.guardian_id,
        p.username,
        p.first_name,
        p.last_name,
        p.email,
        p.phone_number,
        p.occupation,
      ].map(function (v) { return String(v || '').toLowerCase(); }).join(' ');
      return haystack.indexOf(S.search) >= 0;
    });

    const totalPages = Math.max(1, Math.ceil(S.filtered.length / S.pageSize));
    if (S.page > totalPages) S.page = totalPages;

    renderStats();
    renderTable();
    renderPagination();
  }

  function renderStats() {
    const total = S.parents.length;
    let emailOn = 0;
    let smsOn = 0;

    S.parents.forEach(function (p) {
      const pref = getParentPref(p);
      if (pref.email) emailOn += 1;
      if (pref.sms) smsOn += 1;
    });

    setText('parentsStatTotal', String(total));
    setText('parentsStatEmailOn', String(emailOn));
    setText('parentsStatSmsOn', String(smsOn));
    setText('parentsStatLinked', String(countParentsWithLinks()));
    setText('parentsCountLabel', S.filtered.length + ' of ' + total + ' parents');
  }

  function countParentsWithLinks() {
    let count = 0;
    S.parents.forEach(function (p) {
      if (Number(p.linked_students_count || 0) > 0) {
        count += 1;
      }
    });
    return count;
  }

  function renderTable() {
    const tbody = document.getElementById('parentsTableBody');
    if (!tbody) return;

    if (!S.filtered.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-parent-state">No parents found.</td></tr>';
      setText('parentsPaginationInfo', 'Showing 0-0 of 0');
      return;
    }

    const start = (S.page - 1) * S.pageSize;
    const rows = S.filtered.slice(start, start + S.pageSize);

    tbody.innerHTML = rows.map(function (p) {
      const fullName = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || 'Unnamed Parent';
      const pref = getParentPref(p);
      const linkedCount = Number(p.linked_students_count || 0);
      const parentLabel = p.guardian_id || ('Parent #' + String(p.parent_id || '-'));

      return '' +
        '<tr>' +
          '<td>' +
            '<div class="parent-name">' + esc(fullName) + '</div>' +
            '<div class="parent-sub">Guardian ID: ' + esc(parentLabel) + ' - Linked students: ' + esc(String(linkedCount)) + '</div>' +
          '</td>' +
          '<td class="parent-contact">' +
            (p.email ? '<div><a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a></div>' : '<div>-</div>') +
            '<div class="parent-sub">' + esc(p.phone_number || '-') + '</div>' +
          '</td>' +
          '<td>' + esc(p.occupation || '-') + '</td>' +
          '<td>' +
            prefChip('Email', pref.email) +
            prefChip('SMS', pref.sms) +
          '</td>' +
          '<td>' +
            '<div class="parents-actions">' +
              actionBtn('link', 'fa-link', 'Link Students', p.parent_id, 'btn-parent-link') +
              actionBtn('edit', 'fa-pen', 'Edit Parent', p.parent_id, 'btn-parent-edit') +
              actionBtn('delete', 'fa-trash', 'Delete Parent', p.parent_id, 'btn-parent-delete') +
            '</div>' +
          '</td>' +
        '</tr>';
    }).join('');

    const showingFrom = S.filtered.length ? start + 1 : 0;
    const showingTo = Math.min(start + S.pageSize, S.filtered.length);
    setText('parentsPaginationInfo', 'Showing ' + showingFrom + '-' + showingTo + ' of ' + S.filtered.length);
  }

  function renderPagination() {
    const container = document.getElementById('parentsPaginationControls');
    if (!container) return;

    const totalPages = Math.max(1, Math.ceil(S.filtered.length / S.pageSize));
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const parts = [];
    parts.push(pageBtn(S.page - 1, '<i class="fas fa-chevron-left"></i>', S.page === 1));

    const first = Math.max(1, S.page - 2);
    const last = Math.min(totalPages, first + 4);
    for (let i = first; i <= last; i += 1) {
      parts.push(pageBtn(i, String(i), false, i === S.page));
    }

    parts.push(pageBtn(S.page + 1, '<i class="fas fa-chevron-right"></i>', S.page === totalPages));
    container.innerHTML = parts.join('');

    container.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const next = Number(btn.getAttribute('data-page'));
        if (!next || next === S.page) return;
        S.page = next;
        renderTable();
        renderPagination();
      });
    });
  }

  function onTableActionClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = Number(btn.getAttribute('data-id') || 0);
    const parent = S.parents.find(function (p) { return Number(p.parent_id) === id; }) || null;

    if (!parent) return;

    if (action === 'edit') {
      openParentForm(parent);
      return;
    }

    if (action === 'delete') {
      deleteParent(parent);
      return;
    }

    if (action === 'link') {
      openParentLinkModal(parent);
    }
  }

  function onLinkedActionClick(e) {
    const btn = e.target.closest('button[data-rel-id]');
    if (!btn || !S.activeParent) return;
    const relId = Number(btn.getAttribute('data-rel-id'));
    if (!relId) return;

    removeLink(relId);
  }

  function openParentForm(parent) {
    S.editingParentId = parent ? Number(parent.parent_id) : null;

    setText('parentFormTitle', parent ? 'Edit Parent' : 'Add Parent');
    setValue('pfFirstName', parent ? parent.first_name : '');
    setValue('pfLastName', parent ? parent.last_name : '');
    setValue('pfGuardianId', parent ? parent.guardian_id : '');
    setValue('pfUsername', parent ? parent.username : '');
    setValue('pfEmail', parent ? parent.email : '');
    setValue('pfPassword', '');
    setPasswordVisibility(false);
    setValue('pfPhone', parent ? parent.phone_number : '');
    setValue('pfOccupation', parent ? parent.occupation : '');
    setValue('pfAddress', parent ? parent.address : '');

    const pref = getParentPref(parent);
    setChecked('pfPrefEmail', pref.email);
    setChecked('pfPrefSms', pref.sms);

    openModal('parentFormModal');
  }

  function closeParentForm() {
    closeModal('parentFormModal');
  }

  async function saveParent() {
    const firstName = val('pfFirstName');
    const lastName = val('pfLastName');
    const username = val('pfUsername');
    const email = val('pfEmail');
    const password = val('pfPassword');
    if (!firstName || !lastName || !username || !email) {
      toast('First name, last name, username, and email are required', 'error');
      return;
    }
    if (!S.editingParentId && !password) {
      toast('Password is required when adding a parent', 'error');
      return;
    }

    const payload = {
      username: username,
      first_name: firstName,
      last_name: lastName,
      guardian_id: val('pfGuardianId') || null,
      email: email,
      phone_number: val('pfPhone') || null,
      occupation: val('pfOccupation') || null,
      address: val('pfAddress') || null,
      prefers_email_notifications: isChecked('pfPrefEmail') ? 1 : 0,
      prefers_sms_notifications: isChecked('pfPrefSms') ? 1 : 0,
    };
    if (password) {
      payload.password = password;
    }

    try {
      let parentId = S.editingParentId;

      if (parentId) {
        await API.put(API_ENDPOINTS.PARENT_BY_ID(parentId), payload);
      } else {
        const res = await API.post(API_ENDPOINTS.PARENTS, payload);
        parentId = Number((res && res.data && res.data.parent_id) || 0) || null;
      }

      closeParentForm();
      await loadParents();
      toast(parentId && S.editingParentId ? 'Parent updated' : 'Parent created', 'success');
    } catch (err) {
      console.error('Save parent error:', err);
      const detail = extractApiValidationError(err);
      toast(detail || err.message || 'Failed to save parent', 'error');
    }
  }

  function extractApiValidationError(err) {
    const errors = err && err.body && err.body.errors;
    if (!errors || typeof errors !== 'object') return '';

    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return '';

    const value = errors[firstKey];
    if (Array.isArray(value) && value.length) return String(value[0]);
    if (typeof value === 'string') return value;
    return '';
  }
//  let counter = 0;
  function toggleParentPasswordVisibility() {
    const input = document.getElementById('pfPassword');
    if (!input) return;
    setPasswordVisibility(input.type === 'password');
  }

  function setPasswordVisibility(show) {
    const input = document.getElementById('pfPassword');
    const btn = document.getElementById('pfPasswordToggle');
    if (!input || !btn) return;

    const icon = btn.querySelector('i');
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    btn.setAttribute('title', show ? 'Hide password' : 'Show password');

    if (icon) {
      icon.classList.remove(show ? 'fa-eye' : 'fa-eye-slash');
      icon.classList.add(show ? 'fa-eye-slash' : 'fa-eye');
    }
    // console.log('Set password visibility:', counter++, show);
  }

  function exportParentsPdf() {
    const rows = S.filtered;
    if (!rows.length) {
      toast('No parents to export.', 'warning');
      return;
    }

    toast('Preparing PDF…', 'info');

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const e = function (v) {
      return String(v == null ? '\u2014' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    const prefBadge = function (enabled) {
      const c = enabled ? '#15803d;background:#dcfce7' : '#64748b;background:#f1f5f9';
      return '<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:' + c + '">' + (enabled ? 'On' : 'Off') + '</span>';
    };

    const filterLabel = S.search ? ('Search: "' + S.search + '"') : '';

    const tableRows = rows.map(function (p, i) {
      const fullName = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || 'Unnamed';
      const pref = getParentPref(p);
      const linked = Number(p.linked_students_count || 0);
      return '<tr style="background:' + (i % 2 === 0 ? '#fff' : '#f8fafc') + '">' +
        '<td>' + (i + 1) + '</td>' +
        '<td><strong>' + e(fullName) + '</strong>' +
          (p.username ? '<br><span style="color:#64748b;font-size:10px">' + e(p.username) + '</span>' : '') +
        '</td>' +
        '<td>' + e(p.email || '\u2014') + '</td>' +
        '<td>' + e(p.phone_number || '\u2014') + '</td>' +
        '<td style="font-family:monospace;font-size:11px">' + e(p.guardian_id || '\u2014') + '</td>' +
        '<td>' + e(p.occupation || '\u2014') + '</td>' +
        '<td>' + prefBadge(pref.email) + '</td>' +
        '<td>' + prefBadge(pref.sms) + '</td>' +
        '<td style="text-align:center">' + e(String(linked)) + '</td>' +
        '</tr>';
    }).join('');

    const html = '<!DOCTYPE html>\n' +
      '<html lang="en">\n<head>\n<meta charset="UTF-8">\n' +
      '<title>Parents Export \u2014 ' + date + '</title>\n' +
      '<style>\n' +
      '  * { box-sizing: border-box; margin: 0; padding: 0; }\n' +
      '  body { font-family: \'Segoe UI\', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 24px; }\n' +
      '  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #006a3f; padding-bottom: 12px; }\n' +
      '  .header h1 { font-size: 18px; color: #006a3f; }\n' +
      '  .header .meta { text-align: right; color: #64748b; font-size: 11px; line-height: 1.6; }\n' +
      '  .filter-bar { font-size: 11px; color: #64748b; margin-bottom: 12px; }\n' +
      '  table { width: 100%; border-collapse: collapse; }\n' +
      '  th { background: #006a3f; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }\n' +
      '  td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }\n' +
      '  .footer { margin-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }\n' +
      '  @media print { body { padding: 0; } @page { margin: 15mm; size: A4 landscape; } button { display: none !important; } }\n' +
      '</style>\n</head>\n<body>\n' +
      '  <div class="header">\n' +
      '    <div>\n' +
      '      <h1>&#128106; Parents Report</h1>\n' +
      '      <p style="color:#64748b;margin-top:2px">Total: <strong>' + rows.length + '</strong> parent' + (rows.length !== 1 ? 's' : '') + '</p>\n' +
      '    </div>\n' +
      '    <div class="meta">\n' +
      '      <div>Exported: ' + date + '</div>\n' +
      '      <button onclick="window.print()" style="margin-top:6px;padding:4px 12px;background:#006a3f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px">&#128438; Print / Save PDF</button>\n' +
      '    </div>\n' +
      '  </div>\n' +
      (filterLabel ? '  <div class="filter-bar">Filters: ' + e(filterLabel) + '</div>\n' : '') +
      '  <table>\n    <thead>\n      <tr>\n' +
      '        <th>#</th><th>Name</th><th>Email</th><th>Phone</th>' +
      '<th>Guardian ID</th><th>Occupation</th><th>Email Alerts</th><th>SMS Alerts</th><th>Linked</th>\n' +
      '      </tr>\n    </thead>\n    <tbody>' + tableRows + '</tbody>\n  </table>\n' +
      '  <div class="footer">Generated by LMS &bull; ' + date + '</div>\n</body>\n</html>';

    const win = window.open('', '_blank', 'width=1200,height=750');
    if (!win) {
      toast('Allow pop-ups to export PDF', 'warning');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    toast('PDF ready \u2014 ' + rows.length + ' parent' + (rows.length !== 1 ? 's' : ''), 'success');
  }

  async function deleteParent(parent) {
    const fullName = ((parent.first_name || '') + ' ' + (parent.last_name || '')).trim() || 'this parent';
    const confirmed = await showConfirmPopup('Delete Parent', 'Delete ' + fullName + '? This cannot be undone.');
    if (!confirmed) return;

    try {
      await API.delete(API_ENDPOINTS.PARENT_BY_ID(parent.parent_id));
      delete S.prefs[parent.parent_id];
      delete S.prefs['links:' + parent.parent_id];
      savePrefs();
      await loadParents();
      toast('Parent deleted', 'success');
    } catch (err) {
      console.error('Delete parent error:', err);
      toast(err.message || 'Failed to delete parent', 'error');
    }
  }

  function openParentLinkModal(parent) {
    S.activeParent = parent;
    S.selectedStudentIds = new Set();
    S.studentSearch = '';
    setText('parentLinkTitle', 'Link Students - ' + (((parent.first_name || '') + ' ' + (parent.last_name || '')).trim() || 'Parent'));
    setValue('plStudentSearch', '');
    updateLinkButtonLabel();
    openModal('parentLinkModal');
    loadLinks();
    renderStudentTable();
  }

  function closeParentLinkModal() {
    S.activeParent = null;
    S.links = [];
    S.selectedStudentIds = new Set();
    closeModal('parentLinkModal');
  }

  async function loadLinks() {
    if (!S.activeParent) return;

    try {
      const res = await API.get(API_ENDPOINTS.PARENT_STUDENTS(S.activeParent.parent_id));
      const rows = extractRows(res);
      S.links = Array.isArray(rows) ? rows : [];
      S.prefs['links:' + S.activeParent.parent_id] = S.links;

      const parentIndex = S.parents.findIndex(function (p) {
        return Number(p.parent_id) === Number(S.activeParent.parent_id);
      });
      if (parentIndex >= 0) {
        S.parents[parentIndex].linked_students_count = S.links.length;
      }

      const linkedIds = new Set(S.links.map(function (row) {
        return Number(row.student_id || 0);
      }));
      S.selectedStudentIds = new Set(Array.from(S.selectedStudentIds).filter(function (id) {
        return !linkedIds.has(Number(id || 0));
      }));

      savePrefs();
      renderLinks();
      renderStudentTable();
      renderStats();
    } catch (err) {
      console.error('Load linked students error:', err);
      S.links = [];
      renderLinks();
      renderStudentTable();
      toast('Failed to load linked students', 'error');
    }
  }

  async function addLink() {
    if (!S.activeParent) return;
    if (S.linking) return;

    const selectedIds = Array.from(S.selectedStudentIds).map(function (id) { return Number(id || 0); }).filter(Boolean);
    if (!selectedIds.length) {
      toast('Select one or more students to link', 'error');
      return;
    }

    const isPrimary = isChecked('plPrimary');
    const relationship = val('plRelationship') || 'Parent';

    try {
      S.linking = true;
      updateLinkButtonLabel();

      const results = await Promise.allSettled(selectedIds.map(function (studentId, idx) {
        const payload = {
          parent_id: Number(S.activeParent.parent_id),
          student_id: studentId,
          relationship_type: relationship,
          is_primary_contact: isPrimary && idx === 0 ? 1 : 0,
          can_pickup: 1,
        };
        return API.post(API_ENDPOINTS.PARENT_STUDENT_REL, payload);
      }));

      const successCount = results.filter(function (r) { return r.status === 'fulfilled'; }).length;
      const failedCount = results.length - successCount;

      S.selectedStudentIds = new Set();
      await loadLinks();

      if (successCount && failedCount) {
        toast(successCount + ' linked, ' + failedCount + ' failed', 'warning');
      } else if (successCount) {
        toast(successCount + ' student' + (successCount > 1 ? 's' : '') + ' linked to parent', 'success');
      } else {
        toast('Failed to link selected students', 'error');
      }
    } catch (err) {
      console.error('Link student error:', err);
      toast(err.message || 'Failed to link student', 'error');
    } finally {
      S.linking = false;
      updateLinkButtonLabel();
    }
  }

  async function removeLink(relId) {
    const confirmed = await showConfirmPopup('Remove Link', 'Remove this student link?');
    if (!confirmed) return;

    try {
      await API.delete(API_ENDPOINTS.PARENT_STUDENT_REL_BY_ID(relId));
      await loadLinks();
      toast('Student link removed', 'success');
    } catch (err) {
      console.error('Unlink student error:', err);
      toast(err.message || 'Failed to remove link', 'error');
    }
  }

  function renderLinks() {
    const container = document.getElementById('linkedStudentsList');
    if (!container) return;

    if (!S.links.length) {
      container.innerHTML = '<div class="empty-parent-state">No linked students yet.</div>';
      return;
    }

    container.innerHTML = S.links.map(function (row) {
      const name = ((row.first_name || '') + ' ' + (row.last_name || '')).trim() || 'Student';
      const rel = row.relationship_type || 'Parent';
      const sid = row.student_id_number || '#'+ String(row.student_id || '');
      const primary = Number(row.is_primary_contact) === 1 ? ' - Primary contact' : '';
      return '' +
        '<div class="linked-item">' +
          '<div class="linked-meta">' +
            '<strong>' + esc(name) + '</strong>' +
            '<span>' + esc(rel) + ' - ' + esc(sid) + primary + '</span>' +
          '</div>' +
          '<button type="button" data-rel-id="' + esc(String(row.parent_student_id || '')) + '"><i class="fas fa-unlink"></i> Unlink</button>' +
        '</div>';
    }).join('');
  }

  function renderStudentTable() {
    const tbody = document.getElementById('plStudentTableBody');
    if (!tbody) return;

    if (!S.students.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="student-picker-empty">No students found.</td></tr>';
      updateLinkButtonLabel();
      return;
    }

    const linkedIds = new Set((S.links || []).map(function (row) {
      return Number(row.student_id || 0);
    }));

    const rows = S.students.filter(function (s) {
      const sid = Number(s.student_id || s.id || 0);
      if (!sid || linkedIds.has(sid)) return false;

      if (!S.studentSearch) return true;

      const haystack = [
        ((s.first_name || '') + ' ' + (s.last_name || '')).trim(),
        s.student_id_number,
        s.email,
        s.username,
      ].map(function (v) { return String(v || '').toLowerCase(); }).join(' ');

      return haystack.indexOf(S.studentSearch) >= 0;
    });

    S.studentFiltered = rows;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="student-picker-empty">No matching unlinked students.</td></tr>';
      updateLinkButtonLabel();
      return;
    }

    tbody.innerHTML = rows.map(function (s) {
      const id = Number(s.student_id || s.id || 0);
      const selected = S.selectedStudentIds.has(id);
      const name = ((s.first_name || '') + ' ' + (s.last_name || '')).trim() || s.username || 'Student';
      return '' +
        '<tr class="' + (selected ? 'selected' : '') + '" data-student-id="' + esc(String(id)) + '">' +
          '<td>' + esc(name) + '</td>' +
          '<td>' + esc(s.student_id_number || '-') + '</td>' +
          '<td>' + esc(s.email || '-') + '</td>' +
          '<td><button type="button" class="student-select-btn" data-student-id="' + esc(String(id)) + '">' + (selected ? 'Selected' : 'Select') + '</button></td>' +
        '</tr>';
    }).join('');

    updateLinkButtonLabel();
  }

  function onStudentTableActionClick(e) {
    const row = e.target.closest('tr[data-student-id]');
    const button = e.target.closest('button[data-student-id]');
    const source = button || row;
    if (!source) return;

    const id = Number(source.getAttribute('data-student-id') || 0);
    if (!id) return;

    if (S.selectedStudentIds.has(id)) {
      S.selectedStudentIds.delete(id);
    } else {
      S.selectedStudentIds.add(id);
    }
    renderStudentTable();
  }

  function updateLinkButtonLabel() {
    const btn = document.getElementById('addParentStudentLinkBtn');
    if (!btn) return;

    const count = S.selectedStudentIds.size;
    if (S.linking) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Linking...';
      return;
    }

    btn.disabled = count === 0;
    btn.innerHTML = '<i class="fas fa-link"></i> ' + (count > 0 ? 'Link Selected (' + count + ')' : 'Link Student');
  }

  function extractParentsRows(res) {
    if (!res || !res.success) return [];

    const d = res.data;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.data)) return d.data;
    return [];
  }

  function extractStudentsRows(res) {
    if (!res || !res.success) return [];

    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  }

  function extractRows(res) {
    if (!res || !res.success) return [];
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  }

  function extractPagination(res, fallbackTotal) {
    const fallback = { total: Number(fallbackTotal || 0) };
    if (!res || !res.success) return fallback;

    if (res.pagination && res.pagination.total != null) return res.pagination;
    if (res.data && res.data.pagination && res.data.pagination.total != null) return res.data.pagination;

    if (Array.isArray(res.data)) return { total: res.data.length };
    if (res.data && Array.isArray(res.data.data)) return { total: res.data.data.length };

    return fallback;
  }

  function actionBtn(action, icon, title, id, cls) {
    return '<button type="button" class="' + esc(cls || '') + '" data-action="' + esc(action) + '" data-id="' + esc(String(id || '')) + '" title="' + esc(title) + '"><i class="fas ' + icon + '"></i></button>';
  }

  function prefChip(label, enabled) {
    return '<span class="pref-chip ' + (enabled ? 'on' : 'off') + '"><i class="fas ' + (enabled ? 'fa-check-circle' : 'fa-minus-circle') + '"></i> ' + esc(label) + '</span>';
  }

  function pageBtn(page, label, disabled, active) {
    return '<button type="button" data-page="' + esc(String(page)) + '" ' + (disabled ? 'disabled' : '') + ' class="' + (active ? 'active' : '') + '">' + label + '</button>';
  }

  function setParentsLoading() {
    const tbody = document.getElementById('parentsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-parent-state">Loading parents...</td></tr>';
    }
  }

  function setParentsEmpty(message) {
    const tbody = document.getElementById('parentsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-parent-state">' + esc(message || 'No records') + '</td></tr>';
    }
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(S.prefs || {}));
    } catch (_) {}
  }

  function getParentPref(parent) {
    if (!parent || typeof parent !== 'object') {
      return { email: true, sms: false };
    }
    return {
      email: Number(parent.prefers_email_notifications) === 1,
      sms: Number(parent.prefers_sms_notifications) === 1,
    };
  }

  function on(id, eventName, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(eventName, handler);
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value == null ? '' : value;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function isChecked(id) {
    const el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function setChecked(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = !!checked;
  }

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toast(message, type) {
    if (typeof showToast === 'function') {
      showToast(message, type || 'success');
      return;
    }
    console.log('[Toast]', type || 'info', message);
  }

  function showConfirmPopup(title, message) {
    if (typeof window.showModal === 'function') {
      return new Promise(function (resolve) {
        window.showModal(
          title || 'Confirm',
          message || 'Are you sure?',
          function () { resolve(true); },
          function () { resolve(false); }
        );
      });
    }

    return new Promise(function (resolve) {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;';
      const box = document.createElement('div');
      box.style.cssText = 'background:#fff;border-radius:12px;max-width:420px;width:100%;padding:18px;box-shadow:0 18px 48px rgba(0,0,0,.2);';
      box.innerHTML =
        '<h3 style="margin:0 0 8px;font-size:16px;color:#0f172a">' + esc(title || 'Confirm') + '</h3>' +
        '<p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.5">' + esc(message || 'Are you sure?') + '</p>' +
        '<div style="display:flex;justify-content:flex-end;gap:8px">' +
        '<button type="button" data-role="cancel" style="padding:8px 12px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer">Cancel</button>' +
        '<button type="button" data-role="confirm" style="padding:8px 12px;border:0;background:#006a3f;color:#fff;border-radius:8px;cursor:pointer">Confirm</button>' +
        '</div>';

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      function close(result) {
        overlay.remove();
        resolve(result);
      }

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close(false);
      });
      box.querySelector('[data-role="cancel"]').addEventListener('click', function () { close(false); });
      box.querySelector('[data-role="confirm"]').addEventListener('click', function () { close(true); });
    });
  }

  function showAlertPopup(title, message) {
    if (typeof window.showModal === 'function') {
      window.showModal(title || 'Notice', message || '', function () {});
      return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:12px;max-width:420px;width:100%;padding:18px;box-shadow:0 18px 48px rgba(0,0,0,.2);';
    box.innerHTML =
      '<h3 style="margin:0 0 8px;font-size:16px;color:#0f172a">' + esc(title || 'Notice') + '</h3>' +
      '<p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.5">' + esc(message || '') + '</p>' +
      '<div style="display:flex;justify-content:flex-end">' +
      '<button type="button" data-role="ok" style="padding:8px 12px;border:0;background:#006a3f;color:#fff;border-radius:8px;cursor:pointer">OK</button>' +
      '</div>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function close() {
      overlay.remove();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    box.querySelector('[data-role="ok"]').addEventListener('click', close);
  }
})();
