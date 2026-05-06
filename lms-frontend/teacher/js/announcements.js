/* Teacher Announcements */
(function () {
  'use strict';

  const META_PREFIX = '__ANN_META__';

  const STATE = {
    items: [],
    filtered: [],
    classes: [],
    classLookup: new Map(),
    currentUser: null,
    teacherUuid: null,
    editingUuid: null,
    pendingFiles: [],
    search: '',
    scope: 'all',
    status: 'all',
  };

  document.addEventListener('page:loaded', function (event) {
    if (event?.detail?.page === 'announcements') {
      init();
    }
  });

  function init() {
    const root = el('teacherAnnouncementsRoot');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    STATE.currentUser = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    STATE.teacherUuid = getTeacherUuid();

    bindEvents();

    loadTeacherClasses()
      .then(loadAnnouncements)
      .catch(function (error) {
        console.error(error);
        toast(error?.message || 'Failed to load announcements', 'error');
      });
  }

  function el(id) {
    return document.getElementById(id);
  }

  function toast(message, type) {
    if (window.showToast) {
      window.showToast(message, type);
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
    el('taaRefreshBtn')?.addEventListener('click', function () {
      loadAnnouncements();
    });

    el('taaCreateBtn')?.addEventListener('click', function () {
      openModal(null);
    });

    el('taaSearchInput')?.addEventListener('input', function (event) {
      STATE.search = String(event.target.value || '').trim().toLowerCase();
      filterAndRender();
    });

    el('taaScopeFilter')?.addEventListener('change', function (event) {
      STATE.scope = String(event.target.value || 'all');
      filterAndRender();
    });

    el('taaStatusFilter')?.addEventListener('change', function (event) {
      STATE.status = String(event.target.value || 'all');
      filterAndRender();
    });

    el('taaModalClose')?.addEventListener('click', closeModal);
    el('taaModalCancel')?.addEventListener('click', closeModal);
    el('taaModalSave')?.addEventListener('click', saveAnnouncement);
    el('taaModalOverlay')?.addEventListener('click', function (event) {
      if (event.target === event.currentTarget) closeModal();
    });

    el('taaFieldFiles')?.addEventListener('change', function (event) {
      STATE.pendingFiles = Array.from(event.target.files || []);
      renderPendingFiles();
    });

    el('taaTableBody')?.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const action = String(button.getAttribute('data-action') || '');
      const uuid = String(button.getAttribute('data-uuid') || '');
      const item = STATE.items.find(function (x) { return String(x.uuid) === uuid; });
      if (!item) return;

      if (action === 'edit') {
        openModal(item);
        return;
      }

      if (action === 'delete') {
        confirmAction('Delete Announcement', 'Delete "' + (item.title || 'this announcement') + '"? This cannot be undone.', function () {
          deleteAnnouncement(uuid);
        });
        return;
      }

      if (action === 'toggle-publish') {
        togglePublish(item);
      }
    });
  }

  function getUser() {
    return STATE.currentUser || null;
  }

  function getTeacherUuid() {
    const user = getUser();
    return user && (user.teacher_uuid || user.uuid) ? String(user.teacher_uuid || user.uuid) : null;
  }

  function getCurrentUserId() {
    const user = getUser();
    return user && user.user_id != null ? String(user.user_id) : '';
  }

  function loadTeacherClasses() {
    if (!STATE.teacherUuid) {
      STATE.classes = [];
      STATE.classLookup = new Map();
      renderClassChoices();
      return Promise.resolve([]);
    }

    return API.get(API_ENDPOINTS.TEACHER_COURSES(STATE.teacherUuid))
      .then(function (response) {
        const courses = extractList(response);
        const byClass = new Map();

        courses.forEach(function (course) {
          const classId = course.class_id != null ? String(course.class_id) : String(course.class_name || '');
          const className = String(course.class_name || 'Unnamed Class').trim();
          if (!className) return;

          if (!byClass.has(classId || className)) {
            byClass.set(classId || className, {
              class_id: course.class_id != null ? course.class_id : classId || className,
              class_name: className,
            });
          }
        });

        STATE.classes = Array.from(byClass.values()).sort(function (a, b) {
          return String(a.class_name).localeCompare(String(b.class_name));
        });

        STATE.classLookup = new Map(STATE.classes.map(function (item) {
          return [normalizeClassName(item.class_name), item.class_name];
        }));

        renderClassChoices();
        return STATE.classes;
      })
      .catch(function (error) {
        console.error(error);
        STATE.classes = [];
        STATE.classLookup = new Map();
        renderClassChoices();
        throw error;
      });
  }

  async function loadAnnouncements() {
    const tbody = el('taaTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="taa-empty"><i class="fas fa-spinner fa-spin"></i>Loading announcements...</div></td></tr>';
    }

    try {
      const response = await AnnouncementAPI.getAll({ page: 1, limit: 200 });
      const list = extractList(response);
      STATE.items = list.map(normalizeAnnouncement);
      filterAndRender();
    } catch (error) {
      console.error(error);
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="taa-empty"><i class="fas fa-circle-exclamation"></i>Failed to load announcements</div></td></tr>';
      }
      toast(error?.message || 'Failed to load announcements', 'error');
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
    const classAudience = normalizeClassAudience(contentMeta.meta.class_audience);

    return {
      ...item,
      target_role: String(item.target_role || 'all'),
      is_published: item.is_published == 1 || item.is_published === '1',
      priority: String(contentMeta.meta.priority || item.priority || 'normal'),
      class_audience: classAudience,
      content_body: contentMeta.body,
      attachments: attachments,
      read_count: Number(item.read_count ?? item.views ?? item.reads ?? 0) || 0,
    };
  }

  function filterAndRender() {
    const currentUserId = getCurrentUserId();
    const teacherClassSet = new Set(STATE.classes.map(function (row) {
      return normalizeClassName(row.class_name);
    }));

    const filtered = STATE.items.filter(function (item) {
      const isMine = String(item.author_id ?? '') === currentUserId;
      const isSchool = item.target_role === 'all';
      const isTeacherTarget = item.target_role === 'teacher';
      const isClassAnnouncement = item.target_role === 'class';
      const matchesClass = isClassAnnouncement && item.class_audience.some(function (className) {
        return teacherClassSet.has(normalizeClassName(className));
      });
      const visible = isSchool || isTeacherTarget || isMine || matchesClass;
      if (!visible) return false;

      if (STATE.scope === 'school' && !isSchool) return false;
      if (STATE.scope === 'teacher' && !isTeacherTarget) return false;
      if (STATE.scope === 'class' && !matchesClass && !isMine) return false;
      if (STATE.scope === 'mine' && !isMine) return false;

      if (STATE.status === 'published' && !item.is_published) return false;
      if (STATE.status === 'draft' && item.is_published) return false;

      if (!STATE.search) return true;

      const haystack = [
        item.title,
        item.content_body,
        item.priority,
        item.target_role,
        (item.class_audience || []).join(' '),
      ].join(' ').toLowerCase();

      return haystack.includes(STATE.search);
    });

    STATE.filtered = filtered;
    renderTable();
    renderStats();
  }

  function renderStats() {
    const total = STATE.filtered.length;
    const school = STATE.filtered.filter(function (item) { return item.target_role === 'all'; }).length;
    const teacher = STATE.filtered.filter(function (item) { return item.target_role === 'teacher'; }).length;
    const classCount = STATE.filtered.filter(function (item) { return item.target_role === 'class'; }).length;
    const reads = STATE.filtered.reduce(function (sum, item) {
      const me = STATE.currentUser;
      const isOwner = me && item.author_id && String(item.author_id) === String(me.user_id);
      const isAdmin = me && (me.is_super_admin || (Array.isArray(me.roles) && me.roles.indexOf('admin') >= 0));
      if (isOwner || isAdmin) return sum + (Number(item.read_count) || 0);
      return sum;
    }, 0);

    setText('taaStatTotal', total);
    setText('taaStatSchool', school);
    setText('taaStatTeacher', teacher);
    setText('taaStatClass', classCount);
    setText('taaStatReads', reads);
  }

  function renderTable() {
    const tbody = el('taaTableBody');
    if (!tbody) return;

    if (!STATE.filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="taa-empty"><i class="fas fa-bullhorn"></i>No announcements found</div></td></tr>';
      return;
    }

    const currentUserId = getCurrentUserId();
    const isAdmin = Boolean(getUser() && (getUser().is_super_admin || (Array.isArray(getUser().roles) && getUser().roles.indexOf('admin') >= 0)));

    tbody.innerHTML = STATE.filtered.map(function (item) {
      const isMine = String(item.author_id ?? '') === currentUserId;
      const canManage = isAdmin || isMine;
      const statusLabel = item.is_published ? 'Published' : 'Draft';
      const statusClass = item.is_published ? 'published' : 'draft';
      const publishBtn = item.is_published ? 'Unpublish' : 'Publish';
      const audienceLabel = item.target_role === 'all'
        ? 'School'
        : item.target_role === 'teacher'
          ? 'Teacher'
          : 'Class(' + item.class_audience.length + ')';

      const publishAt = formatDate(item.published_at);
      const expiresAt = formatDate(item.expires_at);

      return '<tr>' +
        '<td>' +
          '<p class="taa-title">' + esc(item.title || '(untitled)') + '</p>' +
          '<p class="taa-snippet">' + esc(truncate(item.content_body || '', 145)) + '</p>' +
          (item.attachments.length
            ? '<div class="taa-snippet"><i class="fas fa-paperclip"></i> ' + item.attachments.length + ' attachment(s)</div>' + renderAttachmentLinks(item.attachments)
            : '') +
        '</td>' +
        '<td><span class="taa-chip ' + (item.target_role === 'all' ? 'school' : 'class') + '">' + esc(audienceLabel) + '</span></td>' +
        '<td><span class="taa-chip ' + esc(item.priority) + '">' + esc(capitalize(item.priority)) + '</span></td>' +
        '<td>' +
          '<div class="taa-snippet"><strong>Publish:</strong> ' + esc(publishAt || '-') + '</div>' +
          '<div class="taa-snippet"><strong>Expiry:</strong> ' + esc(expiresAt || '-') + '</div>' +
        '</td>' +
        '<td><span class="taa-chip ' + statusClass + '">' + statusLabel + '</span></td>' +
        '<td>' + (function(){
            const me = STATE.currentUser;
            const isOwner = me && item.author_id && String(item.author_id) === String(me.user_id);
            const isAdmin = me && (me.is_super_admin || (Array.isArray(me.roles) && me.roles.indexOf('admin') >= 0));
            return (isOwner || isAdmin) ? esc(String(item.read_count)) : '-';
          })() + '</td>' +
        '<td>' +
          '<div class="taa-actions">' +
            (canManage ? '<button class="taa-btn" type="button" data-action="edit" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-pen"></i> Edit</button>' : '') +
            (canManage ? '<button class="taa-btn" type="button" data-action="toggle-publish" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-toggle-on"></i> ' + publishBtn + '</button>' : '') +
            (canManage ? '<button class="taa-btn danger" type="button" data-action="delete" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-trash"></i> Delete</button>' : '') +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function openModal(item) {
    STATE.editingUuid = item?.uuid || null;
    STATE.pendingFiles = [];

    setText('taaModalTitle', item ? 'Edit Announcement' : 'New Announcement');
    setValue('taaFieldTitle', item?.title || '');
    setValue('taaFieldContent', item?.content_body || '');
    setValue('taaFieldPriority', item?.priority || 'normal');
    setValue('taaFieldPublished', item?.is_published ? '1' : '0');
    setValue('taaFieldExpiryDate', toDateTimeLocal(item?.expires_at));

    renderClassChoices(item?.class_audience || []);
    renderPendingFiles();
    hideError();
    el('taaFieldFiles') && (el('taaFieldFiles').value = '');
    el('taaModalOverlay')?.classList.add('open');
    el('taaFieldTitle')?.focus();
  }

  function closeModal() {
    el('taaModalOverlay')?.classList.remove('open');
    STATE.editingUuid = null;
    STATE.pendingFiles = [];
    hideError();
  }

  function renderClassChoices(selectedValues) {
    const wrap = el('taaClassList');
    if (!wrap) return;

    if (!STATE.classes.length) {
      wrap.innerHTML = '<div class="taa-empty" style="padding:1rem 0;text-align:left"><i class="fas fa-info-circle"></i>No teaching classes loaded yet</div>';
      return;
    }

    const selectedSet = new Set(normalizeClassAudience(selectedValues).map(normalizeClassName));
    wrap.innerHTML = STATE.classes.map(function (row, index) {
      const id = 'taaClass_' + index;
      const checked = selectedSet.size ? selectedSet.has(normalizeClassName(row.class_name)) : index === 0;
      return '<label class="taa-class-option" for="' + id + '">' +
        '<input id="' + id + '" type="checkbox" data-class-choice="1" value="' + escAttr(row.class_name) + '" ' + (checked ? 'checked' : '') + ' />' +
        '<div><strong>' + esc(row.class_name) + '</strong><span>Class target</span></div>' +
      '</label>';
    }).join('');
  }

  function renderPendingFiles() {
    const wrap = el('taaFileList');
    if (!wrap) return;

    if (!STATE.pendingFiles.length) {
      wrap.innerHTML = '';
      return;
    }

    wrap.innerHTML = STATE.pendingFiles.map(function (file) {
      return '<span class="taa-file-chip"><i class="fas fa-paperclip"></i> ' + esc(file.name || 'file') + '</span>';
    }).join('');
  }

  async function saveAnnouncement() {
    const title = getValue('taaFieldTitle');
    const contentBody = getValue('taaFieldContent');
    const priority = getValue('taaFieldPriority') || 'normal';
    const isPublished = getValue('taaFieldPublished') === '1';
    const expiryDate = getValue('taaFieldExpiryDate');
    const classAudience = getSelectedClasses();

    if (!title) {
      showError('Title is required.');
      return;
    }

    if (!contentBody) {
      showError('Content is required.');
      return;
    }

    if (!classAudience.length) {
      showError('Select at least one class to target.');
      return;
    }

    const payload = {
      title: title,
      content: packContent(contentBody, {
        priority: priority,
        class_audience: classAudience,
      }),
      target_role: 'class',
      is_published: isPublished ? 1 : 0,
      published_at: isPublished ? nowSql() : null,
      expires_at: expiryDate ? toSqlDateTime(expiryDate) : null,
    };

    const saveBtn = el('taaModalSave');
    if (saveBtn) saveBtn.disabled = true;

    try {
      let response;
      if (STATE.editingUuid) {
        response = await AnnouncementAPI.update(STATE.editingUuid, payload);
      } else {
        response = await AnnouncementAPI.create(payload);
      }

      const announcementUuid = extractAnnouncementUuid(response) || STATE.editingUuid;
      if (announcementUuid && STATE.pendingFiles.length) {
        await uploadAttachments(announcementUuid, STATE.pendingFiles);
      }

      toast(STATE.editingUuid ? 'Announcement updated' : 'Announcement created', 'success');
      closeModal();
      await loadAnnouncements();
    } catch (error) {
      console.error(error);
      showError(error?.message || 'Failed to save announcement');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  async function uploadAttachments(uuid, files) {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      await AnnouncementAPI.uploadAttachment(uuid, formData);
    }
  }

  async function deleteAnnouncement(uuid) {
    try {
      await AnnouncementAPI.delete(uuid);
      toast('Announcement deleted', 'success');
      await loadAnnouncements();
    } catch (error) {
      console.error(error);
      toast(error?.message || 'Failed to delete announcement', 'error');
    }
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
      await loadAnnouncements();
    } catch (error) {
      console.error(error);
      toast(error?.message || 'Failed to update publish status', 'error');
    }
  }

  function getSelectedClasses() {
    return Array.from(document.querySelectorAll('[data-class-choice="1"]:checked'))
      .map(function (node) { return String(node.value || '').trim(); })
      .filter(Boolean);
  }

  function extractAnnouncementUuid(response) {
    if (!response) return '';
    const data = response.data || response;
    return String(data.announcement_uuid || data.uuid || data.announcement?.uuid || '').trim();
  }

  function normalizeClassAudience(value) {
    if (Array.isArray(value)) return value.map(function (item) { return String(item || '').trim(); }).filter(Boolean);
    if (value == null) return [];
    return String(value)
      .split(',')
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
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
        return '<div class="taa-snippet">• ' + esc(name) + '</div>';
      }

      return '<div class="taa-snippet">• <a href="' + escAttr(url) + '" target="_blank" rel="noopener noreferrer">' + esc(name) + '</a> <a href="' + escAttr(url) + '" download style="margin-left:.35rem"><span style="text-decoration: underline; color: blue;" >Download</span></a></div>';
    }).join('');

    const more = attachments.length > 4
      ? '<div class="taa-snippet">+' + String(attachments.length - 4) + ' more file(s)</div>'
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
      return { meta: meta && typeof meta === 'object' ? meta : {}, body: body };
    } catch (_) {
      return { meta: {}, body: content };
    }
  }

  function packContent(body, meta) {
    const safeMeta = {
      priority: String(meta?.priority || 'normal'),
      class_audience: Array.isArray(meta?.class_audience) ? meta.class_audience.slice(0, 20) : [],
    };

    return META_PREFIX + JSON.stringify(safeMeta) + '\n' + String(body || '');
  }

  function showError(message) {
    const node = el('taaFormError');
    if (!node) return;
    node.style.display = 'block';
    node.textContent = message;
  }

  function hideError() {
    const node = el('taaFormError');
    if (!node) return;
    node.style.display = 'none';
    node.textContent = '';
  }

  function setValue(id, value) {
    const node = el(id);
    if (node) node.value = value == null ? '' : String(value);
  }

  function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = String(value);
  }

  function getValue(id) {
    const node = el(id);
    return node ? String(node.value || '').trim() : '';
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

  function capitalize(value) {
    const str = String(value || '');
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function normalizeClassName(value) {
    return String(value || '').trim().toLowerCase();
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