/**
 * Resend Password Reset Link Handler
 * Allows users to request a new reset link if previous one expired or wasn't received
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
const resendResetForm = document.getElementById('resendResetForm');
const alertContainer = document.getElementById('alertContainer');
const resendBtn = document.getElementById('resendBtn');

// Track last request time to prevent spam
let lastRequestTime = 0;
const REQUEST_COOLDOWN = 60000; // 60 seconds

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

    // Auto-remove after 6 seconds
    setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 300);
    }, 6000);
}

/**
 * Format time remaining for cooldown
 */
function formatTimeRemaining(ms) {
    const seconds = Math.ceil(ms / 1000);
    return seconds > 0 ? `${seconds} second${seconds !== 1 ? 's' : ''}` : '0 seconds';
}

/**
 * Handle Resend Form Submission
 */
resendResetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnText = resendBtn.querySelector('.btn-text');
    const btnLoader = resendBtn.querySelector('.btn-loader');
    const email = document.getElementById('email').value.trim();

    // Validate email
    if (!email) {
        showAlert('Please enter your email address', 'error');
        return;
    }

    // Check cooldown period
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < REQUEST_COOLDOWN && lastRequestTime > 0) {
        const timeRemaining = REQUEST_COOLDOWN - timeSinceLastRequest;
        showAlert(
            `Please wait ${formatTimeRemaining(timeRemaining)} before requesting another reset link`,
            'warning'
        );
        return;
    }

    // Disable button
    resendBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
        // Call forgot password API (same endpoint as forgot-password page)
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            // Update last request time
            lastRequestTime = Date.now();
            
            showAlert(
                data.message || 'A new password reset link has been sent to your email. Please check your inbox and spam folder.',
                'success'
            );
            
            // Clear form
            resendResetForm.reset();

            // Show countdown message
            setTimeout(() => {
                showAlert(
                    'If you still don\'t receive the email within 5 minutes, please contact support.',
                    'info'
                );
            }, 3000);

        } else {
            // Handle specific error cases
            if (response.status === 404) {
                showAlert(
                    'No account found with this email address. Please check your email and try again.',
                    'error'
                );
            } else if (response.status === 429) {
                showAlert(
                    data.message || 'Too many requests. Please wait a few minutes before trying again.',
                    'error'
                );
            } else {
                showAlert(
                    data.message || 'Failed to send reset link. Please try again.',
                    'error'
                );
            }
        }
    } catch (error) {
        console.error('Resend reset error:', error);
        showAlert(
            'A network error occurred. Please check your connection and try again.',
            'error'
        );
    } finally {
        // Re-enable button
        resendBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
    }
});

/**
 * Auto-fill email from URL parameter if provided
 */
const urlParams = new URLSearchParams(window.location.search);
const emailParam = urlParams.get('email');
if (emailParam) {
    document.getElementById('email').value = decodeURIComponent(emailParam);
}
