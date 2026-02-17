/* ============================================
   API Configuration
============================================ */

// Base API URL (update this for production)
const API_BASE_URL = 'http://localhost:80';

// API Endpoints
const API_ENDPOINTS = {
    // Authentication
    AUTH_LOGIN: '/auth/login',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_REFRESH: '/auth/refresh',
    AUTH_ME: '/auth/me',
    
    // Users
    USERS: '/users',
    USER_BY_ID: (id) => `/users/${id}`,
    USER_PROFILE: '/users/profile',
    
    // Courses
    COURSES: '/courses',
    COURSE_BY_ID: (id) => `/courses/${id}`,
    MY_COURSES: '/courses/my',
    
    // Assignments
    ASSIGNMENTS: '/assignments',
    ASSIGNMENT_BY_ID: (id) => `/assignments/${id}`,
    ASSIGNMENT_SUBMISSIONS: (id) => `/assignments/${id}/submissions`,
    
    // Grades
    GRADES: '/grades',
    STUDENT_GRADES: (studentId) => `/grades/student/${studentId}`,
    
    // Attendance
    ATTENDANCE: '/attendance',
    STUDENT_ATTENDANCE: (studentId) => `/attendance/student/${studentId}`,
    
    // Announcements
    ANNOUNCEMENTS: '/announcements',
    
    // Messages
    MESSAGES: '/messages',
    SEND_MESSAGE: '/messages/send',
    
    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATION_SUMMARY: '/notifications/summary',
    NOTIFICATION_BY_ID: (id) => `/notifications/${id}`,
    NOTIFICATION_MARK_READ: (id) => `/notifications/${id}/read`,
    NOTIFICATION_MARK_ALL_READ: '/notifications/read-all',
    
    // Dashboard Stats
    SUPER_ADMIN_STATS: '/dashboard/superadmin',
    ADMIN_STATS: '/dashboard/admin',
    TEACHER_STATS: '/dashboard/teacher',
    STUDENT_STATS: '/dashboard/student',
    PARENT_STATS: '/dashboard/parent',
};

// Storage Keys
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'lms_access_token',
    REFRESH_TOKEN: 'lms_refresh_token',
    USER_DATA: 'lms_user_data',
    REMEMBER_ME: 'lms_remember_me',
};

// User Roles
const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
    PARENT: 'parent',
};

// Alert Types
const ALERT_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

// Request Timeout (ms)
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Pagination
const DEFAULT_PAGE_SIZE = 20;

// Demo Credentials (for quick login)
// These match the actual database setup from setup.sql
const DEMO_CREDENTIALS = {
    [USER_ROLES.SUPER_ADMIN]: {
        login: 'superadmin',
        password: 'password',
    },
    [USER_ROLES.ADMIN]: {
        login: 'admin',
        password: 'password',
    },
    [USER_ROLES.TEACHER]: {
        login: 'kofi.mensah',
        password: 'password',
    },
    [USER_ROLES.STUDENT]: {
        login: 'kwame.osei',
        password: 'password',
    },
    [USER_ROLES.PARENT]: {
        login: 'yaw.osei',
        password: 'password',
    },
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        API_ENDPOINTS,
        STORAGE_KEYS,
        USER_ROLES,
        ALERT_TYPES,
        REQUEST_TIMEOUT,
        DEFAULT_PAGE_SIZE,
        DEMO_CREDENTIALS,
    };
}
