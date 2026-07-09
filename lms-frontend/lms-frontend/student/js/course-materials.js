/* ============================================
   Student Course Materials Page
   SPA fragment: student/page/course-materials.html
============================================ */
(function () {
  'use strict';

  const BOOKMARKS_KEY = 'student_material_bookmarks';
  const HISTORY_KEY = 'student_material_history';

  const S = {
    studentUuid: null,
    initialized: false,
    courses: [],
    sectionsByCourse: new Map(),
    materials: [],
    view: [],
    bookmarks: {},
    history: [],
    previewUrl: '',
    previewMaterialId: 0,
    previewToken: 0,
    previewFailTimer: null,
    completionSent: new Set(),
  };

  function el(id) {
    return document.getElementById(id);
  }

  function esc(v) {
    return typeof escHtml === 'function'
      ? escHtml(String(v ?? ''))
      : String(v ?? '').replace(/[&<>"']/g, function (c) {
          return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') {
      showToast(msg, type || 'info');
      return;
    }
    console.log((type || 'info').toUpperCase() + ': ' + msg);
  }

  function asArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.sections)) return payload.sections;
    if (Array.isArray(payload?.data?.sections)) return payload.data.sections;
    return [];
  }

  function getStudentUuid() {
    const u = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    return u && (u.student_uuid || u.uuid) ? (u.student_uuid || u.uuid) : null;
  }

  function getCourseLabel(course) {
    const subject = course.subject_name || 'Subject';
    const className = course.class_name || 'Class';
    return subject + ' - ' + className;
  }

  function normalizeType(material) {
    if (material && material.external_link && !material.file_name) return 'LINK';

    const ext = getFileExtension(material?.file_name, getUrl(material));
    if (!ext) {
      return material && material.external_link ? 'LINK' : 'FILE';
    }

    return ext.toUpperCase();
  }

  function extensionBadgeClass(material) {
    const ext = getFileExtension(material?.file_name, getUrl(material));
    const known = {
      pdf: 'ext-pdf',
      doc: 'ext-doc',
      docx: 'ext-docx',
      txt: 'ext-txt',
      odt: 'ext-odt',
      rtf: 'ext-rtf',
      ppt: 'ext-ppt',
      pptx: 'ext-pptx',
      xls: 'ext-xls',
      xlsx: 'ext-xlsx',
    };

    if (known[ext]) return known[ext];
    if (material && material.external_link) return 'ext-link';
    return 'ext-file';
  }

  function fmtDate(v) {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString();
  }

  function fmtDateTime(v) {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  }

  function getUrl(material) {
    const raw = String(material.external_link || material.file_path || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;

    const normalized = raw.replace(/^\/+/, '');
    const withUploadsPrefix = /^uploads\//i.test(normalized)
      ? normalized
      : 'uploads/' + normalized;

    return String(API_BASE_URL || '') + '/' + withUploadsPrefix;
  }

  function canDownload(material) {
    return String(material?.access_permission || 'download').toLowerCase() !== 'view';
  }

  function getFileExtension(fileName, url) {
    const fromName = String(fileName || '').trim();
    if (fromName && fromName.indexOf('.') > -1) {
      return fromName.split('.').pop().toLowerCase();
    }

    const noQuery = String(url || '').split('?')[0].split('#')[0];
    if (noQuery.indexOf('.') > -1) {
      return noQuery.split('.').pop().toLowerCase();
    }

    return '';
  }

  function getYouTubeEmbedUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';

    try {
      const u = new URL(raw);
      const host = (u.hostname || '').toLowerCase();

      if (host.indexOf('youtu.be') > -1) {
        const id = (u.pathname || '').replace(/^\/+/, '');
        return id ? ('https://www.youtube.com/embed/' + encodeURIComponent(id)) : '';
      }

      if (host.indexOf('youtube.com') > -1) {
        const v = u.searchParams.get('v');
        if (v) return 'https://www.youtube.com/embed/' + encodeURIComponent(v);
        if (u.pathname.indexOf('/embed/') === 0) return raw;
      }
    } catch (_) {
      return '';
    }

    return '';
  }

  function isKnownIframeBlockedHost(url) {
    try {
      const u = new URL(String(url || '').trim());
      const host = (u.hostname || '').toLowerCase().replace(/^www\./, '');
      const blockedHosts = new Set([
        'google.com',
        'docs.google.com',
        'drive.google.com',
        'facebook.com',
        'instagram.com',
        'x.com',
        'twitter.com',
      ]);
      return blockedHosts.has(host);
    } catch (_) {
      return false;
    }
  }

  function isPrivateOrLocalUrl(url) {
    try {
      const u = new URL(String(url || '').trim());
      const host = (u.hostname || '').toLowerCase();

      if (!host) return true;
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;

      // RFC1918/private ranges and link-local ranges (Office web viewer cannot reach these)
      if (/^10\./.test(host)) return true;
      if (/^192\.168\./.test(host)) return true;
      if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
      if (/^169\.254\./.test(host)) return true;

      return false;
    } catch (_) {
      return true;
    }
  }

  function toAbsoluteUploadUrl(rawPath) {
    const raw = String(rawPath || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;

    const normalized = raw.replace(/^\/+/, '');
    const withUploadsPrefix = /^uploads\//i.test(normalized)
      ? normalized
      : 'uploads/' + normalized;

    return String(API_BASE_URL || '') + '/' + withUploadsPrefix;
  }

  function getPublicPreviewUrl(url) {
    const raw = String(url || '').trim();
    if (!raw || !/^https?:\/\//i.test(raw)) return '';

    if (!isPrivateOrLocalUrl(raw)) {
      return raw;
    }

    // Optional override for hosted deployments where uploaded files are publicly reachable.
    const publicBase = String(window.PUBLIC_FILE_BASE_URL || window.PUBLIC_ASSET_BASE_URL || '').trim().replace(/\/+$/, '');
    if (!publicBase) return '';

    try {
      const u = new URL(raw);
      const path = String(u.pathname || '').replace(/^\/+/, '');
      const withUploadsPrefix = /^uploads\//i.test(path)
        ? path
        : 'uploads/' + path;
      return publicBase + '/' + withUploadsPrefix;
    } catch (_) {
      return '';
    }
  }

  function getServerPdfPreviewUrl(material) {
    const candidates = [
      material?.preview_pdf_url,
      material?.preview_pdf_path,
      material?.preview_path,
    ];

    for (let i = 0; i < candidates.length; i += 1) {
      const url = toAbsoluteUploadUrl(candidates[i]);
      if (url) return url;
    }

    return '';
  }

  function getPreviewDescriptor(material) {
    const url = getUrl(material);
    if (!url) {
      return { type: 'unsupported', url: '', embedUrl: '', reason: 'No file or link is available for preview.' };
    }

    const ext = getFileExtension(material?.file_name, url);
    const officeExts = new Set(['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']);
    const videoExts = new Set(['mp4', 'avi', 'mov', 'wmv', 'webm', 'm4v']);
    const imageExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']);
    const lowerUrl = String(url || '').toLowerCase();
    const youtubeEmbed = getYouTubeEmbedUrl(url);

    if (youtubeEmbed) {
      return { type: 'youtube', url: url, embedUrl: youtubeEmbed, reason: '' };
    }

    if (ext === 'pdf' || lowerUrl.indexOf('.pdf') > -1) {
      return { type: 'pdf', url: url, embedUrl: url, reason: '' };
    }

    if (videoExts.has(ext) || /\.(mp4|avi|mov|wmv|webm|m4v)(\?|#|$)/i.test(lowerUrl)) {
      return { type: 'video', url: url, embedUrl: url, reason: '' };
    }

    if (imageExts.has(ext) || /\.(jpg|jpeg|png|gif|webp|bmp)(\?|#|$)/i.test(lowerUrl)) {
      return { type: 'image', url: url, embedUrl: url, reason: '' };
    }

    if (officeExts.has(ext)) {
      const publicOfficeUrl = getPublicPreviewUrl(url) || url;

      const pdfPreviewUrl = getServerPdfPreviewUrl(material);
      if (pdfPreviewUrl) {
        return {
          type: 'pdf',
          url: url,
          embedUrl: pdfPreviewUrl,
          reason: ''
        };
      }

      if (isPrivateOrLocalUrl(publicOfficeUrl)) {
        return {
          type: 'generic-link',
          url: url,
          embedUrl: '',
          reason: 'Office preview requires a publicly accessible file URL. When hosted, set PUBLIC_FILE_BASE_URL to your public uploads domain, or provide a server-generated PDF preview path for this file.'
        };
      }

      return {
        type: 'office',
        url: url,
        embedUrl: 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(publicOfficeUrl),
        reason: ''
      };
    }

    if (/^https?:\/\//i.test(url)) {
      if (isKnownIframeBlockedHost(url)) {
        return {
          type: 'generic-link',
          url: url,
          embedUrl: '',
          reason: 'This website blocks inline preview. Please use Open in New Tab.'
        };
      }

      return {
        type: 'web-link',
        url: url,
        embedUrl: url,
        reason: ''
      };
    }

    return {
      type: 'unsupported',
      url: url,
      embedUrl: '',
      reason: 'Preview is not supported for this material.'
    };
  }

  function renderPreviewMedia(material, descriptor) {
    const body = el('scmPreviewBody');
    if (!body) return;

    clearPreviewFailTimer();
    body.innerHTML = '';

    if (descriptor.type === 'video') {
      const video = document.createElement('video');
      video.className = 'scm-preview-frame';
      video.controls = true;
      video.preload = 'metadata';
      video.src = descriptor.embedUrl;
      body.appendChild(video);
      return;
    }

    if (descriptor.type === 'image') {
      const image = document.createElement('img');
      image.src = descriptor.embedUrl;
      image.alt = material?.title || 'Material image preview';
      image.style.width = '100%';
      image.style.height = '100%';
      image.style.objectFit = 'contain';
      image.style.border = '0';
      body.appendChild(image);
      return;
    }
  }

  function clearPreviewFailTimer() {
    if (S.previewFailTimer) {
      clearTimeout(S.previewFailTimer);
      S.previewFailTimer = null;
    }
  }

  function renderPreviewFallback(material, reason) {
    const body = el('scmPreviewBody');
    if (!body) return;

    body.innerHTML = ''
      + '<div class="scm-empty" style="padding:1.4rem 1rem;">'
      + '  <i class="fas fa-file-circle-question"></i>'
      + '  <div style="font-weight:600;color:#0f172a;margin-bottom:0.25rem;">Preview unavailable</div>'
      + '  <div style="margin:0 auto;max-width:520px;">' + esc(reason || 'This material cannot be previewed in-app.') + '</div>'
      + '</div>';

    const downloadBtn = el('scmPreviewDownloadBtn');
    if (downloadBtn) {
      downloadBtn.style.display = canDownload(material) ? '' : 'none';
    }
  }

  function renderPreviewFrame(material, descriptor, token) {
    const body = el('scmPreviewBody');
    if (!body) return;

    clearPreviewFailTimer();

    body.innerHTML = '';
    const frame = document.createElement('iframe');
    frame.className = 'scm-preview-frame';
    frame.setAttribute('allowfullscreen', 'true');
    frame.setAttribute('loading', 'lazy');
    frame.src = descriptor.embedUrl;

    frame.addEventListener('load', function () {
      if (token !== S.previewToken) return;
      clearPreviewFailTimer();
    });

    frame.addEventListener('error', function () {
      if (token !== S.previewToken) return;
      clearPreviewFailTimer();
      renderPreviewFallback(material, 'Failed to load preview. You can still open it in a new tab' + (canDownload(material) ? ' or download it.' : '.'));
    });

    body.appendChild(frame);

    // Office and many web links may fail silently in iframes due to CSP/X-Frame-Options.
    if (descriptor.type === 'office' || descriptor.type === 'web-link') {
      S.previewFailTimer = setTimeout(function () {
        if (token !== S.previewToken) return;
        if (descriptor.type === 'office') {
          renderPreviewFallback(material, 'Office web preview is unavailable right now. You can still open the file in a new tab' + (canDownload(material) ? ' or download it.' : '.'));
          return;
        }
        renderPreviewFallback(material, 'This website does not allow inline preview in an iframe. You can still open it in a new tab' + (canDownload(material) ? ' or download it.' : '.'));
      }, descriptor.type === 'office' ? 8000 : 5000);
    }
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // Ignore localStorage issues.
    }
  }

  function loadPrefs() {
    S.bookmarks = readJson(BOOKMARKS_KEY, {});
    const rows = readJson(HISTORY_KEY, []);
    S.history = Array.isArray(rows) ? rows : [];
  }

  function saveBookmarks() {
    saveJson(BOOKMARKS_KEY, S.bookmarks);
  }

  function saveHistory() {
    saveJson(HISTORY_KEY, S.history);
  }

  function isBookmarked(materialId) {
    return !!S.bookmarks[String(materialId)];
  }

  function toggleBookmark(materialId) {
    const key = String(materialId || '');
    if (!key) return;
    if (S.bookmarks[key]) {
      delete S.bookmarks[key];
      toast('Removed from bookmarks.', 'info');
    } else {
      S.bookmarks[key] = true;
      toast('Added to bookmarks.', 'success');
    }
    saveBookmarks();
    applyFilters();
  }

  function addHistory(material) {
    const row = {
      material_id: Number(material.material_id || 0),
      title: material.title || 'Untitled',
      course_label: material.course_label || '',
      downloaded_at: new Date().toISOString(),
      url: getUrl(material),
    };

    S.history = [row].concat(S.history.filter(function (item) {
      return !(Number(item.material_id) === row.material_id && item.url === row.url);
    })).slice(0, 50);

    saveHistory();
  }

  async function markMaterialCompletion(material, source) {
    const materialId = Number(material?.material_id || 0);
    const courseId = Number(material?.course_id || 0);
    if (!materialId || !courseId) return;

    const key = String(materialId);
    if (S.completionSent.has(key)) return;

    S.completionSent.add(key);

    try {
      await CourseContentAPI.markMaterialComplete(courseId, materialId, {
        source: String(source || 'open').toLowerCase(),
      });

      // Keep UI in sync without forcing a full reload.
      const target = S.materials.find(function (item) {
        return Number(item.material_id) === materialId;
      });
      if (target) {
        target.is_completed = true;
      }
      applyFilters();
    } catch (_) {
      // Completion tracking is best-effort and should not block material access.
    }
  }

  async function loadCourses() {
    if (!S.studentUuid) throw new Error('Student session not found. Please sign in again.');

    const res = await API.get(API_ENDPOINTS.STUDENT_COURSES(S.studentUuid));
    const rows = asArray(res?.data || res);

    const unique = new Map();
    rows.forEach(function (row) {
      const id = Number(row.course_id || row.id || 0);
      if (!Number.isInteger(id) || id <= 0) return;
      if (!unique.has(id)) {
        unique.set(id, {
          course_id: id,
          subject_name: row.subject_name || row.subject || 'Subject',
          class_name: row.class_name || row.class || 'Class',
        });
      }
    });

    S.courses = Array.from(unique.values()).sort(function (a, b) {
      return getCourseLabel(a).localeCompare(getCourseLabel(b));
    });
  }

  async function loadSections(courseId) {
    const id = Number(courseId || 0);
    if (!id) return [];
    if (S.sectionsByCourse.has(id)) return S.sectionsByCourse.get(id);

    let rows = [];
    try {
      const res = await CourseContentAPI.getSections(id);
      rows = asArray(res?.data || res);
    } catch (_) {
      rows = [];
    }

    const sections = rows
      .map(function (row) {
        return {
          section_id: Number(row.course_sections_id || row.section_id || row.id || 0),
          section_name: row.section_name || row.name || 'Topic',
          is_active: Number(row.is_active ?? 1) === 1,
        };
      })
      .filter(function (row) {
        return Number.isInteger(row.section_id) && row.section_id > 0;
      });

    S.sectionsByCourse.set(id, sections);
    return sections;
  }

  async function loadMaterials() {
    const grouped = await Promise.all(S.courses.map(async function (course) {
      await loadSections(course.course_id);

      const res = await CourseContentAPI.getMaterials(course.course_id);
      const rows = asArray(res?.data || res);

      return rows.map(function (row) {
        const sectionId = Number(row.section_id || row.course_section_id || row.course_sections_id || 0);
        const sections = S.sectionsByCourse.get(Number(course.course_id)) || [];
        const section = sections.find(function (s) { return Number(s.section_id) === sectionId; });
        const isVisibleSection = !section || !!section.is_active;
        const isActiveMaterial = Number(row.is_active ?? 1) === 1 && String(row.status || 'active').toLowerCase() !== 'inactive';

        // If a topic/unit/week is inactive, students should not see any materials inside it.
        if (!isVisibleSection) {
          return null;
        }

        // Students should never see materials marked inactive by the teacher.
        if (!isActiveMaterial) {
          return null;
        }

        return {
          material_id: Number(row.material_id || 0),
          course_id: Number(course.course_id),
          course_label: getCourseLabel(course),
          section_id: sectionId,
          section_name: row.section_name || section?.section_name || 'General',
          title: row.title || 'Untitled Material',
          description: row.description || '',
          file_name: row.file_name || '',
          file_path: row.file_path || '',
          preview_pdf_url: row.preview_pdf_url || row.preview_pdf_path || row.preview_path || '',
          external_link: row.external_link || '',
          is_required: Number(row.is_required || 0) === 1,
          access_permission: String(row.access_permission || 'download').toLowerCase(),
          material_type: row.material_type || '',
          created_at: row.created_at || row.uploaded_at || row.updated_at || null,
          is_completed: Number(row.is_completed || 0) === 1,
          completed_at: row.completed_at || null,
          completion_source: row.completion_source || null,
        };
      }).filter(Boolean);
    }));

    S.materials = grouped.flat().filter(function (m) {
      return Number.isInteger(m.material_id) && m.material_id > 0;
    }).sort(function (a, b) {
      const at = new Date(a.created_at || 0).getTime();
      const bt = new Date(b.created_at || 0).getTime();
      if (at && bt && at !== bt) return bt - at;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }

  function populateCourseFilter() {
    const courseFilter = el('scmCourseFilter');
    if (!courseFilter) return;

    courseFilter.innerHTML = ['<option value="all">All Subjects / Classes</option>']
      .concat(S.courses.map(function (course) {
        return '<option value="' + course.course_id + '">' + esc(getCourseLabel(course)) + '</option>';
      }))
      .join('');
  }

  function populateSectionFilter() {
    const sectionFilter = el('scmSectionFilter');
    if (!sectionFilter) return;

    const selectedCourse = String(el('scmCourseFilter')?.value || 'all');
    const current = String(sectionFilter.value || 'all');

    let sections = [];
    if (selectedCourse === 'all') {
      S.courses.forEach(function (course) {
        const list = (S.sectionsByCourse.get(Number(course.course_id)) || []).filter(function (sec) {
          return !!sec.is_active;
        });
        list.forEach(function (sec) {
          sections.push({
            section_id: sec.section_id,
            section_name: sec.section_name + ' - ' + getCourseLabel(course),
          });
        });
      });
    } else {
      sections = (S.sectionsByCourse.get(Number(selectedCourse)) || []).filter(function (sec) {
        return !!sec.is_active;
      }).map(function (sec) {
        return {
          section_id: sec.section_id,
          section_name: sec.section_name,
        };
      });
    }

    sectionFilter.innerHTML = ['<option value="all">All Topics</option>']
      .concat(sections.map(function (sec) {
        return '<option value="' + sec.section_id + '">' + esc(sec.section_name) + '</option>';
      }))
      .join('');

    const hasCurrent = sections.some(function (sec) { return String(sec.section_id) === current; });
    sectionFilter.value = hasCurrent ? current : 'all';
  }

  function applyFilters() {
    const courseVal = String(el('scmCourseFilter')?.value || 'all');
    const sectionVal = String(el('scmSectionFilter')?.value || 'all');
    const q = String(el('scmSearchInput')?.value || '').trim().toLowerCase();
    const bookmarkedOnly = !!el('scmBookmarkedOnly')?.checked;
    const requiredOnly = !!el('scmRequiredOnly')?.checked;
    const completionFilter = String(el('scmCompletionFilter')?.value || 'all');

    S.view = S.materials.filter(function (m) {
      if (courseVal !== 'all' && Number(m.course_id) !== Number(courseVal)) return false;
      if (sectionVal !== 'all' && Number(m.section_id) !== Number(sectionVal)) return false;
      if (bookmarkedOnly && !isBookmarked(m.material_id)) return false;
      if (requiredOnly && !m.is_required) return false;
      if (completionFilter === 'completed' && !m.is_completed) return false;
      if (completionFilter === 'not_completed' && m.is_completed) return false;

      if (q) {
        const hay = [m.title, m.description, m.file_name, m.course_label, m.section_name].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }

      return true;
    });

    renderStats();
    renderMaterialList();
    renderRecentList();
    renderHistoryList();
  }

  function renderStats() {
    const recentLimit = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCount = S.materials.filter(function (m) {
      const ts = new Date(m.created_at || 0).getTime();
      return ts && ts >= recentLimit;
    }).length;

    if (el('scmTotalCount')) el('scmTotalCount').textContent = String(S.view.length);
    if (el('scmRecentCount')) el('scmRecentCount').textContent = String(recentCount);
    if (el('scmDownloadCount')) el('scmDownloadCount').textContent = String(S.history.length);
    if (el('scmBookmarkCount')) el('scmBookmarkCount').textContent = String(Object.keys(S.bookmarks).length);
  }

  function renderMaterialList() {
    const root = el('scmMaterialList');
    if (!root) return;

    if (!S.courses.length) {
      root.innerHTML = '<div class="scm-empty"><i class="fas fa-book"></i>No enrolled course has shared materials yet.</div>';
      return;
    }

    if (!S.view.length) {
      root.innerHTML = '<div class="scm-empty"><i class="fas fa-inbox"></i>No materials found for your filters.</div>';
      return;
    }

    root.innerHTML = S.view.map(function (m) {
      const bookmarked = isBookmarked(m.material_id);
      const downloadButton = canDownload(m)
        ? '<button type="button" class="btn btn-sm btn-primary" data-action="download"><i class="fas fa-download"></i> Download</button>'
        : '';
      return ''
        + '<article class="scm-card" data-material-id="' + m.material_id + '">'
        + '  <div class="scm-card-title">'
        + '    <div>'
        + '      <strong>' + esc(m.title) + '</strong>'
        + '      <div class="scm-card-sub">' + esc(m.course_label) + ' | ' + esc(m.section_name || '-') + '</div>'
        + (m.is_required ? '      <div class="scm-chip required" aria-label="Required material">Required</div>' : '')
        + '      <div class="scm-chip ' + (m.is_completed ? 'complete' : 'not-complete') + '" aria-label="Completion status">'
        + (m.is_completed ? 'Completed' : 'Not Completed')
        + '</div>'
        + '    </div>'
        + '    <button type="button" class="btn btn-sm btn-outline" data-action="bookmark" title="Bookmark">'
        + '      <i class="' + (bookmarked ? 'fas' : 'far') + ' fa-star"></i>'
        + '    </button>'
        + '  </div>'
        + '  <div class="scm-card-sub">' + esc(m.description || 'No description provided.') + '</div>'
        + '  <div class="scm-chip ' + extensionBadgeClass(m) + '">' + esc(normalizeType(m)) + '</div>'
        + '  <div class="scm-card-actions">'
        + '    <button type="button" class="btn btn-sm btn-outline" data-action="preview"><i class="fas fa-eye"></i> Preview</button>'
        + '    <button type="button" class="btn btn-sm btn-outline" data-action="open"><i class="fas fa-arrow-up-right-from-square"></i> Open</button>'
        +      downloadButton
        + '  </div>'
        + '</article>';
    }).join('');
  }

  function renderRecentList() {
    const root = el('scmRecentList');
    if (!root) return;

    const rows = S.materials.slice(0, 8);
    if (!rows.length) {
      root.innerHTML = '<div class="scm-empty">No recently uploaded materials.</div>';
      return;
    }

    root.innerHTML = rows.map(function (m) {
      return ''
        + '<div class="scm-side-item">'
        + '  <strong>' + esc(m.title) + '</strong>'
        + '  <span>' + esc(m.course_label) + '</span>'
        + '  <span>' + esc(fmtDate(m.created_at)) + '</span>'
        + '</div>';
    }).join('');
  }

  function renderHistoryList() {
    const root = el('scmHistoryList');
    if (!root) return;

    if (!S.history.length) {
      root.innerHTML = '<div class="scm-empty">No downloads yet.</div>';
      return;
    }

    root.innerHTML = S.history.map(function (h) {
      return ''
        + '<div class="scm-side-item">'
        + '  <strong>' + esc(h.title) + '</strong>'
        + '  <span>' + esc(h.course_label || '-') + '</span>'
        + '  <span>' + esc(fmtDateTime(h.downloaded_at)) + '</span>'
        + '</div>';
    }).join('');
  }

  function openPreview(material) {
    const descriptor = getPreviewDescriptor(material);
    if (!descriptor.url) {
      toast('No file or link found for this material.', 'warning');
      return;
    }

    S.previewToken += 1;
    const token = S.previewToken;
    S.previewUrl = descriptor.url;
    S.previewMaterialId = Number(material.material_id || 0);

    const overlay = el('scmPreviewOverlay');
    const title = el('scmPreviewTitle');
    const body = el('scmPreviewBody');
    const downloadBtn = el('scmPreviewDownloadBtn');
    if (title) title.textContent = 'Preview - ' + (material.title || 'Material');

    if (downloadBtn) {
      downloadBtn.style.display = canDownload(material) ? '' : 'none';
    }

    if (body) {
      if (descriptor.type === 'video' || descriptor.type === 'image') {
        renderPreviewMedia(material, descriptor);
      } else if (descriptor.type === 'youtube' || descriptor.type === 'pdf' || descriptor.type === 'office' || descriptor.type === 'web-link') {
        renderPreviewFrame(material, descriptor, token);
      } else {
        renderPreviewFallback(material, descriptor.reason || 'Preview is not supported for this material.');
      }
    }

    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }

    markMaterialCompletion(material, 'preview');
  }

  function closePreview() {
    S.previewToken += 1;
    clearPreviewFailTimer();

    const overlay = el('scmPreviewOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    if (el('scmPreviewBody')) el('scmPreviewBody').innerHTML = '';
    S.previewUrl = '';
    S.previewMaterialId = 0;
  }

  function findMaterial(materialId) {
    return S.materials.find(function (m) {
      return Number(m.material_id) === Number(materialId);
    }) || null;
  }

  function openMaterial(material, trackHistory) {
    const url = getUrl(material);
    if (!url) {
      toast('No file or link found for this material.', 'warning');
      return;
    }

    window.open(url, '_blank', 'noopener');
    if (trackHistory !== false) {
      addHistory(material);
      renderHistoryList();
      renderStats();
    }

    markMaterialCompletion(material, 'open');
  }

  function downloadMaterial(material) {
    if (!canDownload(material)) {
      toast('This material is view only.', 'warning');
      return;
    }

    const url = getUrl(material);
    if (!url) {
      toast('No downloadable file found for this material.', 'warning');
      return;
    }

    addHistory(material);
    renderHistoryList();
    renderStats();

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.download = material.file_name || 'material';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    markMaterialCompletion(material, 'download');
  }

  function clearHistory() {
    S.history = [];
    saveHistory();
    renderHistoryList();
    renderStats();
    toast('Download history cleared.', 'success');
  }

  function bindEvents() {
    el('scmCourseFilter')?.addEventListener('change', function () {
      populateSectionFilter();
      applyFilters();
    });

    el('scmSectionFilter')?.addEventListener('change', applyFilters);
    el('scmSearchInput')?.addEventListener('input', applyFilters);
    el('scmBookmarkedOnly')?.addEventListener('change', applyFilters);
    el('scmRequiredOnly')?.addEventListener('change', applyFilters);
    el('scmCompletionFilter')?.addEventListener('change', applyFilters);
    el('scmClearHistoryBtn')?.addEventListener('click', clearHistory);

    el('scmMaterialList')?.addEventListener('click', function (event) {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;

      const card = btn.closest('[data-material-id]');
      const materialId = Number(card?.getAttribute('data-material-id') || 0);
      if (!materialId) return;

      const material = findMaterial(materialId);
      if (!material) return;

      const action = btn.getAttribute('data-action');
      if (action === 'bookmark') toggleBookmark(materialId);
      if (action === 'preview') openPreview(material);
      if (action === 'open') openMaterial(material, true);
      if (action === 'download') downloadMaterial(material);
    });

    el('scmPreviewCloseBtn')?.addEventListener('click', closePreview);
    el('scmPreviewOverlay')?.addEventListener('click', function (event) {
      if (event.target === el('scmPreviewOverlay')) closePreview();
    });

    el('scmPreviewOpenTabBtn')?.addEventListener('click', function () {
      if (!S.previewUrl) return;
      window.open(S.previewUrl, '_blank', 'noopener');
    });

    el('scmPreviewDownloadBtn')?.addEventListener('click', function () {
      if (!S.previewMaterialId) return;
      const material = findMaterial(S.previewMaterialId);
      if (!material) return;
      downloadMaterial(material);
    });
  }

  async function init() {
    const root = el('studentCourseMaterialsPageRoot');
    if (!root) return;
    if (root.dataset.initialized === '1') return;

    if (typeof Auth !== 'undefined' && typeof Auth.requireAuth === 'function') {
      if (!Auth.requireAuth([USER_ROLES.STUDENT])) return;
    }

    root.dataset.initialized = '1';
    S.studentUuid = getStudentUuid();
    S.sectionsByCourse.clear();
    S.courses = [];
    S.materials = [];
    S.view = [];
    S.previewUrl = '';
    S.previewMaterialId = 0;
    S.completionSent.clear();
    loadPrefs();

    bindEvents();

    try {
      await loadCourses();
      populateCourseFilter();

      if (!S.courses.length) {
        renderMaterialList();
        renderRecentList();
        renderHistoryList();
        renderStats();
        return;
      }

      await loadMaterials();
      populateSectionFilter();
      applyFilters();
    } catch (error) {
      console.error('Student materials init error:', error);
      if (el('scmMaterialList')) {
        el('scmMaterialList').innerHTML = '<div class="scm-error"><i class="fas fa-exclamation-circle"></i>'
          + esc(error?.message || 'Failed to load materials.') + '</div>';
      }
      renderRecentList();
      renderHistoryList();
      renderStats();
      toast(error?.message || 'Failed to load course materials.', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('page:loaded', function (event) {
    if (event.detail && event.detail.page === 'course-materials') {
      init();
    }
  });
})();
