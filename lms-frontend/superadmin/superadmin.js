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
                const response = await DashboardAPI.getSuperAdminStats();
        // Load dashboard statistics
        await loadDashboardStats();
        
        // Initialize charts
        initializeCharts();
        
        // Load user info
        displayUserInfo();
        
        // Notifications are handled by global `assets/js/main.js`
        
        updateCharts(response.data);
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

            // Update growth percentages
            updateStatChange('institutionsChange', stats.institutions_growth || 0);
            updateStatChange('adminsChange', stats.admins_growth || 0);
            updateStatChange('usersChange', stats.users_growth || 0);

            // Update charts with real data
            updateCharts(stats);
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
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Institutions',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Total Users',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
            const action = btn.querySelector('span').textContent;
            showToast(`${action} - Feature coming soon`, 'info');
        });
    });

    // Refresh buttons
    const refreshButtons = document.querySelectorAll('.btn-icon');
    refreshButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            btn.classList.add('rotate');
            await loadDashboardStats();
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
        await loadDashboardStats();
        console.log('Dashboard data refreshed');
    } catch (error) {
        console.error('Auto-refresh failed:', error);
    }
}, 5 * 60 * 1000);

