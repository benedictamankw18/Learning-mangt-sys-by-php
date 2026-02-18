/* ============================================
   Parent Dashboard Logic
============================================ */

// Require authentication and parent role
Auth.requireAuth([USER_ROLES.PARENT]);

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
        const parentName = document.getElementById('parentName');
        const userAvatar = document.getElementById('userAvatar');

        const displayName = Auth.getUserDisplayName();
        const initials = Auth.getUserInitials();

        if (userInitials) userInitials.textContent = initials;
        if (userName) userName.textContent = displayName;
        if (parentName) parentName.textContent = displayName;
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

    // Child selector
    const childSelector = document.getElementById('childSelector');
    if (childSelector) {
        childSelector.addEventListener('change', handleChildChange);
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
 * Handle child selection change
 */
function handleChildChange(event) {
    const childId = event.target.value;
    console.log('Selected child:', childId);
    
    // Filter data by selected child
    if (childId === 'all') {
        loadDashboardData();
    } else {
        loadChildData(childId);
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
        const response = await DashboardAPI.getParentStats();

        if (response && response.data) {
            updateStatistics(response.data);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Load data for specific child
 */
async function loadChildData(childId) {
    try {
        // Load child-specific data from API
        const response = await DashboardAPI.getParentStats();
        
        if (response && response.data && response.data.children) {
            const childData = response.data.children.find(c => c.id === childId);
            if (childData) {
                updateStatistics(childData);
            }
        }
    } catch (error) {
        console.error('Error loading child data:', error);
    }
}

/**
 * Update statistics cards
 */
function updateStatistics(data) {
    const totalChildren = document.getElementById('totalChildren');
    const avgPerformance = document.getElementById('avgPerformance');
    const avgAttendance = document.getElementById('avgAttendance');
    const alerts = document.getElementById('alerts');

    if (totalChildren && data.total_children) {
        animateNumber(totalChildren, data.total_children);
    }
    if (avgPerformance && data.avg_performance) {
        animateNumber(avgPerformance, data.avg_performance, 1000, 1);
    }
    if (avgAttendance && data.avg_attendance) {
        const rate = Math.round(data.avg_attendance);
        animateNumber(avgAttendance, rate, 1000, 0, '%');
    }
    if (alerts && data.alerts !== undefined) {
        animateNumber(alerts, data.alerts);
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
    const childSelector = document.getElementById('childSelector');
    const selectedChild = childSelector ? childSelector.value : 'all';
    
    if (selectedChild === 'all') {
        loadDashboardData();
    } else {
        loadChildData(selectedChild);
    }
}

// Auto-refresh every 5 minutes
setInterval(refreshDashboard, 5 * 60 * 1000);
