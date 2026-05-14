(function(){
  'use strict';
  if(window.__superReportsScriptLoaded) return; window.__superReportsScriptLoaded = true;

document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'reports') {
            initReportsPage();
        }
    });

  function el(id){ return document.getElementById(id); }

  const charts = {};

  async function apiGet(path, params = {}){
    if(typeof API !== 'undefined' && API.get) return await API.get(path, params);
    const q = Object.keys(params).filter(k=>params[k]!==undefined&&params[k]!=='').map(k=>encodeURIComponent(k)+'='+encodeURIComponent(params[k])).join('&');
    const url = q ? `${path}?${q}` : path;
    const res = await fetch(url, { credentials:'include' });
    return await res.json();
  }

  async function fetchReports(params = {}){
    try{
      if(typeof DashboardAPI !== 'undefined' && DashboardAPI.getSuperAdminStats) {
        return await DashboardAPI.getSuperAdminStats(params);
      }
      // fallback to API endpoint constant
      if(typeof API_ENDPOINTS !== 'undefined' && API_ENDPOINTS.SUPER_ADMIN_STATS){
        return await apiGet(API_ENDPOINTS.SUPER_ADMIN_STATS, params);
      }
      console.warn('No DashboardAPI or endpoint for superadmin reports');
      return null;
    }catch(err){ console.warn('fetchReports failed', err); return null; }
  }

//   async function populateInstitutions(){
//     try{
//       const sel = el('sr_institution');
//       if(!sel) return;
//       while(sel.options.length>1) sel.remove(1);
//       let res = null;
//       if(typeof InstitutionAPI !== 'undefined' && InstitutionAPI.getAll) res = await InstitutionAPI.getAll();
//       else if(typeof API_ENDPOINTS !== 'undefined' && API_ENDPOINTS.INSTITUTIONS) res = await apiGet(API_ENDPOINTS.INSTITUTIONS);
//       else res = await apiGet('/api/institutions');
//       const list = res && res.data ? res.data : (Array.isArray(res) ? res : []);
//       list.forEach(i=>{ const o=document.createElement('option'); o.value=i.institution_id||i.id||''; o.textContent=i.name||i.institution_name||i.label||''; sel.appendChild(o); });
//     }catch(err){ console.warn('populateInstitutions error', err); }
//   }


async function populateInstitutions() {
  try {
    const sel = el('sr_institution');
    if (!sel) return;

    // Remove existing options except the first placeholder option
    while (sel.options.length > 1) {
      sel.remove(1);
    }

    let res;

    if (
      typeof InstitutionAPI !== 'undefined' &&
      typeof InstitutionAPI.getAll === 'function'
    ) {
      res = await InstitutionAPI.getAll();
    } else if (
      typeof API_ENDPOINTS !== 'undefined' &&
      API_ENDPOINTS.INSTITUTIONS
    ) {
      res = await apiGet(API_ENDPOINTS.INSTITUTIONS);
    } else {
      res = await apiGet('/api/institutions');
    }

    // Normalize response to an array. Accepts these shapes:
    // - []
    // - { data: [] }
    // - { data: { data: [] , pagination: {} } } (paginated wrapper)
    const listArray = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : [];

    if (!Array.isArray(listArray) || listArray.length === 0) {
      console.warn('populateInstitutions: no institutions found or response malformed', res);
      return;
    }

    const fragment = document.createDocumentFragment();

    listArray.forEach((i) => {
      const option = document.createElement('option');

      option.value =
        i.institution_id ??
        i.id ??
        '';

      option.textContent =
        i.name ??
        i.institution_name ??
        i.label ??
        'Unnamed Institution';

      fragment.appendChild(option);
    });

    sel.appendChild(fragment);

  } catch (err) {
    console.warn('populateInstitutions error:', err);
  }
}


  function updateKPIs(data){
    try{
      el('sr_total_institutions').textContent = data.total_institutions || 0;
      el('sr_total_users').textContent = data.total_users || 0;
      el('sr_total_teachers').textContent = data.total_teachers || 0;
      el('sr_total_students').textContent = data.total_students || 0;
    }catch(e){ console.warn('updateKPIs failed', e); }
  }

  function destroyChart(key){ if(charts[key]){ charts[key].destroy(); charts[key]=null; } }

  function renderInstitutionPerformance(ctx, items){
    if(!ctx) return;
    destroyChart('institutionPerformance');
    const labels = getLast12MonthLabels();
    const values = items || [];
    charts.institutionPerformance = new Chart(ctx, {
      type:'bar', data: { labels, datasets:[{ label:'Performance', data: values, backgroundColor: '#3b82f6' }] },
      options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
    });
  }

  function getLast12MonthLabels() {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const labels = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(
            d.getFullYear() !== currentYear
                ? `${names[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`
                : names[d.getMonth()]
        );
    }
    return labels;
}

  function renderUserGrowth(ctx, series){
    if(!ctx) return; destroyChart('userGrowth');
    const labels = getLast12MonthLabels();
    const data = series || [];
    charts.userGrowth = new Chart(ctx, 
      { type:'line', 
        data:{ 
        labels, 
        datasets:[
          { label:'Users', 
            data, borderColor:'#10b981', 
            backgroundColor:'rgba(16,185,129,0.08)', 
            fill:true 
          }
        ] 
      }, 
      options:{ 
        responsive:true, 
        maintainAspectRatio:false 
      } });
  }
/**
 * Update system health bars from API data
 */
function updateSystemHealth(health) {
    if (!health) return;


    const items = [
        { key: 'database', id: 'healthDb' },
        { key: 'memory',   id: 'healthMemory' },
        { key: 'cpu',      id: 'healthCpu' },
        { key: 'storage',  id: 'healthStorage' },
    ];

    items.forEach(({ key, id }) => {
        const data = health[key];
        if (!data) return;
        const usage  = Math.min(100, Math.max(0, parseFloat(data.usage ?? data.percent ?? 0)));
        const status = data.status || (usage >= 90 ? 'critical' : usage >= 75 ? 'warning' : 'healthy');

        const progress = document.getElementById(`sr${id}Progress`);
        const value    = document.getElementById(`sr${id}Value`);
        const badge    = document.getElementById(`sr${id}Status`);
        
        if (progress) progress.style.strokeDashoffset = `${239 - (239 * usage) / 100}`;
        if (value)    value.textContent = `${Math.round(usage)}%`;
        
        if (badge) {
            if (status === 'critical') {
                badge.className = 'badge badge-danger';
                progress.style.stroke = '#ff0000b8'; // red for critical
                badge.textContent = 'Critical';
            } else if (status === 'warning') {
                badge.className = 'badge badge-warning';
                progress.style.stroke = '#ffc107'; // yellow for warning
                badge.textContent = 'Monitor';
            } else {
                badge.className = 'badge badge-success';
                progress.style.stroke = '#10b981'; // green for healthy
                badge.textContent = 'Healthy';
            }
        }
    });
}

  function populateReportsTable(containerId, reports){
    const root = el(containerId); if(!root) return;
    if(!Array.isArray(reports) || reports.length===0){ root.innerHTML = '<div>No reports available for the selected range.</div>'; return; }
    const html = ['<table style="width:100%; border-collapse:collapse">','<thead><tr><th style="text-align:left;padding:8px">Report</th><th style="text-align:left;padding:8px">Value</th></tr></thead>','<tbody>'];
    reports.forEach(r => { html.push(`<tr><td style="padding:8px;border-top:1px solid #eee">${r.name||r.label||r.title||''}</td><td style="padding:8px;border-top:1px solid #eee">${r.value||r.count||''}</td></tr>`); });
    html.push('</tbody></table>'); root.innerHTML = html.join('');
  }

  function exportCSV(reports){
    if(!Array.isArray(reports)) return;
    const rows = [['Report','Value']];
    reports.forEach(r => rows.push([r.name||r.label||r.title||'', r.value||r.count||'']));
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'superadmin_reports.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  async function loadAndRender(){
    const params = {};
    const inst = el('sr_institution')?.value; if(inst) params.institution_id = inst;
    const from = el('sr_from')?.value; if(from) params.from = from;
    const to = el('sr_to')?.value; if(to) params.to = to;
    const res = await fetchReports(params);
    const data = res && res.data ? res.data : (res || {});
    updateKPIs(data || {});
    renderInstitutionPerformance(el('sr_institution_performance')?.getContext('2d'), data.monthly_growth.institutions || []);
    renderUserGrowth(el('sr_user_growth')?.getContext('2d'), data.monthly_growth.users || { labels:[], data:[] });
    updateSystemHealth(data.system_health || {});
    populateReportsTable('sr_reports_table', data.users_by_role || []);
    // attach export data
    // el('sr_export').onclick = () => exportCSV(data.reports || []);

  }

  function initReportsPage(){
    populateInstitutions();
    const refresh = el('sr_refresh'); if(refresh) refresh.addEventListener('click', loadAndRender);
    // initial load
    setTimeout(loadAndRender, 50);
  }

//   document.addEventListener('DOMContentLoaded', initReportsPage);

})();
