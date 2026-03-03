<?php

namespace App\Repositories;

use PDO;

class GradeReportRepository extends BaseRepository
{
    protected $table = 'grade_reports';

    public function getAll($filters = [], $limit = 50, $offset = 0)
    {
        $sql = "SELECT gr.*, 
                s.student_id as student_number,
                CONCAT(u.first_name, ' ', u.last_name) as student_name,
                c.name as class_name,
                sem.name as semester_name,
                ay.year_name as academic_year
                FROM {$this->table} gr
                LEFT JOIN students s ON gr.student_id = s.id
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN classes c ON s.class_id = c.id
                LEFT JOIN semesters sem ON gr.semester_id = sem.id
                LEFT JOIN academic_years ay ON gr.academic_year_id = ay.id
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
        $params[':limit'] = (int)$limit;
        $params[':offset'] = (int)$offset;

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

    public function count($filters = [])
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
                sub.name as subject_name,
                sub.code as subject_code,
                gs.grade as grade_letter,
                gs.remark as grade_remark
                FROM grade_report_details grd
                LEFT JOIN subjects sub ON grd.subject_id = sub.id
                LEFT JOIN grade_scales gs ON grd.grade_scale_id = gs.id
                WHERE grd.grade_report_id = :report_id
                ORDER BY sub.name ASC";

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
            $reportId = $existing['id'];
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
            'total_score' => 0,
            'average_score' => 0,
            'gpa' => 0,
            'position' => null,
            'remarks' => $remarks,
            'generated_by' => $generatedBy,
            'published' => 0
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
        $sql = "SELECT r.*, 
                cs.subject_id,
                r.score,
                r.grade_scale_id
                FROM results r
                JOIN assessments a ON r.assessment_id = a.id
                JOIN class_subjects cs ON a.class_subject_id = cs.id
                WHERE r.student_id = :student_id
                AND a.semester_id = :semester_id
                GROUP BY cs.subject_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':student_id' => $studentId,
            ':semester_id' => $semesterId
        ]);

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Insert details
        foreach ($results as $result) {
            // Calculate average for this subject
            $avgSql = "SELECT AVG(r.score) as avg_score, MAX(r.grade_scale_id) as grade_scale_id
                      FROM results r
                      JOIN assessments a ON r.assessment_id = a.id
                      JOIN class_subjects cs ON a.class_subject_id = cs.id
                      WHERE r.student_id = :student_id
                      AND a.semester_id = :semester_id
                      AND cs.subject_id = :subject_id";

            $avgStmt = $this->db->prepare($avgSql);
            $avgStmt->execute([
                ':student_id' => $studentId,
                ':semester_id' => $semesterId,
                ':subject_id' => $result['subject_id']
            ]);
            $avgResult = $avgStmt->fetch(PDO::FETCH_ASSOC);

            $detailSql = "INSERT INTO grade_report_details 
                         (grade_report_id, subject_id, score, grade_scale_id, remarks, created_at)
                         VALUES (:report_id, :subject_id, :score, :grade_scale_id, NULL, NOW())";

            $detailStmt = $this->db->prepare($detailSql);
            $detailStmt->execute([
                ':report_id' => $reportId,
                ':subject_id' => $result['subject_id'],
                ':score' => round($avgResult['avg_score'], 2),
                ':grade_scale_id' => $avgResult['grade_scale_id']
            ]);
        }
    }

    private function regenerateReportDetails($reportId, $studentId, $semesterId)
    {
        // Delete existing details
        $deleteSql = "DELETE FROM grade_report_details WHERE grade_report_id = :report_id";
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
                SUM(score) as total_score,
                AVG(score) as average_score
                FROM grade_report_details
                WHERE grade_report_id = :report_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':report_id' => $reportId]);
        $totals = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calculate GPA (assuming 4.0 scale, can be adjusted)
        $gpa = $totals['average_score'] ? round($totals['average_score'] / 25, 2) : 0;

        // Update report
        $updateSql = "UPDATE {$this->table} 
                     SET total_score = :total_score,
                         average_score = :average_score,
                         gpa = :gpa
                     WHERE id = :report_id";

        $updateStmt = $this->db->prepare($updateSql);
        $updateStmt->execute([
            ':total_score' => round($totals['total_score'], 2),
            ':average_score' => round($totals['average_score'], 2),
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
                c.name as class_name,
                p.name as program_name,
                gl.name as grade_level_name,
                sem.name as semester_name,
                ay.year_name as academic_year,
                i.name as institution_name,
                i.logo as institution_logo
                FROM {$this->table} gr
                LEFT JOIN students s ON gr.student_id = s.id
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN classes c ON s.class_id = c.id
                LEFT JOIN programs p ON s.program_id = p.id
                LEFT JOIN grade_levels gl ON s.grade_level_id = gl.id
                LEFT JOIN semesters sem ON gr.semester_id = sem.id
                LEFT JOIN academic_years ay ON gr.academic_year_id = ay.id
                LEFT JOIN institutions i ON s.institution_id = i.id
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
                sem.name as semester_name,
                ay.year_name as academic_year
                FROM {$this->table} gr
                LEFT JOIN semesters sem ON gr.semester_id = sem.id
                LEFT JOIN academic_years ay ON gr.academic_year_id = ay.id
                WHERE gr.student_id = :student_id";
        $params = [':student_id' => $studentId];

        if ($academicYearId) {
            $sql .= " AND gr.academic_year_id = :academic_year_id";
            $params[':academic_year_id'] = $academicYearId;
        }

        $sql .= " ORDER BY ay.id, sem.id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get details for each report
        foreach ($reports as &$report) {
            $report['details'] = $this->getReportDetails($report['id']);
        }

        // Get student info
        $studentSql = "SELECT s.*, 
                      CONCAT(u.first_name, ' ', u.last_name) as student_name,
                      c.name as class_name,
                      p.name as program_name,
                      gl.name as grade_level_name,
                      i.name as institution_name
                      FROM students s
                      LEFT JOIN users u ON s.user_id = u.id
                      LEFT JOIN classes c ON s.class_id = c.id
                      LEFT JOIN programs p ON s.program_id = p.id
                      LEFT JOIN grade_levels gl ON s.grade_level_id = gl.id
                      LEFT JOIN institutions i ON s.institution_id = i.id
                      WHERE s.id = :student_id";

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
                JOIN students s ON gr.student_id = s.id
                JOIN users u ON s.user_id = u.id
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

        $sql .= " ORDER BY gr.average_score DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function bulkGenerateForClass($classId, $semesterId, $academicYearId, $generatedBy = null)
    {
        // Get all students in the class
        $sql = "SELECT id FROM students WHERE class_id = :class_id AND status = 'active'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':class_id' => $classId]);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $count = 0;
        foreach ($students as $student) {
            $this->generateReport($student['id'], $semesterId, $academicYearId, null, $generatedBy);
            $count++;
        }

        // Calculate positions
        $this->calculatePositions($classId, $semesterId, $academicYearId);

        return $count;
    }

    private function calculatePositions($classId, $semesterId, $academicYearId)
    {
        $sql = "SELECT gr.id 
                FROM {$this->table} gr
                JOIN students s ON gr.student_id = s.id
                WHERE s.class_id = :class_id
                AND gr.semester_id = :semester_id
                AND gr.academic_year_id = :academic_year_id
                ORDER BY gr.average_score DESC, gr.total_score DESC";

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
            $updateSql = "UPDATE {$this->table} SET position = :position WHERE id = :id";
            $updateStmt = $this->db->prepare($updateSql);
            $updateStmt->execute([
                ':position' => $position,
                ':id' => $report['id']
            ]);
            $position++;
        }
    }

    public function getStatistics($institutionId = null, $semesterId = null, $academicYearId = null)
    {
        $sql = "SELECT 
                COUNT(DISTINCT gr.id) as total_reports,
                COUNT(DISTINCT gr.student_id) as total_students,
                AVG(gr.average_score) as overall_average,
                MAX(gr.average_score) as highest_average,
                MIN(gr.average_score) as lowest_average,
                AVG(gr.gpa) as average_gpa
                FROM {$this->table} gr";

        $joins = [];
        $conditions = [];
        $params = [];

        if ($institutionId) {
            $joins[] = "JOIN students s ON gr.student_id = s.id";
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
