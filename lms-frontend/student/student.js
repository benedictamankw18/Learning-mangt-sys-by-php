/* ============================================
   Student Dashboard Logic
============================================ */

// Require authentication and student role
Auth.requireAuth([USER_ROLES.STUDENT]);

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupEventListeners();
    loadDashboardData();
});

/**
 * Initialize dashboard components
 */
function initDashboard() {
    // Set user info
    const user = Auth.getUser();
    if (user) {
        const userInitials = document.getElementById('userInitials');
        const userName = document.getElementById('userName');
        const studentName = document.getElementById('studentName');
        const userAvatar = document.getElementById('userAvatar');

        const displayName = Auth.getUserDisplayName();
        const initials = Auth.getUserInitials();

        if (userInitials) userInitials.textContent = initials;
        if (userName) userName.textContent = displayName;
        if (studentName) studentName.textContent = displayName;
        if (userAvatar) userAvatar.style.background = Auth.getUserAvatar();
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            handleNavigation(item);
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Logout buttons
    const logoutBtn = document.getElementById('logoutBtn');
    const userLogoutBtn = document.getElementById('userLogoutBtn');

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (userLogoutBtn) userLogoutBtn.addEventListener('click', handleLogout);

    // Dropdowns
    const notificationBtn = document.getElementById('notificationBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');

    if (notificationBtn) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(notificationBtn.closest('.dropdown'));
        });
    }

    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(userProfileBtn.closest('.dropdown'));
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });

    // Prevent dropdown close when clicking inside
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.addEventListener('click', (e) => e.stopPropagation());
    });
}

/**
 * Handle navigation between pages
 */
function handleNavigation(navItem) {
    const page = navItem.dataset.page;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    navItem.classList.add('active');

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const title = navItem.querySelector('span').textContent;
        pageTitle.textContent = title;
    }

    // Show corresponding content section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(`${page}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Close mobile menu
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove('active');
    }
}

/**
 * Toggle dropdown menu
 */
function toggleDropdown(dropdown) {
    const isActive = dropdown.classList.contains('active');
    
    // Close all dropdowns
    document.querySelectorAll('.dropdown.active').forEach(d => {
        d.classList.remove('active');
    });

    // Toggle current dropdown
    if (!isActive) {
        dropdown.classList.add('active');
    }
}

/**
 * Handle logout
 */
async function handleLogout(e) {
    e.preventDefault();

    try {
        await Auth.logout();
    } catch (error) {
        console.error('Logout error:', error);
        // Auth.logout() handles the redirect
    }
}

/**
 * Load dashboard data from API
 */
async function loadDashboardData() {
    try {
        const response = await DashboardAPI.getStudentStats();

        if (response && response.data) {
            updateStatistics(response.data);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Update statistics cards
 */
function updateStatistics(data) {
    const enrolledCourses = document.getElementById('enrolledCourses');
    const pendingAssignments = document.getElementById('pendingAssignments');
    const averageGrade = document.getElementById('averageGrade');
    const attendanceRate = document.getElementById('attendanceRate');

    if (enrolledCourses && data.enrolled_courses) {
        animateNumber(enrolledCourses, data.enrolled_courses);
    }
    if (pendingAssignments && data.pending_assignments) {
        animateNumber(pendingAssignments, data.pending_assignments);
    }
    if (averageGrade && data.average_grade) {
        animateNumber(averageGrade, data.average_grade, 1000, 1);
    }
    if (attendanceRate && data.attendance_rate) {
        const rate = Math.round(data.attendance_rate);
        animateNumber(attendanceRate, rate, 1000, 0, '%');
    }
}

/**
 * Animate number counting up
 */
function animateNumber(element, target, duration = 1000, decimals = 0, suffix = '') {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toFixed(decimals) + suffix;
            clearInterval(timer);
        } else {
            element.textContent = current.toFixed(decimals) + suffix;
        }
    }, 16);
}

/**
 * Refresh dashboard data
 */
function refreshDashboard() {
    loadDashboardData();
}

// Auto-refresh every 5 minutes
setInterval(refreshDashboard, 5 * 60 * 1000);
