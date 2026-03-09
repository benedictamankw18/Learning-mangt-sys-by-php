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
        loadStudents();
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────
    function setupEventListeners() {
        // Add student
        on('addStudentBtn', 'click', () => openStudentModal(null));

        // Export
        on('exportStudentsBtn', 'click', exportStudents);

        // Import
        on('importStudentsBtn', 'click', () => openImportModal());
        on('importDropZone', 'click', () => q('#importFileInput').click());
        on('importFileInput', 'change', e => handleImportFile(e.target.files[0]));
        on('downloadTemplateLink', 'click', e => { e.preventDefault(); downloadCsvTemplate(); });
        on('cancelImportBtn', 'click', closeImportModal);
        on('closeImportModalBtn', 'click', closeImportModal);
        on('confirmImportBtn', 'click', confirmImport);

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
                S.classes = classesRes.data || classesRes.data?.data || [];
                // The ClassController returns data nested differently
                if (classesRes.data && classesRes.data.data) S.classes = classesRes.data.data;
                populateSelect('filterStudentClass', S.classes, 'class_id', 'class_name', 'All Classes');
                populateSelect('sfClass', S.classes, 'class_id', 'class_name', 'Select class');
            }
            if (programsRes && programsRes.success) {
                S.programs = Array.isArray(programsRes.data) ? programsRes.data : [];
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
            const badgeClass = s.status === 'active' ? 'badge-active'
                             : s.status === 'withdrawn' ? 'badge-withdrawn' : 'badge-inactive';
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
                            <div class="student-email">${escapeHtml(s.email || '')}</div>
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
    function openStudentModal(uuid) {
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

        if (uuid) {
            // Find in current list
            const student = S.students.find(s => s.uuid === uuid);
            if (student) fillStudentForm(student);
        } else {
            // Set today's enrollment date
            const today = new Date().toISOString().split('T')[0];
            const sfEnroll = q('#sfEnrollmentDate');
            if (sfEnroll) sfEnroll.value = today;
        }

        openOverlay('studentModalOverlay');
    }

    function fillStudentForm(s) {
        setVal('sfFirstName', s.first_name || '');
        setVal('sfLastName',  s.last_name  || '');
        setVal('sfEmail',     s.email      || '');
        setVal('sfUsername',  s.username   || '');
        setVal('sfGender',    s.gender     || '');
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
        const form = q('#studentForm');
        if (form) form.reset();
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
                closeStudentModal();
                loadStudents();
            } else {
                const msg = res?.message || (S.editingUuid ? 'Failed to update student' : 'Failed to add student');
                if (typeof showToast === 'function') showToast(msg, 'error');
            }
        } catch (err) {
            console.error('Save student error:', err);
            if (typeof showToast === 'function') showToast('An error occurred. Please try again.', 'error');
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
        if (!un.trim()) errors.sfUsername  = 'Username is required';
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
        const actionText = currentStatus === 'active' ? 'deactivate' : 'activate';

        if (!confirm(`Are you sure you want to ${actionText} this student?`)) return;

        try {
            const res = await API.put(API_ENDPOINTS.STUDENT_STATUS(uuid), { status: newStatus });
            if (res && res.success) {
                if (typeof showToast === 'function') showToast(`Student ${newStatus}`, 'success');
                loadStudents();
            } else {
                if (typeof showToast === 'function') showToast(res?.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error('Toggle status error:', err);
            if (typeof showToast === 'function') showToast('An error occurred', 'error');
        }
    }

    // ─── Delete ───────────────────────────────────────────────────────────────
    async function deleteStudent(uuid) {
        const student = S.students.find(s => s.uuid === uuid);
        const name = student ? `${student.first_name} ${student.last_name}`.trim() : 'this student';

        if (!confirm(`Delete ${name}? This will mark the student as withdrawn.`)) return;

        try {
            const res = await API.delete(API_ENDPOINTS.STUDENT_BY_UUID(uuid));
            if (res && res.success) {
                if (typeof showToast === 'function') showToast('Student removed', 'success');
                if (S.selectedUuids.has(uuid)) S.selectedUuids.delete(uuid);
                loadStudents();
            } else {
                if (typeof showToast === 'function') showToast(res?.message || 'Failed to delete student', 'error');
            }
        } catch (err) {
            console.error('Delete student error:', err);
            if (typeof showToast === 'function') showToast('An error occurred', 'error');
        }
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
        if (!confirm(`${capitalize(newStatus)} ${count} student${count !== 1 ? 's' : ''}?`)) return;

        let success = 0;
        for (const uuid of S.selectedUuids) {
            try {
                const res = await API.put(API_ENDPOINTS.STUDENT_STATUS(uuid), { status: newStatus });
                if (res && res.success) success++;
            } catch (_) { /* ignore per-item */ }
        }
        if (typeof showToast === 'function') showToast(`${success} / ${count} students updated`, 'success');
        clearSelection();
        loadStudents();
    }

    async function bulkDelete() {
        if (!S.selectedUuids.size) return;
        const count = S.selectedUuids.size;
        if (!confirm(`Delete ${count} student${count !== 1 ? 's' : ''}? They will be marked as withdrawn.`)) return;

        let success = 0;
        for (const uuid of S.selectedUuids) {
            try {
                const res = await API.delete(API_ENDPOINTS.STUDENT_BY_UUID(uuid));
                if (res && res.success) success++;
            } catch (_) { /* ignore per-item */ }
        }
        if (typeof showToast === 'function') showToast(`${success} / ${count} students removed`, 'success');
        clearSelection();
        loadStudents();
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
            downloadCsv(csvRows.join('\n'), `students_export_${new Date().toISOString().split('T')[0]}.csv`);
            if (typeof showToast === 'function') showToast(`Exported ${rows.length} students`, 'success');
        } catch (err) {
            console.error('Export error:', err);
            if (typeof showToast === 'function') showToast('Export failed', 'error');
        }
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

        let success = 0, failed = 0;
        for (const row of S.importRows) {
            try {
                // Minimal required fields check
                if (!row.first_name || !row.last_name || !row.email || !row.student_id_number || !row.username || !row.password) {
                    failed++;
                    continue;
                }
                const res = await API.post(API_ENDPOINTS.STUDENTS, row);
                if (res && res.success) success++;
                else failed++;
            } catch (_) { failed++; }
        }

        hide('confirmImportSpinner');
        setText('confirmImportText', 'Import');
        if (confirmBtn) confirmBtn.disabled = false;

        closeImportModal();
        if (typeof showToast === 'function') {
            showToast(`Imported ${success} students${failed ? `, ${failed} failed` : ''}`, success ? 'success' : 'error');
        }
        if (success) loadStudents();
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

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g,''));
            if (cols.length < 2) continue;
            const row = {};
            rawHeaders.forEach((h, idx) => { row[h] = cols[idx] || ''; });
            rows.push(row);
        }
        return { rows, errors };
    }

})();
