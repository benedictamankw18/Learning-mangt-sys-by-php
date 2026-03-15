/* ============================================
   Users Management Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    const S = {
        users: [],
        roles: [],
        filtered: [],
        importRows: [],
        page: 1,
        pageSize: 20,
        search: '',
        role: '',
        status: '',
        editingUuid: null,
        activeUser: null,
        busy: false,
    };

    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'users') {
            initUsersPage();
        }
    });

    function initUsersPage() {
        bindEvents();
        loadRolesAndUsers();
    }

    function bindEvents() {
        on('usersSearchInput', 'input', function (e) {
            S.search = (e.target.value || '').trim().toLowerCase();
            S.page = 1;
            applyFilters();
        });

        on('usersRoleFilter', 'change', function (e) {
            S.role = e.target.value || '';
            S.page = 1;
            applyFilters();
        });

        on('usersStatusFilter', 'change', function (e) {
            S.status = e.target.value || '';
            S.page = 1;
            applyFilters();
        });

        on('refreshUsersBtn', 'click', loadRolesAndUsers);
        on('exportUsersCsvBtn', 'click', exportUsersCsv);
        on('exportUsersPdfBtn', 'click', exportUsersPdf);
        on('importUsersBtn', 'click', openImportModal);
        on('addUserBtn', 'click', function () { openUserFormModal(null); });

        on('userImportDropZone', 'click', function () {
            const input = document.getElementById('userImportFileInput');
            if (input) input.click();
        });
        on('userImportFileInput', 'change', function (e) {
            handleImportFile(e.target.files && e.target.files[0]);
        });
        on('userImportTemplateLink', 'click', function (e) {
            e.preventDefault();
            downloadImportTemplate();
        });
        on('cancelUserImportBtn', 'click', closeImportModal);
        on('closeUserImportModalBtn', 'click', closeImportModal);
        on('confirmUserImportBtn', 'click', confirmImport);
        on('userImportModal', 'click', function (e) {
            if (e.target && e.target.id === 'userImportModal') closeImportModal();
        });
        on('closeUserImportResultsBtn', 'click', closeImportResults);
        on('closeUserImportResultsDoneBtn', 'click', closeImportResults);
        on('userImportResultsModal', 'click', function (e) {
            if (e.target && e.target.id === 'userImportResultsModal') closeImportResults();
        });

        on('closeUserFormModalBtn', 'click', closeUserFormModal);
        on('cancelUserFormBtn', 'click', closeUserFormModal);
        on('saveUserBtn', 'click', saveUser);
        on('toggleUfPasswordBtn', 'click', function () {
            togglePasswordVisibility('ufPassword', 'toggleUfPasswordBtn');
        });
        on('userFormModal', 'click', function (e) {
            if (e.target && e.target.id === 'userFormModal') closeUserFormModal();
        });

        on('closeRoleModalBtn', 'click', closeRoleModal);
        on('cancelRoleAssignBtn', 'click', closeRoleModal);
        on('confirmRoleAssignBtn', 'click', assignRole);
        on('roleModal', 'click', function (e) {
            if (e.target && e.target.id === 'roleModal') closeRoleModal();
        });

        on('closeResetPasswordModalBtn', 'click', closeResetPasswordModal);
        on('cancelResetPasswordBtn', 'click', closeResetPasswordModal);
        on('confirmResetPasswordBtn', 'click', resetUserPassword);
        on('toggleResetPasswordBtn', 'click', function () {
            togglePasswordVisibility('resetPasswordInput', 'toggleResetPasswordBtn');
        });
        on('resetPasswordModal', 'click', function (e) {
            if (e.target && e.target.id === 'resetPasswordModal') closeResetPasswordModal();
        });

        on('closeActivityModalBtn', 'click', closeActivityModal);
        on('closeActivityDoneBtn', 'click', closeActivityModal);
        on('activityModal', 'click', function (e) {
            if (e.target && e.target.id === 'activityModal') closeActivityModal();
        });

        const tableBody = document.getElementById('usersTableBody');
        if (tableBody) {
            tableBody.addEventListener('click', onTableActionClick);
        }

        const dropZone = document.getElementById('userImportDropZone');
        if (dropZone) {
            ['dragenter', 'dragover'].forEach(function (eventName) {
                dropZone.addEventListener(eventName, function (e) {
                    e.preventDefault();
                    dropZone.classList.add('dragover');
                });
            });
            ['dragleave', 'drop'].forEach(function (eventName) {
                dropZone.addEventListener(eventName, function (e) {
                    e.preventDefault();
                    dropZone.classList.remove('dragover');
                });
            });
            dropZone.addEventListener('drop', function (e) {
                const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                handleImportFile(file);
            });
        }
    }

    async function loadRolesAndUsers() {
        if (S.busy) return;
        S.busy = true;

        try {
            await Promise.all([loadRoles(), loadUsers()]);
            applyFilters();
        } catch (err) {
            console.error('Load users page data error:', err);
            setEmptyState('Failed to load users. Please refresh and try again.');
            toast('Failed to load users', 'error');
        } finally {
            S.busy = false;
        }
    }

    async function loadRoles() {
        const res = await API.get(API_ENDPOINTS.ROLES, { limit: 200 });
        const list = extractList(res);
        S.roles = (Array.isArray(list) ? list : []).filter(function (role) {
            return !isSuperAdminRole(normalizeRoleName(role));
        });

        const options = ['<option value="">All Roles</option>']
            .concat(S.roles.map(function (role) {
                const roleName = normalizeRoleName(role);
                return '<option value="' + esc(roleName) + '">' + esc(titleCase(roleName)) + '</option>';
            }))
            .join('');

        const roleFilter = document.getElementById('usersRoleFilter');
        const roleSelect = document.getElementById('ufRole');
        const assignRoleSelect = document.getElementById('assignRoleSelect');

        if (roleFilter) roleFilter.innerHTML = options;

        if (roleSelect) {
            roleSelect.innerHTML = '<option value="">Select role</option>' + S.roles.map(function (role) {
                const roleId = role.role_id || role.id;
                const roleName = normalizeRoleName(role);
                return '<option value="' + esc(String(roleId || '')) + '">' + esc(titleCase(roleName)) + '</option>';
            }).join('');
        }

        if (assignRoleSelect) {
            assignRoleSelect.innerHTML = '<option value="">Select role</option>' + S.roles.map(function (role) {
                const roleId = role.role_id || role.id;
                const roleName = normalizeRoleName(role);
                return '<option value="' + esc(String(roleId || '')) + '">' + esc(titleCase(roleName)) + '</option>';
            }).join('');
        }
    }

    async function loadUsers() {
        const users = [];
        let page = 1;
        const limit = 100;
        let total = 0;

        while (true) {
            const res = await API.get(API_ENDPOINTS.USERS, { page: page, limit: limit });
            const rows = extractList(res);
            const pageRows = Array.isArray(rows) ? rows : [];
            const pagination = extractPagination(res);

            users.push.apply(users, pageRows);
            total = pagination.total || users.length;

            if (!pageRows.length || users.length >= total) break;
            page += 1;
            if (page > 50) break;
        }

        S.users = users;
    }

    function applyFilters() {
        S.filtered = S.users.filter(function (user) {
            const roles = normalizeRoles(user.roles);
            const status = Number(user.is_active) === 1 ? 'active' : 'inactive';
            const fullName = ((user.first_name || '') + ' ' + (user.last_name || '')).trim().toLowerCase();
            const haystack = [
                fullName,
                (user.email || '').toLowerCase(),
                (user.username || '').toLowerCase(),
            ].join(' ');

            if (S.search && haystack.indexOf(S.search) === -1) return false;
            if (S.role && !roles.includes(S.role)) return false;
            if (S.status && status !== S.status) return false;
            return true;
        });

        const totalPages = Math.max(1, Math.ceil(S.filtered.length / S.pageSize));
        if (S.page > totalPages) S.page = totalPages;

        renderStats();
        var countLabel = document.getElementById('usersCountLabel');
        if (countLabel) countLabel.textContent = S.filtered.length + ' of ' + S.users.length + ' users';
        renderUsersTable();
        renderPagination();
    }

    var AVATAR_COLORS = [
        'linear-gradient(135deg,#006a3f,#008c54)',
        'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        'linear-gradient(135deg,#7c3aed,#5b21b6)',
        'linear-gradient(135deg,#0891b2,#0369a1)',
        'linear-gradient(135deg,#d97706,#b45309)',
    ];

    function renderStats() {
        var total    = S.users.length;
        var active   = S.users.filter(function (u) { return Number(u.is_active) === 1; }).length;
        var inactive = total - active;
        var admins   = S.users.filter(function (u) {
            return normalizeRoles(u.roles).some(function (r) { return r === 'admin'; });
        }).length;
        function setStat(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
        setStat('statTotalUsers', total);
        setStat('statActiveUsers', active);
        setStat('statAdminUsers', admins);
        setStat('statInactiveUsers', inactive);
    }

    function renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!S.filtered.length) {
            setEmptyState('No users found for the selected filters.');
            return;
        }

        const start = (S.page - 1) * S.pageSize;
        const end = start + S.pageSize;
        const rows = S.filtered.slice(start, end);

        tbody.innerHTML = rows.map(function (user, idx) {
            const fullName = ((user.first_name || '') + ' ' + (user.last_name || '')).trim() || user.username || 'Unnamed User';
            const roles = normalizeRoles(user.roles);
            const firstRole = roles.length ? roles[0] : null;
            const roleBadge = firstRole
                ? '<span class="role-badge role-' + esc(firstRole) + '">' + esc(titleCase(firstRole)) + '</span>'
                : '<span class="role-badge role-badge-unassigned">Unassigned</span>';
            const initials = getInitials(user.first_name, user.last_name, user.username);
            const avatarColor = AVATAR_COLORS[(start + idx) % AVATAR_COLORS.length];
            const created = formatDate(user.created_at);
            const isActive = Number(user.is_active) === 1;
            const statusClass = isActive ? 'status-active' : 'status-inactive';
            const statusText = isActive ? 'Active' : 'Inactive';
            const toggleLabel = isActive ? 'Deactivate' : 'Activate';

            return '' +
                '<tr>' +
                    '<td>' +
                        '<div class="user-cell">' +
                            '<div class="user-avatar" style="background:' + avatarColor + '">' + esc(initials) + '</div>' +
                            '<div class="user-cell-details">' +
                                '<span class="user-cell-name">' + esc(fullName) + '</span>' +
                                '<a href="mailto:' + esc(user.email || '-') + '" class="user-cell-email">' + esc(user.email || '-') + '</a>' +
                            '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td>' + roleBadge + '</td>' +
                    '<td><code class="id-number">' + esc(user.username || '-') + '</code></td>' +
                    '<td>' + esc(created) + '</td>' +
                    '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>' +
                    '<td>' +
                        '<div class="user-actions">' +
                            actionBtn('edit', 'fa-edit', 'Edit User', user.uuid, 'btn-edit') +
                            actionBtn('assign-role', 'fa-user-shield', 'Assign Role', user.uuid, 'btn-role') +
                            actionBtn('toggle-status', isActive ? 'fa-user-slash' : 'fa-user-check', toggleLabel, user.uuid, 'btn-toggle') +
                            actionBtn('reset-password', 'fa-key', 'Reset Password', user.uuid, 'btn-pw') +
                            actionBtn('view-activity', 'fa-clock-rotate-left', 'View Activity', user.uuid, 'btn-activity') +
                        '</div>' +
                    '</td>' +
                '</tr>';
        }).join('');

        updatePaginationInfo();
    }

    function actionBtn(action, icon, title, uuid, cls) {
        return '<button type="button" class="' + (cls || 'btn-edit') + '" data-action="' + action + '" data-uuid="' + esc(uuid || '') + '" title="' + esc(title) + '">' +
            '<i class="fas ' + icon + '"></i>' +
        '</button>';
    }

    function renderPagination() {
        const container = document.getElementById('usersPaginationControls');
        if (!container) return;

    const totalPages = Math.max(1, Math.ceil(S.filtered.length / S.pageSize));
    const footer = document.getElementById('usersPagination');
    if (footer) footer.style.display = totalPages > 1 ? 'flex' : 'none';
        const buttons = [];

        buttons.push(pageBtn(S.page - 1, '<i class="fas fa-chevron-left"></i>', S.page === 1));

        const windowSize = 5;
        let start = Math.max(1, S.page - Math.floor(windowSize / 2));
        let end = Math.min(totalPages, start + windowSize - 1);
        if (end - start + 1 < windowSize) {
            start = Math.max(1, end - windowSize + 1);
        }

        for (let i = start; i <= end; i++) {
            buttons.push(pageBtn(i, String(i), false, i === S.page));
        }

        buttons.push(pageBtn(S.page + 1, '<i class="fas fa-chevron-right"></i>', S.page === totalPages));

        container.innerHTML = buttons.join('');

        container.querySelectorAll('[data-page]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const next = Number(btn.getAttribute('data-page'));
                if (!next || next === S.page) return;
                S.page = next;
                renderUsersTable();
                renderPagination();
            });
        });

        updatePaginationInfo();
    }

    function pageBtn(page, label, disabled, active) {
        return '<button type="button" ' +
            'class="' + (active ? 'active' : '') + '" ' +
            (disabled ? 'disabled ' : '') +
            'data-page="' + page + '">' + label + '</button>';
    }

    function updatePaginationInfo() {
        const info = document.getElementById('usersPaginationInfo');
        if (!info) return;

        if (!S.filtered.length) {
            info.textContent = 'Showing 0-0 of 0 users';
            return;
        }

        const start = (S.page - 1) * S.pageSize + 1;
        const end = Math.min(S.page * S.pageSize, S.filtered.length);
        info.textContent = 'Showing ' + start + '-' + end + ' of ' + S.filtered.length + ' users';
    }

    function setEmptyState(message) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6"><div class="users-empty">' +
            '<i class="fas fa-users-slash"></i>' +
            '<h4>' + esc(message || 'No users found.') + '</h4>' +
            '</div></td></tr>';
        const footer = document.getElementById('usersPagination');
        if (footer) footer.style.display = 'none';
        updatePaginationInfo();
    }

    function onTableActionClick(e) {
        const btn = e.target.closest('button[data-action][data-uuid]');
        if (!btn) return;

        const uuid = btn.getAttribute('data-uuid');
        const action = btn.getAttribute('data-action');
        const user = S.users.find(function (u) { return String(u.uuid) === String(uuid); });
        if (!user) return;

        if (action === 'edit') {
            openUserFormModal(user);
            return;
        }
        if (action === 'assign-role') {
            openRoleModal(user);
            return;
        }
        if (action === 'toggle-status') {
            toggleStatus(user);
            return;
        }
        if (action === 'reset-password') {
            openResetPasswordModal(user);
            return;
        }
        if (action === 'view-activity') {
            openActivityModal(user);
        }
    }

    function openUserFormModal(user) {
        S.editingUuid = user ? user.uuid : null;

        setValue('ufFirstName', user ? user.first_name : '');
        setValue('ufLastName', user ? user.last_name : '');
        setValue('ufUsername', user ? user.username : '');
        setValue('ufEmail', user ? user.email : '');
        setValue('ufStatus', user ? String(Number(user.is_active) === 1 ? 1 : 0) : '1');
        setValue('ufPassword', '');

        const modalTitle = document.getElementById('userFormModalTitle');
        if (modalTitle) {
            modalTitle.textContent = user ? 'Edit User' : 'Create User';
        }

        const roleSelect = document.getElementById('ufRole');
        if (roleSelect) {
            roleSelect.value = '';
            const userRoles = normalizeRoles(user ? user.roles : []);
            if (userRoles.length && S.roles.length) {
                const matched = S.roles.find(function (r) {
                    return normalizeRoleName(r) === userRoles[0];
                });
                roleSelect.value = matched ? String(matched.role_id || matched.id || '') : '';
            }
        }

        hideError('userFormError');
        showModal('userFormModal');
    }

    function closeUserFormModal() {
        S.editingUuid = null;
        setPasswordVisibility('ufPassword', 'toggleUfPasswordBtn', false);
        hideModal('userFormModal');
    }

    async function saveUser() {
        const payload = {
            first_name: value('ufFirstName'),
            last_name: value('ufLastName'),
            username: value('ufUsername'),
            email: value('ufEmail'),
            is_active: Number(value('ufStatus')),
        };

        const password = value('ufPassword');
        const selectedRoleId = Number(value('ufRole')) || 0;

        if (selectedRoleId) {
            const selectedRole = S.roles.find(function (role) {
                return String(role.role_id || role.id || '') === String(selectedRoleId);
            });
            if (selectedRole && isSuperAdminRole(normalizeRoleName(selectedRole))) {
                showError('userFormError', 'Superadmin role cannot be assigned here.');
                return;
            }
        }

        if (!payload.username || !payload.email) {
            showError('userFormError', 'Username and email are required.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            showError('userFormError', 'Please enter a valid email address.');
            return;
        }

        if (!S.editingUuid) {
            if (!password || password.length < 8) {
                showError('userFormError', 'Password is required and must be at least 8 characters for new users.');
                return;
            }
            payload.password = password;
        }

        try {
            if (S.editingUuid) {
                await API.put(API_ENDPOINTS.USER_BY_ID(S.editingUuid), payload);
                if (selectedRoleId) {
                    await API.post(API_ENDPOINTS.USER_BY_ID(S.editingUuid) + '/roles', { role_id: selectedRoleId });
                }
                toast('User updated successfully', 'success');
            } else {
                const res = await API.post(API_ENDPOINTS.USERS, payload);
                const createdUuid = extractItem(res)?.uuid;
                if (selectedRoleId && createdUuid) {
                    await API.post(API_ENDPOINTS.USER_BY_ID(createdUuid) + '/roles', { role_id: selectedRoleId });
                }
                toast('User created successfully', 'success');
            }

            closeUserFormModal();
            await loadUsers();
            applyFilters();
        } catch (err) {
            console.error('Save user error:', err);
            let msg = err.message || 'Failed to save user';
            if (err.body && err.body.errors) {
                const fieldErrors = Object.values(err.body.errors).flat().join('. ');
                if (fieldErrors) msg = fieldErrors;
            }
            showError('userFormError', msg);
        }
    }

    function openRoleModal(user) {
        S.activeUser = user;
        const target = document.getElementById('assignRoleTarget');
        if (target) {
            target.textContent = 'Assigning role for ' + displayName(user);
        }
        setValue('assignRoleSelect', '');
        showModal('roleModal');
    }

    function closeRoleModal() {
        S.activeUser = null;
        hideModal('roleModal');
    }

    async function assignRole() {
        const user = S.activeUser;
        if (!user || !user.uuid) return;

        const roleId = Number(value('assignRoleSelect'));
        if (!roleId) {
            toast('Please select a role to assign', 'warning');
            return;
        }

        const selectedRole = S.roles.find(function (role) {
            return String(role.role_id || role.id || '') === String(roleId);
        });
        if (selectedRole && isSuperAdminRole(normalizeRoleName(selectedRole))) {
            toast('Superadmin role cannot be assigned here', 'warning');
            return;
        }

        try {
            await API.post(API_ENDPOINTS.USER_BY_ID(user.uuid) + '/roles', { role_id: roleId });
            toast('Role assigned successfully', 'success');
            closeRoleModal();
            await loadUsers();
            applyFilters();
        } catch (err) {
            console.error('Assign role error:', err);
            toast(err.message || 'Failed to assign role', 'error');
        }
    }

    async function toggleStatus(user) {
        if (!user || !user.uuid) return;

        const nextActive = Number(user.is_active) === 1 ? 0 : 1;
        const action = nextActive ? 'activate' : 'deactivate';

        showConfirmPopup(
            'Update User Status',
            'Are you sure you want to ' + action + ' ' + displayName(user) + '?',
            async function () {
                try {
                    await API.put(API_ENDPOINTS.USER_BY_ID(user.uuid), { is_active: nextActive });
                    toast('User status updated', 'success');
                    await loadUsers();
                    applyFilters();
                } catch (err) {
                    console.error('Toggle status error:', err);
                    toast(err.message || 'Failed to update status', 'error');
                }
            }
        );
    }

    function openResetPasswordModal(user) {
        S.activeUser = user;
        setValue('resetPasswordInput', randomPassword(12));
        setPasswordVisibility('resetPasswordInput', 'toggleResetPasswordBtn', false);
        hideError('resetPasswordError');

        const target = document.getElementById('resetPasswordTarget');
        if (target) {
            target.textContent = 'Resetting password for ' + displayName(user);
        }

        showModal('resetPasswordModal');
    }

    function closeResetPasswordModal() {
        S.activeUser = null;
        hideModal('resetPasswordModal');
    }

    async function resetUserPassword() {
        const user = S.activeUser;
        if (!user || !user.uuid) return;

        const password = value('resetPasswordInput');
        if (!password || password.length < 8) {
            showError('resetPasswordError', 'Password must be at least 8 characters.');
            return;
        }

        try {
            const endpoint = API_ENDPOINTS.USER_RESET_PASSWORD
                ? API_ENDPOINTS.USER_RESET_PASSWORD(user.uuid)
                : (API_ENDPOINTS.USER_BY_ID(user.uuid) + '/reset-password');

            await API.post(endpoint, { new_password: password });
            toast('Password reset successfully', 'success');
            closeResetPasswordModal();
        } catch (err) {
            console.error('Reset password error:', err);
            showError('resetPasswordError', err.message || 'Failed to reset password.');
        }
    }

    async function openActivityModal(user) {
        S.activeUser = user;

        const target = document.getElementById('activityTarget');
        if (target) {
            target.textContent = 'Recent activity for ' + displayName(user);
        }

        const list = document.getElementById('activityList');
        if (list) {
            list.innerHTML = '<p style="color:var(--text-secondary,#64748b)">Loading activity...</p>';
        }

        showModal('activityModal');

        try {
            const res = await API.get(API_ENDPOINTS.USER_ACTIVITY(user.uuid));
            const activity = extractList(res);
            renderActivity(Array.isArray(activity) ? activity : []);
        } catch (err) {
            console.error('Load activity error:', err);
            renderActivity([], err.message || 'Failed to load activity');
        }
    }

    function closeActivityModal() {
        S.activeUser = null;
        hideModal('activityModal');
    }

    function exportUsersCsv() {
        const rows = getExportUsers();
        if (!rows.length) {
            toast('No users to export.', 'warning');
            return;
        }

        const data = [
            ['First Name', 'Last Name', 'Email', 'Username', 'Role', 'Status', 'Institution', 'Date Joined'],
        ].concat(rows.map(function (user) {
            const roles = normalizeRoles(user.roles);
            return [
                user.first_name || '',
                user.last_name || '',
                user.email || '',
                user.username || '',
                roles[0] ? titleCase(roles[0]) : 'Unassigned',
                Number(user.is_active) === 1 ? 'Active' : 'Inactive',
                user.institution_name || '',
                formatDate(user.created_at),
            ];
        }));

        downloadCsv(data, 'users_export_' + timestampStamp() + '.csv');
        toast('CSV export ready', 'success');
    }

    async function exportUsersPdf() {
        toast('Preparing PDF\u2026', 'info');

        const params = new URLSearchParams({ page: 1, limit: 10000 });
        if (S.search) params.set('search', S.search);
        if (S.role)   params.set('role',   S.role);
        if (S.status) params.set('status', S.status);

        let rows = [];
        try {
            const res = await API.get(`${API_ENDPOINTS.USERS}?${params}`);
            if (!res || !res.success) { toast('PDF export failed', 'error'); return; }
            const d = res.data || res;
            rows = d.users || d.data || (Array.isArray(d) ? d : []);
        } catch (err) {
            console.error('PDF export error:', err);
            toast('PDF export failed', 'error');
            return;
        }

        if (!rows.length) { toast('No users to export.', 'warning'); return; }

        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const e = v => String(v ?? '\u2014').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const badge = s => {
            const map = { active: '#15803d;background:#dcfce7', inactive: '#854d0e;background:#fef9c3' };
            const c = map[s] || '#64748b;background:#f1f5f9';
            return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:${c}">${e(s)}</span>`;
        };

        const filterLabel = [
            S.search ? `Search: "${S.search}"` : '',
            S.role   ? `Role: ${S.role}`       : '',
            S.status ? `Status: ${S.status}`   : '',
        ].filter(Boolean).join(' | ');

        const tableRows = rows.map((u, i) => {
            const roles    = normalizeRoles(u.roles);
            const roleName = roles[0] ? titleCase(roles[0]) : 'Unassigned';
            const status   = Number(u.is_active) === 1 ? 'active' : 'inactive';
            return `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
                <td>${i + 1}</td>
                <td><strong>${e(displayName(u))}</strong></td>
                <td>${e(u.email || '\u2014')}</td>
                <td style="font-family:monospace;font-size:11px">${e(u.username || '\u2014')}</td>
                <td>${e(roleName)}</td>
                <td>${badge(status)}</td>
                <td>${e(u.phone_number || '\u2014')}</td>
                <td>${e(formatDate(u.created_at))}</td>
            </tr>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Users Export \u2014 ${date}</title>
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
      <h1>&#128101; Users Report</h1>
      <p style="color:#64748b;margin-top:2px">Total: <strong>${rows.length}</strong> user${rows.length !== 1 ? 's' : ''}</p>
    </div>
    <div class="meta">
      <div>Exported: ${date}</div>
      <button onclick="window.print()" style="margin-top:6px;padding:4px 12px;background:#006a3f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px">&#128438; Print / Save PDF</button>
    </div>
  </div>
  ${filterLabel ? `<div class="filter-bar">Filters: ${e(filterLabel)}</div>` : ''}
  <table>
    <thead>
      <tr>
        <th>#</th><th>Name</th><th>Email</th><th>Username</th>
        <th>Role</th><th>Status</th><th>Phone</th><th>Date Joined</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">Generated by LMS &bull; ${date}</div>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=1100,height=750');
        if (!win) { toast('Allow pop-ups to export PDF', 'warning'); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
        toast(`PDF ready \u2014 ${rows.length} user${rows.length !== 1 ? 's' : ''}`, 'success');
    }

    function openImportModal() {
        S.importRows = [];
        const fileInput = document.getElementById('userImportFileInput');
        const confirmBtn = document.getElementById('confirmUserImportBtn');
        const confirmText = document.getElementById('confirmUserImportText');
        const spinner = document.getElementById('userImportSpinner');
        if (fileInput) fileInput.value = '';
        hideEl('userImportPreview');
        hideEl('userImportErrors');
        if (confirmBtn) confirmBtn.disabled = true;
        if (confirmText) confirmText.textContent = 'Import';
        if (spinner) spinner.style.display = 'none';
        showModal('userImportModal');
    }

    function closeImportModal() {
        hideModal('userImportModal');
    }

    function closeImportResults() {
        hideModal('userImportResultsModal');
    }

    function downloadImportTemplate() {
        const roleHints = S.roles
            .map(function (r) { return normalizeRoleName(r); })
            .filter(Boolean)
            .join(' | ') || 'admin | teacher | student | parent';

        const csv = [
            '# Roles available: ' + roleHints,
            '# is_active: 1 or 0 (also supports active/inactive/yes/no/true/false)',
            '# Rows starting with # are ignored.',
            USER_IMPORT_COLUMNS.join(','),
            'Jane,Doe,jane.doe@school.com,jane.doe,Pass1234!,teacher,1,+233555000111,Accra,1990-05-14'
        ].join('\n');

        downloadCsvText(csv, 'users_import_template.csv');
    }

    function handleImportFile(file) {
        if (!file) return;
        if (!/\.csv$/i.test(file.name || '')) {
            toast('Please upload a CSV file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const parsed = parseCsv(String((e.target && e.target.result) || ''));
            S.importRows = parsed.rows;
            setElText('userImportFileName', file.name || 'users.csv');
            setElText('userImportRowCount', parsed.rows.length + ' row' + (parsed.rows.length !== 1 ? 's' : '') + ' found');
            showEl('userImportPreview');

            const errorsEl = document.getElementById('userImportErrors');
            if (errorsEl) {
                if (parsed.errors.length) {
                    errorsEl.style.display = 'block';
                    errorsEl.innerHTML = '<strong>Import checks:</strong><ul style="margin:.4rem 0 0 1.1rem">' +
                        parsed.errors.map(function (msg) { return '<li>' + esc(msg) + '</li>'; }).join('') +
                        '</ul>';
                } else {
                    errorsEl.style.display = 'none';
                    errorsEl.textContent = '';
                }
            }

            const confirmBtn = document.getElementById('confirmUserImportBtn');
            if (confirmBtn) confirmBtn.disabled = parsed.rows.length === 0;

            if (!parsed.rows.length) {
                toast('No data rows found in CSV.', 'warning');
            }
        };
        reader.readAsText(file);
    }

    function parseCsv(text) {
        const lines = String(text || '').split(/\r?\n/);
        const errors = [];
        let headerLine = '';
        let startIndex = -1;

        for (let i = 0; i < lines.length; i += 1) {
            const raw = String(lines[i] || '').trim();
            if (!raw || raw.charAt(0) === '#') continue;
            headerLine = lines[i];
            startIndex = i + 1;
            break;
        }

        if (!headerLine) {
            errors.push('CSV file appears empty.');
            return { rows: [], errors: errors };
        }

        const headers = splitCsvLine(headerLine).map(function (header) {
            return String(header || '').trim().toLowerCase().replace(/\s+/g, '_');
        });

        if (!headers.includes('username') && !headers.includes('email')) {
            errors.push('Header should include at least username or email.');
        }

        const rows = [];
        for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex += 1) {
            const line = String(lines[lineIndex] || '');
            const trimmed = line.trim();
            if (!trimmed || trimmed.charAt(0) === '#') continue;

            const values = splitCsvLine(line);
            const row = {};
            headers.forEach(function (header, index) {
                let value = String(values[index] == null ? '' : values[index]).trim();
                if (header === 'role' && !row.roles) {
                    row.roles = value;
                    return;
                }
                if (header === 'is_active') {
                    const normalized = value.toLowerCase();
                    if (normalized === 'active' || normalized === 'yes' || normalized === 'true') value = '1';
                    if (normalized === 'inactive' || normalized === 'no' || normalized === 'false') value = '0';
                }
                row[header] = value;
            });

            const nonEmpty = Object.keys(row).some(function (key) {
                return String(row[key] == null ? '' : row[key]).trim() !== '';
            });
            if (!nonEmpty) continue;

            rows.push(row);
        }

        if (!rows.length) errors.push('No data rows found in CSV.');
        return { rows: rows, errors: errors };
    }

    function splitCsvLine(line) {
        const cells = [];
        let current = '';
        let quoted = false;

        for (let index = 0; index < line.length; index += 1) {
            const char = line.charAt(index);
            const next = line.charAt(index + 1);

            if (char === '"') {
                if (quoted && next === '"') {
                    current += '"';
                    index += 1;
                } else {
                    quoted = !quoted;
                }
                continue;
            }

            if (char === ',' && !quoted) {
                cells.push(current);
                current = '';
                continue;
            }

            current += char;
        }

        cells.push(current);
        return cells;
    }

    async function confirmImport() {
        if (!S.importRows.length) {
            toast('Select a CSV file to import first.', 'warning');
            return;
        }

        const spinner = document.getElementById('userImportSpinner');
        const confirmBtn = document.getElementById('confirmUserImportBtn');
        const textEl = document.getElementById('confirmUserImportText');

        if (spinner) spinner.style.display = 'inline-block';
        if (confirmBtn) confirmBtn.disabled = true;
        if (textEl) textEl.textContent = 'Importing...';

        try {
            const payloadRows = S.importRows.map(function (row) {
                return normalizeImportRow(row);
            });
            const response = await UserAPI.import({ rows: payloadRows });
            const result = extractItem(response) || {};
            const importResults = buildImportResults(payloadRows, result.errors || []);
            showImportResults(importResults);
            closeImportModal();
            await loadUsers();
            applyFilters();
            toast('User import completed', 'success');
        } catch (err) {
            console.error('Import users error:', err);
            toast(err.message || 'Failed to import users', 'error');
        } finally {
            if (spinner) spinner.style.display = 'none';
            if (confirmBtn) confirmBtn.disabled = false;
            if (textEl) textEl.textContent = 'Import';
        }
    }

    function normalizeImportRow(row) {
        const normalized = {
            first_name: String(row.first_name || '').trim(),
            last_name: String(row.last_name || '').trim(),
            email: String(row.email || '').trim(),
            username: String(row.username || '').trim(),
            password: String(row.password || '').trim(),
            roles: String(row.roles || row.role || '').trim(),
            is_active: String(row.is_active || '').trim() === '0' ? 0 : 1,
            phone_number: emptyToNull(row.phone_number),
            address: emptyToNull(row.address),
            date_of_birth: emptyToNull(row.date_of_birth),
            institution_name: emptyToNull(row.institution_name),
        };

        if (!normalized.password) delete normalized.password;
        if (!normalized.roles) delete normalized.roles;
        if (!normalized.institution_name) delete normalized.institution_name;
        return normalized;
    }

    function buildImportResults(rows, errors) {
        const errorMap = {};
        (Array.isArray(errors) ? errors : []).forEach(function (entry) {
            errorMap[entry.row] = entry.error || 'Import failed';
        });

        return rows.map(function (row, index) {
            const rowNumber = index + 1;
            const reason = errorMap[rowNumber] || '';
            const isSkipped = reason && /exist|duplicate|already/i.test(reason);
            return {
                row: rowNumber,
                name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.username || row.email || ('Row ' + rowNumber),
                status: !reason ? 'success' : (isSkipped ? 'skipped' : 'failed'),
                reason: reason,
            };
        });
    }

    function showImportResults(results) {
        const summaryEl = document.getElementById('userImportResultsSummary');
        const bodyEl = document.getElementById('userImportResultsBody');
        const successCount = results.filter(function (item) { return item.status === 'success'; }).length;
        const skippedCount = results.filter(function (item) { return item.status === 'skipped'; }).length;
        const failedCount = results.filter(function (item) { return item.status === 'failed'; }).length;

        if (summaryEl) {
            summaryEl.innerHTML = [
                '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#dcfce7;color:#166534;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-check-circle"></i> ' + successCount + ' Successful</span>',
                skippedCount ? '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fef9c3;color:#854d0e;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-minus-circle"></i> ' + skippedCount + ' Skipped</span>' : '',
                failedCount ? '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fee2e2;color:#991b1b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-times-circle"></i> ' + failedCount + ' Failed</span>' : '',
                '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#f8fafc;color:#64748b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem"><i class="fas fa-list"></i> ' + results.length + ' Total</span>'
            ].join('');
        }

        if (bodyEl) {
            bodyEl.innerHTML = results.map(function (item) {
                var label = item.status === 'success' ? 'Success' : (item.status === 'skipped' ? 'Skipped' : 'Failed');
                return '<tr>' +
                    '<td>' + esc(item.row) + '</td>' +
                    '<td>' + esc(item.name) + '</td>' +
                    '<td>' + esc(label) + '</td>' +
                    '<td>' + esc(item.reason || '-') + '</td>' +
                '</tr>';
            }).join('');
        }

        showModal('userImportResultsModal');
    }

    function renderActivity(rows, errorMessage) {
        const list = document.getElementById('activityList');
        if (!list) return;

        if (errorMessage) {
            list.innerHTML = '<p style="color:#dc2626">' + esc(errorMessage) + '</p>';
            return;
        }

        if (!rows.length) {
            list.innerHTML = '<p style="color:var(--text-secondary,#64748b)">No activity found for this user.</p>';
            return;
        }

        list.innerHTML = rows.map(function (item) {
            const when = formatDateTime(item.created_at);
            const type = item.activity_type || 'activity';
            const details = formatActivityDetails(item.activity_details);
            return '' +
                '<div style="border:1px solid #e5e7eb;border-radius:10px;padding:0.75rem;margin-bottom:0.5rem;">' +
                    '<div style="display:flex;justify-content:space-between;gap:0.5rem;align-items:center;">' +
                        '<strong>' + esc(type.replace(/_/g, ' ')) + '</strong>' +
                        '<span style="color:var(--text-secondary,#64748b);font-size:0.85rem;">' + esc(when) + '</span>' +
                    '</div>' +
                    '<div style="margin-top:0.35rem;color:var(--text-secondary,#64748b)">' + esc(details) + '</div>' +
                '</div>';
        }).join('');
    }

    function formatActivityDetails(raw) {
        if (!raw) return 'No additional details.';
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return simplifyObject(parsed);
            } catch (_) {
                return raw;
            }
        }
        if (typeof raw === 'object') {
            return simplifyObject(raw);
        }
        return String(raw);
    }

    function simplifyObject(obj) {
        const keys = Object.keys(obj || {});
        if (!keys.length) return 'No additional details.';
        return keys.slice(0, 4).map(function (k) {
            const val = obj[k];
            return k + ': ' + (typeof val === 'object' ? JSON.stringify(val) : String(val));
        }).join(' | ');
    }

    function extractList(response) {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data && response.data.data)) return response.data.data;
        if (Array.isArray(response.data && response.data.users)) return response.data.users;
        if (Array.isArray(response.users)) return response.users;
        return [];
    }

    function extractItem(response) {
        if (!response) return null;
        if (response.data && !Array.isArray(response.data)) return response.data;
        return null;
    }

    function extractPagination(response) {
        if (!response) return { total: 0 };
        if (response.pagination) return response.pagination;
        if (response.data && response.data.pagination) return response.data.pagination;
        return { total: 0 };
    }

    function getExportUsers() {
        return S.filtered.length ? S.filtered.slice() : S.users.slice();
    }

    function normalizeRoles(roles) {
        if (!roles) return [];
        if (Array.isArray(roles)) return roles.map(function (r) { return String(r).toLowerCase(); });
        if (typeof roles === 'string') {
            return roles.split(',').map(function (r) { return r.trim().toLowerCase(); }).filter(Boolean);
        }
        return [];
    }

    function normalizeRoleName(role) {
        return String(role && (role.role_name || role.name) || '').toLowerCase();
    }

    function isSuperAdminRole(roleName) {
        const n = String(roleName || '').trim().toLowerCase();
        return n === 'super_admin' || n === 'superadmin';
    }

    function getInitials(firstName, lastName, username) {
        const f = (firstName || '').charAt(0).toUpperCase();
        const l = (lastName || '').charAt(0).toUpperCase();
        if (f || l) return f + l;
        return ((username || '?').charAt(0)).toUpperCase();
    }

    function displayName(user) {
        return ((user.first_name || '') + ' ' + (user.last_name || '')).trim() || user.username || user.email || 'this user';
    }

    function formatDate(value) {
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatDateTime(value) {
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function randomPassword(length) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        let out = '';
        for (let i = 0; i < bytes.length; i += 1) {
            out += chars[bytes[i] % chars.length];
        }
        return out;
    }

    function showModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('open');
    }

    function hideModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('open');
    }

    function showError(id, message) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = message;
        el.style.display = 'block';
    }

    function hideError(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = '';
        el.style.display = 'none';
    }

    function toast(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'info');
            return;
        }
        console.log('[' + (type || 'info') + '] ' + message);
    }

    function showConfirmPopup(title, message, onConfirm) {
        if (typeof window.showModal === 'function') {
            window.showModal(title, message, onConfirm);
            return;
        }
        if (confirm(message)) onConfirm();
    }

    function downloadCsv(rows, filename) {
        const csv = rows.map(function (row) {
            return row.map(function (cell) {
                return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"';
            }).join(',');
        }).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    function downloadCsvText(content, filename) {
        const blob = new Blob([String(content || '')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    function timestampStamp() {
        const now = new Date();
        return String(now.getFullYear()) +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
    }

    function emptyToNull(value) {
        const normalized = String(value == null ? '' : value).trim();
        return normalized ? normalized : null;
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function titleCase(value) {
        return String(value || '')
            .split('_').join(' ')
            .split(' ')
            .filter(Boolean)
            .map(function (part) { return part.charAt(0).toUpperCase() + part.slice(1); })
            .join(' ');
    }

    const USER_IMPORT_COLUMNS = [
        'first_name', 'last_name', 'email', 'username', 'password',
        'roles', 'is_active', 'phone_number', 'address', 'date_of_birth', 'institution_name'
    ];

    function on(id, eventName, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(eventName, handler);
    }

    function value(id) {
        const el = document.getElementById(id);
        return el ? String(el.value || '').trim() : '';
    }

    function setValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val == null ? '' : String(val);
    }

    function setElText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text == null ? '' : String(text);
    }

    function showEl(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
    }

    function hideEl(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }

    function togglePasswordVisibility(inputId, buttonId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const nextVisible = input.type === 'password';
        setPasswordVisibility(inputId, buttonId, nextVisible);
    }

    function setPasswordVisibility(inputId, buttonId, visible) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(buttonId);
        if (!input || !btn) return;

        input.type = visible ? 'text' : 'password';
        btn.title = visible ? 'Hide password' : 'Show password';
        btn.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');

        const icon = btn.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-eye', 'fa-eye-slash');
            icon.classList.add(visible ? 'fa-eye-slash' : 'fa-eye');
        }
    }
})();
