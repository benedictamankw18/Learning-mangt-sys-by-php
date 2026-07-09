/**
 * System Settings Page Script
 * Handles system-wide configuration management including:
 * - Site settings (name, URL, timezone)
 * - Email configuration (SMTP settings)
 * - Authentication settings (registration, verification)
 * - Third-party integrations (Google Analytics, etc.)
 * 
 * Requires: SystemAPI (from api.js)
 */
(function() {
    'use strict';
    
    console.log('System settings script loaded');
    
    // Ensure SystemAPI is available
    if (typeof SystemAPI === 'undefined') {
        console.error('SystemAPI not found! Make sure api.js is loaded before system.js');
        return;
    }
    
    // Listen for page load event from hash router
    document.addEventListener('page:loaded', function(e) {
        if (e.detail && e.detail.page === 'system') {
            console.log('System page loaded via event, initializing...');
            requestAnimationFrame(() => {
                setTimeout(() => {
                    initializeSystemSettings();
                }, 10);
            });
        }
    });
    
    // Also try to initialize on script load (for initial page load)
    requestAnimationFrame(() => {
        setTimeout(() => {
            initializeSystemSettings();
        }, 10);
    });
    
    function initializeSystemSettings(retryCount = 0) {
        console.log('initializeSystemSettings called, retry:', retryCount);
        
        // Tab switching
        const tabs = document.querySelectorAll('.settings-tab');
        const panels = document.querySelectorAll('.settings-panel');
        
        console.log('Found tabs:', tabs.length);
        console.log('Found panels:', panels.length);
        
        if (tabs.length === 0 || panels.length === 0) {
            if (retryCount < 10) {
                console.warn('Settings page elements not found, retrying...', retryCount + 1);
                setTimeout(() => initializeSystemSettings(retryCount + 1), 50);
            } else {
                console.error('Failed to find settings page elements after 10 retries');
            }
            return;
        }

        // Remove any existing event listeners by cloning and replacing (prevents duplicate listeners)
        tabs.forEach(tab => {
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
        });
        
        // Reselect tabs after cloning
        const freshTabs = document.querySelectorAll('.settings-tab');
        
        freshTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update tabs
                freshTabs.forEach(t => t.classList.remove('active-tab'));
                tab.classList.add('active-tab');
                
                // Update panels
                panels.forEach(p => p.classList.remove('active-panel'));
                const targetPanel = document.getElementById(`tab-${targetTab}`);
                if (targetPanel) targetPanel.classList.add('active-panel');
            });
        });
        
        // Load settings
        async function loadSettings() {
        try {
            const response = await SystemAPI.getSettings();
            const settings = response.data || {};
            
            console.log('Settings loaded:', settings);
            
            // Populate forms
            if (settings.site_name) document.getElementById('site_name').value = settings.site_name;
            if (settings.site_url) document.getElementById('site_url').value = settings.site_url;
            if (settings.timezone) document.getElementById('timezone').value = settings.timezone;
            
            if (settings.smtp_host) document.getElementById('smtp_host').value = settings.smtp_host;
            if (settings.smtp_port) document.getElementById('smtp_port').value = settings.smtp_port;
            if (settings.from_address) document.getElementById('from_address').value = settings.from_address;
            
            if (settings.allow_registration !== undefined) {
                document.getElementById('allow_registration').value = settings.allow_registration ? '1' : '0';
            }
            if (settings.require_verification !== undefined) {
                document.getElementById('require_verification').value = settings.require_verification ? '1' : '0';
            }
            
            if (settings.ga_id) document.getElementById('ga_id').value = settings.ga_id;
            if (settings.integrations_note) document.getElementById('integrations_note').value = settings.integrations_note;
            
            // Update last saved time
            if (settings.updated_at) {
                document.getElementById('lastSavedTime').textContent = settings.updated_at;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        }
        
        // Save settings
        async function saveSettings(data, formButton) {
        try {
            formButton.disabled = true;
            formButton.innerHTML = '<span>Saving...</span>';
            
            console.log('Saving settings:', data);
            const response = await SystemAPI.saveSettings(data);
            console.log('Settings saved successfully:', response);
            
            if (typeof showToast === 'function') {
                showToast('Settings saved successfully', 'success');
            } else {
                alert('Settings saved successfully!');
            }
            
            await loadSettings();
        } catch (error) {
            console.error('Save failed:', error);
            const message = error.message || 'Failed to save settings';
            if (typeof showToast === 'function') {
                showToast(message, 'error');
            } else {
                alert('Error: ' + message);
            }
        } finally {
            formButton.disabled = false;
            formButton.innerHTML = '<span>Save Settings</span>';
        }
        }
        
        // Form handlers - attach only if elements exist
        // Clone forms to remove any existing event listeners
        const siteForm = document.getElementById('siteForm');
        if (siteForm) {
            const newSiteForm = siteForm.cloneNode(true);
            siteForm.parentNode.replaceChild(newSiteForm, siteForm);
            
            newSiteForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    site_name: document.getElementById('site_name').value.trim(),
                    site_url: document.getElementById('site_url').value.trim(),
                    timezone: document.getElementById('timezone').value.trim() || 'UTC'
                };
                await saveSettings(data, e.submitter);
            });
        }
        
        const emailForm = document.getElementById('emailForm');
        if (emailForm) {
            const newEmailForm = emailForm.cloneNode(true);
            emailForm.parentNode.replaceChild(newEmailForm, emailForm);
            
            newEmailForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    smtp_host: document.getElementById('smtp_host').value.trim(),
                    smtp_port: parseInt(document.getElementById('smtp_port').value),
                    from_address: document.getElementById('from_address').value.trim()
                };
                await saveSettings(data, e.submitter);
            });
        }
        
        const authForm = document.getElementById('authForm');
        if (authForm) {
            const newAuthForm = authForm.cloneNode(true);
            authForm.parentNode.replaceChild(newAuthForm, authForm);
            
            newAuthForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    allow_registration: document.getElementById('allow_registration').value === '1' ? 1 : 0,
                    require_verification: document.getElementById('require_verification').value === '1' ? 1 : 0
                };
                await saveSettings(data, e.submitter);
            });
        }
        
        const integrationsForm = document.getElementById('integrationsForm');
        if (integrationsForm) {
            const newIntegrationsForm = integrationsForm.cloneNode(true);
            integrationsForm.parentNode.replaceChild(newIntegrationsForm, integrationsForm);
            
            newIntegrationsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    ga_id: document.getElementById('ga_id').value.trim(),
                    integrations_note: document.getElementById('integrations_note').value.trim()
                };
                await saveSettings(data, e.submitter);
            });
        }
    
        // Load settings
        if (siteForm || emailForm || authForm || integrationsForm) {
            console.log('Loading settings from database...');
            loadSettings();
        } else {
            console.warn('No forms found to populate with settings');
        }
        
        console.log('System settings page ready');
    } // end initializeSystemSettings
})();