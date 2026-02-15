<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class InstitutionRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all institutions with pagination
     * 
     * @param int $page
     * @param int $limit
     * @return array
     */
    public function getAll(int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT 
                    i.*,
                    (SELECT COUNT(*) FROM users WHERE institution_id = i.institution_id) as user_count,
                    (SELECT COUNT(*) FROM students WHERE institution_id = i.institution_id) as student_count,
                    (SELECT COUNT(*) FROM teachers WHERE institution_id = i.institution_id) as teacher_count
                FROM institutions i
                ORDER BY i.institution_name ASC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Institutions Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get total count of institutions
     * 
     * @return int
     */
    public function count(): int
    {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) as total FROM institutions");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Institutions Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Find institution by ID
     * 
     * @param int $id
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    i.*,
                    s.school_name,
                    s.motto,
                    s.description as institution_description,
                    s.logo_url,
                    s.theme_primary_color,
                    s.theme_secondary_color
                FROM institutions i
                LEFT JOIN institution_settings s ON i.institution_id = s.institution_id
                WHERE i.institution_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Institution Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Create a new institution
     * 
     * @param array $data
     * @return int|null
     */
    public function create(array $data): ?int
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO institutions (
                    institution_code, institution_name, institution_type, 
                    email, phone, address, city, state, country, 
                    postal_code, website, status, subscription_plan,
                    subscription_expires_at, max_students, max_teachers
                )
                VALUES (
                    :institution_code, :institution_name, :institution_type,
                    :email, :phone, :address, :city, :state, :country,
                    :postal_code, :website, :status, :subscription_plan,
                    :subscription_expires_at, :max_students, :max_teachers
                )
            ");

            $stmt->execute([
                'institution_code' => $data['institution_code'],
                'institution_name' => $data['institution_name'],
                'institution_type' => $data['institution_type'] ?? 'shs',
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null,
                'country' => $data['country'] ?? 'Ghana',
                'postal_code' => $data['postal_code'] ?? null,
                'website' => $data['website'] ?? null,
                'status' => $data['status'] ?? 'active',
                'subscription_plan' => $data['subscription_plan'] ?? 'free',
                'subscription_expires_at' => $data['subscription_expires_at'] ?? null,
                'max_students' => $data['max_students'] ?? 500,
                'max_teachers' => $data['max_teachers'] ?? 50
            ]);

            $institutionId = (int) $this->db->lastInsertId();

            // Create default institution settings
            $settingsStmt = $this->db->prepare("
                INSERT INTO institution_settings (
                    institution_id, school_name, timezone, 
                    academic_year_start_month, academic_year_end_month
                )
                VALUES (
                    :institution_id, :school_name, 'Africa/Accra', 9, 6
                )
            ");

            $settingsStmt->execute([
                'institution_id' => $institutionId,
                'school_name' => $data['institution_name']
            ]);

            $this->db->commit();
            return $institutionId;
        } catch (\PDOException $e) {
            $this->db->rollBack();
            error_log("Create Institution Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update an institution
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = [
                'institution_code',
                'institution_name',
                'institution_type',
                'email',
                'phone',
                'address',
                'city',
                'state',
                'country',
                'postal_code',
                'website',
                'status',
                'subscription_plan',
                'subscription_expires_at',
                'max_students',
                'max_teachers'
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

            $sql = "UPDATE institutions SET " . implode(', ', $updates) . " WHERE institution_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Institution Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete an institution
     * 
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM institutions WHERE institution_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Institution Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get institution statistics
     * 
     * @param int $id
     * @return array
     */
    public function getStatistics(int $id): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM users WHERE institution_id = :id1 AND is_active = 1) as total_users,
                    (SELECT COUNT(*) FROM students WHERE institution_id = :id2 AND status = 'active') as total_students,
                    (SELECT COUNT(*) FROM teachers t 
                     INNER JOIN users u ON t.user_id = u.user_id 
                     WHERE t.institution_id = :id3 AND u.is_active = 1) as total_teachers,
                    (SELECT COUNT(*) FROM programs WHERE institution_id = :id4 AND status = 'active') as total_programs,
                    (SELECT COUNT(*) FROM grade_levels WHERE institution_id = :id5 AND status = 'active') as total_grade_levels,
                    (SELECT COUNT(*) FROM classes WHERE institution_id = :id6 AND status = 'active') as total_classes,
                    (SELECT COUNT(*) FROM class_subjects WHERE institution_id = :id7 AND status = 'active') as total_class_subjects
            ");
            $stmt->execute([
                'id1' => $id,
                'id2' => $id,
                'id3' => $id,
                'id4' => $id,
                'id5' => $id,
                'id6' => $id,
                'id7' => $id
            ]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Institution Statistics Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get users for an institution
     * 
     * @param int $id
     * @param int $page
     * @param int $limit
     * @return array
     */
    public function getInstitutionUsers(int $id, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT 
                    u.user_id,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.is_active,
                    u.created_at,
                    GROUP_CONCAT(r.role_name) as roles
                FROM users u
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                WHERE u.institution_id = :id
                GROUP BY u.user_id
                ORDER BY u.created_at DESC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Institution Users Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count users for an institution
     * 
     * @param int $id
     * @return int
     */
    public function countInstitutionUsers(int $id): int
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM users WHERE institution_id = :id");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Institution Users Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get programs for an institution
     * 
     * @param int $id
     * @return array
     */
    public function getInstitutionPrograms(int $id): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    p.*,
                    (SELECT COUNT(*) FROM classes WHERE program_id = p.program_id) as class_count
                FROM programs p
                WHERE p.institution_id = :id
                ORDER BY p.program_name ASC
            ");
            $stmt->execute(['id' => $id]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Institution Programs Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get classes for an institution
     * 
     * @param int $id
     * @param int $page
     * @param int $limit
     * @return array
     */
    public function getInstitutionClasses(int $id, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    p.program_name,
                    p.program_code,
                    g.grade_level_name,
                    g.grade_level_code,
                    (SELECT COUNT(*) FROM students WHERE class_id = c.class_id) as student_count
                FROM classes c
                LEFT JOIN programs p ON c.program_id = p.program_id
                LEFT JOIN grade_levels g ON c.grade_level_id = g.grade_level_id
                WHERE c.institution_id = :id
                ORDER BY g.level_order ASC, p.program_name ASC, c.class_name ASC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Institution Classes Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count classes for an institution
     * 
     * @param int $id
     * @return int
     */
    public function countInstitutionClasses(int $id): int
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM classes WHERE institution_id = :id");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Institution Classes Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Update institution status
     * 
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function updateStatus(int $id, string $status): bool
    {
        try {
            $stmt = $this->db->prepare("UPDATE institutions SET status = :status WHERE institution_id = :id");
            return $stmt->execute([
                'id' => $id,
                'status' => $status
            ]);
        } catch (\PDOException $e) {
            error_log("Update Institution Status Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get institution settings
     * 
     * @param int $institutionId
     * @return array|null
     */
    public function getSettings(int $institutionId): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM institution_settings 
                WHERE institution_id = :institution_id
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Get Institution Settings Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update institution settings
     * 
     * @param int $institutionId
     * @param array $data
     * @return bool
     */
    public function updateSettings(int $institutionId, array $data): bool
    {
        try {
            $allowedFields = [
                'school_name',
                'motto',
                'description',
                'vision',
                'mission',
                'logo_url',
                'banner_url',
                'theme_primary_color',
                'theme_secondary_color',
                'timezone',
                'academic_year_start_month',
                'academic_year_end_month',
                'grading_system',
                'locale',
                'currency',
                'date_format',
                'time_format',
                'allow_parent_registration',
                'allow_student_self_enrollment',
                'require_email_verification',
                'custom_css',
                'custom_footer',
                'social_facebook',
                'social_twitter',
                'social_instagram',
                'social_linkedin'
            ];

            $updates = [];
            $params = ['institution_id' => $institutionId];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($updates)) {
                return false;
            }

            $sql = "UPDATE institution_settings SET " . implode(', ', $updates) . " WHERE institution_id = :institution_id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Institution Settings Error: " . $e->getMessage());
            return false;
        }
    }
}
