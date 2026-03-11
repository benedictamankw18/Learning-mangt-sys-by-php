/* ============================================
   Teachers Management Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    // ─── State ────────────────────────────────────────────────────────────────
    const S = {
        teachers: [],
        programs: [],
        subjects: [],
        total: 0,
        page: 1,
        limit: 20,
        search: '',
        programId: '',
        subjectId: '',
        status: '',       // client-side filter
        selectedUuids: new Set(),
        editingUuid: null,
        importRows: [],
        searchTimer: null,
        assignSubjectsTeacher: null,  // { uuid, teacher_id }
        currentTerm: null,            // { academic_year_id, semester_id, start_date, end_date }
        currentAssignments: [],       // class_subjects records for this teacher
    };

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'teachers') {
            initTeachersPage();
        }
    });

    function initTeachersPage() {
        loadPrograms();
        loadSubjects();
        setupEventListeners();
        loadTeachers().then(() => {
            try {
                const editUuid = sessionStorage.getItem('lms_teacher_edit_uuid');
                if (editUuid) {
                    sessionStorage.removeItem('lms_teacher_edit_uuid');
                    openTeacherModal(editUuid);
                }
            } catch (_) {}
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function q(sel, ctx) { return (ctx || document).querySelector(sel); }
    function on(id, ev, fn) { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); }

    async function loadSubjects() {
        try {
            const res = await API.get(API_ENDPOINTS.SUBJECTS, { limit: 1000 });
            const d = res?.data;
            S.subjects = Array.isArray(d) ? d
                       : Array.isArray(d?.data) ? d.data
                       : Array.isArray(d?.subjects) ? d.subjects
                       : [];
            populateSubjectSelects();
        } catch (_) {}
    }

    function populateSubjectSelects() {
        const options = S.subjects.map(s =>
            `<option value="${s.subject_id}">${escHtml(s.subject_name)}${s.subject_code ? ` (${escHtml(s.subject_code)})` : ''}</option>`
        ).join('');
        const filterSel = document.getElementById('teacherSubjectFilter');
        if (filterSel) filterSel.innerHTML = '<option value="">All Subjects</option>' + options;
    }

    async function loadPrograms() {
        try {
            const res = await API.get(API_ENDPOINTS.PROGRAMS_ACTIVE);
            const d = res?.data;
            S.programs = Array.isArray(d) ? d
                       : Array.isArray(d?.data) ? d.data
                       : Array.isArray(d?.programs) ? d.programs
                       : [];
            populateProgramSelects();
            // Update programs stat in case teachers already loaded
            const el = document.getElementById('statPrograms');
            if (el) el.textContent = S.programs.length;
        } catch (_) {}
    }

    function populateProgramSelects() {
        const options = S.programs.map(p =>
            `<option value="${p.program_id}">${escHtml(p.program_name)}</option>`
        ).join('');
        const filterSel = document.getElementById('teacherProgramFilter');
        if (filterSel) filterSel.innerHTML = '<option value="">All Departments</option>' + options;
        const modalSel = document.getElementById('tfProgram');
        if (modalSel) modalSel.innerHTML = '<option value="">Select Department</option>' + options;
    }

    function showToast(msg, type) {
        if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
        console.log(`[${type}] ${msg}`);
    }

    function showModal(title, msg, onConfirm) {
        if (typeof window.showModal === 'function') { window.showModal(title, msg, onConfirm); return; }
        if (confirm(`${title}\n${msg}`)) onConfirm();
    }

    function fmtDate(d) {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
        catch (_) { return d; }
    }

    function initials(first, last) {
        return ((first || '').charAt(0) + (last || '').charAt(0)).toUpperCase() || '?';
    }

    function isActive(t) {
        return !t.employment_end_date && !!+t.is_active;
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────
    function setupEventListeners() {
        on('addTeacherBtn', 'click', () => openTeacherModal(null));
        on('exportTeachersBtn',    'click', exportTeachers);
        on('exportPDFTeachersBtn', 'click', exportTeachersPDF);
        on('importTeachersBtn', 'click', openImportModal);

        // Import modal
        on('teacherImportDropZone', 'click', () => q('#teacherImportFileInput').click());
        on('teacherImportFileInput', 'change', e => handleImportFile(e.target.files[0]));
        on('teacherDownloadTemplateLink', 'click', e => { e.preventDefault(); downloadCsvTemplate(); });
        on('cancelTeacherImportBtn', 'click', closeImportModal);
        on('closeTeacherImportModalBtn', 'click', closeImportModal);
        on('confirmTeacherImportBtn', 'click', confirmImport);
        on('closeTeacherImportResultsBtn', 'click', closeImportResults);
        on('closeTeacherImportResultsDoneBtn', 'click', closeImportResults);
        on('teacherImportResultsOverlay', 'click', e => { if (e.target.id === 'teacherImportResultsOverlay') closeImportResults(); });

        const dropZone = q('#teacherImportDropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
            dropZone.addEventListener('drop', e => {
                e.preventDefault(); dropZone.classList.remove('dragover');
                handleImportFile(e.dataTransfer.files[0]);
            });
        }

        // Teacher modal
        on('closeTeacherModalBtn', 'click', closeTeacherModal);
        on('cancelTeacherModalBtn', 'click', closeTeacherModal);
        on('saveTeacherBtn', 'click', saveTeacher);
        on('teacherModalOverlay', 'click', e => { if (e.target.id === 'teacherModalOverlay') closeTeacherModal(); });

        // Password toggle
        on('tfPasswordToggle', 'click', () => {
            const input = q('#tfPassword');
            const icon  = q('#tfPasswordToggleIcon');
            if (!input) return;
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            if (icon) { icon.classList.toggle('fa-eye', showing); icon.classList.toggle('fa-eye-slash', !showing); }
        });

        // Generate password
        on('tfPasswordGenerate', 'click', () => {
            const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
            let pwd = '';
            const arr = new Uint8Array(12);
            crypto.getRandomValues(arr);
            arr.forEach(b => { pwd += charset[b % charset.length]; });
            const input = q('#tfPassword');
            if (input) { input.type = 'text'; input.value = pwd; }
            const icon = q('#tfPasswordToggleIcon');
            if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
            clearFieldError('tfPassword');
        });

        // Username edit toggle
        on('tfUsernameEditBtn', 'click', () => toggleLock('tfUsername', 'tfUsernameEditIcon'));

        // Employee ID edit toggle
        on('tfEmployeeIdEditBtn', 'click', () => toggleLock('tfEmployeeId', 'tfEmployeeIdEditIcon'));

        // Auto-generate username from first/last name
        on('tfFirstName', 'input', () => autoGenUsername());
        on('tfLastName',  'input', () => autoGenUsername());

        // Search
        const searchInput = q('#teacherSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(S.searchTimer);
                S.searchTimer = setTimeout(() => {
                    S.search = searchInput.value.trim();
                    S.page = 1;
                    loadTeachers();
                }, 350);
            });
        }

        // Filters
        on('teacherProgramFilter', 'change', () => {
            S.programId = document.getElementById('teacherProgramFilter').value;
            S.page = 1;
            loadTeachers();
        });
        // Subject filter
        on('teacherSubjectFilter', 'change', () => {
            S.subjectId = document.getElementById('teacherSubjectFilter').value;
            S.page = 1;
            loadTeachers();
        });

        on('teacherStatusFilter', 'change', () => {
            S.status = q('#teacherStatusFilter').value;
            renderTeachers();
        });

        // Select all
        on('teacherSelectAll', 'change', e => {
            document.querySelectorAll('.teacher-row-cb').forEach(cb => {
                cb.checked = e.target.checked;
                const uuid = cb.dataset.uuid;
                if (e.target.checked) S.selectedUuids.add(uuid);
                else S.selectedUuids.delete(uuid);
            });
            updateBulkActions();
        });
        on('teacherSelectAllHeader', 'change', e => {
            document.querySelectorAll('.teacher-row-cb').forEach(cb => {
                cb.checked = e.target.checked;
                const uuid = cb.dataset.uuid;
                if (e.target.checked) S.selectedUuids.add(uuid);
                else S.selectedUuids.delete(uuid);
            });
            updateBulkActions();
        });

        on('teacherDeleteSelectedBtn', 'click', deleteSelected);

        // Assign to class sections modal
        on('closeAssignSubjectsBtn',        'click', closeAssignSubjectsModal);
        on('doneAssignSubjectsBtn',          'click', closeAssignSubjectsModal);
        on('confirmAssignClassSectionsBtn',  'click', assignToSelectedClasses);
        on('assignSubjectsOverlay', 'click', e => { if (e.target.id === 'assignSubjectsOverlay') closeAssignSubjectsModal(); });
    }

    function toggleLock(inputId, iconId) {
        const input = q('#' + inputId);
        const icon  = q('#' + iconId);
        if (!input) return;
        const isReadOnly = input.readOnly;
        input.readOnly = !isReadOnly;
        if (icon) {
            icon.classList.toggle('fa-pencil-alt', !isReadOnly);
            icon.classList.toggle('fa-lock', isReadOnly);
        }
    }

    function autoGenUsername() {
        const un = q('#tfUsername');
        if (!un || !un.readOnly) return;
        const first = (q('#tfFirstName').value || '').trim().toLowerCase().replace(/\s+/g, '');
        const last  = (q('#tfLastName').value  || '').trim().toLowerCase().replace(/\s+/g, '');
        if (first || last) {
            un.value = (first + (last ? '.' + last : '')).substring(0, 30);
        }
    }

    function updateBulkActions() {
        const btn = q('#teacherDeleteSelectedBtn');
        if (btn) btn.style.display = S.selectedUuids.size ? 'inline-flex' : 'none';
    }

    // ─── Load Teachers ────────────────────────────────────────────────────────
    async function loadTeachers() {
        const params = { page: S.page, limit: S.subjectId ? 10000 : S.limit };
        if (S.search)    params.search     = S.search;
        if (S.programId) params.program_id = S.programId;

        try {
            const [res, subjectRes] = await Promise.all([
                API.get(API_ENDPOINTS.TEACHERS, params),
                S.subjectId ? API.get(API_ENDPOINTS.SUBJECT_TEACHERS(S.subjectId)) : Promise.resolve(null)
            ]);

            if (res && res.success) {
                let teachers = res.data.teachers || [];
                let pagination = res.data.pagination;

                if (S.subjectId && subjectRes != null) {
                    const ids = new Set((subjectRes?.data || []).map(t => Number(t.teacher_id)));
                    teachers = teachers.filter(t => ids.has(Number(t.teacher_id)));
                    S.total  = teachers.length;
                    pagination = null;
                } else {
                    S.total = pagination ? pagination.total : teachers.length;
                }

                S.teachers = teachers;
                renderTeachers();
                renderPagination();
                updateStats(pagination);
            } else {
                showTableError(res?.message || 'Failed to load teachers.');
            }
        } catch (err) {
            console.error('Load teachers error:', err);
            showTableError('Network error. Please try again.');
        }
    }

    function updateStats(pagination) {
        const total  = pagination ? pagination.total : S.total;
        const active = S.teachers.filter(isActive).length;
        const progs  = S.programs.length;

        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('statTotalTeachers', total);
        setEl('statActiveTeachers', active);
        setEl('statPrograms', S.programs.length || '—');
        setEl('statNewThisMonth', pagination?.new_this_month ?? '—');
    }

    function renderTeachers() {
        const tbody = document.getElementById('teachersTableBody');
        if (!tbody) return;

        let list = S.teachers;
        if (S.status === 'active')   list = list.filter(isActive);
        if (S.status === 'inactive') list = list.filter(t => !isActive(t));

        const countLabel = document.getElementById('teachersCountLabel');
        if (countLabel) countLabel.textContent = `Showing ${list.length} of ${S.total}`;

        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8">No teachers found.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(t => {
            const active = isActive(t);
            const statusBadge = active
                ? `<span class="badge badge-active">Active</span>`
                : `<span class="badge badge-inactive">Inactive</span>`;
            const fullName = `${t.first_name || ''} ${t.last_name || ''}`.trim() || '—';
            const init = initials(t.first_name, t.last_name);
            const checked = S.selectedUuids.has(t.uuid) ? 'checked' : '';

            return `
            <tr>
              <td><input type="checkbox" class="teacher-row-cb" data-uuid="${t.uuid}" ${checked}></td>
              <td>
                <div class="teacher-cell">
                  <div class="teacher-initials">${init}</div>
                  <div>
                    <div class="teacher-name">${escHtml(fullName)}</div>
                    <div class="teacher-email">${escHtml(t.email || '')}</div>
                  </div>
                </div>
              </td>
              <td>${escHtml(t.employee_id || '—')}</td>
              <td>${escHtml(t.program_name || '—')}</td>
              <td>${escHtml(t.qualification || '—')}</td>
              <td>${fmtDate(t.hire_date)}</td>
              <td>${statusBadge}</td>
              <td>
                <div class="teachers-actions">
                  <button class="btn-icon-sm view" title="View details" onclick="teacherView('${t.uuid}')">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon-sm schedule" title="View Schedule" onclick="teacherViewSchedule('${t.uuid}')">
                    <i class="fas fa-calendar-alt"></i>
                  </button>
                  <button class="btn-icon-sm assign" title="Assign Subjects" onclick="teacherAssignSubjects('${t.uuid}', ${Number(t.teacher_id)})">
                    <i class="fas fa-book-open"></i>
                  </button>
                  <button class="btn-icon-sm edit" title="Edit" onclick="teacherEdit('${t.uuid}')">
                    <i class="fas fa-pencil-alt"></i>
                  </button>
                  <button class="btn-icon-sm danger" title="${active ? 'Deactivate' : 'Activate'}" onclick="teacherToggle('${t.uuid}', ${active})">
                    <i class="fas fa-${active ? 'user-slash' : 'user-check'}"></i>
                  </button>
                </div>
              </td>
            </tr>`;
        }).join('');

        // Row checkboxes
        document.querySelectorAll('.teacher-row-cb').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) S.selectedUuids.add(cb.dataset.uuid);
                else S.selectedUuids.delete(cb.dataset.uuid);
                updateBulkActions();
            });
        });
    }

    function showTableError(msg) {
        const tbody = document.getElementById('teachersTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#ef4444">${escHtml(msg)}</td></tr>`;
    }

    // ─── Pagination ───────────────────────────────────────────────────────────
    function renderPagination() {
        const info = document.getElementById('teachersPaginationInfo');
        const btns = document.getElementById('teachersPaginationBtns');
        if (!info || !btns) return;

        const totalPages = Math.max(1, Math.ceil(S.total / S.limit));
        const start = Math.min((S.page - 1) * S.limit + 1, S.total);
        const end   = Math.min(S.page * S.limit, S.total);
        info.textContent = S.total ? `Showing ${start}–${end} of ${S.total} teacher${S.total !== 1 ? 's' : ''}` : 'No records';

        let html = `<button ${S.page <= 1 ? 'disabled' : ''} onclick="teacherPrev()"><i class="fas fa-chevron-left"></i></button>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= S.page - 1 && i <= S.page + 1)) {
                html += `<button class="${i === S.page ? 'active' : ''}" onclick="teacherGoPage(${i})">${i}</button>`;
            } else if (i === 2 || i === totalPages - 1) {
                html += `<button disabled>…</button>`;
            }
        }
        html += `<button ${S.page >= totalPages ? 'disabled' : ''} onclick="teacherNext()"><i class="fas fa-chevron-right"></i></button>`;
        btns.innerHTML = html;
    }

    window.teacherPrev    = () => { if (S.page > 1) { S.page--; loadTeachers(); } };
    window.teacherNext    = () => { if (S.page < Math.ceil(S.total / S.limit)) { S.page++; loadTeachers(); } };
    window.teacherGoPage  = (p) => { S.page = p; loadTeachers(); };
    window.teacherView    = (uuid) => {
        try { sessionStorage.setItem('lms_teacher_uuid', uuid); } catch (_) {}
        window.location.hash = '#teacher-details';
    };
    window.teacherViewSchedule = (uuid) => {
        try {
            sessionStorage.setItem('lms_teacher_uuid', uuid);
            sessionStorage.setItem('lms_teacher_tab', 'schedule');
        } catch (_) {}
        window.location.hash = '#teacher-details';
    };
    window.teacherAssignSubjects = (uuid, teacherId) => openAssignSubjectsModal(uuid, teacherId);
    window.teacherEdit    = (uuid) => openTeacherModal(uuid);
    window.teacherToggle  = (uuid, isCurrentlyActive) => {
        const action = isCurrentlyActive ? 'deactivate' : 'activate';
        showModal(`${action.charAt(0).toUpperCase() + action.slice(1)} Teacher`,
            `Are you sure you want to ${action} this teacher?`,
            () => toggleTeacherStatus(uuid, isCurrentlyActive));
    };

    async function toggleTeacherStatus(uuid, isCurrentlyActive) {
        try {
            const payload = isCurrentlyActive
                ? { is_active: 0, employment_end_date: new Date().toISOString().split('T')[0] }
                : { is_active: 1, employment_end_date: null };
            const res = await API.put(API_ENDPOINTS.TEACHER_BY_UUID(uuid), payload);
            if (res && res.success) {
                showToast(`Teacher ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully.`, 'success');
                loadTeachers();
            } else {
                showToast(res?.message || 'Action failed.', 'error');
            }
        } catch (err) {
            console.error('Toggle teacher status error:', err);
            showToast('Network error. Please try again.', 'error');
        }
    }

    async function deleteSelected() {
        if (!S.selectedUuids.size) return;
        showModal('Delete Teachers', `Delete ${S.selectedUuids.size} selected teacher(s)?`, async () => {
            const uuids = Array.from(S.selectedUuids);
            let done = 0;
            for (const uuid of uuids) {
                try {
                    await API.delete(API_ENDPOINTS.TEACHER_BY_UUID(uuid));
                    done++;
                } catch (_) {}
            }
            S.selectedUuids.clear();
            updateBulkActions();
            showToast(`${done} teacher(s) deactivated.`, 'success');
            loadTeachers();
        });
    }

    // ─── Assign Class-Subjects Modal ──────────────────────────────────────────
    async function openAssignSubjectsModal(uuid, teacherId) {
        S.assignSubjectsTeacher = { uuid, teacher_id: Number(teacherId) };

        const teacher = S.teachers.find(t => t.uuid === uuid);
        const name = teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : 'Teacher';
        const titleEl = document.getElementById('assignSubjectsTitle');
        if (titleEl) titleEl.textContent = `Assign Subjects — ${name}`;

        const msgEl = document.getElementById('assignClassSectionsMsg');
        if (msgEl) msgEl.textContent = '';

        const overlay = document.getElementById('assignSubjectsOverlay');
        if (overlay) overlay.classList.add('open');

        populateAssignSubjectSelect();
        await loadAndRenderAssignPanel();
    }

    // Populate the subject <select> from already-loaded S.subjects
    function populateAssignSubjectSelect() {
        const sel = document.getElementById('assignSubjectSelect');
        if (!sel) return;
        sel.innerHTML = '<option value="">— Select a subject —</option>' +
            S.subjects.map(s =>
                `<option value="${s.subject_id}">${escHtml(s.subject_name)}${s.subject_code ? ` (${escHtml(s.subject_code)})` : ''}</option>`
            ).join('');
        sel.onchange = autoCheckClassesBySubject;
    }

    function closeAssignSubjectsModal() {
        const overlay = document.getElementById('assignSubjectsOverlay');
        if (overlay) overlay.classList.remove('open');
        S.assignSubjectsTeacher = null;
    }

    // Parallel fetch: existing class-subject assignments + all classes + current term
    async function loadAndRenderAssignPanel() {
        if (!S.assignSubjectsTeacher) return;
        const listEl  = document.getElementById('assignedClassSubjectsList');
        const checkEl = document.getElementById('assignClassSectionsList');
        const msgEl   = document.getElementById('assignClassSectionsMsg');
        if (listEl)  listEl.innerHTML  = '<p style="color:#94a3b8;font-size:.875rem;text-align:center;padding:.75rem"><i class="fas fa-spinner fa-spin"></i> Loading…</p>';
        if (checkEl) checkEl.innerHTML = '<p style="color:#94a3b8;font-size:.8rem;text-align:center;padding:.75rem"><i class="fas fa-spinner fa-spin"></i> Loading…</p>';
        if (msgEl)   msgEl.textContent = '';
        try {
            const [csRes, classRes, ayRes, semRes] = await Promise.all([
                API.get(API_ENDPOINTS.CLASS_SUBJECTS, { teacher_id: S.assignSubjectsTeacher.teacher_id, limit: 500 }),
                API.get(API_ENDPOINTS.CLASSES, { limit: 200 }),
                API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT).catch(() => null),
                API.get(API_ENDPOINTS.SEMESTER_CURRENT).catch(() => null),
            ]);
            const assignments = csRes?.data?.data   || csRes?.data   || [];
            const classes     = classRes?.data?.data || classRes?.data || [];

            // Store current academic year + semester for use when POSTing
            const ay  = ayRes?.data?.data  || ayRes?.data  || null;
            const sem = semRes?.data?.data || semRes?.data || null;
            S.currentTerm = (ay || sem) ? {
                academic_year_id: ay?.academic_year_id  ?? null,
                semester_id:      sem?.semester_id      ?? null,
                start_date:       sem?.start_date       ?? null,
                end_date:         sem?.end_date         ?? null,
            } : null;

            // Show term info badge in modal
            const termEl = document.getElementById('assignTermInfo');
            if (termEl) {
                if (S.currentTerm?.academic_year_id) {
                    termEl.textContent = [
                        ay?.year_name   ? `Year: ${ay.year_name}`          : '',
                        sem?.semester_name ? `Sem: ${sem.semester_name}` : '',
                    ].filter(Boolean).join('  •  ');
                    termEl.style.display = '';
                } else {
                    termEl.textContent = 'No active academic year/semester found — record will be saved without term.';
                    termEl.style.display = '';
                    termEl.style.color = '#d97706';
                }
            }

            S.currentAssignments = Array.isArray(assignments) ? assignments : [];
            renderAssignedClassSubjects(S.currentAssignments);
            renderClassCheckboxes(Array.isArray(classes) ? classes : []);
            autoCheckClassesBySubject();
        } catch (_) {
            if (listEl)  listEl.innerHTML  = '<p style="color:#ef4444;font-size:.875rem;text-align:center;padding:.75rem">Failed to load assignments.</p>';
            if (checkEl) checkEl.innerHTML = '<p style="color:#ef4444;font-size:.8rem;text-align:center;padding:.75rem">Failed to load classes.</p>';
        }
    }

    // Auto-check class checkboxes for classes already assigned the currently-selected subject
    function autoCheckClassesBySubject() {
        const sel = document.getElementById('assignSubjectSelect');
        const subjectId = sel ? Number(sel.value) : 0;
        const assignedClassIds = new Set(
            S.currentAssignments
                .filter(a => Number(a.subject_id) === subjectId)
                .map(a => String(a.class_id))
        );
        document.querySelectorAll('.assign-cs-check').forEach(cb => {
            cb.checked = assignedClassIds.has(cb.value);
            const row = cb.closest('.assign-class-section-row');
            if (row) row.classList.toggle('is-me', cb.checked);
        });
    }

    // Build a human-readable class label
    function buildClassName(cs) {
        return cs.class_name || cs.class_code || `Class ${cs.class_id}`;
    }

    // Top panel — list of class_subjects records already assigned to this teacher
    function renderAssignedClassSubjects(records) {
        const el = document.getElementById('assignedClassSubjectsList');
        if (!el) return;
        if (!records.length) {
            el.innerHTML = '<p style="color:#94a3b8;font-size:.875rem;text-align:center;padding:.75rem">No class-subjects assigned yet.</p>';
            return;
        }
        el.innerHTML = records.map(r => `
            <div class="assign-subjects-list-item">
                <div>
                    <span class="assign-subjects-subject-name">${escHtml(r.subject_name || '')}</span>
                    <span class="assign-subjects-subject-code">${escHtml(r.class_name || r.class_code || '')}</span>
                    ${r.is_core ? '<span class="assign-subjects-core-badge">Core</span>' : ''}
                </div>
                <button class="btn-icon-sm danger" title="Remove assignment"
                    data-course-id="${escHtml(String(r.course_id))}" style="flex-shrink:0">
                    <i class="fas fa-times"></i>
                </button>
            </div>`).join('');
        el.querySelectorAll('[data-course-id]').forEach(btn => {
            btn.onclick = () => removeClassSubjectAssignment(btn.dataset.courseId);
        });
    }

    // Bottom panel — plain checkbox list of all classes
    function renderClassCheckboxes(classes) {
        const el = document.getElementById('assignClassSectionsList');
        if (!el) return;
        if (!classes.length) {
            el.innerHTML = '<p style="color:#94a3b8;font-size:.8rem;padding:.5rem 0">No classes found.</p>';
            return;
        }
        el.innerHTML = classes.map(c => `
            <label class="assign-class-section-row">
                <input type="checkbox" class="assign-cs-check" value="${c.class_id}">
                <div class="assign-cs-info">
                    <span class="assign-cs-class">${escHtml(buildClassName(c))}</span>
                    ${c.student_count != null ? `<span style="color:#94a3b8;font-size:.75rem">${c.student_count} students</span>` : ''}
                </div>
            </label>`).join('');
    }

    async function assignToSelectedClasses() {
        if (!S.assignSubjectsTeacher) return;
        const msgEl      = document.getElementById('assignClassSectionsMsg');
        const confirmBtn = document.getElementById('confirmAssignClassSectionsBtn');
        const subjectSel = document.getElementById('assignSubjectSelect');
        if (msgEl) msgEl.textContent = '';

        const subjectId = subjectSel ? Number(subjectSel.value) : 0;
        if (!subjectId) {
            if (msgEl) { msgEl.textContent = 'Please select a subject first.'; msgEl.style.color = '#ef4444'; }
            return;
        }
        const checked = [...document.querySelectorAll('.assign-cs-check:checked')];
        if (!checked.length) {
            if (msgEl) { msgEl.textContent = 'Please select at least one class.'; msgEl.style.color = '#ef4444'; }
            return;
        }

        if (confirmBtn) confirmBtn.disabled = true;
        let assigned = 0, skipped = 0, errors = 0;

        for (const cb of checked) {
            try {
                const payload = {
                    class_id:   Number(cb.value),
                    subject_id: subjectId,
                    teacher_id: S.assignSubjectsTeacher.teacher_id,
                };
                if (S.currentTerm) {
                    if (S.currentTerm.academic_year_id) payload.academic_year_id = S.currentTerm.academic_year_id;
                    if (S.currentTerm.semester_id)      payload.semester_id      = S.currentTerm.semester_id;
                    if (S.currentTerm.start_date)       payload.start_date       = S.currentTerm.start_date;
                    if (S.currentTerm.end_date)         payload.end_date         = S.currentTerm.end_date;
                }
                const res = await API.post(API_ENDPOINTS.CLASS_SUBJECTS, payload);
                if (res?.success !== false) assigned++; else errors++;
            } catch (err) {
                // HTTP 400 = record already exists
                if (err?.status === 400 || err?.response?.status === 400) skipped++;
                else errors++;
            }
        }

        if (confirmBtn) confirmBtn.disabled = false;
        document.querySelectorAll('.assign-cs-check').forEach(cb => { cb.checked = false; });

        const parts = [];
        if (assigned) parts.push(`${assigned} assigned`);
        if (skipped)  parts.push(`${skipped} already existed`);
        if (errors)   parts.push(`${errors} failed`);
        if (msgEl) {
            msgEl.textContent = parts.join(', ') || 'No changes made.';
            msgEl.style.color = (errors && !assigned && !skipped) ? '#ef4444' : '#16a34a';
        }

        // Refresh top panel only
        try {
            const csRes = await API.get(API_ENDPOINTS.CLASS_SUBJECTS, { teacher_id: S.assignSubjectsTeacher.teacher_id, limit: 500 });
            const assignments = csRes?.data?.data || csRes?.data || [];
            renderAssignedClassSubjects(Array.isArray(assignments) ? assignments : []);
        } catch (_) {}
    }

    window.removeClassSubjectAssignment = async (courseId) => {
        try {
            const res = await API.delete(API_ENDPOINTS.CLASS_SUBJECT_BY_ID(courseId));
            if (res?.success !== false) {
                if (S.assignSubjectsTeacher) {
                    const csRes = await API.get(API_ENDPOINTS.CLASS_SUBJECTS, { teacher_id: S.assignSubjectsTeacher.teacher_id, limit: 500 });
                    const assignments = csRes?.data?.data || csRes?.data || [];
                    renderAssignedClassSubjects(Array.isArray(assignments) ? assignments : []);
                }
            } else {
                showToast(res?.message || 'Failed to remove assignment.', 'error');
            }
        } catch (_) {
            showToast('Failed to remove assignment.', 'error');
        }
    };

    // ─── Add / Edit Modal ─────────────────────────────────────────────────────
    async function openTeacherModal(uuid) {
        S.editingUuid = uuid;
        clearModalErrors();
        resetModalFields();

        const overlay = document.getElementById('teacherModalOverlay');
        const titleEl = document.getElementById('teacherModalTitle');
        const btnText = document.getElementById('saveTeacherBtnText');
        const pwField = document.getElementById('tfPasswordField');
        const statusField = document.getElementById('tfStatusField');

        if (!overlay) return;

        if (uuid) {
            // Edit mode
            if (titleEl) titleEl.textContent = 'Edit Teacher';
            if (btnText) btnText.textContent = 'Save Changes';
            if (pwField) pwField.style.display = 'none';
            if (statusField) statusField.style.display = '';

            try {
                const res = await API.get(API_ENDPOINTS.TEACHER_BY_UUID(uuid));
                if (res && res.success) {
                    const t = res.data;
                    setVal('tfFirstName',    t.first_name    || '');
                    setVal('tfLastName',     t.last_name     || '');
                    setVal('tfEmail',        t.email         || '');
                    setVal('tfUsername',     t.username      || '');
                    setVal('tfPhone',        t.phone_number  || '');
                    setVal('tfAddress',      t.address       || '');
                    setVal('tfEmployeeId',   t.employee_id   || '');
                    setVal('tfProgram',       t.program_id    != null ? String(t.program_id) : '');
                    setVal('tfQualification', t.qualification || '');
                    setVal('tfSpecialization', t.specialization || '');
                    setVal('tfHireDate',     t.hire_date     || '');
                    setVal('tfYearsExp',     t.years_of_experience !== null ? t.years_of_experience : '');
                    setVal('tfStatus', isActive(t) ? 'active' : 'inactive');

                    lockField('tfUsername', true);
                    lockField('tfEmployeeId', true);
                }
            } catch (err) {
                console.error('Load teacher for edit error:', err);
            }
        } else {
            // Add mode
            if (titleEl) titleEl.textContent = 'Add Teacher';
            if (btnText) btnText.textContent = 'Add Teacher';
            if (pwField) pwField.style.display = '';
            if (statusField) statusField.style.display = 'none';

            setVal('tfHireDate', new Date().toISOString().split('T')[0]);
            lockField('tfUsername', true);
            lockField('tfEmployeeId', true);

            // Auto-fetch next employee ID
            try {
                const res = await API.get(API_ENDPOINTS.TEACHER_GENERATE_ID);
                if (res && res.success) {
                    setVal('tfEmployeeId', res.data.next_id || '');
                }
            } catch (_) {}
        }

        overlay.classList.add('open');
        const firstInput = q('#tfFirstName');
        if (firstInput) setTimeout(() => firstInput.focus(), 50);
    }

    function closeTeacherModal() {
        const overlay = document.getElementById('teacherModalOverlay');
        if (overlay) overlay.classList.remove('open');
        S.editingUuid = null;
    }

    function resetModalFields() {
        ['tfFirstName','tfLastName','tfEmail','tfUsername','tfPassword',
         'tfPhone','tfAddress','tfEmployeeId','tfProgram','tfQualification',
         'tfSpecialization','tfHireDate','tfYearsExp','tfStatus'
        ].forEach(id => setVal(id, ''));
    }

    function lockField(id, locked) {
        const el = document.getElementById(id);
        if (el) el.readOnly = locked;
        const iconId = id === 'tfUsername' ? 'tfUsernameEditIcon' : 'tfEmployeeIdEditIcon';
        const icon = document.getElementById(iconId);
        if (icon) {
            icon.classList.toggle('fa-pencil-alt', locked);
            icon.classList.toggle('fa-lock', !locked);
        }
    }

    async function saveTeacher() {
        clearModalErrors();
        const spinner = document.getElementById('saveTeacherSpinner');
        const btn     = document.getElementById('saveTeacherBtn');
        if (spinner) spinner.style.display = 'inline-block';
        if (btn) btn.disabled = true;

        try {
            const payload = buildTeacherPayload();

            // Username failsafe for add mode
            if (!S.editingUuid && !payload.username) {
                const first = (payload.first_name || '').trim().toLowerCase().replace(/\s+/g, '');
                const last  = (payload.last_name  || '').trim().toLowerCase().replace(/\s+/g, '');
                payload.username = (first + (last ? '.' + last : '')).substring(0, 30) || 'teacher_' + Date.now();
            }

            let res;
            if (S.editingUuid) {
                res = await API.put(API_ENDPOINTS.TEACHER_BY_UUID(S.editingUuid), payload);
            } else {
                res = await API.post(API_ENDPOINTS.TEACHERS, payload);
            }

            if (res && res.success) {
                closeTeacherModal();
                showToast(S.editingUuid ? 'Teacher updated successfully.' : 'Teacher added successfully.', 'success');
                loadTeachers();
            } else if (res && res.status === 422) {
                applyValidationErrors(res.errors || res.body?.errors || {});
            } else {
                showToast(res?.message || 'Failed to save teacher.', 'error');
            }
        } catch (err) {
            console.error('Save teacher error:', err);
            if (err.body) {
                applyValidationErrors(err.body.errors || {});
            } else {
                showToast('Network error. Please try again.', 'error');
            }
        } finally {
            if (spinner) spinner.style.display = 'none';
            if (btn) btn.disabled = false;
        }
    }

    function buildTeacherPayload() {
        const payload = {
            first_name:          getVal('tfFirstName'),
            last_name:           getVal('tfLastName'),
            email:               getVal('tfEmail'),
            username:            getVal('tfUsername'),
            phone_number:        getVal('tfPhone')   || null,
            address:             getVal('tfAddress') || null,
            employee_id:         getVal('tfEmployeeId'),
            program_id:          getVal('tfProgram') ? parseInt(getVal('tfProgram'), 10) : null,
            qualification:       getVal('tfQualification') || null,
            specialization:      getVal('tfSpecialization') || null,
            hire_date:           getVal('tfHireDate')      || null,
            years_of_experience: getVal('tfYearsExp') !== '' ? parseInt(getVal('tfYearsExp'), 10) : null,
        };

        if (!S.editingUuid) {
            payload.password = getVal('tfPassword');
        } else {
            const statusVal = getVal('tfStatus');
            if (statusVal === 'inactive') {
                payload.is_active = 0;
                payload.employment_end_date = new Date().toISOString().split('T')[0];
            } else if (statusVal === 'active') {
                payload.is_active = 1;
                payload.employment_end_date = null;
            }
        }

        // Remove null-ish password on add
        if (!S.editingUuid && !payload.password) delete payload.password;

        return payload;
    }

    // ─── Validation Helpers ───────────────────────────────────────────────────
    const fieldMap = {
        first_name:          'tfFirstName',
        last_name:           'tfLastName',
        email:               'tfEmail',
        username:            'tfUsername',
        password:            'tfPassword',
        phone_number:        'tfPhone',
        address:             'tfAddress',
        employee_id:         'tfEmployeeId',
        program_id:          'tfProgram',
        qualification:       'tfQualification',
        specialization:      'tfSpecialization',
        hire_date:           'tfHireDate',
        years_of_experience: 'tfYearsExp',
    };

    function applyValidationErrors(errors) {
        Object.entries(errors).forEach(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            const inputId = fieldMap[field];
            if (inputId) {
                const el = document.getElementById(inputId);
                const errEl = document.getElementById(inputId + 'Err');
                if (el) el.classList.add('error');
                if (errEl) errEl.textContent = msg;
            } else {
                showToast(msg, 'error');
            }
        });
    }

    function clearModalErrors() {
        Object.values(fieldMap).forEach(id => {
            const el = document.getElementById(id);
            const errEl = document.getElementById(id + 'Err');
            if (el) el.classList.remove('error');
            if (errEl) errEl.textContent = '';
        });
    }

    function clearFieldError(id) {
        const el = document.getElementById(id);
        const errEl = document.getElementById(id + 'Err');
        if (el) el.classList.remove('error');
        if (errEl) errEl.textContent = '';
    }

    function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
    function getVal(id)    { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
    function escHtml(s)    { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    // ─── Export PDF ───────────────────────────────────────────────────────────
    async function exportTeachersPDF() {
        showToast('Preparing PDF…', 'info');

        let rows = S.teachers;
        // If filters are active or not all are loaded, fetch everything
        try {
            const params = new URLSearchParams({ page: 1, limit: 10000 });
            if (S.search)    params.set('search',     S.search);
            if (S.programId) params.set('program_id', S.programId);
            const res = await API.get(`${API_ENDPOINTS.TEACHERS}?${params}`);
            if (res && res.success) rows = res.data.teachers || [];
        } catch (_) { /* fall back to current page */ }

        if (!rows.length) { showToast('No teachers to export.', 'error'); return; }

        // Apply client-side status filter (same as renderTeachers)
        if (S.status === 'active')   rows = rows.filter(isActive);
        if (S.status === 'inactive') rows = rows.filter(t => !isActive(t));

        const date = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
        const filterLabel = [
            S.search    ? `Search: "${S.search}"` : '',
            S.programId ? `Program: ${S.programs.find(p => String(p.program_id) === String(S.programId))?.program_name || S.programId}` : '',
            S.status    ? `Status: ${S.status}` : '',
        ].filter(Boolean).join(' | ');

        const esc = v => String(v || '—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const fmt = d => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); } catch(_){return d;} };
        const badge = active =>
            active
                ? `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:#15803d;background:#dcfce7">Active</span>`
                : `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:#dc2626;background:#fee2e2">Inactive</span>`;

        const tableRows = rows.map((t, i) => `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
                <td>${i + 1}</td>
                <td>${esc(t.first_name)} ${esc(t.last_name)}</td>
                <td style="font-size:11px;color:#64748b">${esc(t.email)}</td>
                <td style="font-family:monospace;font-size:11px">${esc(t.employee_id)}</td>
                <td>${esc(t.program_name)}</td>
                <td>${esc(t.qualification)}</td>
                <td>${esc(t.specialization)}</td>
                <td>${fmt(t.hire_date)}</td>
                <td style="text-align:center">${t.years_of_experience !== null && t.years_of_experience !== undefined ? t.years_of_experience : '—'}</td>
                <td>${badge(isActive(t))}</td>
            </tr>`).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Teachers Export — ${date}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #6366f1; padding-bottom: 12px; }
  .header h1 { font-size: 18px; color: #4f46e5; }
  .header .meta { text-align: right; color: #64748b; font-size: 11px; line-height: 1.6; }
  .filter-bar { font-size: 11px; color: #64748b; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #4f46e5; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
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
      <h1>&#128203; Teacher Report</h1>
      <p style="color:#64748b;margin-top:2px">Total: <strong>${rows.length}</strong> teacher${rows.length !== 1 ? 's' : ''}</p>
    </div>
    <div class="meta">
      <div>Exported: ${date}</div>
      <button onclick="window.print()" style="margin-top:6px;padding:4px 12px;background:#4f46e5;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px">&#128438; Print / Save PDF</button>
    </div>
  </div>
  ${filterLabel ? `<div class="filter-bar">Filters: ${esc(filterLabel)}</div>` : ''}
  <table>
    <thead>
      <tr>
        <th>#</th><th>Teacher Name</th><th>Email</th><th>Employee ID</th><th>Department</th>
        <th>Qualification</th><th>Specialization</th><th>Hire Date</th><th>Yrs Exp</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">Generated by LMS &bull; ${date}</div>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=1200,height=750');
        if (!win) { showToast('Allow pop-ups to export PDF', 'error'); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
        showToast(`PDF ready — ${rows.length} teachers`, 'success');
    }

    // ─── Export CSV ───────────────────────────────────────────────────────────
    function exportTeachers() {
        if (!S.teachers.length) { showToast('No teachers to export.', 'error'); return; }
        const headers = ['First Name','Last Name','Email','Username','Employee ID','Department','Qualification','Specialization','Hire Date','Years Exp','Status'];
        const rows = S.teachers.map(t => [
            t.first_name || '', t.last_name || '', t.email || '', t.username || '',
            t.employee_id || '', t.program_name || '', t.qualification || '',
            t.specialization || '', t.hire_date || '',
            t.years_of_experience !== null ? t.years_of_experience : '',
            isActive(t) ? 'Active' : 'Inactive'
        ]);
        const now = new Date();
        const stamp = now.getFullYear()
            + String(now.getMonth() + 1).padStart(2, '0')
            + String(now.getDate()).padStart(2, '0')
            + '_' + String(now.getHours()).padStart(2, '0')
            + String(now.getMinutes()).padStart(2, '0')
            + String(now.getSeconds()).padStart(2, '0');
        downloadCsv([headers, ...rows], `teachers_export_${stamp}.csv`);
    }

    function downloadCsv(rows, filename) {
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    }

    // ─── Import CSV ───────────────────────────────────────────────────────────
    const CSV_COLUMNS = [
        'first_name','last_name','email','username','password',
        'employee_id','program_name','qualification','specialization',
        'hire_date','years_of_experience','phone_number','address'
    ];
    const NULLABLE_FIELDS = new Set([
        'program_name','qualification','specialization',
        'hire_date','years_of_experience','phone_number','address'
    ]);

    function openImportModal() {
        S.importRows = [];
        const overlay = document.getElementById('teacherImportModalOverlay');
        if (overlay) overlay.classList.add('open');
        const fileInput = document.getElementById('teacherImportFileInput');
        if (fileInput) fileInput.value = '';
        const preview = document.getElementById('teacherImportPreview');
        if (preview) preview.style.display = 'none';
        const confirmBtn = document.getElementById('confirmTeacherImportBtn');
        if (confirmBtn) confirmBtn.disabled = true;
    }

    function closeImportModal() {
        const overlay = document.getElementById('teacherImportModalOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    function closeImportResults() {
        const overlay = document.getElementById('teacherImportResultsOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    function downloadCsvTemplate() {
        const rows = [CSV_COLUMNS, [
            'Jane','Smith','jane.smith@school.com','jane.smith','Pass1234!',
            'TCH-2026-0001','Bachelor of Science','M.Sc.','Biology','2026-01-15','5',
            '+1234567890','123 Main St'
        ]];
        downloadCsv(rows, 'teachers_template.csv');
    }

    function handleImportFile(file) {
        if (!file) return;
        if (!file.name.endsWith('.csv')) { showToast('Please upload a CSV file.', 'error'); return; }
        const reader = new FileReader();
        reader.onload = e => {
            const rows = parseCsv(e.target.result);
            S.importRows = rows;
            renderImportPreview(rows);
        };
        reader.readAsText(file);
    }

    function parseCsv(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/\s+/g, '_'));
        return lines.slice(1).map(line => {
            const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,))/g) || [];
            const row = {};
            headers.forEach((h, i) => {
                let v = (vals[i] || '').replace(/^"|"$/g, '').trim();
                // Normalise M/D/YYYY → YYYY-MM-DD
                if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) {
                    const [m, d, y] = v.split('/');
                    const yr = y.length === 2 ? '20' + y : y;
                    v = `${yr}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
                }
                if (NULLABLE_FIELDS.has(h) && v === '') v = null;
                row[h] = v;
            });
            return row;
        });
    }

    function renderImportPreview(rows) {
        if (!rows.length) { showToast('No data rows found in CSV.', 'error'); return; }
        const preview = document.getElementById('teacherImportPreview');
        const countEl = document.getElementById('teacherImportPreviewCount');
        const headEl  = document.getElementById('teacherImportPreviewHead');
        const bodyEl  = document.getElementById('teacherImportPreviewBody');
        const confirmBtn = document.getElementById('confirmTeacherImportBtn');

        if (countEl) countEl.textContent = rows.length;
        if (headEl) headEl.innerHTML = `<tr>${Object.keys(rows[0]).map(k => `<th>${escHtml(k)}</th>`).join('')}</tr>`;
        if (bodyEl) {
            bodyEl.innerHTML = rows.slice(0, 5).map(r =>
                `<tr>${Object.values(r).map(v => `<td>${escHtml(v ?? '')}</td>`).join('')}</tr>`
            ).join('');
        }
        if (preview) preview.style.display = 'block';
        if (confirmBtn) confirmBtn.disabled = false;
    }

    async function confirmImport() {
        const spinner  = document.getElementById('teacherImportSpinner');
        const confirmBtn = document.getElementById('confirmTeacherImportBtn');
        const textEl   = document.getElementById('confirmTeacherImportText');
        if (spinner) spinner.style.display = 'inline-block';
        if (confirmBtn) confirmBtn.disabled = true;
        if (textEl) textEl.textContent = 'Importing…';

        const results = [];
        for (let i = 0; i < S.importRows.length; i++) {
            const row = { ...S.importRows[i] };
            const name = `${row.first_name || ''} ${row.last_name || ''}`.trim() || `Row ${i + 2}`;
            // Resolve program_name → program_id
            if (row.program_name !== undefined) {
                const prog = row.program_name
                    ? S.programs.find(p =>
                        p.program_name?.toLowerCase() === String(row.program_name).toLowerCase() ||
                        p.program_code?.toLowerCase() === String(row.program_name).toLowerCase()
                      )
                    : null;
                row.program_id = prog ? prog.program_id : null;
                delete row.program_name;
            }
            try {
                const res = await API.post(API_ENDPOINTS.TEACHERS, row);
                if (res && res.success) {
                    results.push({ row: i + 2, name, status: 'success', reason: '' });
                } else {
                    const errs = res?.errors || res?.body?.errors || {};
                    const reason = Object.values(errs).map(v => Array.isArray(v) ? v[0] : v).join('; ')
                        || res?.message || 'Unknown error';
                    results.push({ row: i + 2, name, status: 'error', reason });
                }
            } catch (err) {
                const errs = err.body?.errors || {};
                const reason = Object.values(errs).map(v => Array.isArray(v) ? v[0] : v).join('; ')
                    || err.message || 'Network error';
                results.push({ row: i + 2, name, status: 'error', reason });
            }
        }

        if (spinner) spinner.style.display = 'none';
        if (textEl) textEl.textContent = 'Import';
        closeImportModal();
        showImportResults(results);
        loadTeachers();
    }

    function showImportResults(results) {
        const overlay = document.getElementById('teacherImportResultsOverlay');
        const summaryEl = document.getElementById('teacherImportResultsSummary');
        const bodyEl    = document.getElementById('teacherImportResultsBody');
        if (!overlay) return;

        const success = results.filter(r => r.status === 'success').length;
        const failed  = results.filter(r => r.status === 'error').length;

        if (summaryEl) {
            summaryEl.innerHTML = `
                <span style="background:#dcfce7;color:#16a34a;padding:.35rem .8rem;border-radius:999px;font-size:.8rem;font-weight:600">
                    <i class="fas fa-check-circle"></i> ${success} Imported
                </span>
                <span style="background:#fee2e2;color:#dc2626;padding:.35rem .8rem;border-radius:999px;font-size:.8rem;font-weight:600">
                    <i class="fas fa-times-circle"></i> ${failed} Failed
                </span>`;
        }

        if (bodyEl) {
            bodyEl.innerHTML = results.map(r => `
                <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:.45rem .75rem">${r.row}</td>
                    <td style="padding:.45rem .75rem">${escHtml(r.name)}</td>
                    <td style="padding:.45rem .75rem">
                        ${r.status === 'success'
                            ? `<span style="color:#16a34a;font-weight:600"><i class="fas fa-check"></i> Success</span>`
                            : `<span style="color:#dc2626;font-weight:600"><i class="fas fa-times"></i> Failed</span>`}
                    </td>
                    <td style="padding:.45rem .75rem;color:#64748b;font-size:.78rem">${escHtml(r.reason)}</td>
                </tr>`).join('');
        }

        overlay.classList.add('open');
    }

})();
