(function () {
    'use strict';

    const S = {
        children: [],
        selectedChildId: null,
    };

    function getPageRoot() {
        return document.querySelector('.my-children-page');
    }

    function getEl(id) {
        const root = getPageRoot();
        if (root) {
            const scoped = root.querySelector(`#${id}`);
            if (scoped) return scoped;
        }
        return document.getElementById(id);
    }

    async function init() {
        if (!document.querySelector('.my-children-page')) {
            return;
        }

        if (!Auth.requireAuth([USER_ROLES.PARENT])) {
            return;
        }

        bindEvents();
        await loadChildrenData();
    }

    function bindEvents() {
        const selector = getEl('childSelector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                S.selectedChildId = e.target.value || null;
                renderPage();
            });
        }
    }

    async function loadChildrenData() {
        Components.showLoader('Loading children...');

        try {
            const response = await DashboardAPI.getParentStats();
            const payload = response && response.data ? response.data : {};
            S.children = Array.isArray(payload.children_data) ? payload.children_data : [];

            if (S.children.length > 0) {
                S.selectedChildId = String(S.children[0].student_id || '');
            }

            renderPage();
        } catch (error) {
            console.error('Failed to load parent children data:', error);
            renderError('Unable to load children data right now. Please refresh this page.');
        } finally {
            Components.hideLoader();
        }
    }

    function renderPage() {
        renderStats();
        renderSelector();
        renderChildrenCards();
        renderSelectedChildPanels();
    }

    function renderStats() {
        const totalChildren = S.children.length;
        const classCount = S.children.reduce((sum, child) => sum + (Number(child.enrolled_courses) > 0 ? 1 : 0), 0);
        const avgAttendance = totalChildren
            ? Math.round(S.children.reduce((sum, child) => sum + Number(child.attendance_rate || 0), 0) / totalChildren)
            : 0;

        const overallScore = getOverallScore(S.children);
        const standing = standingFromScore(overallScore).label;

        setText('totalLinkedChildren', String(totalChildren));
        setText('activeClasses', String(classCount));
        setText('overallAttendance', avgAttendance + '%');
        setText('overallStanding', standing);
    }

    function renderSelector() {
        const selector = getEl('childSelector');
        if (!selector) return;

        selector.innerHTML = '<option value="">Select child</option>';

        S.children.forEach((child) => {
            const id = String(child.student_id || '');
            const option = document.createElement('option');
            option.value = id;
            option.textContent = getChildName(child);

            if (id === String(S.selectedChildId || '')) {
                option.selected = true;
            }

            selector.appendChild(option);
        });
    }

    function renderChildrenCards() {
        const container = getEl('childrenCards');
        if (!container) return;

        if (!S.children.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-child"></i><p>No linked children found.</p></div>';
            return;
        }

        container.innerHTML = S.children.map((child) => {
            const id = String(child.student_id || '');
            const name = escapeHtml(getChildName(child));
            const initials = escapeHtml(getInitials(name));
            const relationship = escapeHtml(child.relationship || 'Child');
            const attendance = Math.round(Number(child.attendance_rate || 0));
            const courses = Number(child.enrolled_courses || 0);
            const standing = standingFromScore(getChildScore(child));
            const active = id === String(S.selectedChildId || '') ? ' active' : '';

            return `
                <button class="child-item child-item-button${active}" type="button" data-child-id="${id}">
                    <div class="child-avatar"><span>${initials}</span></div>
                    <div class="child-info">
                        <h4>${name}</h4>
                        <p>${relationship}</p>
                    </div>
                    <div class="child-stats">
                        <div class="stat-badge">
                            <span class="label">Attendance</span>
                            <span class="value">${attendance}%</span>
                        </div>
                        <div class="stat-badge ${standing.className}">
                            <span class="label">Standing</span>
                            <span class="value">${standing.short}</span>
                        </div>
                        <div class="stat-badge">
                            <span class="label">Courses</span>
                            <span class="value">${courses}</span>
                        </div>
                    </div>
                </button>
            `;
        }).join('');

        container.querySelectorAll('[data-child-id]').forEach((button) => {
            button.addEventListener('click', () => {
                const selected = button.getAttribute('data-child-id');
                S.selectedChildId = selected;

                const selector = getEl('childSelector');
                if (selector) selector.value = selected;

                renderPage();
            });
        });
    }

    function renderSelectedChildPanels() {
        const child = getSelectedChild();

        if (!child) {
            renderNoSelection();
            return;
        }

        const attendance = Math.round(Number(child.attendance_rate || 0));
        const score = getChildScore(child);
        const standing = standingFromScore(score);

        const profileOverview = getEl('profileOverview');
        if (profileOverview) {
            profileOverview.innerHTML = `
                <div class="overview-head">
                    <div class="overview-avatar">${escapeHtml(getInitials(getChildName(child)))}</div>
                    <div>
                        <h4>${escapeHtml(getChildName(child))}</h4>
                        <p>${escapeHtml(child.relationship || 'Child')}</p>
                    </div>
                </div>
                <div class="overview-grid">
                    <div class="overview-item">
                        <span class="label">Academic Standing</span>
                        <span class="value ${standing.className}">${standing.label}</span>
                    </div>
                    <div class="overview-item">
                        <span class="label">Attendance</span>
                        <span class="value">${attendance}%</span>
                    </div>
                    <div class="overview-item">
                        <span class="label">Enrolled Courses</span>
                        <span class="value">${Number(child.enrolled_courses || 0)}</span>
                    </div>
                    <div class="overview-item">
                        <span class="label">Upcoming Assessments</span>
                        <span class="value">${Number(child.upcoming_assessments || 0)}</span>
                    </div>
                </div>
            `;
        }

        const classProgramOverview = getEl('classProgramOverview');
        if (classProgramOverview) {
            classProgramOverview.innerHTML = `
                <div class="meta-item">
                    <span class="meta-label">Current Class</span>
                    <strong>${escapeHtml(child.class_name || child.current_class || 'Not assigned')}</strong>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Program</span>
                    <strong>${escapeHtml(child.program_name || child.program || 'Not assigned')}</strong>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Score Basis</span>
                    <strong>${score > 0 ? score + '%' : 'No score data yet'}</strong>
                </div>
            `;
        }

        const quickLinks = getEl('quickLinks');
        if (quickLinks) {
            const childId = String(child.student_id || '');
            quickLinks.innerHTML = `
                <a class="quick-link" href="#grades" data-page="grades" data-child-id="${encodeURIComponent(childId)}">
                    <i class="fas fa-star"></i>
                    <div>
                        <span>View Grades</span>
                        <small>Open score breakdown</small>
                    </div>
                </a>
                <a class="quick-link" href="#attendance" data-page="attendance" data-child-id="${encodeURIComponent(childId)}">
                    <i class="fas fa-calendar-check"></i>
                    <div>
                        <span>View Attendance</span>
                        <small>Track class presence</small>
                    </div>
                </a>
                <a class="quick-link" href="#performance" data-page="performance" data-child-id="${encodeURIComponent(childId)}">
                    <i class="fas fa-chart-line"></i>
                    <div>
                        <span>Academic Performance</span>
                        <small>Review trend and standing</small>
                    </div>
                </a>
            `;

            quickLinks.querySelectorAll('.quick-link[data-page]').forEach((link) => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();

                    const selectedChild = link.getAttribute('data-child-id');
                    if (selectedChild) {
                        sessionStorage.setItem('parent:selectedChildId', selectedChild);
                    }

                    const targetPage = link.getAttribute('data-page');
                    if (targetPage) {
                        window.location.hash = `#${targetPage}`;
                    }
                });
            });
        }
    }

    function renderNoSelection() {
        setHtml('profileOverview', '<div class="empty-state"><i class="fas fa-user-graduate"></i><p>Select a child to view profile details.</p></div>');
        setHtml('classProgramOverview', '<div class="empty-state"><i class="fas fa-school"></i><p>Current class and program will appear here.</p></div>');
        setHtml('quickLinks', '<div class="empty-state"><i class="fas fa-link"></i><p>Quick links will appear after selecting a child.</p></div>');
    }

    function renderError(message) {
        setHtml('childrenCards', '<div class="empty-state"><i class="fas fa-triangle-exclamation"></i><p>' + escapeHtml(message) + '</p></div>');
        renderNoSelection();
    }

    function getSelectedChild() {
        if (!S.selectedChildId) return null;
        return S.children.find((child) => String(child.student_id || '') === String(S.selectedChildId)) || null;
    }

    function getChildName(child) {
        const fullName = child.full_name || [child.first_name, child.last_name].filter(Boolean).join(' ');
        return fullName || 'Unknown Child';
    }

    function getInitials(name) {
        return String(name || 'U')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join('') || 'U';
    }

    function getChildScore(child) {
        if (child.current_average != null) return Math.round(Number(child.current_average));
        if (child.average_score != null) return Math.round(Number(child.average_score));

        if (child.grade_trend && Array.isArray(child.grade_trend.data) && child.grade_trend.data.length > 0) {
            const total = child.grade_trend.data.reduce((sum, value) => sum + Number(value || 0), 0);
            return Math.round(total / child.grade_trend.data.length);
        }

        return 0;
    }

    function getOverallScore(children) {
        if (!children.length) return 0;
        const scores = children.map(getChildScore).filter((value) => value > 0);
        if (!scores.length) return 0;
        const total = scores.reduce((sum, value) => sum + value, 0);
        return Math.round(total / scores.length);
    }

    function standingFromScore(score) {
        if (score >= 80) return { label: 'Excellent', short: 'A', className: 'grade-a' };
        if (score >= 70) return { label: 'Very Good', short: 'B+', className: 'grade-b' };
        if (score >= 55) return { label: 'Good', short: 'B', className: 'grade-c' };
        if (score > 0) return { label: 'Needs Support', short: 'C', className: 'grade-c' };
        return { label: 'No Records', short: '-', className: '' };
    }

    function setText(id, text) {
        const el = getEl(id);
        if (el) el.textContent = text;
    }

    function setHtml(id, html) {
        const el = getEl(id);
        if (el) el.innerHTML = html;
    }

    function escapeHtml(text) {
        return String(text ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    document.addEventListener('page:loaded', (event) => {
        if (event.detail && event.detail.page === 'my-children') {
            init();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.querySelector('.my-children-page')) init();
        });
    } else if (document.querySelector('.my-children-page')) {
        init();
    }
})();
