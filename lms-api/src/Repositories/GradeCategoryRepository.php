<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class GradeCategoryRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(?int $institutionId = null): array
    {
        try {
            $sql = "
                SELECT
                    gc.*,
                    COUNT(gs.grade_scale_id) AS details_count,
                    MAX(gs.updated_at) AS last_scale_update
                FROM grade_categories gc
                LEFT JOIN grade_scales gs ON gs.grade_categories_id = gc.grade_categories_id
            ";

            $params = [];
            if ($institutionId !== null) {
                $sql .= " WHERE gc.institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }

            $sql .= " GROUP BY gc.grade_categories_id ORDER BY gc.grade_categories_name ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log('Get Grade Categories Error: ' . $e->getMessage());
            return [];
        }
    }

    public function findById(int $id, ?int $institutionId = null): ?array
    {
        try {
            $sql = 'SELECT * FROM grade_categories WHERE grade_categories_id = :id';
            $params = ['id' => $id];

            if ($institutionId !== null) {
                $sql .= ' AND institution_id = :institution_id';
                $params['institution_id'] = $institutionId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (\PDOException $e) {
            error_log('Find Grade Category Error: ' . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $setAsPrimary = $this->normalizePrimaryValue($data['set_as_primary'] ?? 0);
            $status = strtolower(trim((string) ($data['status'] ?? 'active')));

            if ($setAsPrimary === 1 && $status === 'inactive') {
                error_log('Create Grade Category Error: cannot set inactive category as primary');
                return null;
            }

            if ($setAsPrimary === 1) {
                $this->db->beginTransaction();
            }

            $stmt = $this->db->prepare("
                INSERT INTO grade_categories (
                    institution_id,
                    grade_categories_name,
                    grade_categories_description,
                    Pass_Threshold,
                    Used_By,
                    set_as_primary,
                    status
                ) VALUES (
                    :institution_id,
                    :grade_categories_name,
                    :grade_categories_description,
                    :Pass_Threshold,
                    :Used_By,
                    :set_as_primary,
                    :status
                )
            ");

            $stmt->execute([
                'institution_id' => $data['institution_id'],
                'grade_categories_name' => $data['grade_categories_name'],
                'grade_categories_description' => $data['grade_categories_description'] ?? null,
                'Pass_Threshold' => $data['Pass_Threshold'] ?? null,
                'Used_By' => $data['Used_By'] ?? null,
                'set_as_primary' => $setAsPrimary,
                'status' => $data['status'] ?? 'active',
            ]);

            $newId = (int) $this->db->lastInsertId();

            if ($setAsPrimary === 1) {
                $this->clearOtherPrimaryCategories((int) $data['institution_id'], $newId);
                $this->db->commit();
            }

            return $newId;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('Create Grade Category Error: ' . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $institutionId = $this->getInstitutionIdForCategory($id);
            if ($institutionId === null) {
                return false;
            }

            $current = $this->findById($id);
            if (!$current) {
                return false;
            }

            $setPrimaryRequested = array_key_exists('set_as_primary', $data);
            if ($setPrimaryRequested) {
                $data['set_as_primary'] = $this->normalizePrimaryValue($data['set_as_primary']);
            }

            $nextStatus = array_key_exists('status', $data)
                ? strtolower(trim((string) $data['status']))
                : strtolower(trim((string) ($current['status'] ?? 'active')));
            $nextPrimary = array_key_exists('set_as_primary', $data)
                ? (int) $data['set_as_primary']
                : (int) ($current['set_as_primary'] ?? 0);

            if ($nextPrimary === 1 && $nextStatus === 'inactive') {
                error_log('Update Grade Category Error: cannot set inactive category as primary');
                return false;
            }

            if ($setPrimaryRequested && (int) $data['set_as_primary'] === 1) {
                $this->db->beginTransaction();
            }

            $allowed = [
                'grade_categories_name',
                'grade_categories_description',
                'Pass_Threshold',
                'Used_By',
                'set_as_primary',
                'status',
            ];

            $updates = [];
            $params = ['id' => $id];

            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (!$updates) {
                return false;
            }

            $sql = 'UPDATE grade_categories SET ' . implode(', ', $updates) . ' WHERE grade_categories_id = :id';
            $stmt = $this->db->prepare($sql);
            $updated = $stmt->execute($params);

            if (!$updated) {
                if ($this->db->inTransaction()) {
                    $this->db->rollBack();
                }
                return false;
            }

            if ($setPrimaryRequested && (int) $data['set_as_primary'] === 1) {
                $this->clearOtherPrimaryCategories($institutionId, $id);
                $this->db->commit();
            }

            return true;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('Update Grade Category Error: ' . $e->getMessage());
            return false;
        }
    }

    private function clearOtherPrimaryCategories(int $institutionId, int $currentCategoryId): void
    {
        $stmt = $this->db->prepare('
            UPDATE grade_categories
            SET set_as_primary = 0
            WHERE institution_id = :institution_id
              AND grade_categories_id <> :grade_categories_id
        ');

        $stmt->execute([
            'institution_id' => $institutionId,
            'grade_categories_id' => $currentCategoryId,
        ]);
    }

    private function getInstitutionIdForCategory(int $id): ?int
    {
        $stmt = $this->db->prepare('SELECT institution_id FROM grade_categories WHERE grade_categories_id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || !isset($row['institution_id'])) {
            return null;
        }

        return (int) $row['institution_id'];
    }

    private function normalizePrimaryValue($value): int
    {
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        if (is_numeric($value)) {
            return ((int) $value) === 1 ? 1 : 0;
        }

        $text = strtolower(trim((string) $value));
        return in_array($text, ['1', 'true', 'yes', 'on'], true) ? 1 : 0;
    }

    public function delete(int $id, ?int $institutionId = null): bool
    {
        try {
            $sql = 'DELETE FROM grade_categories WHERE grade_categories_id = :id';
            $params = ['id' => $id];

            if ($institutionId !== null) {
                $sql .= ' AND institution_id = :institution_id';
                $params['institution_id'] = $institutionId;
            }

            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log('Delete Grade Category Error: ' . $e->getMessage());
            return false;
        }
    }
}
