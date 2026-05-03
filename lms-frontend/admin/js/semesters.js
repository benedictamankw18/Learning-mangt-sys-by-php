/* Semesters Management */
(function(){
    'use strict';
    const S = { semesters: [], years: [], editingId: null, page:1, limit:20, academicYearFilter: '', searchTerm: '' };

    document.addEventListener('page:loaded', function(e){ if(e.detail&&e.detail.page==='semesters') init(); });

    function init(){ S.editingId=null; S.page=1; S.academicYearFilter=''; setup(); loadYears().then(()=>loadSemesters()); }

    function el(id){return document.getElementById(id);}
    function val(id){const e=el(id); return e?e.value.trim():''}
    function setVal(id,v){const e=el(id); if(e) e.value = v ?? ''}
    function toast(m,t){ if(window.showToast) window.showToast(m,t); else console.log(m); }
    function confirm_(t,m,ok){ if(window.showModal) window.showModal(t,m,ok); else { if(confirm(t+'\n'+m)) ok(); } }

    function setup(){
        el('addSemesterBtn')?.addEventListener('click', ()=>openModal());
        el('semesterModalClose')?.addEventListener('click', closeModal);
        el('semesterModalCancel')?.addEventListener('click', closeModal);
        el('semesterModalSave')?.addEventListener('click', saveSemester);
        el('semesterModalOverlay')?.addEventListener('click',(e)=>{ if(e.target===e.currentTarget) closeModal(); });
        el('semesterYearFilter')?.addEventListener('change', function(){ S.academicYearFilter = this.value; loadSemesters(); });
        el('semSearchInput')?.addEventListener('input', (e)=>{ S.searchTerm = e.target.value.toLowerCase(); filterAndRender(); });
    }

    function apiReq(m,u,b){ if(m==='GET') return API.get(u); if(m==='POST') return API.post(u,b||{}); if(m==='PUT') return API.put(u,b||{}); if(m==='DELETE') return API.delete(u); }

    async function loadYears(){
        try{ const res = await apiReq('GET', API_ENDPOINTS.ACADEMIC_YEARS+'?limit=100'); if(!res.success) throw new Error(res.message||''); S.years = res.data?.data||res.data||[]; renderYearsSelect(); }catch(err){ console.error(err); }
    }

    function renderYearsSelect(){ const sel = el('fieldAcademicYearId'); const filter = el('semesterYearFilter'); if(!sel||!filter) return; sel.innerHTML = '<option value="">Select academic year</option>'; filter.innerHTML = '<option value="">All Academic Years</option>';
        S.years.forEach(y=>{ const opt = '<option value="'+escapeHtml(y.academic_year_id)+'">'+escapeHtml(y.year_name)+'</option>'; sel.insertAdjacentHTML('beforeend', opt); filter.insertAdjacentHTML('beforeend', opt); });
    }

    function loadSemesters(){ 
        const tbody = el('semestersTableBody'); 
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-secondary,#94a3b8)"><i class="fas fa-spinner fa-spin" style="animation:spin 1s linear infinite"></i> Loading…</td></tr>';
        let url = API_ENDPOINTS.SEMESTERS + '?page=' + S.page + '&limit=' + S.limit; 
        if(S.academicYearFilter) url += '&academic_year_id=' + encodeURIComponent(S.academicYearFilter);
        apiReq('GET', url).then(res=>{ 
            if(!res.success) throw new Error(res.message||''); 
            S.semesters = res.data?.data||res.data||[]; 
            S.searchTerm = '';
            const searchInput = el('semSearchInput');
            if(searchInput) searchInput.value = '';
            filterAndRender();
            toast('✓ Response received','success');
            updateStats();
        }).catch(err=>{ 
            console.error(err); 
            if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ef4444;padding:2rem"><i class="fas fa-exclamation-circle"></i> '+(err.message||'Error loading data')+'</td></tr>';
            toast('✗ Error: '+err.message,'error');
        });
    }

    function filterAndRender(){
        let filtered = S.semesters;
        if(S.searchTerm){
            filtered = S.semesters.filter(s=>{
                const name = (s.semester_name||'').toLowerCase();
                const year = (s.year_name||'').toLowerCase();
                const start = (s.start_date||'').toLowerCase();
                const end = (s.end_date||'').toLowerCase();
                return name.includes(S.searchTerm) || year.includes(S.searchTerm) || start.includes(S.searchTerm) || end.includes(S.searchTerm);
            });
        }
        renderTable(filtered);
    }

    function renderTable(items){ const tbody = el('semestersTableBody'); if(!tbody) return; if(!items.length){ tbody.innerHTML = '<tr><td colspan="6"><div class="prog-empty"><i class="fas fa-hourglass-half"></i><h4>' + (S.searchTerm ? 'No results' : 'No semesters') + '</h4><p>' + (S.searchTerm ? 'Try a different search term' : 'Add semester to get started') + '</p></div></td></tr>'; return; }
        tbody.innerHTML = items.map(s=>{
            const cur = s.is_current==1||s.is_current==='1';
            return '<tr>'+
              '<td>'+escapeHtml(s.semester_name||'')+'</td>'+
              '<td>'+escapeHtml(s.year_name||'')+'</td>'+
              '<td>'+escapeHtml(s.start_date||'')+'</td>'+
              '<td>'+escapeHtml(s.end_date||'')+'</td>'+
              '<td>'+(cur?'<span class="badge-current">Current</span>':'')+'</td>'+
              '<td>'+
                '<button class="btn btn-outline btn-sm" onclick="window._semEdit('+s.semester_id+')"><i class="fas fa-edit"></i></button>'+
                '<button class="btn btn-outline btn-sm" onclick="window._semDelete('+s.semester_id+',\''+escapeJs(s.semester_name||'')+'\')"><i class="fas fa-trash"></i></button>'+
              '</td>'+
            '</tr>';
        }).join(''); window._semEdit = openModal; window._semDelete = deleteSemester;
    }

    function openModal(id){ S.editingId = id||null; const overlay = el('semesterModalOverlay'); el('semesterFormError').style.display='none'; if(id){ const s = S.semesters.find(x=>x.semester_id==id); if(s){ setVal('fieldAcademicYearId', s.academic_year_id); setVal('fieldSemesterName', s.semester_name); setVal('fieldSemesterStart', s.start_date); setVal('fieldSemesterEnd', s.end_date); setVal('fieldSemesterIsCurrent', s.is_current?1:0); document.getElementById('semesterModalTitle').textContent='Edit Semester'; }} else { setVal('fieldAcademicYearId',''); setVal('fieldSemesterName',''); setVal('fieldSemesterStart',''); setVal('fieldSemesterEnd',''); setVal('fieldSemesterIsCurrent','0'); document.getElementById('semesterModalTitle').textContent='Add Semester'; }
        overlay.classList.add('open'); document.getElementById('fieldSemesterName')?.focus(); }

    function closeModal(){ el('semesterModalOverlay')?.classList.remove('open'); S.editingId=null; }

    function setSaving(on){ el('semesterModalSaveSpinner').style.display = on ? 'inline-block' : 'none'; el('semesterModalSave').disabled = on; }

    function showFormError(msg){ const e = el('semesterFormError'); if(e){ e.textContent = msg; e.style.display = 'block'; } }

    function saveSemester(){ 
        const yearId = val('fieldAcademicYearId'); 
        const name = val('fieldSemesterName'); 
        const start = val('fieldSemesterStart'); 
        const end = val('fieldSemesterEnd'); 
        const iscur = val('fieldSemesterIsCurrent')==='1'?1:0; 
        if(!yearId) return showFormError('Academic year required'); 
        if(!name) return showFormError('Semester name required'); 
        if(!start) return showFormError('Start date required'); 
        if(!end) return showFormError('End date required'); 
        const payload = { academic_year_id: parseInt(yearId), semester_name: name, start_date: start, end_date: end, is_current: iscur };
        setSaving(true); 
        const isEdit = !!S.editingId; 
        const method = isEdit ? 'PUT' : 'POST'; 
        const url = isEdit ? API_ENDPOINTS.SEMESTERS + '/' + S.editingId : API_ENDPOINTS.SEMESTERS;
        apiReq(method, url, payload).then(res=>{ 
            setSaving(false); 
            if(!res.success) throw new Error(res.message||'Save failed'); 
            const msg = isEdit ? '✓ Semester updated successfully' : '✓ Semester created successfully';
            toast(msg + ' • Response received','success'); 
            closeModal(); 
            loadSemesters(); 
        }).catch(err=>{ 
            setSaving(false); 
            showFormError('✗ '+err.message||'Error'); 
        }); 
    }

    function deleteSemester(id, name){ 
        confirm_('Delete Semester','Delete "'+name+'"? This cannot be undone.', ()=>{
            apiReq('DELETE', API_ENDPOINTS.SEMESTERS + '/' + id).then(res=>{ 
                if(!res.success) throw new Error(res.message||'Delete failed'); 
                toast('✓ Semester deleted • Response received','success'); 
                loadSemesters(); 
            }).catch(err=>{
            toast('✗ '+err.message||'Failed','error');
        }); 

        
    }); }

    function updateStats(){
        const total = S.semesters.length;
        const current = S.semesters.filter(s => s.is_current == 1 || s.is_current === '1').length;
        const totalEl = el('semStatTotal');
        const currentEl = el('semStatCurrent');
        if (totalEl) totalEl.textContent = total;
        if (currentEl) currentEl.textContent = current || '—';
    }

    function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function escapeJs(s){ return String(s||'').replace(/['"\\]/g,'\\$&'); }

})();
