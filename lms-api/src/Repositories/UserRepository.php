<?php

namespace App\Repositories;

use App\Config\Database;
use App\Utils\UuidHelper;
use PDO;

class UserRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(array $data): ?int
    {
        try {
            // Auto-generate UUID if not provided
            if (!isset($data['uuid'])) {
                $data['uuid'] = UuidHelper::generate();
            }

            $stmt = $this->db->prepare("
                INSERT INTO users (
                    uuid, institution_id, username, email, password_hash, 
                    first_name, last_name, phone_number, address, date_of_birth,
                    is_super_admin, is_active
                )
                VALUES (
                    :uuid, :institution_id, :username, :email, :password,
                    :first_name, :last_name, :phone_number, :address, :dob,
                    :is_super_admin, :is_active
                )
            ");

            $stmt->execute([
                'uuid' => $data['uuid'],
                'institution_id' => $data['institution_id'] ?? null,
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => password_hash($data['password'], PASSWORD_BCRYPT),
                'first_name' => $data['first_name'] ?? null,
                'last_name' => $data['last_name'] ?? null,
                'phone_number' => $data['phone_number'] ?? $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'dob' => $data['date_of_birth'] ?? null,
                'is_super_admin' => $data['is_super_admin'] ?? 0,
                'is_active' => $data['is_active'] ?? 1
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("User Create Error: " . $e->getMessage());
            return null;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                    SELECT 
                        u.*,
                        i.institution_name AS institution_name,
                        GROUP_CONCAT(DISTINCT r.role_name) as roles,
                        GROUP_CONCAT(DISTINCT p.permission_name) as permissions
                FROM users u
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
                LEFT JOIN institutions i on i.institution_id = u.institution_id
                LEFT JOIN permissions p ON rp.permission_id = p.permission_id
                WHERE u.user_id = :id AND u.deleted_at IS NULL
                GROUP BY u.user_id
            ");

            $stmt->execute(['id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $user['roles'] = $user['roles'] ? array_map('strtolower', explode(',', $user['roles'])) : [];
                $user['permissions'] = $user['permissions'] ? explode(',', $user['permissions']) : [];
                unset($user['password_hash']);
            }

            return $user ?: null;
        } catch (\PDOException $e) {
            error_log("User Find Error: " . $e->getMessage());
            return null;
        }
    }

    public function findByEmail(string $email): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email");
            $stmt->execute(['email' => $email]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("User Find By Email Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if a username already exists within an institution (respects unique_username_institution constraint).
     */
    public function isUsernameTaken(string $username, ?int $institutionId, ?int $excludeUserId = null): bool
    {
        try {
            $sql = "SELECT user_id FROM users WHERE username = :username";
            $params = ['username' => $username];
            if ($institutionId !== null) {
                $sql .= " AND institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            } else {
                $sql .= " AND institution_id IS NULL";
            }
            if ($excludeUserId !== null) {
                $sql .= " AND user_id != :exclude_id";
                $params['exclude_id'] = $excludeUserId;
            }
            $sql .= " LIMIT 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("isUsernameTaken Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if an email already exists (emails are globally unique).
     */
    public function isEmailTaken(string $email, ?int $excludeUserId = null): bool
    {
        try {
            $sql = "SELECT user_id FROM users WHERE email = :email";
            $params = ['email' => $email];
            if ($excludeUserId !== null) {
                $sql .= " AND user_id != :exclude_id";
                $params['exclude_id'] = $excludeUserId;
            }
            $sql .= " LIMIT 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("isEmailTaken Error: " . $e->getMessage());
            return false;
        }
    }

    public function findByUsername(string $username): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE username = :username");
            $stmt->execute(['username' => $username]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("User Find By Username Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Find user by UUID
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
            $stmt = $this->db->prepare("
                    SELECT 
                        u.*,
                        i.institution_name AS institution_name,
                        GROUP_CONCAT(DISTINCT r.role_name) as roles,
                        GROUP_CONCAT(DISTINCT p.permission_name) as permissions
                FROM users u
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
                LEFT JOIN institutions i on i.institution_id = u.institution_id
                LEFT JOIN permissions p ON rp.permission_id = p.permission_id
                WHERE u.uuid = :uuid AND u.deleted_at IS NULL
                GROUP BY u.user_id
            ");

            $stmt->execute(['uuid' => $uuid]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $user['roles'] = $user['roles'] ? array_map('strtolower', explode(',', $user['roles'])) : [];
                $user['permissions'] = $user['permissions'] ? explode(',', $user['permissions']) : [];
                unset($user['password_hash']);
            }

            return $user ?: null;
        } catch (\PDOException $e) {
            error_log("User Find By UUID Error: " . $e->getMessage());
            return null;
        }
    }

    public function getPasswordHash(int $userId): ?string
    {
        try {
            $stmt = $this->db->prepare("SELECT password_hash FROM users WHERE user_id = :id");
            $stmt->execute(['id' => $userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['password_hash'] : null;
        } catch (\PDOException $e) {
            error_log("User Get Password Hash Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            // Normalize column names
            if (isset($data['phone']) && !isset($data['phone_number'])) {
                $data['phone_number'] = $data['phone'];
                unset($data['phone']);
            }

            $fields = [];
            $params = ['id' => $id];

            foreach ($data as $key => $value) {
                if ($key !== 'user_id' && $key !== 'password') {
                    $fields[] = "{$key} = :{$key}";
                    $params[$key] = $value;
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE user_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("User Update Error: " . $e->getMessage());
            return false;
        }
    }

    public function updatePassword(int $id, string $newPassword): bool
    {
        try {
            $stmt = $this->db->prepare("UPDATE users SET password_hash = :password WHERE user_id = :id");
            return $stmt->execute([
                'id' => $id,
                'password' => password_hash($newPassword, PASSWORD_BCRYPT)
            ]);
        } catch (\PDOException $e) {
            error_log("Password Update Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("UPDATE users SET is_active = 0, deleted_at = NOW() WHERE user_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("User Delete Error: " . $e->getMessage());
            return false;
        }
    }

    public function assignRole(int $userId, int $roleId): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT IGNORE INTO user_roles (user_id, role_id)
                VALUES (:user_id, :role_id)
            ");
            return $stmt->execute(['user_id' => $userId, 'role_id' => $roleId]);
        } catch (\PDOException $e) {
            error_log("Assign Role Error: " . $e->getMessage());
            return false;
        }
    }

    public function removeRole(int $userId, int $roleId): bool
    {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM user_roles WHERE user_id = :user_id AND role_id = :role_id
            ");
            return $stmt->execute(['user_id' => $userId, 'role_id' => $roleId]);
        } catch (\PDOException $e) {
            error_log("Remove Role Error: " . $e->getMessage());
            return false;
        }
    }

    public function getAll(int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $stmt = $this->db->prepare("
                    SELECT u.*, i.institution_name AS institution_name, GROUP_CONCAT(r.role_name) as roles
                FROM users u
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                LEFT JOIN institutions i on i.institution_id = u.institution_id
                WHERE u.deleted_at IS NULL
                GROUP BY u.user_id
                ORDER BY u.created_at DESC
                LIMIT :limit OFFSET :offset
            ");

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($users as &$user) {
                $user['roles'] = $user['roles'] ? array_map('strtolower', explode(',', $user['roles'])) : [];
                unset($user['password_hash']);
            }

            return $users;
        } catch (\PDOException $e) {
            error_log("Get All Users Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get users filtered by role name (paginated)
     */
    public function getByRole(string $roleName, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $stmt = $this->db->prepare("\n                 
            SELECT u.*, i.institution_name AS institution_name, GROUP_CONCAT(r.role_name) as roles\n
                            FROM users u\n                
                            INNER JOIN user_roles ur ON u.user_id = ur.user_id\n                
                            INNER JOIN roles r ON ur.role_id = r.role_id\n                
                            INNER JOIN institutions i ON i.institution_id = u.institution_id\n                
                            WHERE u.deleted_at IS NULL AND r.role_name = :role_name\n                
                            GROUP BY u.user_id\n                
                            ORDER BY u.created_at DESC\n                
                            LIMIT :limit OFFSET :offset\n            
                            ");

            $stmt->bindValue(':role_name', $roleName);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($users as &$user) {
                $user['roles'] = $user['roles'] ? array_map('strtolower', explode(',', $user['roles'])) : [];
                unset($user['password_hash']);
            }

            return $users;
        } catch (\PDOException $e) {
            error_log("Get Users By Role Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(): int
    {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL");
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Users Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countActive(): int
    {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND is_active = 1");
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Active Users Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByInstitution(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM users WHERE institution_id = :institution_id AND deleted_at IS NULL");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Users By Institution Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count inactive (pending activation) users for an institution.
     * These are accounts with is_active = 0 that have not been soft-deleted.
     *
     * @param int $institutionId
     * @return int
     */
    public function countInactiveByInstitution(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*)
                FROM users
                WHERE institution_id = :institution_id
                  AND is_active      = 0
                  AND deleted_at     IS NULL
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Inactive Users Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByRole(string $roleName): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(DISTINCT u.user_id) 
                FROM users u
                INNER JOIN user_roles ur ON u.user_id = ur.user_id
                INNER JOIN roles r ON ur.role_id = r.role_id
                WHERE r.role_name = :role_name 
                AND u.deleted_at IS NULL
            ");
            $stmt->execute(['role_name' => $roleName]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Users By Role Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countCreatedThisMonth(): int
    {
        try {
            $stmt = $this->db->query("
                SELECT COUNT(*) 
                FROM users 
                WHERE YEAR(created_at) = YEAR(CURRENT_DATE()) 
                AND MONTH(created_at) = MONTH(CURRENT_DATE())
                AND deleted_at IS NULL
            ");
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Users Created This Month Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countCreatedLastMonth(): int
    {
        try {
            $stmt = $this->db->query("
                SELECT COUNT(*) 
                FROM users 
                WHERE YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                AND deleted_at IS NULL
            ");
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Users Created Last Month Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByRoleCreatedThisMonth(string $roleName): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(DISTINCT u.user_id) 
                FROM users u
                INNER JOIN user_roles ur ON u.user_id = ur.user_id
                INNER JOIN roles r ON ur.role_id = r.role_id
                WHERE r.role_name = :role_name 
                AND u.deleted_at IS NULL
                AND YEAR(u.created_at) = YEAR(CURRENT_DATE()) 
                AND MONTH(u.created_at) = MONTH(CURRENT_DATE())
            ");
            $stmt->execute(['role_name' => $roleName]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Users By Role This Month Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByRoleCreatedLastMonth(string $roleName): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(DISTINCT u.user_id) 
                FROM users u
                INNER JOIN user_roles ur ON u.user_id = ur.user_id
                INNER JOIN roles r ON ur.role_id = r.role_id
                WHERE r.role_name = :role_name 
                AND u.deleted_at IS NULL
                AND YEAR(u.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                AND MONTH(u.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
            ");
            $stmt->execute(['role_name' => $roleName]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Users By Role Last Month Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get monthly new-user counts for the last 12 months (rolling window).
     * Returns a 12-element array: index 0 = oldest month, index 11 = current month.
     * Spans two calendar years when needed (e.g. Apr 2025 – Mar 2026).
     *
     * @return array<int, int>
     */
    public function getMonthlyCountsThisYear(): array
    {
        try {
            $stmt = $this->db->query("
                SELECT 
                    YEAR(created_at)  AS year,
                    MONTH(created_at) AS month,
                    COUNT(*)          AS count
                FROM users
                WHERE created_at >= DATE_FORMAT(
                          DATE_SUB(CURRENT_DATE(), INTERVAL 11 MONTH), '%Y-%m-01'
                      )
                AND deleted_at IS NULL
                GROUP BY YEAR(created_at), MONTH(created_at)
                ORDER BY year, month
            ");

            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Build a year-month keyed map
            $map = [];
            foreach ($results as $row) {
                $key = $row['year'] . '-' . str_pad($row['month'], 2, '0', STR_PAD_LEFT);
                $map[$key] = (int) $row['count'];
            }

            // Produce an ordered 12-element array matching the frontend labels
            $counts = [];
            $now = new \DateTime();
            for ($i = 11; $i >= 0; $i--) {
                $d = (clone $now)->modify("-{$i} months");
                $counts[] = $map[$d->format('Y-m')] ?? 0;
            }

            return $counts; // index 0 = 11 months ago, index 11 = current month
        } catch (\PDOException $e) {
            error_log("Get Monthly Users Error: " . $e->getMessage());
            return array_fill(0, 12, 0);
        }
    }
    public function getRoleByName(string $roleName): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT role_id, role_name FROM roles WHERE role_name = :role_name");
            $stmt->execute(['role_name' => strtolower($roleName)]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Get Role By Name Error: " . $e->getMessage());
            return null;
        }
    }
    public function logActivity(int $userId, string $type, array $details): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO user_activity (user_id, activity_type, activity_details, ip_address)
                VALUES (:user_id, :type, :details, :ip)
            ");

            return $stmt->execute([
                'user_id' => $userId,
                'type' => $type,
                'details' => json_encode($details),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
            ]);
        } catch (\PDOException $e) {
            error_log("Log Activity Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create a password reset token for a user
     * 
     * @param int $userId
     * @param int $expiryMinutes Token expiration time in minutes (default: 60)
     * @return string|null The generated token or null on failure
     */
    public function createPasswordResetToken(int $userId, int $expiryMinutes = 60): ?string
    {
        try {
            // Deactivate any existing active tokens for this user
            $stmt = $this->db->prepare("
                UPDATE password_reset_tokens 
                SET is_active = 0 
                WHERE user_id = :user_id AND is_active = 1
            ");
            $stmt->execute(['user_id' => $userId]);

            // Generate a secure random token
            $token = bin2hex(random_bytes(32)); // 64-character hexadecimal token

            // Calculate expiry date
            $expiryDate = date('Y-m-d H:i:s', strtotime("+{$expiryMinutes} minutes"));

            // Insert new token
            $stmt = $this->db->prepare("
                INSERT INTO password_reset_tokens (user_id, token, expiry_date, is_active, ip_address, user_agent)
                VALUES (:user_id, :token, :expiry_date, 1, :ip_address, :user_agent)
            ");

            $result = $stmt->execute([
                'user_id' => $userId,
                'token' => $token,
                'expiry_date' => $expiryDate,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);

            return $result ? $token : null;
        } catch (\PDOException $e) {
            error_log("Create Password Reset Token Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Validate a password reset token
     * 
     * @param string $token
     * @return array|null User data if token is valid, null otherwise
     */
    public function validatePasswordResetToken(string $token): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT prt.*, u.user_id, u.email, u.username, u.first_name, u.last_name
                FROM password_reset_tokens prt
                INNER JOIN users u ON prt.user_id = u.user_id
                WHERE prt.token = :token 
                AND prt.is_active = 1 
                AND prt.expiry_date > NOW()
                AND prt.used_at IS NULL
            ");

            $stmt->execute(['token' => $token]);
            return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Validate Password Reset Token Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Mark a password reset token as used
     * 
     * @param string $token
     * @return bool
     */
    public function markTokenAsUsed(string $token): bool
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE password_reset_tokens 
                SET is_active = 0, used_at = NOW()
                WHERE token = :token
            ");

            return $stmt->execute(['token' => $token]);
        } catch (\PDOException $e) {
            error_log("Mark Token As Used Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Clean up expired password reset tokens
     * 
     * @return int Number of tokens deleted
     */
    public function cleanupExpiredTokens(): int
    {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM password_reset_tokens 
                WHERE expiry_date < NOW() OR (is_active = 0 AND used_at < DATE_SUB(NOW(), INTERVAL 30 DAY))
            ");

            $stmt->execute();
            return $stmt->rowCount();
        } catch (\PDOException $e) {
            error_log("Cleanup Expired Tokens Error: " . $e->getMessage());
            return 0;
        }
    }
}
