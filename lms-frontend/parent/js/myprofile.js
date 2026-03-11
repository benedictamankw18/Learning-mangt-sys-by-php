/**
 * parent/js/myprofile.js
 * Handles the parent My Profile page (SPA fragment: parent/page/myprofile.html).
 * Loaded once by parent/dashboard.html; initialised on page:loaded event.
 */
(function () {
  'use strict';

  const PREF_KEY = 'lms_parent_prefs';

  // ── DOM helpers ──────────────────────────────────────────────────────────────
  function val(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return el.value.trim !== undefined ? el.value.trim() : el.value;
  }

  function setVal(id, v) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = v ?? '';
    } else if (el.tagName === 'SELECT') {
      const opt = [...el.options].find(o => o.value === String(v ?? ''));
      if (opt) opt.selected = true;
    }
  }

  function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v ?? '';
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch (_) { return d; }
  }

  function fmtRelTime(d) {
    if (!d) return '—';
    try {
      const diff = Date.now() - new Date(d).getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1)  return 'Just now';
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      return fmtDate(d);
    } catch (_) { return d; }
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  // ── Toast / Confirm ──────────────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    if (typeof window.showToast === 'function') { window.showToast(message, type); return; }
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = message;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  function setBtnLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn._orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
      btn.disabled = true;
    } else {
      if (btn._orig) btn.innerHTML = btn._orig;
      btn.disabled = false;
    }
  }

  function showConfirm(message, title) {
    if (!document.getElementById('_lmsPopupCSS')) {
      const s = document.createElement('style');
      s.id = '_lmsPopupCSS';
      s.textContent = '#_lmsConfirm [data-role=confirm]:hover{background:#b8941f!important}#_lmsConfirm [data-role=cancel]:hover{background:#f1f5f9!important}#_lmsConfirm{animation:_lmsIn .18s ease}@keyframes _lmsIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}';
      document.head.appendChild(s);
    }
    return new Promise(resolve => {
      const old = document.getElementById('_lmsConfirm');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.id = '_lmsConfirm';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.5);backdrop-filter:blur(3px)';
      overlay.innerHTML = `<div style='background:#fff;border-radius:14px;padding:32px 28px;max-width:400px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,.25);font-family:inherit'><h3 style='margin:0 0 10px;font-size:16px;font-weight:700;color:#0f172a'>${esc(title || 'Confirm')}</h3><p style='margin:0 0 28px;font-size:14px;color:#475569;line-height:1.6'>${esc(message)}</p><div style='display:flex;gap:10px;justify-content:flex-end'><button data-role='cancel' style='padding:9px 20px;border-radius:8px;border:1.5px solid #cbd5e1;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;transition:background .15s'>Cancel</button><button data-role='confirm' style='padding:9px 20px;border-radius:8px;border:none;background:#d4af37;color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(212,175,55,.3);transition:background .15s'>Confirm</button></div></div>`;
      document.body.appendChild(overlay);
      const done = v => { overlay.remove(); resolve(v); };
      overlay.querySelector('[data-role=confirm]').addEventListener('click', () => done(true));
      overlay.querySelector('[data-role=cancel]').addEventListener('click',  () => done(false));
      overlay.addEventListener('click', e => { if (e.target === overlay) done(false); });
    });
  }

  // ── Tab switching ────────────────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.profile-tab, .psnav-item').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(tab) {
    document.querySelectorAll('.profile-tab, .psnav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.profile-panel').forEach(p => {
      p.classList.toggle('active', p.id === `${tab}-tab`);
    });
    if (tab === 'children'  && !_childrenLoaded) loadChildren();
    if (tab === 'activity'  && !_activityLoaded) loadActivityLog();
  }

  // ── Password toggle ──────────────────────────────────────────────────────────
  function initPasswordToggles() {
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        if (!inp) return;
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        btn.querySelector('i').className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
      });
    });
  }

  // ── Photo upload ─────────────────────────────────────────────────────────────
  function initPhotoUpload() {
    const btn = document.getElementById('changePhotoBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB.', 'error'); return; }
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('type', 'profile');
          const res = await API.upload(API_ENDPOINTS.FILE_UPLOAD, fd);
          const url = (res.data || res).url || (res.data || res).path;
          if (url) {
            await API.put(API_ENDPOINTS.USER_BY_ID(_user.uuid), { profile_photo: url });
            const img = document.getElementById('profileImage');
            if (img) img.src = url;
            showToast('Profile photo updated.');
          }
        } catch (err) {
          showToast(err.message || 'Failed to upload photo.', 'error');
        }
      };
      input.click();
    });
  }

  // ── Password strength ────────────────────────────────────────────────────────
  function initPasswordStrength() {
    const inp = document.getElementById('new-password');
    const bar = document.getElementById('pw-strength-bar');
    const fill = document.getElementById('pwStrengthFill');
    const label = document.getElementById('pwStrengthLabel');
    if (!inp) return;
    inp.addEventListener('input', () => {
      const pw = inp.value;
      if (!pw) { if (bar) bar.style.display = 'none'; return; }
      if (bar) bar.style.display = '';
      let score = 0;
      if (pw.length >= 8) score++;
      if (/[A-Z]/.test(pw)) score++;
      if (/[0-9]/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;
      const levels = [
        { pct: '25%', color: '#ef4444', text: 'Weak' },
        { pct: '50%', color: '#f59e0b', text: 'Fair' },
        { pct: '75%', color: '#3b82f6', text: 'Good' },
        { pct: '100%', color: '#10b981', text: 'Strong' },
      ];
      const lvl = levels[score - 1] || levels[0];
      if (fill)  { fill.style.width = lvl.pct; fill.style.background = lvl.color; }
      if (label) { label.textContent = lvl.text; label.style.color = lvl.color; }
    });
  }

  // ── Load Profile ─────────────────────────────────────────────────────────────
  let _user = null;

  async function loadProfile() {
    try {
      const res = await API.get(API_ENDPOINTS.AUTH_ME);
      _user = res.data || res;
      populateForm(_user);
      populateSidebar(_user);
      loadQuickStats();
      loadPreferences();
    } catch (err) {
      showToast(err.message || 'Failed to load profile.', 'error');
    }
  }

  function populateSidebar(u) {
    const name = [capitalize(u.title), u.last_name, u.first_name].filter(Boolean).join(' ') || u.username || '—';
    setText('profileName', name);

    const roleEl = document.querySelector('#profileRole span');
    if (roleEl) roleEl.textContent = 'Parent / Guardian';

    const emailLine = document.querySelector('#profileEmailLine span');
    if (emailLine) emailLine.textContent = u.email || '—';

    const joinedEl = document.querySelector('.meta-joined');
    if (joinedEl) joinedEl.textContent = 'Joined ' + fmtDate(u.created_at);

    const lastLogin = document.querySelector('.meta-last-login');
    if (lastLogin) lastLogin.textContent = 'Last login: ' + fmtDate(u.last_login_at || u.updated_at);

    const occEl = document.querySelector('.meta-occupation');
    if (occEl) occEl.textContent = 'Occupation: ' + (u.occupation || '—');

    const img = document.getElementById('profileImage');
    if (img && u.profile_photo) {
      try {
        const API_BASE = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) ? API_CONFIG.BASE_URL.replace('/api', '') : '';
        img.src = u.profile_photo.startsWith('http') ? u.profile_photo : API_BASE + u.profile_photo;
      } catch (_) {}
    }
  }

  function populateForm(u) {
    setVal('first-name', u.first_name || '');
    setVal('last-name',  u.last_name  || '');
    setVal('title',      u.title      || '');
    setVal('phone',      u.phone_number || '');
    setVal('occupation', u.occupation  || '');
    setVal('email',      u.email      || '');
    setVal('address',    u.address    || '');
    setVal('city',       u.city       || '');
    setVal('region',     u.region     || '');
  }

  // ── Save Personal Info ────────────────────────────────────────────────────────
  async function savePersonalInfo() {
    if (!_user) return;
    const btn = document.querySelector('#personal-tab .btn-save-profile');
    setBtnLoading(btn, true);
    try {
      const data = {
        first_name:   val('first-name'),
        last_name:    val('last-name'),
        title:        val('title'),
        phone_number: val('phone')      || null,
        email:        val('email')      || null,
        address:      val('address')    || null,
        city:         val('city')       || null,
        region:       val('region')     || null,
        // parents table field
        occupation:   val('occupation') || null,
      };
      await API.put(API_ENDPOINTS.USER_BY_ID(_user.uuid), data);
      const res = await API.get(API_ENDPOINTS.AUTH_ME);
      _user = res.data || res;
      populateForm(_user);
      populateSidebar(_user);
      showToast('Personal information saved successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to save personal information.', 'error');
    } finally {
      setBtnLoading(btn, false);
    }
  }

  // ── Change Password ───────────────────────────────────────────────────────────
  async function changePassword() {
    const currentPw  = val('current-password');
    const newPw      = val('new-password');
    const confirmPw  = val('confirm-password');

    if (!currentPw || !newPw || !confirmPw) {
      showToast('Please fill in all password fields.', 'error'); return;
    }
    if (newPw.length < 8) {
      showToast('New password must be at least 8 characters.', 'error'); return;
    }
    if (newPw !== confirmPw) {
      showToast('New passwords do not match.', 'error'); return;
    }

    const btn = document.getElementById('changePasswordBtn');
    setBtnLoading(btn, true);
    try {
      await API.post(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
        current_password: currentPw,
        new_password:     newPw,
        confirm_password: confirmPw,
      });
      showToast('Password updated successfully.');
      setVal('current-password', '');
      setVal('new-password', '');
      setVal('confirm-password', '');
      const bar = document.getElementById('pw-strength-bar');
      if (bar) bar.style.display = 'none';
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setBtnLoading(btn, false);
    }
  }

  // ── Quick Stats ───────────────────────────────────────────────────────────────
  async function loadQuickStats() {
    if (!_user) return;
    try {
      const statsRes = await API.get(API_ENDPOINTS.PARENT_STATS);
      const stats    = statsRes.data || statsRes;

      const sChildren = document.querySelector('.quick-stat-children');
      if (sChildren) sChildren.textContent = stats.total_children ?? '—';

      const sAttendance = document.querySelector('.quick-stat-attendance');
      if (sAttendance) {
        const rate = stats.avg_attendance;
        sAttendance.textContent = (rate !== null && rate !== undefined) ? Math.round(rate) + '%' : '—';
      }

      const sUpcoming = document.querySelector('.quick-stat-upcoming');
      if (sUpcoming) {
        const total = (stats.children_data || []).reduce((sum, c) => sum + (c.upcoming_assessments || 0), 0);
        sUpcoming.textContent = total;
      }

      // Cache children data for the Children tab
      _statsData = stats;
    } catch (_) { /* stats are decorative */ }
  }

  // ── Children Tab ─────────────────────────────────────────────────────────────
  let _childrenLoaded = false;
  let _statsData      = null;

  async function loadChildren() {
    _childrenLoaded = true;
    const loading = document.getElementById('children-loading');
    const wrap    = document.getElementById('children-list-wrap');
    const empty   = document.getElementById('children-empty');
    if (!wrap) return;

    try {
      let stats = _statsData;
      if (!stats) {
        const res = await API.get(API_ENDPOINTS.PARENT_STATS);
        stats = res.data || res;
        _statsData = stats;
      }

      const children = stats.children_data || [];
      if (loading) loading.style.display = 'none';

      if (!children.length) {
        if (empty) empty.style.display = '';
        return;
      }

      wrap.style.display = '';
      wrap.innerHTML = children.map(c => {
        const initials = c.initials || ((c.first_name || '?')[0] + (c.last_name || '?')[0]).toUpperCase();
        const attendColor = c.attendance_rate >= 75 ? '#10b981' : c.attendance_rate >= 50 ? '#f59e0b' : '#ef4444';
        const relationship = c.relationship ? capitalize(c.relationship.replace(/_/g, ' ')) : 'Guardian';
        return `
        <div style="display:flex;align-items:center;gap:1.25rem;padding:1.25rem;border-bottom:1px solid #f3f4f6;flex-wrap:wrap;">
          <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#b8941f,#d4af37);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="color:#fff;font-weight:700;font-size:1.1rem;">${esc(initials)}</span>
          </div>
          <div style="flex:1;min-width:140px;">
            <div style="font-weight:700;font-size:.95rem;">${esc(c.full_name || c.first_name + ' ' + c.last_name)}</div>
            <div style="font-size:.8rem;color:#6b7280;margin-top:.2rem;">
              <span style="background:#fef3c7;color:#92400e;padding:.15rem .5rem;border-radius:99px;font-size:.75rem;">${esc(relationship)}</span>
              ${c.is_primary ? '<span style="background:#d1fae5;color:#065f46;padding:.15rem .5rem;border-radius:99px;font-size:.75rem;margin-left:.3rem;">Primary Contact</span>' : ''}
            </div>
          </div>
          <div style="display:flex;gap:1.5rem;flex-wrap:wrap;">
            <div style="text-align:center;">
              <div style="font-weight:700;font-size:1.1rem;color:#3b82f6;">${c.enrolled_courses ?? '—'}</div>
              <div style="font-size:.72rem;color:#9ca3af;">Courses</div>
            </div>
            <div style="text-align:center;">
              <div style="font-weight:700;font-size:1.1rem;color:${attendColor};">${c.attendance_rate != null ? Math.round(c.attendance_rate) + '%' : '—'}</div>
              <div style="font-size:.72rem;color:#9ca3af;">Attendance</div>
            </div>
            <div style="text-align:center;">
              <div style="font-weight:700;font-size:1.1rem;color:#f59e0b;">${c.upcoming_assessments ?? '—'}</div>
              <div style="font-size:.72rem;color:#9ca3af;">Upcoming</div>
            </div>
          </div>
        </div>`;
      }).join('');
    } catch (err) {
      if (loading) loading.style.display = 'none';
      if (wrap) { wrap.style.display = ''; wrap.innerHTML = `<p style="padding:1rem;color:#ef4444;">Failed to load children: ${esc(err.message)}</p>`; }
    }
  }

  // ── Preferences ──────────────────────────────────────────────────────────────
  function loadPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      const cb = id => { const el = document.getElementById(id); if (el) el.checked = !!prefs[id]; };
      cb('pref-notify-grades');
      cb('pref-notify-attendance');
      cb('pref-notify-events');
      cb('pref-notify-announcements');
      if (prefs['pref-language']) setVal('pref-language', prefs['pref-language']);
      if (prefs['pref-timezone']) setVal('pref-timezone', prefs['pref-timezone']);
    } catch (_) {}
  }

  function savePreferences() {
    try {
      const prefs = {
        'pref-notify-grades':        document.getElementById('pref-notify-grades')?.checked        ?? false,
        'pref-notify-attendance':    document.getElementById('pref-notify-attendance')?.checked    ?? false,
        'pref-notify-events':        document.getElementById('pref-notify-events')?.checked        ?? false,
        'pref-notify-announcements': document.getElementById('pref-notify-announcements')?.checked ?? false,
        'pref-language':             val('pref-language'),
        'pref-timezone':             val('pref-timezone'),
      };
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      showToast('Preferences saved.');
    } catch (_) {
      showToast('Failed to save preferences.', 'error');
    }
  }

  // ── Activity Log ─────────────────────────────────────────────────────────────
  let _activityLoaded = false;

  async function loadActivityLog() {
    _activityLoaded = true;
    const loading = document.getElementById('activity-loading');
    const list    = document.getElementById('activity-list');
    const empty   = document.getElementById('activity-empty');
    if (!list) return;

    const activityIcons = {
      login:           { icon: 'fa-sign-in-alt',    color: '#10b981' },
      logout:          { icon: 'fa-sign-out-alt',   color: '#6b7280' },
      profile_update:  { icon: 'fa-user-edit',      color: '#3b82f6' },
      password_change: { icon: 'fa-key',            color: '#f59e0b' },
      view_grades:     { icon: 'fa-star',           color: '#d4af37' },
      view_attendance: { icon: 'fa-calendar-check', color: '#8b5cf6' },
      view_child:      { icon: 'fa-child',          color: '#d4af37' },
      message_sent:    { icon: 'fa-comment',        color: '#8b5cf6' },
      fee_payment:     { icon: 'fa-receipt',        color: '#f59e0b' },
      document_view:   { icon: 'fa-file-alt',       color: '#3b82f6' },
      api_access:      { icon: 'fa-plug',           color: '#9ca3af' },
    };

    const severityColors = { warning: '#f59e0b', critical: '#ef4444', info: '#9ca3af' };

    try {
      const res   = await ParentActivityAPI.getByPerformer(_user.user_id, { limit: 50 });
      const items = Array.isArray(res.data) ? res.data : [];

      if (loading) loading.style.display = 'none';

      if (!items.length) {
        if (empty) empty.style.display = '';
        return;
      }

      list.style.display = '';
      list.innerHTML = items.map(a => {
        const type   = a.activity_type || 'api_access';
        const meta   = activityIcons[type] || activityIcons.api_access;
        const desc   = a.description || capitalize(type.replace(/_/g, ' '));
        const entity = a.entity_type
          ? `<div style="font-size:.78rem;color:#9ca3af;">${esc(capitalize(a.entity_type.replace(/_/g,' ')))}${a.entity_id ? ` #${esc(String(a.entity_id))}` : ''}</div>`
          : '';
        const sev    = a.severity && a.severity !== 'info'
          ? `<span style="font-size:.7rem;font-weight:600;color:${severityColors[a.severity] || '#9ca3af'};margin-left:.5rem;text-transform:uppercase;">${esc(a.severity)}</span>`
          : '';
        return `
        <div style="display:flex;gap:1rem;padding:.875rem 1.25rem;border-bottom:1px solid #f3f4f6;align-items:flex-start;">
          <div style="width:34px;height:34px;border-radius:50%;background:${meta.color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.1rem;">
            <i class="fas ${meta.icon}" style="color:${meta.color};font-size:.8rem;"></i>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:.875rem;">${esc(desc)}${sev}</div>
            ${entity}
          </div>
          <span style="font-size:.75rem;color:#9ca3af;white-space:nowrap;">${fmtRelTime(a.created_at)}</span>
        </div>`;
      }).join('');
    } catch (err) {
      if (loading) loading.style.display = 'none';
      if (empty)  empty.style.display = '';
    }
  }

  // ── Discard ──────────────────────────────────────────────────────────────────
  async function discardChanges() {
    const confirmed = await showConfirm('Discard all unsaved changes?', 'Discard Changes');
    if (confirmed && _user) populateForm(_user);
  }

  // ── Main init ─────────────────────────────────────────────────────────────────
  function init() {
    // Guard: only run when the profile page is in the DOM
    if (!document.querySelector('.profile-page')) return;

    initTabs();
    initPasswordToggles();
    initPhotoUpload();
    initPasswordStrength();
    loadProfile();

    // Save personal info
    const saveBtn = document.querySelector('#personal-tab .btn-save-profile');
    if (saveBtn) saveBtn.addEventListener('click', savePersonalInfo);

    // Discard
    const cancelBtn = document.querySelector('#personal-tab .btn-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', discardChanges);

    // Change password
    const pwBtn = document.getElementById('changePasswordBtn');
    if (pwBtn) pwBtn.addEventListener('click', changePassword);

    // Save preferences
    const prefsBtn = document.getElementById('savePrefsBtn');
    if (prefsBtn) prefsBtn.addEventListener('click', savePreferences);
  }

  // Listen for the SPA page:loaded event dispatched by parent/dashboard.html
  document.addEventListener('page:loaded', e => {
    if (e.detail && e.detail.page === 'myprofile') init();
  });

  // Also support direct load (if the fragment is already in the DOM)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.querySelector('.profile-page')) init();
    });
  } else {
    if (document.querySelector('.profile-page')) init();
  }

})();
