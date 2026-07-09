/* Grade Levels Management */
(function () {
    'use strict';

    const S = {
        levels: [],
        editingId: null,
        page: 1,
        limit: 20,
        searchTerm: '',
        statusFilter: '',
        total: 0,
        pages: 1,
        nextOrder: 1,
    };

    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'grade-level') initPage();
    });

    function initPage() {
        S.editingId = null;
        S.page = 1;
        S.limit = 20;
        S.searchTerm = '';
        S.statusFilter = '';
        setupListeners();
        loadLevels();
    }

    function el(id) { return document.getElementById(id); }
    function val(id) { const node = el(id); return node ? String(node.value || '').trim() : ''; }
    function setVal(id, value) { const node = el(id); if (node) node.value = value ?? ''; }
    function toast(message, type) { if (window.showToast) window.showToast(message, type); else console.log(message); }
    function confirm_(title, message, onConfirm) { if (window.showModal) window.showModal(title, message, onConfirm); else if (confirm(`${title}\n${message}`)) onConfirm(); }

    function setupListeners() {
        el('addGradeLevelBtn')?.addEventListener('click', () => openModal());
        el('gradeLevelModalClose')?.addEventListener('click', closeModal);
        el('gradeLevelModalCancel')?.addEventListener('click', closeModal);
        el('gradeLevelModalSave')?.addEventListener('click', saveLevel);
        el('gradeLevelModalOverlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
        el('glSearchInput')?.addEventListener('input', (e) => { S.searchTerm = e.target.value.toLowerCase(); filterAndRender(); });
        el('glFilterStatus')?.addEventListener('change', (e) => { S.statusFilter = e.target.value; filterAndRender(); });
    }

    function apiGet(page = S.page, limit = S.limit) {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        return API.get(`/api/grade-levels?${params.toString()}`);
    }

    function apiReq(method, url, body) {
        if (method === 'GET') return API.get(url);
        if (method === 'POST') return API.post(url, body || {});
        if (method === 'PUT') return API.put(url, body || {});
        if (method === 'DELETE') return API.delete(url);
        return Promise.reject(new Error('Unsupported method'));
    }

    function loadLevels() {
        const tbody = el('gradeLevelsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-secondary,#94a3b8)"><i class="fas fa-spinner fa-spin" style="animation:spin 1s linear infinite"></i> Loading…</td></tr>';
        }

        apiGet().then((res) => {
            if (!res.success) throw new Error(res.message || 'Failed to load grade levels');
            const payload = res.data || {};
            S.levels = payload.data || payload.items || payload || [];
            S.nextOrder = Number(payload.meta?.next_level_order ?? S.nextOrder ?? 1) || 1;
            const pagination = payload.pagination || res.pagination || {};
            S.total = Number(pagination.total ?? S.levels.length) || 0;
            S.pages = Number(pagination.total_pages ?? pagination.pages ?? Math.max(1, Math.ceil(S.total / S.limit))) || 1;
            S.page = Number(pagination.current_page ?? pagination.page ?? S.page) || 1;
            S.limit = Number(pagination.per_page ?? pagination.limit ?? S.limit) || S.limit;
            filterAndRender();
            updateStats();
            renderPagination(pagination);
        }).catch((err) => {
            console.error(err);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ef4444;padding:2rem"><i class="fas fa-exclamation-circle"></i> ' + esc(err.message || 'Error loading data') + '</td></tr>';
            }
            toast('✗ ' + (err.message || 'Failed to load grade levels'), 'error');
        });
    }

    function filterAndRender() {
        let filtered = S.levels;
        if (S.searchTerm) {
            filtered = filtered.filter((level) => {
                const code = String(level.grade_level_code || '').toLowerCase();
                const name = String(level.grade_level_name || '').toLowerCase();
                const desc = String(level.description || '').toLowerCase();
                const status = String(level.status || '').toLowerCase();
                return code.includes(S.searchTerm) || name.includes(S.searchTerm) || desc.includes(S.searchTerm) || status.includes(S.searchTerm);
            });
        }
        if (S.statusFilter) {
            filtered = filtered.filter((level) => String(level.status || '').toLowerCase() === S.statusFilter);
        }
        renderTable(filtered);
    }

    function renderTable(levels) {
        const tbody = el('gradeLevelsTableBody');
        if (!tbody) return;

        if (!levels.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="gl-empty"><i class="fas fa-layer-group"></i><h4>' + (S.searchTerm || S.statusFilter ? 'No results' : 'No grade levels') + '</h4><p>' + (S.searchTerm || S.statusFilter ? 'Try another filter or search term' : 'Add your first grade level') + '</p></div></td></tr>';
            return;
        }

        tbody.innerHTML = levels.map((level) => {
            const isActive = String(level.status || '').toLowerCase() === 'active';
            const statusBadge = isActive ? '<span class="gl-badge-active">Active</span>' : '<span class="gl-badge-inactive">Inactive</span>';
            const classCount = Number(level.class_count) || 0;
            return `
            <tr data-id="${esc(level.grade_level_id)}">
              <td>
                <div class="gl-level-cell">
                  <div class="gl-level-icon"><i class="fas fa-layer-group"></i></div>
                  <div>
                    <div class="gl-level-name">${esc(level.grade_level_name || '')}</div>
                    <div class="gl-level-sub">${esc(level.grade_level_code || '')}${level.description ? ' · ' + esc(level.description) : ''}</div>
                  </div>
                </div>
              </td>
              <td>${esc(level.level_order ?? '—')}</td>
              <td>${classCount}</td>
              <td>${statusBadge}</td>
              <td>
                <div class="gl-actions">
                  <button class="btn-edit" title="Edit grade level" onclick="gradeLevelEdit('${esc(level.grade_level_id)}')"><i class="fas fa-edit"></i></button>
                  <button class="btn-delete" title="Delete grade level" onclick="gradeLevelDelete('${esc(level.grade_level_id)}', '${esc(level.grade_level_name || '')}')"><i class="fas fa-trash"></i></button>
                </div>
              </td>
            </tr>`;
        }).join('');
    }

    function renderPagination(pagination) {
        const wrap = el('glPagination');
        const infoEl = el('glPaginationInfo');
        const ctrlEl = el('glPaginationControls');
        if (!wrap) return;

        const totalPages = Number(pagination?.total_pages ?? pagination?.pages ?? S.pages ?? 1) || 1;
        const currentPage = Number(pagination?.current_page ?? pagination?.page ?? S.page) || 1;
        const total = Number(pagination?.total ?? S.total ?? S.levels.length) || 0;
        const perPage = Number(pagination?.per_page ?? pagination?.limit ?? S.limit) || S.limit;

        S.page = currentPage;
        S.limit = perPage;
        S.total = total;
        S.pages = totalPages;

        if (totalPages <= 1) {
            wrap.style.display = 'none';
            return;
        }

        wrap.style.display = 'flex';
        const from = total === 0 ? 0 : ((currentPage - 1) * perPage) + 1;
        const to = total === 0 ? 0 : Math.min(currentPage * perPage, total);
        if (infoEl) infoEl.textContent = 'Showing ' + from + '–' + to + ' of ' + total + ' grade levels';

        if (!ctrlEl) return;
        let html = '';
        html += '<button ' + (currentPage === 1 ? 'disabled' : '') + ' onclick="glGoPage(' + (currentPage - 1) + ')"><i class="fas fa-chevron-left"></i></button>';
        for (let p = 1; p <= totalPages; p++) {
            if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
                html += '<button class="' + (p === currentPage ? 'active' : '') + '" onclick="glGoPage(' + p + ')">' + p + '</button>';
            } else if (p === currentPage - 3 || p === currentPage + 3) {
                html += '<button disabled>…</button>';
            }
        }
        html += '<button ' + (currentPage === totalPages ? 'disabled' : '') + ' onclick="glGoPage(' + (currentPage + 1) + ')"><i class="fas fa-chevron-right"></i></button>';
        ctrlEl.innerHTML = html;
    }

    window.glGoPage = function (page) {
        S.page = page;
        loadLevels();
    };

    window.gradeLevelEdit = function (id) {
        openModal(id);
    };

    window.gradeLevelDelete = function (id, name) {
        confirm_('Delete Grade Level', 'Delete "' + name + '"? This cannot be undone.', () => {
            apiReq('DELETE', `/api/grade-levels/${id}`).then((res) => {
                if (!res.success) throw new Error(res.message || 'Delete failed');
                toast('✓ Grade level deleted successfully', 'success');
                loadLevels();
            }).catch((err) => {
                toast('✗ ' + (err.message || 'Failed to delete grade level'), 'error');
            });
        });
    };

    window.gradeLevelViewClasses = function (id) {
        const level = S.levels.find((item) => String(item.grade_level_id) === String(id));
        const title = level ? (level.grade_level_name || 'Grade Level') : 'Grade Level';
        confirm_('Grade Level Classes', 'Open the backend-linked classes view for "' + title + '"?', () => {
            window.open(`/api/grade-levels/${id}/classes`, '_blank');
        });
    };

    function openModal(id) {
        S.editingId = id || null;
        const overlay = el('gradeLevelModalOverlay');
        const titleEl = el('gradeLevelModalTitle');
        const errorEl = el('gradeLevelFormError');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }

        if (id) {
            const level = S.levels.find((item) => String(item.grade_level_id) === String(id));
            if (level) {
                setVal('fieldGradeLevelCode', level.grade_level_code);
                setVal('fieldGradeLevelName', level.grade_level_name);
                setVal('fieldLevelOrder', level.level_order);
                setVal('fieldDescription', level.description || '');
                setVal('fieldStatus', level.status || 'active');
                setVal('fieldClassCount', level.class_count ?? 0);
                if (titleEl) titleEl.textContent = 'Edit Grade Level';
            }
        } else {
            setVal('fieldGradeLevelCode', '');
            setVal('fieldGradeLevelName', '');
            setVal('fieldLevelOrder', String(S.nextOrder || 1));
            setVal('fieldDescription', '');
            setVal('fieldStatus', 'active');
            setVal('fieldClassCount', '0');
            if (titleEl) titleEl.textContent = 'Add Grade Level';
        }

        overlay?.classList.add('open');
        el('fieldGradeLevelCode')?.focus();
    }

    function closeModal() {
        el('gradeLevelModalOverlay')?.classList.remove('open');
        S.editingId = null;
    }

    function setSaving(on) {
        const spinner = el('gradeLevelModalSaveSpinner');
        const btn = el('gradeLevelModalSave');
        if (spinner) spinner.style.display = on ? 'inline-block' : 'none';
        if (btn) btn.disabled = on;
    }

    function showFormError(message) {
        const errorEl = el('gradeLevelFormError');
        if (!errorEl) return;
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    function saveLevel() {
        const grade_level_code = val('fieldGradeLevelCode');
        const grade_level_name = val('fieldGradeLevelName');
        const level_order = val('fieldLevelOrder');
        const description = val('fieldDescription');
        const status = val('fieldStatus') || 'active';

        if (!grade_level_code) return showFormError('Grade level code is required.');
        if (!grade_level_name) return showFormError('Grade level name is required.');
        if (!level_order) return showFormError('Level order is required.');

        const payload = {
            grade_level_code,
            grade_level_name,
            level_order: Number(level_order),
            description,
            status,
        };

        const isEdit = !!S.editingId;
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `/api/grade-levels/${S.editingId}` : '/api/grade-levels';

        setSaving(true);
        apiReq(method, url, payload).then((res) => {
            setSaving(false);
            if (!res.success) throw new Error(res.message || 'Save failed');
            toast(isEdit ? '✓ Grade level updated successfully' : '✓ Grade level created successfully', 'success');
            closeModal();
            loadLevels();
        }).catch((err) => {
            setSaving(false);
            showFormError(err.message || 'An error occurred while saving the grade level.');
        });
    }

    function updateStats() {
        const total = S.total || S.levels.length;
        const active = S.levels.filter((level) => String(level.status || '').toLowerCase() === 'active').length;
        const linkedClasses = S.levels.reduce((sum, level) => sum + (Number(level.class_count) || 0), 0);
        const orders = S.levels.map((level) => Number(level.level_order)).filter((value) => !Number.isNaN(value));

        const totalEl = el('glStatTotal');
        const activeEl = el('glStatActive');
        const classesEl = el('glStatClasses');
        const rangeEl = el('glStatRange');

        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active || '—';
        if (classesEl) classesEl.textContent = linkedClasses;
        if (rangeEl) {
            if (orders.length) {
                const minOrder = Math.min(...orders);
                const maxOrder = Math.max(...orders);
                rangeEl.textContent = minOrder === maxOrder ? String(minOrder) : (minOrder + ' → ' + maxOrder);
            } else {
                rangeEl.textContent = '—';
            }
        }
    }

    function esc(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
