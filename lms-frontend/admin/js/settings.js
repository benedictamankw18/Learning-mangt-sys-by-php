const SettingsPage = (() => {
  const state = {
    initial: {},
    institutionUUID: null,
    dirty: false,
    isLoading: false,
    isSaving: false,
    pageName: null,
  };

  const elements = {
    root: null,
    form: null,
    tabButtons: [],
    tabContents: [],
    dirtyBadge: null,
    successBox: null,
    errorBox: null,
    errorMessage: null,
    saveButtons: [],
    resetButtons: [],
  };

  function getApi() {
    return window.API || null;
  }

  function notify(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }
    if (type === 'error') {
      console.error(message);
      return;
    }
    console.log(message);
  }

  function setDirty(dirty) {
    state.dirty = dirty;
    if (elements.dirtyBadge) {
      elements.dirtyBadge.style.display = dirty ? 'inline-flex' : 'none';
    }
  }

  function setLoading(isLoading) {
    state.isLoading = isLoading;
    elements.saveButtons.forEach((button) => {
      button.disabled = isLoading || state.isSaving || !state.dirty;
    });
    elements.resetButtons.forEach((button) => {
      button.disabled = isLoading || state.isSaving;
    });
  }

  function setSaving(isSaving) {
    state.isSaving = isSaving;
    elements.saveButtons.forEach((button) => {
      button.disabled = isSaving || state.isLoading || !state.dirty;
      button.classList.toggle('loading', isSaving);
    });
    elements.resetButtons.forEach((button) => {
      button.disabled = isSaving || state.isLoading;
    });
  }

  function showSuccess(message) {
    if (elements.successBox) {
      elements.successBox.textContent = message;
      elements.successBox.style.display = 'block';
    }
    if (elements.errorBox) {
      elements.errorBox.style.display = 'none';
    }
  }

  function showError(message) {
    if (elements.errorBox) {
      elements.errorMessage.textContent = message;
      elements.errorBox.style.display = 'block';
    }
    if (elements.successBox) {
      elements.successBox.style.display = 'none';
    }
  }

  function clearMessages() {
    if (elements.successBox) {
      elements.successBox.style.display = 'none';
    }
    if (elements.errorBox) {
      elements.errorBox.style.display = 'none';
    }
  }

  function clearFieldErrors() {
    elements.form?.querySelectorAll('.form-group').forEach((group) => {
      group.classList.remove('has-error');
      const error = group.querySelector('.error-message');
      if (error) error.textContent = '';
    });
  }

  function showFieldError(name, message) {
    if (!elements.form) return;
    const field = elements.form.querySelector(`[name="${name}"]`);
    if (!field) return;
    const group = field.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    let error = group.querySelector('.error-message');
    if (!error) {
      error = document.createElement('div');
      error.className = 'error-message';
      group.appendChild(error);
    }
    error.textContent = message;
  }

  function setActiveTab(tabName) {
    elements.tabButtons.forEach((button) => button.classList.remove('active'));
    elements.tabContents.forEach((content) => content.classList.remove('active'));

    const button = elements.root?.querySelector(`.settings-tab[data-tab="${tabName}"]`);
    const content = elements.root?.querySelector(`#${tabName}-tab`);
    if (button) button.classList.add('active');
    if (content) content.classList.add('active');
  }

  function normalizeBoolean(value) {
    return value === true || value === 'true' || value === 1 || value === '1' || value === 'on';
  }

  function parseResponseData(response) {
    if (!response) return {};
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    return response;
  }

 // Coming soon Feature now it <Default>
function manualCheckedDisabled() {
  const mcds = elements.form?.getElementsByClassName('CheckDisabled');

  if (!mcds) return;

  Array.from(mcds).forEach((mcd) => {
    mcd.disabled = true;
    mcd.checked = true;

  });

}


  function populateForm(data) {
    const settings = parseResponseData(data);
    state.initial = JSON.parse(JSON.stringify(settings || {}));
    if (!elements.form) return;

    elements.form.querySelectorAll('[name]').forEach((field) => {
      const key = field.name;
      const value = settings[key];
      if (field.type === 'checkbox') {
        field.checked = normalizeBoolean(value);
      } else if (field.type === 'color') {
        field.value = value || field.value || '#000000';
      } else if (value !== undefined && value !== null) {
        field.value = value;
      } else if (field.value === undefined) {
        field.value = '';
      }
    });
    manualCheckedDisabled(); 

    setDirty(false);
    clearFieldErrors();
    clearMessages();
  }

  function collectFormData() {
    const data = {};
    if (!elements.form) return data;

    elements.form.querySelectorAll('[name]').forEach((field) => {
      if (field.type === 'checkbox') {
        data[field.name] = field.checked;
      } else {
        const value = field.value;
        if (value !== '') {
          data[field.name] = value;
        } else {
          data[field.name] = '';
        }
      }
    });

    return data;
  }

  function validateSettings(data) {
    const errors = {};

    if (data.site_name && data.site_name.length > 200) {
      errors.site_name = 'School name must be 200 characters or fewer.';
    }
    if (data.support_email && !/^\S+@\S+\.\S+$/.test(data.support_email)) {
      errors.support_email = 'Enter a valid support email address.';
    }
    if (data.from_address && !/^\S+@\S+\.\S+$/.test(data.from_address)) {
      errors.from_address = 'Enter a valid from address email.';
    }
    if (data.smtp_port && !/^\d+$/.test(String(data.smtp_port))) {
      errors.smtp_port = 'SMTP port must be numeric.';
    }
    if (data.theme_primary_color && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(data.theme_primary_color)) {
      errors.theme_primary_color = 'Enter a valid hex color.';
    }
    if (data.theme_secondary_color && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(data.theme_secondary_color)) {
      errors.theme_secondary_color = 'Enter a valid hex color.';
    }
    if (data.pass_mark !== '' && data.pass_mark !== undefined && (Number.isNaN(Number(data.pass_mark)) || Number(data.pass_mark) < 0 || Number(data.pass_mark) > 100)) {
      errors.pass_mark = 'Pass mark must be between 0 and 100.';
    }

    clearFieldErrors();
    Object.entries(errors).forEach(([name, message]) => showFieldError(name, message));
    return errors;
  }

  async function loadSettings() {
    // const api = getApi();
    // if (!api) {
    //   showError('API client is not available.');
    //   return;
    // }

    try {
          setLoading(true);
          const response = await API.get(`${API_ENDPOINTS.INSTITUTIONS}/${state.institutionUUID}/settings`);
          
          if (!response.success) {
              throw new Error(response.message || 'Failed to load settings');
          }

          const settings = response.data || {};

          // Populate form fields            
          populateForm(settings);
    } catch (error) {
      console.error('Failed to load system settings', error);
      showError(error.message || 'Unable to load system settings');
      notify(error.message || 'Unable to load system settings', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    // const api = getApi();
    // if (!api) {
    //   showError('API client is not available.');
    //   return;
    // }

    clearMessages();
    const data = collectFormData();
    const errors = validateSettings(data);
    if (Object.keys(errors).length > 0) {
      showError('Please fix the highlighted fields and try again.');
      return;
    }

    try {
      setSaving(true);
      const response = await API.put(`${API_ENDPOINTS.INSTITUTIONS}/${state.institutionUUID}/settings`, data);
      if (!response || response.success === false) {
        throw new Error(response?.message || 'Unable to save settings');
      }

      state.initial = JSON.parse(JSON.stringify(data));
      setDirty(false);
      showSuccess(response.message || 'Settings saved successfully.');
      notify(response.message || 'Settings saved successfully.', 'success');
    } catch (error) {
      console.error('Failed to save system settings', error);
      const backendErrors = error?.response?.data?.errors || error?.errors || null;
      if (backendErrors && typeof backendErrors === 'object') {
        clearFieldErrors();
        Object.entries(backendErrors).forEach(([name, message]) => showFieldError(name, message));
      }
      showError(error.message || 'Unable to save settings');
      notify(error.message || 'Unable to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  function resetSettings() {
    populateForm(state.initial);
    showSuccess('Changes discarded.');
    notify('Changes discarded.', 'info');
  }

  function markDirty() {
    setDirty(true);
    clearMessages();
  }

  function cacheElements() {
    elements.root = document.querySelector('.settings-page[data-settings-page="system-settings"], .settings-page');
    elements.form = elements.root?.querySelector('form, .settings-card-body') ? elements.root.querySelector('form') || elements.root : null;
    elements.tabButtons = Array.from(elements.root?.querySelectorAll('.settings-tab') || []);
    elements.tabContents = Array.from(elements.root?.querySelectorAll('.settings-tab-content') || []);
    elements.dirtyBadge = elements.root?.querySelector('#systemSettingsDirty') || null;
    elements.successBox = elements.root?.querySelector('#systemSettingsSuccess') || null;
    elements.errorBox = elements.root?.querySelector('#systemSettingsError') || null;
    elements.errorMessage = elements.root?.querySelector('#systemSettingsErrorMessage') || null;
    elements.saveButtons = Array.from(elements.root?.querySelectorAll('.btn-save-settings') || []);
    elements.resetButtons = Array.from(elements.root?.querySelectorAll('.btn-reset-settings') || []);
  }

  function setupEvents() {
    elements.tabButtons.forEach((button) => {
      button.addEventListener('click', () => setActiveTab(button.dataset.tab));
    });

    elements.form?.querySelectorAll('[name]').forEach((field) => {
      field.addEventListener('input', markDirty);
      field.addEventListener('change', markDirty);
    });

    elements.saveButtons.forEach((button) => {
      button.addEventListener('click', saveSettings);
    });

    elements.resetButtons.forEach((button) => {
      button.addEventListener('click', resetSettings);
    });
  }

  async function init() {
    cacheElements();

    let session = window.S || {};
        try {
            const user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
            if (user) {
                // support both `institution_uuid` and `institution_id` shapes
                state.institutionUUID = user.institution_uuid || user.institution_id || session.institutionUUID || localStorage.getItem('institutionUUID');
            } else {
                state.institutionUUID = session.institutionUUID || localStorage.getItem('institutionUUID');
            }
        } catch (e) {
            state.institutionUUID = session.institutionUUID || localStorage.getItem('institutionUUID');
        }
        
        if (!state.institutionUUID) {
            showError('Unable to load institution. Please refresh the page.');
            return;
        }
    if (!elements.root || !elements.form) return;
    setupEvents();

    await loadSettings();
  }

  return {
    init,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.settings-page')) {
    SettingsPage.init();
  }
});

document.addEventListener('page:loaded', (event) => {
  if (!event?.detail?.page) return;
  if (event.detail.page === 'settings' || event.detail.page === 'system-settings') {
    SettingsPage.init();
  }
});
