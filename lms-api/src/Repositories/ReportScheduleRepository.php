<?php

namespace App\Repositories;

use PDO;
use PDOException;

class ReportScheduleRepository extends BaseRepository
{
    protected $table = 'report_schedules';
    protected $primaryKey = 'schedule_id';

    public function getAllByInstitution(int $institutionId): array
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT *
                 FROM {$this->table}
                 WHERE institution_id = :institution_id
                 ORDER BY created_at DESC"
            );
            $stmt->execute(['institution_id' => $institutionId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::getAllByInstitution error: ' . $e->getMessage());
            return [];
        }
    }

    public function getAvailableReportTypesByInstitution(int $institutionId): array
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT DISTINCT report_type
                 FROM grade_reports
                 WHERE institution_id = :institution_id
                   AND TRIM(COALESCE(report_type, '')) <> ''
                 ORDER BY report_type ASC"
            );
            $stmt->execute(['institution_id' => $institutionId]);

            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            return array_values(array_filter(array_map(static function (array $row): string {
                return strtolower(trim((string) ($row['report_type'] ?? '')));
            }, $rows), static function (string $value): bool {
                return $value !== '';
            }));
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::getAvailableReportTypesByInstitution error: ' . $e->getMessage());
            return [];
        }
    }

    public function findByIdForInstitution(int $scheduleId, int $institutionId): ?array
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT *
                 FROM {$this->table}
                 WHERE schedule_id = :schedule_id AND institution_id = :institution_id
                 LIMIT 1"
            );
            $stmt->execute([
                'schedule_id' => $scheduleId,
                'institution_id' => $institutionId,
            ]);

            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::findByIdForInstitution error: ' . $e->getMessage());
            return null;
        }
    }

    public function createSchedule(array $data): ?array
    {
        try {
            $id = $this->create($data);
            if ($id <= 0) {
                return null;
            }

            $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE schedule_id = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::createSchedule error: ' . $e->getMessage());
            return null;
        }
    }

    public function setActive(int $scheduleId, int $institutionId, bool $active): bool
    {
        try {
            $stmt = $this->db->prepare(
                "UPDATE {$this->table}
                 SET is_active = :is_active,
                     updated_at = NOW()
                 WHERE schedule_id = :schedule_id
                   AND institution_id = :institution_id"
            );

            $stmt->execute([
                'is_active' => $active ? 1 : 0,
                'schedule_id' => $scheduleId,
                'institution_id' => $institutionId,
            ]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::setActive error: ' . $e->getMessage());
            return false;
        }
    }

    public function deleteForInstitution(int $scheduleId, int $institutionId): bool
    {
        try {
            $stmt = $this->db->prepare(
                "DELETE FROM {$this->table}
                 WHERE schedule_id = :schedule_id
                   AND institution_id = :institution_id"
            );
            $stmt->execute([
                'schedule_id' => $scheduleId,
                'institution_id' => $institutionId,
            ]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::deleteForInstitution error: ' . $e->getMessage());
            return false;
        }
    }

    public function getDueSchedules(?string $asOf = null): array
    {
        try {
            $asOf = $asOf ?: date('Y-m-d H:i:s');

            $stmt = $this->db->prepare(
                "SELECT *
                 FROM {$this->table}
                 WHERE is_active = 1
                   AND (next_run_at IS NULL OR next_run_at <= :as_of)
                 ORDER BY COALESCE(next_run_at, created_at) ASC
                 LIMIT 200"
            );
            $stmt->execute(['as_of' => $asOf]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::getDueSchedules error: ' . $e->getMessage());
            return [];
        }
    }

    public function markRunResult(int $scheduleId, bool $success, string $message, array $payload = []): bool
    {
        try {
            $schedule = $this->findById($scheduleId);
            if (!$schedule) {
                return false;
            }

            $now = date('Y-m-d H:i:s');
            $nextRunAt = $this->computeNextRunAt(
                (string) ($schedule['frequency'] ?? 'monthly'),
                (int) ($schedule['institution_id'] ?? 0),
                $now
            );

            $this->db->beginTransaction();

            $insertRun = $this->db->prepare(
                "INSERT INTO report_schedule_runs
                    (schedule_id, run_at, status, message, generated_payload)
                 VALUES
                    (:schedule_id, :run_at, :status, :message, :generated_payload)"
            );
            $insertRun->execute([
                'schedule_id' => $scheduleId,
                'run_at' => $now,
                'status' => $success ? 'success' : 'failed',
                'message' => $message,
                'generated_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
            ]);

            $updateSchedule = $this->db->prepare(
                "UPDATE {$this->table}
                 SET last_run_at = :last_run_at,
                     next_run_at = :next_run_at,
                     updated_at = NOW()
                 WHERE schedule_id = :schedule_id"
            );
            $updateSchedule->execute([
                'last_run_at' => $now,
                'next_run_at' => $nextRunAt,
                'schedule_id' => $scheduleId,
            ]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('ReportScheduleRepository::markRunResult error: ' . $e->getMessage());
            return false;
        }
    }

    public function computeNextRunAt(string $frequency, int $institutionId, ?string $from = null): string
    {
        $fromDate = $from ? new \DateTime($from) : new \DateTime();
        $key = strtolower(trim($frequency));

        if ($key === 'weekly') {
            $fromDate->modify('+7 days');
            return $fromDate->format('Y-m-d H:i:s');
        }

        if ($key === 'monthly') {
            $fromDate->modify('+1 month');
            return $fromDate->format('Y-m-d H:i:s');
        }

        if ($key === 'term_end') {
            $next = $this->findNextSemesterEndDate($institutionId, $fromDate->format('Y-m-d'));
            if ($next) {
                return $next . ' 18:00:00';
            }

            $fromDate->modify('+90 days');
            return $fromDate->format('Y-m-d H:i:s');
        }

        if ($key === 'year_end') {
            $next = $this->findNextAcademicYearEndDate($institutionId, $fromDate->format('Y-m-d'));
            if ($next) {
                return $next . ' 18:00:00';
            }

            $fromDate->modify('+365 days');
            return $fromDate->format('Y-m-d H:i:s');
        }

        $fromDate->modify('+1 month');
        return $fromDate->format('Y-m-d H:i:s');
    }

    public function generateReportPayload(int $institutionId, string $reportType): array
    {
        $period = $this->getCurrentPeriod($institutionId);

        $totals = [
            'total_students' => $this->scalarInt(
                "SELECT COUNT(*) FROM students WHERE institution_id = :institution_id",
                ['institution_id' => $institutionId]
            ),
            'total_teachers' => $this->scalarInt(
                "SELECT COUNT(*) FROM teachers WHERE institution_id = :institution_id",
                ['institution_id' => $institutionId]
            ),
            'total_classes' => $this->scalarInt(
                "SELECT COUNT(*) FROM classes WHERE institution_id = :institution_id",
                ['institution_id' => $institutionId]
            ),
            'total_programs' => $this->scalarInt(
                "SELECT COUNT(*) FROM programs WHERE institution_id = :institution_id",
                ['institution_id' => $institutionId]
            ),
        ];

        $academicYearId = (int) ($period['academic_year_id'] ?? 0);
        $semesterId = (int) ($period['semester_id'] ?? 0);

        $performanceSql =
            "SELECT
                COALESCE(AVG(grd.percentage), 0) AS average_percentage,
                COALESCE(AVG(CASE WHEN grd.percentage >= 50 THEN 100 ELSE 0 END), 0) AS pass_rate,
                COUNT(*) AS detail_rows
             FROM grade_report_details grd
             INNER JOIN grade_reports gr ON gr.report_id = grd.report_id
             WHERE gr.institution_id = :institution_id";

        $params = ['institution_id' => $institutionId];

        if ($academicYearId > 0) {
            $performanceSql .= ' AND gr.academic_year_id = :academic_year_id';
            $params['academic_year_id'] = $academicYearId;
        }

        if ($semesterId > 0) {
            $performanceSql .= ' AND gr.semester_id = :semester_id';
            $params['semester_id'] = $semesterId;
        }

        $stmt = $this->db->prepare($performanceSql);
        $stmt->execute($params);
        $performance = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $attendanceRate = 0.0;
        $startDate = (string) ($period['start_date'] ?? '');
        $endDate = (string) ($period['end_date'] ?? '');
        if ($startDate !== '' && $endDate !== '') {
            $attendance = $this->db->prepare(
                "SELECT
                    COUNT(*) AS total_records,
                    COALESCE(SUM(LOWER(a.status) = 'present'), 0) AS present_records
                 FROM attendance a
                 INNER JOIN students s ON s.student_id = a.student_id
                 WHERE s.institution_id = :institution_id
                   AND a.attendance_date BETWEEN :start_date AND :end_date"
            );
            $attendance->execute([
                'institution_id' => $institutionId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);
            $row = $attendance->fetch(PDO::FETCH_ASSOC) ?: [];
            $total = (int) ($row['total_records'] ?? 0);
            $present = (int) ($row['present_records'] ?? 0);
            $attendanceRate = $total > 0 ? round(($present / $total) * 100, 2) : 0.0;
        }

        return [
            'report_type' => $reportType,
            'period' => [
                'academic_year_id' => $academicYearId,
                'semester_id' => $semesterId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'totals' => $totals,
            'performance' => [
                'average_percentage' => round((float) ($performance['average_percentage'] ?? 0), 2),
                'pass_rate' => round((float) ($performance['pass_rate'] ?? 0), 2),
                'detail_rows' => (int) ($performance['detail_rows'] ?? 0),
            ],
            'attendance' => [
                'rate' => $attendanceRate,
            ],
            'generated_at' => date('Y-m-d H:i:s'),
        ];
    }

    public function findRecentRunsBySchedule(int $scheduleId, int $limit = 10): array
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT *
                 FROM report_schedule_runs
                 WHERE schedule_id = :schedule_id
                 ORDER BY run_at DESC
                 LIMIT :limit"
            );
            $stmt->bindValue(':schedule_id', $scheduleId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', max(1, $limit), PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::findRecentRunsBySchedule error: ' . $e->getMessage());
            return [];
        }
    }

    private function getCurrentPeriod(int $institutionId): array
    {
        $period = [
            'academic_year_id' => 0,
            'semester_id' => 0,
            'start_date' => '',
            'end_date' => '',
        ];

        try {
            $yearStmt = $this->db->prepare(
                "SELECT academic_year_id, start_date, end_date
                 FROM academic_years
                 WHERE institution_id = :institution_id
                   AND is_current = 1
                 LIMIT 1"
            );
            $yearStmt->execute(['institution_id' => $institutionId]);
            $year = $yearStmt->fetch(PDO::FETCH_ASSOC) ?: null;

            if ($year) {
                $period['academic_year_id'] = (int) ($year['academic_year_id'] ?? 0);
                $period['start_date'] = (string) ($year['start_date'] ?? '');
                $period['end_date'] = (string) ($year['end_date'] ?? '');
            }

            $semStmt = $this->db->prepare(
                "SELECT semester_id, start_date, end_date
                 FROM semesters
                 WHERE institution_id = :institution_id
                   AND is_current = 1
                 LIMIT 1"
            );
            $semStmt->execute(['institution_id' => $institutionId]);
            $semester = $semStmt->fetch(PDO::FETCH_ASSOC) ?: null;

            if ($semester) {
                $period['semester_id'] = (int) ($semester['semester_id'] ?? 0);
                $period['start_date'] = (string) ($semester['start_date'] ?? $period['start_date']);
                $period['end_date'] = (string) ($semester['end_date'] ?? $period['end_date']);
            }
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::getCurrentPeriod error: ' . $e->getMessage());
        }

        return $period;
    }

    private function findNextSemesterEndDate(int $institutionId, string $fromDate): ?string
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT end_date
                 FROM semesters
                 WHERE institution_id = :institution_id
                   AND end_date > :from_date
                 ORDER BY end_date ASC
                 LIMIT 1"
            );
            $stmt->execute([
                'institution_id' => $institutionId,
                'from_date' => $fromDate,
            ]);

            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            return $row ? (string) $row['end_date'] : null;
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::findNextSemesterEndDate error: ' . $e->getMessage());
            return null;
        }
    }

    private function findNextAcademicYearEndDate(int $institutionId, string $fromDate): ?string
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT end_date
                 FROM academic_years
                 WHERE institution_id = :institution_id
                   AND end_date > :from_date
                 ORDER BY end_date ASC
                 LIMIT 1"
            );
            $stmt->execute([
                'institution_id' => $institutionId,
                'from_date' => $fromDate,
            ]);

            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            return $row ? (string) $row['end_date'] : null;
        } catch (PDOException $e) {
            error_log('ReportScheduleRepository::findNextAcademicYearEndDate error: ' . $e->getMessage());
            return null;
        }
    }

    private function scalarInt(string $sql, array $params): int
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $value = $stmt->fetchColumn();
        return (int) ($value ?: 0);
    }
}