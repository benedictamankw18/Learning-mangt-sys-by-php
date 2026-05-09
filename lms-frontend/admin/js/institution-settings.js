/**
 * Institution Settings Controller
 * Handles loading, editing, and saving institution settings
 */

const InstitutionSettings = (() => {
    // State
    const state = {
        institutionUUID: null,
        initialSettings: {},
        currentSettings: {},
        dirtyFields: new Set(),
        isLoading: false,
        isSaving: false,
        errors: {}
    };

    // DOM Elements
    const elements = {
        form: null,
        tabButtons: [],
        tabContents: [],
        successAlert: null,
        errorAlert: null,
        errorAlertMessage: null,
        unsavedIndicator: null,
        saveBtn: null,
        saveBtnFooter: null,
        fileInputs: {}
    };

    /**
     * Initialize the page
     */
    async function init() {
        console.log('Initializing Institution Settings page');
        
        // Cache DOM elements
        cacheElements();
        
        // Setup event listeners
        setupEventListeners();
        
        // Get institution UUID from authenticated user or fallback storage
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

        // Load settings from API
        await loadSettings();
    }

    /**
     * Cache DOM elements for faster access
     */
    function cacheElements() {
        elements.form = document.getElementById('institutionSettingsForm');
        elements.successAlert = document.getElementById('successAlert');
        elements.errorAlert = document.getElementById('errorAlert');
        elements.errorAlertMessage = document.getElementById('errorAlertMessage');
        elements.unsavedIndicator = document.getElementById('unsavedIndicator');
        elements.saveBtn = document.getElementById('saveSettingsBtn');
        elements.saveBtnFooter = document.getElementById('saveSettingsBtnFooter');

        // Tab buttons and contents
        elements.tabButtons = Array.from(document.querySelectorAll('.tab-button'));
        elements.tabContents = Array.from(document.querySelectorAll('.tab-content'));

        // File inputs
        elements.fileInputs = {
            logo: document.getElementById('logoUpload'),
            banner: document.getElementById('bannerUpload')
        };
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Tab navigation
        elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(btn.dataset.tab);
            });
        });

        // Form field changes
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('change', () => {
                markFieldDirty(field.name);
            });
            field.addEventListener('input', () => {
                markFieldDirty(field.name);
            });
        });

        // Save buttons
        elements.saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveSettings();
        });
        elements.saveBtnFooter.addEventListener('click', (e) => {
            e.preventDefault();
            saveSettings();
        });

        // File upload handlers
        elements.fileInputs.logo.addEventListener('change', handleLogoUpload);
        elements.fileInputs.banner.addEventListener('change', handleBannerUpload);

        // Prevent form submission on Enter
        elements.form.addEventListener('submit', (e) => e.preventDefault());

        // File input button clicks
        document.querySelectorAll('.file-input-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const fileInput = this.parentElement.querySelector('input[type="file"]');
                fileInput.click();
            });
        });
    }

    /**
     * Switch to a tab
     */
    function switchTab(tabName) {
        // Deactivate all tabs
        elements.tabButtons.forEach(btn => btn.classList.remove('active'));
        elements.tabContents.forEach(content => content.classList.remove('active'));

        // Activate selected tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    /**
     * Load settings from API
     */
    async function loadSettings() {
        try {
            state.isLoading = true;
            const response = await API.get(`${API_ENDPOINTS.INSTITUTIONS}/${state.institutionUUID}/settings`);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load settings');
            }

            // Extract actual settings from nested response.data.data
            const settings = (response.data && response.data.data) ? response.data.data : response.data || {};
            state.initialSettings = JSON.parse(JSON.stringify(settings));
            state.currentSettings = JSON.parse(JSON.stringify(settings));
            state.dirtyFields.clear();

            // Populate form fields
            populateFormFields(settings);
            
            // Clear any existing errors
            hideError();
            hideSuccess();
        } catch (error) {
            console.error('Error loading settings:', error);
            showError('Failed to load institution settings: ' + error.message);
        } finally {
            state.isLoading = false;
        }
    }

    /**
     * Populate form fields with settings data
     */
    function populateFormFields(settings) {
        // Text and select fields
        Object.keys(settings).forEach(key => {
            const field = elements.form.elements[key];
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!settings[key];
                } else {
                    field.value = settings[key] || '';
                }
            }
        });

        // Update file previews if URLs exist
        if (settings.logo_url) {
            showLogoPreview(settings.logo_url);
            document.getElementById('logoUrl').textContent = settings.logo_url;
        }
        if (settings.banner_url) {
            showBannerPreview(settings.banner_url);
            document.getElementById('bannerUrl').textContent = settings.banner_url;
        }
    }

    /**
     * Mark a field as dirty (modified)
     */
    function markFieldDirty(fieldName) {
        state.dirtyFields.add(fieldName);
        updateUnsavedIndicator();
        updateSaveButtonState();
    }

    /**
     * Update unsaved indicator visibility
     */
    function updateUnsavedIndicator() {
        if (state.dirtyFields.size > 0) {
            elements.unsavedIndicator.classList.add('show');
        } else {
            elements.unsavedIndicator.classList.remove('show');
        }
    }

    /**
     * Update save button state
     */
    function updateSaveButtonState() {
        const hasChanges = state.dirtyFields.size > 0;
        elements.saveBtn.disabled = !hasChanges || state.isSaving;
        elements.saveBtnFooter.disabled = !hasChanges || state.isSaving;
    }

    /**
     * Handle logo file upload
     */
    async function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const validation = validateFileUpload(file);
        if (!validation.valid) {
            showFieldError('logo_file', validation.error);
            return;
        }

        // Show local preview
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('logoPreview').src = e.target.result;
            document.getElementById('logoPreview').classList.add('show');
        };
        reader.readAsDataURL(file);

        markFieldDirty('logo_file');
        
        // Upload file to server
        await uploadFile(file, 'logo_url');
    }

    /**
     * Handle banner file upload
     */
    async function handleBannerUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const validation = validateFileUpload(file);
        if (!validation.valid) {
            showFieldError('banner_file', validation.error);
            return;
        }

        // Show local preview
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('bannerPreview').src = e.target.result;
            document.getElementById('bannerPreview').classList.add('show');
        };
        reader.readAsDataURL(file);

        markFieldDirty('banner_file');
        
        // Upload file to server
        await uploadFile(file, 'banner_url');
    }

    /**
     * Upload file to server
     */
    async function uploadFile(file, fieldName) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', 'institutions');

            // Use the API upload method
            const response = await API.upload(API_ENDPOINTS.FILE_UPLOAD, formData);

            if (!response.success || !response.data?.url) {
                throw new Error(response.message || 'Upload failed');
            }

            // Store the file URL in form (will be sent on save)
            const fileUrl = response.data.url;
            
            // Update the form field with the server URL (create hidden input if missing)
            let formField = elements.form.elements[fieldName];
            if (!formField) {
                formField = document.createElement('input');
                formField.type = 'hidden';
                formField.name = fieldName;
                elements.form.appendChild(formField);
                // refresh elements.form.elements reference is implicit
            }
            formField.value = fileUrl;

            // Show success and update preview
            if (fieldName === 'logo_url') {
                showLogoPreview(fileUrl);
                document.getElementById('logoUrl').textContent = fileUrl;
            } else if (fieldName === 'banner_url') {
                showBannerPreview(fileUrl);
                document.getElementById('bannerUrl').textContent = fileUrl;
            }

            markFieldDirty(fieldName);

        } catch (error) {
            console.error(`File upload error (${fieldName}):`, error);
            showFieldError(fieldName === 'logo_url' ? 'logo_file' : 'banner_file', 
                          error.message || 'File upload failed');
        }
    }

    /**
     * Show logo preview
     */
    function showLogoPreview(url) {
        const preview = document.getElementById('logoPreview');
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        preview.src = fullUrl;
        preview.classList.add('show');
    }

    /**
     * Show banner preview
     */
    function showBannerPreview(url) {
        const preview = document.getElementById('bannerPreview');
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        preview.src = fullUrl;
        preview.classList.add('show');
    }

    /**
     * Validate file upload
     */
    function validateFileUpload(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png'];

        if (file.size > maxSize) {
            return { valid: false, error: 'File size exceeds 5MB limit' };
        }

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Only JPG and PNG files are allowed' };
        }

        return { valid: true };
    }

    /**
     * Validate form fields
     */
    function validateForm() {
        const errors = {};
        const form = elements.form;

        // School name is required
        if (!form.elements.school_name.value.trim()) {
            errors.school_name = 'School name is required';
        }

        // Academic year months validation
        if (!form.elements.academic_year_start_month.value) {
            errors.academic_year_start_month = 'Start month is required';
        }
        if (!form.elements.academic_year_end_month.value) {
            errors.academic_year_end_month = 'End month is required';
        }

        // Validate start month < end month
        const startMonth = parseInt(form.elements.academic_year_start_month.value);
        const endMonth = parseInt(form.elements.academic_year_end_month.value);
        if (startMonth && endMonth && startMonth >= endMonth) {
            errors.academic_year_start_month = 'Start month must be before end month';
        }

        // Color format validation (hex code)
        const primaryColor = form.elements.theme_primary_color.value;
        if (primaryColor && !isValidHexColor(primaryColor)) {
            errors.theme_primary_color = 'Invalid color format';
        }

        const secondaryColor = form.elements.theme_secondary_color.value;
        if (secondaryColor && !isValidHexColor(secondaryColor)) {
            errors.theme_secondary_color = 'Invalid color format';
        }

        // URL validation for social media
        const socialFields = ['social_facebook', 'social_twitter', 'social_instagram', 'social_linkedin'];
        socialFields.forEach(field => {
            const value = form.elements[field].value;
            if (value && !isValidURL(value)) {
                errors[field] = 'Invalid URL format';
            }
        });

        state.errors = errors;
        displayFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    /**
     * Check if string is valid hex color
     */
    function isValidHexColor(color) {
        return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(color) || color.startsWith('#');
    }

    /**
     * Check if string is valid URL
     */
    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Display field-level errors
     */
    function displayFieldErrors(errors) {
        // Clear all previous error states
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('has-error');
            const errorMsg = group.querySelector('.error-message');
            if (errorMsg) errorMsg.textContent = '';
        });

        // Display new errors
        Object.keys(errors).forEach(fieldName => {
            const field = elements.form.elements[fieldName];
            if (field) {
                const formGroup = field.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.add('has-error');
                    const errorMsg = formGroup.querySelector('.error-message');
                    if (errorMsg) {
                        errorMsg.textContent = errors[fieldName];
                    }
                }
            }
        });
    }

    /**
     * Show field error
     */
    function showFieldError(fieldName, message) {
        const field = elements.form.elements[fieldName];
        if (field) {
            const formGroup = field.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('has-error');
                const errorMsg = formGroup.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.textContent = message;
                }
            }
        }
    }

    /**
     * Collect form data
     */
    function collectFormData() {
        const formData = new FormData(elements.form);
        const data = {};

        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            if (key.endsWith('_file')) {
                // Skip file inputs - they're handled via upload
                continue;
            }

            if (value === 'on') {
                // Checkbox
                data[key] = true;
            } else if (value === 'off' || value === '') {
                // Empty or unchecked
                data[key] = key.includes('allow_') || key.includes('require_') ? false : value;
            } else {
                data[key] = value;
            }
        }

        // Ensure checkboxes are properly captured
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            data[checkbox.name] = checkbox.checked;
        });

        // Include file URLs if they were uploaded
        const logoUrlField = elements.form.elements['logo_url'];
        const bannerUrlField = elements.form.elements['banner_url'];
        if (logoUrlField?.value) data.logo_url = logoUrlField.value;
        if (bannerUrlField?.value) data.banner_url = bannerUrlField.value;

        return data;
    }

    /**
     * Save settings
     */
    async function saveSettings() {
        // Validate form
        if (!validateForm()) {
            showError('Please fix the errors below and try again');
            return;
        }

        try {
            state.isSaving = true;
            elements.saveBtn.classList.add('loading');
            elements.saveBtnFooter.classList.add('loading');
            updateSaveButtonState();

            const data = collectFormData();

            // Send to API
            const response = await API.put(
                `${API_ENDPOINTS.INSTITUTIONS}/${state.institutionUUID}/settings`,
                data
            );

            if (!response.success) {
                throw new Error(response.message || 'Failed to save settings');
            }

            // Update initial settings (clear dirty state)
            state.initialSettings = JSON.parse(JSON.stringify(data));
            state.dirtyFields.clear();
            updateUnsavedIndicator();
            updateSaveButtonState();

            // Show success message
            showSuccess('Institution settings saved successfully!');

        } catch (error) {
            console.error('Error saving settings:', error);
            
            // Check if it's a validation error from backend
            if (error.response && error.response.status === 400) {
                const errors = error.response.data?.errors || {};
                displayFieldErrors(errors);
                showError('Please fix the validation errors and try again');
            } else {
                showError('Failed to save settings: ' + error.message);
            }
        } finally {
            state.isSaving = false;
            elements.saveBtn.classList.remove('loading');
            elements.saveBtnFooter.classList.remove('loading');
            updateSaveButtonState();
        }
    }


    /**
     * Show success alert
     */
    function showSuccess(message) {
        elements.successAlert.textContent = '✓ ' + message;
        elements.successAlert.style.display = 'block';
        hideError();

        // Auto-hide after 5 seconds
        setTimeout(() => {
            elements.successAlert.style.display = 'none';
        }, 5000);
    }

    /**
     * Show error alert
     */
    function showError(message) {
        elements.errorAlertMessage.textContent = message;
        elements.errorAlert.style.display = 'block';
        elements.successAlert.style.display = 'none';
    }

    /**
     * Hide error alert
     */
    function hideError() {
        elements.errorAlert.style.display = 'none';
    }

    /**
     * Hide success alert
     */
    function hideSuccess() {
        elements.successAlert.style.display = 'none';
    }

    /**
     * Public API
     */
    return {
        init: init
    };
})();

/**
 * Page initialization
 */
document.addEventListener('page:loaded', (e) => {
    if (e.detail && e.detail.page === 'institution-settings') {
        InstitutionSettings.init();
    }
});

// Also initialize if this script is loaded directly (not via page router)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('institutionSettingsForm')) {
            InstitutionSettings.init();
        }
    });
} else {
    if (document.getElementById('institutionSettingsForm')) {
        InstitutionSettings.init();
    }
}
