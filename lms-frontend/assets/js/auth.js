/* ============================================
   Authentication Utilities
   Token and user session management
============================================ */

class AuthService {
    constructor() {
        // in-memory fallbacks when browser blocks storage access
        this._inMemoryToken = null;
        this._inMemoryRefresh = null;
        this._inMemoryUser = null;
        this._inMemoryRemember = false;
    }
    /**
     * Save access token to storage
     */
    saveToken(token, remember = false) {
        try {
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
            if (remember) {
                localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
            }
        } catch (e) {
            console.warn('Storage unavailable, using in-memory token', e);
            this._inMemoryToken = token;
            if (remember) this._inMemoryRemember = true;
        }
    }

    /**
     * Get access token from storage
     */
    getToken() {
        try {
            return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || 
                   sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
                   this._inMemoryToken;
        } catch (e) {
            // Storage access blocked (Tracking Prevention). Fall back to memory.
            console.warn('Storage access blocked when getting token', e);
            return this._inMemoryToken || null;
        }
    }

    /**
     * Remove access token from storage
     */
    clearToken() {
        try {
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        } catch (e) {
            console.warn('Storage unavailable when clearing token', e);
        }
        this._inMemoryToken = null;
    }

    /**
     * Save refresh token to storage
     */
    saveRefreshToken(token) {
        try {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
        } catch (e) {
            console.warn('Storage unavailable when saving refresh token', e);
            this._inMemoryRefresh = token;
        }
    }

    /**
     * Get refresh token from storage
     */
    getRefreshToken() {
        try {
            return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || this._inMemoryRefresh;
        } catch (e) {
            console.warn('Storage access blocked when getting refresh token', e);
            return this._inMemoryRefresh || null;
        }
    }

    /**
     * Remove refresh token from storage
     */
    clearRefreshToken() {
        try {
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (e) {
            console.warn('Storage unavailable when clearing refresh token', e);
        }
        this._inMemoryRefresh = null;
    }

    /**
     * Save user data to storage
     */
    saveUser(userData, remember = false) {
        try {
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        } catch (e) {
            console.warn('Storage unavailable when saving user data', e);
            this._inMemoryUser = userData;
        }
    }

    /**
     * Get user data from storage
     */
    getUser() {
        try {
            const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA) || 
                             sessionStorage.getItem(STORAGE_KEYS.USER_DATA) ||
                             (this._inMemoryUser ? JSON.stringify(this._inMemoryUser) : null);
            try {
                return userData ? JSON.parse(userData) : null;
            } catch (error) {
                console.error('Error parsing user data:', error);
                return null;
            }
        } catch (e) {
            console.warn('Storage access blocked when getting user data', e);
            return this._inMemoryUser || null;
        }
    }

    /**
     * Remove user data from storage
     */
    clearUser() {
        try {
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
        } catch (e) {
            console.warn('Storage unavailable when clearing user data', e);
        }
        this._inMemoryUser = null;
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
            const response = await AuthAPI.login(credentials);

            if (response.success && response.data) {
                // Save tokens
                this.saveToken(response.data.access_token, remember);
                
                if (response.data.refresh_token) {
                    this.saveRefreshToken(response.data.refresh_token);
                }

                // Save user data
                this.saveUser(response.data.user, remember);

                return {
                    success: true,
                    user: response.data.user,
                    message: response.message || 'Login successful',
                };
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
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
            localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
            
            // Redirect to login page
            window.location.href = '/auth/login.html';
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken() {
        try {
            const response = await AuthAPI.refresh();

            if (response.success && response.data.access_token) {
                const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
                this.saveToken(response.data.access_token, remember);
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

        switch (userRole) {
            case USER_ROLES.SUPER_ADMIN:
                return '/superadmin/dashboard.html';
            case USER_ROLES.ADMIN:
                return '/admin/dashboard.html';
            case USER_ROLES.TEACHER:
                return '/teacher/dashboard.html';
            case USER_ROLES.STUDENT:
                return '/student/dashboard.html';
            case USER_ROLES.PARENT:
                return '/parent/dashboard.html';
            default:
                return '/auth/login.html';
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
        window.location.href = '/auth/login.html';
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
                console.warn('Token refresh failed');
                // Optionally logout user
                // Auth.logout();
                // Auth.redirectToLogin();
            }
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
