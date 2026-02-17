/* ============================================
   Login Page Logic
   Handle login form and quick login buttons
============================================ */

// Prevent authenticated users from accessing login page
document.addEventListener('DOMContentLoaded', () => {
    Auth.preventAuthAccess();
    initLoginPage();
});

/**
 * Initialize login page
 */
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const rememberCheckbox = document.getElementById('rememberMe');
    const loginBtn = document.getElementById('loginBtn');

    // Setup event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }

    // Setup quick login buttons
    setupQuickLoginButtons();

    // Focus on login input
    if (loginInput) {
        loginInput.focus();
    }

    // Auto-fill remembered login (optional)
    const rememberedLogin = localStorage.getItem('lms_remembered_login');
    if (rememberedLogin && loginInput) {
        loginInput.value = rememberedLogin;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();

    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('rememberMe');
    const loginBtn = document.getElementById('loginBtn');

    // Get form values
    const login = loginInput.value.trim();
    const password = passwordInput.value;
    const remember = rememberCheckbox ? rememberCheckbox.checked : false;

    // Validate inputs
    if (!login || !password) {
        showAlert('Please enter both login and password', ALERT_TYPES.ERROR);
        return;
    }

    // Show loading state
    setLoginButtonLoading(true);

    try {
        // Attempt login
        const result = await Auth.login({ login, password }, remember);

        // Save remembered login if checkbox is checked
        if (remember) {
            localStorage.setItem('lms_remembered_login', login);
        } else {
            localStorage.removeItem('lms_remembered_login');
        }

        // Show success message
        showAlert(result.message || 'Login successful!', ALERT_TYPES.SUCCESS);

        // Redirect to dashboard after short delay
        setTimeout(() => {
            Auth.redirectToDashboard(result.user.role);
        }, 800);

    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Login failed. Please try again.', ALERT_TYPES.ERROR);
        setLoginButtonLoading(false);
    }
}

/**
 * Setup quick login buttons for demo
 */
function setupQuickLoginButtons() {
    const quickButtons = document.querySelectorAll('.quick-btn');

    quickButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const role = e.currentTarget.dataset.role;
            
            if (role && DEMO_CREDENTIALS[role]) {
                await handleQuickLogin(role);
            }
        });
    });
}

/**
 * Handle quick login (demo)
 */
async function handleQuickLogin(role) {
    const credentials = DEMO_CREDENTIALS[role];
    
    if (!credentials) {
        showAlert('Demo credentials not found', ALERT_TYPES.ERROR);
        return;
    }

    // Fill form fields
    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');

    if (loginInput) loginInput.value = credentials.login;
    if (passwordInput) passwordInput.value = credentials.password;

    // Show loading state
    setLoginButtonLoading(true);

    try {
        // Attempt login
        const result = await Auth.login(credentials, false);

        // Show success message
        showAlert(`Logged in as ${role}!`, ALERT_TYPES.SUCCESS);

        // Redirect to dashboard
        setTimeout(() => {
            Auth.redirectToDashboard(result.user.role);
        }, 800);

    } catch (error) {
        console.error('Quick login error:', error);
        showAlert(error.message || 'Quick login failed. Please try again.', ALERT_TYPES.ERROR);
        setLoginButtonLoading(false);
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('#togglePassword i');

    if (!passwordInput || !toggleIcon) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

/**
 * Set login button loading state
 */
function setLoginButtonLoading(isLoading) {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn?.querySelector('.btn-text');
    const btnLoader = loginBtn?.querySelector('.btn-loader');

    if (!loginBtn) return;

    if (isLoading) {
        loginBtn.disabled = true;
        if (btnText) btnText.style.visibility = 'hidden';
        if (btnLoader) btnLoader.style.display = 'block';
    } else {
        loginBtn.disabled = false;
        if (btnText) btnText.style.visibility = 'visible';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = ALERT_TYPES.INFO) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} slide-down`;
    
    // Icon based on type
    let icon = 'fa-info-circle';
    if (type === ALERT_TYPES.SUCCESS) icon = 'fa-check-circle';
    if (type === ALERT_TYPES.ERROR) icon = 'fa-exclamation-circle';
    if (type === ALERT_TYPES.WARNING) icon = 'fa-exclamation-triangle';

    alert.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Find alert container or create one
    let alertContainer = document.getElementById('alertContainer');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(alertContainer);
    }

    // Add alert to container
    alertContainer.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.classList.add('fade-out');
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
}

/**
 * Handle forgot password
 */
// function handleForgotPassword(event) {
//     event.preventDefault();
    
//     // For demo purposes, just show an alert
//     showAlert('Password reset feature coming soon!', ALERT_TYPES.INFO);
    
//     // In production, you would redirect to a password reset page:
//     // window.location.href = '/forgot-password.html';
// }

// // Add forgot password link handler
// document.addEventListener('DOMContentLoaded', () => {
//     const forgotPasswordLink = document.querySelector('.forgot-password');
//     if (forgotPasswordLink) {
//         forgotPasswordLink.addEventListener('click', handleForgotPassword);
//     }
// });

/**
 * Handle Enter key press
 */
document.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const loginForm = document.getElementById('loginForm');
        if (loginForm && document.activeElement.form === loginForm) {
            event.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
});
