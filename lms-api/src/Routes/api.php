<?php

return [
    // Auth routes (Public)
    'POST /auth/register' => ['controller' => 'AuthController', 'method' => 'register', 'auth' => false],
    'POST /auth/login' => ['controller' => 'AuthController', 'method' => 'login', 'auth' => false],
    'POST /auth/refresh' => ['controller' => 'AuthController', 'method' => 'refresh', 'auth' => false],
    'POST /auth/forgot-password' => ['controller' => 'AuthController', 'method' => 'forgotPassword', 'auth' => false],
    'POST /auth/reset-password' => ['controller' => 'AuthController', 'method' => 'resetPassword', 'auth' => false],

    // Auth routes (Protected)
    'GET /auth/me' => ['controller' => 'AuthController', 'method' => 'me', 'auth' => true],
    'POST /auth/logout' => ['controller' => 'AuthController', 'method' => 'logout', 'auth' => false],
    'POST /auth/change-password' => ['controller' => 'AuthController', 'method' => 'changePassword', 'auth' => true],

    // Dashboard routes (Protected)
    'GET /dashboard/superadmin' => ['controller' => 'DashboardController', 'method' => 'superAdminStats', 'auth' => true],
    'GET /dashboard/admin' => ['controller' => 'DashboardController', 'method' => 'adminStats', 'auth' => true],
    'GET /dashboard/teacher' => ['controller' => 'DashboardController', 'method' => 'teacherStats', 'auth' => true],
    'GET /dashboard/student' => ['controller' => 'DashboardController', 'method' => 'studentStats', 'auth' => true],
    'GET /dashboard/parent' => ['controller' => 'DashboardController', 'method' => 'parentStats', 'auth' => true],

    // Student routes
    'GET /students' => ['controller' => 'StudentController', 'method' => 'index', 'auth' => true],
    'GET /students/generate-id' => ['controller' => 'StudentController', 'method' => 'generateId', 'auth' => true],
    'GET /students/{uuid}' => ['controller' => 'StudentController', 'method' => 'show', 'auth' => true],
    'POST /students' => ['controller' => 'StudentController', 'method' => 'create', 'auth' => true],
    'PUT /students/{uuid}' => ['controller' => 'StudentController', 'method' => 'update', 'auth' => true],
    'PUT /students/{uuid}/status' => ['controller' => 'StudentController', 'method' => 'toggleStatus', 'auth' => true],
    'DELETE /students/{uuid}' => ['controller' => 'StudentController', 'method' => 'delete', 'auth' => true],
    'GET /students/{uuid}/courses' => ['controller' => 'StudentController', 'method' => 'getEnrolledCourses', 'auth' => true],
    'POST /students/enroll' => ['controller' => 'StudentController', 'method' => 'enrollInCourse', 'auth' => true],
    'DELETE /students/{uuid}/courses/{courseId}' => ['controller' => 'StudentController', 'method' => 'unenrollFromCourse', 'auth' => true],
    'PUT /enrollments/{id}' => ['controller' => 'StudentController', 'method' => 'updateEnrollment', 'auth' => true],
    'DELETE /enrollments/{id}' => ['controller' => 'StudentController', 'method' => 'deleteEnrollment', 'auth' => true],

    // Teacher routes
    'GET /teachers' => ['controller' => 'TeacherController', 'method' => 'index', 'auth' => true],
    'GET /teachers/generate-id' => ['controller' => 'TeacherController', 'method' => 'generateId', 'auth' => true],
    'GET /teachers/{uuid}' => ['controller' => 'TeacherController', 'method' => 'show', 'auth' => true],
    'POST /teachers' => ['controller' => 'TeacherController', 'method' => 'create', 'auth' => true],
    'PUT /teachers/{uuid}' => ['controller' => 'TeacherController', 'method' => 'update', 'auth' => true],
    'DELETE /teachers/{uuid}' => ['controller' => 'TeacherController', 'method' => 'delete', 'auth' => true],
    'GET /teachers/{uuid}/courses' => ['controller' => 'TeacherController', 'method' => 'getCourses', 'auth' => true],
    'GET /teachers/{uuid}/schedule' => ['controller' => 'TeacherController', 'method' => 'getSchedule', 'auth' => true],
    'GET /teachers/{uuid}/performance' => ['controller' => 'TeacherController', 'method' => 'getPerformance', 'auth' => true],

    // User Management routes
    'GET /users' => ['controller' => 'UserController', 'method' => 'index', 'auth' => true],
    'GET /users/{uuid}' => ['controller' => 'UserController', 'method' => 'show', 'auth' => true],
    'POST /users' => ['controller' => 'UserController', 'method' => 'create', 'auth' => true],
    'PUT /users/{uuid}' => ['controller' => 'UserController', 'method' => 'update', 'auth' => true],
    'DELETE /users/{uuid}' => ['controller' => 'UserController', 'method' => 'delete', 'auth' => true],
    'POST /users/{uuid}/roles' => ['controller' => 'UserController', 'method' => 'assignRole', 'auth' => true],
    'DELETE /users/{uuid}/roles/{roleId}' => ['controller' => 'UserController', 'method' => 'removeRole', 'auth' => true],
    'GET /users/{uuid}/activity' => ['controller' => 'UserController', 'method' => 'getActivity', 'auth' => true],
    'POST /users/{uuid}/reset-password' => ['controller' => 'UserController', 'method' => 'resetPassword', 'auth' => true],
    'POST /users/import' => ['controller' => 'UserController', 'method' => 'import', 'auth' => true],

    // Superadmin-prefixed user routes (used by frontend under /api/superadmin/users)
    'GET /superadmin/users' => ['controller' => 'UserController', 'method' => 'index', 'auth' => true],
    'GET /superadmin/users/{uuid}' => ['controller' => 'UserController', 'method' => 'show', 'auth' => true],
    'POST /superadmin/users' => ['controller' => 'UserController', 'method' => 'create', 'auth' => true],
    'PUT /superadmin/users/{uuid}' => ['controller' => 'UserController', 'method' => 'update', 'auth' => true],
    'DELETE /superadmin/users/{uuid}' => ['controller' => 'UserController', 'method' => 'delete', 'auth' => true],
    'POST /superadmin/users/{uuid}/roles' => ['controller' => 'UserController', 'method' => 'assignRoles', 'auth' => true],
    'POST /superadmin/users/{uuid}/reset-password' => ['controller' => 'UserController', 'method' => 'resetPassword', 'auth' => true],
    'POST /superadmin/users/bulk' => ['controller' => 'UserController', 'method' => 'bulk', 'auth' => true],
    'POST /superadmin/users/import' => ['controller' => 'UserController', 'method' => 'import', 'auth' => true],

    // Role routes
    'GET /roles' => ['controller' => 'RoleController', 'method' => 'index', 'auth' => true],
    'GET /roles/{id}' => ['controller' => 'RoleController', 'method' => 'show', 'auth' => true],
    'POST /roles' => ['controller' => 'RoleController', 'method' => 'create', 'auth' => true],
    'PUT /roles/{id}' => ['controller' => 'RoleController', 'method' => 'update', 'auth' => true],
    'DELETE /roles/{id}' => ['controller' => 'RoleController', 'method' => 'delete', 'auth' => true],
    'GET /roles/{id}/permissions' => ['controller' => 'RoleController', 'method' => 'getPermissions', 'auth' => true],
    'POST /roles/{id}/permissions' => ['controller' => 'RoleController', 'method' => 'assignPermission', 'auth' => true],
    'DELETE /roles/{id}/permissions/{permissionId}' => ['controller' => 'RoleController', 'method' => 'removePermission', 'auth' => true],
    // Return users assigned to a role (used by frontend users-by-role modal)
    'GET /roles/{id}/users' => ['controller' => 'RoleController', 'method' => 'getUsers', 'auth' => true],

    // Permission routes
    'GET /permissions' => ['controller' => 'PermissionController', 'method' => 'index', 'auth' => true],
    'GET /permissions/{id}' => ['controller' => 'PermissionController', 'method' => 'show', 'auth' => true],
    'POST /permissions' => ['controller' => 'PermissionController', 'method' => 'create', 'auth' => true],
    'PUT /permissions/{id}' => ['controller' => 'PermissionController', 'method' => 'update', 'auth' => true],
    'DELETE /permissions/{id}' => ['controller' => 'PermissionController', 'method' => 'delete', 'auth' => true],

    // System settings (frontend system page)
    'GET /system/settings' => ['controller' => 'SystemController', 'method' => 'getSettings', 'auth' => true],
    'PUT /system/settings' => ['controller' => 'SystemController', 'method' => 'updateSettings', 'auth' => true],

    // Notification routes
    'GET /notifications' => ['controller' => 'NotificationController', 'method' => 'index', 'auth' => true],
    'GET /notifications/summary' => ['controller' => 'NotificationController', 'method' => 'getSummary', 'auth' => true],
    'GET /notifications/unread-count' => ['controller' => 'NotificationController', 'method' => 'getUnreadCount', 'auth' => true],
    'GET /notifications/{uuid}' => ['controller' => 'NotificationController', 'method' => 'show', 'auth' => true],
    'POST /notifications' => ['controller' => 'NotificationController', 'method' => 'create', 'auth' => true],
    'PUT /notifications/read-all' => ['controller' => 'NotificationController', 'method' => 'markAllAsRead', 'auth' => true],
    'PUT /notifications/{uuid}/read' => ['controller' => 'NotificationController', 'method' => 'markAsRead', 'auth' => true],
    'DELETE /notifications/read' => ['controller' => 'NotificationController', 'method' => 'deleteAllRead', 'auth' => true],
    'DELETE /notifications/{uuid}' => ['controller' => 'NotificationController', 'method' => 'delete', 'auth' => true],

    // Announcement routes
    'GET /announcements' => ['controller' => 'AnnouncementController', 'method' => 'index', 'auth' => true],
    'GET /announcements/{uuid}' => ['controller' => 'AnnouncementController', 'method' => 'show', 'auth' => true],
    'POST /announcements' => ['controller' => 'AnnouncementController', 'method' => 'create', 'auth' => true],
    'PUT /announcements/{uuid}' => ['controller' => 'AnnouncementController', 'method' => 'update', 'auth' => true],
    'DELETE /announcements/{uuid}' => ['controller' => 'AnnouncementController', 'method' => 'delete', 'auth' => true],

    // Institution routes (Super Admin + Admin)
    'GET /institutions' => ['controller' => 'InstitutionController', 'method' => 'index', 'auth' => true],
    'GET /institutions/{uuid}' => ['controller' => 'InstitutionController', 'method' => 'show', 'auth' => true],
    'POST /institutions' => ['controller' => 'InstitutionController', 'method' => 'create', 'auth' => true],
    'PUT /institutions/{uuid}' => ['controller' => 'InstitutionController', 'method' => 'update', 'auth' => true],
    'DELETE /institutions/{uuid}' => ['controller' => 'InstitutionController', 'method' => 'delete', 'auth' => true],
    'GET /institutions/{uuid}/statistics' => ['controller' => 'InstitutionController', 'method' => 'getStatistics', 'auth' => true],
    'GET /institutions/{uuid}/users' => ['controller' => 'InstitutionController', 'method' => 'getUsers', 'auth' => true],
    'GET /institutions/{uuid}/programs' => ['controller' => 'InstitutionController', 'method' => 'getPrograms', 'auth' => true],
    'GET /institutions/{uuid}/classes' => ['controller' => 'InstitutionController', 'method' => 'getClasses', 'auth' => true],
    'PUT /institutions/{uuid}/status' => ['controller' => 'InstitutionController', 'method' => 'updateStatus', 'auth' => true],
    'GET /institutions/{uuid}/settings' => ['controller' => 'InstitutionController', 'method' => 'getSettings', 'auth' => true],
    'PUT /institutions/{uuid}/settings' => ['controller' => 'InstitutionController', 'method' => 'updateSettings', 'auth' => true],
    'GET /institutions/{uuid}/timetable-publish-state' => ['controller' => 'InstitutionController', 'method' => 'getTimetablePublishState', 'auth' => true],
    'PUT /institutions/{uuid}/timetable-publish-state' => ['controller' => 'InstitutionController', 'method' => 'updateTimetablePublishState', 'auth' => true],
    'GET /institutions/{uuid}/timetable-period-slots' => ['controller' => 'InstitutionController', 'method' => 'getTimetablePeriodSlots', 'auth' => true],
    'PUT /institutions/{uuid}/timetable-period-slots' => ['controller' => 'InstitutionController', 'method' => 'updateTimetablePeriodSlots', 'auth' => true],

    // Program routes (Ghana SHS: General Arts, General Science, Business, etc.)
    'GET /programs' => ['controller' => 'ProgramController', 'method' => 'index', 'auth' => true],
    'GET /programs/active' => ['controller' => 'ProgramController', 'method' => 'getActivePrograms', 'auth' => true],
    'GET /programs/{id}' => ['controller' => 'ProgramController', 'method' => 'show', 'auth' => true],
    'POST /programs' => ['controller' => 'ProgramController', 'method' => 'create', 'auth' => true],
    'PUT /programs/{id}' => ['controller' => 'ProgramController', 'method' => 'update', 'auth' => true],
    'DELETE /programs/{id}' => ['controller' => 'ProgramController', 'method' => 'delete', 'auth' => true],
    'GET /programs/{id}/classes' => ['controller' => 'ProgramController', 'method' => 'getClasses', 'auth' => true],

    // Grade Level routes (Ghana SHS: SHS 1, SHS 2, SHS 3)
    'GET /grade-levels' => ['controller' => 'GradeLevelController', 'method' => 'index', 'auth' => true],
    'GET /grade-levels/active' => ['controller' => 'GradeLevelController', 'method' => 'getActiveGradeLevels', 'auth' => true],
    'GET /grade-levels/{id}' => ['controller' => 'GradeLevelController', 'method' => 'show', 'auth' => true],
    'POST /grade-levels' => ['controller' => 'GradeLevelController', 'method' => 'create', 'auth' => true],
    'PUT /grade-levels/{id}' => ['controller' => 'GradeLevelController', 'method' => 'update', 'auth' => true],
    'DELETE /grade-levels/{id}' => ['controller' => 'GradeLevelController', 'method' => 'delete', 'auth' => true],
    'GET /grade-levels/{id}/classes' => ['controller' => 'GradeLevelController', 'method' => 'getClasses', 'auth' => true],

    // Class routes (Homeroom classes: e.g., SHS 1 Art 1, SHS 2 Science 2)
    'GET /classes' => ['controller' => 'ClassController', 'method' => 'index', 'auth' => true],
    'GET /classes/{uuid}' => ['controller' => 'ClassController', 'method' => 'show', 'auth' => true],
    'POST /classes' => ['controller' => 'ClassController', 'method' => 'create', 'auth' => true],
    'PUT /classes/{uuid}' => ['controller' => 'ClassController', 'method' => 'update', 'auth' => true],
    'DELETE /classes/{uuid}' => ['controller' => 'ClassController', 'method' => 'delete', 'auth' => true],
    'GET /classes/{uuid}/students' => ['controller' => 'ClassController', 'method' => 'getStudents', 'auth' => true],
    'GET /classes/{uuid}/class-subjects' => ['controller' => 'ClassController', 'method' => 'getClassSubjects', 'auth' => true],
    'GET /classes/{uuid}/schedule' => ['controller' => 'ClassController', 'method' => 'getSchedule', 'auth' => true],
    'GET /classes/{uuid}/performance' => ['controller' => 'ClassController', 'method' => 'getPerformance', 'auth' => true],
    'POST /classes/{uuid}/assign-teacher' => ['controller' => 'ClassController', 'method' => 'assignTeacher', 'auth' => true],

    // Course routes (now Class Subjects in Ghana SHS terminology)
    'GET /class-subjects' => ['controller' => 'ClassSubjectController', 'method' => 'index', 'auth' => true],
    'GET /class-subjects/{id}' => ['controller' => 'ClassSubjectController', 'method' => 'show', 'auth' => true],
    'POST /class-subjects' => ['controller' => 'ClassSubjectController', 'method' => 'create', 'auth' => true],
    'PUT /class-subjects/{id}' => ['controller' => 'ClassSubjectController', 'method' => 'update', 'auth' => true],
    'DELETE /class-subjects/{id}' => ['controller' => 'ClassSubjectController', 'method' => 'delete', 'auth' => true],
    'GET /class-subjects/{id}/students' => ['controller' => 'ClassSubjectController', 'method' => 'getEnrolledStudents', 'auth' => true],
    'GET /class-subjects/{id}/materials' => ['controller' => 'ClassSubjectController', 'method' => 'getMaterials', 'auth' => true],
    'GET /class-subjects/{id}/materials/required-progress' => ['controller' => 'ClassSubjectController', 'method' => 'getRequiredMaterialProgress', 'auth' => true],
    'POST /class-subjects/{id}/materials' => ['controller' => 'ClassSubjectController', 'method' => 'createMaterial', 'auth' => true],
    'POST /class-subjects/{courseId}/materials/{materialId}/complete' => ['controller' => 'ClassSubjectController', 'method' => 'completeMaterial', 'auth' => true],
    'PUT /class-subjects/{courseId}/materials/{materialId}' => ['controller' => 'ClassSubjectController', 'method' => 'updateMaterial', 'auth' => true],
    'DELETE /class-subjects/{courseId}/materials/{materialId}' => ['controller' => 'ClassSubjectController', 'method' => 'deleteMaterial', 'auth' => true],
    'GET /class-subjects/{id}/content' => ['controller' => 'ClassSubjectController', 'method' => 'getContent', 'auth' => true],
    'POST /class-subjects/{id}/content' => ['controller' => 'ClassSubjectController', 'method' => 'createContent', 'auth' => true],
    'PUT /class-subjects/{courseId}/content/{contentId}' => ['controller' => 'ClassSubjectController', 'method' => 'updateContent', 'auth' => true],
    'DELETE /class-subjects/{courseId}/content/{contentId}' => ['controller' => 'ClassSubjectController', 'method' => 'deleteContent', 'auth' => true],
    'GET /class-subjects/{id}/assessments' => ['controller' => 'ClassSubjectController', 'method' => 'getAssessments', 'auth' => true],
    'GET /class-subjects/{id}/reviews' => ['controller' => 'ClassSubjectController', 'method' => 'getReviews', 'auth' => true],
    'POST /class-subjects/{id}/reviews' => ['controller' => 'ClassSubjectController', 'method' => 'createReview', 'auth' => true],
    'PUT /class-subjects/{courseId}/reviews/{reviewId}' => ['controller' => 'ClassSubjectController', 'method' => 'updateReview', 'auth' => true],
    'DELETE /class-subjects/{courseId}/reviews/{reviewId}' => ['controller' => 'ClassSubjectController', 'method' => 'deleteReview', 'auth' => true],
    'GET /class-subjects/{id}/schedules' => ['controller' => 'ClassSubjectController', 'method' => 'getSchedules', 'auth' => true],
    'POST /class-subjects/{id}/schedules' => ['controller' => 'ClassSubjectController', 'method' => 'createSchedule', 'auth' => true],
    'PUT /class-subjects/{courseId}/schedules/{scheduleId}' => ['controller' => 'ClassSubjectController', 'method' => 'updateSchedule', 'auth' => true],
    'PUT /class-subjects/{courseId}/schedules/{scheduleId}/status' => ['controller' => 'ClassSubjectController', 'method' => 'updateSchedule', 'auth' => true],
    'DELETE /class-subjects/{courseId}/schedules/{scheduleId}' => ['controller' => 'ClassSubjectController', 'method' => 'deleteSchedule', 'auth' => true],
    'POST /class-subjects/{id}/assign-teacher' => ['controller' => 'ClassSubjectController', 'method' => 'assignTeacher', 'auth' => true],

    // Backward compatibility: Keep old /courses routes pointing to ClassSubjectController
    'GET /courses' => ['controller' => 'ClassSubjectController', 'method' => 'index', 'auth' => true],
    'GET /courses/{id}' => ['controller' => 'ClassSubjectController', 'method' => 'show', 'auth' => true],
    'POST /courses' => ['controller' => 'ClassSubjectController', 'method' => 'create', 'auth' => true],
    'PUT /courses/{id}' => ['controller' => 'ClassSubjectController', 'method' => 'update', 'auth' => true],
    'DELETE /courses/{id}' => ['controller' => 'ClassSubjectController', 'method' => 'delete', 'auth' => true],
    'GET /courses/{id}/students' => ['controller' => 'ClassSubjectController', 'method' => 'getEnrolledStudents', 'auth' => true],
    'GET /courses/{id}/materials' => ['controller' => 'ClassSubjectController', 'method' => 'getMaterials', 'auth' => true],
    'GET /courses/{id}/materials/required-progress' => ['controller' => 'ClassSubjectController', 'method' => 'getRequiredMaterialProgress', 'auth' => true],
    'POST /courses/{id}/materials' => ['controller' => 'ClassSubjectController', 'method' => 'createMaterial', 'auth' => true],
    'POST /courses/{courseId}/materials/{materialId}/complete' => ['controller' => 'ClassSubjectController', 'method' => 'completeMaterial', 'auth' => true],
    'PUT /courses/{courseId}/materials/{materialId}' => ['controller' => 'ClassSubjectController', 'method' => 'updateMaterial', 'auth' => true],
    'DELETE /courses/{courseId}/materials/{materialId}' => ['controller' => 'ClassSubjectController', 'method' => 'deleteMaterial', 'auth' => true],
    'GET /courses/{id}/assessments' => ['controller' => 'ClassSubjectController', 'method' => 'getAssessments', 'auth' => true],
    'GET /courses/{id}/reviews' => ['controller' => 'ClassSubjectController', 'method' => 'getReviews', 'auth' => true],
    'POST /courses/{id}/reviews' => ['controller' => 'ClassSubjectController', 'method' => 'createReview', 'auth' => true],
    'PUT /courses/{courseId}/reviews/{reviewId}' => ['controller' => 'ClassSubjectController', 'method' => 'updateReview', 'auth' => true],
    'DELETE /courses/{courseId}/reviews/{reviewId}' => ['controller' => 'ClassSubjectController', 'method' => 'deleteReview', 'auth' => true],
    'GET /courses/{id}/schedules' => ['controller' => 'ClassSubjectController', 'method' => 'getSchedules', 'auth' => true],
    'POST /courses/{id}/schedules' => ['controller' => 'ClassSubjectController', 'method' => 'createSchedule', 'auth' => true],
    'PUT /courses/{courseId}/schedules/{scheduleId}' => ['controller' => 'ClassSubjectController', 'method' => 'updateSchedule', 'auth' => true],
    'PUT /courses/{courseId}/schedules/{scheduleId}/status' => ['controller' => 'ClassSubjectController', 'method' => 'updateSchedule', 'auth' => true],
    'DELETE /courses/{courseId}/schedules/{scheduleId}' => ['controller' => 'ClassSubjectController', 'method' => 'deleteSchedule', 'auth' => true],

    // Assessment routes
    'GET /assessments' => ['controller' => 'AssessmentController', 'method' => 'index', 'auth' => true],
    'GET /assessments/{id}' => ['controller' => 'AssessmentController', 'method' => 'show', 'auth' => true],
    'POST /assessments' => ['controller' => 'AssessmentController', 'method' => 'create', 'auth' => true],
    'PUT /assessments/{id}' => ['controller' => 'AssessmentController', 'method' => 'update', 'auth' => true],
    'DELETE /assessments/{id}' => ['controller' => 'AssessmentController', 'method' => 'delete', 'auth' => true],
    'POST /assessments/{id}/submit' => ['controller' => 'AssessmentController', 'method' => 'submit', 'auth' => true],
    'GET /assessments/{id}/submissions' => ['controller' => 'AssessmentController', 'method' => 'getSubmissions', 'auth' => true],
    'POST /submissions/{submissionId}/grade' => ['controller' => 'AssessmentController', 'method' => 'gradeSubmission', 'auth' => true],
    'PUT /submissions/{id}' => ['controller' => 'AssessmentController', 'method' => 'updateSubmission', 'auth' => true],
    'DELETE /submissions/{id}' => ['controller' => 'AssessmentController', 'method' => 'deleteSubmission', 'auth' => true],

    // Attendance routes
    'GET /students/{studentId}/attendance' => ['controller' => 'AttendanceController', 'method' => 'getStudentAttendance', 'auth' => true],
    'GET /courses/{courseId}/attendance' => ['controller' => 'AttendanceController', 'method' => 'getCourseAttendance', 'auth' => true],
    'GET /attendance/summary' => ['controller' => 'AttendanceController', 'method' => 'getInstitutionSummary', 'auth' => true],
    'GET /students/{studentId}/attendance/stats' => ['controller' => 'AttendanceController', 'method' => 'getAttendanceStats', 'auth' => true],
    'POST /attendance' => ['controller' => 'AttendanceController', 'method' => 'markAttendance', 'auth' => true],
    'POST /attendance/bulk' => ['controller' => 'AttendanceController', 'method' => 'bulkMarkAttendance', 'auth' => true],
    'PUT /attendance/{id}' => ['controller' => 'AttendanceController', 'method' => 'update', 'auth' => true],
    'DELETE /attendance/{id}' => ['controller' => 'AttendanceController', 'method' => 'delete', 'auth' => true],

    // Academic Year routes
    'GET /academic-years' => ['controller' => 'AcademicYearController', 'method' => 'index', 'auth' => true],
    'GET /academic-years/current' => ['controller' => 'AcademicYearController', 'method' => 'getCurrent', 'auth' => true],
    'GET /academic-years/{id}' => ['controller' => 'AcademicYearController', 'method' => 'show', 'auth' => true],
    'POST /academic-years' => ['controller' => 'AcademicYearController', 'method' => 'create', 'auth' => true],
    'PUT /academic-years/{id}' => ['controller' => 'AcademicYearController', 'method' => 'update', 'auth' => true],
    'DELETE /academic-years/{id}' => ['controller' => 'AcademicYearController', 'method' => 'delete', 'auth' => true],

    // Semester routes
    'GET /semesters' => ['controller' => 'SemesterController', 'method' => 'index', 'auth' => true],
    'GET /semesters/current' => ['controller' => 'SemesterController', 'method' => 'getCurrent', 'auth' => true],
    'GET /semesters/{id}' => ['controller' => 'SemesterController', 'method' => 'show', 'auth' => true],
    'POST /semesters' => ['controller' => 'SemesterController', 'method' => 'create', 'auth' => true],
    'PUT /semesters/{id}' => ['controller' => 'SemesterController', 'method' => 'update', 'auth' => true],
    'DELETE /semesters/{id}' => ['controller' => 'SemesterController', 'method' => 'delete', 'auth' => true],

    // Subject routes
    'GET /subjects' => ['controller' => 'SubjectController', 'method' => 'index', 'auth' => true],
    'GET /subjects/core' => ['controller' => 'SubjectController', 'method' => 'getCoreSubjects', 'auth' => true],
    'GET /subjects/{uuid}' => ['controller' => 'SubjectController', 'method' => 'show', 'auth' => true],
    'POST /subjects' => ['controller' => 'SubjectController', 'method' => 'create', 'auth' => true],
    'PUT /subjects/{uuid}' => ['controller' => 'SubjectController', 'method' => 'update', 'auth' => true],
    'DELETE /subjects/{uuid}' => ['controller' => 'SubjectController', 'method' => 'delete', 'auth' => true],

    // Parent routes
    'GET /parents' => ['controller' => 'ParentController', 'method' => 'index', 'auth' => true],
    'GET /parents/{id}' => ['controller' => 'ParentController', 'method' => 'show', 'auth' => true],
    'GET /parents/{id}/students' => ['controller' => 'ParentController', 'method' => 'getStudents', 'auth' => true],
    'POST /parents' => ['controller' => 'ParentController', 'method' => 'create', 'auth' => true],
    'PUT /parents/{id}' => ['controller' => 'ParentController', 'method' => 'update', 'auth' => true],
    'DELETE /parents/{id}' => ['controller' => 'ParentController', 'method' => 'delete', 'auth' => true],

    // Grade Scale routes
    'GET /grade-scales' => ['controller' => 'GradeScaleController', 'method' => 'index', 'auth' => true],
    'GET /grade-scales/{id}' => ['controller' => 'GradeScaleController', 'method' => 'show', 'auth' => true],
    'POST /grade-scales' => ['controller' => 'GradeScaleController', 'method' => 'create', 'auth' => true],
    'PUT /grade-scales/{id}' => ['controller' => 'GradeScaleController', 'method' => 'update', 'auth' => true],
    'DELETE /grade-scales/{id}' => ['controller' => 'GradeScaleController', 'method' => 'delete', 'auth' => true],

    // Assessment Category routes
    'GET /assessment-categories' => ['controller' => 'AssessmentCategoryController', 'method' => 'index', 'auth' => true],
    'GET /assessment-categories/{id}' => ['controller' => 'AssessmentCategoryController', 'method' => 'show', 'auth' => true],
    'POST /assessment-categories' => ['controller' => 'AssessmentCategoryController', 'method' => 'create', 'auth' => true],
    'PUT /assessment-categories/{id}' => ['controller' => 'AssessmentCategoryController', 'method' => 'update', 'auth' => true],
    'DELETE /assessment-categories/{id}' => ['controller' => 'AssessmentCategoryController', 'method' => 'delete', 'auth' => true],

    // Result routes
    'GET /students/{studentId}/results' => ['controller' => 'ResultController', 'method' => 'getStudentResults', 'auth' => true],
    'GET /courses/{courseId}/results' => ['controller' => 'ResultController', 'method' => 'getCourseResults', 'auth' => true],
    'GET /results/{id}' => ['controller' => 'ResultController', 'method' => 'show', 'auth' => true],
    'POST /results' => ['controller' => 'ResultController', 'method' => 'create', 'auth' => true],
    'PUT /results/{id}' => ['controller' => 'ResultController', 'method' => 'update', 'auth' => true],
    'DELETE /results/{id}' => ['controller' => 'ResultController', 'method' => 'delete', 'auth' => true],

    // Teacher Subject routes
    'GET /teachers/{teacherId}/subjects' => ['controller' => 'TeacherSubjectController', 'method' => 'getTeacherSubjects', 'auth' => true],
    'GET /subjects/{subjectId}/teachers' => ['controller' => 'TeacherSubjectController', 'method' => 'getSubjectTeachers', 'auth' => true],
    'GET /teacher-subjects/{id}' => ['controller' => 'TeacherSubjectController', 'method' => 'show', 'auth' => true],
    'POST /teacher-subjects' => ['controller' => 'TeacherSubjectController', 'method' => 'create', 'auth' => true],
    'PUT /teacher-subjects/{id}' => ['controller' => 'TeacherSubjectController', 'method' => 'update', 'auth' => true],
    'DELETE /teacher-subjects/{id}' => ['controller' => 'TeacherSubjectController', 'method' => 'delete', 'auth' => true],

    // Parent Student routes
    'GET /parents/{parentId}/students' => ['controller' => 'ParentStudentController', 'method' => 'getParentStudents', 'auth' => true],
    'GET /students/{studentId}/parents' => ['controller' => 'ParentStudentController', 'method' => 'getStudentParents', 'auth' => true],
    'GET /parent-students/{id}' => ['controller' => 'ParentStudentController', 'method' => 'show', 'auth' => true],
    'POST /parent-students' => ['controller' => 'ParentStudentController', 'method' => 'create', 'auth' => true],
    'PUT /parent-students/{id}' => ['controller' => 'ParentStudentController', 'method' => 'update', 'auth' => true],
    'DELETE /parent-students/{id}' => ['controller' => 'ParentStudentController', 'method' => 'delete', 'auth' => true],

    // Course Sections routes
    'GET /courses/{courseId}/sections' => ['controller' => 'CourseSectionController', 'method' => 'index', 'auth' => true],
    'POST /courses/{courseId}/sections' => ['controller' => 'CourseSectionController', 'method' => 'create', 'auth' => true],
    'PUT /courses/{courseId}/sections/{sectionId}' => ['controller' => 'CourseSectionController', 'method' => 'update', 'auth' => true],
    'DELETE /courses/{courseId}/sections/{sectionId}' => ['controller' => 'CourseSectionController', 'method' => 'delete', 'auth' => true],

    // Assignment routes
    'GET /courses/{courseId}/assignments' => ['controller' => 'AssignmentController', 'method' => 'getByCourse', 'auth' => true],
    'GET /assignments/my' => ['controller' => 'AssignmentController', 'method' => 'getMyAssignments', 'auth' => true],
    'GET /assignments/{uuid}' => ['controller' => 'AssignmentController', 'method' => 'show', 'auth' => true],
    'POST /assignments' => ['controller' => 'AssignmentController', 'method' => 'create', 'auth' => true],
    'PUT /assignments/{uuid}' => ['controller' => 'AssignmentController', 'method' => 'update', 'auth' => true],
    'DELETE /assignments/{uuid}' => ['controller' => 'AssignmentController', 'method' => 'delete', 'auth' => true],
    'GET /assignments/{uuid}/submissions' => ['controller' => 'AssignmentController', 'method' => 'getSubmissions', 'auth' => true],
    'POST /assignments/{uuid}/submissions/publish' => ['controller' => 'AssignmentController', 'method' => 'publishSubmissionGrades', 'auth' => true],
    'GET /assignments/{uuid}/submissions/download-all' => ['controller' => 'AssignmentController', 'method' => 'downloadAllSubmissions', 'auth' => true],
    'POST /assignments/{uuid}/submit' => ['controller' => 'AssignmentController', 'method' => 'submit', 'auth' => true],
    'PUT /assignment-submissions/{id}/grade' => ['controller' => 'AssignmentController', 'method' => 'gradeSubmission', 'auth' => true],

    // Quiz routes
    'GET /courses/{courseId}/quizzes' => ['controller' => 'QuizController', 'method' => 'getByCourse', 'auth' => true],
    'GET /quizzes/{id}' => ['controller' => 'QuizController', 'method' => 'show', 'auth' => true],
    'POST /quizzes' => ['controller' => 'QuizController', 'method' => 'create', 'auth' => true],
    'PUT /quizzes/{id}' => ['controller' => 'QuizController', 'method' => 'update', 'auth' => true],
    'DELETE /quizzes/{id}' => ['controller' => 'QuizController', 'method' => 'delete', 'auth' => true],
    'GET /quizzes/{id}/questions' => ['controller' => 'QuizController', 'method' => 'getQuestions', 'auth' => true],
    'POST /quizzes/{id}/questions' => ['controller' => 'QuizController', 'method' => 'addQuestion', 'auth' => true],
    'POST /quizzes/{id}/start' => ['controller' => 'QuizController', 'method' => 'startQuiz', 'auth' => true],
    'POST /quiz-submissions/{id}/submit' => ['controller' => 'QuizController', 'method' => 'submitQuiz', 'auth' => true],
    'GET /quiz-submissions/{id}' => ['controller' => 'QuizController', 'method' => 'getSubmissionResults', 'auth' => true],
    'GET /quizzes/{id}/my-attempts' => ['controller' => 'QuizController', 'method' => 'getMyAttempts', 'auth' => true],

    // Message routes (Private Messaging)
    'GET /messages/inbox' => ['controller' => 'MessageController', 'method' => 'getInbox', 'auth' => true],
    'GET /messages/sent' => ['controller' => 'MessageController', 'method' => 'getSent', 'auth' => true],
    'GET /messages/unread-count' => ['controller' => 'MessageController', 'method' => 'getUnreadCount', 'auth' => true],
    'GET /messages/conversation/{userId}' => ['controller' => 'MessageController', 'method' => 'getConversation', 'auth' => true],
    'GET /messages/{uuid}' => ['controller' => 'MessageController', 'method' => 'show', 'auth' => true],
    'POST /messages' => ['controller' => 'MessageController', 'method' => 'send', 'auth' => true],
    'PUT /messages/{uuid}/read' => ['controller' => 'MessageController', 'method' => 'markAsRead', 'auth' => true],
    'DELETE /messages/{uuid}' => ['controller' => 'MessageController', 'method' => 'delete', 'auth' => true],

    // Login Activity routes (Audit Logs)
    'GET /login-activity' => ['controller' => 'LoginActivityController', 'method' => 'index', 'auth' => true],
    'GET /login-activity/my-history' => ['controller' => 'LoginActivityController', 'method' => 'getMyHistory', 'auth' => true],
    'GET /login-activity/recent' => ['controller' => 'LoginActivityController', 'method' => 'getRecent', 'auth' => true],
    'GET /login-activity/failed' => ['controller' => 'LoginActivityController', 'method' => 'getFailedAttempts', 'auth' => true],
    'GET /users/{id}/login-activity' => ['controller' => 'LoginActivityController', 'method' => 'getUserHistory', 'auth' => true],

    // Error Log routes (Admin Monitoring)
    'GET /error-logs' => ['controller' => 'ErrorLogController', 'method' => 'index', 'auth' => true],
    'GET /error-logs/unresolved' => ['controller' => 'ErrorLogController', 'method' => 'getUnresolved', 'auth' => true],
    'GET /error-logs/severity/{severity}' => ['controller' => 'ErrorLogController', 'method' => 'getBySeverity', 'auth' => true],
    'GET /error-logs/{id}' => ['controller' => 'ErrorLogController', 'method' => 'show', 'auth' => true],
    'POST /error-logs' => ['controller' => 'ErrorLogController', 'method' => 'create', 'auth' => true],
    'PUT /error-logs/{id}/resolve' => ['controller' => 'ErrorLogController', 'method' => 'markResolved', 'auth' => true],
    'DELETE /error-logs/{id}' => ['controller' => 'ErrorLogController', 'method' => 'delete', 'auth' => true],

    // Event routes (Calendar & Events Management)
    'GET /events' => ['controller' => 'EventController', 'method' => 'index', 'auth' => true],
    'GET /events/upcoming' => ['controller' => 'EventController', 'method' => 'getUpcoming', 'auth' => true],
    'GET /events/calendar' => ['controller' => 'EventController', 'method' => 'getCalendar', 'auth' => true],
    'GET /events/academic-calendar' => ['controller' => 'EventController', 'method' => 'getAcademicCalendar', 'auth' => true],
    'GET /events/type/{type}' => ['controller' => 'EventController', 'method' => 'getByType', 'auth' => true],
    'GET /events/{uuid}' => ['controller' => 'EventController', 'method' => 'show', 'auth' => true],
    'POST /events' => ['controller' => 'EventController', 'method' => 'create', 'auth' => true],
    'PUT /events/{uuid}' => ['controller' => 'EventController', 'method' => 'update', 'auth' => true],
    'DELETE /events/{uuid}' => ['controller' => 'EventController', 'method' => 'delete', 'auth' => true],

    // Grade Report routes (Report Cards, Transcripts)
    'GET /grade-reports' => ['controller' => 'GradeReportController', 'method' => 'index', 'auth' => true],
    'GET /grade-reports/stats' => ['controller' => 'GradeReportController', 'method' => 'getStatistics', 'auth' => true],
    'GET /grade-reports/class/{classId}' => ['controller' => 'GradeReportController', 'method' => 'getClassReports', 'auth' => true],
    'GET /grade-reports/student/{studentId}/report-card' => ['controller' => 'GradeReportController', 'method' => 'getReportCard', 'auth' => true],
    'GET /grade-reports/student/{studentId}/transcript' => ['controller' => 'GradeReportController', 'method' => 'getTranscript', 'auth' => true],
    'GET /grade-reports/{uuid}' => ['controller' => 'GradeReportController', 'method' => 'show', 'auth' => true],
    'POST /grade-reports/generate' => ['controller' => 'GradeReportController', 'method' => 'generate', 'auth' => true],
    'POST /grade-reports/bulk-generate' => ['controller' => 'GradeReportController', 'method' => 'bulkGenerate', 'auth' => true],
    'PUT /grade-reports/{uuid}' => ['controller' => 'GradeReportController', 'method' => 'update', 'auth' => true],
    'PUT /grade-reports/{uuid}/publish' => ['controller' => 'GradeReportController', 'method' => 'publish', 'auth' => true],
    'DELETE /grade-reports/{uuid}' => ['controller' => 'GradeReportController', 'method' => 'delete', 'auth' => true],

    // User Activity routes (Activity Tracking & Audit Trail)
    'GET /user-activity' => ['controller' => 'UserActivityController', 'method' => 'index', 'auth' => true],
    'GET /user-activity/recent' => ['controller' => 'UserActivityController', 'method' => 'getRecent', 'auth' => true],
    'GET /user-activity/stats' => ['controller' => 'UserActivityController', 'method' => 'getStatistics', 'auth' => true],
    'GET /user-activity/audit-trail' => ['controller' => 'UserActivityController', 'method' => 'getAuditTrail', 'auth' => true],
    'GET /user-activity/user/{userId}' => ['controller' => 'UserActivityController', 'method' => 'getUserHistory', 'auth' => true],
    'GET /user-activity/action/{action}' => ['controller' => 'UserActivityController', 'method' => 'getByAction', 'auth' => true],
    'GET /user-activity/entity/{entityType}/{entityId}' => ['controller' => 'UserActivityController', 'method' => 'getByEntity', 'auth' => true],
    'GET /user-activity/{id}' => ['controller' => 'UserActivityController', 'method' => 'show', 'auth' => true],
    'POST /user-activity' => ['controller' => 'UserActivityController', 'method' => 'log', 'auth' => true],
    'DELETE /user-activity/cleanup' => ['controller' => 'UserActivityController', 'method' => 'cleanup', 'auth' => true],

    // Admin Activity routes (Institution-level audit trail, admin only)
    'GET /admin-activity' => ['controller' => 'AdminActivityController', 'method' => 'index', 'auth' => true],
    'GET /admin-activity/recent' => ['controller' => 'AdminActivityController', 'method' => 'recent', 'auth' => true],
    'GET /admin-activity/stats' => ['controller' => 'AdminActivityController', 'method' => 'stats', 'auth' => true],
    'GET /admin-activity/type/{type}' => ['controller' => 'AdminActivityController', 'method' => 'byType', 'auth' => true],
    'GET /admin-activity/severity/{severity}' => ['controller' => 'AdminActivityController', 'method' => 'bySeverity', 'auth' => true],
    'GET /admin-activity/performer/{userId}' => ['controller' => 'AdminActivityController', 'method' => 'byPerformer', 'auth' => true],
    'GET /admin-activity/{id}' => ['controller' => 'AdminActivityController', 'method' => 'show', 'auth' => true],
    'POST /admin-activity' => ['controller' => 'AdminActivityController', 'method' => 'store', 'auth' => true],
    'DELETE /admin-activity/cleanup' => ['controller' => 'AdminActivityController', 'method' => 'cleanup', 'auth' => true],

    // Superadmin Activity routes (Platform-level audit trail, super admin only)
    'GET /superadmin-activity' => ['controller' => 'SuperadminActivityController', 'method' => 'index', 'auth' => true],
    'GET /superadmin-activity/recent' => ['controller' => 'SuperadminActivityController', 'method' => 'recent', 'auth' => true],
    'GET /superadmin-activity/stats' => ['controller' => 'SuperadminActivityController', 'method' => 'stats', 'auth' => true],
    'GET /superadmin-activity/type/{type}' => ['controller' => 'SuperadminActivityController', 'method' => 'byType', 'auth' => true],
    'GET /superadmin-activity/severity/{severity}' => ['controller' => 'SuperadminActivityController', 'method' => 'bySeverity', 'auth' => true],
    'GET /superadmin-activity/performer/{userId}' => ['controller' => 'SuperadminActivityController', 'method' => 'byPerformer', 'auth' => true],
    'GET /superadmin-activity/{id}' => ['controller' => 'SuperadminActivityController', 'method' => 'show', 'auth' => true],
    'POST /superadmin-activity' => ['controller' => 'SuperadminActivityController', 'method' => 'store', 'auth' => true],
    'DELETE /superadmin-activity/cleanup' => ['controller' => 'SuperadminActivityController', 'method' => 'cleanup', 'auth' => true],

    // Teacher Activity routes
    'GET /teacher-activity' => ['controller' => 'TeacherActivityController', 'method' => 'index', 'auth' => true],
    'GET /teacher-activity/recent' => ['controller' => 'TeacherActivityController', 'method' => 'recent', 'auth' => true],
    'GET /teacher-activity/stats' => ['controller' => 'TeacherActivityController', 'method' => 'stats', 'auth' => true],
    'GET /teacher-activity/type/{type}' => ['controller' => 'TeacherActivityController', 'method' => 'byType', 'auth' => true],
    'GET /teacher-activity/severity/{severity}' => ['controller' => 'TeacherActivityController', 'method' => 'bySeverity', 'auth' => true],
    'GET /teacher-activity/performer/{userId}' => ['controller' => 'TeacherActivityController', 'method' => 'byPerformer', 'auth' => true],
    'GET /teacher-activity/{id}' => ['controller' => 'TeacherActivityController', 'method' => 'show', 'auth' => true],
    'POST /teacher-activity' => ['controller' => 'TeacherActivityController', 'method' => 'store', 'auth' => true],
    'DELETE /teacher-activity/cleanup' => ['controller' => 'TeacherActivityController', 'method' => 'cleanup', 'auth' => true],

    // Student Activity routes
    'GET /student-activity' => ['controller' => 'StudentActivityController', 'method' => 'index', 'auth' => true],
    'GET /student-activity/recent' => ['controller' => 'StudentActivityController', 'method' => 'recent', 'auth' => true],
    'GET /student-activity/stats' => ['controller' => 'StudentActivityController', 'method' => 'stats', 'auth' => true],
    'GET /student-activity/type/{type}' => ['controller' => 'StudentActivityController', 'method' => 'byType', 'auth' => true],
    'GET /student-activity/severity/{severity}' => ['controller' => 'StudentActivityController', 'method' => 'bySeverity', 'auth' => true],
    'GET /student-activity/performer/{userId}' => ['controller' => 'StudentActivityController', 'method' => 'byPerformer', 'auth' => true],
    'GET /student-activity/{id}' => ['controller' => 'StudentActivityController', 'method' => 'show', 'auth' => true],
    'POST /student-activity' => ['controller' => 'StudentActivityController', 'method' => 'store', 'auth' => true],
    'DELETE /student-activity/cleanup' => ['controller' => 'StudentActivityController', 'method' => 'cleanup', 'auth' => true],

    // Parent Activity routes
    'GET /parent-activity' => ['controller' => 'ParentActivityController', 'method' => 'index', 'auth' => true],
    'GET /parent-activity/recent' => ['controller' => 'ParentActivityController', 'method' => 'recent', 'auth' => true],
    'GET /parent-activity/stats' => ['controller' => 'ParentActivityController', 'method' => 'stats', 'auth' => true],
    'GET /parent-activity/type/{type}' => ['controller' => 'ParentActivityController', 'method' => 'byType', 'auth' => true],
    'GET /parent-activity/severity/{severity}' => ['controller' => 'ParentActivityController', 'method' => 'bySeverity', 'auth' => true],
    'GET /parent-activity/performer/{userId}' => ['controller' => 'ParentActivityController', 'method' => 'byPerformer', 'auth' => true],
    'GET /parent-activity/{id}' => ['controller' => 'ParentActivityController', 'method' => 'show', 'auth' => true],
    'POST /parent-activity' => ['controller' => 'ParentActivityController', 'method' => 'store', 'auth' => true],
    'DELETE /parent-activity/cleanup' => ['controller' => 'ParentActivityController', 'method' => 'cleanup', 'auth' => true],

    // Course Content routes (Lesson Plans & Content Management)
    'GET /course-content' => ['controller' => 'CourseContentController', 'method' => 'index', 'auth' => true],
    'GET /course-content/class-subject/{classSubjectId}' => ['controller' => 'CourseContentController', 'method' => 'getByClassSubject', 'auth' => true],
    'GET /course-content/{uuid}' => ['controller' => 'CourseContentController', 'method' => 'show', 'auth' => true],
    'POST /course-content' => ['controller' => 'CourseContentController', 'method' => 'create', 'auth' => true],
    'POST /course-content/{uuid}/duplicate' => ['controller' => 'CourseContentController', 'method' => 'duplicate', 'auth' => true],
    'PUT /course-content/reorder' => ['controller' => 'CourseContentController', 'method' => 'reorder', 'auth' => true],
    'PUT /course-content/{uuid}' => ['controller' => 'CourseContentController', 'method' => 'update', 'auth' => true],
    'PUT /course-content/{uuid}/publish' => ['controller' => 'CourseContentController', 'method' => 'publish', 'auth' => true],
    'DELETE /course-content/{uuid}' => ['controller' => 'CourseContentController', 'method' => 'delete', 'auth' => true],

    // Lesson Plan routes
    // Canonical listing route: expects query param course_id.
    'GET /lesson-plans' => ['controller' => 'LessonPlanController', 'method' => 'index', 'auth' => true],
    // Backward compatibility with existing frontend path.
    'GET /courses/{courseId}/lesson-plans' => ['controller' => 'LessonPlanController', 'method' => 'index', 'auth' => true],
    // Legacy week-filter route retained for compatibility.
    'GET /lesson-plans/week' => ['controller' => 'LessonPlanController', 'method' => 'getByWeek', 'auth' => true],
    'GET /lesson-plans/{id}' => ['controller' => 'LessonPlanController', 'method' => 'show', 'auth' => true],
    'POST /lesson-plans' => ['controller' => 'LessonPlanController', 'method' => 'create', 'auth' => true],
    'PUT /lesson-plans/{id}' => ['controller' => 'LessonPlanController', 'method' => 'update', 'auth' => true],
    'DELETE /lesson-plans/{id}' => ['controller' => 'LessonPlanController', 'method' => 'delete', 'auth' => true],
    'POST /lesson-plans/{id}/materials' => ['controller' => 'LessonPlanController', 'method' => 'linkMaterial', 'auth' => true],
    'DELETE /lesson-plans/{id}/materials/{materialId}' => ['controller' => 'LessonPlanController', 'method' => 'unlinkMaterial', 'auth' => true],

    // Subscription routes (Billing & Subscription Management)
    'GET /subscriptions' => ['controller' => 'SubscriptionController', 'method' => 'index', 'auth' => true],
    'GET /subscriptions/plans' => ['controller' => 'SubscriptionController', 'method' => 'getPlans', 'auth' => false],
    'GET /subscriptions/stats' => ['controller' => 'SubscriptionController', 'method' => 'getStatistics', 'auth' => true],
    'GET /subscriptions/institution/{institutionId}/active' => ['controller' => 'SubscriptionController', 'method' => 'getActiveSubscription', 'auth' => true],
    'GET /subscriptions/check/{institutionId}' => ['controller' => 'SubscriptionController', 'method' => 'checkStatus', 'auth' => true],
    'GET /subscriptions/{id}' => ['controller' => 'SubscriptionController', 'method' => 'show', 'auth' => true],
    'POST /subscriptions' => ['controller' => 'SubscriptionController', 'method' => 'create', 'auth' => true],
    'POST /subscriptions/{id}/renew' => ['controller' => 'SubscriptionController', 'method' => 'renew', 'auth' => true],
    'PUT /subscriptions/{id}' => ['controller' => 'SubscriptionController', 'method' => 'update', 'auth' => true],
    'DELETE /subscriptions/{id}' => ['controller' => 'SubscriptionController', 'method' => 'cancel', 'auth' => true],

    // File Upload routes
    'POST /upload' => ['controller' => 'FileUploadController', 'method' => 'upload', 'auth' => true],
    'POST /upload/multiple' => ['controller' => 'FileUploadController', 'method' => 'uploadMultiple', 'auth' => true],
    'GET /upload/{category}/{filename}/info' => ['controller' => 'FileUploadController', 'method' => 'getFileInfo', 'auth' => true],
    'DELETE /upload/{category}/{filename}' => ['controller' => 'FileUploadController', 'method' => 'delete', 'auth' => true],

    // Teacher Assessment routes
    'GET /teacher/assessment-categories' => ['controller' => 'TeacherAssessmentController', 'method' => 'getCategories', 'auth' => true],
    'GET /teacher/classes-subjects' => ['controller' => 'TeacherAssessmentController', 'method' => 'getClassesSubjects', 'auth' => true],
    'GET /teacher/students' => ['controller' => 'TeacherAssessmentController', 'method' => 'getStudents', 'auth' => true],
    'GET /teacher/assessments/existing' => ['controller' => 'TeacherAssessmentController', 'method' => 'getExistingAssessments', 'auth' => true],
    'GET /teacher/assessments' => ['controller' => 'TeacherAssessmentController', 'method' => 'getExistingAssessments', 'auth' => true],
    'GET /teacher/assignments-quizzes' => ['controller' => 'TeacherAssessmentController', 'method' => 'getAssignmentsAndQuizzes', 'auth' => true],
    'POST /teacher/assessments/import' => ['controller' => 'TeacherAssessmentController', 'method' => 'importAssessments', 'auth' => true],
    'GET /teacher/assessments/export' => ['controller' => 'TeacherAssessmentController', 'method' => 'exportAssessments', 'auth' => true],
    'POST /teacher/assessments/save' => ['controller' => 'TeacherAssessmentController', 'method' => 'saveAssessments', 'auth' => true],
    'POST /teacher/assessments' => ['controller' => 'TeacherAssessmentController', 'method' => 'saveAssessments', 'auth' => true],
    'POST /teacher/assessments/publish' => ['controller' => 'TeacherAssessmentController', 'method' => 'publishAssessments', 'auth' => true],
];
