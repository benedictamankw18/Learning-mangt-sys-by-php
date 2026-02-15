<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\AttendanceRepository;
use App\Repositories\StudentRepository;
use App\Repositories\CourseRepository;
use App\Repositories\TeacherRepository;
use App\Middleware\RoleMiddleware;

class AttendanceController
{
    private AttendanceRepository $attendanceRepo;
    private StudentRepository $studentRepo;
    private CourseRepository $courseRepo;
    private TeacherRepository $teacherRepo;

    public function __construct()
    {
        $this->attendanceRepo = new AttendanceRepository();
        $this->studentRepo = new StudentRepository();
        $this->courseRepo = new CourseRepository();
        $this->teacherRepo = new TeacherRepository();
    }

    public function getStudentAttendance(array $user, int $studentId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findById($studentId);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Students can only view their own attendance
        if ($roleMiddleware->isStudent() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only view your own attendance');
            return;
        }

        $courseId = isset($_GET['course_id']) ? (int) $_GET['course_id'] : null;
        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;

        // If a specific course is requested, verify enrollment
        if ($courseId && $roleMiddleware->isStudent() && !$roleMiddleware->isAdmin()) {
            if (!$this->courseRepo->isStudentEnrolled($studentId, $courseId)) {
                Response::forbidden('You can only view attendance for enrolled courses');
                return;
            }
        }

        $attendance = $this->attendanceRepo->getAttendanceByStudent($studentId, $courseId, $startDate, $endDate);
        Response::success($attendance);
    }

    public function getCourseAttendance(array $user, int $courseId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can view course attendance');
            return;
        }

        $course = $this->courseRepo->findById($courseId);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Teachers can only view attendance for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only view attendance for your own courses');
                return;
            }
        }

        $date = $_GET['date'] ?? date('Y-m-d');

        $attendance = $this->attendanceRepo->getAttendanceByCourse($courseId, $date);
        Response::success($attendance);
    }

    public function markAttendance(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can mark attendance');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['student_id', 'course_id', 'attendance_date', 'status'])
            ->numeric('student_id')
            ->numeric('course_id')
            ->in('status', ['present', 'absent', 'late', 'excused']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $course = $this->courseRepo->findById((int) $data['course_id']);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Teachers can only mark attendance for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only mark attendance for your own courses');
                return;
            }
        }

        if (
            $this->attendanceRepo->markAttendance(
                (int) $data['student_id'],
                (int) $data['course_id'],
                $data['attendance_date'],
                $data['status'],
                $data['remarks'] ?? null
            )
        ) {
            Response::success(['message' => 'Attendance marked successfully']);
        } else {
            Response::serverError('Failed to mark attendance');
        }
    }

    public function bulkMarkAttendance(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can mark attendance');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['course_id', 'attendance_date', 'students'])
            ->numeric('course_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $course = $this->courseRepo->findById((int) $data['course_id']);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Teachers can only mark attendance for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only mark attendance for your own courses');
                return;
            }
        }

        if ($this->attendanceRepo->bulkMarkAttendance((int) $data['course_id'], $data['attendance_date'], $data['students'])) {
            Response::success(['message' => 'Bulk attendance marked successfully']);
        } else {
            Response::serverError('Failed to mark bulk attendance');
        }
    }

    public function getAttendanceStats(array $user, int $studentId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findById($studentId);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Students can only view their own stats
        if ($roleMiddleware->isStudent() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only view your own attendance statistics');
            return;
        }

        $courseId = isset($_GET['course_id']) ? (int) $_GET['course_id'] : null;

        $stats = $this->attendanceRepo->getAttendanceStats($studentId, $courseId);
        Response::success($stats);
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can update attendance');
            return;
        }

        $attendance = $this->attendanceRepo->findById($id);

        if (!$attendance) {
            Response::notFound('Attendance record not found');
            return;
        }

        // Teachers can only update attendance for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            $course = $this->courseRepo->findById($attendance['course_id']);
            if (!$teacher || !$course || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only update attendance for your own courses');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['status'])) {
            $validator->in('status', ['present', 'absent', 'late', 'excused']);
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->attendanceRepo->update($id, $data)) {
            Response::success(['message' => 'Attendance updated successfully']);
        } else {
            Response::serverError('Failed to update attendance');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can delete attendance');
            return;
        }

        $attendance = $this->attendanceRepo->findById($id);

        if (!$attendance) {
            Response::notFound('Attendance record not found');
            return;
        }

        // Teachers can only delete attendance for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            $course = $this->courseRepo->findById($attendance['course_id']);
            if (!$teacher || !$course || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only delete attendance for your own courses');
                return;
            }
        }

        if ($this->attendanceRepo->delete($id)) {
            Response::success(['message' => 'Attendance deleted successfully']);
        } else {
            Response::serverError('Failed to delete attendance');
        }
    }
}
