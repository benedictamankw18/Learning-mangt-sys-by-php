<?php

namespace App\Repositories;

use App\Config\Database;

class ParentRepository
{
    private $db;

    private const SELECT_COLUMNS = "
        p.parent_id,
        p.institution_id,
        p.user_id,
        p.guardian_id,
        p.occupation,
        p.prefers_email_notifications,
        p.prefers_sms_notifications,
        p.created_at,
        p.updated_at,
        u.uuid,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.address,
        u.is_active,
        u.profile_photo
    ";

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(int $page = 1, int $limit = 20, ?int $institutionId = null): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $sql = "
                SELECT " . self::SELECT_COLUMNS . ",
                       COALESCE(ps_counts.linked_students_count, 0) AS linked_students_count
                FROM parents p
                LEFT JOIN users u ON p.user_id = u.user_id
                LEFT JOIN (
                    SELECT parent_id, COUNT(*) AS linked_students_count
                    FROM parent_students
                    GROUP BY parent_id
                ) ps_counts ON ps_counts.parent_id = p.parent_id
            ";

            if ($institutionId !== null) {
                $sql .= " WHERE p.institution_id = u.institution_id AND p.institution_id = :institution_id";
            }

            $sql .= " ORDER BY COALESCE(u.last_name, ''), COALESCE(u.first_name, ''), p.parent_id LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);
            if ($institutionId !== null) {
                $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
            }
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Parents Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(?int $institutionId = null): int
    {
        try {
            if ($institutionId === null) {
                $stmt = $this->db->query("SELECT COUNT(*) as total FROM parents");
            } else {
                $stmt = $this->db->prepare("
                    SELECT COUNT(*) as total
                    FROM parents p
                    LEFT JOIN users u ON p.user_id = u.user_id
                    WHERE p.institution_id = u.institution_id
                      AND p.institution_id = :institution_id
                ");
                $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
                $stmt->execute();
            }
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Parents Error: " . $e->getMessage());
            return 0;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT " . self::SELECT_COLUMNS . "
                FROM parents p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.parent_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Parent Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $guardianId = isset($data['guardian_id']) ? trim((string) $data['guardian_id']) : '';
            $stmt = $this->db->prepare("
                INSERT INTO parents (
                    institution_id,
                    user_id,
                    guardian_id,
                    occupation,
                    prefers_email_notifications,
                    prefers_sms_notifications
                )
                VALUES (
                    :institution_id,
                    :user_id,
                    :guardian_id,
                    :occupation,
                    :prefers_email_notifications,
                    :prefers_sms_notifications
                )
            ");
            $stmt->execute([
                'institution_id' => $data['institution_id'],
                'user_id' => $data['user_id'] ?? null,
                'guardian_id' => $guardianId !== '' ? $guardianId : null,
                'occupation' => $data['occupation'] ?? null,
                'prefers_email_notifications' => !empty($data['prefers_email_notifications']) ? 1 : 0,
                'prefers_sms_notifications' => !empty($data['prefers_sms_notifications']) ? 1 : 0
            ]);

            $parentId = (int) $this->db->lastInsertId();

            if ($parentId > 0 && $guardianId === '') {
                $updateStmt = $this->db->prepare("UPDATE parents SET guardian_id = :guardian_id WHERE parent_id = :parent_id");
                $updateStmt->execute([
                    'guardian_id' => $this->generateGuardianId($parentId),
                    'parent_id' => $parentId
                ]);
            }

            return $parentId;
        } catch (\PDOException $e) {
            error_log("Create Parent Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = [
                'institution_id',
                'guardian_id',
                'occupation',
                'prefers_email_notifications',
                'prefers_sms_notifications'
            ];
            $updates = [];
            $params = ['id' => $id];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($updates)) {
                return false;
            }

            $sql = "UPDATE parents SET " . implode(', ', $updates) . " WHERE parent_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Parent Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM parents WHERE parent_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Parent Error: " . $e->getMessage());
            return false;
        }
    }

    public function findByUserId(int $userId): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT " . self::SELECT_COLUMNS . "
                FROM parents p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.user_id = :user_id
            ");
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Parent By User Error: " . $e->getMessage());
            return null;
        }
    }

    public function getStudents(int $parentId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.*,
                       ps.parent_student_id,
                       ps.parent_id,
                       ps.student_id,
                       ps.relationship_type,
                       ps.is_primary_contact,
                       ps.can_pickup,
                       u.first_name, u.last_name, u.email,
                       c.class_name,
                       c.class_code,
                       p.program_name,
                       ps.relationship_type as relationship,
                       ps.is_primary_contact as is_primary
                FROM parent_students ps
                INNER JOIN students s ON ps.student_id = s.student_id
                INNER JOIN users u ON s.user_id = u.user_id
                LEFT JOIN classes c ON s.class_id = c.class_id
                LEFT JOIN programs p ON c.program_id = p.program_id
                WHERE ps.parent_id = :parent_id
                ORDER BY ps.is_primary_contact DESC, u.last_name, u.first_name
            ");
            $stmt->execute(['parent_id' => $parentId]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Parent Students Error: " . $e->getMessage());
            return [];
        }
    }

    private function generateGuardianId(int $parentId): string
    {
        return 'GDN-' . str_pad((string) $parentId, 5, '0', STR_PAD_LEFT);
    }
}