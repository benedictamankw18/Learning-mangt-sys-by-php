<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Repositories\InstitutionRepository;
use App\Repositories\UserRepository;
use App\Repositories\StudentRepository;
use App\Repositories\TeacherRepository;
use App\Repositories\ClassSubjectRepository;
use App\Repositories\ParentRepository;

class DashboardController
{
    private InstitutionRepository $institutionRepo;
    private UserRepository $userRepo;
    private StudentRepository $studentRepo;
    private TeacherRepository $teacherRepo;
    private ClassSubjectRepository $classSubjectRepo;
    private ParentRepository $parentRepo;

    public function __construct()
    {
        $this->institutionRepo = new InstitutionRepository();
        $this->userRepo = new UserRepository();
        $this->studentRepo = new StudentRepository();
        $this->teacherRepo = new TeacherRepository();
        $this->classSubjectRepo = new ClassSubjectRepository();
        $this->parentRepo = new ParentRepository();
    }

    /**
     * Super Admin Dashboard Statistics
     */
    public function superAdminStats(array $user): void
    {
        // Verify user is super admin
        if ($user['is_super_admin'] != 1) {
            Response::forbidden('Super admin access required');
            return;
        }

        try {
            // Get platform-wide statistics
            $totalInstitutions = $this->institutionRepo->count();
            $totalAdmins = $this->userRepo->countByRole('admin');
            $totalUsers = $this->userRepo->count();

            // Calculate growth percentages
            $institutionsThisMonth = $this->institutionRepo->countThisMonth();
            $institutionsLastMonth = $this->institutionRepo->countLastMonth();
            $institutionsGrowth = $this->calculateGrowthPercentage($institutionsLastMonth, $institutionsThisMonth);

            $adminsThisMonth = $this->userRepo->countByRoleCreatedThisMonth('admin');
            $adminsLastMonth = $this->userRepo->countByRoleCreatedLastMonth('admin');
            $adminsGrowth = $this->calculateGrowthPercentage($adminsLastMonth, $adminsThisMonth);

            $usersThisMonth = $this->userRepo->countCreatedThisMonth();
            $usersLastMonth = $this->userRepo->countCreatedLastMonth();
            $usersGrowth = $this->calculateGrowthPercentage($usersLastMonth, $usersThisMonth);

            $stats = [
                'total_institutions' => $totalInstitutions,
                'active_institutions' => $this->institutionRepo->countActive(),
                'total_users' => $totalUsers,
                'total_admins' => $totalAdmins,
                'total_students' => $this->studentRepo->count(),
                'total_teachers' => $this->teacherRepo->count(),
                'total_parents' => $this->parentRepo->count(),
                'active_users' => $this->userRepo->countActive(),
                'recent_institutions' => $this->institutionRepo->getRecent(5),
                'system_health' => 'healthy',
                'institutions_growth' => $institutionsGrowth,
                'admins_growth' => $adminsGrowth,
                'users_growth' => $usersGrowth,
                'users_by_role' => [
                    'students' => $this->studentRepo->count(),
                    'teachers' => $this->teacherRepo->count(),
                    'parents' => $this->parentRepo->count(),
                    'admins' => $totalAdmins,
                    'super_admins' => $this->userRepo->countByRole('super_admin'),
                ],
                'monthly_growth' => [
                    'institutions' => array_values($this->institutionRepo->getMonthlyCountsThisYear()),
                    'users' => array_values($this->userRepo->getMonthlyCountsThisYear()),
                ],
            ];

            Response::success($stats);
        } catch (\Exception $e) {
            error_log("Super Admin Stats Error: " . $e->getMessage());
            Response::serverError('Failed to load dashboard statistics');
        }
    }

    /**
     * Calculate growth percentage between two periods
     * 
     * @param int $lastPeriod Count from previous period
     * @param int $currentPeriod Count from current period
     * @return float Growth percentage
     */
    private function calculateGrowthPercentage(int $lastPeriod, int $currentPeriod): float
    {
        if ($lastPeriod === 0) {
            return $currentPeriod > 0 ? 100.0 : 0.0;
        }

        return round((($currentPeriod - $lastPeriod) / $lastPeriod) * 100, 1);
    }

    /**
     * Admin Dashboard Statistics
     */
    public function adminStats(array $user): void
    {
        if (!$user['institution_id']) {
            Response::badRequest('Institution ID required');
            return;
        }

        try {
            $institutionId = $user['institution_id'];

            // Get course distribution by subject
            $courseDistribution = $this->classSubjectRepo->getCourseDistributionBySubject($institutionId);

            // Get monthly enrollment trend
            $enrollmentTrend = $this->studentRepo->getMonthlyEnrollmentsByInstitution($institutionId);

            $stats = [
                'total_students' => $this->studentRepo->countByInstitution($institutionId),
                'total_teachers' => $this->teacherRepo->countByInstitution($institutionId),
                'total_courses' => $this->classSubjectRepo->count($institutionId),
                'active_students' => $this->studentRepo->countActiveByInstitution($institutionId),
                'total_users' => $this->userRepo->countByInstitution($institutionId),
                'pending_approvals' => 0,
                'recent_activities' => [],
                'enrollment_trend' => $enrollmentTrend,
                'course_distribution' => $courseDistribution,
            ];

            Response::success($stats);
        } catch (\Exception $e) {
            error_log("Admin Stats Error: " . $e->getMessage());
            Response::serverError('Failed to load dashboard statistics');
        }
    }

    /**
     * Teacher Dashboard Statistics
     */
    public function teacherStats(array $user): void
    {
        try {
            // Get teacher ID from user
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);

            if (!$teacher) {
                Response::notFound('Teacher record not found');
                return;
            }

            $teacherId = $teacher['teacher_id'];
            $courses = $this->teacherRepo->getCourses($teacherId);
            $totalStudents = array_sum(array_column($courses, 'enrolled_students'));

            $stats = [
                'total_courses' => count($courses),
                'total_students' => $totalStudents,
                'courses' => $courses,
                'pending_assignments' => 0,
                'attendance_rate' => 0,
                'upcoming_classes' => [],
            ];

            Response::success($stats);
        } catch (\Exception $e) {
            error_log("Teacher Stats Error: " . $e->getMessage());
            Response::serverError('Failed to load dashboard statistics');
        }
    }

    /**
     * Student Dashboard Statistics
     */
    public function studentStats(array $user): void
    {
        try {
            // Get student ID from user
            $student = $this->studentRepo->findByUserId($user['user_id']);

            if (!$student) {
                Response::notFound('Student record not found');
                return;
            }

            $studentId = $student['student_id'];
            $enrolledCourses = $this->studentRepo->getEnrolledCourses($studentId);

            $stats = [
                'enrolled_courses' => count($enrolledCourses),
                'courses' => $enrolledCourses,
                'completed_assignments' => 0,
                'pending_assignments' => 0,
                'average_grade' => 0,
                'attendance_rate' => 0,
                'upcoming_classes' => [],
            ];

            Response::success($stats);
        } catch (\Exception $e) {
            error_log("Student Stats Error: " . $e->getMessage());
            Response::serverError('Failed to load dashboard statistics');
        }
    }

    /**
     * Parent Dashboard Statistics
     */
    public function parentStats(array $user): void
    {
        try {
            // Get parent record by user ID
            $parent = $this->parentRepo->findByUserId($user['user_id']);

            if (!$parent) {
                Response::notFound('Parent record not found');
                return;
            }

            $parentId = $parent['parent_id'];
            $children = $this->parentRepo->getStudents($parentId);

            // Get enrolled courses for each child
            $childrenData = [];
            foreach ($children as $child) {
                $courses = $this->studentRepo->getEnrolledCourses($child['student_id']);
                $childrenData[] = [
                    'student_id' => $child['student_id'],
                    'first_name' => $child['first_name'],
                    'last_name' => $child['last_name'],
                    'email' => $child['email'],
                    'relationship' => $child['relationship'],
                    'is_primary' => $child['is_primary'],
                    'enrolled_courses' => count($courses),
                ];
            }

            $stats = [
                'total_children' => count($children),
                'children_data' => $childrenData,
                'upcoming_events' => [],
                'recent_notifications' => [],
            ];

            Response::success($stats);
        } catch (\Exception $e) {
            error_log("Parent Stats Error: " . $e->getMessage());
            Response::serverError('Failed to load dashboard statistics');
        }
    }
}
