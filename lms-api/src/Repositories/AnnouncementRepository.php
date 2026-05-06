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
    public function getAll(int $page = 1, int $limit = 20, ?string $targetRole = null, ?bool $isPublished = null, ?int $institutionId = null, ?string $userRole = null, ?int $userId = null, ?string $studentClassName = null, ?string $studentClassCode = null, ?int $studentClassId = null): array
    {
        $offset = ($page - 1) * $limit;
        $viewerUserId = $userId ?? 0;

        $sql = "
            SELECT 
                a.*,
                u.first_name as author_first_name,
                u.last_name as author_last_name,
                COALESCE(ar.read_count, 0) AS read_count,
                CASE WHEN my_read.announcement_id IS NULL THEN 0 ELSE 1 END AS is_read
            FROM announcements a
            LEFT JOIN users u ON a.author_id = u.user_id
            LEFT JOIN (
                SELECT announcement_id, COUNT(*) AS read_count
                FROM announcement_reads
                GROUP BY announcement_id
            ) ar ON ar.announcement_id = a.announcement_id
            LEFT JOIN announcement_reads my_read
                ON my_read.announcement_id = a.announcement_id
               AND my_read.user_id = :viewer_user_id
            WHERE 1=1
        ";

        $params = ['viewer_user_id' => $viewerUserId];

        // Default audience filtering: allow announcements that are general (NULL/'all')
        // or specifically targeted to the user's role, or authored by the user.
        // Students can also see class announcements when the announcement content
        // class_audience list includes their class name or class code.
        if ($userRole !== null && $userId !== null) {
            $normalizedUserRole = strtolower((string) $userRole);
            $sql .= " AND (a.target_role IS NULL OR a.target_role = 'all' OR a.target_role = :user_role OR a.author_id = :user_id";
            if ($normalizedUserRole === 'student') {
                $classAudienceClause = $this->buildStudentClassAudienceClause($studentClassName, $studentClassCode, $studentClassId, 'a');
                if ($classAudienceClause !== '') {
                    $sql .= " OR (a.target_role = 'class' AND " . $classAudienceClause . ")";
                }
            }
            $sql .= ")";
            $params['user_role'] = $userRole;
            $params['user_id'] = $userId;
            if ($studentClassName !== null && trim($studentClassName) !== '') {
                $params['student_class_name'] = trim($studentClassName);
            }
            if ($studentClassCode !== null && trim($studentClassCode) !== '') {
                $params['student_class_code'] = trim($studentClassCode);
            }
            if ($studentClassId !== null && $studentClassId > 0) {
                $params['student_class_id'] = $studentClassId;
                $params['student_class_id_text'] = (string) $studentClassId;
            }
        } else {
            $sql .= " AND (a.target_role IS NULL OR a.target_role = 'all')";
        }

        if ($targetRole !== null) {
            $sql .= " AND a.target_role = :target_role";
            $params['target_role'] = $targetRole;
        }

        if ($isPublished !== null) {
            $sql .= " AND a.is_published = :is_published";
            $params['is_published'] = $isPublished ? 1 : 0;
        } else {
            // By default, show published announcements. However, allow authors to see their own drafts
            // when a user id is supplied (so a.author_id matches the viewer).
            if ($userId !== null) {
                $sql .= " AND (a.is_published = 1 OR a.author_id = :author_user_id)";
                // Use unique parameter name to avoid conflicts with audience filtering :user_id
                $params['author_user_id'] = $userId;
            } else {
                $sql .= " AND a.is_published = 1";
            }
        }

        if ($institutionId !== null) {
            $sql .= " AND a.institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        $sql .= " AND (a.expires_at IS NULL OR a.expires_at > NOW())";
        $sql .= " ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.created_at DESC LIMIT :limit OFFSET :offset";

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
    public function count(?string $targetRole = null, ?bool $isPublished = null, ?int $institutionId = null, ?string $userRole = null, ?int $userId = null, ?string $studentClassName = null, ?string $studentClassCode = null, ?int $studentClassId = null): int
    {
        $sql = "SELECT COUNT(*) FROM announcements a WHERE 1=1";
        $params = [];

        if ($userRole !== null && $userId !== null) {
            $normalizedUserRole = strtolower((string) $userRole);
            $sql .= " AND (a.target_role IS NULL OR a.target_role = 'all' OR a.target_role = :user_role OR a.author_id = :user_id";
            if ($normalizedUserRole === 'student') {
                $classAudienceClause = $this->buildStudentClassAudienceClause($studentClassName, $studentClassCode, $studentClassId, 'a');
                if ($classAudienceClause !== '') {
                    $sql .= " OR (a.target_role = 'class' AND " . $classAudienceClause . ")";
                }
            }
            $sql .= ")";
            $params['user_role'] = $userRole;
            $params['user_id'] = $userId;
            if ($studentClassName !== null && trim($studentClassName) !== '') {
                $params['student_class_name'] = trim($studentClassName);
            }
            if ($studentClassCode !== null && trim($studentClassCode) !== '') {
                $params['student_class_code'] = trim($studentClassCode);
            }
            if ($studentClassId !== null && $studentClassId > 0) {
                $params['student_class_id'] = $studentClassId;
                $params['student_class_id_text'] = (string) $studentClassId;
            }
        } else {
            $sql .= " AND (a.target_role IS NULL OR a.target_role = 'all')";
        }

        if ($targetRole !== null) {
            $sql .= " AND a.target_role = :target_role";
            $params['target_role'] = $targetRole;
        }

        if ($isPublished !== null) {
            $sql .= " AND a.is_published = :is_published";
            $params['is_published'] = $isPublished ? 1 : 0;
        } else {
            if ($userId !== null) {
                $sql .= " AND (a.is_published = 1 OR a.author_id = :author_user_id)";
                $params['author_user_id'] = $userId;
            } else {
                $sql .= " AND a.is_published = 1";
            }
        }

        if ($institutionId !== null) {
            $sql .= " AND a.institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        $sql .= " AND (a.expires_at IS NULL OR a.expires_at > NOW())";

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
                u.last_name as author_last_name,
                COALESCE(ar.read_count, 0) AS read_count
            FROM announcements a
            LEFT JOIN users u ON a.author_id = u.user_id
            LEFT JOIN (
                SELECT announcement_id, COUNT(*) AS read_count
                FROM announcement_reads
                GROUP BY announcement_id
            ) ar ON ar.announcement_id = a.announcement_id
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
    public function findByUuid(string $uuid, ?int $institutionId = null, ?string $userRole = null, ?int $userId = null, ?string $studentClassName = null, ?string $studentClassCode = null, ?int $studentClassId = null): ?array
    {
        // Validate UUID format
        if (!UuidHelper::isValid($uuid)) {
            return null;
        }

        $viewerUserId = $userId ?? 0;
        $sql = "SELECT 
                a.*,
                u.first_name as author_first_name,
                u.last_name as author_last_name,
                COALESCE(ar.read_count, 0) AS read_count,
                CASE WHEN my_read.announcement_id IS NULL THEN 0 ELSE 1 END AS is_read
            FROM announcements a
            LEFT JOIN users u ON a.author_id = u.user_id
            LEFT JOIN (
                SELECT announcement_id, COUNT(*) AS read_count
                FROM announcement_reads
                GROUP BY announcement_id
            ) ar ON ar.announcement_id = a.announcement_id
            LEFT JOIN announcement_reads my_read
                ON my_read.announcement_id = a.announcement_id
               AND my_read.user_id = :viewer_user_id
            WHERE a.uuid = :uuid";

        $params = ['uuid' => $uuid, 'viewer_user_id' => $viewerUserId];
        if ($institutionId !== null) {
            $sql .= " AND a.institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        if ($userRole !== null && $userId !== null) {
            $normalizedUserRole = strtolower((string) $userRole);
            $sql .= " AND (a.target_role IS NULL OR a.target_role = 'all' OR a.target_role = :user_role OR a.author_id = :user_id";
            if ($normalizedUserRole === 'student') {
                $classAudienceClause = $this->buildStudentClassAudienceClause($studentClassName, $studentClassCode, $studentClassId, 'a');
                if ($classAudienceClause !== '') {
                    $sql .= " OR (a.target_role = 'class' AND " . $classAudienceClause . ")";
                }
            }
            $sql .= ")";
            $params['user_role'] = $userRole;
            $params['user_id'] = $userId;
            if ($studentClassName !== null && trim($studentClassName) !== '') {
                $params['student_class_name'] = trim($studentClassName);
            }
            if ($studentClassCode !== null && trim($studentClassCode) !== '') {
                $params['student_class_code'] = trim($studentClassCode);
            }
            if ($studentClassId !== null && $studentClassId > 0) {
                $params['student_class_id'] = $studentClassId;
                $params['student_class_id_text'] = (string) $studentClassId;
            }
        } else {
            $sql .= " AND (a.target_role IS NULL OR a.target_role = 'all')";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
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

        // Include institution_id if provided (default handled by DB)
        $stmt = $this->db->prepare("INSERT INTO announcements (
                uuid,
                title,
                content,
                author_id,
                institution_id,
                target_role,
                is_published,
                published_at,
                expires_at,
                attachments,
                priority,
                read_count
            ) VALUES (
                :uuid,
                :title,
                :content,
                :author_id,
                :institution_id,
                :target_role,
                :is_published,
                :published_at,
                :expires_at,
                :attachments,
                :priority,
                :read_count
            )
        ");

        $stmt->execute([
            'uuid' => $data['uuid'],
            'title' => $data['title'],
            'content' => $data['content'] ?? null,
            'author_id' => $data['author_id'],
            'institution_id' => $data['institution_id'] ?? 1,
            'target_role' => $data['target_role'] ?? 'all',
            'is_published' => $data['is_published'] ?? 0,
            'published_at' => $data['published_at'] ?? null,
            'expires_at' => $data['expires_at'] ?? null,
            'attachments' => isset($data['attachments']) ? json_encode($data['attachments']) : null,
            'priority' => $data['priority'] ?? 0,
            'read_count' => $data['read_count'] ?? 0
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Mark an announcement as read for a user.
     */
    public function markAsRead(int $announcementId, int $userId): bool
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT IGNORE INTO announcement_reads (
                    uuid,
                    announcement_id,
                    user_id,
                    read_at
                ) VALUES (
                    :uuid,
                    :announcement_id,
                    :user_id,
                    NOW()
                )
            ");
            $stmt->execute([
                'uuid' => UuidHelper::generate(),
                'announcement_id' => $announcementId,
                'user_id' => $userId,
            ]);

            $countStmt = $this->db->prepare("SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = :announcement_id");
            $countStmt->execute(['announcement_id' => $announcementId]);
            $readCount = (int) $countStmt->fetchColumn();

            $updateStmt = $this->db->prepare("UPDATE announcements SET read_count = :read_count WHERE announcement_id = :announcement_id");
            $updateStmt->execute([
                'read_count' => $readCount,
                'announcement_id' => $announcementId,
            ]);

            $this->db->commit();
            return true;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('AnnouncementRepository::markAsRead error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Update an announcement
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        $allowedFields = ['title', 'content', 'target_role', 'is_published', 'published_at', 'expires_at', 'attachments', 'priority', 'read_count'];

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
     * Append an attachment record to the announcements.attachments JSON column
     */
    public function addAttachment(int $id, array $attachment): bool
    {
        $announcement = $this->findById($id);
        if (!$announcement) {
            return false;
        }

        $current = [];
        if (!empty($announcement['attachments'])) {
            $decoded = json_decode($announcement['attachments'], true);
            if (is_array($decoded)) {
                $current = $decoded;
            }
        }

        $current[] = $attachment;

        $stmt = $this->db->prepare("UPDATE announcements SET attachments = :attachments WHERE announcement_id = :id");
        return $stmt->execute([
            'attachments' => json_encode($current),
            'id' => $id
        ]);
    }

    /**
     * Delete an announcement
     */
    /**
     * Get recent published announcements visible to students (target_role = 'student', 'all', or NULL).
     */
    public function getRecentForStudent(int $limit = 5, ?int $institutionId = null, ?string $userRole = null, ?int $userId = null, ?string $studentClassName = null, ?string $studentClassCode = null, ?int $studentClassId = null): array
    {
        try {
            $viewerUserId = $userId ?? 0;
            $sql = "
                SELECT
                    a.title,
                    a.content,
                    a.published_at,
                    CONCAT(u.first_name, ' ', u.last_name) AS author_name,
                    COALESCE(ar.read_count, 0) AS read_count,
                    CASE WHEN my_read.announcement_id IS NULL THEN 0 ELSE 1 END AS is_read
                FROM announcements a
                LEFT JOIN users u ON a.author_id = u.user_id
                LEFT JOIN (
                    SELECT announcement_id, COUNT(*) AS read_count
                    FROM announcement_reads
                    GROUP BY announcement_id
                ) ar ON ar.announcement_id = a.announcement_id
                LEFT JOIN announcement_reads my_read
                    ON my_read.announcement_id = a.announcement_id
                   AND my_read.user_id = :viewer_user_id
                WHERE a.is_published = 1
                  AND (a.expires_at IS NULL OR a.expires_at > NOW())
            ";

            $params = ['viewer_user_id' => $viewerUserId];
            if ($institutionId !== null) {
                $sql .= " AND a.institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }

            if ($userRole !== null && $userId !== null) {
                $normalizedUserRole = strtolower((string) $userRole);
                $sql .= " AND (a.target_role IS NULL OR a.target_role = 'all' OR a.target_role = :user_role OR a.author_id = :user_id";
                if ($normalizedUserRole === 'student') {
                    $classAudienceClause = $this->buildStudentClassAudienceClause($studentClassName, $studentClassCode, $studentClassId, 'a');
                    if ($classAudienceClause !== '') {
                        $sql .= " OR (a.target_role = 'class' AND " . $classAudienceClause . ")";
                    }
                }
                $sql .= ")";
                $params['user_role'] = $userRole;
                $params['user_id'] = $userId;
                if ($studentClassName !== null && trim($studentClassName) !== '') {
                    $params['student_class_name'] = trim($studentClassName);
                }
                if ($studentClassCode !== null && trim($studentClassCode) !== '') {
                    $params['student_class_code'] = trim($studentClassCode);
                }
                if ($studentClassId !== null && $studentClassId > 0) {
                    $params['student_class_id'] = $studentClassId;
                    $params['student_class_id_text'] = (string) $studentClassId;
                }
            } else {
                $sql .= " AND (a.target_role IS NULL OR a.target_role = 'all')";
            }

            $sql .= " ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.created_at DESC LIMIT :lim";

            $stmt = $this->db->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue(':' . $k, $v);
            }
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

    private function buildStudentClassAudienceClause(?string $studentClassName, ?string $studentClassCode, ?int $studentClassId, string $alias = 'a'): string
    {
        $checks = [];

        if ($studentClassName !== null && trim($studentClassName) !== '') {
            $checks[] = "JSON_CONTAINS(JSON_EXTRACT(SUBSTRING_INDEX(SUBSTRING({$alias}.content, LENGTH('__ANN_META__') + 1), '\\n', 1), '$.class_audience'), JSON_QUOTE(:student_class_name))";
        }

        if ($studentClassCode !== null && trim($studentClassCode) !== '' && trim($studentClassCode) !== trim((string) $studentClassName)) {
            $checks[] = "JSON_CONTAINS(JSON_EXTRACT(SUBSTRING_INDEX(SUBSTRING({$alias}.content, LENGTH('__ANN_META__') + 1), '\\n', 1), '$.class_audience'), JSON_QUOTE(:student_class_code))";
        }

        if ($studentClassId !== null && $studentClassId > 0) {
            $checks[] = "JSON_CONTAINS(JSON_EXTRACT(SUBSTRING_INDEX(SUBSTRING({$alias}.content, LENGTH('__ANN_META__') + 1), '\\n', 1), '$.class_audience'), CAST(:student_class_id AS JSON))";
            $checks[] = "JSON_CONTAINS(JSON_EXTRACT(SUBSTRING_INDEX(SUBSTRING({$alias}.content, LENGTH('__ANN_META__') + 1), '\\n', 1), '$.class_audience'), JSON_QUOTE(:student_class_id_text))";
        }

        if (!$checks) {
            return '';
        }

        return "LEFT({$alias}.content, LENGTH('__ANN_META__')) = '__ANN_META__' AND (" . implode(' OR ', $checks) . ")";
    }
}
