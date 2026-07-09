/**
 * SuperUser Management Controller
 * Minimal scaffold: list, create/edit modal, delete
 */
(function () {
  'use strict';

  const State = {
    items: [],
    filtered: [],
    editingUuid: null,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    searchTerm: '',
    statusFilter: 'all',
    saving: false,
  };

  document.addEventListener('page:loaded', function (e) {
    const p = e?.detail?.page;
    if (p === 'superusers' || p === 'SuperUser') init();
  });

  function init() {
    const root = document.getElementById('superUserRoot');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    bindEvents();
    loadUsers();
  }

  function apiClient() {
    if (typeof window !== 'undefined' && window.API) return window.API;
    if (typeof API !== 'undefined') return API;
    return null;
  }

  function el(id) { return document.getElementById(id); }

  function toast(msg, type = 'info') {
    if (window.showToast) return window.showToast(msg, type);
    console.log(type, msg);
  }

  function showConfirmPopup(title, message) {
    if (typeof window.showConfirm === 'function') {
      return window.showConfirm(title, message);
    }

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'background:rgba(15,23,42,.5)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'z-index:3000',
        'padding:1rem'
      ].join(';');

      const modal = document.createElement('div');
      modal.style.cssText = [
        'width:100%',
        'max-width:420px',
        'background:#fff',
        'border-radius:12px',
        'box-shadow:0 20px 60px rgba(2,6,23,.28)',
        'border:1px solid #e2e8f0',
        'overflow:hidden'
      ].join(';');

      const heading = document.createElement('h4');
      heading.textContent = title || 'Confirm';
      heading.style.cssText = 'margin:0;font-size:1rem;font-weight:700;color:#0f172a;';

      const body = document.createElement('p');
      body.textContent = message || 'Are you sure?';
      body.style.cssText = 'margin:.55rem 0 0;color:#475569;font-size:.9rem;line-height:1.45;';

      const content = document.createElement('div');
      content.style.cssText = 'padding:1rem 1rem .85rem;';
      content.appendChild(heading);
      content.appendChild(body);

      const footer = document.createElement('div');
      footer.style.cssText = 'padding:.75rem 1rem;border-top:1px solid #e2e8f0;background:#f8fafc;display:flex;justify-content:flex-end;gap:.5rem;';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = 'border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:8px;padding:.45rem .8rem;cursor:pointer;';

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.cssText = 'border:1px solid #dc2626;background:#dc2626;color:#fff;border-radius:8px;padding:.45rem .8rem;cursor:pointer;';

      const close = (accepted) => {
        overlay.remove();
        resolve(Boolean(accepted));
      };

      cancelBtn.addEventListener('click', () => close(false));
      deleteBtn.addEventListener('click', () => close(true));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });

      footer.appendChild(cancelBtn);
      footer.appendChild(deleteBtn);
      modal.appendChild(content);
      modal.appendChild(footer);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      deleteBtn.focus();
    });
  }

  function bindEvents() {
    el('suRefreshBtn')?.addEventListener('click', () => loadUsers());
    el('suCreateBtn')?.addEventListener('click', () => openModal(null));
    el('suModalClose')?.addEventListener('click', closeModal);
    el('suModalCancel')?.addEventListener('click', closeModal);
    el('suModalSave')?.addEventListener('click', saveUser);
    el('suTogglePasswordBtn')?.addEventListener('click', togglePasswordVisibility);
    el('suGeneratePasswordBtn')?.addEventListener('click', applyGeneratedPassword);
    el('suModalOverlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    el('suSearchInput')?.addEventListener('input', (e) => {
      State.searchTerm = String(e.target.value || '').trim().toLowerCase();
      State.currentPage = 1;
      filterAndRender();
    });

    el('suStatusFilter')?.addEventListener('change', (e) => {
      State.statusFilter = String(e.target.value || 'all');
      State.currentPage = 1;
      filterAndRender();
    });

    el('suPagination')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn) return;
      const next = parseInt(btn.getAttribute('data-page') || '1', 10);
      if (next === State.currentPage) return;
      State.currentPage = next;
      renderTable();
    });

    el('suTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const uuid = btn.getAttribute('data-uuid');
      if (action === 'edit') {
        const item = State.items.find(x => String(x.uuid) === String(uuid));
        openModal(item || null);
      } else if (action === 'delete') {
        const item = State.items.find(x => String(x.uuid) === String(uuid));
        if (!item) return;
        showConfirmPopup('Delete SuperUser', `Delete ${item.email}?`)
          .then(ok => { if (ok) deleteUser(uuid); });
      }
    });
  }

  async function loadUsers() {
    try {
      const api = apiClient();
      if (!api) { console.warn('API client not ready'); return; }
      const res = await api.get(`${API_ENDPOINTS.SUPERADMIN_USERS}?limit=100`);
      if (res && res.success && res.data) {
        // Accept array or payload
        State.items = Array.isArray(res.data) ? res.data : (res.data.users || res.data);
        // Prefer show only superadmins
        State.items = State.items.filter(i => i.is_super_admin || i.is_super_admin === 1 || String(i.role || '').toLowerCase().includes('super'));
        renderStats();
        filterAndRender();
      }
    } catch (err) {
      console.error('Failed to load users', err);
      toast('Failed to load users', 'error');
    }
  }

  function renderTable() {
    const tbody = el('suTableBody');
    const total = State.filtered.length;
    State.totalPages = Math.max(1, Math.ceil(total / State.pageSize));
    if (State.currentPage > State.totalPages) State.currentPage = State.totalPages;

    const start = (State.currentPage - 1) * State.pageSize;
    const pageItems = State.filtered.slice(start, start + State.pageSize);

    const countLabel = el('suCountLabel');
    if (countLabel) {
      countLabel.textContent = total
        ? `Showing ${start + 1}–${Math.min(start + State.pageSize, total)} of ${total} superusers`
        : 'No superusers found';
    }

    if (!pageItems.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="superusers-empty">
              <i class="fas fa-users-cog"></i>
              <h4>No superusers found</h4>
              <p>Try adjusting your search or status filter.</p>
            </div>
          </td>
        </tr>
      `;
      renderPagination();
      return;
    }

    tbody.innerHTML = pageItems.map(item => `
      <tr>
        <td>
          <div class="superuser-cell">
            <div class="superuser-avatar">${escapeHtml(((item.first_name || '')[0] || '') + ((item.last_name || '')[0] || ''))}</div>
            <div>
              <div class="superuser-cell-name">${escapeHtml((item.first_name||'') + ' ' + (item.last_name||''))}</div>
              <div class="superuser-cell-sub">@${escapeHtml(item.username || item.email || '')}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(item.email || '')}</td>
        <td>${item.is_active ? '<span class="badge-active">Active</span>' : '<span class="badge-inactive">Inactive</span>'}</td>
        <td>
          <div class="superuser-actions">
            <button
              class="su-icon-btn su-icon-btn-edit"
              data-action="edit"
              data-uuid="${item.uuid}"
              title="Edit superuser"
              aria-label="Edit superuser"
            >
              <i class="fas fa-pen"></i>
            </button>
            <button
              class="su-icon-btn su-icon-btn-delete"
              data-action="delete"
              data-uuid="${item.uuid}"
              title="Delete superuser"
              aria-label="Delete superuser"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPagination();
  }

  function renderPagination() {
    const footer = el('suPagination');
    const info = el('suPaginationInfo');
    const controls = el('suPaginationControls');
    if (!footer) return;

    const total = State.filtered.length;
    if (!total) {
      footer.style.display = 'none';
      if (controls) controls.innerHTML = '';
      return;
    }

    footer.style.display = 'flex';
    const start = (State.currentPage - 1) * State.pageSize + 1;
    const end = Math.min(State.currentPage * State.pageSize, total);
    if (info) info.textContent = `Showing ${start}–${end} of ${total} superusers`;

    if (!controls) return;

    const pages = buildPageNumbers(State.currentPage, State.totalPages);
    controls.innerHTML = `
      <button data-page="${Math.max(1, State.currentPage - 1)}" ${State.currentPage === 1 ? 'disabled' : ''}>Prev</button>
      ${pages.map((page) => page === '...'
        ? '<button disabled>...</button>'
        : `<button data-page="${page}" ${page === State.currentPage ? 'class="active"' : ''}>${page}</button>`).join('')}
      <button data-page="${Math.min(State.totalPages, State.currentPage + 1)}" ${State.currentPage === State.totalPages ? 'disabled' : ''}>Next</button>
    `;
  }

  function buildPageNumbers(currentPage, totalPages) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) pages.push('...');
    for (let page = left; page <= right; page += 1) pages.push(page);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);

    return pages;
  }

  function renderStats() {
    const totalEl = el('suStatTotal');
    const activeEl = el('suStatActive');

    const total = State.items.length;
    const active = State.items.filter((item) => item.is_active === 1 || item.is_active === true || item.status === 'active').length;
    const institutions = new Set(State.items.map((item) => item.institution_id).filter(Boolean)).size;

    if (totalEl) totalEl.textContent = String(total);
    if (activeEl) activeEl.textContent = String(active);
  }

  function filterAndRender() {
    const search = State.searchTerm;
    State.filtered = State.items.filter((item) => {
      const name = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
      const username = String(item.username || '').toLowerCase();
      const email = String(item.email || '').toLowerCase();
      const isActive = item.is_active === 1 || item.is_active === true || item.status === 'active';

      const searchMatch = !search || name.includes(search) || username.includes(search) || email.includes(search);
      let statusMatch = true;
      if (State.statusFilter === 'active') statusMatch = isActive;
      if (State.statusFilter === 'inactive') statusMatch = !isActive;

      return searchMatch && statusMatch;
    });

    renderTable();
  }

  function openModal(user) {
    State.editingUuid = user ? user.uuid : null;
    el('suModalTitle').textContent = user ? 'Edit Super User' : 'New Super User';
    el('suFirstName').value = user?.first_name || '';
    el('suLastName').value = user?.last_name || '';
    el('suUsername').value = user?.username || '';
    el('suEmail').value = user?.email || '';
    el('suPassword').value = '';
    el('suPassword').type = 'password';
    const icon = el('suTogglePasswordIcon');
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
    el('suIsSuperadmin').checked = user ? Boolean(user.is_super_admin) : true;
    el('suIsActive').checked = user ? Boolean(user.is_active) : true;
    // Ensure save button is enabled and shows normal text when modal opens
    const saveBtn = el('suModalSave');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = saveBtn.dataset.origText || 'Save SuperUser';
    }
    el('suModalOverlay').classList.add('open');
    const formError = el('suFormError');
    if (formError) {
      formError.style.display = 'none';
      formError.textContent = '';
    }
  }

  function closeModal() {
    State.editingUuid = null;
    el('suModalOverlay').classList.remove('open');
    const formError = el('suFormError');
    if (formError) {
      formError.style.display = 'none';
      formError.textContent = '';
    }
  }

  function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }

  function normalizeValue(value) {
    return String(value || '').trim().toLowerCase();
  }

  function findConflictingUser(email, username) {
    const normalizedEmail = normalizeValue(email);
    const normalizedUsername = normalizeValue(username);

    return State.items.find((item) => {
      if (State.editingUuid && String(item.uuid) === String(State.editingUuid)) {
        return false;
      }

      const itemEmail = normalizeValue(item.email);
      const itemUsername = normalizeValue(item.username);

      return (
        (normalizedEmail && itemEmail === normalizedEmail) ||
        (normalizedUsername && itemUsername === normalizedUsername)
      );
    }) || null;
  }

  function deriveUsername(email) {
    const localPart = String(email || '').split('@')[0].trim();
    return localPart.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
  }

  function generateTemporaryPassword(length = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    let password = '';
    for (let i = 0; i < length; i += 1) {
      password += chars[values[i] % chars.length];
    }
    return password;
  }

  function togglePasswordVisibility() {
    const input = el('suPassword');
    const icon = el('suTogglePasswordIcon');
    if (!input) return;

    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';

    if (icon) {
      icon.classList.toggle('fa-eye', !show);
      icon.classList.toggle('fa-eye-slash', show);
    }
  }

  function applyGeneratedPassword() {
    const input = el('suPassword');
    const icon = el('suTogglePasswordIcon');
    if (!input) return;

    input.value = generateTemporaryPassword(14);
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
    input.focus();
    input.select();
    toast('Password generated', 'success');
  }

  async function saveUser() {
    const first_name = (el('suFirstName').value || '').trim();
    const last_name = (el('suLastName').value || '').trim();
    const email = (el('suEmail').value || '').trim();
    const usernameInput = (el('suUsername').value || '').trim();
    const username = usernameInput || deriveUsername(email);
    const passwordInput = (el('suPassword').value || '').trim();
    const is_super_admin = !!el('suIsSuperadmin').checked;
    const is_active = !!el('suIsActive').checked;

   

    if (!first_name || !last_name || !username || !email) { 
      toast('Please fill all required fields', 'warning'); 
      State.saving = false;
      if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = saveBtn.dataset.origText || 'Save SuperUser'; }
      return; 
    }

    if (!email.includes('@')) {
      toast('Please enter a valid email address', 'warning');
      return;
    }

    const conflictingUser = findConflictingUser(email, username);
    if (conflictingUser) {
      toast(
        `A user with that email or username already exists: ${conflictingUser.email || conflictingUser.username || 'existing user'}`,
        'warning'
      );
      return;
    }

    const formError = el('suFormError');
    if (formError) {
      formError.style.display = 'none';
      formError.textContent = '';
    }

     const saveBtn = el('suModalSave');
    if (State.saving || (saveBtn && saveBtn.disabled)) return;
    if (saveBtn && !saveBtn.dataset.origText) saveBtn.dataset.origText = saveBtn.innerHTML;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    State.saving = true;

    const password = passwordInput || (!State.editingUuid ? generateTemporaryPassword() : '');

    const payload = {
      first_name,
      last_name,
      username,
      email,
      is_super_admin: is_super_admin ? 1 : 0,
      is_active: is_active ? 1 : 0,
    };

    if (!State.editingUuid || passwordInput) {
      payload.password = password;
    }

    const api = apiClient();
    if (!api) { toast('API client not available', 'error'); return; }

    try {
      let res;
      if (State.editingUuid) {
        res = await api.put(`${API_ENDPOINTS.SUPERADMIN_USERS}/${State.editingUuid}`, payload);
      } else {
        res = await api.post(API_ENDPOINTS.SUPERADMIN_USERS, payload);
      }

      if (res && res.success) {
        toast('Saved', 'success');
        if (!State.editingUuid && !passwordInput) {
          console.info('Temporary password generated for new SuperUser:', password);
        }
        closeModal();
        loadUsers();
      } else {
        const message = res?.message || 'Save failed';
        if (formError) {
          formError.textContent = message;
          formError.style.display = 'block';
        }
        toast(message, 'error');
      }
    } catch (err) {
      console.error('Save error', err);
      const message = err?.message || 'Save failed';
      if (formError) {
        formError.textContent = message;
        formError.style.display = 'block';
      }
      toast(message, 'error');
    } finally {
      State.saving = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = saveBtn.dataset.origText || 'Save SuperUser';
      }
    }
  }

  async function deleteUser(uuid) {
    try {
      const api = apiClient();
      if (!api) { toast('API client not available', 'error'); return; }
      const res = await api.delete(`${API_ENDPOINTS.SUPERADMIN_USERS}/${uuid}`);
      if (res && res.success) {
        toast('Deleted', 'success');
        loadUsers();
      } else {
        toast(res?.message || 'Delete failed', 'error');
      }
    } catch (err) {
      console.error('Delete error', err);
      toast('Delete failed', 'error');
    }
  }

  // Auto init if page already visible
  setTimeout(() => { init(); }, 200);

})();
