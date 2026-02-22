/* ============================================
   API Service Layer
   HTTP request wrapper with authentication
============================================ */

class APIService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.timeout = REQUEST_TIMEOUT;
    }

    /**
     * Get authorization header
     */
    getAuthHeader() {
        let token = null;
        try {
            token = Auth.getToken();
        } catch (e) {
            console.warn('Auth.getToken threw, storage may be blocked', e);
            token = null;
        }
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /**
     * Create fetch options
     */
    createOptions(method, data = null, customHeaders = {}) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
                ...customHeaders,
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        return options;
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        const isJSON = contentType && contentType.includes('application/json');
        
        const data = isJSON ? await response.json() : await response.text();

        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
                Auth.logout();
                window.location.href = '/auth/login.html';
                const e = new Error('Session expired. Please login again.');
                e.status = response.status;
                e.body = data;
                throw e;
            }

            // Extract error message
            const errorMessage = isJSON
                ? (data.message || data.error || (data.errors ? JSON.stringify(data.errors) : 'An error occurred'))
                : data || 'An error occurred';

            const err = new Error(errorMessage);
            err.status = response.status;
            if (isJSON) err.body = data;
            throw err;
        }

        return data;
    }

    /**
     * Make HTTP request with timeout
     */
    async request(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return await this.handleResponse(response);
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }

            throw error;
        }
    }

    /**
     * GET request
     */
    async get(url, params = null) {
        let queryString = '';
        if (params) {
            queryString = '?' + new URLSearchParams(params).toString();
        }

        return this.request(url + queryString, this.createOptions('GET'));
    }

    /**
     * POST request
     */
    async post(url, data) {
        return this.request(url, this.createOptions('POST', data));
    }

    /**
     * PUT request
     */
    async put(url, data) {
        return this.request(url, this.createOptions('PUT', data));
    }

    /**
     * DELETE request
     */
    async delete(url) {
        return this.request(url, this.createOptions('DELETE'));
    }

    /**
     * Upload file
     */
    async upload(url, formData) {
        let headers = {};
        try {
            const token = Auth.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch (e) {
            console.warn('Auth.getToken threw for upload', e);
        }

        const response = await fetch(`${this.baseURL}${url}`, {
            method: 'POST',
            headers,
            body: formData, // Don't set Content-Type for FormData
        });

        return await this.handleResponse(response);
    }

    /**
     * Download file
     */
    async download(url, filename) {
        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                method: 'GET',
                headers: this.getAuthHeader(),
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            throw new Error('Failed to download file: ' + error.message);
        }
    }
}

// Create singleton instance
const API = new APIService();

/* ============================================
   API Helper Functions
============================================ */

/**
 * Authentication APIs
 */
const AuthAPI = {
    login: (credentials) => API.post(API_ENDPOINTS.AUTH_LOGIN, credentials),
    logout: () => API.post(API_ENDPOINTS.AUTH_LOGOUT),
    refresh: () => API.post(API_ENDPOINTS.AUTH_REFRESH),
    me: () => API.get(API_ENDPOINTS.AUTH_ME),
};

/**
 * User APIs
 */
const UserAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.USERS, params),
    getById: (id) => API.get(API_ENDPOINTS.USER_BY_ID(id)),
    getProfile: () => API.get(API_ENDPOINTS.USER_PROFILE),
    create: (data) => API.post(API_ENDPOINTS.USERS, data),
    update: (id, data) => API.put(API_ENDPOINTS.USER_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.USER_BY_ID(id)),
};

/**
 * Role APIs
 */
const RoleAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ROLES, params),
    getById: (id) => API.get(`${API_ENDPOINTS.ROLES}/${id}`),
};

/**
 * Institution APIs
 */
const InstitutionAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.INSTITUTIONS, params),
    getById: (id) => API.get(`${API_ENDPOINTS.INSTITUTIONS}/${id}`),
    create: (data) => API.post(API_ENDPOINTS.INSTITUTIONS, data),
    update: (id, data) => API.put(`${API_ENDPOINTS.INSTITUTIONS}/${id}`, data),
    delete: (id) => API.delete(`${API_ENDPOINTS.INSTITUTIONS}/${id}`),
};

/**
 * Superadmin User APIs (special paths)
 */
const SuperAdminUserAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.SUPERADMIN_USERS, params),
    getById: (id) => API.get(API_ENDPOINTS.SUPERADMIN_USER_BY_ID(id)),
    create: (data) => API.post(API_ENDPOINTS.SUPERADMIN_USERS, data),
    update: (id, data) => API.put(API_ENDPOINTS.SUPERADMIN_USER_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.SUPERADMIN_USER_BY_ID(id)),
    bulk: (data) => API.post(`${API_ENDPOINTS.SUPERADMIN_USERS}/bulk`, data),
    import: (data) => API.post(`${API_ENDPOINTS.SUPERADMIN_USERS}/import`, data),
    assignRoles: (id, data) => API.post(`${API_ENDPOINTS.SUPERADMIN_USERS}/${id}/roles`, data),
};

/**
 * Course APIs
 */
const CourseAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.COURSES, params),
    getById: (id) => API.get(API_ENDPOINTS.COURSE_BY_ID(id)),
    getMyCourses: () => API.get(API_ENDPOINTS.MY_COURSES),
    create: (data) => API.post(API_ENDPOINTS.COURSES, data),
    update: (id, data) => API.put(API_ENDPOINTS.COURSE_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.COURSE_BY_ID(id)),
};

/**
 * Assignment APIs
 */
const AssignmentAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ASSIGNMENTS, params),
    getById: (id) => API.get(API_ENDPOINTS.ASSIGNMENT_BY_ID(id)),
    getSubmissions: (id) => API.get(API_ENDPOINTS.ASSIGNMENT_SUBMISSIONS(id)),
    create: (data) => API.post(API_ENDPOINTS.ASSIGNMENTS, data),
    update: (id, data) => API.put(API_ENDPOINTS.ASSIGNMENT_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.ASSIGNMENT_BY_ID(id)),
};

/**
 * Grade APIs
 */
const GradeAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.GRADES, params),
    getStudentGrades: (studentId) => API.get(API_ENDPOINTS.STUDENT_GRADES(studentId)),
    create: (data) => API.post(API_ENDPOINTS.GRADES, data),
    update: (id, data) => API.put(`${API_ENDPOINTS.GRADES}/${id}`, data),
};

/**
 * Attendance APIs
 */
const AttendanceAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ATTENDANCE, params),
    getStudentAttendance: (studentId) => API.get(API_ENDPOINTS.STUDENT_ATTENDANCE(studentId)),
    create: (data) => API.post(API_ENDPOINTS.ATTENDANCE, data),
};

/**
 * Dashboard APIs
 */
const DashboardAPI = {
    getSuperAdminStats: () => API.get(API_ENDPOINTS.SUPER_ADMIN_STATS),
    getAdminStats: () => API.get(API_ENDPOINTS.ADMIN_STATS),
    getTeacherStats: () => API.get(API_ENDPOINTS.TEACHER_STATS),
    getStudentStats: () => API.get(API_ENDPOINTS.STUDENT_STATS),
    getParentStats: () => API.get(API_ENDPOINTS.PARENT_STATS),
};

/**
 * Message APIs
 */
const MessageAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.MESSAGES, params),
    send: (data) => API.post(API_ENDPOINTS.SEND_MESSAGE, data),
};

/**
 * Notification APIs
 */
const NotificationAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.NOTIFICATIONS, params),
    getSummary: () => API.get(API_ENDPOINTS.NOTIFICATION_SUMMARY),
    getById: (id) => API.get(API_ENDPOINTS.NOTIFICATION_BY_ID(id)),
    markAsRead: (id) => API.put(API_ENDPOINTS.NOTIFICATION_MARK_READ(id)),
    markAllAsRead: () => API.put(API_ENDPOINTS.NOTIFICATION_MARK_ALL_READ),
};

/**
 * Announcement APIs
 */
const AnnouncementAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ANNOUNCEMENTS, params),
    create: (data) => API.post(API_ENDPOINTS.ANNOUNCEMENTS, data),
    update: (id, data) => API.put(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`, data),
    delete: (id) => API.delete(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`),
};
