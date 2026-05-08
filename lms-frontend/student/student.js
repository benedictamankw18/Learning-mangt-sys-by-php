/* ============================================
   Student Dashboard Logic
============================================ */

let studentNotificationPollTimer = null;
const STUDENT_NOTIFICATION_POLL_MS = 30000;

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    // Require authentication and student role
    if (!Auth.requireAuth([USER_ROLES.STUDENT])) {
        return; // Will redirect to login if not authenticated
    }

    initDashboard();
    setupEventListeners();
    loadDashboardData();
    startStudentNotificationPolling();
});

let gradeTrendChart = null;

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

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (userLogoutBtn) userLogoutBtn.addEventListener('click', handleLogout);

    // Dropdowns
    const notificationBtn = document.getElementById('notificationBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');

    if (notificationBtn) {
        notificationBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            toggleDropdown(notificationBtn.closest('.dropdown'));
            const parent = notificationBtn.closest('.dropdown');
            if (parent && parent.classList.contains('active')) {
                await refreshStudentNotificationState(true);
            }
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

    const markAllReadBtn = document.getElementById('studentMarkAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            try {
                await NotificationAPI.markAllAsRead();
                showToast('All notifications marked as read', 'success');
                await loadStudentNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark notifications as read', error);
                showToast('Failed to mark all as read', 'error');
            }
        });
    }

    document.querySelectorAll('.notification-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchStudentNotificationTab(btn.getAttribute('data-tab') || 'notifications');
        });
    });

    document.querySelectorAll('.student-open-tab-link').forEach(link => {
        link.addEventListener('click', () => {
            const tab = link.getAttribute('data-tab') || 'notifications';
            setStudentFooterActive(tab);
        });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopStudentNotificationPolling();
        } else {
            startStudentNotificationPolling();
        }
    });

    window.addEventListener('beforeunload', stopStudentNotificationPolling);
}

function startStudentNotificationPolling() {
    stopStudentNotificationPolling();
    studentNotificationPollTimer = setInterval(() => {
        if (!document.hidden) {
            refreshStudentNotificationState(false);
        }
    }, STUDENT_NOTIFICATION_POLL_MS);

    refreshStudentNotificationState(false);
}

function stopStudentNotificationPolling() {
    if (studentNotificationPollTimer) {
        clearInterval(studentNotificationPollTimer);
        studentNotificationPollTimer = null;
    }
}

async function refreshStudentNotificationState(forceDropdownLoad = false) {
    const bell = document.getElementById('notificationBtn');
    const dropdown = bell ? bell.closest('.dropdown') : null;
    const isOpen = !!dropdown && dropdown.classList.contains('active');

    if (forceDropdownLoad || isOpen) {
        await loadStudentNotificationsDropdown();
        return;
    }

    await refreshStudentNotificationSummary();
}

async function refreshStudentNotificationSummary() {
    try {
        const [summaryResponse, chatResponse] = await Promise.all([
            NotificationAPI.getSummary().catch(() => null),
            ChatAPI.getUnreadMessages().catch(() => null),
        ]);

        const summaryData = summaryResponse?.data || summaryResponse || {};
        const chatData = chatResponse?.data || chatResponse || {};

        const notificationUnread = Number(summaryData.total_unread ?? summaryData.notifications_unread ?? 0);
        const messageUnread = Number(summaryData.messages_unread ?? 0) + Number(chatData.unread_count ?? 0);

        updateStudentNotificationCounts(notificationUnread, messageUnread);
        updateStudentNotificationBadge(notificationUnread + messageUnread);
    } catch (error) {
        console.error('Failed to refresh student notification summary', error);
    }
}

async function loadStudentNotificationsDropdown() {
    try {
        const [notifResponse, chatResponse] = await Promise.all([
            NotificationAPI.getAll({ page: 1, limit: 30 }).catch(() => null),
            ChatAPI.getUnreadMessages().catch(() => null),
        ]);

        const notifData = notifResponse?.data || notifResponse || {};
        const chatData = chatResponse?.data || chatResponse || {};

        const notifications = Array.isArray(notifData.notifications)
            ? notifData.notifications
            : (Array.isArray(notifData.data) ? notifData.data : []);
        const chatMessages = Array.isArray(chatData.messages) ? chatData.messages : [];

        const messageNotifs = notifications.filter(n => (n.notification_type || '').toLowerCase().includes('message'));
        const otherNotifs = notifications.filter(n => !(n.notification_type || '').toLowerCase().includes('message'));

        const unreadMessageNotifs = messageNotifs.filter(m => !(m.is_read == 1 || m.is_read === '1' || m.is_read === true));
        const unreadOtherNotifs = otherNotifs.filter(n => !(n.is_read == 1 || n.is_read === '1' || n.is_read === true));

        const formattedChatMessages = chatMessages.map(msg => ({
            uuid: msg.message_uuid,
            message_uuid: msg.message_uuid,
            room_uuid: msg.room_uuid,
            room_name: msg.room_name,
            sender_name: msg.sender_name,
            message_text: msg.message_text,
            created_at: msg.created_at,
            is_read: false,
            notification_type: 'chat_message',
            is_chat: true,
        }));

        const allMessages = [...unreadMessageNotifs, ...formattedChatMessages];

        renderStudentNotifications(unreadOtherNotifs);
        renderStudentMessages(allMessages);

        updateStudentNotificationCounts(unreadOtherNotifs.length, allMessages.length);
        updateStudentNotificationBadge(unreadOtherNotifs.length + allMessages.length);
    } catch (error) {
        console.error('Failed to load student notifications dropdown', error);
        showToast('Failed to load notifications', 'error');
    }
}

function updateStudentNotificationCounts(notificationCount, messageCount) {
    const notifCountNode = document.getElementById('studentNotifCount');
    const msgCountNode = document.getElementById('studentMsgCount');

    if (notifCountNode) notifCountNode.textContent = String(Number(notificationCount) || 0);
    if (msgCountNode) msgCountNode.textContent = String(Number(messageCount) || 0);
}

function updateStudentNotificationBadge(totalUnread) {
    const badge = document.getElementById('notificationCount');
    const count = Number(totalUnread) || 0;
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function studentEsc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

function renderStudentNotifications(notifications) {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (!notifications || notifications.length === 0) {
        list.innerHTML = '<p class="no-notifications" style="padding: 0.75rem; color: #6b7280;">No unread notifications</p>';
        return;
    }

    list.innerHTML = notifications.map(item => `
        <div class="dropdown-item student-notif-item" data-uuid="${studentEsc(item.uuid || item.id || '')}" style="display: block; border-bottom: 1px solid #f3f4f6;">
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${studentEsc(item.title || 'Notification')}</div>
            <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 0.35rem;">${studentEsc(item.message || '')}</div>
            ${item.link ? `<a href="${studentEsc(item.link)}" class="student-open-link" style="font-size: 0.8rem;">View details</a>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                <small style="color: #9ca3af;">${studentEsc(item.created_at || '')}</small>
                <button class="btn-action student-mark-read" title="Mark as read" style="border: 0; background: transparent; cursor: pointer; color: #059669;">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.student-mark-read').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const item = btn.closest('.student-notif-item');
            const uuid = item?.getAttribute('data-uuid');
            if (!uuid) return;

            try {
                await NotificationAPI.markAsRead(uuid);
                await loadStudentNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark notification as read', error);
                showToast('Failed to mark as read', 'error');
            }
        });
    });
}

function renderStudentMessages(messages) {
    const list = document.getElementById('messagesList');
    if (!list) return;

    if (!messages || messages.length === 0) {
        list.innerHTML = '<p class="no-notifications" style="padding: 0.75rem; color: #6b7280;">No unread messages</p>';
        return;
    }

    list.innerHTML = messages.map(item => {
        const isChat = item.notification_type === 'chat_message' || item.is_chat === true;
        const title = isChat
            ? `Chat: ${studentEsc(item.room_name || 'Room')} - ${studentEsc(item.sender_name || 'User')}`
            : studentEsc(item.title || 'Message');
        const body = isChat
            ? studentEsc((item.message_text || '').slice(0, 100))
            : studentEsc(item.message || '');
        const action = isChat
            ? '<a href="#messages" class="student-open-chat" style="font-size: 0.8rem;">Open chat</a>'
            : '<button class="btn-action student-mark-read-msg" title="Mark as read" style="border: 0; background: transparent; cursor: pointer; color: #059669;"><i class="fas fa-check"></i></button>';

        return `
            <div class="dropdown-item student-message-item ${isChat ? 'student-chat-item' : ''}" data-uuid="${studentEsc(item.uuid || item.id || '')}" style="display: block; border-bottom: 1px solid #f3f4f6;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${title}</div>
                <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 0.35rem;">${body}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <small style="color: #9ca3af;">${studentEsc(item.created_at || '')}</small>
                    ${action}
                </div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.student-mark-read-msg').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const item = btn.closest('.student-message-item');
            const uuid = item?.getAttribute('data-uuid');
            if (!uuid) return;

            try {
                await NotificationAPI.markAsRead(uuid);
                await loadStudentNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark message as read', error);
                showToast('Failed to mark as read', 'error');
            }
        });
    });

    list.querySelectorAll('.student-open-chat').forEach(link => {
        link.addEventListener('click', () => {
            setStudentFooterActive('messages');
        });
    });
}

function switchStudentNotificationTab(tabName) {
    const notifTab = document.getElementById('studentNotificationsTab');
    const msgTab = document.getElementById('studentMessagesTab');
    const notifBtn = document.getElementById('studentNotifTabBtn');
    const msgBtn = document.getElementById('studentMsgTabBtn');

    const showMessages = tabName === 'messages';

    if (notifTab) notifTab.style.display = showMessages ? 'none' : 'block';
    if (msgTab) msgTab.style.display = showMessages ? 'block' : 'none';
    if (notifBtn) notifBtn.classList.toggle('active', !showMessages);
    if (msgBtn) msgBtn.classList.toggle('active', showMessages);

    setStudentFooterActive(tabName);
}

function setStudentFooterActive(tabName) {
    const notifLink = document.getElementById('studentViewAllNotifications');
    const msgLink = document.getElementById('studentViewAllMessages');
    const showMessages = tabName === 'messages';

    if (notifLink) notifLink.classList.toggle('active', !showMessages);
    if (msgLink) msgLink.classList.toggle('active', showMessages);
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
        const response = await DashboardAPI.getStudentStats();

        if (response && response.data) {
            updateStatistics(response.data);
        }
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
    const enrolledCourses = document.getElementById('enrolledCourses');
    const pendingAssignments = document.getElementById('pendingAssignments');
    const attendanceRate = document.getElementById('attendanceRate');
    const upcomingAssessments = document.getElementById('upcomingAssessments');
    const todaysClasses = document.getElementById('todaysClasses');
    const pendingBanner = document.getElementById('pendingBanner');
    const todaysBanner = document.getElementById('todaysBanner');

    if (enrolledCourses) animateNumber(enrolledCourses, data.enrolled_courses || 0);
    if (pendingAssignments) animateNumber(pendingAssignments, data.pending_assignments || 0);
    if (attendanceRate) {
        const rate = Math.round(data.attendance_rate || 0);
        animateNumber(attendanceRate, rate, 1000, 0, '%');
    }
    if (upcomingAssessments) animateNumber(upcomingAssessments, data.upcoming_assessments || 0);
    if (todaysClasses) animateNumber(todaysClasses, data.todays_classes || 0);
    if (pendingBanner) pendingBanner.textContent = data.pending_assignments || 0;
    if (todaysBanner) todaysBanner.textContent = data.todays_classes || 0;

    renderCourses(data.courses || []);
    renderTodaySchedule(data.todays_schedule || []);
    renderRecentGrades(data.recent_grades || []);
    renderPendingAssignments(data.pending_assignments_list || []);
    renderAnnouncements(data.recent_announcements || []);
    updateCharts(data);
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
 * Render today's schedule
 */
function renderTodaySchedule(schedule) {
    const container = document.getElementById('todaySchedule');
    if (!container) return;

    if (!schedule.length) {
        container.innerHTML = `
            <div style="padding:1.5rem;text-align:center;color:#6b7280;">
                <i class="fas fa-moon" style="font-size:2rem;margin-bottom:.5rem;display:block;"></i>
                <p>No classes scheduled for today</p>
            </div>`;
        return;
    }

    container.innerHTML = schedule.map(cls => `
        <div style="display:flex;align-items:center;gap:1rem;padding:.875rem 1.25rem;border-bottom:1px solid #f3f4f6;">
            <div style="min-width:70px;text-align:center;">
                <div style="font-weight:600;font-size:.9rem;color:var(--primary-color)">${formatTime(cls.start_time)}</div>
                <div style="font-size:.75rem;color:#9ca3af">${calcDuration(cls.start_time, cls.end_time)}</div>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(cls.subject_name)}</div>
                <div style="font-size:.8rem;color:#6b7280;">${escapeHtml(cls.class_name)} &bull; ${escapeHtml(cls.teacher_name)}</div>
            </div>
            ${cls.room ? `<span style="font-size:.75rem;background:#f3f4f6;padding:.2rem .6rem;border-radius:99px;color:#374151;">${escapeHtml(cls.room)}</span>` : ''}
        </div>`).join('');
}

/**
 * Render recent grades
 */
function renderRecentGrades(grades) {
    const container = document.getElementById('recentGrades');
    if (!container) return;

    if (!grades.length) {
        container.innerHTML = `
            <div style="padding:1.5rem;text-align:center;color:#6b7280;">
                <i class="fas fa-star" style="font-size:2rem;margin-bottom:.5rem;display:block;"></i>
                <p>No graded work yet</p>
            </div>`;
        return;
    }

    container.innerHTML = grades.map(g => {
        const pct = Math.round(g.percentage || 0);
        const letter = pctToGrade(pct);
        const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
        return `
        <div class="grade-item" style="display:flex;align-items:center;gap:1rem;padding:.875rem 1.25rem;border-bottom:1px solid #f3f4f6;">
            <div style="min-width:48px;height:48px;border-radius:50%;background:${color}22;display:flex;align-items:center;justify-content:center;flex-direction:column;">
                <span style="font-weight:700;font-size:.85rem;color:${color}">${letter}</span>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(g.assignment_title)}</div>
                <div style="font-size:.8rem;color:#6b7280;">${escapeHtml(g.subject_name || '')}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:700;color:${color}">${pct}%</div>
                <div style="font-size:.75rem;color:#9ca3af;">${g.score}/${g.max_score}</div>
            </div>
        </div>`;
    }).join('');
}

/**
 * Render pending assignments list
 */
function renderPendingAssignments(assignments) {
    const container = document.getElementById('pendingAssignmentsList');
    if (!container) return;

    if (!assignments.length) {
        container.innerHTML = `
            <div style="padding:1.5rem;text-align:center;color:#6b7280;">
                <i class="fas fa-check-circle" style="font-size:2rem;margin-bottom:.5rem;display:block;color:#10b981;"></i>
                <p>All caught up!</p>
            </div>`;
        return;
    }

    container.innerHTML = assignments.map(a => {
        const due = new Date(a.due_date);
        const now = new Date();
        const diffDays = Math.ceil((due - now) / 86400000);
        const urgent = diffDays <= 2;
        const tagColor = urgent ? '#ef4444' : diffDays <= 5 ? '#f59e0b' : '#6b7280';
        const dueLabel = diffDays === 0 ? 'Due today' : diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`;
        return `
        <div style="display:flex;align-items:center;gap:1rem;padding:.875rem 1.25rem;border-bottom:1px solid #f3f4f6;">
            <div style="min-width:40px;height:40px;border-radius:50%;background:${tagColor}22;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fas fa-${urgent ? 'exclamation' : 'file-alt'}" style="color:${tagColor};font-size:.9rem;"></i>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(a.assignment_title)}</div>
                <div style="font-size:.8rem;color:#6b7280;">${escapeHtml(a.subject_name || '')}</div>
            </div>
            <span style="font-size:.75rem;font-weight:600;color:${tagColor};white-space:nowrap;">
                <i class="fas fa-clock"></i> ${dueLabel}
            </span>
        </div>`;
    }).join('');
}

/**
 * Render enrolled courses
 */
function renderCourses(courses) {
    const container = document.getElementById('coursesGrid');
    if (!container) return;

    if (!courses.length) {
        container.innerHTML = `<div style="color:var(--text-secondary);padding:.5rem 0">Not enrolled in any courses yet.</div>`;
        return;
    }

    const colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];
    const icons = ['fa-calculator','fa-atom','fa-flask','fa-book','fa-globe','fa-music'];

    container.innerHTML = courses.map((c, i) => {
        const imgSrc = c.image || '../assets/img/ghana-education-service.png';
        const progress = c.progress_percentage || 0;
        return `
        <div class="course-card">
            <div class="course-header" style="background:#f8f9fa;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(c.subject_name || 'Course')}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='../assets/img/ghana-education-service.png'">
            </div>
            <div class="course-body">
                <h4>${escapeHtml(c.subject_name)}</h4>
                <p>${escapeHtml(c.teacher_name || 'No teacher assigned')}</p>
                <div class="course-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width:${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}% Complete</span>
                </div>
            </div>
            <div class="course-footer">
                <button class="btn btn-sm btn-outline">Continue Learning</button>
            </div>
        </div>`;
    }).join('');
}

/**
 * Render recent announcements
 */
function renderAnnouncements(announcements) {
    const container = document.getElementById('recentAnnouncements');
    if (!container) return;

    if (!announcements.length) {
        container.innerHTML = `
            <div style="padding:1.5rem;text-align:center;color:#6b7280;">
                <i class="fas fa-bullhorn" style="font-size:2rem;margin-bottom:.5rem;display:block;"></i>
                <p>No announcements</p>
            </div>`;
        return;
    }

    const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

    container.innerHTML = announcements.map(a => {
        const color = priorityColor[a.priority] || '#6b7280';
        return `
        <div style="display:flex;gap:.75rem;padding:.875rem 1.25rem;border-bottom:1px solid #f3f4f6;align-items:flex-start;">
            <div style="width:8px;height:8px;border-radius:50%;background:${color};margin-top:.4rem;flex-shrink:0;"></div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:.9rem;">${escapeHtml(a.title)}</div>
                <div style="font-size:.8rem;color:#6b7280;margin:.2rem 0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${escapeHtml(a.content || '')}</div>
                <div style="font-size:.75rem;color:#9ca3af;">${timeAgo(a.published_at)}</div>
            </div>
        </div>`;
    }).join('');
}

/**
 * Initialise Chart.js instances
 */
function initCharts() {
    const trendCtx = document.getElementById('gradeTrendChart');
    if (!trendCtx) return;

    gradeTrendChart = new Chart(trendCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Average Score (%)', data: [], backgroundColor: 'rgba(59,130,246,.7)', borderColor: 'rgba(59,130,246,1)', borderWidth: 1, borderRadius: 6 }] },
        options: {
            responsive: true,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)}%` } } },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(0,0,0,.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * Update charts with new data
 */
function updateCharts(data) {
    if (gradeTrendChart && data.grade_trend) {
        gradeTrendChart.data.labels = data.grade_trend.labels || [];
        gradeTrendChart.data.datasets[0].data = data.grade_trend.data || [];
        gradeTrendChart.update();
    }
}

/* ---- Helper utilities ---- */

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function calcDuration(start, end) {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return '';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60), r = mins % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
}

function pctToGrade(pct) {
    if (pct >= 75) return 'A1';
    if (pct >= 70) return 'B2';
    if (pct >= 65) return 'B3';
    if (pct >= 60) return 'C4';
    if (pct >= 55) return 'C5';
    if (pct >= 50) return 'C6';
    if (pct >= 45) return 'D7';
    if (pct >= 40) return 'E8';
    return 'F9';
}

/**
 * Refresh dashboard data
 */
function refreshDashboard() {
    loadDashboardData();
}

// Auto-refresh every 5 minutes
setInterval(refreshDashboard, 5 * 60 * 1000);
