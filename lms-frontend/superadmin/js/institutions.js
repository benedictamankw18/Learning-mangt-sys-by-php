(function () {
    let state = { page: 1, per_page: 10, q: '' };

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
        if (btnImport && importInput) btnImport.addEventListener('click', () => {
            const importHelpHtml = `
                <p>Upload a CSV/Excel file with the following header columns (header row required):</p>
                <ul>
                    <li><strong>institution_code</strong> (required)</li>
                    <li><strong>institution_name</strong> (required)</li>
                    <li><strong>institution_type</strong> (optional, e.g. public, private)</li>
                    <li><strong>email</strong> (optional, valid email format)</li>
                    <li><strong>phone</strong> (optional)</li>
                    <li><strong>address</strong> (optional)</li>
                    <li><strong>website</strong> (optional)</li>
                    <li><strong>status</strong> (optional: active or inactive)</li>
                </ul>
                <p>Sample layout:</p>
                <table class="import-sample-table"><thead><tr><th>institution_code</th><th>institution_name</th><th>institution_type</th><th>email</th><th>phone</th><th>status</th></tr></thead>
                <tbody><tr><td>CEN-001</td><td>Central School</td><td>private</td><td>info@central.edu</td><td>+233123456789</td><td>active</td></tr></tbody></table>
                <p style="margin-top:0.5rem;">Press Confirm to choose a file and continue to the import preview.</p>
            `;
            showModal('Import Institutions', importHelpHtml, () => { importInput && importInput.click(); });
        });
        if (importInput) importInput.addEventListener('change', (ev) => handleImportFile(ev.target.files[0]));
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
            const id = i.institution_id || i.id || '';
            const code = i.code || i.institution_code || '';
            const name = i.institution_name || i.name || '';
            const type = i.type || i.institution_type || '';
            const email = i.email || '';
            const phone = i.phone || i.telephone || '';
            const address = i.address || '';
            const website = i.website || i.url || '';
            const status = (i.is_active || i.active || i.status === 'active') ? 'Active' : 'Inactive';
            const hasAdmin = (i.has_admin || i.hasAdmin || (i.admin_count && Number(i.admin_count) > 0)) ? 'Yes' : 'No';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(String(code))}</td>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(type)}</td>
                <td>${escapeHtml(email)}</td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(address)}</td>
                <td>${escapeHtml(website)}</td>
                <td>${escapeHtml(status)}</td>
                <td>${escapeHtml(hasAdmin)}</td>
                <td>
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
            try { await InstitutionAPI.create(payload); showToast('Institution created', 'success'); loadInstitutions(); } catch (err) { console.error(err); showToast('Failed to create institution', 'error'); }
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
                try { await InstitutionAPI.update(id, payload); showToast('Institution updated', 'success'); loadInstitutions(); } catch (err) { console.error(err); showToast('Failed to update institution', 'error'); }
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
                    if (activeForm.elements['phone']) activeForm.elements['phone'].value = inst.phone || inst.telephone || '';
                    if (activeForm.elements['email']) activeForm.elements['email'].value = inst.email || '';
                    if (activeForm.elements['website']) activeForm.elements['website'].value = inst.website || inst.url || '';
                    if (activeForm.elements['status']) activeForm.elements['status'].value = inst.status || (inst.is_active ? 'active' : 'inactive');
                    activeForm.dataset.editId = id;
                }
            } catch (e) { /* ignore */ }
        } catch (err) { console.error('Failed to load institution', err); showToast('Failed to load institution', 'error'); }
    }

    function confirmDeleteInstitution(id) {
        showModal('Confirm Delete', `<p>Are you sure you want to delete this institution?</p>`, async () => {
            try { await InstitutionAPI.delete(id); showToast('Institution deleted', 'success'); loadInstitutions(); } catch (err) { console.error(err); showToast('Failed to delete institution', 'error'); }
        });
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

    function exportXLSX() {
        // Try loading SheetJS (xlsx) dynamically and export; fallback to CSV
        const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        loadScript(cdn).then(() => {
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
        // Try loading jsPDF + autotable and generate PDF; fallback to CSV
        const jspdfCdn = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        const autoTableCdn = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';

        Promise.all([loadScript(jspdfCdn), loadScript(autoTableCdn)]).then(() => {
            try {
                // Try to locate jsPDF class across UMD/CommonJS/Global builds
                let jsPDFClass = null;
                if (window.jspdf) jsPDFClass = window.jspdf.jsPDF || window.jspdf.default || window.jspdf;
                if (!jsPDFClass && globalThis.jspdf) jsPDFClass = globalThis.jspdf.jsPDF || globalThis.jspdf.default || globalThis.jspdf;
                if (!jsPDFClass && window.jsPDF) jsPDFClass = window.jsPDF;
                if (!jsPDFClass && globalThis.jsPDF) jsPDFClass = globalThis.jsPDF;
                if (!jsPDFClass) throw new Error('jsPDF not found after loading script');

                const cols = ['Code','Name','Type','Email','Phone','Website','Status','Has Admin'];
                const rows = (state.lastInstitutions || []).map(i => [
                    i.institution_code || i.code || '',
                    i.institution_name || i.name || '',
                    i.institution_type || i.type || '',
                    i.email || '',
                    i.phone || i.telephone || '',
                    i.website || i.url || '',
                    (i.is_active || i.active || i.status === 'active') ? 'active' : 'inactive',
                    (i.has_admin || i.hasAdmin || (i.admin_count && Number(i.admin_count) > 0)) ? 'yes' : 'no'
                ]);

                const doc = new jsPDFClass({ unit: 'pt', format: 'a4' });

                // Use autoTable if available; otherwise use manual renderer
                if (typeof doc.autoTable === 'function') {
                    doc.autoTable({ head: [cols], body: rows, startY: 40, styles: { fontSize: 9 } });
                } else {
                    // fallback to manual table rendering when plugin unavailable
                    manualPdfTable(doc, cols, rows);
                }
                const name = `institutions_${Date.now()}.pdf`;
                if (typeof doc.save === 'function') {
                    doc.save(name);
                } else if (typeof doc.output === 'function') {
                    const blob = doc.output('blob');
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                } else {
                    throw new Error('Could not save PDF: unsupported jsPDF API');
                }
            } catch (e) {
                console.error('PDF export failed', e);
                showToast('PDF export failed, falling back to CSV', 'warn');
                exportCSV();
            }
        }).catch((err) => {
            console.warn('Failed to load PDF libs', err);
            showToast('PDF libraries unavailable, exporting CSV', 'info');
            exportCSV();
        });
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

    // Manual PDF table drawing fallback when autoTable is unavailable
    function manualPdfTable(doc, headers, rows) {
        const pageWidth = (doc.internal.pageSize.getWidth && doc.internal.pageSize.getWidth()) || doc.internal.pageSize.width;
        const pageHeight = (doc.internal.pageSize.getHeight && doc.internal.pageSize.getHeight()) || doc.internal.pageSize.height;
        const margin = 40;
        const colCount = headers.length;
        const usableWidth = pageWidth - margin * 2;
        const colWidth = Math.floor(usableWidth / colCount);
        const startX = margin;
        let y = 40;
        const lineHeight = 12;

        doc.setFontSize(10);
        try { doc.setFont(undefined, 'bold'); } catch (e) {}
        // draw header
        for (let c = 0; c < headers.length; c++) {
            const tx = String(headers[c] || '').slice(0, 30);
            doc.text(tx, startX + c * colWidth + 2, y);
        }
        y += lineHeight + 4;
        try { doc.setFont(undefined, 'normal'); } catch (e) {}

        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            if (y + lineHeight > pageHeight - margin) {
                doc.addPage();
                y = 40;
            }

            for (let c = 0; c < headers.length; c++) {
                let cell = String(row[c] || '');
                if (cell.length > 80) cell = cell.slice(0, 77) + '...';
                doc.text(cell, startX + c * colWidth + 2, y);
            }
            y += lineHeight;
        }
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

                    showImportPreview('Import Preview - CSV', originalHeader, previewEntries, async (toImport) => {
                        await performImport(toImport);
                        loadInstitutions();
                    });

                } catch (e) { console.error(e); showToast('Import failed', 'error'); }
                finally { if (inputEl) inputEl.value = ''; }
            };
            reader.onerror = function () { if (inputEl) inputEl.value = ''; showToast('Import failed', 'error'); };
            reader.readAsText(file, 'utf-8');
            return;
        }

        // XLSX/XLS import using SheetJS
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            loadScript(cdn).then(() => {
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

                        showImportPreview('Import Preview - Excel', originalHeader, previewEntries, async (toImport) => {
                            await performImport(toImport);
                            loadInstitutions();
                        });
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
        ['institution_code','institution_name','institution_type','address','phone','email','website','status'].forEach(k => {
            if (k in p && typeof p[k] === 'string') p[k] = p[k].trim();
        });

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
