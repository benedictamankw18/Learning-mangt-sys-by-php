<?php

namespace App\Repositories;

use PDO;

class GradeReportRepository extends BaseRepository
{
    protected $table = 'grade_reports';
    protected $primaryKey = 'report_id';

    public function getAll(array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT gr.*, 
                s.student_id as student_number,
                CONCAT(u.first_name, ' ', u.last_name) as student_name,
                c.class_name as class_name,
                sem.semester_name as semester_name,
                ay.year_name as academic_year
                FROM {$this->table} gr
                LEFT JOIN students s ON gr.student_id = s.student_id
                LEFT JOIN users u ON s.user_id = u.user_id
                LEFT JOIN classes c ON s.class_id = c.class_id
                LEFT JOIN semesters sem ON gr.semester_id = sem.semester_id
                LEFT JOIN academic_years ay ON gr.academic_year_id = ay.academic_year_id
                WHERE 1=1";
        $params = [];

        if (!empty($filters['student_id'])) {
            $sql .= " AND gr.student_id = :student_id";
            $params[':student_id'] = $filters['student_id'];
        }

        if (!empty($filters['semester_id'])) {
            $sql .= " AND gr.semester_id = :semester_id";
            $params[':semester_id'] = $filters['semester_id'];
        }

        if (!empty($filters['academic_year_id'])) {
            $sql .= " AND gr.academic_year_id = :academic_year_id";
            $params[':academic_year_id'] = $filters['academic_year_id'];
        }

        $sql .= " ORDER BY gr.created_at DESC LIMIT :limit OFFSET :offset";
        $params[':limit'] = (int) $limit;
        $params[':offset'] = (int) $offset;

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function count(array $filters = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE 1=1";
        $params = [];

        if (!empty($filters['student_id'])) {
            $sql .= " AND student_id = :student_id";
            $params[':student_id'] = $filters['student_id'];
        }

        if (!empty($filters['semester_id'])) {
            $sql .= " AND semester_id = :semester_id";
            $params[':semester_id'] = $filters['semester_id'];
        }

        if (!empty($filters['academic_year_id'])) {
            $sql .= " AND academic_year_id = :academic_year_id";
            $params[':academic_year_id'] = $filters['academic_year_id'];
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public function getReportDetails($reportId)
    {
        $sql = "SELECT grd.*, 
                sub.subject_name as subject_name,
                sub.subject_code as subject_code,
                gs.grade as grade_letter,
                gs.remark as grade_remark
                FROM grade_report_details grd
                LEFT JOIN subjects sub ON grd.subject_id = sub.subject_id
                LEFT JOIN grade_scales gs ON grd.grade_scale_id = gs.grade_scale_id
                WHERE grd.grade_report_id = :report_id
                ORDER BY sub.subject_name ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':report_id' => $reportId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function generateReport($studentId, $semesterId, $academicYearId, $remarks = null, $generatedBy = null)
    {
        // Check if report already exists
        $existing = $this->findByConditions([
            'student_id' => $studentId,
            'semester_id' => $semesterId,
            'academic_year_id' => $academicYearId
        ]);

        if ($existing) {
            // Update existing report
            $reportId = $existing['report_id'];
            $this->regenerateReportDetails($reportId, $studentId, $semesterId);

            // Recalculate totals
            $this->recalculateTotals($reportId);

            return $reportId;
        }

        // Create new report
        $reportId = $this->create([
            'student_id' => $studentId,
            'semester_id' => $semesterId,
            'academic_year_id' => $academicYearId,
            'gpa' => 0,
            'cgpa' => 0,
            'class_rank' => null,
            'teacher_comment' => $remarks,
            'generated_by' => $generatedBy,
            'is_published' => 0
        ]);

        // Generate report details from results
        $this->generateReportDetails($reportId, $studentId, $semesterId);

        // Calculate totals
        $this->recalculateTotals($reportId);

        return $reportId;
    }

    private function generateReportDetails($reportId, $studentId, $semesterId)
    {
        // Get all results for this student in this semester
        $sql = "SELECT 
                cs.course_id,
                cs.subject_id,
                AVG(r.score) as avg_score,
                AVG(r.percentage) as avg_percentage,
                SUM(r.score) as total_score
                FROM results r
                JOIN assessments a ON r.assessment_id = a.assessment_id
                JOIN class_subjects cs ON a.class_subject_id = cs.course_id
                WHERE r.student_id = :student_id
                AND a.semester_id = :semester_id
                GROUP BY cs.course_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':student_id' => $studentId,
            ':semester_id' => $semesterId
        ]);

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Insert details
        foreach ($results as $result) {
            $detailSql = "INSERT INTO grade_report_details 
                         (report_id, course_id, total_score, percentage, created_at)
                         VALUES (:report_id, :course_id, :total_score, :percentage, NOW())";

            $detailStmt = $this->db->prepare($detailSql);
            $detailStmt->execute([
                ':report_id' => $reportId,
                ':course_id' => $result['course_id'],
                ':total_score' => round($result['total_score'], 2),
                ':percentage' => round($result['avg_percentage'], 2)
            ]);
        }
    }

    private function regenerateReportDetails($reportId, $studentId, $semesterId)
    {
        // Delete existing details
        $deleteSql = "DELETE FROM grade_report_details WHERE report_id = :report_id";
        $deleteStmt = $this->db->prepare($deleteSql);
        $deleteStmt->execute([':report_id' => $reportId]);

        // Regenerate
        $this->generateReportDetails($reportId, $studentId, $semesterId);
    }

    private function recalculateTotals($reportId)
    {
        // Get all details for this report  
        $sql = "SELECT 
                COUNT(*) as subject_count,
                SUM(total_score) as sum_total_score,
                AVG(total_score) as avg_total_score,
                AVG(percentage) as avg_percentage
                FROM grade_report_details
                WHERE report_id = :report_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':report_id' => $reportId]);
        $totals = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calculate GPA (assuming 4.0 scale based on percentage)
        $gpa = $totals['avg_percentage'] ? round(($totals['avg_percentage'] / 100) * 4, 2) : 0;

        // Update report
        $updateSql = "UPDATE {$this->table} 
                     SET gpa = :gpa
                     WHERE report_id = :report_id";

        $updateStmt = $this->db->prepare($updateSql);
        $updateStmt->execute([
            ':gpa' => $gpa,
            ':report_id' => $reportId
        ]);
    }

    public function getReportCard($studentId, $semesterId = null, $academicYearId = null)
    {
        $sql = "SELECT gr.*, 
                s.student_id as student_number,
                CONCAT(u.first_name, ' ', u.last_name) as student_name,
                u.email,
                s.date_of_birth,
                s.gender,
                c.class_name as class_name,
                p.program_name as program_name,
                gl.grade_level_name as grade_level_name,
                sem.semester_name as semester_name,
                ay.year_name as academic_year,
                i.institution_name as institution_name,
                i.logo as institution_logo
                FROM {$this->table} gr
                LEFT JOIN students s ON gr.student_id = s.student_id
                LEFT JOIN users u ON s.user_id = u.user_id
                LEFT JOIN classes c ON s.class_id = c.class_id
                LEFT JOIN programs p ON s.program_id = p.program_id
                LEFT JOIN grade_levels gl ON s.grade_level_id = gl.grade_level_id
                LEFT JOIN semesters sem ON gr.semester_id = sem.semester_id
                LEFT JOIN academic_years ay ON gr.academic_year_id = ay.academic_year_id
                LEFT JOIN institutions i ON s.institution_id = i.institution_id
                WHERE gr.student_id = :student_id";
        $params = [':student_id' => $studentId];

        if ($semesterId) {
            $sql .= " AND gr.semester_id = :semester_id";
            $params[':semester_id'] = $semesterId;
        }

        if ($academicYearId) {
            $sql .= " AND gr.academic_year_id = :academic_year_id";
            $params[':academic_year_id'] = $academicYearId;
        }

        $sql .= " ORDER BY gr.created_at DESC LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($report) {
            // Get details
            $report['details'] = $this->getReportDetails($report['id']);
        }

        return $report;
    }

    public function getTranscript($studentId, $academicYearId = null)
    {
        $sql = "SELECT gr.*, 
                sem.semester_name as semester_name,
                ay.year_name as academic_year
                FROM {$this->table} gr
                LEFT JOIN semesters sem ON gr.semester_id = sem.semester_id
                LEFT JOIN academic_years ay ON gr.academic_year_id = ay.academic_year_id
                WHERE gr.student_id = :student_id";
        $params = [':student_id' => $studentId];

        if ($academicYearId) {
            $sql .= " AND gr.academic_year_id = :academic_year_id";
            $params[':academic_year_id'] = $academicYearId;
        }

        $sql .= " ORDER BY ay.academic_year_id, sem.semester_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get details for each report
        foreach ($reports as &$report) {
            $report['details'] = $this->getReportDetails($report['report_id']);
        }

        // Get student info
        $studentSql = "SELECT s.*, 
                      CONCAT(u.first_name, ' ', u.last_name) as student_name,
                      c.class_name as class_name,
                      p.program_name as program_name,
                      gl.grade_level_name as grade_level_name,
                      i.institution_name as institution_name
                      FROM students s
                      LEFT JOIN users u ON s.user_id = u.user_id
                      LEFT JOIN classes c ON s.class_id = c.class_id
                      LEFT JOIN programs p ON s.program_id = p.program_id
                      LEFT JOIN grade_levels gl ON s.grade_level_id = gl.grade_level_id
                      LEFT JOIN institutions i ON s.institution_id = i.institution_id
                      WHERE s.student_id = :student_id";

        $studentStmt = $this->db->prepare($studentSql);
        $studentStmt->execute([':student_id' => $studentId]);
        $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

        return [
            'student' => $student,
            'reports' => $reports
        ];
    }

    public function getClassReports($classId, $semesterId = null, $academicYearId = null)
    {
        $sql = "SELECT gr.*, 
                s.student_id as student_number,
                CONCAT(u.first_name, ' ', u.last_name) as student_name
                FROM {$this->table} gr
                JOIN students s ON gr.student_id = s.student_id
                JOIN users u ON s.user_id = u.user_id
                WHERE s.class_id = :class_id";
        $params = [':class_id' => $classId];

        if ($semesterId) {
            $sql .= " AND gr.semester_id = :semester_id";
            $params[':semester_id'] = $semesterId;
        }

        if ($academicYearId) {
            $sql .= " AND gr.academic_year_id = :academic_year_id";
            $params[':academic_year_id'] = $academicYearId;
        }

        $sql .= " ORDER BY gr.gpa DESC, gr.cgpa DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function bulkGenerateForClass($classId, $semesterId, $academicYearId, $generatedBy = null)
    {
        // Get all students in the class
        $sql = "SELECT student_id FROM students WHERE class_id = :class_id AND status = 'active'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':class_id' => $classId]);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $count = 0;
        foreach ($students as $student) {
            $this->generateReport($student['student_id'], $semesterId, $academicYearId, null, $generatedBy);
            $count++;
        }

        // Calculate positions
        $this->calculatePositions($classId, $semesterId, $academicYearId);

        return $count;
    }

    private function calculatePositions($classId, $semesterId, $academicYearId)
    {
        $sql = "SELECT gr.report_id 
                FROM {$this->table} gr
                JOIN students s ON gr.student_id = s.student_id
                WHERE s.class_id = :class_id
                AND gr.semester_id = :semester_id
                AND gr.academic_year_id = :academic_year_id
                ORDER BY gr.gpa DESC, gr.cgpa DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':class_id' => $classId,
            ':semester_id' => $semesterId,
            ':academic_year_id' => $academicYearId
        ]);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Assign positions
        $position = 1;
        foreach ($reports as $report) {
            $updateSql = "UPDATE {$this->table} SET position = :position WHERE report_id = :report_id";
            $updateStmt = $this->db->prepare($updateSql);
            $updateStmt->execute([
                ':position' => $position,
                ':report_id' => $report['report_id']
            ]);
            $position++;
        }
    }

    public function getStatistics($institutionId = null, $semesterId = null, $academicYearId = null)
    {
        $sql = "SELECT 
                COUNT(DISTINCT gr.report_id) as total_reports,
                COUNT(DISTINCT gr.student_id) as total_students,
                AVG(gr.gpa) as average_gpa,
                MAX(gr.gpa) as highest_gpa,
                MIN(gr.gpa) as lowest_gpa,
                AVG(gr.cgpa) as average_cgpa,
                AVG(gr.attendance_percentage) as average_attendance
                FROM {$this->table} gr";

        $joins = [];
        $conditions = [];
        $params = [];

        if ($institutionId) {
            $joins[] = "JOIN students s ON gr.student_id = s.student_id";
            $conditions[] = "s.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        if ($semesterId) {
            $conditions[] = "gr.semester_id = :semester_id";
            $params[':semester_id'] = $semesterId;
        }

        if ($academicYearId) {
            $conditions[] = "gr.academic_year_id = :academic_year_id";
            $params[':academic_year_id'] = $academicYearId;
        }

        if (!empty($joins)) {
            $sql .= " " . implode(" ", array_unique($joins));
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
