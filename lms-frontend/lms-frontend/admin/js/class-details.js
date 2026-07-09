/* ============================================
   Class Details Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    const SESSION_KEY = 'lms_class_uuid';

    let currentClass   = null;
    let allStudents    = [];   // for client-side roster search
    let rosterFiltered = [];
    let allSubjects    = [];   // for PDF export
    let scheduleData   = [];
    let perfChartInst  = null;

    // ─── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'class-details') {
            initClassDetailsPage();
        }
    });

    function initClassDetailsPage() {
        currentClass   = null;
        allStudents    = [];
        rosterFiltered = [];
        allSubjects    = [];
        scheduleData   = [];
        if (perfChartInst) { try { perfChartInst.destroy(); } catch (_) {} perfChartInst = null; }

        setupTabs();
        setupBackButton();

        const uuid = getStoredUuid();
        if (!uuid) {
            showError('No class selected. Please go back and select a class.');
            return;
        }
        loadClassDetails(uuid);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function getStoredUuid() {
        try { return sessionStorage.getItem(SESSION_KEY) || null; } catch (_) { return null; }
    }

    function q(sel, ctx)  { return (ctx || document).querySelector(sel); }
    function qs(sel, ctx) { return (ctx || document).querySelectorAll(sel); }
    function setEl(id, v) { const el = document.getElementById(id); if (el) el.innerHTML = String(v ?? '—'); }
    function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = String(v ?? '—'); }
    function esc(s) { return typeof escHtml === 'function' ? escHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function fmt(d) {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
        catch (_) { return d; }
    }
    function fmtTime(t) { if (!t) return ''; return t.substring(0, 5); }
    function initials(first, last) {
        return ((first || '').charAt(0) + (last || '').charAt(0)).toUpperCase() || '?';
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
    function avatarColor(name) {
        const colors = ['#006a3f','#1d4ed8','#7c3aed','#d97706','#dc2626','#0369a1','#059669'];
        let h = 0;
        for (let i = 0; i < (name || '').length; i++) h += (name.charCodeAt(i) * (i + 1));
        return colors[h % colors.length];
    }

    // ─── Back Button ──────────────────────────────────────────────────────────
    function setupBackButton() {
        const btn = document.getElementById('cdBackBtn');
        if (btn) btn.addEventListener('click', () => { window.location.hash = '#classes'; });
    }

    // ─── Tabs ─────────────────────────────────────────────────────────────────
    function setupTabs() {
        qs('.cd-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                qs('.cd-tab-btn').forEach(b => b.classList.remove('active'));
                qs('.cd-tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const panel = document.getElementById('cdTab-' + btn.dataset.tab);
                if (panel) panel.classList.add('active');

                // Lazy-load tabs on first open
                if (currentClass) {
                    const uuid = currentClass.uuid;
                    if (btn.dataset.tab === 'roster'      && !document.getElementById('rosterTableBody').dataset.loaded)     loadRoster(uuid);
                    if (btn.dataset.tab === 'subjects'   && !document.getElementById('subjectsTableBody').dataset.loaded)  loadSubjects(uuid);
                    if (btn.dataset.tab === 'schedule'   && !document.getElementById('scheduleContainer').dataset.loaded)  loadSchedule(uuid);
                    if (btn.dataset.tab === 'performance' && !document.getElementById('performanceContainer').dataset.loaded) loadPerformance(uuid);
                }
            });
        });
    }

    // ─── Load Class ───────────────────────────────────────────────────────────
    async function loadClassDetails(uuid) {
        try {
            const res = await API.get(API_ENDPOINTS.CLASS_BY_UUID(uuid));
            if (res && res.success) {
                const c = res.data?.class || res.data || res;
                currentClass = c;
                renderHeader(c);
                renderInfoTab(c);
            } else {
                showError(res?.message || 'Class not found.');
            }
        } catch (err) {
            console.error('loadClassDetails error:', err);
            showError('Failed to load class details.');
        }
    }

    // ─── Header ───────────────────────────────────────────────────────────────
    function renderHeader(c) {
        // Icon
        const iconEl = document.getElementById('cdIconLg');
        if (iconEl) iconEl.innerHTML = `<i class="fas ${programIcon(c.program_name)}"></i>`;

        setText('cdName',    c.class_name);
        setText('cdCode',    c.class_code);
        setText('cdSection', c.section ? 'Section ' + c.section : '—');
        setText('cdRoom',    c.room_number || 'No room assigned');
        setText('cdTeacher', c.class_teacher_name || 'No teacher assigned');
        setText('cdYear',    c.year_name || '—');

        // Status badge
        const sb = document.getElementById('cdStatusBadge');
        if (sb) {
            sb.className = 'cd-badge ' + (c.status === 'active' ? 'cd-badge-active' : 'cd-badge-inactive');
            sb.textContent = c.status === 'active' ? 'Active' : 'Inactive';
        }

        // Program badge
        if (c.program_name) {
            const pb = document.getElementById('cdProgramBadge');
            if (pb) { pb.textContent = c.program_name; pb.style.display = 'inline-flex'; }
        }

        // Grade level badge
        if (c.grade_level_name) {
            const gb = document.getElementById('cdGradeBadge');
            if (gb) { gb.textContent = c.grade_level_name; gb.style.display = 'inline-flex'; }
        }

        // Stats strip
        setText('cdStatStudents', c.student_count ?? '—');
        setText('cdStatSubjects', c.subject_count ?? '—');
        const capText = c.max_students
            ? `${c.student_count ?? 0} / ${c.max_students}`
            : (c.student_count ?? '—');
        setText('cdStatCapacity', capText);
        // periods will update when schedule loads
        setText('cdStatPeriods', '—');

        // Export PDF button
        const pdfBtn = document.getElementById('cdExportPdfBtn');
        if (pdfBtn) pdfBtn.addEventListener('click', exportClassPDF);

        // Edit button
        const editBtn = document.getElementById('cdEditBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                try { sessionStorage.setItem('lms_class_edit_uuid', c.uuid); } catch (_) {}
                window.location.hash = '#classes';
            });
        }
    }

    // ─── Info Tab ─────────────────────────────────────────────────────────────
    function renderInfoTab(c) {
        const statusHtml = c.status === 'active'
            ? `<span style="padding:.2rem .6rem;border-radius:999px;background:#dcfce7;color:#16a34a;font-size:.8rem;font-weight:600;">Active</span>`
            : `<span style="padding:.2rem .6rem;border-radius:999px;background:#fee2e2;color:#dc2626;font-size:.8rem;font-weight:600;">Inactive</span>`;

        setEl('infoClassName',   esc(c.class_name));
        setEl('infoClassCode',   esc(c.class_code));
        setEl('infoSection',     esc(c.section || '—'));
        setEl('infoStatus',      statusHtml);
        setEl('infoProgram',     esc(c.program_name || '—'));
        setEl('infoGradeLevel',  esc(c.grade_level_name || '—'));
        setEl('infoAcademicYear', esc(c.year_name || '—'));
        setEl('infoCapacity',    c.max_students ? String(c.max_students) : '—');
        setEl('infoEnrolled',    String(c.student_count ?? '—'));
        setEl('infoRoom',        esc(c.room_number || '—'));
        setEl('infoTeacherName', esc(c.class_teacher_name || '—'));
        setEl('infoTeacherEmail', c.class_teacher_email ? `<a href="mailto:${esc(c.class_teacher_email)}" style="color:var(--primary,#006a3f);">${esc(c.class_teacher_email)}</a>` : '—');
        setEl('infoCreated',     fmt(c.created_at));
        setEl('infoUpdated',     fmt(c.updated_at));
    }

    // ─── Roster Tab ───────────────────────────────────────────────────────────
    async function loadRoster(uuid) {
        const tbody = document.getElementById('rosterTableBody');
        if (!tbody) return;
        tbody.dataset.loaded = '1';
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;

        try {
            const res = await ClassAPI.getStudents(uuid);
            const data = res?.data?.students || res?.data || (Array.isArray(res?.data) ? res.data : []);
            allStudents    = Array.isArray(data) ? data : [];
            rosterFiltered = [...allStudents];

            setText('rosterCount', allStudents.length);
            renderRosterTable(rosterFiltered);

            // Wire up search
            const searchInput = document.getElementById('rosterSearch');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const q2 = searchInput.value.trim().toLowerCase();
                    if (!q2) {
                        rosterFiltered = [...allStudents];
                    } else {
                        rosterFiltered = allStudents.filter(s => {
                            const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
                            return name.includes(q2) || (s.student_id_number || '').toLowerCase().includes(q2);
                        });
                    }
                    renderRosterTable(rosterFiltered);
                });
            }

            // Export button
            const exportBtn = document.getElementById('exportRosterBtn');
            if (exportBtn) exportBtn.addEventListener('click', exportRoster);

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load roster.</td></tr>`;
            console.error(err);
        }
    }

    function renderRosterTable(students) {
        const tbody = document.getElementById('rosterTableBody');
        if (!tbody) return;
        if (!students.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:#94a3b8;">
                <i class="fas fa-user-slash" style="font-size:1.5rem;display:block;margin-bottom:.5rem;"></i>
                No students enrolled in this class.
            </td></tr>`;
            return;
        }
        tbody.innerHTML = students.map((s, i) => {
            const name  = `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—';
            const init  = initials(s.first_name, s.last_name);
            const color = avatarColor(name);
            const age   = s.age ? s.age + ' yrs' : '—';
            const statusBadge = s.status === 'active'
                ? `<span style="background:#dcfce7;color:#16a34a;padding:.15rem .55rem;border-radius:999px;font-size:.7rem;font-weight:600;">Active</span>`
                : `<span style="background:#fee2e2;color:#dc2626;padding:.15rem .55rem;border-radius:999px;font-size:.7rem;font-weight:600;">Inactive</span>`;
            return `<tr>
                <td>${i + 1}</td>
                <td>
                    <div class="cd-roster-cell">
                        <div class="cd-avatar-sm" style="background:${color};">${esc(init)}</div>
                        <div>
                            <div style="font-weight:600;">${esc(name)}</div>
                            <a href="mailto:${esc(s.email || '')}" style="font-size:.74rem;color:#1d4ed8;text-decoration:underline;" class="cd-email">${esc(s.email || '')}</a>
                        </div>
                    </div>
                </td>
                <td>${esc(s.student_id_number || '—')}</td>
                <td>${esc(s.gender ? capitalize(s.gender) : '—')}</td>
                <td>${esc(age)}</td>
                <td>${fmt(s.enrollment_date)}</td>
                <td>${statusBadge}</td>
            </tr>`;
        }).join('');
    }

    function exportRoster() {
        if (!allStudents.length) return;
        const rows = [['#', 'Last Name', 'First Name', 'Student ID', 'Email', 'Gender', 'Age', 'Enrolled', 'Status']];
        allStudents.forEach((s, i) => {
            rows.push([
                i + 1,
                s.last_name || '', s.first_name || '',
                s.student_id_number || '',
                s.email || '', s.gender || '',
                s.age || '',
                s.enrollment_date || '',
                s.status || '',
            ]);
        });
        const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        const cn   = currentClass ? currentClass.class_name.replace(/\s+/g, '_') : 'class';
        a.href = url; a.download = `roster_${cn}.csv`; a.click();
        URL.revokeObjectURL(url);
    }

    // ─── Subjects Tab ─────────────────────────────────────────────────────────
    async function loadSubjects(uuid) {
        const tbody = document.getElementById('subjectsTableBody');
        if (!tbody) return;
        tbody.dataset.loaded = '1';
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;

        try {
            const res  = await ClassAPI.getClassSubjects(uuid);
            const data = res?.data?.class_subjects || res?.data || (Array.isArray(res?.data) ? res.data : []);
            const subjects = Array.isArray(data) ? data : [];
            allSubjects = subjects; // store for PDF export

            if (!subjects.length) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:#94a3b8;">
                    <i class="fas fa-book" style="font-size:1.5rem;display:block;margin-bottom:.5rem;"></i>
                    No subjects assigned to this class yet.
                </td></tr>`;
                // update stat
                setText('cdStatSubjects', '0');
                return;
            }

            setText('cdStatSubjects', subjects.length);

            tbody.innerHTML = subjects.map((s, i) => {
                const typeBadge = Number(s.is_core)
                    ? `<span class="cd-core-badge">Core</span>`
                    : `<span class="cd-elective-badge">Elective</span>`;
                const statusBadge = s.status === 'active'
                    ? `<span style="background:#dcfce7;color:#16a34a;padding:.15rem .55rem;border-radius:999px;font-size:.7rem;font-weight:600;">Active</span>`
                    : `<span style="background:#f3f4f6;color:#6b7280;padding:.15rem .55rem;border-radius:999px;font-size:.7rem;font-weight:600;">${esc(capitalize(s.status || 'inactive'))}</span>`;
                return `<tr>
                    <td>${i + 1}</td>
                    <td>
                        <div style="font-weight:600;">${esc(s.subject_name || '—')}</div>
                        ${s.description ? `<div style="font-size:.74rem;color:#94a3b8;">${esc(s.description.substring(0, 60))}${s.description.length > 60 ? '…' : ''}</div>` : ''}
                    </td>
                    <td><code style="font-size:.78rem;background:#f8fafc;padding:.1rem .4rem;border-radius:4px;">${esc(s.subject_code || '—')}</code></td>
                    <td>${typeBadge}</td>
                    <td>${s.credits ? s.credits : '—'}</td>
                    <td>${s.teacher_name ? `<div style="font-weight:500;">${esc(s.teacher_name)}</div>${s.teacher_email ? `<a href="mailto:${esc(s.teacher_email)}" style="font-size:.74rem;color:#1d4ed8;text-decoration:underline;">${esc(s.teacher_email)}</a>` : ''}` : '<span style="color:#94a3b8;">—</span>'}</td>
                    <td>${s.enrolled_students ?? '—'}</td>
                    <td>${statusBadge}</td>
                </tr>`;
            }).join('');

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load subjects.</td></tr>`;
            console.error(err);
        }
    }

    // ─── Schedule Tab ─────────────────────────────────────────────────────────
    const DAY_ORDER   = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const DAY_LABELS  = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' };

    async function loadSchedule(uuid) {
        const container = document.getElementById('scheduleContainer');
        if (!container) return;
        container.dataset.loaded = '1';
        container.innerHTML = `<div style="text-align:center;padding:2.5rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading…</div>`;

        try {
            const res  = await ClassAPI.getSchedule(uuid);
            const data = res?.data?.schedule || res?.data || (Array.isArray(res?.data) ? res.data : []);
            scheduleData = Array.isArray(data) ? data : [];

            // Update weekly periods stat
            setText('cdStatPeriods', scheduleData.length || '—');

            if (!scheduleData.length) {
                container.innerHTML = `<div style="text-align:center;padding:3rem;color:#94a3b8;">
                    <i class="fas fa-calendar-times" style="font-size:2rem;display:block;margin-bottom:.75rem;"></i>
                    No schedule periods set up yet for this class.
                </div>`;
                return;
            }

            // Group by day
            const byDay = {};
            scheduleData.forEach(p => {
                const day = (p.day_of_week || '').toLowerCase();
                if (!byDay[day]) byDay[day] = [];
                byDay[day].push(p);
            });

            const orderedDays = DAY_ORDER.filter(d => byDay[d]);

            container.innerHTML = `<div class="cd-schedule-grid">
                ${orderedDays.map(day => {
                    const periods = byDay[day];
                    return `<div class="cd-day-block">
                        <div class="cd-day-title">${DAY_LABELS[day] || day}</div>
                        ${periods.map(p => `
                            <div class="cd-period-row">
                                <span class="cd-period-time">
                                    <i class="fas fa-clock" style="font-size:.7rem;color:#94a3b8;"></i>
                                    ${esc(fmtTime(p.start_time))} – ${esc(fmtTime(p.end_time))}
                                </span>
                                <span class="cd-period-subject">${esc(p.subject_name || '—')}</span>
                                ${p.teacher_name ? `<span class="cd-period-teacher"><i class="fas fa-user-tie fa-fw fa-xs"></i> ${esc(p.teacher_name)}</span>` : ''}
                                ${p.room ? `<span class="cd-period-room"><i class="fas fa-door-open fa-fw fa-xs"></i> ${esc(p.room)}</span>` : ''}
                            </div>`).join('')}
                    </div>`;
                }).join('')}
            </div>`;

        } catch (err) {
            container.innerHTML = `<div style="text-align:center;color:#ef4444;padding:2rem;">Failed to load schedule.</div>`;
            console.error(err);
        }
    }

    // ─── Export PDF ───────────────────────────────────────────────────────────
    function exportClassPDF() {
        if (!currentClass) {
            if (typeof window.showToast === 'function') window.showToast('Class data not loaded yet.', 'warning');
            return;
        }

        const c    = currentClass;
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const e    = v => String(v || '—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const fmtD = d => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); } catch(_){ return d; } };
        const fmtT = t => t ? String(t).substring(0,5) : '';

        // ── Roster section ──────────────────────────────────────────────────
        const rosterHtml = allStudents.length
            ? `<section>
                <h2 class="sec-title">Student Roster
                    <span class="badge">${allStudents.length} student${allStudents.length !== 1 ? 's' : ''}</span>
                </h2>
                <table>
                    <thead><tr>
                        <th>#</th><th>Student Name</th><th>Student ID</th>
                        <th>Gender</th><th>Age</th><th>Enrolled</th><th>Status</th>
                    </tr></thead>
                    <tbody>
                        ${allStudents.map((s, i) => {
                            const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—';
                            const init = ((s.first_name||'').charAt(0)+(s.last_name||'').charAt(0)).toUpperCase() || '?';
                            const status = s.status === 'active'
                                ? `<span class="badge-green">Active</span>`
                                : `<span class="badge-red">Inactive</span>`;
                            return `<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
                                <td>${i+1}</td>
                                <td><span class="avatar">${e(init)}</span> ${e(name)}</td>
                                <td style="font-family:monospace;font-size:11px">${e(s.student_id_number)}</td>
                                <td>${e(s.gender ? s.gender.charAt(0).toUpperCase()+s.gender.slice(1) : '—')}</td>
                                <td>${s.age ? s.age+' yrs' : '—'}</td>
                                <td>${fmtD(s.enrollment_date)}</td>
                                <td>${status}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </section>`
            : '';

        // ── Subjects section ─────────────────────────────────────────────────
        const subjectsHtml = allSubjects.length
            ? `<section>
                <h2 class="sec-title">Assigned Subjects
                    <span class="badge">${allSubjects.length} subject${allSubjects.length !== 1 ? 's' : ''}</span>
                </h2>
                <table>
                    <thead><tr>
                        <th>#</th><th>Subject</th><th>Code</th><th>Type</th>
                        <th>Credits</th><th>Teacher</th><th>Enrolled</th><th>Status</th>
                    </tr></thead>
                    <tbody>
                        ${allSubjects.map((s, i) => {
                            const type = Number(s.is_core)
                                ? `<span class="badge-green">Core</span>`
                                : `<span class="badge-blue">Elective</span>`;
                            const status = s.status === 'active'
                                ? `<span class="badge-green">Active</span>`
                                : `<span class="badge-gray">${e(s.status||'inactive')}</span>`;
                            return `<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
                                <td>${i+1}</td>
                                <td><strong>${e(s.subject_name)}</strong>${s.description?`<br><small style="color:#64748b">${e(s.description.substring(0,60))}${s.description.length>60?'…':''}</small>`:''}</td>
                                <td style="font-family:monospace;font-size:11px">${e(s.subject_code)}</td>
                                <td>${type}</td>
                                <td>${s.credits||'—'}</td>
                                <td>${s.teacher_name?e(s.teacher_name):'—'}</td>
                                <td>${s.enrolled_students??'—'}</td>
                                <td>${status}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </section>`
            : '';

        // ── Schedule section ─────────────────────────────────────────────────
        const DAY_ORDER  = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        const DAY_LABELS = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' };
        let scheduleHtml = '';
        if (scheduleData.length) {
            const byDay = {};
            scheduleData.forEach(p => {
                const day = (p.day_of_week || '').toLowerCase();
                if (!byDay[day]) byDay[day] = [];
                byDay[day].push(p);
            });
            const orderedDays = DAY_ORDER.filter(d => byDay[d]);
            scheduleHtml = `<section>
                <h2 class="sec-title">Weekly Timetable
                    <span class="badge">${scheduleData.length} period${scheduleData.length !== 1 ? 's' : ''}</span>
                </h2>
                <table>
                    <thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th></tr></thead>
                    <tbody>
                        ${orderedDays.flatMap((day, di) =>
                            byDay[day].map((p, pi) => `<tr style="background:${(di+pi)%2===0?'#fff':'#f8fafc'}">
                                ${pi === 0 ? `<td rowspan="${byDay[day].length}" style="font-weight:700;color:#006a3f;border-left:3px solid #006a3f;">${DAY_LABELS[day]}</td>` : ''}
                                <td style="white-space:nowrap;font-weight:600">${e(fmtT(p.start_time))} – ${e(fmtT(p.end_time))}</td>
                                <td><strong>${e(p.subject_name)}</strong></td>
                                <td>${p.teacher_name?e(p.teacher_name):'—'}</td>
                                <td>${p.room?e(p.room):'—'}</td>
                            </tr>`)
                        ).join('')}
                    </tbody>
                </table>
            </section>`;
        }

        // ── Build HTML ───────────────────────────────────────────────────────
        const statusColor = c.status === 'active' ? '#16a34a' : '#dc2626';
        const statusBg    = c.status === 'active' ? '#dcfce7' : '#fee2e2';

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Class Report — ${e(c.class_name)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; padding: 24px; }
  /* Header */
  .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 3px solid #006a3f; }
  .report-header-left h1 { font-size: 20px; color: #006a3f; margin-bottom: 4px; }
  .report-header-left p  { color: #64748b; font-size: 11px; margin-top: 2px; }
  .report-header-right   { text-align: right; color: #64748b; font-size: 11px; line-height: 1.7; }
  /* Class info summary */
  .class-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .cs-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .cs-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; font-weight: 600; margin-bottom: 3px; }
  .cs-card .value { font-size: 13px; font-weight: 700; color: #0f172a; }
  /* Stats strip */
  .stats-row { display: flex; gap: 10px; margin-bottom: 20px; }
  .stat-chip { flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; text-align: center; }
  .stat-chip .num  { font-size: 22px; font-weight: 700; color: #006a3f; line-height: 1; }
  .stat-chip .lbl  { font-size: 10px; color: #64748b; margin-top: 3px; }
  /* Sections */
  section { margin-bottom: 22px; }
  .sec-title { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  /* Tables */
  table  { width: 100%; border-collapse: collapse; }
  th { background: #006a3f; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
  td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  /* Badges */
  .badge       { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; background: #e2e8f0; color: #475569; }
  .badge-green { background: #dcfce7; color: #15803d; display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .badge-red   { background: #fee2e2; color: #b91c1c; display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .badge-blue  { background: #dbeafe; color: #1d4ed8; display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .badge-gray  { background: #f1f5f9; color: #64748b; display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  /* Avatar */
  .avatar { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #006a3f; color: #fff; font-size: 9px; font-weight: 700; margin-right: 4px; vertical-align: middle; }
  /* Print button */
  .print-btn { display: inline-block; padding: 5px 14px; background: #006a3f; color: #fff; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; }
  /* Footer */
  .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  @media print {
    body { padding: 0; }
    @page { margin: 14mm; size: A4 portrait; }
    .print-btn { display: none !important; }
  }
</style>
</head>
<body>
  <!-- Report Header -->
  <div class="report-header">
    <div class="report-header-left">
      <h1>&#127979; Class Report — ${e(c.class_name)}</h1>
      <p>${e(c.class_code)}${c.section ? ' &bull; Section ' + e(c.section) : ''}${c.program_name ? ' &bull; ' + e(c.program_name) : ''}</p>
    </div>
    <div class="report-header-right">
      <div>Exported: ${date}</div>
      ${c.year_name ? `<div>Academic Year: ${e(c.year_name)}</div>` : ''}
      <button class="print-btn" onclick="window.print()" style="margin-top:6px;">&#128438; Print / Save PDF</button>
    </div>
  </div>

  <!-- Stats strip -->
  <div class="stats-row">
    <div class="stat-chip"><div class="num">${c.student_count ?? '—'}</div><div class="lbl">Students Enrolled</div></div>
    <div class="stat-chip"><div class="num">${c.subject_count ?? '—'}</div><div class="lbl">Subjects</div></div>
    <div class="stat-chip"><div class="num">${c.max_students || '—'}</div><div class="lbl">Capacity</div></div>
    <div class="stat-chip"><div class="num">${scheduleData.length || '—'}</div><div class="lbl">Periods / Week</div></div>
  </div>

  <!-- Class Info Summary -->
  <section>
    <h2 class="sec-title">Class Information</h2>
    <div class="class-summary">
      <div class="cs-card"><div class="label">Class Name</div><div class="value">${e(c.class_name)}</div></div>
      <div class="cs-card"><div class="label">Class Code</div><div class="value">${e(c.class_code)}</div></div>
      <div class="cs-card"><div class="label">Section</div><div class="value">${e(c.section||'—')}</div></div>
      <div class="cs-card"><div class="label">Status</div><div class="value"><span style="color:${statusColor};background:${statusBg};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600">${e(c.status)}</span></div></div>
      <div class="cs-card"><div class="label">Program</div><div class="value">${e(c.program_name||'—')}</div></div>
      <div class="cs-card"><div class="label">Grade Level</div><div class="value">${e(c.grade_level_name||'—')}</div></div>
      <div class="cs-card"><div class="label">Academic Year</div><div class="value">${e(c.year_name||'—')}</div></div>
      <div class="cs-card"><div class="label">Room / Venue</div><div class="value">${e(c.room_number||'—')}</div></div>
      <div class="cs-card"><div class="label">Class Teacher</div><div class="value">${e(c.class_teacher_name||'—')}</div></div>
      <div class="cs-card"><div class="label">Teacher Email</div><div class="value" style="font-size:11px">${e(c.class_teacher_email||'—')}</div></div>
      <div class="cs-card"><div class="label">Created</div><div class="value">${fmtD(c.created_at)}</div></div>
      <div class="cs-card"><div class="label">Last Updated</div><div class="value">${fmtD(c.updated_at)}</div></div>
    </div>
  </section>

  ${rosterHtml}
  ${subjectsHtml}
  ${scheduleHtml}

  <div class="footer">Generated by LMS &bull; ${date} &bull; ${e(c.class_name)}</div>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=1000,height=800');
        if (!win) {
            if (typeof window.showToast === 'function') window.showToast('Allow pop-ups to export PDF', 'warning');
            return;
        }
        win.document.write(html);
        win.document.close();
        win.focus();
        if (typeof window.showToast === 'function') window.showToast('PDF ready — click Print / Save PDF in the new window', 'success');
    }

    // ─── Performance Tab ──────────────────────────────────────────────────────
    async function loadPerformance(uuid) {
        const container   = document.getElementById('performanceContainer');
        const placeholder = document.getElementById('perfPlaceholder');
        const statsStrip  = document.getElementById('perfStatsStrip');
        const chartWrap   = document.getElementById('perfChartWrap');
        if (!container) return;
        container.dataset.loaded = '1';

        // Hide everything, show spinner
        if (placeholder) placeholder.style.display = 'none';
        if (statsStrip)  statsStrip.style.display  = 'none';
        if (chartWrap)   chartWrap.style.display   = 'none';
        const spinnerId = 'perfSpinner';
        container.insertAdjacentHTML('afterbegin',
            `<div id="${spinnerId}" style="text-align:center;padding:2.5rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading…</div>`);

        try {
            const res        = await ClassAPI.getPerformance(uuid);
            const data       = res?.data || {};
            const summary    = data.summary    || {};
            const bySubject  = data.by_subject || [];

            const spinner = document.getElementById(spinnerId);
            if (spinner) spinner.remove();

            const totalResults = parseInt(summary.total_results || 0);
            if (!totalResults) {
                if (placeholder) placeholder.style.display = 'block';
                return;
            }

            // ── Stats strip ───────────────────────────────────────────────────
            setText('perfAvgScore', summary.avg_score  != null ? summary.avg_score  : '—');
            setText('perfHighest',  summary.highest_score != null ? summary.highest_score : '—');
            setText('perfLowest',   summary.lowest_score  != null ? summary.lowest_score  : '—');
            setText('perfPassRate', summary.pass_rate != null ? summary.pass_rate + '%' : '—');
            if (statsStrip) statsStrip.style.display = '';

            // ── Per-subject breakdown table ───────────────────────────────────
            if (chartWrap) {
                if (bySubject.length) {
                    chartWrap.innerHTML = `
                        <div style="margin-bottom:.75rem;font-size:.8rem;color:#64748b;">
                            Based on <strong>${summary.total_results}</strong> result record${summary.total_results != 1 ? 's' : ''}
                            across <strong>${summary.students_assessed}</strong> student${summary.students_assessed != 1 ? 's' : ''}
                            and <strong>${summary.subjects_assessed}</strong> subject${summary.subjects_assessed != 1 ? 's' : ''}.
                        </div>
                        <table style="width:100%;border-collapse:collapse;font-size:.83rem;">
                            <thead>
                                <tr style="background:#006a3f;color:#fff;">
                                    <th style="padding:8px 10px;text-align:left;">Subject</th>
                                    <th style="padding:8px 10px;text-align:center;">Avg Score</th>
                                    <th style="padding:8px 10px;text-align:center;">Highest</th>
                                    <th style="padding:8px 10px;text-align:center;">Lowest</th>
                                    <th style="padding:8px 10px;text-align:center;">Students</th>
                                    <th style="padding:8px 10px;text-align:center;">Pass Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bySubject.map((s, i) => {
                                    const pr = parseFloat(s.pass_rate);
                                    const passColor = pr >= 70 ? '#16a34a' : pr >= 50 ? '#d97706' : '#dc2626';
                                    const passBg    = pr >= 70 ? '#dcfce7' : pr >= 50 ? '#fef3c7' : '#fee2e2';
                                    return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
                                        <td style="padding:8px 10px;">
                                            <div style="font-weight:600;">${esc(s.subject_name || '—')}</div>
                                            <div style="font-size:.73rem;color:#94a3b8;">${esc(s.subject_code || '')}</div>
                                        </td>
                                        <td style="padding:8px 10px;text-align:center;font-weight:700;color:#006a3f;">${s.avg_score ?? '—'}</td>
                                        <td style="padding:8px 10px;text-align:center;">${s.highest ?? '—'}</td>
                                        <td style="padding:8px 10px;text-align:center;">${s.lowest  ?? '—'}</td>
                                        <td style="padding:8px 10px;text-align:center;">${s.student_count ?? '—'}</td>
                                        <td style="padding:8px 10px;text-align:center;">
                                            <span style="background:${passBg};color:${passColor};padding:2px 8px;border-radius:999px;font-size:.75rem;font-weight:600;">${s.pass_rate ?? '—'}%</span>
                                        </td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>`;
                }
                chartWrap.style.display = '';
            }

        } catch (err) {
            const spinner = document.getElementById(spinnerId);
            if (spinner) spinner.remove();
            container.insertAdjacentHTML('afterbegin',
                `<div style="text-align:center;color:#ef4444;padding:2rem;">Failed to load performance data.</div>`);
            console.error(err);
        }
    }

    // ─── Utilities ────────────────────────────────────────────────────────────
    function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

    function showError(msg) {
        const header = document.getElementById('cdHeader');
        if (header) header.insertAdjacentHTML('afterend',
            `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:1.5rem;color:#dc2626;margin-bottom:1rem;">
                <i class="fas fa-exclamation-circle"></i> ${esc(msg)}
            </div>`
        );
    }

})();

// ─── Global: called from classes.js btn-view ───────────────────────────────
window.classViewDetails = function (uuid) {
    try { sessionStorage.setItem('lms_class_uuid', uuid); } catch (_) {}
    window.location.hash = '#class-details';
};
