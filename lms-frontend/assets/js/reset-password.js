/**
 * Reset Password Handler
 * Handles password reset when user clicks the email link with token
 */

// Get reset token from URL (can be done before DOM ready)
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Prevent authenticated users from accessing this page
    if (Auth.isAuthenticated()) {
        Auth.redirectToDashboard();
        return;
    }
    
    initResetPassword();
});

function initResetPassword() {
    // DOM Elements
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const alertContainer = document.getElementById('alertContainer');
    const updatePasswordBtn = document.getElementById('updatePasswordBtn');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    const strengthBarFill = document.getElementById('strengthBarFill');
    const strengthText = document.getElementById('strengthText');

    // Validate token presence
    if (!resetToken) {
        showAlert(
            'Invalid or missing reset token. Please request a new password reset link.',
            'error'
        );
        const resetTokenInput = document.getElementById('resetToken');
        if (resetTokenInput) resetTokenInput.value = '';
        if (updatePasswordBtn) updatePasswordBtn.disabled = true;
        
        // Redirect to forgot password page after 3 seconds
        setTimeout(() => {
            window.location.href = 'forgot-password.html';
        }, 3000);
    } else {
        const resetTokenInput = document.getElementById('resetToken');
        if (resetTokenInput) resetTokenInput.value = resetToken;
    }

    // Password input event listener
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value, passwordStrength, strengthBarFill, strengthText);
        });
    }

    // Toggle Password Visibility
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

    // Real-time password match validation
    if (confirmPasswordInput && newPasswordInput) {
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
    }

    // Form submission
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', (e) => handleResetPassword(e, updatePasswordBtn, newPasswordInput, confirmPasswordInput, alertContainer));
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
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
function updatePasswordStrength(password, passwordStrength, strengthBarFill, strengthText) {
    if (!password || !passwordStrength) {
        if (passwordStrength) passwordStrength.style.display = 'none';
        return;
    }
    
    passwordStrength.style.display = 'block';
    const strength = calculatePasswordStrength(password);
    
    if (strengthBarFill) strengthBarFill.style.width = strength + '%';
    
    // Update color and text based on strength
    if (strength < 40) {
        if (strengthBarFill) strengthBarFill.style.background = 'var(--error)';
        if (strengthText) {
            strengthText.textContent = 'Weak password';
            strengthText.style.color = 'var(--error)';
        }
    } else if (strength < 70) {
        if (strengthBarFill) strengthBarFill.style.background = 'var(--warning)';
        if (strengthText) {
            strengthText.textContent = 'Fair password';
            strengthText.style.color = 'var(--warning)';
        }
    } else {
        if (strengthBarFill) strengthBarFill.style.background = 'var(--success)';
        if (strengthText) {
            strengthText.textContent = 'Strong password';
            strengthText.style.color = 'var(--success)';
        }
    }
}

/**
 * Handle Reset Password Form Submission
 */
async function handleResetPassword(e, updatePasswordBtn, newPasswordInput, confirmPasswordInput, alertContainer) {
    e.preventDefault();

    const btnText = updatePasswordBtn?.querySelector('.btn-text');
    const btnLoader = updatePasswordBtn?.querySelector('.btn-loader');
    const token = document.getElementById('resetToken')?.value;
    const password = newPasswordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

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
    if (updatePasswordBtn) {
        updatePasswordBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-block';
    }

    try {
        // Call reset password API
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
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
            const resetPasswordForm = document.getElementById('resetPasswordForm');
            if (resetPasswordForm) resetPasswordForm.reset();
            const passwordStrength = document.getElementById('passwordStrength');
            if (passwordStrength) passwordStrength.style.display = 'none';

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
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
                    window.location.href = 'forgot-password.html';
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
        if (updatePasswordBtn) {
            updatePasswordBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline-block';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }
}
