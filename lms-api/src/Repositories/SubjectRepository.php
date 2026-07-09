<?php

namespace App\Repositories;

use App\Config\Database;
use App\Utils\UuidHelper;

class SubjectRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(
        int $page = 1,
        int $limit = 100,
        ?int $institutionId = null,
        ?string $search = null,
        ?int $isCore = null
    ): array {
        try {
            $offset = ($page - 1) * $limit;
            $where  = '1=1';
            $params = [];

            if ($institutionId !== null) {
                $where .= ' AND (s.institution_id = :institution_id OR s.institution_id IS NULL)';
                $params['institution_id'] = $institutionId;
            }
            if ($search !== null) {
                $where .= ' AND (s.subject_name LIKE :search_name OR s.subject_code LIKE :search_code)';
                $params['search_name'] = '%' . $search . '%';
                $params['search_code'] = '%' . $search . '%';
            }
            if ($isCore !== null) {
                $where .= ' AND s.is_core = :is_core';
                $params['is_core'] = $isCore;
            }

            $stmt = $this->db->prepare("
                SELECT s.*, COUNT(DISTINCT cs.course_id) AS assigned_classes
                FROM subjects s
                LEFT JOIN class_subjects cs ON cs.subject_id = s.subject_id
                WHERE {$where}
                GROUP BY s.subject_id
                ORDER BY s.is_core DESC, s.subject_code ASC
                LIMIT :limit OFFSET :offset
            ");

            foreach ($params as $k => $v) {
                $t = is_int($v) ? \PDO::PARAM_INT : \PDO::PARAM_STR;
                $stmt->bindValue(":$k", $v, $t);
            }
            $stmt->bindValue(':limit',  $limit,  \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log('Get Subjects Error: ' . $e->getMessage());
            return [];
        }
    }

    public function count(?int $institutionId = null, ?string $search = null, ?int $isCore = null): int
    {
        try {
            $where  = '1=1';
            $params = [];

            if ($institutionId !== null) {
                $where .= ' AND (institution_id = :institution_id OR institution_id IS NULL)';
                $params['institution_id'] = $institutionId;
            }
            if ($search !== null) {
                $where .= ' AND (subject_name LIKE :search_name OR subject_code LIKE :search_code)';
                $params['search_name'] = '%' . $search . '%';
                $params['search_code'] = '%' . $search . '%';
            }
            if ($isCore !== null) {
                $where .= ' AND is_core = :is_core';
                $params['is_core'] = $isCore;
            }

            $stmt = $this->db->prepare("SELECT COUNT(*) AS total FROM subjects WHERE {$where}");
            foreach ($params as $k => $v) {
                $t = is_int($v) ? \PDO::PARAM_INT : \PDO::PARAM_STR;
                $stmt->bindValue(":$k", $v, $t);
            }
            $stmt->execute();
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log('Count Subjects Error: ' . $e->getMessage());
            return 0;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM subjects WHERE subject_id = :id");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Subject Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Find subject by UUID
     * 
     * @param string $uuid
     * @return array|null
     */
    public function findByUuid(string $uuid): ?array
    {
        // Validate UUID format
        if (!UuidHelper::isValid($uuid)) {
            return null;
        }

        try {
            $stmt = $this->db->prepare("SELECT * FROM subjects WHERE uuid = :uuid");
            $stmt->execute(['uuid' => $uuid]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Subject By UUID Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            // Auto-generate UUID if not provided
            if (!isset($data['uuid'])) {
                $data['uuid'] = UuidHelper::generate();
            }

            $stmt = $this->db->prepare("
                INSERT INTO subjects (uuid, institution_id, subject_code, subject_name, description, credits, is_core)
                VALUES (:uuid, :institution_id, :subject_code, :subject_name, :description, :credits, :is_core)
            ");
            $stmt->execute([
                'uuid' => $data['uuid'],
                'institution_id' => $data['institution_id'],
                'subject_code' => $data['subject_code'],
                'subject_name' => $data['subject_name'],
                'description' => $data['description'] ?? null,
                'credits' => $data['credits'] ?? 3,
                'is_core' => $data['is_core'] ?? 0
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Subject Error: " . $e->getMessage());
            if ($e->errorInfo[1] === 1062) {
                throw new \RuntimeException('Subject code already exists', 409);
            }
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = ['institution_id', 'subject_code', 'subject_name', 'description', 'credits', 'is_core'];
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

            $sql = "UPDATE subjects SET " . implode(', ', $updates) . " WHERE subject_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Subject Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM subjects WHERE subject_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Subject Error: " . $e->getMessage());
            return false;
        }
    }

    public function getCoreSubjects(): array
    {
        try {
            $stmt = $this->db->query("SELECT * FROM subjects WHERE is_core = 1 ORDER BY subject_code");
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Core Subjects Error: " . $e->getMessage());
            return [];
        }
    }
}
