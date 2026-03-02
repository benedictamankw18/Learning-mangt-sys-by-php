<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class SystemSettingsRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getSettings(): array
    {
        try {
            $stmt = $this->db->query("SELECT settings, updated_at FROM system_settings ORDER BY settings_id DESC LIMIT 1");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return [];
            }
            $data = json_decode($row['settings'], true) ?: [];
            // expose the last-updated timestamp alongside settings
            $data['updated_at'] = isset($row['updated_at']) ? $row['updated_at'] : null;
            return $data;
        } catch (\PDOException $e) {
            error_log('Get system settings error: ' . $e->getMessage());
            return [];
        }
    }

    public function saveSettings(array $settings): bool
    {
        try {
            $json = json_encode($settings, JSON_UNESCAPED_UNICODE);
            // Prefer updating the latest row to keep a single canonical settings row.
            $this->db->beginTransaction();
            $stmt = $this->db->query("SELECT settings_id FROM system_settings ORDER BY settings_id DESC LIMIT 1 FOR UPDATE");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && isset($row['settings_id'])) {
                $update = $this->db->prepare("UPDATE system_settings SET settings = :settings, updated_at = NOW() WHERE settings_id = :id");
                $res = $update->execute(['settings' => $json, 'id' => $row['settings_id']]);
            } else {
                $insert = $this->db->prepare("INSERT INTO system_settings (settings) VALUES (:settings)");
                $res = $insert->execute(['settings' => $json]);
            }
            $this->db->commit();
            return (bool) $res;
        } catch (\PDOException $e) {
            try {
                $this->db->rollBack();
            } catch (\Throwable $ex) {
            }
            error_log('Save system settings error: ' . $e->getMessage());
            return false;
        }
    }
}
