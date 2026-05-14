(function () {
  const ENDPOINT = (window.API_ENDPOINTS && window.API_ENDPOINTS.SUPERADMIN_ACTIVITY) || '/api/superadmin-activity';
  const ENDPOINT_CLEANUP = (window.API_ENDPOINTS && window.API_ENDPOINTS.SUPERADMIN_ACTIVITY_CLEANUP) || (ENDPOINT + '/cleanup');
   document.addEventListener('page:loaded', (e) => { if (e.detail && e.detail.page === 'logs') init(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.addEventListener('unhandledrejection', e => {
  console.error('UnhandledRejection:', e.reason, e);
});

  const $ = (sel, root = document) => root.querySelector(sel);
  let els = {};

  function buildQuery(page = 1) {
    const params = new URLSearchParams();
    if (els.search && els.search.value.trim()) params.set('q', els.search.value.trim());
    if (els.level && els.level.value) params.set('severity', els.level.value);
    if (els.from && els.from.value) params.set('start_date', els.from.value);
    if (els.to && els.to.value) params.set('end_date', els.to.value);
    if (els.user && els.user.value) params.set('performer', els.user.value);
    params.set('page', page);
    // include page size / limit if available
    const limit = (els.perPage && els.perPage.value) ? Number(els.perPage.value) : null;
    if (limit) params.set('limit', limit);
    return params.toString();
  }

  function renderPaginationControls(meta) {
    const container = els.paginationControls || document.querySelector('.log-pagination-controls');
    if (!container) return;
    container.innerHTML = '';
    const current = Number(meta.page || meta.current_page || 1);
    const limit = Number(meta.limit || meta.per_page || 10);
    const total = Number(meta.total || 0);
    const pages = Number(meta.pages || Math.max(1, Math.ceil((total || 0) / (limit || 10))));

    function makeBtn(label, disabled, page) {
      const b = document.createElement('button');
      b.textContent = label;
      if (disabled) b.disabled = true;
      if (!disabled) b.addEventListener('click', () => fetchLogs(page));
      return b;
    }

    // first / prev
    container.appendChild(makeBtn('‹‹', current <= 1, 1));
    container.appendChild(makeBtn('‹', current <= 1, Math.max(1, current - 1)));

    // page window
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = Math.min(pages, start + windowSize - 1);
    if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);

    for (let p = start; p <= end; p++) {
      const b = document.createElement('button');
      b.textContent = String(p);
      if (p === current) b.className = 'active';
      else b.addEventListener('click', () => fetchLogs(p));
      container.appendChild(b);
    }

    // next / last
    container.appendChild(makeBtn('›', current >= pages, Math.min(pages, current + 1)));
    container.appendChild(makeBtn('››', current >= pages, pages));
  }

  function renderRows(items) {
    if (!els.tbody) return;
    els.tbody.innerHTML = '';
    console.log('Rendering logs', items);
    console.log('!items || !items.length', !items || !items.length);
    if (!items || !items.length) {
      els.tbody.innerHTML = '<tr><td colspan="7">No logs found.</td></tr>';
      return;
    }
    const frag = document.createDocumentFragment();
    // collect users to populate user filter
    const usersMap = new Map();
    items.forEach(it => {
      const tr = document.createElement('tr');

      // map backend fields to UI-friendly names (support legacy and current shapes)
      const timestamp = it.created_at || it.timestamp || it.time || '';
      const level = it.severity || it.level || 'info';
      const user = it.performer_name || it.user || '';
      const userId = it.performed_by || it.performed_by_id || it.user_id || it.performed_by || '';
      const action = it.activity_type || it.action || '';
      const message = it.description || it.message || '';
      const ip = it.ip_address || it.ip || '';
      const id = it.activity_id || it.id || it.uuid || '';

      tr.innerHTML = `
        <td class="log-timestamp">${escapeHtml(timestamp)}</td>
        <td><span class="log-level log-level-${escapeHtml(level)}">${escapeHtml(cap(level))}</span></td>
        <td class="log-user">${escapeHtml(user)}</td>
        <td>${escapeHtml(action)}</td>
        <td class="log-message">${escapeHtml(message)}</td>
        <td>${escapeHtml(ip || '-' )}</td>
      `;

      if (user) usersMap.set(userId || user, user);
      frag.appendChild(tr);
    });
    els.tbody.appendChild(frag);

    // populate user filter options if not already populated
    try {
      const sel = document.getElementById('userFilter');
      if (sel && sel.options.length <= 1) {
        usersMap.forEach((name, uid) => {
          const opt = document.createElement('option');
          opt.value = uid || name;
          opt.textContent = name;
          sel.appendChild(opt);
        });
      }
    } catch (e) {
      // noop
    }
  }

  function escapeHtml(s){
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cap(s){ return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1); }

  async function fetchStats() {
    try {

        const apiPath = (window.API_ENDPOINTS && window.API_ENDPOINTS.SUPERADMIN_ACTIVITY_STATS) || '/api/superadmin-activity/stats';;
        if (!apiPath) {
          console.warn('No API endpoint defined for fetching stats');
          return;
        }
        const data = await API.get(apiPath);
        console.log('Stats response', data.by_severity);
        if (data && typeof data === 'object' && ('success' in data) && data.data) {
          renderStats(data.data);
        } else {
          console.warn('Unexpected stats response format', data);
        }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
        
  }

  function renderStats(stats) {
    stats = stats.by_severity || {};
    if (!stats || !els.stats) return;
    // expects stats keys: info, warning, critical
    console.log('Rendering stats', stats);
    const map = ['info','warning','critical'];
    map.forEach((k, i) => {
      if (els.stats[i]) els.stats[i].textContent = stats[k] ?? '-';
      console.log(`Stat ${k}:`, stats[k]);
    });
  }

  function updatePaginationInfo(meta) {
    if (!meta || !els.paginationInfo) return;
    els.paginationInfo.textContent = `Showing ${meta.from || 0}-${meta.to || 0} of ${meta.total || 0} logs`;
  }

  async function fetchLogs(page = 1) {
    const qParams = {};
    const q = new URLSearchParams(buildQuery(page));
    console.log('Fetching logs with query', q.toString());
    for (const [k, v] of q.entries()) qParams[k] = v;
    try {
      const apiPath = ENDPOINT || (window.API_ENDPOINTS && window.API_ENDPOINTS.SUPERADMIN_ACTIVITY) || '/api/superadmin-activity';
      if (typeof API === 'undefined' || !API.get) {
        console.error('API client is not available. Ensure assets/js/api.js is loaded before logs.js and you are authenticated.');
        if (els.tbody) els.tbody.innerHTML = '<tr><td colspan="7">API client missing. Include assets/js/api.js before this script and ensure you are logged in.</td></tr>';
        return;
      }
      console.debug('logs.js: calling API.get', apiPath, qParams);
      let data = await API.get(apiPath, qParams);
      // Unwrap API envelope if present: { success: true, data: { ... } }
      if (data && typeof data === 'object' && ('success' in data) && data.data) {
        data = data.data;
      }
        // support both {items, meta, stats} and plain array
        if (Array.isArray(data)) {
            renderRows(data);
            updatePaginationInfo({from:1,to:data.length,total:data.length});
          } else {
            // Support different backend shapes
            const rows = data.items || data.logs || data.activities || [];
            renderRows(rows);

            // Stats can be `stats` or `by_severity` from repo
            const statsSource = data.stats || data.by_severity || (data.stats_summary || {});
            // Normalize to expected keys
            const normalizedStats = {
              info: statsSource.info ?? statsSource['info'] ?? 0,
              warning: statsSource.warning ?? statsSource['warning'] ?? 0,
              error: statsSource.critical ?? statsSource['critical'] ?? 0,
              success: statsSource.success ?? 0,
              debug: statsSource.debug ?? 0,
            };
            fetchStats(); // fetch latest stats separately to ensure accuracy, or use normalizedStats if you trust the main response

            // Pagination: backend may return `meta` or `pagination` object
            const meta = data.meta || data.pagination || {};
            // compute from/to if not present
            if (!meta.from && meta.page && meta.limit) {
              meta.from = ((meta.page - 1) * meta.limit) + 1;
              meta.to = Math.min(meta.page * meta.limit, meta.total || 0);
            }
            updatePaginationInfo(meta || {});
            renderPaginationControls(meta || {});
          }
    } catch (err) {
      console.error('Failed to fetch logs', err);
      // show friendly message in table
      if (els.tbody) els.tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(err.message || 'Failed to load logs')}</td></tr>`;
    }
  }

  function init() {
    // populate element references now (page may be injected dynamically)
    els.search = document.getElementById('logSearch');
    els.level = document.getElementById('logLevel');
    els.from = document.getElementById('dateFrom');
    els.to = document.getElementById('dateTo');
    els.user = document.getElementById('userFilter');
    els.exportBtn = document.querySelector('.log-export-btn');
    els.clearBtn = document.querySelector('.log-clear-btn');
    els.tbody = document.getElementById('logsTableBody');
    els.stats = document.querySelectorAll('.institutions-stat-card .stat-value, .institutions-stat-card h3.stat-value, .log-stat-card .stat-value');
    els.paginationInfo = document.querySelector('.log-pagination-info');
    els.perPage = document.getElementById('perPageSelect');
    els.paginationControls = document.querySelector('.log-pagination-controls') || document.querySelector('#logPagination .log-pagination-controls');
    if (els.search) {
      let t = null;
      els.search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(()=>fetchLogs(1), 350); });
    }
    ['level','from','to','user'].forEach(k => {
      if (els[k]) els[k].addEventListener('change', () => fetchLogs(1));
    });
    if (els.perPage) els.perPage.addEventListener('change', () => fetchLogs(1));
   
    
    if (els.exportBtn) {
      els.exportBtn.addEventListener('click', async () => {
        const qParams = Object.fromEntries(new URLSearchParams(buildQuery()));

        try {
          const apiPath =
            ENDPOINT ||
            (window.API_ENDPOINTS &&
              window.API_ENDPOINTS.SUPERADMIN_ACTIVITY) ||
            '/api/superadmin-activity';

          console.log('Exporting logs with query', qParams);

          let response = await API.get(apiPath, qParams);

          if (response && typeof response === 'object' && ('success' in response) && response.data) {
            response = response.data;
          }

          const logs = Array.isArray(response)
            ? response
            : (response.activities || response.logs || response.items || []);

          if (!Array.isArray(logs)) {
            throw new Error('Logs response is not an array');
          }

          // Build CSV rows safely
          const rows = [];

          // CSV Header
          rows.push([
            'Timestamp',
            'Level',
            'User',
            'Action',
            'Message',
            'IP Address'
          ].join(','));

          // CSV Data
          logs.forEach(it => {
            rows.push([
              `"${it.created_at || it.timestamp || it.time || ''}"`,
              `"${it.severity || it.level || 'info'}"`,
              `"${it.performer_name || it.user || ''}"`,
              `"${it.activity_type || it.action || ''}"`,
              `"${(it.description || it.message || '')
                .replace(/"/g, '""')
                .replace(/\n/g, ' ')
                .replace(/\r/g, ' ')}"`,
              `"${it.ip_address || it.ip || ''}"`
            ].join(','));
          });

          const csvContent = rows.join('\n');

          console.log('CSV generated successfully');

          // Create downloadable file
          const blob = new Blob(
            [csvContent],
            { type: 'text/csv;charset=utf-8;' }
          );

          const downloadUrl = URL.createObjectURL(blob);

          const link = document.createElement('a');

          link.href = downloadUrl;
          link.download = `logs_export_${Date.now()}.csv`;

          document.body.appendChild(link);

          link.click();

          document.body.removeChild(link);

          URL.revokeObjectURL(downloadUrl);

          console.log('Logs exported successfully');

        } catch (e) {
          console.error('Export failed:', e);
          console.error(
            'Failed to export logs: ' +
            (e.message || 'unknown error')
          );
        }
      });
    }


    if (els.clearBtn) els.clearBtn.addEventListener('click', async () => {
      showModal('Confirm Delete', `<p>Are you sure you want to clear logs older than 90 days? This action cannot be undone.</p>`, async () => {
            try {
        const cleanupPath = ENDPOINT_CLEANUP || (window.API_ENDPOINTS && window.API_ENDPOINTS.SUPERADMIN_ACTIVITY_CLEANUP) || '/api/superadmin-activity/cleanup';
        await API.delete(cleanupPath);
        fetchLogs(1);
      } catch (e) {
        console.error(e);
      showToast('Failed to clear logs older than 90 days', 'error'); }
        });
    //   try {
    //     const cleanupPath = ENDPOINT_CLEANUP || (window.API_ENDPOINTS && window.API_ENDPOINTS.SUPERADMIN_ACTIVITY_CLEANUP) || '/api/superadmin-activity/cleanup';
    //     await API.delete(cleanupPath);
    //     fetchLogs(1);
    //   } catch (e) {
    //     console.error(e);
    //   }
    });

    fetchLogs(1);
  }

  // initialize when DOM ready
    document.addEventListener('page:loaded', (e) => { if (e.detail && e.detail.page === 'logs') init(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
