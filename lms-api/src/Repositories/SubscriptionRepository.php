<?php

namespace App\Repositories;

use PDO;

class SubscriptionRepository extends BaseRepository
{
    protected $table = 'institution_settings';

    /**
     * Get all subscriptions (from institution_settings)
     * Note: Subscription data stored in institution_settings JSON fields
     */
    public function getAll($filters = [], $limit = 50, $offset = 0)
    {
        $sql = "SELECT i.id as institution_id, i.name as institution_name, 
                is.subscription_plan, is.subscription_status, 
                is.subscription_start_date, is.subscription_end_date,
                is.subscription_amount, is.max_students, is.max_teachers,
                is.created_at, is.updated_at
                FROM institutions i
                LEFT JOIN {$this->table} is ON i.id = is.institution_id
                WHERE 1=1";
        $params = [];

        if (!empty($filters['institution_id'])) {
            $sql .= " AND i.id = :institution_id";
            $params[':institution_id'] = $filters['institution_id'];
        }

        if (!empty($filters['status'])) {
            $sql .= " AND is.subscription_status = :status";
            $params[':status'] = $filters['status'];
        }

        $sql .= " ORDER BY is.subscription_end_date DESC LIMIT :limit OFFSET :offset";
        $params[':limit'] = (int)$limit;
        $params[':offset'] = (int)$offset;

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

    public function count($filters = [])
    {
        $sql = "SELECT COUNT(*) as total 
                FROM institutions i
                LEFT JOIN {$this->table} is ON i.id = is.institution_id
                WHERE 1=1";
        $params = [];

        if (!empty($filters['institution_id'])) {
            $sql .= " AND i.id = :institution_id";
            $params[':institution_id'] = $filters['institution_id'];
        }

        if (!empty($filters['status'])) {
            $sql .= " AND is.subscription_status = :status";
            $params[':status'] = $filters['status'];
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public function findById($id)
    {
        $sql = "SELECT i.id as institution_id, i.name as institution_name, 
                is.*, is.id as settings_id
                FROM {$this->table} is
                LEFT JOIN institutions i ON is.institution_id = i.id
                WHERE is.institution_id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        // Update institution settings with subscription data
        $sql = "INSERT INTO {$this->table} 
                (institution_id, subscription_plan, subscription_status, subscription_start_date, 
                 subscription_end_date, subscription_amount, max_students, max_teachers, created_at)
                VALUES 
                (:institution_id, :plan_name, :status, :start_date, :end_date, :amount, 
                 :max_students, :max_teachers, NOW())
                ON DUPLICATE KEY UPDATE
                subscription_plan = VALUES(subscription_plan),
                subscription_status = VALUES(subscription_status),
                subscription_start_date = VALUES(subscription_start_date),
                subscription_end_date = VALUES(subscription_end_date),
                subscription_amount = VALUES(subscription_amount),
                max_students = VALUES(max_students),
                max_teachers = VALUES(max_teachers),
                updated_at = NOW()";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':institution_id' => $data['institution_id'],
            ':plan_name' => $data['plan_name'],
            ':status' => $data['status'] ?? 'active',
            ':start_date' => $data['start_date'],
            ':end_date' => $data['end_date'],
            ':amount' => $data['amount'],
            ':max_students' => $data['max_students'] ?? 1000,
            ':max_teachers' => $data['max_teachers'] ?? 100
        ]);

        return $data['institution_id'];
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = [':institution_id' => $id];

        if (isset($data['plan_name'])) {
            $fields[] = "subscription_plan = :plan_name";
            $params[':plan_name'] = $data['plan_name'];
        }

        if (isset($data['status'])) {
            $fields[] = "subscription_status = :status";
            $params[':status'] = $data['status'];
        }

        if (isset($data['start_date'])) {
            $fields[] = "subscription_start_date = :start_date";
            $params[':start_date'] = $data['start_date'];
        }

        if (isset($data['end_date'])) {
            $fields[] = "subscription_end_date = :end_date";
            $params[':end_date'] = $data['end_date'];
        }

        if (isset($data['amount'])) {
            $fields[] = "subscription_amount = :amount";
            $params[':amount'] = $data['amount'];
        }

        if (isset($data['max_students'])) {
            $fields[] = "max_students = :max_students";
            $params[':max_students'] = $data['max_students'];
        }

        if (isset($data['max_teachers'])) {
            $fields[] = "max_teachers = :max_teachers";
            $params[':max_teachers'] = $data['max_teachers'];
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
        $sql = "SELECT i.id as institution_id, i.name as institution_name, 
                is.*
                FROM {$this->table} is
                LEFT JOIN institutions i ON is.institution_id = i.id
                WHERE is.institution_id = :institution_id 
                AND is.subscription_status = 'active'
                AND is.subscription_end_date >= CURDATE()
                ORDER BY is.subscription_end_date DESC
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':institution_id' => $institutionId]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getStatistics()
    {
        $sql = "SELECT 
                COUNT(*) as total_subscriptions,
                SUM(CASE WHEN subscription_status = 'active' AND subscription_end_date >= CURDATE() THEN 1 ELSE 0 END) as active_subscriptions,
                SUM(CASE WHEN subscription_status = 'expired' OR subscription_end_date < CURDATE() THEN 1 ELSE 0 END) as expired_subscriptions,
                SUM(CASE WHEN subscription_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_subscriptions,
                SUM(subscription_amount) as total_revenue,
                AVG(subscription_amount) as average_amount
                FROM {$this->table}
                WHERE subscription_plan IS NOT NULL";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function checkStatus($institutionId)
    {
        $sql = "SELECT 
                subscription_status,
                subscription_end_date,
                DATEDIFF(subscription_end_date, CURDATE()) as days_remaining,
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
            // Update status to expired
            $this->update($institutionId, ['status' => 'expired']);

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
