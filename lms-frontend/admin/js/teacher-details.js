/* ============================================
   Teacher Details Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    const SESSION_KEY = 'lms_teacher_uuid';

    let currentTeacher = null;

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'teacher-details') {
            initDetailsPage();
        }
    });

    function initDetailsPage() {
        setupTabs();
        setupBackButton();

        // Auto-activate a specific tab if stored (e.g., from "View Schedule" button)
        try {
            const storedTab = sessionStorage.getItem('lms_teacher_tab');
            if (storedTab) {
                sessionStorage.removeItem('lms_teacher_tab');
                const tabBtn = document.querySelector(`.td-tab-btn[data-tab="${storedTab}"]`);
                if (tabBtn) tabBtn.click();
            }
        } catch (_) {}

        const uuid = getStoredUuid();
        if (!uuid) {
            showError('No teacher selected. Please go back and select a teacher.');
            return;
        }
        loadTeacher(uuid);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function getStoredUuid() {
        try { return sessionStorage.getItem(SESSION_KEY) || null; } catch (_) { return null; }
    }

    function fmtDate(d) {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
        catch (_) { return d; }
    }

    function isActive(t) {
        return !t.employment_end_date && !!+t.is_active;
    }

    function escHtml(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function setText(id, v) {
        const el = document.getElementById(id);
        if (el) el.textContent = (v !== null && v !== undefined && v !== '') ? v : '—';
    }

    // ─── Back Button ─────────────────────────────────────────────────────────
    function setupBackButton() {
        const btn = document.getElementById('tdBackBtn');
        if (btn) btn.addEventListener('click', () => { window.location.hash = '#teachers'; });
    }

    // ─── Tabs ─────────────────────────────────────────────────────────────────
    function setupTabs() {
        document.querySelectorAll('.td-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.td-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.td-tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const panel = document.getElementById(`tdTab-${btn.dataset.tab}`);
                if (panel) panel.classList.add('active');
            });
        });
    }

    // ─── Load Teacher ─────────────────────────────────────────────────────────
    async function loadTeacher(uuid) {
        try {
            const res = await API.get(API_ENDPOINTS.TEACHER_BY_UUID(uuid));
            if (res && res.success) {
                currentTeacher = res.data;
                renderHeader(currentTeacher);
                renderProfileTab(currentTeacher);
                setupEditButton(currentTeacher);
                loadCourses(uuid);
                loadSchedule(uuid);
            } else {
                showError(res?.message || 'Teacher not found.');
            }
        } catch (err) {
            console.error('Load teacher details error:', err);
            showError('Failed to load teacher details.');
        }
    }

    // ─── Render Header ────────────────────────────────────────────────────────
    function renderHeader(t) {
        const first = t.first_name || '';
        const last  = t.last_name  || '';
        const init  = ((first.charAt(0)) + (last.charAt(0))).toUpperCase() || '?';

        const avatarEl = document.getElementById('tdAvatarLg');
        if (avatarEl) avatarEl.textContent = init;

        const nameEl = document.getElementById('tdName');
        if (nameEl) nameEl.textContent = `${first} ${last}`.trim() || '—';

        const metaEl = document.getElementById('tdMeta');
        if (metaEl) {
            metaEl.innerHTML = [
                t.email      ? `<span><i class="fas fa-envelope"></i> ${escHtml(t.email)}</span>` : '',
                t.employee_id ? `<span><i class="fas fa-id-badge"></i> ${escHtml(t.employee_id)}</span>` : '',
                t.phone_number ? `<span><i class="fas fa-phone"></i> ${escHtml(t.phone_number)}</span>` : '',
            ].filter(Boolean).join('');
        }

        const badgesEl = document.getElementById('tdBadges');
        if (badgesEl) {
            const active = isActive(t);
            badgesEl.innerHTML = [
                active
                    ? `<span class="td-badge td-badge-active"><i class="fas fa-circle" style="font-size:.5rem"></i> Active</span>`
                    : `<span class="td-badge td-badge-inactive"><i class="fas fa-circle" style="font-size:.5rem"></i> Inactive</span>`,
                t.program_name ? `<span class="td-badge td-badge-dept"><i class="fas fa-building"></i> ${escHtml(t.program_name)}</span>` : '',
            ].filter(Boolean).join('');
        }
    }

    // ─── Render Profile Tab ───────────────────────────────────────────────────
    function renderProfileTab(t) {
        setText('tdProfileFirstName',     t.first_name);
        setText('tdProfileLastName',      t.last_name);
        setText('tdProfileEmail',         t.email);
        setText('tdProfileUsername',      t.username);
        setText('tdProfilePhone',         t.phone_number);
        setText('tdProfileAddress',       t.address);
        setText('tdProfileEmployeeId',    t.employee_id);
        setText('tdProfileProgram',        t.program_name);
        setText('tdProfileQualification', t.qualification);
        setText('tdProfileSpecialization',t.specialization);
        setText('tdProfileHireDate',      fmtDate(t.hire_date));
        setText('tdProfileYearsExp',      t.years_of_experience !== null && t.years_of_experience !== undefined
            ? `${t.years_of_experience} year(s)` : null);
    }

    // ─── Edit Button ──────────────────────────────────────────────────────────
    function setupEditButton(t) {
        const btn = document.getElementById('tdEditBtn');
        if (!btn) return;
        btn.style.display = 'inline-flex';
        btn.addEventListener('click', () => {
            try { sessionStorage.setItem('lms_teacher_edit_uuid', t.uuid); } catch (_) {}
            window.location.hash = '#teachers';
        });
    }

    // ─── Load Courses ─────────────────────────────────────────────────────────
    async function loadCourses(uuid) {
        const tbody = document.getElementById('tdCoursesBody');
        if (!tbody) return;
        try {
            const res = await API.get(API_ENDPOINTS.TEACHER_COURSES(uuid));
            const courses = Array.isArray(res?.data) ? res.data : [];
            if (!courses.length) {
                tbody.innerHTML = `<tr><td colspan="5" class="td-empty">No courses assigned.</td></tr>`;
                return;
            }
            tbody.innerHTML = courses.map(c => `
                <tr>
                    <td>${escHtml(c.course_name || c.subject_name || '—')}</td>
                    <td>${escHtml(c.course_code || c.subject_code || '—')}</td>
                    <td>${escHtml(c.class_name || '—')}</td>
                    <td>${c.enrolled_students !== undefined ? c.enrolled_students : '—'}</td>
                    <td>${escHtml(c.status || '—')}</td>
                </tr>`).join('');
        } catch (_) {
            tbody.innerHTML = `<tr><td colspan="5" class="td-empty">Could not load courses.</td></tr>`;
        }
    }

    // ─── Load Schedule ────────────────────────────────────────────────────────
    async function loadSchedule(uuid) {
        const tbody = document.getElementById('tdScheduleBody');
        if (!tbody) return;
        try {
            const res = await API.get(API_ENDPOINTS.TEACHER_SCHEDULE(uuid));
            const schedule = Array.isArray(res?.data) ? res.data : [];
            if (!schedule.length) {
                tbody.innerHTML = `<tr><td colspan="5" class="td-empty">No schedule found.</td></tr>`;
                return;
            }
            tbody.innerHTML = schedule.map(s => `
                <tr>
                    <td>${escHtml(s.day || s.day_of_week || '—')}</td>
                    <td>${escHtml(s.time || (s.start_time ? `${s.start_time} – ${s.end_time}` : '—'))}</td>
                    <td>${escHtml(s.subject || s.subject_name || '—')}</td>
                    <td>${escHtml(s.class_name || '—')}</td>
                    <td>${escHtml(s.room || '—')}</td>
                </tr>`).join('');
        } catch (_) {
            tbody.innerHTML = `<tr><td colspan="5" class="td-empty">Could not load schedule.</td></tr>`;
        }
    }

    // ─── Error State ──────────────────────────────────────────────────────────
    function showError(msg) {
        const banner = document.getElementById('tdErrorBanner');
        if (banner) { banner.textContent = msg; banner.style.display = 'block'; }
        const nameEl = document.getElementById('tdName');
        if (nameEl) nameEl.textContent = 'Error';
    }

})();
