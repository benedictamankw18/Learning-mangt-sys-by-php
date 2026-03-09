/**
 * Super Admin Dashboard
 * System-wide management and monitoring
 */

// Initialize auth service
const auth = new AuthService();

// Check authentication and role
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is authenticated and has super admin role
    if (!auth.isAuthenticated()) {
        window.location.href = '../auth/login.html';
        return;
    }

    const userRole = auth.getUserRole();
    if (userRole !== USER_ROLES.SUPER_ADMIN) {
        window.location.href = auth.getDashboardURL(userRole);
        return;
    }
    
    // Initialize dashboard
    await initializeDashboard();
    setupEventListeners();
});

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    try {
        // Load dashboard statistics
        await loadDashboardStats();
        
        // Initialize charts
        initializeCharts();
        
        // Load user info
        displayUserInfo();

        // Load recent activities from superadmin-activity API
        await loadRecentActivities();
        
        // Notifications are handled by global `assets/js/main.js`
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    try {
        const response = await DashboardAPI.getSuperAdminStats();
        
        if (response && response.data) {
            const stats = response.data;
            
            // Update stat cards with animation
            updateStatCard('totalInstitutions', stats.total_institutions || 0);
            updateStatCard('totalAdmins', stats.total_admins || 0);
            updateStatCard('totalUsers', stats.total_users || 0);
            updateStatCard('activeSubscriptions', stats.active_subscriptions || 0);

            // Update growth percentages
            updateStatChange('institutionsChange', stats.institutions_growth || 0);
            updateStatChange('adminsChange', stats.admins_growth || 0);
            updateStatChange('usersChange', stats.users_growth || 0);
            updateStatChange('subscriptionsChange', stats.subscriptions_growth || 0);

            // Update charts with real data
            updateCharts(stats);

            // Update per-role stat cards
            updateRoleStats(stats.users_by_role);

            // Update system health bars from API
            updateSystemHealth(stats.system_health);

            // Recent activities are loaded separately via SuperadminActivityAPI
        }

    } catch (error) {
        console.error('Failed to load stats:', error);
        showToast('Failed to load dashboard statistics', 'error');
        throw error;
    }
}

/**
 * Update stat card with animation
 */
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
            element.textContent = formatNumber(value);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, duration / steps);
}

/**
 * Update stat change indicator
 */
function updateStatChange(elementId, percentage) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const value = parseFloat(percentage) || 0;
    const absValue = Math.abs(value);
    const icon = element.querySelector('i');
    const span = element.querySelector('span');

    // Update percentage value
    if (span) {
        span.textContent = absValue.toFixed(1) + '%';
    }

    // Update icon and class based on positive/negative/neutral
    if (value > 0) {
        element.className = 'stat-change positive';
        if (icon) icon.className = 'fas fa-arrow-up';
    } else if (value < 0) {
        element.className = 'stat-change negative';
        if (icon) icon.className = 'fas fa-arrow-down';
    } else {
        element.className = 'stat-change neutral';
        if (icon) icon.className = 'fas fa-minus';
    }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Generate labels for the last 12 months, current month last.
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
let systemGrowthChart = null;
let usersByRoleChart = null;

function initializeCharts() {
    initializeSystemGrowthChart();
    initializeUsersByRoleChart();
}

/**
 * Update charts with real data
 */
function updateCharts(stats) {
    // Update users by role chart
    if (usersByRoleChart && stats.users_by_role) {
        const roleData = stats.users_by_role;
        usersByRoleChart.data.datasets[0].data = [
            roleData.students || 0,
            roleData.teachers || 0,
            roleData.parents || 0,
            roleData.admins || 0,
            roleData.super_admins || 0
        ];
        usersByRoleChart.update();
    }

    // Update system growth chart
    if (systemGrowthChart && stats.monthly_growth) {
        const growthData = stats.monthly_growth;
        
        // Update labels: prefer API-supplied labels, otherwise generate dynamic 12-month labels
        if (growthData.labels && Array.isArray(growthData.labels) && growthData.labels.length) {
            systemGrowthChart.data.labels = growthData.labels;
        } else {
            systemGrowthChart.data.labels = getLast12MonthLabels();
        }
        
        console.log('Updating system growth chart with data:', growthData);
        // Update data
        systemGrowthChart.data.datasets[0].data = growthData.institutions || [];
        systemGrowthChart.data.datasets[1].data = growthData.users || [];
        systemGrowthChart.update();
    }
}

/**
 * Initialize system growth chart
 */
function initializeSystemGrowthChart() {
    const ctx = document.getElementById('systemGrowthChart');
    if (!ctx) return;

    systemGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: getLast12MonthLabels(),
            datasets: [
                {
                    label: 'Institutions',
                    data: [],
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Total Users',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Initialize users by role chart
 */
function initializeUsersByRoleChart() {
    const ctx = document.getElementById('usersByRoleChart');
    if (!ctx) return;

    usersByRoleChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Students', 'Teachers', 'Parents', 'Admins', 'Super Admins'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#10b981',
                    '#006a3f',
                    '#d4af37',
                    '#3090cf',
                    '#008c54'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Update per-role stat cards from users_by_role data
 */
function updateRoleStats(roleData) {
    if (!roleData) return;
    updateStatCard('roleStudents', roleData.students || 0);
    updateStatCard('roleTeachers', roleData.teachers || 0);
    updateStatCard('roleParents', roleData.parents || 0);
    updateStatCard('roleAdmins', roleData.admins || 0);
}

/**
 * Update system health bars from API data
 */
function updateSystemHealth(health) {
    if (!health) return;

    const items = [
        { key: 'database', id: 'healthDb' },
        { key: 'memory',   id: 'healthMemory' },
        { key: 'cpu',      id: 'healthCpu' },
        { key: 'storage',  id: 'healthStorage' },
    ];

    items.forEach(({ key, id }) => {
        const data = health[key];
        if (!data) return;

        const usage  = Math.min(100, Math.max(0, parseFloat(data.usage ?? data.percent ?? 0)));
        const status = data.status || (usage >= 90 ? 'critical' : usage >= 75 ? 'warning' : 'healthy');

        const progress = document.getElementById(`${id}Progress`);
        const value    = document.getElementById(`${id}Value`);
        const badge    = document.getElementById(`${id}Status`);

        if (progress) progress.style.width = `${usage}%`;
        if (value)    value.textContent = `${Math.round(usage)}%`;
        if (badge) {
            if (status === 'critical') {
                badge.className = 'badge badge-danger';
                badge.textContent = 'Critical';
            } else if (status === 'warning') {
                badge.className = 'badge badge-warning';
                badge.textContent = 'Monitor';
            } else {
                badge.className = 'badge badge-success';
                badge.textContent = 'Healthy';
            }
        }
    });
}

/**
 * Load recent activities from the superadmin-activity endpoint
 */
async function loadRecentActivities(limit = 10) {
    try {
        const response = await SuperadminActivityAPI.getRecent({ limit });
        const activities = response?.data ?? [];
        renderRecentActivities(activities);
    } catch (error) {
        console.error('Failed to load recent activities:', error);
        renderRecentActivities([]);
    }
}

/**
 * Activity type → icon & colour map
 */
const ACTIVITY_ICONS = {
    institution_registered: { icon: 'fa-building',      color: 'bg-gradient-green'  },
    institution_created:    { icon: 'fa-building',      color: 'bg-gradient-green'  },
    admin_created:          { icon: 'fa-user-plus',     color: 'bg-gradient-blue'   },
    user_created:           { icon: 'fa-user-plus',     color: 'bg-gradient-blue'   },
    backup:                 { icon: 'fa-database',      color: 'bg-gradient-orange' },
    update:                 { icon: 'fa-sync-alt',      color: 'bg-gradient-purple' },
    security:               { icon: 'fa-shield-alt',    color: 'bg-gradient-red'    },
    login:                  { icon: 'fa-sign-in-alt',   color: 'bg-gradient-indigo' },
    default:                { icon: 'fa-info-circle',   color: 'bg-gradient-blue'   },
};

/**
 * Render recent activities list from API data
 */
function renderRecentActivities(activities) {
    const list = document.getElementById('activityList');
    if (!list) return;

    if (!activities || activities.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:1rem;color:var(--text-secondary);">No recent activities</p>';
        return;
    }

    // Sanitise a string for safe HTML display
    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }

    list.innerHTML = activities.map(activity => {
        // Normalise field names — SuperadminActivityAPI uses activity_type / performer_name
        const type = activity.activity_type || activity.type || 'default';
        const cfg  = ACTIVITY_ICONS[type] || ACTIVITY_ICONS.default;
        const raw  = activity.created_at || activity.time || null;
        const time = raw ? DateUtils.getRelativeTime(raw) : '';
        const performer = activity.performer_name || activity.meta || activity.user || '';
        const meta = [esc(performer), time].filter(Boolean).join(' — ');
        return `
            <div class="activity-item">
                <div class="activity-icon ${cfg.color}">
                    <i class="fas ${cfg.icon}"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-title">${esc(activity.description || activity.title || '')}</p>
                    <p class="activity-meta">${meta}</p>
                </div>
            </div>`;
    }).join('');
}

/**
 * Display user info
 */
function displayUserInfo() {
    const user = auth.getUser();
    if (!user) return;

    // Update user name display
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = user.name || 'Super Admin';
    }

    // Update avatar if available
    const avatarElement = document.querySelector('.user-avatar');
    if (avatarElement && user.name) {
        avatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f97316&color=fff`;
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Navigation items
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update page title
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) {
                pageTitle.textContent = getPageTitle(page);
            }
            
            // In production, this would load different page content
            console.log('Navigate to:', page);
            showToast(`Navigating to ${getPageTitle(page)}`, 'info');
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // Quick action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const actionText = btn.querySelector('span').textContent;
            
            // Navigate based on button text
            let targetPage = 'dashboard.html';
            
            if (actionText.includes('Institution')) {
                targetPage = '#institutions';
            } else if (actionText.includes('Admin')) {
                targetPage = '#users';
            } else if (actionText.includes('Role') || actionText.includes('Permission')) {
                targetPage = '#roles';
            } else if (actionText.includes('System') || actionText.includes('Setting')) {
                targetPage = '#system';
            } else if (actionText.includes('Backup')) {
                targetPage = '#database';
            } else if (actionText.includes('Security')) {
                targetPage = '#security';
            } else if (actionText.includes('Logs')) {
                targetPage = '#logs';
            }
            
            if (targetPage) {
                window.location.href = targetPage;
            } else {
                showToast(`${actionText} - Feature coming soon`, 'info');
            }
        });
    });

    // Refresh buttons
    const refreshButtons = document.querySelectorAll('.btn-icon');
    refreshButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            btn.classList.add('rotate');
            await Promise.all([loadDashboardStats(), loadRecentActivities()]);
            setTimeout(() => {
                btn.classList.remove('rotate');
            }, 500);
        });
    });

   

    // Notification tabs are handled by global `assets/js/main.js`

}

/**
 * Get page title from page key
 */
function getPageTitle(page) {
    const titles = {
        overview: 'System Overview',
        institutions: 'Institution Management',
        users: 'User Management',
        roles: 'Roles & Permissions',
        system: 'System Settings',
        database: 'Database Management',
        logs: 'System Logs',
        security: 'Security Settings',
        api: 'API Management',
        backup: 'Backup & Restore'
    };
    return titles[page] || 'Dashboard';
}

/**
 * Handle logout
 */
async function handleLogout() {
    showModal(
        'Confirm Logout',
        'Are you sure you want to logout?',
        async () => {
            try {
                await auth.logout();
            } catch (error) {
                console.error('Logout error:', error);
                showToast('Logout failed. Please try again.', 'error');
            }
        }
    );
}


/**
 * Auto-refresh data every 5 minutes
 */
setInterval(async () => {
    try {
        await Promise.all([loadDashboardStats(), loadRecentActivities()]);
        console.log('Dashboard data refreshed');
    } catch (error) {
        console.error('Auto-refresh failed:', error);
    }
}, 5 * 60 * 1000);

