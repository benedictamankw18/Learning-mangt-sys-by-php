<?php

namespace App\Repositories;

use PDO;
use PDOException;
use App\Utils\UuidHelper;

abstract class BaseRepository
{
    protected $db;
    protected $table;
    protected $primaryKey = 'id'; // Default primary key, override in child classes if different

    public function __construct()
    {
        $this->connectDatabase();
    }

    private function connectDatabase(): void
    {
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $dbname = $_ENV['DB_NAME'] ?? 'lms_db';
        $username = $_ENV['DB_USER'] ?? 'root';
        $password = $_ENV['DB_PASS'] ?? '';

        try {
            $this->db = new PDO(
                "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
                $username,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new \Exception("Database connection failed");
        }
    }

    public function getAll(array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE 1=1";
        $params = [];

        foreach ($filters as $key => $value) {
            $sql .= " AND {$key} = :{$key}";
            $params[$key] = $value;
        }

        $sql .= " LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function count(array $filters = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE 1=1";
        $params = [];

        foreach ($filters as $key => $value) {
            $sql .= " AND {$key} = :{$key}";
            $params[$key] = $value;
        }

        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->execute();

        $result = $stmt->fetch();
        return (int) $result['total'];
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * Find a record by UUID
     * 
     * @param string $uuid UUID to search for
     * @return array|null Record data or null if not found
     */
    public function findByUuid(string $uuid): ?array
    {
        // Validate UUID format before querying
        if (!UuidHelper::isValid($uuid)) {
            return null;
        }

        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE uuid = :uuid LIMIT 1");
        $stmt->bindValue(':uuid', $uuid);
        $stmt->execute();

        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function create(array $data): int
    {
        // Auto-generate UUID if not provided
        if (!isset($data['uuid'])) {
            $data['uuid'] = UuidHelper::generate();
        }

        $fields = array_keys($data);
        $placeholders = array_map(fn($field) => ":{$field}", $fields);

        $sql = "INSERT INTO {$this->table} (" . implode(', ', $fields) . ") 
                VALUES (" . implode(', ', $placeholders) . ")";

        $stmt = $this->db->prepare($sql);

        foreach ($data as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->execute();

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        if (empty($data)) {
            return false;
        }

        $fields = [];
        foreach (array_keys($data) as $field) {
            $fields[] = "{$field} = :{$field}";
        }

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE {$this->primaryKey} = :id";

        $stmt = $this->db->prepare($sql);

        foreach ($data as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    protected function query(string $sql, array $params = []): array
    {
        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        return $stmt->fetchAll();
    }

    protected function execute(string $sql, array $params = []): bool
    {
        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        return $stmt->execute();
    }
}