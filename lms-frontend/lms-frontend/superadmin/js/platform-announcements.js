/**
 * Platform Announcements Controller
 * Handles platform-wide announcements management for superadmin
 * Broadcast messages to all institutions and users
 */
(function () {
  'use strict';

  const META_PREFIX = '__ANN_META__';
  const POLL_INTERVAL = 60000; // 1 minute
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.png', '.zip'];

  const State = {
    items: [],
    filtered: [],
    editingUuid: null,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    searchTerm: '',
    statusFilter: 'all',
    priorityFilter: 'all',
    pendingFiles: [],
    existingFiles: [],
    institutions: [],
    pollTimer: null,
  };

  // Page initialization
  document.addEventListener('page:loaded', function (event) {
    if (event?.detail?.page === 'platform-announcements') {
      init();
    }
  });

  function init() {
    const root = document.getElementById('platformAnnouncementsRoot');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    bindEvents();
    loadInstitutions();
    loadAnnouncements();
    startPolling();
  }

  // Safe API client resolver (handles `API` or `window.API` global variants)
  function apiClient() {
    if (typeof window !== 'undefined' && window.API) return window.API;
    if (typeof API !== 'undefined') return API;
    return null;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function toast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  function showAlert(message, type = 'info') {
    // Prefer toast if available
    if (window.showToast) {
      window.showToast(message, type);
      return Promise.resolve();
    }
    // Fallback to simple modal
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'simple-dialog-overlay';
      overlay.innerHTML = `
        <div class="simple-dialog">
          <div class="simple-dialog-body">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
          <div class="simple-dialog-actions">
            <button class="btn btn-primary simple-dialog-ok">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('.simple-dialog-ok').addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve();
      });
    });
  }

  function showConfirm(title, message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'simple-dialog-overlay';
      overlay.innerHTML = `
        <div class="simple-dialog">
          <div class="simple-dialog-title">${escapeHtml(title)}</div>
          <div class="simple-dialog-body">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
          <div class="simple-dialog-actions">
            <button class="btn btn-outline simple-dialog-cancel">Cancel</button>
            <button class="btn btn-primary simple-dialog-yes">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('.simple-dialog-cancel').addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(false);
      });
      overlay.querySelector('.simple-dialog-yes').addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(true);
      });
    });
  }

  function confirmAction(title, message, onConfirm) {
    showConfirm(title, message).then((ok) => {
      if (ok) onConfirm();
    });
  }

  // Event Bindings
  function bindEvents() {
    el('annRefreshBtn')?.addEventListener('click', () => loadAnnouncements());
    el('annCreateBtn')?.addEventListener('click', () => openModal(null));
    el('annCreateEmptyBtn')?.addEventListener('click', () => openModal(null));

    el('annSearchInput')?.addEventListener('input', (e) => {
      State.searchTerm = String(e.target.value || '').trim().toLowerCase();
      State.currentPage = 1;
      filterAndRender();
    });

    el('annStatusFilter')?.addEventListener('change', (e) => {
      State.statusFilter = String(e.target.value || 'all');
      State.currentPage = 1;
      filterAndRender();
    });

    el('annPriorityFilter')?.addEventListener('change', (e) => {
      State.priorityFilter = String(e.target.value || 'all');
      State.currentPage = 1;
      filterAndRender();
    });

    el('annTargetRole')?.addEventListener('change', () => {
      syncNotificationOption();
    });

    el('annPagination')?.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-page]');
      if (!button) return;
      const nextPage = parseInt(button.getAttribute('data-page') || '1', 10);
      if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > State.totalPages) return;
      if (nextPage === State.currentPage) return;
      State.currentPage = nextPage;
      renderTable();
    });

    el('annModalClose')?.addEventListener('click', closeModal);
    el('annModalCancel')?.addEventListener('click', closeModal);
    el('annModalSave')?.addEventListener('click', saveAnnouncement);
    el('annModalOverlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    el('annPublishType')?.addEventListener('change', (e) => {
      const dateGroup = el('publishDateGroup');
      if (dateGroup) {
        dateGroup.style.display = e.target.value === 'schedule' ? 'flex' : 'none';
      }
    });

    el('annAllInstitutions')?.addEventListener('change', (e) => {
      const list = el('annInstitutionsList');
      if (list) {
        list.style.display = e.target.checked ? 'none' : 'grid';
      }
    });

    el('annFieldFiles')?.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      const validated = validateFiles(files);
      if (validated.valid) {
        State.pendingFiles = validated.files;
      } else {
        toast(validated.error, 'error');
        el('annFieldFiles').value = ''; // Reset input
      }
      renderPendingFiles();
    });

    const browseButton = document.querySelector('#platformAnnouncementsRoot .file-upload-area .btn-link');
    if (browseButton) {
      browseButton.addEventListener('click', (e) => {
        e.preventDefault();
        el('annFieldFiles')?.click();
      });
    }

    // Drag-and-drop for file upload
    const fileUploadArea = el('annFieldFiles')?.parentElement;
    if (fileUploadArea) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        fileUploadArea.addEventListener(eventName, preventDefaults, false);
      });

      ['dragenter', 'dragover'].forEach((eventName) => {
        fileUploadArea.addEventListener(eventName, () => {
          fileUploadArea.classList.add('drag-over');
        }, false);
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        fileUploadArea.addEventListener(eventName, () => {
          fileUploadArea.classList.remove('drag-over');
        }, false);
      });

      fileUploadArea.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files || []);
        const validated = validateFiles(files);
        if (validated.valid) {
          State.pendingFiles = validated.files;
        } else {
          toast(validated.error, 'error');
        }
        renderPendingFiles();
      }, false);
    }

    el('annTableBody')?.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const action = String(button.getAttribute('data-action') || '');
      const uuid = String(button.getAttribute('data-uuid') || '');
      if (!uuid) return;

      if (action === 'edit') {
        const item = State.items.find((x) => String(x.uuid) === uuid);
        openModal(item || null);
      } else if (action === 'delete') {
        const item = State.items.find((x) => String(x.uuid) === uuid);
        confirmAction(
          'Delete Announcement',
          `Delete "${item?.title || 'this announcement'}"? This cannot be undone.`,
          () => deleteAnnouncement(uuid)
        );
      } else if (action === 'publish') {
        const item = State.items.find((x) => String(x.uuid) === uuid);
        if (item) publishAnnouncement(item);
      }
    });

    window.addEventListener('beforeunload', stopPolling);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    });
  }

  // Load Institutions
  async function loadInstitutions() {
    try {
      const api = apiClient();
      if (!api) {
        console.warn('API client not available yet; skipping institutions load');
        return;
      }
      const response = await api.get(`${API_ENDPOINTS.INSTITUTIONS}?include_all=1&limit=500`);
      const institutionsPayload = response?.data;
      if (institutionsPayload) {
        State.institutions = Array.isArray(institutionsPayload)
          ? institutionsPayload
          : institutionsPayload.data || institutionsPayload.institutions || [];
        renderInstitutionsList();
      }
    } catch (error) {
      console.error('Failed to load institutions:', error);
    }
  }

  function renderInstitutionsList() {
    const list = el('annInstitutionsList');
    if (!list) return;

    if (!State.institutions.length) {
      list.innerHTML = '<div class="form-text">No institutions available.</div>';
      return;
    }

    list.innerHTML = State.institutions
      .map((inst) => `
        <label class="checkbox-label">
          <input type="checkbox" value="${inst.institution_id || inst.id}" />
          <span>${inst.institution_name || inst.name}</span>
        </label>
      `)
      .join('');
  }

  // Load Announcements
  async function loadAnnouncements() {
    try {
      const params = new URLSearchParams({
        scope: 'platform',
        page: 1,
        limit: 100,
      });

      const api = apiClient();
      if (!api) {
        console.warn('API client not available yet; skipping announcements load');
        return;
      }
      const response = await api.get(`${API_ENDPOINTS.ANNOUNCEMENTS}?${params.toString()}`);

      if (response.success && response.data) {
        State.items = Array.isArray(response.data)
          ? response.data
          : response.data.announcements || [];
        filterAndRender();
        updateStats();
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
      toast('Failed to load announcements', 'error');
    }
  }

  // Filter and Render
  function filterAndRender() {
    const search = State.searchTerm.toLowerCase();
    State.filtered = State.items.filter((item) => {
      const titleMatch = (item.title || '').toLowerCase().includes(search);
      const contentText = cleanContent(item.content || '');
      const contentMatch = contentText.toLowerCase().includes(search);

      let statusMatch = true;
      if (State.statusFilter !== 'all') {
        if (State.statusFilter === 'published') {
          statusMatch = item.is_published === 1;
        } else if (State.statusFilter === 'draft') {
          statusMatch = item.is_published === 0;
        } else if (State.statusFilter === 'scheduled') {
          statusMatch = item.published_at && new Date(item.published_at) > new Date();
        }
      }

      let priorityMatch = true;
      if (State.priorityFilter !== 'all') {
        const meta = parseMeta(item.meta || item.content);
        priorityMatch =
          (meta.priority || 'normal').toLowerCase() ===
          State.priorityFilter.toLowerCase();
      }

      return (titleMatch || contentMatch) && statusMatch && priorityMatch;
    });

    renderTable();
  }

  function updateStats() {
    const total = State.items.length;
    const published = State.items.filter((x) => x.is_published === 1).length;
    const draft = State.items.filter((x) => x.is_published === 0).length;
    const reaches = State.items.reduce((sum, x) => sum + (parseInt(x.read_count) || 0), 0);

    el('statTotal').textContent = total;
    el('statPublished').textContent = published;
    el('statDraft').textContent = draft;
    el('statReaches').textContent = reaches;
  }

  function renderTable() {
    const tbody = el('annTableBody');
    const emptyState = el('annEmptyState');
    const pagination = el('annPagination');

    const totalItems = State.filtered.length;
    State.totalPages = Math.max(1, Math.ceil(totalItems / State.pageSize));
    if (State.currentPage > State.totalPages) {
      State.currentPage = State.totalPages;
    }

    if (!totalItems) {
      tbody.innerHTML = '';
      emptyState.style.display = 'flex';
      if (pagination) {
        pagination.innerHTML = '';
        pagination.style.display = 'none';
      }
      return;
    }

    emptyState.style.display = 'none';

    const startIndex = (State.currentPage - 1) * State.pageSize;
    const pageItems = State.filtered.slice(startIndex, startIndex + State.pageSize);

    tbody.innerHTML = pageItems
      .map((item) => {
        const meta = parseMeta(item.meta || item.content);
        const status = getStatusBadge(item);
        const priority = meta.priority || 'normal';
        const target = item.target_role || 'all';
        const reaches = item.read_count || 0;

        return `
          <tr>
            <td>
              <div class="ann-title-cell">
                <p class="ann-title">${escapeHtml(item.title)}</p>
                <p class="ann-snippet">${escapeHtml(
                  cleanContent(item.content || '')
                    .substring(0, 100)
                    .replace(/\n/g, ' ')
                )}</p>
              </div>
            </td>
            <td>
              <span class="badge ${status.class}">${status.text}</span>
            </td>
            <td>
              <span class="badge ${priority === 'urgent' ? 'urgent' : 'normal'}">
                ${priority === 'urgent' ? '⚠️ Urgent' : 'Normal'}
              </span>
            </td>
            <td>
              <span class="badge target-badge">${escapeHtml(formatTarget(target))}</span>
            </td>
            <td>
              <div class="reach-count">${reaches}</div>
              <div class="reach-label">views</div>
            </td>
            <td>
              <div class="table-actions">
                <button
                  class="action-btn"
                  data-action="edit"
                  data-uuid="${item.uuid}"
                  title="Edit"
                >
                  <i class="fas fa-edit"></i>
                </button>
                ${
                  item.is_published === 0
                    ? `
                  <button
                    class="action-btn"
                    data-action="publish"
                    data-uuid="${item.uuid}"
                    title="Publish"
                  >
                    <i class="fas fa-paper-plane"></i>
                  </button>
                `
                    : ''
                }
                <button
                  class="action-btn danger"
                  data-action="delete"
                  data-uuid="${item.uuid}"
                  title="Delete"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    renderPagination();
  }

  function renderPagination() {
    const pagination = el('annPagination');
    if (!pagination) return;

    if (!State.filtered.length || State.totalPages <= 1) {
      pagination.innerHTML = '';
      pagination.style.display = 'none';
      return;
    }

    pagination.style.display = 'flex';

    const pages = buildPageNumbers(State.currentPage, State.totalPages);
    pagination.innerHTML = `
      <button class="page-btn" data-page="${Math.max(1, State.currentPage - 1)}" ${State.currentPage === 1 ? 'disabled' : ''}>Prev</button>
      ${pages.map((page) => page === '...' ? '<span class="page-ellipsis">...</span>' : `
        <button class="page-btn ${page === State.currentPage ? 'active' : ''}" data-page="${page}">${page}</button>
      `).join('')}
      <button class="page-btn" data-page="${Math.min(State.totalPages, State.currentPage + 1)}" ${State.currentPage === State.totalPages ? 'disabled' : ''}>Next</button>
    `;
  }

  function buildPageNumbers(currentPage, totalPages) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) pages.push('...');

    for (let page = left; page <= right; page += 1) {
      pages.push(page);
    }

    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);

    return pages;
  }

  function getStatusBadge(item) {
    if (item.is_published === 1) {
      return { text: 'Published', class: 'published' };
    }
    if (item.published_at && new Date(item.published_at) > new Date()) {
      return { text: 'Scheduled', class: 'scheduled' };
    }
    return { text: 'Draft', class: 'draft' };
  }

  function formatTarget(role) {
    const roles = {
      all: 'All Users',
      admin: 'Admins',
      teacher: 'Teachers',
      student: 'Students',
      parent: 'Parents',
    };
    return roles[role] || role;
  }

  // Modal Management
  function openModal(announcement = null) {
    const modal = el('annModalOverlay');
    const title = el('annModalTitle');
    const subtitle = el('annModalSubtitle');

    if (announcement) {
      title.textContent = 'Edit Platform Announcement';
      subtitle.textContent = 'Update and re-broadcast to all institutions';
      State.editingUuid = announcement.uuid;
      populateForm(announcement);
    } else {
      title.textContent = 'New Platform Announcement';
      subtitle.textContent = 'Broadcast to all institutions and users';
      State.editingUuid = null;
      resetForm();
    }

    modal.classList.add('open');
    syncNotificationOption();
  }

  function closeModal() {
    const modal = el('annModalOverlay');
    modal.classList.remove('open');
    State.editingUuid = null;
    State.pendingFiles = [];
    resetForm();
  }

  function resetForm() {
    el('annTitle').value = '';
    el('annContent').value = '';
    el('annTargetRole').value = '';
    el('annPriority').value = 'normal';
    el('annPublishType').value = 'draft';
    el('annPublishDate').value = '';
    el('annExpiryDate').value = '';
    el('annSendNotification').checked = true;
    el('annAllInstitutions').checked = true;
    el('annFieldFiles').value = '';
    el('annExistingFilesList').innerHTML = '';
    State.pendingFiles = [];
    renderPendingFiles();

    const dateGroup = el('publishDateGroup');
    if (dateGroup) {
      dateGroup.style.display = 'none';
    }

    const list = el('annInstitutionsList');
    if (list) {
      list.style.display = 'none';
    }

    syncNotificationOption();
  }

  function populateForm(announcement) {
    const meta = parseMeta(announcement.meta || announcement.content);

    el('annTitle').value = announcement.title || '';
    el('annContent').value = cleanContent(announcement.content) || '';
    el('annTargetRole').value = announcement.target_role || 'all';
    el('annPriority').value = meta.priority || 'normal';
    el('annSendNotification').checked = true;
    el('annAllInstitutions').checked = true;

    // Set publish type and date
    if (announcement.is_published === 1) {
      el('annPublishType').value = 'now';
    } else if (announcement.published_at) {
      el('annPublishType').value = 'schedule';
      el('annPublishDate').value = new Date(announcement.published_at)
        .toISOString()
        .slice(0, 16);
    } else {
      el('annPublishType').value = 'draft';
    }

    if (announcement.expires_at) {
      el('annExpiryDate').value = new Date(announcement.expires_at)
        .toISOString()
        .slice(0, 16);
    }

    State.pendingFiles = [];
    renderPendingFiles();
    State.existingFiles = normalizeAttachments(announcement.attachments);
    renderExistingFiles();
    // Handle institution scope: if announcement.institution_id is null -> All Institutions
    try {
      const allCheckbox = el('annAllInstitutions');
      const list = el('annInstitutionsList');
      if (typeof announcement.institution_id === 'undefined' || announcement.institution_id === null) {
        if (allCheckbox) allCheckbox.checked = true;
        if (list) list.style.display = 'none';
      } else {
        if (allCheckbox) allCheckbox.checked = false;
        if (list) list.style.display = 'grid';
        // Ensure institutions list exists and mark the matching one checked
        const checks = Array.from((list.querySelectorAll || (() => []))('input[type="checkbox"]'));
        checks.forEach((c) => {
          c.checked = parseInt(c.value || 0) === parseInt(announcement.institution_id || 0);
        });
      }
    } catch (e) {
      console.warn('Failed to set institution scope in form', e);
    }

    syncNotificationOption();
  }

  function cleanContent(content) {
    if (!content) return '';
    // Remove META prefix if present
    if (content.startsWith(META_PREFIX)) {
      const jsonEnd = content.indexOf('}');
      if (jsonEnd !== -1) {
        return content.substring(jsonEnd + 1).trim();
      }
    }
    return content;
  }

  function parseMeta(content) {
    if (!content || !content.startsWith(META_PREFIX)) return {};
    try {
      const jsonStr = content.substring(
        META_PREFIX.length,
        content.indexOf('}') + 1
      );
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  }

  function renderPendingFiles() {
    const list = el('annPendingFilesList');
    if (!list) return;

    if (!State.pendingFiles.length) {
      list.innerHTML = '';
      return;
    }

    list.innerHTML = State.pendingFiles
      .map((file, index) => `
        <div class="pending-file">
          <i class="fas fa-file"></i>
          <span class="pending-file-name">${escapeHtml(file.name)}</span>
          <span class="pending-file-size">${formatFileSize(file.size)}</span>
          <button
            type="button"
            class="pending-file-remove"
            data-index="${index}"
            title="Remove"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      `)
      .join('');

    list.querySelectorAll('.pending-file-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        State.pendingFiles.splice(index, 1);
        renderPendingFiles();
      });
    });
  }

  function normalizeAttachments(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  function renderExistingFiles() {
    const list = el('annExistingFilesList');
    if (!list) return;

    if (!State.existingFiles.length) {
      list.innerHTML = '';
      return;
    }

    list.innerHTML = `
      <div class="existing-files-title">Existing Attachments</div>
      ${State.existingFiles
        .map((file) => {
          const fileName = file.original_name || file.filename || file.name || 'Attachment';
          const fileUrl = file.url || '#';
          const fileSize = file.size ? formatFileSize(Number(file.size)) : '';
          return `
            <div class="existing-file">
              <i class="fas fa-paperclip"></i>
              <a class="existing-file-link" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(fileName)}">
                ${escapeHtml(fileName)}
              </a>
              <span class="existing-file-meta">${escapeHtml(fileSize)}</span>
            </div>
          `;
        })
        .join('')}
    `;
  }

  function syncNotificationOption() {
    const checkbox = el('annSendNotification');
    const helpText = el('annSendNotificationHelp');
    const targetRole = String(el('annTargetRole')?.value || '').trim();
    const isRoleTargeted = targetRole !== '' && targetRole !== 'all';

    if (!checkbox) return;

    checkbox.disabled = !isRoleTargeted;
    if (!isRoleTargeted) {
      checkbox.checked = false;
      if (helpText) {
        helpText.textContent = 'Notifications are sent when the announcement targets a specific role such as admins, teachers, students, or parents.';
      }
    } else {
      if (helpText) {
        helpText.textContent = 'Targeted users will receive notifications when they next log in.';
      }
      if (!checkbox.checked) {
        checkbox.checked = true;
      }
    }
  }

  // Save Announcement
  async function saveAnnouncement() {
    const title = el('annTitle').value.trim();
    const content = el('annContent').value.trim();
    const targetRole = el('annTargetRole').value.trim();
    const priority = el('annPriority').value;
    const publishType = el('annPublishType').value;
    const sendNotification = el('annSendNotification').checked;

    // Validation
    if (!title) {
      toast('Please enter a title', 'warning');
      return;
    }
    if (!content) {
      toast('Please enter announcement content', 'warning');
      return;
    }
    if (!targetRole) {
      toast('Please select target audience', 'warning');
      return;
    }

    const meta = { priority: priority || 'normal' };
    const metaPrefix = `${META_PREFIX}${JSON.stringify(meta)}\n`;
    const fullContent = metaPrefix + content;

    let publishedAt = null;
    if (publishType === 'now') {
      publishedAt = new Date().toISOString();
    } else if (publishType === 'schedule') {
      const dateStr = el('annPublishDate').value;
      if (!dateStr) {
        toast('Please select publish date and time', 'warning');
        return;
      }
      publishedAt = new Date(dateStr).toISOString();
    }

    const expiryDateStr = el('annExpiryDate').value;
    const expiresAt = expiryDateStr
      ? new Date(expiryDateStr).toISOString()
      : null;

    const payload = {
      title,
      content: fullContent,
      target_role: targetRole,
      is_published: publishType === 'now' ? 1 : 0,
      published_at: publishedAt,
      expires_at: expiresAt,
      scope: 'platform', // Indicates platform-wide
      send_notification: sendNotification,
    };
    // Institution targeting: if All Institutions is unchecked, collect selected institution ids
    try {
      const allChecked = el('annAllInstitutions')?.checked;
      if (!allChecked) {
        const checks = Array.from((el('annInstitutionsList') || {}).querySelectorAll?.('input[type="checkbox"]') || []);
        const ids = checks.filter((c) => c.checked).map((c) => parseInt(c.value || 0)).filter((n) => n > 0);
        if (ids.length) {
          payload.target_institutions = ids;
        }
      }
    } catch (e) {
      console.warn('Failed to collect institution targets', e);
    }

    try {
      let response;
      const api = apiClient();
      if (!api) {
        toast('API client not available; try reloading the page', 'error');
        return;
      }

      // Create/update announcement
      if (State.editingUuid) {
        response = await api.put(`${API_ENDPOINTS.ANNOUNCEMENTS}/${State.editingUuid}`, payload);
      } else {
        response = await api.post(API_ENDPOINTS.ANNOUNCEMENTS, payload);
      }

      if (response.success) {
        // The API may return a single uuid or multiple created uuids (when targeting multiple institutions)
        const createdUuids = response.data?.created_uuids || (response.data?.announcement_uuid ? [response.data.announcement_uuid] : (response.data?.uuid ? [response.data.uuid] : (State.editingUuid ? [State.editingUuid] : [])));

        // Upload files to each created announcement if any
        if (State.pendingFiles.length > 0 && createdUuids && createdUuids.length) {
          try {
            for (const announcementUuid of createdUuids) {
              for (const file of State.pendingFiles) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'announcement');
                formData.append('reference_id', announcementUuid);

                const uploadResponse = await api.upload(
                  `${API_ENDPOINTS.ANNOUNCEMENTS}/${announcementUuid}/attachments`,
                  formData
                );

                if (!uploadResponse.success) {
                  console.warn(`File ${file.name} upload failed for ${announcementUuid}:`, uploadResponse.message);
                }
              }
            }
          } catch (uploadError) {
            console.warn('File upload error:', uploadError);
          }
        }

        toast(
          State.editingUuid
            ? 'Announcement updated successfully'
            : 'Announcement created successfully',
          'success'
        );
        closeModal();
        loadAnnouncements();
      } else {
        toast(response.message || 'Failed to save announcement', 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast('Failed to save announcement', 'error');
    }
  }

  // Publish Announcement
  async function publishAnnouncement(announcement) {
    try {
      const api = apiClient();
      if (!api) {
        toast('API client not available; try reloading the page', 'error');
        return;
      }
      const response = await api.put(
        `${API_ENDPOINTS.ANNOUNCEMENTS}/${announcement.uuid}`,
        {
          is_published: 1,
          published_at: new Date().toISOString(),
        }
      );

      if (response.success) {
        toast('Announcement published successfully', 'success');
        loadAnnouncements();
      } else {
        toast(response.message || 'Failed to publish announcement', 'error');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast('Failed to publish announcement', 'error');
    }
  }

  // Delete Announcement
  async function deleteAnnouncement(uuid) {
    try {
      const api = apiClient();
      if (!api) {
        toast('API client not available; try reloading the page', 'error');
        return;
      }
      const response = await api.delete(`${API_ENDPOINTS.ANNOUNCEMENTS}/${uuid}`);

      if (response.success) {
        toast('Announcement deleted successfully', 'success');
        loadAnnouncements();
      } else {
        toast(response.message || 'Failed to delete announcement', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast('Failed to delete announcement', 'error');
    }
  }

  // Polling
  function startPolling() {
    stopPolling();
    State.pollTimer = setInterval(() => {
      if (!isPageVisible()) return;
      loadAnnouncements();
    }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (State.pollTimer) {
      clearInterval(State.pollTimer);
      State.pollTimer = null;
    }
  }

  function isPageVisible() {
    const root = document.getElementById('platformAnnouncementsRoot');
    return root && root.offsetParent !== null && !document.hidden;
  }

  // File Attachment Functions
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function validateFiles(files) {
    const toAdd = [];

    if (State.pendingFiles.length + files.length > MAX_FILES) {
      return {
        valid: false,
        error: `Maximum ${MAX_FILES} files allowed. You have ${State.pendingFiles.length} already.`,
        files: []
      };
    }

    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File "${file.name}" exceeds 10MB limit (${formatFileSize(file.size)})`,
          files: []
        };
      }

      // Check file type by extension
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_TYPES.includes(ext)) {
        return {
          valid: false,
          error: `File type "${ext}" not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`,
          files: []
        };
      }

      toAdd.push(file);
    }

    return {
      valid: true,
      error: null,
      files: toAdd
    };
  }

  function renderPendingFiles() {
    const list = el('annPendingFilesList');
    if (!list) return;

    if (!State.pendingFiles.length) {
      list.innerHTML = '';
      return;
    }

    list.innerHTML = State.pendingFiles
      .map((file, index) => `
        <div class="pending-file">
          <i class="fas fa-file"></i>
          <span class="pending-file-name" title="${file.name}">${file.name}</span>
          <span class="pending-file-size">${formatFileSize(file.size)}</span>
          <button type="button" class="pending-file-remove" data-index="${index}" title="Remove file">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `)
      .join('');

    // Bind remove handlers
    list.querySelectorAll('.pending-file-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(btn.getAttribute('data-index'));
        State.pendingFiles.splice(index, 1);
        renderPendingFiles();
      });
    });
  }

  // Utility Functions
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
})();
