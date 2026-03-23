/* ============================================
   API Configuration
============================================ */

const APP_NAME = 'Ghana SHS LMS';

// Environment & API URL are injected by env.js, which must be loaded before this script.
// Falls back to 'development' / localhost only when env.js is absent.
const _env        = (typeof window !== 'undefined' && window.ENV_CONFIG) || {};
const APP_ENV     = _env.APP_ENV      || 'development';
const API_BASE_URL = _env.API_BASE_URL || 'http://localhost:8000';

// API Endpoints
const API_ENDPOINTS = {
    // Authentication
    AUTH_LOGIN: '/api/auth/login',
    AUTH_LOGOUT: '/api/auth/logout',
    AUTH_REFRESH: '/api/auth/refresh',
    AUTH_ME: '/api/auth/me',
    
    // Students
    STUDENTS: '/api/students',
    STUDENT_BY_UUID: (uuid) => `/api/students/${uuid}`,
    STUDENT_STATUS: (uuid) => `/api/students/${uuid}/status`,
    STUDENT_COURSES: (uuid) => `/api/students/${uuid}/courses`,
    STUDENT_ATTENDANCE_STATS: (studentId) => `/api/students/${studentId}/attendance/stats`,
    STUDENT_RESULTS: (studentId) => `/api/students/${studentId}/results`,
    STUDENT_GENERATE_ID: '/api/students/generate-id',

    // Teachers
    TEACHERS: '/api/teachers',
    TEACHER_BY_UUID: (uuid) => `/api/teachers/${uuid}`,
    TEACHER_GENERATE_ID: '/api/teachers/generate-id',
    TEACHER_COURSES: (uuid) => `/api/teachers/${uuid}/courses`,
    TEACHER_SCHEDULE: (uuid) => `/api/teachers/${uuid}/schedule`,
    TEACHER_PERFORMANCE: (uuid) => `/api/teachers/${uuid}/performance`,
    TEACHER_SUBJECTS: (id) => `/api/teachers/${id}/subjects`,

    // Subjects
    SUBJECTS: '/api/subjects',
    SUBJECT_BY_UUID: (uuid) => `/api/subjects/${uuid}`,
    SUBJECT_TEACHERS: (id) => `/api/subjects/${id}/teachers`,

    // Teacher-Subject assignments
    TEACHER_SUBJECT: '/api/teacher-subjects',
    TEACHER_SUBJECT_BY_ID: (id) => `/api/teacher-subjects/${id}`,

    // Class-Subjects (course records — each links a class section + subject + assigned teacher)
    CLASS_SUBJECTS: '/api/class-subjects',
    CLASS_SUBJECT_BY_ID: (id) => `/api/class-subjects/${id}`,

    // Academic Year & Semester
    ACADEMIC_YEAR_CURRENT: '/api/academic-years/current',
    SEMESTER_CURRENT: '/api/semesters/current',

    // Classes
    CLASSES: '/api/classes',
    CLASS_BY_UUID: (uuid) => `/api/classes/${uuid}`,
    CLASS_ASSIGN_TEACHER: (uuid) => `/api/classes/${uuid}/assign-teacher`,

    // Programs
    PROGRAMS: '/api/programs',
    PROGRAMS_ACTIVE: '/api/programs/active',
    PROGRAM_BY_ID: (id) => `/api/programs/${id}`,

    // Parents
    PARENTS: '/api/parents',
    PARENT_BY_ID: (id) => `/api/parents/${id}`,
    PARENT_STUDENTS: (parentId) => `/api/parents/${parentId}/students`,
    PARENT_STUDENT_REL: '/api/parent-students',
    PARENT_STUDENT_REL_BY_ID: (id) => `/api/parent-students/${id}`,

    // Users
    USERS: '/api/users',
    USER_IMPORT: '/api/users/import',
    USER_BY_ID: (id) => `/api/users/${id}`,
    USER_PROFILE: '/api/users/profile',
    USER_ACTIVITY: (uuid) => `/api/users/${uuid}/activity`,
    USER_RESET_PASSWORD: (uuid) => `/api/users/${uuid}/reset-password`,

    // Auth actions
    AUTH_CHANGE_PASSWORD: '/api/auth/change-password',
    FILE_UPLOAD: '/api/upload',

    // Admin Activity (institution-level audit trail)
    ADMIN_ACTIVITY: '/api/admin-activity',
    ADMIN_ACTIVITY_RECENT: '/api/admin-activity/recent',
    ADMIN_ACTIVITY_BY_TYPE: (type) => `/api/admin-activity/type/${type}`,

    // Dashboard
    DASHBOARD_ADMIN: '/api/dashboard/admin',

    // Roles & Institutions
    ROLES: '/api/roles',
    INSTITUTIONS: '/api/institutions',
    // Permissions
    PERMISSIONS: '/api/permissions',
    PERMISSION_BY_ID: (id) => `/api/permissions/${id}`,
    // Superadmin users
    SUPERADMIN_USERS: '/api/superadmin/users',
    SUPERADMIN_USER_BY_ID: (id) => `/api/superadmin/users/${id}`,

    // Superadmin Activity
    SUPERADMIN_ACTIVITY: '/api/superadmin-activity',
    SUPERADMIN_ACTIVITY_BY_ID: (id) => `/api/superadmin-activity/${id}`,
    SUPERADMIN_ACTIVITY_RECENT: '/api/superadmin-activity/recent',
    SUPERADMIN_ACTIVITY_STATS: '/api/superadmin-activity/stats',
    SUPERADMIN_ACTIVITY_BY_TYPE: (type) => `/api/superadmin-activity/type/${type}`,
    SUPERADMIN_ACTIVITY_BY_SEVERITY: (severity) => `/api/superadmin-activity/severity/${severity}`,
    SUPERADMIN_ACTIVITY_BY_PERFORMER: (userId) => `/api/superadmin-activity/performer/${userId}`,
    SUPERADMIN_ACTIVITY_CLEANUP: '/api/superadmin-activity/cleanup',

    // Admin Activity
    ADMIN_ACTIVITY: '/api/admin-activity',
    ADMIN_ACTIVITY_BY_ID: (id) => `/api/admin-activity/${id}`,
    ADMIN_ACTIVITY_RECENT: '/api/admin-activity/recent',
    ADMIN_ACTIVITY_STATS: '/api/admin-activity/stats',
    ADMIN_ACTIVITY_BY_TYPE: (type) => `/api/admin-activity/type/${type}`,
    ADMIN_ACTIVITY_BY_SEVERITY: (severity) => `/api/admin-activity/severity/${severity}`,
    ADMIN_ACTIVITY_BY_PERFORMER: (userId) => `/api/admin-activity/performer/${userId}`,
    ADMIN_ACTIVITY_CLEANUP: '/api/admin-activity/cleanup',

    // Teacher Activity
    TEACHER_ACTIVITY: '/api/teacher-activity',
    TEACHER_ACTIVITY_BY_ID: (id) => `/api/teacher-activity/${id}`,
    TEACHER_ACTIVITY_RECENT: '/api/teacher-activity/recent',
    TEACHER_ACTIVITY_STATS: '/api/teacher-activity/stats',
    TEACHER_ACTIVITY_BY_TYPE: (type) => `/api/teacher-activity/type/${type}`,
    TEACHER_ACTIVITY_BY_SEVERITY: (severity) => `/api/teacher-activity/severity/${severity}`,
    TEACHER_ACTIVITY_BY_PERFORMER: (userId) => `/api/teacher-activity/performer/${userId}`,
    TEACHER_ACTIVITY_CLEANUP: '/api/teacher-activity/cleanup',

    // Student Activity
    STUDENT_ACTIVITY: '/api/student-activity',
    STUDENT_ACTIVITY_BY_ID: (id) => `/api/student-activity/${id}`,
    STUDENT_ACTIVITY_RECENT: '/api/student-activity/recent',
    STUDENT_ACTIVITY_STATS: '/api/student-activity/stats',
    STUDENT_ACTIVITY_BY_TYPE: (type) => `/api/student-activity/type/${type}`,
    STUDENT_ACTIVITY_BY_SEVERITY: (severity) => `/api/student-activity/severity/${severity}`,
    STUDENT_ACTIVITY_BY_PERFORMER: (userId) => `/api/student-activity/performer/${userId}`,
    STUDENT_ACTIVITY_CLEANUP: '/api/student-activity/cleanup',

    // Parent Activity
    PARENT_ACTIVITY: '/api/parent-activity',
    PARENT_ACTIVITY_BY_ID: (id) => `/api/parent-activity/${id}`,
    PARENT_ACTIVITY_RECENT: '/api/parent-activity/recent',
    PARENT_ACTIVITY_STATS: '/api/parent-activity/stats',
    PARENT_ACTIVITY_BY_TYPE: (type) => `/api/parent-activity/type/${type}`,
    PARENT_ACTIVITY_BY_SEVERITY: (severity) => `/api/parent-activity/severity/${severity}`,
    PARENT_ACTIVITY_BY_PERFORMER: (userId) => `/api/parent-activity/performer/${userId}`,
    PARENT_ACTIVITY_CLEANUP: '/api/parent-activity/cleanup',

    // Courses
    COURSES: '/api/courses',
    COURSE_BY_ID: (id) => `/api/courses/${id}`,
    MY_COURSES: '/api/courses/my',

    // Assignments
    ASSIGNMENTS: '/api/assignments',
    ASSIGNMENTS_MY: '/api/assignments/my',
    ASSIGNMENTS_BY_COURSE: (courseId) => `/api/courses/${courseId}/assignments`,
    ASSIGNMENT_BY_ID: (id) => `/api/assignments/${id}`,
    ASSIGNMENT_SUBMIT: (id) => `/api/assignments/${id}/submit`,
    ASSIGNMENT_SUBMISSIONS: (id) => `/api/assignments/${id}/submissions`,
    ASSIGNMENT_SUBMISSIONS_ANALYTICS: (id) => `/api/assignments/${id}/submissions/analytics`,
    ASSIGNMENT_SUBMISSIONS_PUBLISH: (id) => `/api/assignments/${id}/submissions/publish`,
    ASSIGNMENT_SUBMISSIONS_DOWNLOAD_ALL: (id) => `/api/assignments/${id}/submissions/download-all`,
    ASSIGNMENT_SUBMISSIONS_EXPORT_GRADES: (id) => `/api/assignments/${id}/submissions/export-grades`,
    ASSIGNMENT_SUBMISSIONS_BULK_GRADE: (id) => `/api/assignments/${id}/submissions/bulk-grade`,
    ASSIGNMENT_SUBMISSION_GRADE: (id) => `/api/assignment-submissions/${id}/grade`,

    // Assessments
    ASSESSMENTS: '/api/assessments',
    ASSESSMENT_BY_ID: (id) => `/api/assessments/${id}`,
    ASSESSMENT_SUBMIT: (id) => `/api/assessments/${id}/submit`,
    ASSESSMENT_SUBMISSIONS: (id) => `/api/assessments/${id}/submissions`,

    // Assessment Categories
    ASSESSMENT_CATEGORIES: '/api/assessment-categories',
    ASSESSMENT_CATEGORY_BY_ID: (id) => `/api/assessment-categories/${id}`,

    // Teacher Assessment Endpoints
    TEACHER_ASSESSMENT_CATEGORIES: '/api/teacher/assessment-categories',
    TEACHER_CLASSES_SUBJECTS: '/api/teacher/classes-subjects',
    TEACHER_STUDENTS: '/api/teacher/students',
    TEACHER_EXISTING_ASSESSMENTS: '/api/teacher/assessments/existing',
    TEACHER_IMPORT_ASSESSMENTS: '/api/teacher/assessments/import',
    TEACHER_EXPORT_ASSESSMENTS: '/api/teacher/assessments/export',
    TEACHER_ASSIGNMENTS_QUIZZES: '/api/teacher/assignments-quizzes',
    TEACHER_SAVE_ASSESSMENTS: '/api/teacher/assessments/save',
    TEACHER_PUBLISH_ASSESSMENTS: '/api/teacher/assessments/publish',

    // Submissions
    SUBMISSIONS: '/api/submissions',
    SUBMISSION_BY_ID: (id) => `/api/submissions/${id}`,
    SUBMISSION_GRADE: (id) => `/api/submissions/${id}/grade`,
    SUBMISSION_FEEDBACK: (id) => `/api/submissions/${id}/feedback`,
    SUBMISSION_DOWNLOAD: (id) => `/api/submissions/${id}/download`,

    // Grades
    GRADES: '/api/grades',
    STUDENT_GRADES: (studentId) => `/api/grades/student/${studentId}`,

    // Attendance
    ATTENDANCE: '/api/attendance',
    STUDENT_ATTENDANCE: (studentId) => `/api/students/${studentId}/attendance`,

    // Announcements
    ANNOUNCEMENTS: '/api/announcements',

    // Events / Calendar
    EVENTS: '/api/events',
    EVENT_BY_UUID: (uuid) => `/api/events/${uuid}`,
    EVENTS_UPCOMING: '/api/events/upcoming',
    EVENTS_CALENDAR: '/api/events/calendar',
    EVENTS_ACADEMIC_CALENDAR: '/api/events/academic-calendar',
    EVENTS_BY_TYPE: (type) => `/api/events/type/${type}`,

    // Messages
    MESSAGES: '/api/messages',
    SEND_MESSAGE: '/api/messages/send',

    // Notifications
    NOTIFICATIONS: '/api/notifications',
    NOTIFICATION_SUMMARY: '/api/notifications/summary',
    NOTIFICATION_BY_ID: (id) => `/api/notifications/${id}`,
    NOTIFICATION_MARK_READ: (id) => `/api/notifications/${id}/read`,
    NOTIFICATION_MARK_ALL_READ: '/api/notifications/read-all',
    
    // Dashboard Stats
    SUPER_ADMIN_STATS: '/api/dashboard/superadmin',
    ADMIN_STATS: '/api/dashboard/admin',
    TEACHER_STATS: '/api/dashboard/teacher',
    STUDENT_STATS: '/api/dashboard/student',
    PARENT_STATS: '/api/dashboard/parent',
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
        password: 'Password@123',
    },
    [USER_ROLES.ADMIN]: {
        login: 'admin',
        password: 'Password@123',
    },
    [USER_ROLES.TEACHER]: {
        login: 'kofi.mensah',
        password: 'Password@123',
    },
    [USER_ROLES.STUDENT]: {
        login: 'kwame.osei',
        password: 'Password@123',
    },
    [USER_ROLES.PARENT]: {
        login: 'yaw.osei',
        password: 'Password@123',
    },
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_ENV,
        APP_NAME,
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
