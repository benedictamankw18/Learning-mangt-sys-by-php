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
    private function normalizeRoleName(string $roleName): string
    {
        return str_replace(['_', '-', ' '], '', strtolower(trim($roleName)));
    }

    private function isAdminLikeRoleName(string $roleName): bool
    {
        $normalized = $this->normalizeRoleName($roleName);
        return strpos($normalized, 'admin') !== false && $normalized !== 'superadmin';
    }

    private function getNextAdminId(): int
    {
        $stmt = $this->db->query("SELECT COALESCE(MAX(admin_id), 0) + 1 AS next_id FROM admins");
        $next = (int) ($stmt->fetch(PDO::FETCH_ASSOC)['next_id'] ?? 1);
        return max(1, $next);
    }

    private function generateAdminEmployeeId(int $institutionId): string
    {
        $year = date('Y');
        $prefix = "A-{$year}-";

        $stmt = $this->db->prepare("
            SELECT employee_id
            FROM admins
            WHERE institution_id = :institution_id
              AND employee_id LIKE :prefix
            ORDER BY employee_id DESC
            LIMIT 1
        ");
        $stmt->execute([
            'institution_id' => $institutionId,
            'prefix' => $prefix . '%'
        ]);

        $last = (string) ($stmt->fetch(PDO::FETCH_ASSOC)['employee_id'] ?? '');
        $seq = 1;
        if ($last !== '') {
            $parts = explode('-', $last);
            $tail = end($parts);
            if (is_numeric($tail)) {
                $seq = ((int) $tail) + 1;
            }
        }

        return $prefix . str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
    }

    private function ensureAdminRecordForUser(int $userId): bool
    {
        try {
            $existsStmt = $this->db->prepare("SELECT admin_id FROM admins WHERE user_id = :user_id LIMIT 1");
            $existsStmt->execute(['user_id' => $userId]);
            if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
                return true;
            }

            $userStmt = $this->db->prepare("
                SELECT user_id, institution_id, email
                FROM users
                WHERE user_id = :user_id
                LIMIT 1
            ");
            $userStmt->execute(['user_id' => $userId]);
            $u = $userStmt->fetch(PDO::FETCH_ASSOC);

            if (!$u || empty($u['institution_id'])) {
                return false;
            }

            $institutionId = (int) $u['institution_id'];
            $adminId = $this->getNextAdminId();
            $employeeId = $this->generateAdminEmployeeId($institutionId);

            $insertStmt = $this->db->prepare("
                INSERT INTO admins (
                    admin_id, uuid, institution_id, user_id, employee_id,
                    department, hire_date, alternative_email, status
                ) VALUES (
                    :admin_id, :uuid, :institution_id, :user_id, :employee_id,
                    :department, :hire_date, :alternative_email, :status
                )
            ");

            return $insertStmt->execute([
                'admin_id' => $adminId,
                'uuid' => UuidHelper::generate(),
                'institution_id' => $institutionId,
                'user_id' => $userId,
                'employee_id' => $employeeId,
                'department' => 'Administration',
                'hire_date' => date('Y-m-d'),
                'alternative_email' => $u['email'] ?? null,
                'status' => 'active'
            ]);
        } catch (\PDOException $e) {
            error_log("Ensure Admin Record Error: " . $e->getMessage());
            return false;
        }
    }

    // ---------------------------------------------------------------
    // Teacher role helpers
    // ---------------------------------------------------------------

    private function isTeacherLikeRoleName(string $roleName): bool
    {
        $normalized = $this->normalizeRoleName($roleName);
        return strpos($normalized, 'teacher') !== false;
    }

    private function generateTeacherEmployeeId(int $institutionId): string
    {
        $year = date('Y');
        $prefix = "T-{$year}-";

        $stmt = $this->db->prepare("
            SELECT employee_id
            FROM teachers
            WHERE institution_id = :institution_id
              AND employee_id LIKE :prefix
            ORDER BY employee_id DESC
            LIMIT 1
        ");
        $stmt->execute([
            'institution_id' => $institutionId,
            'prefix' => $prefix . '%'
        ]);

        $last = (string) ($stmt->fetch(PDO::FETCH_ASSOC)['employee_id'] ?? '');
        $seq = 1;
        if ($last !== '') {
            $parts = explode('-', $last);
            $tail = end($parts);
            if (is_numeric($tail)) {
                $seq = ((int) $tail) + 1;
            }
        }

        return $prefix . str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
    }

    private function ensureTeacherRecordForUser(int $userId): bool
    {
        try {
            $existsStmt = $this->db->prepare("SELECT teacher_id FROM teachers WHERE user_id = :user_id LIMIT 1");
            $existsStmt->execute(['user_id' => $userId]);
            if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
                return true;
            }

            $userStmt = $this->db->prepare("
                SELECT user_id, institution_id, email
                FROM users
                WHERE user_id = :user_id
                LIMIT 1
            ");
            $userStmt->execute(['user_id' => $userId]);
            $u = $userStmt->fetch(PDO::FETCH_ASSOC);

            if (!$u || empty($u['institution_id'])) {
                return false;
            }

            $institutionId = (int) $u['institution_id'];
            $employeeId = $this->generateTeacherEmployeeId($institutionId);

            $insertStmt = $this->db->prepare("
                INSERT INTO teachers (
                    uuid, institution_id, user_id, employee_id,
                    hire_date, alternative_email
                ) VALUES (
                    :uuid, :institution_id, :user_id, :employee_id,
                    :hire_date, :alternative_email
                )
            ");

            return $insertStmt->execute([
                'uuid'              => UuidHelper::generate(),
                'institution_id'    => $institutionId,
                'user_id'           => $userId,
                'employee_id'       => $employeeId,
                'hire_date'         => date('Y-m-d'),
                'alternative_email' => $u['email'] ?? null,
            ]);
        } catch (\PDOException $e) {
            error_log("Ensure Teacher Record Error: " . $e->getMessage());
            return false;
        }
    }

    // ---------------------------------------------------------------
    // Parent role helpers
    // ---------------------------------------------------------------

    private function isParentLikeRoleName(string $roleName): bool
    {
        $normalized = $this->normalizeRoleName($roleName);
        return strpos($normalized, 'parent') !== false || strpos($normalized, 'guardian') !== false;
    }

    private function generateParentGuardianId(): string
    {
        $stmt = $this->db->query("
            SELECT guardian_id FROM parents
            WHERE guardian_id IS NOT NULL
              AND guardian_id LIKE 'GDN-%'
            ORDER BY guardian_id DESC
            LIMIT 1
        ");
        $last = (string) ($stmt->fetch(PDO::FETCH_ASSOC)['guardian_id'] ?? '');
        $seq = 1;
        if ($last !== '') {
            $parts = explode('-', $last);
            $tail = end($parts);
            if (is_numeric($tail)) {
                $seq = ((int) $tail) + 1;
            }
        }

        return 'GDN-' . str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }

    private function ensureParentRecordForUser(int $userId): bool
    {
        try {
            $existsStmt = $this->db->prepare("SELECT parent_id FROM parents WHERE user_id = :user_id LIMIT 1");
            $existsStmt->execute(['user_id' => $userId]);
            if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
                return true;
            }

            $userStmt = $this->db->prepare("
                SELECT user_id, institution_id
                FROM users
                WHERE user_id = :user_id
                LIMIT 1
            ");
            $userStmt->execute(['user_id' => $userId]);
            $u = $userStmt->fetch(PDO::FETCH_ASSOC);

            if (!$u || empty($u['institution_id'])) {
                return false;
            }

            $institutionId = (int) $u['institution_id'];
            $guardianId    = $this->generateParentGuardianId();

            $insertStmt = $this->db->prepare("
                INSERT INTO parents (institution_id, user_id, guardian_id)
                VALUES (:institution_id, :user_id, :guardian_id)
            ");

            return $insertStmt->execute([
                'institution_id' => $institutionId,
                'user_id'        => $userId,
                'guardian_id'    => $guardianId,
            ]);
        } catch (\PDOException $e) {
            error_log("Ensure Parent Record Error: " . $e->getMessage());
            return false;
        }
    }

    // ---------------------------------------------------------------
    // Student role helpers
    // ---------------------------------------------------------------

    private function isStudentLikeRoleName(string $roleName): bool
    {
        $normalized = $this->normalizeRoleName($roleName);
        return strpos($normalized, 'student') !== false || strpos($normalized, 'learner') !== false;
    }

    private function generateStudentIdNumber(int $institutionId): string
    {
        $year = date('Y');
        $prefix = "STU-{$year}-";

        $stmt = $this->db->prepare("
            SELECT student_id_number
            FROM students
            WHERE institution_id = :institution_id
              AND student_id_number LIKE :prefix
            ORDER BY student_id_number DESC
            LIMIT 1
        ");
        $stmt->execute([
            'institution_id' => $institutionId,
            'prefix' => $prefix . '%'
        ]);

        $last = (string) ($stmt->fetch(PDO::FETCH_ASSOC)['student_id_number'] ?? '');
        $seq = 1;
        if ($last !== '') {
            $parts = explode('-', $last);
            $tail = end($parts);
            if (is_numeric($tail)) {
                $seq = ((int) $tail) + 1;
            }
        }

        return $prefix . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    private function ensureStudentRecordForUser(int $userId): bool
    {
        try {
            $existsStmt = $this->db->prepare("SELECT student_id FROM students WHERE user_id = :user_id LIMIT 1");
            $existsStmt->execute(['user_id' => $userId]);
            if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
                return true;
            }

            $userStmt = $this->db->prepare("
                SELECT user_id, institution_id
                FROM users
                WHERE user_id = :user_id
                LIMIT 1
            ");
            $userStmt->execute(['user_id' => $userId]);
            $u = $userStmt->fetch(PDO::FETCH_ASSOC);

            if (!$u || empty($u['institution_id'])) {
                return false;
            }

            $institutionId    = (int) $u['institution_id'];
            $studentIdNumber  = $this->generateStudentIdNumber($institutionId);

            $insertStmt = $this->db->prepare("
                INSERT INTO students (
                    uuid, institution_id, user_id, student_id_number,
                    enrollment_date, status
                ) VALUES (
                    :uuid, :institution_id, :user_id, :student_id_number,
                    :enrollment_date, :status
                )
            ");

            return $insertStmt->execute([
                'uuid'            => UuidHelper::generate(),
                'institution_id'  => $institutionId,
                'user_id'         => $userId,
                'student_id_number' => $studentIdNumber,
                'enrollment_date' => date('Y-m-d'),
                'status'          => 'active',
            ]);
        } catch (\PDOException $e) {
            error_log("Ensure Student Record Error: " . $e->getMessage());
            return false;
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
                        GROUP_CONCAT(DISTINCT p.permission_name) as permissions,
                        COALESCE(t2.employee_id, a.employee_id) AS employee_id,
                        COALESCE(t2.alternative_email, a.alternative_email, s3.alternative_email) AS alternative_email,
                        COALESCE(t2.specialization, a.specialization) AS specialization,
                        COALESCE(t2.hire_date, a.hire_date) AS hire_date,
                        COALESCE(a.department, pro.program_name) as department,
                        COALESCE(t2.bio, a.bio) as bio,
                        COALESCE(t2.qualification, a.qualification) as qualification,
                        t2.years_of_experience,
                        t2.employment_end_date,
                        t2.uuid AS teacher_uuid,
                        s3.student_id,
                        s3.student_id_number,
                        s3.enrollment_date,
                        s3.parent_name,
                        s3.parent_phone,
                        s3.parent_email,
                        s3.emergency_contact,
                        s3.status AS student_status,
                        s3.uuid AS student_uuid,
                        cs.class_name,
                        cs.class_code,
                        ps.program_name AS student_program,
                        pr.parent_id,
                        pr.guardian_id,
                        pr.occupation,
                        pr.prefers_email_notifications,
                        pr.prefers_sms_notifications
                FROM users u
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
                LEFT JOIN institutions i on i.institution_id = u.institution_id
                LEFT JOIN permissions p ON rp.permission_id = p.permission_id
                LEFT JOIN teachers t2 ON t2.user_id = u.user_id
                LEFT JOIN admins a ON a.user_id = u.user_id
                LEFT JOIN programs pro ON pro.program_id = t2.program_id
                LEFT JOIN students s3 ON s3.user_id = u.user_id
                LEFT JOIN classes cs ON cs.class_id = s3.class_id
                LEFT JOIN programs ps ON ps.program_id = cs.program_id
                LEFT JOIN parents pr ON pr.user_id = u.user_id
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
     * Check if an email already exists.
     *
     * If institutionId is provided, scope the check to that institution to align
     * with the unique_email_institution constraint.
     */
    public function isEmailTaken(string $email, ?int $excludeUserId = null, ?int $institutionId = null): bool
    {
        try {
            $sql = "SELECT user_id FROM users WHERE email = :email";
            $params = ['email' => $email];
            if ($institutionId !== null) {
                $sql .= " AND institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
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
                WHERE LOWER(u.uuid) = :uuid AND u.deleted_at IS NULL
                GROUP BY u.user_id
            ");

            $stmt->execute(['uuid' => strtolower($uuid)]);
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

            // Separate role-specific fields from users table fields.
            // Admin fields (columns in the `admins` table)
            $adminTableFields   = ['employee_id', 'department', 'hire_date', 'qualification', 'specialization', 'bio', 'alternative_email'];
            // Teacher fields (columns in the `teachers` table)
            $teacherTableFields = ['employee_id', 'specialization', 'hire_date', 'qualification', 'years_of_experience', 'employment_end_date', 'bio', 'alternative_email'];
            // Student fields (columns in the `students` table, not in users)
            $studentTableFields = ['parent_name', 'parent_phone', 'parent_email', 'emergency_contact', 'alternative_email'];
            // Parent fields (columns in the `parents` table, not in users)
            $parentTableFields  = ['guardian_id', 'occupation', 'prefers_email_notifications', 'prefers_sms_notifications'];
            // Combined set — anything in either role table should NOT go to users
            $roleOnlyFields = array_unique(array_merge($adminTableFields, $teacherTableFields, $studentTableFields, $parentTableFields));

            $adminData   = [];
            $teacherData = [];
            $studentData = [];
            $parentData  = [];
            $userData    = [];
            foreach ($data as $key => $value) {
                if (in_array($key, $roleOnlyFields)) {
                    if (in_array($key, $adminTableFields))   $adminData[$key]   = $value;
                    if (in_array($key, $teacherTableFields)) $teacherData[$key] = $value;
                    if (in_array($key, $studentTableFields)) $studentData[$key] = $value;
                    if (in_array($key, $parentTableFields))  $parentData[$key]  = $value;
                } else {
                    $userData[$key] = $value;
                }
            }

            // Update users table
            $fields = [];
            $params = ['id' => $id];
            foreach ($userData as $key => $value) {
                if ($key !== 'user_id' && $key !== 'password' && $key !== 'role_id') {
                    $fields[] = "{$key} = :{$key}";
                    $params[$key] = $value;
                }
            }

            $userUpdated = true;
            if (!empty($fields)) {
                $sql  = "UPDATE users SET " . implode(', ', $fields) . " WHERE user_id = :id";
                $stmt = $this->db->prepare($sql);
                $userUpdated = $stmt->execute($params);
            }

            // Update admins table (silently no-ops if user is not an admin)
            if (!empty($adminData)) {
                $adminSets   = [];
                $adminParams = ['user_id' => $id];
                foreach ($adminData as $key => $value) {
                    $adminSets[]       = "{$key} = :{$key}";
                    $adminParams[$key] = $value;
                }
                $sql = "UPDATE admins SET " . implode(', ', $adminSets) . " WHERE user_id = :user_id";
                $this->db->prepare($sql)->execute($adminParams);
            }

            // Update teachers table (silently no-ops if user is not a teacher)
            if (!empty($teacherData)) {
                $teacherSets   = [];
                $teacherParams = ['user_id' => $id];
                foreach ($teacherData as $key => $value) {
                    $teacherSets[]       = "{$key} = :{$key}";
                    $teacherParams[$key] = $value;
                }
                $sql = "UPDATE teachers SET " . implode(', ', $teacherSets) . " WHERE user_id = :user_id";
                $this->db->prepare($sql)->execute($teacherParams);
            }

            // Update students table (silently no-ops if user is not a student)
            if (!empty($studentData)) {
                $studentSets   = [];
                $studentParams = ['user_id' => $id];
                foreach ($studentData as $key => $value) {
                    $studentSets[]       = "{$key} = :{$key}";
                    $studentParams[$key] = $value;
                }
                $sql = "UPDATE students SET " . implode(', ', $studentSets) . " WHERE user_id = :user_id";
                $this->db->prepare($sql)->execute($studentParams);
            }

            // Update parents table (silently no-ops if user is not a parent)
            if (!empty($parentData)) {
                $parentSets   = [];
                $parentParams = ['user_id' => $id];
                foreach ($parentData as $key => $value) {
                    $parentSets[]       = "{$key} = :{$key}";
                    $parentParams[$key] = $value;
                }
                $sql = "UPDATE parents SET " . implode(', ', $parentSets) . " WHERE user_id = :user_id";
                $this->db->prepare($sql)->execute($parentParams);
            }

            return $userUpdated || !empty($adminData) || !empty($teacherData) || !empty($studentData) || !empty($parentData);

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
                $this->db->beginTransaction();

                $deleteStmt = $this->db->prepare("DELETE FROM user_roles WHERE user_id = :user_id");
                $deleteStmt->execute(['user_id' => $userId]);

                $insertStmt = $this->db->prepare("
                    INSERT INTO user_roles (user_id, role_id)
                    VALUES (:user_id, :role_id)
                ");
                $assigned = $insertStmt->execute(['user_id' => $userId, 'role_id' => $roleId]);

                if (!$assigned) {
                    $this->db->rollBack();
                    return false;
                }

                $roleStmt = $this->db->prepare("SELECT role_name FROM roles WHERE role_id = :role_id LIMIT 1");
                $roleStmt->execute(['role_id' => $roleId]);
                $roleName = (string) ($roleStmt->fetch(PDO::FETCH_ASSOC)['role_name'] ?? '');

                if ($roleName !== '') {
                    if ($this->isAdminLikeRoleName($roleName)) {
                        if (!$this->ensureAdminRecordForUser($userId)) {
                            $this->db->rollBack();
                            return false;
                        }
                    } elseif ($this->isTeacherLikeRoleName($roleName)) {
                        if (!$this->ensureTeacherRecordForUser($userId)) {
                            $this->db->rollBack();
                            return false;
                        }
                    } elseif ($this->isParentLikeRoleName($roleName)) {
                        if (!$this->ensureParentRecordForUser($userId)) {
                            $this->db->rollBack();
                            return false;
                        }
                    } elseif ($this->isStudentLikeRoleName($roleName)) {
                        if (!$this->ensureStudentRecordForUser($userId)) {
                            $this->db->rollBack();
                            return false;
                        }
                    }
                }

                $this->db->commit();
                return true;
        } catch (\PDOException $e) {
                if ($this->db->inTransaction()) {
                    $this->db->rollBack();
                }
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
                    SELECT u.*, i.institution_name AS institution_name, GROUP_CONCAT(DISTINCT r.role_name) as roles,
                    MAX(CASE WHEN la.is_successful = 1 THEN la.login_time END) AS last_login
                FROM users u
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                LEFT JOIN institutions i on i.institution_id = u.institution_id
                LEFT JOIN login_activity la ON la.user_id = u.user_id
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
            SELECT u.*, i.institution_name AS institution_name, GROUP_CONCAT(DISTINCT r.role_name) as roles,
            MAX(CASE WHEN la.is_successful = 1 THEN la.login_time END) AS last_login\n
                            FROM users u\n                
                            INNER JOIN user_roles ur ON u.user_id = ur.user_id\n                
                            INNER JOIN roles r ON ur.role_id = r.role_id\n                
                            INNER JOIN institutions i ON i.institution_id = u.institution_id\n                
                            LEFT JOIN login_activity la ON la.user_id = u.user_id\n                
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

    /**
     * Get users by institution (paginated)
     */
    public function getByInstitution(int $institutionId, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $stmt = $this->db->prepare("\n                SELECT u.*, i.institution_name AS institution_name, GROUP_CONCAT(DISTINCT r.role_name) as roles,
                MAX(CASE WHEN la.is_successful = 1 THEN la.login_time END) AS last_login\n                FROM users u\n                LEFT JOIN user_roles ur ON u.user_id = ur.user_id\n                LEFT JOIN roles r ON ur.role_id = r.role_id\n                LEFT JOIN institutions i on i.institution_id = u.institution_id\n                LEFT JOIN login_activity la ON la.user_id = u.user_id\n                WHERE u.deleted_at IS NULL AND u.institution_id = :institution_id\n                GROUP BY u.user_id\n                ORDER BY u.created_at DESC\n                LIMIT :limit OFFSET :offset\n            ");

            $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
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
            error_log("Get Users By Institution Error: " . $e->getMessage());
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
    
    /**
     * Get users by role name with optional filters (paginated).
     * Supported filters: search, institution_id, is_active
     */
    public function getByRoleFiltered(string $roleName, int $page = 1, int $limit = 20, array $filters = []): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $where = [
                'u.deleted_at IS NULL',
                'LOWER(r.role_name) = :role_name'
            ];
            $params = ['role_name' => strtolower($roleName)];

            if (!empty($filters['search'])) {
                $where[] = '(LOWER(u.first_name) LIKE :search_first OR LOWER(u.last_name) LIKE :search_last OR LOWER(u.email) LIKE :search_email OR LOWER(u.username) LIKE :search_username)';
                $search = '%' . strtolower(trim((string) $filters['search'])) . '%';
                $params['search_first'] = $search;
                $params['search_last'] = $search;
                $params['search_email'] = $search;
                $params['search_username'] = $search;
            }

            if (isset($filters['institution_id']) && $filters['institution_id'] !== '') {
                $where[] = 'u.institution_id = :institution_id';
                $params['institution_id'] = (int) $filters['institution_id'];
            }

            if (isset($filters['is_active']) && $filters['is_active'] !== '') {
                $where[] = 'u.is_active = :is_active';
                $params['is_active'] = (int) $filters['is_active'];
            }

            $sql = "
                SELECT 
                    u.*, 
                    i.institution_name AS institution_name, 
                    GROUP_CONCAT(DISTINCT r.role_name) as roles,
                    MAX(CASE WHEN la.is_successful = 1 THEN la.login_time END) AS last_login
                FROM users u
                INNER JOIN user_roles ur ON u.user_id = ur.user_id
                INNER JOIN roles r ON ur.role_id = r.role_id
                LEFT JOIN institutions i ON i.institution_id = u.institution_id
                LEFT JOIN login_activity la ON la.user_id = u.user_id
                WHERE " . implode(' AND ', $where) . "
                GROUP BY u.user_id
                ORDER BY u.created_at DESC
                LIMIT :limit OFFSET :offset
            ";

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }
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
            error_log("Get Users By Role Filtered Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count users by role with optional filters.
     * Supported filters: search, institution_id, is_active
     */
    public function countByRoleFiltered(string $roleName, array $filters = []): int
    {
        try {
            $where = [
                'u.deleted_at IS NULL',
                'LOWER(r.role_name) = :role_name'
            ];
            $params = ['role_name' => strtolower($roleName)];

            if (!empty($filters['search'])) {
                $where[] = '(LOWER(u.first_name) LIKE :search_first OR LOWER(u.last_name) LIKE :search_last OR LOWER(u.email) LIKE :search_email OR LOWER(u.username) LIKE :search_username)';
                $search = '%' . strtolower(trim((string) $filters['search'])) . '%';
                $params['search_first'] = $search;
                $params['search_last'] = $search;
                $params['search_email'] = $search;
                $params['search_username'] = $search;
            }

            if (isset($filters['institution_id']) && $filters['institution_id'] !== '') {
                $where[] = 'u.institution_id = :institution_id';
                $params['institution_id'] = (int) $filters['institution_id'];
            }

            if (isset($filters['is_active']) && $filters['is_active'] !== '') {
                $where[] = 'u.is_active = :is_active';
                $params['is_active'] = (int) $filters['is_active'];
            }

            $sql = "
                SELECT COUNT(DISTINCT u.user_id)
                FROM users u
                INNER JOIN user_roles ur ON u.user_id = ur.user_id
                INNER JOIN roles r ON ur.role_id = r.role_id
                WHERE " . implode(' AND ', $where);

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }
            $stmt->execute();

            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Users By Role Filtered Error: " . $e->getMessage());
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

    public function getRoleById(int $roleId): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT role_id, role_name FROM roles WHERE role_id = :role_id");
            $stmt->execute(['role_id' => $roleId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Get Role By ID Error: " . $e->getMessage());
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