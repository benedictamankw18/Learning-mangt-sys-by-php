(function () {
  'use strict';

  const POLL_MS = 30000;

  const S = {
    items: [],
    filtered: [],
    search: '',
    typeFilter: 'all',
    statusFilter: 'all',
    page: 1,
    limit: 20,
    total: 0,
    unreadTotal: null,
    pages: 1,
    pollTimer: null,
    loading: false,
  };

  document.addEventListener('page:loaded', function (e) {
    if (e?.detail?.page === 'notifications') init();
  });

  function el(id) { return document.getElementById(id); }

  function init() {
    const root = el('admNotificationsRoot');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    bindEvents();
    loadNotifications({ silent: false });
    startPolling();
  }

  function bindEvents() {
    el('ntfRefreshBtn')?.addEventListener('click', function () { loadNotifications({ silent: false }); });
    el('ntfMarkAllBtn')?.addEventListener('click', markAllRead);

    el('ntfPrevPageBtn')?.addEventListener('click', function () {
      if (S.page > 1) loadNotifications({ page: S.page - 1, limit: S.limit, silent: false });
    });

    el('ntfNextPageBtn')?.addEventListener('click', function () {
      if (S.page < S.pages) loadNotifications({ page: S.page + 1, limit: S.limit, silent: false });
    });

    el('ntfPageSize')?.addEventListener('change', function (e) {
      const nextLimit = Math.max(1, parseInt(e.target.value || '20', 10) || 20);
      loadNotifications({ page: 1, limit: nextLimit, silent: false });
    });

    el('ntfSearchInput')?.addEventListener('input', function (e) {
      S.search = String(e.target.value || '').trim().toLowerCase();
      filterAndRender();
    });

    el('ntfTypeFilter')?.addEventListener('change', function (e) {
      S.typeFilter = String(e.target.value || 'all');
      filterAndRender();
    });

    el('ntfStatusFilter')?.addEventListener('change', function (e) {
      S.statusFilter = String(e.target.value || 'all');
      filterAndRender();
    });

    el('ntfList')?.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = String(btn.getAttribute('data-action') || '');
      const uuid = String(btn.getAttribute('data-uuid') || '');
      if (!uuid) return;

      const item = S.items.find(function (x) { return String(x.uuid) === uuid; });
      if (!item) return;

      if (action === 'read') {
        markAsRead(item);
      } 
    });

    window.addEventListener('beforeunload', stopPolling);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopPolling();
      else startPolling();
    });
  }

  function isVisible() {
    const root = el('admNotificationsRoot');
    return !!root && root.offsetParent !== null;
  }

  function startPolling() {
    stopPolling();
    S.pollTimer = setInterval(function () {
      if (!isVisible()) return;
      loadNotifications({ silent: true });
    }, POLL_MS);
  }

  function stopPolling() {
    if (S.pollTimer) {
      clearInterval(S.pollTimer);
      S.pollTimer = null;
    }
  }

  async function loadNotifications(options) {
    const opts = options || {};
    const silent = opts.silent === true;
    const page = Math.max(1, parseInt(opts.page || S.page || 1, 10) || 1);
    const limit = Math.max(1, parseInt(opts.limit || S.limit || 20, 10) || 20);
    const list = el('ntfList');

    if (S.loading) return;
    S.loading = true;

    if (!silent && list) {
      list.innerHTML = '<div class="ntf-empty"><i class="fas fa-spinner fa-spin"></i>Loading notifications...</div>';
    }

    try {
      const response = await NotificationAPI.getAll({ page: page, limit: limit });
      const data = response?.data || response || {};
      const rows = Array.isArray(data.notifications) ? data.notifications : (Array.isArray(data.data) ? data.data : []);
      const pagination = data.pagination || {};

      S.items = rows.map(normalizeNotification);
      S.page = pagination.page ? Number(pagination.page) : page;
      S.limit = pagination.limit ? Number(pagination.limit) : limit;
      S.total = pagination.total ? Number(pagination.total) : S.items.length;
      S.pages = pagination.pages ? Number(pagination.pages) : Math.max(1, Math.ceil(S.total / S.limit));

      // capture authoritative unread count from the API response
      const unreadCount = Number(data?.unread_count ?? null);
      if (Number.isFinite(unreadCount)) {
        S.unreadTotal = unreadCount;
      }

      const pageSize = el('ntfPageSize');
      if (pageSize && Number(pageSize.value) !== S.limit) {
        pageSize.value = String(S.limit);
      }

      filterAndRender();
      updateHeaderBadge();
      updatePagination();
    } catch (error) {
      console.error(error);
      if (list) {
        list.innerHTML = '<div class="ntf-empty"><i class="fas fa-circle-exclamation"></i>Failed to load notifications</div>';
      }
      toast(error?.message || 'Failed to load notifications', 'error');
    } finally {
      S.loading = false;
    }
  }

  function normalizeNotification(item) {
    return {
      ...item,
      uuid: String(item.uuid || item.notification_uuid || item.id || '').trim(),
      title: String(item.title || '').trim(),
      message: String(item.message || '').trim(),
      notification_type: normalizeType(item.notification_type),
      is_read: item.is_read == 1 || item.is_read === '1' || item.is_read === true,
      created_at: item.created_at || item.createdAt || null,
    };
  }

  function normalizeType(v) {
    const raw = String(v || '').trim().toLowerCase();
    if (!raw) return 'other';
    if (raw.includes('assignment')) return 'assignment';
    if (raw.includes('grade')) return 'grade';
    if (raw.includes('message') || raw.includes('chat')) return 'message';
    if (raw.includes('announcement')) return 'announcement';
    if (raw.includes('event')) return 'event';
    if (raw.includes('attendance')) return 'attendance';
    return 'other';
  }

  function filterAndRender() {
    S.filtered = S.items.filter(function (item) {
      if (S.typeFilter !== 'all' && item.notification_type !== S.typeFilter) return false;
      if (S.statusFilter === 'unread' && item.is_read) return false;
      if (S.statusFilter === 'read' && !item.is_read) return false;

      if (!S.search) return true;
      const hay = [item.title, item.message, item.notification_type].join(' ').toLowerCase();
      return hay.includes(S.search);
    });

    renderList();
    renderStats();
  }

  function renderStats() {
    const total = S.total || S.items.length;
    const unread = S.items.filter(function (x) { return !x.is_read; }).length;
    const totalNode = el('ntfTotalCount');
    const unreadNode = el('ntfUnreadCount');
    if (totalNode) totalNode.textContent = String(total);
    if (unreadNode) unreadNode.textContent = String(unread);
  }
  


  function updatePagination() {
    const pageInfo = el('ntfPageInfo');
    const rangeInfo = el('ntfRangeInfo');
    const prevBtn = el('ntfPrevPageBtn');
    const nextBtn = el('ntfNextPageBtn');

    const total = S.total || 0;
    const from = total === 0 ? 0 : ((S.page - 1) * S.limit) + 1;
    const to = total === 0 ? 0 : Math.min(S.page * S.limit, total);

    if (pageInfo) pageInfo.textContent = 'Page ' + S.page + ' of ' + Math.max(1, S.pages);
    if (rangeInfo) rangeInfo.textContent = total === 0 ? '0 items' : (from + '–' + to + ' of ' + total + ' items');
    if (prevBtn) prevBtn.disabled = S.page <= 1;
    if (nextBtn) nextBtn.disabled = S.page >= S.pages;
  }

  function renderList() {
    const list = el('ntfList');
    if (!list) return;

    if (!S.filtered.length) {
      list.innerHTML = '<div class="ntf-empty"><i class="fas fa-bell-slash"></i>No notifications found</div>';
      return;
    }

    list.innerHTML = S.filtered.map(function (item) {
      const typeLabel = capitalize(item.notification_type || 'other');
      return '<div class="ntf-item ' + (item.is_read ? '' : 'unread') + '">' +
        '<div class="ntf-item-head">' +
          '<h4>' + esc(item.title || '(untitled)') + '</h4>' +
          '<span class="ntf-meta">' + esc(formatDate(item.created_at) || '-') + '</span>' +
        '</div>' +
        '<div class="ntf-meta"><span><i class="fas fa-tag"></i> ' + esc(typeLabel) + '</span>' +
        '<span><i class="fas fa-eye"></i> ' + (item.is_read ? 'Read' : 'Unread') + '</span></div>' +
        '<p class="ntf-msg">' + esc(item.message || '') + '</p>' +
         `${item.link ? `<a href="${esc(item.link || '#')}" class="notification-link" rel="noopener noreferrer">View Details</a>` : ''}` +
        '<div class="ntf-row-actions">' +
          (item.is_read ? '' : '<button class="ntf-btn" type="button" data-action="read" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-check"></i> Mark Read</button>') +
        '</div>' +
      '</div>';
    }).join('');
  }

  async function markAsRead(item) {
    if (!item?.uuid || item.is_read) return;
    try {
      await NotificationAPI.markAsRead(item.uuid);
      item.is_read = true;
      // update local unread total when available to avoid extra summary calls
      if (Number.isFinite(S.unreadTotal) && S.unreadTotal > 0) {
        S.unreadTotal = Math.max(0, S.unreadTotal - 1);
      }
      filterAndRender();
      updateHeaderBadge();
      updatePagination();
      toast('Notification marked as read', 'success');
    } catch (error) {
      console.error(error);
      toast(error?.message || 'Failed to mark notification as read', 'error');
    }
  }

  async function markAllRead() {
    try {
      await NotificationAPI.markAllAsRead();
      S.items.forEach(function (item) { item.is_read = true; });
      // all notifications are now read
      if (Number.isFinite(S.unreadTotal)) S.unreadTotal = 0;
      filterAndRender();
      updateHeaderBadge();
      updatePagination();
      toast('All notifications marked as read', 'success');
    } catch (error) {
      console.error(error);
      toast(error?.message || 'Failed to mark all notifications as read', 'error');
    }
  }

  function updateHeaderBadge() {
    const unread = Number.isFinite(S.unreadTotal) ? S.unreadTotal : S.items.filter(function (x) { return !x.is_read; }).length;
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.style.display = 'flex';
      console.log("unread count: ", unread);
    } else {
      badge.style.display = 'none';
    }

    const count = document.getElementById('notifCount');
    if (count) count.textContent = String(unread);
  }

  function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function capitalize(v) {
    const s = String(v || '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function esc(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escAttr(text) {
    return esc(text).replace(/`/g, '&#96;');
  }

  function toast(message, type) {
    if (typeof showToast === 'function') {
      showToast(message, type || 'info');
      return;
    }
    console.log(message);
  }
})();
