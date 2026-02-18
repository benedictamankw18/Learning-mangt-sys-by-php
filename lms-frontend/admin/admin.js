/* ============================================
   Admin Dashboard Logic
============================================ */

// Require authentication and admin role
Auth.requireAuth([USER_ROLES.ADMIN]);

// Global charts
let enrollmentChart = null;
let courseDistributionChart = null;

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
        const userAvatar = document.getElementById('userAvatar');

        if (userInitials) {
            userInitials.textContent = Auth.getUserInitials();
        }
        if (userName) {
            userName.textContent = Auth.getUserDisplayName();
        }
        if (userAvatar) {
            userAvatar.style.background = Auth.getUserAvatar();
        }
    }

    // Initialize charts
    initCharts();
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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', handleLogout);
    }

    // Dropdowns
    const notifications = document.getElementById('notificationBtn');
    const userProfile = document.getElementById('userProfileBtn');
    const courseDistribution = document.getElementById('courseDistributionMenuBtn');
    const enrollmentChart = document.getElementById('enrollmentChartMenuBtn');

    if (notifications) {
        notifications.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(notifications.closest('.dropdown'));
        });
    }

    if (userProfile) {
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(userProfile.closest('.dropdown'));
        });
    }

     if (courseDistribution) {
        courseDistribution.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(courseDistribution.closest('.dropdown'));
        });
    }

     if (enrollmentChart) {
        enrollmentChart.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(enrollmentChart.closest('.dropdown'));
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
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
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
        pageTitle.textContent = navItem.querySelector('span').textContent;
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
    showModal(
        'Confirm Logout',
        'Are you sure you want to logout?',
        async () => {
            try {
                await Auth.logout();
            } catch (error) {
                console.error('Logout error:', error);
                showToast('Logout failed. Please try again.', 'error');
            }
        }
    );
}

/**
 * Load dashboard data from API
 */
async function loadDashboardData() {
    try {
        const response = await DashboardAPI.getAdminStats();

        if (response && response.data) {
            updateStatistics(response.data);
            updateCharts(response.data);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Update statistics cards
 */
function updateStatistics(data) {
    const totalUsers = document.getElementById('totalUsers');
    const totalCourses = document.getElementById('totalCourses');
    const totalStudents = document.getElementById('totalStudents');
    const totalTeachers = document.getElementById('totalTeachers');

    if (totalUsers && data.total_users) {
        animateNumber(totalUsers, data.total_users);
    }
    if (totalCourses && data.total_courses) {
        animateNumber(totalCourses, data.total_courses);
    }
    if (totalStudents && data.total_students) {
        animateNumber(totalStudents, data.total_students);
    }
    if (totalTeachers && data.total_teachers) {
        animateNumber(totalTeachers, data.total_teachers);
    }
}

/**
 * Animate number counting up
 */
function animateNumber(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16); // 60 FPS
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

/**
 * Initialize charts
 */
function initCharts() {
    // Enrollment Chart
    const enrollmentCtx = document.getElementById('enrollmentChart');
    if (enrollmentCtx) {
        enrollmentChart = new Chart(enrollmentCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Enrollments',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#006a3f',
                    backgroundColor: 'rgba(0, 106, 63, 0.1)',
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    }
                }
            }
        });
    }

    // Course Distribution Chart
    const distributionCtx = document.getElementById('courseDistributionChart');
    if (distributionCtx) {
        courseDistributionChart = new Chart(distributionCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#006a3f',
                        '#008c54',
                        '#d4af37',
                        '#10b981',
                        '#3090cf',
                    ],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }
}

/**
 * Update charts with data
 */
function updateCharts(data) {
    // Update enrollment chart
    if (enrollmentChart && data.enrollment_trend) {
        enrollmentChart.data.datasets[0].data = data.enrollment_trend;
        enrollmentChart.update();
    }

    // Update course distribution chart
    if (courseDistributionChart && data.course_distribution) {
        courseDistributionChart.data.labels = data.course_distribution.labels || [];
        courseDistributionChart.data.datasets[0].data = data.course_distribution.data || [];
        courseDistributionChart.update();
    }
}

/**
 * Refresh dashboard data
 */
function refreshDashboard() {
    loadDashboardData();
}

// Auto-refresh every 5 minutes
setInterval(refreshDashboard, 5 * 60 * 1000);

    // Chart actions dropdown logic
    function setupChartDropdown(menuBtnId, menuId) {
        const btn = document.getElementById(menuBtnId);
        const menu = document.getElementById(menuId);
        if (!btn || !menu) return;
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Close all other chart dropdowns
            document.querySelectorAll('.chart-actions-dropdown .dropdown-menu').forEach(m => {
                if (m !== menu){
                    m.style.display = 'none';

                } 
            });
            // Toggle this menu
            menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
        });

        // Hide menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.style.display = 'none';
            }
        });

    }
    setupChartDropdown('enrollmentChartMenuBtn', 'enrollmentChartMenu');
    setupChartDropdown('courseDistributionMenuBtn', 'courseDistributionMenu');
