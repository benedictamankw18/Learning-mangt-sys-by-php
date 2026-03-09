/**
 * Forgot Password Handler
 * Handles password recovery - sends reset link to user's email
 */

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    // Prevent authenticated users from accessing this page
    if (Auth.isAuthenticated()) {
        Auth.redirectToDashboard();
        return;
    }
    
    initForgotPassword();
});

function initForgotPassword() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetBtn = document.getElementById('resetBtn');
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
}

// DOM Elements
const alertContainer = document.getElementById('alertContainer');

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
 * Handle Forgot Password Form Submission
 */
async function handleForgotPassword(e) {
    e.preventDefault();

    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetBtn = document.getElementById('resetBtn');
    const btnText = resetBtn.querySelector('.btn-txt');
    const btnLoader = resetBtn.querySelector('.btn-loader');
    const email = document.getElementById('email').value.trim();

    // Validate email
    if (!email) {
        showAlert('Please enter your email address', 'error');
        return;
    }

    // Disable button
    resetBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
        // Call forgot password API
        const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(
                data.message || 'Password reset link has been sent to your email. Please check your inbox.',
                'success'
            );
            
            // Clear form
            forgotPasswordForm.reset();

            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showAlert(
                data.message || 'Failed to send reset link. Please try again.',
                'error'
            );
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showAlert(
            'An error occurred. Please try again later.',
            'error'
        );
    } finally {
        // Re-enable button
        resetBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
    }
}
