// My Profile Page JavaScript - Tab Navigation and Functionality

function initializeProfile() {
  console.log("My Profile page initialized");
  
  // Tab Navigation
  const profileTabs = document.querySelectorAll('.profile-tab');
  const profileTabContents = document.querySelectorAll('.profile-tab-content');
  
  profileTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      profileTabs.forEach(t => t.classList.remove('active'));
      profileTabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Show corresponding tab content
      const targetContent = document.getElementById(`${targetTab}-tab`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
  
  // Change Profile Photo
  const changePhotoBtn = document.getElementById('changePhotoBtn');
  if (changePhotoBtn) {
    changePhotoBtn.addEventListener('click', function() {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/png, image/jpeg, image/jpg';
      
      fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
          }
          
          // Preview the image
          const reader = new FileReader();
          reader.onload = function(event) {
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
              profileImage.src = event.target.result;
            }
          };
          reader.readAsDataURL(file);
          
          // TODO: Upload to server
          console.log('Uploading profile photo:', file.name);
        }
      });
      
      fileInput.click();
    });
  }
  
  // Password Visibility Toggle
  const togglePasswordBtns = document.querySelectorAll('.btn-toggle-password');
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const passwordInput = document.getElementById(targetId);
      const icon = this.querySelector('i');
      
      if (passwordInput) {
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          passwordInput.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
  });
  
  // Update Password
  const updatePasswordBtn = document.querySelector('.btn-update-password');
  if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', function() {
      const currentPassword = document.getElementById('current-password')?.value;
      const newPassword = document.getElementById('new-password')?.value;
      const confirmPassword = document.getElementById('confirm-password')?.value;
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all password fields');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
      }
      
      // TODO: Validate password strength and update on server
      alert('Password updated successfully!');
      
      // Clear password fields
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
    });
  }
  
  // Disable 2FA
  const disable2FABtn = document.querySelector('.btn-disable-2fa');
  if (disable2FABtn) {
    disable2FABtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) {
        alert('2FA has been disabled. You can re-enable it anytime.');
        
        // TODO: Disable 2FA on server
        console.log('Disabling 2FA');
      }
    });
  }
  
  // Regenerate Backup Codes
  const regenerateCodesBtn = document.querySelector('.btn-regenerate-codes');
  if (regenerateCodesBtn) {
    regenerateCodesBtn.addEventListener('click', function() {
      if (confirm('Regenerating backup codes will invalidate your current codes. Continue?')) {
        alert('New backup codes generated. Please save them in a secure location.');
        
        // TODO: Generate new codes on server
        console.log('Regenerating backup codes');
      }
    });
  }
  
  // Revoke Session
  const revokeSessionBtns = document.querySelectorAll('.btn-revoke-session');
  revokeSessionBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const sessionItem = this.closest('.session-item');
      const deviceName = sessionItem.querySelector('h4').textContent;
      
      if (confirm(`Revoke access for ${deviceName}?`)) {
        sessionItem.remove();
        alert('Session revoked successfully');
        
        // TODO: Revoke session on server
        console.log('Revoking session for:', deviceName);
      }
    });
  });
  
  // Revoke All Sessions
  const revokeAllBtn = document.querySelector('.btn-revoke-all');
  if (revokeAllBtn) {
    revokeAllBtn.addEventListener('click', function() {
      if (confirm('Sign out from all other devices? You will remain logged in on this device.')) {
        const sessionItems = document.querySelectorAll('.session-item:not(.current)');
        sessionItems.forEach(item => item.remove());
        
        alert('All other sessions have been terminated');
        
        // TODO: Revoke all sessions on server
        console.log('Revoking all other sessions');
      }
    });
  }
  
  // Save Profile
  const saveProfileBtns = document.querySelectorAll('.btn-save-profile');
  saveProfileBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const activeTab = document.querySelector('.profile-tab.active');
      const tabName = activeTab ? activeTab.textContent.trim() : 'Profile';
      
      alert(`${tabName} saved successfully!`);
      
      // TODO: Save profile data to server
      console.log('Saving profile changes');
    });
  });
  
  // Cancel Changes
  const cancelBtns = document.querySelectorAll('.btn-cancel');
  cancelBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      if (confirm('Discard all changes?')) {
        alert('Changes discarded');
        
        // TODO: Reload original data
        console.log('Discarding changes');
      }
    });
  });
  
  // Toggle Switches (Preferences)
  const toggleSwitches = document.querySelectorAll('.preference-item .toggle-switch input[type="checkbox"]');
  toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', function() {
      const preferenceItem = this.closest('.preference-item');
      const preferenceName = preferenceItem.querySelector('h4').textContent;
      const status = this.checked ? 'enabled' : 'disabled';
      
      console.log(`${preferenceName} ${status}`);
      
      // TODO: Save preference to server
    });
  });
  
  // Load More Activities
  const loadMoreBtn = document.querySelector('.btn-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      alert('Loading more activities... (feature coming soon)');
      
      // TODO: Load more activity items from server
      console.log('Loading more activities');
    });
  }
  
  // Activity Filters
  const activityFilter = document.querySelector('.activity-filters .filter-select');
  if (activityFilter) {
    activityFilter.addEventListener('change', function() {
      const filterValue = this.value;
      console.log('Filtering activities by:', filterValue);
      
      // TODO: Filter activity timeline
    });
  }
  
  const dateInputs = document.querySelectorAll('.date-range-filter input[type="date"]');
  dateInputs.forEach(input => {
    input.addEventListener('change', function() {
      console.log('Date range changed');
      
      // TODO: Filter activities by date range
    });
  });
}

// Initialize on page load (for standalone page)
document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.profile-page')) {
    initializeProfile();
  }
});

// Initialize when dynamically loaded (for dashboard)
document.addEventListener('page:loaded', function(e) {
  if (e.detail && e.detail.page === 'myprofile') {
    initializeProfile();
  }
});
