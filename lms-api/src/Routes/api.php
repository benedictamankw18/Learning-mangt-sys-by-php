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
    'POST /auth/logout' => ['controller' => 'AuthController', 'method' => 'logout', 'auth' => true],
    'POST /auth/change-password' => ['controller' => 'AuthController', 'method' => 'changePassword', 'auth' => true],

    // Student routes
    'GET /students' => ['controller' => 'StudentController', 'method' => 'index', 'auth' => true],
    'GET /students/{id}' => ['controller' => 'StudentController', 'method' => 'show', 'auth' => true],
    'POST /students' => ['controller' => 'StudentController', 'method' => 'create', 'auth' => true],
    'PUT /students/{id}' => ['controller' => 'StudentController', 'method' => 'update', 'auth' => true],
    'DELETE /students/{id}' => ['controller' => 'StudentController', 'method' => 'delete', 'auth' => true],
    'GET /students/{id}/courses' => ['controller' => 'StudentController', 'method' => 'getEnrolledCourses', 'auth' => true],
    'POST /students/enroll' => ['controller' => 'StudentController', 'method' => 'enrollInCourse', 'auth' => true],
    'DELETE /students/{id}/courses/{courseId}' => ['controller' => 'StudentController', 'method' => 'unenrollFromCourse', 'auth' => true],
    'PUT /enrollments/{id}' => ['controller' => 'StudentController', 'method' => 'updateEnrollment', 'auth' => true],
    'DELETE /enrollments/{id}' => ['controller' => 'StudentController', 'method' => 'deleteEnrollment', 'auth' => true],

    // Teacher routes
    'GET /teachers' => ['controller' => 'TeacherController', 'method' => 'index', 'auth' => true],
    'GET /teachers/{id}' => ['controller' => 'TeacherController', 'method' => 'show', 'auth' => true],
    'POST /teachers' => ['controller' => 'TeacherController', 'method' => 'create', 'auth' => true],
    'PUT /teachers/{id}' => ['controller' => 'TeacherController', 'method' => 'update', 'auth' => true],
    'DELETE /teachers/{id}' => ['controller' => 'TeacherController', 'method' => 'delete', 'auth' => true],
    'GET /teachers/{id}/courses' => ['controller' => 'TeacherController', 'method' => 'getCourses', 'auth' => true],
    'GET /teachers/{id}/schedule' => ['controller' => 'TeacherController', 'method' => 'getSchedule', 'auth' => true],

    // User Management routes
    'GET /users' => ['controller' => 'UserController', 'method' => 'index', 'auth' => true],
    'GET /users/{id}' => ['controller' => 'UserController', 'method' => 'show', 'auth' => true],
    'POST /users' => ['controller' => 'UserController', 'method' => 'create', 'auth' => true],
    'PUT /users/{id}' => ['controller' => 'UserController', 'method' => 'update', 'auth' => true],
    'DELETE /users/{id}' => ['controller' => 'UserController', 'method' => 'delete', 'auth' => true],
    'POST /users/{id}/roles' => ['controller' => 'UserController', 'method' => 'assignRole', 'auth' => true],
    'DELETE /users/{id}/roles/{roleId}' => ['controller' => 'UserController', 'method' => 'removeRole', 'auth' => true],
    'GET /users/{id}/activity' => ['controller' => 'UserController', 'method' => 'getActivity', 'auth' => true],

    // Role routes
    'GET /roles' => ['controller' => 'RoleController', 'method' => 'index', 'auth' => true],
    'GET /roles/{id}' => ['controller' => 'RoleController', 'method' => 'show', 'auth' => true],
    'POST /roles' => ['controller' => 'RoleController', 'method' => 'create', 'auth' => true],
    'PUT /roles/{id}' => ['controller' => 'RoleController', 'method' => 'update', 'auth' => true],
    'DELETE /roles/{id}' => ['controller' => 'RoleController', 'method' => 'delete', 'auth' => true],
    'GET /roles/{id}/permissions' => ['controller' => 'RoleController', 'method' => 'getPermissions', 'auth' => true],
    'POST /roles/{id}/permissions' => ['controller' => 'RoleController', 'method' => 'assignPermission', 'auth' => true],
    'DELETE /roles/{id}/permissions/{permissionId}' => ['controller' => 'RoleController', 'method' => 'removePermission', 'auth' => true],

    // Permission routes
    'GET /permissions' => ['controller' => 'PermissionController', 'method' => 'index', 'auth' => true],
    'GET /permissions/{id}' => ['controller' => 'PermissionController', 'method' => 'show', 'auth' => true],
    'POST /permissions' => ['controller' => 'PermissionController', 'method' => 'create', 'auth' => true],
    'PUT /permissions/{id}' => ['controller' => 'PermissionController', 'method' => 'update', 'auth' => true],
    'DELETE /permissions/{id}' => ['controller' => 'PermissionController', 'method' => 'delete', 'auth' => true],

    // Notification routes
    'GET /notifications' => ['controller' => 'NotificationController', 'method' => 'index', 'auth' => true],
    'GET /notifications/unread-count' => ['controller' => 'NotificationController', 'method' => 'getUnreadCount', 'auth' => true],
    'GET /notifications/{id}' => ['controller' => 'NotificationController', 'method' => 'show', 'auth' => true],
    'POST /notifications' => ['controller' => 'NotificationController', 'method' => 'create', 'auth' => true],
    'PUT /notifications/read-all' => ['controller' => 'NotificationController', 'method' => 'markAllAsRead', 'auth' => true],
    'PUT /notifications/{id}/read' => ['controller' => 'NotificationController', 'method' => 'markAsRead', 'auth' => true],
    'DELETE /notifications/read' => ['controller' => 'NotificationController', 'method' => 'deleteAllRead', 'auth' => true],
    'DELETE /notifications/{id}' => ['controller' => 'NotificationController', 'method' => 'delete', 'auth' => true],

    // Announcement routes
    'GET /announcements' => ['controller' => 'AnnouncementController', 'method' => 'index', 'auth' => true],
    'GET /announcements/{id}' => ['controller' => 'AnnouncementController', 'method' => 'show', 'auth' => true],
    'POST /announcements' => ['controller' => 'AnnouncementController', 'method' => 'create', 'auth' => true],
    'PUT /announcements/{id}' => ['controller' => 'AnnouncementController', 'method' => 'update', 'auth' => true],
    'DELETE /announcements/{id}' => ['controller' => 'AnnouncementController', 'method' => 'delete', 'auth' => true],

    // Institution routes (Super Admin + Admin)
    'GET /institutions' => ['controller' => 'InstitutionController', 'method' => 'index', 'auth' => true],
    'GET /institutions/{id}' => ['controller' => 'InstitutionController', 'method' => 'show', 'auth' => true],
    'POST /institutions' => ['controller' => 'InstitutionController', 'method' => 'create', 'auth' => true],
    'PUT /institutions/{id}' => ['controller' => 'InstitutionController', 'method' => 'update', 'auth' => true],
    'DELETE /institutions/{id}' => ['controller' => 'InstitutionController', 'method' => 'delete', 'auth' => true],
    'GET /institutions/{id}/statistics' => ['controller' => 'InstitutionController', 'method' => 'getStatistics', 'auth' => true],
    'GET /institutions/{id}/users' => ['controller' => 'InstitutionController', 'method' => 'getUsers', 'auth' => true],
    'GET /institutions/{id}/programs' => ['controller' => 'InstitutionController', 'method' => 'getPrograms', 'auth' => true],
    'GET /institutions/{id}/classes' => ['controller' => 'InstitutionController', 'method' => 'getClasses', 'auth' => true],
    'PUT /institutions/{id}/status' => ['controller' => 'InstitutionController', 'method' => 'updateStatus', 'auth' => true],
    'GET /institutions/{id}/settings' => ['controller' => 'InstitutionController', 'method' => 'getSettings', 'auth' => true],
    'PUT /institutions/{id}/settings' => ['controller' => 'InstitutionController', 'method' => 'updateSettings', 'auth' => true],

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
    'GET /classes/{id}' => ['controller' => 'ClassController', 'method' => 'show', 'auth' => true],
    'POST /classes' => ['controller' => 'ClassController', 'method' => 'create', 'auth' => true],
    'PUT /classes/{id}' => ['controller' => 'ClassController', 'method' => 'update', 'auth' => true],
    'DELETE /classes/{id}' => ['controller' => 'ClassController', 'method' => 'delete', 'auth' => true],
    'GET /classes/{id}/students' => ['controller' => 'ClassController', 'method' => 'getStudents', 'auth' => true],
    'GET /classes/{id}/class-subjects' => ['controller' => 'ClassController', 'method' => 'getClassSubjects', 'auth' => true],
    'GET /classes/{id}/schedule' => ['controller' => 'ClassController', 'method' => 'getSchedule', 'auth' => true],
    'POST /classes/{id}/assign-teacher' => ['controller' => 'ClassController', 'method' => 'assignTeacher', 'auth' => true],

    // Course routes (now Class Subjects in Ghana SHS terminology)
    'GET /class-subjects' => ['controller' => 'ClassSubjectController', 'method' => 'index', 'auth' => true],
    'GET /class-subjects/{id}' => ['controller' => 'ClassSubjectController', 'method' => 'show', 'auth' => true],
    'POST /class-subjects' => ['controller' => 'ClassSubjectController', 'method' => 'create', 'auth' => true],
    'PUT /class-subjects/{id}' => ['controller' => 'ClassSubjectController', 'method' => 'update', 'auth' => true],
    'DELETE /class-subjects/{id}' => ['controller' => 'ClassSubjectController', 'method' => 'delete', 'auth' => true],
    'GET /class-subjects/{id}/students' => ['controller' => 'ClassSubjectController', 'method' => 'getEnrolledStudents', 'auth' => true],
    'GET /class-subjects/{id}/materials' => ['controller' => 'ClassSubjectController', 'method' => 'getMaterials', 'auth' => true],
    'POST /class-subjects/{id}/materials' => ['controller' => 'ClassSubjectController', 'method' => 'createMaterial', 'auth' => true],
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
    'POST /courses/{id}/materials' => ['controller' => 'ClassSubjectController', 'method' => 'createMaterial', 'auth' => true],
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
    'GET /subjects/{id}' => ['controller' => 'SubjectController', 'method' => 'show', 'auth' => true],
    'POST /subjects' => ['controller' => 'SubjectController', 'method' => 'create', 'auth' => true],
    'PUT /subjects/{id}' => ['controller' => 'SubjectController', 'method' => 'update', 'auth' => true],
    'DELETE /subjects/{id}' => ['controller' => 'SubjectController', 'method' => 'delete', 'auth' => true],

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
    'GET /assignments/{id}' => ['controller' => 'AssignmentController', 'method' => 'show', 'auth' => true],
    'POST /assignments' => ['controller' => 'AssignmentController', 'method' => 'create', 'auth' => true],
    'PUT /assignments/{id}' => ['controller' => 'AssignmentController', 'method' => 'update', 'auth' => true],
    'DELETE /assignments/{id}' => ['controller' => 'AssignmentController', 'method' => 'delete', 'auth' => true],
    'GET /assignments/{id}/submissions' => ['controller' => 'AssignmentController', 'method' => 'getSubmissions', 'auth' => true],
    'POST /assignments/{id}/submit' => ['controller' => 'AssignmentController', 'method' => 'submit', 'auth' => true],
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
    'GET /messages/{id}' => ['controller' => 'MessageController', 'method' => 'show', 'auth' => true],
    'POST /messages' => ['controller' => 'MessageController', 'method' => 'send', 'auth' => true],
    'PUT /messages/{id}/read' => ['controller' => 'MessageController', 'method' => 'markAsRead', 'auth' => true],
    'DELETE /messages/{id}' => ['controller' => 'MessageController', 'method' => 'delete', 'auth' => true],

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
];
