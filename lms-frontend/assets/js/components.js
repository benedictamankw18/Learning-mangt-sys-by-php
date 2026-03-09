/* ============================================
   Reusable UI Components
   Sidebar, Header, Breadcrumb, Data Table, Loader
   
   Usage per component:
     renderSidebar('sidebar-placeholder', 'admin', 'students')
     renderHeader('header-placeholder', { pageTitle: 'Students', role: 'Administrator', ... })
     renderBreadcrumb('breadcrumb-placeholder', [{label:'Dashboard',href:'dashboard.html'},{label:'Students'}])
     Components.getDataTableHTML('myTable', columns) + Components.initDataTable('myTable', options)
     Components.showLoader() / Components.hideLoader()
============================================ */

/* ============================================
   Role-based Navigation Configs
============================================ */

const NAV_CONFIGS = {
    admin: {
        title: 'Admin Panel',
        icon: 'fas fa-graduation-cap',
        roleLabel: 'Administrator',
        items: [
            { key: 'dashboard',     label: 'Dashboard',     icon: 'fas fa-th-large',           href: 'dashboard.html' },
            { key: 'students',      label: 'Students',      icon: 'fas fa-user-graduate',       href: 'students.html' },
            { key: 'teachers',      label: 'Teachers',      icon: 'fas fa-chalkboard-teacher',  href: 'teachers.html' },
            { key: 'classes',       label: 'Classes',       icon: 'fas fa-chalkboard',          href: 'classes.html' },
            { key: 'programs',      label: 'Programs',      icon: 'fas fa-graduation-cap',      href: 'programs.html' },
            { key: 'subjects',      label: 'Subjects',      icon: 'fas fa-book',                href: 'subjects.html' },
            { key: 'attendance',    label: 'Attendance',    icon: 'fas fa-calendar-check',      href: 'attendance.html' },
            { key: 'grades',        label: 'Grades',        icon: 'fas fa-chart-line',          href: 'grades.html' },
            { key: 'timetable',     label: 'Timetable',     icon: 'fas fa-calendar-alt',        href: 'timetable.html' },
            { key: 'assignments',   label: 'Assignments',   icon: 'fas fa-tasks',               href: 'assignments.html' },
            { key: 'assessments',   label: 'Assessments',   icon: 'fas fa-clipboard-list',      href: 'assessments.html' },
            { key: 'reports',       label: 'Reports',       icon: 'fas fa-file-alt',            href: 'reports.html' },
            { key: 'messages',      label: 'Messages',      icon: 'fas fa-envelope',            href: 'messages.html' },
            { key: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn',            href: 'announcements.html' },
            { key: 'events',        label: 'Events',        icon: 'fas fa-calendar-week',       href: 'events.html' },
            { key: 'parents',       label: 'Parents',       icon: 'fas fa-user-friends',        href: 'parents.html' },
            { key: 'users',         label: 'Users',         icon: 'fas fa-users-cog',           href: 'users.html' },
            { key: 'settings',      label: 'Settings',      icon: 'fas fa-cog',                 href: 'settings.html' },
        ]
    },
    teacher: {
        title: 'Teacher Portal',
        icon: 'fas fa-chalkboard-teacher',
        roleLabel: 'Teacher',
        items: [
            { key: 'dashboard',        label: 'Dashboard',        icon: 'fas fa-th-large',        href: 'dashboard.html' },
            { key: 'my-classes',       label: 'My Classes',       icon: 'fas fa-chalkboard',      href: 'my-classes.html' },
            { key: 'my-subjects',      label: 'My Subjects',      icon: 'fas fa-book-open',       href: 'my-subjects.html' },
            { key: 'assignments',      label: 'Assignments',      icon: 'fas fa-tasks',           href: 'assignments.html' },
            { key: 'grades',           label: 'Grades',           icon: 'fas fa-clipboard-check', href: 'grades.html' },
            { key: 'attendance',       label: 'Attendance',       icon: 'fas fa-user-check',      href: 'attendance.html' },
            { key: 'timetable',        label: 'Timetable',        icon: 'fas fa-calendar-alt',    href: 'timetable.html' },
            { key: 'course-materials', label: 'Course Materials', icon: 'fas fa-folder-open',     href: 'course-materials.html' },
            { key: 'assessments',      label: 'Assessments',      icon: 'fas fa-clipboard-list',  href: 'assessments.html' },
            { key: 'quizzes',          label: 'Quizzes',          icon: 'fas fa-question-circle', href: 'quizzes.html' },
            { key: 'reports',          label: 'Reports',          icon: 'fas fa-file-alt',        href: 'reports.html' },
            { key: 'messages',         label: 'Messages',         icon: 'fas fa-envelope',        href: 'messages.html' },
            { key: 'announcements',    label: 'Announcements',    icon: 'fas fa-bullhorn',        href: 'announcements.html' },
            { key: 'analytics',        label: 'Analytics',        icon: 'fas fa-chart-bar',       href: 'analytics.html' },
            { key: 'myprofile',        label: 'My Profile',       icon: 'fas fa-user',            href: 'myprofile.html' },
        ]
    },
    student: {
        title: 'Student Portal',
        icon: 'fas fa-user-graduate',
        roleLabel: 'Student',
        items: [
            { key: 'dashboard',        label: 'Dashboard',        icon: 'fas fa-th-large',        href: 'dashboard.html' },
            { key: 'my-classes',       label: 'My Classes',       icon: 'fas fa-chalkboard',      href: 'my-classes.html' },
            { key: 'my-subjects',      label: 'My Subjects',      icon: 'fas fa-book',            href: 'my-subjects.html' },
            { key: 'assignments',      label: 'Assignments',      icon: 'fas fa-tasks',           href: 'assignments.html' },
            { key: 'grades',           label: 'Grades',           icon: 'fas fa-chart-bar',       href: 'grades.html' },
            { key: 'attendance',       label: 'Attendance',       icon: 'fas fa-calendar-check',  href: 'attendance.html' },
            { key: 'timetable',        label: 'Timetable',        icon: 'fas fa-calendar-alt',    href: 'timetable.html' },
            { key: 'course-materials', label: 'Course Materials', icon: 'fas fa-folder-open',     href: 'course-materials.html' },
            { key: 'assessments',      label: 'Assessments',      icon: 'fas fa-clipboard-list',  href: 'assessments.html' },
            { key: 'quizzes',          label: 'Quizzes',          icon: 'fas fa-question-circle', href: 'quizzes.html' },
            { key: 'exams',            label: 'Exams',            icon: 'fas fa-file-signature',  href: 'exams.html' },
            { key: 'announcements',    label: 'Announcements',    icon: 'fas fa-bullhorn',        href: 'announcements.html' },
            { key: 'myprofile',        label: 'My Profile',       icon: 'fas fa-user',            href: 'myprofile.html' },
        ]
    },
    parent: {
        title: 'Parent Portal',
        icon: 'fas fa-users',
        roleLabel: 'Parent',
        items: [
            { key: 'dashboard',     label: 'Dashboard',     icon: 'fas fa-th-large',       href: 'dashboard.html' },
            { key: 'my-children',   label: 'My Children',   icon: 'fas fa-child',          href: 'my-children.html' },
            { key: 'performance',   label: 'Performance',   icon: 'fas fa-chart-line',     href: 'performance.html' },
            { key: 'assignments',   label: 'Assignments',   icon: 'fas fa-tasks',          href: 'assignments.html' },
            { key: 'attendance',    label: 'Attendance',    icon: 'fas fa-calendar-check', href: 'attendance.html' },
            { key: 'timetable',     label: 'Timetable',     icon: 'fas fa-calendar-alt',   href: 'timetable.html' },
            { key: 'messages',      label: 'Messages',      icon: 'fas fa-envelope',       href: 'messages.html' },
            { key: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn',       href: 'announcements.html' },
            { key: 'events',        label: 'Events',        icon: 'fas fa-calendar-week',  href: 'events.html' },
            { key: 'myprofile',     label: 'My Profile',    icon: 'fas fa-user',           href: 'myprofile.html' },
        ]
    },
    superadmin: {
        title: 'Super Admin',
        icon: 'fas fa-shield-alt',
        roleLabel: 'Super Administrator',
        items: [
            { key: 'dashboard',                label: 'Dashboard',        icon: 'fas fa-th-large',       href: 'dashboard.html' },
            { key: 'institutions',             label: 'Institutions',     icon: 'fas fa-building',       href: 'institutions.html' },
            { key: 'users',                    label: 'Users',            icon: 'fas fa-users',          href: 'users.html' },
            { key: 'subscriptions',            label: 'Subscriptions',    icon: 'fas fa-credit-card',    href: 'subscriptions.html' },
            { key: 'reports',                  label: 'Reports',          icon: 'fas fa-file-alt',       href: 'reports.html' },
            { key: 'activity-logs',            label: 'Activity Logs',    icon: 'fas fa-clipboard-list', href: 'activity-logs.html' },
            { key: 'api-management',           label: 'API Management',   icon: 'fas fa-key',            href: 'api-management.html' },
            { key: 'platform-announcements',   label: 'Announcements',    icon: 'fas fa-bullhorn',       href: 'platform-announcements.html' },
            { key: 'settings',                 label: 'Settings',         icon: 'fas fa-cog',            href: 'settings.html' },
        ]
    }
};

/* ============================================
   Sidebar Component
============================================ */

/**
 * Render the navigation sidebar, replacing a placeholder element.
 *
 * HTML usage:
 *   <div id="sidebar-placeholder"></div>
 *
 * JS usage:
 *   Components.renderSidebar('sidebar-placeholder', 'admin', 'students');
 *
 * @param {string} placeholderId  ID of the placeholder element
 * @param {string} role           admin | teacher | student | parent | superadmin
 * @param {string} activeKey      Nav item key to mark as active (e.g. 'students')
 */
function renderSidebar(placeholderId, role, activeKey) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    const config = NAV_CONFIGS[role];
    if (!config) {
        console.warn('[Components] renderSidebar: unknown role "' + role + '"');
        return;
    }

    const navHTML = config.items.map(item => `
        <a href="${item.href}" class="nav-item${item.key === activeKey ? ' active' : ''}" data-key="${item.key}">
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
        </a>`).join('');

    const aside = document.createElement('aside');
    aside.className = 'sidebar';
    aside.id = 'sidebar';
    aside.innerHTML = `
        <div class="sidebar-header">
            <div class="logo">
                <i class="${config.icon}"></i>
                <span>${config.title}</span>
            </div>
            <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
                <i class="fas fa-bars"></i>
            </button>
        </div>
        <nav class="sidebar-nav">${navHTML}</nav>
        <div class="sidebar-footer">
            <button class="btn-logout" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </button>
        </div>`;

    placeholder.replaceWith(aside);
    _initSidebarEvents();
}

function _initSidebarEvents() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }

    // Mobile: open/close sidebar via hamburger in header
    document.addEventListener('click', (e) => {
        if (e.target.closest('#mobileMenuToggle')) {
            sidebar?.classList.toggle('active');
            return;
        }
        // Close sidebar on outside tap (mobile)
        if (sidebar?.classList.contains('active')
            && !e.target.closest('#sidebar')
            && !e.target.closest('#mobileMenuToggle')) {
            sidebar.classList.remove('active');
        }
    });

    // Wire logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (typeof Auth !== 'undefined') Auth.logout();
    });
}

/* ============================================
   Header Component
============================================ */

/**
 * Render the top navbar header, replacing a placeholder element.
 *
 * HTML usage:
 *   <div id="header-placeholder"></div>
 *
 * JS usage:
 *   Components.renderHeader('header-placeholder', {
 *       pageTitle:    'Students',
 *       role:         'Administrator',
 *       profileHref:  'myprofile.html',
 *       settingsHref: 'settings.html',
 *       showSearch:   true
 *   });
 *
 * After rendering, call Components.populateHeaderUser() to fill in live user data.
 *
 * @param {string} placeholderId
 * @param {Object} config
 */
function renderHeader(placeholderId, config = {}) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    const {
        pageTitle    = 'Dashboard',
        role         = '',
        profileHref  = '#',
        settingsHref = '#',
        showSearch   = true
    } = config;

    const searchHTML = showSearch ? `
        <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search..." id="globalSearch" autocomplete="off">
        </div>` : '';

    const header = document.createElement('header');
    header.className = 'top-navbar';
    header.innerHTML = `
        <div class="navbar-left">
            <button class="btn-icon mobile-menu-toggle" id="mobileMenuToggle" aria-label="Open menu">
                <i class="fas fa-bars"></i>
            </button>
            <h1 class="page-title" id="pageTitle">${_escapeHtml(pageTitle)}</h1>
        </div>
        <div class="navbar-right">
            ${searchHTML}

            <!-- Notifications -->
            <div class="dropdown">
                <div class="navbar-item notification-container">
                    <button class="notification-bell" id="notificationBell" aria-label="Notifications">
                        <i class="fas fa-bell"></i>
                        <span class="badge badge-danger" id="notificationBadge" style="display:none;">0</span>
                    </button>
                    <div class="notification-dropdown" id="notificationDropdown" style="display:none;">
                        <div class="notification-header">
                            <h4>Notifications &amp; Messages</h4>
                            <button class="btn-text" id="markAllRead">Mark all as read</button>
                        </div>
                        <div class="notification-tabs">
                            <button class="tab-btn active" data-tab="notifications">
                                Notifications (<span id="notifCount">0</span>)
                            </button>
                            <button class="tab-btn" data-tab="messages">
                                Messages (<span id="msgCount">0</span>)
                            </button>
                        </div>
                        <div class="notification-content">
                            <div class="tab-content active" id="notificationsTab">
                                <div id="notificationsList" class="notifications-list">
                                    <p class="no-notifications">No new notifications</p>
                                </div>
                            </div>
                            <div class="tab-content" id="messagesTab">
                                <div id="messagesList" class="notifications-list">
                                    <p class="no-notifications">No new messages</p>
                                </div>
                            </div>
                        </div>
                        <div class="notification-footer">
                            <a href="#">View all notifications</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Profile -->
            <div class="dropdown">
                <button class="user-profile" id="userProfileBtn" aria-label="User menu">
                    <div class="user-avatar" id="userAvatar">
                        <span id="userInitials">U</span>
                    </div>
                    <div class="user-info">
                        <span class="user-name" id="userName">User</span>
                        <span class="user-role">${_escapeHtml(role)}</span>
                    </div>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-right" id="userMenu">
                    <a href="${profileHref}" class="dropdown-item">
                        <i class="fas fa-user"></i> My Profile
                    </a>
                    <a href="${settingsHref}" class="dropdown-item">
                        <i class="fas fa-cog"></i> Settings
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item" id="userLogoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </div>
        </div>`;

    placeholder.replaceWith(header);
    _initHeaderEvents();
    populateHeaderUser();
}

function _initHeaderEvents() {
    // User profile dropdown toggle
    const profileBtn = document.getElementById('userProfileBtn');
    const userMenu   = document.getElementById('userMenu');
    if (profileBtn && userMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('show');
        });
        document.addEventListener('click', () => userMenu.classList.remove('show'));
    }

    // Logout buttons
    ['logoutBtn', 'userLogoutBtn'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof Auth !== 'undefined') Auth.logout();
        });
    });
}

/**
 * Populate the header's user name/initials from Auth.getUser().
 * Called automatically by renderHeader(); can also be called manually.
 */
function populateHeaderUser() {
    if (typeof Auth === 'undefined') return;
    const user = Auth.getUser();
    if (!user) return;

    const nameEl     = document.getElementById('userName');
    const initialsEl = document.getElementById('userInitials');

    if (nameEl) {
        nameEl.textContent = user.name || user.username || 'User';
    }
    if (initialsEl) {
        const name = user.name || user.username || 'U';
        initialsEl.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
}

/* ============================================
   Breadcrumb Component
============================================ */

/**
 * Render a breadcrumb trail, replacing a placeholder element.
 *
 * HTML usage:
 *   <div id="breadcrumb-placeholder"></div>
 *
 * JS usage:
 *   Components.renderBreadcrumb('breadcrumb-placeholder', [
 *       { label: 'Dashboard', href: 'dashboard.html' },
 *       { label: 'Students',  href: 'students.html'  },
 *       { label: 'Add Student' }   // last item — no href, shown as current
 *   ]);
 *
 * @param {string} placeholderId
 * @param {Array<{label: string, href?: string}>} items
 */
function renderBreadcrumb(placeholderId, items = []) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    if (items.length === 0) {
        placeholder.style.display = 'none';
        return;
    }

    const itemsHTML = items.map((item, i) => {
        const isLast  = i === items.length - 1;
        const label   = _escapeHtml(item.label);
        if (isLast || !item.href) {
            return `<li class="breadcrumb-item active" aria-current="page">${label}</li>`;
        }
        return `<li class="breadcrumb-item"><a href="${item.href}">${label}</a></li>`;
    }).join('');

    const nav = document.createElement('nav');
    nav.className = 'breadcrumb-nav';
    nav.setAttribute('aria-label', 'breadcrumb');
    nav.innerHTML = `<ol class="breadcrumb">${itemsHTML}</ol>`;

    placeholder.replaceWith(nav);
}

/* ============================================
   Data Table Component
============================================ */

/**
 * Generate the HTML wrapper for a standard data table.
 * Inject the returned string into the page, then call Components.initDataTable().
 *
 * Usage:
 *   container.innerHTML = Components.getDataTableHTML('studentsTable', [
 *       { title: 'Name' },
 *       { title: 'Email' },
 *       { title: 'Class' },
 *       { title: 'Actions', orderable: false }
 *   ], {
 *       actions: [{ label: 'Add Student', id: 'addBtn', icon: 'fa-plus', cls: 'btn-primary' }]
 *   });
 *
 *   Components.initDataTable('studentsTable', {
 *       columns: [
 *           { data: 'name' },
 *           { data: 'email' },
 *           { data: 'class_name' },
 *           { data: null, orderable: false, render: (_, row) => `<button>Edit</button>` }
 *       ],
 *       data: [...],          // array of row objects (client-side)
 *       // OR ajaxUrl: '/api/students'  (server-side)
 *   });
 *
 * @param {string} tableId
 * @param {Array<{title: string}>} columns  - thead column titles
 * @param {Object} opts
 * @param {Array}  opts.actions  - Action buttons for the toolbar
 * @returns {string} HTML string
 */
function getDataTableHTML(tableId, columns = [], opts = {}) {
    const { actions = [] } = opts;

    const thHTML = columns.map(col =>
        `<th>${_escapeHtml(col.title || '')}</th>`
    ).join('');

    const actionBtnsHTML = actions.map(a =>
        `<button class="btn btn-sm ${_escapeHtml(a.cls || 'btn-primary')}" id="${_escapeHtml(a.id || '')}">
            ${a.icon ? `<i class="fas ${_escapeHtml(a.icon)}"></i>` : ''}
            ${_escapeHtml(a.label || '')}
        </button>`
    ).join('');

    return `
        <div class="data-table-wrapper">
            <div class="data-table-toolbar">
                <div class="data-table-search">
                    <i class="fas fa-search"></i>
                    <input type="text" class="dt-search-input" id="${tableId}-search"
                           placeholder="Search..." autocomplete="off">
                </div>
                <div class="data-table-actions">${actionBtnsHTML}</div>
            </div>
            <div class="table-responsive">
                <table id="${tableId}" class="data-table">
                    <thead><tr>${thHTML}</tr></thead>
                    <tbody></tbody>
                </table>
            </div>
            <div class="data-table-footer">
                <div class="dt-info" id="${tableId}-info">No entries</div>
                <div class="dt-pagination" id="${tableId}-pagination"></div>
            </div>
        </div>`;
}

/**
 * Initialize a data table.
 * Uses jQuery DataTables if available, otherwise falls back to a built-in
 * lightweight table with client-side search, sort, and pagination.
 *
 * @param {string} tableId
 * @param {Object} options
 * @param {Array}   options.columns    - Column definitions (DataTables format)
 * @param {Array}   options.data       - Row data array (client-side mode)
 * @param {string}  options.ajaxUrl    - API URL (server-side mode, requires jQuery DataTables)
 * @param {number}  options.pageLength - Rows per page (default: 10)
 * @param {boolean} options.responsive - Responsive mode (default: true)
 * @param {boolean} options.ordering   - Enable column sorting (default: true)
 * @returns DataTable instance or built-in table API
 */
function initDataTable(tableId, options = {}) {
    const table = document.getElementById(tableId);
    if (!table) return null;

    // jQuery DataTables
    if (typeof $ !== 'undefined' && $.fn && $.fn.DataTable) {
        const dtOpts = {
            pageLength:  options.pageLength  || 10,
            responsive:  options.responsive  !== false,
            searching:   options.searching   !== false,
            ordering:    options.ordering    !== false,
            dom: 'tip',   // omit default search box; we use our own toolbar input
            language: {
                emptyTable:     'No data available',
                zeroRecords:    'No matching records found',
                info:           'Showing _START_ to _END_ of _TOTAL_ entries',
                infoEmpty:      'No entries',
                infoFiltered:   '(filtered from _MAX_ total)',
                paginate: { first: '«', last: '»', next: '›', previous: '‹' }
            }
        };

        if (options.columns)    dtOpts.columns    = options.columns;
        if (options.data)       dtOpts.data       = options.data;
        if (options.order)      dtOpts.order      = options.order;
        if (options.columnDefs) dtOpts.columnDefs = options.columnDefs;
        if (options.ajaxUrl)    dtOpts.ajax       = { url: options.ajaxUrl, type: 'GET' };

        const dt = $(`#${tableId}`).DataTable(dtOpts);

        // Wire our custom search input to the DataTable
        const searchInput = document.getElementById(`${tableId}-search`);
        if (searchInput) {
            searchInput.addEventListener('input', () => dt.search(searchInput.value).draw());
        }

        return dt;
    }

    // Built-in lightweight fallback (no external dependency required)
    return _initBuiltinTable(tableId, options);
}

/**
 * Lightweight built-in table: client-side search, sort, pagination.
 * No jQuery or DataTables needed.
 */
function _initBuiltinTable(tableId, options = {}) {
    const table = document.getElementById(tableId);
    if (!table) return null;

    const pageLength = options.pageLength || 10;
    const columns    = options.columns || [];
    let rows         = (options.data || []).slice();
    let currentPage  = 1;
    let sortCol      = null;
    let sortDir      = 'asc';
    let filterText   = '';

    // Make header cells sortable
    const ths = table.querySelectorAll('thead th');
    ths.forEach((th, i) => {
        const col = columns[i];
        if (!col || col.orderable === false || !col.data) return;
        th.classList.add('dt-sortable');
        th.setAttribute('title', 'Click to sort');
    });

    function getFiltered() {
        if (!filterText) return rows;
        const q = filterText.toLowerCase();
        return rows.filter(row =>
            columns.some(col => col.data && String(row[col.data] ?? '').toLowerCase().includes(q))
        );
    }

    function render() {
        const filtered   = getFiltered();
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageLength));
        currentPage      = Math.min(currentPage, totalPages);
        const start      = (currentPage - 1) * pageLength;
        const pageRows   = filtered.slice(start, start + pageLength);

        // Update sort indicators
        ths.forEach((th, i) => {
            th.classList.remove('dt-sort-asc', 'dt-sort-desc');
            const col = columns[i];
            if (col?.data && col.data === sortCol) {
                th.classList.add(sortDir === 'asc' ? 'dt-sort-asc' : 'dt-sort-desc');
            }
        });

        // Render rows
        const tbody = table.querySelector('tbody');
        if (tbody) {
            if (pageRows.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${columns.length}" class="dt-empty">No data available</td></tr>`;
            } else {
                tbody.innerHTML = pageRows.map(row =>
                    `<tr>${columns.map(col => {
                        const val = col.data ? (row[col.data] ?? '') : null;
                        const cell = col.render ? col.render(val, row) : _escapeHtml(String(val));
                        return `<td>${cell}</td>`;
                    }).join('')}</tr>`
                ).join('');
            }
        }

        // Info
        const infoEl = document.getElementById(`${tableId}-info`);
        if (infoEl) {
            const end = Math.min(start + pageLength, filtered.length);
            infoEl.textContent = filtered.length === 0
                ? 'No entries'
                : `Showing ${start + 1} to ${end} of ${filtered.length} entries`;
        }

        // Pagination
        _renderPagination(tableId, currentPage, totalPages, (p) => { currentPage = p; render(); });
    }

    // Sort on header click
    table.querySelector('thead')?.addEventListener('click', (e) => {
        const th = e.target.closest('th');
        if (!th) return;
        const idx = Array.from(th.parentElement.children).indexOf(th);
        const col = columns[idx];
        if (!col || col.orderable === false || !col.data) return;

        sortDir = (sortCol === col.data && sortDir === 'asc') ? 'desc' : 'asc';
        sortCol = col.data;

        rows = [...rows].sort((a, b) => {
            const va = String(a[sortCol] ?? '');
            const vb = String(b[sortCol] ?? '');
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });
        render();
    });

    // Search
    const searchInput = document.getElementById(`${tableId}-search`);
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterText  = searchInput.value.trim();
            currentPage = 1;
            render();
        });
    }

    render();

    return {
        setData(newData) { rows = newData.slice(); currentPage = 1; render(); },
        addRow(row)      { rows.push(row); render(); },
        removeRow(pred)  { rows = rows.filter(r => !pred(r)); render(); },
        refresh()        { render(); }
    };
}

function _renderPagination(tableId, currentPage, totalPages, onPage) {
    const container = document.getElementById(`${tableId}-pagination`);
    if (!container) return;

    const btns = [];
    btns.push(`<button class="dt-page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>&#8249;</button>`);

    for (let p = 1; p <= totalPages; p++) {
        if (totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
            btns.push(`<button class="dt-page-btn${p === currentPage ? ' active' : ''}" data-page="${p}">${p}</button>`);
        } else if (Math.abs(p - currentPage) === 2) {
            btns.push(`<span class="dt-ellipsis">&hellip;</span>`);
        }
    }

    btns.push(`<button class="dt-page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>&#8250;</button>`);

    container.innerHTML = btns.join('');
    container.querySelectorAll('.dt-page-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => onPage(Number(btn.dataset.page)));
    });
}

/* ============================================
   Loading Spinner Component
============================================ */

/**
 * Show a full-page loading overlay.
 * The #pageLoader element is created automatically on first use.
 *
 * Usage:
 *   Components.showLoader();
 *   // ... async work
 *   Components.hideLoader();
 */
function showLoader(text) {
    let loader = document.getElementById('pageLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'pageLoader';
        loader.className = 'page-loader';
        loader.innerHTML = `
            <div class="page-loader-inner">
                <div class="spinner"></div>
                <p class="loader-text" id="loaderText">Loading...</p>
            </div>`;
        document.body.appendChild(loader);
    }
    if (text) {
        const loaderText = loader.querySelector('#loaderText');
        if (loaderText) loaderText.textContent = text;
    }
    loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.style.display = 'none';
}

/* ============================================
   Internal Helpers
============================================ */

function _escapeHtml(text) {
    if (typeof text !== 'string') text = String(text ?? '');
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, c => map[c]);
}

/* ============================================
   Public API
============================================ */

const Components = {
    navConfigs:       NAV_CONFIGS,

    // Sidebar
    renderSidebar,

    // Header
    renderHeader,
    populateHeaderUser,

    // Breadcrumb
    renderBreadcrumb,

    // Data Table
    getDataTableHTML,
    initDataTable,

    // Loader
    showLoader,
    hideLoader,
};
