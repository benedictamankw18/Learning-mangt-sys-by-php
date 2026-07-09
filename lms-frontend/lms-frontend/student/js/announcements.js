/* Student Announcements */
(function () {
  'use strict';

  const META_PREFIX = '__ANN_META__';

  const STATE = {
    items: [],
    filtered: [],
    search: '',
    priority: 'all',
    markedRead: new Set(),
    currentUser: null,
  };

  document.addEventListener('page:loaded', function (event) {
    if (event?.detail?.page === 'announcements') {
      init();
    }
  });

  function init() {
    const root = el('studentAnnouncementsRoot');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    STATE.currentUser = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;

    bindEvents();
    loadAnnouncements();
  }

  function el(id) { return document.getElementById(id); }

  function bindEvents() {
    el('sanRefreshBtn')?.addEventListener('click', loadAnnouncements);

    el('sanSearchInput')?.addEventListener('input', function (event) {
      STATE.search = String(event.target.value || '').trim().toLowerCase();
      filterAndRender();
    });

    el('sanPriorityFilter')?.addEventListener('change', function (event) {
      STATE.priority = String(event.target.value || 'all');
      filterAndRender();
    });
  }

  async function loadAnnouncements() {
    const list = el('sanList');
    if (list) {
      list.innerHTML = '<div class="ann-empty"><i class="fas fa-spinner fa-spin"></i>Loading announcements...</div>';
    }

    try {
      const response = await AnnouncementAPI.getAll({ page: 1, limit: 200 });
      STATE.items = extractList(response).map(normalizeAnnouncement);
      filterAndRender();
    } catch (error) {
      console.error(error);
      if (list) {
        list.innerHTML = '<div class="ann-empty"><i class="fas fa-circle-exclamation"></i>Failed to load announcements</div>';
      }
    }
  }

  function extractList(response) {
    if (!response) return [];
    const data = response.data || response;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.announcements)) return data.announcements;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(response.announcements)) return response.announcements;
    return [];
  }

  function normalizeAnnouncement(item) {
    const contentMeta = unpackContent(String(item.content || ''));
    const attachments = parseAttachments(item.attachments);

    return {
      ...item,
      target_role: String(item.target_role || 'School'),
      priority: String(item.priority || contentMeta.meta.priority || 'normal'),
      content_body: contentMeta.body,
      attachments,
      is_read: item.is_read == 1 || item.is_read === '1',
      read_count: Number(item.read_count ?? 0) || 0,
      is_published: item.is_published == 1 || item.is_published === '1',
    };
  }

  function filterAndRender() {
    const filtered = STATE.items.filter(function (item) {
      if (STATE.priority !== 'all' && String(item.priority) !== STATE.priority) return false;

      if (!STATE.search) return true;
      const haystack = [item.title, item.content_body, item.target_role, item.priority, item.author_first_name, item.author_last_name]
        .join(' ')
        .toLowerCase();
      return haystack.includes(STATE.search);
    });

    STATE.filtered = filtered;
    renderStats();
    renderList();
    markVisibleAnnouncementsAsRead();
  }

  function renderStats() {
    const total = STATE.filtered.length;
    const urgent = STATE.filtered.filter((item) => item.priority === 'urgent').length;
    const files = STATE.filtered.reduce((sum, item) => sum + (Array.isArray(item.attachments) && item.attachments.length ? 1 : 0), 0);
    const latest = STATE.filtered.length
      ? formatDate(STATE.filtered[0].published_at || STATE.filtered[0].created_at)
      : '-';

    setText('sanStatTotal', total);
    setText('sanStatUrgent', urgent);
    setText('sanStatFiles', files);
    setText('sanStatLatest', latest || '-');
  }

  function renderList() {
    const list = el('sanList');
    if (!list) return;

    if (!STATE.filtered.length) {
      list.innerHTML = '<div class="ann-empty"><i class="fas fa-bullhorn"></i>No announcements found</div>';
      return;
    }

    list.innerHTML = STATE.filtered.map(function (item) {
      const targetLabel = item.target_role === 'student' ? 'Students' : (item.target_role === 'all' ? 'School' : capitalize(item.target_role));
      const title = esc(item.title || '(untitled)');
      const body = esc(truncate(item.content_body || '', 280)).replace(/\n/g, '<br>');
      const author = [item.author_first_name, item.author_last_name].filter(Boolean).join(' ').trim() || 'School Admin';
      const published = formatDate(item.published_at || item.created_at);

      return '<article class="ann-item">' +
        '<div class="ann-item-head">' +
          '<div>' +
            '<h3>' + title + '</h3>' +
            '<div class="ann-meta">' +
              '<span class="ann-chip ' + esc(item.priority) + '">' + esc(capitalize(item.priority)) + '</span>' +
              '<span class="ann-chip ' + esc(item.target_role || 'School') + '">' + esc(targetLabel) + '</span>' +
              '<span><i class="fas fa-user"></i> ' + esc(author) + '</span>' +
              '<span><i class="fas fa-clock"></i> ' + esc(published || '-') + '</span>' +
              (function(){
                const me = STATE.currentUser;
                const isOwner = me && item.author_id && String(item.author_id) === String(me.user_id);
                const isAdmin = me && (me.is_super_admin || (Array.isArray(me.roles) && me.roles.indexOf('admin') >= 0));
                if (isOwner || isAdmin) {
                  return '<span><i class="fas fa-eye"></i> ' + esc(String(item.read_count || 0)) + ' reads</span>';
                }
                return '';
              })() +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ann-body">' + body + '</div>' +
        renderAttachments(item.attachments) +
      '</article>';
    }).join('');
  }

  async function markVisibleAnnouncementsAsRead() {
    const unread = STATE.filtered.filter(function (item) {
      const uuid = String(item.uuid || '').trim();
      return uuid && !item.is_read && !STATE.markedRead.has(uuid);
    });

    if (!unread.length) return;

    await Promise.all(unread.map(async function (item) {
      const uuid = String(item.uuid || '').trim();
      if (!uuid) return;

      STATE.markedRead.add(uuid);
      try {
        await AnnouncementAPI.markAsRead(uuid);
        item.is_read = true;
      } catch (error) {
        STATE.markedRead.delete(uuid);
        console.error(error);
      }
    }));
  }

  function renderAttachments(attachments) {
    if (!Array.isArray(attachments) || !attachments.length) return '';

    const files = attachments.map(function (file) {
      const name = String(file?.original_name || file?.filename || 'attachment').trim();
      const url = resolveAttachmentUrl(file?.url || '');
      if (!url) {
        return '<div class="ann-file-link"><span>' + esc(name) + '</span><small>Attachment</small></div>';
      }
      return '<a class="ann-file-link" href="' + escAttr(url) + '" target="_blank" rel="noopener noreferrer">' +
        '<span><i class="fas fa-paperclip"></i> ' + esc(name) + '</span>' +
        '<small>Open / Download</small>' +
      '</a>';
    }).join('');

    return '<div class="ann-files"><h4>Attachments</h4><div class="ann-file-list">' + files + '</div></div>';
  }

  function unpackContent(content) {
    if (!content.startsWith(META_PREFIX)) {
      return { meta: {}, body: content };
    }

    const end = content.indexOf('\n');
    if (end < 0) {
      return { meta: {}, body: content };
    }

    const metaRaw = content.slice(META_PREFIX.length, end).trim();
    const body = content.slice(end + 1);

    try {
      const meta = JSON.parse(metaRaw);
      return { meta: (meta && typeof meta === 'object') ? meta : {}, body: body };
    } catch (_) {
      return { meta: {}, body: content };
    }
  }

  function parseAttachments(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function resolveAttachmentUrl(rawUrl) {
    const clean = String(rawUrl || '').trim();
    if (!clean) return '';
    if (/^https?:\/\//i.test(clean)) return clean;

    const API_BASE = (window.API_BASE_URL || '').replace(/\/$/, '');
    if (clean.startsWith('/')) {
      return API_BASE ? (API_BASE + clean) : clean;
    }

    return API_BASE ? (API_BASE + '/' + clean) : clean;
  }

  function formatDate(value) {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value);
    return dt.toLocaleString();
  }

  function truncate(text, limit) {
    const raw = String(text || '');
    if (raw.length <= limit) return raw;
    return raw.slice(0, limit - 1) + '...';
  }

  function esc(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escAttr(text) {
    return esc(text).replace(/`/g, '&#96;');
  }

  function capitalize(value) {
    const str = String(value || '');
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = String(value ?? '');
  }
})();
