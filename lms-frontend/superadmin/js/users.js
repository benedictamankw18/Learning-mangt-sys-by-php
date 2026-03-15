(function () {
    'use strict';

    // ─── State ────────────────────────────────────────────────────────────────
    const S = {
        users: [],
        institutions: [],
        roles: [],
        importFile: null,
        importRows: [],
        total: 0,
        page: 1,
        totalPages: 1,
        limit: 20,
        search: '',
        filterInstitution: '',
        filterStatus: '',
        selectedUuids: new Set(),
        editingUuid: null,
        searchTimer: null,
        openCreateFromContext: false,
    };

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'users') {
            initUsersPage();
        }
    });

    function initUsersPage() {
        S.page = 1;
        S.search = '';
        S.filterInstitution = '';
        S.filterStatus = '';
        S.selectedUuids = new Set();
        S.editingUuid = null;
        S.importFile = null;
        S.importRows = [];
        S.totalPages = 1;
        S.openCreateFromContext = false;

        applyLaunchContext();

        setupEventListeners();
        loadInstitutions();
        loadRoles();
        loadUsers().then(() => {
            renderStats();
            renderTable();
            if (S.openCreateFromContext) {
                S.openCreateFromContext = false;
                openUserModal(null);
            }
        });
    }

    function applyLaunchContext() {
        try {
            const prefillInstitutionId = localStorage.getItem('superadmin.users.prefillInstitutionId');
            const autoOpenCreateAdmin = localStorage.getItem('superadmin.users.autoOpenCreateAdmin');

            if (prefillInstitutionId) {
                S.filterInstitution = String(prefillInstitutionId);
            }

            if (autoOpenCreateAdmin === '1') {
                S.openCreateFromContext = true;
            }

            localStorage.removeItem('superadmin.users.prefillInstitutionId');
            localStorage.removeItem('superadmin.users.autoOpenCreateAdmin');
        } catch (_) {}
    }

    // ─── Tiny helpers ─────────────────────────────────────────────────────────
    function q(sel, ctx) { return (ctx || document).querySelector(sel); }
    function on(id, ev, fn) { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); }
    function esc(s) { return typeof escHtml === 'function' ? escHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function setEl(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
    function userUuid(u) { return String(u?.uuid || u?.user_uuid || ''); }

    function toast(msg, type) {
        if (typeof window.showToast === 'function') window.showToast(msg, type);
        else console.log(msg);
    }

    function confirm_(title, msg, onConfirm) {
        if (typeof window.showModal === 'function') window.showModal(title, msg, onConfirm);
        else { if (confirm(`${title}\n${msg}`)) onConfirm(); }
    }

    function generateRandomPassword(length = 12) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        let out = '';
        for (let i = 0; i < bytes.length; i++) {
            out += chars[bytes[i] % chars.length];
        }
        return out;
    }

    function normalizePagination(pagination) {
        const total = Math.max(0, parseInt(pagination?.total, 10) || 0);
        const perPage = Math.max(1, parseInt(pagination?.per_page, 10) || S.limit || 20);
        const totalPages = Math.max(1, parseInt(pagination?.total_pages, 10) || Math.ceil(total / perPage) || 1);
        const currentPage = Math.min(
            Math.max(1, parseInt(pagination?.current_page, 10) || 1),
            totalPages
        );

        return {
            ...pagination,
            total,
            per_page: perPage,
            total_pages: totalPages,
            current_page: currentPage,
        };
    }

    // ─── Load Data ─────────────────────────────────────────────────────────────
    async function loadInstitutions() {
        try {
            const res = await API.get('/api/institutions', { limit: 1000, include_all: 1 });
            const list =
                (Array.isArray(res?.data) && res.data) ||
                (Array.isArray(res?.data?.data) && res.data.data) ||
                (Array.isArray(res?.institutions) && res.institutions) ||
                [];

            S.institutions = list;
            populateInstitutionFilters();
            renderStats();
            if (S.users.length) renderTable();
        } catch (err) {
            console.error('Error loading institutions:', err);
            S.institutions = [];
        }
    }

    async function loadRoles() {
        try {
            const res = await API.get(API_ENDPOINTS.ROLES + '?limit=1000');
            if (res && res.data) {
                S.roles = Array.isArray(res.data) ? res.data : [];
            }
            populateRoleSelects();
            if (S.users.length) renderTable();
        } catch (err) {
            console.error('Error loading roles:', err);
            S.roles = [];
        }
    }

    async function loadUsers() {
        const params = { page: S.page, limit: S.limit };
        if (S.search) params.search = S.search;
        if (S.filterInstitution) params.institution_id = S.filterInstitution;
        if (S.filterStatus) params.is_active = S.filterStatus === 'active' ? 1 : 0;
        // Filter for admin users only
        params.role_filter = 'admin';

        try {
            const res = await API.get('/api/users', params);
            if (res && res.data) {
                S.users = Array.isArray(res.data) ? res.data : [];
                if (res.pagination) {
                    const pagination = normalizePagination(res.pagination);
                    S.page = pagination.current_page;
                    S.total = pagination.total;
                    S.totalPages = pagination.total_pages;
                    renderPagination(pagination);
                } else {
                    S.total = S.users.length;
                    S.totalPages = 1;
                    S.page = 1;
                }
                if (!res.pagination) {
                    const footer = document.getElementById('usersPagination');
                    if (footer) footer.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Error loading users:', err);
            showTableError('Failed to load admin users');
        }
    }

    function showTableError(msg) {
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#ef4444">${esc(msg)}</td></tr>`;
        }
    }

    // ─── Populate Selects ──────────────────────────────────────────────────────
    function populateInstitutionFilters() {
        const opts = S.institutions.map(i =>
            `<option value="${esc(i.institution_id)}">${esc(i.institution_name)}</option>`
        ).join('');

        const filterSel = document.getElementById('filterInstitution');
        if (filterSel) {
            filterSel.innerHTML = '<option value="">All Institutions</option>' + opts;
            if (S.filterInstitution) {
                filterSel.value = String(S.filterInstitution);
            }
        }

        const formSel = document.getElementById('fieldInstitutionId');
        if (formSel) formSel.innerHTML = '<option value="">Select Institution</option>' + opts;
    }

    function populateRoleSelects() {
        const formSel = document.getElementById('fieldRoleId');
        if (!formSel) return;

        // Filter for admin-level roles only
        const adminRoles = S.roles.filter(r => {
            const roleName = (r.role_name || '').toLowerCase();
            const roleSlug = (r.role_slug || '').toLowerCase();
            const hasAdmin = roleName.includes('admin') || roleSlug.includes('admin');
            const isSuperAdmin = roleName.includes('super') || roleSlug.includes('super');
            return hasAdmin && !isSuperAdmin;
        });
        
        const opts = adminRoles.map(r =>
            `<option value="${esc(r.role_id)}">${esc(r.role_name)}</option>`
        ).join('');

        if (formSel) formSel.innerHTML = '<option value="">Select Admin Role</option>' + opts;
    }

    // ─── Render Stats ─────────────────────────────────────────────────────────
    function renderStats() {
        const totalUsers = S.total;
        const activeUsers = S.users.filter(u => u.is_active || u.status === 'active').length;
        const institutionCount = S.institutions.length || new Set(S.users.map(u => u.institution_id)).size;

        setEl('statTotalUsers', totalUsers);
        setEl('statActiveUsers', activeUsers);
        setEl('statInstitutions', institutionCount);
    }

    // ─── Render Table ─────────────────────────────────────────────────────────
    function renderTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!S.users.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="users-empty"><i class="fas fa-users"></i><h4>No users found</h4><p>Try adjusting your search or filters.</p></div></td></tr>';
            return;
        }

        tbody.innerHTML = S.users.map(u => {
            const uuid = userUuid(u);
            const isSelected = S.selectedUuids.has(uuid);
            const isActive = u.is_active || u.status === 'active';
            const statusBadge = isActive
                ? '<span class="badge-active">Active</span>'
                : '<span class="badge-inactive">Inactive</span>';
            const loginRaw = u.last_login || u.last_login_at || u.last_seen_at || null;
            const lastLogin = loginRaw ? new Date(loginRaw).toLocaleDateString() : '—';
            const institutionName = u.institution_name || S.institutions.find(i => i.institution_id == u.institution_id)?.institution_name || '—';
            const initials = esc((u.first_name?.[0] || '') + (u.last_name?.[0] || ''));
            return `
                <tr>
                    <td style="text-align: center; width: 40px;">
                        <input type="checkbox" class="user-row-cb" data-user-uuid="${esc(uuid)}" ${isSelected ? 'checked' : ''} ${uuid ? '' : 'disabled'}>
                    </td>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar">${initials}</div>
                            <div>
                                <div class="user-cell-name">${esc(u.first_name)} ${esc(u.last_name)}</div>
                                <div class="user-cell-sub">@${esc(u.username || u.email)}</div>
                            </div>
                        </div>
                    </td>
                    <td style="font-size: 0.875rem;">${esc(institutionName)}</td>
                    <td>${statusBadge}</td>
                    <td style="font-size: 0.875rem; color: var(--text-secondary, #64748b);">${lastLogin}</td>
                    <td>
                        <div class="user-actions">
                            <button class="btn-edit" onclick="userEdit('${esc(uuid)}')" title="Edit" ${uuid ? '' : 'disabled'}>
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="userDelete('${esc(uuid)}', '${esc(u.first_name)} ${esc(u.last_name)}')" title="Delete" ${uuid ? '' : 'disabled'}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach checkbox listeners
        document.querySelectorAll('.user-row-cb').forEach(cb => {
            cb.addEventListener('change', function () {
                const userId = this.getAttribute('data-user-uuid');
                if (!userId) return;
                if (this.checked) {
                    S.selectedUuids.add(userId);
                } else {
                    S.selectedUuids.delete(userId);
                }
                updateBulkActions();
            });
        });
    }

    // ─── Pagination ───────────────────────────────────────────────────────────
    function renderPagination(pagination) {
        const footer = document.getElementById('usersPagination');
        const info = document.getElementById('usersPaginationInfo');
        const controls = document.getElementById('usersPaginationControls');
        if (!footer) return;

        if (!pagination || !pagination.total) {
            S.page = 1;
            S.totalPages = 1;
            footer.style.display = 'none';
            return;
        }

        const { current_page, total_pages, total, per_page } = pagination;
        const from = (current_page - 1) * per_page + 1;
        const to = Math.min(current_page * per_page, total);

        footer.style.display = 'flex';
        if (info) info.textContent = `Showing ${from}–${to} of ${total} users`;

        // Only render navigation buttons when there is more than one page
        if (controls) {
            if (total_pages <= 1) {
                controls.innerHTML = '';
            } else {
                let btns = '';
                btns += `<button ${current_page === 1 ? 'disabled' : ''} onclick="userGoPage(${current_page - 1})"><i class="fas fa-chevron-left"></i></button>`;
                for (let p = 1; p <= total_pages; p++) {
                    if (p === 1 || p === total_pages || (p >= current_page - 2 && p <= current_page + 2)) {
                        btns += `<button class="${current_page === p ? 'active' : ''}" onclick="userGoPage(${p})">${p}</button>`;
                    } else if (p === 2 || p === total_pages - 1) {
                        btns += `<button disabled>…</button>`;
                    }
                }
                btns += `<button ${current_page === total_pages ? 'disabled' : ''} onclick="userGoPage(${current_page + 1})"><i class="fas fa-chevron-right"></i></button>`;
                controls.innerHTML = btns;
            }
        }
    }

    window.userGoPage = function (p) {
        const nextPage = Math.min(Math.max(1, parseInt(p, 10) || 1), Math.max(1, S.totalPages || 1));
        if (nextPage === S.page) return;
        S.page = nextPage;
        loadUsers().then(() => {
            renderStats();
            renderTable();
        });
    };

    // ─── Bulk Actions ─────────────────────────────────────────────────────────
    function updateBulkActions() {
        const bar = document.getElementById('bulkActions');
        if (!bar) return;
        const count = S.selectedUuids.size;
        setEl('selectedCount', count);
        bar.classList.toggle('active', count > 0);
        const sa = document.getElementById('selectAllUsers');
        if (sa) sa.checked = count === S.users.length && S.users.length > 0;
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────
    function setupEventListeners() {
        // Search with debounce
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                clearTimeout(S.searchTimer);
                S.searchTimer = setTimeout(() => {
                    S.search = this.value.trim();
                    S.page = 1;
                    loadUsers().then(() => {
                        renderStats();
                        renderTable();
                    });
                }, 300);
            });
        }

        // Filters
        on('filterInstitution', 'change', function () {
            S.filterInstitution = this.value;
            S.page = 1;
            loadUsers().then(() => {
                renderStats();
                renderTable();
            });
        });

        on('filterStatus', 'change', function () {
            S.filterStatus = this.value;
            S.page = 1;
            loadUsers().then(() => {
                renderStats();
                renderTable();
            });
        });

        // Add user
        on('btnCreateUser', 'click', () => openUserModal(null));

        // Export
        on('btnExportCSV', 'click', exportUsers);
        on('btnExportPDF', 'click', exportUsersPdf);

        // Import
        on('btnImport', 'click', openImportModal);
        on('fileImport', 'change', e => handleImportFile(e.target.files[0]));
        on('downloadUserTemplate', 'click', downloadUserTemplate);
        on('userImportDropZone', 'click', () => {
            const input = document.getElementById('fileImport');
            if (input) input.click();
        });
        on('userImportConfirmBtn', 'click', confirmImport);
        on('userImportCancelBtn', 'click', closeImportModal);
        on('userImportModalClose', 'click', closeImportModal);
        on('userImportResultsClose', 'click', closeImportResults);
        on('userImportResultsDoneBtn', 'click', closeImportResults);
        on('userImportModalOverlay', 'click', function (e) {
            if (e.target === this) closeImportModal();
        });
        on('userImportResultsOverlay', 'click', function (e) {
            if (e.target === this) closeImportResults();
        });

        (function () {
            const zone = document.getElementById('userImportDropZone');
            if (!zone) return;
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
                zone.addEventListener(evt, e => e.preventDefault());
            });
            zone.addEventListener('dragover', () => zone.classList.add('dragover'));
            zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
            zone.addEventListener('drop', e => {
                zone.classList.remove('dragover');
                handleImportFile(e.dataTransfer.files[0]);
            });
        })();

        // Select all
        on('selectAllUsers', 'change', function () {
            if (this.checked) {
                S.users.forEach(u => {
                    const uuid = userUuid(u);
                    if (uuid) S.selectedUuids.add(uuid);
                });
            } else {
                S.selectedUuids.clear();
            }
            renderTable();
            updateBulkActions();
        });

        // Bulk actions
        on('bulkActivateBtn', 'click', () => bulkSetStatus('active'));
        on('bulkDeactivateBtn', 'click', () => bulkSetStatus('inactive'));
        on('bulkDeleteBtn', 'click', bulkDelete);
        on('bulkClearBtn', 'click', () => {
            S.selectedUuids.clear();
            updateBulkActions();
            renderTable();
        });

        // User modal
        on('userModalClose', 'click', closeUserModal);
        on('userModalCancel', 'click', closeUserModal);
        on('userModalSave', 'click', saveUser);
        on('userModalOverlay', 'click', function (e) {
            if (e.target === this) closeUserModal();
        });
    }

    // ─── User Modal ────────────────────────────────────────────────────────────
    function openUserModal(userUuidValue) {
        S.editingUuid = userUuidValue || null;
        const overlay = document.getElementById('userModalOverlay');
        const title = document.getElementById('userModalTitle');
        const errEl = document.getElementById('userFormError');
        if (!overlay) return;

        // Reset form
        const form = document.getElementById('userForm');
        if (form) form.reset();
        document.getElementById('userUuid').value = '';
        if (errEl) errEl.style.display = 'none';

        if (!userUuidValue) {
            if (title) title.textContent = 'Add New User';
            if (S.filterInstitution) {
                const institutionField = document.getElementById('fieldInstitutionId');
                if (institutionField) institutionField.value = String(S.filterInstitution);
            }
            overlay.classList.add('open');
            return;
        }

        // Edit — fetch user data
        if (title) title.textContent = 'Edit User';
        overlay.classList.add('open');
        const saveBtn = document.getElementById('userModalSave');
        if (saveBtn) saveBtn.disabled = true;

        API.get('/api/users/' + userUuidValue).then(res => {
            if (res && res.data) {
                const user = res.data;
                document.getElementById('userUuid').value = user.uuid || user.user_uuid || userUuidValue || '';
                document.getElementById('fieldFirstName').value = user.first_name || '';
                document.getElementById('fieldLastName').value = user.last_name || '';
                document.getElementById('fieldEmail').value = user.email || '';
                document.getElementById('fieldUsername').value = user.username || '';
                document.getElementById('fieldInstitutionId').value = user.institution_id || '';
                const roleField = document.getElementById('fieldRoleId');
                if (roleField) roleField.value = user.role_id || '';
                document.getElementById('fieldStatus').value = user.is_active ? '1' : '0';
            }
            if (saveBtn) saveBtn.disabled = false;
        }).catch(err => {
            console.error('Error loading user:', err);
            if (errEl) {
                errEl.textContent = 'Failed to load user';
                errEl.style.display = 'block';
            }
            if (saveBtn) saveBtn.disabled = false;
        });
    }

    function closeUserModal() {
        const overlay = document.getElementById('userModalOverlay');
        if (overlay) overlay.classList.remove('open');
        S.editingUuid = null;
    }

    async function saveUser() {
        const saveBtn = document.getElementById('userModalSave');
        const errEl = document.getElementById('userFormError');
        if (errEl) errEl.style.display = 'none';

        const userId = document.getElementById('userUuid').value.trim();
        const payload = {
            first_name: (document.getElementById('fieldFirstName').value || '').trim(),
            last_name: (document.getElementById('fieldLastName').value || '').trim(),
            email: (document.getElementById('fieldEmail').value || '').trim(),
            username: (document.getElementById('fieldUsername').value || '').trim(),
            institution_id: document.getElementById('fieldInstitutionId').value,
            is_active: parseInt(document.getElementById('fieldStatus').value),
        };

        const roleField = document.getElementById('fieldRoleId');
        if (roleField && roleField.value) payload.role_id = roleField.value;

        if (!payload.first_name || !payload.last_name || !payload.email || !payload.username) {
            if (errEl) {
                errEl.textContent = 'All fields are required';
                errEl.style.display = 'block';
            }
            return;
        }

        // Client-side duplicate guard for faster feedback.
        // Backend still enforces uniqueness as source of truth.
        const emailNorm = payload.email.toLowerCase();
        const usernameNorm = payload.username.toLowerCase();
        const duplicate = S.users.find(u => {
            const sameUser = String(userUuid(u)) === String(userId);
            if (sameUser) return false;
            const uEmail = String(u.email || '').toLowerCase();
            const uUsername = String(u.username || '').toLowerCase();
            return uEmail === emailNorm || uUsername === usernameNorm;
        });

        if (duplicate) {
            const uEmail = String(duplicate.email || '').toLowerCase();
            const uUsername = String(duplicate.username || '').toLowerCase();
            let msg = 'User already exists.';
            if (uEmail === emailNorm) msg = 'Email already exists. Use a different email.';
            else if (uUsername === usernameNorm) msg = 'Username already exists. Use a different username.';
            if (errEl) {
                errEl.textContent = msg;
                errEl.style.display = 'block';
            }
            return;
        }

        if (!userId) {
            payload.password = generateRandomPassword(12);
        }

        if (saveBtn) saveBtn.disabled = true;

        try {
            let res;
            if (userId) {
                res = await API.put('/api/users/' + userId, payload);
            } else {
                res = await API.post('/api/users', payload);
            }

            if (res) {
                toast(userId ? 'User updated successfully' : 'User created successfully', 'success');
                closeUserModal();
                S.page = 1;
                await loadUsers();
                renderStats();
                renderTable();
            }
        } catch (err) {
            console.error('Error saving user:', err);
            if (errEl) {
                const message = String(err.message || 'Failed to save user');
                if (/email already exists/i.test(message)) {
                    errEl.textContent = 'Email already exists. Use a different email.';
                } else if (/username already exists/i.test(message)) {
                    errEl.textContent = 'Username already exists. Use a different username.';
                } else {
                    errEl.textContent = message;
                }
                errEl.style.display = 'block';
            }
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    // ─── Delete & Bulk Operations ──────────────────────────────────────────────
    window.userEdit = function (userId) {
        openUserModal(userId);
    };

    window.userDelete = function (userId, name) {
        confirm_(
            'Delete User',
            `Delete "${name}"? This cannot be undone.`,
            async () => {
                try {
                    await API.delete('/api/users/' + userId);
                    toast('User deleted successfully', 'success');
                    S.selectedUuids.delete(userId);
                    await loadUsers();
                    renderStats();
                    renderTable();
                    updateBulkActions();
                } catch (err) {
                    console.error('Error deleting user:', err);
                    toast('Failed to delete user', 'error');
                }
            }
        );
    };

    async function bulkSetStatus(status) {
        if (!S.selectedUuids.size) return;
        const userIds = [...S.selectedUuids];
        const label = status === 'active' ? 'activate' : 'deactivate';
        confirm_(
            'Bulk ' + label,
            `${label.charAt(0).toUpperCase() + label.slice(1)} ${userIds.length} user(s)?`,
            async () => {
                let success = 0;
                for (const userId of userIds) {
                    try {
                        await API.put('/api/users/' + userId, { is_active: status === 'active' ? 1 : 0 });
                        success++;
                    } catch (err) {
                        console.error('Error updating user:', err);
                    }
                }
                toast(`${success}/${userIds.length} user(s) ${label}d`, success === userIds.length ? 'success' : 'warning');
                S.selectedUuids.clear();
                await loadUsers();
                renderStats();
                renderTable();
                updateBulkActions();
            }
        );
    }

    async function bulkDelete() {
        if (!S.selectedUuids.size) return;
        const userIds = [...S.selectedUuids];
        confirm_(
            'Delete Users',
            `Permanently delete ${userIds.length} user(s)? This cannot be undone.`,
            async () => {
                let success = 0;
                for (const userId of userIds) {
                    try {
                        await API.delete('/api/users/' + userId);
                        success++;
                    } catch (err) {
                        console.error('Error deleting user:', err);
                    }
                }
                toast(`${success}/${userIds.length} user(s) deleted`, success === userIds.length ? 'success' : 'warning');
                S.selectedUuids.clear();
                await loadUsers();
                renderStats();
                renderTable();
                updateBulkActions();
            }
        );
    }

    // ─── Export CSV ────────────────────────────────────────────────────────────
    function exportUsers() {
        if (!S.users.length) {
            toast('No admin users to export', 'warning');
            return;
        }
        const rows = [['First Name', 'Last Name', 'Email', 'Username', 'Institution', 'Status']];
        S.users.forEach(u => {
            const institutionName = u.institution_name || S.institutions.find(i => i.institution_id == u.institution_id)?.institution_name || '';
            rows.push([
                u.first_name || '',
                u.last_name || '',
                u.email || '',
                u.username || '',
                institutionName,
                u.is_active ? 'Active' : 'Inactive',
            ]);
        });
        const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'admin_users.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

        function exportUsersPdf() {
                if (!S.users.length) {
                        toast('No admin users to export', 'warning');
                        return;
                }

                const date = new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                });

                const filterLabel = [
                        S.search ? `Search: "${S.search}"` : '',
                        S.filterInstitution
                                ? `Institution: ${S.institutions.find(i => String(i.institution_id) === String(S.filterInstitution))?.institution_name || S.filterInstitution}`
                                : '',
                        S.filterStatus ? `Status: ${S.filterStatus}` : '',
                ].filter(Boolean).join(' | ');

                const formatDate = (value) => {
                        if (!value) return '—';
                        const d = new Date(value);
                        if (Number.isNaN(d.getTime())) return String(value);
                        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                };

                const statusBadge = (isActive) => {
                        const color = isActive ? '#15803d' : '#854d0e';
                        const bg = isActive ? '#dcfce7' : '#fef9c3';
                        const text = isActive ? 'Active' : 'Inactive';
                        return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:${color};background:${bg}">${text}</span>`;
                };

                const tableRows = S.users.map((u, idx) => {
                        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
                        const institutionName = u.institution_name || S.institutions.find(i => i.institution_id == u.institution_id)?.institution_name || '—';
                        const isActive = !!(u.is_active || u.status === 'active');
                        const loginRaw = u.last_login || u.last_login_at || u.last_seen_at || null;
                        const lastLogin = formatDate(loginRaw);

                        return `
                        <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8fafc'}">
                                <td>${idx + 1}</td>
                                <td><strong>${esc(fullName)}</strong></td>
                                <td>${esc(u.email || '—')}</td>
                                <td style="font-family:monospace;font-size:11px">${esc(u.username || '—')}</td>
                                <td>${esc(institutionName)}</td>
                                <td>${statusBadge(isActive)}</td>
                                <td>${esc(lastLogin)}</td>
                        </tr>`;
                }).join('');

                const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Admin Users Export - ${date}</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #006a3f; padding-bottom: 12px; }
    .header h1 { font-size: 18px; color: #006a3f; }
    .header .meta { text-align: right; color: #64748b; font-size: 11px; line-height: 1.6; }
    .filter-bar { font-size: 11px; color: #64748b; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #006a3f; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .footer { margin-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print {
        body { padding: 0; }
        @page { margin: 15mm; size: A4 landscape; }
        button { display: none !important; }
    }
</style>
</head>
<body>
    <div class="header">
        <div>
            <h1>Admin Users Report</h1>
            <p style="color:#64748b;margin-top:2px">Total: <strong>${S.users.length}</strong> user${S.users.length !== 1 ? 's' : ''}</p>
        </div>
        <div class="meta">
            <div>Exported: ${date}</div>
            <button onclick="window.print()" style="margin-top:6px;padding:4px 12px;background:#006a3f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px">Print / Save PDF</button>
        </div>
    </div>
    ${filterLabel ? `<div class="filter-bar">Filters: ${esc(filterLabel)}</div>` : ''}
    <table>
        <thead>
            <tr>
                <th>#</th><th>Name</th><th>Email</th><th>Username</th>
                <th>Institution</th><th>Status</th><th>Last Login</th>
            </tr>
        </thead>
        <tbody>${tableRows}</tbody>
    </table>
    <div class="footer">Generated by LMS - ${date}</div>
</body>
</html>`;

                const win = window.open('', '_blank', 'width=1100,height=750');
                if (!win) {
                        toast('Allow pop-ups to export PDF', 'warning');
                        return;
                }

                win.document.write(html);
                win.document.close();
                win.focus();
                toast(`PDF ready - ${S.users.length} user${S.users.length !== 1 ? 's' : ''}`, 'success');
        }

    function downloadUserTemplate() {
        const csv = [
            '# Required: institution_code, first_name,last_name,email,username',
            '# Optional: is_active (1=active / 0=inactive, default: 1)',
            '# Rows starting with # are ignored.',
            'first_name,last_name,email,username,institution_code,is_active',
            'Ama,Mensah,ama@example.com,amensah,ASHS,1',
            'Kwesi,Owusu,kwesi@example.com,kowusu,TSHS,0',
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'admin_users_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // ─── Import CSV ────────────────────────────────────────────────────────────
    function openImportModal() {
        const overlay = document.getElementById('userImportModalOverlay');
        const input = document.getElementById('fileImport');
        const preview = document.getElementById('userImportPreview');
        const confirmBtn = document.getElementById('userImportConfirmBtn');
        if (overlay) overlay.classList.add('open');
        if (input) input.value = '';
        if (preview) {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
        if (confirmBtn) confirmBtn.disabled = true;
        S.importFile = null;
        S.importRows = [];
    }

    function closeImportModal() {
        const overlay = document.getElementById('userImportModalOverlay');
        if (overlay) overlay.classList.remove('open');
        S.importFile = null;
        S.importRows = [];
    }

    function closeImportResults() {
        const overlay = document.getElementById('userImportResultsOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    function handleImportFile(file) {
        if (!file) return;

        const fileName = String(file.name || '').toLowerCase();
        if (!fileName.endsWith('.csv')) {
            toast('Please upload a CSV file.', 'error');
            return;
        }

        S.importFile = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            const text = String((e && e.target && e.target.result) || '');
            const parsed = parseCsvRows(text);

            const preview = document.getElementById('userImportPreview');
            const confirmBtn = document.getElementById('userImportConfirmBtn');

            if (parsed.errors.length) {
                if (preview) {
                    preview.innerHTML = `<strong style="color:#b91c1c">Import template issues:</strong><br>${parsed.errors.map(err => esc(err)).join('<br>')}`;
                    preview.style.display = 'block';
                }
                if (confirmBtn) confirmBtn.disabled = true;
                S.importRows = [];
                return;
            }

            S.importRows = parsed.rows;

            if (preview) {
                const sizeKb = (file.size / 1024).toFixed(1);
                const unmatched = parsed.unmatchedInstitutionCodes;
                preview.innerHTML = `
                    <strong>${S.importRows.length} row(s) ready to import</strong><br>
                    ${esc(file.name)}<br>
                    <span style="color: var(--text-secondary, #64748b)">Size: ${esc(sizeKb)} KB</span>
                    ${unmatched.length ? `<br><span style="color:#b45309">Unmatched institution_code: ${esc(unmatched.join(', '))}</span>` : ''}
                `;
                preview.style.display = 'block';
            }
            if (confirmBtn) confirmBtn.disabled = S.importRows.length === 0;
        };
        reader.readAsText(file);
    }

    async function confirmImport() {
        if (!S.importRows.length) {
            toast('Select a valid CSV file first.', 'warning');
            return;
        }

        const btn = document.getElementById('userImportConfirmBtn');
        if (btn) btn.disabled = true;

        try {
            const response = await API.post('/api/users/import', { rows: S.importRows });
            const payload = (response && response.data && !Array.isArray(response.data)) ? response.data : (response || {});
            const created = Number(payload.created || 0);
            const errors = Array.isArray(payload.errors) ? payload.errors : [];

            showImportResults(S.importRows, created, errors);

            if (errors.length) {
                const sample = errors.slice(0, 3).map(e => `Row ${e.row}: ${e.error}`).join(' | ');
                toast(`Import done: ${created} created, ${errors.length} skipped/failed. ${sample}`, created > 0 ? 'warning' : 'error');
            } else {
                toast(`Import successful: ${created} user(s) created`, 'success');
            }

            closeImportModal();
            S.page = 1;
            await loadUsers();
            renderStats();
            renderTable();
        } catch (err) {
            console.error('Import users error:', err);
            toast(err.message || 'Failed to import users', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function showImportResults(rows, createdCount, errors) {
        const overlay = document.getElementById('userImportResultsOverlay');
        const summary = document.getElementById('userImportResultsSummary');
        const tbody = document.getElementById('userImportResultsBody');
        if (!overlay || !summary || !tbody) return;

        const errorByRow = new Map();
        (errors || []).forEach(err => {
            const row = Number(err.row || 0);
            if (row > 0) errorByRow.set(row, String(err.error || 'Failed'));
        });

        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        const tableHtml = (rows || []).map((row, index) => {
            const rowNo = index + 1;
            const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.username || row.email || `Row ${rowNo}`;
            const error = errorByRow.get(rowNo);

            if (!error) {
                successCount++;
                return `<tr style="background:#f0fdf4"><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0"><span style="background:#dcfce7;color:#15803d;padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;font-size:0.7rem">SUCCESS</span></td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0"><strong>${esc(fullName)}</strong><br><span style="font-size:0.75rem;color:#64748b">${esc(row.email || '')}</span></td></tr>`;
            }

            if (/exist|duplicate|already/i.test(error)) {
                skippedCount++;
                return `<tr style="background:#fff7ed"><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0"><span style="background:#fed7aa;color:#9a3412;padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;font-size:0.7rem">SKIPPED</span></td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0"><strong>${esc(fullName)}</strong><br><span style="font-size:0.75rem;color:#c2410c">${esc(error)}</span></td></tr>`;
            }

            failedCount++;
            return `<tr style="background:#fef2f2"><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0"><span style="background:#fee2e2;color:#b91c1c;padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;font-size:0.7rem">FAILED</span></td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0"><strong>${esc(fullName)}</strong><br><span style="font-size:0.75rem;color:#dc2626">${esc(error)}</span></td></tr>`;
        }).join('');

        summary.innerHTML = [
            `<div style="background:#dcfce7;color:#15803d;padding:0.5rem 1rem;border-radius:8px;font-weight:600"><i class="fas fa-check-circle"></i> ${successCount} created</div>`,
            skippedCount > 0 ? `<div style="background:#ffedd5;color:#9a3412;padding:0.5rem 1rem;border-radius:8px;font-weight:600"><i class="fas fa-exclamation-triangle"></i> ${skippedCount} skipped</div>` : '',
            failedCount > 0 ? `<div style="background:#fee2e2;color:#b91c1c;padding:0.5rem 1rem;border-radius:8px;font-weight:600"><i class="fas fa-times-circle"></i> ${failedCount} failed</div>` : '',
            `<div style="background:#f1f5f9;color:#475569;padding:0.5rem 1rem;border-radius:8px;font-weight:600"><i class="fas fa-list"></i> ${rows.length} total</div>`
        ].filter(Boolean).join('');

        // Backend created count is authoritative; use it as a note when mismatch happens.
        if (createdCount !== successCount) {
            summary.innerHTML += `<div style="background:#eff6ff;color:#1d4ed8;padding:0.5rem 1rem;border-radius:8px;font-weight:600"><i class="fas fa-info-circle"></i> Backend created: ${createdCount}</div>`;
        }

        tbody.innerHTML = tableHtml;
        overlay.classList.add('open');
    }

    function parseCsvRows(text) {
        const lines = String(text || '').split(/\r?\n/);
        const errors = [];
        let headerLine = '';
        let startIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const raw = String(lines[i] || '').trim();
            if (!raw || raw.charAt(0) === '#') continue;
            headerLine = lines[i];
            startIndex = i + 1;
            break;
        }

        if (!headerLine) {
            return { rows: [], errors: ['CSV file appears empty.'], unmatchedInstitutionCodes: [] };
        }

        const headers = splitCsvLine(headerLine).map(h => String(h || '').trim().toLowerCase().replace(/\s+/g, '_'));
        const required = ['first_name', 'last_name', 'email', 'username', 'institution_code'];
        const missing = required.filter(key => !headers.includes(key));
        if (missing.length) {
            errors.push(`Missing required columns: ${missing.join(', ')}`);
            return { rows: [], errors, unmatchedInstitutionCodes: [] };
        }

        const rows = [];
        const unmatched = new Set();

        for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex++) {
            const line = String(lines[lineIndex] || '');
            const trimmed = line.trim();
            if (!trimmed || trimmed.charAt(0) === '#') continue;

            const values = splitCsvLine(line);
            const rawRow = {};
            headers.forEach((header, idx) => {
                rawRow[header] = String(values[idx] ?? '').trim();
            });

            if (!rawRow.email || !rawRow.username) {
                errors.push(`Line ${lineIndex + 1}: username and email are required`);
                continue;
            }

            const mapped = mapImportRow(rawRow, unmatched);
            rows.push(mapped);
        }

        if (!rows.length && !errors.length) {
            errors.push('No data rows found in CSV.');
        }

        return { rows, errors, unmatchedInstitutionCodes: Array.from(unmatched) };
    }

    function mapImportRow(raw, unmatchedSet) {
        const institutionCode = String(raw.institution_code || '').trim();
        const mapped = {
            first_name: raw.first_name || '',
            last_name: raw.last_name || '',
            email: raw.email || '',
            username: raw.username || '',
            is_active: String(raw.is_active || '').trim() === '0' ? 0 : 1,
        };

        const matchedInstitution = S.institutions.find(i => {
            const code = String(i.institution_code || i.code || '').trim().toLowerCase();
            return code && code === institutionCode.toLowerCase();
        });

        if (matchedInstitution && matchedInstitution.institution_id) {
            mapped.institution_id = matchedInstitution.institution_id;
        } else {
            // Fallback for backend resolver (by institution_name)
            mapped.institution_name = institutionCode;
            if (institutionCode) unmatchedSet.add(institutionCode);
        }

        return mapped;
    }

    function splitCsvLine(line) {
        const cells = [];
        let current = '';
        let quoted = false;

        for (let idx = 0; idx < line.length; idx++) {
            const ch = line.charAt(idx);
            const next = line.charAt(idx + 1);

            if (ch === '"') {
                if (quoted && next === '"') {
                    current += '"';
                    idx++;
                } else {
                    quoted = !quoted;
                }
                continue;
            }

            if (ch === ',' && !quoted) {
                cells.push(current);
                current = '';
                continue;
            }

            current += ch;
        }

        cells.push(current);
        return cells;
    }

    // ─── Expose to global scope ────────────────────────────────────────────────
    // Exports are assigned at declaration points above (window.userEdit, window.userDelete, window.userGoPage).

})();
