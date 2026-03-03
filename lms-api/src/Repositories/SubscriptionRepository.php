<?php

namespace App\Repositories;

use PDO;
use App\Utils\UuidHelper;

class SubscriptionRepository extends BaseRepository
{
    protected $table = 'institutions';

    /**
     * Get all subscriptions (from institutions table)
     * Note: Subscription data stored directly in institutions table
     */
    public function getAll(array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT i.institution_id, i.institution_name, i.institution_code,
                i.subscription_plan, i.status, i.subscription_expires_at,
                i.max_students, i.max_teachers, i.created_at, i.updated_at,
                CASE 
                    WHEN i.subscription_expires_at < CURDATE() THEN 'expired'
                    WHEN i.subscription_expires_at <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
                    WHEN i.status = 'active' THEN 'active'
                    ELSE 'inactive'
                END as subscription_status
                FROM {$this->table} i
                WHERE 1=1";
        $params = [];

        if (!empty($filters['institution_id'])) {
            $sql .= " AND i.institution_id = :institution_id";
            $params[':institution_id'] = $filters['institution_id'];
        }

        if (!empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $sql .= " AND i.status = 'active' AND i.subscription_expires_at >= CURDATE()";
            } elseif ($filters['status'] === 'expired') {
                $sql .= " AND i.subscription_expires_at < CURDATE()";
            } elseif ($filters['status'] === 'expiring_soon') {
                $sql .= " AND i.subscription_expires_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)";
            } else {
                $sql .= " AND i.status = :status";
                $params[':status'] = $filters['status'];
            }
        }

        $sql .= " ORDER BY i.subscription_expires_at DESC LIMIT :limit OFFSET :offset";
        $params[':limit'] = (int) $limit;
        $params[':offset'] = (int) $offset;

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function count(array $filters = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} i WHERE 1=1";
        $params = [];

        if (!empty($filters['institution_id'])) {
            $sql .= " AND i.institution_id = :institution_id";
            $params[':institution_id'] = $filters['institution_id'];
        }

        if (!empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $sql .= " AND i.status = 'active' AND i.subscription_expires_at >= CURDATE()";
            } elseif ($filters['status'] === 'expired') {
                $sql .= " AND i.subscription_expires_at < CURDATE()";
            } elseif ($filters['status'] === 'expiring_soon') {
                $sql .= " AND i.subscription_expires_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)";
            } else {
                $sql .= " AND i.status = :status";
                $params[':status'] = $filters['status'];
            }
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public function findById(int $id): ?array
    {
        $sql = "SELECT i.*,
                CASE 
                    WHEN i.subscription_expires_at < CURDATE() THEN 'expired'
                    WHEN i.subscription_expires_at <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
                    WHEN i.status = 'active' THEN 'active'
                    ELSE 'inactive'
                END as subscription_status
                FROM {$this->table} i
                WHERE i.institution_id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(array $data): int
    {
        // Auto-generate UUID if not provided
        if (!isset($data['uuid'])) {
            $data['uuid'] = UuidHelper::generate();
        }

        // Create new institution with subscription data
        $sql = "INSERT INTO {$this->table} 
                (uuid, institution_code, institution_name, institution_type, email, phone,
                 address, city, state, country, postal_code, website,
                 subscription_plan, subscription_expires_at, max_students, max_teachers, 
                 status, created_at)
                VALUES 
                (:uuid, :code, :name, :type, :email, :phone,
                 :address, :city, :state, :country, :postal_code, :website,
                 :plan, :expires_at, :max_students, :max_teachers,
                 :status, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':uuid' => $data['uuid'],
            ':code' => $data['institution_code'],
            ':name' => $data['institution_name'],
            ':type' => $data['institution_type'] ?? 'shs',
            ':email' => $data['email'] ?? null,
            ':phone' => $data['phone'] ?? null,
            ':address' => $data['address'] ?? null,
            ':city' => $data['city'] ?? null,
            ':state' => $data['state'] ?? null,
            ':country' => $data['country'] ?? 'Ghana',
            ':postal_code' => $data['postal_code'] ?? null,
            ':website' => $data['website'] ?? null,
            ':plan' => $data['subscription_plan'],
            ':expires_at' => $data['subscription_expires_at'],
            ':max_students' => $data['max_students'] ?? 500,
            ':max_teachers' => $data['max_teachers'] ?? 50,
            ':status' => $data['status'] ?? 'active'
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = [':institution_id' => $id];

        $allowedFields = [
            'institution_code' => ':code',
            'institution_name' => ':name',
            'institution_type' => ':type',
            'email' => ':email',
            'phone' => ':phone',
            'address' => ':address',
            'city' => ':city',
            'state' => ':state',
            'country' => ':country',
            'postal_code' => ':postal_code',
            'website' => ':website',
            'subscription_plan' => ':plan',
            'subscription_expires_at' => ':expires_at',
            'max_students' => ':max_students',
            'max_teachers' => ':max_teachers',
            'status' => ':status'
        ];

        foreach ($allowedFields as $field => $param) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = {$param}";
                $params[$param] = $data[$field];
            }
        }

        if (empty($fields)) {
            return true;
        }

        $fields[] = "updated_at = NOW()";
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE institution_id = :institution_id";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function getPlans()
    {
        // Return predefined subscription plans
        return [
            [
                'id' => 1,
                'name' => 'Basic',
                'amount' => 5000.00,
                'currency' => 'GHS',
                'duration' => '1 year',
                'max_students' => 500,
                'max_teachers' => 50,
                'features' => [
                    'Student Management',
                    'Teacher Management',
                    'Attendance Tracking',
                    'Grade Management',
                    'Reports',
                    'Parent Portal'
                ]
            ],
            [
                'id' => 2,
                'name' => 'Standard',
                'amount' => 10000.00,
                'currency' => 'GHS',
                'duration' => '1 year',
                'max_students' => 1000,
                'max_teachers' => 100,
                'features' => [
                    'All Basic Features',
                    'Advanced Analytics',
                    'SMS Notifications',
                    'Email Integration',
                    'Timetable Management',
                    'Library Management'
                ]
            ],
            [
                'id' => 3,
                'name' => 'Premium',
                'amount' => 20000.00,
                'currency' => 'GHS',
                'duration' => '1 year',
                'max_students' => 5000,
                'max_teachers' => 500,
                'features' => [
                    'All Standard Features',
                    'Unlimited Students/Teachers',
                    'API Access',
                    'Custom Branding',
                    'Priority Support',
                    'Mobile App Access',
                    'Advanced Security'
                ]
            ]
        ];
    }

    public function getActiveByInstitution($institutionId)
    {
        $sql = "SELECT i.*,
                CASE 
                    WHEN i.subscription_expires_at < CURDATE() THEN 'expired'
                    WHEN i.subscription_expires_at <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
                    WHEN i.status = 'active' THEN 'active'
                    ELSE 'inactive'
                END as subscription_status
                FROM {$this->table} i
                WHERE i.institution_id = :institution_id 
                AND i.status = 'active'
                AND i.subscription_expires_at >= CURDATE()
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':institution_id' => $institutionId]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getStatistics()
    {
        $sql = "SELECT 
                COUNT(*) as total_subscriptions,
                SUM(CASE WHEN status = 'active' AND subscription_expires_at >= CURDATE() THEN 1 ELSE 0 END) as active_subscriptions,
                SUM(CASE WHEN status = 'active' AND subscription_expires_at < CURDATE() THEN 1 ELSE 0 END) as expired_subscriptions,
                SUM(CASE WHEN status = 'inactive' OR status = 'suspended' THEN 1 ELSE 0 END) as inactive_subscriptions,
                SUM(CASE WHEN subscription_expires_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon
                FROM {$this->table}
                WHERE subscription_plan IS NOT NULL";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function checkStatus($institutionId)
    {
        $sql = "SELECT 
                status,
                subscription_plan,
                subscription_expires_at,
                DATEDIFF(subscription_expires_at, CURDATE()) as days_remaining,
                max_students,
                max_teachers
                FROM {$this->table}
                WHERE institution_id = :institution_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':institution_id' => $institutionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$result) {
            return [
                'status' => 'no_subscription',
                'message' => 'No subscription found',
                'days_remaining' => 0
            ];
        }

        $daysRemaining = $result['days_remaining'];

        if ($daysRemaining < 0) {
            // Update status to inactive/expired
            $this->update($institutionId, ['status' => 'inactive']);

            return [
                'status' => 'expired',
                'message' => 'Subscription has expired',
                'days_remaining' => 0,
                'expired_days_ago' => abs($daysRemaining)
            ];
        } elseif ($daysRemaining <= 30) {
            return [
                'status' => 'expiring_soon',
                'message' => "Subscription expiring in {$daysRemaining} days",
                'days_remaining' => $daysRemaining
            ];
        } else {
            return [
                'status' => 'active',
                'message' => 'Subscription is active',
                'days_remaining' => $daysRemaining
            ];
        }
    }
}
