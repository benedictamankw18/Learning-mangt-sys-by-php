/* ============================================
   Teacher Course Materials Page
   SPA fragment: teacher/page/course-materials.html
============================================ */
(function () {
  'use strict';

  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  const ALLOWED_EXTS = new Set([
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'odt', 'rtf',
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'mp4', 'avi', 'mov', 'wmv'
  ]);
  const MATERIAL_TYPE_EXTS = {
    document: new Set(['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf']),
    presentation: new Set(['ppt', 'pptx', 'pdf']),
    spreadsheet: new Set(['xls', 'xlsx']),
    image: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']),
    video: new Set(['mp4', 'avi', 'mov', 'wmv']),
  };
  const DOWNLOAD_COUNT_KEY = 'teacher_material_download_counts';

  const S = {
    initialized: false,
    teacherUuid: null,
    institutionId: null,
    courses: [],
    sectionsByCourse: new Map(),
    materials: [],
    view: [],
    editingMaterialId: null,
    editingSectionId: null,
    sectionManagerCourseId: null,
    selectedCourseId: null,
    downloadCounts: {},
  };

  function esc(value) {
    if (typeof escHtml === 'function') return escHtml(String(value ?? ''));
    return String(value ?? '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function toast(message, type) {
    if (typeof showToast === 'function') showToast(message, type || 'info');
  }

  function el(id) {
    return document.getElementById(id);
  }

  function getUser() {
    return typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
  }

  function getTeacherUuid() {
    const u = getUser();
    return u?.teacher_uuid || null;
  }

  function getInstitutionId() {
    const u = getUser();
    return u?.institution_id || null;
  }

  function asArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data?.sections)) return payload.data.sections;
    if (Array.isArray(payload?.sections)) return payload.sections;
    return [];
  }

  function parseTags(tags) {
    if (!tags) return [];
    return String(tags)
      .split(',')
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function getPermissionFromTags(tags) {
    const list = parseTags(tags).map(function (x) { return x.toLowerCase(); });
    if (list.includes('permission:view')) return 'view';
    return 'download';
  }

  function setPermissionInTags(existingTags, permission) {
    const list = parseTags(existingTags).filter(function (item) {
      return !/^permission:/i.test(item);
    });
    list.push('permission:' + permission);
    return list.join(',');
  }

  function fileTypeFromName(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'doc' || ext === 'docx') return 'doc';
    if (ext === 'ppt' || ext === 'pptx') return 'ppt';
    if (ext === 'xls' || ext === 'xlsx') return 'sheet';
    return 'other';
  }

  function formatBytes(bytes) {
    const size = Number(bytes || 0);
    if (!Number.isFinite(size) || size <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let idx = 0;
    let n = size;
    while (n >= 1024 && idx < units.length - 1) {
      n /= 1024;
      idx += 1;
    }
    return n.toFixed(idx === 0 ? 0 : 1) + ' ' + units[idx];
  }

  function normalizeMaterialType(value) {
    const v = String(value || '').toLowerCase();
    if (v.includes('presentation') || v.includes('ppt')) return 'presentation';
    if (v.includes('sheet') || v.includes('excel')) return 'spreadsheet';
    if (v.includes('image') || v.includes('photo') || v.includes('picture')) return 'image';
    if (v.includes('video') || v.includes('mp4') || v.includes('mov') || v.includes('avi')) return 'video';
    if (v.includes('link')) return 'link';
    if (v.includes('document') || v.includes('doc') || v.includes('pdf')) return 'document';
    return 'other';
  }

  function readDownloadCounts() {
    try {
      const raw = localStorage.getItem(DOWNLOAD_COUNT_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveDownloadCounts() {
    try {
      localStorage.setItem(DOWNLOAD_COUNT_KEY, JSON.stringify(S.downloadCounts));
    } catch (e) {
      // Ignore storage failures.
    }
  }

  function getMaterialDownloads(materialId) {
    const key = String(materialId || '');
    return Number(S.downloadCounts[key] || 0) || 0;
  }

  function bumpMaterialDownloads(materialId) {
    const key = String(materialId || '');
    S.downloadCounts[key] = getMaterialDownloads(materialId) + 1;
    saveDownloadCounts();
  }

  function showOverlay(id) {
    const node = el(id);
    if (!node) return;
    node.classList.add('open');
    node.setAttribute('aria-hidden', 'false');
  }

  function hideOverlay(id) {
    const node = el(id);
    if (!node) return;
    node.classList.remove('open');
    node.setAttribute('aria-hidden', 'true');
  }

  function getCourseLabel(course) {
    const subject = course.subject_name || 'Subject';
    const className = course.class_name || 'Class';
    return subject + ' - ' + className;
  }

  function getCourseById(courseId) {
    return S.courses.find(function (course) {
      return Number(course.course_id) === Number(courseId);
    }) || null;
  }

  function formatPercent(value) {
    const v = Number(value || 0);
    if (!Number.isFinite(v)) return '0%';
    return v.toFixed(v % 1 === 0 ? 0 : 2) + '%';
  }

  async function loadCourses() {
    if (!S.teacherUuid) {
      throw new Error('Teacher account not found.');
    }

    const response = await API.get(API_ENDPOINTS.TEACHER_COURSES(S.teacherUuid));
    const rows = asArray(response?.data || response);

    S.courses = rows
      .map(function (row) {
        return {
          course_id: Number(row.course_id || row.id || 0),
          subject_name: row.subject_name || row.subject || 'Subject',
          class_name: row.class_name || row.class || 'Class',
        };
      })
      .filter(function (row) {
        return Number.isInteger(row.course_id) && row.course_id > 0;
      })
      .sort(function (a, b) {
        return getCourseLabel(a).localeCompare(getCourseLabel(b));
      });

    if (!S.courses.length) {
      throw new Error('No assigned classes/subjects found for your account.');
    }

    if (!S.selectedCourseId || !S.courses.some(function (course) { return Number(course.course_id) === Number(S.selectedCourseId); })) {
      S.selectedCourseId = S.courses[0].course_id;
    }
  }

  async function loadSectionsForCourse(courseId) {
    const id = Number(courseId || 0);
    if (!id) return [];
    if (S.sectionsByCourse.has(id)) return S.sectionsByCourse.get(id);

    const response = await API.get('/api/courses/' + id + '/sections');
    const rows = asArray(response?.data || response);

    const sections = rows
      .map(function (row) {
        return {
          section_id: Number(row.course_sections_id || row.section_id || row.id || 0),
          section_name: row.section_name || row.name || 'Section',
          description: row.description || '',
          order_index: Number(row.order_index || 0) || 0,
          is_active: Number(row.is_active ?? 1) === 1,
        };
      })
      .filter(function (row) {
        return Number.isInteger(row.section_id) && row.section_id > 0;
      });

    S.sectionsByCourse.set(id, sections);
    return sections;
  }

  async function ensureAtLeastOneSection(courseId) {
    const id = Number(courseId || 0);
    if (!id) return null;

    let sections = await loadSectionsForCourse(id);
    const firstActive = sections.find(function (section) {
      return Boolean(section.is_active);
    });
    if (firstActive) return firstActive;

    await API.post('/api/courses/' + id + '/sections', {
      section_name: 'General',
      description: 'General topic section',
      order_index: 0,
      is_active: 1,
    });

    S.sectionsByCourse.delete(id);
    sections = await loadSectionsForCourse(id);
    return sections[0] || null;
  }

  async function loadMaterials() {
    const tasks = S.courses.map(async function (course) {
      const res = await API.get('/api/courses/' + course.course_id + '/materials');
      const rows = asArray(res?.data || res);

      return rows.map(function (row) {
        return {
          material_id: Number(row.material_id || 0),
          course_id: Number(course.course_id),
          course_label: getCourseLabel(course),
          title: row.title || 'Untitled',
          description: row.description || '',
          file_name: row.file_name || '',
          file_path: row.file_path || '',
          file_size: Number(row.file_size || 0) || 0,
          external_link: row.external_link || '',
          material_type: normalizeMaterialType(row.material_type),
          section_id: Number(row.section_id || row.course_section_id || row.course_sections_id || 0),
          permission: String(row.access_permission || getPermissionFromTags(row.tags) || 'download').toLowerCase(),
          download_count: Number(row.download_count || 0) || 0,
          tags: row.tags || '',
          order_index: Number(row.order_index || 0),
          is_required: Number(row.is_required || 0) === 1,
          is_active: Number(row.is_active ?? 1) === 1,
          uploaded_by_name: row.uploaded_by_name || '',
          status: row.status || 'active',
        };
      });
    });

    const grouped = await Promise.all(tasks);
    S.materials = grouped.flat().sort(function (a, b) {
      if (a.course_label !== b.course_label) return a.course_label.localeCompare(b.course_label);
      if (a.order_index !== b.order_index) return a.order_index - b.order_index;
      return a.title.localeCompare(b.title);
    });
  }

  function populateCourseSelectors() {
    const courseFilter = el('tcmCourseFilter');
    const courseEdit = el('tcmEditCourse');
    const options = ['<option value="all">All Subjects / Classes</option>']
      .concat(S.courses.map(function (course) {
        const selected = Number(course.course_id) === Number(S.selectedCourseId) ? ' selected' : '';
        return '<option value="' + course.course_id + '"' + selected + '>' + esc(getCourseLabel(course)) + '</option>';
      }))
      .join('');

    if (courseFilter) courseFilter.innerHTML = options;

    const editOptions = S.courses
      .map(function (course) {
        return '<option value="' + course.course_id + '">' + esc(getCourseLabel(course)) + '</option>';
      })
      .join('');
    if (courseEdit) courseEdit.innerHTML = editOptions;
  }

  async function populateSectionFilter() {
    const target = el('tcmSectionFilter');
    if (!target) return;

    const currentValue = String(target.value || 'all');
    const courseFilterValue = el('tcmCourseFilter')?.value || 'all';
    if (courseFilterValue === 'all') {
      const allSections = [];

      S.courses.forEach(function (course) {
        const sections = S.sectionsByCourse.get(Number(course.course_id)) || [];
        sections.forEach(function (section) {
          allSections.push({
            section_id: section.section_id,
            section_name: section.section_name,
            order_index: Number(section.order_index || 0),
            is_active: Boolean(section.is_active),
            course_label: getCourseLabel(course),
          });
        });
      });

      allSections.sort(function (a, b) {
        if (a.course_label !== b.course_label) return a.course_label.localeCompare(b.course_label);
        if (a.order_index !== b.order_index) return a.order_index - b.order_index;
        return a.section_name.localeCompare(b.section_name);
      });

      target.innerHTML = ['<option value="all">All Topics / Units / Weeks</option>']
        .concat(allSections.map(function (section) {
          const statusSuffix = section.is_active ? '' : ' (Inactive)';
          return '<option value="' + section.section_id + '">' + esc(section.section_name + statusSuffix + ' - ' + section.course_label) + '</option>';
        }))
        .join('');

      const hasCurrent = allSections.some(function (section) {
        return String(section.section_id) === currentValue;
      });
      target.value = hasCurrent ? currentValue : 'all';
      return;
    }

    const sections = await loadSectionsForCourse(Number(courseFilterValue));
    target.innerHTML = ['<option value="all">All Topics / Units / Weeks</option>']
      .concat(sections.map(function (section) {
        const statusSuffix = section.is_active ? '' : ' (Inactive)';
        return '<option value="' + section.section_id + '">' + esc(section.section_name + statusSuffix) + '</option>';
      }))
      .join('');

    const hasCurrent = sections.some(function (section) {
      return String(section.section_id) === currentValue;
    });
    target.value = hasCurrent ? currentValue : 'all';
  }

  async function populateEditSections(courseId, selectedSectionId) {
    const sectionSelect = el('tcmEditSection');
    if (!sectionSelect) return;

    const sections = await loadSectionsForCourse(Number(courseId));
    const selectableSections = sections.filter(function (section) {
      if (section.is_active) return true;
      return Number(section.section_id) === Number(selectedSectionId);
    });

    const options = selectableSections.map(function (section) {
      const selected = Number(section.section_id) === Number(selectedSectionId) ? ' selected' : '';
      const inactiveSuffix = section.is_active ? '' : ' (Inactive)';
      return '<option value="' + section.section_id + '"' + selected + '>' + esc(section.section_name + inactiveSuffix) + '</option>';
    }).join('');

    sectionSelect.innerHTML = options;

    if (!selectableSections.length) {
      sectionSelect.innerHTML = '<option value="">No active topic/unit/week yet</option>';
    }
  }

  function renderShareCourseChecklist(currentCourseId) {
    const wrap = el('tcmShareCourses');
    if (!wrap) return;

    const html = S.courses
      .filter(function (course) {
        return Number(course.course_id) !== Number(currentCourseId);
      })
      .map(function (course) {
        return '<label class="tcm-multi-item tcm-share-item"><input type="checkbox" data-share-course="' + course.course_id + '" /> ' + esc(getCourseLabel(course)) + '</label>';
      })
      .join('');

    wrap.innerHTML = html || '<span style="font-size:.78rem;color:#64748b;">No additional classes available.</span>';
    updateShareCount();
  }

  function updateShareCount() {
    const countEl = el('tcmShareCount');
    if (!countEl) return;
    const selected = document.querySelectorAll('[data-share-course]:checked').length;
    countEl.textContent = selected + ' selected';
  }

  function setAllShareCourses(checked) {
    const boxes = document.querySelectorAll('[data-share-course]');
    Array.from(boxes).forEach(function (box) {
      box.checked = Boolean(checked);
    });
    updateShareCount();
  }

  function getSelectedShareCourseIds() {
    const boxes = document.querySelectorAll('[data-share-course]:checked');
    return Array.from(boxes)
      .map(function (box) { return Number(box.getAttribute('data-share-course') || 0); })
      .filter(function (id) { return Number.isInteger(id) && id > 0; });
  }

  function applyFilters() {
    const query = String(el('tcmSearchInput')?.value || '').trim().toLowerCase();
    const courseValue = String(el('tcmCourseFilter')?.value || 'all');
    const sectionValue = String(el('tcmSectionFilter')?.value || 'all');
    const permissionValue = String(el('tcmPermissionFilter')?.value || 'all');
    const typeValue = String(el('tcmTypeFilter')?.value || 'all');

    S.view = S.materials.filter(function (item) {
      if (courseValue !== 'all' && Number(item.course_id) !== Number(courseValue)) return false;
      if (sectionValue !== 'all' && Number(item.section_id) !== Number(sectionValue)) return false;
      if (permissionValue !== 'all' && item.permission !== permissionValue) return false;

      if (typeValue !== 'all') {
        const normalized = fileTypeFromName(item.file_name || item.external_link || '');
        if (normalized !== typeValue) return false;
      }

      if (query) {
        const hay = [item.title, item.description, item.course_label, item.file_name].join(' ').toLowerCase();
        if (hay.indexOf(query) === -1) return false;
      }

      return true;
    });

    renderStats();
    renderList();
  }

  function getSectionName(courseId, sectionId) {
    const sections = S.sectionsByCourse.get(Number(courseId)) || [];
    const match = sections.find(function (s) { return Number(s.section_id) === Number(sectionId); });
    return match ? match.section_name : 'General';
  }

  function renderStats() {
    const total = S.view.length;
    const subjects = new Set(S.view.map(function (item) { return item.course_id; })).size;
    const bytes = S.view.reduce(function (sum, item) { return sum + Number(item.file_size || 0); }, 0);
    const downloads = S.view.reduce(function (sum, item) {
      const serverCount = Number(item.download_count || 0) || 0;
      const localCount = getMaterialDownloads(item.material_id);
      return sum + Math.max(serverCount, localCount);
    }, 0);

    if (el('tcmStatTotal')) el('tcmStatTotal').textContent = String(total);
    if (el('tcmStatSubjects')) el('tcmStatSubjects').textContent = String(subjects);
    if (el('tcmStatStorage')) el('tcmStatStorage').textContent = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    if (el('tcmStatDownloads')) el('tcmStatDownloads').textContent = String(downloads);
  }

  function permissionBadge(permission) {
    if (permission === 'view') {
      return '<span class="tcm-chip other"><i class="fas fa-eye" style="margin-right:.25rem;"></i>View only</span>';
    }
    return '<span class="tcm-chip file"><i class="fas fa-download" style="margin-right:.25rem;"></i>View + Download</span>';
  }

  function extensionBadgeClass(ext) {
    const v = String(ext || '').toLowerCase();
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
    return known[v] || 'ext-file';
  }

  function sourceBadge(material) {
    if (material.external_link) {
      return '<span class="tcm-chip link">LINK</span>';
    }

    if (material.file_name) {
      const ext = String(material.file_name || '').split('.').pop().toLowerCase();
      if (ext) {
        return '<span class="tcm-chip ' + extensionBadgeClass(ext) + '">' + esc(ext.toUpperCase()) + '</span>';
      }
      return '<span class="tcm-chip ext-file">FILE</span>';
    }

    return '<span class="tcm-chip other">OTHER</span>';
  }

  function renderList() {
    const root = el('tcmList');
    if (!root) return;

    if (!S.view.length) {
      root.innerHTML = '<div class="tcm-empty"><i class="fas fa-inbox"></i>No materials found for the selected filters.</div>';
      return;
    }

    root.innerHTML = S.view.map(function (item) {
      const section = getSectionName(item.course_id, item.section_id);
      const fileInfo = item.file_name ? (esc(item.file_name) + ' (' + formatBytes(item.file_size) + ')') : (item.external_link ? 'External URL' : 'No file');
      const downloads = Math.max(Number(item.download_count || 0) || 0, getMaterialDownloads(item.material_id));
      const optionMeta = 'Order: ' + Number(item.order_index || 0)
        + ' | ' + (item.is_required ? 'Required' : 'Optional')
        + ' | ' + (item.is_active ? 'Active' : 'Inactive');

      return '<div class="tcm-row" data-material-id="' + item.material_id + '">'
        + '<div class="tcm-title"><strong>' + esc(item.title) + '</strong><span>' + fileInfo + ' ' + sourceBadge(item) + '</span><span>' + esc(optionMeta) + '</span></div>'
        + '<div>' + esc(item.course_label) + '</div>'
        + '<div>' + esc(section) + '</div>'
        + '<div>' + permissionBadge(item.permission) + '</div>'
        + '<div>' + downloads + '</div>'
        + '<div class="tcm-actions">'
        + (item.external_link || item.file_path ? '<button type="button" class="btn btn-sm btn-outline" data-action="open"><i class="fas fa-arrow-up-right-from-square"></i></button>' : '')
        + '<button type="button" class="btn btn-sm btn-outline" data-action="edit"><i class="fas fa-pen"></i></button>'
        + '<button type="button" class="btn btn-sm btn-danger" data-action="delete"><i class="fas fa-trash"></i></button>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function closeRequiredProgressReport() {
    hideOverlay('tcmRequiredProgressOverlay');
  }

  function renderRequiredProgressReport(payload) {
    const summaryEl = el('tcmRequiredProgressSummary');
    const bodyEl = el('tcmRequiredProgressBody');
    if (!summaryEl || !bodyEl) return;

    const totals = payload?.summary || {
      required_materials: 0,
      completed_slots: 0,
      total_slots: 0,
      completion_rate: 0,
    };

    summaryEl.innerHTML = ''
      + '<div class="tcm-report-pill"><strong>' + Number(totals.required_materials || 0) + '</strong><span>Required Materials</span></div>'
      + '<div class="tcm-report-pill"><strong>' + Number(totals.completed_slots || 0) + '</strong><span>Completed Slots</span></div>'
      + '<div class="tcm-report-pill"><strong>' + Number(totals.total_slots || 0) + '</strong><span>Total Slots</span></div>'
      + '<div class="tcm-report-pill"><strong>' + formatPercent(totals.completion_rate || 0) + '</strong><span>Overall Completion</span></div>';

    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    if (!rows.length) {
      bodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;">No required materials found for this selection.</td></tr>';
      return;
    }

    bodyEl.innerHTML = rows.map(function (row) {
      return '<tr>'
        + '<td>' + esc(row.course_label || '-') + '</td>'
        + '<td>' + esc(row.section_name || '-') + '</td>'
        + '<td>' + esc(row.title || '-') + '</td>'
        + '<td>' + Number(row.completed_students || 0) + '</td>'
        + '<td>' + Number(row.total_students || 0) + '</td>'
        + '<td><span class="tcm-report-rate">' + formatPercent(row.completion_rate || 0) + '</span></td>'
        + '</tr>';
    }).join('');
  }

  async function loadRequiredProgressReport() {
    const courseFilterValue = String(el('tcmCourseFilter')?.value || 'all');
    const targets = courseFilterValue === 'all'
      ? S.courses.slice()
      : S.courses.filter(function (course) {
          return Number(course.course_id) === Number(courseFilterValue);
        });

    const summaryEl = el('tcmRequiredProgressSummary');
    const bodyEl = el('tcmRequiredProgressBody');
    if (summaryEl) summaryEl.innerHTML = '';
    if (bodyEl) bodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;">Loading report...</td></tr>';

    const reportRows = [];
    const totals = {
      required_materials: 0,
      completed_slots: 0,
      total_slots: 0,
      completion_rate: 0,
    };

    await Promise.all(targets.map(async function (course) {
      try {
        const res = await API.get('/api/courses/' + course.course_id + '/materials/required-progress');
        const payload = res?.data || res || {};
        const rows = asArray(payload?.data || payload);
        const summary = payload?.summary || {};

        rows.forEach(function (row) {
          reportRows.push({
            course_label: getCourseLabel(course),
            section_name: row.section_name || 'General',
            title: row.title || 'Untitled',
            completed_students: Number(row.completed_students || 0),
            total_students: Number(row.total_students || 0),
            completion_rate: Number(row.completion_rate || 0),
          });
        });

        totals.required_materials += Number(summary.required_materials || rows.length || 0);
        totals.completed_slots += Number(summary.completed_slots || 0);
        totals.total_slots += Number(summary.total_slots || 0);
      } catch (_) {
        // Keep rendering other courses if one request fails.
      }
    }));

    totals.completion_rate = totals.total_slots > 0
      ? ((totals.completed_slots / totals.total_slots) * 100)
      : 0;

    reportRows.sort(function (a, b) {
      if (a.course_label !== b.course_label) return a.course_label.localeCompare(b.course_label);
      if (a.section_name !== b.section_name) return a.section_name.localeCompare(b.section_name);
      return a.title.localeCompare(b.title);
    });

    renderRequiredProgressReport({
      summary: totals,
      rows: reportRows,
    });
  }

  async function openRequiredProgressReport() {
    showOverlay('tcmRequiredProgressOverlay');
    await loadRequiredProgressReport();
  }

  function resetEditor() {
    S.editingMaterialId = null;
    if (el('tcmEditorTitle')) el('tcmEditorTitle').textContent = 'Upload Material';
    if (el('tcmEditTitle')) el('tcmEditTitle').value = '';
    if (el('tcmEditDescription')) el('tcmEditDescription').value = '';
    if (el('tcmEditPermission')) el('tcmEditPermission').value = 'download';
    if (el('tcmEditType')) el('tcmEditType').value = 'document';
    if (el('tcmEditOrderIndex')) el('tcmEditOrderIndex').value = '0';
    if (el('tcmEditIsRequired')) el('tcmEditIsRequired').checked = false;
    if (el('tcmEditIsActive')) el('tcmEditIsActive').checked = true;
    if (el('tcmEditFile')) el('tcmEditFile').value = '';
    if (el('tcmEditExternalLink')) el('tcmEditExternalLink').value = '';
    if (el('tcmCurrentFileInfo')) {
      el('tcmCurrentFileInfo').setAttribute('data-file-path', '');
      el('tcmCurrentFileInfo').setAttribute('data-file-name', '');
    }
    if (el('tcmEditorSaveText')) el('tcmEditorSaveText').textContent = 'Save';

    const defaultCourse = Number(S.selectedCourseId || S.courses?.[0]?.course_id || 0);
    if (el('tcmEditCourse')) el('tcmEditCourse').value = String(defaultCourse || '');
    renderShareCourseChecklist(defaultCourse);
    populateEditSections(defaultCourse, null);
    syncMaterialTypeFieldVisibility();
  }

  function openEditor() {
    showOverlay('tcmEditorOverlay');
  }

  function closeEditor() {
    hideOverlay('tcmEditorOverlay');
  }

  function resetSectionForm() {
    S.editingSectionId = null;
    if (el('tcmSectionNameInput')) el('tcmSectionNameInput').value = '';
    if (el('tcmSectionDescInput')) el('tcmSectionDescInput').value = '';
    if (el('tcmSectionOrderInput')) el('tcmSectionOrderInput').value = '0';
    if (el('tcmSectionIsActiveInput')) el('tcmSectionIsActiveInput').checked = true;
    if (el('tcmSectionFormSaveText')) el('tcmSectionFormSaveText').textContent = 'Create Topic';
  }

  function renderSectionManagerCourses() {
    const courseSelect = el('tcmSectionCourseSelect');
    if (!courseSelect) return;

    courseSelect.innerHTML = S.courses.map(function (course) {
      const selected = Number(course.course_id) === Number(S.sectionManagerCourseId) ? ' selected' : '';
      return '<option value="' + course.course_id + '"' + selected + '>' + esc(getCourseLabel(course)) + '</option>';
    }).join('');
  }

  async function renderSectionManagerList(courseId) {
    const body = el('tcmSectionListBody');
    if (!body) return;

    const sections = await loadSectionsForCourse(Number(courseId));
    if (!sections.length) {
      body.innerHTML = '<div class="tcm-empty"><i class="fas fa-layer-group"></i>No Topic / Unit / Week yet for this subject/class.</div>';
      return;
    }

    body.innerHTML = sections.map(function (section) {
      const statusHtml = section.is_active
        ? '<span class="tcm-status-badge active">Active</span>'
        : '<span class="tcm-status-badge inactive">Inactive</span>';
      return '<div class="tcm-section-row" data-section-id="' + section.section_id + '">'
        + '<div><strong>' + esc(section.section_name) + '</strong></div>'
        + '<div>' + esc(section.description || '-') + '</div>'
        + '<div>' + Number(section.order_index || 0) + '</div>'
        + '<div>' + statusHtml + '</div>'
        + '<div class="tcm-section-actions">'
        + '<button type="button" class="btn btn-sm btn-outline" data-section-action="edit"><i class="fas fa-pen"></i></button>'
        + '<button type="button" class="btn btn-sm btn-danger" data-section-action="delete"><i class="fas fa-trash"></i></button>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  async function openSectionManager(courseId) {
    const defaultCourseId = Number(courseId || el('tcmEditCourse')?.value || S.selectedCourseId || S.courses?.[0]?.course_id || 0);
    if (!defaultCourseId) {
      toast('No subject/class available yet.', 'warning');
      return;
    }

    S.sectionManagerCourseId = defaultCourseId;
    resetSectionForm();
    renderSectionManagerCourses();
    await renderSectionManagerList(defaultCourseId);
    showOverlay('tcmSectionOverlay');
  }

  function closeSectionManager() {
    hideOverlay('tcmSectionOverlay');
    resetSectionForm();
  }

  function startSectionEdit(sectionId) {
    const courseId = Number(S.sectionManagerCourseId || 0);
    if (!courseId) return;

    const sections = S.sectionsByCourse.get(courseId) || [];
    const match = sections.find(function (section) {
      return Number(section.section_id) === Number(sectionId);
    });
    if (!match) return;

    S.editingSectionId = Number(match.section_id);
    if (el('tcmSectionNameInput')) el('tcmSectionNameInput').value = match.section_name || '';
    if (el('tcmSectionDescInput')) el('tcmSectionDescInput').value = match.description || '';
    if (el('tcmSectionOrderInput')) el('tcmSectionOrderInput').value = String(Number(match.order_index || 0));
    if (el('tcmSectionIsActiveInput')) el('tcmSectionIsActiveInput').checked = Boolean(match.is_active);
    if (el('tcmSectionFormSaveText')) el('tcmSectionFormSaveText').textContent = 'Update Topic';
  }

  async function saveSectionManager() {
    const courseId = Number(el('tcmSectionCourseSelect')?.value || S.sectionManagerCourseId || 0);
    const sectionName = String(el('tcmSectionNameInput')?.value || '').trim();
    const description = String(el('tcmSectionDescInput')?.value || '').trim();
    const orderIndex = Number(el('tcmSectionOrderInput')?.value || 0);
    const isActive = el('tcmSectionIsActiveInput')?.checked ? 1 : 0;

    if (!courseId) {
      toast('Select a subject/class first.', 'warning');
      return;
    }
    if (!sectionName) {
      toast('Topic / Unit / Week name is required.', 'warning');
      return;
    }

    const payload = {
      section_name: sectionName,
      description: description || null,
      order_index: Number.isFinite(orderIndex) && orderIndex >= 0 ? Math.floor(orderIndex) : 0,
      is_active: isActive,
    };

    const saveBtn = el('tcmSectionFormSaveBtn');
    if (saveBtn) saveBtn.disabled = true;

    try {
      if (S.editingSectionId) {
        await API.put('/api/courses/' + courseId + '/sections/' + S.editingSectionId, payload);
        toast('Topic updated successfully.', 'success');
      } else {
        await API.post('/api/courses/' + courseId + '/sections', payload);
        toast('Topic created successfully.', 'success');
      }

      S.sectionsByCourse.delete(courseId);
      S.sectionManagerCourseId = courseId;
      await renderSectionManagerList(courseId);
      await populateEditSections(Number(el('tcmEditCourse')?.value || courseId), Number(el('tcmEditSection')?.value || 0));
      await populateSectionFilter();
      applyFilters();
      resetSectionForm();
    } catch (error) {
      toast(error?.message || 'Failed to save topic/unit/week.', 'error');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  async function deleteSectionManager(sectionId) {
    const courseId = Number(el('tcmSectionCourseSelect')?.value || S.sectionManagerCourseId || 0);
    if (!courseId || !sectionId) return;

    let ok = true;
    if (typeof showConfirm === 'function') {
      ok = await showConfirm('Delete this topic/unit/week?');
    } else {
      ok = window.confirm('Delete this topic/unit/week?');
    }
    if (!ok) return;

    try {
      await API.delete('/api/courses/' + courseId + '/sections/' + Number(sectionId));
      S.sectionsByCourse.delete(courseId);
      await renderSectionManagerList(courseId);
      await populateEditSections(Number(el('tcmEditCourse')?.value || courseId), Number(el('tcmEditSection')?.value || 0));
      await populateSectionFilter();
      applyFilters();
      resetSectionForm();
      toast('Topic deleted successfully.', 'success');
    } catch (error) {
      toast(error?.message || 'Failed to delete topic/unit/week. It may still be used by materials.', 'error');
    }
  }

  function syncMaterialTypeFieldVisibility() {
    const materialType = String(el('tcmEditType')?.value || 'document');
    const isLink = materialType === 'link';
    const fileInput = el('tcmEditFile');
    const fileHelp = el('tcmFileHelpText');
    const fileTypeChips = el('tcmFileTypeChips');
    const currentFileInfo = el('tcmCurrentFileInfo');

    if (el('tcmFileFieldWrap')) el('tcmFileFieldWrap').style.display = isLink ? 'none' : '';
    if (el('tcmLinkFieldWrap')) el('tcmLinkFieldWrap').style.display = isLink ? '' : 'none';

    if (fileInput) {
      if (materialType === 'document') {
        fileInput.setAttribute('accept', '.pdf,.doc,.docx,.txt,.odt,.rtf');
      } else if (materialType === 'presentation') {
        fileInput.setAttribute('accept', '.ppt,.pptx,.pdf');
      } else if (materialType === 'spreadsheet') {
        fileInput.setAttribute('accept', '.xls,.xlsx');
      } else if (materialType === 'image') {
        fileInput.setAttribute('accept', '.jpg,.jpeg,.png,.gif,.webp');
      } else if (materialType === 'video') {
        fileInput.setAttribute('accept', '.mp4,.avi,.mov,.wmv');
      } else {
        fileInput.removeAttribute('accept');
      }
      fileInput.required = !S.editingMaterialId;
    }

    // Render current file info prominently if editing
    if (currentFileInfo) {
      const fileName = currentFileInfo.getAttribute('data-file-name');
      const filePath = currentFileInfo.getAttribute('data-file-path');
      
      if (S.editingMaterialId && fileName) {
        const ext = String(fileName || '').split('.').pop().toUpperCase();
        const fileIcon = ext.match(/^(PDF|DOC|DOCX|PPT|PPTX|XLS|XLSX)$/) ? 'fa-file-' + ext.toLowerCase() : 'fa-file';
        currentFileInfo.innerHTML = ''
          + '<div style="display:flex;align-items:center;gap:0.7rem;padding:0.6rem 0.8rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:0.5rem;">'
          + '  <div style="flex:1;">'
          + '    <div style="font-size:0.82rem;color:#0f172a;font-weight:600;margin-bottom:0.2rem;">'
          + '      <i class="fas fa-check-circle" style="color:#16a34a;margin-right:0.4rem;"></i>'
          + '      <strong>Current File</strong>'
          + '    </div>'
          + '    <div style="font-size:0.8rem;color:#404040;display:flex;align-items:center;gap:0.4rem;">'
          + '      <i class="fas ' + (fileIcon === 'fa-file' ? 'fa-file' : 'fas fa-file-pdf') + '" style="color:#64748b;"></i>'
          + '      <span>' + esc(fileName) + '</span>'
          + '      <span class="tcm-chip" style="margin-left:0.3rem;background:#d4edda;color:#155724;font-size:0.65rem;padding:0.15rem 0.4rem;">' + ext + '</span>'
          + '    </div>'
          + '  </div>'
          + '  <button type="button" id="tcmReplaceFileBtn" class="btn btn-sm btn-outline" style="white-space:nowrap;flex-shrink:0;">'
          + '    <i class="fas fa-arrow-rotate-right" style="margin-right:0.3rem;"></i> Replace'
          + '  </button>'
          + '</div>';
      } else {
        currentFileInfo.innerHTML = '';
      }
    }

    if (fileHelp) {
      let helpText = '';
      if (materialType === 'document') {
        helpText = 'Allowed for Document: PDF, DOC, DOCX, TXT, ODT, RTF. Maximum: 10 MB.';
      } else if (materialType === 'presentation') {
        helpText = 'Allowed for Presentation: PPT, PPTX, PDF. Maximum: 10 MB.';
      } else if (materialType === 'spreadsheet') {
        helpText = 'Allowed for Spreadsheet: XLS, XLSX. Maximum: 100 MB.';
      } else if (materialType === 'image') {
        helpText = 'Allowed for Image: JPG, JPEG, PNG, GIF, WEBP. Maximum: 100 MB.';
      } else if (materialType === 'video') {
        helpText = 'Allowed for Video: MP4, AVI, MOV, WMV. Maximum: 100 MB.';
      } else {
        helpText = 'Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ODT, RTF, JPG, JPEG, PNG, GIF, WEBP, MP4, AVI, MOV, WMV. Maximum: 100 MB.';
      }
      fileHelp.textContent = helpText;
    }

    if (fileTypeChips) {
      const tags = [];
      if (materialType === 'document') {
        tags.push('PDF', 'DOC', 'DOCX', 'TXT', 'ODT', 'RTF');
      } else if (materialType === 'presentation') {
        tags.push('PPT', 'PPTX', 'PDF');
      } else if (materialType === 'spreadsheet') {
        tags.push('XLS', 'XLSX');
      } else if (materialType === 'image') {
        tags.push('JPG', 'JPEG', 'PNG', 'GIF', 'WEBP');
      } else if (materialType === 'video') {
        tags.push('MP4', 'AVI', 'MOV', 'WMV');
      } else {
        tags.push('PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX', 'TXT', 'ODT', 'RTF', 'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'MP4', 'AVI', 'MOV', 'WMV');
      }

      fileTypeChips.innerHTML = tags
        .map(function (tag) { return '<span class="tcm-upload-chip active">' + esc(tag) + '</span>'; })
        .join('');
    }

    // Wire replace button if editing and button exists
    if (S.editingMaterialId) {
      setTimeout(function () {
        const replaceBtn = el('tcmReplaceFileBtn');
        if (replaceBtn && !replaceBtn._bound) {
          replaceBtn._bound = true;
          replaceBtn.addEventListener('click', function (e) {
            e.preventDefault();
            el('tcmEditFile')?.click();
          });
        }
      }, 0);
    }
  }

  function validateFile(file) {
    if (!file) {
      return { ok: false, message: 'Please choose a file.' };
    }

    const materialType = String(el('tcmEditType')?.value || 'document').toLowerCase();
    const ext = String(file.name || '').split('.').pop().toLowerCase();

    const typeExts = MATERIAL_TYPE_EXTS[materialType] || null;
    if (typeExts && !typeExts.has(ext)) {
      if (materialType === 'document') {
        return { ok: false, message: 'Document type accepts only PDF, DOC, DOCX, TXT, ODT, or RTF files.' };
      }
      if (materialType === 'presentation') {
        return { ok: false, message: 'Presentation type accepts only PPT, PPTX, or PDF files.' };
      }
      if (materialType === 'spreadsheet') {
        return { ok: false, message: 'Spreadsheet type accepts only XLS or XLSX files.' };
      }
      if (materialType === 'image') {
        return { ok: false, message: 'Image type accepts only JPG, JPEG, PNG, GIF, or WEBP files.' };
      }
      if (materialType === 'video') {
        return { ok: false, message: 'Video type accepts only MP4, AVI, MOV, or WMV files.' };
      }
    }

    if (!ALLOWED_EXTS.has(ext)) {
      return { ok: false, message: 'File type not allowed. Use document, spreadsheet, image, or video supported formats.' };
    }

    if (Number(file.size || 0) > MAX_FILE_SIZE) {
      return { ok: false, message: 'File exceeds 100 MB limit.' };
    }

    return { ok: true };
  }

  async function uploadMaterialFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'materials');
    if (S.institutionId) formData.append('institution_id', String(S.institutionId));

    const uploadRes = await API.upload(API_ENDPOINTS.FILE_UPLOAD, formData);
    const data = uploadRes?.data || uploadRes || {};

    return {
      file_name: data.original_name || file.name,
      file_path: data.path || '',
      file_size: Number(data.size || file.size || 0),
      material_type: normalizeMaterialType(el('tcmEditType')?.value || 'document'),
    };
  }

  function buildPayloadBase(courseId, sectionId) {
    const title = String(el('tcmEditTitle')?.value || '').trim();
    const description = String(el('tcmEditDescription')?.value || '').trim();
    const permission = String(el('tcmEditPermission')?.value || 'download');
    const materialType = String(el('tcmEditType')?.value || 'document');
    const orderIndexRaw = Number(el('tcmEditOrderIndex')?.value || 0);
    const orderIndex = Number.isFinite(orderIndexRaw) && orderIndexRaw >= 0 ? Math.floor(orderIndexRaw) : 0;
    const isRequired = el('tcmEditIsRequired')?.checked ? 1 : 0;
    const isActive = el('tcmEditIsActive')?.checked ? 1 : 0;

    if (!title) {
      throw new Error('Title is required.');
    }

    const section = Number(sectionId || 0);
    if (!Number.isInteger(section) || section <= 0) {
      throw new Error('Please select a topic/unit/week section.');
    }

    return {
      course_id: Number(courseId),
      section_id: section,
      title: title,
      description: description,
      material_type: materialType,
      order_index: orderIndex,
      is_required: isRequired,
      is_active: isActive,
      tags: setPermissionInTags('', permission),
      access_permission: permission,
      status: isActive ? 'active' : 'inactive',
    };
  }

  async function createMaterialForCourse(courseId, sectionId, sharedSource) {
    const payload = buildPayloadBase(courseId, sectionId);

    if (sharedSource && sharedSource.file_name) {
      payload.file_name = sharedSource.file_name;
      payload.file_path = sharedSource.file_path;
      payload.file_size = sharedSource.file_size;
      payload.material_type = sharedSource.material_type;
      if (sharedSource.external_link) payload.external_link = sharedSource.external_link;
    } else {
      const materialType = String(el('tcmEditType')?.value || 'document');
      if (materialType === 'link') {
        const link = String(el('tcmEditExternalLink')?.value || '').trim();
        if (!/^https?:\/\//i.test(link)) {
          throw new Error('Enter a valid external link starting with http:// or https://');
        }
        payload.external_link = link;
      } else {
        const file = el('tcmEditFile')?.files?.[0] || null;
        const validation = validateFile(file);
        if (!validation.ok) throw new Error(validation.message);

        const uploaded = await uploadMaterialFile(file);
        payload.file_name = uploaded.file_name;
        payload.file_path = uploaded.file_path;
        payload.file_size = uploaded.file_size;
        payload.material_type = uploaded.material_type;
      }
    }

    await API.post('/api/courses/' + Number(courseId) + '/materials', payload);
  }

  async function saveEditor() {
    const saveBtn = el('tcmEditorSaveBtn');
    if (saveBtn) saveBtn.disabled = true;
    if (el('tcmEditorSaveText')) el('tcmEditorSaveText').textContent = 'Saving...';

    try {
      const courseId = Number(el('tcmEditCourse')?.value || 0);
      if (!courseId) throw new Error('Please select a subject/class.');

      let sectionId = Number(el('tcmEditSection')?.value || 0);
      if (!sectionId) {
        const auto = await ensureAtLeastOneSection(courseId);
        if (!auto) throw new Error('Please create a topic/unit/week section first.');
        sectionId = auto.section_id;
      }

      if (S.editingMaterialId) {
        const material = S.materials.find(function (item) { return Number(item.material_id) === Number(S.editingMaterialId); });
        if (!material) throw new Error('Material not found. Refresh and try again.');

        const payload = {
          section_id: sectionId,
          title: String(el('tcmEditTitle')?.value || '').trim(),
          description: String(el('tcmEditDescription')?.value || '').trim(),
          material_type: String(el('tcmEditType')?.value || 'document'),
          order_index: Number(el('tcmEditOrderIndex')?.value || 0) || 0,
          is_required: el('tcmEditIsRequired')?.checked ? 1 : 0,
          is_active: el('tcmEditIsActive')?.checked ? 1 : 0,
          access_permission: String(el('tcmEditPermission')?.value || 'download'),
          tags: setPermissionInTags(material.tags || '', String(el('tcmEditPermission')?.value || 'download')),
          status: (el('tcmEditIsActive')?.checked ? 'active' : 'inactive'),
        };

        // Handle optional file replacement during edit
        const materialType = String(el('tcmEditType')?.value || 'document');
        const newFile = el('tcmEditFile')?.files?.[0] || null;
        if (newFile && materialType !== 'link') {
          const validation = validateFile(newFile);
          if (!validation.ok) throw new Error(validation.message);
          const uploaded = await uploadMaterialFile(newFile);
          payload.file_name = uploaded.file_name;
          payload.file_path = uploaded.file_path;
          payload.file_size = uploaded.file_size;
          payload.material_type = uploaded.material_type;
        } else if (materialType === 'link') {
          const link = String(el('tcmEditExternalLink')?.value || '').trim();
          if (!link) throw new Error('Please provide an external link.');
          if (!/^https?:\/\//i.test(link)) throw new Error('External link must start with http:// or https://');
          payload.external_link = link;
        }

        await API.put('/api/courses/' + material.course_id + '/materials/' + material.material_id, payload);
      } else {
        let sharedSource = null;
        await createMaterialForCourse(courseId, sectionId, sharedSource);

        // Optional share to additional classes by copying metadata
        const shareIds = getSelectedShareCourseIds();
        if (shareIds.length) {
          const materialType = String(el('tcmEditType')?.value || 'document');
          if (materialType === 'link') {
            sharedSource = {
              external_link: String(el('tcmEditExternalLink')?.value || '').trim(),
              material_type: 'link',
            };
          } else {
            // Upload once then reuse metadata for shared classes.
            const file = el('tcmEditFile')?.files?.[0] || null;
            const validation = validateFile(file);
            if (!validation.ok) throw new Error(validation.message);
            sharedSource = await uploadMaterialFile(file);
          }

          // Primary course created above using direct upload/create path.
          // For shared classes, create matching rows with same source metadata.
          for (let i = 0; i < shareIds.length; i += 1) {
            const targetCourseId = shareIds[i];
            const firstSection = await ensureAtLeastOneSection(targetCourseId);
            if (!firstSection) continue;
            await createMaterialForCourse(targetCourseId, firstSection.section_id, sharedSource);
          }
        }
      }

      closeEditor();
      await reloadAll();
      toast(S.editingMaterialId ? 'Material updated successfully.' : 'Material uploaded successfully.', 'success');
    } catch (error) {
      toast(error?.message || 'Failed to save material.', 'error');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
      if (el('tcmEditorSaveText')) el('tcmEditorSaveText').textContent = 'Save';
    }
  }

  async function onDeleteMaterial(materialId) {
    const material = S.materials.find(function (item) { return Number(item.material_id) === Number(materialId); });
    if (!material) return;

    let ok = true;
    if (typeof showConfirm === 'function') {
      ok = await showConfirm('Delete this material? This cannot be undone.');
    } else {
      ok = window.confirm('Delete this material? This cannot be undone.');
    }
    if (!ok) return;

    try {
      await API.delete('/api/courses/' + material.course_id + '/materials/' + material.material_id);
      await reloadAll();
      toast('Material deleted.', 'success');
    } catch (error) {
      toast(error?.message || 'Failed to delete material.', 'error');
    }
  }

  function openMaterial(materialId) {
    const material = S.materials.find(function (item) { return Number(item.material_id) === Number(materialId); });
    if (!material) return;

    let url = '';
    const raw = String(material.external_link || material.file_path || '').trim();
    if (/^https?:\/\//i.test(raw)) {
      url = raw;
    } else if (raw) {
      const normalized = raw.replace(/^\/+/, '');
      url = /^uploads\//i.test(normalized) ? ('/' + normalized) : ('/uploads/' + normalized);
    }

    if (!url) {
      toast('No file/link available for this material.', 'warning');
      return;
    }

    bumpMaterialDownloads(material.material_id);
    const nextCount = Math.max(Number(material.download_count || 0) || 0, getMaterialDownloads(material.material_id));
    material.download_count = nextCount;

    // Best-effort server-side download tracking.
    API.put('/api/courses/' + material.course_id + '/materials/' + material.material_id, {
      download_count: nextCount,
    }).catch(function () {
      // Ignore tracking update failures; local fallback is still shown.
    });

    applyFilters();
    window.open(url, '_blank', 'noopener');
  }

  function startEdit(materialId) {
    const material = S.materials.find(function (item) { return Number(item.material_id) === Number(materialId); });
    if (!material) return;

    S.editingMaterialId = material.material_id;
    if (el('tcmEditorTitle')) el('tcmEditorTitle').textContent = 'Edit Material';
    if (el('tcmEditCourse')) el('tcmEditCourse').value = String(material.course_id);
    if (el('tcmEditTitle')) el('tcmEditTitle').value = material.title || '';
    if (el('tcmEditDescription')) el('tcmEditDescription').value = material.description || '';
    if (el('tcmEditPermission')) el('tcmEditPermission').value = material.permission || 'download';
    if (el('tcmEditType')) el('tcmEditType').value = material.material_type || 'document';
    if (el('tcmEditOrderIndex')) el('tcmEditOrderIndex').value = String(Number(material.order_index || 0));
    if (el('tcmEditIsRequired')) el('tcmEditIsRequired').checked = Boolean(material.is_required);
    if (el('tcmEditIsActive')) el('tcmEditIsActive').checked = Boolean(material.is_active);
    if (el('tcmEditExternalLink')) el('tcmEditExternalLink').value = material.external_link || '';
    if (el('tcmEditFile')) el('tcmEditFile').value = '';
    if (el('tcmCurrentFileInfo')) {
      el('tcmCurrentFileInfo').setAttribute('data-file-name', material.file_name || '');
      el('tcmCurrentFileInfo').setAttribute('data-file-path', material.file_path || '');
    }

    renderShareCourseChecklist(material.course_id);
    populateEditSections(material.course_id, material.section_id);
    syncMaterialTypeFieldVisibility();
    if (el('tcmEditorSaveText')) el('tcmEditorSaveText').textContent = 'Update';
    openEditor();
  }

  function bindRootActions() {
    const list = el('tcmList');
    if (!list) return;

    list.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-action]');
      if (!btn) return;

      const row = event.target.closest('[data-material-id]');
      const materialId = Number(row?.getAttribute('data-material-id') || 0);
      if (!materialId) return;

      const action = btn.getAttribute('data-action');
      if (action === 'open') {
        openMaterial(materialId);
        return;
      }
      if (action === 'edit') {
        startEdit(materialId);
        return;
      }
      if (action === 'delete') {
        onDeleteMaterial(materialId);
      }
    });
  }

  function bindEvents() {
    el('tcmRefreshBtn')?.addEventListener('click', function () { reloadAll(); });
    el('tcmRequiredProgressBtn')?.addEventListener('click', function () { openRequiredProgressReport(); });
    el('tcmOpenCreateBtn')?.addEventListener('click', function () {
      resetEditor();
      openEditor();
    });
    el('tcmManageSectionsTopBtn')?.addEventListener('click', function () {
      openSectionManager(Number(el('tcmCourseFilter')?.value || S.selectedCourseId || 0));
    });

    el('tcmCourseFilter')?.addEventListener('change', async function () {
      await populateSectionFilter();
      applyFilters();
    });

    el('tcmSectionFilter')?.addEventListener('change', applyFilters);
    el('tcmPermissionFilter')?.addEventListener('change', applyFilters);
    el('tcmTypeFilter')?.addEventListener('change', applyFilters);
    el('tcmSearchInput')?.addEventListener('input', applyFilters);

    el('tcmEditCourse')?.addEventListener('change', async function () {
      const courseId = Number(el('tcmEditCourse')?.value || 0);
      await populateEditSections(courseId, null);
      renderShareCourseChecklist(courseId);
    });

    el('tcmEditType')?.addEventListener('change', syncMaterialTypeFieldVisibility);
    el('tcmShareCourses')?.addEventListener('change', updateShareCount);
    el('tcmShareSelectAllBtn')?.addEventListener('click', function () { setAllShareCourses(true); });
    el('tcmShareClearBtn')?.addEventListener('click', function () { setAllShareCourses(false); });

    el('tcmEditorClose')?.addEventListener('click', closeEditor);
    el('tcmEditorCancel')?.addEventListener('click', closeEditor);
    el('tcmEditorSaveBtn')?.addEventListener('click', saveEditor);
    el('tcmOpenSectionManagerBtn')?.addEventListener('click', function () {
      openSectionManager(Number(el('tcmEditCourse')?.value || S.selectedCourseId || 0));
    });

    el('tcmEditorOverlay')?.addEventListener('click', function (event) {
      if (event.target === el('tcmEditorOverlay')) closeEditor();
    });

    el('tcmSectionClose')?.addEventListener('click', closeSectionManager);
    el('tcmSectionDoneBtn')?.addEventListener('click', closeSectionManager);
    el('tcmSectionFormResetBtn')?.addEventListener('click', resetSectionForm);
    el('tcmSectionFormSaveBtn')?.addEventListener('click', saveSectionManager);

    el('tcmSectionCourseSelect')?.addEventListener('change', async function () {
      const courseId = Number(el('tcmSectionCourseSelect')?.value || 0);
      S.sectionManagerCourseId = courseId;
      resetSectionForm();
      await renderSectionManagerList(courseId);
    });

    el('tcmSectionOverlay')?.addEventListener('click', function (event) {
      if (event.target === el('tcmSectionOverlay')) closeSectionManager();
    });

    el('tcmRequiredProgressClose')?.addEventListener('click', closeRequiredProgressReport);
    el('tcmRequiredProgressCloseFoot')?.addEventListener('click', closeRequiredProgressReport);
    el('tcmRequiredProgressOverlay')?.addEventListener('click', function (event) {
      if (event.target === el('tcmRequiredProgressOverlay')) closeRequiredProgressReport();
    });

    el('tcmSectionListBody')?.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-section-action]');
      if (!btn) return;
      const row = event.target.closest('[data-section-id]');
      const sectionId = Number(row?.getAttribute('data-section-id') || 0);
      if (!sectionId) return;

      const action = btn.getAttribute('data-section-action');
      if (action === 'edit') {
        startSectionEdit(sectionId);
      } else if (action === 'delete') {
        deleteSectionManager(sectionId);
      }
    });

    bindRootActions();
  }

  async function reloadAll() {
    try {
      await loadCourses();
      populateCourseSelectors();

      const sectionTasks = S.courses.map(function (course) {
        return loadSectionsForCourse(course.course_id);
      });
      await Promise.all(sectionTasks);

      await loadMaterials();
      await populateSectionFilter();
      applyFilters();
    } catch (error) {
      const list = el('tcmList');
      if (list) {
        list.innerHTML = '<div class="tcm-error"><i class="fas fa-circle-exclamation"></i>' + esc(error?.message || 'Failed to load course materials.') + '</div>';
      }
      toast(error?.message || 'Failed to load course materials.', 'error');
    }
  }

  async function init() {
    const root = el('teacherCourseMaterialsPage');
    if (!root) return;

    S.teacherUuid = getTeacherUuid();
    S.institutionId = getInstitutionId();
    S.downloadCounts = readDownloadCounts();

    if (!S.initialized) {
      bindEvents();
      S.initialized = true;
    }

    await reloadAll();
  }

  document.addEventListener('page:loaded', function (event) {
    if (event?.detail?.page === 'course-materials') {
      init();
    }
  });
})();
