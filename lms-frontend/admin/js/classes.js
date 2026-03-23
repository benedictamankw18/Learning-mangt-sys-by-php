/* ============================================
   Classes Management Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    // ─── State ────────────────────────────────────────────────────────────────
    const S = {
        classes: [],
        programs: [],
        gradeLevels: [],
        academicYears: [],
        teachers: [],
        total: 0,
        page: 1,
        limit: 20,
        search: '',
        programId: '',
        gradeLevelId: '',
        status: '',
        selectedUuids: new Set(),
        editingUuid: null,
        searchTimer: null,
        importRows: [],
    };

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'classes') {
            initClassesPage();
        }
    });

    function initClassesPage() {
        S.page = 1;
        S.search = '';
        S.programId = '';
        S.gradeLevelId = '';
        S.status = '';
        S.selectedUuids = new Set();
        S.editingUuid = null;

        setupEventListeners();
        loadDropdowns();
        loadClasses().then(() => {
            // If returning from class-details edit button, open edit modal
            try {
                const editUuid = sessionStorage.getItem('lms_class_edit_uuid');
                if (editUuid) {
                    sessionStorage.removeItem('lms_class_edit_uuid');
                    openClassModal(editUuid);
                }
            } catch (_) {}
        });
    }

    // ─── Tiny helpers ─────────────────────────────────────────────────────────
    function q(sel, ctx) { return (ctx || document).querySelector(sel); }
    function on(id, ev, fn) { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); }
    function esc(s) { return typeof escHtml === 'function' ? escHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function setEl(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

    function toast(msg, type) {
        if (typeof window.showToast === 'function') window.showToast(msg, type);
        else console.log(`[${type}] ${msg}`);
    }

    function confirm_(title, msg, onConfirm) {
        if (typeof window.showModal === 'function') window.showModal(title, msg, onConfirm);
        else { if (confirm(`${title}\n${msg}`)) onConfirm(); }
    }

    function programIcon(name) {
        const n = (name || '').toLowerCase();
        if (n.includes('science'))    return 'fa-flask';
        if (n.includes('arts'))       return 'fa-palette';
        if (n.includes('business') || n.includes('commerce')) return 'fa-briefcase';
        if (n.includes('agric'))      return 'fa-seedling';
        if (n.includes('home'))       return 'fa-home';
        if (n.includes('visual'))     return 'fa-paint-brush';
        if (n.includes('tech') || n.includes('voc')) return 'fa-tools';
        return 'fa-school';
    }

    // ─── Dropdowns ────────────────────────────────────────────────────────────
    async function loadDropdowns() {
        try {
            const [progRes, glRes, ayRes, tchrRes] = await Promise.all([
                API.get(API_ENDPOINTS.PROGRAMS_ACTIVE),
                GradeLevelAPI.getAll(),
                API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT),
                API.get(API_ENDPOINTS.TEACHERS, { limit: 500, status: 'active' }),
            ]);

            // Programs
            const pd = progRes?.data;
            S.programs = Array.isArray(pd) ? pd
                       : Array.isArray(pd?.data) ? pd.data
                       : Array.isArray(pd?.programs) ? pd.programs
                       : [];
            populateProgramSelects();

            // Grade Levels
            const gd = glRes?.data;
            S.gradeLevels = Array.isArray(gd) ? gd
                          : Array.isArray(gd?.data) ? gd.data
                          : Array.isArray(gd?.grade_levels) ? gd.grade_levels
                          : [];
            populateGradeLevelSelects();

            // Academic Years — current year + all years in the API response
            const ayd = ayRes?.data;
            if (ayd) {
                const current = Array.isArray(ayd) ? ayd : (ayd.academic_year ? [ayd.academic_year] : [ayd]);
                S.academicYears = current;
            }
            populateAcademicYearSelect();

            // Teachers
            const td = tchrRes?.data;
            S.teachers = Array.isArray(td) ? td
                       : Array.isArray(td?.data) ? td.data
                       : Array.isArray(td?.teachers) ? td.teachers
                       : [];
            populateTeacherSelect();

        } catch (err) {
            console.error('loadDropdowns error:', err);
        }
    }

    function populateProgramSelects() {
        const opts = S.programs.map(p =>
            `<option value="${esc(p.program_id)}">${esc(p.program_name)}</option>`
        ).join('');

        const filterSel = document.getElementById('filterProgram');
        if (filterSel) filterSel.innerHTML = '<option value="">All Programs</option>' + opts;

        const formSel = document.getElementById('fieldProgramId');
        if (formSel) formSel.innerHTML = '<option value="">Select Program</option>' + opts;
    }

    function populateGradeLevelSelects() {
        const opts = S.gradeLevels.map(g =>
            `<option value="${esc(g.grade_level_id)}">${esc(g.grade_level_name || g.level_name || g.name)}</option>`
        ).join('');

        const filterSel = document.getElementById('filterGradeLevel');
        if (filterSel) filterSel.innerHTML = '<option value="">All Grade Levels</option>' + opts;

        const formSel = document.getElementById('fieldGradeLevelId');
        if (formSel) formSel.innerHTML = '<option value="">Select Grade Level</option>' + opts;
    }

    function populateAcademicYearSelect() {
        const opts = S.academicYears.map(a =>
            `<option value="${esc(a.academic_year_id)}"${a.is_current ? ' selected' : ''}>${esc(a.year_name)}</option>`
        ).join('');
        const formSel = document.getElementById('fieldAcademicYearId');
        if (formSel) formSel.innerHTML = '<option value="">Select Academic Year</option>' + opts;
    }

    function populateTeacherSelect() {
        const opts = S.teachers.map(t => {
            const name = `${t.first_name || ''} ${t.last_name || ''}`.trim();
            return `<option value="${esc(t.teacher_id || t.uuid)}">${esc(name)}</option>`;
        }).join('');
        const formSel = document.getElementById('fieldClassTeacherId');
        if (formSel) formSel.innerHTML = '<option value="">None</option>' + opts;
    }

    // ─── Load Classes ─────────────────────────────────────────────────────────
    async function loadClasses() {
        const params = { page: S.page, limit: S.limit };
        if (S.search)       params.search         = S.search;
        if (S.programId)    params.program_id     = S.programId;
        if (S.gradeLevelId) params.grade_level_id = S.gradeLevelId;
        if (S.status)       params.status         = S.status;

        try {
            const res = await API.get(API_ENDPOINTS.CLASSES, params);
            if (res && res.success) {
                const d = res.data;
                S.classes   = d.classes || d.data || (Array.isArray(d) ? d : []);
                const pagination = d.pagination || null;
                S.total = pagination ? pagination.total : S.classes.length;
                renderTable();
                renderStats(pagination);
                renderPagination(pagination);
            } else {
                showTableError(res?.message || 'Failed to load classes.');
            }
        } catch (err) {
            console.error('loadClasses error:', err);
            showTableError('Network error · ' + (err.message || ''));
        }
    }

    function showTableError(msg) {
        const tbody = document.getElementById('classesTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2.5rem;color:#ef4444;">${esc(msg)}</td></tr>`;
    }

    // ─── Render Stats ─────────────────────────────────────────────────────────
    function renderStats(pagination) {
        if (pagination) {
            setEl('statTotal',    pagination.total ?? '—');
            setEl('statActive',   pagination.active_count ?? '—');
            setEl('statStudents', pagination.total_students ?? '—');
            setEl('statInactive', pagination.inactive_count ?? '—');
        } else {
            // Compute from local list
            const active   = S.classes.filter(c => c.status === 'active').length;
            const inactive = S.classes.filter(c => c.status !== 'active').length;
            const students = S.classes.reduce((sum, c) => sum + (Number(c.student_count) || 0), 0);
            setEl('statTotal',    S.total);
            setEl('statActive',   active);
            setEl('statStudents', students);
            setEl('statInactive', inactive);
        }
    }

    // ─── Render Table ─────────────────────────────────────────────────────────
    function renderTable() {
        const tbody = document.getElementById('classesTableBody');
        if (!tbody) return;

        if (!S.classes.length) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2.5rem;color:#94a3b8;">No classes found.</td></tr>`;
            return;
        }

        tbody.innerHTML = S.classes.map(c => {
            const isActive = c.status === 'active';
            const statusBadge = isActive
                ? `<span class="status-badge status-active">Active</span>`
                : `<span class="status-badge status-inactive">Inactive</span>`;

            const cap = c.max_students ? `${c.student_count || 0} / ${c.max_students}` : (c.student_count || 0);
            const capColor = (c.max_students && c.student_count >= c.max_students) ? 'color:#ef4444;font-weight:600;' : '';

            const checked = S.selectedUuids.has(c.uuid) ? 'checked' : '';

            return `
            <tr data-uuid="${esc(c.uuid)}">
              <td><input type="checkbox" class="class-row-cb" data-uuid="${esc(c.uuid)}" ${checked}></td>
              <td>
                <div class="department-cell">
                  <div class="department-icon"><i class="fas ${programIcon(c.program_name)}"></i></div>
                  <div class="department-details">
                    <span class="department-name">${esc(c.class_name)}</span>
                    <span class="department-code">${esc(c.class_code)}${c.section ? ' · §' + esc(c.section) : ''}</span>
                  </div>
                </div>
              </td>
              <td><span class="program-badge">${esc(c.program_name || '—')}</span></td>
              <td>${esc(c.grade_level_name || '—')}</td>
              <td>${c.class_teacher_name ? esc(c.class_teacher_name) : '<span style="color:#94a3b8;">—</span>'}</td>
              <td style="${capColor}">${cap}</td>
              <td>${esc(c.room_number || '—')}</td>
              <td>${statusBadge}</td>
              <td>
                <div class="department-actions">
                  <button class="btn-view" title="View Class Details" onclick="classViewDetails('${esc(c.uuid)}')">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-edit" title="Edit Class" onclick="classEdit('${esc(c.uuid)}')">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-delete" title="Delete Class" onclick="classDelete('${esc(c.uuid)}', '${esc(c.class_name)}')">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>`;
        }).join('');

        // Attach checkbox listeners
        document.querySelectorAll('.class-row-cb').forEach(cb => {
            cb.addEventListener('change', function () {
                if (this.checked) S.selectedUuids.add(this.dataset.uuid);
                else S.selectedUuids.delete(this.dataset.uuid);
                updateBulkActions();
            });
        });
    }

    // ─── Pagination ───────────────────────────────────────────────────────────
    function renderPagination(pagination) {
        const wrap     = document.getElementById('classesPagination');
        const infoEl   = document.getElementById('classesPaginationInfo');
        const ctrlEl   = document.getElementById('classesPaginationControls');
        if (!wrap) return;

        if (!pagination || pagination.total_pages <= 1) {
            wrap.style.display = 'none';
            return;
        }
        wrap.style.display = 'flex';

        const { current_page, total_pages, total, per_page } = pagination;
        const from = (current_page - 1) * per_page + 1;
        const to   = Math.min(current_page * per_page, total);
        if (infoEl) infoEl.textContent = `Showing ${from}–${to} of ${total} classes`;

        if (!ctrlEl) return;
        let btns = '';
        btns += `<button ${current_page === 1 ? 'disabled' : ''} onclick="classGoPage(${current_page - 1})"><i class="fas fa-chevron-left"></i></button>`;
        for (let p = 1; p <= total_pages; p++) {
            if (p === 1 || p === total_pages || (p >= current_page - 2 && p <= current_page + 2)) {
                btns += `<button class="${p === current_page ? 'active' : ''}" onclick="classGoPage(${p})">${p}</button>`;
            } else if (p === current_page - 3 || p === current_page + 3) {
                btns += `<button disabled>…</button>`;
            }
        }
        btns += `<button ${current_page === total_pages ? 'disabled' : ''} onclick="classGoPage(${current_page + 1})"><i class="fas fa-chevron-right"></i></button>`;
        ctrlEl.innerHTML = btns;
    }

    window.classGoPage = function (p) {
        S.page = p;
        loadClasses();
    };

    // ─── Bulk Actions ─────────────────────────────────────────────────────────
    function updateBulkActions() {
        const bar = document.getElementById('bulkActions');
        if (!bar) return;
        const count = S.selectedUuids.size;
        setEl('selectedCount', count);
        bar.classList.toggle('active', count > 0);
        const sa = document.getElementById('selectAll');
        if (sa) sa.checked = count > 0 && count === document.querySelectorAll('.class-row-cb').length;
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────
    function setupEventListeners() {
        // Search with debounce
        const searchInput = document.getElementById('classSearch');
        if (searchInput) {
            searchInput.value = '';
            searchInput.addEventListener('input', () => {
                clearTimeout(S.searchTimer);
                S.searchTimer = setTimeout(() => {
                    S.search = searchInput.value.trim();
                    S.page = 1;
                    loadClasses();
                }, 350);
            });
        }

        // Filters
        on('filterProgram', 'change', () => {
            S.programId = document.getElementById('filterProgram').value;
            S.page = 1;
            loadClasses();
        });
        on('filterGradeLevel', 'change', () => {
            S.gradeLevelId = document.getElementById('filterGradeLevel').value;
            S.page = 1;
            loadClasses();
        });
        on('filterStatus', 'change', () => {
            S.status = document.getElementById('filterStatus').value;
            S.page = 1;
            loadClasses();
        });

        // Add class
        on('addClassBtn', 'click', () => openClassModal(null));

        // Export CSV
        on('exportClassesBtn', 'click', exportClasses);

        // Export PDF
        on('exportPdfClassesBtn', 'click', exportClassesPDF);

        // Import CSV
        on('importClassesBtn',   'click', openImportModal);
        on('classImportDropZone','click', () => { const fi = document.getElementById('classImportFileInput'); if (fi) fi.click(); });
        on('classImportFileInput', 'change', e => handleImportFile(e.target.files[0]));
        on('classImportTemplateLink', 'click', e => { e.preventDefault(); downloadCsvTemplate(); });
        on('classImportConfirmBtn', 'click', confirmImport);
        on('classImportCancelBtn',  'click', closeImportModal);
        on('classImportModalClose', 'click', closeImportModal);
        on('classImportResultsClose',   'click', closeImportResults);
        on('classImportResultsDoneBtn', 'click', closeImportResults);
        on('classImportResultsOverlay', 'click', function (e) {
            if (e.target === this) closeImportResults();
        });
        on('classImportModalOverlay', 'click', function (e) {
            if (e.target === this) closeImportModal();
        });

        // Drag-and-drop on drop zone
        (function () {
            const dz = document.getElementById('classImportDropZone');
            if (!dz) return;
            dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
            dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
            dz.addEventListener('drop', e => {
                e.preventDefault();
                dz.classList.remove('dragover');
                handleImportFile(e.dataTransfer.files[0]);
            });
        })()

        // Select all checkbox
        on('selectAll', 'change', function () {
            document.querySelectorAll('.class-row-cb').forEach(cb => {
                cb.checked = this.checked;
                if (this.checked) S.selectedUuids.add(cb.dataset.uuid);
                else S.selectedUuids.delete(cb.dataset.uuid);
            });
            updateBulkActions();
        });

        // Bulk actions
        on('bulkDeleteBtn',       'click', bulkDelete);
        on('bulkActivateBtn',     'click', () => bulkSetStatus('active'));
        on('bulkDeactivateBtn',   'click', () => bulkSetStatus('inactive'));
        on('bulkClearClassesBtn', 'click', () => {
            S.selectedUuids.clear();
            document.querySelectorAll('.class-row-cb').forEach(cb => { cb.checked = false; });
            const sa = document.getElementById('selectAll');
            if (sa) sa.checked = false;
            updateBulkActions();
        });

        // Class modal
        on('classModalClose',  'click', closeClassModal);
        on('classModalCancel', 'click', closeClassModal);
        on('classModalSave',   'click', saveClass);
        on('classModalOverlay', 'click', function (e) {
            if (e.target === this) closeClassModal();
        });

        // Roster modal
        on('rosterModalClose', 'click', closeRosterModal);
        on('rosterModalOverlay', 'click', function (e) {
            if (e.target === this) closeRosterModal();
        });
    }

    // ─── Class Modal (Add / Edit) ─────────────────────────────────────────────
    function openClassModal(uuid) {
        S.editingUuid = uuid || null;
        const overlay = document.getElementById('classModalOverlay');
        const title   = document.getElementById('classModalTitle');
        const errEl   = document.getElementById('classFormError');
        if (!overlay) return;

        // Reset form
        const form = document.getElementById('classForm');
        if (form) form.reset();
        document.getElementById('classUuid').value = '';
        if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

        // Re-populate dynamic dropdowns each time modal opens (dropdowns might not be loaded yet on first open)
        populateProgramSelects();
        populateGradeLevelSelects();
        populateAcademicYearSelect();
        populateTeacherSelect();

        if (!uuid) {
            if (title) title.textContent = 'Add New Class';
            overlay.classList.add('open');
            return;
        }

        // Edit — fetch class data
        if (title) title.textContent = 'Edit Class';
        overlay.classList.add('open');
        const saveBtn = document.getElementById('classModalSave');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading…'; }

        API.get(API_ENDPOINTS.CLASS_BY_UUID(uuid)).then(res => {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Class'; }
            if (!res?.success) { toast(res?.message || 'Failed to load class.', 'error'); closeClassModal(); return; }
            const c = res.data?.class || res.data || res;
            document.getElementById('classUuid').value         = c.uuid || '';
            document.getElementById('fieldClassName').value    = c.class_name || '';
            document.getElementById('fieldClassCode').value    = c.class_code || '';
            document.getElementById('fieldSection').value      = c.section || '';
            document.getElementById('fieldRoomNumber').value   = c.room_number || '';
            document.getElementById('fieldMaxStudents').value  = c.max_students || '';
            setSelectVal('fieldProgramId',    c.program_id);
            setSelectVal('fieldGradeLevelId', c.grade_level_id);
            setSelectVal('fieldAcademicYearId', c.academic_year_id);
            setSelectVal('fieldClassTeacherId', c.class_teacher_id);
            setSelectVal('fieldStatus', c.status || 'active');
        }).catch(err => {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Class'; }
            toast('Error loading class data.', 'error');
            console.error(err);
        });
    }

    function setSelectVal(id, val) {
        const sel = document.getElementById(id);
        if (!sel || val == null) return;
        sel.value = String(val);
    }

    function closeClassModal() {
        const overlay = document.getElementById('classModalOverlay');
        if (overlay) overlay.classList.remove('open');
        S.editingUuid = null;
    }

    async function saveClass() {
        const saveBtn = document.getElementById('classModalSave');
        const errEl   = document.getElementById('classFormError');
        if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

        // Gather values
        const uuid     = document.getElementById('classUuid').value.trim();
        const payload  = {
            class_name:       (document.getElementById('fieldClassName').value || '').trim(),
            class_code:       (document.getElementById('fieldClassCode').value || '').trim(),
            section:          (document.getElementById('fieldSection').value || '').trim(),
            program_id:       document.getElementById('fieldProgramId').value,
            grade_level_id:   document.getElementById('fieldGradeLevelId').value,
            academic_year_id: document.getElementById('fieldAcademicYearId').value,
            status:           document.getElementById('fieldStatus').value || 'active',
        };

        const room = (document.getElementById('fieldRoomNumber').value || '').trim();
        const max  = document.getElementById('fieldMaxStudents').value;
        const tId  = document.getElementById('fieldClassTeacherId').value;
        if (room) payload.room_number = room;
        if (max)  payload.max_students = Number(max);
        if (tId)  payload.class_teacher_id = tId;

        // Basic validation
        const missing = [];
        if (!payload.class_name)       missing.push('Class Name');
        if (!payload.class_code)       missing.push('Class Code');
        if (!payload.section)          missing.push('Section');
        if (!payload.program_id)       missing.push('Program');
        if (!payload.grade_level_id)   missing.push('Grade Level');
        if (!payload.academic_year_id) missing.push('Academic Year');

        if (missing.length) {
            if (errEl) { errEl.textContent = 'Required: ' + missing.join(', '); errEl.style.display = 'block'; }
            return;
        }

        if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }

        try {
            const isEdit = !!(uuid || S.editingUuid);
            const targetUuid = uuid || S.editingUuid;
            const res = isEdit
                ? await API.put(API_ENDPOINTS.CLASS_BY_UUID(targetUuid), payload)
                : await API.post(API_ENDPOINTS.CLASSES, payload);

            if (res?.success) {
                toast(isEdit ? 'Class updated successfully.' : 'Class created successfully.', 'success');
                closeClassModal();
                S.page = isEdit ? S.page : 1;
                loadClasses();
            } else {
                const msg = res?.message || 'Save failed.';
                if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
                toast(msg, 'error');
            }
        } catch (err) {
            console.error('saveClass error:', err);
            const msg = 'Network error. Please try again.';
            if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Class'; }
        }
    }

    // ─── Delete ───────────────────────────────────────────────────────────────
    window.classEdit = function (uuid) { openClassModal(uuid); };

    window.classDelete = function (uuid, name) {
        confirm_(
            'Delete Class',
            `Delete "${name}"? This cannot be undone.`,
            async () => {
                try {
                    const res = await API.delete(API_ENDPOINTS.CLASS_BY_UUID(uuid));
                    if (res?.success) {
                        toast('Class deleted.', 'success');
                        S.selectedUuids.delete(uuid);
                        loadClasses();
                    } else {
                        toast(res?.message || 'Delete failed.', 'error');
                    }
                } catch (err) {
                    toast('Network error.', 'error');
                }
            }
        );
    };

    // ─── Bulk Actions ─────────────────────────────────────────────────────────
    async function bulkSetStatus(status) {
        if (!S.selectedUuids.size) return;
        const uuids = [...S.selectedUuids];
        const label = status === 'active' ? 'activate' : 'deactivate';
        confirm_(
            'Bulk ' + label,
            `${label.charAt(0).toUpperCase() + label.slice(1)} ${uuids.length} class(es)?`,
            async () => {
                let ok = 0, fail = 0;
                for (const uuid of uuids) {
                    try {
                        const res = await API.put(API_ENDPOINTS.CLASS_BY_UUID(uuid), { status });
                        if (res?.success) ok++;
                        else fail++;
                    } catch (_) { fail++; }
                }
                toast(`${ok} updated${fail ? ', ' + fail + ' failed' : ''}.`, fail ? 'warning' : 'success');
                S.selectedUuids.clear();
                loadClasses();
            }
        );
    }

    async function bulkDelete() {
        if (!S.selectedUuids.size) return;
        const uuids = [...S.selectedUuids];
        confirm_(
            'Delete Classes',
            `Permanently delete ${uuids.length} class(es)? This cannot be undone.`,
            async () => {
                let ok = 0, fail = 0;
                for (const uuid of uuids) {
                    try {
                        const res = await API.delete(API_ENDPOINTS.CLASS_BY_UUID(uuid));
                        if (res?.success) ok++;
                        else fail++;
                    } catch (_) { fail++; }
                }
                toast(`${ok} deleted${fail ? ', ' + fail + ' failed' : ''}.`, fail ? 'warning' : 'success');
                S.selectedUuids.clear();
                loadClasses();
            }
        );
    }

    // ─── Roster Modal ─────────────────────────────────────────────────────────
    window.classViewRoster = function (uuid, className) {
        const overlay  = document.getElementById('rosterModalOverlay');
        const titleEl  = document.getElementById('rosterModalTitle');
        const bodyEl   = document.getElementById('rosterBody');
        if (!overlay) return;
        if (titleEl) titleEl.textContent = `${className} — Student Roster`;
        if (bodyEl)  bodyEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading students…</div>';
        overlay.classList.add('open');

        ClassAPI.getStudents(uuid).then(res => {
            if (!res?.success) {
                bodyEl.innerHTML = `<p style="color:#ef4444;text-align:center;">Failed to load roster: ${esc(res?.message || 'Unknown error')}</p>`;
                return;
            }
            const list = res.data?.students || res.data || (Array.isArray(res.data) ? res.data : []);
            if (!list.length) {
                bodyEl.innerHTML = '<p style="text-align:center;color:#94a3b8;">No students enrolled in this class.</p>';
                return;
            }
            bodyEl.innerHTML = `
                <p style="margin-bottom:1rem;color:#6b7280;font-size:.875rem;">${list.length} student(s) enrolled</p>
                <table style="width:100%;border-collapse:collapse;font-size:.875rem;">
                  <thead>
                    <tr style="background:#f9fafb;text-align:left;">
                      <th style="padding:.6rem .8rem;border-bottom:1px solid #e5e7eb;">#</th>
                      <th style="padding:.6rem .8rem;border-bottom:1px solid #e5e7eb;">Student ID</th>
                      <th style="padding:.6rem .8rem;border-bottom:1px solid #e5e7eb;">Name</th>
                      <th style="padding:.6rem .8rem;border-bottom:1px solid #e5e7eb;">Gender</th>
                      <th style="padding:.6rem .8rem;border-bottom:1px solid #e5e7eb;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${list.map((s, i) => {
                        const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—';
                        const st   = s.status === 'active'
                            ? '<span style="color:#16a34a;font-weight:500;">Active</span>'
                            : '<span style="color:#6b7280;">Inactive</span>';
                        return `<tr style="border-bottom:1px solid #f3f4f6;">
                          <td style="padding:.55rem .8rem;">${i + 1}</td>
                          <td style="padding:.55rem .8rem;">${esc(s.student_id_number || s.student_id || '—')}</td>
                          <td style="padding:.55rem .8rem;font-weight:500;">${esc(name)}</td>
                          <td style="padding:.55rem .8rem;">${esc(s.gender || '—')}</td>
                          <td style="padding:.55rem .8rem;">${st}</td>
                        </tr>`;
                    }).join('')}
                  </tbody>
                </table>`;
        }).catch(err => {
            bodyEl.innerHTML = `<p style="color:#ef4444;text-align:center;">Network error loading roster.</p>`;
            console.error(err);
        });
    };

    function closeRosterModal() {
        const overlay = document.getElementById('rosterModalOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    // ─── Export CSV ────────────────────────────────────────────────────────────
    function exportClasses() {
        if (!S.classes.length) { toast('No classes to export.', 'warning'); return; }
        const rows = [['Class Name', 'Code', 'Section', 'Program', 'Grade Level', 'Teacher', 'Students', 'Capacity', 'Room', 'Status']];
        S.classes.forEach(c => {
            rows.push([
                c.class_name, c.class_code, c.section,
                c.program_name, c.grade_level_name,
                c.class_teacher_name || '',
                c.student_count || 0, c.max_students || '',
                c.room_number || '', c.status,
            ]);
        });
        const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'classes.csv'; a.click();
        URL.revokeObjectURL(url);
    }

    // ─── Export PDF ────────────────────────────────────────────────────────────
    async function exportClassesPDF() {
        toast('Preparing PDF…', 'info');

        const params = new URLSearchParams({ page: 1, limit: 10000 });
        if (S.search)      params.set('search',          S.search);
        if (S.programId)   params.set('program_id',      S.programId);
        if (S.gradeLevelId)params.set('grade_level_id',  S.gradeLevelId);
        if (S.status)      params.set('status',          S.status);

        let rows = [];
        try {
            const res = await API.get(`${API_ENDPOINTS.CLASSES}?${params}`);
            if (!res || !res.success) { toast('PDF export failed', 'error'); return; }
            const d = res.data || res;
            rows = d.classes || d.data || (Array.isArray(d) ? d : []);
        } catch (err) {
            console.error('PDF export error:', err);
            toast('PDF export failed', 'error');
            return;
        }

        const date  = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
        const e     = v => String(v ?? '—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const badge = s => {
            const map = { active:'#15803d;background:#dcfce7', inactive:'#854d0e;background:#fef9c3' };
            const c   = map[s] || '#64748b;background:#f1f5f9';
            return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:${c}">${e(s)}</span>`;
        };

        const filterLabel = [
            S.search      ? `Search: "${S.search}"` : '',
            S.programId   ? `Program: ${S.programs.find(p => String(p.program_id) === String(S.programId))?.program_name || S.programId}` : '',
            S.gradeLevelId? `Grade: ${S.gradeLevels.find(g => String(g.grade_level_id) === String(S.gradeLevelId))?.grade_level_name || S.gradeLevelId}` : '',
            S.status      ? `Status: ${S.status}` : '',
        ].filter(Boolean).join(' | ');

        const tableRows = rows.map((c, i) => `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
                <td>${i + 1}</td>
                <td><strong>${e(c.class_name)}</strong><br><span style="color:#64748b;font-size:11px;font-family:monospace">${e(c.class_code)}</span></td>
                <td>${e(c.section || '—')}</td>
                <td>${e(c.program_name || '—')}</td>
                <td>${e(c.grade_level_name || '—')}</td>
                <td>${e(c.class_teacher_name || '—')}</td>
                <td style="text-align:center">${e(c.student_count ?? '0')} / ${e(c.max_students || '—')}</td>
                <td>${e(c.room_number || '—')}</td>
                <td>${badge(c.status)}</td>
            </tr>`).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Classes Export — ${date}</title>
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
      <h1>&#127979; Classes Report</h1>
      <p style="color:#64748b;margin-top:2px">Total: <strong>${rows.length}</strong> class${rows.length !== 1 ? 'es' : ''}</p>
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
        <th>#</th><th>Class</th><th>Section</th><th>Program</th>
        <th>Grade Level</th><th>Teacher</th><th>Students / Cap</th>
        <th>Room</th><th>Status</th>
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
        toast(`PDF ready — ${rows.length} class${rows.length !== 1 ? 'es' : ''}`, 'success');
    }

    // ─── Import CSV ────────────────────────────────────────────────────────────
    function openImportModal() {
        S.importRows = [];
        const fi = document.getElementById('classImportFileInput');
        if (fi) fi.value = '';
        hideEl('classImportPreview');
        hideEl('classImportErrors');
        const btn = document.getElementById('classImportConfirmBtn');
        if (btn) btn.disabled = true;
        setElText('classImportConfirmText', 'Import');
        hideEl('classImportConfirmSpinner');
        openOverlay('classImportModalOverlay');
    }

    function closeImportModal() { closeOverlay('classImportModalOverlay'); }
    function closeImportResults() { closeOverlay('classImportResultsOverlay'); }

    function handleImportFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) {
            toast('Please select a CSV file', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            const result = parseCsv(e.target.result);
            S.importRows = result.rows;
            setElText('classImportFileName', file.name);
            setElText('classImportRowCount', `${result.rows.length} row${result.rows.length !== 1 ? 's' : ''} found`);
            showEl('classImportPreview');
            const errEl = document.getElementById('classImportErrors');
            if (result.errors.length && errEl) {
                errEl.innerHTML = result.errors.map(escapeHtml).join('<br>');
                showEl('classImportErrors');
            } else {
                hideEl('classImportErrors');
            }
            const btn = document.getElementById('classImportConfirmBtn');
            if (btn) btn.disabled = result.rows.length === 0;
        };
        reader.readAsText(file);
    }

    async function confirmImport() {
        if (!S.importRows.length) return;
        const btn = document.getElementById('classImportConfirmBtn');
        if (btn) btn.disabled = true;
        showEl('classImportConfirmSpinner');
        setElText('classImportConfirmText', 'Importing…');

        const REQUIRED_NAME_COLS = ['class_name', 'class_code', 'section'];
        const results  = [];

        for (let i = 0; i < S.importRows.length; i++) {
            const row  = { ...S.importRows[i] };
            const name = row.class_name || `Row ${i + 2}`;

            // ── Resolve program_name → program_id ──────────────────────────
            if (row.program_name && !row.program_id) {
                const match = S.programs.find(
                    p => (p.program_name || '').trim().toLowerCase() === String(row.program_name).trim().toLowerCase()
                      || (p.program_code || '').trim().toLowerCase() === String(row.program_name).trim().toLowerCase()
                );
                if (!match) {
                    results.push({ name, status: 'failed', reason: `Program not found: "${row.program_name}". Available: ${S.programs.map(p => p.program_name).join(', ')}` });
                    continue;
                }
                row.program_id = match.program_id;
            }
            delete row.program_name;

            // ── Resolve grade_level_name → grade_level_id ──────────────────
            if (row.grade_level_name && !row.grade_level_id) {
                const match = S.gradeLevels.find(
                    g => (g.grade_level_name || g.level_name || g.name || '').trim().toLowerCase() === String(row.grade_level_name).trim().toLowerCase()
                );
                if (!match) {
                    results.push({ name, status: 'failed', reason: `Grade Level not found: "${row.grade_level_name}". Available: ${S.gradeLevels.map(g => g.grade_level_name || g.level_name || g.name).join(', ')}` });
                    continue;
                }
                row.grade_level_id = match.grade_level_id;
            }
            delete row.grade_level_name;

            // ── Resolve academic_year_name → academic_year_id ──────────────
            if (row.academic_year_name && !row.academic_year_id) {
                const match = S.academicYears.find(
                    a => (a.year_name || '').trim().toLowerCase() === String(row.academic_year_name).trim().toLowerCase()
                );
                if (!match) {
                    results.push({ name, status: 'failed', reason: `Academic Year not found: "${row.academic_year_name}". Available: ${S.academicYears.map(a => a.year_name).join(', ')}` });
                    continue;
                }
                row.academic_year_id = match.academic_year_id;
            }
            delete row.academic_year_name;

            // ── Check required fields after resolution ─────────────────────
            const missing = [...REQUIRED_NAME_COLS, 'program_id', 'grade_level_id', 'academic_year_id']
                .filter(f => !row[f] || !String(row[f]).trim());
            if (missing.length) {
                results.push({ name, status: 'failed', reason: `Missing: ${missing.map(f => f.replace(/_/g,' ')).join(', ')}` });
                continue;
            }

            try {
                const res = await API.post(API_ENDPOINTS.CLASSES, row);
                if (res && res.success) {
                    results.push({ name, status: 'success', reason: '' });
                } else {
                    results.push({ name, status: 'failed', reason: res?.message || 'Unknown error' });
                }
            } catch (err) {
                // 409 = duplicate class code — treat as a skipped/warning row, not a hard failure
                const status = (err.status === 409 || (err.body && err.body.message && err.body.message.includes('already exists'))) ? 'skipped' : 'failed';
                let reason = (err.body?.message) || err.message || 'Request failed';
                if (err.body && err.body.errors) {
                    const msgs = Object.entries(err.body.errors).map(([k, v]) =>
                        `${k.replace(/_/g,' ')}: ${Array.isArray(v) ? v[0] : v}`);
                    if (msgs.length) reason = msgs.join('; ');
                }
                results.push({ name, status, reason });
            }
        }

        hideEl('classImportConfirmSpinner');
        setElText('classImportConfirmText', 'Import');
        if (btn) btn.disabled = false;

        const success = results.filter(r => r.status === 'success').length;
        closeImportModal();
        if (success) loadClasses();
        showImportResults(results);
    }

    function showImportResults(results) {
        const success = results.filter(r => r.status === 'success').length;
        const failed  = results.filter(r => r.status === 'failed').length;
        const skipped = results.filter(r => r.status === 'skipped').length;

        const summaryEl = document.getElementById('classImportResultsSummary');
        if (summaryEl) {
            summaryEl.innerHTML = [
                `<span style="display:inline-flex;align-items:center;gap:.4rem;background:#dcfce7;color:#166534;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600">
                    <i class="fas fa-check-circle"></i> ${success} Successful
                </span>`,
                skipped ? `<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fef9c3;color:#854d0e;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600">
                    <i class="fas fa-minus-circle"></i> ${skipped} Skipped (already exists)
                </span>` : '',
                failed ? `<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fee2e2;color:#991b1b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600">
                    <i class="fas fa-times-circle"></i> ${failed} Failed
                </span>` : '',
                `<span style="display:inline-flex;align-items:center;gap:.4rem;background:#f8fafc;color:#64748b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem">
                    <i class="fas fa-list"></i> ${results.length} Total
                </span>`
            ].join('');
        }

        const tbody = document.getElementById('classImportResultsBody');
        if (tbody) {
            tbody.innerHTML = results.map((r, i) => {
                const isOk      = r.status === 'success';
                const isSkipped = r.status === 'skipped';
                const rowBg  = isOk ? '' : isSkipped ? '#fffbeb' : '#fff7f7';
                const color  = isOk ? '#16a34a' : isSkipped ? '#92400e' : '#dc2626';
                const icon   = isOk ? 'fa-check' : isSkipped ? 'fa-minus' : 'fa-times';
                const label  = isOk ? 'Created' : isSkipped ? 'Skipped' : 'Failed';
                return `<tr style="border-bottom:1px solid #e2e8f0;background:${rowBg}">
                    <td style="padding:.45rem .75rem;color:#64748b">${i + 2}</td>
                    <td style="padding:.45rem .75rem;font-weight:500">${escapeHtml(r.name)}</td>
                    <td style="padding:.45rem .75rem">
                        <span style="display:inline-flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:600;color:${color}">
                            <i class="fas ${icon}"></i>
                            ${label}
                        </span>
                    </td>
                    <td style="padding:.45rem .75rem;color:${isOk ? '#64748b' : color};font-size:.78rem">${escapeHtml(r.reason || '—')}</td>
                </tr>`;
            }).join('');
        }
        openOverlay('classImportResultsOverlay');
    }

    function downloadCsvTemplate() {
        const headers = 'class_name,class_code,section,program_name,grade_level_name,academic_year_name,room_number,max_students,status';

        // Build hint lines from loaded reference data
        const programHints     = S.programs.map(p => p.program_name).join(' | ') || 'Science | Arts | Business';
        const gradeLevelHints  = S.gradeLevels.map(g => g.grade_level_name || g.level_name || g.name).join(' | ') || 'Grade 10 | Grade 11 | Grade 12';
        const yearHints        = S.academicYears.map(a => a.year_name).join(' | ') || '2025/2026';

        const hint1 = `# Programs available: ${programHints}`;
        const hint2 = `# Grade Levels available: ${gradeLevelHints}`;
        const hint3 = `# Academic Years available: ${yearHints}`;
        const hint4 = '# status: active or inactive (default: active). Rows starting with # are ignored.';

        // Pick first available values for the sample row
        const sampleProgram  = S.programs[0]?.program_name || 'Science';
        const sampleGrade    = S.gradeLevels[0]?.grade_level_name || S.gradeLevels[0]?.level_name || 'Grade 10';
        const sampleYear     = S.academicYears.find(a => a.is_current)?.year_name || S.academicYears[0]?.year_name || '2025/2026';
        const sample         = `SHS 1 Science A,1SCI-A,A,${sampleProgram},${sampleGrade},${sampleYear},Block A Room 5,50,active`;

        downloadCsv([hint1, hint2, hint3, hint4, headers, sample].join('\n'), 'classes_import_template.csv');
    }

    // ─── DOM / overlay helpers ────────────────────────────────────────────────
    function showEl(id)      { const el = document.getElementById(id); if (el) el.style.display = ''; }
    function hideEl(id)      { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    function setElText(id,t) { const el = document.getElementById(id); if (el) el.textContent = t; }
    function openOverlay(id)  { const el = document.getElementById(id); if (el) el.classList.add('open'); }
    function closeOverlay(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }

    // ─── CSV utilities ────────────────────────────────────────────────────────
    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    function downloadCsv(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    }

    function parseCsv(text) {
        const lines  = text.trim().split(/\r?\n/);
        const errors = [];
        if (lines.length < 2) { errors.push('CSV file appears empty'); return { rows: [], errors }; }

        const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,'').toLowerCase().replace(/\s+/g,'_'));
        const rows = [];
        const numericFields = new Set(['program_id','grade_level_id','academic_year_id','max_students','class_teacher_id']);
        // name columns — kept as strings even if value looks numeric
        const nameFields    = new Set(['program_name','grade_level_name','academic_year_name']);

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trimStart().startsWith('#')) continue; // skip comment rows
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g,''));
            if (cols.every(c => c === '')) continue;
            const row = {};
            rawHeaders.forEach((h, idx) => {
                let v = (cols[idx] !== undefined ? cols[idx] : '').trim();
                if (v === '') {
                    row[h] = null;
                } else if (nameFields.has(h)) {
                    row[h] = v;
                } else {
                    row[h] = numericFields.has(h) ? Number(v) || null : v;
                }
            });
            rows.push(row);
        }
        return { rows, errors };
    }

})();
