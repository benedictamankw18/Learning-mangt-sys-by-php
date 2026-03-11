/**
 * teacher/js/myprofile.js
 * Handles the teacher My Profile page (SPA fragment: teacher/page/myprofile.html).
 * Loaded once by teacher/dashboard.html; initialised on page:loaded event.
 */
(function () {
  'use strict';

  const PREF_KEY = 'lms_teacher_prefs';

  // ── DOM helpers ──────────────────────────────────────────────────────────────
  function val(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return (el.tagName === 'SELECT' || el.type === 'checkbox') ? el.value : el.value.trim();
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
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
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
      s.textContent = '#_lmsConfirm [data-role=confirm]:hover{background:#154360!important}#_lmsConfirm [data-role=cancel]:hover{background:#f1f5f9!important}#_lmsConfirm{animation:_lmsIn .18s ease}@keyframes _lmsIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}';
      document.head.appendChild(s);
    }
    return new Promise(resolve => {
      const old = document.getElementById('_lmsConfirm');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.id = '_lmsConfirm';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.5);backdrop-filter:blur(3px)';
      overlay.innerHTML = `<div style='background:#fff;border-radius:14px;padding:32px 28px;max-width:400px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,.25);font-family:inherit'><h3 style='margin:0 0 10px;font-size:16px;font-weight:700;color:#0f172a'>${esc(title || 'Confirm')}</h3><p style='margin:0 0 28px;font-size:14px;color:#475569;line-height:1.6'>${esc(message)}</p><div style='display:flex;gap:10px;justify-content:flex-end'><button data-role='cancel' style='padding:9px 20px;border-radius:8px;border:1.5px solid #cbd5e1;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;transition:background .15s'>Cancel</button><button data-role='confirm' style='padding:9px 20px;border-radius:8px;border:none;background:#1a5276;color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(26,82,118,.3);transition:background .15s'>Confirm</button></div></div>`;
      document.body.appendChild(overlay);
      const done = v => { overlay.remove(); resolve(v); };
      overlay.querySelector('[data-role=confirm]').addEventListener('click', () => done(true));
      overlay.querySelector('[data-role=cancel]').addEventListener('click', () => done(false));
      overlay.addEventListener('click', e => { if (e.target === overlay) done(false); });
    });
  }

  // ── Tab switching ────────────────────────────────────────────────────────────
  function setupTabs() {
    const allBtns   = document.querySelectorAll('.profile-tab, .psnav-item');
    const allPanels = document.querySelectorAll('.profile-panel');

    allBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const tab = this.dataset.tab;
        allBtns.forEach(b => b.classList.remove('active'));
        allPanels.forEach(p => p.classList.remove('active'));
        document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
        const panel = document.getElementById(`${tab}-tab`);
        if (panel) panel.classList.add('active');

        if (tab === 'activity') loadActivityLog(false);
        if (tab === 'courses')  loadSubjects();
      });
    });
  }

  // ── Password toggles ─────────────────────────────────────────────────────────
  function setupPasswordToggles() {
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = document.getElementById(this.dataset.target);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        this.querySelector('i').className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
      });
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

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  function populateSidebar(u) {
    const name = [capitalize(u.title), u.last_name, u.first_name].filter(Boolean).join(' ') || u.username || '—';
    setText('profileName', name);

    const roleEl = document.querySelector('#profileRole span');
    if (roleEl) roleEl.textContent = capitalize(Array.isArray(u.roles) ? (u.roles[0] || 'Teacher') : 'Teacher');

    const emailLine = document.querySelector('#profileEmailLine span');
    if (emailLine) emailLine.textContent = u.email || '—';

    const joined = document.querySelector('.meta-joined');
    if (joined) joined.textContent = 'Joined ' + (u.hire_date ? fmtDate(u.hire_date) : fmtDate(u.created_at));

    const lastLogin = document.querySelector('.meta-last-login');
    if (lastLogin) lastLogin.textContent = 'Last login: ' + fmtDate(u.last_login_at || u.updated_at);

    const staffIdEl = document.querySelector('.meta-staff-id');
    if (staffIdEl) staffIdEl.textContent = 'Staff ID: ' + (u.employee_id || u.username || '—');

    const img = document.getElementById('profileImage');
    if (img && u.profile_photo) {
      try {
        img.src = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '') + u.profile_photo;
      } catch (_) {}
    }
  }

  function populateForm(u) {
    // Basic info
    setVal('first-name', u.first_name);
    setVal('last-name',  u.last_name);
    setVal('title',      u.title);
    setVal('gender',     u.gender);
    setVal('dob',        u.date_of_birth ? u.date_of_birth.substring(0, 10) : '');
    setVal('phone',      u.phone_number);
    setVal('bio',        u.bio || '');

    // Contact
    setVal('email',     u.email);
    setVal('alt-email', u.alternative_email || '');
    setVal('address',   u.address);
    setVal('city',      u.city);
    setVal('region',    u.region);

    // Professional (teachers table fields)
    setVal('staff-id',           u.employee_id || '');
    setVal('qualification',      u.qualification || '');
    setVal('specialization',     u.specialization || '');
    setVal('years-experience',   u.years_of_experience ?? '');
    setVal('hire-date',          u.hire_date ? u.hire_date.substring(0, 10) : '');
    setVal('employment-status',  u.is_active ? 'Active' : 'Inactive');
  }

  // ── Save Personal Info ────────────────────────────────────────────────────────
  async function savePersonalInfo() {
    if (!_user) return;
    const btn = document.querySelector('#personal-tab .btn-save-profile');
    setBtnLoading(btn, true);
    try {
      const data = {
        first_name:          val('first-name'),
        last_name:           val('last-name'),
        title:               val('title'),
        gender:              val('gender'),
        date_of_birth:       val('dob') || null,
        phone_number:        val('phone') || null,
        address:             val('address') || null,
        city:                val('city') || null,
        region:              val('region') || null,
        // teacher + users shared fields
        bio:                 val('bio') || null,
        alternative_email:   val('alt-email') || null,
        // teachers table
        qualification:       val('qualification') || null,
        specialization:      val('specialization') || null,
        years_of_experience: val('years-experience') ? parseInt(val('years-experience')) : null,
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
    const currentPw = val('current-password');
    const newPw     = val('new-password');
    const confirmPw = val('confirm-password');

    if (!currentPw || !newPw || !confirmPw) {
      showToast('Please fill in all password fields.', 'error'); return;
    }
    if (newPw !== confirmPw) {
      showToast('New passwords do not match.', 'error'); return;
    }
    if (newPw.length < 8) {
      showToast('Password must be at least 8 characters.', 'error'); return;
    }
    if (!/[A-Za-z]/.test(newPw) || !/[0-9]/.test(newPw)) {
      showToast('Password must contain at least one letter and one number.', 'error'); return;
    }

    const btn = document.querySelector('.btn-update-password');
    setBtnLoading(btn, true);
    try {
      await API.post(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
        current_password: currentPw,
        new_password:     newPw,
      });
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value     = '';
      document.getElementById('confirm-password').value = '';
      showToast('Password changed successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setBtnLoading(btn, false);
    }
  }

  // ── Profile Photo Upload ──────────────────────────────────────────────────────
  function setupPhotoUpload() {
    const btn = document.getElementById('changePhotoBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type   = 'file';
      input.accept = 'image/png,image/jpeg,image/jpg,image/webp';
      input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Photo must be under 5 MB.', 'error'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
          const img = document.getElementById('profileImage');
          if (img) img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
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

      const res  = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FILE_UPLOAD}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upload failed');

      const url = (json.data || json).url;
      if (!url) throw new Error('No URL in upload response');

      if (_user) {
        try { await API.put(API_ENDPOINTS.USER_BY_ID(_user.uuid), { profile_photo: url }); } catch (_) {}
        try { localStorage.setItem(`lms_photo_${_user.uuid}`, (API_BASE_URL || '') + url); } catch (_) {}
      }
      showToast('Profile photo updated.');
    } catch (err) {
      showToast(err.message || 'Photo upload failed.', 'error');
    }
  }

  // ── Quick Stats ───────────────────────────────────────────────────────────────
  async function loadQuickStats() {
    if (!_user) return;
    try {
      const [coursesRes, statsRes] = await Promise.all([
        API.get(API_ENDPOINTS.TEACHER_COURSES(_user.teacher_uuid || _user.uuid)),
        API.get(API_ENDPOINTS.TEACHER_STATS),
      ]);

      const courses = Array.isArray(coursesRes.data) ? coursesRes.data : (Array.isArray(coursesRes) ? coursesRes : []);
      const stats   = statsRes.data || statsRes;

      const sCourses = document.querySelector('.quick-stat-courses');
      if (sCourses) sCourses.textContent = courses.length;

      const totalStudents = courses.reduce((sum, c) => sum + (c.enrolled_students || 0), 0);
      const sStudents = document.querySelector('.quick-stat-students');
      if (sStudents) sStudents.textContent = totalStudents;

      const sPending = document.querySelector('.quick-stat-pending');
      if (sPending) sPending.textContent = stats.pending_grades ?? stats.pending_submissions ?? 0;
    } catch (_) { /* stats are decorative */ }
  }

  // ── Subjects (courses-tab) ────────────────────────────────────────────────────
  let _subjectsLoaded = false;

  async function loadSubjects() {
    if (_subjectsLoaded) return;
    if (!_user) return;

    const loading = document.getElementById('subjects-loading');
    const list    = document.getElementById('subjects-list');
    const empty   = document.getElementById('subjects-empty');
    const tbody   = document.getElementById('subjects-tbody');
    if (!tbody) return;

    try {
      const res = await API.get(API_ENDPOINTS.TEACHER_COURSES(_user.teacher_uuid || _user.uuid));
      const courses = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);

      if (loading) loading.style.display = 'none';

      if (courses.length === 0) {
        if (empty) empty.style.display = 'flex';
        return;
      }

      tbody.innerHTML = courses.map(c => `
        <tr>
          <td><strong>${esc(c.subject_name || c.course_name || '—')}</strong></td>
          <td>${esc(c.class_name || c.section_name || '—')}</td>
          <td>${esc(c.program_name || '—')}</td>
          <td>${c.enrolled_students ?? '—'}</td>
        </tr>
      `).join('');

      if (list) list.style.display = '';
      _subjectsLoaded = true;
    } catch (_) {
      if (loading) loading.style.display = 'none';
      if (empty)   empty.style.display   = 'flex';
    }
  }

  // ── Activity Log ─────────────────────────────────────────────────────────────
  let _activityPage     = 1;
  let _activityType     = 'all';
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

      const res   = await API.get(API_ENDPOINTS.TEACHER_ACTIVITY + '?' + params.toString());
      const data  = res.data || res;
      const items = Array.isArray(data.activities) ? data.activities : (Array.isArray(data) ? data : []);
      const pagination = data.pagination || {};

      const iconMap = {
        login:             { bg: '#10b981', icon: 'fa-sign-in-alt' },
        logout:            { bg: '#6b7280', icon: 'fa-sign-out-alt' },
        assignment_create: { bg: '#3b82f6', icon: 'fa-plus-circle' },
        grade_update:      { bg: '#d4af37', icon: 'fa-star' },
        attendance_marked: { bg: '#06b6d4', icon: 'fa-user-check' },
        create:            { bg: '#3b82f6', icon: 'fa-plus-circle' },
        update:            { bg: '#8b5cf6', icon: 'fa-edit' },
        delete:            { bg: '#ef4444', icon: 'fa-trash-alt' },
        password_changed:  { bg: '#f59e0b', icon: 'fa-key' },
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
        const sub  = item.entity_type
          ? esc(item.entity_type.replace(/_/g, ' ') + (item.entity_id ? ' #' + item.entity_id : ''))
          : esc(item.ip_address || '');
        const time = fmtRelTime(item.created_at);
        const sev  = item.severity === 'critical'
          ? ' style="border-left:3px solid #ef4444"'
          : (item.severity === 'warning' ? ' style="border-left:3px solid #f59e0b"' : '');
        return `<div class="activity-item"${sev}><div class="activity-dot" style="background:${ic.bg}"><i class="fas ${ic.icon}"></i></div><div class="activity-content"><strong>${desc}</strong>${sub ? `<p>${sub}</p>` : ''}<p class="activity-time">${time}</p></div></div>`;
      }).join('');
      timeline.insertAdjacentHTML('beforeend', html);

      const lb = document.querySelector('.btn-load-more');
      if (lb) lb.style.display = (_activityPage < (pagination.pages || 1)) ? '' : 'none';
    } catch (_) {
      const t2 = document.querySelector('.activity-timeline');
      if (t2 && !append) t2.innerHTML = '<div class="activity-loading"><i class="fas fa-exclamation-circle"></i><span>Failed to load activity.</span></div>';
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

  // ── Preferences ───────────────────────────────────────────────────────────────
  function loadPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      document.querySelectorAll('.pref-item').forEach((item, i) => {
        const toggle = item.querySelector('input[type="checkbox"]');
        const key = `pref_${i}`;
        if (toggle && prefs[key] !== undefined) toggle.checked = prefs[key];
      });
      if (prefs.language)    { const el = document.getElementById('language-pref'); if (el) el.value = prefs.language; }
      if (prefs.timezone)    { const el = document.getElementById('timezone-pref'); if (el) el.value = prefs.timezone; }
      if (prefs.date_format) { const el = document.getElementById('date-format');   if (el) el.value = prefs.date_format; }
      if (prefs.per_page)    { const el = document.getElementById('items-per-page'); if (el) el.value = prefs.per_page; }
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

  // ── Cancel / Reload ───────────────────────────────────────────────────────────
  function setupCancelBtns() {
    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (await showConfirm('Discard unsaved changes?', 'Discard Changes')) {
          if (_user) { populateForm(_user); populateSidebar(_user); }
          showToast('Changes discarded.', 'info');
        }
      });
    });
  }

  // ── Save button routing ───────────────────────────────────────────────────────
  function setupSaveBtns() {
    const personalSave = document.querySelector('#personal-tab .btn-save-profile');
    if (personalSave) personalSave.addEventListener('click', savePersonalInfo);

    const prefSave = document.querySelector('#preferences-tab .btn-save-profile');
    if (prefSave) prefSave.addEventListener('click', savePreferences);

    const pwBtn = document.querySelector('.btn-update-password');
    if (pwBtn) pwBtn.addEventListener('click', changePassword);
  }

  // ── Session management (UI-only) ──────────────────────────────────────────────
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

  // ── Profile tab nav in dropdown ───────────────────────────────────────────────
  function wireProfileDropdown() {
    const profileLink = document.querySelector('.dropdown-item[data-page="myprofile"]');
    if (profileLink) {
      profileLink.addEventListener('click', e => {
        e.preventDefault();
        window.location.hash = '#myprofile';
      });
    }
  }

  // ── Main init ─────────────────────────────────────────────────────────────────
  function initializeProfile() {
    _subjectsLoaded = false;
    setupTabs();
    setupPasswordToggles();
    setupPhotoUpload();
    setupSaveBtns();
    setupCancelBtns();
    setupSessionBtns();
    setupActivityFilters();
    loadProfile();
  }

  // Listen for SPA navigation event from teacher/dashboard.html
  document.addEventListener('page:loaded', e => {
    if (e.detail?.page === 'myprofile') initializeProfile();
  });

})();
