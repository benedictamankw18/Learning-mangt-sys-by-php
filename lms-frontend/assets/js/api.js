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
                // A 401 from the login endpoint means wrong credentials, not an expired session.
                // Skip the session-expired flow so the server's error message is shown instead.
                const isLoginEndpoint = response.url && response.url.includes('/api/auth/login');
                if (!isLoginEndpoint) {
                    // Clear auth state DIRECTLY — do NOT call Auth.logout() here because
                    // Auth.logout() makes another API call (POST /auth/logout) which would
                    // also get a 401, triggering this handler again → infinite loop.
                    try {
                        if (typeof Auth !== 'undefined') {
                            Auth.clearToken();
                            Auth.clearRefreshToken();
                            Auth.clearUser();
                        }
                        if (typeof stopTokenRefresh === 'function') stopTokenRefresh();
                    } catch (_) {}
                    try { sessionStorage.setItem('lms_session_expired', '1'); } catch (_) {}
                    window.location.href = '/auth/login.html';
                    const e = new Error('Session expired. Please login again.');
                    e.status = response.status;
                    e.body = data;
                    throw e;
                }
                // Login endpoint 401 — fall through to normal error message extraction below
            }

            // Extract error message
            const errorMessage = isJSON
                ? (() => {
                    const hasFieldErrors = data && data.errors && typeof data.errors === 'object';
                    if (hasFieldErrors) {
                        const details = Object.entries(data.errors)
                            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                            .join('; ');

                        if (data.message && data.message !== 'Validation failed') {
                            return `${data.message}${details ? ` - ${details}` : ''}`;
                        }

                        return details || data.message || data.error || 'An error occurred';
                    }

                    return data.message || data.error || 'An error occurred';
                })()
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

            // A TypeError with a failed fetch typically means a network error or
            // a CORS rejection (the browser blocks the request before a response arrives).
            if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
                const corsHint = APP_ENV === 'development'
                    ? ' Make sure the API server is running and CORS is configured for this origin.'
                    : '';
                throw new Error('Unable to reach the server. Check your connection.' + corsHint);
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
    import: (data) => API.post(API_ENDPOINTS.USER_IMPORT, data),
    update: (id, data) => API.put(API_ENDPOINTS.USER_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.USER_BY_ID(id)),
    resetPassword: (uuid, data) => API.post(API_ENDPOINTS.USER_RESET_PASSWORD(uuid), data),
};

/**
 * Role APIs
 */
const RoleAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ROLES, params),
    getById: (id) => API.get(`${API_ENDPOINTS.ROLES}/${id}`),
    create: (data) => API.post(API_ENDPOINTS.ROLES, data),
    update: (id, data) => API.put(`${API_ENDPOINTS.ROLES}/${id}`, data),
    delete: (id) => API.delete(`${API_ENDPOINTS.ROLES}/${id}`),
    getPermissions: (id) => API.get(`${API_ENDPOINTS.ROLES}/${id}/permissions`),
    assignPermission: (id, permissionId) => API.post(`${API_ENDPOINTS.ROLES}/${id}/permissions`, { permission_id: permissionId }),
    removePermission: (id, permissionId) => API.delete(`${API_ENDPOINTS.ROLES}/${id}/permissions/${permissionId}`),
    getUsers: (id) => API.get(`${API_ENDPOINTS.ROLES}/${id}/users`),
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
    getStatistics: (id) => API.get(`${API_ENDPOINTS.INSTITUTIONS}/${id}/statistics`),
    updateStatus: (id, data) => API.put(`${API_ENDPOINTS.INSTITUTIONS}/${id}/status`, data),
    getUsers: (id, params) => API.get(`${API_ENDPOINTS.INSTITUTIONS}/${id}/users`, params),
    getActiveSubscription: (institutionId) => API.get(`/api/subscriptions/institution/${institutionId}/active`),
    getSubscriptionStatus: (institutionId) => API.get(`/api/subscriptions/check/${institutionId}`),
};

/**
 * Subscription APIs
 */
const SubscriptionAPI = {
    getAll: (params) => API.get('/api/subscriptions', params),
    getByInstitution: (institutionId, params = {}) => API.get('/api/subscriptions', { institution_id: institutionId, ...params }),
};

/**
 * Parent APIs
 */
const ParentAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.PARENTS, params),
    getById: (id) => API.get(API_ENDPOINTS.PARENT_BY_ID(id)),
    create: (data) => API.post(API_ENDPOINTS.PARENTS, data),
    update: (id, data) => API.put(API_ENDPOINTS.PARENT_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.PARENT_BY_ID(id)),
    getStudents: (parentId) => API.get(API_ENDPOINTS.PARENT_STUDENTS(parentId)),
    linkStudent: (data) => API.post(API_ENDPOINTS.PARENT_STUDENT_REL, data),
    unlinkStudent: (relationshipId) => API.delete(API_ENDPOINTS.PARENT_STUDENT_REL_BY_ID(relationshipId)),
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
 * Program APIs
 */
const ProgramAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.PROGRAMS, params),
    getById: (id) => API.get(API_ENDPOINTS.PROGRAM_BY_ID(id)),
    create: (data) => API.post(API_ENDPOINTS.PROGRAMS, data),
    update: (id, data) => API.put(API_ENDPOINTS.PROGRAM_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.PROGRAM_BY_ID(id)),
};

/**
 * Subject APIs
 */
const SubjectAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.SUBJECTS, params),
    getByUuid: (uuid) => API.get(API_ENDPOINTS.SUBJECT_BY_UUID(uuid)),
    create: (data) => API.post(API_ENDPOINTS.SUBJECTS, data),
    update: (uuid, data) => API.put(API_ENDPOINTS.SUBJECT_BY_UUID(uuid), data),
    delete: (uuid) => API.delete(API_ENDPOINTS.SUBJECT_BY_UUID(uuid)),
};

/**
 * Teacher APIs
 */
const TeacherAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.TEACHERS, params),
    getById: (uuid) => API.get(API_ENDPOINTS.TEACHER_BY_UUID(uuid)),
    getCourses: (uuid, params) => API.get(API_ENDPOINTS.TEACHER_COURSES(uuid), params),
    getSchedule: (uuid, params) => API.get(API_ENDPOINTS.TEACHER_SCHEDULE(uuid), params),
    getPerformance: (uuid, params) => API.get(API_ENDPOINTS.TEACHER_PERFORMANCE(uuid), params),
};

/**
 * Class APIs
 */
const ClassAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.CLASSES, params),
    getByUuid: (uuid) => API.get(API_ENDPOINTS.CLASS_BY_UUID(uuid)),
    getStudents: (uuid, params) => API.get(`/api/classes/${uuid}/students`, params),
    getSchedule: (uuid, params) => API.get(`/api/classes/${uuid}/schedule`, params),
    getClassSubjects: (uuid, params) => API.get(`/api/classes/${uuid}/class-subjects`, params),
    getPerformance: (uuid, params) => API.get(`/api/classes/${uuid}/performance`, params),
};

/**
 * Permission APIs
 */
const PermissionAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.PERMISSIONS, params),
    getById: (id) => API.get(API_ENDPOINTS.PERMISSION_BY_ID(id)),
    create: (data) => API.post(API_ENDPOINTS.PERMISSIONS, data),
    update: (id, data) => API.put(API_ENDPOINTS.PERMISSION_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.PERMISSION_BY_ID(id)),
};

/**
 * System APIs
 */
const SystemAPI = {
    getSettings: () => API.get('/system/settings'),
    saveSettings: (data) => API.put('/system/settings', data),
};

/**
 * Assignment APIs
 */
const AssignmentAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ASSIGNMENTS, params),
    getMyAssignments: (params) => API.get(API_ENDPOINTS.ASSIGNMENTS_MY, params),
    getByCourse: (courseId) => API.get(API_ENDPOINTS.ASSIGNMENTS_BY_COURSE(courseId)),
    getById: (id) => API.get(API_ENDPOINTS.ASSIGNMENT_BY_ID(id)),
    submit: (id, data) => API.post(API_ENDPOINTS.ASSIGNMENT_SUBMIT(id), data),
    getSubmissions: (id) => API.get(API_ENDPOINTS.ASSIGNMENT_SUBMISSIONS(id)),
    create: (data) => API.post(API_ENDPOINTS.ASSIGNMENTS, data),
    update: (id, data) => API.put(API_ENDPOINTS.ASSIGNMENT_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.ASSIGNMENT_BY_ID(id)),
};

/**
 * Parent Assignment APIs
 */
const ParentAssignmentAPI = {
    getAssignments: (params) => API.get(API_ENDPOINTS.PARENT_ASSIGNMENTS, params),
};

/**
 * Assessment APIs
 */
const AssessmentAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ASSESSMENTS, params),
    getById: (id) => API.get(API_ENDPOINTS.ASSESSMENT_BY_ID(id)),
    create: (data) => API.post(API_ENDPOINTS.ASSESSMENTS, data),
    update: (id, data) => API.put(API_ENDPOINTS.ASSESSMENT_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.ASSESSMENT_BY_ID(id)),
    submit: (id, data) => API.post(API_ENDPOINTS.ASSESSMENT_SUBMIT(id), data),
    getSubmissions: (id) => API.get(API_ENDPOINTS.ASSESSMENT_SUBMISSIONS(id)),
};

/**
 * Quiz APIs
 */
const QuizAPI = {
    getByCourse: (courseId) => API.get(API_ENDPOINTS.COURSE_QUIZZES(courseId)),
    getById: (id) => API.get(API_ENDPOINTS.QUIZ_BY_ID(id)),
    getResults: (id) => API.get(API_ENDPOINTS.QUIZ_RESULTS(id)),
    create: (data) => API.post(API_ENDPOINTS.QUIZZES, data),
    update: (id, data) => API.put(API_ENDPOINTS.QUIZ_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.QUIZ_BY_ID(id)),
    getQuestions: (id) => API.get(API_ENDPOINTS.QUIZ_QUESTIONS(id)),
    addQuestion: (id, data) => API.post(API_ENDPOINTS.QUIZ_QUESTIONS(id), data),
    updateQuestion: (id, data) => API.put(API_ENDPOINTS.QUIZ_QUESTION_BY_ID(id), data),
    deleteQuestion: (id) => API.delete(API_ENDPOINTS.QUIZ_QUESTION_BY_ID(id)),
};

/**
 * Assessment Category APIs
 */
const AssessmentCategoryAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ASSESSMENT_CATEGORIES, params),
    getById: (id) => API.get(API_ENDPOINTS.ASSESSMENT_CATEGORY_BY_ID(id)),
    create: (data) => API.post(API_ENDPOINTS.ASSESSMENT_CATEGORIES, data),
    update: (id, data) => API.put(API_ENDPOINTS.ASSESSMENT_CATEGORY_BY_ID(id), data),
    delete: (id) => API.delete(API_ENDPOINTS.ASSESSMENT_CATEGORY_BY_ID(id)),
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
 * Submissions APIs
 */
const SubmissionsAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.SUBMISSIONS, params),
    getById: (id) => API.get(API_ENDPOINTS.SUBMISSION_BY_ID(id)),
    gradeSubmission: (submissionId, payload) => API.put(API_ENDPOINTS.ASSIGNMENT_SUBMISSION_GRADE(submissionId), payload),
    saveFeedback: (submissionId, feedback) => API.post(API_ENDPOINTS.SUBMISSION_FEEDBACK(submissionId), { feedback }),
    downloadSubmission: (submissionId) => fetch(API_ENDPOINTS.SUBMISSION_DOWNLOAD(submissionId), {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    }).then(r => r.ok ? r.blob() : Promise.reject(new Error(`Download failed: ${r.status}`))),
    
    // Assignment submissions (bulk operations)
    getAssignmentSubmissions: (assignmentId) => API.get(API_ENDPOINTS.ASSIGNMENT_SUBMISSIONS(assignmentId)),
    getSubmissionsAnalytics: (assignmentId) => API.get(API_ENDPOINTS.ASSIGNMENT_SUBMISSIONS_ANALYTICS(assignmentId)),
    publishGrades: (assignmentId) => API.post(API_ENDPOINTS.ASSIGNMENT_SUBMISSIONS_PUBLISH(assignmentId), {
        published_at: new Date().toISOString(),
    }),
    downloadAllSubmissions: (assignmentId) => fetch(API_ENDPOINTS.ASSIGNMENT_SUBMISSIONS_DOWNLOAD_ALL(assignmentId), {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    }).then(async r => {
        if (r.ok) return r.json();
        let msg = `Download failed: ${r.status}`;
        try {
            const payload = await r.json();
            if (payload?.message) msg = payload.message;
        } catch (_) {
            // Keep default message when response is not JSON.
        }
        return Promise.reject(new Error(msg));
    }),
    bulkGradeSubmissions: (assignmentId, updates) => API.post(API_ENDPOINTS.ASSIGNMENT_SUBMISSIONS_BULK_GRADE(assignmentId), { updates }),
    exportGradesAsCSV: (assignmentId) => fetch(API_ENDPOINTS.ASSIGNMENT_SUBMISSIONS_EXPORT_GRADES(assignmentId), {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    }).then(r => r.ok ? r.blob() : Promise.reject(new Error(`Export failed: ${r.status}`))),
};

/**
 * Attendance APIs
 */
const AttendanceAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ATTENDANCE, params),
    getStudentAttendance: (studentId) => API.get(API_ENDPOINTS.STUDENT_ATTENDANCE(studentId)),
    create: (data) => API.post(API_ENDPOINTS.ATTENDANCE, data),
    getSummary: (params) => API.get('/api/attendance/summary', params),
    getByCourse: (courseId, params) => API.get(`/api/courses/${courseId}/attendance`, params),
    bulkCreate: (data) => API.post('/api/attendance/bulk', data),
    updateById: (attendanceId, data) => API.put(`/api/attendance/${attendanceId}`, data),
};

/**
 * Course content APIs (sections/materials/progress)
 */
const CourseContentAPI = {
    getSections: (courseId) => API.get(`/api/courses/${courseId}/sections`),
    createSection: (courseId, data) => API.post(`/api/courses/${courseId}/sections`, data),
    updateSection: (courseId, sectionId, data) => API.put(`/api/courses/${courseId}/sections/${sectionId}`, data),
    deleteSection: (courseId, sectionId) => API.delete(`/api/courses/${courseId}/sections/${sectionId}`),
    getMaterials: (courseId) => API.get(`/api/courses/${courseId}/materials`),
    createMaterial: (courseId, data) => API.post(`/api/courses/${courseId}/materials`, data),
    updateMaterial: (courseId, materialId, data) => API.put(`/api/courses/${courseId}/materials/${materialId}`, data),
    deleteMaterial: (courseId, materialId) => API.delete(`/api/courses/${courseId}/materials/${materialId}`),
    getRequiredProgress: (courseId) => API.get(`/api/courses/${courseId}/materials/required-progress`),
    markMaterialComplete: (courseId, materialId, data) => API.post(`/api/courses/${courseId}/materials/${materialId}/complete`, data),
};

/**
 * Timetable APIs
 */
const ClassScheduleAPI = {
    getByClass: (classUuid) => API.get(`/api/classes/${classUuid}/schedule`),
    getByCourse: (courseId) => API.get(`/api/class-subjects/${courseId}/schedules`),
    createForCourse: (courseId, data) => API.post(`/api/class-subjects/${courseId}/schedules`, data),
    updateForCourse: (courseId, scheduleId, data) => API.put(`/api/class-subjects/${courseId}/schedules/${scheduleId}`, data),
    deleteForCourse: (courseId, scheduleId) => API.delete(`/api/class-subjects/${courseId}/schedules/${scheduleId}`),
};

const InstitutionTimetableAPI = {
    getPeriodSlots: (institutionKey) => API.get(`/api/institutions/${encodeURIComponent(institutionKey)}/timetable-period-slots`),
    updatePeriodSlots: (institutionKey, data) => API.put(`/api/institutions/${encodeURIComponent(institutionKey)}/timetable-period-slots`, data),
    getPublishState: (institutionKey) => API.get(`/api/institutions/${encodeURIComponent(institutionKey)}/timetable-publish-state`),
    updatePublishState: (institutionKey, data) => API.put(`/api/institutions/${encodeURIComponent(institutionKey)}/timetable-publish-state`, data),
};

/**
 * Student relation APIs
 */
const StudentRelationAPI = {
    getParents: (studentId) => API.get(`/api/students/${studentId}/parents`),
    getCourseStudents: (courseId) => API.get(`/api/courses/${courseId}/students`),
    getClassStudents: (classUuid) => API.get(`/api/classes/${classUuid}/students`),
};

const GradeLevelAPI = {
    getAll: (params) => API.get('/api/grade-levels', params),
};

/**
 * Dashboard APIs
 */
const DashboardAPI = {
    getSuperAdminStats: () => API.get(API_ENDPOINTS.SUPER_ADMIN_STATS),
    getAdminStats: (params) => API.get(API_ENDPOINTS.ADMIN_STATS, params),
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
 * File APIs
 */
const FileAPI = {
    upload: (formData) => API.upload(API_ENDPOINTS.FILE_UPLOAD, formData),
};

/**
 * Superadmin Activity APIs
 */
const SuperadminActivityAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.SUPERADMIN_ACTIVITY, params),
    getById: (id) => API.get(API_ENDPOINTS.SUPERADMIN_ACTIVITY_BY_ID(id)),
    getRecent: (params) => API.get(API_ENDPOINTS.SUPERADMIN_ACTIVITY_RECENT, params),
    getStats: () => API.get(API_ENDPOINTS.SUPERADMIN_ACTIVITY_STATS),
    getByType: (type, params) => API.get(API_ENDPOINTS.SUPERADMIN_ACTIVITY_BY_TYPE(type), params),
    getBySeverity: (severity, params) => API.get(API_ENDPOINTS.SUPERADMIN_ACTIVITY_BY_SEVERITY(severity), params),
    getByPerformer: (userId, params) => API.get(API_ENDPOINTS.SUPERADMIN_ACTIVITY_BY_PERFORMER(userId), params),
    log: (data) => API.post(API_ENDPOINTS.SUPERADMIN_ACTIVITY, data),
    cleanup: (params) => API.delete(API_ENDPOINTS.SUPERADMIN_ACTIVITY_CLEANUP + (params ? '?' + new URLSearchParams(params).toString() : '')),
};

/**
 * Admin Activity APIs
 */
const AdminActivityAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.ADMIN_ACTIVITY, params),
    getById: (id) => API.get(API_ENDPOINTS.ADMIN_ACTIVITY_BY_ID(id)),
    getRecent: (params) => API.get(API_ENDPOINTS.ADMIN_ACTIVITY_RECENT, params),
    getStats: () => API.get(API_ENDPOINTS.ADMIN_ACTIVITY_STATS),
    getByType: (type, params) => API.get(API_ENDPOINTS.ADMIN_ACTIVITY_BY_TYPE(type), params),
    getBySeverity: (severity, params) => API.get(API_ENDPOINTS.ADMIN_ACTIVITY_BY_SEVERITY(severity), params),
    getByPerformer: (userId, params) => API.get(API_ENDPOINTS.ADMIN_ACTIVITY_BY_PERFORMER(userId), params),
    log: (data) => API.post(API_ENDPOINTS.ADMIN_ACTIVITY, data),
    cleanup: (params) => API.delete(API_ENDPOINTS.ADMIN_ACTIVITY_CLEANUP + (params ? '?' + new URLSearchParams(params).toString() : '')),
};

/**
 * Teacher Activity APIs
 */
const TeacherActivityAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.TEACHER_ACTIVITY, params),
    getById: (id) => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_BY_ID(id)),
    getRecent: (params) => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_RECENT, params),
    getStats: () => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_STATS),
    getByType: (type, params) => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_BY_TYPE(type), params),
    getBySeverity: (severity, params) => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_BY_SEVERITY(severity), params),
    getByPerformer: (userId, params) => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_BY_PERFORMER(userId), params),
    log: (data) => API.post(API_ENDPOINTS.TEACHER_ACTIVITY, data),
    cleanup: (params) => API.delete(API_ENDPOINTS.TEACHER_ACTIVITY_CLEANUP + (params ? '?' + new URLSearchParams(params).toString() : '')),
};

/**
 * Student Activity APIs
 */
const StudentActivityAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.STUDENT_ACTIVITY, params),
    getById: (id) => API.get(API_ENDPOINTS.STUDENT_ACTIVITY_BY_ID(id)),
    getRecent: (params) => API.get(API_ENDPOINTS.STUDENT_ACTIVITY_RECENT, params),
    getStats: () => API.get(API_ENDPOINTS.STUDENT_ACTIVITY_STATS),
    getByType: (type, params) => API.get(API_ENDPOINTS.STUDENT_ACTIVITY_BY_TYPE(type), params),
    getBySeverity: (severity, params) => API.get(API_ENDPOINTS.STUDENT_ACTIVITY_BY_SEVERITY(severity), params),
    getByPerformer: (userId, params) => API.get(API_ENDPOINTS.STUDENT_ACTIVITY_BY_PERFORMER(userId), params),
    log: (data) => API.post(API_ENDPOINTS.STUDENT_ACTIVITY, data),
    cleanup: (params) => API.delete(API_ENDPOINTS.STUDENT_ACTIVITY_CLEANUP + (params ? '?' + new URLSearchParams(params).toString() : '')),
};

/**
 * Parent Activity APIs
 */
const ParentActivityAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.PARENT_ACTIVITY, params),
    getById: (id) => API.get(API_ENDPOINTS.PARENT_ACTIVITY_BY_ID(id)),
    getRecent: (params) => API.get(API_ENDPOINTS.PARENT_ACTIVITY_RECENT, params),
    getStats: () => API.get(API_ENDPOINTS.PARENT_ACTIVITY_STATS),
    getByType: (type, params) => API.get(API_ENDPOINTS.PARENT_ACTIVITY_BY_TYPE(type), params),
    getBySeverity: (severity, params) => API.get(API_ENDPOINTS.PARENT_ACTIVITY_BY_SEVERITY(severity), params),
    getByPerformer: (userId, params) => API.get(API_ENDPOINTS.PARENT_ACTIVITY_BY_PERFORMER(userId), params),
    log: (data) => API.post(API_ENDPOINTS.PARENT_ACTIVITY, data),
    cleanup: (params) => API.delete(API_ENDPOINTS.PARENT_ACTIVITY_CLEANUP + (params ? '?' + new URLSearchParams(params).toString() : '')),
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

/**
 * Event / Calendar APIs
 */
const EventAPI = {
    getAll: (params) => API.get(API_ENDPOINTS.EVENTS, params),
    getById: (uuid) => API.get(API_ENDPOINTS.EVENT_BY_UUID(uuid)),
    getUpcoming: (params) => API.get(API_ENDPOINTS.EVENTS_UPCOMING, params),
    getCalendar: (params) => API.get(API_ENDPOINTS.EVENTS_CALENDAR, params),
    getAcademicCalendar: (params) => API.get(API_ENDPOINTS.EVENTS_ACADEMIC_CALENDAR, params),
    getByType: (type, params) => API.get(API_ENDPOINTS.EVENTS_BY_TYPE(type), params),
    create: (data) => API.post(API_ENDPOINTS.EVENTS, data),
    update: (uuid, data) => API.put(API_ENDPOINTS.EVENT_BY_UUID(uuid), data),
    delete: (uuid) => API.delete(API_ENDPOINTS.EVENT_BY_UUID(uuid)),
};

/**
 * Teacher Assessment APIs
 */
const TeacherAssessmentAPI = {
    getCategories: () => API.get(API_ENDPOINTS.TEACHER_ASSESSMENT_CATEGORIES),
    getClassesSubjects: () => API.get(API_ENDPOINTS.TEACHER_CLASSES_SUBJECTS),
    getStudents: (params) => API.get(API_ENDPOINTS.TEACHER_STUDENTS, params),
    getExistingAssessments: (params) => API.get(API_ENDPOINTS.TEACHER_EXISTING_ASSESSMENTS, params),
    importAssessments: (data) => API.post(API_ENDPOINTS.TEACHER_IMPORT_ASSESSMENTS, data),
    exportAssessments: (params) => API.download(
        API_ENDPOINTS.TEACHER_EXPORT_ASSESSMENTS + (params ? ('?' + new URLSearchParams(params).toString()) : ''),
        params && params.format === 'csv' ? 'teacher-assessments.csv' : 'teacher-assessments-export.dat'
    ),
    getAssignmentsAndQuizzes: (params) => API.get(API_ENDPOINTS.TEACHER_ASSIGNMENTS_QUIZZES, params),
    saveAssessments: (data) => API.post(API_ENDPOINTS.TEACHER_SAVE_ASSESSMENTS, data),
    publishAssessments: (data) => API.post(API_ENDPOINTS.TEACHER_PUBLISH_ASSESSMENTS, data),
};
