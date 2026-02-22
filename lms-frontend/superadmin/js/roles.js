(function(){
    document.addEventListener('page:loaded', (e) => { if (e.detail && e.detail.page === 'roles') initRolesPage(); });
    document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('rolesPage')) initRolesPage(); });

    // Load persisted UI prefs (per_page, filter, search)
    const PREF_KEY = 'roles.list.prefs';
    function loadPrefs(){
        try{ const raw = localStorage.getItem(PREF_KEY); if (!raw) return {}; return JSON.parse(raw); }catch(e){ return {}; }
    }
    function savePrefs(p){
        try{ localStorage.setItem(PREF_KEY, JSON.stringify(p || {})); }catch(e){}
    }
    const _prefs = loadPrefs();
    let state = { page: 1, per_page: Number(_prefs.per_page || 20), q: (_prefs.q || ''), roleFilter: (_prefs.roleFilter || ''), lastRoles: [], currentRolePermissions: [] };

    function initRolesPage(){
        const root = document.getElementById('rolesPage'); if (!root) return;
        const search = root.querySelector('#roleSearch');
        const btnCreate = document.getElementById('btnCreateRole');
        const btnExport = document.getElementById('btnExportRoles');
        const btnImport = document.getElementById('btnImportRoles');
        const importInput = document.getElementById('rolesImportInput');

        if (search) { search.value = state.q || ''; search.addEventListener('input', debounce((e)=>{ state.q = e.target.value; state.page = 1; savePrefs({ per_page: state.per_page, roleFilter: state.roleFilter, q: state.q }); loadRoles(); }, 300)); }
        if (btnCreate) btnCreate.addEventListener('click', openCreateModal);
        if (btnExport) btnExport.addEventListener('click', openExportModal);
        if (btnImport && importInput) {
            btnImport.addEventListener('click', () => {
                
                const importHelpHtml = `
                    <p>Upload a CSV/Excel file with the following header columns (header row required):</p>
                    <ul>
                        <li><strong>role_name</strong> (required)</li>
                        <li><strong>description</strong> (optional)</li>
                        <li><strong>permissions</strong> (optional, semicolon or pipe separated list, e.g. <em>users:create;users:delete</em>)</li>
                    </ul>
                    <p>Sample layout:</p>
                    <table class="import-sample-table"><thead><tr><th>role_name</th><th>description</th><th>permissions</th></tr></thead>
                    <tbody><tr><td>teacher</td><td>Course teacher role</td><td>courses:create;courses:grade</td></tr></tbody></table>
                    <p style="margin-top:0.5rem;">Click here to download a sample CSV file: <a href="../assets/files/sample-roles-import.csv" download>sample-roles-import.csv</a></p>
                    <p style="margin-top:0.5rem;">Press Confirm to choose a file and continue to the import preview.</p>
                `;
            showModal('Import Roles', importHelpHtml, () => { importInput && importInput.click(); });
            });
            importInput.addEventListener('change', handleImportFile);
        }

        // Role filter select
        const roleFilterEl = root.querySelector('#roleFilter');
        if (roleFilterEl) {
            roleFilterEl.value = state.roleFilter || '';
            roleFilterEl.addEventListener('change', (e) => { state.roleFilter = e.target.value; state.page = 1; savePrefs({ per_page: state.per_page, roleFilter: state.roleFilter, q: state.q }); loadRoles(); });
        }

        // Per-page selector
        const perPageSelect = document.getElementById('perPageSelect');
        if (perPageSelect) {
            perPageSelect.value = String(state.per_page || 20);
            perPageSelect.addEventListener('change', (e) => { state.per_page = Number(e.target.value || 20); state.page = 1; savePrefs({ per_page: state.per_page, roleFilter: state.roleFilter, q: state.q }); loadRoles(); });
        }

        // Drawer controls
        const drawerClose = document.getElementById('drawerClose');
        if (drawerClose) drawerClose.addEventListener('click', closePermissionsDrawer);
        const btnSavePerms = document.getElementById('btnSavePermissions');
        if (btnSavePerms) btnSavePerms.addEventListener('click', saveRolePermissions);
        const btnAddPerm = document.getElementById('btnAddPermission');
        if (btnAddPerm) btnAddPerm.addEventListener('click', () => openCreatePermission());

        loadRoles();
    }

    async function handleImportFile(e){
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const txt = await new Promise((res, rej) => {
            const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f);
        });
        // Simple CSV parse
        const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
        if (!lines.length) return showToast('Empty file','error');
        const headers = lines[0].split(',').map(h=>h.trim().toLowerCase());
        const rows = lines.slice(1).map(l => {
            const cols = l.split(','); const obj = {};
            headers.forEach((h,i)=> obj[h] = (cols[i]||'').trim()); return obj;
        });

        // Build preview entries with validation (fetch existing roles/permissions)
        const headersForPreview = ['role_name','description','permissions'];
        let existingRoles = [];
        let existingPerms = [];
        try{
            const rr = await RoleAPI.getAll();
            if (Array.isArray(rr)) existingRoles = rr;
            else if (rr && Array.isArray(rr.data)) existingRoles = rr.data;
            else if (rr && rr.data && Array.isArray(rr.data.data)) existingRoles = rr.data.data;
        }catch(e){ /* ignore */ }
        try{
            const pp = await PermissionAPI.getAll();
            if (Array.isArray(pp)) existingPerms = pp;
            else if (pp && Array.isArray(pp.data)) existingPerms = pp.data;
            else if (pp && pp.data && Array.isArray(pp.data.data)) existingPerms = pp.data.data;
        }catch(e){ /* ignore */ }

        const existingRoleNames = new Set((existingRoles || []).map(r => ((r.role_name||r.name||'')+'').toString().toLowerCase()));
        const existingPermNames = new Set((existingPerms || []).map(p => ((p.permission_name||p.name||'')+'').toString().toLowerCase()));

        // count occurrences in file for duplicate-in-file detection
        const nameCounts = {};
        rows.forEach(r => {
            const rn = (r.role_name || r.name || '').toString().trim().toLowerCase();
            if (!rn) return; nameCounts[rn] = (nameCounts[rn] || 0) + 1;
        });

        const entries = rows.map(r => {
            const original = Object.assign({}, r);
            const normalized = {
                role_name: (r.role_name || r.name || '').trim(),
                description: (r.description || '').trim(),
                permissions: (r.permissions || r.permission || '').toString().trim()
            };
            const errors = [];
            const warnings = [];
            const rn = (normalized.role_name || '').toString().toLowerCase();
            if (!normalized.role_name) {
                errors.push('role_name is required');
            } else {
                if (existingRoleNames.has(rn)) {
                    errors.push('role_name already exists');
                }
                if (nameCounts[rn] > 1) {
                    errors.push('duplicate role in file');
                }
            }
            // permissions existence check (warning only)
            const permRaw = normalized.permissions || '';
            if (permRaw) {
                const permNames = permRaw.split(/[;|\\|]/).map(s => s.trim()).filter(Boolean);
                const missing = [];
                for (const pname of permNames) {
                    if (!existingPermNames.has(pname.toLowerCase())) missing.push(pname);
                }
                if (missing.length) warnings.push('missing permissions: ' + missing.join(', '));
            }
            return { originalRow: original, normalized, valid: errors.length === 0, errors, warnings };
        });

        showImportPreview('Import Roles', headersForPreview, entries, async (toImport) => {
            let created = 0, failed = 0;
            try{
                // preload permissions
                let existingPerms = [];
                try{ const p = await PermissionAPI.getAll(); if (Array.isArray(p)) existingPerms = p; else if (p && Array.isArray(p.data)) existingPerms = p.data; }catch(e){}

                for (const r of toImport){
                    const rolePayload = { role_name: r.role_name, description: r.description };
                    try{
                        const newRoleResp = await RoleAPI.create(rolePayload);
                        const newRole = newRoleResp && newRoleResp.data ? newRoleResp.data : newRoleResp;
                        if (!newRole || !newRole.role_id) { failed++; continue; }
                        created++;
                        // assign permissions if present (semicolon or pipe separated)
                        const permRaw = r.permissions || '';
                        if (permRaw) {
                            const permNames = permRaw.split(/[;|\\|]/).map(s=>s.trim()).filter(Boolean);
                            for (const pname of permNames){
                                let perm = existingPerms.find(p=> (p.permission_name||p.name||'').toLowerCase() === pname.toLowerCase());
                                if (!perm){
                                    try{ const createdPermResp = await PermissionAPI.create({ permission_name: pname }); perm = createdPermResp && createdPermResp.data ? createdPermResp.data : createdPermResp; existingPerms.push(perm); }catch(e){ console.warn('Create perm failed', pname, e); }
                                }
                                if (perm && perm.permission_id){
                                    try{ await RoleAPI.assignPermission(newRole.role_id, perm.permission_id); }catch(e){ console.warn('Assign perm failed', e); }
                                }
                            }
                        }
                    }catch(e){ console.error('Create role failed', e); failed++; }
                }
                showToast(`Import complete: ${created} created, ${failed} failed`, 'success');
                loadRoles();
            }catch(e){ console.error(e); showToast('Import failed','error'); }
        });
        // clear input
        e.target.value = '';
    }

    async function loadRoles(){
        const tbody = document.querySelector('#rolesTable tbody'); if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center"><div class="spinner"></div></td></tr>';
        try{
            const res = await RoleAPI.getAll({ q: state.q, page: state.page, per_page: state.per_page });
            let items = [];
            if (Array.isArray(res)) items = res;
            else if (res && Array.isArray(res.data)) items = res.data;
            else if (res && res.data && Array.isArray(res.data.data)) items = res.data.data;

            items = items || [];
            // Client-side filtering when backend doesn't support search/filter params
            const q = (state.q || '').toString().trim().toLowerCase();
            const filter = state.roleFilter || '';
            let filtered = items.slice();
            if (q) {
                filtered = filtered.filter(r => {
                    const name = (r.role_name || r.name || '').toString().toLowerCase();
                    const desc = (r.description || '').toString().toLowerCase();
                    return name.includes(q) || desc.includes(q);
                });
            }
            if (filter === 'has_users') {
                filtered = filtered.filter(r => Number(r.user_count || r.users_count || 0) > 0);
            } else if (filter === 'no_users') {
                filtered = filtered.filter(r => Number(r.user_count || r.users_count || 0) === 0);
            }

            state.lastRoles = filtered;
            renderRoles(state.lastRoles);
        }catch(e){
            console.error('Failed to load roles', e);
            tbody.innerHTML = '<tr><td colspan="5">Failed to load roles</td></tr>';
            showToast && showToast('Failed to load roles', 'error');
        }
    }

    function renderRoles(items){
        const tbody = document.querySelector('#rolesTable tbody'); if (!tbody) return; tbody.innerHTML = '';
        if (!items.length) { tbody.innerHTML = '<tr><td colspan="5">No roles found</td></tr>'; return; }
        items.forEach(r => {
            const tr = document.createElement('tr');
            const roleName = escapeHtml(r.role_name || r.name || '');
            const desc = escapeHtml(r.description || '');
            const users = (typeof r.user_count !== 'undefined' && r.user_count !== null) ? Number(r.user_count) : ((r.users_count) ? Number(r.users_count) : 0);
            let perms = 0;
            if (typeof r.permission_count !== 'undefined' && r.permission_count !== null) {
                perms = Number(r.permission_count);
            } else if (typeof r.permissions !== 'undefined' && r.permissions !== null) {
                if (Array.isArray(r.permissions)) perms = r.permissions.length;
                else if (typeof r.permissions === 'string' && r.permissions.length) perms = r.permissions.split(',').filter(Boolean).length;
            } else if (typeof r.role_permissions_count !== 'undefined' && r.role_permissions_count !== null) {
                perms = Number(r.role_permissions_count);
            }

            tr.innerHTML = `
                <td>${roleName}</td>
                <td>${desc}</td>
                <td>${users}</td>
                <td>${perms}</td>
                                <td>
                                    <button class="btn-icon" data-action="edit" data-id="${r.role_id || r.id || ''}"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon" data-action="perms" data-id="${r.role_id || r.id || ''}"><i class="fas fa-key"></i></button>
                                    <button class="btn-icon" data-action="users" data-id="${r.role_id || r.id || ''}"><i class="fas fa-users"></i></button>
                                    <button class="btn-icon" data-action="delete" data-id="${r.role_id || r.id || ''}"><i class="fas fa-trash"></i></button>
                                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('button[data-action]').forEach(btn => {
            const id = btn.getAttribute('data-id'); const action = btn.getAttribute('data-action');
            btn.addEventListener('click', async () => {
                if (action === 'edit') openEditModal(id);
                    if (action === 'delete') confirmDeleteRole(id);
                    if (action === 'perms') openPermissionsDrawer(id);
                    if (action === 'users') openUsersModal(id);
            });
        });
    }

        async function openUsersModal(roleId){
            // find role name from cached list
            const role = (state.lastRoles || []).find(r => String(r.role_id || r.id) === String(roleId));
            const roleName = role ? (role.role_name || role.name) : null;
            const html = `<div id="roleUsersContainer"><div class="spinner"></div></div>`;
            showModal('Users in role' + (roleName ? `: ${escapeHtml(roleName)}` : ''), html, () => {});

            try{
                let users = [];
                // Prefer role-specific endpoint if available
                try{
                    const rres = await RoleAPI.getUsers(roleId);
                    if (Array.isArray(rres)) users = rres;
                    else if (rres && Array.isArray(rres.data)) users = rres.data;
                    else if (rres && rres.data && Array.isArray(rres.data.data)) users = rres.data.data;
                }catch(err){
                    // fallback to best-effort UserAPI filter
                    if (roleName) {
                        const res = await UserAPI.getAll({ role: roleName, per_page: 200 });
                        if (res && Array.isArray(res)) users = res;
                        else if (res && res.data && Array.isArray(res.data)) users = res.data;
                        else if (res && res.data && res.data.data && Array.isArray(res.data.data)) users = res.data.data;
                    }
                }

                const container = document.getElementById('modalMessage');
                const holder = container ? container.querySelector('#roleUsersContainer') : null;
                if (!holder) return;

                if (!users.length) {
                    holder.innerHTML = '<p>No users found for this role (or server does not support role filtering).</p>';
                    return;
                }

                const table = document.createElement('table'); table.className = 'table';
                table.innerHTML = `<thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Active</th></tr></thead>`;
                const tb = document.createElement('tbody');
                users.forEach(u => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${escapeHtml((u.first_name||'') + ' ' + (u.last_name||''))}</td><td>${escapeHtml(u.username||'')}</td><td>${escapeHtml(u.email||'')}</td><td>${u.is_active? 'Yes':'No'}</td>`;
                    tb.appendChild(tr);
                });
                table.appendChild(tb);
                holder.innerHTML = '';
                holder.appendChild(table);

            }catch(e){
                const holder = document.getElementById('modalMessage')?.querySelector('#roleUsersContainer');
                if (holder) holder.innerHTML = '<p>Failed to load users for this role.</p>';
                console.error('Failed to load role users', e);
            }
        }

    function openCreateModal(){
        const tpl = document.getElementById('rolesModal'); if (!tpl) return;
        showModal('Create Role', tpl.innerHTML, async () => {
            const formEl = document.getElementById('modalMessage').querySelector('#roleForm'); if (!formEl) return showToast('Form missing','error');
            const payload = serializeForm(formEl);
            if (!payload.role_name || !payload.role_name.trim()) return showToast('Name required','error');
            try{
                await RoleAPI.create(payload);
                showToast('Role created','success');
                loadRoles();
            }catch(e){ console.error(e); showToast('Failed to create role','error'); }
        });
    }

    async function openEditModal(id){
        try{
            const res = await RoleAPI.getById(id);
            let role = res && res.data ? res.data : res;
            if (!role) role = res;
            const tpl = document.getElementById('rolesModal'); if (!tpl) return;
            showModal('Edit Role', tpl.innerHTML, async () => {
                const formEl = document.getElementById('modalMessage').querySelector('#roleForm'); if (!formEl) return showToast('Form missing','error');
                const payload = serializeForm(formEl);
                if (!payload.role_name || !payload.role_name.trim()) return showToast('Name required','error');
                try{
                    await RoleAPI.update(id, payload);
                    showToast('Role updated','success');
                    loadRoles();
                }catch(e){ console.error(e); showToast('Failed to update role','error'); }
            });

            // populate form
            try{
                const form = document.getElementById('modalMessage').querySelector('#roleForm');
                if (form){ form.reset(); if (form.elements['role_name']) form.elements['role_name'].value = role.role_name || ''; if (form.elements['description']) form.elements['description'].value = role.description || ''; }
            }catch(e){}
        }catch(e){ console.error(e); showToast('Failed to load role','error'); }
    }

    function confirmDeleteRole(id){
        showModal('Confirm Delete', '<p>Are you sure you want to delete this role?</p>', async () => {
            try{ await RoleAPI.delete(id); showToast('Role deleted','success'); loadRoles(); }catch(e){ console.error(e); showToast('Failed to delete role','error'); }
        });
    }

    // Permissions drawer
    let activeRoleId = null;
    async function openPermissionsDrawer(roleId){
        activeRoleId = roleId;
        const drawer = document.getElementById('permissionsDrawer'); if (!drawer) return;
        const title = document.getElementById('drawerTitle'); if (title) title.textContent = 'Role Permissions';
        drawer.style.display = 'block';

        try{
            const [allPermsResp, rolePermsResp] = await Promise.all([PermissionAPI.getAll(), RoleAPI.getPermissions(roleId)]);
            let allPerms = [];
            if (Array.isArray(allPermsResp)) allPerms = allPermsResp;
            else if (allPermsResp && Array.isArray(allPermsResp.data)) allPerms = allPermsResp.data;
            let rolePerms = [];
            if (Array.isArray(rolePermsResp)) rolePerms = rolePermsResp;
            else if (rolePermsResp && Array.isArray(rolePermsResp.data)) rolePerms = rolePermsResp.data;

            state.currentRolePermissions = (rolePerms || []).map(p => p.permission_id || p.id);
            // keep a master list for client-side searching
            state.availablePermissions = allPerms || [];

            // initial render (unfiltered)
            renderPermissionsList(state.availablePermissions);

            // wire permission search input for client-side filtering
            const permSearchEl = document.getElementById('permSearch');
            if (permSearchEl) {
                permSearchEl.value = '';
                permSearchEl.oninput = debounce((e) => {
                    const q = (e.target.value || '').toString().trim().toLowerCase();
                    if (!q) {
                        renderPermissionsList(state.availablePermissions);
                        return;
                    }
                    const filtered = (state.availablePermissions || []).filter(p => {
                        const name = (p.permission_name || p.name || '').toString().toLowerCase();
                        const desc = (p.description || '').toString().toLowerCase();
                        return name.includes(q) || desc.includes(q);
                    });
                    renderPermissionsList(filtered);
                }, 200);
            }
        }catch(e){ console.error(e); showToast('Failed to load permissions','error'); }
    }

    function closePermissionsDrawer(){
        const drawer = document.getElementById('permissionsDrawer'); if (!drawer) return; drawer.style.display = 'none'; activeRoleId = null; state.currentRolePermissions = [];
        state.availablePermissions = [];
        const permSearchEl = document.getElementById('permSearch'); if (permSearchEl) permSearchEl.oninput = null; permSearchEl && (permSearchEl.value = '');
    }

    function renderPermissionsList(perms){
        const list = document.getElementById('permissionsList'); if (!list) return; list.innerHTML = '';
        perms.forEach(p => {
            const pid = p.permission_id || p.id;
            const name = p.permission_name || p.name || '';
            const desc = p.description || '';
            const checked = state.currentRolePermissions.indexOf(pid) !== -1;
            const el = document.createElement('div'); el.className = 'perm-row';
            el.innerHTML = `<label><input type="checkbox" data-id="${pid}" ${checked ? 'checked' : ''}/> <strong>${escapeHtml(name)}</strong> <small>${escapeHtml(desc)}</small></label>`;
            list.appendChild(el);
        });
    }

    async function saveRolePermissions(){
        if (!activeRoleId) return showToast('No role selected','error');
        const list = document.getElementById('permissionsList'); if (!list) return;
        const checked = Array.from(list.querySelectorAll('input[type=checkbox]:checked')).map(ch => Number(ch.getAttribute('data-id')));
        const desired = checked;
        const current = state.currentRolePermissions || [];
        // compute additions and removals
        const toAdd = desired.filter(d => current.indexOf(d) === -1);
        const toRemove = current.filter(c => desired.indexOf(c) === -1);
        let added = 0, removed = 0;
        for (const pid of toAdd){
            try{ await RoleAPI.assignPermission(activeRoleId, pid); added++; }catch(e){ console.warn('Assign failed', e); }
        }
        for (const pid of toRemove){
            try{ await RoleAPI.removePermission(activeRoleId, pid); removed++; }catch(e){ console.warn('Remove failed', e); }
        }
        showToast(`Permissions updated: +${added} -${removed}`, 'success');
        closePermissionsDrawer();
        // Refresh roles table so counts reflect changes
        try{ await loadRoles(); }catch(e){ console.warn('Failed to refresh roles after permission update', e); }
    }

    // utility: create permission quick flow
    function openCreatePermission(){
        const html = `<form id="createPermForm"><div class="form-row"><label>Name (resource:action)</label><input name="permission_name" required/></div><div class="form-row"><label>Description</label><textarea name="description"></textarea></div></form>`;
        showModal('Create Permission', html, async () => {
            const form = document.getElementById('modalMessage').querySelector('#createPermForm'); if (!form) return;
            const p = serializeForm(form);
            try{ await PermissionAPI.create(p); showToast('Permission created','success'); // reload list if drawer open
                if (activeRoleId) openPermissionsDrawer(activeRoleId);
            }catch(e){ console.error(e); showToast('Failed to create permission','error'); }
        });
    }

    function exportRolesCSV(){
        const items = state.lastRoles || [];
        if (!items.length) return showToast('No roles to export','info');
        const headers = ['role_name','description','user_count'];
        const rows = [headers.join(',')];
        items.forEach(r => {
            const line = [r.role_name || '', r.description || '', r.user_count || 0].map(s => `"${String(s||'').replace(/"/g,'""')}"`).join(',');
            rows.push(line);
        });
        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `roles_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }

    // Dynamic script loader (small helper copied from institutions.js)
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src; s.async = true; s.onload = () => resolve(src); s.onerror = (e) => reject(e); document.head.appendChild(s);
        });
    }

    // Try multiple script sources in order, resolving when the first successfully loads
    async function loadFirstAvailable(sources) {
        if (!Array.isArray(sources)) sources = [sources];
        let lastErr = null;
        for (const src of sources) {
            try { await loadScript(src); return src; } catch (e) { lastErr = e; }
        }
        throw lastErr || new Error('No script sources available');
    }

    function exportXLSX() {
        // Try loading SheetJS (xlsx) dynamically and export; fallback to CSV
        const local = '/assets/vendor/xlsx/xlsx.full.min.js';
        const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        loadFirstAvailable([local, cdn]).then(() => {
            try {
                const data = (state.lastRoles || []).map(r => ({ role_name: r.role_name || r.name || '', description: r.description || '', user_count: r.user_count || r.users_count || 0, permission_count: r.permission_count || 0 }));
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Roles');
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbout], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `roles_${Date.now()}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            } catch (e) {
                console.error('XLSX export failed', e);
                showToast('XLSX export failed, falling back to CSV', 'warn');
                exportRolesCSV();
            }
        }).catch((err) => {
            console.warn('Failed to load xlsx lib', err);
            showToast('XLSX library unavailable, exporting CSV', 'info');
            exportRolesCSV();
        });
    }

    function exportPDF() {
        const jspdfLocal = '/assets/vendor/jspdf/jspdf.umd.min.js';
        const autoTableLocal = '/assets/vendor/autotable/jspdf.plugin.autotable.min.js';
        const jspdfCdn = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        const autoTableCdn = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';

        Promise.all([loadFirstAvailable([jspdfLocal, jspdfCdn]), loadFirstAvailable([autoTableLocal, autoTableCdn])]).then(() => {
            try {
                let jsPDFClass = null;
                if (window.jspdf) jsPDFClass = window.jspdf.jsPDF || window.jspdf.default || window.jspdf;
                if (!jsPDFClass && globalThis.jspdf) jsPDFClass = globalThis.jspdf.jsPDF || globalThis.jspdf.default || globalThis.jspdf;
                if (!jsPDFClass && window.jsPDF) jsPDFClass = window.jsPDF;
                if (!jsPDFClass && globalThis.jsPDF) jsPDFClass = globalThis.jsPDF;
                if (!jsPDFClass) throw new Error('jsPDF not found after loading script');

                const cols = ['Role','Description','#Users','#Permissions'];
                const rows = (state.lastRoles || []).map(r => [r.role_name || r.name || '', r.description || '', r.user_count || r.users_count || 0, r.permission_count || (r.permissions ? (Array.isArray(r.permissions)? r.permissions.length : (r.permissions.toString().split(',').filter(Boolean).length)) : 0)]);

                const doc = new jsPDFClass({ unit: 'pt', format: 'a4', orientation: 'landscape' });
                const title = 'Roles';
                const subtitle = `${new Date().toLocaleString()} — ${rows.length} rows`;
                const startY = drawPdfHeader(doc, title, subtitle);

                const margin = 40;
                const pageWidth = (doc.internal.pageSize.getWidth && doc.internal.pageSize.getWidth()) || doc.internal.pageSize.width;
                const usable = pageWidth - margin * 2;
                // percentage allocation for 4 columns
                const pct = [25, 45, 15, 15];
                const rawWidths = pct.map(p => (p / 100) * usable);
                const colWidths = rawWidths.map(w => Math.round(w));
                const sumWidths = colWidths.reduce((a,b)=>a+b,0);
                if (sumWidths !== usable) colWidths[colWidths.length -1] += (usable - sumWidths);

                if (typeof doc.autoTable === 'function') {
                    const columnStyles = {};
                    colWidths.forEach((w, idx) => { columnStyles[idx] = { cellWidth: w }; });
                    try {
                        doc.autoTable({
                            head: [cols],
                            body: rows,
                            startY: startY,
                            margin: { left: margin, right: margin },
                            tableWidth: usable,
                            styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
                            columnStyles: columnStyles,
                            headStyles: { fillColor: [33,150,243], textColor: [255,255,255], fontStyle: 'bold' },
                            willDrawCell: function (data) {
                                try {
                                    if (data.section === 'body') {
                                        const rowIndex = data.row.index;
                                        const isOddRow = (rowIndex % 2) === 0;
                                        const rgb = isOddRow ? [243,243,243] : [255,255,255];
                                        const x = data.row.cells[0].x || data.cell.x;
                                        const y = data.cell.y;
                                        let fullW = 0; try { for (const k in data.row.cells) fullW += data.row.cells[k].width || 0; } catch (e) { fullW = data.cell.width; }
                                        const h = data.cell.height;
                                        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
                                        doc.rect(x, y - 10, fullW, h, 'F');
                                    }
                                } catch (e) {}
                            }
                        });
                    } catch (atErr) {
                        console.warn('autoTable failed, falling back to manual renderer', atErr);
                        manualPdfTable(doc, cols, rows, startY, colWidths);
                    }
                } else {
                    manualPdfTable(doc, cols, rows, startY, colWidths);
                }

                const name = `roles_${Date.now()}.pdf`;
                if (typeof doc.save === 'function') doc.save(name);
                else if (typeof doc.output === 'function') { const blob = doc.output('blob'); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
                else throw new Error('Could not save PDF: unsupported jsPDF API');
            } catch (e) {
                console.error('PDF export failed', e);
                showToast('PDF export failed, falling back to CSV', 'warn');
                exportRolesCSV();
            }
        }).catch((err) => {
            console.warn('Failed to load PDF libs', err);
            showToast('PDF libraries unavailable, exporting CSV', 'info');
            exportRolesCSV();
        });
    }

    // Draw a simple PDF header: title centered, subtitle (date/count) and a divider line.
    // Returns the Y coordinate (in pts) where the table should start.
    function drawPdfHeader(doc, title, subtitle) {
        const pageWidth = (doc.internal.pageSize.getWidth && doc.internal.pageSize.getWidth()) || doc.internal.pageSize.width;
        const margin = 40; let y = 40;
        doc.setFontSize(16);
        try { doc.setFont(undefined, 'bold'); } catch (e) {}
        const titleX = pageWidth / 2;
        doc.text(title, titleX, y, { align: 'center' });
        y += 20;
        doc.setFontSize(10);
        try { doc.setFont(undefined, 'normal'); } catch (e) {}
        doc.text(subtitle, margin, y);
        y += 12;
        doc.setLineWidth(0.5);
        doc.line(margin, y - 2, pageWidth - margin, y);
        y += 12;
        return y;
    }

    // Manual PDF table drawing fallback when autoTable is unavailable
    function manualPdfTable(doc, headers, rows, startY = 40, colWidths = null) {
        const pageWidth = (doc.internal.pageSize.getWidth && doc.internal.pageSize.getWidth()) || doc.internal.pageSize.width;
        const pageHeight = (doc.internal.pageSize.getHeight && doc.internal.pageSize.getHeight()) || doc.internal.pageSize.height;
        const margin = 40; const colCount = headers.length; const usableWidth = pageWidth - margin * 2;
        let computedColWidths = [];
        if (Array.isArray(colWidths) && colWidths.length === colCount) { computedColWidths = colWidths.slice(); } else { const w = Math.floor(usableWidth / colCount); for (let i=0;i<colCount;i++) computedColWidths.push(w); }
        const startX = margin; let y = startY; const lineHeight = 12;
        doc.setFontSize(10); try { doc.setFont(undefined, 'bold'); } catch (e) {}
        const headerLines = [];
        for (let c=0;c<headers.length;c++){ const tx = String(headers[c]||'').trim(); const cw = Math.max(10,(computedColWidths[c]||Math.floor(usableWidth/colCount))-4); const wrapped = (typeof doc.splitTextToSize === 'function') ? doc.splitTextToSize(tx, cw) : [tx.slice(0,30)]; headerLines.push(wrapped); }
        const headerRowLines = Math.max(...headerLines.map(l=>l.length)); const headerHeight = headerRowLines * lineHeight + 6; const totalWidth = computedColWidths.reduce((a,b)=>a+b,0);
        try { doc.setFillColor(33,150,243); doc.rect(startX, y - 10, totalWidth, headerHeight, 'F'); doc.setTextColor(255,255,255); } catch (e) {}
        for (let lineIdx=0; lineIdx<headerRowLines; lineIdx++){ for (let c=0;c<headers.length;c++){ const parts = headerLines[c]; const text = parts[lineIdx]||''; let x = startX; for (let k=0;k<c;k++) x += (computedColWidths[k]||0); doc.text(text, x + 6, y + lineIdx * lineHeight); } }
        try { doc.setTextColor(0,0,0); } catch (e) {}
        y += headerRowLines * lineHeight + 6; try { doc.setFont(undefined, 'normal'); } catch (e) {}
        for (let r=0;r<rows.length;r++){ const row = rows[r]; const cellLines = []; let maxLines = 0; for (let c=0;c<headers.length;c++){ let cell = String(row[c]||''); const cw = Math.max(10,(computedColWidths[c]||Math.floor(usableWidth/colCount))-4); const parts = (typeof doc.splitTextToSize === 'function') ? doc.splitTextToSize(cell, cw) : [cell]; cellLines.push(parts); if (parts.length > maxLines) maxLines = parts.length; }
            const rowHeight = maxLines * lineHeight + 6;
            // page break
            if (y + rowHeight > pageHeight - 40) { doc.addPage(); y = 40; }
            // alternating row background
            try { const isOdd = (r % 2) === 0; 
                const rgb = isOdd ? [243,243,243] : [255,255,255]; 
                doc.setFillColor(rgb[0], rgb[1], rgb[2]); 
                doc.rect(startX, y - 6, totalWidth, rowHeight, 'F'); } catch (e) {}
            for (let c=0;c<headers.length;c++){ const parts = cellLines[c]; let x = startX; for (let k=0;k<c;k++) x += (computedColWidths[k]||0); for (let li=0; li<parts.length; li++){ doc.text(parts[li]||'', x + 6, y + li * lineHeight); } }
            y += rowHeight;
        }
    }

    function openExportModal(){
        const tpl = document.getElementById('exportModal'); if (!tpl) return;
        showModal('Export Roles', tpl.innerHTML, () => {});

        // wire the export buttons inside modal
        setTimeout(() => {
            const container = document.getElementById('modalMessage'); if (!container) return;
            const modalEl = container;
            modalEl.querySelectorAll('button[data-type]').forEach(btn => {
                const type = btn.getAttribute('data-type');
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (type === 'csv') {
                        exportRolesCSV();
                    } else if (type === 'xlsx') {
                        exportXLSX();
                    } else if (type === 'pdf') {
                        exportPDF();
                    }
                });
            });
        }, 50);
    }

    // small helpers
    // Show import preview modal. `entries` is array of { originalRow, normalized, valid, errors }
    function showImportPreview(title, headers, entries, onConfirm) {
        const maxPreview = 200;
        const previewRows = entries.slice(0, maxPreview);
        const cols = headers.slice();
        cols.push('Import Status');

        let html = `<div style="max-height:60vh;overflow:auto"><table class="import-preview-table"><thead><tr>`;
        cols.forEach(c => { html += `<th>${escapeHtml(String(c))}</th>`; });
        html += `</tr></thead><tbody>`;

        previewRows.forEach(e => {
            html += '<tr>';
            headers.forEach(h => {
                const val = (e.originalRow && (h in e.originalRow)) ? e.originalRow[h] : (e.normalized && e.normalized[h]) || '';
                html += `<td>${escapeHtml(String(val || ''))}</td>`;
            });
            let status = e.valid ? 'Valid' : `Invalid: ${escapeHtml(String((e.errors || []).join('; ')))}`;
            if (e.warnings && e.warnings.length) status += ` (Warnings: ${escapeHtml(String(e.warnings.join('; ')))})`;
            html += `<td>${escapeHtml(status)}</td>`;
            html += '</tr>';
        });

        html += `</tbody></table></div>`;
        html += `<p>Showing ${previewRows.length} of ${entries.length} rows. ${entries.length - previewRows.length > 0 ? 'Only first ' + maxPreview + ' shown.' : ''}</p>`;
        html += `<p>Only rows marked <strong>Valid</strong> will be imported. Invalid rows will be skipped.</p>`;

        showModal(title, html, async () => {
            const toImport = entries.filter(e => e.valid).map(e => e.normalized);
            if (!toImport.length) { showToast('No valid rows to import', 'info'); return; }
            try { await onConfirm(toImport); } catch (e) { console.error('Import operation failed', e); showToast('Import operation failed', 'error'); }
        });
    }

    function debounce(fn, ms){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); }; }
    function serializeForm(form){ const obj = {}; Array.from(form.elements).forEach(el => { if (!el.name) return; if (el.type === 'checkbox') { obj[el.name] = el.checked ? (el.value || '1') : 0; return; } obj[el.name] = el.value; }); return obj; }
    function escapeHtml(s){ if (typeof window.escapeHtml === 'function') return window.escapeHtml(s); return String(s||'').replace(/[&<>\"]+/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

})();
