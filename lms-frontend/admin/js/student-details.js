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
            } else {
                showError(res?.message || 'Student not found.');
            }
        } catch (err) {
            console.error('Load student details error:', err);
            showError('Failed to load student details.');
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
        const actionText = s.status === 'active' ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${actionText} ${s.first_name} ${s.last_name}?`)) return;

        try {
            const res = await API.put(API_ENDPOINTS.STUDENT_STATUS(s.uuid), { status: newStatus });
            if (res && res.success) {
                if (typeof showToast === 'function') showToast(`Student ${newStatus}`, 'success');
                s.status = newStatus;
                renderHeader(s);
            } else {
                if (typeof showToast === 'function') showToast(res?.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error('Toggle status error:', err);
            if (typeof showToast === 'function') showToast('An error occurred', 'error');
        }
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
