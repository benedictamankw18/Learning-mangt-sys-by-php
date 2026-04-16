/* Grade management (category tables + detail rows) */
(function () {
  'use strict';

  const state = {
    categories: [],
    details: [],
    search: '',
    sort: 'name_asc',
    loading: false,
  };

  const dom = {};

  document.addEventListener('page:loaded', function (event) {
    if (event.detail && event.detail.page === 'management-grades') {
      init();
    }
  });

  bootIfVisible();

  function bootIfVisible() {
    const root = document.getElementById('admGradesMgmtRoot');
    if (!root || root.dataset.bound === '1') return;
    init();
  }

  function init() {
    const root = document.getElementById('admGradesMgmtRoot');
    if (!root || root.dataset.bound === '1') return;

    root.dataset.bound = '1';
    bindDom();
    bindEvents();
    loadAll();
  }

  function bindDom() {
    dom.root = document.getElementById('admGradesMgmtRoot');
    dom.refreshBtn = document.getElementById('admGradesMgmtRefreshBtn');
    dom.addCategoryBtn = document.getElementById('admGradesMgmtAddBtn');
    dom.searchInput = document.getElementById('admGradesMgmtSearch');
    dom.sortSelect = document.getElementById('admGradesMgmtSort');
    dom.tablesHost = document.getElementById('admGradesCategoryTables');

    dom.stats = {
      count: document.getElementById('admGradesScaleCount'),
      high: document.getElementById('admGradesScaleHigh'),
      low: document.getElementById('admGradesScaleLow'),
      spread: document.getElementById('admGradesScaleSpread'),
    };

    dom.categoryModal = {
      overlay: document.getElementById('admGradesCategoryModal'),
      closeBtn: document.getElementById('admGradesCategoryModalCloseBtn'),
      form: document.getElementById('admGradesCategoryForm'),
      title: document.getElementById('admGradesCategoryModalTitle'),
      hint: document.getElementById('admGradesCategoryModalHint'),
      editingId: document.getElementById('admGradesCategoryEditingId'),
      name: document.getElementById('admGradesCategoryName'),
      description: document.getElementById('admGradesCategoryDescription'),
      passThreshold: document.getElementById('admGradesCategoryPassThreshold'),
      usedBy: document.getElementById('admGradesCategoryUsedBy'),
      status: document.getElementById('admGradesCategoryStatus'),
      resetBtn: document.getElementById('admGradesCategoryResetBtn'),
      deleteBtn: document.getElementById('admGradesCategoryDeleteBtn'),
    };

    dom.detailModal = {
      overlay: document.getElementById('admGradesDetailModal'),
      closeBtn: document.getElementById('admGradesDetailModalCloseBtn'),
      form: document.getElementById('admGradesDetailForm'),
      title: document.getElementById('admGradesDetailModalTitle'),
      hint: document.getElementById('admGradesDetailModalHint'),
      editingId: document.getElementById('admGradesDetailEditingId'),
      categoryId: document.getElementById('admGradesDetailCategoryId'),
      grade: document.getElementById('admGradesDetailGrade'),
      point: document.getElementById('admGradesDetailPoint'),
      min: document.getElementById('admGradesDetailMin'),
      max: document.getElementById('admGradesDetailMax'),
      interpretation: document.getElementById('admGradesDetailInterpretation'),
      status: document.getElementById('admGradesDetailStatus'),
      remark: document.getElementById('admGradesDetailRemark'),
      resetBtn: document.getElementById('admGradesDetailResetBtn'),
      deleteBtn: document.getElementById('admGradesDetailDeleteBtn'),
    };
  }

  function bindEvents() {
    dom.refreshBtn?.addEventListener('click', loadAll);
    dom.addCategoryBtn?.addEventListener('click', function () {
      openCategoryModal();
    });

    dom.searchInput?.addEventListener('input', function () {
      state.search = (this.value || '').trim().toLowerCase();
      render();
    });

    dom.sortSelect?.addEventListener('change', function () {
      state.sort = this.value;
      render();
    });

    dom.tablesHost?.addEventListener('click', onTablesClick);

    dom.categoryModal.form?.addEventListener('submit', function (event) {
      event.preventDefault();
      saveCategory();
    });
    dom.categoryModal.resetBtn?.addEventListener('click', function () {
      fillCategoryForm(null);
    });
    dom.categoryModal.deleteBtn?.addEventListener('click', function () {
      const id = Number(dom.categoryModal.editingId?.value || 0);
      if (id) deleteCategory(id);
    });
    dom.categoryModal.closeBtn?.addEventListener('click', closeCategoryModal);
    dom.categoryModal.overlay?.addEventListener('click', function (event) {
      if (event.target === dom.categoryModal.overlay) closeCategoryModal();
    });

    dom.detailModal.form?.addEventListener('submit', function (event) {
      event.preventDefault();
      saveDetail();
    });
    dom.detailModal.resetBtn?.addEventListener('click', function () {
      fillDetailForm(null, getCurrentCategoryId());
      if (dom.detailModal.categoryId) dom.detailModal.categoryId.disabled = true;
    });
    dom.detailModal.deleteBtn?.addEventListener('click', function () {
      const id = Number(dom.detailModal.editingId?.value || 0);
      if (id) deleteDetail(id);
    });
    dom.detailModal.closeBtn?.addEventListener('click', closeDetailModal);
    dom.detailModal.overlay?.addEventListener('click', function (event) {
      if (event.target === dom.detailModal.overlay) closeDetailModal();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeCategoryModal();
      closeDetailModal();
    });
  }

  async function loadAll() {
    if (state.loading) return;
    state.loading = true;
    renderLoading();

    try {
      const [categoriesResp, detailsResp] = await Promise.all([
        apiCategoryList(),
        apiDetailList(),
      ]);

      const categories = unwrap(categoriesResp);
      const details = unwrap(detailsResp);

      state.categories = Array.isArray(categories) ? categories : [];
      state.details = Array.isArray(details) ? details : [];

      render();
    } catch (error) {
      renderError(error?.message || 'Failed to load grade categories');
      toast(error?.message || 'Failed to load grade categories', 'error');
    } finally {
      state.loading = false;
    }
  }

  function renderLoading() {
    if (dom.tablesHost) {
      dom.tablesHost.innerHTML = '<div class="adm-gr-empty">Loading grade categories...</div>';
    }
  }

  function renderError(message) {
    if (dom.tablesHost) {
      dom.tablesHost.innerHTML = '<div class="adm-gr-empty">' + esc(message) + '</div>';
    }
    renderStats([], []);
  }

  function render() {
    const visibleCategories = getVisibleCategories();
    renderStats(visibleCategories, state.details);
    renderCategoryTables(visibleCategories, state.details);
    syncDetailCategorySelect();
  }

  function getVisibleCategories() {
    let rows = state.categories.slice();

    if (state.search) {
      rows = rows.filter(function (row) {
        const text = [
          row.grade_categories_name,
          row.grade_categories_description,
          row.status,
          row.Used_By,
        ].join(' ').toLowerCase();

        const hasDetail = state.details.some(function (detail) {
          if (Number(detail.grade_categories_id) !== Number(row.grade_categories_id)) return false;
          const detailText = [detail.grade, detail.remark, detail.Interpretation, detail.min_score, detail.max_score].join(' ').toLowerCase();
          return detailText.includes(state.search);
        });

        return text.includes(state.search) || hasDetail;
      });
    }

    switch (state.sort) {
      case 'name_desc':
        rows.sort(function (a, b) {
          return String(b.grade_categories_name || '').localeCompare(String(a.grade_categories_name || ''));
        });
        break;
      case 'details_desc':
        rows.sort(function (a, b) {
          return getDetailsForCategory(b.grade_categories_id).length - getDetailsForCategory(a.grade_categories_id).length;
        });
        break;
      default:
        rows.sort(function (a, b) {
          return String(a.grade_categories_name || '').localeCompare(String(b.grade_categories_name || ''));
        });
        break;
    }

    return rows;
  }

  function renderStats(categories, details) {
    const detailRows = details.filter(function (d) {
      return categories.some(function (c) {
        return Number(c.grade_categories_id) === Number(d.grade_categories_id);
      });
    });

    setText(dom.stats.count, String(categories.length));

    if (!detailRows.length) {
      setText(dom.stats.high, '0%');
      setText(dom.stats.low, '0%');
      setText(dom.stats.spread, '0%');
      return;
    }

    const highs = detailRows.map(function (r) { return toNumber(r.max_score); }).filter(isFiniteNumber);
    const lows = detailRows.map(function (r) { return toNumber(r.min_score); }).filter(isFiniteNumber);
    const spreads = detailRows.map(function (r) {
      return Math.max(0, toNumber(r.max_score) - toNumber(r.min_score));
    }).filter(isFiniteNumber);

    setText(dom.stats.high, formatPercent(Math.max.apply(null, highs)));
    setText(dom.stats.low, formatPercent(Math.min.apply(null, lows)));

    const avgSpread = spreads.reduce(function (sum, value) { return sum + value; }, 0) / spreads.length;
    setText(dom.stats.spread, formatPercent(avgSpread));
  }

  function renderCategoryTables(categories, details) {
    if (!dom.tablesHost) return;

    if (!categories.length) {
      dom.tablesHost.innerHTML = '<div class="adm-gr-empty">No grade categories found.</div>';
      return;
    }

    const html = categories.map(function (category) {
      const rows = getDetailsForCategory(category.grade_categories_id, details);
      const status = String(category.status || 'draft').toLowerCase();
      const statusClass = status === 'active' ? '' : (status === 'inactive' ? ' inactive' : ' muted');

      return (
        '<article class="adm-gr-category-card">' +
          '<header class="adm-gr-category-head">' +
            '<div>' +
              '<h3>' + esc(category.grade_categories_name || 'Untitled Category') + '</h3>' +
              '<p>' + esc(category.grade_categories_description || 'No description provided.') + '</p>' +
              '<div class="adm-gr-badges">' +
                '<span class="adm-gr-badge' + statusClass + '">' + esc(status || 'draft') + '</span>' +
                '<span class="adm-gr-badge muted">Details: ' + rows.length + '</span>' +
                '<span class="adm-gr-badge muted">Pass: ' + esc(category.Pass_Threshold ?? '-') + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="adm-gr-category-actions">' +
              '<button class="adm-gr-btn small ghost" type="button" data-action="add-detail" data-category-id="' + Number(category.grade_categories_id) + '"><i class="fas fa-plus"></i> Detail</button>' +
              '<button class="adm-gr-btn small ghost" type="button" data-action="edit-category" data-category-id="' + Number(category.grade_categories_id) + '"><i class="fas fa-pen"></i> Edit</button>' +
              '<button class="adm-gr-btn small ghost" type="button" data-action="toggle-category" data-category-id="' + Number(category.grade_categories_id) + '"><i class="fas ' + (status === 'active' ? 'fa-toggle-on' : 'fa-toggle-off') + '"></i> Toggle</button>' +
            '</div>' +
          '</header>' +
          '<div class="adm-gr-table-wrap">' +
            '<table class="adm-gr-table">' +
              '<thead><tr><th>Grade</th><th>Score range</th><th>Point</th><th>Interpretation</th><th>Status</th><th>Actions</th></tr></thead>' +
              '<tbody>' +
                (rows.length ? rows.map(renderDetailRow).join('') : '<tr><td colspan="6" class="adm-gr-empty">No report details yet for this category.</td></tr>') +
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<footer class="adm-gr-note">Use Add Detail to create grade boundaries for this category.</footer>' +
        '</article>'
      );
    }).join('');

    dom.tablesHost.innerHTML = html;
  }

  function renderDetailRow(detail) {
    const status = String(detail.Status || detail.status || 'active').toLowerCase();
    const min = formatDecimal(detail.min_score);
    const max = formatDecimal(detail.max_score);

    return (
      '<tr>' +
        '<td><strong>' + esc(detail.grade || '-') + '</strong></td>' +
        '<td>' + esc(min) + ' - ' + esc(max) + '%</td>' +
        '<td>' + esc(formatDecimal(detail.grade_point)) + '</td>' +
        '<td>' + esc(detail.Interpretation || detail.remark || '-') + '</td>' +
        '<td>' + esc(status) + '</td>' +
        '<td>' +
          '<div class="adm-gr-table-actions">' +
            '<button class="adm-gr-btn small ghost" type="button" data-action="edit-detail" data-detail-id="' + Number(detail.grade_scale_id) + '"><i class="fas fa-pen"></i></button>' +
            '<button class="adm-gr-btn small danger" type="button" data-action="delete-detail" data-detail-id="' + Number(detail.grade_scale_id) + '"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }

  function onTablesClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const categoryId = Number(button.dataset.categoryId || 0);
    const detailId = Number(button.dataset.detailId || 0);

    if (action === 'add-detail' && categoryId) {
      openDetailModal(null, categoryId);
      return;
    }

    if (action === 'edit-category' && categoryId) {
      const category = state.categories.find(function (c) {
        return Number(c.grade_categories_id) === categoryId;
      });
      openCategoryModal(category || null);
      return;
    }

    if (action === 'toggle-category' && categoryId) {
      toggleCategoryStatus(categoryId);
      return;
    }

    if (action === 'edit-detail' && detailId) {
      const detail = state.details.find(function (d) {
        return Number(d.grade_scale_id) === detailId;
      });
      if (detail) openDetailModal(detail, Number(detail.grade_categories_id));
      return;
    }

    if (action === 'delete-detail' && detailId) {
      deleteDetail(detailId);
    }
  }

  function openCategoryModal(category) {
    fillCategoryForm(category || null);
    dom.categoryModal.overlay?.classList.add('show');
    dom.categoryModal.overlay?.setAttribute('aria-hidden', 'false');
  }

  function closeCategoryModal() {
    dom.categoryModal.overlay?.classList.remove('show');
    dom.categoryModal.overlay?.setAttribute('aria-hidden', 'true');
  }

  function fillCategoryForm(category) {
    setValue(dom.categoryModal.editingId, category ? category.grade_categories_id : '');
    setValue(dom.categoryModal.name, category ? category.grade_categories_name : '');
    setValue(dom.categoryModal.description, category ? category.grade_categories_description : '');
    setValue(dom.categoryModal.passThreshold, category ? category.Pass_Threshold : '');
    setValue(dom.categoryModal.usedBy, category ? category.Used_By : '');
    setValue(dom.categoryModal.status, category ? (category.status || 'active') : 'active');

    if (category) {
      setText(dom.categoryModal.title, 'Edit grade category');
      setText(dom.categoryModal.hint, 'Update category attributes and status.');
      if (dom.categoryModal.deleteBtn) dom.categoryModal.deleteBtn.style.display = 'inline-flex';
    } else {
      setText(dom.categoryModal.title, 'Add grade category');
      setText(dom.categoryModal.hint, 'Create a category table section.');
      if (dom.categoryModal.deleteBtn) dom.categoryModal.deleteBtn.style.display = 'none';
    }
  }

  async function saveCategory() {
    const id = Number(dom.categoryModal.editingId?.value || 0);
    const payload = {
      grade_categories_name: (dom.categoryModal.name?.value || '').trim(),
      grade_categories_description: (dom.categoryModal.description?.value || '').trim() || null,
      Pass_Threshold: dom.categoryModal.passThreshold?.value === '' ? null : Number(dom.categoryModal.passThreshold?.value),
      Used_By: (dom.categoryModal.usedBy?.value || '').trim() || null,
      status: (dom.categoryModal.status?.value || 'active').trim(),
    };

    if (!payload.grade_categories_name) {
      toast('Category name is required', 'error');
      return;
    }

    try {
      if (id) {
        await apiCategoryUpdate(id, payload);
        toast('Grade category updated', 'success');
      } else {
        await apiCategoryCreate(payload);
        toast('Grade category created', 'success');
      }
      closeCategoryModal();
      await loadAll();
    } catch (error) {
      toast(error?.message || 'Failed to save grade category', 'error');
    }
  }

  async function deleteCategory(id) {
    if (!window.confirm('Delete this grade category?')) return;

    try {
      await apiCategoryDelete(id);
      toast('Grade category deleted', 'success');
      closeCategoryModal();
      await loadAll();
    } catch (error) {
      toast(error?.message || 'Failed to delete grade category', 'error');
    }
  }

  async function toggleCategoryStatus(categoryId) {
    const category = state.categories.find(function (c) {
      return Number(c.grade_categories_id) === Number(categoryId);
    });
    if (!category) return;

    const current = String(category.status || 'draft').toLowerCase();
    const next = current === 'active' ? 'inactive' : 'active';

    try {
      await apiCategoryUpdate(categoryId, { status: next });
      toast('Category status updated to ' + next, 'success');
      await loadAll();
    } catch (error) {
      toast(error?.message || 'Failed to update category status', 'error');
    }
  }

  function openDetailModal(detail, categoryId) {
    fillDetailForm(detail || null, categoryId || null);
    dom.detailModal.overlay?.classList.add('show');
    dom.detailModal.overlay?.setAttribute('aria-hidden', 'false');
  }

  function closeDetailModal() {
    dom.detailModal.overlay?.classList.remove('show');
    dom.detailModal.overlay?.setAttribute('aria-hidden', 'true');
  }

  function fillDetailForm(detail, categoryId) {
    syncDetailCategorySelect();

    setValue(dom.detailModal.editingId, detail ? detail.grade_scale_id : '');
    setValue(dom.detailModal.categoryId, detail ? detail.grade_categories_id : (categoryId || getCurrentCategoryId() || ''));
    setValue(dom.detailModal.grade, detail ? detail.grade : '');
    setValue(dom.detailModal.point, detail ? detail.grade_point : '');
    setValue(dom.detailModal.min, detail ? detail.min_score : '');
    setValue(dom.detailModal.max, detail ? detail.max_score : '');
    setValue(dom.detailModal.interpretation, detail ? (detail.Interpretation || '') : '');
    setValue(dom.detailModal.status, detail ? (detail.Status || 'active') : 'active');
    setValue(dom.detailModal.remark, detail ? (detail.remark || '') : '');

    // Disable category select since each category table has its own detail button
    if (dom.detailModal.categoryId) dom.detailModal.categoryId.disabled = true;

    if (detail) {
      setText(dom.detailModal.title, 'Edit report detail');
      setText(dom.detailModal.hint, 'Update this detail row for the selected category.');
      if (dom.detailModal.deleteBtn) dom.detailModal.deleteBtn.style.display = 'inline-flex';
    } else {
      setText(dom.detailModal.title, 'Add report detail');
      setText(dom.detailModal.hint, 'Add a grading detail row under the selected category.');
      if (dom.detailModal.deleteBtn) dom.detailModal.deleteBtn.style.display = 'none';
    }
  }

  async function saveDetail() {
    const id = Number(dom.detailModal.editingId?.value || 0);
    const payload = {
      grade_categories_id: Number(dom.detailModal.categoryId?.value || 0) || null,
      grade: (dom.detailModal.grade?.value || '').trim().toUpperCase(),
      min_score: Number(dom.detailModal.min?.value),
      max_score: Number(dom.detailModal.max?.value),
      grade_point: dom.detailModal.point?.value === '' ? null : Number(dom.detailModal.point?.value),
      Interpretation: (dom.detailModal.interpretation?.value || '').trim() || null,
      Status: (dom.detailModal.status?.value || 'active').trim(),
      remark: (dom.detailModal.remark?.value || '').trim() || null,
    };

    if (!payload.grade_categories_id) {
      toast('Select a category', 'error');
      return;
    }
    if (!payload.grade) {
      toast('Grade is required', 'error');
      return;
    }
    if (!isFiniteNumber(payload.min_score) || !isFiniteNumber(payload.max_score)) {
      toast('Min and max score are required', 'error');
      return;
    }

    try {
      if (id) {
        await apiDetailUpdate(id, payload);
        toast('Report detail updated', 'success');
      } else {
        await apiDetailCreate(payload);
        toast('Report detail created', 'success');
      }

      closeDetailModal();
      await loadAll();
    } catch (error) {
      toast(error?.message || 'Failed to save report detail', 'error');
    }
  }

  async function deleteDetail(id) {
    if (!window.confirm('Delete this report detail?')) return;

    try {
      await apiDetailDelete(id);
      toast('Report detail deleted', 'success');
      closeDetailModal();
      await loadAll();
    } catch (error) {
      toast(error?.message || 'Failed to delete report detail', 'error');
    }
  }

  function syncDetailCategorySelect() {
    if (!dom.detailModal.categoryId) return;

    const current = dom.detailModal.categoryId.value;
    dom.detailModal.categoryId.innerHTML = '';

    state.categories.forEach(function (category) {
      const option = document.createElement('option');
      option.value = String(category.grade_categories_id);
      option.textContent = category.grade_categories_name || ('Category ' + category.grade_categories_id);
      dom.detailModal.categoryId.appendChild(option);
    });

    if (current && [...dom.detailModal.categoryId.options].some(function (opt) { return opt.value === current; })) {
      dom.detailModal.categoryId.value = current;
    }
  }

  function getCurrentCategoryId() {
    return Number(dom.detailModal.categoryId?.value || 0) || null;
  }

  function getDetailsForCategory(categoryId, source) {
    const rows = (source || state.details).filter(function (row) {
      return Number(row.grade_categories_id) === Number(categoryId);
    });

    rows.sort(function (a, b) {
      return toNumber(b.max_score) - toNumber(a.max_score);
    });

    return rows;
  }

  function apiCategoryList() {
    if (typeof GradeCategoryAPI !== 'undefined' && typeof GradeCategoryAPI.getAll === 'function') {
      return GradeCategoryAPI.getAll();
    }
    return API.get(API_ENDPOINTS.GRADE_CATEGORIES);
  }

  function apiCategoryCreate(payload) {
    if (typeof GradeCategoryAPI !== 'undefined' && typeof GradeCategoryAPI.create === 'function') {
      return GradeCategoryAPI.create(payload);
    }
    return API.post(API_ENDPOINTS.GRADE_CATEGORIES, payload);
  }

  function apiCategoryUpdate(id, payload) {
    if (typeof GradeCategoryAPI !== 'undefined' && typeof GradeCategoryAPI.update === 'function') {
      return GradeCategoryAPI.update(id, payload);
    }
    return API.put(API_ENDPOINTS.GRADE_CATEGORY_BY_ID(id), payload);
  }

  function apiCategoryDelete(id) {
    if (typeof GradeCategoryAPI !== 'undefined' && typeof GradeCategoryAPI.delete === 'function') {
      return GradeCategoryAPI.delete(id);
    }
    return API.delete(API_ENDPOINTS.GRADE_CATEGORY_BY_ID(id));
  }

  function apiDetailList() {
    if (typeof GradeScaleAPI !== 'undefined' && typeof GradeScaleAPI.getAll === 'function') {
      return GradeScaleAPI.getAll();
    }
    return API.get(API_ENDPOINTS.GRADE_SCALES);
  }

  function apiDetailCreate(payload) {
    if (typeof GradeScaleAPI !== 'undefined' && typeof GradeScaleAPI.create === 'function') {
      return GradeScaleAPI.create(payload);
    }
    return API.post(API_ENDPOINTS.GRADE_SCALES, payload);
  }

  function apiDetailUpdate(id, payload) {
    if (typeof GradeScaleAPI !== 'undefined' && typeof GradeScaleAPI.update === 'function') {
      return GradeScaleAPI.update(id, payload);
    }
    return API.put(API_ENDPOINTS.GRADE_SCALE_BY_ID(id), payload);
  }

  function apiDetailDelete(id) {
    if (typeof GradeScaleAPI !== 'undefined' && typeof GradeScaleAPI.delete === 'function') {
      return GradeScaleAPI.delete(id);
    }
    return API.delete(API_ENDPOINTS.GRADE_SCALE_BY_ID(id));
  }

  function unwrap(response) {
    if (Array.isArray(response)) return response;
    if (!response || typeof response !== 'object') return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.result)) return response.result;
    return [];
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  function isFiniteNumber(value) {
    return Number.isFinite(value);
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function setValue(el, value) {
    if (el) el.value = value == null ? '' : value;
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return '0%';
    const rounded = Number.isInteger(value) ? value : value.toFixed(1);
    return String(rounded).replace(/\.0$/, '') + '%';
  }

  function formatDecimal(value) {
    if (value == null || value === '') return '-';
    const n = Number(value);
    if (!Number.isFinite(n)) return '-';
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char];
    });
  }

  function toast(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type || 'info');
      return;
    }
    if (typeof window.toast === 'function') {
      window.toast(message, type || 'info');
      return;
    }
    console.log('[' + (type || 'info') + '] ' + message);
  }
})();
