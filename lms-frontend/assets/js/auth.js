/* ============================================
   Authentication Utilities
   Token and user session management
============================================ */

class AuthService {
    constructor() {
        // in-memory cache — populated once from storage at startup
        this._inMemoryToken = null;
        this._inMemoryRefresh = null;
        this._inMemoryUser = null;
        this._inMemoryRemember = false;
        // Pre-load everything from storage in one shot so no getter ever
        // touches storage again (prevents "Tracking Prevention blocked" spam).
        this._initFromStorage();
    }

    _initFromStorage() {
        try {
            this._inMemoryRemember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
            const tokenStorage = this._inMemoryRemember ? localStorage : sessionStorage;
            this._inMemoryToken   = tokenStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;
            this._inMemoryRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
            const rawUser = tokenStorage.getItem(STORAGE_KEYS.USER_DATA);
            try { this._inMemoryUser = rawUser ? JSON.parse(rawUser) : null; } catch (_) {}
        } catch (_) {
            // Storage fully blocked (Tracking Prevention) — session works in-memory only
        }
    }

    /**
     * Save access token to storage
     */
    saveToken(token, remember = false) {
        this._inMemoryToken = token;
        if (remember) this._inMemoryRemember = true;
        try {
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
            if (remember) localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        } catch (e) {
            console.warn('Storage unavailable, using in-memory token', e);
        }
    }

    /**
     * Get access token from storage
     */
    getToken() {
        return this._inMemoryToken;
    }

    /**
     * Remove access token from storage
     */
    clearToken() {
        this._inMemoryToken = null;
        try {
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        } catch (e) {
            console.warn('Storage unavailable when clearing token', e);
        }
    }

    /**
     * Save refresh token to storage
     */
    saveRefreshToken(token) {
        this._inMemoryRefresh = token;
        try {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
        } catch (e) {
            console.warn('Storage unavailable when saving refresh token', e);
        }
    }

    /**
     * Get refresh token from storage
     */
    getRefreshToken() {
        return this._inMemoryRefresh;
    }

    /**
     * Remove refresh token from storage
     */
    clearRefreshToken() {
        this._inMemoryRefresh = null;
        try {
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (e) {
            console.warn('Storage unavailable when clearing refresh token', e);
        }
    }

    /**
     * Save user data to storage
     */
    saveUser(userData, remember = false) {
        this._inMemoryUser = userData;
        try {
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        } catch (e) {
            console.warn('Storage unavailable when saving user data', e);
        }
    }

    /**
     * Get user data from storage
     */
    getUser() {
        return this._inMemoryUser || null;
    }

    /**
     * Remove user data from storage
     */
    clearUser() {
        this._inMemoryUser = null;
        try {
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
        } catch (e) {
            console.warn('Storage unavailable when clearing user data', e);
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Get current user's role
     */
    getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }

    /**
     * Check if user has specific role
     */
    hasRole(role) {
        return this.getUserRole() === role;
    }

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(roles) {
        const userRole = this.getUserRole();
        return roles.includes(userRole);
    }

    /**
     * Login user
     */
    async login(credentials, remember = false) {
        try {
            logger.auth('Login attempt started', { username: credentials.login, remember });
            
            const response = await AuthAPI.login(credentials);

            logger.auth('Login API Response received', response);
            logger.debug('AUTH', 'Response data structure', response.data);
            logger.info('AUTH', 'Access Token: ' + (response.data?.access_token ? 'Present' : 'MISSING'));
            logger.info('AUTH', 'Refresh Token: ' + (response.data?.refresh_token ? 'Present' : 'MISSING'));
            logger.debug('AUTH', 'User data received', response.data?.user);
            logger.info('AUTH', 'Remember Me: ' + remember);

            if (response.success && response.data) {
                // Save tokens
                const tokenStorage = remember ? 'localStorage' : 'sessionStorage';
                logger.storage(`Saving access token to ${tokenStorage}`);
                this.saveToken(response.data.access_token, remember);
                
                if (response.data.refresh_token) {
                    logger.storage('Saving refresh token to localStorage');
                    this.saveRefreshToken(response.data.refresh_token);
                } else {
                    logger.warning('AUTH', 'No refresh token provided by API');
                }

                // Save user data
                const userStorage = remember ? 'localStorage' : 'sessionStorage';
                logger.storage(`Saving user data to ${userStorage}`, response.data.user);
                this.saveUser(response.data.user, remember);

                // Verify via in-memory state (no extra storage reads needed)
                const accessTokenSaved = !!this._inMemoryToken;
                const userDataSaved    = !!this._inMemoryUser;

                logger.success('AUTH', 'Access Token saved: ' + accessTokenSaved);
                logger.success('AUTH', 'User Data saved: '    + userDataSaved);

                if (!accessTokenSaved || !userDataSaved) {
                    logger.error('AUTH', 'CRITICAL: Some data failed to save to storage!', {
                        accessTokenSaved,
                        userDataSaved
                    });
                }

                logger.success('AUTH', 'Login successful', { username: response.data.user.username, role: response.data.user.role });

                return {
                    success: true,
                    user: response.data.user,
                    message: response.message || 'Login successful',
                };
            } else {
                logger.error('AUTH', 'Login failed - Invalid response', { response });
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            // Better error messages for debugging
            logger.error('AUTH', 'Login error caught', { error: error.message, stack: error.stack });
            
            if (error.message === 'Failed to fetch') {
                const errorMsg = 'Cannot connect to server. Please ensure the API server is running on http://localhost:8000';
                logger.error('AUTH', errorMsg);
                throw new Error(errorMsg);
            }
            
            logger.error('AUTH', 'Login failed with error: ' + error.message);
            throw new Error(error.message || 'Login failed');
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Call logout API (optional - even if it fails, clear local data)
            if (this.isAuthenticated()) {
                await AuthAPI.logout().catch(() => {
                    // Ignore logout API errors
                });
            }
        } finally {
            // Always clear local data
            this.clearToken();
            this.clearRefreshToken();
            this.clearUser();
            
            // Clear ALL localStorage and sessionStorage
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (e) {
                console.warn('Storage unavailable when clearing on logout', e);
            }
            
            // Clear in-memory fallbacks
            this._inMemoryToken = null;
            this._inMemoryRefresh = null;
            this._inMemoryUser = null;
            this._inMemoryRemember = false;
            
            // Stop token refresh
            if (typeof stopTokenRefresh === 'function') {
                stopTokenRefresh();
            }
            
            // Redirect to login page using relative path
            this.redirectToLogin();
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) return false;

            const response = await API.post(API_ENDPOINTS.AUTH_REFRESH, { refresh_token: refreshToken });

            if (response.success && response.data.access_token) {
                this.saveToken(response.data.access_token, this._inMemoryRemember);
                if (response.data.refresh_token) {
                    this.saveRefreshToken(response.data.refresh_token);
                }
                return true;
            }

            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    /**
     * Get redirect URL based on user role
     */
    getDashboardURL(role = null) {
        const userRole = role || this.getUserRole();
        // Get base path - detect if we're in a subdirectory
        const currentPath = window.location.pathname;
        const isInAuthFolder = currentPath.includes('/auth/');
        const basePrefix = isInAuthFolder ? '../' : '';

        switch (userRole) {
            case USER_ROLES.SUPER_ADMIN:
                return basePrefix + 'superadmin/dashboard.html';
            case USER_ROLES.ADMIN:
                return basePrefix + 'admin/dashboard.html';
            case USER_ROLES.TEACHER:
                return basePrefix + 'teacher/dashboard.html';
            case USER_ROLES.STUDENT:
                return basePrefix + 'student/dashboard.html';
            case USER_ROLES.PARENT:
                return basePrefix + 'parent/dashboard.html';
            default:
                return basePrefix + 'auth/login.html';
        }
    }

    /**
     * Redirect to appropriate dashboard
     */
    redirectToDashboard(role = null) {
        const url = this.getDashboardURL(role);
        window.location.href = url;
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        // Detect current folder and calculate correct relative path
        const currentPath = window.location.pathname;
        const isInRoleFolder = currentPath.match(/\/(admin|teacher|student|parent|superadmin)\//);
        const isInAuthFolder = currentPath.includes('/auth/');
        
        let loginPath;
        if (isInRoleFolder) {
            loginPath = '../auth/login.html';  // From role folder
        } else if (isInAuthFolder) {
            loginPath = 'login.html';  // Already in auth folder
        } else {
            loginPath = 'auth/login.html';  // At root
        }
        
        window.location.href = loginPath;
    }

    /**
     * Check authentication and redirect if needed
     */
    requireAuth(allowedRoles = null) {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }

        if (allowedRoles) {
            const userRole = this.getUserRole();
            if (!allowedRoles.includes(userRole)) {
                // Redirect to appropriate dashboard
                this.redirectToDashboard();
                return false;
            }
        }

        return true;
    }

    /**
     * Prevent authenticated users from accessing login page
     */
    preventAuthAccess() {
        if (this.isAuthenticated()) {
            this.redirectToDashboard();
            return true;
        }
        return false;
    }

    /**
     * Get user initials for avatar
     */
    getUserInitials() {
        const user = this.getUser();
        if (!user) return '?';

        const firstName = user.first_name || user.firstname || '';
        const lastName = user.last_name || user.lastname || '';

        if (firstName && lastName) {
            return `${firstName[0]}${lastName[0]}`.toUpperCase();
        } else if (firstName) {
            return firstName.substring(0, 2).toUpperCase();
        } else if (user.email) {
            return user.email.substring(0, 2).toUpperCase();
        }

        return '?';
    }

    /**
     * Get user display name
     */
    getUserDisplayName() {
        const user = this.getUser();
        if (!user) return 'User';

        const firstName = user.first_name || user.firstname || '';
        const lastName = user.last_name || user.lastname || '';

        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        } else if (firstName) {
            return firstName;
        } else if (user.email) {
            return user.email.split('@')[0];
        }

        return 'User';
    }

    /**
     * Get user avatar URL or color
     */
    getUserAvatar() {
        const user = this.getUser();
        
        if (user && user.profile_picture) {
            return user.profile_picture;
        }

        // Generate color based on user ID or email
        const colors = [
            '#006a3f', '#008c54', '#d4af37', '#d82434',
            '#e4c766', '#10b981', '#06b6d4', '#3090cf'
        ];

        const id = user?.user_id || user?.id || user?.email || '0';
        const index = parseInt(id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;

        return colors[index];
    }
}

// Create singleton instance
const Auth = new AuthService();

/* ============================================
   Auto Token Refresh (Optional)
============================================ */

// Refresh token every 25 minutes (if access token expires in 30 min)
let tokenRefreshInterval = null;

function startTokenRefresh() {
    if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
    }

    tokenRefreshInterval = setInterval(async () => {
        if (Auth.isAuthenticated()) {
            const refreshed = await Auth.refreshToken();
            if (!refreshed) {
                console.warn('Token refresh failed - logging out');
                // Auto logout when token expires
                stopTokenRefresh();
                await Auth.logout();
            }
        } else {
            // No longer authenticated, stop refresh interval
            stopTokenRefresh();
        }
    }, 25 * 60 * 1000); // 25 minutes
}

function stopTokenRefresh() {
    if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
    }
}

// Start token refresh if user is authenticated
if (Auth.isAuthenticated()) {
    startTokenRefresh();
}

/* ============================================
   Idle Session Timeout
   Auto-logout after 30 minutes of inactivity
============================================ */

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
let sessionTimeoutId = null;

function resetSessionTimeout() {
    if (!Auth.isAuthenticated()) return;
    if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
    sessionTimeoutId = setTimeout(async () => {
        stopSessionTimeout();
        try { sessionStorage.setItem('lms_session_expired', '1'); } catch (e) {}
        await Auth.logout();
    }, SESSION_TIMEOUT_MS);
}

function startSessionTimeout() {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetSessionTimeout, { passive: true }));
    resetSessionTimeout();
}

function stopSessionTimeout() {
    if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        sessionTimeoutId = null;
    }
}

// Auto-start on authenticated pages (not login/auth pages)
if (Auth.isAuthenticated() && !window.location.pathname.includes('/auth/')) {
    startSessionTimeout();
}
