/* ============================================
   Teacher Dashboard Logic
============================================ */

let classPerformanceChart = null;
let attendanceTrendChart  = null;
let teacherNotificationPollTimer = null;

const TEACHER_NOTIFICATION_POLL_MS = 30000;

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    // Require authentication and teacher role
    if (!Auth.requireAuth([USER_ROLES.TEACHER])) {
        return; // Will redirect to login if not authenticated
    }

    initDashboard();
    setupEventListeners();
    loadDashboardData();
    startTeacherNotificationPolling();
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
        const teacherName = document.getElementById('teacherName');
        const userAvatar = document.getElementById('userAvatar');

        const displayName = Auth.getUserDisplayName();
        const initials = Auth.getUserInitials();

        const avatarImg = document.getElementById('userAvatarImg');
        if (userInitials) userInitials.textContent = initials;
        if (userName) userName.textContent = displayName;
        if (teacherName) teacherName.textContent = displayName;
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
            const page = item.dataset.page;
            if (page) {
                window.location.hash = `#${page}`;
            }
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

    // Quick action buttons
    const btnAttendance = document.getElementById('quickTakeAttendance');
    const btnGrade      = document.getElementById('quickGradeAssignment');
    const btnCreate     = document.getElementById('quickCreateAssignment');
    const btnSchedule   = document.getElementById('quickViewSchedule');
    if (btnAttendance) btnAttendance.addEventListener('click', () => { window.location.hash = '#attendance'; });
    if (btnGrade)      btnGrade.addEventListener('click',      () => { window.location.hash = '#assignments'; });
    if (btnCreate)     btnCreate.addEventListener('click',     () => { window.location.hash = '#assignments'; });
    if (btnSchedule)   btnSchedule.addEventListener('click',  () => { window.location.hash = '#timetable'; });

    // Dropdowns
    const notificationBtn = document.getElementById('notificationBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');

    if (notificationBtn) {
        notificationBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            toggleDropdown(notificationBtn.closest('.dropdown'));
            const parent = notificationBtn.closest('.dropdown');
            if (parent && parent.classList.contains('active')) {
                await refreshTeacherNotificationState(true);
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

    const markAllReadBtn = document.getElementById('teacherMarkAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            try {
                await NotificationAPI.markAllAsRead();
                showToast('All notifications marked as read', 'success');
                await loadTeacherNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark notifications as read', error);
                showToast('Failed to mark all as read', 'error');
            }
        });
    }

    document.querySelectorAll('.notification-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTeacherNotificationTab(btn.getAttribute('data-tab') || 'notifications');
        });
    });

    document.querySelectorAll('.teacher-open-tab-link').forEach(link => {
        link.addEventListener('click', () => {
            const tab = link.getAttribute('data-tab') || 'notifications';
            setTeacherFooterActive(tab);
        });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopTeacherNotificationPolling();
        } else {
            startTeacherNotificationPolling();
        }
    });

    window.addEventListener('beforeunload', stopTeacherNotificationPolling);
}

function startTeacherNotificationPolling() {
    stopTeacherNotificationPolling();
    teacherNotificationPollTimer = setInterval(() => {
        if (!document.hidden) {
            refreshTeacherNotificationState(false);
        }
    }, TEACHER_NOTIFICATION_POLL_MS);

    refreshTeacherNotificationState(false);
}

function stopTeacherNotificationPolling() {
    if (teacherNotificationPollTimer) {
        clearInterval(teacherNotificationPollTimer);
        teacherNotificationPollTimer = null;
    }
}

async function refreshTeacherNotificationState(forceDropdownLoad = false) {
    const bell = document.getElementById('notificationBtn');
    const dropdown = bell ? bell.closest('.dropdown') : null;
    const isOpen = !!dropdown && dropdown.classList.contains('active');

    if (forceDropdownLoad || isOpen) {
        await loadTeacherNotificationsDropdown();
        return;
    }

    await refreshTeacherNotificationSummary();
}

async function refreshTeacherNotificationSummary() {
    try {
        const [summaryResponse, chatResponse] = await Promise.all([
            NotificationAPI.getSummary().catch(() => null),
            ChatAPI.getUnreadMessages().catch(() => null),
        ]);

        const summaryData = summaryResponse?.data || summaryResponse || {};
        const chatData = chatResponse?.data || chatResponse || {};

        const notificationUnread = Number(summaryData.total_unread ?? summaryData.notifications_unread ?? 0);
        const messageUnread = Number(summaryData.messages_unread ?? 0) + Number(chatData.unread_count ?? 0);

        updateTeacherNotificationCounts(notificationUnread, messageUnread);
        updateTeacherNotificationBadge(notificationUnread + messageUnread);
    } catch (error) {
        console.error('Failed to refresh teacher notification summary', error);
    }
}

async function loadTeacherNotificationsDropdown() {
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

        renderTeacherNotifications(unreadOtherNotifs);
        renderTeacherMessages(allMessages);

        updateTeacherNotificationCounts(unreadOtherNotifs.length, allMessages.length);
        updateTeacherNotificationBadge(unreadOtherNotifs.length + allMessages.length);
    } catch (error) {
        console.error('Failed to load teacher notifications dropdown', error);
        showToast('Failed to load notifications', 'error');
    }
}

function updateTeacherNotificationCounts(notificationCount, messageCount) {
    const notifCountNode = document.getElementById('teacherNotifCount');
    const msgCountNode = document.getElementById('teacherMsgCount');

    if (notifCountNode) notifCountNode.textContent = String(Number(notificationCount) || 0);
    if (msgCountNode) msgCountNode.textContent = String(Number(messageCount) || 0);
}

function updateTeacherNotificationBadge(totalUnread) {
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

function teacherEsc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

function renderTeacherNotifications(notifications) {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (!notifications || notifications.length === 0) {
        list.innerHTML = '<p class="no-notifications" style="padding: 0.75rem; color: #6b7280;">No unread notifications</p>';
        return;
    }

    list.innerHTML = notifications.map(item => `
        <div class="dropdown-item teacher-notif-item" data-uuid="${teacherEsc(item.uuid || item.id || '')}" style="display: block; border-bottom: 1px solid #f3f4f6;">
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${teacherEsc(item.title || 'Notification')}</div>
            <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 0.35rem;">${teacherEsc(item.message || '')}</div>
            ${item.link ? `<a href="${teacherEsc(item.link)}" class="teacher-open-link" style="font-size: 0.8rem;">View details</a>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                <small style="color: #9ca3af;">${teacherEsc(item.created_at || '')}</small>
                <button class="btn-action teacher-mark-read" title="Mark as read" style="border: 0; background: transparent; cursor: pointer; color: #059669;">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.teacher-mark-read').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const item = btn.closest('.teacher-notif-item');
            const uuid = item?.getAttribute('data-uuid');
            if (!uuid) return;

            try {
                await NotificationAPI.markAsRead(uuid);
                await loadTeacherNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark notification as read', error);
                showToast('Failed to mark as read', 'error');
            }
        });
    });
}

function renderTeacherMessages(messages) {
    const list = document.getElementById('messagesList');
    if (!list) return;

    if (!messages || messages.length === 0) {
        list.innerHTML = '<p class="no-notifications" style="padding: 0.75rem; color: #6b7280;">No unread messages</p>';
        return;
    }

    list.innerHTML = messages.map(item => {
        const isChat = item.notification_type === 'chat_message' || item.is_chat === true;
        const title = isChat
            ? `Chat: ${teacherEsc(item.room_name || 'Room')} - ${teacherEsc(item.sender_name || 'User')}`
            : teacherEsc(item.title || 'Message');
        const body = isChat
            ? teacherEsc((item.message_text || '').slice(0, 100))
            : teacherEsc(item.message || '');
        const action = isChat
            ? `<a href="#messages" class="teacher-open-chat" style="font-size: 0.8rem;">Open chat</a>`
            : `<button class="btn-action teacher-mark-read-msg" title="Mark as read" style="border: 0; background: transparent; cursor: pointer; color: #059669;"><i class="fas fa-check"></i></button>`;

        return `
            <div class="dropdown-item teacher-message-item ${isChat ? 'teacher-chat-item' : ''}" data-uuid="${teacherEsc(item.uuid || item.id || '')}" style="display: block; border-bottom: 1px solid #f3f4f6;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${title}</div>
                <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 0.35rem;">${body}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <small style="color: #9ca3af;">${teacherEsc(item.created_at || '')}</small>
                    ${action}
                </div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.teacher-mark-read-msg').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const item = btn.closest('.teacher-message-item');
            const uuid = item?.getAttribute('data-uuid');
            if (!uuid) return;

            try {
                await NotificationAPI.markAsRead(uuid);
                await loadTeacherNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark message as read', error);
                showToast('Failed to mark as read', 'error');
            }
        });
    });

    list.querySelectorAll('.teacher-open-chat').forEach(link => {
        link.addEventListener('click', () => {
            setTeacherFooterActive('messages');
        });
    });
}

function switchTeacherNotificationTab(tabName) {
    const notifTab = document.getElementById('teacherNotificationsTab');
    const msgTab = document.getElementById('teacherMessagesTab');
    const notifBtn = document.getElementById('teacherNotifTabBtn');
    const msgBtn = document.getElementById('teacherMsgTabBtn');

    const showMessages = tabName === 'messages';

    if (notifTab) notifTab.style.display = showMessages ? 'none' : 'block';
    if (msgTab) msgTab.style.display = showMessages ? 'block' : 'none';
    if (notifBtn) notifBtn.classList.toggle('active', !showMessages);
    if (msgBtn) msgBtn.classList.toggle('active', showMessages);

    setTeacherFooterActive(tabName);
}

function setTeacherFooterActive(tabName) {
    const notifLink = document.getElementById('teacherViewAllNotifications');
    const msgLink = document.getElementById('teacherViewAllMessages');
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
        const response = await DashboardAPI.getTeacherStats();

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
    const fields = {
        myCourses:           data.total_courses,
        myStudents:          data.total_students,
        activeAssignments:   data.active_assignments,
        pendingGrades:       data.pending_grades,
    };

    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el && value != null) animateNumber(el, value);
    });

    // Attendance rate (weekly)
    const attendanceRateEl = document.getElementById('attendanceRate');
    if (attendanceRateEl && data.attendance_rate != null) {
        attendanceRateEl.textContent = data.attendance_rate + '%';
    }
    updateAttendanceChange('attendanceChange', data.attendance_rate_today, data.attendance_rate);

    // Upcoming assessments
    const upcomingEl = document.getElementById('upcomingAssessments');
    if (upcomingEl && data.upcoming_assessments != null) {
        animateNumber(upcomingEl, data.upcoming_assessments);
    }

    // Today's classes
    const todaysEl = document.getElementById('todaysClasses');
    if (todaysEl && data.todays_classes != null) {
        animateNumber(todaysEl, data.todays_classes);
    }
    // Banner
    const todaysBanner = document.getElementById('todaysClassesBanner');
    if (todaysBanner && data.todays_classes != null) {
        todaysBanner.textContent = data.todays_classes;
    }

    // Welcome banner pending submissions count
    const pendingSubmissions = document.getElementById('pendingSubmissions');
    if (pendingSubmissions && data.pending_submissions != null) {
        pendingSubmissions.textContent = data.pending_submissions;
    }

    // Today's schedule
    renderTodaySchedule(data.todays_schedule || []);

    // Recent submissions list
    if (data.recent_submissions) {
        renderRecentSubmissions(data.recent_submissions);
    }

    // Courses grid
    if (data.courses) {
        renderCourses(data.courses);
    }

    // Charts
    updateCharts(data);
}

/**
 * Render today's schedule list
 */
function renderTodaySchedule(schedule) {
    const container = document.getElementById('todaySchedule');
    if (!container) return;

    if (!schedule || schedule.length === 0) {
        container.innerHTML = `
            <div style="padding:1.5rem;text-align:center;color:#6b7280;">
                <i class="fas fa-calendar-day" style="font-size:2rem;margin-bottom:.5rem;display:block;"></i>
                <p>No classes scheduled for today</p>
            </div>`;
        return;
    }

    container.innerHTML = schedule.map(item => {
        const start = formatTime(item.start_time);
        const duration = item.start_time && item.end_time ? calcDuration(item.start_time, item.end_time) : '';
        const name = escapeHtml(item.subject_name || item.subject_code || 'Class');
        const cls  = escapeHtml(item.class_name || item.class_code || '');
        const room = item.room ? `<p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.room)}</p>` : '';
        return `
            <div class="schedule-item">
                <div class="schedule-time">
                    <span class="time">${start}</span>
                    ${duration ? `<span class="duration">${duration}</span>` : ''}
                </div>
                <div class="schedule-content">
                    <h4>${name}${cls ? ` <small style="font-weight:400;color:#6b7280;">(${cls})</small>` : ''}</h4>
                    ${room}
                </div>
            </div>`;
    }).join('');
}

/** Format HH:MM:SS to 12-hour time */
function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2,'0')} ${ampm}`;
}

/** Calculate duration string from HH:MM:SS strings */
function calcDuration(startStr, endStr) {
    const toMin = s => { const [h,m] = s.split(':').map(Number); return h*60+m; };
    const diff = toMin(endStr) - toMin(startStr);
    if (diff <= 0) return '';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
}

/**
 * Render recent (ungraded) submissions list
 */
function renderRecentSubmissions(submissions) {
    const container = document.getElementById('recentSubmissions');
    if (!container) return;

    if (!submissions || submissions.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:1.5rem;text-align:center;color:#6b7280;">
                <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:.5rem;"></i>
                <p>No pending submissions</p>
            </div>`;
        return;
    }

    container.innerHTML = submissions.map(sub => {
        const name    = sub.student_name || 'Student';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const title   = sub.assignment_title || 'Assignment';
        const when    = sub.submitted_at ? timeAgo(sub.submitted_at) : '';
        return `
            <div class="submission-item">
                <div class="submission-avatar"><span>${initials}</span></div>
                <div class="submission-details">
                    <strong>${escapeHtml(name)}</strong>
                    <p>Assignment: ${escapeHtml(title)}</p>
                    <small>${when}</small>
                </div>
                <a href="#assignments" class="btn btn-sm btn-primary">Grade</a>
            </div>`;
    }).join('');
}

/**
 * Show attendance change badge (today's rate as sub-label, weekly rate as main value)
 */
function updateAttendanceChange(elementId, todayRate, weeklyRate) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const today = todayRate != null ? todayRate : 0;
    let cls = 'neutral';
    if (today >= 75) cls = 'positive';
    else if (today < 50) cls = 'negative';

    el.className = `stat-change ${cls}`;
    el.innerHTML = `<i class="fas fa-${today >= 75 ? 'arrow-up' : today < 50 ? 'arrow-down' : 'minus'}"></i> <span>Today ${today}%</span>`;
}

/**
 * Simple HTML escape
 */
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/**
 * Format a datetime string as relative time ("2 minutes ago")
 */
function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)    return `${diff} second${diff !== 1 ? 's' : ''} ago`;
    if (diff < 3600)  { const m = Math.floor(diff/60);  return `${m} minute${m !== 1 ? 's' : ''} ago`; }
    if (diff < 86400) { const h = Math.floor(diff/3600); return `${h} hour${h !== 1 ? 's' : ''} ago`; }
    const d = Math.floor(diff/86400);
    return `${d} day${d !== 1 ? 's' : ''} ago`;
}

/**
 * Animate number counting up
 */
function animateNumber(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16);
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
 * Refresh dashboard data
 */
function refreshDashboard() {
    loadDashboardData();
}

// Auto-refresh every 5 minutes
setInterval(refreshDashboard, 5 * 60 * 1000);

/**
 * Generate rolling 12-month labels (oldest → newest).
 * Prior-year months shown as "Apr '25", current-year as "Mar".
 */
function getLast12MonthLabels() {
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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
 * Initialize chart canvases
 */
function initCharts() {
    // Class Performance — bar chart (avg assignment score per Subject)
    const perfCtx = document.getElementById('classPerformanceChart');
    if (perfCtx) {
        classPerformanceChart = new Chart(perfCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Avg Score (%)',
                    data: [],
                    backgroundColor: 'rgba(0, 106, 63, 0.75)',
                    borderColor: '#006a3f',
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100,
                         ticks: { callback: v => v + '%' } }
                }
            }
        });
    }

    // Attendance Trends — line chart (monthly %)
    const atCtx = document.getElementById('attendanceTrendChart');
    if (atCtx) {
        attendanceTrendChart = new Chart(atCtx, {
            type: 'line',
            data: {
                labels: getLast12MonthLabels(),
                datasets: [{
                    label: 'Attendance %',
                    data: [],
                    borderColor: '#3090cf',
                    backgroundColor: 'rgba(48, 144, 207, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100,
                         ticks: { callback: v => v + '%' } }
                }
            }
        });
    }
}

/**
 * Update charts with API data
 */
function updateCharts(data) {
    if (classPerformanceChart && data.class_performance) {
        classPerformanceChart.data.labels   = data.class_performance.labels || [];
        classPerformanceChart.data.datasets[0].data = data.class_performance.data || [];
        classPerformanceChart.update();
    }

    if (attendanceTrendChart && data.attendance_trend) {
        attendanceTrendChart.data.labels = getLast12MonthLabels();
        attendanceTrendChart.data.datasets[0].data = data.attendance_trend;
        attendanceTrendChart.update();
    }
}

/**
 * Render My Courses grid from API data
 */
function renderCourses(courses) {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    if (!courses || courses.length === 0) {
        grid.innerHTML = '<div style="color:var(--text-secondary);padding:.5rem 0">No subjects assigned.</div>';
        return;
    }

    const colors = ['bg-primary','bg-success','bg-warning','bg-danger','bg-info'];
    const icons  = ['fa-book','fa-atom','fa-calculator','fa-flask','fa-globe'];

    grid.innerHTML = courses.map((c, i) => {
        const imgSrc = c.image || '../assets/img/ghana-education-service.png';
        return `
        <div class="course-card">
            <div class="course-header" style="background:#f8f9fa;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(c.subject_name || 'Subject')}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='../assets/img/ghana-education-service.png'">
            </div>
            <div class="course-body">
                <h4>${escapeHtml(c.subject_name || c.course_name || 'Subject')}</h4>
                <p>${escapeHtml(c.class_name || '')}</p>
                <div class="course-stats">
                    <span><i class="fas fa-users"></i> ${c.enrolled_students || 0} students</span>
                </div>
            </div>
            <div class="course-footer">
                <a href="#my-classes" class="btn btn-sm btn-outline">View Class</a>
            </div>
        </div>`;
    }).join('');
}

