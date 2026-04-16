<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\RoleMiddleware;
use App\Repositories\AssessmentRepository;
use App\Repositories\ParentRepository;
use App\Repositories\StudentRepository;
use App\Utils\Response;
use PDO;

class FinalScoreController
{
    private AssessmentRepository $assessmentRepo;
    private StudentRepository $studentRepo;
    private ParentRepository $parentRepo;
    private PDO $db;

    public function __construct()
    {
        $this->assessmentRepo = new AssessmentRepository();
        $this->studentRepo = new StudentRepository();
        $this->parentRepo = new ParentRepository();
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * GET /courses/{courseId}/students/{studentId}/final-score
     */
    public function show(array $user, int $courseId, int $studentId): void
    {
        try {
            $roleMiddleware = new RoleMiddleware($user);
            if (!$roleMiddleware->requireRole(['admin', 'teacher', 'student', 'parent'])) {
                return;
            }

            $institutionId = isset($user['institution_id']) ? (int) $user['institution_id'] : 0;
            if ($institutionId <= 0 || $courseId <= 0 || $studentId <= 0) {
                Response::error('institution, courseId and studentId are required', 400);
                return;
            }

            if (!$this->isCourseInInstitution($courseId, $institutionId)) {
                Response::forbidden('Course is outside your institution scope');
                return;
            }

            if (!$this->isStudentInInstitution($studentId, $institutionId)) {
                Response::forbidden('Student is outside your institution scope');
                return;
            }

            if (!$this->isAllowedForRole($user, $studentId)) {
                Response::forbidden('You do not have access to this student score');
                return;
            }

            $academicYearId = isset($_GET['academic_year_id']) ? (int) $_GET['academic_year_id'] : $this->getCurrentAcademicYearId();
            $semesterId = isset($_GET['semester_id']) ? (int) $_GET['semester_id'] : $this->getCurrentSemesterId();

            if ($academicYearId <= 0 || $semesterId <= 0) {
                Response::error('Current academic year and semester are required', 400);
                return;
            }

            $result = $this->assessmentRepo->computePublishedFinalScore(
                $institutionId,
                $courseId,
                $studentId,
                $academicYearId,
                $semesterId
            );

            $payload = [
                'course_id' => $courseId,
                'student_id' => $studentId,
                'academic_year_id' => $academicYearId,
                'semester_id' => $semesterId,
                'published_only' => true,
                'complete' => (bool) ($result['complete'] ?? false),
                'final_percentage' => $result['final_percentage'] ?? null,
                'weights_sum' => $result['weights_sum'] ?? 0,
                'breakdown' => $result['breakdown'] ?? [],
                'required_categories_count' => $result['required_categories_count'] ?? 0,
                'published_categories_count' => $result['published_categories_count'] ?? 0,
                'missing_categories' => $result['missing_categories'] ?? [],
                'formula' => $result['formula'] ?? 'SUM((category_score/category_max_score)*category_weight)',
            ];

            if (!$payload['complete']) {
                Response::success($payload, 'Incomplete assessment');
                return;
            }

            Response::success($payload, 'Final score computed successfully');
        } catch (\Throwable $e) {
            error_log('FinalScoreController::show ' . $e->getMessage());
            Response::serverError('Failed to compute final score');
        }
    }

    private function isAllowedForRole(array $user, int $studentId): bool
    {
        $roles = $user['roles'] ?? [];
        if (!is_array($roles)) {
            $roles = [];
        }

        if (in_array('admin', $roles, true) || in_array('teacher', $roles, true) || in_array('super_admin', $roles, true)) {
            return true;
        }

        $userId = isset($user['user_id']) ? (int) $user['user_id'] : (isset($user['id']) ? (int) $user['id'] : 0);
        if ($userId <= 0) {
            return false;
        }

        if (in_array('student', $roles, true)) {
            $student = $this->studentRepo->findByUserId($userId);
            return $student && (int) ($student['student_id'] ?? 0) === $studentId;
        }

        if (in_array('parent', $roles, true)) {
            $parent = $this->parentRepo->findByUserId($userId);
            if (!$parent) {
                return false;
            }
            $children = $this->parentRepo->getStudents((int) $parent['parent_id']);
            foreach ($children as $child) {
                if ((int) ($child['student_id'] ?? 0) === $studentId) {
                    return true;
                }
            }
        }

        return false;
    }

    private function isCourseInInstitution(int $courseId, int $institutionId): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM class_subjects WHERE course_id = :course_id AND institution_id = :institution_id LIMIT 1');
        $stmt->execute([
            'course_id' => $courseId,
            'institution_id' => $institutionId,
        ]);
        return (bool) $stmt->fetchColumn();
    }

    private function isStudentInInstitution(int $studentId, int $institutionId): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM students WHERE student_id = :student_id AND institution_id = :institution_id LIMIT 1');
        $stmt->execute([
            'student_id' => $studentId,
            'institution_id' => $institutionId,
        ]);
        return (bool) $stmt->fetchColumn();
    }

    private function getCurrentAcademicYearId(): int
    {
        $stmt = $this->db->prepare('SELECT academic_year_id FROM academic_years WHERE is_current = 1 LIMIT 1');
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    private function getCurrentSemesterId(): int
    {
        $stmt = $this->db->prepare('SELECT semester_id FROM semesters WHERE is_current = 1 LIMIT 1');
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }
}
