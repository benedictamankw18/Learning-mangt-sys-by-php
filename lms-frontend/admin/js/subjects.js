/* ============================================
   Subjects Management Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    // ─── State ────────────────────────────────────────────────────────────────
    const S = {
        subjects: [],
        total: 0,
        page: 1,
        limit: 20,
        search: '',
        isCore: '',      // '' | '1' | '0'
        editingUuid: null,
        searchTimer: null,
        importRows: [],
    };

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'subjects') {
            initSubjectsPage();
        }
    });

    function initSubjectsPage() {
        S.page       = 1;
        S.search     = '';
        S.isCore     = '';
        S.editingUuid = null;

        setupEventListeners();
        loadSubjects();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function esc(s) {
        return typeof escHtml === 'function' ? escHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function setEl(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
    function val(id)      { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
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
            if (method === 'GET') return API.get(url);
            if (method === 'POST') return API.post(url, body || {});
            if (method === 'PUT') return API.put(url, body || {});
            if (method === 'DELETE') return API.delete(url);
            throw new Error('Unsupported method: ' + method);
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────
    function setupEventListeners() {
        const searchEl = document.getElementById('subjectSearch');
        if (searchEl) {
            searchEl.value = S.search;
            searchEl.addEventListener('input', function () {
                clearTimeout(S.searchTimer);
                S.searchTimer = setTimeout(() => {
                    S.search = this.value.trim();
                    S.page = 1;
                    loadSubjects();
                }, 300);
            });
        }

        const typeEl = document.getElementById('subjectTypeFilter');
        if (typeEl) {
            typeEl.value = S.isCore;
            typeEl.addEventListener('change', function () {
                S.isCore = this.value;
                S.page = 1;
                loadSubjects();
            });
        }

        document.getElementById('importSubjectsBtn')?.addEventListener('click', openImportModal);
        document.getElementById('exportSubjectsCsvBtn')?.addEventListener('click', exportSubjectsCsv);
        document.getElementById('exportSubjectsPdfBtn')?.addEventListener('click', exportSubjectsPdf);
        document.getElementById('addSubjectBtn')?.addEventListener('click', () => openModal());
        document.getElementById('subjectModalClose')?.addEventListener('click', closeModal);
        document.getElementById('subjectModalCancel')?.addEventListener('click', closeModal);
        document.getElementById('subjectModalSave')?.addEventListener('click', saveSubject);

        document.getElementById('subjectModalOverlay')?.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });

        document.getElementById('subjectImportDropZone')?.addEventListener('click', () => {
            document.getElementById('subjectImportFileInput')?.click();
        });
        document.getElementById('subjectImportFileInput')?.addEventListener('change', (e) => handleImportFile(e.target.files?.[0]));
        document.getElementById('subjectImportTemplateLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            downloadImportTemplate();
        });
        document.getElementById('subjectImportCancelBtn')?.addEventListener('click', closeImportModal);
        document.getElementById('subjectImportModalClose')?.addEventListener('click', closeImportModal);
        document.getElementById('subjectImportConfirmBtn')?.addEventListener('click', confirmImport);
        document.getElementById('subjectImportResultsClose')?.addEventListener('click', closeImportResults);
        document.getElementById('subjectImportResultsDoneBtn')?.addEventListener('click', closeImportResults);

        document.getElementById('subjectImportModalOverlay')?.addEventListener('click', function (e) {
            if (e.target === this) closeImportModal();
        });
        document.getElementById('subjectImportResultsOverlay')?.addEventListener('click', function (e) {
            if (e.target === this) closeImportResults();
        });

        const dz = document.getElementById('subjectImportDropZone');
        if (dz) {
            ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('dragover'); }));
            ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('dragover'); }));
            dz.addEventListener('drop', (e) => handleImportFile(e.dataTransfer?.files?.[0]));
        }
    }

    // ─── Load Subjects ────────────────────────────────────────────────────────
    function loadSubjects() {
        const tbody = document.getElementById('subjectsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--text-secondary,#94a3b8)"><i class="fas fa-spinner fa-spin" style="margin-right:.5rem"></i>Loading subjects…</td></tr>';
        }

        let url = API_ENDPOINTS.SUBJECTS + '?page=' + S.page + '&limit=' + S.limit;
        if (S.search) url += '&search=' + encodeURIComponent(S.search);
        if (S.isCore !== '') url += '&is_core=' + encodeURIComponent(S.isCore);

        apiReq('GET', url)
            .then(res => {
                if (!res.success) throw new Error(res.message || 'Failed to load subjects');
                S.subjects = res.data?.data || res.data || [];
                const pagination = res.data?.pagination || {};
                S.total = pagination.total || S.subjects.length;
                renderStats(S.subjects, S.total);
                renderTable(S.subjects);
                renderPagination(pagination);
            })
            .catch(err => {
                console.error(err);
                if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:#ef4444"><i class="fas fa-exclamation-circle" style="margin-right:.5rem"></i>' + esc(err.message) + '</td></tr>';
            });
    }

    // ─── Render Stats ─────────────────────────────────────────────────────────
    function renderStats(subjects, total) {
        const core     = subjects.filter(s => s.is_core == 1 || s.is_core === true).length;
        const elective = subjects.filter(s => !s.is_core || s.is_core == 0).length;
        const assigned = subjects.reduce((sum, s) => sum + (parseInt(s.assigned_classes) || 0), 0);

        setEl('subjStatTotal',    total ?? subjects.length);
        setEl('subjStatCore',     core);
        setEl('subjStatElective', elective);
        setEl('subjStatAssigned', assigned);

        const lbl = document.getElementById('subjectsCountLabel');
        if (lbl) {
            lbl.textContent = total > 0
                ? 'Showing ' + ((S.page - 1) * S.limit + 1) + '–' + Math.min(S.page * S.limit, total) + ' of ' + total + ' subjects'
                : '';
        }
    }

    // ─── Render Table ─────────────────────────────────────────────────────────
    function renderTable(subjects) {
        const tbody = document.getElementById('subjectsTableBody');
        if (!tbody) return;

        if (!subjects.length) {
            tbody.innerHTML =
                '<tr><td colspan="6">' +
                '<div class="subj-empty"><i class="fas fa-book"></i><h4>No subjects found</h4><p>Add your first subject to get started</p></div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = subjects.map(s => {
            const isCore  = s.is_core == 1 || s.is_core === true;
            const typeCls = isCore ? 'subj-type-core' : 'subj-type-elective';
            const typeTxt = isCore ? 'Core' : 'Elective';
            const credits = s.credits ? esc(s.credits) : '—';
            const desc    = s.description ? esc(s.description) : '<span style="color:var(--text-secondary,#94a3b8)">—</span>';
            const assigned = parseInt(s.assigned_classes) || 0;

            return '<tr>' +
                '<td>' +
                  '<div class="subj-cell">' +
                    '<div class="subj-icon"><i class="fas fa-book-open"></i></div>' +
                    '<div class="subj-details">' +
                      '<strong>' + esc(s.subject_name) + '</strong>' +
                      '<span>' + esc(s.subject_code) + '</span>' +
                    '</div>' +
                  '</div>' +
                '</td>' +
                '<td>' + credits + '</td>' +
                '<td style="max-width:220px">' + desc + '</td>' +
                '<td><span class="subj-type-badge ' + typeCls + '">' + typeTxt + '</span></td>' +
                '<td><span class="subj-assigned-count">' + assigned + '</span></td>' +
                '<td>' +
                  '<div class="subj-actions">' +
                    '<button class="btn-edit" title="Edit" onclick="window._subjEdit(\'' + esc(s.uuid) + '\')"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn-delete" title="Delete" onclick="window._subjDelete(\'' + esc(s.uuid) + '\', \'' + esc(s.subject_name) + '\')"><i class="fas fa-trash"></i></button>' +
                  '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    // ─── Render Pagination ────────────────────────────────────────────────────
    function renderPagination(pagination) {
        const wrap = document.getElementById('subjectsPagination');
        const info = document.getElementById('subjectsPaginationInfo');
        const ctrl = document.getElementById('subjectsPaginationControls');

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

        html += '<button ' + (cur <= 1 ? 'disabled' : '') + ' onclick="window._subjPage(' + (cur - 1) + ')"><i class="fas fa-chevron-left"></i></button>';
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || Math.abs(i - cur) <= 2) {
                html += '<button class="' + (i === cur ? 'active' : '') + '" onclick="window._subjPage(' + i + ')">' + i + '</button>';
            } else if (Math.abs(i - cur) === 3) {
                html += '<button disabled>…</button>';
            }
        }
        html += '<button ' + (cur >= pages ? 'disabled' : '') + ' onclick="window._subjPage(' + (cur + 1) + ')"><i class="fas fa-chevron-right"></i></button>';
        ctrl.innerHTML = html;
    }

    // ─── Modal ────────────────────────────────────────────────────────────────
    function openModal(uuid) {
        S.editingUuid = uuid || null;
        const overlay  = document.getElementById('subjectModalOverlay');
        const title    = document.getElementById('subjectModalTitle');
        const saveText = document.getElementById('subjectModalSaveText');
        const errBanner = document.getElementById('subjectFormError');

        if (errBanner) { errBanner.style.display = 'none'; errBanner.textContent = ''; }

        if (uuid) {
            const subj = S.subjects.find(x => x.uuid === uuid);
            if (!subj) return;
            setVal('subjectEditUuid',         subj.uuid);
            setVal('fieldSubjectName',        subj.subject_name);
            setVal('fieldSubjectCode',        subj.subject_code);
            setVal('fieldSubjectDescription', subj.description || '');
            setVal('fieldSubjectCredits',     subj.credits || '');
            setVal('fieldSubjectIsCore',      (subj.is_core == 1 || subj.is_core === true) ? '1' : '0');
            if (title)    title.textContent    = 'Edit Subject';
            if (saveText) saveText.textContent = 'Save Changes';
        } else {
            setVal('subjectEditUuid', '');
            setVal('fieldSubjectName', '');
            setVal('fieldSubjectCode', '');
            setVal('fieldSubjectDescription', '');
            setVal('fieldSubjectCredits', '');
            setVal('fieldSubjectIsCore', '1');
            if (title)    title.textContent    = 'Add Subject';
            if (saveText) saveText.textContent = 'Save Subject';
        }

        if (overlay) overlay.classList.add('open');
        document.getElementById('fieldSubjectName')?.focus();
    }

    function closeModal() {
        const overlay = document.getElementById('subjectModalOverlay');
        if (overlay) overlay.classList.remove('open');
        S.editingUuid = null;
    }

    function setSaveLoading(on) {
        const spinner = document.getElementById('subjectModalSaveSpinner');
        const saveBtn = document.getElementById('subjectModalSave');
        if (spinner) spinner.style.display = on ? 'inline-block' : 'none';
        if (saveBtn) saveBtn.disabled = on;
    }

    function showFormError(msg) {
        const el = document.getElementById('subjectFormError');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
    }

    // ─── Save Subject ─────────────────────────────────────────────────────────
    function saveSubject() {
        const name    = val('fieldSubjectName');
        const code    = val('fieldSubjectCode');
        const desc    = val('fieldSubjectDescription');
        const credits = val('fieldSubjectCredits');
        const isCore  = val('fieldSubjectIsCore');
        const errBanner = document.getElementById('subjectFormError');

        if (errBanner) errBanner.style.display = 'none';

        if (!name) return showFormError('Subject name is required.');
        if (!code) return showFormError('Subject code is required.');

        const payload = {
            subject_name: name,
            subject_code: code.toUpperCase(),
            description:  desc || null,
            credits:      credits ? parseInt(credits) : null,
            is_core:      parseInt(isCore),
        };

        setSaveLoading(true);

        const isEdit = !!S.editingUuid;
        const method = isEdit ? 'PUT' : 'POST';
        const url    = isEdit
            ? API_ENDPOINTS.SUBJECT_BY_UUID(S.editingUuid)
            : API_ENDPOINTS.SUBJECTS;

        apiReq(method, url, payload)
            .then(res => {
                setSaveLoading(false);
                if (!res.success) throw new Error(res.message || 'Failed to save subject');
                toast(isEdit ? 'Subject updated successfully' : 'Subject created successfully', 'success');
                closeModal();
                loadSubjects();
            })
            .catch(err => {
                setSaveLoading(false);
                showFormError(err.message || 'An error occurred');
            });
    }

    // ─── Delete Subject ───────────────────────────────────────────────────────
    function deleteSubject(uuid, name) {
        confirm_(
            'Delete Subject',
            'Are you sure you want to delete "' + name + '"? This cannot be undone.',
            function () {
                apiReq('DELETE', API_ENDPOINTS.SUBJECT_BY_UUID(uuid))
                    .then(res => {
                        if (!res.success) throw new Error(res.message || 'Failed to delete');
                        toast('Subject deleted successfully', 'success');
                        loadSubjects();
                    })
                    .catch(err => toast(err.message || 'Delete failed', 'error'));
            }
        );
    }

    // ─── Import CSV ───────────────────────────────────────────────────────────
    function openImportModal() {
        S.importRows = [];
        const fi = document.getElementById('subjectImportFileInput');
        if (fi) fi.value = '';
        hideEl('subjectImportPreview');
        hideEl('subjectImportErrors');
        const btn = document.getElementById('subjectImportConfirmBtn');
        if (btn) btn.disabled = true;
        setElText('subjectImportConfirmText', 'Import');
        hideEl('subjectImportConfirmSpinner');
        openOverlay('subjectImportModalOverlay');
    }

    function closeImportModal() { closeOverlay('subjectImportModalOverlay'); }
    function closeImportResults() { closeOverlay('subjectImportResultsOverlay'); }

    function downloadImportTemplate() {
        const content = [
            '# Required: subject_name, subject_code',
            '# Optional: description, credits (number), is_core (1=Core / 0=Elective, default: 1)',
            '# Rows starting with # are ignored.',
            'subject_name,subject_code,description,credits,is_core',
            'Core Mathematics,MATH-CORE,Fundamental math subject,3,1',
        ].join('\n');
        downloadCsv(content, 'subjects_import_template.csv');
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
            name: headers.indexOf('subject_name'),
            code: headers.indexOf('subject_code'),
            description: headers.indexOf('description'),
            credits: headers.indexOf('credits'),
            isCore: headers.indexOf('is_core'),
        };

        if (idx.name === -1 || idx.code === -1) {
            errors.push('Missing required headers. Required: subject_name, subject_code');
            return { rows: [], headers, errors };
        }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trimStart().startsWith('#')) continue; // skip comment rows
            const cols = splitCsvLine(lines[i]);
            const row = {
                subject_name: (cols[idx.name] || '').trim(),
                subject_code: (cols[idx.code] || '').trim().toUpperCase(),
                description: idx.description > -1 ? (cols[idx.description] || '').trim() : '',
                credits: idx.credits > -1 ? (cols[idx.credits] || '').trim() : '',
                is_core: idx.isCore > -1 ? (cols[idx.isCore] || '').trim() : '1',
            };

            if (!row.subject_name || !row.subject_code) {
                errors.push('Row ' + (i + 1) + ': subject_name and subject_code are required');
                continue;
            }
            if (!['0', '1', 'true', 'false', 'core', 'elective'].includes(String(row.is_core).toLowerCase())) {
                row.is_core = '1';
            }
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
            setElText('subjectImportFileName', file.name);
            setElText('subjectImportRowCount', result.rows.length + ' row' + (result.rows.length !== 1 ? 's' : '') + ' found');
            showEl('subjectImportPreview');
            const errEl = document.getElementById('subjectImportErrors');
            if (result.errors.length && errEl) {
                errEl.innerHTML = result.errors.map(esc).join('<br>');
                showEl('subjectImportErrors');
            } else {
                hideEl('subjectImportErrors');
            }
            const btn = document.getElementById('subjectImportConfirmBtn');
            if (btn) btn.disabled = result.rows.length === 0;
        };
        reader.readAsText(file);
    }

    async function confirmImport() {
        if (!S.importRows.length) return;
        const btn = document.getElementById('subjectImportConfirmBtn');
        if (btn) btn.disabled = true;
        showEl('subjectImportConfirmSpinner');
        setElText('subjectImportConfirmText', 'Importing\u2026');

        const results = [];

        for (let i = 0; i < S.importRows.length; i++) {
            const row = S.importRows[i];
            const name = row.subject_name || ('Row ' + (i + 2));
            const isCoreText = String(row.is_core).toLowerCase();
            const isCoreValue = (isCoreText === '0' || isCoreText === 'false' || isCoreText === 'elective') ? 0 : 1;
            const payload = {
                subject_name: row.subject_name,
                subject_code: row.subject_code,
                description: row.description || null,
                credits: row.credits ? parseInt(row.credits, 10) : null,
                is_core: isCoreValue,
            };
            if (Number.isNaN(payload.credits)) payload.credits = null;

            try {
                const res = await SubjectAPI.create(payload);
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

        hideEl('subjectImportConfirmSpinner');
        setElText('subjectImportConfirmText', 'Import');
        if (btn) btn.disabled = false;

        const success = results.filter(r => r.status === 'success').length;
        closeImportModal();
        if (success) loadSubjects();
        showImportResults(results);
    }

    function showImportResults(results) {
        const success = results.filter(r => r.status === 'success').length;
        const failed  = results.filter(r => r.status === 'failed').length;
        const skipped = results.filter(r => r.status === 'skipped').length;

        const summaryEl = document.getElementById('subjectImportResultsSummary');
        if (summaryEl) {
            summaryEl.innerHTML = [
                '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#dcfce7;color:#166534;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-check-circle"></i> ' + success + ' Successful</span>',
                skipped ? '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fef9c3;color:#854d0e;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-minus-circle"></i> ' + skipped + ' Skipped (already exists)</span>' : '',
                failed  ? '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fee2e2;color:#991b1b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-times-circle"></i> ' + failed + ' Failed</span>' : '',
                '<span style="display:inline-flex;align-items:center;gap:.4rem;background:#f8fafc;color:#64748b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem"><i class="fas fa-list"></i> ' + results.length + ' Total</span>',
            ].join('');
        }

        const tbody = document.getElementById('subjectImportResultsBody');
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
        openOverlay('subjectImportResultsOverlay');
    }

    // ─── Export ───────────────────────────────────────────────────────────────
    function exportSubjectsCsv() {
        if (!S.subjects.length) { toast('No subjects to export.', 'warning'); return; }
        const rows = [['Subject Name', 'Subject Code', 'Credits', 'Description', 'Type', 'Assigned Classes']];
        S.subjects.forEach(s => {
            rows.push([s.subject_name, s.subject_code, s.credits || '', s.description || '',
                (s.is_core == 1 || s.is_core === true) ? 'Core' : 'Elective',
                s.assigned_classes || 0]);
        });
        const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
        downloadCsv(csv, 'subjects_export.csv');
    }

    async function exportSubjectsPdf() {
        toast('Preparing PDF\u2026', 'info');
        const params = new URLSearchParams({ page: 1, limit: 10000 });
        if (S.search)  params.set('search',   S.search);
        if (S.isCore !== '') params.set('is_core', S.isCore);
        let subjects = [];
        try {
            const res = await SubjectAPI.getAll(Object.fromEntries(params.entries()));
            if (!res || !res.success) { toast('PDF export failed', 'error'); return; }
            const d = res.data || res;
            subjects = d.data || (Array.isArray(d) ? d : []);
        } catch (err) {
            console.error('PDF export error:', err);
            toast('PDF export failed', 'error');
            return;
        }

        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const e = v => String(v ?? '\u2014').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const badge = s => {
            const isCore = s === 'Core';
            return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:${isCore ? '#15803d' : '#1d4ed8'};background:${isCore ? '#dcfce7' : '#dbeafe'}">${s}</span>`;
        };
        const filterLabel = [
            S.search  ? `Search: "${S.search}"` : '',
            S.isCore !== '' ? `Type: ${S.isCore === '1' ? 'Core' : 'Elective'}` : '',
        ].filter(Boolean).join(' | ');

        const tableRows = subjects.map((s, i) => {
            const isCore = s.is_core == 1 || s.is_core === true;
            const typeTxt = isCore ? 'Core' : 'Elective';
            return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
                <td>${i + 1}</td>
                <td><strong>${e(s.subject_name)}</strong><br><span style="color:#64748b;font-size:11px;font-family:monospace">${e(s.subject_code)}</span></td>
                <td style="text-align:center">${e(s.credits || '\u2014')}</td>
                <td>${e(s.description || '\u2014')}</td>
                <td>${badge(typeTxt)}</td>
                <td style="text-align:center">${parseInt(s.assigned_classes) || 0}</td>
            </tr>`;
        }).join('');

        const html = `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><title>Subjects Export \u2014 ${date}</title>
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
      <h1>&#128218; Subjects Report</h1>
      <p style="color:#64748b;margin-top:2px">Total: <strong>${subjects.length}</strong> subject${subjects.length !== 1 ? 's' : ''}</p>
    </div>
    <div class="meta">
      <div>Exported: ${date}</div>
      <button onclick="window.print()" style="margin-top:6px;padding:4px 12px;background:#006a3f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px">&#128438; Print / Save PDF</button>
    </div>
  </div>
  ${filterLabel ? `<div class="filter-bar">Filters: ${e(filterLabel)}</div>` : ''}
  <table>
    <thead><tr><th>#</th><th>Subject</th><th>Credits</th><th>Description</th><th>Type</th><th>Classes</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">Generated by LMS &bull; ${date}</div>
</body></html>`;

        const win = window.open('', '_blank', 'width=1100,height=750');
        if (!win) { toast('Allow pop-ups to export PDF', 'warning'); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
        toast(`PDF ready \u2014 ${subjects.length} subject${subjects.length !== 1 ? 's' : ''}`, 'success');
    }

    // ─── DOM / overlay helpers ────────────────────────────────────────────────────────
    function showEl(id)       { const el = document.getElementById(id); if (el) el.style.display = ''; }
    function hideEl(id)       { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    function setElText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }
    function openOverlay(id)  { const el = document.getElementById(id); if (el) el.classList.add('open'); }
    function closeOverlay(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }

    // ─── Global Bindings (for inline onclick) ─────────────────────────────────
    window._subjEdit   = (uuid) => openModal(uuid);
    window._subjDelete = (uuid, name) => deleteSubject(uuid, name);
    window._subjPage   = (pg) => { S.page = pg; loadSubjects(); };

})();


