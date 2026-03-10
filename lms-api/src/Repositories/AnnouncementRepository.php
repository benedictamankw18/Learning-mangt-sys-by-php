<?php

namespace App\Repositories;

use PDO;
use App\Config\Database;
use App\Utils\UuidHelper;

class AnnouncementRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all announcements with filtering
     */
    public function getAll(int $page = 1, int $limit = 20, ?string $targetRole = null, ?bool $isPublished = null): array
    {
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT 
                a.*,
                u.first_name as author_first_name,
                u.last_name as author_last_name
            FROM announcements a
            LEFT JOIN users u ON a.author_id = u.user_id
            WHERE 1=1
        ";

        $params = [];

        if ($targetRole !== null) {
            $sql .= " AND a.target_role = :target_role";
            $params['target_role'] = $targetRole;
        }

        if ($isPublished !== null) {
            $sql .= " AND a.is_published = :is_published";
            $params['is_published'] = $isPublished ? 1 : 0;
        }

        $sql .= " AND (a.expires_at IS NULL OR a.expires_at > NOW())";
        $sql .= " ORDER BY a.published_at DESC, a.created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count announcements
     */
    public function count(?string $targetRole = null, ?bool $isPublished = null): int
    {
        $sql = "SELECT COUNT(*) FROM announcements WHERE 1=1";
        $params = [];

        if ($targetRole !== null) {
            $sql .= " AND target_role = :target_role";
            $params['target_role'] = $targetRole;
        }

        if ($isPublished !== null) {
            $sql .= " AND is_published = :is_published";
            $params['is_published'] = $isPublished ? 1 : 0;
        }

        $sql .= " AND (expires_at IS NULL OR expires_at > NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Find announcement by ID
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                a.*,
                u.first_name as author_first_name,
                u.last_name as author_last_name
            FROM announcements a
            LEFT JOIN users u ON a.author_id = u.user_id
            WHERE a.announcement_id = :id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Find announcement by UUID
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

        $stmt = $this->db->prepare("
            SELECT 
                a.*,
                u.first_name as author_first_name,
                u.last_name as author_last_name
            FROM announcements a
            LEFT JOIN users u ON a.author_id = u.user_id
            WHERE a.uuid = :uuid
        ");

        $stmt->execute(['uuid' => $uuid]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Create a new announcement
     */
    public function create(array $data): int
    {
        // Auto-generate UUID if not provided
        if (!isset($data['uuid'])) {
            $data['uuid'] = UuidHelper::generate();
        }

        $stmt = $this->db->prepare("
            INSERT INTO announcements (
                uuid,
                title,
                content,
                author_id,
                target_role,
                is_published,
                published_at,
                expires_at
            ) VALUES (
                :uuid,
                :title,
                :content,
                :author_id,
                :target_role,
                :is_published,
                :published_at,
                :expires_at
            )
        ");

        $stmt->execute([
            'uuid' => $data['uuid'],
            'title' => $data['title'],
            'content' => $data['content'] ?? null,
            'author_id' => $data['author_id'],
            'target_role' => $data['target_role'] ?? 'all',
            'is_published' => $data['is_published'] ?? 0,
            'published_at' => $data['published_at'] ?? null,
            'expires_at' => $data['expires_at'] ?? null
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Update an announcement
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        $allowedFields = ['title', 'content', 'target_role', 'is_published', 'published_at', 'expires_at'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE announcements SET " . implode(', ', $fields) . " WHERE announcement_id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Delete an announcement
     */
    /**
     * Get recent published announcements visible to students (target_role = 'student', 'all', or NULL).
     */
    public function getRecentForStudent(int $limit = 5): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    a.title,
                    a.content,
                    a.published_at,
                    CONCAT(u.first_name, ' ', u.last_name) AS author_name
                FROM announcements a
                LEFT JOIN users u ON a.author_id = u.user_id
                WHERE a.is_published = 1
                  AND (a.target_role = 'student' OR a.target_role = 'all' OR a.target_role IS NULL)
                  AND (a.expires_at IS NULL OR a.expires_at > NOW())
                ORDER BY a.published_at DESC, a.created_at DESC
                LIMIT :lim
            ");
            $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Student Announcements Error: " . $e->getMessage());
            return [];
        }
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM announcements WHERE announcement_id = :id");
        return $stmt->execute(['id' => $id]);
    }
}
