/* ============================================
   Admin Dashboard Logic
============================================ */

// Global charts
let enrollmentChart = null;
let courseDistributionChart = null;
let notificationPollTimer = null;

const NOTIFICATION_POLL_MS = 30000;

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
    startNotificationPolling();
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

        const avatarImg = document.getElementById('userAvatarImg');
        if (userInitials) {
            userInitials.textContent = Auth.getUserInitials();
            userInitials.style.display = user.profile_photo ? 'none' : 'block';
        }
        if (userName) {
            userName.textContent = Auth.getUserDisplayName();
        }
        if (avatarImg) {
            avatarImg.onerror = function () {
                avatarImg.style.display = 'none';
                if (userInitials) userInitials.style.display = 'block';
                if (userAvatar) userAvatar.style.background = Auth.getUserAvatar();
            };
            avatarImg.onload = function () {
                avatarImg.style.display = 'block';
                if (userInitials) userInitials.style.display = 'none';
            };
            if (user.profile_photo) {
                const base = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) ? API_BASE_URL.replace(/\/+$/,'') : '';
                const photoUrl = /^https?:\/\//i.test(user.profile_photo) ? user.profile_photo : (base + (user.profile_photo.startsWith('/') ? '' : '/') + user.profile_photo);
                avatarImg.src = photoUrl;
            } else {
                avatarImg.src = '';
                avatarImg.style.display = 'none';
            }
        }
        if (userAvatar) {
            if (!user.profile_photo) {
                userAvatar.style.background = Auth.getUserAvatar();
            } else {
                userAvatar.style.background = 'transparent';
            }
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
    const notificationBell = document.getElementById('notificationBell');
    const userProfile = document.getElementById('userProfileBtn');
    const courseDistribution = document.getElementById('courseDistributionMenuBtn');
    const enrollmentChart = document.getElementById('enrollmentChartMenuBtn');

    if (notificationBell) {
        notificationBell.addEventListener('click', async (e) => {
            e.stopPropagation();
            const dropdown = notificationBell.closest('.dropdown');
            const notificationDropdown = document.getElementById('notificationDropdown');
            if (dropdown && notificationDropdown) {
                const isVisible = notificationDropdown.style.display !== 'none';
                if (!isVisible) {
                    await refreshNotificationState(true);
                }
            }
            toggleDropdown(dropdown);
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

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopNotificationPolling();
        } else {
            startNotificationPolling();
        }
    });

    window.addEventListener('beforeunload', stopNotificationPolling);
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

function startNotificationPolling() {
    stopNotificationPolling();
    notificationPollTimer = setInterval(() => {
        if (document.hidden) return;
        refreshNotificationState(false);
    }, NOTIFICATION_POLL_MS);
    refreshNotificationState(false);
}

function stopNotificationPolling() {
    if (notificationPollTimer) {
        clearInterval(notificationPollTimer);
        notificationPollTimer = null;
    }
}

async function refreshNotificationState(forceDropdownLoad = false) {
    const dropdown = document.getElementById('notificationDropdown');
    const dropdownIsVisible = !!dropdown && dropdown.style.display !== 'none';

    if (forceDropdownLoad || dropdownIsVisible) {
        await loadNotificationsDropdown();
        return;
    }

    await refreshNotificationSummary();
}

async function refreshNotificationSummary() {
    try {
        const response = await NotificationAPI.getSummary();
        const data = response?.data || response || {};
        updateNotificationCounts(data);
        updateNotificationBadge(Number(data.total_unread ?? data.notifications_unread ?? 0));
    } catch (error) {
        console.error('Failed to refresh notification summary', error);
    }
}

function updateNotificationCounts(data) {
    const notifCount = document.getElementById('notifCount');
    const msgCount = document.getElementById('msgCount');
    const notificationUnread = Number(data?.notifications_unread ?? 0);
    const messageUnread = Number(data?.messages_unread ?? 0);

    if (notifCount) notifCount.textContent = String(notificationUnread);
    if (msgCount) msgCount.textContent = String(messageUnread);
}

function updateNotificationBadge(unread) {
    const badge = document.getElementById('notificationBadge');
    const count = Number(unread) || 0;

    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }

    const countNode = document.getElementById('notifCount');
    if (countNode && !countNode.textContent) {
        countNode.textContent = String(count);
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
                    backgroundColor: [],
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
        courseDistributionChart.data.datasets[0].backgroundColor = getDynamicChartColors(courseDistributionChart.data.labels.length);
        courseDistributionChart.update();
    }
}

function getDynamicChartColors(count) {
    const total = Math.max(0, Number(count) || 0);
    if (!total) return [];

    const base = ['#006a3f', '#008c54', '#d4af37', '#10b981', '#3090cf'];
    const colors = [];
    const goldenAngle = 137.508;

    for (let i = 0; i < total; i++) {
        if (i < base.length) {
            colors.push(base[i]);
            continue;
        }

        const hue = Math.round((i * goldenAngle) % 360);
        const saturation = 68;
        const lightness = 52;
        colors.push('hsl(' + hue + ', ' + saturation + '%, ' + lightness + '%)');
    }

    return colors;
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

    // Notification tabs
    const tabBtns = document.querySelectorAll('.notification-tabs .tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchNotificationTab(tabName);
            switchNotificationFooterNav(tabName);
        });
    });

    // Mark all as read
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            try {
                await NotificationAPI.markAllAsRead();
                showToast('All notifications marked as read', 'success');
                await loadNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark all as read', error);
                showToast(error?.message || 'Failed to mark all as read', 'error');
            }
        });
    }


/**
 * Load notifications into dropdown
 */
async function loadNotificationsDropdown() {
    try {
        // Fetch notifications
        const notifResponse = await NotificationAPI.getAll({ page: 1, limit: 10 });
        const notifData = notifResponse?.data || notifResponse || {};
        const notifications = Array.isArray(notifData.notifications) ? notifData.notifications : (Array.isArray(notifData.data) ? notifData.data : []);
        const messages = notifications.filter(n => (n.notification_type || '').toLowerCase().includes('message'));
        const otherNotifs = notifications.filter(n => !(n.notification_type || '').toLowerCase().includes('message'));

        // Fetch unread chat messages
        let chatMessages = [];
        let chatUnreadCount = 0;
        try {
            const chatResponse = await ChatAPI.getUnreadMessages();
            const chatData = chatResponse?.data || chatResponse || {};
            chatMessages = Array.isArray(chatData.messages) ? chatData.messages : [];
            chatUnreadCount = Number(chatData.unread_count ?? 0);
        } catch (chatError) {
            console.warn('Failed to fetch unread chat messages', chatError);
        }

        // Format chat messages to match notification structure
        const formattedChatMessages = chatMessages.map(msg => ({
            uuid: msg.message_uuid,
            id: msg.message_uuid,
            title: msg.sender_name,
            message: msg.message_text || 'Shared a message',
            message_text: msg.message_text,
            room_name: msg.room_name,
            sender_name: msg.sender_name,
            created_at: msg.created_at,
            is_read: false, // Chat messages are always unread by definition
            notification_type: 'chat_message',
            room_uuid: msg.room_uuid,
        }));

        // Only show unread items in the dropdown
        const unreadMessages = messages.filter(m => !(m.is_read == 1 || m.is_read === '1' || m.is_read === true));
        const unreadOther = otherNotifs.filter(n => !(n.is_read == 1 || n.is_read === '1' || n.is_read === true));

        // Combine unread notifications and chat messages
        const allUnreadMessages = [...unreadMessages, ...formattedChatMessages];

        // If server reports unread but current page has none, try fetching more items
        const unreadCount = Number(notifData.unread_count ?? 0);
        if ((unreadCount + chatUnreadCount) > 0 && unreadMessages.length === 0 && unreadOther.length === 0 && formattedChatMessages.length === 0) {
            try {
                const fetchLimit = Math.min(100, Math.max(50, unreadCount));
                const retryResp = await NotificationAPI.getAll({ page: 1, limit: fetchLimit });
                const retryData = retryResp?.data || retryResp || {};
                const retryNotifications = Array.isArray(retryData.notifications) ? retryData.notifications : (Array.isArray(retryData.data) ? retryData.data : []);
                const retryMessages = retryNotifications.filter(n => (n.notification_type || '').toLowerCase().includes('message'));
                const retryOther = retryNotifications.filter(n => !(n.notification_type || '').toLowerCase().includes('message'));
                const retryUnreadMessages = retryMessages.filter(m => !(m.is_read == 1 || m.is_read === '1' || m.is_read === true));
                const retryUnreadOther = retryOther.filter(n => !(n.is_read == 1 || n.is_read === '1' || n.is_read === true));

                if (retryUnreadMessages.length > 0 || retryUnreadOther.length > 0 || formattedChatMessages.length > 0) {
                    renderNotificationsList(retryUnreadOther);
                    renderMessagesList([...retryUnreadMessages, ...formattedChatMessages]);
                    updateNotificationTabs(retryUnreadOther, [...retryUnreadMessages, ...formattedChatMessages]);
                    updateNotificationBadge(Number(retryData.unread_count ?? unreadCount) + chatUnreadCount);
                    return;
                }
            } catch (e) {
                console.warn('Retry fetch for unread notifications failed', e);
            }

            // Fall back: show a hint linking to the full notifications page
            const notifList = document.getElementById('notificationsList');
            const msgList = document.getElementById('messagesList');
            if (notifList) notifList.innerHTML = '<p class="no-notifications">No unread notifications on this page — <a href="#notifications">View all</a></p>';
            if (msgList) msgList.innerHTML = '<p class="no-notifications">No unread messages on this page — <a href="#messages">View all messages</a></p>';
            updateNotificationTabs(unreadOther, allUnreadMessages);
            updateNotificationBadge(unreadCount + chatUnreadCount);
            return;
        }

        renderNotificationsList(unreadOther);
        renderMessagesList(allUnreadMessages);
        updateNotificationTabs(unreadOther, allUnreadMessages);
        updateNotificationBadge(Number(notifData.unread_count ?? 0) + chatUnreadCount);
    } catch (error) {
        console.error('Failed to load notifications dropdown', error);
        showToast('Failed to load notifications', 'error');
    }
}

/**
 * Update notification and message counts in tabs
 */
function updateNotificationTabs(notifications, messages) {
    const notifCount = document.getElementById('notifCount');
    const msgCount = document.getElementById('msgCount');
    if (notifCount) notifCount.textContent = String(notifications.length);
    if (msgCount) msgCount.textContent = String(messages.length);
}

/**
 * Render notifications in dropdown
 */
function renderNotificationsList(notifications) {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (!notifications || notifications.length === 0) {
        list.innerHTML = '<p class="no-notifications">No unread notifications</p>';
        return;
    }

    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }

    list.innerHTML = notifications.map(n => {
        const isRead = n.is_read == 1 || n.is_read === '1' || n.is_read === true;
        return `
        <div class="notification-item ${isRead ? 'read' : 'unread'}" data-uuid="${esc(n.uuid || n.id || '')}">
            <div class="notification-info">
                <h4>${esc(n.title || 'Notification')}</h4>
                <p>${esc(n.message || '')}</p>
                ${n.link ? `<a href="${esc(n.link || '#')}" class="notification-link" rel="noopener noreferrer">View Details</a>` : ''}
                <small>${esc(n.created_at || '')}</small>
            </div>
            <div class="notification-actions">
                ${!isRead ? `<button class="btn-action mark-read" title="Mark as read"><i class="fas fa-check"></i></button>` : ''}
            </div>
        </div>`;
    }).join('');

    // Attach event handlers
    list.querySelectorAll('.mark-read').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const item = btn.closest('.notification-item');
            const uuid = item?.getAttribute('data-uuid');
            if (uuid) {
                try {
                    await NotificationAPI.markAsRead(uuid);
                    showToast('Notification marked as read', 'success');
                    // Reload dropdown to reflect unread-only view
                    await loadNotificationsDropdown();
                } catch (error) {
                    console.error(error);
                    showToast('Failed to mark as read', 'error');
                }
            }
        });
    });

}

/**
 * Render messages in dropdown
 */
function renderMessagesList(messages) {
    const list = document.getElementById('messagesList');
    if (!list) return;

    if (!messages || messages.length === 0) {
        list.innerHTML = '<p class="no-notifications">No unread messages</p>';
        return;
    }

    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }

    list.innerHTML = messages.map(m => {
        const isRead = m.is_read == 1 || m.is_read === '1' || m.is_read === true;
        const isChatMessage = m.notification_type === 'chat_message';
        
        // Format title differently for chat messages
        const titleText = isChatMessage 
            ? `Chat: ${esc(m.room_name || 'Unknown Room')} - ${esc(m.sender_name || 'Unknown')}`
            : esc(m.title || 'Message');
        
        const messagePreview = isChatMessage 
            ? esc((m.message_text || '').substring(0, 100))
            : esc(m.message || '');

        return `
        <div class="notification-item ${isRead ? 'read' : 'unread'} ${isChatMessage ? 'chat-message' : ''}" data-uuid="${esc(m.uuid || m.id || '')}" ${isChatMessage ? `data-room-uuid="${esc(m.room_uuid || '')}"` : ''}>
            <div class="notification-icon">
                <i class="fas ${isChatMessage ? 'fa-comments' : 'fa-envelope'}"></i>
            </div>
            <div class="notification-info">
                <h4>${titleText}</h4>
                <p>${messagePreview}</p>
                <small>${esc(m.created_at || '')}</small>
            </div>
            <div class="notification-actions">
                ${!isRead ? `<button class="btn-action mark-read" title="Mark as read"><i class="fas fa-check"></i></button>` : ''}
            </div>
        </div>`;
    }).join('');

    // Attach event handlers
    list.querySelectorAll('.mark-read').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const item = btn.closest('.notification-item');
            const uuid = item?.getAttribute('data-uuid');
            if (uuid) {
                try {
                    // Only mark notification messages as read, not chat messages
                    if (!item.classList.contains('chat-message')) {
                        await NotificationAPI.markAsRead(uuid);
                        showToast('Message marked as read', 'success');
                    } else {
                        showToast('Chat messages are marked as read when viewed in chat room', 'info');
                    }
                    // Reload dropdown to reflect unread-only view
                    await loadNotificationsDropdown();
                } catch (error) {
                    console.error(error);
                    showToast('Failed to mark as read', 'error');
                }
            }
        });
    });
}

/**
 * Switch notification tabs
 */
function switchNotificationTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.notification-content .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all tab buttons
    document.querySelectorAll('.notification-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });


    // Show selected tab content
    const tabId = tabName === 'messages' ? 'messagesTab' : 'notificationsTab';
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.classList.add('active');
    }

    // Activate selected tab button
    document.querySelector(`.notification-tabs .tab-btn[data-tab="${tabName}"]`)?.classList.add('active');
}

function switchNotificationFooterNav(tabName) {
    
    document.querySelectorAll('.notification-footer .openNav').forEach(nav => {
        nav.classList.remove('active');
    });

    const viewTab = tabName === 'messages' ? 'viewMessages' : 'viewNotifications';
    const viewElement = document.getElementById(viewTab);
    
    if (viewElement) {
        viewElement.classList.add('active');
    }
    document.querySelector(`.notification-footer .openNav[data-tab="${tabName}"]`)?.classList.add('active');
}