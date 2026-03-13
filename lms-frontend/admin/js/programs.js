/* ============================================
   Programs Management Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    // ─── State ────────────────────────────────────────────────────────────────
    const S = {
        programs: [],
        total: 0,
        page: 1,
        limit: 20,
        search: '',
        status: '',
        editingId: null,
        searchTimer: null,
        importRows: [],
    };

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'programs') {
            initProgramsPage();
        }
    });

    function initProgramsPage() {
        S.page     = 1;
        S.search   = '';
        S.status   = '';
        S.editingId = null;

        setupEventListeners();
        loadPrograms();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function esc(s) {
        return typeof escHtml === 'function' ? escHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function setEl(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
    function val(id)  { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
    function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v ?? ''; }

    function toast(msg, type) {
        if (typeof window.showToast === 'function') window.showToast(msg, type);
        else console.log('[' + type + '] ' + msg);
    }

    function confirm_(title, msg, onConfirm) {
        if (typeof window.showModal === 'function') window.showModal(title, msg, onConfirm);
        else { if (confirm(title + '\n' + msg)) onConfirm(); }
    }

    function apiReq(method, url, body) {
            if (typeof API !== 'undefined') {
                if (method === 'GET') return API.get(url);
                if (method === 'POST') return API.post(url, body || {});
                if (method === 'PUT') return API.put(url, body || {});
                if (method === 'DELETE') return API.delete(url);
            }

            const accessTokenKey = typeof STORAGE_KEYS !== 'undefined' ? STORAGE_KEYS.ACCESS_TOKEN : 'lms_access_token';
            const token = typeof Auth !== 'undefined' && typeof Auth.getToken === 'function'
                ? Auth.getToken()
                : (localStorage.getItem(accessTokenKey) || sessionStorage.getItem(accessTokenKey) || '');

            return fetch(API_BASE_URL + url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: 'Bearer ' + token } : {}),
                },
                body: body ? JSON.stringify(body) : undefined,
            }).then(async r => {
                const data = await r.json();
                if (!r.ok) throw new Error(data?.message || 'Request failed');
                return data;
            });
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────
    function setupEventListeners() {
        const searchEl = document.getElementById('programSearch');
        if (searchEl) {
            searchEl.value = S.search;
            searchEl.addEventListener('input', function () {
                clearTimeout(S.searchTimer);
                S.searchTimer = setTimeout(() => {
                    S.search = this.value.trim();
                    S.page = 1;
                    loadPrograms();
                }, 300);
            });
        }

        const statusEl = document.getElementById('programStatusFilter');
        if (statusEl) {
            statusEl.value = S.status;
            statusEl.addEventListener('change', function () {
                S.status = this.value;
                S.page = 1;
                loadPrograms();
            });
        }

        const addBtn = document.getElementById('addProgramBtn');
        if (addBtn) addBtn.addEventListener('click', () => openModal());
        document.getElementById('importProgramsBtn')?.addEventListener('click', openImportModal);
        document.getElementById('exportProgramsCsvBtn')?.addEventListener('click', exportProgramsCsv);
        document.getElementById('exportProgramsPdfBtn')?.addEventListener('click', exportProgramsPdf);

        document.getElementById('programModalClose')?.addEventListener('click', closeModal);
        document.getElementById('programModalCancel')?.addEventListener('click', closeModal);
        document.getElementById('programModalSave')?.addEventListener('click', saveProgram);

        document.getElementById('programModalOverlay')?.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });

        document.getElementById('programImportDropZone')?.addEventListener('click', () => {
            document.getElementById('programImportFileInput')?.click();
        });
        document.getElementById('programImportFileInput')?.addEventListener('change', (e) => handleImportFile(e.target.files?.[0]));
        document.getElementById('programImportTemplateLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            downloadImportTemplate();
        });
        document.getElementById('programImportCancelBtn')?.addEventListener('click', closeImportModal);
        document.getElementById('programImportModalClose')?.addEventListener('click', closeImportModal);
        document.getElementById('programImportConfirmBtn')?.addEventListener('click', confirmImport);
        document.getElementById('programImportResultsClose')?.addEventListener('click', closeImportResults);
        document.getElementById('programImportResultsDoneBtn')?.addEventListener('click', closeImportResults);

        document.getElementById('programImportModalOverlay')?.addEventListener('click', function (e) {
            if (e.target === this) closeImportModal();
        });
        document.getElementById('programImportResultsOverlay')?.addEventListener('click', function (e) {
            if (e.target === this) closeImportResults();
        });

        const dz = document.getElementById('programImportDropZone');
        if (dz) {
            ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('dragover'); }));
            ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('dragover'); }));
            dz.addEventListener('drop', (e) => handleImportFile(e.dataTransfer?.files?.[0]));
        }
    }

    // ─── Load Programs ────────────────────────────────────────────────────────
    function loadPrograms() {
        const tbody = document.getElementById('programsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--text-secondary,#94a3b8)"><i class="fas fa-spinner fa-spin" style="margin-right:.5rem"></i>Loading programs…</td></tr>';
        }

        let url = API_ENDPOINTS.PROGRAMS + '?page=' + S.page + '&limit=' + S.limit;
        if (S.search)  url += '&search='  + encodeURIComponent(S.search);
        if (S.status)  url += '&status='  + encodeURIComponent(S.status);

        apiReq('GET', url)
            .then(res => {
                if (!res.success) throw new Error(res.message || 'Failed to load programs');
                S.programs = res.data?.data || res.data || [];
                const pagination = res.data?.pagination || {};
                S.total = pagination.total || S.programs.length;
                renderStats(S.programs, S.total, pagination);
                renderTable(S.programs);
                renderPagination(pagination);
            })
            .catch(err => {
                console.error(err);
                if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:#ef4444"><i class="fas fa-exclamation-circle" style="margin-right:.5rem"></i>' + esc(err.message) + '</td></tr>';
            });
    }

    // ─── Render Stats ─────────────────────────────────────────────────────────
    function renderStats(programs, total, pagination) {
        const active   = programs.filter(p => p.status === 'active').length;
        const inactive = programs.filter(p => p.status === 'inactive').length;
        const classes  = programs.reduce((sum, p) => sum + (parseInt(p.class_count) || 0), 0);

        // If paginated, use total count from server; stats cards reflect visible page
        setEl('progStatTotal',    total   ?? programs.length);
        setEl('progStatActive',   active);
        setEl('progStatInactive', inactive);
        setEl('progStatClasses',  classes);

        const countLabel = document.getElementById('programsCountLabel');
        if (countLabel) {
            countLabel.textContent = total > 0
                ? 'Showing ' + ((S.page - 1) * S.limit + 1) + '–' + Math.min(S.page * S.limit, total) + ' of ' + total + ' programs'
                : '';
        }
    }

    // ─── Render Table ─────────────────────────────────────────────────────────
    function renderTable(programs) {
        const tbody = document.getElementById('programsTableBody');
        if (!tbody) return;

        if (!programs.length) {
            tbody.innerHTML =
                '<tr><td colspan="6">' +
                '<div class="prog-empty"><i class="fas fa-graduation-cap"></i><h4>No programs found</h4><p>Add your first program to get started</p></div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = programs.map(p => {
            const statusCls = p.status === 'active' ? 'prog-status-active' : 'prog-status-inactive';
            const statusTxt = p.status === 'active' ? 'Active' : 'Inactive';
            const duration  = p.duration_years ? esc(p.duration_years) + ' yr' + (p.duration_years != 1 ? 's' : '') : '—';
            const desc      = p.description ? esc(p.description) : '<span style="color:var(--text-secondary,#94a3b8)">—</span>';
            const classCnt  = parseInt(p.class_count) || 0;

            return '<tr>' +
                '<td>' +
                  '<div class="prog-cell">' +
                    '<div class="prog-icon"><i class="fas fa-graduation-cap"></i></div>' +
                    '<div class="prog-details">' +
                      '<strong>' + esc(p.program_name) + '</strong>' +
                      '<span>' + esc(p.program_code) + '</span>' +
                    '</div>' +
                  '</div>' +
                '</td>' +
                '<td>' + duration + '</td>' +
                '<td style="max-width:220px">' + desc + '</td>' +
                '<td><span class="prog-class-count">' + classCnt + '</span></td>' +
                '<td><span class="prog-status-badge ' + statusCls + '">' + statusTxt + '</span></td>' +
                '<td>' +
                  '<div class="prog-actions">' +
                    '<button class="btn-edit" title="Edit" onclick="window._progEdit(' + esc(p.program_id) + ')"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn-delete" title="Delete" onclick="window._progDelete(' + esc(p.program_id) + ', \'' + esc(p.program_name) + '\')"><i class="fas fa-trash"></i></button>' +
                  '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    // ─── Render Pagination ────────────────────────────────────────────────────
    function renderPagination(pagination) {
        const wrap = document.getElementById('programsPagination');
        const info = document.getElementById('programsPaginationInfo');
        const ctrl = document.getElementById('programsPaginationControls');

        if (!pagination || !pagination.total_pages || pagination.total_pages <= 1) {
            if (wrap) wrap.style.display = 'none';
            return;
        }

        if (wrap)  wrap.style.display = 'flex';
        if (info)  info.textContent   = 'Page ' + pagination.current_page + ' of ' + pagination.total_pages;
        if (!ctrl) return;

        const pages = pagination.total_pages;
        const cur   = pagination.current_page;
        let html    = '';

        html += '<button ' + (cur <= 1 ? 'disabled' : '') + ' onclick="window._progPage(' + (cur - 1) + ')"><i class="fas fa-chevron-left"></i></button>';
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || Math.abs(i - cur) <= 2) {
                html += '<button class="' + (i === cur ? 'active' : '') + '" onclick="window._progPage(' + i + ')">' + i + '</button>';
            } else if (Math.abs(i - cur) === 3) {
                html += '<button disabled>…</button>';
            }
        }
        html += '<button ' + (cur >= pages ? 'disabled' : '') + ' onclick="window._progPage(' + (cur + 1) + ')"><i class="fas fa-chevron-right"></i></button>';
        ctrl.innerHTML = html;
    }

    // ─── Modal ────────────────────────────────────────────────────────────────
    function openModal(programId) {
        S.editingId = programId || null;
        const overlay = document.getElementById('programModalOverlay');
        const title   = document.getElementById('programModalTitle');
        const saveText = document.getElementById('programModalSaveText');
        const errBanner = document.getElementById('programFormError');

        if (errBanner) { errBanner.style.display = 'none'; errBanner.textContent = ''; }

        if (programId) {
            const p = S.programs.find(x => x.program_id == programId);
            if (!p) return;
            setVal('programEditId',          p.program_id);
            setVal('fieldProgramName',       p.program_name);
            setVal('fieldProgramCode',       p.program_code);
            setVal('fieldProgramDescription', p.description || '');
            setVal('fieldDurationYears',     p.duration_years || '');
            setVal('fieldProgramStatus',     p.status || 'active');
            if (title)    title.textContent    = 'Edit Program';
            if (saveText) saveText.textContent = 'Save Changes';
        } else {
            setVal('programEditId', '');
            setVal('fieldProgramName', '');
            setVal('fieldProgramCode', '');
            setVal('fieldProgramDescription', '');
            setVal('fieldDurationYears', '');
            setVal('fieldProgramStatus', 'active');
            if (title)    title.textContent    = 'Add Program';
            if (saveText) saveText.textContent = 'Save Program';
        }

        if (overlay) overlay.classList.add('open');
        document.getElementById('fieldProgramName')?.focus();
    }

    function closeModal() {
        const overlay = document.getElementById('programModalOverlay');
        if (overlay) overlay.classList.remove('open');
        S.editingId = null;
    }

    function setSaveLoading(on) {
        const spinner = document.getElementById('programModalSaveSpinner');
        const saveBtn = document.getElementById('programModalSave');
        if (spinner) spinner.style.display = on ? 'inline-block' : 'none';
        if (saveBtn) saveBtn.disabled = on;
    }

    function showFormError(msg) {
        const el = document.getElementById('programFormError');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
    }

    // ─── Save Program ─────────────────────────────────────────────────────────
    function saveProgram() {
        const name     = val('fieldProgramName');
        const code     = val('fieldProgramCode');
        const desc     = val('fieldProgramDescription');
        const duration = val('fieldDurationYears');
        const status   = val('fieldProgramStatus');
        const errBanner = document.getElementById('programFormError');

        if (errBanner) { errBanner.style.display = 'none'; }

        if (!name) return showFormError('Program name is required.');
        if (!code) return showFormError('Program code is required.');

        const payload = {
            program_name:   name,
            program_code:   code.toUpperCase(),
            description:    desc || null,
            duration_years: duration ? parseInt(duration) : null,
            status,
        };

        setSaveLoading(true);

        const isEdit = !!S.editingId;
        const method = isEdit ? 'PUT' : 'POST';
        const url    = isEdit
            ? API_ENDPOINTS.PROGRAM_BY_ID(S.editingId)
            : API_ENDPOINTS.PROGRAMS;

        apiReq(method, url, payload)
            .then(res => {
                setSaveLoading(false);
                if (!res.success) throw new Error(res.message || 'Failed to save program');
                toast(isEdit ? 'Program updated successfully' : 'Program created successfully', 'success');
                closeModal();
                loadPrograms();
            })
            .catch(err => {
                setSaveLoading(false);
                showFormError(err.message || 'An error occurred');
            });
    }

    // ─── Delete Program ───────────────────────────────────────────────────────
    function deleteProgram(id, name) {
        confirm_(
            'Delete Program',
            'Are you sure you want to delete "' + name + '"? This cannot be undone.',
            function () {
                apiReq('DELETE', API_ENDPOINTS.PROGRAM_BY_ID(id))
                    .then(res => {
                        if (!res.success) throw new Error(res.message || 'Failed to delete');
                        toast('Program deleted successfully', 'success');
                        loadPrograms();
                    })
                    .catch(err => toast(err.message || 'Delete failed', 'error'));
            }
        );
    }

    // ─── Import CSV ───────────────────────────────────────────────────────────
    function openImportModal() {
        S.importRows = [];
        const fi = document.getElementById('programImportFileInput');
        if (fi) fi.value = '';
        hideEl('programImportPreview');
        hideEl('programImportErrors');
        const btn = document.getElementById('programImportConfirmBtn');
        if (btn) btn.disabled = true;
        setElText('programImportConfirmText', 'Import');
        hideEl('programImportConfirmSpinner');
        openOverlay('programImportModalOverlay');
    }

    function closeImportModal() { closeOverlay('programImportModalOverlay'); }
    function closeImportResults() { closeOverlay('programImportResultsOverlay'); }

    function downloadImportTemplate() {
        const content = [
            '# Required: program_name, program_code',
            '# Optional: description, duration_years (number), status (active | inactive, default: active)',
            '# Rows starting with # are ignored.',
            'program_name,program_code,description,duration_years,status',
            'Science,SCI,Science and applied studies,3,active',
        ].join('\n');
        downloadCsv(content, 'programs_import_template.csv');
    }

    function downloadCsv(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function splitCsvLine(line) {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            const next = line[i + 1];
            if (ch === '"') {
                if (inQuotes && next === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }
            if (ch === ',' && !inQuotes) {
                out.push(cur.trim());
                cur = '';
                continue;
            }
            cur += ch;
        }
        out.push(cur.trim());
        return out;
    }

    function parseImportCsv(text) {
        const lines = String(text || '').replace(/\r/g, '').split('\n').map(x => x.trim()).filter(Boolean);
        const errors = [];
        if (lines.length < 2) return { rows: [], headers: [], errors: ['CSV file appears empty'] };

        const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase());
        const idx = {
            name: headers.indexOf('program_name'),
            code: headers.indexOf('program_code'),
            description: headers.indexOf('description'),
            duration: headers.indexOf('duration_years'),
            status: headers.indexOf('status'),
        };

        if (idx.name === -1 || idx.code === -1) {
            errors.push('Missing required headers. Required: program_name, program_code');
            return { rows: [], headers, errors };
        }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trimStart().startsWith('#')) continue; // skip comment rows
            const cols = splitCsvLine(lines[i]);
            const row = {
                program_name: (cols[idx.name] || '').trim(),
                program_code: (cols[idx.code] || '').trim().toUpperCase(),
                description: idx.description > -1 ? (cols[idx.description] || '').trim() : '',
                duration_years: idx.duration > -1 ? (cols[idx.duration] || '').trim() : '',
                status: idx.status > -1 ? (cols[idx.status] || '').trim().toLowerCase() : 'active',
            };

            if (!row.program_name || !row.program_code) {
                errors.push('Row ' + (i + 1) + ': program_name and program_code are required');
                continue;
            }
            if (row.status && !['active', 'inactive'].includes(row.status)) row.status = 'active';
            rows.push(row);
        }
        return { rows, headers, errors };
    }

    function handleImportFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) {
            toast('Please select a CSV file', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            const result = parseImportCsv(e.target.result);
            S.importRows = result.rows;
            setElText('programImportFileName', file.name);
            setElText('programImportRowCount', result.rows.length + ' row' + (result.rows.length !== 1 ? 's' : '') + ' found');
            showEl('programImportPreview');
            const errEl = document.getElementById('programImportErrors');
            if (result.errors.length && errEl) {
                errEl.innerHTML = result.errors.map(esc).join('<br>');
                showEl('programImportErrors');
            } else {
                hideEl('programImportErrors');
            }
            const btn = document.getElementById('programImportConfirmBtn');
            if (btn) btn.disabled = result.rows.length === 0;
        };
        reader.readAsText(file);
    }

    async function confirmImport() {
        if (!S.importRows.length) return;
        const btn = document.getElementById('programImportConfirmBtn');
        if (btn) btn.disabled = true;
        showEl('programImportConfirmSpinner');
        setElText('programImportConfirmText', 'Importing\u2026');

        const results = [];

        for (let i = 0; i < S.importRows.length; i++) {
            const row = S.importRows[i];
            const name = row.program_name || ('Row ' + (i + 2));
            const payload = {
                program_name: row.program_name,
                program_code: row.program_code,
                description: row.description || null,
                duration_years: row.duration_years ? parseInt(row.duration_years, 10) : null,
                status: row.status || 'active',
            };
            if (Number.isNaN(payload.duration_years)) payload.duration_years = null;

            try {
                const res = await API.post(API_ENDPOINTS.PROGRAMS, payload);
                if (res && res.success) {
                    results.push({ name, status: 'success', reason: '' });
                } else {
                    results.push({ name, status: 'failed', reason: res?.message || 'Unknown error' });
                }
            } catch (err) {
                const st = (err.status === 409 || (err.body?.message || '').toLowerCase().includes('already exists')) ? 'skipped' : 'failed';
                let reason = err.body?.message || err.message || 'Request failed';
                if (err.body?.errors) {
                    const msgs = Object.entries(err.body.errors).map(([k, v]) => k.replace(/_/g, ' ') + ': ' + (Array.isArray(v) ? v[0] : v));
                    if (msgs.length) reason = msgs.join('; ');
                }
                results.push({ name, status: st, reason });
            }
        }

        hideEl('programImportConfirmSpinner');
        setElText('programImportConfirmText', 'Import');
        if (btn) btn.disabled = false;

        const success = results.filter(r => r.status === 'success').length;
        closeImportModal();
        if (success) loadPrograms();
        showImportResults(results);
    }

    function showImportResults(results) {
        const success = results.filter(r => r.status === 'success').length;
        const failed  = results.filter(r => r.status === 'failed').length;
        const skipped = results.filter(r => r.status === 'skipped').length;

        const summaryEl = document.getElementById('programImportResultsSummary');
        if (summaryEl) {
            summaryEl.innerHTML = [
                '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#dcfce7;color:#166534;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-check-circle"></i> ' + success + ' Successful</span>',
                skipped ? '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fef9c3;color:#854d0e;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-minus-circle"></i> ' + skipped + ' Skipped (already exists)</span>' : '',
                failed  ? '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fee2e2;color:#991b1b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-times-circle"></i> ' + failed + ' Failed</span>' : '',
                '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#f8fafc;color:#64748b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem"><i class="fas fa-list"></i> ' + results.length + ' Total</span>',
            ].join('');
        }

        const tbody = document.getElementById('programImportResultsBody');
        if (tbody) {
            tbody.innerHTML = results.map((r, i) => {
                const isOk      = r.status === 'success';
                const isSkipped = r.status === 'skipped';
                const rowBg  = isOk ? '' : isSkipped ? '#fffbeb' : '#fff7f7';
                const color  = isOk ? '#16a34a' : isSkipped ? '#92400e' : '#dc2626';
                const icon   = isOk ? 'fa-check' : isSkipped ? 'fa-minus' : 'fa-times';
                const label  = isOk ? 'Created' : isSkipped ? 'Skipped' : 'Failed';
                return '<tr style="border-bottom:1px solid #e2e8f0;background:' + rowBg + '">' +
                    '<td style="padding:.45rem .75rem;color:#64748b">' + (i + 2) + '</td>' +
                    '<td style="padding:.45rem .75rem;font-weight:500">' + esc(r.name) + '</td>' +
                    '<td style="padding:.45rem .75rem"><span style="display:inline-flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:600;color:' + color + '"><i class="fas ' + icon + '"></i> ' + label + '</span></td>' +
                    '<td style="padding:.45rem .75rem;color:' + (isOk ? '#64748b' : color) + ';font-size:.78rem">' + esc(r.reason || '\u2014') + '</td>' +
                    '</tr>';
            }).join('');
        }
        openOverlay('programImportResultsOverlay');
    }

    // ─── Export ───────────────────────────────────────────────────────────────
    function exportProgramsCsv() {
        if (!S.programs.length) { toast('No programs to export.', 'warning'); return; }
        const rows = [['Program Name', 'Program Code', 'Duration (Years)', 'Description', 'Status', 'Class Count']];
        S.programs.forEach(p => {
            rows.push([p.program_name, p.program_code, p.duration_years || '', p.description || '', p.status, p.class_count || 0]);
        });
        const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
        downloadCsv(csv, 'programs_export.csv');
    }

    async function exportProgramsPdf() {
        toast('Preparing PDF\u2026', 'info');
        const params = new URLSearchParams({ page: 1, limit: 10000 });
        if (S.search) params.set('search', S.search);
        if (S.status) params.set('status', S.status);
        let programs = [];
        try {
            const res = await API.get(API_ENDPOINTS.PROGRAMS + '?' + params);
            if (!res || !res.success) { toast('PDF export failed', 'error'); return; }
            const d = res.data || res;
            programs = d.data || (Array.isArray(d) ? d : []);
        } catch (err) {
            console.error('PDF export error:', err);
            toast('PDF export failed', 'error');
            return;
        }

        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const e = v => String(v ?? '\u2014').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const badge = s => {
            const map = { active: '#15803d;background:#dcfce7', inactive: '#854d0e;background:#fef9c3' };
            const c = map[s] || '#64748b;background:#f1f5f9';
            return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:${c}">${e(s)}</span>`;
        };
        const filterLabel = [S.search ? `Search: "${S.search}"` : '', S.status ? `Status: ${S.status}` : ''].filter(Boolean).join(' | ');

        const tableRows = programs.map((p, i) => {
            const dur = p.duration_years ? p.duration_years + ' yr' + (p.duration_years != 1 ? 's' : '') : '\u2014';
            return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
                <td>${i + 1}</td>
                <td><strong>${e(p.program_name)}</strong><br><span style="color:#64748b;font-size:11px;font-family:monospace">${e(p.program_code)}</span></td>
                <td style="text-align:center">${dur}</td>
                <td>${e(p.description || '\u2014')}</td>
                <td>${badge(p.status)}</td>
                <td style="text-align:center">${parseInt(p.class_count) || 0}</td>
            </tr>`;
        }).join('');

        const html = `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><title>Programs Export \u2014 ${date}</title>
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
  @media print { body { padding: 0; } @page { margin: 15mm; size: A4 landscape; } button { display: none !important; } }
</style></head>
<body>
  <div class="header">
    <div>
      <h1>&#127979; Programs Report</h1>
      <p style="color:#64748b;margin-top:2px">Total: <strong>${programs.length}</strong> program${programs.length !== 1 ? 's' : ''}</p>
    </div>
    <div class="meta">
      <div>Exported: ${date}</div>
      <button onclick="window.print()" style="margin-top:6px;padding:4px 12px;background:#006a3f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px">&#128438; Print / Save PDF</button>
    </div>
  </div>
  ${filterLabel ? `<div class="filter-bar">Filters: ${e(filterLabel)}</div>` : ''}
  <table>
    <thead><tr><th>#</th><th>Program</th><th>Duration</th><th>Description</th><th>Status</th><th>Classes</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">Generated by LMS &bull; ${date}</div>
</body></html>`;

        const win = window.open('', '_blank', 'width=1100,height=750');
        if (!win) { toast('Allow pop-ups to export PDF', 'warning'); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
        toast(`PDF ready \u2014 ${programs.length} program${programs.length !== 1 ? 's' : ''}`, 'success');
    }

    // ─── DOM / overlay helpers ────────────────────────────────────────────────────────
    function showEl(id)       { const el = document.getElementById(id); if (el) el.style.display = ''; }
    function hideEl(id)       { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    function setElText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }
    function openOverlay(id)  { const el = document.getElementById(id); if (el) el.classList.add('open'); }
    function closeOverlay(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }

    // ─── Global Bindings (for inline onclick) ─────────────────────────────────
    window._progEdit   = (id) => openModal(id);
    window._progDelete = (id, name) => deleteProgram(id, name);
    window._progPage   = (pg) => { S.page = pg; loadPrograms(); };

})();
