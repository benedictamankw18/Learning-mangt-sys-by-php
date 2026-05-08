/* ============================================
   Parent Dashboard Logic
============================================ */

let performanceChart = null;
let cachedChildrenData = [];
let parentNotificationPollTimer = null;

const PARENT_NOTIFICATION_POLL_MS = 30000;

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    // Require authentication and parent role
    if (!Auth.requireAuth([USER_ROLES.PARENT])) {
        return; // Will redirect to login if not authenticated
    }

    initDashboard();
    setupEventListeners();
    loadDashboardData();
    startParentNotificationPolling();
});

/**
 * Initialize dashboard components
 */
function initDashboard() {
    const user = Auth.getUser();
    if (user) {
        const userInitials = document.getElementById('userInitials');
        const userName     = document.getElementById('userName');
        const parentName   = document.getElementById('parentName');
        const userAvatar   = document.getElementById('userAvatar');
        const avatarImg    = document.getElementById('userAvatarImg');

        const displayName = Auth.getUserDisplayName();
        const initials    = Auth.getUserInitials();

        if (userInitials) userInitials.textContent = initials;
        if (userName)     userName.textContent = displayName;
        if (parentName)   parentName.textContent = displayName;

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
        notificationBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            toggleDropdown(notificationBtn.closest('.dropdown'));
            const parent = notificationBtn.closest('.dropdown');
            if (parent && parent.classList.contains('active')) {
                await refreshParentNotificationState(true);
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

    const markAllReadBtn = document.getElementById('parentMarkAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            try {
                await NotificationAPI.markAllAsRead();
                showToast('All notifications marked as read', 'success');
                await loadParentNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark notifications as read', error);
                showToast('Failed to mark all as read', 'error');
            }
        });
    }

    document.querySelectorAll('.notification-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchParentNotificationTab(btn.getAttribute('data-tab') || 'notifications');
        });
    });

    document.querySelectorAll('.parent-open-tab-link').forEach(link => {
        link.addEventListener('click', () => {
            const tab = link.getAttribute('data-tab') || 'notifications';
            setParentFooterActive(tab);
        });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopParentNotificationPolling();
        } else {
            startParentNotificationPolling();
        }
    });

    window.addEventListener('beforeunload', stopParentNotificationPolling);
}

function startParentNotificationPolling() {
    stopParentNotificationPolling();
    parentNotificationPollTimer = setInterval(() => {
        if (!document.hidden) {
            refreshParentNotificationState(false);
        }
    }, PARENT_NOTIFICATION_POLL_MS);

    refreshParentNotificationState(false);
}

function stopParentNotificationPolling() {
    if (parentNotificationPollTimer) {
        clearInterval(parentNotificationPollTimer);
        parentNotificationPollTimer = null;
    }
}

async function refreshParentNotificationState(forceDropdownLoad = false) {
    const bell = document.getElementById('notificationBtn');
    const dropdown = bell ? bell.closest('.dropdown') : null;
    const isOpen = !!dropdown && dropdown.classList.contains('active');

    if (forceDropdownLoad || isOpen) {
        await loadParentNotificationsDropdown();
        return;
    }

    await refreshParentNotificationSummary();
}

async function refreshParentNotificationSummary() {
    try {
        const [summaryResponse, chatResponse] = await Promise.all([
            NotificationAPI.getSummary().catch(() => null),
            ChatAPI.getUnreadMessages().catch(() => null),
        ]);

        const summaryData = summaryResponse?.data || summaryResponse || {};
        const chatData = chatResponse?.data || chatResponse || {};

        const notificationUnread = Number(summaryData.total_unread ?? summaryData.notifications_unread ?? 0);
        const messageUnread = Number(summaryData.messages_unread ?? 0) + Number(chatData.unread_count ?? 0);

        updateParentNotificationCounts(notificationUnread, messageUnread);
        updateParentNotificationBadge(notificationUnread + messageUnread);
    } catch (error) {
        console.error('Failed to refresh parent notification summary', error);
    }
}

async function loadParentNotificationsDropdown() {
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

        renderParentNotifications(unreadOtherNotifs);
        renderParentMessages(allMessages);

        updateParentNotificationCounts(unreadOtherNotifs.length, allMessages.length);
        updateParentNotificationBadge(unreadOtherNotifs.length + allMessages.length);
    } catch (error) {
        console.error('Failed to load parent notifications dropdown', error);
        showToast('Failed to load notifications', 'error');
    }
}

function updateParentNotificationCounts(notificationCount, messageCount) {
    const notifCountNode = document.getElementById('parentNotifCount');
    const msgCountNode = document.getElementById('parentMsgCount');

    if (notifCountNode) notifCountNode.textContent = String(Number(notificationCount) || 0);
    if (msgCountNode) msgCountNode.textContent = String(Number(messageCount) || 0);
}

function updateParentNotificationBadge(totalUnread) {
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

function parentEsc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

function renderParentNotifications(notifications) {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (!notifications || notifications.length === 0) {
        list.innerHTML = '<p class="no-notifications" style="padding: 0.75rem; color: #6b7280;">No unread notifications</p>';
        return;
    }

    list.innerHTML = notifications.map(item => `
        <div class="dropdown-item parent-notif-item" data-uuid="${parentEsc(item.uuid || item.id || '')}" style="display: block; border-bottom: 1px solid #f3f4f6;">
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${parentEsc(item.title || 'Notification')}</div>
            <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 0.35rem;">${parentEsc(item.message || '')}</div>
            ${item.link ? `<a href="${parentEsc(item.link)}" class="parent-open-link" style="font-size: 0.8rem;">View details</a>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                <small style="color: #9ca3af;">${parentEsc(item.created_at || '')}</small>
                <button class="btn-action parent-mark-read" title="Mark as read" style="border: 0; background: transparent; cursor: pointer; color: #059669;">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.parent-mark-read').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const item = btn.closest('.parent-notif-item');
            const uuid = item?.getAttribute('data-uuid');
            if (!uuid) return;

            try {
                await NotificationAPI.markAsRead(uuid);
                await loadParentNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark notification as read', error);
                showToast('Failed to mark as read', 'error');
            }
        });
    });
}

function renderParentMessages(messages) {
    const list = document.getElementById('messagesList');
    if (!list) return;

    if (!messages || messages.length === 0) {
        list.innerHTML = '<p class="no-notifications" style="padding: 0.75rem; color: #6b7280;">No unread messages</p>';
        return;
    }

    list.innerHTML = messages.map(item => {
        const isChat = item.notification_type === 'chat_message' || item.is_chat === true;
        const title = isChat
            ? `Chat: ${parentEsc(item.room_name || 'Room')} - ${parentEsc(item.sender_name || 'User')}`
            : parentEsc(item.title || 'Message');
        const body = isChat
            ? parentEsc((item.message_text || '').slice(0, 100))
            : parentEsc(item.message || '');
        const action = isChat
            ? '<a href="#messages" class="parent-open-chat" style="font-size: 0.8rem;">Open chat</a>'
            : '<button class="btn-action parent-mark-read-msg" title="Mark as read" style="border: 0; background: transparent; cursor: pointer; color: #059669;"><i class="fas fa-check"></i></button>';

        return `
            <div class="dropdown-item parent-message-item ${isChat ? 'parent-chat-item' : ''}" data-uuid="${parentEsc(item.uuid || item.id || '')}" style="display: block; border-bottom: 1px solid #f3f4f6;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${title}</div>
                <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 0.35rem;">${body}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <small style="color: #9ca3af;">${parentEsc(item.created_at || '')}</small>
                    ${action}
                </div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.parent-mark-read-msg').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const item = btn.closest('.parent-message-item');
            const uuid = item?.getAttribute('data-uuid');
            if (!uuid) return;

            try {
                await NotificationAPI.markAsRead(uuid);
                await loadParentNotificationsDropdown();
            } catch (error) {
                console.error('Failed to mark message as read', error);
                showToast('Failed to mark as read', 'error');
            }
        });
    });

    list.querySelectorAll('.parent-open-chat').forEach(link => {
        link.addEventListener('click', () => {
            setParentFooterActive('messages');
        });
    });
}

function switchParentNotificationTab(tabName) {
    const notifTab = document.getElementById('parentNotificationsTab');
    const msgTab = document.getElementById('parentMessagesTab');
    const notifBtn = document.getElementById('parentNotifTabBtn');
    const msgBtn = document.getElementById('parentMsgTabBtn');

    const showMessages = tabName === 'messages';

    if (notifTab) notifTab.style.display = showMessages ? 'none' : 'block';
    if (msgTab) msgTab.style.display = showMessages ? 'block' : 'none';
    if (notifBtn) notifBtn.classList.toggle('active', !showMessages);
    if (msgBtn) msgBtn.classList.toggle('active', showMessages);

    setParentFooterActive(tabName);
}

function setParentFooterActive(tabName) {
    const notifLink = document.getElementById('parentViewAllNotifications');
    const msgLink = document.getElementById('parentViewAllMessages');
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
 * Handle child selection change — update chart and stat cards from cached data
 */
function handleChildChange(event) {
    const childId = event.target.value;
    if (childId === 'all') {
        // Restore combined stats
        const totalAtt   = cachedChildrenData.reduce((s, c) => s + (c.attendance_rate || 0), 0);
        const avgAtt     = cachedChildrenData.length ? Math.round(totalAtt / cachedChildrenData.length) : 0;
        const totalUp    = cachedChildrenData.reduce((s, c) => s + (c.upcoming_assessments || 0), 0);
        const totalCours = cachedChildrenData.reduce((s, c) => s + (c.enrolled_courses || 0), 0);

        const elAvgAtt  = document.getElementById('avgAttendance');
        const elUp      = document.getElementById('totalUpcoming');
        const elCourses = document.getElementById('totalCourses');
        const elAttBan  = document.getElementById('avgAttendanceBanner');

        if (elAvgAtt)  animateNumber(elAvgAtt, avgAtt, 600, 0, '%');
        if (elAttBan)  elAttBan.textContent = avgAtt + '%';
        if (elUp)      animateNumber(elUp, totalUp, 600);
        if (elCourses) animateNumber(elCourses, totalCours, 600);

        updateCharts({ children_data: cachedChildrenData }, 'all');
    } else {
        const child = cachedChildrenData.find(c => String(c.student_id) === String(childId));
        if (!child) return;

        const att     = child.attendance_rate != null ? Math.round(child.attendance_rate) : 0;
        const upcoming = child.upcoming_assessments || 0;
        const courses  = child.enrolled_courses || 0;

        const elAvgAtt  = document.getElementById('avgAttendance');
        const elUp      = document.getElementById('totalUpcoming');
        const elCourses = document.getElementById('totalCourses');
        const elAttBan  = document.getElementById('avgAttendanceBanner');

        if (elAvgAtt)  animateNumber(elAvgAtt, att, 600, 0, '%');
        if (elAttBan)  elAttBan.textContent = att + '%';
        if (elUp)      animateNumber(elUp, upcoming, 600);
        if (elCourses) animateNumber(elCourses, courses, 600);

        updateCharts({ children_data: cachedChildrenData }, childId);
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
        const response = await DashboardAPI.getParentStats();

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
 * Update all dashboard widgets from API data
 */
function updateStatistics(data) {
    cachedChildrenData = data.children_data || [];

    // Stat cards
    const elTotalChildren = document.getElementById('totalChildren');
    const elAvgAttendance = document.getElementById('avgAttendance');
    const elTotalUpcoming = document.getElementById('totalUpcoming');
    const elTotalCourses  = document.getElementById('totalCourses');
    const elPendingFee    = document.getElementById('pendingFeeStatus');
    const elPendingDetail = document.getElementById('pendingFeeDetail');
    const elTotalBanner   = document.getElementById('totalChildrenBanner');
    const elAttBanner     = document.getElementById('avgAttendanceBanner');

    if (elTotalChildren) animateNumber(elTotalChildren, data.total_children || 0);
    if (elTotalBanner)   elTotalBanner.textContent = data.total_children || 0;
    if (elAvgAttendance) animateNumber(elAvgAttendance, Math.round(data.avg_attendance || 0), 1000, 0, '%');
    if (elAttBanner)     elAttBanner.textContent = Math.round(data.avg_attendance || 0) + '%';

    const totalUpcoming = cachedChildrenData.reduce((s, c) => s + (c.upcoming_assessments || 0), 0);
    const totalCourses  = cachedChildrenData.reduce((s, c) => s + (c.enrolled_courses || 0), 0);
    if (elTotalUpcoming) animateNumber(elTotalUpcoming, totalUpcoming);
    if (elTotalCourses)  animateNumber(elTotalCourses, totalCourses);

    const feeStatus = data.pending_fee_status || {};
    if (elPendingFee) {
        elPendingFee.textContent = feeStatus.label || 'N/A';
    }
    if (elPendingDetail) {
        const detailText = feeStatus.detail || 'Fee tracking not configured';
        elPendingDetail.innerHTML = '<i class="fas fa-info-circle"></i> <span>' + escapeHtml(String(detailText)) + '</span>';
    }

    // Widgets
    populateChildSelector(cachedChildrenData);
    renderChildren(cachedChildrenData);
    renderRecentGrades(data.recent_grades || []);
    renderAttendanceSummary(cachedChildrenData);
    renderUpcomingEvents(data.upcoming_events || []);
    updateCharts(data, 'all');
}

/* ========== Render: Child Selector ========== */
function populateChildSelector(children) {
    const sel = document.getElementById('childSelector');
    if (!sel) return;
    // Keep first option (All Children)
    while (sel.options.length > 1) sel.remove(1);
    children.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.student_id;
        opt.textContent = escapeHtml(c.full_name || `${c.first_name} ${c.last_name}`);
        sel.appendChild(opt);
    });
}

/* ========== Render: Children Overview ========== */
function renderChildren(children) {
    const container = document.getElementById('childrenList');
    if (!container) return;
    if (!children.length) {
        container.innerHTML = '<div style="padding:1.5rem;text-align:center;color:#6b7280;"><i class="fas fa-child" style="font-size:2rem;margin-bottom:.5rem;display:block;"></i><p>No children linked to your account.</p></div>';
        return;
    }
    container.innerHTML = children.map(c => {
        const name     = escapeHtml(c.full_name || `${c.first_name} ${c.last_name}`);
        const initials = escapeHtml(c.initials || name.slice(0, 2).toUpperCase());
        const att      = c.attendance_rate != null ? Math.round(c.attendance_rate) : '—';
        const attClass = typeof att === 'number' ? (att >= 85 ? 'attendance-good' : att >= 70 ? 'attendance-ok' : 'attendance-low') : '';
        const courses  = c.enrolled_courses || 0;
        const upcoming = c.upcoming_assessments || 0;
        const rel      = c.relationship ? escapeHtml(c.relationship) : 'Child';
        return `
        <div class="child-item" style="display:flex;align-items:center;padding:.9rem 1.2rem;border-bottom:1px solid #f1f5f9;gap:.9rem;">
            <div class="child-avatar" style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.9rem;flex-shrink:0;">${initials}</div>
            <div class="child-info" style="flex:1;min-width:0;">
                <h4 style="margin:0 0 .1rem;font-size:.95rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</h4>
                <p style="margin:0;font-size:.78rem;color:#6b7280;">${rel} &bull; ${courses} course${courses !== 1 ? 's' : ''}</p>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem;">
                <span class="stat-badge ${attClass}" style="font-size:.75rem;padding:.2rem .55rem;border-radius:12px;font-weight:600;">Att: ${att}%</span>
                <span style="font-size:.75rem;color:#6b7280;">${upcoming} upcoming</span>
            </div>
        </div>`;
    }).join('');
}

/* ========== Render: Recent Grades ========== */
function renderRecentGrades(grades) {
    const container = document.getElementById('recentGrades');
    if (!container) return;
    if (!grades.length) {
        container.innerHTML = '<div style="padding:1.5rem;text-align:center;color:#6b7280;"><i class="fas fa-star" style="font-size:2rem;margin-bottom:.5rem;display:block;"></i><p>No grades recorded yet.</p></div>';
        return;
    }
    container.innerHTML = grades.map(g => {
        const initials   = escapeHtml(g.child_initials || '??');
        const childName  = escapeHtml(g.child_name || 'Child');
        const title      = escapeHtml(g.assignment_title || g.title || 'Assessment');
        const subject    = escapeHtml(g.subject_name || '');
        const pct        = g.score != null && g.max_score ? Math.round(g.score / g.max_score * 100) : null;
        const letterGrade = pct != null ? pctToGrade(pct) : '—';
        const gradeClass = pct != null ? (pct >= 70 ? 'grade-a' : pct >= 55 ? 'grade-b' : 'grade-f') : 'grade-b';
        const when       = g.graded_at ? timeAgo(g.graded_at) : '';
        const scoreLabel = g.score != null && g.max_score ? `${g.score}/${g.max_score}` : '';
        return `
        <div class="activity-item" style="display:flex;align-items:center;padding:.8rem 1.2rem;border-bottom:1px solid #f1f5f9;gap:.9rem;">
            <div class="activity-avatar" style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.8rem;flex-shrink:0;">${initials}</div>
            <div class="activity-details" style="flex:1;min-width:0;">
                <h4 style="margin:0 0 .1rem;font-size:.88rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</h4>
                <p style="margin:0;font-size:.78rem;color:#6b7280;">${childName}${subject ? ' &bull; ' + subject : ''}</p>
                <small style="color:#9ca3af;font-size:.73rem;">${scoreLabel}${when ? ' &bull; ' + when : ''}</small>
            </div>
            <div class="grade-badge ${gradeClass}" style="padding:.25rem .6rem;border-radius:8px;font-weight:700;font-size:.82rem;">${letterGrade}</div>
        </div>`;
    }).join('');
}

/* ========== Render: Attendance Summary ========== */
function renderAttendanceSummary(children) {
    const container = document.getElementById('attendanceSummary');
    if (!container) return;
    if (!children.length) {
        container.innerHTML = '<p style="color:#6b7280;text-align:center;">No data.</p>';
        return;
    }
    container.innerHTML = children.map(c => {
        const name     = escapeHtml(c.full_name || `${c.first_name} ${c.last_name}`);
        const initials = escapeHtml(c.initials || name.slice(0, 2).toUpperCase());
        const att      = c.attendance_rate != null ? Math.round(c.attendance_rate) : 0;
        const barColor = att >= 85 ? '#22c55e' : att >= 70 ? '#f59e0b' : '#ef4444';
        return `
        <div style="margin-bottom:1.1rem;">
            <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.35rem;">
                <span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.75rem;">${initials}</span>
                <span style="font-size:.88rem;font-weight:500;">${name}</span>
                <span style="margin-left:auto;font-weight:700;font-size:.88rem;color:${barColor};">${att}%</span>
            </div>
            <div style="background:#e5e7eb;border-radius:99px;height:8px;">
                <div style="width:${att}%;background:${barColor};height:8px;border-radius:99px;transition:width .6s ease;"></div>
            </div>
        </div>`;
    }).join('');
}

/* ========== Render: Upcoming Events / Announcements ========== */
function renderUpcomingEvents(events) {
    const container = document.getElementById('upcomingEvents');
    if (!container) return;
    if (!events.length) {
        container.innerHTML = '<div style="padding:1.5rem;text-align:center;color:#6b7280;"><i class="fas fa-bullhorn" style="font-size:2rem;margin-bottom:.5rem;display:block;"></i><p>No announcements at this time.</p></div>';
        return;
    }
    container.innerHTML = events.map(ev => {
        const title    = escapeHtml(ev.title || 'Announcement');
        const content  = escapeHtml((ev.content || ev.message || '').substring(0, 90));
        const when     = ev.created_at ? timeAgo(ev.created_at) : '';
        const audience = ev.target_audience ? ` &bull; ${escapeHtml(ev.target_audience)}` : '';
        return `
        <div style="display:flex;gap:.8rem;padding:.85rem 1.2rem;border-bottom:1px solid #f1f5f9;">
            <div style="width:36px;height:36px;border-radius:50%;background:#ede9fe;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fas fa-bullhorn" style="color:#7c3aed;font-size:.8rem;"></i>
            </div>
            <div style="flex:1;min-width:0;">
                <h4 style="margin:0 0 .2rem;font-size:.88rem;font-weight:600;">${title}</h4>
                ${content ? `<p style="margin:0 0 .2rem;font-size:.78rem;color:#374151;">${content}${(ev.content || '').length > 90 ? '…' : ''}</p>` : ''}
                <small style="color:#9ca3af;font-size:.73rem;">${when}${audience}</small>
            </div>
        </div>`;
    }).join('');
}

/* ========== Charts ========== */
function initCharts() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{
            label: 'Avg Score (%)',
            data: [],
            backgroundColor: 'rgba(99,102,241,.75)',
            borderColor: 'rgba(99,102,241,1)',
            borderWidth: 2,
            borderRadius: 6,
        }]},
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ctx.parsed.y.toFixed(1) + '%' } }
            },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateCharts(data, selectedChildId) {
    if (!performanceChart) return;
    const children = data.children_data || cachedChildrenData;
    let trendData = null;
    let label = '';

    if (selectedChildId && selectedChildId !== 'all') {
        const child = children.find(c => String(c.student_id) === String(selectedChildId));
        if (child && child.grade_trend) {
            trendData = child.grade_trend;
            label = `${child.first_name} ${child.last_name}`;
        }
    } else if (selectedChildId === 'all') {
        // Merge all children's grade trends — average per subject
        const subjectMap = {};
        children.forEach(c => {
            if (!c.grade_trend || !c.grade_trend.labels) return;
            c.grade_trend.labels.forEach((subj, i) => {
                if (!subjectMap[subj]) subjectMap[subj] = { sum: 0, count: 0 };
                subjectMap[subj].sum   += c.grade_trend.data[i] || 0;
                subjectMap[subj].count += 1;
            });
        });
        const labels = Object.keys(subjectMap).sort();
        const dataVals = labels.map(s => parseFloat((subjectMap[s].sum / subjectMap[s].count).toFixed(1)));
        trendData = { labels, data: dataVals };
        label = 'All Children (avg per subject)';
    }
    if (!trendData && children.length) {
        trendData = children[0].grade_trend;
        label = `${children[0].first_name} ${children[0].last_name}`;
    }
    

    const elLabel = document.getElementById('performanceChartLabel');
    if (elLabel) elLabel.textContent = label ? `Showing: ${label}` : '';

    if (trendData && trendData.labels && trendData.labels.length) {
        performanceChart.data.labels = trendData.labels;
        performanceChart.data.datasets[0].data = trendData.data;
    } else {
        performanceChart.data.labels = [];
        performanceChart.data.datasets[0].data = [];
    }
    performanceChart.update();
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

/* ========== Helpers ========== */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function pctToGrade(pct) {
    if (pct >= 80) return 'A1';
    if (pct >= 75) return 'B2';
    if (pct >= 70) return 'B3';
    if (pct >= 65) return 'C4';
    if (pct >= 60) return 'C5';
    if (pct >= 55) return 'C6';
    if (pct >= 50) return 'D7';
    if (pct >= 45) return 'E8';
    return 'F9';
}
