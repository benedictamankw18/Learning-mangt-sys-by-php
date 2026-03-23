/* ============================================
   Admin Course Materials Page Logic
============================================ */
(function () {
  'use strict';

  const S = {
    rows: [],
    view: [],
  };

  document.addEventListener('page:loaded', function (e) {
    if (e.detail && e.detail.page === 'course-materials') {
      initAdminCourseMaterialsPage();
    }
  });

  function el(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    if (typeof escHtml === 'function') return escHtml(String(value ?? ''));
    return String(value ?? '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function toast(message, type) {
    if (typeof showToast === 'function') showToast(message, type || 'info');
  }

  function fmtBytes(bytes) {
    const n = Number(bytes || 0);
    if (!Number.isFinite(n) || n <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = n;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i += 1;
    }
    return v.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  }

  function getFileExtension(fileName, filePath) {
    const source = String(fileName || filePath || '').trim();
    if (!source) return '';

    const clean = source.split('?')[0].split('#')[0];
    const dot = clean.lastIndexOf('.');
    if (dot < 0 || dot === clean.length - 1) return '';

    return clean.slice(dot + 1).toUpperCase();
  }

  async function getAllCourses() {
    const user = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    const institutionId = Number(user?.institution_id || 0);

    const results = [];
    let page = 1;
    const limit = 200;
    let totalPages = 1;

    do {
      const url = API_ENDPOINTS.CLASS_SUBJECTS
        + '?page=' + page
        + '&limit=' + limit
        + (institutionId > 0 ? '&institution_id=' + institutionId : '');

      const res = await API.get(url);
      const payload = res?.data || res || {};
      const rows = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload?.data?.data) ? payload.data.data : []);
      const pagination = payload?.pagination || payload?.data?.pagination || {};

      results.push.apply(results, rows);
      totalPages = Number(pagination.total_pages || 1);
      page += 1;
    } while (page <= totalPages);

    return results;
  }

  async function loadMaterials() {
    const tbody = el('acmTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="acm-empty"><i class="fas fa-spinner fa-spin"></i> Loading materials...</td></tr>';
    }

    const courses = await getAllCourses();

    const grouped = await Promise.all(courses.map(async function (course) {
      const courseId = Number(course.course_id || 0);
      if (!courseId) return [];

      try {
        const res = await CourseContentAPI.getMaterials(courseId);
        const rows = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);

        return rows.map(function (m) {
          const status = String(m.status || (Number(m.is_active ?? 1) === 1 ? 'active' : 'inactive')).toLowerCase();
          return {
            material_id: Number(m.material_id || 0),
            course_id: courseId,
            title: m.title || 'Untitled',
            file_name: m.file_name || '',
            file_path: m.file_path || '',
            section_name: m.section_name || 'General',
            class_name: course.class_name || 'Class',
            subject_name: course.subject_name || 'Subject',
            file_size: Number(m.file_size || 0) || 0,
            is_required: Number(m.is_required || 0) === 1,
            status: status === 'inactive' ? 'inactive' : 'active',
            is_active: Number(m.is_active ?? (status === 'active' ? 1 : 0)) === 1,
            uploaded_by_name: m.uploaded_by_name || '',
            created_at: m.created_at || '',
          };
        });
      } catch (_) {
        return [];
      }
    }));

    S.rows = grouped.flat().filter(function (r) {
      return Number(r.material_id) > 0;
    });

    populateFilters();
    applyFilters();
  }

  function populateFilters() {
    const classFilter = el('acmClassFilter');
    const subjectFilter = el('acmSubjectFilter');

    const classes = Array.from(new Set(S.rows.map(function (r) { return r.class_name; }))).sort();
    const subjects = Array.from(new Set(S.rows.map(function (r) { return r.subject_name; }))).sort();

    if (classFilter) {
      const current = classFilter.value || 'all';
      classFilter.innerHTML = '<option value="all">All Classes</option>' + classes.map(function (c) {
        return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
      }).join('');
      classFilter.value = classes.includes(current) ? current : 'all';
    }

    if (subjectFilter) {
      const current = subjectFilter.value || 'all';
      subjectFilter.innerHTML = '<option value="all">All Subjects</option>' + subjects.map(function (s) {
        return '<option value="' + esc(s) + '">' + esc(s) + '</option>';
      }).join('');
      subjectFilter.value = subjects.includes(current) ? current : 'all';
    }
  }

  function applyFilters() {
    const q = String(el('acmSearch')?.value || '').trim().toLowerCase();
    const classFilter = String(el('acmClassFilter')?.value || 'all');
    const subjectFilter = String(el('acmSubjectFilter')?.value || 'all');
    const statusFilter = String(el('acmStatusFilter')?.value || 'all');

    S.view = S.rows.filter(function (r) {
      if (classFilter !== 'all' && r.class_name !== classFilter) return false;
      if (subjectFilter !== 'all' && r.subject_name !== subjectFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      if (q) {
        const hay = [r.title, r.class_name, r.subject_name, r.section_name, r.uploaded_by_name].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }

      return true;
    });

    renderStats(S.view);
    renderTable(S.view);
  }

  function renderStats(rows) {
    const total = rows.length;
    const required = rows.filter(function (r) { return r.is_required; }).length;
    const inactive = rows.filter(function (r) { return r.status === 'inactive'; }).length;
    const storage = rows.reduce(function (sum, r) { return sum + (Number(r.file_size || 0) || 0); }, 0);

    if (el('acmTotalMaterials')) el('acmTotalMaterials').textContent = String(total);
    if (el('acmRequiredMaterials')) el('acmRequiredMaterials').textContent = String(required);
    if (el('acmInactiveMaterials')) el('acmInactiveMaterials').textContent = String(inactive);
    if (el('acmStorageUsage')) el('acmStorageUsage').textContent = fmtBytes(storage);
  }

  function renderTable(rows) {
    const tbody = el('acmTableBody');
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="acm-empty"><i class="fas fa-inbox"></i> No materials found for current filters.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (r) {
      const ext = getFileExtension(r.file_name, r.file_path);
      const meta = 'By ' + esc(r.uploaded_by_name || '-') + (ext ? ' • ' + esc(ext) : ' • LINK');

      return '<tr data-material-id="' + r.material_id + '">'
        + '<td><div class="acm-title"><strong>' + esc(r.title) + '</strong><span class="acm-meta">' + meta + '</span></div></td>'
        + '<td>' + esc(r.class_name) + ' / ' + esc(r.subject_name) + '</td>'
        + '<td>' + esc(r.section_name || '-') + (r.is_required ? ' <span class="acm-badge required">Required</span>' : '') + '</td>'
        + '<td>' + fmtBytes(r.file_size) + '</td>'
        + '<td><span class="acm-badge ' + (r.status === 'active' ? 'active' : 'inactive') + '">' + (r.status === 'active' ? 'Active' : 'Inactive') + '</span></td>'
        + '<td>'
        + '  <div class="acm-row-controls">'
        + '    <select class="acm-select" data-role="status" style="min-width:110px;padding:.35rem .5rem;">'
        + '      <option value="active"' + (r.status === 'active' ? ' selected' : '') + '>Active</option>'
        + '      <option value="inactive"' + (r.status === 'inactive' ? ' selected' : '') + '>Inactive</option>'
        + '    </select>'
        + '    <button class="btn btn-sm btn-outline" data-action="save"><i class="fas fa-check"></i></button>'
        + '  </div>'
        + '</td>'
        + '</tr>';
    }).join('');
  }

  async function saveModeration(materialId, newStatus) {
    const row = S.rows.find(function (r) { return Number(r.material_id) === Number(materialId); });
    if (!row) return;

    await CourseContentAPI.updateMaterial(row.course_id, row.material_id, {
      status: newStatus,
      is_active: newStatus === 'active' ? 1 : 0,
    });

    row.status = newStatus;
    row.is_active = newStatus === 'active';
    applyFilters();
  }

  function bindEvents() {
    el('acmRefreshBtn')?.addEventListener('click', function () {
      loadMaterials().catch(function (err) {
        toast(err?.message || 'Failed to refresh materials', 'error');
      });
    });

    el('acmSearch')?.addEventListener('input', applyFilters);
    el('acmClassFilter')?.addEventListener('change', applyFilters);
    el('acmSubjectFilter')?.addEventListener('change', applyFilters);
    el('acmStatusFilter')?.addEventListener('change', applyFilters);

    el('acmTableBody')?.addEventListener('click', async function (event) {
      const btn = event.target.closest('button[data-action="save"]');
      if (!btn) return;

      const tr = btn.closest('tr[data-material-id]');
      const materialId = Number(tr?.getAttribute('data-material-id') || 0);
      if (!materialId) return;

      const select = tr.querySelector('select[data-role="status"]');
      const newStatus = String(select?.value || 'active');

      btn.disabled = true;
      try {
        await saveModeration(materialId, newStatus);
        toast('Material moderation updated', 'success');
      } catch (err) {
        toast(err?.message || 'Failed to update material status', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  function initAdminCourseMaterialsPage() {
    bindEvents();
    loadMaterials().catch(function (err) {
      toast(err?.message || 'Failed to load course materials', 'error');
      const tbody = el('acmTableBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="acm-empty" style="color:#dc2626;"><i class="fas fa-exclamation-circle"></i> Failed to load materials.</td></tr>';
      }
    });
  }
})();
