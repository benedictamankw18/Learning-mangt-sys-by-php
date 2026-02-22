
document.addEventListener('DOMContentLoaded', async () => {
    
 // Notification tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        // console.log('Adding click listener to tab button:', btn);
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            switchNotificationTab(tabName);
        });
    });



    // Mark all as read
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            await markAllNotificationsAsRead();
        });
    }

    // Modal overlay click to close
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    });

/**
 * Show modal popup
 */
function showModal(title, message, onConfirm) {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    
    if (!overlay) return;
    
    modalTitle.textContent = title;
    // allow HTML content (forms/markup) to be rendered inside the modal
    modalMessage.innerHTML = message;
    overlay.style.display = 'flex';
    
    // Remove previous event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listener
    newConfirmBtn.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });
}

/**
 * Close modal popup
 */
function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}


/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}


/**
 * Show notification (alias for showToast)
 */
function showNotification(message, type = 'success') {
    showToast(message, type);
}

 // Notification bell toggle
    const notificationBell = document.getElementById('notificationBell');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (notificationBell && notificationDropdown) {
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = notificationDropdown.style.display === 'block';
            notificationDropdown.style.display = isVisible ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationDropdown.contains(e.target) && e.target !== notificationBell) {
                notificationDropdown.style.display = 'none';
            }
        });
    }

/* ============================================
   Notification Functions
============================================ */

/**
 * Load notifications summary
 */
async function loadNotifications() {
    try {
        const response = await NotificationAPI.getSummary();
        
        if (response && response.data) {
            const summary = response.data;
            
            // Update badge
            updateNotificationBadge(summary.total_unread);
            
            // Update tab counts
            document.getElementById('notifCount').textContent = summary.notifications_unread;
            document.getElementById('msgCount').textContent = summary.messages_unread;
            
            // Update lists
            updateNotificationsList(summary.recent_notifications);
            updateMessagesList(summary.recent_messages);
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

/**
 * Update notification badge
 */
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Update notifications list
 */
function updateNotificationsList(notifications) {
    const listContainer = document.getElementById('notificationsList');
    if (!listContainer) return;
    
    if (!notifications || notifications.length === 0) {
        listContainer.innerHTML = '<p class=\"no-notifications\">No new notifications</p>';
        return;
    }
    
    listContainer.innerHTML = notifications.map(notif => `
        <div class=\"notification-item ${notif.is_read ? '' : 'unread'}\" 
             data-id=\"${notif.notification_id}\"
             onclick=\"markNotificationAsRead(${notif.notification_id})\">
            <div class=\"notification-item-header\">
                <h5 class=\"notification-title\">${escapeHtml(notif.title)}</h5>
                <span class=\"notification-time\">${formatTimeAgo(notif.created_at)}</span>
            </div>
            <p class=\"notification-message\">${escapeHtml(notif.message || '')}</p>
        </div>
    `).join('');
}

/**
 * Update messages list
 */
function updateMessagesList(messages) {
    const listContainer = document.getElementById('messagesList');
    if (!listContainer) return;
    
    if (!messages || messages.length === 0) {
        listContainer.innerHTML = '<p class=\"no-notifications\">No new messages</p>';
        return;
    }
    
    listContainer.innerHTML = messages.map(msg => `
        <div class=\"notification-item ${msg.is_read ? '' : 'unread'}\" 
             data-id=\"${msg.message_id}\">
            <div class=\"notification-item-header\">
                <h5 class=\"notification-title\">${escapeHtml(msg.sender_name)}</h5>
                <span class=\"notification-time\">${formatTimeAgo(msg.sent_at)}</span>
            </div>
            <p class=\"notification-message\">${escapeHtml(msg.subject || msg.message_text || '')}</p>
        </div>
    `).join('');
}

/**
 * Switch notification tab
 */
function switchNotificationTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = tabName === 'notifications' ? 'notificationsTab' : 'messagesTab';
    document.getElementById(targetTab)?.classList.add('active');
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(id) {
    try {
        await NotificationAPI.markAsRead(id);
        await loadNotifications();
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead() {
    try {
        await NotificationAPI.markAllAsRead();
        await loadNotifications();
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Failed to mark all as read:', error);
        showToast('Failed to mark notifications as read', 'error');
    }
}

/**
 * Format time ago
 */
function formatTimeAgo(datetime) {
    const now = new Date();
    const then = new Date(datetime);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}




