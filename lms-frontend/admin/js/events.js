(function () {
  'use strict';

  const S = {
    items: [],
    filtered: [],
    editingUuid: null,
    search: '',
    typeFilter: 'all',
    audienceFilter: 'all',
    calendarDate: new Date(),
  };

  document.addEventListener('page:loaded', function (e) {
    if (e?.detail?.page === 'events') init();
  });

  function el(id) { return document.getElementById(id); }

  function init() {
    const root = el('admEventsRoot');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    bindEvents();
    loadEvents();
  }

  function bindEvents() {
    el('evtRefreshBtn')?.addEventListener('click', loadEvents);
    el('evtCreateBtn')?.addEventListener('click', () => openModal(null));
    el('evtSearchInput')?.addEventListener('input', (e) => { S.search = String(e.target.value||'').trim().toLowerCase(); filterAndRender(); });
    el('evtTypeFilter')?.addEventListener('change', (e) => { S.typeFilter = String(e.target.value||'all'); filterAndRender(); });
    el('evtAudienceFilter')?.addEventListener('change', (e) => { S.audienceFilter = String(e.target.value||'all'); filterAndRender(); });

    el('evtModalClose')?.addEventListener('click', closeModal);
    el('evtModalCancel')?.addEventListener('click', closeModal);
    el('evtModalSave')?.addEventListener('click', saveEvent);
    el('evtModalOverlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

    el('evtTableBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]'); if (!btn) return;
      const action = btn.getAttribute('data-action'); const uuid = btn.getAttribute('data-uuid');
      if (action === 'edit') { const item = S.items.find(x => String(x.uuid) === String(uuid)); openModal(item||null); }
      if (action === 'delete') { const item = S.items.find(x => String(x.uuid) === String(uuid)); if (!item) return; confirmDeleteEvent(uuid, item); }
      if (action === 'toggle-publish') { const item = S.items.find(x => String(x.uuid) === String(uuid)); if (!item) return; togglePublish(uuid, item); }
    });

    el('evtToggleCalendar')?.addEventListener('click', () => {
      window.location.href = '/admin/dashboard.html#calendar';
    });
    el('evtPrevMonth')?.addEventListener('click', () => { changeMonth(-1); });
    el('evtNextMonth')?.addEventListener('click', () => { changeMonth(1); });
    el('evtExportPdfBtn')?.addEventListener('click', exportToPdf);
    el('evtExportCsvBtn')?.addEventListener('click', exportToCsv);
  }

  async function loadEvents() {
    const tbody = el('evtTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7"><div class="evt-empty"><i class="fas fa-spinner fa-spin"></i> Loading events...</div></td></tr>';
    try {
      const resp = await EventAPI.getAll({ limit: 500 });
      let data = [];
      if (Array.isArray(resp)) {
        data = resp;
      } else if (resp?.data?.events && Array.isArray(resp.data.events)) {
        data = resp.data.events;
      } else if (resp?.data && Array.isArray(resp.data)) {
        data = resp.data;
      }
      // Exclude personal target_role events entirely on the admin list
      data = (data || []).filter(d => String((d.target_role || d.audience || '')).toLowerCase() !== 'personal');
      S.items = data.map(normalizeEvent).sort((a, b) => {
        const aCreated = toSortTime(a.created_at, a.event_id, a.starts_at);
        const bCreated = toSortTime(b.created_at, b.event_id, b.starts_at);
        return bCreated - aCreated;
      });
      filterAndRender();
    } catch (err) {
      console.error(err);
      if (tbody) tbody.innerHTML = '<tr><td colspan="7"><div class="evt-empty"><i class="fas fa-circle-exclamation"></i> Failed to load events</div></td></tr>';
    }
  }

  function normalizeEvent(e) {
    return {
      ...e,
      name: String(e.name || e.title || '').trim(),
      description: String(e.description || e.body || '').trim(),
      type: String(e.event_type || e.type || 'other'),
      venue: String(e.venue || e.location || '').trim(),
      audience: String(e.audience || e.target_role || 'all'),
      is_published: (e.is_published == 1 || e.is_published === '1' || e.is_published === true),
      starts_at: e.starts_at || e.start_date || e.start || e.from,
      ends_at: e.ends_at || e.end_date || e.end || e.to,
      uuid: String(e.uuid || e.id || '')
    };
  }

  function filterAndRender() {
    S.filtered = S.items.filter(item => {
      if (S.typeFilter !== 'all' && String(item.type) !== S.typeFilter) return false;
      if (S.audienceFilter !== 'all' && String(item.audience) !== S.audienceFilter) return false;
      if (!S.search) return true;
      const hay = [item.name, item.description, item.venue, item.type, item.audience].join(' ').toLowerCase();
      return hay.includes(S.search);
    });
    renderStats();
    renderTable(); renderCalendar();
  }

  function renderStats() {
    const todayKey = toDateKey(new Date());
    const upcomingCount = S.items.filter(item => {
      const startKey = toDateKey(item.starts_at);
      return startKey && startKey >= todayKey;
    }).length;

    const todayCount = S.items.filter(item => {
      const startKey = toDateKey(item.starts_at);
      const endKey = toDateKey(item.ends_at || item.starts_at);
      return startKey && endKey && startKey <= todayKey && endKey >= todayKey;
    }).length;

    const typeCount = new Set(S.items.map(item => String(item.type || 'other').trim().toLowerCase()).filter(Boolean)).size;

    setStatText('evtStatTotal', String(S.items.length));
    setStatText('evtStatUpcoming', String(upcomingCount));
    setStatText('evtStatToday', String(todayCount));
    setStatText('evtStatTypes', String(typeCount));
  }

  function setStatText(id, value) {
    const node = el(id);
    if (node) node.textContent = value;
  }

  function notify(type, message) {
    if (typeof showToast === 'function') {
      showToast(message, type);
      return;
    }
    console.log(message);
  }

  function renderTable() {
    const tbody = el('evtTableBody'); if (!tbody) return;
    if (!S.filtered.length) { tbody.innerHTML = '<tr><td colspan="7"><div class="evt-empty"><i class="fas fa-calendar-xmark"></i> No events found</div></td></tr>'; return; }
    tbody.innerHTML = S.filtered.map(item => {
      const when = formatRange(item.starts_at, item.ends_at);
      const statusLabel = item.is_published ? 'Published' : 'Draft';
      return '<tr>' +
        '<td><strong>' + esc(item.name) + '</strong><div class="ann-snippet">' + esc(truncate(item.description, 120)) + '</div></td>' +
        '<td>' + esc(capitalize(item.type)) + '</td>' +
        '<td>' + esc(when) + '</td>' +
        '<td>' + esc(item.venue || '-') + '</td>' +
        '<td>' + esc(item.audience || 'all') + '</td>' +
        '<td>' + esc(statusLabel) + '</td>' +
        '<td><div class="ann-actions">' +
          '<button class="ann-btn" data-action="toggle-publish" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-eye"></i> ' + (item.is_published ? 'Unpublish' : 'Publish') + '</button>' +
          '<button class="ann-btn" data-action="edit" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-pen"></i> Edit</button>' +
          '<button class="ann-btn danger" data-action="delete" data-uuid="' + escAttr(item.uuid) + '"><i class="fas fa-trash"></i> Delete</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function formatRange(s, e) {
    if (!s && !e) return '-';
    const start = s ? new Date(s) : null;
    const end = e ? new Date(e) : null;
    if (start && end) return start.toLocaleString() + ' — ' + end.toLocaleString();
    if (start) return start.toLocaleString();
    return String(e);
  }

  function openModal(item) {
    S.editingUuid = item?.uuid || null;
    setValue('evtFieldName', item?.name || '');
    setValue('evtFieldDescription', item?.description || '');
    setValue('evtFieldType', item?.type || 'other');
    setValue('evtFieldVenue', item?.venue || '');
    setValue('evtFieldStart', toDateTimeLocal(item?.starts_at));
    setValue('evtFieldEnd', toDateTimeLocal(item?.ends_at));
    setValue('evtFieldAudience', item?.audience || 'all');
    setValue('evtFieldPublished', item?.is_published ? '1' : '0');
    el('evtModalOverlay')?.classList.add('open');
  }

  function closeModal() { el('evtModalOverlay')?.classList.remove('open'); S.editingUuid = null; }

  function setValue(id, value) { const n = el(id); if (n) n.value = value == null ? '' : String(value); }

  function getValue(id) { const n = el(id); return n ? String(n.value || '').trim() : ''; }

  async function saveEvent() {
    const name = getValue('evtFieldName'); if (!name) { notify('error', 'Event name required'); return; }
    const startsAt = getValue('evtFieldStart'); if (!startsAt) { notify('error', 'Start date required'); return; }
    const endsAt = getValue('evtFieldEnd'); if (!endsAt) { notify('error', 'End date required'); return; }
    
    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    if (startDate >= endDate) { notify('error', 'End date must be after start date'); return; }
    
    const payload = {
      name: name,
      description: getValue('evtFieldDescription'),
      event_type: getValue('evtFieldType') || 'other',
      venue: getValue('evtFieldVenue') || null,
      starts_at: startsAt,
      ends_at: endsAt,
      audience: getValue('evtFieldAudience') || 'all',
      is_published: Number(getValue('evtFieldPublished') || 0),
    };

    try {
      if (S.editingUuid) {
        await EventAPI.update(S.editingUuid, payload);
      } else {
        await EventAPI.create(payload);
      }
      closeModal(); loadEvents();
    } catch (err) { console.error(err); notify('error', err?.message || 'Failed to save event'); }
  }

  async function deleteEvent(uuid) {
    try { await EventAPI.delete(uuid); loadEvents(); notify('success', 'Event deleted successfully'); } catch (err) { console.error(err); notify('error', err?.message || 'Failed to delete event'); }
  }

  async function togglePublish(uuid, item) {
    try {
      const newVal = item.is_published ? 0 : 1;
      await EventAPI.update(uuid, { is_published: newVal });
      notify('success', newVal ? 'Event published' : 'Event unpublished');
      // Optimistically update local state for immediate feedback
      const idx = S.items.findIndex(x => String(x.uuid) === String(uuid));
      if (idx >= 0) {
        S.items[idx].is_published = !!newVal;
        filterAndRender();
      } else {
        loadEvents();
      }
    } catch (err) {
      console.error(err);
      notify('error', err?.message || 'Failed to update publish status');
    }
  }

  function confirmDeleteEvent(uuid, item) {
    const title = item?.name || 'this event';
    if (typeof showModal === 'function') {
      showModal('Delete Event', '<p>Delete <strong>' + esc(title) + '</strong>?</p><p>This action cannot be undone.</p>', () => deleteEvent(uuid));
      return;
    }
    notify('warning', 'Delete confirmation popup is unavailable right now.');
  }

  // Calendar rendering
  function changeMonth(offset) { const d = S.calendarDate; d.setMonth(d.getMonth() + offset); S.calendarDate = new Date(d); renderCalendar(); }

  function renderCalendar() {
    const grid = el('evtCalendarGrid'); const monthLabel = el('evtCurrentMonth'); const calWrap = el('evtCalendar');
    if (!grid || !monthLabel || !calWrap || calWrap.style.display === 'none') return;

    const d = new Date(S.calendarDate); d.setDate(1);
    const month = d.getMonth(); const year = d.getFullYear();
    monthLabel.textContent = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });

    // first day weekday
    const startWeekDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

    grid.innerHTML = '';
    cells.forEach(dt => {
      const cell = document.createElement('div'); cell.className = 'evt-calendar-cell';
      if (!dt) { cell.innerHTML = ''; grid.appendChild(cell); return; }
      const dayNum = dt.getDate();
      const iso = dt.toISOString().slice(0,10);
      const eventsForDay = S.items.filter(it => {
        const s = it.starts_at ? it.starts_at.slice(0,10) : null;
        const e = it.ends_at ? it.ends_at.slice(0,10) : null;
        if (!s) return false;
        if (s === iso) return true;
        if (e && s <= iso && iso <= e) return true;
        return false;
      });
      cell.innerHTML = '<div style="font-weight:700;margin-bottom:6px">' + dayNum + '</div>' + eventsForDay.slice(0,3).map(ev => '<div style="font-size:0.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">• ' + esc(ev.name) + '</div>').join('');
      grid.appendChild(cell);
    });
  }

  // Export functions
  function wrapText(doc, text, maxWidth) {
    const words = String(text || '').split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = doc.getTextWidth(testLine);
      
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function exportToPdf() {
    if (!S.filtered.length) { notify('info', 'No events to export'); return; }
    
    // Check if jsPDF is available
    const jsPDFLib = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
    if (!jsPDFLib) {
      notify('warning', 'PDF library not available. Exporting as CSV instead.'); 
      exportToCsv(); 
      return;
    }

    const jsPDF = jsPDFLib;
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let yPos = margin;

    const rows = S.filtered.slice().sort((a, b) => String(a.starts_at || '').localeCompare(String(b.starts_at || '')));
    if (!rows.length) { notify('info', 'No events to export'); return; }

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Events Report', margin, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text('Generated: ' + new Date().toLocaleString(), margin, yPos);
    yPos += 6;

    // Table header row
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);

    const colWidths = [35, 20, 35, 25, 25, 25];
    const headers = ['Event Name', 'Type', 'When', 'Venue', 'Audience', 'Description'];
    const headerX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], 
                     margin + colWidths[0] + colWidths[1] + colWidths[2],
                     margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
                     margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4]];

    // Draw header background
    doc.setFillColor(240, 245, 250);
    doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 6, 'F');

    headers.forEach((h, i) => {
      doc.text(h, headerX[i], yPos);
    });
    yPos += 8;

    // Table rows
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0);

    const lineHeight = 5;
    const cellPadding = 1;

    rows.forEach((item, idx) => {
      const when = formatRange(item.starts_at, item.ends_at);
      const desc = item.description || '';
      
      const rowData = [
        item.name || '',
        capitalize(item.type || 'other'),
        when,
        item.venue || '-',
        item.audience || 'all',
        desc
      ];

      // Wrap text for each cell
      const wrappedRows = [];
      rowData.forEach((text, colIdx) => {
        const wrapped = wrapText(doc, text, colWidths[colIdx] - 2);
        wrappedRows.push(wrapped);
      });

      // Get max lines for this row
      const maxLines = Math.max(...wrappedRows.map(w => w.length));
      const rowHeightNeeded = maxLines * lineHeight;

      // Check if we need a new page
      if (yPos + rowHeightNeeded + 2 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        
        // Repeat header on new page
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(240, 245, 250);
        doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 6, 'F');
        headers.forEach((h, i) => {
          doc.text(h, headerX[i], yPos);
        });
        yPos += 8;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
      }

      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos - 4, pageWidth - 2 * margin, rowHeightNeeded + cellPadding, 'F');
      }

      // Draw row data with wrapped text
      let rowYPos = yPos;
      for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
        wrappedRows.forEach((lines, colIdx) => {
          if (lines[lineIdx]) {
            doc.text(lines[lineIdx], headerX[colIdx] + cellPadding, rowYPos);
          }
        });
        rowYPos += lineHeight;
      }

      // Draw row separator
      doc.setDrawColor(230, 238, 245);
      doc.line(margin, yPos + rowHeightNeeded - 3, pageWidth - margin, yPos + rowHeightNeeded - 3);

      yPos += rowHeightNeeded + cellPadding + 1;
    });

    doc.save('events-' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  function exportToCsv() {
    if (!S.filtered.length) { notify('info', 'No events to export'); return; }

    const headers = ['Event Name', 'Type', 'Start Date', 'End Date', 'Venue', 'Audience', 'Description'];
    const rows = S.filtered.map(item => [
      item.name,
      capitalize(item.type),
      item.starts_at || '',
      item.ends_at || '',
      item.venue || '',
      item.audience || 'all',
      item.description || ''
    ]);

    let csv = headers.map(h => '"' + h.replace(/"/g, '""') + '"').join(',') + '\n';
    csv += rows.map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'events-' + new Date().toISOString().slice(0,10) + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Utilities
  function esc(text){ return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function escAttr(text){ return esc(text).replace(/`/g,'&#96;'); }
  function truncate(text, limit){ const t = String(text||''); return t.length<=limit? t : t.slice(0,limit-1)+'...'; }
  function capitalize(v){ const s=String(v||''); return s.charAt(0).toUpperCase()+s.slice(1); }
  function toDateTimeLocal(sql){ if (!sql) return ''; const dt = new Date(sql); if (isNaN(dt.getTime())) return ''; const pad = n => String(n).padStart(2,'0'); return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate())+'T'+pad(dt.getHours())+':'+pad(dt.getMinutes()); }
  function toDateKey(sql){ if (!sql) return ''; const dt = sql instanceof Date ? sql : new Date(sql); if (isNaN(dt.getTime())) return ''; const pad = n => String(n).padStart(2,'0'); return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function toSortTime(createdAt, eventId, startsAt) {
    const created = createdAt ? new Date(createdAt).getTime() : NaN;
    if (Number.isFinite(created)) return created;
    const numericId = Number(eventId);
    if (Number.isFinite(numericId) && numericId > 0) return numericId;
    const startTime = startsAt ? new Date(startsAt).getTime() : NaN;
    if (Number.isFinite(startTime)) return startTime;
    return 0;
  }

})();
