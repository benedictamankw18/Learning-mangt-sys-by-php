/**
 * Reset Password Handler
 * Handles password reset when user clicks the email link with token
 */

// Check if user is already logged in
if (authManager.isAuthenticated()) {
    const user = authManager.getCurrentUser();
    const role = user.role;
    
    // Redirect to appropriate dashboard
    const dashboardMap = {
        'super_admin': 'superadmin/dashboard.html',
        'administrator': 'admin/dashboard.html',
        'teacher': 'teacher/dashboard.html',
        'student': 'student/dashboard.html',
        'parent': 'parent/dashboard.html'
    };
    
    if (dashboardMap[role]) {
        window.location.href = dashboardMap[role];
    }
}

// DOM Elements
const resetPasswordForm = document.getElementById('resetPasswordForm');
const alertContainer = document.getElementById('alertContainer');
const updatePasswordBtn = document.getElementById('updatePasswordBtn');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordStrength = document.getElementById('passwordStrength');
const strengthBarFill = document.getElementById('strengthBarFill');
const strengthText = document.getElementById('strengthText');

// Get reset token from URL
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// Validate token presence
if (!resetToken) {
    showAlert(
        'Invalid or missing reset token. Please request a new password reset link.',
        'error'
    );
    document.getElementById('resetToken').value = '';
    updatePasswordBtn.disabled = true;
    
    // Redirect to forgot password page after 3 seconds
    setTimeout(() => {
        window.location.href = 'forgot-password.html';
    }, 3000);
} else {
    document.getElementById('resetToken').value = resetToken;
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} slide-down`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    return Math.min(strength, 100);
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength(password) {
    if (!password) {
        passwordStrength.style.display = 'none';
        return;
    }
    
    passwordStrength.style.display = 'block';
    const strength = calculatePasswordStrength(password);
    
    strengthBarFill.style.width = strength + '%';
    
    // Update color and text based on strength
    if (strength < 40) {
        strengthBarFill.style.background = 'var(--error)';
        strengthText.textContent = 'Weak password';
        strengthText.style.color = 'var(--error)';
    } else if (strength < 70) {
        strengthBarFill.style.background = 'var(--warning)';
        strengthText.textContent = 'Fair password';
        strengthText.style.color = 'var(--warning)';
    } else {
        strengthBarFill.style.background = 'var(--success)';
        strengthText.textContent = 'Strong password';
        strengthText.style.color = 'var(--success)';
    }
}

/**
 * Password input event listener
 */
newPasswordInput.addEventListener('input', (e) => {
    updatePasswordStrength(e.target.value);
});

/**
 * Handle Reset Password Form Submission
 */
resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnText = updatePasswordBtn.querySelector('.btn-text');
    const btnLoader = updatePasswordBtn.querySelector('.btn-loader');
    const token = document.getElementById('resetToken').value;
    const password = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate token
    if (!token) {
        showAlert('Invalid reset token. Please request a new password reset link.', 'error');
        return;
    }

    // Validate passwords
    if (!password || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 8) {
        showAlert('Password must be at least 8 characters long', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match. Please try again.', 'error');
        confirmPasswordInput.value = '';
        confirmPasswordInput.focus();
        return;
    }

    // Check password strength
    const strength = calculatePasswordStrength(password);
    if (strength < 40) {
        showAlert('Your password is too weak. Please use a stronger password with a mix of letters, numbers, and symbols.', 'warning');
        return;
    }

    // Disable button
    updatePasswordBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
        // Call reset password API
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                password,
                confirm_password: confirmPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(
                data.message || 'Password has been reset successfully! Redirecting to login...',
                'success'
            );

            // Clear form
            resetPasswordForm.reset();
            passwordStrength.style.display = 'none';

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/auth/login.html';
            }, 2000);
        } else {
            // Handle specific error cases
            if (response.status === 400) {
                showAlert(
                    data.message || 'Invalid request. Please check your information and try again.',
                    'error'
                );
            } else if (response.status === 401 || response.status === 403) {
                showAlert(
                    'This reset link has expired or is invalid. Please request a new one.',
                    'error'
                );
                
                // Redirect to forgot password after 3 seconds
                setTimeout(() => {
                    window.location.href = '/auth/forgot-password.html';
                }, 3000);
            } else if (response.status === 404) {
                showAlert(
                    'Account not found. Please contact support if you need assistance.',
                    'error'
                );
            } else {
                showAlert(
                    data.message || 'Failed to reset password. Please try again.',
                    'error'
                );
            }
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showAlert(
            'A network error occurred. Please check your connection and try again.',
            'error'
        );
    } finally {
        // Re-enable button
        updatePasswordBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
    }
});

/**
 * Toggle Password Visibility
 */
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = this.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

/**
 * Real-time password match validation
 */
confirmPasswordInput.addEventListener('input', function() {
    const password = newPasswordInput.value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = 'var(--error)';
    } else if (confirmPassword && password === confirmPassword) {
        this.style.borderColor = 'var(--success)';
    } else {
        this.style.borderColor = '';
    }
});
