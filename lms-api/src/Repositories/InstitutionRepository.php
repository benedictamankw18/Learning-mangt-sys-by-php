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
    // public function getAll(int $page = 1, int $limit = 20): array
    // {
    //     try {
    //         $offset = ($page - 1) * $limit;

    public function getAll(int $page = 1, int $limit = 20, array $filters = []): array
    {
        try {
            $offset = ($page - 1) * $limit;
            // Build where clauses from filters
            $where = [];
            $params = [];

            if (!empty($filters['q'])) {
                // Use distinct parameter names for each occurrence to avoid PDO named-parameter duplication issues
                $where[] = "(i.institution_name LIKE :q1 OR i.institution_code LIKE :q2 OR i.email LIKE :q3)";
                $params[':q1'] = '%' . $filters['q'] . '%';
                $params[':q2'] = '%' . $filters['q'] . '%';
                $params[':q3'] = '%' . $filters['q'] . '%';
            }

            if (!empty($filters['status'])) {
                $where[] = "i.status = :status";
                $params[':status'] = $filters['status'];
            }

            if (!empty($filters['type'])) {
                $where[] = "i.institution_type = :type";
                $params[':type'] = $filters['type'];
            }

            // has_admin filter: 'yes' or 'no'
            $havingAdminFilter = null;
            if (isset($filters['has_admin'])) {
                if ($filters['has_admin'] === 'yes' || $filters['has_admin'] === '1')
                    $havingAdminFilter = '> 0';
                elseif ($filters['has_admin'] === 'no' || $filters['has_admin'] === '0')
                    $havingAdminFilter = '= 0';
            }

            $whereSql = '';
            if (!empty($where))
                $whereSql = 'WHERE ' . implode(' AND ', $where);

            // Select with admin_count and has_admin computed
            $sql = "SELECT 
                            i.*, 
                            (SELECT COUNT(*) FROM users WHERE institution_id = i.institution_id) as user_count,
                            (SELECT COUNT(*) FROM students WHERE institution_id = i.institution_id) as student_count,
                            (SELECT COUNT(*) FROM teachers WHERE institution_id = i.institution_id) as teacher_count,
                            (SELECT COUNT(DISTINCT u.user_id) FROM users u INNER JOIN user_roles ur ON ur.user_id = u.user_id INNER JOIN roles r ON r.role_id = ur.role_id AND r.role_name = 'admin' WHERE u.institution_id = i.institution_id) as admin_count,
                            (CASE WHEN ((SELECT COUNT(*) FROM users u2 INNER JOIN user_roles ur2 ON ur2.user_id = u2.user_id INNER JOIN roles r2 ON r2.role_id = ur2.role_id AND r2.role_name = 'admin' WHERE u2.institution_id = i.institution_id) ) > 0 THEN 1 ELSE 0 END) as has_admin
                        FROM institutions i ";

            // Wrap with where and optional having via outer select if has_admin filter used
            if ($havingAdminFilter !== null) {
                // Need to filter by admin_count - use outer select
                $sql = "SELECT * FROM (" . $sql . ") t " . $whereSql . " WHERE t.admin_count " . $havingAdminFilter . " ORDER BY t.institution_name ASC LIMIT :limit OFFSET :offset";
                $stmt = $this->db->prepare($sql);
            } else {
                $sql .= $whereSql . " ORDER BY i.institution_name ASC LIMIT :limit OFFSET :offset";
                $stmt = $this->db->prepare($sql);
            }

            // bind params
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
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
     * Return count for filtered institutions (same filters as getAll)
     */
    public function countFiltered(array $filters = []): int
    {
        try {
            $where = [];
            $params = [];

            if (!empty($filters['q'])) {
                // Distinct parameter names for count query as well
                $where[] = "(institution_name LIKE :q1 OR institution_code LIKE :q2 OR email LIKE :q3)";
                $params[':q1'] = '%' . $filters['q'] . '%';
                $params[':q2'] = '%' . $filters['q'] . '%';
                $params[':q3'] = '%' . $filters['q'] . '%';
            }

            if (!empty($filters['status'])) {
                $where[] = "status = :status";
                $params[':status'] = $filters['status'];
            }

            if (!empty($filters['type'])) {
                $where[] = "institution_type = :type";
                $params[':type'] = $filters['type'];
            }

            $havingAdminFilter = null;
            if (isset($filters['has_admin'])) {
                if ($filters['has_admin'] === 'yes' || $filters['has_admin'] === '1')
                    $havingAdminFilter = '> 0';
                elseif ($filters['has_admin'] === 'no' || $filters['has_admin'] === '0')
                    $havingAdminFilter = '= 0';
            }

            $whereSql = '';
            if (!empty($where))
                $whereSql = 'WHERE ' . implode(' AND ', $where);

            if ($havingAdminFilter !== null) {
                $sql = "SELECT COUNT(*) as total FROM (SELECT i.*, (SELECT COUNT(DISTINCT u.user_id) FROM users u INNER JOIN user_roles ur ON ur.user_id = u.user_id INNER JOIN roles r ON r.role_id = ur.role_id AND r.role_name = 'admin' WHERE u.institution_id = i.institution_id) as admin_count FROM institutions i " . $whereSql . ") t WHERE t.admin_count " . $havingAdminFilter;
                $stmt = $this->db->prepare($sql);
            } else {
                $sql = "SELECT COUNT(*) as total FROM institutions " . $whereSql;
                $stmt = $this->db->prepare($sql);
            }

            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }

            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Filtered Institutions Error: " . $e->getMessage());
            return 0;
        }
    }
    //         $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    //         $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    //         $stmt->execute();
    //         return $stmt->fetchAll(PDO::FETCH_ASSOC);
    //     } catch (\PDOException $e) {
    //         error_log("Get Institutions Error: " . $e->getMessage());
    //         return [];
    //     }
    // }

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
     * Get all institutions that have at least one admin user (with pagination)
     *
     * @param int $page
     * @param int $limit
     * @return array
     */
    public function getAllWithAdmins(int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("\n                SELECT 
                    i.*,
                    COUNT(DISTINCT u.user_id) as admin_count,
                    1 as has_admin
                FROM institutions i
                INNER JOIN users u ON u.institution_id = i.institution_id
                INNER JOIN user_roles ur ON ur.user_id = u.user_id
                INNER JOIN roles r ON r.role_id = ur.role_id AND r.role_name = 'admin'
                GROUP BY i.institution_id
                HAVING admin_count > 0
                ORDER BY i.institution_name ASC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Institutions With Admins Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count institutions that have at least one admin user
     *
     * @return int
     */
    public function countWithAdmins(): int
    {
        try {
            $stmt = $this->db->query("\n                SELECT COUNT(DISTINCT i.institution_id) as total
                FROM institutions i
                INNER JOIN users u ON u.institution_id = i.institution_id
                INNER JOIN user_roles ur ON ur.user_id = u.user_id
                INNER JOIN roles r ON r.role_id = ur.role_id AND r.role_name = 'admin'
            ");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Institutions With Admins Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get count of active institutions
     * 
     * @return int
     */
    public function countActive(): int
    {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) as total FROM institutions WHERE status = 'active'");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Active Institutions Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get recently created institutions
     * 
     * @param int $limit
     * @return array
     */
    public function getRecent(int $limit = 5): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    i.*,
                    (SELECT COUNT(*) FROM users WHERE institution_id = i.institution_id) as user_count
                FROM institutions i
                ORDER BY i.created_at DESC
                LIMIT :limit
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Recent Institutions Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count institutions created this month
     * 
     * @return int
     */
    public function countThisMonth(): int
    {
        try {
            $stmt = $this->db->query("
                SELECT COUNT(*) as total 
                FROM institutions 
                WHERE YEAR(created_at) = YEAR(CURRENT_DATE()) 
                AND MONTH(created_at) = MONTH(CURRENT_DATE())
            ");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Institutions This Month Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count institutions created last month
     * 
     * @return int
     */
    public function countLastMonth(): int
    {
        try {
            $stmt = $this->db->query("
                SELECT COUNT(*) as total 
                FROM institutions 
                WHERE YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
            ");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Institutions Last Month Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get monthly institution counts for the current year
     * 
     * @return array Array of counts indexed by month (1-12)
     */
    public function getMonthlyCountsThisYear(): array
    {
        try {
            $stmt = $this->db->query("
                SELECT 
                    MONTH(created_at) as month,
                    COUNT(*) as count
                FROM institutions
                WHERE YEAR(created_at) = YEAR(CURRENT_DATE())
                GROUP BY MONTH(created_at)
                ORDER BY month
            ");

            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Initialize all months with 0
            $monthlyCounts = array_fill(1, 12, 0);

            // Fill in actual counts
            foreach ($results as $row) {
                $monthlyCounts[(int) $row['month']] = (int) $row['count'];
            }

            // Calculate cumulative totals
            $cumulative = [];
            $total = 0;
            for ($i = 1; $i <= 12; $i++) {
                $total += $monthlyCounts[$i];
                $cumulative[$i] = $total;
            }

            return $cumulative;
        } catch (\PDOException $e) {
            error_log("Get Monthly Institutions Error: " . $e->getMessage());
            return array_fill(1, 12, 0);
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
     * Check whether an institution has at least one admin user
     *
     * @param int $id
     * @return bool
     */
    public function hasAdminUsers(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("\n                SELECT COUNT(*) as total
                FROM users u
                INNER JOIN user_roles ur ON ur.user_id = u.user_id
                INNER JOIN roles r ON r.role_id = ur.role_id AND r.role_name = 'admin'
                WHERE u.institution_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return ((int) $result['total']) > 0;
        } catch (\PDOException $e) {
            error_log("Has Admin Users Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Find institution by exact name (case-insensitive)
     *
     * @param string $name
     * @return array|null
     */
    public function findByName(string $name): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT institution_id, institution_name FROM institutions WHERE LOWER(institution_name) = LOWER(:name) LIMIT 1");
            $stmt->execute(['name' => $name]);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            return $res ?: null;
        } catch (\PDOException $e) {
            error_log('Find Institution By Name Error: ' . $e->getMessage());
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
                'max_teachers',
                '(SELECT COUNT(DISTINCT u.user_id)
                                FROM users u
                                INNER JOIN user_roles ur ON ur.user_id = u.user_id
                                INNER JOIN roles r ON r.role_id = ur.role_id AND r.role_name = \'admin\'
                                WHERE u.institution_id = i.institution_id) as admin_count,
                                (CASE WHEN (
                                    SELECT COUNT(*) FROM user_roles ur2
                                    INNER JOIN users u2 ON u2.user_id = ur2.user_id AND u2.institution_id = i.institution_id
                                    INNER JOIN roles r2 ON r2.role_id = ur2.role_id AND r2.role_name = \'admin\'
                                ) > 0 THEN 1 ELSE 0 END) as has_admin'
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
