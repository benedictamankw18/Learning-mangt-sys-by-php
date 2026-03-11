// My Profile Page JavaScript - Live API Integration

(function () {
  'use strict';

  // â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let _user = null;          // current user object from /api/auth/me
  const PREF_KEY = 'lms_admin_prefs';

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = (v != null && v !== '') ? v : '';
  }

  function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = (v != null && v !== '') ? v : 'â€”';
  }

  function fmtDate(d) {
    if (!d) return 'â€”';
    try { return new Date(d).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (_) { return d; }
  }

  function fmtRelTime(d) {
    if (!d) return '';
    try {
      const diff = Date.now() - new Date(d).getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1) return 'Just now';
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const days = Math.floor(h / 24);
      if (days < 7) return `${days}d ago`;
      return new Date(d).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' });
    } catch (_) { return d; }
  }

  function showToast(message, type = 'success') {
    // Try using the global toast if available
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }
    // Fallback: inline banner at top of page
    let toast = document.getElementById('_profileToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = '_profileToast';
      toast.style.cssText = 'position:fixed;top:72px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.2);transition:opacity .3s';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    toast.style.color = '#fff';
    toast.style.opacity = '1';
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
  }

  function setBtnLoading(btn, loading, originalText) {
    if (!btn) return;
    if (loading) {
      btn.dataset.orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please waitâ€¦';
      btn.disabled = true;
    } else {
      btn.innerHTML = btn.dataset.orig || originalText || btn.innerHTML;
      btn.disabled = false;
    }
  }

  // â”€â”€ Tab Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function showConfirm(message, title) {
    if (!document.getElementById('_lmsPopupCSS')) {
      const s = document.createElement('style');
      s.id = '_lmsPopupCSS';
      s.textContent = '#_lmsConfirm [data-role=confirm]:hover{background:#004d2e!important}#_lmsConfirm [data-role=cancel]:hover{background:#f1f5f9!important}#_lmsConfirm{animation:_lmsIn .18s ease}@keyframes _lmsIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}';
      document.head.appendChild(s);
    }
    return new Promise(resolve => {
      const old = document.getElementById('_lmsConfirm');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.id = '_lmsConfirm';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.5);backdrop-filter:blur(3px)';
      overlay.innerHTML = `<div style='background:#fff;border-radius:14px;padding:32px 28px;max-width:400px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,.25);font-family:inherit'><h3 style='margin:0 0 10px;font-size:16px;font-weight:700;color:#0f172a'>${esc(title || 'Confirm')}</h3><p style='margin:0 0 28px;font-size:14px;color:#475569;line-height:1.6'>${esc(message)}</p><div style='display:flex;gap:10px;justify-content:flex-end'><button data-role='cancel' style='padding:9px 20px;border-radius:8px;border:1.5px solid #cbd5e1;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;transition:background .15s'>Cancel</button><button data-role='confirm' style='padding:9px 20px;border-radius:8px;border:none;background:#006a3f;color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,106,63,.3);transition:background .15s'>Confirm</button></div></div>`;
      document.body.appendChild(overlay);
      const done = v => { overlay.remove(); resolve(v); };
      overlay.querySelector('[data-role=confirm]').addEventListener('click', () => done(true));
      overlay.querySelector('[data-role=cancel]').addEventListener('click', () => done(false));
      overlay.addEventListener('click', e => { if (e.target === overlay) done(false); });
    });
  }

  function setupTabs() {
    // Both top-bar tabs and sidebar nav share data-tab; panels use .profile-panel
    const allTabs = document.querySelectorAll('.profile-tab, .psnav-item');
    const panels  = document.querySelectorAll('.profile-panel');
    allTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        allTabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        document.querySelectorAll(`[data-tab="${this.dataset.tab}"]`).forEach(t => t.classList.add('active'));
        const panel = document.getElementById(`${this.dataset.tab}-tab`);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // â”€â”€ Password Visibility Toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function setupPasswordToggles() {
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = document.getElementById(this.dataset.target);
        const icon = this.querySelector('i');
        if (!input) return;
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
      });
    });
  }

  // â”€â”€ Load Profile from API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function loadProfile() {
    try {
      const res = await API.get(API_ENDPOINTS.AUTH_ME);
      _user = res.data || res;
      populateForm(_user);
      loadQuickStats();
      loadActivityLog();
      loadPreferences();
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

  function populateForm(u) {
    if (!u) return;

    // Sidebar identity
    const fullName = [u.title && capitalize(u.title), u.first_name, u.last_name].filter(Boolean).join(' ');
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = fullName || u.username || '—';

    const roleEl = document.getElementById('profileRole');
    if (roleEl) {
      const roleLabel = Array.isArray(u.roles) && u.roles.length
        ? u.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')
        : 'Administrator';
      roleEl.innerHTML = `<i class="fas fa-crown"></i> <span>${esc(roleLabel)}</span>`;
    }

    const emailLineEl = document.getElementById('profileEmailLine');
    if (emailLineEl) emailLineEl.innerHTML = `<i class="fas fa-envelope"></i> <span>${esc(u.email || "")}</span>`;
    const joinedEl = document.querySelector('.meta-joined');
    if (joinedEl && u.created_at) joinedEl.textContent = `Member since ${fmtDate(u.created_at)}`;

    const lastLoginEl = document.querySelector('.meta-last-login');
    if (lastLoginEl && u.last_login_at) lastLoginEl.textContent = `Last login: ${fmtRelTime(u.last_login_at)}`;
    // Profile photo
    if (u.profile_photo) {
      const img = document.getElementById('profileImage');
      if (img) img.src = (API_BASE_URL || '') + u.profile_photo;
    } else {
      // Fallback to localStorage cached URL
      try {
        const cached = localStorage.getItem(`lms_photo_${u.uuid}`);
        if (cached) {
          const img = document.getElementById('profileImage');
          if (img) img.src = cached;
        }
      } catch (_) {}
    }

    // Personal Info tab
    setVal('first-name', u.first_name);
    setVal('last-name', u.last_name);
    setVal('title', u.title);
    setVal('gender', u.gender);
    setVal('dob', u.date_of_birth);
    setVal('phone', u.phone_number);
    setVal('email', u.email);
    setVal('address', u.address);
    setVal('city', u.city);
    setVal('region', u.region);

    // Bio (admins table)
    setVal('bio', u.bio || '');
    setVal('alt-email', u.alternative_email || '');

    // Professional details (admins table)
    setVal('staff-id', u.employee_id || '');
    setVal('department', u.department || '');
    setVal('qualification', u.qualification || '');
    setVal('specialization', u.specialization || '');
    setVal('join-date', u.hire_date ? u.hire_date.substring(0, 10) : (u.created_at ? u.created_at.substring(0, 10) : ''));
  }

  // â”€â”€ Save Personal Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function savePersonalInfo() {
    if (!_user) return;
    const btn = document.querySelector('#personal-tab .btn-save-profile');
    setBtnLoading(btn, true);
    try {
      const data = {
        first_name:        val('first-name'),
        last_name:         val('last-name'),
        title:             val('title'),
        gender:            val('gender'),
        date_of_birth:     val('dob') || null,
        phone_number:      val('phone') || null,
        address:           val('address') || null,
        city:              val('city') || null,
        region:            val('region') || null,
        bio:               val('bio') || null,
        alternative_email: val('alt-email') || null,
        department:        val('department') || null,
        qualification:     val('qualification') || null,
        specialization:    val('specialization') || null,
      };
      await API.put(API_ENDPOINTS.USER_BY_ID(_user.uuid), data);
      // Refresh cached user
      const res = await API.get(API_ENDPOINTS.AUTH_ME);
      _user = res.data || res;
      populateForm(_user);
      showToast('Personal information saved successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to save personal information.', 'error');
    } finally {
      setBtnLoading(btn, false);
    }
  }

  // â”€â”€ Change Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function changePassword() {
    const currentPw  = val('current-password');
    const newPw      = val('new-password');
    const confirmPw  = val('confirm-password');

    if (!currentPw || !newPw || !confirmPw) {
      showToast('Please fill in all password fields.', 'error'); return;
    }
    if (newPw !== confirmPw) {
      showToast('New passwords do not match.', 'error'); return;
    }
    if (newPw.length < 8) {
      showToast('Password must be at least 8 characters.', 'error'); return;
    }
    // Basic strength check: must contain letter + digit
    if (!/[A-Za-z]/.test(newPw) || !/[0-9]/.test(newPw)) {
      showToast('Password must contain at least one letter and one number.', 'error'); return;
    }

    const btn = document.querySelector('.btn-update-password');
    setBtnLoading(btn, true);
    try {
      await API.post(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
        current_password: currentPw,
        new_password: newPw
      });
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
      showToast('Password changed successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setBtnLoading(btn, false);
    }
  }

  // â”€â”€ Profile Photo Upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function setupPhotoUpload() {
    const btn = document.getElementById('changePhotoBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/jpg,image/webp';
      input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          showToast('Photo must be under 5 MB.', 'error'); return;
        }
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = ev => {
          const img = document.getElementById('profileImage');
          if (img) img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        // Upload in background
        uploadPhoto(file);
      });
      input.click();
    });
  }

  async function uploadPhoto(file) {
    try {
      const token = Auth.getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'profiles');

      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FILE_UPLOAD}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upload failed');

      const url = (json.data || json).url;
      if (!url) throw new Error('No URL in upload response');

      // Save to users table; also cache locally as fallback
      if (_user) {
        try {
          await API.put(API_ENDPOINTS.USER_BY_ID(_user.uuid), { profile_photo: url });
        } catch (_) { /* column may not be available yet â€” cached locally */ }
        try { localStorage.setItem(`lms_photo_${_user.uuid}`, (API_BASE_URL || '') + url); } catch (_) {}
      }
      showToast('Profile photo updated.');
    } catch (err) {
      showToast(err.message || 'Photo upload failed.', 'error');
    }
  }

  // â”€â”€ Quick Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function loadQuickStats() {
    try {
      const res = await API.get(API_ENDPOINTS.DASHBOARD_ADMIN);
      const d = res.data || res;
      const sStudents = document.querySelector('.quick-stat-students');
      const sTeachers = document.querySelector('.quick-stat-teachers');
      const sClasses  = document.querySelector('.quick-stat-classes');
      if (sStudents && d.total_students != null) sStudents.textContent = Number(d.total_students).toLocaleString();
      if (sTeachers && d.total_teachers != null) sTeachers.textContent = Number(d.total_teachers).toLocaleString();
      if (sClasses  && d.total_classes  != null) sClasses.textContent  = Number(d.total_classes).toLocaleString();
    } catch (_) { /* stats are decorative — silently skip */ }
  }

  // -- Activity Log ----------------------------------------------------------
  let _activityPage = 1;
  let _activityType = 'all';
  let _activityDateFrom = '';
  let _activityDateTo   = '';

  async function loadActivityLog(append) {
    const timeline = document.querySelector('.activity-timeline');
    if (!timeline) return;

    if (!append) {
      _activityPage = 1;
      timeline.innerHTML = '<div class="activity-loading"><i class="fas fa-circle-notch fa-spin"></i><span>Loading activity&hellip;</span></div>';
    }

    try {
      const params = new URLSearchParams({ page: _activityPage, limit: 20 });
      if (_activityType && _activityType !== 'all') params.set('activity_type', _activityType);
      if (_activityDateFrom) params.set('start_date', _activityDateFrom);
      if (_activityDateTo)   params.set('end_date',   _activityDateTo);

      const res  = await API.get(API_ENDPOINTS.ADMIN_ACTIVITY + '?' + params.toString());
      const data = res.data || res;
      const items = Array.isArray(data.activities) ? data.activities : (Array.isArray(data) ? data : []);
      const pagination = data.pagination || {};

      const iconMap = {
        login:            { bg: '#10b981', icon: 'fa-sign-in-alt' },
        logout:           { bg: '#6b7280', icon: 'fa-sign-out-alt' },
        student_enrolled: { bg: '#3b82f6', icon: 'fa-user-plus' },
        teacher_assigned: { bg: '#8b5cf6', icon: 'fa-chalkboard-teacher' },
        grade_updated:    { bg: '#d4af37', icon: 'fa-star' },
        class_created:    { bg: '#06b6d4', icon: 'fa-layer-group' },
        create:           { bg: '#3b82f6', icon: 'fa-plus-circle' },
        update:           { bg: '#8b5cf6', icon: 'fa-edit' },
        delete:           { bg: '#ef4444', icon: 'fa-trash-alt' },
        export:           { bg: '#06b6d4', icon: 'fa-file-export' },
        settings_changed: { bg: '#f59e0b', icon: 'fa-cog' },
        password_changed: { bg: '#f59e0b', icon: 'fa-key' },
      };

      if (!append) {
        if (items.length === 0) {
          timeline.innerHTML = '<div class="activity-loading"><i class="fas fa-inbox"></i><span>No activity found.</span></div>';
          const lb = document.querySelector('.btn-load-more');
          if (lb) lb.style.display = 'none';
          return;
        }
        timeline.innerHTML = '';
      }

      const html = items.map(item => {
        const type = (item.activity_type || '').toLowerCase();
        const ic   = iconMap[type] || { bg: '#9ca3af', icon: 'fa-circle' };
        const desc = esc(item.description || item.activity_type || 'System activity');
        const sub  = item.entity_type ? esc(item.entity_type.replace(/_/g, ' ') + (item.entity_id ? ' #' + item.entity_id : '')) : esc(item.ip_address || '');
        const time = fmtRelTime(item.created_at);
        const sev  = item.severity === 'critical' ? ' style="border-left:3px solid #ef4444"' : (item.severity === 'warning' ? ' style="border-left:3px solid #f59e0b"' : '');
        return `<div class="activity-item"${sev}><div class="activity-dot" style="background:${ic.bg}"><i class="fas ${ic.icon}"></i></div><div class="activity-content"><strong>${desc}</strong>${sub ? `<p>${sub}</p>` : ''}<p class="activity-time">${time}</p></div></div>`;
      }).join('');
      timeline.insertAdjacentHTML('beforeend', html);

      const lb = document.querySelector('.btn-load-more');
      if (lb) lb.style.display = (_activityPage < (pagination.pages || 1)) ? '' : 'none';
    } catch (_) {
      const timeline2 = document.querySelector('.activity-timeline');
      if (timeline2 && !append) timeline2.innerHTML = '<div class="activity-loading"><i class="fas fa-exclamation-circle"></i><span>Failed to load activity.</span></div>';
    }
  }

  function setupActivityFilters() {
    const filterSel = document.querySelector('.filter-select');
    if (filterSel) filterSel.addEventListener('change', () => { _activityType = filterSel.value; loadActivityLog(false); });

    const dateInputs = document.querySelectorAll('.activity-date-range input[type=date]');
    if (dateInputs[0]) dateInputs[0].addEventListener('change', () => { _activityDateFrom = dateInputs[0].value; loadActivityLog(false); });
    if (dateInputs[1]) dateInputs[1].addEventListener('change', () => { _activityDateTo   = dateInputs[1].value; loadActivityLog(false); });

    const lb = document.querySelector('.btn-load-more');
    if (lb) lb.addEventListener('click', () => { _activityPage++; loadActivityLog(true); });
  }

  // â”€â”€ Preferences (localStorage) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function loadPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      // Map toggle ids to pref keys
      const prefItems = document.querySelectorAll('.pref-item');
      prefItems.forEach((item, i) => {
        const toggle = item.querySelector('input[type="checkbox"]');
        const key = `pref_${i}`;
        if (toggle && prefs[key] !== undefined) toggle.checked = prefs[key];
      });
      // Display prefs
      if (prefs.language) { const el = document.getElementById('language-pref'); if (el) el.value = prefs.language; }
      if (prefs.timezone) { const el = document.getElementById('timezone-pref'); if (el) el.value = prefs.timezone; }
      if (prefs.date_format) { const el = document.getElementById('date-format'); if (el) el.value = prefs.date_format; }
      if (prefs.per_page) { const el = document.getElementById('items-per-page'); if (el) el.value = prefs.per_page; }
    } catch (_) {}
  }

  function savePreferences() {
    try {
      const prefs = {};
      document.querySelectorAll('.pref-item').forEach((item, i) => {
        const toggle = item.querySelector('input[type="checkbox"]');
        if (toggle) prefs[`pref_${i}`] = toggle.checked;
      });
      const langEl = document.getElementById('language-pref');
      const tzEl   = document.getElementById('timezone-pref');
      const dfEl   = document.getElementById('date-format');
      const ppEl   = document.getElementById('items-per-page');
      if (langEl) prefs.language    = langEl.value;
      if (tzEl)   prefs.timezone    = tzEl.value;
      if (dfEl)   prefs.date_format = dfEl.value;
      if (ppEl)   prefs.per_page    = ppEl.value;
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      showToast('Preferences saved.');
    } catch (_) {
      showToast('Failed to save preferences.', 'error');
    }
  }

  // â”€â”€ Cancel / Reload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function setupCancelBtns() {
    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (await showConfirm('Discard unsaved changes?', 'Discard Changes')) {
          if (_user) populateForm(_user);
          showToast('Changes discarded.', 'info');
        }
      });
    });
  }

  // â”€â”€ Save button routing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function setupSaveBtns() {
    // Personal Info tab save
    const personalSave = document.querySelector('#personal-tab .btn-save-profile');
    if (personalSave) personalSave.addEventListener('click', savePersonalInfo);

    // Preferences tab save
    const prefSave = document.querySelector('#preferences-tab .btn-save-profile');
    if (prefSave) prefSave.addEventListener('click', savePreferences);

    // Password update
    const pwBtn = document.querySelector('.btn-update-password');
    if (pwBtn) pwBtn.addEventListener('click', changePassword);
  }

  // â”€â”€ Session management (UI-only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function setupSessionBtns() {
    document.querySelectorAll('.btn-revoke-session').forEach(btn => {
      btn.addEventListener('click', async function () {
        const item = this.closest('.session-item');
        const name = item?.querySelector('h4')?.textContent || 'this device';
        if (await showConfirm(`Revoke access for "${name}"?`, 'Revoke Session')) {
          item?.remove();
          showToast('Session revoked.');
        }
      });
    });

    const revokeAll = document.querySelector('.btn-revoke-all');
    if (revokeAll) {
      revokeAll.addEventListener('click', async () => {
        if (await showConfirm('Sign out from all other devices?', 'Sign Out Everywhere')) {
          document.querySelectorAll('.session-item:not(.current)').forEach(el => el.remove());
          showToast('All other sessions terminated.');
        }
      });
    }
  }

  // â”€â”€ Main init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function initializeProfile() {
    setupTabs();
    setupPasswordToggles();
    setupPhotoUpload();
    setupSaveBtns();
    setupCancelBtns();
    setupSessionBtns();
    setupActivityFilters();
    loadProfile();
  }

  // DOMContentLoaded (standalone page)
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.profile-page')) initializeProfile();
  });

  // page:loaded event (SPA navigation)
  document.addEventListener('page:loaded', e => {
    if (e.detail?.page === 'myprofile') initializeProfile();
  });

})();
