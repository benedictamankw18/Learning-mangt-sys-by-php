// Settings Page JavaScript - Tab Navigation and Functionality

function initializeSettings() {
  console.log("Settings page initialized");

  function showPopupMessage(message, title) {
    if (typeof window.showModal === 'function') {
      window.showModal(title || 'Notice', message, function () {});
      return;
    }
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'info');
      return;
    }
    console.log(message);
  }
  
  // Tab Navigation
  const tabButtons = document.querySelectorAll('.settings-tab');
  const tabContents = document.querySelectorAll('.settings-tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');

      // Remove active class from all tabs and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Show corresponding tab content
      const targetContent = document.getElementById(`${targetTab}-tab`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
  
  // Save Settings Button Handler
  const saveButtons = document.querySelectorAll('.btn-save-settings');
  saveButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Get the current active tab
      const activeTab = document.querySelector('.settings-tab.active');
      const tabName = activeTab ? activeTab.textContent.trim() : 'Settings';
      
      // Show success message (you can replace this with actual save logic)
      showPopupMessage(`${tabName} settings saved successfully!`, 'Settings Saved');
      
      // TODO: Add actual API call to save settings
      // Example:
      // saveSettingsToServer(tabName);
    });
  });
  
  // Reset Settings Button Handler
  const resetButtons = document.querySelectorAll('.btn-reset-settings');
  resetButtons.forEach(button => {
    button.addEventListener('click', function() {
      const activeTab = document.querySelector('.settings-tab.active');
      const tabName = activeTab ? activeTab.textContent.trim() : 'Settings';
      
      confirm_('Reset Settings', `Are you sure you want to reset ${tabName} settings to default values?`, () => {
        showPopupMessage('Settings reset to default values', 'Settings Reset');
        
        // TODO: Add actual reset logic
        // resetSettingsToDefault(tabName);
      });
    });
  });
  
  // Toggle Switch Handler (for notifications and other toggles)
  const toggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
  toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', function() {
      const label = this.closest('.notification-item, .form-group')?.querySelector('.notification-label span, span');
      const setting = label ? label.textContent.trim() : 'Setting';
      const status = this.checked ? 'enabled' : 'disabled';
      
      console.log(`${setting} ${status}`);
      
      // TODO: Add logic to save toggle state
      // saveToggleSetting(setting, this.checked);
    });
  });
  
  // Theme Selector Handler
  const themeCards = document.querySelectorAll('.theme-card');
  themeCards.forEach(card => {
    card.addEventListener('click', function() {
      // Remove active class from all theme cards
      themeCards.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked theme
      this.classList.add('active');
      
      const themeName = this.querySelector('span').textContent;
      console.log(`Theme changed to: ${themeName}`);
      
      // TODO: Apply theme to the application
      // applyTheme(themeName);
    });
  });
  
  // Display Mode Selector Handler
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all mode buttons
      modeButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked mode
      this.classList.add('active');
      
      const modeName = this.querySelector('span').textContent;
      console.log(`Display mode changed to: ${modeName}`);
      
      // TODO: Apply display mode
      // applyDisplayMode(modeName);
    });
  });
  
  // File Upload Handler (for school logo)
  const uploadButton = document.querySelector('.btn-upload');
  if (uploadButton) {
    uploadButton.addEventListener('click', function() {
      // Create a hidden file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/png, image/jpeg, image/jpg';
      
      fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            showPopupMessage('File size must be less than 5MB', 'Upload Error');
            return;
          }
          
          // Preview the image
          const reader = new FileReader();
          reader.onload = function(event) {
            const currentLogo = document.querySelector('.current-logo img');
            if (currentLogo) {
              currentLogo.src = event.target.result;
            }
          };
          reader.readAsDataURL(file);
          
          // TODO: Upload to server
          // uploadLogo(file);
        }
      });
      
      fileInput.click();
    });
  }
  
  // Maintenance Button Handlers
  const maintenanceButtons = document.querySelectorAll('.maintenance-btn');
  maintenanceButtons.forEach(button => {
    button.addEventListener('click', function() {
      const actionName = this.querySelector('h4').textContent;
      
      if (confirm(`Are you sure you want to run: ${actionName}?`)) {
        showPopupMessage(`Running ${actionName}... This may take a few moments.`, 'Maintenance');
        
        // TODO: Execute maintenance task
        // runMaintenanceTask(actionName);
      }
    });
  });
  
  // Backup Buttons
  const backupButton = document.querySelector('.btn-backup');
  if (backupButton) {
    backupButton.addEventListener('click', function() {
      if (confirm('Create a backup now? This will back up all system data.')) {
        showPopupMessage('Backup started... You will be notified when complete.', 'Backup');
        
        // TODO: Trigger backup
        // createBackup();
      }
    });
  }
  
  const restoreButton = document.querySelector('.btn-restore');
  if (restoreButton) {
    restoreButton.addEventListener('click', function() {
      if (confirm('⚠️ WARNING: Restoring from backup will overwrite current data. Continue?')) {
        // Create file input for backup file
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.sql, .backup, .bak';
        
        fileInput.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file) {
            showPopupMessage(`Restoring from ${file.name}... System will restart after completion.`, 'Restore Backup');
            
            // TODO: Upload and restore backup
            // restoreBackup(file);
          }
        });
        
        fileInput.click();
      }
    });
  }
  
  // Integration Connect/Disconnect Buttons
  const connectButtons = document.querySelectorAll('.btn-connect');
  connectButtons.forEach(button => {
    button.addEventListener('click', function() {
      const integrationName = this.closest('.integration-item').querySelector('h4').textContent;
      
      showPopupMessage(`Connecting to ${integrationName}... You will be redirected to authorize.`, 'Integration');
      
      // TODO: Handle OAuth connection
      // connectIntegration(integrationName);
    });
  });
  
  const disconnectButtons = document.querySelectorAll('.btn-disconnect');
  disconnectButtons.forEach(button => {
    button.addEventListener('click', function() {
      const integrationName = this.closest('.integration-item').querySelector('h4').textContent;
      
      if (confirm(`Disconnect from ${integrationName}? This will disable all integration features.`)) {
        showPopupMessage(`Disconnected from ${integrationName}`, 'Integration');
        
        // Change button state
        const integrationItem = this.closest('.integration-item');
        integrationItem.classList.remove('active');
        this.classList.remove('btn-disconnect');
        this.classList.add('btn-connect');
        this.textContent = 'Connect';
        
        const status = integrationItem.querySelector('span');
        if (status) {
          status.textContent = 'Not connected';
        }
        
        // TODO: Disconnect integration on server
        // disconnectIntegration(integrationName);
      }
    });
  });
  
  // Role Edit Buttons
  const editRoleButtons = document.querySelectorAll('.btn-edit-role');
  editRoleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const roleName = this.closest('.role-card').querySelector('h4').textContent;
      
      showPopupMessage(`Edit permissions for ${roleName} role (feature coming soon)`, 'Coming Soon');
      
      // TODO: Open role permissions modal
      // openRolePermissionsModal(roleName);
    });
  });
  
  // Add Program Button
  const addProgramButton = document.querySelector('.btn-add-program');
  if (addProgramButton) {
    addProgramButton.addEventListener('click', function() {
      showPopupMessage('Add new program (feature coming soon)', 'Coming Soon');
      
      // TODO: Open add program modal
      // openAddProgramModal();
    });
  }
  
  // Program Edit Buttons
  const programEditButtons = document.querySelectorAll('.program-item .btn-icon-action');
  programEditButtons.forEach(button => {
    button.addEventListener('click', function() {
      const programName = this.closest('.program-item').querySelector('span').textContent;
      
      showPopupMessage(`Edit ${programName} program (feature coming soon)`, 'Coming Soon');
      
      // TODO: Open edit program modal
      // openEditProgramModal(programName);
    });
  });
}

// Initialize on page load (for standalone page)
document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.settings-page')) {
    initializeSettings();
  }
});

// Initialize when dynamically loaded (for dashboard)
document.addEventListener('page:loaded', function(e) {
  if (e.detail && e.detail.page === 'settings') {
    initializeSettings();
  }
});
