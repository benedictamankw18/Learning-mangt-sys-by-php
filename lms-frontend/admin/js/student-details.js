/* ============================================
   Student Details Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    const SESSION_KEY = 'lms_student_uuid';

    let currentStudent = null;

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'student-details') {
            initDetailsPage();
        }
    });

    function initDetailsPage() {
        setupTabs();
        setupBackButton();

        const uuid = getStoredUuid();
        if (!uuid) {
            showError('No student selected. Please go back and select a student.');
            return;
        }
        loadStudent(uuid);
    }

    // ─── Back Button ─────────────────────────────────────────────────────────
    function setupBackButton() {
        const btn = document.querySelector('#sdBackBtn');
        if (btn) btn.addEventListener('click', () => { window.location.hash = '#students'; });
    }

    // ─── Tabs ─────────────────────────────────────────────────────────────────
    function setupTabs() {
        document.querySelectorAll('.sd-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sd-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.sd-tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const panel = document.querySelector(`#sdTab-${btn.dataset.tab}`);
                if (panel) panel.classList.add('active');
            });
        });
    }

    // ─── Load Student ─────────────────────────────────────────────────────────
    async function loadStudent(uuid) {
        try {
            const res = await API.get(API_ENDPOINTS.STUDENT_BY_UUID(uuid));
            if (res && res.success) {
                currentStudent = res.data;
                renderHeader(currentStudent);
                renderPersonalTab(currentStudent);
                renderParentTab(currentStudent);
                setupActions(currentStudent);
                loadCourses(uuid);
                loadAttendance(res.data.student_id);
                loadGrades(res.data.student_id);
            } else {
                showError(res?.message || 'Student not found.');
            }
        } catch (err) {
            console.error('Load student details error:', err);
            showError('Failed to load student details.');
        }
    }

    // ─── Academic Tab – Course Enrollments ───────────────────────────────────
    async function loadCourses(uuid) {
        const tbody = document.querySelector('#sdCoursesBody');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--gray-400)"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;
        try {
            const res = await API.get(API_ENDPOINTS.STUDENT_COURSES(uuid));
            const courses = Array.isArray(res?.data) ? res.data : [];
            if (!courses.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:2rem">
                    <i class="fas fa-book-open" style="font-size:1.5rem;margin-bottom:.5rem;display:block"></i>
                    No course enrollments yet
                </td></tr>`;
                return;
            }
            tbody.innerHTML = courses.map(c => {
                const teacher = c.teacher_first_name
                    ? `${c.teacher_first_name} ${c.teacher_last_name || ''}`.trim()
                    : '—';
                const statusClass = c.enrollment_status === 'active' ? 'badge-active' : 'badge-inactive';
                const progress = c.progress_percentage != null ? `${c.progress_percentage}%` : '—';
                return `<tr>
                    <td><strong>${escapeHtml(c.subject_name || '—')}</strong><br>
                        <span style="font-size:.75rem;color:var(--gray-500)">${escapeHtml(c.subject_code || '')}</span>
                    </td>
                    <td>${escapeHtml(teacher)}</td>
                    <td>${escapeHtml(c.semester_name || '—')}</td>
                    <td><span class="students-badge ${statusClass}">${capitalize(c.enrollment_status || '—')}</span></td>
                    <td>${escapeHtml(progress)}</td>
                </tr>`;
            }).join('');
        } catch (err) {
            console.error('Load courses error:', err);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:1.5rem">Failed to load courses</td></tr>`;
        }
    }

    // ─── Attendance Tab ────────────────────────────────────────────────────────
    async function loadAttendance(studentId) {
        if (!studentId) return;
        try {
            const res = await API.get(API_ENDPOINTS.STUDENT_ATTENDANCE_STATS(studentId));
            const s = res?.data || {};
            setText('sdAttTotal',   s.total_days   != null ? s.total_days   : '—');
            setText('sdAttPresent', s.present_days != null ? s.present_days : '—');
            setText('sdAttAbsent',  s.absent_days  != null ? s.absent_days  : '—');
            setText('sdAttLate',    s.late_days    != null ? s.late_days    : '—');
            setText('sdAttRate',    s.attendance_percentage != null ? `${s.attendance_percentage}%` : '—');
        } catch (err) {
            console.error('Load attendance error:', err);
        }
    }

    // ─── Grades Tab ────────────────────────────────────────────────────────────
    async function loadGrades(studentId) {
        const tbody = document.querySelector('#sdGradesBody');
        if (!tbody || !studentId) return;
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:var(--gray-400)"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;
        try {
            const res = await API.get(API_ENDPOINTS.STUDENT_RESULTS(studentId));
            const results = Array.isArray(res?.data) ? res.data : [];
            if (!results.length) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--gray-400);padding:2rem">
                    <i class="fas fa-chart-bar" style="font-size:1.5rem;margin-bottom:.5rem;display:block"></i>
                    No assessment results yet
                </td></tr>`;
                return;
            }
            tbody.innerHTML = results.map(r => {
                const gradeClass = r.grade === 'A1' ? 'color:#059669' :
                    (r.grade && r.grade.startsWith('F')) ? 'color:#dc2626' : 'color:var(--gray-700)';
                const date = r.created_at ? r.created_at.split(' ')[0] : '—';
                return `<tr>
                    <td><strong>${escapeHtml(r.subject_name || '—')}</strong></td>
                    <td>${escapeHtml(r.semester_name || '—')}</td>
                    <td>Exam Result</td>
                    <td>${r.total_score != null ? r.total_score : '—'}</td>
                    <td>100</td>
                    <td><strong style="${gradeClass}">${escapeHtml(r.grade || '—')}</strong></td>
                    <td>${escapeHtml(date)}</td>
                </tr>`;
            }).join('');
        } catch (err) {
            console.error('Load grades error:', err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--gray-400);padding:1.5rem">Failed to load grades</td></tr>`;
        }
    }

    // ─── Header ───────────────────────────────────────────────────────────────
    function renderHeader(s) {
        const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
        const initials = ((s.first_name || '').charAt(0) + (s.last_name || '').charAt(0)).toUpperCase() || '?';

        setText('sdAvatar', initials);
        setText('sdName', fullName);
        setText('sdEmail', s.email || '—');
        setText('sdStudentId', s.student_id_number || '—');
        setText('sdClass', s.class_name || '—');
        setText('sdProgram', s.program_name || '—');

        const badge = document.querySelector('#sdStatusBadge');
        if (badge) {
            badge.textContent = capitalize(s.status || '—');
            badge.className = `sd-badge ${s.status || ''}`;
        }

        const toggleBtn = document.querySelector('#sdToggleStatusBtn');
        if (toggleBtn) {
            if (s.status === 'active') {
                toggleBtn.innerHTML = '<i class="fas fa-user-slash"></i> Deactivate';
                toggleBtn.className = 'btn btn-danger btn-sm';
            } else {
                toggleBtn.innerHTML = '<i class="fas fa-user-check"></i> Activate';
                toggleBtn.className = 'btn btn-success btn-sm';
            }
        }
    }

    // ─── Personal Tab ─────────────────────────────────────────────────────────
    function renderPersonalTab(s) {
        setText('sdFirstName', s.first_name || '—');
        setText('sdLastName',  s.last_name  || '—');
        setText('sdUsername',  s.username   || '—');
        setText('sdGender',    capitalize(s.gender || '') || '—');
        setText('sdDob',       formatDate(s.date_of_birth) || '—');
        setText('sdPhone',     s.phone_number || '—');
        setText('sdSID',       s.student_id_number || '—');
        setText('sdEnrolled',  formatDate(s.enrollment_date) || '—');
        setText('sdClassName', s.class_name || '—');
        setText('sdProgramName', s.program_name || '—');
        setText('sdStatusText', capitalize(s.status || '—'));
    }

    // ─── Parent Tab ───────────────────────────────────────────────────────────
    function renderParentTab(s) {
        setText('sdParentName',  s.parent_name  || '—');
        setText('sdParentPhone', s.parent_phone || '—');
        setText('sdParentEmail', s.parent_email || '—');
        setText('sdEmergency',   s.emergency_contact || '—');
    }

    // ─── Actions ──────────────────────────────────────────────────────────────
    function setupActions(s) {
        const editBtn = document.querySelector('#sdEditBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                // Navigate back to students page with a flag to open the edit modal
                try { sessionStorage.setItem('lms_student_edit_uuid', s.uuid); } catch (_) {}
                window.location.hash = '#students';
            });
        }

        const toggleBtn = document.querySelector('#sdToggleStatusBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => toggleStatus(s));
        }
    }

    async function toggleStatus(s) {
        const newStatus  = s.status === 'active' ? 'inactive' : 'active';
        const actionText = s.status === 'active' ? 'Deactivate' : 'Activate';
        const iconColor  = s.status === 'active' ? '#dc2626' : '#059669';
        const iconClass  = s.status === 'active' ? 'fa-user-slash' : 'fa-user-check';

        showModal(
            `${actionText} Student`,
            `<div style="display:flex;align-items:center;gap:.75rem">
                <i class="fas ${iconClass}" style="font-size:1.5rem;color:${iconColor}"></i>
                <span>Are you sure you want to <strong>${actionText.toLowerCase()}</strong> <strong>${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}</strong>?</span>
            </div>`,
            async () => {
                try {
                    const res = await API.put(API_ENDPOINTS.STUDENT_STATUS(s.uuid), { status: newStatus });
                    if (res && res.success) {
                        showToast(`Student ${newStatus} successfully`, 'success');
                        s.status = newStatus;
                        renderHeader(s);
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

    // ─── Error Display ────────────────────────────────────────────────────────
    function showError(msg) {
        const header = document.querySelector('#sdHeader');
        if (header) {
            header.innerHTML = `
                <div style="padding:2rem;color:var(--danger);text-align:center;width:100%">
                    <i class="fas fa-exclamation-circle" style="font-size:2rem;margin-bottom:.5rem;display:block"></i>
                    <p>${escapeHtml(msg)}</p>
                    <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#students'">
                        <i class="fas fa-arrow-left"></i> Back to Students
                    </button>
                </div>`;
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function getStoredUuid() {
        try { return sessionStorage.getItem(SESSION_KEY) || null; } catch (_) { return null; }
    }

    function setText(id, t) {
        const el = document.querySelector(`#${id}`);
        if (el) el.textContent = t;
    }

    function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    function formatDate(dateStr) {
        if (!dateStr) return null;
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (_) { return dateStr; }
    }

})();
