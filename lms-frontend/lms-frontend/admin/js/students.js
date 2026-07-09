/* ============================================
   Students Management Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    // ─── State ────────────────────────────────────────────────────────────────
    const S = {
        students: [],
        total: 0,
        page: 1,
        limit: 20,
        search: '',
        classId: '',
        programId: '',
        status: '',
        selectedUuids: new Set(),
        editingUuid: null,      // null = adding, string = editing
        classes: [],
        programs: [],
        importRows: [],         // parsed CSV rows
        searchTimer: null,
    };

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'students') {
            initStudentsPage();
        }
    });

    function initStudentsPage() {
        setupEventListeners();
        loadFilterOptions();
        loadStudents().then(() => {
            // Check if we were redirected here from the details page to edit a student
            try {
                const editUuid = sessionStorage.getItem('lms_student_edit_uuid');
                if (editUuid) {
                    sessionStorage.removeItem('lms_student_edit_uuid');
                    openStudentModal(editUuid);
                }
            } catch (_) {}
        });
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────
    function setupEventListeners() {
        // Add student
        on('addStudentBtn', 'click', () => openStudentModal(null));
        on('promoteStudentsBtn', 'click', () => { window.location.hash = '#promote-students'; });

        // Export
        on('exportStudentsBtn', 'click', exportStudents);
        on('exportPDFStudentsBtn', 'click', exportStudentsPDF);

        // Import
        on('importStudentsBtn', 'click', () => openImportModal());
        on('importDropZone', 'click', () => q('#importFileInput').click());
        on('importFileInput', 'change', e => handleImportFile(e.target.files[0]));
        on('downloadTemplateLink', 'click', e => { e.preventDefault(); downloadCsvTemplate(); });
        on('cancelImportBtn', 'click', closeImportModal);
        on('closeImportModalBtn', 'click', closeImportModal);
        on('confirmImportBtn', 'click', confirmImport);
        on('closeImportResultsBtn', 'click', closeImportResults);
        on('closeImportResultsDoneBtn', 'click', closeImportResults);
        on('importResultsOverlay', 'click', e => { if (e.target.id === 'importResultsOverlay') closeImportResults(); });

        const dropZone = q('#importDropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('dragover'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
            dropZone.addEventListener('drop', e => {
                e.preventDefault(); dropZone.classList.remove('dragover');
                handleImportFile(e.dataTransfer.files[0]);
            });
        }

        // Modal
        on('closeStudentModalBtn', 'click', closeStudentModal);
        on('cancelStudentModalBtn', 'click', closeStudentModal);
        on('saveStudentBtn', 'click', saveStudent);
        on('studentModalOverlay', 'click', e => { if (e.target.id === 'studentModalOverlay') closeStudentModal(); });

        // Password eye toggle
        on('sfPasswordToggle', 'click', () => {
            const input = q('#sfPassword');
            const icon  = q('#sfPasswordToggleIcon');
            if (!input) return;
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            if (icon) { icon.classList.toggle('fa-eye', showing); icon.classList.toggle('fa-eye-slash', !showing); }
        });

        // Generate random password
        on('sfPasswordGenerate', 'click', () => {
            const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
            let pwd = '';
            const arr = new Uint8Array(12);
            crypto.getRandomValues(arr);
            arr.forEach(b => { pwd += charset[b % charset.length]; });
            const input = q('#sfPassword');
            const icon  = q('#sfPasswordToggleIcon');
            if (input) { input.value = pwd; input.type = 'text'; }
            if (icon)  { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
        });

        // Auto-generate username from first + last name (only when not manually edited)
        const autoUsername = () => {
            const input = q('#sfUsername');
            if (!input || input.dataset.manualEdit === 'true') return;
            input.value = generateUsername(val('sfFirstName'), val('sfLastName'));
        };
        on('sfFirstName', 'input', autoUsername);
        on('sfLastName',  'input', autoUsername);

        // Username edit toggle — lock/unlock the field
        on('sfUsernameEdit', 'click', () => {
            const input = q('#sfUsername');
            const icon  = q('#sfUsernameEditIcon');
            if (!input) return;
            if (input.readOnly) {
                input.readOnly = false;
                input.style.background = '';
                input.style.cursor = '';
                input.dataset.manualEdit = 'true';
                if (icon) { icon.classList.remove('fa-pen'); icon.classList.add('fa-lock-open'); }
                input.focus();
            } else {
                input.readOnly = true;
                input.style.background = 'var(--bg-secondary,#f8fafc)';
                input.style.cursor = 'default';
                input.dataset.manualEdit = 'false';
                if (icon) { icon.classList.remove('fa-lock-open'); icon.classList.add('fa-pen'); }
            }
        });

        // Generate / regenerate student ID (fetches from server so count resets per year)
        on('sfStudentIdGenerate', 'click', async () => {
            try {
                const res = await API.get(API_ENDPOINTS.STUDENT_GENERATE_ID);
                if (res && res.success) setVal('sfStudentId', res.data.next_id);
                else setVal('sfStudentId', generateStudentIdFallback());
            } catch (_) { setVal('sfStudentId', generateStudentIdFallback()); }
        });
        on('importModalOverlay',  'click', e => { if (e.target.id === 'importModalOverlay')  closeImportModal(); });

        // Search (debounce)
        on('studentSearch', 'input', e => {
            clearTimeout(S.searchTimer);
            S.searchTimer = setTimeout(() => {
                S.search = e.target.value.trim();
                S.page = 1;
                loadStudents();
            }, 350);
        });

        // Filters
        on('filterStudentClass',   'change', e => { S.classId   = e.target.value; S.page = 1; loadStudents(); });
        on('filterStudentProgram', 'change', e => { S.programId = e.target.value; S.page = 1; loadStudents(); });
        on('filterStudentStatus',  'change', e => { S.status    = e.target.value; S.page = 1; loadStudents(); });

        // Select all checkbox
        on('selectAllStudents', 'change', e => toggleSelectAll(e.target.checked));

        // Bulk actions
        on('bulkActivateBtn',   'click', () => bulkSetStatus('active'));
        on('bulkDeactivateBtn', 'click', () => bulkSetStatus('inactive'));
        on('bulkDeleteBtn',     'click', bulkDelete);
        on('bulkClearBtn',      'click', clearSelection);
    }

    // ─── API – Load Filters ───────────────────────────────────────────────────
    async function loadFilterOptions() {
        try {
            const [classesRes, programsRes] = await Promise.all([
                API.get(API_ENDPOINTS.CLASSES + '?limit=200'),
                API.get(API_ENDPOINTS.PROGRAMS_ACTIVE),
            ]);

            if (classesRes && classesRes.success) {
                S.classes = classesRes.data?.data || [];
                populateSelect('filterStudentClass', S.classes, 'class_id', 'class_name', 'All Classes');
                populateSelect('sfClass', S.classes, 'class_id', 'class_name', 'Select class');
            }
            if (programsRes && programsRes.success) {
                S.programs = programsRes.data?.data || [];
                populateSelect('filterStudentProgram', S.programs, 'program_id', 'program_name', 'All Programs');
            }
        } catch (err) {
            console.error('Error loading filter options:', err);
        }
    }

    // ─── API – Load Students ──────────────────────────────────────────────────
    async function loadStudents() {
        setTableLoading(true);

        const params = new URLSearchParams({
            page:  S.page,
            limit: S.limit,
        });
        if (S.search)    params.set('search',     S.search);
        if (S.classId)   params.set('class_id',   S.classId);
        if (S.programId) params.set('program_id', S.programId);
        if (S.status)    params.set('status',     S.status);

        try {
            const res = await API.get(`${API_ENDPOINTS.STUDENTS}?${params}`);
            if (res && res.success) {
                S.students = res.data || [];
                S.total    = res.pagination ? res.pagination.total : S.students.length;
                renderStudents();
                renderPagination();
                updateStats();
            } else {
                setTableEmpty('Failed to load students. Please try again.');
            }
        } catch (err) {
            console.error('Load students error:', err);
            setTableEmpty('Error loading students.');
            if (typeof showToast === 'function') showToast('Failed to load students', 'error');
        } finally {
            setTableLoading(false);
        }
    }

    // ─── Render Table ─────────────────────────────────────────────────────────
    function renderStudents() {
        const tbody = q('#studentsTableBody');
        if (!tbody) return;

        if (!S.students.length) {
            tbody.innerHTML = `
                <tr><td colspan="8">
                    <div class="students-empty">
                        <i class="fas fa-user-graduate"></i>
                        <h4>No students found</h4>
                        <p>${S.search || S.classId || S.programId || S.status
                            ? 'Try adjusting your search or filters.'
                            : 'Get started by adding your first student.'}</p>
                    </div>
                </td></tr>`;
            updateBulkBar();
            updateTableInfo();
            return;
        }

        tbody.innerHTML = S.students.map(s => {
            const initials = getInitials(s.first_name, s.last_name);
            const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
            const isChecked = S.selectedUuids.has(s.uuid) ? 'checked' : '';
            const badgeClass = s.status === 'active'
                             ? 'badge-active'
                             : s.status === 'withdrawn'
                                 ? 'badge-withdrawn'
                                 : s.status === 'completed'
                                     ? 'badge-completed'
                                     : 'badge-inactive';
            const toggleIcon  = s.status === 'active' ? 'fa-user-slash' : 'fa-user-check';
            const toggleTitle = s.status === 'active' ? 'Deactivate' : 'Activate';
            const enrollDate  = s.enrollment_date ? formatDate(s.enrollment_date) : '—';
            const className   = s.class_name  || '—';
            const programName = s.program_name || '—';

            return `<tr data-uuid="${escapeHtml(s.uuid)}">
                <td><input type="checkbox" class="student-row-check" data-uuid="${escapeHtml(s.uuid)}" ${isChecked}></td>
                <td>
                    <div class="student-cell">
                        <div class="student-avatar">${escapeHtml(initials)}</div>
                        <div>
                            <div class="student-name">${escapeHtml(fullName)}</div>
                            <a href="mailto:${escapeHtml(s.email || '')}" class="student-email">${escapeHtml(s.email || '')}</a>
                        </div>
                    </div>
                </td>
                <td><code style="font-size:.8rem;background:#f1f5f9;padding:.15rem .4rem;border-radius:4px">${escapeHtml(s.student_id_number || '—')}</code></td>
                <td>${escapeHtml(className)}</td>
                <td>${escapeHtml(programName)}</td>
                <td>${escapeHtml(enrollDate)}</td>
                <td><span class="students-badge ${badgeClass}">${capitalize(s.status || 'unknown')}</span></td>
                <td>
                    <div class="student-actions">
                        <button class="btn-view-student" data-uuid="${escapeHtml(s.uuid)}" title="View Details"><i class="fas fa-eye"></i></button>
                        <button class="btn-edit-student" data-uuid="${escapeHtml(s.uuid)}" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-toggle-student" data-uuid="${escapeHtml(s.uuid)}" data-status="${escapeHtml(s.status)}" title="${toggleTitle}"><i class="fas ${toggleIcon}"></i></button>
                        <button class="btn-delete-student" data-uuid="${escapeHtml(s.uuid)}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        // Attach row-level event listeners
        tbody.querySelectorAll('.student-row-check').forEach(cb => {
            cb.addEventListener('change', e => {
                const uuid = e.target.dataset.uuid;
                if (e.target.checked) S.selectedUuids.add(uuid);
                else  S.selectedUuids.delete(uuid);
                updateBulkBar();
                updateSelectAllCheckbox();
            });
        });
        tbody.querySelectorAll('.btn-view-student').forEach(btn => {
            btn.addEventListener('click', () => viewStudent(btn.dataset.uuid));
        });
        tbody.querySelectorAll('.btn-edit-student').forEach(btn => {
            btn.addEventListener('click', () => openStudentModal(btn.dataset.uuid));
        });
        tbody.querySelectorAll('.btn-toggle-student').forEach(btn => {
            btn.addEventListener('click', () => toggleStudentStatus(btn.dataset.uuid, btn.dataset.status));
        });
        tbody.querySelectorAll('.btn-delete-student').forEach(btn => {
            btn.addEventListener('click', () => deleteStudent(btn.dataset.uuid));
        });

        updateBulkBar();
        updateSelectAllCheckbox();
        updateTableInfo();
    }

    // ─── Pagination ───────────────────────────────────────────────────────────
    function renderPagination() {
        const container = q('#studentsPagination');
        if (!container) return;

        const totalPages = Math.ceil(S.total / S.limit);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        const buttons = [];
        // Prev
        buttons.push(`<button class="page-btn" ${S.page === 1 ? 'disabled' : ''} data-page="${S.page - 1}"><i class="fas fa-chevron-left"></i></button>`);
        // Pages
        const start = Math.max(1, S.page - 2);
        const end   = Math.min(totalPages, start + 4);
        if (start > 1) buttons.push(`<button class="page-btn" data-page="1">1</button>${start > 2 ? '<span style="padding:0 .25rem">…</span>' : ''}`);
        for (let i = start; i <= end; i++) {
            buttons.push(`<button class="page-btn${i === S.page ? ' active' : ''}" data-page="${i}">${i}</button>`);
        }
        if (end < totalPages) buttons.push(`${end < totalPages - 1 ? '<span style="padding:0 .25rem">…</span>' : ''}<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`);
        // Next
        buttons.push(`<button class="page-btn" ${S.page === totalPages ? 'disabled' : ''} data-page="${S.page + 1}"><i class="fas fa-chevron-right"></i></button>`);

        container.innerHTML = buttons.join('');
        container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = parseInt(btn.dataset.page, 10);
                if (p >= 1 && p <= totalPages && p !== S.page) { S.page = p; loadStudents(); }
            });
        });
    }

    function updateTableInfo() {
        const el = q('#studentsTableInfo');
        if (!el) return;
        if (!S.total) { el.textContent = 'No students'; return; }
        const from = (S.page - 1) * S.limit + 1;
        const to   = Math.min(S.page * S.limit, S.total);
        el.textContent = `Showing ${from}–${to} of ${S.total} student${S.total !== 1 ? 's' : ''}`;
    }

    // ─── Stats ────────────────────────────────────────────────────────────────
    async function updateStats() {
        // We already have total from paginated response; for active/inactive we do a quick count
        setText('statTotalStudents', S.total);
        // Fetch active+inactive counts independently
        try {
            const [activeRes, inactiveRes] = await Promise.all([
                API.get(`${API_ENDPOINTS.STUDENTS}?limit=1&status=active`),
                API.get(`${API_ENDPOINTS.STUDENTS}?limit=1&status=inactive`),
            ]);
            if (activeRes?.success)   setText('statActiveStudents',   activeRes.pagination?.total ?? '—');
            if (inactiveRes?.success) setText('statInactiveStudents', inactiveRes.pagination?.total ?? '—');
        } catch (_) { /* silent */ }
        // Class count from filter options
        setText('statTotalClasses', S.classes.length || '—');
    }

    // ─── Add / Edit Modal ─────────────────────────────────────────────────────
    async function openStudentModal(uuid) {
        S.editingUuid = uuid || null;
        setText('studentModalTitle', uuid ? 'Edit Student' : 'Add Student');
        setText('saveStudentBtnText', uuid ? 'Update Student' : 'Save Student');

        // Password field only required for new students
        const pwGroup = q('#sfPasswordGroup');
        if (pwGroup) {
            pwGroup.style.display = uuid ? 'none' : '';
            const pwInput = q('#sfPassword');
            if (pwInput) pwInput.required = !uuid;
        }

        clearFormErrors();
        resetStudentForm();

        // Always re-populate the class select from current state (avoids async race)
        populateSelect('sfClass', S.classes, 'class_id', 'class_name', 'Select class');

        if (uuid) {
            // Find in current list
            const student = S.students.find(s => s.uuid === uuid);
            if (student) fillStudentForm(student);
            else {
                // Not in current page — fetch fresh from API
                API.get(API_ENDPOINTS.STUDENT_BY_UUID(uuid)).then(res => {
                    if (res && res.success) fillStudentForm(res.data);
                });
            }
        } else {
            // Set today's enrollment date
            const today = new Date().toISOString().split('T')[0];
            const sfEnroll = q('#sfEnrollmentDate');
            if (sfEnroll) sfEnroll.value = today;
            // Auto-generate student ID for new students (year-aware, from server)
            try {
                const res = await API.get(API_ENDPOINTS.STUDENT_GENERATE_ID);
                if (res && res.success) setVal('sfStudentId', res.data.next_id);
                else setVal('sfStudentId', generateStudentIdFallback());
            } catch (_) { setVal('sfStudentId', generateStudentIdFallback()); }
        }

        openOverlay('studentModalOverlay');
    }

    function fillStudentForm(s) {
        setVal('sfFirstName', s.first_name || '');
        setVal('sfLastName',  s.last_name  || '');
        setVal('sfEmail',     s.email      || '');
        // When editing, show the existing username and unlock the field so admin can change it
        const unInput = q('#sfUsername');
        const unIcon  = q('#sfUsernameEditIcon');
        if (unInput) {
            unInput.value = s.username || '';
            unInput.readOnly = false;
            unInput.style.background = '';
            unInput.style.cursor = '';
            unInput.dataset.manualEdit = 'true';
        }
        if (unIcon) { unIcon.classList.remove('fa-pen'); unIcon.classList.add('fa-lock-open'); }
        // Set gender explicitly via option matching (more reliable than el.value = v)
        (function () {
            const sel = document.querySelector('#sfGender');
            if (!sel) return;
            const target = (s.gender || '').toLowerCase();
            Array.from(sel.options).forEach(opt => { opt.selected = opt.value === target; });
        }());
        setVal('sfDob',       s.date_of_birth ? s.date_of_birth.split(' ')[0] : '');
        setVal('sfPhone',     s.phone_number  || '');
        setVal('sfStudentId', s.student_id_number || '');
        setVal('sfClass',     s.class_id   || '');
        setVal('sfEnrollmentDate', s.enrollment_date ? s.enrollment_date.split(' ')[0] : '');
        setVal('sfStatus',    s.status     || 'active');
        setVal('sfParentName',  s.parent_name  || '');
        setVal('sfParentPhone', s.parent_phone || '');
        setVal('sfParentEmail', s.parent_email || '');
        setVal('sfEmergency',   s.emergency_contact || '');
    }

    function resetStudentForm() {
        // Manually clear all form inputs to avoid form.reset() wiping dynamically populated selects
        ['sfFirstName','sfLastName','sfEmail','sfUsername','sfPassword',
         'sfDob','sfPhone','sfStudentId','sfEnrollmentDate',
         'sfParentName','sfParentPhone','sfParentEmail','sfEmergency'].forEach(id => setVal(id, ''));
        setVal('sfGender',  '');
        setVal('sfStatus',  'active');
        setVal('sfClass',   '');
        // Reset password field to hidden state
        const pwInput = q('#sfPassword'); if (pwInput) pwInput.type = 'password';
        const pwIcon  = q('#sfPasswordToggleIcon'); if (pwIcon) { pwIcon.classList.add('fa-eye'); pwIcon.classList.remove('fa-eye-slash'); }
        // Reset username field to auto-generate mode (locked)
        const unInput = q('#sfUsername');
        const unIcon  = q('#sfUsernameEditIcon');
        if (unInput) { unInput.readOnly = true; unInput.style.background = 'var(--bg-secondary,#f8fafc)'; unInput.style.cursor = 'default'; unInput.dataset.manualEdit = 'false'; }
        if (unIcon)  { unIcon.classList.add('fa-pen'); unIcon.classList.remove('fa-lock-open'); }
        clearFormErrors();
    }

    function closeStudentModal() {
        closeOverlay('studentModalOverlay');
        S.editingUuid = null;
    }

    async function saveStudent() {
        clearFormErrors();
        const errors = validateStudentForm();
        if (Object.keys(errors).length) {
            showFormErrors(errors);
            return;
        }

        // Guarantee username is filled (may be blank if names were pasted without firing input events)
        if (!S.editingUuid && !val('sfUsername').trim()) {
            const generated = generateUsername(val('sfFirstName'), val('sfLastName'));
            if (generated) setVal('sfUsername', generated);
        }

        const payload = buildStudentPayload();
        setSaveLoading(true);

        try {
            let res;
            if (S.editingUuid) {
                res = await API.put(API_ENDPOINTS.STUDENT_BY_UUID(S.editingUuid), payload);
            } else {
                res = await API.post(API_ENDPOINTS.STUDENTS, payload);
            }

            if (res && res.success) {
                if (typeof showToast === 'function') {
                    showToast(S.editingUuid ? 'Student updated successfully' : 'Student added successfully', 'success');
                }
                AdminActivityAPI.log({
                    activity_type: S.editingUuid ? 'student_updated' : 'student_created',
                    description: (S.editingUuid ? 'Updated' : 'Added') + ` student: ${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
                    entity_type: 'student',
                    severity: 'info'
                }).catch(() => {});
                closeStudentModal();
                loadStudents();
            } else {
                const msg = res?.message || (S.editingUuid ? 'Failed to update student' : 'Failed to add student');
                if (typeof showToast === 'function') showToast(msg, 'error');
            }
        } catch (err) {
            // If it's a username-taken 422, auto-regenerate and retry once silently
            if (!S.editingUuid && err.status === 422 && err.body && err.body.errors &&
                    err.body.errors.username && q('#sfUsername')?.dataset.manualEdit !== 'true') {
                try {
                    const fn = val('sfFirstName'); const ln = val('sfLastName');
                    const newUsername = generateUsername(fn, ln, String(Date.now()).slice(-4));
                    setVal('sfUsername', newUsername);
                    payload.username = newUsername;
                    const retry = await API.post(API_ENDPOINTS.STUDENTS, payload);
                    if (retry && retry.success) {
                        if (typeof showToast === 'function') showToast('Student added successfully', 'success');
                        closeStudentModal(); loadStudents(); return;
                    }
                } catch (_) {}
            }
            // Map server-side validation errors (field name → form input id)
            if (err.status === 422 && err.body && err.body.errors && Object.keys(err.body.errors).length) {
                const fieldMap = {
                    username: 'sfUsername', email: 'sfEmail', password: 'sfPassword',
                    first_name: 'sfFirstName', last_name: 'sfLastName',
                    student_id_number: 'sfStudentId', phone_number: 'sfPhone',
                    date_of_birth: 'sfDob', class_id: 'sfClass', gender: 'sfGender',
                    enrollment_date: 'sfEnrollmentDate', parent_name: 'sfParentName',
                    parent_phone: 'sfParentPhone', parent_email: 'sfParentEmail',
                    emergency_contact: 'sfEmergency',
                };
                const mapped = {};
                Object.entries(err.body.errors).forEach(([k, v]) => {
                    // Validator returns arrays; duplicate checks return strings — normalise to string
                    mapped[fieldMap[k] || k] = Array.isArray(v) ? v[0] : v;
                });
                showFormErrors(mapped);
                if (typeof showToast === 'function') showToast(err.body.message || 'Please fix the errors below', 'error');
            } else {
                // Unexpected error — log and show generic message
                if (err.status !== 401) console.error('Save student error:', err);
                const msg = (err.body && err.body.message) || err.message || 'An error occurred. Please try again.';
                if (typeof showToast === 'function') showToast(msg, 'error');
            }
        } finally {
            setSaveLoading(false);
        }
    }

    function validateStudentForm() {
        const errors = {};
        const fn = val('sfFirstName');
        const ln = val('sfLastName');
        const em = val('sfEmail');
        const un = val('sfUsername');
        const pw = val('sfPassword');
        const sid = val('sfStudentId');

        if (!fn.trim()) errors.sfFirstName = 'First name is required';
        if (!ln.trim()) errors.sfLastName  = 'Last name is required';
        if (!em.trim()) errors.sfEmail     = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) errors.sfEmail = 'Enter a valid email';
        if (!S.editingUuid && !pw.trim())  errors.sfPassword = 'Password is required';
        if (!S.editingUuid && pw.trim().length < 8) errors.sfPassword = 'Password must be at least 8 characters';
        if (!sid.trim()) errors.sfStudentId = 'Student ID is required';

        return errors;
    }

    function buildStudentPayload() {
        const payload = {
            first_name:        val('sfFirstName'),
            last_name:         val('sfLastName'),
            email:             val('sfEmail'),
            username:          val('sfUsername'),
            gender:            val('sfGender')  || undefined,
            date_of_birth:     val('sfDob')     || undefined,
            phone_number:      val('sfPhone')   || undefined,
            student_id_number: val('sfStudentId'),
            class_id:          val('sfClass')   || undefined,
            enrollment_date:   val('sfEnrollmentDate') || undefined,
            status:            val('sfStatus'),
            parent_name:       val('sfParentName')  || undefined,
            parent_phone:      val('sfParentPhone') || undefined,
            parent_email:      val('sfParentEmail') || undefined,
            emergency_contact: val('sfEmergency')   || undefined,
        };
        if (!S.editingUuid) payload.password = val('sfPassword');
        // Remove undefined
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
        return payload;
    }

    // ─── Toggle Status ────────────────────────────────────────────────────────
    async function toggleStudentStatus(uuid, currentStatus) {
        const newStatus  = currentStatus === 'active' ? 'inactive' : 'active';
        const actionText = currentStatus === 'active' ? 'Deactivate' : 'Activate';
        const iconColor  = currentStatus === 'active' ? '#dc2626' : '#059669';
        const iconClass  = currentStatus === 'active' ? 'fa-user-slash' : 'fa-user-check';

        showModal(
            `${actionText} Student`,
            `<div style="display:flex;align-items:center;gap:.75rem">
                <i class="fas ${iconClass}" style="font-size:1.5rem;color:${iconColor}"></i>
                <span>Are you sure you want to <strong>${actionText.toLowerCase()}</strong> this student?</span>
            </div>`,
            async () => {
                try {
                    const res = await API.put(API_ENDPOINTS.STUDENT_STATUS(uuid), { status: newStatus });
                    if (res && res.success) {
                        showToast(`Student ${newStatus} successfully`, 'success');
                        AdminActivityAPI.log({ activity_type: 'student_status_changed', description: `Student status set to ${newStatus}`, entity_type: 'student', severity: 'info' }).catch(() => {});
                        loadStudents();
                    } else {
                        showToast(res?.message || 'Failed to update status', 'error');
                    }
                } catch (err) {
                    console.error('Toggle status error:', err);
                    showToast('An error occurred', 'error');
                }
            }
        );
    }

    // ─── Delete ───────────────────────────────────────────────────────────────
    async function deleteStudent(uuid) {
        const student = S.students.find(s => s.uuid === uuid);
        const name = student ? `${escapeHtml(student.first_name)} ${escapeHtml(student.last_name)}`.trim() : 'this student';

        showModal(
            'Remove Student',
            `<div style="display:flex;align-items:center;gap:.75rem">
                <i class="fas fa-trash" style="font-size:1.5rem;color:#dc2626"></i>
                <span>Remove <strong>${name}</strong>? This will mark the student as withdrawn.</span>
            </div>`,
            async () => {
                try {
                    const res = await API.delete(API_ENDPOINTS.STUDENT_BY_UUID(uuid));
                    if (res && res.success) {
                        showToast('Student removed successfully', 'success');
                        AdminActivityAPI.log({ activity_type: 'student_deleted', description: `Removed student: ${name}`, entity_type: 'student', severity: 'warning' }).catch(() => {});
                        if (S.selectedUuids.has(uuid)) S.selectedUuids.delete(uuid);
                        loadStudents();
                    } else {
                        showToast(res?.message || 'Failed to delete student', 'error');
                    }
                } catch (err) {
                    console.error('Delete student error:', err);
                    showToast('An error occurred', 'error');
                }
            }
        );
    }

    // ─── View Details ─────────────────────────────────────────────────────────
    function viewStudent(uuid) {
        // Store UUID in sessionStorage so the details page can read it
        try { sessionStorage.setItem('lms_student_uuid', uuid); } catch (_) {}
        window.location.hash = '#student-details';
    }

    // ─── Bulk Actions ─────────────────────────────────────────────────────────
    function toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.student-row-check');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            if (checked) S.selectedUuids.add(cb.dataset.uuid);
            else         S.selectedUuids.delete(cb.dataset.uuid);
        });
        updateBulkBar();
    }

    function clearSelection() {
        S.selectedUuids.clear();
        document.querySelectorAll('.student-row-check').forEach(cb => cb.checked = false);
        const sAll = q('#selectAllStudents');
        if (sAll) sAll.checked = false;
        updateBulkBar();
    }

    async function bulkSetStatus(newStatus) {
        if (!S.selectedUuids.size) return;
        const count = S.selectedUuids.size;
        const actionText = capitalize(newStatus);
        const iconColor  = newStatus === 'active' ? '#059669' : '#dc2626';
        const iconClass  = newStatus === 'active' ? 'fa-user-check' : 'fa-user-slash';

        showModal(
            `${actionText} Students`,
            `<div style="display:flex;align-items:center;gap:.75rem">
                <i class="fas ${iconClass}" style="font-size:1.5rem;color:${iconColor}"></i>
                <span>${actionText} <strong>${count} student${count !== 1 ? 's' : ''}</strong>?</span>
            </div>`,
            async () => {
                let success = 0;
                for (const uuid of S.selectedUuids) {
                    try {
                        const res = await API.put(API_ENDPOINTS.STUDENT_STATUS(uuid), { status: newStatus });
                        if (res && res.success) success++;
                    } catch (_) { /* ignore per-item */ }
                }
                showToast(`${success} / ${count} students updated`, 'success');
                clearSelection();
                loadStudents();
            }
        );
    }

    async function bulkDelete() {
        if (!S.selectedUuids.size) return;
        const count = S.selectedUuids.size;

        showModal(
            'Remove Students',
            `<div style="display:flex;align-items:center;gap:.75rem">
                <i class="fas fa-trash" style="font-size:1.5rem;color:#dc2626"></i>
                <span>Remove <strong>${count} student${count !== 1 ? 's' : ''}</strong>? They will be marked as withdrawn.</span>
            </div>`,
            async () => {
                let success = 0;
                for (const uuid of S.selectedUuids) {
                    try {
                        const res = await API.delete(API_ENDPOINTS.STUDENT_BY_UUID(uuid));
                        if (res && res.success) success++;
                    } catch (_) { /* ignore per-item */ }
                }
                showToast(`${success} / ${count} students removed`, 'success');
                clearSelection();
                loadStudents();
            }
        );
    }

    function updateBulkBar() {
        const bar  = q('#studentsBulkBar');
        const cnt  = q('#bulkSelectedCount');
        if (bar)  bar.classList.toggle('visible', S.selectedUuids.size > 0);
        if (cnt)  cnt.textContent = S.selectedUuids.size;
    }

    function updateSelectAllCheckbox() {
        const sAll = q('#selectAllStudents');
        if (!sAll) return;
        const checkboxes = document.querySelectorAll('.student-row-check');
        const checkedCount = document.querySelectorAll('.student-row-check:checked').length;
        sAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        sAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
    }

    // ─── Export ───────────────────────────────────────────────────────────────
    async function exportStudents() {
        // Fetch all students with current filters (no pagination)
        const params = new URLSearchParams({ page: 1, limit: 10000 });
        if (S.search)    params.set('search',     S.search);
        if (S.classId)   params.set('class_id',   S.classId);
        if (S.programId) params.set('program_id', S.programId);
        if (S.status)    params.set('status',     S.status);

        if (typeof showToast === 'function') showToast('Preparing export…', 'info');

        try {
            const res = await API.get(`${API_ENDPOINTS.STUDENTS}?${params}`);
            if (!res || !res.success) {
                if (typeof showToast === 'function') showToast('Export failed', 'error');
                return;
            }
            const rows = res.data || [];
            const headers = ['First Name','Last Name','Email','Username','Student ID','Class','Program','Gender','Date of Birth','Phone','Status','Enrolled Date','Parent Name','Parent Phone','Parent Email'];
            const csvRows = [
                headers.join(','),
                ...rows.map(s => [
                    csvEscape(s.first_name), csvEscape(s.last_name), csvEscape(s.email),
                    csvEscape(s.username), csvEscape(s.student_id_number),
                    csvEscape(s.class_name), csvEscape(s.program_name),
                    csvEscape(s.gender), csvEscape(s.date_of_birth),
                    csvEscape(s.phone_number), csvEscape(s.status), csvEscape(s.enrollment_date),
                    csvEscape(s.parent_name), csvEscape(s.parent_phone), csvEscape(s.parent_email),
                ].join(',')),
            ];
            const now = new Date();
            const stamp = now.getFullYear()
                + String(now.getMonth() + 1).padStart(2, '0')
                + String(now.getDate()).padStart(2, '0')
                + '_' + String(now.getHours()).padStart(2, '0')
                + String(now.getMinutes()).padStart(2, '0')
                + String(now.getSeconds()).padStart(2, '0');
            downloadCsv(csvRows.join('\n'), `students_export_${stamp}.csv`);
            if (typeof showToast === 'function') showToast(`Exported ${rows.length} students`, 'success');
        } catch (err) {
            console.error('Export error:', err);
            if (typeof showToast === 'function') showToast('Export failed', 'error');
        }
    }

    // ─── Export PDF ───────────────────────────────────────────────────────────
    async function exportStudentsPDF() {
        const params = new URLSearchParams({ page: 1, limit: 10000 });
        if (S.search)    params.set('search',     S.search);
        if (S.classId)   params.set('class_id',   S.classId);
        if (S.programId) params.set('program_id', S.programId);
        if (S.status)    params.set('status',     S.status);

        if (typeof showToast === 'function') showToast('Preparing PDF…', 'info');

        let rows = [];
        try {
            const res = await API.get(`${API_ENDPOINTS.STUDENTS}?${params}`);
            if (!res || !res.success) {
                if (typeof showToast === 'function') showToast('PDF export failed', 'error');
                return;
            }
            rows = res.data || [];
        } catch (err) {
            console.error('PDF export error:', err);
            if (typeof showToast === 'function') showToast('PDF export failed', 'error');
            return;
        }

        const date   = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
        const filterLabel = [
            S.search    ? `Search: "${S.search}"` : '',
            S.classId   ? `Class: ${S.classes.find(c => String(c.class_id) === String(S.classId))?.class_name || S.classId}` : '',
            S.programId ? `Program: ${S.programs.find(p => String(p.program_id) === String(S.programId))?.program_name || S.programId}` : '',
            S.status    ? `Status: ${S.status}` : '',
        ].filter(Boolean).join(' | ');

        const esc = v => String(v || '—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const fmt = d => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); } catch(_){return d;} };
        const badge = s => {
            const colors = { active:'#15803d;background:#dcfce7', inactive:'#854d0e;background:#fef9c3', withdrawn:'#b91c1c;background:#fee2e2', completed:'#5b21b6;background:#ede9fe' };
            const c = colors[s] || '#64748b;background:#f1f5f9';
            return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:${c}">${esc(s)}</span>`;
        };

        const tableRows = rows.map((s, i) => `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
                <td>${i + 1}</td>
                <td>${esc(s.first_name)} ${esc(s.last_name)}</td>
                <td style="font-family:monospace;font-size:11px">${esc(s.student_id_number)}</td>
                <td>${esc(s.class_name)}</td>
                <td>${esc(s.program_name)}</td>
                <td>${esc(s.gender)}</td>
                <td>${fmt(s.enrollment_date)}</td>
                <td>${badge(s.status)}</td>
                <td>${esc(s.parent_name)}<br><span style="color:#64748b;font-size:10px">${esc(s.parent_phone)}</span></td>
            </tr>`).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Students Export — ${date}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; }
  .header h1 { font-size: 18px; color: #1d4ed8; }
  .header .meta { text-align: right; color: #64748b; font-size: 11px; line-height: 1.6; }
  .filter-bar { font-size: 11px; color: #64748b; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1d4ed8; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
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
      <h1>&#127891; Student Report</h1>
      <p style="color:#64748b;margin-top:2px">Total: <strong>${rows.length}</strong> student${rows.length !== 1 ? 's' : ''}</p>
    </div>
    <div class="meta">
      <div>Exported: ${date}</div>
      <button onclick="window.print()" style="margin-top:6px;padding:4px 12px;background:#1d4ed8;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px">&#128438; Print / Save PDF</button>
    </div>
  </div>
  ${filterLabel ? `<div class="filter-bar">Filters: ${esc(filterLabel)}</div>` : ''}
  <table>
    <thead>
      <tr>
        <th>#</th><th>Student Name</th><th>ID Number</th><th>Class</th><th>Program</th>
        <th>Gender</th><th>Enrolled</th><th>Status</th><th>Parent / Guardian</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">Generated by LMS &bull; ${date}</div>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=1100,height=750');
        if (!win) {
            if (typeof showToast === 'function') showToast('Allow pop-ups to export PDF', 'error');
            return;
        }
        win.document.write(html);
        win.document.close();
        win.focus();
        if (typeof showToast === 'function') showToast(`PDF ready — ${rows.length} students`, 'success');
    }

    // ─── Import CSV ───────────────────────────────────────────────────────────
    function openImportModal() {
        S.importRows = [];
        const fi = q('#importFileInput');
        if (fi) fi.value = '';
        hide('importPreview');
        hide('importErrors');
        const confirmBtn = q('#confirmImportBtn');
        if (confirmBtn) confirmBtn.disabled = true;
        setText('confirmImportText', 'Import');
        hide('confirmImportSpinner');
        openOverlay('importModalOverlay');
    }

    function closeImportModal() {
        closeOverlay('importModalOverlay');
    }

    function handleImportFile(file) {
        if (!file) return;
        if (!file.name.endsWith('.csv')) {
            if (typeof showToast === 'function') showToast('Please select a CSV file', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target.result;
            const result = parseCsv(text);
            S.importRows = result.rows;

            setText('importFileName', file.name);
            setText('importRowCount', `${result.rows.length} rows found`);
            show('importPreview');

            const errEl = q('#importErrors');
            if (result.errors.length) {
                errEl.innerHTML = result.errors.map(escapeHtml).join('<br>');
                show('importErrors');
            } else {
                hide('importErrors');
            }

            const confirmBtn = q('#confirmImportBtn');
            if (confirmBtn) confirmBtn.disabled = result.rows.length === 0;
        };
        reader.readAsText(file);
    }

    async function confirmImport() {
        if (!S.importRows.length) return;
        const confirmBtn = q('#confirmImportBtn');
        if (confirmBtn) confirmBtn.disabled = true;
        show('confirmImportSpinner');
        setText('confirmImportText', 'Importing…');

        const results = []; // { row, name, status: 'success'|'failed', reason }
        const REQUIRED = ['first_name', 'last_name', 'email', 'student_id_number', 'username', 'password'];

        for (let i = 0; i < S.importRows.length; i++) {
            const row  = S.importRows[i];
            const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || `Row ${i + 2}`;

            // Client-side required field check
            const missing = REQUIRED.filter(f => !row[f] || !String(row[f]).trim());
            if (missing.length) {
                results.push({ name, status: 'failed', reason: `Missing: ${missing.map(f => f.replace(/_/g,' ')).join(', ')}` });
                continue;
            }

            try {
                const res = await API.post(API_ENDPOINTS.STUDENTS, row);
                if (res && res.success) {
                    results.push({ name, status: 'success', reason: '' });
                } else {
                    results.push({ name, status: 'failed', reason: res?.message || 'Unknown error' });
                }
            } catch (err) {
                // Extract field-level errors if available
                let reason = err.message || 'Request failed';
                if (err.body && err.body.errors) {
                    const msgs = Object.entries(err.body.errors).map(([k, v]) =>
                        `${k.replace(/_/g,' ')}: ${Array.isArray(v) ? v[0] : v}`);
                    if (msgs.length) reason = msgs.join('; ');
                }
                results.push({ name, status: 'failed', reason });
            }
        }

        hide('confirmImportSpinner');
        setText('confirmImportText', 'Import');
        if (confirmBtn) confirmBtn.disabled = false;

        const success = results.filter(r => r.status === 'success').length;
        closeImportModal();
        if (success) loadStudents();
        showImportResults(results);
    }

    function showImportResults(results) {
        const success = results.filter(r => r.status === 'success').length;
        const failed  = results.filter(r => r.status === 'failed').length;

        // Summary chips
        const summaryEl = q('#importResultsSummary');
        if (summaryEl) {
            summaryEl.innerHTML = [
                `<span style="display:inline-flex;align-items:center;gap:.4rem;background:#dcfce7;color:#166534;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600">
                    <i class="fas fa-check-circle"></i> ${success} Successful
                </span>`,
                failed ? `<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fee2e2;color:#991b1b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600">
                    <i class="fas fa-times-circle"></i> ${failed} Failed
                </span>` : '',
                `<span style="display:inline-flex;align-items:center;gap:.4rem;background:var(--bg-secondary,#f8fafc);color:var(--text-secondary,#64748b);border-radius:20px;padding:.3rem .85rem;font-size:.82rem">
                    <i class="fas fa-list"></i> ${results.length} Total
                </span>`
            ].join('');
        }

        // Rows
        const tbody = q('#importResultsBody');
        if (tbody) {
            tbody.innerHTML = results.map((r, i) => {
                const isOk = r.status === 'success';
                return `<tr style="border-bottom:1px solid var(--border,#e2e8f0);background:${isOk ? '' : '#fff7f7'}">
                    <td style="padding:.45rem .75rem;color:var(--text-secondary,#64748b)">${i + 2}</td>
                    <td style="padding:.45rem .75rem;font-weight:500">${escapeHtml(r.name)}</td>
                    <td style="padding:.45rem .75rem">
                        <span style="display:inline-flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:600;color:${isOk ? '#16a34a' : '#dc2626'}">
                            <i class="fas ${isOk ? 'fa-check' : 'fa-times'}"></i>
                            ${isOk ? 'Success' : 'Failed'}
                        </span>
                    </td>
                    <td style="padding:.45rem .75rem;color:${isOk ? 'var(--text-secondary,#64748b)' : '#b91c1c'};font-size:.78rem">${escapeHtml(r.reason || '—')}</td>
                </tr>`;
            }).join('');
        }

        setText('importResultsTitle', `Import Results \u2014 ${success} of ${results.length} students added`);
        openOverlay('importResultsOverlay');
    }

    function closeImportResults() {
        closeOverlay('importResultsOverlay');
    }

    function downloadCsvTemplate() {
        const headers = 'first_name,last_name,email,username,password,student_id_number,class_id,gender,date_of_birth,phone_number,parent_name,parent_phone,parent_email,enrollment_date';
        const sample  = 'Kwame,Mensah,kwame.mensah@school.edu.gh,kwame.mensah,Password123,SHS2024001,,male,2008-05-15,0244123456,Mrs. Mensah,0244987654,mensah@gmail.com,2024-09-01';
        downloadCsv(`${headers}\n${sample}`, 'students_import_template.csv');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function q(sel)  { return document.querySelector(sel); }
    function on(id, ev, fn) { const el = q(`#${id}`); if (el) el.addEventListener(ev, fn); }
    function val(id) { const el = q(`#${id}`); return el ? el.value : ''; }
    function setVal(id, v) { const el = q(`#${id}`); if (el) el.value = v; }
    function setText(id, t) { const el = q(`#${id}`); if (el) el.textContent = t; }
    function show(id)   { const el = q(`#${id}`); if (el) el.style.display = ''; }
    function hide(id)   { const el = q(`#${id}`); if (el) el.style.display = 'none'; }

    function openOverlay(id)  { const el = q(`#${id}`); if (el) el.classList.add('open'); }
    function closeOverlay(id) { const el = q(`#${id}`); if (el) el.classList.remove('open'); }

    function setTableLoading(loading) {
        const tbody = q('#studentsTableBody');
        if (!tbody || !loading) return;
        tbody.innerHTML = `<tr><td colspan="8" class="students-loading"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
    }

    function setTableEmpty(msg) {
        const tbody = q('#studentsTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8"><div class="students-empty"><i class="fas fa-exclamation-circle"></i><p>${escapeHtml(msg)}</p></div></td></tr>`;
    }

    function setSaveLoading(loading) {
        const btn     = q('#saveStudentBtn');
        const btnText = q('#saveStudentBtnText');
        const spinner = q('#saveStudentSpinner');
        if (btn)     btn.disabled = loading;
        if (btnText) btnText.style.display = loading ? 'none' : '';
        if (spinner) spinner.style.display = loading ? '' : 'none';
    }

    function clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
    }

    function showFormErrors(errors) {
        Object.entries(errors).forEach(([id, msg]) => {
            const errEl = q(`#${id}Err`);
            const input = q(`#${id}`);
            if (errEl) errEl.textContent = msg;
            if (input) input.classList.add('error');
        });
        // Scroll to first error
        const first = document.querySelector('.form-input.error');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function populateSelect(id, items, valueKey, labelKey, defaultLabel) {
        const el = q(`#${id}`);
        if (!el) return;
        const current = el.value;
        el.innerHTML = `<option value="">${escapeHtml(defaultLabel)}</option>` +
            items.map(i => `<option value="${escapeHtml(String(i[valueKey]))}">${escapeHtml(i[labelKey] || '')}</option>`).join('');
        el.value = current;
    }

    function generateUsername(first, last, seed) {
        const clean = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const f = clean(first || '');
        const l = clean(last  || '');
        if (!f && !l) return '';
        const base = f && l ? `${f}.${l}` : (f || l);
        // Use last 3 digits of current ms timestamp (or provided seed) for uniqueness
        const suffix = seed !== undefined ? String(seed) : String(Date.now()).slice(-3);
        return base + suffix;
    }

    // Fallback ID generator used only when the API call fails
    function generateStudentIdFallback() {
        const year = new Date().getFullYear();
        const next = (S.total || 0) + 1;
        let prefix = 'SHS';
        try {
            const user = Auth.getUser();
            const name = (user && user.institution_name) ? user.institution_name : '';
            if (name) {
                const initials = name.match(/\b[A-Za-z]/g);
                if (initials && initials.length >= 2) {
                    prefix = initials.join('').toUpperCase().slice(0, 6);
                }
            }
        } catch (_) {}
        return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
    }

    function getInitials(first, last) {
        return ((first || '').charAt(0) + (last || '').charAt(0)).toUpperCase() || '?';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (_) { return dateStr; }
    }

    function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    function csvEscape(v) {
        if (v == null) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s;
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

        // Fields that must be null (not empty string) when blank to avoid FK/type errors
        const nullableFields = new Set(['class_id', 'gender', 'date_of_birth', 'phone_number',
            'parent_name', 'parent_phone', 'parent_email', 'emergency_contact', 'enrollment_date']);

        // Date fields that need to be normalised to YYYY-MM-DD for MySQL
        const dateFields = new Set(['date_of_birth', 'enrollment_date']);

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g,''));
            if (cols.length < 2) continue;
            const row = {};
            rawHeaders.forEach((h, idx) => {
                let v = (cols[idx] !== undefined ? cols[idx] : '').trim();
                // Normalise M/D/YYYY or M/D/YY → YYYY-MM-DD
                if (dateFields.has(h) && v && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) {
                    const [m, d, y] = v.split('/');
                    const year = y.length === 2 ? (parseInt(y, 10) > 50 ? '19' + y : '20' + y) : y;
                    v = `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
                }
                row[h] = (v === '' && nullableFields.has(h)) ? null : v;
            });
            rows.push(row);
        }
        return { rows, errors };
    }

})();
