// Super Admin - Users page script
(function () {
    const apiBase = (API_BASE_URL || '') + API_ENDPOINTS.SUPERADMIN_USERS;
    let state = { page: 1, per_page: 10, q: '', role: '', institution: '' };
    // load persisted per-page preference
    try {
        const sp = Number(localStorage.getItem('users.per_page'));
        if (sp && Number.isInteger(sp) && sp > 0) state.per_page = sp;
    } catch (e) { /* ignore */ }

    // Simple localization strings
    const i18n = (function () {
        const langs = {
            en: {
                import_confirm_title: 'Import Users',
                import_confirm_body: 'The file contains {rows} rows. {valid} valid, {invalid} invalid. Show preview?',
                import_errors_heading: 'Errors (first {n})',
                import_no_rows: 'No valid rows found to import.',
                import_started: 'Import started',
                import_failed: 'Import failed',
                confirm: 'Confirm',
                cancel: 'Cancel'
            }
        };
        const lang = (navigator.language || 'en').split('-')[0];
        return langs[lang] || langs.en;
    })();

    // Minimal CSV parser (handles quoted fields)
    function parseCSVText(text) {
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        // find header
        let headerLineIndex = 0;
        while (headerLineIndex < lines.length && lines[headerLineIndex].trim() === '') headerLineIndex++;
        if (headerLineIndex >= lines.length) return { header: [], rows: [] };
        const header = splitCsvLine(lines[headerLineIndex]);
        const rows = [];
        for (let i = headerLineIndex + 1; i < lines.length; i++) {
            const ln = lines[i];
            if (ln.trim() === '') continue;
            const values = splitCsvLine(ln);
            // if fewer values, pad
            while (values.length < header.length) values.push('');
            const obj = {};
            for (let j = 0; j < header.length; j++) obj[header[j].trim()] = values[j] !== undefined ? values[j].trim() : '';
            rows.push(obj);
        }
        return { header, rows };
    }

    function splitCsvLine(line) {
        // split by commas not inside quotes
        const regex = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g;
        const parts = line.split(regex).map(s => {
            s = s.trim();
            if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1).replace(/""/g, '"');
            return s;
        });
        return parts;
    }

    // detect current user and super_admin status
    let _isSuperAdmin = false;
    function getCurrentUser() {
        try {
            if (window.CURRENT_USER) return window.CURRENT_USER;
            if (window.currentUser) return window.currentUser;
            if (window.__USER__) return window.__USER__;
            if (typeof Auth !== 'undefined' && typeof Auth.getCurrentUser === 'function') return Auth.getCurrentUser();
            if (typeof Auth !== 'undefined' && Auth.currentUser) return Auth.currentUser;
        } catch (e) { }
        return null;
    }

    function detectSuperAdmin() {
        const u = getCurrentUser();
        if (!u || !u.roles) return false;
        return u.roles.some(r => ((r.role_name || '').toLowerCase() === 'super_admin' || (r.role_slug || '').toLowerCase() === 'super_admin'));
    }

    function restrictFormRoles(form) {
        if (!form) return;
        if (!_isSuperAdmin) return;
        const rolesList = state.rolesList || [];
        const adminRoleIds = rolesList.filter(r => (r.role_name || '').toLowerCase().includes('admin')).map(r => String(r.role_id));
        // disable select options
        const sel = form.querySelector('select[name="roles"], select[name="roles[]"], select[name="role_ids"], select[multiple]');
        if (sel) {
            Array.from(sel.options).forEach(opt => {
                if (!adminRoleIds.includes(String(opt.value))) opt.disabled = true;
            });
        }
        // disable checkbox inputs
        const cbs = form.querySelectorAll('input[type="checkbox"][name*="role"]');
        cbs.forEach(cb => { if (!adminRoleIds.includes(String(cb.value))) cb.disabled = true; });
        // add small note
        let note = form.querySelector('.sa-role-note');
        if (!note) {
            note = document.createElement('div'); note.className = 'sa-role-note';
            note.style.fontSize = '0.9rem'; note.style.color = 'var(--text-secondary)'; note.style.marginTop = '0.5rem';
            note.textContent = 'As a Super Admin you can only assign Admin roles.';
            form.appendChild(note);
        }
    }

    // show a small note in the modal form when the selected institution has no admin
    function setupInstitutionNote(form) {
        if (!form) return;
        const sel = form.querySelector('select[name="institution_id"]');
        if (!sel) return;
        let note = form.querySelector('.inst-admin-note');
        if (!note) {
            note = document.createElement('div'); note.className = 'inst-admin-note';
            note.style.fontSize = '0.9rem'; note.style.color = 'var(--text-secondary)'; note.style.marginTop = '0.5rem';
            sel.parentNode.appendChild(note);
        }
        function update() {
            const opt = sel.options[sel.selectedIndex];
            const hasAdmin = opt && ((opt.dataset && opt.dataset.hasAdmin === '1') || opt.getAttribute('data-has-admin') === '1');
            if (!hasAdmin) {
                note.textContent = '...';
            } else {
                note.textContent = '';
            }
        }
        sel.addEventListener('change', update);
        update();
    }

    function validateRow(obj) {
        const errors = [];
        // require username or email
        if (!obj.username && !obj.email) errors.push('Missing username/email');
        if (obj.email && !/^\S+@\S+\.\S+$/.test(obj.email)) errors.push('Invalid email');
        // is_active normalization
        if ('is_active' in obj) {
            const v = String(obj.is_active).trim().toLowerCase();
            if (!['1', '0', 'true', 'false', 'yes', 'no'].includes(v)) errors.push('Invalid is_active');
        }
        return errors;
    }

    document.addEventListener('page:loaded', (e) => {
        if (!e.detail || e.detail.page !== 'users') return;
        initUsersPage();
    });

    // Support direct page load (non-SPA) by initializing when DOM ready
    document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('usersPage')) initUsersPage(); });

    function initUsersPage() {
        const root = document.getElementById('usersPage');
        if (!root) return;

        // elements
        state.page = 1;
        const search = root.querySelector('#usersSearch');
        const roleFilter = root.querySelector('#filterRole');
        const instFilter = root.querySelector('#filterInstitution');
        const perPageSelect = root.querySelector('#perPageSelect');
        const tableBody = root.querySelector('#usersTable tbody');
        const pagination = root.querySelector('#usersPagination');
        const btnCreate = root.querySelector('#btnCreateUser');
        const importInput = root.querySelector('#importFileInput');
        const btnImport = root.querySelector('#btnImport');
        const btnExportAll = root.querySelector('#btnExportAll');
        const btnExportXlsx = root.querySelector('#btnExportXlsx');
        const btnExportPdf = root.querySelector('#btnExportPdf');
        const bulkSelect = root.querySelector('#bulkActionSelect');
        const btnApplyBulk = root.querySelector('#btnApplyBulk');
        const closeRoleDrawer = document.getElementById('closeRoleDrawer');
        const saveRolesBtn = document.getElementById('saveRolesBtn');

        // wire events
        let debounce;
        search.addEventListener('input', (ev) => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                state.q = ev.target.value;
                state.page = 1;
                // If we have a cached page of users, filter client-side for instant feedback.
                if (state.lastUsers && Array.isArray(state.lastUsers) && state.lastUsers.length) {
                    const filtered = filterUsers(state.lastUsers, state.q);
                    const tbody = document.querySelector('#usersTable tbody');
                    renderUsers(filtered, tbody);
                    // update pagination to show single-page info when filtering locally
                    const pagination = document.getElementById('usersPagination');
                    renderPagination({ page: 1, total_pages: 1 }, pagination);
                } else {
                    loadUsers();
                }
            }, 300);
        });
        instFilter.addEventListener('change', (e) => {
            state.institution = e.target.value;
            state.page = 1;
            // If we have cached users, filter client-side for instant feedback
            if (state.lastUsers && Array.isArray(state.lastUsers) && state.lastUsers.length) {
                let filtered = filterUsers(state.lastUsers, state.q);
                if (state.institution) {
                    filtered = filtered.filter(u => String(u.institution_id) === String(state.institution));
                }
                const tbody = document.querySelector('#usersTable tbody');
                renderUsers(filtered, tbody);
                const pagination = document.getElementById('usersPagination');
                renderPagination({ page: 1, total_pages: 1 }, pagination);
            } else {
                loadUsers();
            }
        });
        btnCreate.addEventListener('click', () => openCreateUserModal());
        perPageSelect && perPageSelect.addEventListener('change', (e) => { state.per_page = Number(e.target.value) || 10; try { localStorage.setItem('users.per_page', String(state.per_page)); } catch (_) { } state.page = 1; loadUsers(); });
        btnImport && btnImport.addEventListener('click', () => {
            const importHelpHtml = `
                <p>Upload a CSV/Excel file with the following header columns (header row required):</p>
                <ul>
                    <li><strong>first_name</strong> (recommended)</li>
                    <li><strong>last_name</strong> (recommended)</li>
                    <li><strong>username</strong> or <strong>email</strong> (at least one required)</li>
                    <li><strong>email</strong> (valid email format)</li>
                    <li><strong>institution_name</strong> or <strong>institution_id</strong> (optional)</li>
                    <li><strong>is_active</strong> (1 or 0)</li>
                </ul>
                <p>Sample layout:</p>
                <table class="import-sample-table"><thead><tr><th>first_name</th><th>last_name</th><th>username</th><th>email</th><th>institution_name</th><th>is_active</th></tr></thead>
                <tbody><tr><td>Jane</td><td>Doe</td><td>jdoe</td><td>jane.doe@example.com</td><td>Central School</td><td>1</td></tr></tbody></table>
                <p style="margin-top:0.5rem;">Press Confirm to choose a file and continue to the import preview.</p>
            `;
            showModal('Import Users', importHelpHtml, () => { importInput && importInput.click(); });
        });
        importInput && importInput.addEventListener('change', (e) => handleImportFile(e.target.files[0]));
        btnExportAll && btnExportAll.addEventListener('click', () => exportCSV());
        btnExportXlsx && btnExportXlsx.addEventListener('click', () => exportXLSX());
        btnExportPdf && btnExportPdf.addEventListener('click', () => { exportPDF(); });
        btnApplyBulk && btnApplyBulk.addEventListener('click', () => applyBulkAction(bulkSelect.value));
        closeRoleDrawer && closeRoleDrawer.addEventListener('click', closeRoleDrawerFn);
        saveRolesBtn && saveRolesBtn.addEventListener('click', saveRolesFromDrawer);

        // select all checkbox
        const selectAll = root.querySelector('#selectAllUsers');
        selectAll.addEventListener('change', (e) => {
            root.querySelectorAll('#usersTable tbody input[type="checkbox"]').forEach(cb => cb.checked = e.target.checked);
        });

        // initial load: populate filters then load users
        populateFilters(roleFilter, instFilter).then(() => {
            _isSuperAdmin = detectSuperAdmin();
            if (perPageSelect) perPageSelect.value = String(state.per_page || 10);
            applyRestrictions();
            loadUsers();
        }).catch((e) => { console.warn('populateFilters failed', e); loadUsers(); });
    }

    function applyRestrictions() {
        const root = document.getElementById('usersPage');
        if (!root) return;
        if (_isSuperAdmin) root.classList.add('sa-restricted');
        // remove role-assign bulk actions
        const bulkSelect = root.querySelector('#bulkActionSelect');
        if (bulkSelect) {
            Array.from(bulkSelect.options).forEach(opt => {
                const txt = (opt.textContent || '').toLowerCase();
                const val = (opt.value || '').toLowerCase();
                if (txt.includes('role') || val.includes('role') || val.includes('assign')) opt.remove();
            });
        }
        // hide create role options in template form
        const modalHtml = document.getElementById('usersModal');
        if (modalHtml) {
            const form = modalHtml.querySelector('#usersForm');
            restrictFormRoles(form);
        }
    }

    async function populateFilters(roleSelect, instSelect) {
        try {
            // fetch roles and institutions (endpoints expected)
            const [rolesRes, instRes] = await Promise.all([
                RoleAPI.getAll().catch(() => null),
                InstitutionAPI.getAll().catch(() => null)
            ]);

            // Normalize roles response (could be { data: [...] } or { data: { data: [...], pagination: {...} } })
            let rolesArray = [];
            if (rolesRes) {
                // API wrapper returns parsed body; adapt shapes
                if (Array.isArray(rolesRes.data)) rolesArray = rolesRes.data;
                else if (rolesRes.data && Array.isArray(rolesRes.data.data)) rolesArray = rolesRes.data.data;
                else if (Array.isArray(rolesRes)) rolesArray = rolesRes;
            }
            if (rolesArray.length) {
                state.rolesList = rolesArray;
                rolesArray.forEach(r => {
                    if (!roleSelect) return;
                    const opt = document.createElement('option'); opt.value = r.role_id; opt.textContent = r.role_name; roleSelect.appendChild(opt);
                });
            }

            // Normalize institutions response similarly
            let instArray = [];
            if (instRes) {
                if (Array.isArray(instRes.data)) instArray = instRes.data;
                else if (instRes.data && Array.isArray(instRes.data.data)) instArray = instRes.data.data;
                else if (Array.isArray(instRes)) instArray = instRes;
                else if (instRes.data && Array.isArray(instRes.data.institutions)) instArray = instRes.data.institutions;
            }
            if (instArray.length) {
                state.institutionsList = instArray;
                // clear existing filter options (keep first "All Institutions")
                while (instSelect.options.length > 1) instSelect.remove(1);
                // populate filter select
                instArray.forEach(i => {
                    const opt = document.createElement('option'); opt.value = i.institution_id;
                    const hasAdmin = Boolean(i.has_admin || i.hasAdmin || (i.admin_count && Number(i.admin_count) > 0) || (i.admins && i.admins.length > 0));
                    opt.dataset.hasAdmin = hasAdmin ? '1' : '0';
                    opt.textContent = i.institution_name + (hasAdmin ? '' : ' (no admin)');
                    instSelect.appendChild(opt);
                });

                // populate the modal's institution select (create/edit form)
                try {
                    const modalInst = document.querySelector('#usersModal select[name="institution_id"]');
                    if (modalInst) {
                        // try to fetch ALL institutions for the modal when backend supports include_all
                        let modalArray = instArray;
                        try {
                            const modalRes = await InstitutionAPI.getAll({ include_all: 1 }).catch(() => null);
                            let ma = [];
                            if (modalRes) {
                                if (Array.isArray(modalRes.data)) ma = modalRes.data;
                                else if (modalRes.data && Array.isArray(modalRes.data.data)) ma = modalRes.data.data;
                                else if (Array.isArray(modalRes)) ma = modalRes;
                                else if (modalRes.data && Array.isArray(modalRes.data.institutions)) ma = modalRes.data.institutions;
                            }
                            if (ma && ma.length) modalArray = ma;
                        } catch (e) { /* ignore */ }

                        // clear all existing options
                        modalInst.innerHTML = '';
                        const emptyOpt = document.createElement('option'); emptyOpt.value = ''; emptyOpt.textContent = 'Select institution'; modalInst.appendChild(emptyOpt);
                        modalArray.forEach(i => {
                            const opt = document.createElement('option'); opt.value = i.institution_id;
                            const hasAdmin = Boolean(i.has_admin || i.hasAdmin || (i.admin_count && Number(i.admin_count) > 0) || (i.admins && i.admins.length > 0));
                            opt.dataset.hasAdmin = hasAdmin ? '1' : '0';
                            opt.textContent = i.institution_name + (hasAdmin ? '' : ' (no admin)');
                            modalInst.appendChild(opt);
                        });
                    }
                } catch (e) { /* ignore if modal not present */ }
            }
        } catch (err) { console.warn('Failed to populate filters', err); }
    }

    // helper: build relative API path (not required when using API wrappers)
    function apiUrl(path) {
        const base = API_ENDPOINTS.SUPERADMIN_USERS.replace(/\/$/, '');
        if (!path.startsWith('/')) path = '/' + path;
        return (API_BASE_URL || '') + base + path;
    }

    async function loadUsers() {
        const root = document.getElementById('usersPage');
        if (!root) return;
        const tbody = root.querySelector('#usersTable tbody');
        const pagination = root.querySelector('#usersPagination');
        tbody.innerHTML = '<tr><td colspan="9" style="height:100px; align-items:center; justify-content:center; display:flex;"><div class="spinner"></div></td></tr>';

        const params = new URLSearchParams();
        params.set('page', state.page);
        params.set('per_page', state.per_page);
        if (state.q) params.set('q', state.q);
        if (state.role) params.set('role', state.role);
        if (state.institution) params.set('institution', state.institution);

        try {
            // use API wrapper so Authorization header is included
            const json = await SuperAdminUserAPI.getAll(Object.fromEntries(params.entries()));

            // Normalize different possible response shapes
            let usersArr = [];
            let meta = {};

            if (Array.isArray(json.data)) {
                usersArr = json.data;
                meta = json.pagination || json.meta || json.pagination || {};
            } else if (json.data && Array.isArray(json.data.users)) {
                usersArr = json.data.users;
                meta = json.data.pagination || json.data.meta || json.pagination || {};
            } else if (Array.isArray(json.users)) {
                usersArr = json.users;
                meta = json.pagination || json.meta || {};
            } else if (Array.isArray(json)) {
                usersArr = json;
                meta = {};
            }

            state.lastUsers = usersArr || [];
            renderUsers(state.lastUsers, tbody);
            renderPagination(meta || {}, pagination);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="9">Failed to load users</td></tr>`;
            console.error(err);
            showToast('Failed to load users', 'error');
        }
    }

    function renderUsers(users, tbody) {
        tbody.innerHTML = '';
        if (!users.length) { tbody.innerHTML = '<tr><td colspan="9">No users found</td></tr>'; return; }
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input data-id="${u.user_id}" type="checkbox"></td>
                <td><div style="display:flex;gap:0.5rem;align-items:center;"><img src="${u.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent((u.first_name || '') + ' ' + (u.last_name || ''))}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid var(--border-color)"><div><strong>${escapeHtml((u.first_name || '') + ' ' + (u.last_name || ''))}</strong><div style="font-size:0.85rem;color:var(--text-secondary)">${escapeHtml(u.email || '')}</div></div></div></td>
                <td>${escapeHtml(u.username || '')}</td>
                <td>${escapeHtml(u.email || '')}</td>
                <td>${escapeHtml((u.institution_name) || '—')}</td>
                    <td>${u.is_active ? 'Active' : 'Inactive'}</td>
                <td>${u.last_login || '—'}</td>
                <td>
                    <button class="btn-icon" data-action="edit" data-id="${u.user_id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="delete" data-id="${u.user_id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // wire action buttons
        tbody.querySelectorAll('button[data-action]').forEach(btn => {
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-action');
            btn.addEventListener('click', () => {
                if (action === 'edit') openEditUser(id);
                if (action === 'delete') confirmDeleteUser(id);
                if (action === 'roles') openRoleDrawerFn(id);
            });
        });
    }

    // Client-side filter helper (search across name, username, email, institution)
    function filterUsers(users, q) {
        if (!q || !q.trim()) return users;
        const s = q.trim().toLowerCase();
        return users.filter(u => {
            const name = ((u.first_name || '') + ' ' + (u.last_name || '')).toLowerCase();
            const username = (u.username || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const inst = (u.institution_name || '').toLowerCase();
            return name.includes(s) || username.includes(s) || email.includes(s) || inst.includes(s) || String(u.user_id).includes(s);
        });
    }

    // Dynamically load SheetJS (XLSX) from CDN if not present
    function loadXlsxLibrary(timeoutMs = 15000) {
        return new Promise((resolve, reject) => {
            if (typeof XLSX !== 'undefined') return resolve();
            const cdns = [
                'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
                'https://unpkg.com/xlsx/dist/xlsx.full.min.js'
            ];
            let tried = 0;
            let timedOut = false;
            const to = setTimeout(() => {
                timedOut = true;
                reject(new Error('Timeout loading XLSX library'));
            }, timeoutMs);

            function tryLoad() {
                if (timedOut) return;
                if (tried >= cdns.length) {
                    clearTimeout(to);
                    return reject(new Error('Failed to load XLSX library from CDNs'));
                }
                const url = cdns[tried++];
                const s = document.createElement('script');
                s.src = url;
                s.async = true;
                s.onload = () => {
                    clearTimeout(to);
                    if (typeof XLSX !== 'undefined') resolve();
                    else reject(new Error('XLSX loaded but not available'));
                };
                s.onerror = () => {
                    // try next CDN
                    tryLoad();
                };
                document.head.appendChild(s);
            }

            tryLoad();
        });
    }

    // Dynamically load jsPDF and autoTable (PDF export libs)
    function loadPdfLibraries(timeoutMs = 15000) {
        return new Promise((resolve, reject) => {
            const cdnJsPdf = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            const cdnAuto = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
            let timedOut = false;
            const to = setTimeout(() => {
                timedOut = true;
                reject(new Error('Timeout loading PDF libraries'));
            }, timeoutMs);

            function loadScript(url) {
                return new Promise((res, rej) => {
                    const s = document.createElement('script');
                    s.src = url;
                    s.async = true;
                    s.onload = () => res();
                    s.onerror = () => rej(new Error('Failed to load ' + url));
                    document.head.appendChild(s);
                });
            }

            // Load jsPDF first, then autoTable
            loadScript(cdnJsPdf).then(() => loadScript(cdnAuto)).then(() => {
                clearTimeout(to);
                // ensure global availability (umd exposes window.jspdf.jsPDF)
                if (typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined') {
                    resolve();
                } else {
                    reject(new Error('PDF libraries loaded but not available'));
                }
            }).catch(err => {
                clearTimeout(to);
                reject(err);
            });
        });
    }

    // Bulk actions
    function getSelectedIds() {
        const root = document.getElementById('usersPage');
        return Array.from(root.querySelectorAll('#usersTable tbody input[type="checkbox"]:checked')).map(cb => cb.getAttribute('data-id'));
    }

    async function applyBulkAction(action) {
        if (!action) return showToast('Select a bulk action', 'info');
        const ids = getSelectedIds();
        if (!ids.length) return showToast('No users selected', 'info');
        if (action === 'export') return exportCSV(ids);
        const confirmMsg = `Apply '${action}' to ${ids.length} users?`;
        showModal('Confirm Bulk Action', `<p>${confirmMsg}</p>`, async () => {
            try {
                await SuperAdminUserAPI.bulk({ action, ids });
                showToast('Bulk action applied', 'success'); loadUsers();
                // unselect all checkbox
                const unselectAll = document.getElementById('selectAllUsers');
                unselectAll.checked = false;
                // root.querySelectorAll('#usersTable tbody input[type="checkbox"]').forEach(cb => cb.checked = false);
            } catch (err) { console.error(err); showToast('Bulk action failed', 'error'); }
        });
    }

    // Export CSV - either ids array or state.lastUsers
    function exportCSV(ids) {
        const rows = [];
        const users = ids && ids.length ? state.lastUsers.filter(u => ids.includes(String(u.user_id))) : state.lastUsers || [];
        if (!users.length) return showToast('No users to export', 'info');
        const headers = ['user_id', 'first_name', 'last_name', 'username', 'email', 'institution_name', 'roles', 'is_active', 'last_login'];
        rows.push(headers.join(','));
        users.forEach(u => {
            const line = [u.user_id, u.first_name, u.last_name, u.username, u.email, (u.institution_name || ''), (u.roles || []).map(r => r.role_name).join('|'), u.is_active ? 1 : 0, u.last_login || ''].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',');
            rows.push(line);
        });
        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `users_export_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }

    // Export to XLSX using SheetJS (if available). Exports same columns as CSV.
    function exportXLSX(ids) {
        const users = ids && ids.length ? state.lastUsers.filter(u => ids.includes(String(u.user_id))) : state.lastUsers || [];
        if (!users.length) return showToast('No users to export', 'info');
        // Build array of objects
        const data = users.map(u => ({
            user_id: u.user_id,
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            username: u.username || '',
            email: u.email || '',
            institution_name: u.institution_name || '',
            roles: (u.roles || []).map(r => r.role_name).join('|'),
            is_active: u.is_active ? 1 : 0,
            last_login: u.last_login || ''
        }));

        if (typeof XLSX === 'undefined') {
            // If SheetJS not loaded, fall back to CSV
            return exportCSV(ids);
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `users_export_${Date.now()}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }

    // Export to PDF using jsPDF + autoTable
    async function exportPDF(ids) {
        const users = ids && ids.length ? state.lastUsers.filter(u => ids.includes(String(u.user_id))) : state.lastUsers || [];
        if (!users.length) return showToast('No users to export', 'info');

        // Build table data
        const headers = ['User', 'Username', 'Email', 'Institution', 'Status', 'Last Login'];
        const rows = users.map(u => [
            ((u.first_name || '') + ' ' + (u.last_name || '')).trim(),
            u.username || '',
            u.email || '',
            u.institution_name || '',
            u.is_active ? 'Active' : 'Inactive',
            u.last_login || ''
        ]);

        // Ensure jsPDF + autoTable are available, try to load dynamically if missing
        try {
            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                showToast('Loading PDF libraries...', 'info');
                await loadPdfLibraries().catch(err => { throw err; });
            }
        } catch (e) {
            console.error('Failed to load PDF libraries', e);
            showToast('PDF export unavailable (failed to load libraries)', 'error');
            return;
        }

        // instantiate jsPDF
        let doc = null;
        try {
            if (window.jspdf && window.jspdf.jsPDF) doc = new window.jspdf.jsPDF();
            else if (window.jsPDF) doc = new window.jsPDF();
        } catch (e) { console.error('Failed to create jsPDF instance', e); }

        if (!doc) { showToast('PDF export unavailable', 'error'); return; }

        // autoTable should be attached by plugin; if not, try to access global plugin
        if (typeof doc.autoTable !== 'function') {
            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                showToast('PDF plugin unavailable', 'error');
                return;
            }
        }

        try {
            doc.autoTable({ head: [headers], body: rows, styles: { fontSize: 9 }, headStyles: { fillColor: [40, 40, 40] }, startY: 14 });
            const title = `Users_export_${Date.now()}.pdf`;
            doc.save(title);
        } catch (e) {
            console.error('PDF export error', e);
            showToast('PDF export failed', 'error');
        }
    }

    // Import CSV
    async function handleImportFile(file) {
        const inputEl = document.getElementById('importFileInput');
        if (!file) {
            if (inputEl) inputEl.value = '';
            return;
        }
        try {
            const name = (file.name || '').toLowerCase();
            // Excel (.xlsx) handling using SheetJS if available - try to load dynamically if missing
            if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
                if (typeof XLSX === 'undefined') {
                    try {
                        showToast('Loading Excel library...', 'info');
                        await loadXlsxLibrary();
                    } catch (e) {
                        console.error('Failed to load XLSX library', e);
                        showToast('Excel import requires XLSX library (failed to load)', 'error');
                        return;
                    } finally {
                        // Clear the file input so the same file can be selected again without refreshing
                        try { if (inputEl) inputEl.value = ''; } catch (e) { /* ignore */ }
                    }
                }
                const reader = new FileReader();
                reader.onload = function (evt) {
                    try {
                        const data = new Uint8Array(evt.target.result);
                        const wb = XLSX.read(data, { type: 'array' });
                        const first = wb.SheetNames[0];
                        const ws = wb.Sheets[first];
                        const csvText = XLSX.utils.sheet_to_csv(ws);
                        const parsed = parseCSVText(csvText);
                        const header = parsed.header;
                        const rows = parsed.rows;
                        const validated = rows.map((r, idx) => ({ index: idx + 1, row: r, errors: validateRow(r) }));
                        const validRows = validated.filter(v => v.errors.length === 0).map(v => v.row);
                        const invalid = validated.filter(v => v.errors.length > 0);

                        if (!validRows.length) {
                            showModal(i18n.import_confirm_title, `<p>${i18n.import_no_rows}</p>`, () => { });
                            return;
                        }

                        // build preview HTML
                        const previewCount = Math.min(10, rows.length);
                        let previewHtml = `<p>${i18n.import_confirm_body.replace('{rows}', rows.length).replace('{valid}', validRows.length).replace('{invalid}', invalid.length)}</p>`;
                        previewHtml += '<div style="max-height:320px;overflow:auto;border:1px solid var(--border-color);padding:0.5rem;margin-top:0.5rem">';
                        previewHtml += '<table style="width:100%;border-collapse:collapse;font-size:0.9rem"><thead><tr>' + header.map(h => `<th style="border-bottom:1px solid var(--border-color);padding:6px;text-align:left">${escapeHtml(h)}</th>`).join('') + '</tr></thead><tbody>';
                        for (let i = 0; i < previewCount; i++) {
                            const r = rows[i];
                            previewHtml += '<tr>' + header.map(h => `<td style="padding:6px;border-bottom:1px dashed var(--border-color)">${escapeHtml(r[h] || '')}</td>`).join('') + '</tr>';
                        }
                        previewHtml += '</tbody></table></div>';

                        // show errors preview (first few)
                        if (invalid.length) {
                            const n = Math.min(5, invalid.length);
                            previewHtml += `<h4 style=\"margin-top:0.5rem\">${i18n.import_errors_heading.replace('{n}', n)}</h4><ul>`;
                            for (let i = 0; i < n; i++) {
                                previewHtml += `<li>Row ${invalid[i].index}: ${escapeHtml(invalid[i].errors.join('; '))}</li>`;
                            }
                            previewHtml += '</ul>';
                        }

                        // Confirm and send parsed JSON to server
                        showModal(i18n.import_confirm_title, previewHtml, async () => {
                            try {
                                await SuperAdminUserAPI.import({ rows: validRows });
                                showToast(i18n.import_started, 'success');
                                loadUsers();
                            } catch (err) { console.error(err); showToast(i18n.import_failed, 'error'); }
                        });

                    } catch (err) { console.error(err); showToast(i18n.import_failed, 'error'); }
                };
                reader.onerror = function () { showToast(i18n.import_failed, 'error'); };
                reader.readAsArrayBuffer(file);
                return;
            }

            // CSV fallback
            const reader = new FileReader();
            reader.onload = function (evt) {
                try {
                    const text = evt.target.result;
                    const parsed = parseCSVText(text);
                    const header = parsed.header;
                    const rows = parsed.rows;
                    const validated = rows.map((r, idx) => ({ index: idx + 1, row: r, errors: validateRow(r) }));
                    const validRows = validated.filter(v => v.errors.length === 0).map(v => v.row);
                    const invalid = validated.filter(v => v.errors.length > 0);

                    if (!validRows.length) {
                        showModal(i18n.import_confirm_title, `<p>${i18n.import_no_rows}</p>`, () => { });
                        return;
                    }

                    // build preview HTML
                    const previewCount = Math.min(10, rows.length);
                    let previewHtml = `<p>${i18n.import_confirm_body.replace('{rows}', rows.length).replace('{valid}', validRows.length).replace('{invalid}', invalid.length)}</p>`;
                    previewHtml += '<div style="max-height:320px;overflow:auto;border:1px solid var(--border-color);padding:0.5rem;margin-top:0.5rem">';
                    previewHtml += '<table style="width:100%;border-collapse:collapse;font-size:0.9rem"><thead><tr>' + header.map(h => `<th style="border-bottom:1px solid var(--border-color);padding:6px;text-align:left">${escapeHtml(h)}</th>`).join('') + '</tr></thead><tbody>';
                    for (let i = 0; i < previewCount; i++) {
                        const r = rows[i];
                        previewHtml += '<tr>' + header.map(h => `<td style="padding:6px;border-bottom:1px dashed var(--border-color)">${escapeHtml(r[h] || '')}</td>`).join('') + '</tr>';
                    }
                    previewHtml += '</tbody></table></div>';

                    // show errors preview (first few)
                    if (invalid.length) {
                        const n = Math.min(5, invalid.length);
                        previewHtml += `<h4 style="margin-top:0.5rem">${i18n.import_errors_heading.replace('{n}', n)}</h4><ul>`;
                        for (let i = 0; i < n; i++) {
                            previewHtml += `<li>Row ${invalid[i].index}: ${escapeHtml(invalid[i].errors.join('; '))}</li>`;
                        }
                        previewHtml += '</ul>';
                    }

                    // Confirm and send parsed JSON to server
                    showModal(i18n.import_confirm_title, previewHtml, async () => {
                        try {
                            await SuperAdminUserAPI.import({ rows: validRows });
                            showToast(i18n.import_started, 'success');
                            loadUsers();
                        } catch (err) { console.error(err); showToast(i18n.import_failed, 'error'); }
                    });

                } catch (err) { console.error(err); showToast(i18n.import_failed, 'error'); }
            };
            reader.onerror = function () { showToast(i18n.import_failed, 'error'); };
            reader.readAsText(file, 'utf-8');
        } catch (err) { console.error(err); showToast(i18n.import_failed, 'error'); }
        finally {
            // Clear the file input so the same file can be selected again without refreshing
            try { if (inputEl) inputEl.value = ''; } catch (e) { /* ignore */ }
        }
    }
    // Role drawer functions
    let currentRoleTarget = null;
    function openRoleDrawerFn(userId) {
        if (_isSuperAdmin) { showToast('You are not allowed to modify roles', 'info'); return; }
        currentRoleTarget = userId;
        const drawer = document.getElementById('roleDrawer');
        const body = document.getElementById('roleDrawerBody');
        body.innerHTML = '<div class="spinner"></div>';
        // render roles list
        const roles = state.rolesList || [];
        // fetch user's current roles
        SuperAdminUserAPI.getById(userId).then(json => {
            const userRoles = (json.data && json.data.roles) ? json.data.roles.map(r => String(r.role_id)) : [];
            body.innerHTML = '';
            roles.forEach(role => {
                const id = `role_chk_${role.role_id}`;
                const wrap = document.createElement('div');
                wrap.innerHTML = `<label style="display:flex;gap:0.5rem;align-items:center;"><input type="checkbox" data-roleid="${role.role_id}" id="${id}" ${userRoles.includes(String(role.role_id)) ? 'checked' : ''}> ${escapeHtml(role.role_name)}</label>`;
                body.appendChild(wrap);
            });
            drawer.classList.add('open');
        }).catch(err => { console.error(err); body.innerHTML = '<p>Failed to load user roles</p>'; drawer.classList.add('open'); });
    }

    function closeRoleDrawerFn() {
        const drawer = document.getElementById('roleDrawer');
        drawer.classList.remove('open');
        currentRoleTarget = null;
    }

    async function saveRolesFromDrawer() {
        if (!currentRoleTarget) return showToast('No user selected', 'info');
        const body = document.getElementById('roleDrawerBody');
        const selected = Array.from(body.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.getAttribute('data-roleid'));
        try {
            await SuperAdminUserAPI.assignRoles(currentRoleTarget, { roles: selected });
            showToast('Roles updated', 'success'); closeRoleDrawerFn(); loadUsers();
        } catch (err) { console.error(err); showToast('Failed to save roles', 'error'); }
    }

    function renderPagination(meta, container) {
        container.innerHTML = '';
        // support multiple pagination key names
        const current = meta.page || meta.current_page || 1;
        const total = meta.total_pages || meta.last_page || 1;
        const info = document.createElement('div'); info.textContent = `Page ${current} / ${total}`;
        container.appendChild(info);
        if (current > 1) { const prev = document.createElement('button'); prev.textContent = 'Prev'; prev.className = 'btn-secondary'; prev.addEventListener('click', () => { state.page = current - 1; loadUsers(); }); container.appendChild(prev); }
        if (current < total) { const next = document.createElement('button'); next.textContent = 'Next'; next.className = 'btn-primary'; next.addEventListener('click', () => { state.page = current + 1; loadUsers(); }); container.appendChild(next); }
    }

    async function openEditUser(id) {
        try {
            const json = await SuperAdminUserAPI.getById(id);
            // Support multiple response shapes for the user object
            const user = (json && (json.data && (json.data.user || json.data))) || json.user || json || {};
            const modalHtml = document.getElementById('usersModal');
            // show modal from template HTML
            showModal('Edit User', modalHtml.innerHTML, async () => {
                // on confirm - read the live modal form, not the template form
                const activeForm = document.getElementById('modalMessage').querySelector('#usersForm');
                if (!activeForm) { showToast('Form not found', 'error'); return; }
                let payload = serializeForm(activeForm);
                const res = validateAndNormalizeUserPayload(payload, { requireUsernameOrEmail: false });
                if (!res.valid) { showToast('Please fix: ' + res.errors.join('; '), 'error'); return; }
                payload = res.payload;
                console.debug('Updating user payload', id, payload);
                try {
                    await SuperAdminUserAPI.update(id, payload);
                    showToast('User updated', 'success'); loadUsers();
                } catch (err) {
                    console.error('Update user error', err);
                    let msg = err.message || 'Update failed';
                    if (err.body) {
                        if (err.body.message) msg = err.body.message;
                        else if (err.body.errors) msg = JSON.stringify(err.body.errors);
                        else msg = JSON.stringify(err.body);
                    }
                    showToast(msg, 'error');
                }
            });

            // After modal rendered, populate the live form fields with user data
            try {
                const activeForm = document.getElementById('modalMessage').querySelector('#usersForm');
                if (activeForm) {
                    activeForm.reset();
                    if (activeForm.elements['first_name']) activeForm.elements['first_name'].value = user.first_name || '';
                    if (activeForm.elements['last_name']) activeForm.elements['last_name'].value = user.last_name || '';
                    if (activeForm.elements['username']) activeForm.elements['username'].value = user.username || '';
                    if (activeForm.elements['email']) activeForm.elements['email'].value = user.email || '';
                    activeForm.dataset.editId = id;
                    console.log(user)
                    // restrict roles in form for super_admin now that form is live
                    restrictFormRoles(activeForm);
                    // set institution select if present (kept from previous logic)
                    const sel = activeForm.querySelector('select[name="institution_id"]');
                    if (sel && user.institution_id) {
                        let opt = sel.querySelector(`option[value="${String(user.institution_id)}"]`);
                        if (!opt) {
                            opt = document.createElement('option');
                            opt.value = String(user.institution_id);
                            opt.textContent = user.institution_name || (`Institution ${user.institution_id}`);
                            opt.dataset.hasAdmin = '1';
                            sel.appendChild(opt);
                        }
                        sel.value = String(user.institution_id);
                    }
                    setupInstitutionNote(activeForm);
                }
            } catch (e) { }
            // after modal rendered, attach institution note and select the user's institution
            try {
                const activeForm = document.getElementById('modalMessage').querySelector('#usersForm');
                if (activeForm) {
                    const sel = activeForm.querySelector('select[name="institution_id"]');
                    if (sel && user.institution_id) {
                        // if option exists set it, otherwise append a fallback option and select it
                        let opt = sel.querySelector(`option[value="${String(user.institution_id)}"]`);
                        if (!opt) {
                            opt = document.createElement('option');
                            opt.value = String(user.institution_id);
                            opt.textContent = user.institution_name || (`Institution ${user.institution_id}`);
                            opt.dataset.hasAdmin = '1';
                            sel.appendChild(opt);
                        }
                        sel.value = String(user.institution_id);
                    }
                    setupInstitutionNote(activeForm);
                }
            } catch (e) { }
        } catch (err) { console.error(err); showToast('Failed to load user', 'error'); }
    }

    function openCreateUserModal() {
        const modalHtml = document.getElementById('usersModal');
        const form = modalHtml.querySelector('#usersForm');
        form.reset(); delete form.dataset.editId;
        // restrict roles in form for super_admin
        restrictFormRoles(form);
        showModal('Create User', modalHtml.innerHTML, async () => {
            // read the live form inside the modal
            const activeForm = document.getElementById('modalMessage').querySelector('#usersForm');
            if (!activeForm) { showToast('Form not found', 'error'); return; }
            let payload = serializeForm(activeForm);
            // normalize and validate
            const res = validateAndNormalizeUserPayload(payload, { requireUsernameOrEmail: true });
            if (!res.valid) { showToast('Please fix: ' + res.errors.join('; '), 'error'); return; }
            payload = res.payload;

            // ensure password exists: generate a temporary one if omitted
            if (!payload.password) {
                const temp = generateTempPassword(12);
                payload.password = temp;
                // try to copy to clipboard, otherwise show modal with password
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    try {
                        await navigator.clipboard.writeText(temp);
                        showToast('Temporary password copied to clipboard', 'info');
                    } catch (e) {
                        showModal('Temporary password', `<p>Temporary password: <strong>${escapeHtml(temp)}</strong></p><p>Please copy it now; it will not be shown again.</p>`, () => { });
                    }
                } else {
                    showModal('Temporary password', `<p>Temporary password: <strong>${escapeHtml(temp)}</strong></p><p>Please copy it now; it will not be shown again.</p>`, () => { });
                }
            }

            // if current user is super_admin, ensure created user is assigned admin role
            if (_isSuperAdmin) {
                const rolesList = state.rolesList || [];
                const adminRole = rolesList.find(r => (r.role_name || '').toLowerCase().includes('admin') || (r.role_slug || '').toLowerCase() === 'admin');
                if (adminRole) payload.roles = [String(adminRole.role_id)];
            }

            console.debug('Creating user payload', payload);
            try {
                await SuperAdminUserAPI.create(payload);
                showToast('User created', 'success'); loadUsers();
            } catch (err) {
                console.error('Create user error', err);
                let msg = err.message || 'Create failed';
                if (err.body) {
                    console.error('Create user response body:', err.body);
                    if (err.body.message) msg = err.body.message;
                    else if (err.body.errors) msg = JSON.stringify(err.body.errors);
                    else msg = JSON.stringify(err.body);
                }
                showToast(msg, 'error');
            }
        });
        try {
            const activeForm = document.getElementById('modalMessage').querySelector('#usersForm');
            setupInstitutionNote(activeForm);
        } catch (e) { }
    }

    function confirmDeleteUser(id) {
        showModal('Confirm Delete', `<p>Are you sure you want to delete this user?</p>`, async () => {
            try {
                await SuperAdminUserAPI.delete(id);
                showToast('User deleted', 'success'); loadUsers();
            } catch (err) { showToast('Delete failed', 'error'); }
        });
    }

    // small helpers
    function serializeForm(form) {
        const obj = {};
        Array.from(form.elements).forEach(el => {
            if (!el.name) return;
            if (el.type === 'checkbox') obj[el.name] = el.checked;
            else if (el.multiple) obj[el.name] = Array.from(el.selectedOptions).map(o => o.value);
            else obj[el.name] = el.value;
        });
        return obj;
    }

    /**
     * Validate and normalize user payload before sending to server.
     * by default requires username or email; pass { requireUsernameOrEmail: false } to relax.
     */
    function validateAndNormalizeUserPayload(input, opts = { requireUsernameOrEmail: true }) {
        const data = Object.assign({}, input);
        const errors = [];
        // trim string fields
        ['first_name', 'last_name', 'username', 'email', 'phone_number', 'phone', 'address', 'date_of_birth', 'password'].forEach(k => {
            if (k in data && typeof data[k] === 'string') data[k] = data[k].trim();
        });

        if (opts.requireUsernameOrEmail) {
            if (!data.username && !data.email) errors.push('Provide username or email');
        }
        if (data.email) {
            if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.push('Invalid email');
        }

        // normalize institution_id
        if ('institution_id' in data) {
            if (data.institution_id === '' || data.institution_id === null || data.institution_id === undefined) data.institution_id = null;
            else {
                const n = Number(data.institution_id);
                data.institution_id = Number.isNaN(n) ? null : n;
            }
        } else {
            data.institution_id = null;
        }

        // normalize is_active
        if ('is_active' in data) {
            const v = String(data.is_active).trim().toLowerCase();
            data.is_active = (['1', 'true', 'yes'].includes(v) ? 1 : 0);
        } else {
            data.is_active = 1;
        }

        // roles -> array of strings
        if (data.roles && !Array.isArray(data.roles)) {
            if (typeof data.roles === 'string') data.roles = [data.roles];
            else try { data.roles = Array.from(data.roles); } catch (e) { data.roles = [String(data.roles)]; }
            data.roles = data.roles.map(r => String(r));
        }

        // convert empty strings to null
        Object.keys(data).forEach(k => { if (typeof data[k] === 'string' && data[k].trim() === '') data[k] = null; });

        return { valid: errors.length === 0, errors, payload: data };
    }

    // generate a temporary password (letters+digits+symbols)
    function generateTempPassword(length = 12) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*()-_=+';
        let out = '';
        const cryptoObj = window.crypto || window.msCrypto;
        if (cryptoObj && cryptoObj.getRandomValues) {
            const arr = new Uint32Array(length);
            cryptoObj.getRandomValues(arr);
            for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
        } else {
            for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
        }
        return out;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
    }

})();
