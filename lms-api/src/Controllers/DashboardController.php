<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Config\Database;
use App\Repositories\InstitutionRepository;
use App\Repositories\SubscriptionRepository;
use App\Repositories\UserRepository;
use App\Repositories\StudentRepository;
use App\Repositories\TeacherRepository;
use App\Repositories\ClassRepository;
use App\Repositories\ClassSubjectRepository;
use App\Repositories\ParentRepository;
use App\Repositories\AttendanceRepository;
use App\Repositories\AssessmentRepository;
use App\Repositories\AssignmentRepository;
use App\Repositories\AnnouncementRepository;
use App\Repositories\QuizRepository;

class DashboardController
{
    private InstitutionRepository $institutionRepo;
    private UserRepository $userRepo;
    private StudentRepository $studentRepo;
    private TeacherRepository $teacherRepo;
    private ClassRepository $classRepo;
    private ClassSubjectRepository $classSubjectRepo;
    private ParentRepository $parentRepo;
    private AttendanceRepository $attendanceRepo;
    private AssessmentRepository $assessmentRepo;
    private AssignmentRepository $assignmentRepo;
    private AnnouncementRepository $announcementRepo;
    private SubscriptionRepository $subscriptionRepo;
    private QuizRepository $quizRepo;

    public function __construct()
    {
        $this->institutionRepo  = new InstitutionRepository();
        $this->subscriptionRepo = new SubscriptionRepository();
        $this->userRepo         = new UserRepository();
        $this->studentRepo      = new StudentRepository();
        $this->teacherRepo      = new TeacherRepository();
        $this->classRepo        = new ClassRepository();
        $this->classSubjectRepo = new ClassSubjectRepository();
        $this->parentRepo       = new ParentRepository();
        $this->attendanceRepo   = new AttendanceRepository();
        $this->assessmentRepo   = new AssessmentRepository();
        $this->assignmentRepo   = new AssignmentRepository();
        $this->announcementRepo = new AnnouncementRepository();
        $this->quizRepo         = new QuizRepository();
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
                'active_subscriptions' => $this->subscriptionRepo->count(['status' => 'active']),
                'subscriptions_growth' => $this->calculateGrowthPercentage(
                    $this->subscriptionRepo->countActiveLastMonth(),
                    $this->subscriptionRepo->countActiveThisMonth()
                ),
                'system_health' => $this->computeSystemHealth(),
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
     * Compute real-time system health metrics
     */
    private function computeSystemHealth(): array
    {
        // Storage health
        $diskPath = PHP_OS_FAMILY === 'Windows' ? 'D:\\' : '/';
        $diskTotal = @disk_total_space($diskPath) ?: 1;
        $diskFree  = @disk_free_space($diskPath)  ?: 0;
        $diskUsage = round(($diskTotal - $diskFree) / $diskTotal * 100, 1);

        // Memory health (PHP process vs configured limit)
        $rawLimit  = ini_get('memory_limit');
        $memLimit  = $this->parseMemoryLimit($rawLimit);
        $memUsed   = memory_get_usage(true);
        $memUsage  = $memLimit > 0 ? min(round($memUsed / $memLimit * 100, 1), 100.0) : 0.0;

        // Database connection health
        $dbUsage = $this->getDbConnectionUsage();

        // CPU load (POSIX only; not available on Windows — fall back to 0)
        $load = function_exists('sys_getloadavg') ? sys_getloadavg() : false;
        $cpuUsage = ($load !== false && isset($load[0])) ? min(round($load[0] * 100, 1), 100.0) : 0.0;

        return [
            'database' => [
                'usage'  => $dbUsage,
                'status' => $dbUsage > 90 ? 'critical' : ($dbUsage > 75 ? 'warning' : 'healthy'),
            ],
            'memory' => [
                'usage'  => $memUsage,
                'status' => $memUsage > 90 ? 'critical' : ($memUsage > 75 ? 'warning' : 'healthy'),
            ],
            'cpu' => [
                'usage'  => $cpuUsage,
                'status' => $cpuUsage > 90 ? 'critical' : ($cpuUsage > 75 ? 'warning' : 'healthy'),
            ],
            'storage' => [
                'usage'  => $diskUsage,
                'status' => $diskUsage > 90 ? 'critical' : ($diskUsage > 75 ? 'warning' : 'healthy'),
            ],
        ];
    }

    /**
     * Query MySQL thread usage as a percentage of max_connections
     */
    private function getDbConnectionUsage(): float
    {
        try {
            $db = Database::getInstance()->getConnection();

            $stmt = $db->query("SHOW STATUS LIKE 'Threads_connected'");
            $row  = $stmt->fetch();
            $connected = (int) ($row['Value'] ?? 1);

            $stmt = $db->query("SHOW VARIABLES LIKE 'max_connections'");
            $row  = $stmt->fetch();
            $maxConn = (int) ($row['Value'] ?? 100);

            return $maxConn > 0 ? round($connected / $maxConn * 100, 1) : 0.0;
        } catch (\Exception $e) {
            return 0.0;
        }
    }

    /**
     * Convert PHP memory_limit string (e.g. "256M") to bytes
     */
    private function parseMemoryLimit(string $limit): int
    {
        if ($limit === '-1') {
            return PHP_INT_MAX;
        }
        $unit  = strtolower(substr($limit, -1));
        $value = (int) $limit;
        return match ($unit) {
            'g' => $value * 1024 * 1024 * 1024,
            'm' => $value * 1024 * 1024,
            'k' => $value * 1024,
            default => $value,
        };
    }

    /**
     * Admin Dashboard Statistics
     */
    public function adminStats(array $user): void
    {
        // Allow institution_id from query params (for superadmin) or from user context
        $institutionId = isset($_GET['institution_id']) ? (int) $_GET['institution_id'] : $user['institution_id'];

        if (!$institutionId) {
            Response::badRequest('Institution ID required. Please provide institution_id as a query parameter.');
            return;
        }

        try {

            // Get course distribution by subject
            $courseDistribution = $this->classSubjectRepo->getCourseDistributionBySubject($institutionId);

            // Get monthly enrollment trend
            $enrollmentTrend = $this->studentRepo->getMonthlyEnrollmentsByInstitution($institutionId);

            $studentsThisMonth = $this->studentRepo->countByInstitutionThisMonth($institutionId);
            $studentsLastMonth = $this->studentRepo->countByInstitutionLastMonth($institutionId);
            $teachersThisMonth = $this->teacherRepo->countByInstitutionThisMonth($institutionId);
            $teachersLastMonth = $this->teacherRepo->countByInstitutionLastMonth($institutionId);
            $classesThisMonth = $this->classRepo->countByInstitutionThisMonth($institutionId);
            $classesLastMonth = $this->classRepo->countByInstitutionLastMonth($institutionId);

            $stats = [
                'total_students' => $this->studentRepo->countByInstitution($institutionId),
                'total_teachers' => $this->teacherRepo->countByInstitution($institutionId),
                'total_classes' => $this->classRepo->count($institutionId),
                'total_courses' => $this->classSubjectRepo->count($institutionId),
                'active_students' => $this->studentRepo->countActiveByInstitution($institutionId),
                'total_users' => $this->userRepo->countByInstitution($institutionId),
                'attendance_rate_today' => $this->attendanceRepo->getDailyRateByInstitution($institutionId),
                'attendance_rate'       => $this->attendanceRepo->getWeeklyRateByInstitution($institutionId),
                'upcoming_exams'        => $this->assessmentRepo->countUpcomingByInstitution($institutionId, 7),
                'pending_tasks'         => $this->userRepo->countInactiveByInstitution($institutionId),
                'students_growth' => $this->calculateGrowthPercentage($studentsLastMonth, $studentsThisMonth),
                'teachers_growth' => $this->calculateGrowthPercentage($teachersLastMonth, $teachersThisMonth),
                'classes_growth' => $this->calculateGrowthPercentage($classesLastMonth, $classesThisMonth),
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
                'total_courses'           => count($courses),
                'total_students'          => $totalStudents,
                'courses'                 => $courses,
                'active_assignments'      => $this->assignmentRepo->countActiveByTeacher($teacherId),
                'pending_grades'          => $this->assignmentRepo->countPendingGradesByTeacher($teacherId),
                'pending_submissions'     => $this->assignmentRepo->countPendingGradesByTeacher($teacherId),
                'attendance_rate_today'   => $this->attendanceRepo->getDailyRateByTeacher($teacherId),
                'attendance_rate'         => $this->attendanceRepo->getWeeklyRateByTeacher($teacherId),
                'upcoming_assessments'    => $this->assessmentRepo->countUpcomingByTeacher($teacherId, 7),
                'todays_classes'          => $this->attendanceRepo->countTodayScheduleByTeacher($teacherId),
                'todays_schedule'         => $this->teacherRepo->getSchedule($teacherId, date('Y-m-d')),
                'recent_submissions'      => $this->assignmentRepo->getRecentSubmissionsByTeacher($teacherId, 5),
                'class_performance'       => $this->teacherRepo->getClassPerformanceChart($teacherId),
                'attendance_trend'        => $this->attendanceRepo->getAttendanceTrendByTeacher($teacherId),
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
                'enrolled_courses'     => count($enrolledCourses),
                'courses'              => $enrolledCourses,
                'pending_assignments'      => $this->assignmentRepo->countPendingByStudent($studentId),
                'pending_assignments_list' => $this->assignmentRepo->getPendingByStudent($studentId, 5),
                'average_grade'        => 0,
                'attendance_rate'      => $this->attendanceRepo->getOverallRateByStudent($studentId),
                'upcoming_assessments' => $this->assessmentRepo->countUpcomingByStudent($studentId, 7),
                'todays_classes'       => count($this->attendanceRepo->getTodayScheduleByStudent($studentId)),
                'todays_schedule'      => $this->attendanceRepo->getTodayScheduleByStudent($studentId),
                'recent_grades'        => $this->assignmentRepo->getRecentGradesByStudent($studentId, 5),
                'grade_trend'          => $this->assignmentRepo->getGradeTrendByStudent($studentId),
                'recent_announcements' => $this->announcementRepo->getRecentForStudent(5),
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

            $childrenData = [];
            $allGrades    = [];
            $allMaterialAccess = [];
            $allRecentQuizAttempts = [];
            $totalAttendance = 0;

            foreach ($children as $child) {
                $sid        = $child['student_id'];
                $courses    = $this->studentRepo->getEnrolledCourses($sid);
                $attendance = $this->attendanceRepo->getOverallRateByStudent($sid);
                $grades     = $this->assignmentRepo->getRecentGradesByStudent($sid, 3);
                $upcoming   = $this->assessmentRepo->countUpcomingByStudent($sid, 7);
                $gradeTrend = $this->assignmentRepo->getGradeTrendByStudent($sid);
                $trendData  = (is_array($gradeTrend['data'] ?? null)) ? $gradeTrend['data'] : [];
                $trendCount = count($trendData);
                $currentAverage = $trendCount > 0
                    ? round(array_sum(array_map('floatval', $trendData)) / $trendCount, 1)
                    : null;
                $materialAccess = $this->classSubjectRepo->getMaterialAccessSnapshotForStudent($sid, 8);
                $recentMaterialAccess = is_array($materialAccess['recent'] ?? null)
                    ? $materialAccess['recent']
                    : [];
                $quizSubjectScores = $this->quizRepo->getStudentQuizPerformanceBySubject($sid);
                $quizCompletion = $this->quizRepo->getStudentQuizCompletionStatus($sid);
                $recentQuizAttempts = $this->quizRepo->getRecentStudentQuizAttempts($sid, 6);

                $childName = $child['first_name'] . ' ' . $child['last_name'];
                $initials  = strtoupper(substr($child['first_name'], 0, 1) . substr($child['last_name'], 0, 1));
                foreach ($grades as &$g) {
                    $g['child_name']     = $childName;
                    $g['child_initials'] = $initials;
                }
                unset($g);

                foreach ($recentMaterialAccess as &$materialRow) {
                    $materialRow['student_id'] = $sid;
                    $materialRow['child_name'] = $childName;
                    $materialRow['child_initials'] = $initials;
                }
                unset($materialRow);

                foreach ($recentQuizAttempts as &$quizAttemptRow) {
                    $quizAttemptRow['student_id'] = $sid;
                    $quizAttemptRow['child_name'] = $childName;
                    $quizAttemptRow['child_initials'] = $initials;
                }
                unset($quizAttemptRow);

                $allMaterialAccess = array_merge($allMaterialAccess, $recentMaterialAccess);
                $allRecentQuizAttempts = array_merge($allRecentQuizAttempts, $recentQuizAttempts);

                $allGrades       = array_merge($allGrades, $grades);
                $totalAttendance += $attendance;

                $childrenData[] = [
                    'student_id'           => $sid,
                    'first_name'           => $child['first_name'],
                    'last_name'            => $child['last_name'],
                    'full_name'            => $childName,
                    'initials'             => $initials,
                    'relationship'         => $child['relationship'],
                    'is_primary'           => $child['is_primary'],
                    'class_name'           => $child['class_name'] ?? null,
                    'program_name'         => $child['program_name'] ?? null,
                    'current_average'      => $currentAverage,
                    'enrolled_courses'     => count($courses),
                    'attendance_rate'      => round($attendance, 1),
                    'upcoming_assessments' => $upcoming,
                    'grade_trend'          => $gradeTrend,
                    'materials_accessed'   => (int) ($materialAccess['total_accessed'] ?? 0),
                    'required_materials_accessed' => (int) ($materialAccess['required_accessed'] ?? 0),
                    'optional_materials_accessed' => (int) ($materialAccess['optional_accessed'] ?? 0),
                    'last_material_access_at' => $materialAccess['last_accessed_at'] ?? null,
                    'recent_material_access' => $recentMaterialAccess,
                    'quiz_subject_scores' => $quizSubjectScores,
                    'quiz_completion' => $quizCompletion,
                    'recent_quiz_attempts' => $recentQuizAttempts,
                ];
            }

            usort($allGrades, fn($a, $b) => strcmp($b['graded_at'] ?? '', $a['graded_at'] ?? ''));
            usort($allMaterialAccess, fn($a, $b) => strcmp($b['last_opened_at'] ?? '', $a['last_opened_at'] ?? ''));
            usort($allRecentQuizAttempts, fn($a, $b) => strcmp($b['submitted_at'] ?? ($b['created_at'] ?? ''), $a['submitted_at'] ?? ($a['created_at'] ?? '')));
            $childCount = count($children);

            $stats = [
                'total_children'  => $childCount,
                'children_data'   => $childrenData,
                'avg_attendance'  => $childCount > 0 ? round($totalAttendance / $childCount, 1) : 0,
                'recent_grades'   => array_slice($allGrades, 0, 5),
                'recent_material_access' => array_slice($allMaterialAccess, 0, 12),
                'recent_quiz_attempts' => array_slice($allRecentQuizAttempts, 0, 12),
                'upcoming_events' => $this->announcementRepo->getRecentForStudent(5),
                'pending_fee_status' => $this->buildPendingFeeStatus($childrenData),
            ];

            Response::success($stats);
        } catch (\Exception $e) {
            error_log("Parent Stats Error: " . $e->getMessage());
            Response::serverError('Failed to load dashboard statistics');
        }
    }

    /**
     * Build pending fee status payload for parent dashboard.
     *
     * The LMS currently has a parent fees page but no stable fee ledger API
     * contract in this dashboard controller yet, so return a safe, explicit
     * status payload that the UI can render when fee tracking is not configured.
     */
    private function buildPendingFeeStatus(array $childrenData): array
    {
        if (empty($childrenData)) {
            return [
                'applicable' => false,
                'status' => 'not_applicable',
                'label' => 'N/A',
                'detail' => 'No linked children',
                'pending_count' => 0,
            ];
        }

        return [
            'applicable' => false,
            'status' => 'not_configured',
            'label' => 'N/A',
            'detail' => 'Fee tracking not configured',
            'pending_count' => 0,
        ];
    }
}
