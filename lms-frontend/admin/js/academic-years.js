/* Academic Years Management */
(function () {
    'use strict';

    const S = { years: [], editingId: null, page:1, limit:20, searchTerm: '', total: 0, pages: 1 };

    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'academic-years') initPage();
    });

    function initPage() {
        S.editingId = null; S.page = 1; S.limit = 20;
        setupListeners(); loadYears();
    }

    function el(id){return document.getElementById(id);}
    function val(id){const e=el(id);return e?e.value.trim():''}
    function setVal(id,v){const e=el(id); if(e) e.value = v ?? ''}
    function toast(m,t){ if(window.showToast) window.showToast(m,t); else console.log(m); }
    function confirm_(t,m,ok){ if(window.showModal) window.showModal(t,m,ok); else { if(confirm(t+'\n'+m)) ok(); } }

    function setupListeners(){
        el('addAcademicYearBtn')?.addEventListener('click', ()=>openModal());
        el('academicYearModalClose')?.addEventListener('click', closeModal);
        el('academicYearModalCancel')?.addEventListener('click', closeModal);
        el('academicYearModalSave')?.addEventListener('click', saveYear);
        el('academicYearModalOverlay')?.addEventListener('click', (e)=>{ if(e.target===e.currentTarget) closeModal(); });
        el('aySearchInput')?.addEventListener('input', (e)=>{ S.searchTerm = e.target.value.toLowerCase(); filterAndRender(); });
    }

    function apiReq(method,url,body){ if(method==='GET') return API.get(url); if(method==='POST') return API.post(url,body||{}); if(method==='PUT') return API.put(url,body||{}); if(method==='DELETE') return API.delete(url); }

    function loadYears(){
        const tbody = el('academicYearsTableBody'); 
        if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-secondary,#94a3b8)"><i class="fas fa-spinner fa-spin" style="animation:spin 1s linear infinite"></i> Loading…</td></tr>';
        const url = API_ENDPOINTS.ACADEMIC_YEARS + '?page=' + S.page + '&limit=' + S.limit;
        apiReq('GET', url).then(res=>{
            if(!res.success) throw new Error(res.message||'Failed');
            const payload = res.data || {};
            S.years = payload.data || payload.items || payload || [];
            const pagination = payload.pagination || res.pagination || {};
            S.total = Number(pagination.total ?? S.years.length) || 0;
            S.pages = Number(pagination.pages ?? pagination.total_pages ?? Math.max(1, Math.ceil(S.total / S.limit))) || 1;
            S.searchTerm = '';
            const searchInput = el('aySearchInput');
            if(searchInput) searchInput.value = '';
            filterAndRender();
            toast('✓ Response received','success');
            updateStats();
            renderPagination(pagination);
        }).catch(err=>{ 
            console.error(err); 
            if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:2rem"><i class="fas fa-exclamation-circle"></i> '+(err.message||'Error loading data')+'</td></tr>'; 
            toast('✗ Error: '+err.message,'error');
        });
    }

    function filterAndRender(){
        let filtered = S.years;
        if(S.searchTerm){
            filtered = S.years.filter(y=>{
                const name = (y.year_name||'').toLowerCase();
                const start = (y.start_date||'').toLowerCase();
                const end = (y.end_date||'').toLowerCase();
                return name.includes(S.searchTerm) || start.includes(S.searchTerm) || end.includes(S.searchTerm);
            });
        }
        renderTable(filtered);
    }

    function renderTable(years){
        const tbody = el('academicYearsTableBody'); if(!tbody) return;
        if(!years.length){ tbody.innerHTML = '<tr><td colspan="5"><div class="prog-empty"><i class="fas fa-calendar-alt"></i><h4>' + (S.searchTerm ? 'No results' : 'No academic years') + '</h4><p>' + (S.searchTerm ? 'Try a different search term' : 'Add your first academic year') + '</p></div></td></tr>'; return; }
        tbody.innerHTML = years.map(y=>{
            const current = y.is_current==1 || y.is_current==='1';
            return '<tr>'+
                '<td>'+escapeHtml(y.year_name || '')+'</td>'+
                '<td>'+escapeHtml(y.start_date || '')+'</td>'+
                '<td>'+escapeHtml(y.end_date || '')+'</td>'+
                '<td>'+(current?'<span class="badge-current">Current</span>':'')+'</td>'+
                '<td class="ay-actions">'+
                  '<button class="btn btn-outline btn-sm" onclick="window._ayEdit('+y.academic_year_id+')"><i class="fas fa-edit"></i></button>'+
                  '<button class="btn btn-outline btn-sm" onclick="window._ayDelete('+y.academic_year_id+',\''+escapeJs(y.year_name||'')+'\')"><i class="fas fa-trash"></i></button>'+
                '</td>'+
            '</tr>';
        }).join('');
        window._ayEdit = openModal; window._ayDelete = deleteYear;
    }

    function renderPagination(pagination){
        const wrap = el('ayPagination');
        const info = el('ayPaginationInfo');
        const controls = el('ayPaginationControls');
        if(!wrap) return;

        const totalPages = Number(pagination?.pages ?? pagination?.total_pages ?? S.pages ?? 1) || 1;
        const currentPage = Number(pagination?.page ?? pagination?.current_page ?? S.page) || 1;
        const total = Number(pagination?.total ?? S.total ?? S.years.length) || 0;
        const perPage = Number(pagination?.limit ?? pagination?.per_page ?? S.limit) || S.limit;

        S.page = currentPage;
        S.limit = perPage;
        S.total = total;
        S.pages = totalPages;

        if(totalPages <= 1){
            wrap.style.display = 'none';
            return;
        }

        wrap.style.display = 'flex';
        const from = total === 0 ? 0 : ((currentPage - 1) * perPage) + 1;
        const to = total === 0 ? 0 : Math.min(currentPage * perPage, total);
        if(info) info.textContent = 'Showing ' + from + '–' + to + ' of ' + total + ' academic years';

        if(!controls) return;
        let html = '';
        html += '<button ' + (currentPage === 1 ? 'disabled' : '') + ' onclick="ayGoPage(' + (currentPage - 1) + ')"><i class="fas fa-chevron-left"></i></button>';
        for(let p = 1; p <= totalPages; p++){
            if(p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)){
                html += '<button class="' + (p === currentPage ? 'active' : '') + '" onclick="ayGoPage(' + p + ')">' + p + '</button>';
            } else if(p === currentPage - 3 || p === currentPage + 3){
                html += '<button disabled>…</button>';
            }
        }
        html += '<button ' + (currentPage === totalPages ? 'disabled' : '') + ' onclick="ayGoPage(' + (currentPage + 1) + ')"><i class="fas fa-chevron-right"></i></button>';
        controls.innerHTML = html;
    }

    window.ayGoPage = function (p) {
        S.page = p;
        loadYears();
    };

    function openModal(id){
        S.editingId = id || null;
        const overlay = el('academicYearModalOverlay');
        el('academicYearFormError').style.display = 'none';
        if(id){ const y = S.years.find(x=>x.academic_year_id==id); if(y){ setVal('fieldYearName', y.year_name); setVal('fieldStartDate', y.start_date); setVal('fieldEndDate', y.end_date); setVal('fieldIsCurrent', y.is_current?1:0); document.getElementById('academicYearModalTitle').textContent='Edit Academic Year'; setVal('academicYearEditId', y.academic_year_id); } }
        else { setVal('fieldYearName',''); setVal('fieldStartDate',''); setVal('fieldEndDate',''); setVal('fieldIsCurrent','0'); document.getElementById('academicYearModalTitle').textContent='Add Academic Year'; }
        overlay.classList.add('open'); document.getElementById('fieldYearName')?.focus();
    }

    function closeModal(){ el('academicYearModalOverlay')?.classList.remove('open'); S.editingId = null; }

    function setSaving(on){ el('academicYearModalSaveSpinner').style.display = on ? 'inline-block' : 'none'; el('academicYearModalSave').disabled = on; }

    function showFormError(msg){ const elE = el('academicYearFormError'); if(!elE) return; elE.textContent = msg; elE.style.display = 'block'; }

    function saveYear(){
        const name = val('fieldYearName'); const start = val('fieldStartDate'); const end = val('fieldEndDate'); const iscur = val('fieldIsCurrent') === '1' ? 1 : 0;
        if(!name) return showFormError('Year name required'); if(!start) return showFormError('Start date required'); if(!end) return showFormError('End date required');
        const payload = { year_name: name, start_date: start, end_date: end, is_current: iscur };
        setSaving(true);
        const isEdit = !!S.editingId; const method = isEdit ? 'PUT' : 'POST'; const url = isEdit ? API_ENDPOINTS.ACADEMIC_YEARS + '/' + S.editingId : API_ENDPOINTS.ACADEMIC_YEARS;
        apiReq(method, url, payload).then(res=>{
            setSaving(false); 
            if(!res.success) throw new Error(res.message||'Save failed'); 
            const msg = isEdit ? '✓ Year updated successfully' : '✓ Year created successfully';
            toast(msg + ' • Response received','success'); 
            closeModal(); 
            loadYears();
        }).catch(err=>{ 
            setSaving(false); 
            showFormError('✗ '+err.message || 'An error occurred'); 
        });
    }

    function deleteYear(id, name){ 
        confirm_('Delete Academic Year', 'Delete "'+name+'"? This cannot be undone.', ()=>{
            apiReq('DELETE', API_ENDPOINTS.ACADEMIC_YEARS + '/' + id).then(res=>{ 
                if(!res.success) throw new Error(res.message||'Delete failed'); 
                toast('✓ Year deleted • Response received','success'); 
                loadYears(); 
            }).catch(err=>{
                toast('✗ '+err.message||'Failed','error');
            });
        }); 
    }

    function updateStats(){
        const total = S.total || S.years.length;
        const current = S.years.filter(y => y.is_current == 1 || y.is_current === '1').length;
        const totalEl = el('ayStatTotal');
        const currentEl = el('ayStatCurrent');
        if (totalEl) totalEl.textContent = total;
        if (currentEl) currentEl.textContent = current || '—';
        if(total > 0) {
            const minDate = new Date(Math.min(...S.years.map(y => new Date(y.start_date))));
            const maxDate = new Date(Math.max(...S.years.map(y => new Date(y.end_date))));
            const fmt = (d) => d.toLocaleDateString('en-US', {year:'numeric', month:'short'});
            const rangeEl = el('ayStatRange');
            if (rangeEl) rangeEl.textContent = fmt(minDate) + ' → ' + fmt(maxDate);
        }
    }

    function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function escapeJs(s){ return String(s||'').replace(/['"\\]/g,'\\$&'); }

})();
