(function () {
    let state = { page: 1, per_page: 10, q: '', importPreviewEntries: [], importHeaders: [] };

    document.addEventListener('page:loaded', (e) => { if (e.detail && e.detail.page === 'institutions') initInstitutionsPage(); });
    document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('institutionsPage')) initInstitutionsPage(); });

    function initInstitutionsPage() {
        const root = document.getElementById('institutionsPage');
        if (!root) return;
        const search = root.querySelector('#instSearch');
        const suggestions = root.querySelector('#instSuggestions');
        const perPage = root.querySelector('#perPageSelect');
        const filterStatus = root.querySelector('#filterStatus');
        const filterHasAdmin = root.querySelector('#filterHasAdmin');
        const filterType = root.querySelector('#filterType');
        // combo-box for type (enhanced typeahead)
        let filterTypeCombo = null;
        const importInput = root.querySelector('#importFileInput');
        const btnImport = root.querySelector('#btnImport');
        const btnExport = root.querySelector('#btnExport');
        const tableBody = root.querySelector('#institutionsTable tbody');
        const pagination = root.querySelector('#institutionsPagination');
        const btnCreate = root.querySelector('#btnCreateInstitution');

        // load per-page from storage
        try { const sp = Number(localStorage.getItem('institutions.per_page')); if (sp && Number.isInteger(sp)) state.per_page = sp; } catch (e) {}
        if (perPage) perPage.value = String(state.per_page || 10);

        // filters
        if (filterStatus) filterStatus.addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; loadInstitutions(); });
        if (filterHasAdmin) filterHasAdmin.addEventListener('change', (e) => { state.has_admin = e.target.value; state.page = 1; loadInstitutions(); });
        if (filterType) {
            // If the filterType is a <select>, enhance it with a combo-box (input + datalist)
            try {
                // create a datalist for type suggestions
                let typeDatalist = document.getElementById('instTypeSuggestions');
                if (!typeDatalist) {
                    typeDatalist = document.createElement('datalist');
                    typeDatalist.id = 'instTypeSuggestions';
                    filterType.parentNode && filterType.parentNode.insertBefore(typeDatalist, filterType.nextSibling);
                }

                // create an input to act as combo-box and hide original select
                filterTypeCombo = document.createElement('input');
                filterTypeCombo.type = 'text';
                filterTypeCombo.id = 'filterTypeCombo';
                filterTypeCombo.setAttribute('list', 'instTypeSuggestions');
                filterTypeCombo.placeholder = 'Type or select institution type';
                filterTypeCombo.className = filterType.className || '';
                filterType.style.display = 'none';
                filterType.parentNode && filterType.parentNode.insertBefore(filterTypeCombo, typeDatalist);

                // initialize combo from select's current value
                const initialType = filterType.value || '';
                filterTypeCombo.value = initialType;
                if (initialType) state.type = initialType;

                // on input, debounce fetching suggestions and update local state
                let typeTimer = null;
                filterTypeCombo.addEventListener('input', (ev) => {
                    clearTimeout(typeTimer);
                    const q = ev.target.value || '';
                    typeTimer = setTimeout(() => {
                        fetchTypeSuggestions(q);
                    }, 200);
                });

                // when user confirms selection (change), apply filter and reload
                filterTypeCombo.addEventListener('change', (ev) => {
                    state.type = ev.target.value || '';
                    state.page = 1;
                    loadInstitutions();
                });

                // populate initial suggestions from page load
                populateTypeSuggestions([]);
            } catch (e) {
                // fallback to native select behavior
                filterType.addEventListener('change', (e) => { state.type = e.target.value; state.page = 1; loadInstitutions(); });
            }
        }
        if (btnImport && importInput) btnImport.addEventListener('click', openImportModal);
        if (importInput) importInput.addEventListener('change', (ev) => handleImportFile(ev.target.files[0]));
        const importDropZone = document.getElementById('institutionImportDropZone');
        const importConfirmBtn = document.getElementById('institutionImportConfirmBtn');
        const importCancelBtn = document.getElementById('institutionImportCancelBtn');
        const importModalClose = document.getElementById('institutionImportModalClose');
        const importModalOverlay = document.getElementById('institutionImportModalOverlay');
        const importTemplateBtn = document.getElementById('institutionImportTemplateBtn');
        if (importDropZone && importInput) {
            importDropZone.addEventListener('click', () => importInput.click());
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((evt) => {
                importDropZone.addEventListener(evt, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            importDropZone.addEventListener('dragover', () => importDropZone.classList.add('dragover'));
            importDropZone.addEventListener('dragleave', () => importDropZone.classList.remove('dragover'));
            importDropZone.addEventListener('drop', (e) => {
                importDropZone.classList.remove('dragover');
                const files = e.dataTransfer && e.dataTransfer.files;
                if (files && files[0]) handleImportFile(files[0]);
            });
        }
        if (importConfirmBtn) importConfirmBtn.addEventListener('click', confirmImportInstitutions);
        if (importCancelBtn) importCancelBtn.addEventListener('click', closeImportModal);
        if (importModalClose) importModalClose.addEventListener('click', closeImportModal);
        if (importTemplateBtn) importTemplateBtn.addEventListener('click', downloadInstitutionTemplate);
        if (importModalOverlay) {
            importModalOverlay.addEventListener('click', function (e) {
                if (e.target === this) closeImportModal();
            });
        }
        if (btnExport) btnExport.addEventListener('click', openExportModal);
        let debounce;
        if (search) {
            search.addEventListener('input', (ev) => { clearTimeout(debounce); debounce = setTimeout(() => { state.q = ev.target.value; state.page = 1; loadInstitutions(); }, 300); fetchSuggestionsDebounced(ev.target.value); });
            // also trigger search when user selects from datalist (change)
            search.addEventListener('change', (ev) => { state.q = ev.target.value; state.page = 1; loadInstitutions(); });
        }
        if (perPage) perPage.addEventListener('change', (e) => { state.per_page = Number(e.target.value) || 10; try { localStorage.setItem('institutions.per_page', String(state.per_page)); } catch (_) {} state.page = 1; loadInstitutions(); });
        if (btnCreate) btnCreate.addEventListener('click', openCreateModal);

        loadInstitutions();
    }

    // Populate datalist for institution types from items or keep empty
    function populateTypeSuggestions(items) {
        try {
            const dl = document.getElementById('instTypeSuggestions');
            if (!dl) return;
            dl.innerHTML = '';
            const seen = new Set();
            // extract types from provided items
            (items || state.lastInstitutions || []).forEach(i => {
                const t = (i.institution_type || i.type || '').trim();
                if (t && !seen.has(t)) { seen.add(t); const opt = document.createElement('option'); opt.value = t; dl.appendChild(opt); }
            });
        } catch (e) { /* ignore */ }
    }

    // Fetch type suggestions from server by retrieving institutions and extracting types
    async function fetchTypeSuggestions(q) {
        try {
            q = (q || '').trim();
            // request institutions matching query to get type values; limit to 100
            const res = await InstitutionAPI.getAll({ q: q || '', include_all: 1, limit: 100 });
            let items = [];
            if (res && Array.isArray(res.data)) items = res.data;
            else if (res && Array.isArray(res)) items = res;
            else if (res && res.data && Array.isArray(res.data.data)) items = res.data.data;

            populateTypeSuggestions(items);
        } catch (e) { /* ignore */ }
    }

    async function loadInstitutions() {
        const root = document.getElementById('institutionsPage'); if (!root) return;
        const tbody = root.querySelector('#institutionsTable tbody'); const pagination = root.querySelector('#institutionsPagination');
        tbody.innerHTML = '<tr><td colspan="10" style="height:80px;display:flex;align-items:center;justify-content:center"><div class="spinner"></div></td></tr>';

        const params = { page: state.page, per_page: state.per_page };
        // backend expects `limit` param for per-page size, include it for compatibility
        params.limit = Number(state.per_page) || 10;
        // ask backend to include admin counts or related data so we can display Has Admin correctly
        params.include_all = 1;
        params.include_admins = 1;
        if (state.q) params.q = state.q;
        if (state.status) params.status = state.status;
        if (state.has_admin) params.has_admin = state.has_admin;
        if (state.type) params.type = state.type;
        try {
            const res = await InstitutionAPI.getAll(params);
            let items = [];
            let meta = {};
            if (Array.isArray(res.data)) items = res.data;
            else if (res.data && Array.isArray(res.data.data)) items = res.data.data;
            else if (Array.isArray(res)) items = res;
            else if (res.data && Array.isArray(res.data.institutions)) items = res.data.institutions;

            if (res.pagination) meta = res.pagination;
            else if (res.data && res.data.pagination) meta = res.data.pagination;
            else if (res.data && res.data.meta) meta = res.data.meta;

            state.lastInstitutions = items || [];
            renderInstitutions(state.lastInstitutions, tbody);
            populateSuggestions(state.lastInstitutions);
            populateTypeSuggestions(state.lastInstitutions);
            renderPagination(meta || {}, pagination);
        } catch (err) {
            console.error('Failed loading institutions', err);
            tbody.innerHTML = '<tr><td colspan="10">Failed to load institutions</td></tr>';
            showToast('Failed to load institutions', 'error');
        }
    }

    function renderInstitutions(items, tbody) {
        tbody.innerHTML = '';
        if (!items.length) { tbody.innerHTML = '<tr><td colspan="10">No institutions found</td></tr>'; return; }
        items.forEach(i => {
            const id = i.uuid || i.institution_uuid || i.institution_id || i.id || '';
            const code = i.code || i.institution_code || '';
            const name = i.institution_name || i.name || '';
            const type = i.type || i.institution_type || '';
            const email = i.email || '';
            const phone = i.phone || i.telephone || '';
            const address = i.address || '';
            const website = i.website || i.url || '';
            const isActive = (i.is_active || i.active || i.status === 'active');
            const status = isActive ? 'Active' : 'Inactive';
            const hasAdmin = (i.has_admin || i.hasAdmin || (i.admin_count && Number(i.admin_count) > 0)) ? 'Yes' : 'No';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(String(code))}</td>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(type)}</td>
                <td> <a href="mailto:${escapeHtml(email)}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(email)}</a> </td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(address)}</td>
                <td> <a href="${escapeHtml(website)}" target="_blank" style="color: #2563eb; text-decoration: underline;">${escapeHtml(website)}</a> </td>
                <td>${escapeHtml(status)}</td>
                <td>${escapeHtml(hasAdmin)}</td>
                <td>
                    <button class="btn-icon" data-action="view-stats" data-id="${id}" data-institution-id="${i.institution_id || i.id || ''}" data-name="${escapeHtml(name)}" title="View Details"><i class="fas fa-chart-line"></i></button>
                    <button class="btn-icon" data-action="toggle-status" data-id="${id}" data-name="${escapeHtml(name)}" data-active="${isActive ? '1' : '0'}" title="${isActive ? 'Deactivate Institution' : 'Activate Institution'}"><i class="fas ${isActive ? 'fa-toggle-on' : 'fa-toggle-off'}"></i></button>
                    <button class="btn-icon" data-action="subscriptions" data-id="${id}" data-institution-id="${i.institution_id || i.id || ''}" data-name="${escapeHtml(name)}" title="Manage Subscription"><i class="fas fa-credit-card"></i></button>
                    <button class="btn-icon" data-action="assign-admin" data-id="${id}" data-institution-id="${i.institution_id || i.id || ''}" data-name="${escapeHtml(name)}" title="Assign Admin"><i class="fas fa-user-plus"></i></button>
                    <button class="btn-icon" data-action="edit" data-id="${id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" data-action="delete" data-id="${id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('button[data-action]').forEach(btn => {
            const id = btn.getAttribute('data-id'); const action = btn.getAttribute('data-action');
            btn.addEventListener('click', () => {
                if (action === 'edit') openEditModal(id);
                if (action === 'delete') confirmDeleteInstitution(id);
                if (action === 'view-stats') openInstitutionDashboard(id, btn.getAttribute('data-name') || 'Institution', btn.getAttribute('data-institution-id'));
                if (action === 'toggle-status') toggleInstitutionStatus(id, btn.getAttribute('data-active') === '1', btn.getAttribute('data-name') || 'Institution');
                if (action === 'subscriptions') openSubscriptionPanel(btn.getAttribute('data-institution-id'), btn.getAttribute('data-name') || 'Institution');
                if (action === 'assign-admin') openAdminAssignment(btn.getAttribute('data-institution-id'), btn.getAttribute('data-name') || 'Institution');
            });
        });
    }

    function populateSuggestions(items) {
        try {
            const dl = document.getElementById('instSuggestions');
            if (!dl) return;
            // Collect unique names and codes
            const seen = new Set();
            dl.innerHTML = '';
            (items || []).forEach(i => {
                const name = (i.institution_name || i.name || '').trim();
                const code = (i.institution_code || i.code || '').trim();
                if (name && !seen.has(name)) { seen.add(name); const opt = document.createElement('option'); opt.value = name; dl.appendChild(opt); }
                if (code && !seen.has(code)) { seen.add(code); const opt = document.createElement('option'); opt.value = code; dl.appendChild(opt); }
            });
        } catch (e) { /* ignore */ }
    }

    // Server-backed suggestion fetch (debounced)
    let suggestTimer = null;
    function fetchSuggestionsDebounced(q) {
        if (suggestTimer) clearTimeout(suggestTimer);
        suggestTimer = setTimeout(() => fetchSuggestions(q), 250);
    }

    async function fetchSuggestions(q) {
        try {
            q = (q || '').trim();
            if (!q || q.length < 2) return;
            const res = await InstitutionAPI.getAll({ q, include_all: 1, limit: 25 });
            let items = [];
            if (res && Array.isArray(res.data)) items = res.data;
            else if (res && Array.isArray(res)) items = res;
            else if (res && res.data && Array.isArray(res.data.data)) items = res.data.data;

            const dl = document.getElementById('instSuggestions');
            if (!dl) return;
            dl.innerHTML = '';
            const seen = new Set();
            items.forEach(i => {
                const name = (i.institution_name || i.name || '').trim();
                const code = (i.institution_code || i.code || '').trim();
                if (name && !seen.has(name)) { seen.add(name); const opt = document.createElement('option'); opt.value = name; dl.appendChild(opt); }
                if (code && !seen.has(code)) { seen.add(code); const opt = document.createElement('option'); opt.value = code; dl.appendChild(opt); }
            });
        } catch (e) { /* ignore */ }
    }

    function renderPagination(meta, container) {
        container.innerHTML = '';
        const current = meta.page || meta.current_page || 1;
        const total = meta.total_pages || meta.last_page || 1;
        const info = document.createElement('div'); info.textContent = `Page ${current} / ${total}`;
        container.appendChild(info);
        if (current > 1) { const prev = document.createElement('button'); prev.textContent = 'Prev'; prev.className = 'btn-secondary'; prev.addEventListener('click', () => { state.page = current - 1; loadInstitutions(); }); container.appendChild(prev); }
        if (current < total) { const next = document.createElement('button'); next.textContent = 'Next'; next.className = 'btn-primary'; next.addEventListener('click', () => { state.page = current + 1; loadInstitutions(); }); container.appendChild(next); }
    }

    function openCreateModal() {
        const tpl = document.getElementById('institutionsModal'); if (!tpl) return;
        const html = tpl.innerHTML;
        showModal('Create Institution', html, async () => {
            const activeForm = document.getElementById('modalMessage').querySelector('#institutionForm'); if (!activeForm) { showToast('Form not found', 'error'); return; }
            let payload = serializeForm(activeForm);
            if (!payload.institution_name || !payload.institution_name.trim()) { showToast('Name is required', 'error'); return; }
            if (!payload.institution_code || !payload.institution_code.trim()) { showToast('Code is required', 'error'); return; }
            const norm = normalizeInstitutionPayload(payload);
            if (!norm.valid) { showToast('Please fix: ' + norm.errors.join('; '), 'error'); return; }
            payload = norm.payload;
            try { await InstitutionAPI.create(payload); showToast('Institution created', 'success'); SuperadminActivityAPI.log({ activity_type: 'institution_created', description: `Created institution: ${payload.institution_name}`, entity_type: 'institution', severity: 'info' }).catch(() => {}); loadInstitutions(); } catch (err) { console.error(err); showToast(err?.message || 'Failed to create institution', 'error'); }
        });
    }

    async function openEditModal(id) {
        try {
            const res = await InstitutionAPI.getById(id);
            let inst = res.data || res;
            if (inst.data) inst = inst.data;
            const tpl = document.getElementById('institutionsModal'); if (!tpl) return;
            showModal('Edit Institution', tpl.innerHTML, async () => {
                const activeForm = document.getElementById('modalMessage').querySelector('#institutionForm'); if (!activeForm) { showToast('Form not found', 'error'); return; }
                let payload = serializeForm(activeForm);
                if (!payload.institution_name || !payload.institution_name.trim()) { showToast('Name is required', 'error'); return; }
                const norm = normalizeInstitutionPayload(payload);
                if (!norm.valid) { showToast('Please fix: ' + norm.errors.join('; '), 'error'); return; }
                payload = norm.payload;
                try { await InstitutionAPI.update(id, payload); showToast('Institution updated', 'success'); SuperadminActivityAPI.log({ activity_type: 'institution_updated', description: `Updated institution: ${payload.institution_name}`, entity_type: 'institution', entity_id: id, severity: 'info' }).catch(() => {}); loadInstitutions(); } catch (err) { console.error(err); showToast(err?.message || 'Failed to update institution', 'error'); }
            });

            // populate live form
            try {
                const activeForm = document.getElementById('modalMessage').querySelector('#institutionForm');
                if (activeForm) {
                    activeForm.reset();
                    if (activeForm.elements['institution_name']) activeForm.elements['institution_name'].value = inst.institution_name || inst.name || '';
                    if (activeForm.elements['institution_code']) activeForm.elements['institution_code'].value = inst.institution_code || inst.code || '';
                    if (activeForm.elements['institution_type']) activeForm.elements['institution_type'].value = inst.institution_type || inst.type || '';
                    if (activeForm.elements['address']) activeForm.elements['address'].value = inst.address || '';
                    if (activeForm.elements['city']) activeForm.elements['city'].value = inst.city || '';
                    if (activeForm.elements['state']) activeForm.elements['state'].value = inst.state || '';
                    if (activeForm.elements['country']) activeForm.elements['country'].value = inst.country || '';
                    if (activeForm.elements['postal_code']) activeForm.elements['postal_code'].value = inst.postal_code || '';
                    if (activeForm.elements['phone']) activeForm.elements['phone'].value = inst.phone || inst.telephone || '';
                    if (activeForm.elements['email']) activeForm.elements['email'].value = inst.email || '';
                    if (activeForm.elements['website']) activeForm.elements['website'].value = inst.website || inst.url || '';
                    if (activeForm.elements['max_students']) activeForm.elements['max_students'].value = inst.max_students || '';
                    if (activeForm.elements['max_teachers']) activeForm.elements['max_teachers'].value = inst.max_teachers || '';
                    if (activeForm.elements['status']) activeForm.elements['status'].value = inst.status || (inst.is_active ? 'active' : 'inactive');
                    activeForm.dataset.editId = id;
                }
            } catch (e) { /* ignore */ }
        } catch (err) { console.error('Failed to load institution', err); showToast('Failed to load institution', 'error'); }
    }

    function confirmDeleteInstitution(id) {
        showModal('Confirm Delete', `<p>Are you sure you want to delete this institution?</p>`, async () => {
            try { await InstitutionAPI.delete(id); showToast('Institution deleted', 'success'); SuperadminActivityAPI.log({ activity_type: 'institution_deleted', description: `Deleted institution #${id}`, entity_type: 'institution', entity_id: id, severity: 'warning' }).catch(() => {}); loadInstitutions(); } catch (err) { console.error(err); showToast('Failed to delete institution', 'error'); }
        });
    }

    function openInstitutionDashboard(uuid, name, institutionId) {
        try {
            localStorage.setItem('superadmin.institutions.selectedUuid', String(uuid || ''));
            localStorage.setItem('superadmin.institutions.selectedInstitutionId', String(institutionId || ''));
            localStorage.setItem('superadmin.institutions.selectedName', String(name || 'Institution'));
        } catch (_) {}

        window.location.hash = '#institution-details';
    }

    function toggleInstitutionStatus(id, currentlyActive, name) {
        const nextStatus = currentlyActive ? 'inactive' : 'active';
        const actionLabel = currentlyActive ? 'Deactivate' : 'Activate';

        showModal(
            `${actionLabel} Institution`,
            `<p>${actionLabel} <strong>${escapeHtml(name)}</strong>?</p>`,
            async () => {
                try {
                    await InstitutionAPI.updateStatus(id, { status: nextStatus });
                    showToast(`Institution ${nextStatus}`, 'success');
                    SuperadminActivityAPI.log({
                        activity_type: 'institution_status_updated',
                        description: `${actionLabel}d institution: ${name}`,
                        entity_type: 'institution',
                        entity_id: id,
                        severity: 'info',
                    }).catch(() => {});
                    loadInstitutions();
                } catch (err) {
                    console.error('Failed to update institution status', err);
                    showToast('Failed to update institution status', 'error');
                }
            },
        );
    }

    async function openSubscriptionPanel(institutionId, name) {
        if (!institutionId) {
            showToast('Institution identifier not available', 'error');
            return;
        }

        try {
            let status = null;

            try {
                const statusRes = await InstitutionAPI.getSubscriptionStatus(institutionId);
                status = (statusRes && (statusRes.data || statusRes)) || null;
            } catch (err) {
                status = null;
            }

            const planValue = status?.subscription_plan || status?.plan_name || status?.plan || 'None';
            const endDateValue = status?.subscription_expires_at || status?.end_date || status?.expires_at || 'N/A';

            const html = `
                <p style="margin:0 0 0.75rem 0;color:#334155;"><strong>${escapeHtml(name)}</strong></p>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.6rem;">
                    <div style="padding:0.75rem;border:1px solid var(--border-color);border-radius:8px;background:#fff;">
                        <div style="font-size:0.8rem;color:#64748b;">Status</div>
                        <div style="font-size:1rem;font-weight:600;">${escapeHtml(String(status?.status || 'Not Active'))}</div>
                    </div>
                    <div style="padding:0.75rem;border:1px solid var(--border-color);border-radius:8px;background:#fff;">
                        <div style="font-size:0.8rem;color:#64748b;">Plan</div>
                        <div style="font-size:1rem;font-weight:600;">${escapeHtml(String(planValue))}</div>
                    </div>
                    <div style="padding:0.75rem;border:1px solid var(--border-color);border-radius:8px;background:#fff;">
                        <div style="font-size:0.8rem;color:#64748b;">Ends On</div>
                        <div style="font-size:1rem;font-weight:600;">${escapeHtml(String(endDateValue))}</div>
                    </div>
                </div>
                <p style="margin:0.75rem 0 0 0;color:#64748b;font-size:0.85rem;">Use the subscriptions API page to renew, update, or cancel this subscription.</p>
            `;

            showModal('Subscription Management', html, () => {});
        } catch (err) {
            console.error('Failed to load subscription details', err);
            showToast('Failed to load subscription details', 'error');
        }
    }

    function openAdminAssignment(institutionId, name) {
        if (!institutionId) {
            showToast('Institution identifier not available', 'error');
            return;
        }

        try {
            localStorage.setItem('superadmin.users.prefillInstitutionId', String(institutionId));
            localStorage.setItem('superadmin.users.autoOpenCreateAdmin', '1');
        } catch (_) {}

        showToast(`Assign admin for ${name}: opening User Management`, 'info');
        window.location.hash = '#users';
    }

    function openExportModal() {
        const tpl = document.getElementById('exportModal'); if (!tpl) return;
        const html = tpl.innerHTML;
        showModal('Export Options', html, () => { });
        // attach handlers to modal buttons
        setTimeout(() => {
            const modal = document.getElementById('modalMessage');
            if (!modal) return;
            modal.querySelectorAll('button[data-type]').forEach(b => {
                b.addEventListener('click', (ev) => {
                    const t = b.getAttribute('data-type');
                    if (t === 'csv') exportCSV();
                    else if (t === 'xlsx') exportXLSX();
                    else if (t === 'pdf') exportPDF();
                    // close modal
                    const closeBtn = document.getElementById('modalCloseBtn'); if (closeBtn) closeBtn.click();
                });
            });
        }, 50);
    }

    function openImportModal() {
        state.importPreviewEntries = [];
        state.importHeaders = [];
        const overlay = document.getElementById('institutionImportModalOverlay');
        const preview = document.getElementById('institutionImportPreview');
        const confirmBtn = document.getElementById('institutionImportConfirmBtn');
        const inputEl = document.getElementById('importFileInput');
        if (inputEl) inputEl.value = '';
        if (preview) {
            preview.style.display = 'none';
            preview.innerHTML = '';
        }
        if (confirmBtn) confirmBtn.disabled = true;
        if (overlay) overlay.classList.add('open');
    }

    function closeImportModal() {
        const overlay = document.getElementById('institutionImportModalOverlay');
        const inputEl = document.getElementById('importFileInput');
        if (inputEl) inputEl.value = '';
        if (overlay) overlay.classList.remove('open');
    }

    function renderImportPreview(fileName, headers, entries) {
        const preview = document.getElementById('institutionImportPreview');
        const confirmBtn = document.getElementById('institutionImportConfirmBtn');
        if (!preview) return;

        const maxPreview = 40;
        const rows = entries.slice(0, maxPreview);
        const validCount = entries.filter((e) => e.valid).length;
        const invalidCount = entries.length - validCount;

        let html = '';
        html += '<div style="margin-bottom:0.5rem;"><strong>File:</strong> ' + escapeHtml(fileName) + '</div>';
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;">' +
            '<span style="background:#dcfce7;color:#15803d;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;">Valid: ' + validCount + '</span>' +
            '<span style="background:#fee2e2;color:#b91c1c;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;">Invalid: ' + invalidCount + '</span>' +
            '<span style="background:#e2e8f0;color:#334155;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;">Total: ' + entries.length + '</span>' +
            '</div>';

        html += '<div style="max-height:260px;overflow:auto;border:1px solid #e2e8f0;border-radius:8px;">';
        html += '<table style="width:100%;border-collapse:collapse;font-size:0.78rem;">';
        html += '<thead style="position:sticky;top:0;background:#f8fafc;"><tr>';
        headers.forEach((h) => { html += '<th style="padding:0.5rem;border-bottom:1px solid #e2e8f0;text-align:left;">' + escapeHtml(String(h)) + '</th>'; });
        html += '<th style="padding:0.5rem;border-bottom:1px solid #e2e8f0;text-align:left;">Import Status</th>';
        html += '</tr></thead><tbody>';

        rows.forEach((entry) => {
            html += '<tr>';
            headers.forEach((h) => {
                const val = entry.originalRow && (h in entry.originalRow) ? entry.originalRow[h] : '';
                html += '<td style="padding:0.45rem;border-bottom:1px solid #f1f5f9;">' + escapeHtml(String(val || '')) + '</td>';
            });
            const status = entry.valid
                ? '<span style="color:#15803d;font-weight:600;">Valid</span>'
                : '<span style="color:#b91c1c;font-weight:600;">Invalid: ' + escapeHtml(String((entry.errors || []).join('; '))) + '</span>';
            html += '<td style="padding:0.45rem;border-bottom:1px solid #f1f5f9;">' + status + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        html += '<p style="margin:0.5rem 0 0;color:#64748b;font-size:0.8rem;">Showing ' + rows.length + ' of ' + entries.length + ' row(s). Only valid rows will be imported.</p>';

        preview.innerHTML = html;
        preview.style.display = 'block';
        if (confirmBtn) confirmBtn.disabled = validCount === 0;
    }

    async function confirmImportInstitutions() {
        const confirmBtn = document.getElementById('institutionImportConfirmBtn');
        const validRows = (state.importPreviewEntries || []).filter((e) => e.valid).map((e) => e.normalized);
        if (!validRows.length) {
            showToast('No valid rows to import', 'info');
            return;
        }
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Importing...';
        }
        try {
            await performImport(validRows);
            closeImportModal();
            loadInstitutions();
        } catch (e) {
            console.error('Import failed', e);
            showToast('Import operation failed', 'error');
        } finally {
            if (confirmBtn) {
                confirmBtn.textContent = 'Import';
                confirmBtn.disabled = false;
            }
        }
    }

    // Simple CSV export
    function exportCSV() {
        const users = state.lastInstitutions || [];
        if (!users.length) return showToast('No institutions to export', 'info');
        const headers = ['institution_code','institution_name','institution_type','address','phone','email','website','status','has_admin'];
        const rows = [headers.join(',')];
        users.forEach(i => {
            const code = i.institution_code || i.code || '';
            const name = i.institution_name || i.name || '';
            const type = i.institution_type || i.type || '';
            const address = i.address || '';
            const phone = i.phone || i.telephone || '';
            const email = i.email || '';
            const website = i.website || i.url || '';
            const status = (i.is_active || i.active || i.status === 'active') ? 'active' : 'inactive';
            const hasAdmin = (i.has_admin || i.hasAdmin || (i.admin_count && Number(i.admin_count) > 0)) ? 'yes' : 'no';
            const line = [code,name,type,address,phone,email,website,status,hasAdmin].map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',');
            rows.push(line);
        });
        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `institutions_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }

    function downloadInstitutionTemplate() {
        const rows = [
            ['institution_code', 'institution_name', 'institution_type', 'email', 'phone', 'address', 'website', 'status'],
            ['CEN-001', 'Central School', 'private', 'info@central.edu', '+233123456789', 'Accra, Greater Accra', 'https://central.edu.gh', 'active'],
            ['PUB-002', 'Community Academy', 'public', 'office@community.edu', '+233201112233', 'Kumasi, Ashanti', 'https://community.edu.gh', 'inactive'],
        ];
        const csv = rows
            .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'institutions_template.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function exportXLSX() {
        // Try loading SheetJS (xlsx) dynamically and export; fallback to CSV
        const local = '/assets/vendor/xlsx/xlsx.full.min.js';
        const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        loadFirstAvailable([local, cdn]).then(() => {
            try {
                const data = (state.lastInstitutions || []).map(i => ({
                    institution_code: i.institution_code || i.code || '',
                    institution_name: i.institution_name || i.name || '',
                    institution_type: i.institution_type || i.type || '',
                    address: i.address || '',
                    phone: i.phone || i.telephone || '',
                    email: i.email || '',
                    website: i.website || i.url || '',
                    status: (i.is_active || i.active || i.status === 'active') ? 'active' : 'inactive',
                    has_admin: (i.has_admin || i.hasAdmin || (i.admin_count && Number(i.admin_count) > 0)) ? 'yes' : 'no'
                }));

                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Institutions');
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbout], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `institutions_${Date.now()}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            } catch (e) {
                console.error('XLSX export failed', e);
                showToast('XLSX export failed, falling back to CSV', 'warn');
                exportCSV();
            }
        }).catch((err) => {
            console.warn('Failed to load xlsx lib', err);
            showToast('XLSX library unavailable, exporting CSV', 'info');
            exportCSV();
        });
    }

    function exportPDF() {
        const items = state.lastInstitutions || [];
        if (!items.length) {
            showToast('No institutions to export', 'info');
            return;
        }

        showToast('Preparing PDF...', 'info');

        const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const esc = function (v) {
            return String(v == null ? '-' : v)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const statusBadge = function (active) {
            const colors = active
                ? 'color:#15803d;background:#dcfce7'
                : 'color:#64748b;background:#f1f5f9';
            return '<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;' + colors + '">' + (active ? 'Active' : 'Inactive') + '</span>';
        };

        const adminBadge = function (hasAdmin) {
            const colors = hasAdmin
                ? 'color:#1d4ed8;background:#dbeafe'
                : 'color:#64748b;background:#f1f5f9';
            return '<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;' + colors + '">' + (hasAdmin ? 'Yes' : 'No') + '</span>';
        };

        const filters = [];
        if (state.q) filters.push('Search: "' + state.q + '"');
        if (state.status) filters.push('Status: ' + state.status);
        if (state.has_admin) filters.push('Has Admin: ' + state.has_admin);
        if (state.type) filters.push('Type: ' + state.type);
        const filterLabel = filters.join(' | ');

        const tableRows = items.map(function (i, idx) {
            const code = i.institution_code || i.code || '-';
            const name = i.institution_name || i.name || '-';
            const type = i.institution_type || i.type || '-';
            const email = i.email || '-';
            const phone = i.phone || i.telephone || '-';
            const website = i.website || i.url || '-';
            const isActive = (i.is_active || i.active || i.status === 'active');
            const hasAdmin = (i.has_admin || i.hasAdmin || (i.admin_count && Number(i.admin_count) > 0));

            return '<tr style="background:' + (idx % 2 === 0 ? '#fff' : '#f8fafc') + '">' +
                '<td>' + (idx + 1) + '</td>' +
                '<td style="font-family:monospace;font-size:11px">' + esc(code) + '</td>' +
                '<td><strong>' + esc(name) + '</strong></td>' +
                '<td>' + esc(type) + '</td>' +
                '<td>' + esc(email) + '</td>' +
                '<td>' + esc(phone) + '</td>' +
                '<td>' + esc(website) + '</td>' +
                '<td>' + statusBadge(isActive) + '</td>' +
                '<td>' + adminBadge(hasAdmin) + '</td>' +
                '</tr>';
        }).join('');

        const html = '<!DOCTYPE html>\n' +
            '<html lang="en">\n<head>\n<meta charset="UTF-8">\n' +
            '<title>Institutions Export - ' + date + '</title>\n' +
            '<style>\n' +
            '  * { box-sizing: border-box; margin: 0; padding: 0; }\n' +
            '  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 24px; }\n' +
            '  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #006a3f; padding-bottom: 12px; }\n' +
            '  .header h1 { font-size: 18px; color: #006a3f; }\n' +
            '  .meta { text-align: right; color: #64748b; font-size: 11px; line-height: 1.6; }\n' +
            '  .filter-bar { font-size: 11px; color: #64748b; margin-bottom: 12px; }\n' +
            '  table { width: 100%; border-collapse: collapse; }\n' +
            '  th { background: #006a3f; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }\n' +
            '  td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }\n' +
            '  .footer { margin-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }\n' +
            '  @media print { body { padding: 0; } @page { margin: 15mm; size: A4 landscape; } button { display: none !important; } }\n' +
            '</style>\n</head>\n<body>\n' +
            '  <div class="header">\n' +
            '    <div>\n' +
            '      <h1>Institution Report</h1>\n' +
            '      <p style="color:#64748b;margin-top:2px">Total: <strong>' + items.length + '</strong> institution' + (items.length !== 1 ? 's' : '') + '</p>\n' +
            '    </div>\n' +
            '    <div class="meta">\n' +
            '      <div>Exported: ' + date + '</div>\n' +
            '      <button onclick="window.print()" style="margin-top:6px;padding:4px 12px;background:#006a3f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px">Print / Save PDF</button>\n' +
            '    </div>\n' +
            '  </div>\n' +
            (filterLabel ? '  <div class="filter-bar">Filters: ' + esc(filterLabel) + '</div>\n' : '') +
            '  <table>\n    <thead>\n      <tr>\n' +
            '        <th>#</th><th>Code</th><th>Name</th><th>Type</th><th>Email</th><th>Phone</th><th>Website</th><th>Status</th><th>Has Admin</th>\n' +
            '      </tr>\n    </thead>\n    <tbody>' + tableRows + '</tbody>\n  </table>\n' +
            '  <div class="footer">Generated by LMS - ' + date + '</div>\n</body>\n</html>';

        const win = window.open('', '_blank', 'width=1200,height=750');
        if (!win) {
            showToast('Allow pop-ups to export PDF', 'warning');
            return;
        }

        win.document.write(html);
        win.document.close();
        win.focus();
        showToast('PDF ready - ' + items.length + ' institution' + (items.length !== 1 ? 's' : ''), 'success');
    }

    // Dynamic script loader
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = (e) => reject(e);
            document.head.appendChild(s);
        });
    }

    // Try multiple script sources in order, resolving when the first successfully loads
    async function loadFirstAvailable(sources) {
        if (!Array.isArray(sources)) sources = [sources];
        let lastErr = null;
        for (const src of sources) {
            try {
                await loadScript(src);
                return src;
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr || new Error('No script sources available');
    }

    // Manual PDF table drawing fallback when autoTable is unavailable
    // startY: position (in pts) to begin drawing the table (below header)
    // colWidths: optional array of numeric widths per column (in pts)
    function manualPdfTable(doc, headers, rows, startY = 40, colWidths = null) {
        const pageWidth = (doc.internal.pageSize.getWidth && doc.internal.pageSize.getWidth()) || doc.internal.pageSize.width;
        const pageHeight = (doc.internal.pageSize.getHeight && doc.internal.pageSize.getHeight()) || doc.internal.pageSize.height;
        const margin = 40;
        const colCount = headers.length;
        const usableWidth = pageWidth - margin * 2;
        // if colWidths provided, use them; otherwise compute equal widths
        let computedColWidths = [];
        if (Array.isArray(colWidths) && colWidths.length === colCount) {
            computedColWidths = colWidths.slice();
        } else {
            const w = Math.floor(usableWidth / colCount);
            for (let i = 0; i < colCount; i++) computedColWidths.push(w);
        }
        const startX = margin;
        let y = startY;
        const lineHeight = 12;

        doc.setFontSize(10);
        try { doc.setFont(undefined, 'bold'); } catch (e) {}
        // draw header cells (allow wrapping if header long)
        const headerLines = [];
        for (let c = 0; c < headers.length; c++) {
            const tx = String(headers[c] || '').trim();
            const cw = Math.max(10, (computedColWidths[c] || Math.floor(usableWidth / colCount)) - 4);
            const wrapped = (typeof doc.splitTextToSize === 'function') ? doc.splitTextToSize(tx, cw) : [tx.slice(0, 30)];
            headerLines.push(wrapped);
        }
        // header row height
        const headerRowLines = Math.max(...headerLines.map(l => l.length));
        // draw header background rectangle
        const headerHeight = headerRowLines * lineHeight + 6;
        const totalWidth = computedColWidths.reduce((a,b) => a + b, 0);
        try {
            // fill header background (blue) and set header text color to white
            doc.setFillColor(33,150,243);
            doc.rect(startX, y - 10, totalWidth, headerHeight, 'F');
            doc.setTextColor(255,255,255);
        } catch (e) { /* ignore if methods not available */ }

        // draw header text lines
        for (let lineIdx = 0; lineIdx < headerRowLines; lineIdx++) {
            for (let c = 0; c < headers.length; c++) {
                const parts = headerLines[c];
                const text = parts[lineIdx] || '';
                // compute x offset by summing previous column widths
                let x = startX;
                for (let k = 0; k < c; k++) x += (computedColWidths[k] || 0);
                doc.text(text, x + 6, y + lineIdx * lineHeight);
            }
        }
        // reset text color to default (black)
        try { doc.setTextColor(0,0,0); } catch (e) {}
        y += headerRowLines * lineHeight + 6;
        try { doc.setFont(undefined, 'normal'); } catch (e) {}

        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            // compute wrapped lines for each cell
            const cellLines = [];
            let maxLines = 0;
            for (let c = 0; c < headers.length; c++) {
                let cell = String(row[c] || '');
                // split into lines that fit column
                const cw = Math.max(10, (computedColWidths[c] || Math.floor(usableWidth / colCount)) - 4);
                const parts = (typeof doc.splitTextToSize === 'function') ? doc.splitTextToSize(cell, cw) : [cell];
                cellLines.push(parts);
                if (parts.length > maxLines) maxLines = parts.length;
            }

            const rowHeight = maxLines * lineHeight + 4;
            if (y + rowHeight > pageHeight - margin) {
                doc.addPage();
                // redraw header on new page and reset y
                y = drawPdfHeader(doc, 'Institutions (cont.)', new Date().toLocaleString() + ' — cont.');
            }

            // draw alternating row background (odd rows light gray, even rows white)
            const isOddRow = (r % 2) === 0; // 0-based
            try {
                const rgb = isOddRow ? [243,243,243] : [255,255,255];
                doc.setFillColor(rgb[0], rgb[1], rgb[2]);
                doc.rect(startX, y, totalWidth, rowHeight + 20, 'F');
            } catch (e) { /* ignore */ }

            for (let c = 0; c < headers.length; c++) {
                const parts = cellLines[c];
                // compute x offset for this column
                let x = startX;
                for (let k = 0; k < c; k++) x += (computedColWidths[k] || 0);
                for (let li = 0; li < parts.length; li++) {
                    const text = parts[li] || '';
                    doc.text(text, x + 2, y + li * lineHeight);
                }
            }
            y += rowHeight;
        }
    }

    // Draw a simple PDF header: title centered, subtitle (date/count) and a divider line.
    // Returns the Y coordinate (in pts) where the table should start.
    function drawPdfHeader(doc, title, subtitle) {
        const pageWidth = (doc.internal.pageSize.getWidth && doc.internal.pageSize.getWidth()) || doc.internal.pageSize.width;
        const margin = 40;
        let y = 40;
        // Title
        doc.setFontSize(16);
        try { doc.setFont(undefined, 'bold'); } catch (e) {}
        const titleX = pageWidth / 2;
        doc.text(title, titleX, y, { align: 'center' });
        y += 20;
        // Subtitle (date and count) left-aligned
        doc.setFontSize(10);
        try { doc.setFont(undefined, 'normal'); } catch (e) {}
        doc.text(subtitle, margin, y);
        // optional right-side small note (could be app name)
        // doc.text('Super Admin Export', pageWidth - margin, y, { align: 'right' });
        y += 12;
        // divider
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 12;
        return y;
    }

    // Show import preview modal. `entries` is array of { raw, normalized, valid, errors }
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
                const val = (e.originalRow && (h in e.originalRow)) ? e.originalRow[h] : (e.raw && e.raw[h]) || '';
                html += `<td>${escapeHtml(String(val || ''))}</td>`;
            });
            const status = e.valid ? 'Valid' : `Invalid: ${escapeHtml(String((e.errors || []).join('; ')))}`;
            html += `<td>${escapeHtml(status)}</td>`;
            html += '</tr>';
        });

        html += `</tbody></table></div>`;
        html += `<p>Showing ${previewRows.length} of ${entries.length} rows. ${entries.length - previewRows.length > 0 ? 'Only first ' + maxPreview + ' shown.' : ''}</p>`;
        html += `<p>Only rows marked <strong>Valid</strong> will be imported. Invalid rows will be skipped.</p>`;

        showModal(title, html, async () => {
            // On confirm: filter valid entries and pass to onConfirm
            const toImport = entries.filter(e => e.valid).map(e => e.normalized);
            if (!toImport.length) { showToast('No valid rows to import', 'info'); return; }
            try {
                await onConfirm(toImport);
            } catch (e) {
                console.error('Import operation failed', e);
                showToast('Import operation failed', 'error');
            }
        });
    }

    // Perform the actual import of normalized payloads
    async function performImport(payloads) {
        let created = 0; let failed = 0;
        for (const p of payloads) {
            try {
                await InstitutionAPI.create(p);
                created++;
            } catch (e) {
                failed++;
            }
        }
        showToast(`Import complete: ${created} created, ${failed} failed`, 'success');
    }

    // Import CSV (very small/robust implementation)
    function handleImportFile(file) {
        const inputEl = document.getElementById('importFileInput');
        if (!file) { if (inputEl) inputEl.value = ''; return; }
        const name = (file.name || '').toLowerCase();

        // CSV import
        if (name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = async function (evt) {
                try {
                    const text = evt.target.result;
                    const parsed = parseCSVText(text);
                    const header = parsed.header.map(h => h.trim());
                    const rows = parsed.rows;
                    if (!rows.length) { showToast('No rows found in CSV', 'info'); if (inputEl) inputEl.value = ''; return; }

                    // Normalize headers and build preview entries with validation
                    const originalHeader = header.slice();
                    const normalizedKeys = header.map(h => canonicalize(h));
                    const previewEntries = rows.map(r => {
                        const originalRow = {};
                        const normalizedRow = {};
                        for (let j = 0; j < originalHeader.length; j++) {
                            const orig = originalHeader[j];
                            const val = r[orig] || r[orig.toLowerCase()] || '';
                            originalRow[orig] = val;
                            normalizedRow[normalizedKeys[j]] = val;
                        }
                        const norm = normalizeInstitutionPayload(normalizedRow);
                        return { originalRow, normalized: norm.payload, valid: norm.valid, errors: norm.errors };
                    });

                    state.importHeaders = originalHeader;
                    state.importPreviewEntries = previewEntries;
                    renderImportPreview(file.name || 'institutions.csv', originalHeader, previewEntries);

                } catch (e) { console.error(e); showToast('Import failed', 'error'); }
                finally { if (inputEl) inputEl.value = ''; }
            };
            reader.onerror = function () { if (inputEl) inputEl.value = ''; showToast('Import failed', 'error'); };
            reader.readAsText(file, 'utf-8');
            return;
        }

        // XLSX/XLS import using SheetJS
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            const local = '/assets/vendor/xlsx/xlsx.full.min.js';
            const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            loadFirstAvailable([local, cdn]).then(() => {
                const reader = new FileReader();
                reader.onload = async function (evt) {
                    try {
                        const data = new Uint8Array(evt.target.result);
                        const wb = XLSX.read(data, { type: 'array' });
                        const first = wb.SheetNames[0];
                        const sheet = wb.Sheets[first];
                        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                        if (!rows || rows.length < 2) { showToast('No rows found in Excel file', 'info'); if (inputEl) inputEl.value = ''; return; }
                        const header = rows[0].map(h => String(h || '').trim());
                        const dataRows = rows.slice(1).map(r => {
                            const obj = {};
                            for (let j = 0; j < header.length; j++) obj[header[j]] = r[j] !== undefined ? String(r[j]).trim() : '';
                            return obj;
                        });

                        const originalHeader = header.slice();
                        const normalizedKeys = header.map(h => canonicalize(h));
                        const previewEntries = dataRows.map(r => {
                            const originalRow = {};
                            const normalizedRow = {};
                            for (let j = 0; j < originalHeader.length; j++) {
                                const orig = originalHeader[j];
                                const val = r[orig] || r[orig.toLowerCase()] || '';
                                originalRow[orig] = val;
                                normalizedRow[normalizedKeys[j]] = val;
                            }
                            const norm = normalizeInstitutionPayload(normalizedRow);
                            return { originalRow, normalized: norm.payload, valid: norm.valid, errors: norm.errors };
                        });

                        state.importHeaders = originalHeader;
                        state.importPreviewEntries = previewEntries;
                        renderImportPreview(file.name || 'institutions.xlsx', originalHeader, previewEntries);
                    } catch (e) { console.error(e); showToast('Excel import failed', 'error'); }
                    finally { if (inputEl) inputEl.value = ''; }
                };
                reader.onerror = function () { if (inputEl) inputEl.value = ''; showToast('Import failed', 'error'); };
                reader.readAsArrayBuffer(file);
            }).catch(err => {
                console.warn('Failed to load xlsx lib', err);
                showToast('Excel library unavailable, please upload CSV instead', 'error');
                if (inputEl) inputEl.value = '';
            });
            return;
        }

        // Unsupported file
        showToast('Only CSV or Excel (.xlsx/.xls) import supported here', 'error');
        if (inputEl) inputEl.value = '';
    }

    function parseCSVText(text) {
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        let headerLineIndex = 0; while (headerLineIndex < lines.length && lines[headerLineIndex].trim() === '') headerLineIndex++;
        if (headerLineIndex >= lines.length) return { header: [], rows: [] };
        const header = splitCsvLine(lines[headerLineIndex]);
        const rows = [];
        for (let i = headerLineIndex + 1; i < lines.length; i++) {
            const ln = lines[i]; if (ln.trim() === '') continue;
            const values = splitCsvLine(ln);
            while (values.length < header.length) values.push('');
            const obj = {};
            for (let j = 0; j < header.length; j++) obj[header[j].trim()] = values[j] !== undefined ? values[j].trim() : '';
            rows.push(obj);
        }
        return { header, rows };
    }

    function splitCsvLine(line) {
        const regex = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g;
        const parts = line.split(regex).map(s => { s = s.trim(); if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1).replace(/""/g, '"'); return s; });
        return parts;
    }

    function serializeForm(form) {
        const obj = {};
        Array.from(form.elements).forEach(el => {
            if (!el.name) return;
            if (el.type === 'checkbox') { obj[el.name] = el.checked ? (el.value || '1') : 0; return; }
            if (el.tagName === 'SELECT') { obj[el.name] = el.value; return; }
            obj[el.name] = el.value;
        });
        return obj;
    }

    // Validation helpers
    function validateEmail(email) {
        if (!email) return true; // optional
        return /^\S+@\S+\.\S+$/.test(String(email).trim());
    }

    function validatePhone(phone) {
        if (!phone) return true; // optional
        // allow digits, spaces, +, -, parentheses; length between 7 and 25
        return /^\+?[0-9\s\-()]{7,25}$/.test(String(phone).trim());
    }

    function normalizeInstitutionPayload(input) {
        const p = Object.assign({}, input);
        const errors = [];
        // normalize keys: prefer institution_code / institution_name / institution_type
        if (p.institution_code === undefined && p.code) p.institution_code = p.code;
        if (p.institution_name === undefined && p.name) p.institution_name = p.name;
        if (p.institution_type === undefined && p.type) p.institution_type = p.type;

        // trim string fields
        ['institution_code','institution_name','institution_type','address','city','state','country','postal_code','phone','email','website','status'].forEach(k => {
            if (k in p && typeof p[k] === 'string') p[k] = p[k].trim();
        });

        // numeric quota normalization
        if ('max_students' in p) {
            if (String(p.max_students).trim() === '') delete p.max_students;
            else p.max_students = Number.parseInt(p.max_students, 10);
        }
        if ('max_teachers' in p) {
            if (String(p.max_teachers).trim() === '') delete p.max_teachers;
            else p.max_teachers = Number.parseInt(p.max_teachers, 10);
        }

        // status normalization: accept 'active'/'inactive' (case-insensitive)
        if (!p.status && (p.is_active !== undefined)) {
            p.status = (p.is_active && Number(p.is_active) > 0) ? 'active' : 'inactive';
        }
        if (p.status) p.status = String(p.status).toLowerCase();
        if (!p.status) p.status = 'active';

        // map status -> is_active (boolean/int) to satisfy callers
        p.is_active = (p.status === 'active' || p.status === '1' || p.status === 1) ? 1 : 0;

        // basic validation
        if (!p.institution_name || !p.institution_name.length) errors.push('institution_name required');
        if (!p.institution_code || !p.institution_code.length) errors.push('institution_code required');
        if (!p.institution_type || !p.institution_type.length) errors.push('institution_type required');
        if ('max_students' in p && (!Number.isInteger(p.max_students) || p.max_students < 1)) errors.push('max_students must be a positive whole number');
        if ('max_teachers' in p && (!Number.isInteger(p.max_teachers) || p.max_teachers < 1)) errors.push('max_teachers must be a positive whole number');
        if (p.email && !validateEmail(p.email)) errors.push('Invalid email');
        if (p.phone && !validatePhone(p.phone)) errors.push('Invalid phone');

        return { valid: errors.length === 0, errors, payload: p };
    }

    // Canonicalize header names to normalized keys used by normalizeInstitutionPayload
    function canonicalize(header) {
        if (!header) return '';
        let h = String(header).toLowerCase().trim();
        // remove BOM and weird chars
        h = h.replace(/\uFEFF/g, '').replace(/[^a-z0-9]+/g, '_');
        h = h.replace(/^_+|_+$/g, '');

        // common aliases
        const map = {
            'code': 'institution_code',
            'institution_code': 'institution_code',
            'institutioncode': 'institution_code',
            'inst_code': 'institution_code',
            'name': 'institution_name',
            'institution_name': 'institution_name',
            'institutionname': 'institution_name',
            'type': 'institution_type',
            'institution_type': 'institution_type',
            'email': 'email',
            'phone': 'phone',
            'telephone': 'phone',
            'address': 'address',
            'city': 'city',
            'state': 'state',
            'country': 'country',
            'postal_code': 'postal_code',
            'postalcode': 'postal_code',
            'website': 'website',
            'url': 'website',
            'status': 'status',
            'is_active': 'status',
            'institution_id': 'institution_id'
        };

        if (map[h]) return map[h];
        return h;
    }

    // simple escapeHtml (assumes global function exists; fallback)
    function escapeHtml(s) { if (typeof window.escapeHtml === 'function') return window.escapeHtml(s); return String(s || '').replace(/[&<>"]+/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

})();
