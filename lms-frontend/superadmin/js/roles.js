/* ============================================
   Roles Management Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    // ─── State ────────────────────────────────────────────────────────────────
    const S = {
        roles: [],
        permissions: [],
        rolePermissions: {}, // Map of role_id -> [permission_ids]
        total: 0,
        page: 1,
        limit: 20,
        search: '',
        filter: '',
        selectedUuids: new Set(),
        editingUuid: null,
        editingPermissionId: null, // Currently editing permission ID
        permissionsRoleId: null,
        searchTimer: null,
        importRows: [],
    };

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'roles') {
            initRolesPage();
        }
    });

    function initRolesPage() {
        S.page = 1;
        S.search = '';
        S.filter = '';
        S.selectedUuids = new Set();
        S.editingUuid = null;
        S.rolePermissions = {};

        setupEventListeners();
        loadPermissions();
        loadRoles().then(() => {
            renderStats();
            renderTable();
        });
    }

    // ─── Tiny helpers ─────────────────────────────────────────────────────────
    function q(sel, ctx) { return (ctx || document).querySelector(sel); }
    function on(id, ev, fn) { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); }
    function esc(s) { return typeof escHtml === 'function' ? escHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function setEl(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

    function toast(msg, type) {
        if (typeof window.showToast === 'function') window.showToast(msg, type);
        else console.log(msg);
    }

    function confirm_(title, msg, onConfirm) {
        if (typeof window.showModal === 'function') window.showModal(title, msg, onConfirm);
        else { if (confirm(`${title}\n${msg}`)) onConfirm(); }
    }

    // ─── Load Permissions ─────────────────────────────────────────────────────
    async function loadPermissions() {
        try {
            const res = await API.get(API_ENDPOINTS.PERMISSIONS + '?limit=1000');
            if (res && res.data) {
                S.permissions = Array.isArray(res.data) ? res.data : [];
            }
        } catch (err) {
            console.error('Error loading permissions:', err);
            S.permissions = [];
        }
    }

    // ─── Load All Roles (for validation, no pagination) ────────────────────────
    async function loadAllRoles() {
        try {
            const res = await API.get(API_ENDPOINTS.ROLES, { limit: 1000, page: 1 });
            if (res && res.data) {
                return Array.isArray(res.data) ? res.data : [];
            }
        } catch (err) {
            console.error('Error loading all roles:', err);
        }
        return [];
    }

    // ─── Load Roles ───────────────────────────────────────────────────────────
    async function loadRoles() {
        const params = { page: S.page, limit: S.limit };
        if (S.search) params.search = S.search;
        if (S.filter === 'has_users') params.has_users = 1;
        if (S.filter === 'no_users') params.has_users = 0;

        try {
            const res = await API.get(API_ENDPOINTS.ROLES, params);
            if (res && res.data) {
                S.roles = Array.isArray(res.data) ? res.data : [];
                if (res.pagination) {
                    renderPagination(res.pagination);
                }
                S.total = res.pagination?.total || S.roles.length;
            }
            renderTable();
        } catch (err) {
            console.error('Error loading roles:', err);
            showTableError('Failed to load roles');
        }
    }

    function showTableError(msg) {
        const tbody = document.getElementById('rolesTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#ef4444">${esc(msg)}</td></tr>`;
        }
    }

    // ─── Render Stats ─────────────────────────────────────────────────────────
    function renderStats() {
        const totalRoles = S.total;
        const totalPermissions = S.permissions.length;
        const assignedUsers = S.roles.reduce((sum, r) => sum + (parseInt(r.user_count || 0)), 0);

        setEl('totalRoles', totalRoles);
        setEl('totalPermissions', totalPermissions);
        setEl('assignedUsers', assignedUsers);
        setEl('rolesCountLabel', `${S.roles.length} of ${S.total} roles`);
    }

    // ─── Render Table ─────────────────────────────────────────────────────────
    function renderTable() {
        const tbody = document.getElementById('rolesTableBody');
        if (!tbody) return;

        if (!S.roles.length) {
            tbody.innerHTML = '<tr><td colspan="5"><div class="roles-empty"><i class="fas fa-inbox"></i><h4>No roles found</h4><p>Create your first role to get started</p></div></td></tr>';
            return;
        }

        tbody.innerHTML = S.roles.map(r => {
            const isSelected = S.selectedUuids.has(r.role_id);
            const permCount = (r.permission_count || 0);
            const userCount = parseInt(r.user_count || 0);

            return `
                <tr>
                    <td style="width:40px;text-align:center"><input type="checkbox" class="role-row-cb" data-role-id="${esc(r.role_id)}" ${isSelected ? 'checked' : ''} /></td>
                    <td>
                        <div class="role-cell">
                            <div class="role-icon"><i class="fas fa-shield-alt"></i></div>
                            <div>
                                <strong>${esc(r.role_name || '')}</strong>
                                ${r.description ? `<br><span style="font-size:0.75rem;color:var(--text-secondary,#64748b)">${esc(r.description)}</span>` : ''}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span style="background:#dcfce7;color:#15803d;padding:0.25rem 0.625rem;border-radius:999px;font-size:0.75rem;font-weight:600">
                            ${userCount}
                        </span>
                    </td>
                    <td>
                        <span style="font-size:0.75rem;font-weight:600;color:var(--text-secondary,#64748b)">
                            ${permCount} permission${permCount !== 1 ? 's' : ''}
                        </span>
                    </td>
                    <td>
                        <div class="role-actions">
                            <button class="btn-permissions" onclick="roleEditPermissions(${r.role_id}, '${esc(r.role_name)}')" title="Edit Permissions"><i class="fas fa-key"></i></button>
                            <button class="btn-edit" onclick="roleEdit(${r.role_id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="roleDelete(${r.role_id}, '${esc(r.role_name)}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach checkbox listeners
        document.querySelectorAll('.role-row-cb').forEach(cb => {
            cb.addEventListener('change', function () {
                const roleId = this.getAttribute('data-role-id');
                if (this.checked) {
                    S.selectedUuids.add(roleId);
                } else {
                    S.selectedUuids.delete(roleId);
                }
                updateBulkActions();
            });
        });
    }

    // ─── Pagination ───────────────────────────────────────────────────────────
    function renderPagination(pagination) {
        const wrap = document.getElementById('rolesPagination');
        const infoEl = document.getElementById('rolesPaginationInfo');
        const ctrlEl = document.getElementById('rolesPaginationControls');
        if (!wrap) return;

        if (!pagination || pagination.total_pages <= 1) {
            wrap.style.display = 'none';
            return;
        }
        wrap.style.display = 'flex';

        const { current_page, total_pages, total, per_page } = pagination;
        const from = (current_page - 1) * per_page + 1;
        const to = Math.min(current_page * per_page, total);
        if (infoEl) infoEl.textContent = `Showing ${from}-${to} of ${total}`;

        if (!ctrlEl) return;
        let btns = '';
        btns += `<button ${current_page === 1 ? 'disabled' : ''} onclick="roleGoPage(${current_page - 1})"><i class="fas fa-chevron-left"></i></button>`;
        for (let p = 1; p <= total_pages; p++) {
            if (p === 1 || p === total_pages || (p >= current_page - 2 && p <= current_page + 2)) {
                btns += `<button onclick="roleGoPage(${p})" class="${current_page === p ? 'active' : ''}">${p}</button>`;
            } else if (p === 2 || p === total_pages - 1) {
                btns += `<button disabled>…</button>`;
            }
        }
        btns += `<button ${current_page === total_pages ? 'disabled' : ''} onclick="roleGoPage(${current_page + 1})"><i class="fas fa-chevron-right"></i></button>`;
        ctrlEl.innerHTML = btns;
    }

    window.roleGoPage = function (p) {
        S.page = p;
        loadRoles().then(() => renderStats());
    };

    // ─── Bulk Actions ─────────────────────────────────────────────────────────
    function updateBulkActions() {
        const bar = document.getElementById('bulkActions');
        if (!bar) return;
        const count = S.selectedUuids.size;
        setEl('selectedCount', count);
        bar.classList.toggle('active', count > 0);
        const sa = document.getElementById('selectAll');
        if (sa) sa.checked = count === S.roles.length && S.roles.length > 0;
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────
    function setupEventListeners() {
        // Search with debounce
        const searchInput = document.getElementById('roleSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                clearTimeout(S.searchTimer);
                S.searchTimer = setTimeout(() => {
                    S.search = this.value.trim();
                    S.page = 1;
                    loadRoles().then(() => renderStats());
                }, 300);
            });
        }

        // Filter
        on('filterRoles', 'change', () => {
            S.filter = document.getElementById('filterRoles').value;
            S.page = 1;
            loadRoles().then(() => renderStats());
        });

        // Add role
        on('addRoleBtn', 'click', () => openRoleModal(null));

        // Export CSV
        on('exportRolesBtn', 'click', exportRoles);

        // Import CSV
        on('importRolesBtn', 'click', openImportModal);
        on('downloadRoleTemplate', 'click', downloadRoleTemplate);
        on('roleImportDropZone', 'click', () => {
            document.getElementById('roleImportFileInput').click();
        });
        on('roleImportFileInput', 'change', e => handleImportFile(e.target.files[0]));
        on('roleImportConfirmBtn', 'click', confirmImport);
        on('roleImportCancelBtn', 'click', closeImportModal);
        on('roleImportModalClose', 'click', closeImportModal);
        on('roleImportResultsClose', 'click', closeImportResults);
        on('roleImportResultsDoneBtn', 'click', closeImportResults);
        on('roleImportResultsOverlay', 'click', function (e) {
            if (e.target === this) closeImportResults();
        });
        on('roleImportModalOverlay', 'click', function (e) {
            if (e.target === this) closeImportModal();
        });

        // Drag-and-drop on drop zone
        (function () {
            const zone = document.getElementById('roleImportDropZone');
            if (!zone) return;
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
                zone.addEventListener(evt, e => e.preventDefault());
            });
            zone.addEventListener('dragover', () => zone.classList.add('dragover'));
            zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
            zone.addEventListener('drop', (e) => {
                zone.classList.remove('dragover');
                handleImportFile(e.dataTransfer.files[0]);
            });
        })();

        // Select all checkbox
        on('selectAll', 'change', function () {
            if (this.checked) {
                S.roles.forEach(r => S.selectedUuids.add(r.role_id));
            } else {
                S.selectedUuids.clear();
            }
            renderTable();
            updateBulkActions();
        });

        // Bulk delete
        on('bulkDeleteBtn', 'click', bulkDelete);
        on('bulkClearRolesBtn', 'click', () => {
            S.selectedUuids.clear();
            updateBulkActions();
            renderTable();
        });

        // Role modal
        on('roleModalClose', 'click', closeRoleModal);
        on('roleModalCancel', 'click', closeRoleModal);
        on('roleModalSave', 'click', saveRole);
        on('roleModalOverlay', 'click', function (e) {
            if (e.target === this) closeRoleModal();
        });

        // Permissions modal
        on('permissionsModalClose', 'click', closePermissionsModal);
        on('permissionsModalCancel', 'click', closePermissionsModal);
        on('permissionsModalSave', 'click', savePermissions);
        on('permissionsModalOverlay', 'click', function (e) {
            if (e.target === this) closePermissionsModal();
        });

        // Permission search
        on('permissionSearch', 'input', function () {
            const query = this.value.toLowerCase();
            document.querySelectorAll('.permission-item').forEach(item => {
                const name = item.querySelector('.permission-item-name').textContent.toLowerCase();
                const desc = item.querySelector('.permission-item-desc').textContent.toLowerCase();
                item.style.display = (name.includes(query) || desc.includes(query)) ? '' : 'none';
            });
        });

        // Permission form modal
        on('addPermissionBtn', 'click', () => openPermissionModal());
        on('permissionFormModalClose', 'click', closePermissionModal);
        on('permissionFormModalCancel', 'click', closePermissionModal);
        on('permissionFormModalDelete', 'click', deletePermission);
        on('permissionFormModalSave', 'click', savePermission);
        on('permissionFormModalOverlay', 'click', function (e) {
            if (e.target === this) closePermissionModal();
        });

        // All permissions modal
        on('managePermissionsBtn', 'click', openAllPermissionsModal);
        on('allPermissionsModalClose', 'click', closeAllPermissionsModal);
        on('allPermissionsCloseBtn', 'click', closeAllPermissionsModal);
        on('allPermissionsNewBtn', 'click', () => {
            closeAllPermissionsModal();
            openPermissionModal();
        });
        on('allPermissionsModalOverlay', 'click', function (e) {
            if (e.target === this) closeAllPermissionsModal();
        });
    }

    // ─── Role Modal (Add / Edit) ──────────────────────────────────────────────
    function openRoleModal(roleId) {
        S.editingUuid = roleId || null;
        const overlay = document.getElementById('roleModalOverlay');
        const title = document.getElementById('roleModalTitle');
        const errEl = document.getElementById('roleFormError');
        if (!overlay) return;

        // Reset form
        const form = document.getElementById('roleForm');
        if (form) form.reset();
        document.getElementById('roleUuid').value = '';
        if (errEl) errEl.style.display = 'none';

        if (!roleId) {
            if (title) title.textContent = 'Add New Role';
            overlay.classList.add('open');
            return;
        }

        // Edit — fetch role data
        if (title) title.textContent = 'Edit Role';
        overlay.classList.add('open');
        const saveBtn = document.getElementById('roleModalSave');
        if (saveBtn) saveBtn.disabled = true;

        API.get(API_ENDPOINTS.ROLES + '/' + roleId).then(res => {
            if (res && res.data) {
                const role = res.data;
                document.getElementById('roleUuid').value = role.role_id || '';
                document.getElementById('fieldRoleName').value = role.role_name || '';
                document.getElementById('fieldRoleDescription').value = role.description || '';
            }
            if (saveBtn) saveBtn.disabled = false;
        }).catch(err => {
            console.error('Error loading role:', err);
            if (errEl) {
                errEl.textContent = 'Failed to load role';
                errEl.style.display = 'block';
            }
            if (saveBtn) saveBtn.disabled = false;
        });
    }

    function closeRoleModal() {
        const overlay = document.getElementById('roleModalOverlay');
        if (overlay) overlay.classList.remove('open');
        S.editingUuid = null;
    }

    async function saveRole() {
        const saveBtn = document.getElementById('roleModalSave');
        const errEl = document.getElementById('roleFormError');
        if (errEl) errEl.style.display = 'none';

        const roleId = document.getElementById('roleUuid').value.trim();
        const payload = {
            role_name: (document.getElementById('fieldRoleName').value || '').trim(),
            description: (document.getElementById('fieldRoleDescription').value || '').trim(),
        };

        if (!payload.role_name) {
            if (errEl) {
                errEl.textContent = 'Role name is required';
                errEl.style.display = 'block';
            }
            return;
        }

        // Load all roles to check for duplicates (not just current page)
        const allRoles = await loadAllRoles();

        // Check for duplicate role name
        const nameExists = allRoles.some(r => {
            // If editing, allow same name for current role; reject if another role has it
            if (roleId && r.role_id === parseInt(roleId)) return false;
            return r.role_name.toLowerCase() === payload.role_name.toLowerCase();
        });

        if (nameExists) {
            if (errEl) {
                errEl.textContent = `Role name "${payload.role_name}" already exists`;
                errEl.style.display = 'block';
            }
            return;
        }

        if (saveBtn) saveBtn.disabled = true;

        try {
            let res;
            if (roleId) {
                res = await API.put(API_ENDPOINTS.ROLES + '/' + roleId, payload);
            } else {
                res = await API.post(API_ENDPOINTS.ROLES, payload);
            }

            if (res) {
                toast(roleId ? 'Role updated successfully' : 'Role created successfully', 'success');
                closeRoleModal();
                S.page = 1;
                await loadRoles();
                renderStats();
            }
        } catch (err) {
            console.error('Error saving role:', err);
            if (errEl) {
                errEl.textContent = err.message || 'Failed to save role';
                errEl.style.display = 'block';
            }
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    // ─── Edit & Delete ───────────────────────────────────────────────────────
    window.roleEdit = function (roleId) {
        openRoleModal(roleId);
    };

    window.roleDelete = function (roleId, name) {
        confirm_(
            'Delete Role',
            `Delete "${name}"? This cannot be undone.`,
            async () => {
                try {
                    await API.delete(API_ENDPOINTS.ROLES + '/' + roleId);
                    toast('Role deleted successfully', 'success');
                    S.selectedUuids.delete(roleId);
                    await loadRoles();
                    renderStats();
                    updateBulkActions();
                } catch (err) {
                    console.error('Error deleting role:', err);
                    toast('Failed to delete role', 'error');
                }
            }
        );
    };

    // ─── Bulk Delete ──────────────────────────────────────────────────────────
    async function bulkDelete() {
        if (!S.selectedUuids.size) return;
        const roleIds = [...S.selectedUuids];
        confirm_(
            'Delete Roles',
            `Permanently delete ${roleIds.length} role(s)? This cannot be undone.`,
            async () => {
                let success = 0;
                for (const roleId of roleIds) {
                    try {
                        await API.delete(API_ENDPOINTS.ROLES + '/' + roleId);
                        success++;
                    } catch (err) {
                        console.error('Error deleting role:', err);
                    }
                }
                toast(`${success}/${roleIds.length} role(s) deleted`, success === roleIds.length ? 'success' : 'warning');
                S.selectedUuids.clear();
                await loadRoles();
                renderStats();
                updateBulkActions();
            }
        );
    }

    // ─── Permissions Modal ────────────────────────────────────────────────────
    window.roleEditPermissions = function (roleId, roleName) {
        S.permissionsRoleId = roleId;
        const overlay = document.getElementById('permissionsModalOverlay');
        const title = document.getElementById('permissionsModalTitle');
        if (!overlay) return;

        if (title) title.textContent = `${roleName} - Assign Permissions`;
        
        // Clear search
        const searchEl = document.getElementById('permissionSearch');
        if (searchEl) searchEl.value = '';

        // Load assigned permissions for this role
        loadRolePermissions(roleId).then(() => {
            renderPermissionsGrid(roleId);
            overlay.classList.add('open');
        });
    };

    function closePermissionsModal() {
        const overlay = document.getElementById('permissionsModalOverlay');
        if (overlay) overlay.classList.remove('open');
        S.permissionsRoleId = null;
    }

    async function loadRolePermissions(roleId) {
        try {
            const res = await API.get(`${API_ENDPOINTS.ROLES}/${roleId}/permissions`);
            if (res && res.data) {
                const assignedPerms = Array.isArray(res.data) ? res.data : [];
                S.rolePermissions[roleId] = assignedPerms.map(p => p.permission_id);
            }
        } catch (err) {
            console.error('Error loading role permissions:', err);
            S.rolePermissions[roleId] = [];
        }
    }

    function renderPermissionsGrid(roleId) {
        const grid = document.getElementById('permissionsGrid');
        const empty = document.getElementById('permissionsEmpty');
        if (!grid) return;

        if (!S.permissions.length) {
            grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }

        if (empty) empty.style.display = 'none';

        // Get already assigned permissions for this role
        const assignedPermIds = S.rolePermissions[roleId] || [];

        grid.innerHTML = S.permissions.map(perm => {
            const isChecked = assignedPermIds.includes(perm.permission_id);
            return `
                <div class="permission-item" data-perm-id="${perm.permission_id}">
                    <input type="checkbox" data-perm-id="${perm.permission_id}" ${isChecked ? 'checked' : ''} onclick="this.parentElement.querySelector('input[type=checkbox]').checked = !this.parentElement.querySelector('input[type=checkbox]').checked" />
                    <div class="permission-item-content" onclick="this.parentElement.querySelector('input[type=checkbox]').click()">
                        <div class="permission-item-name">${esc(perm.permission_name || '')}</div>
                        <div class="permission-item-desc">${esc(perm.description || '')}</div>
                    </div>
                    <button type="button" class="btn-icon btn-sm" title="Edit permission" onclick="event.stopPropagation(); openPermissionModal(${perm.permission_id})" style="padding:4px 8px;font-size:0.875rem">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    async function savePermissions() {
        if (!S.permissionsRoleId) return;

        const saveBtn = document.getElementById('permissionsModalSave');
        if (saveBtn) saveBtn.disabled = true;

        try {
            // Collect selected permissions
            const selectedPermIds = [];
            document.querySelectorAll('#permissionsGrid input[type="checkbox"]:checked').forEach(cb => {
                selectedPermIds.push(parseInt(cb.getAttribute('data-perm-id')));
            });

            // Get existing permissions from stored data
            const existingPermIds = S.rolePermissions[S.permissionsRoleId] || [];

            // Add new permissions
            for (const permId of selectedPermIds) {
                if (!existingPermIds.includes(permId)) {
                    await API.post(`${API_ENDPOINTS.ROLES}/${S.permissionsRoleId}/permissions`, { permission_id: permId });
                }
            }

            // Remove unselected permissions
            for (const permId of existingPermIds) {
                if (!selectedPermIds.includes(permId)) {
                    await API.delete(`${API_ENDPOINTS.ROLES}/${S.permissionsRoleId}/permissions/${permId}`);
                }
            }

            toast('Permissions updated successfully', 'success');
            closePermissionsModal();
            await loadRoles();
            renderStats();
        } catch (err) {
            console.error('Error saving permissions:', err);
            toast('Failed to save permissions', 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    // ─── Export CSV ────────────────────────────────────────────────────────────
    function exportRoles() {
        if (!S.roles.length) {
            toast('No roles to export', 'warning');
            return;
        }
        const rows = [['Role Name', 'Description', 'Users', 'Permissions']];
        S.roles.forEach(r => {
            rows.push([
                r.role_name || '',
                r.description || '',
                r.user_count || '0',
                r.permission_count || '0',
            ]);
        });
        const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'roles.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadRoleTemplate() {
        const rows = [
            ['role_name', 'description'],
            ['Administrator', 'Full system access and administration'],
            ['Teacher', 'Manage classes, assignments, and grades'],
            ['Student', 'Access courses and submit assignments'],
        ];
        const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'roles_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
     

    // ─── Import CSV ───────────────────────────────────────────────────────────
    function openImportModal() {
        const overlay = document.getElementById('roleImportModalOverlay');
        if (overlay) {
            overlay.classList.add('open');
            document.getElementById('roleImportFileInput').value = '';
            document.getElementById('roleImportPreview').style.display = 'none';
            document.getElementById('roleImportConfirmBtn').disabled = true;
        }
        S.importRows = [];
    }

    function closeImportModal() {
        const overlay = document.getElementById('roleImportModalOverlay');
        if (overlay) overlay.classList.remove('open');
        S.importRows = [];
    }

    function closeImportResults() {
        const overlay = document.getElementById('roleImportResultsOverlay');
        if (overlay) overlay.classList.remove('open');
        loadRoles().then(() => renderStats());
    }

    function handleImportFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const rows = parseCsv(text);

                if (rows.length < 2) {
                    toast('CSV must have header + at least 1 data row', 'error');
                    return;
                }

                const headers = rows[0].map(h => h.toLowerCase().trim());
                const nameIdx = headers.indexOf('role_name');
                const descIdx = headers.indexOf('description');

                if (nameIdx === -1) {
                    toast('CSV must have "role_name" column', 'error');
                    return;
                }

                S.importRows = rows.slice(1).map(row => ({
                    role_name: row[nameIdx] || '',
                    description: descIdx !== -1 ? row[descIdx] : '',
                })).filter(r => r.role_name.trim());

                if (!S.importRows.length) {
                    toast('No valid roles in CSV', 'error');
                    return;
                }

                const preview = document.getElementById('roleImportPreview');
                preview.innerHTML = `<strong>${S.importRows.length} role(s) ready to import:</strong><br>${S.importRows.map(r => `• ${esc(r.role_name)}`).join('<br>')}`;
                preview.style.display = 'block';
                document.getElementById('roleImportConfirmBtn').disabled = false;
            } catch (err) {
                console.error('Error parsing CSV:', err);
                toast('Failed to parse CSV file', 'error');
            }
        };
        reader.readAsText(file);
    }

    async function confirmImport() {
        if (!S.importRows.length) return;

        const confirmBtn = document.getElementById('roleImportConfirmBtn');
        if (confirmBtn) confirmBtn.disabled = true;

        // Load all existing roles to check for duplicates (not just current page)
        const allExistingRoles = await loadAllRoles();

        const results = {
            success: [],
            failed: [],
        };

        // Track imported names in this batch to detect duplicates within the CSV
        const importedNames = new Set();

        for (const roleData of S.importRows) {
            try {
                const roleName = (roleData.role_name || '').trim();
                
                // Check if role already exists in database
                const existsInDb = allExistingRoles.some(r => r.role_name.toLowerCase() === roleName.toLowerCase());
                if (existsInDb) {
                    results.failed.push({ name: roleName, error: 'Role already exists' });
                    continue;
                }

                // Check if role was already imported in this batch
                if (importedNames.has(roleName.toLowerCase())) {
                    results.failed.push({ name: roleName, error: 'Duplicate in import file' });
                    continue;
                }

                const res = await API.post(API_ENDPOINTS.ROLES, roleData);
                results.success.push(roleData.role_name);
                importedNames.add(roleName.toLowerCase());
            } catch (err) {
                results.failed.push({ name: roleData.role_name, error: err.message || 'Unknown error' });
            }
        }

        showImportResults(results);
        closeImportModal();
    }

    function showImportResults(results) {
        const overlay = document.getElementById('roleImportResultsOverlay');
        const summary = document.getElementById('roleImportResultsSummary');
        const tbody = document.getElementById('roleImportResultsBody');

        if (!overlay) return;

        // Summary badges
        let summaryHtml = '';
        if (results.success.length > 0) {
            summaryHtml += `<div style="background:#dcfce7;color:#15803d;padding:0.5rem 1rem;border-radius:8px;font-weight:600">
                <i class="fas fa-check-circle"></i> ${results.success.length} imported
            </div>`;
        }
        if (results.failed.length > 0) {
            summaryHtml += `<div style="background:#fee2e2;color:#b91c1c;padding:0.5rem 1rem;border-radius:8px;font-weight:600">
                <i class="fas fa-exclamation-circle"></i> ${results.failed.length} failed
            </div>`;
        }
        if (summary) summary.innerHTML = summaryHtml;

        // Results table
        let tableHtml = '';
        results.success.forEach(name => {
            tableHtml += `<tr style="background:#f0fdf4"><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0"><span style="background:#dcfce7;color:#15803d;padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;font-size:0.7rem">✓ SUCCESS</span></td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">${esc(name)}</td></tr>`;
        });
        results.failed.forEach(item => {
            tableHtml += `<tr style="background:#fef2f2"><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0"><span style="background:#fee2e2;color:#b91c1c;padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;font-size:0.7rem">✗ FAILED</span></td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0"><strong>${esc(item.name)}</strong><br><span style="font-size:0.75rem;color:#dc2626">${esc(item.error)}</span></td></tr>`;
        });
        if (tbody) tbody.innerHTML = tableHtml;

        overlay.classList.add('open');
    }

    // ─── Permission Modal ────────────────────────────────────────────────────
    function openPermissionModal(permissionId = null) {
        const overlay = document.getElementById('permissionFormModalOverlay');
        const title = document.getElementById('permissionFormModalTitle');
        const nameField = document.getElementById('fieldPermissionName');
        const descField = document.getElementById('fieldPermissionDescription');
        const idField = document.getElementById('permissionIdField');
        const saveBtn = document.getElementById('permissionFormModalSave');
        const deleteBtn = document.getElementById('permissionFormModalDelete');

        if (!overlay) return;

        if (permissionId) {
            // Edit mode
            const perm = S.permissions.find(p => p.permission_id === permissionId);
            if (!perm) return;

            S.editingPermissionId = permissionId;
            title.textContent = 'Edit Permission';
            nameField.value = perm.permission_name || '';
            descField.value = perm.description || '';
            idField.value = permissionId;
            saveBtn.textContent = 'Update Permission';
            saveBtn.setAttribute('data-action', 'edit');
            if (deleteBtn) {
                deleteBtn.style.display = 'block';
            }
        } else {
            // Create mode
            S.editingPermissionId = null;
            title.textContent = 'Add New Permission';
            nameField.value = '';
            descField.value = '';
            idField.value = '';
            saveBtn.textContent = 'Save Permission';
            saveBtn.setAttribute('data-action', 'create');
            if (deleteBtn) {
                deleteBtn.style.display = 'none';
            }
        }

        overlay.classList.add('open');
        nameField.focus();
    }

    function closePermissionModal() {
        const overlay = document.getElementById('permissionFormModalOverlay');
        if (overlay) overlay.classList.remove('open');
        
        document.getElementById('fieldPermissionName').value = '';
        document.getElementById('fieldPermissionDescription').value = '';
        document.getElementById('permissionIdField').value = '';
        S.editingPermissionId = null;
    }

    async function savePermission() {
        const name = (document.getElementById('fieldPermissionName')?.value || '').trim();
        const description = (document.getElementById('fieldPermissionDescription')?.value || '').trim();
        const permId = (document.getElementById('permissionIdField')?.value || '').trim();
        const action = document.getElementById('permissionFormModalSave')?.getAttribute('data-action') || 'create';

        if (!name) {
            toast('Permission name is required', 'warning');
            return;
        }

        const saveBtn = document.getElementById('permissionFormModalSave');
        if (saveBtn) saveBtn.disabled = true;

        try {
            let response;
            const payload = {
                permission_name: name,
                description: description,
            };

            if (action === 'edit' && permId) {
                // PUT request for update
                response = await API.put(`${API_ENDPOINTS.PERMISSIONS}/${permId}`, payload);
                toast('Permission updated successfully', 'success');
            } else {
                // POST request for create
                response = await API.post(API_ENDPOINTS.PERMISSIONS, payload);
                toast('Permission created successfully', 'success');
            }

            if (response && response.data) {
                closePermissionModal();
                await loadPermissions();
                renderPermissionsGrid();
            }
        } catch (err) {
            console.error('Error saving permission:', err);
            toast(err.message || 'Failed to save permission', 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    async function deletePermission() {
        const permId = (document.getElementById('permissionIdField')?.value || '').trim();
        if (!permId) return;

        confirm_(
            'Delete Permission',
            'Are you sure you want to delete this permission? This action cannot be undone.',
            async () => {
                try {
                    await API.delete(`${API_ENDPOINTS.PERMISSIONS}/${permId}`);
                    toast('Permission deleted successfully', 'success');
                    closePermissionModal();
                    await loadPermissions();
                    renderPermissionsGrid();
                } catch (err) {
                    console.error('Error deleting permission:', err);
                    toast(err.message || 'Failed to delete permission', 'error');
                }
            }
        );
    }

    function openAllPermissionsModal() {
        const overlay = document.getElementById('allPermissionsModalOverlay');
        const tbody = document.getElementById('allPermissionsTableBody');
        const empty = document.getElementById('allPermissionsEmpty');
        if (!overlay) return;

        if (!S.permissions.length) {
            tbody.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            tbody.innerHTML = S.permissions.map(perm => `
                <tr style="border-bottom:1px solid #e5e7eb;hover {background:#f9fafb}">
                    <td style="padding:0.75rem;font-weight:500">${esc(perm.permission_name || '')}</td>
                    <td style="padding:0.75rem;font-size:0.875rem;color:#6b7280">${esc(perm.description || '—')}</td>
                    <td style="padding:0.75rem;text-align:center">
                        <button type="button" class="btn-icon btn-sm" onclick="openPermissionModal(${perm.permission_id}); closeAllPermissionsModal()" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Set up search
        const searchField = document.getElementById('allPermSearchField');
        if (searchField) {
            searchField.value = '';
            searchField.onkeyup = function () {
                const query = this.value.toLowerCase();
                document.querySelectorAll('#allPermissionsTableBody tr').forEach(row => {
                    const name = row.cells[0]?.textContent.toLowerCase() || '';
                    const desc = row.cells[1]?.textContent.toLowerCase() || '';
                    row.style.display = (name.includes(query) || desc.includes(query)) ? '' : 'none';
                });
            };
        }

        overlay.classList.add('open');
    }

    function closeAllPermissionsModal() {
        const overlay = document.getElementById('allPermissionsModalOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    // ─── DOM / overlay helpers ────────────────────────────────────────────────
    function showEl(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
    function hideEl(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    function setElText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

    // ─── CSV utilities ────────────────────────────────────────────────────────
    function escapeHtml(s) {
        if (typeof s !== 'string') s = String(s ?? '');
        return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function parseCsv(text) {
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let insideQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                currentRow.push(currentField.trim());
                currentField = '';
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                if (currentField || currentRow.length > 0) {
                    currentRow.push(currentField.trim());
                    if (currentRow.some(f => f.length > 0)) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                }
                if (char === '\r' && nextChar === '\n') i++;
            } else {
                currentField += char;
            }
        }

        if (currentField || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.some(f => f.length > 0)) {
                rows.push(currentRow);
            }
        }

        return rows;
    }

    // ─── Expose functions to global scope for inline onclick handlers ──────────
    window.openPermissionModal = openPermissionModal;
    window.closePermissionModal = closePermissionModal;
    window.savePermission = savePermission;
    window.deletePermission = deletePermission;
    window.openAllPermissionsModal = openAllPermissionsModal;
    window.closeAllPermissionsModal = closeAllPermissionsModal;
    window.downloadRoleTemplate = downloadRoleTemplate;

})();
