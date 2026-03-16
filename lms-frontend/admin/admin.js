/* ============================================
   Admin Dashboard Logic
============================================ */

// Global charts
let enrollmentChart = null;
let courseDistributionChart = null;

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    // Require authentication and admin role
    if (!Auth.requireAuth([USER_ROLES.ADMIN])) {
        return; // Will redirect to login if not authenticated
    }

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
    // Sidebar navigation - handled by hash routing script in dashboard.html
    // No need to add listeners here as the hash routing script handles it

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking outside of it
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                e.target !== mobileMenuToggle &&
                !mobileMenuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
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
                console.warn('Logout issue:', error);
                showToast('Logout failed. Please try again.', 'error');
            }
        }
    );
}

/**
 * Load dashboard data from API
 */
async function loadDashboardData() {
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) statsGrid.classList.add('stats-loading');
    try {
        const user = Auth.getUser();
        const params = user?.institution_id ? { institution_id: user.institution_id } : {};
        const [statsResponse, activitiesResponse] = await Promise.all([
            DashboardAPI.getAdminStats(params),
            AdminActivityAPI.getRecent({ limit: 10 }),
        ]);

        if (statsResponse && statsResponse.data) {
            updateStatistics(statsResponse.data);
            updateStatChanges(statsResponse.data);
            updateCharts(statsResponse.data);
        }

        renderRecentActivities(activitiesResponse?.data || []);
    } catch (error) {
        console.warn('Dashboard data load issue:', error);
        showToast('Failed to load dashboard data. Please refresh.', 'error');
    } finally {
        if (statsGrid) statsGrid.classList.remove('stats-loading');
    }
}

/**
 * Update statistics cards
 */
function updateStatistics(data) {
    const fields = {
        totalStudents: data.total_students,
        totalTeachers: data.total_teachers,
        totalClasses:  data.total_classes,
        totalCourses:  data.total_courses,
        attendanceRate: data.attendance_rate ?? null,
        upcomingExams:  data.upcoming_exams,
        pendingTasks:   data.pending_tasks,
    };

    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (!el || value == null) continue;
        if (id === 'attendanceRate') {
            animateNumber(el, value, 1000, '%');
        } else {
            animateNumber(el, value);
        }
    }
}

/**
 * Update stat-change indicators with growth percentages
 */
function updateStatChanges(data) {
    updateStatChange('studentsChange', data.students_growth);
    updateStatChange('teachersChange', data.teachers_growth);
    updateStatChange('classesChange', data.classes_growth);
    updateAttendanceChange('attendanceChange', data.attendance_rate_today, data.attendance_rate);
}

/**
 * Show today's attendance rate inside the attendance stat-change badge.
 * Displays "today X%" vs the weekly rate shown in the main card.
 */
function updateAttendanceChange(elementId, todayRate, weeklyRate) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const today = parseFloat(todayRate) || 0;
    const week  = parseFloat(weeklyRate) || 0;
    const icon  = element.querySelector('i');
    const span  = element.querySelector('span');
    if (span) span.textContent = `Today ${today.toFixed(1)}%`;
    if (today >= 75) {
        element.className = 'stat-change positive';
        if (icon) icon.className = 'fas fa-arrow-up';
    } else if (today >= 50) {
        element.className = 'stat-change neutral';
        if (icon) icon.className = 'fas fa-minus';
    } else {
        element.className = 'stat-change negative';
        if (icon) icon.className = 'fas fa-arrow-down';
    }
}

function updateStatChange(elementId, percentage) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const value = parseFloat(percentage) || 0;
    const icon = element.querySelector('i');
    const span = element.querySelector('span');
    const absVal = Math.abs(value).toFixed(1) + '% this month';
    if (value > 0) {
        element.className = 'stat-change positive';
        if (icon) icon.className = 'fas fa-arrow-up';
        if (span) span.textContent = absVal;
    } else if (value < 0) {
        element.className = 'stat-change negative';
        if (icon) icon.className = 'fas fa-arrow-down';
        if (span) span.textContent = absVal;
    } else {
        element.className = 'stat-change neutral';
        if (icon) icon.className = 'fas fa-minus';
        if (span) span.textContent = 'No change this month';
    }
}

/**
 * Animate number counting up
 */
function animateNumber(element, target, duration = 1000, suffix = '') {
    const start = 0;
    const increment = target / (duration / 16); // 60 FPS
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString() + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString() + suffix;
        }
    }, 16);
}

/**
 * Render recent activities list
 */
function renderRecentActivities(activities) {
    const list = document.getElementById('activityList');
    if (!list) return;

    if (!activities || activities.length === 0) {
        list.innerHTML = '<div class="activity-item"><div class="activity-details"><p style="color:var(--text-secondary);padding:0.5rem 0">No recent activity</p></div></div>';
        return;
    }

    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }

    const iconMap = {
        login: 'fa-sign-in-alt',
        logout: 'fa-sign-out-alt',
        create: 'fa-plus-circle',
        update: 'fa-edit',
        delete: 'fa-trash',
        enroll: 'fa-user-plus',
        default: 'fa-info-circle',
    };

    list.innerHTML = activities.map(a => {
        const type = (a.activity_type || a.type || '').toLowerCase();
        const icon = iconMap[type] || iconMap.default;
        const title = esc(a.description || a.title || 'Activity');
        const meta = esc(a.performed_by || a.user || '');
        const time = esc(a.created_at || a.time || '');
        return `
        <div class="activity-item">
            <div class="activity-icon bg-primary">
                <i class="fas ${icon}"></i>
            </div>
            <div class="activity-details">
                <p>${title}</p>
                <small>${meta ? meta + ' &bull; ' : ''}${time}</small>
            </div>
        </div>`;
    }).join('');
}

/**
 * Generate labels for the last 12 months, with the current month last.
 * Months from a prior year are shown as e.g. "Apr '25".
 */
function getLast12MonthLabels() {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const labels = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(
            d.getFullYear() !== currentYear
                ? `${names[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`
                : names[d.getMonth()]
        );
    }
    return labels;
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
                labels: getLast12MonthLabels(),
                datasets: [{
                    label: 'Enrollments',
                    data: [],
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
        enrollmentChart.data.labels = getLast12MonthLabels();
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
