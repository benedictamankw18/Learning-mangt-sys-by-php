/* Announcements Management */
(function () {
  'use strict';

  const META_PREFIX = '__ANN_META__';
  const ANNOUNCEMENT_POLL_MS = 60000;

  const S = {
    items: [],
    filtered: [],
    editingUuid: null,
    search: '',
    targetFilter: 'all',
    statusFilter: 'all',
    existingAttachments: [],
    pendingFiles: [],
    markedRead: new Set(),
    pollTimer: null,
  };

  document.addEventListener('page:loaded', function (event) {
    if (event?.detail?.page === 'announcements') {
      init();
    }
  });

  function init() {
    const root = el('admAnnouncementsRoot');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    bindEvents();
    loadAnnouncements();
    startPolling();
  }

  function el(id) {
    return document.getElementById(id);
  }

  function toast(message, type) {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(message);
    }
  }

  function confirmAction(title, message, onConfirm) {
    if (window.showModal) {
      window.showModal(title, message, onConfirm);
      return;
    }
    if (window.confirm(title + '\n' + message)) {
      onConfirm();
    }
  }

  function bindEvents() {
    el('annRefreshBtn')?.addEventListener('click', function () { loadAnnouncements({ silent: false }); });
    el('annCreateBtn')?.addEventListener('click', function () { openModal(null); });

    el('annSearchInput')?.addEventListener('input', function (e) {
      S.search = String(e.target.value || '').trim().toLowerCase();
      filterAndRender();
    });

    el('annTargetFilter')?.addEventListener('change', function (e) {
      S.targetFilter = String(e.target.value || 'all');
      filterAndRender();
    });

    el('annStatusFilter')?.addEventListener('change', function (e) {
      S.statusFilter = String(e.target.value || 'all');
      filterAndRender();
    });

    el('annModalClose')?.addEventListener('click', closeModal);
    el('annModalCancel')?.addEventListener('click', closeModal);
    el('annModalSave')?.addEventListener('click', saveAnnouncement);
    el('annModalOverlay')?.addEventListener('click', function (e) {
      if (e.target === e.currentTarget) closeModal();
    });

    el('annFieldFiles')?.addEventListener('change', function (e) {
      S.pendingFiles = Array.from(e.target.files || []);
      renderPendingFiles();
    });

    el('annTableBody')?.addEventListener('click', function (e) {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const action = String(button.getAttribute('data-action') || '');
      const uuid = String(button.getAttribute('data-uuid') || '');
      if (!uuid) return;

      if (action === 'edit') {
        const item = S.items.find(function (x) { return String(x.uuid) === uuid; });
        openModal(item || null);
        return;
      }

      if (action === 'delete') {
        const item = S.items.find(function (x) { return String(x.uuid) === uuid; });
        confirmAction('Delete Announcement', 'Delete "' + (item?.title || 'this announcement') + '"? This cannot be undone.', function () {
          deleteAnnouncement(uuid);
        });
        return;
      }

      if (action === 'toggle-publish') {
        const item = S.items.find(function (x) { return String(x.uuid) === uuid; });
        if (!item) return;
        togglePublish(item);
      }
    });

    window.addEventListener('beforeunload', stopPolling);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    });
  }

  function isAnnouncementsVisible() {
    const root = el('admAnnouncementsRoot');
    if (!root) return false;
    return root.offsetParent !== null;
  }

  function startPolling() {
    stopPolling();
    S.pollTimer = setInterval(function () {
      if (!isAnnouncementsVisible()) return;
      loadAnnouncements({ silent: true });
    }, ANNOUNCEMENT_POLL_MS);
  }

  function stopPolling() {
    if (S.pollTimer) {
      clearInterval(S.pollTimer);
      S.pollTimer = null;
    }
  }

  async function loadAnnouncements(options) {
    const opts = options || {};
    const silent = opts.silent === true;
    const tbody = el('annTableBody');
    if (tbody && !silent) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="ann-empty"><i class="fas fa-spinner fa-spin"></i>Loading announcements...</div></td></tr>';
    }

    try {
      const response = await AnnouncementAPI.getAll({ page: 1, limit: 200 });
      const list = extractAnnouncementList(response);
      S.items = list.map(normalizeAnnouncement);
      filterAndRender();
      if (!silent) toast('Announcements loaded', 'success');
    } catch (error) {
      console.error(error);
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="ann-empty"><i class="fas fa-circle-exclamation"></i>Failed to load announcements</div></td></tr>';
      }
      toast(error?.message || 'Failed to load announcements', 'error');
    }
  }

  function extractAnnouncementList(response) {
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
    const attachmentRows = parseAttachments(item.attachments);
    const attachmentNames = attachmentRows
      .map(function (file) {
        return String(file?.original_name || file?.filename || '').trim();
      })
      .filter(Boolean);

    return {
      ...item,
      target_role: String(item.target_role || 'all'),
      is_published: item.is_published == 1 || item.is_published === '1',
      priority: String(contentMeta.meta.priority || 'normal'),
      class_audience: String(contentMeta.meta.class_audience || ''),
      attachments: attachmentRows,
      attachment_names: attachmentNames,
      content_body: contentMeta.body,
      is_read: item.is_read == 1 || item.is_read === '1',
      read_count: Number(item.read_count ?? item.views ?? item.reads ?? 0) || 0,
    };
  }

  function filterAndRender() {
    const filtered = S.items.filter(function (item) {
      if (S.targetFilter !== 'all' && String(item.target_role) !== S.targetFilter) return false;

      if (S.statusFilter === 'published' && !item.is_published) return false;
      if (S.statusFilter === 'draft' && item.is_published) return false;

      if (!S.search) return true;
      const haystack = [item.title, item.content_body, item.target_role, item.priority, item.class_audience]
        .join(' ')
        .toLowerCase();
      return haystack.includes(S.search);
    });

    S.filtered = filtered;
    renderTable();
    renderStats();
    markVisibleAnnouncementsAsRead();
  }

  function renderTable() {
    const tbody = el('annTableBody');
    if (!tbody) return;

    if (!S.filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="ann-empty"><i class="fas fa-bullhorn"></i>No announcements found</div></td></tr>';
      return;
    }

    tbody.innerHTML = S.filtered.map(function (item) {
      const statusLabel = item.is_published ? 'Published' : 'Draft';
      const statusClass = item.is_published ? 'published' : 'draft';
      const publishBtn = item.is_published ? 'Unpublish' : 'Publish';
      const audience = item.target_role === 'class' && item.class_audience
        ? 'class: ' + item.class_audience
        : item.target_role;

      const publishAt = formatDate(item.published_at);
      const expiresAt = formatDate(item.expires_at);

      return '<tr>' +
        '<td>' +
          '<p class="ann-title">' + esc(item.title || '(untitled)') + '</p>' +
          '<p class="ann-snippet">' + esc(truncate(item.content_body || '', 140)) + '</p>' +
          (item.attachments.length
            ? '<div class="ann-snippet"><i class="fas fa-paperclip"></i> ' + item.attachments.length + ' attachment(s)</div>' + renderAttachmentLinks(item.attachments)
            : '') +
        '</td>' +
        '<td><span class="ann-chip role">' + esc(audience || 'all') + '</span></td>' +
        '<td><span class="ann-chip ' + esc(item.priority) + '">' + esc(capitalize(item.priority)) + '</span></td>' +
        '<td>' +
          '<div class="ann-snippet"><strong>Publish:</strong> ' + esc(publishAt || '-') + '</div>' +
          '<div class="ann-snippet"><strong>Expiry:</strong> ' + esc(expiresAt || '-') + '</div>' +
        '</td>' +
        '<td><span class="ann-chip ' + statusClass + '">' + statusLabel + '</span></td>' +
        '<td>' + esc(String(item.read_count)) + '</td>' +
        '<td>' +
          '<div class="ann-actions">' +
            '<button class="ann-btn" type="button" data-action="edit" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-pen"></i> Edit</button>' +
            '<button class="ann-btn" type="button" data-action="toggle-publish" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-toggle-on"></i> ' + publishBtn + '</button>' +
            '<button class="ann-btn danger" type="button" data-action="delete" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-trash"></i> Delete</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderStats() {
    const total = S.filtered.length;
    const published = S.filtered.filter(function (x) { return x.is_published; }).length;
    const urgent = S.filtered.filter(function (x) { return x.priority === 'urgent'; }).length;
    const reads = S.filtered.reduce(function (sum, x) { return sum + (Number(x.read_count) || 0); }, 0);

    setText('annStatTotal', total);
    setText('annStatPublished', published);
    setText('annStatUrgent', urgent);
    setText('annStatReads', reads);
  }

  async function markVisibleAnnouncementsAsRead() {
    const unread = S.filtered.filter(function (item) {
      const uuid = String(item.uuid || '').trim();
      return uuid && !item.is_read && !S.markedRead.has(uuid);
    });

    if (!unread.length) return;

    await Promise.all(unread.map(async function (item) {
      const uuid = String(item.uuid || '').trim();
      if (!uuid) return;

      S.markedRead.add(uuid);
      try {
        await AnnouncementAPI.markAsRead(uuid);
        item.is_read = true;
      } catch (error) {
        S.markedRead.delete(uuid);
        console.error(error);
      }
    }));
  }

  function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = String(value);
  }

  function openModal(item) {
    S.editingUuid = item?.uuid || null;
    S.existingAttachments = Array.isArray(item?.attachments) ? item.attachments.slice() : [];
    S.pendingFiles = [];

    setText('annModalTitle', item ? 'Edit Announcement' : 'New Announcement');

    setValue('annFieldTitle', item?.title || '');
    setValue('annFieldContent', item?.content_body || '');
    setValue('annFieldTarget', item?.target_role || 'all');
    setValue('annFieldPriority', item?.priority || 'normal');
    setValue('annFieldPublished', item?.is_published ? '1' : '0');
    setValue('annFieldExpiryDate', toDateTimeLocal(item?.expires_at));

    const files = el('annFieldFiles');
    if (files) files.value = '';

    hideError();
    renderPendingFiles();

    el('annModalOverlay')?.classList.add('open');
    el('annFieldTitle')?.focus();
  }

  function closeModal() {
    el('annModalOverlay')?.classList.remove('open');
    S.editingUuid = null;
    S.existingAttachments = [];
    S.pendingFiles = [];
    hideError();
  }

  function renderPendingFiles() {
    const wrap = el('annFileList');
    if (!wrap) return;

    const existingNames = S.existingAttachments
      .map(function (file) {
        return String(file?.original_name || file?.filename || '').trim();
      })
      .filter(Boolean);

    const newNames = S.pendingFiles
      .map(function (file) {
        return String(file?.name || '').trim();
      })
      .filter(Boolean);

    const allNames = existingNames.concat(newNames);
    if (!allNames.length) {
      wrap.innerHTML = '';
      return;
    }

    wrap.innerHTML = allNames
      .map(function (name) {
        return '<span class="ann-file-chip"><i class="fas fa-paperclip"></i> ' + esc(name) + '</span>';
      })
      .join('');
  }

  function setValue(id, value) {
    const node = el(id);
    if (node) node.value = value == null ? '' : String(value);
  }

  function getValue(id) {
    const node = el(id);
    return node ? String(node.value || '').trim() : '';
  }

  async function saveAnnouncement() {
    const title = getValue('annFieldTitle');
    const contentBody = getValue('annFieldContent');
    const targetRole = getValue('annFieldTarget') || 'all';
    const priority = getValue('annFieldPriority') || 'normal';
    const isPublished = getValue('annFieldPublished') === '1' ? 1 : 0;
    const expiryDate = getValue('annFieldExpiryDate');

    if (!title) {
      showError('Title is required.');
      return;
    }

    const metadata = {
      priority: priority,
    };

    const payload = {
      title: title,
      content: packContent(contentBody, metadata),
      target_role: targetRole,
      is_published: isPublished,
      published_at: isPublished ? nowSql() : null,
      expires_at: expiryDate ? toSqlDateTime(expiryDate) : null,
    };

    const saveBtn = el('annModalSave');
    if (saveBtn) saveBtn.disabled = true;

    try {
      let response;
      if (S.editingUuid) {
        response = await AnnouncementAPI.update(S.editingUuid, payload);
        toast('Announcement updated', 'success');
      } else {
        response = await AnnouncementAPI.create(payload);
        toast('Announcement created', 'success');
      }

      const announcementUuid = extractAnnouncementUuid(response) || S.editingUuid;
      if (announcementUuid && S.pendingFiles.length) {
        await uploadAttachments(announcementUuid, S.pendingFiles);
      }

      closeModal();
      await loadAnnouncements();
    } catch (error) {
      console.error(error);
      showError(error?.message || 'Failed to save announcement');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  async function deleteAnnouncement(uuid) {
    try {
      await AnnouncementAPI.delete(uuid);
      toast('Announcement deleted', 'success');
      loadAnnouncements();
    } catch (error) {
      console.error(error);
      toast(error?.message || 'Failed to delete announcement', 'error');
    }
  }

  async function uploadAttachments(uuid, files) {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      await AnnouncementAPI.uploadAttachment(uuid, formData);
    }
  }

  function extractAnnouncementUuid(response) {
    if (!response) return '';
    const data = response.data || response;
    return String(data.announcement_uuid || data.uuid || data.announcement?.uuid || '').trim();
  }

  async function togglePublish(item) {
    const shouldPublish = !item.is_published;
    const payload = {
      is_published: shouldPublish ? 1 : 0,
      published_at: shouldPublish ? nowSql() : null,
    };

    try {
      await AnnouncementAPI.update(item.uuid, payload);
      toast(shouldPublish ? 'Announcement published' : 'Announcement unpublished', 'success');
      loadAnnouncements();
    } catch (error) {
      console.error(error);
      toast(error?.message || 'Failed to update publish status', 'error');
    }
  }

  function showError(message) {
    const node = el('annFormError');
    if (!node) return;
    node.style.display = 'block';
    node.textContent = message;
  }

  function hideError() {
    const node = el('annFormError');
    if (!node) return;
    node.style.display = 'none';
    node.textContent = '';
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
      return {
        meta: (meta && typeof meta === 'object') ? meta : {},
        body: body,
      };
    } catch (_) {
      return { meta: {}, body: content };
    }
  }

  function packContent(body, meta) {
    const safeBody = String(body || '');
    const safeMeta = {
      priority: String(meta?.priority || 'normal'),
      class_audience: String(meta?.class_audience || ''),
    };

    return META_PREFIX + JSON.stringify(safeMeta) + '\n' + safeBody;
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

  function renderAttachmentLinks(attachments) {
    if (!Array.isArray(attachments) || !attachments.length) return '';

    const links = attachments.slice(0, 4).map(function (file) {
      const name = String(file?.original_name || file?.filename || 'attachment').trim();
      const url = resolveAttachmentUrl(file?.url || '');
      if (!url) {
        return '<div class="ann-snippet">• ' + esc(name) + '</div>';
      }

      return '<div class="ann-snippet">• <a href="' + escAttr(url) + '" target="_blank" rel="noopener noreferrer">' + esc(name) + '</a> <a href="' + escAttr(url) + '" download style="margin-left:.35rem;"> <span style="text-decoration: underline; color: blue;">Download</span> </a></div>';
    }).join('');

    const more = attachments.length > 4
      ? '<div class="ann-snippet">+' + String(attachments.length - 4) + ' more file(s)</div>'
      : '';

    return '<div>' + links + more + '</div>';
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

  function toSqlDateTime(localValue) {
    if (!localValue) return null;
    const dt = new Date(localValue);
    if (Number.isNaN(dt.getTime())) return null;

    const pad = function (n) { return String(n).padStart(2, '0'); };
    return dt.getFullYear() + '-' +
      pad(dt.getMonth() + 1) + '-' +
      pad(dt.getDate()) + ' ' +
      pad(dt.getHours()) + ':' +
      pad(dt.getMinutes()) + ':' +
      pad(dt.getSeconds());
  }

  function toDateTimeLocal(sqlValue) {
    if (!sqlValue) return '';
    const dt = new Date(sqlValue);
    if (Number.isNaN(dt.getTime())) return '';
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return dt.getFullYear() + '-' +
      pad(dt.getMonth() + 1) + '-' +
      pad(dt.getDate()) + 'T' +
      pad(dt.getHours()) + ':' +
      pad(dt.getMinutes());
  }

  function nowSql() {
    return toSqlDateTime(new Date().toISOString());
  }
})();
