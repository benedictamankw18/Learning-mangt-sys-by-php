/* ============================================
   Attendance Details Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    const STORAGE_KEY = 'lms_attendance_details';
    const STATUS_VALUES = ['present', 'absent', 'late', 'excused'];
    const S = {
        context: null,
        records: [],
        rows: [],
        mode: 'view',
        saving: false,
    };

    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'attendance-details') {
            initAttendanceDetailsPage();
        }
    });

    async function initAttendanceDetailsPage() {
        bindEvents();

        const context = readContext();
        S.context = context;
        S.mode = normalizeMode(context && context.mode);
        updateModeUi();

        if (!context || !context.course_id) {
            setSubtitle('No attendance context found. Open a class from Attendance Management.');
            setTableMessage('No attendance details context available.');
            return;
        }

        const selectedDate = String(context.selected_date || new Date().toISOString().slice(0, 10));
        const dateInput = document.getElementById('attdDate');
        if (dateInput) dateInput.value = selectedDate;

        context.selected_date = selectedDate;
        persistContext(context);
        setSubtitle(buildSubtitle(context, selectedDate));
        await loadAttendanceDetails();
    }

    function bindEvents() {
        on('attdBackBtn', 'click', function () {
            window.location.hash = '#attendance';
        });
        on('attdDate', 'change', onFiltersChanged);
        on('attdStatusFilter', 'change', onFiltersChanged);
        on('attdSearch', 'input', onFiltersChanged);
        on('attdSaveBtn', 'click', saveChanges);
        on('attdDiscardBtn', 'click', discardChanges);
        on('attdMarkAllPresentBtn', 'click', markAllPresent);
    }

    async function onFiltersChanged() {
        const dateVal = valueOf('attdDate');
        if (!S.context) return;

        const currentDate = String(S.context.selected_date || '');
        if (dateVal && dateVal !== currentDate) {
            S.context.selected_date = dateVal;
            persistContext(S.context);
            await loadAttendanceDetails();
            return;
        }

        updateFilteredTable();
        refreshStats();
    }

    async function loadAttendanceDetails() {
        if (!S.context || !S.context.course_id) return;

        setTableMessage('Loading attendance details...');

        try {
            const attendanceRes = await API.get('/api/courses/' + S.context.course_id + '/attendance', {
                date: S.context.selected_date || new Date().toISOString().slice(0, 10),
            });

            const attendanceRows = toArray(attendanceRes);
            S.rows = await buildRows(attendanceRows);
            S.records = S.rows;
            setSubtitle(buildSubtitle(S.context, S.context.selected_date));

            updateFilteredTable();
            refreshStats();
            updateDirtySummary();
        } catch (error) {
            S.records = [];
            S.rows = [];
            setTableMessage('Failed to load attendance details.');
            if (typeof window.showToast === 'function') {
                window.showToast('Unable to load attendance details from API.', 'error');
            }
        }
    }

    async function buildRows(attendanceRows) {
        const byStudentId = new Map();
        attendanceRows.forEach(function (r) {
            const studentId = parseIntSafe(r.student_id);
            if (studentId > 0) byStudentId.set(studentId, r);
        });

        // Always fetch enrolled students so the roster is never empty,
        // even when no attendance has been marked yet (view mode).
        let students = [];
        try {
            const studentRes = await API.get('/api/courses/' + S.context.course_id + '/students');
            students = toArray(studentRes);
        } catch (e) {
            students = [];
        }

        // Some schools keep only class-level enrollment and may not populate
        // course_enrollments yet; use class roster as fallback.
        if (!students.length && S.context && S.context.class_uuid) {
            try {
                const classRes = await API.get('/api/classes/' + S.context.class_uuid + '/students');
                students = toArray(classRes);
            } catch (e) {
                students = [];
            }
        }

        // If the enrollment endpoint returned nothing, fall back to attendance rows only.
        if (!students.length) {
            return attendanceRows.map(function (r) {
                return buildRowData(r, r, true);
            });
        }

        return students.map(function (student) {
            const studentId = parseIntSafe(student.student_id);
            const existing = byStudentId.get(studentId) || null;
            return buildRowData(student, existing, !!existing);
        });
    }

    function buildRowData(source, existing, hasExisting) {
        const firstName = String((existing && existing.first_name) || source.first_name || '').trim();
        const lastName = String((existing && existing.last_name) || source.last_name || '').trim();
        const fullName = (firstName + ' ' + lastName).trim() || 'Student';
        const studentId = parseIntSafe(source.student_id || (existing && existing.student_id));
        const idNumber = String((existing && existing.student_id_number) || source.student_id_number || source.student_number || 'N/A').trim();
        const status = normalizeEditableStatus(existing ? existing.status : 'unmarked');
        const remarks = String((existing && (existing.remarks || existing.remark || existing.notes)) || '').trim();

        return {
            attendance_id: hasExisting ? parseIntSafe(existing.attendance_id) : 0,
            student_id: studentId,
            student_name: fullName,
            student_id_number: idNumber,
            status: status,
            remarks: remarks,
            marked_at: existing ? (existing.marked_at || existing.updated_at || existing.created_at || '') : '',
            original_status: status,
            original_remarks: remarks,
            dirty: false,
        };
    }

    function isEditableMode() {
        return S.mode === 'edit' || S.mode === 'mark';
    }

    function normalizeMode(mode) {
        const m = String(mode || '').trim().toLowerCase();
        if (m === 'edit') return 'edit';
        if (m === 'mark') return 'mark';
        return 'view';
    }

    function updateModeUi() {
        const badge = document.getElementById('attdModeBadge');
        const editBar = document.getElementById('attdEditBar');
        const isEditable = isEditableMode();

        if (badge) {
            badge.className = 'attd-mode-badge';
            if (S.mode === 'edit') {
                badge.textContent = 'Edit';
                badge.classList.add('is-edit');
            } else if (S.mode === 'mark') {
                badge.textContent = 'Mark';
                badge.classList.add('is-mark');
            } else {
                badge.textContent = 'View';
            }
        }

        if (editBar) editBar.hidden = !isEditable;
    }

    function getVisibleRows() {
        const statusFilter = valueOf('attdStatusFilter');
        const search = valueOf('attdSearch');

        return S.rows.filter(function (r) {
            const status = normalizeEditableStatus(r.status);
            const name = String(r.student_name || '').toLowerCase();
            const idNo = String(r.student_id_number || '').toLowerCase();

            const statusMatch = !statusFilter || status === statusFilter;
            const searchMatch = !search || name.includes(search) || idNo.includes(search);
            return statusMatch && searchMatch;
        });
    }

    function updateFilteredTable() {
        renderTable(getVisibleRows());
    }

    function renderTable(visibleRows) {
        const tbody = document.getElementById('attdTableBody');
        if (!tbody) return;

        const visible = Array.isArray(visibleRows) ? visibleRows : [];
        if (!visible.length) {
            setTableMessage('No attendance records found for current filters.');
            return;
        }

        tbody.innerHTML = visible.map(function (r) {
            const fullName = String(r.student_name || 'Student');
            const idNo = String(r.student_id_number || 'N/A').trim();
            const status = normalizeEditableStatus(r.status);
            const statusLabel = capitalize(status || 'unknown');
            const statusClass = 'attd-pill-' + (status || 'unknown');
            const markedAt = formatDateTime(r.marked_at);
            const isDirty = isRowDirty(r);
            const statusCell = isEditableMode()
                ? '<select class="attd-cell-select attd-row-status" data-student-id="' + r.student_id + '">'
                    + '<option value="unmarked"' + (status === 'unmarked' ? ' selected' : '') + '>Unmarked</option>'
                    + '<option value="present"' + (status === 'present' ? ' selected' : '') + '>Present</option>'
                    + '<option value="absent"' + (status === 'absent' ? ' selected' : '') + '>Absent</option>'
                    + '<option value="late"' + (status === 'late' ? ' selected' : '') + '>Late</option>'
                    + '<option value="excused"' + (status === 'excused' ? ' selected' : '') + '>Excused</option>'
                  + '</select>'
                : '<span class="attd-pill ' + escapeHtml(statusClass) + '">' + escapeHtml(statusLabel) + '</span>';
            const remarkCell = isEditableMode()
                ? '<input type="text" class="attd-cell-input attd-row-remark" data-student-id="' + r.student_id + '" value="' + escapeHtml(r.remarks || '') + '" placeholder="Optional remark" />'
                : (String(r.remarks || '').trim() || '—');

            return '<tr' + (isDirty ? ' class="attd-row-dirty"' : '') + '>'
                + '<td>' + escapeHtml(fullName) + '</td>'
                + '<td>' + escapeHtml(idNo) + '</td>'
                + '<td>' + statusCell + '</td>'
                + '<td>' + escapeHtml(markedAt) + '</td>'
                + '<td>' + remarkCell + '</td>'
                + '</tr>';
        }).join('');

        if (isEditableMode()) {
            wireRowInputs();
        }
    }

    function wireRowInputs() {
        document.querySelectorAll('.attd-row-status').forEach(function (el) {
            el.addEventListener('change', function () {
                const studentId = parseIntSafe(el.getAttribute('data-student-id'));
                const row = findRow(studentId);
                if (!row) return;
                row.status = normalizeEditableStatus(el.value);
                row.dirty = isRowDirty(row);
                updateFilteredTable();
                refreshStats();
                updateDirtySummary();
            });
        });

        document.querySelectorAll('.attd-row-remark').forEach(function (el) {
            el.addEventListener('input', function () {
                const studentId = parseIntSafe(el.getAttribute('data-student-id'));
                const row = findRow(studentId);
                if (!row) return;
                row.remarks = String(el.value || '').trim();
                row.dirty = isRowDirty(row);
                updateDirtySummary();
            });
        });
    }

    function refreshStats() {
        const visible = getVisibleRows();

        let present = 0;
        let absent = 0;
        let late = 0;
        let totalMarked = 0;

        visible.forEach(function (r) {
            const s = normalizeEditableStatus(r.status);
            if (s === 'present') present += 1;
            if (s === 'absent') absent += 1;
            if (s === 'late') late += 1;
            if (STATUS_VALUES.includes(s)) totalMarked += 1;
        });

        setText('attdTotal', String(totalMarked));
        setText('attdPresent', String(present));
        setText('attdAbsent', String(absent));
        setText('attdLate', String(late));
    }

    async function saveChanges() {
        if (!isEditableMode() || S.saving) return;

        const dirtyRows = S.rows.filter(isRowDirty);
        if (!dirtyRows.length) {
            showToast('No changes to save.', 'info');
            return;
        }

        const invalid = dirtyRows.filter(function (row) {
            return !STATUS_VALUES.includes(normalizeEditableStatus(row.status));
        });

        if (invalid.length) {
            showToast('Select a valid status before saving all edited rows.', 'warning');
            return;
        }

        S.saving = true;
        setSaveButtonState(true);

        try {
            const date = String(S.context.selected_date || new Date().toISOString().slice(0, 10));
            const tasks = dirtyRows.map(function (row) {
                const payload = {
                    status: normalizeEditableStatus(row.status),
                    remarks: row.remarks || null,
                };

                if (row.attendance_id > 0) {
                    return API.put('/api/attendance/' + row.attendance_id, payload);
                }

                return API.post('/api/attendance', {
                    student_id: row.student_id,
                    course_id: S.context.course_id,
                    attendance_date: date,
                    status: payload.status,
                    remarks: payload.remarks,
                });
            });

            const results = await Promise.allSettled(tasks);
            const failed = results.filter(function (r) { return r.status === 'rejected'; });

            if (failed.length) {
                showToast('Saved with ' + failed.length + ' failed row(s).', 'warning');
            } else {
                showToast('Attendance changes saved successfully.', 'success');
            }

            await loadAttendanceDetails();
        } catch (error) {
            showToast('Failed to save attendance changes.', 'error');
        } finally {
            S.saving = false;
            setSaveButtonState(false);
        }
    }

    function discardChanges() {
        S.rows.forEach(function (row) {
            row.status = row.original_status;
            row.remarks = row.original_remarks;
            row.dirty = false;
        });
        updateFilteredTable();
        refreshStats();
        updateDirtySummary();
    }

    function markAllPresent() {
        if (!isEditableMode()) return;
        S.rows.forEach(function (row) {
            row.status = 'present';
            row.dirty = isRowDirty(row);
        });
        updateFilteredTable();
        refreshStats();
        updateDirtySummary();
    }

    function updateDirtySummary() {
        const summary = document.getElementById('attdEditSummary');
        if (!summary || !isEditableMode()) return;

        const dirtyCount = S.rows.filter(isRowDirty).length;
        if (!dirtyCount) {
            summary.textContent = 'No unsaved changes';
            return;
        }
        summary.textContent = dirtyCount + ' unsaved change' + (dirtyCount === 1 ? '' : 's');
    }

    function setSaveButtonState(isSaving) {
        const btn = document.getElementById('attdSaveBtn');
        if (!btn) return;
        btn.disabled = !!isSaving;
        btn.textContent = isSaving ? 'Saving...' : 'Save Changes';
    }

    function findRow(studentId) {
        return S.rows.find(function (r) { return r.student_id === studentId; }) || null;
    }

    function isRowDirty(row) {
        if (!row) return false;
        const currentStatus = normalizeEditableStatus(row.status);
        const originalStatus = normalizeEditableStatus(row.original_status);
        const currentRemarks = String(row.remarks || '').trim();
        const originalRemarks = String(row.original_remarks || '').trim();
        return currentStatus !== originalStatus || currentRemarks !== originalRemarks;
    }

    function buildSubtitle(context, dateText) {
        const className = String(context.class_name || 'Selected class').trim();
        const classCode = String(context.class_code || '').trim();
        const program = String(context.program_name || '').trim();
        const teacher = String(context.teacher_name || '').trim();
        const mode = String(context.mode || 'view').trim();

        const left = classCode ? (className + ' (' + classCode + ')') : className;
        const right = [program, teacher].filter(Boolean).join(' • ');
        const modeLabel = mode ? ('Mode: ' + capitalize(mode)) : '';
        const dateLabel = dateText ? ('Date: ' + dateText) : '';

        return [left, right, modeLabel, dateLabel].filter(Boolean).join(' • ');
    }

    function setSubtitle(text) {
        setText('attdSubtitle', text || 'Attendance details');
    }

    function setTableMessage(message) {
        const tbody = document.getElementById('attdTableBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="attd-empty">' + escapeHtml(message) + '</td></tr>';
    }

    function readContext() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (error) {
            return null;
        }
    }

    function persistContext(context) {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
        } catch (error) {
            // Ignore storage errors.
        }
    }

    function toArray(apiResult) {
        if (Array.isArray(apiResult)) return apiResult;
        if (Array.isArray(apiResult && apiResult.data)) return apiResult.data;
        if (Array.isArray(apiResult && apiResult.data && apiResult.data.data)) return apiResult.data.data;
        if (Array.isArray(apiResult && apiResult.items)) return apiResult.items;
        return [];
    }

    function normalizeEditableStatus(value) {
        const status = String(value || '').trim().toLowerCase();
        if (STATUS_VALUES.includes(status)) return status;
        return status === 'unmarked' ? 'unmarked' : 'unmarked';
    }

    function formatDateTime(value) {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleString();
    }

    function capitalize(value) {
        const s = String(value || '');
        return s ? (s.charAt(0).toUpperCase() + s.slice(1)) : '';
    }

    function parseIntSafe(v) {
        const n = parseInt(String(v || '').replace(/[^0-9-]/g, ''), 10);
        return Number.isFinite(n) ? n : 0;
    }

    function valueOf(id) {
        const el = document.getElementById(id);
        return el ? String(el.value || '').trim().toLowerCase() : '';
    }

    function on(id, eventName, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(eventName, handler);
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function showToast(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'info');
            return;
        }
        console.log((type || 'info').toUpperCase() + ': ' + message);
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
