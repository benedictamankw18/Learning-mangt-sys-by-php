<?php

namespace App\Config;

class LoggerConfig
{
    /**
     * Log channel configuration
     * Maps channels to their retention days and other settings
     */
    public static function getChannelConfig()
    {
        return [
            'error' => [
                'name' => 'Error Log',
                'description' => 'Uncaught exceptions, database failures, critical errors',
                'retention_days' => 30,
                'enabled' => true,
            ],
            'access' => [
                'name' => 'Access Log',
                'description' => 'HTTP requests, response codes, response times (Apache CLF format)',
                'retention_days' => 30,
                'enabled' => true,
            ],
            'auth' => [
                'name' => 'Authentication Log',
                'description' => 'Login attempts, token validation failures, permission denials',
                'retention_days' => 30,
                'enabled' => true,
            ],
            'audit' => [
                'name' => 'Audit Log',
                'description' => 'High-value actions: users created, grades changed, announcements posted',
                'retention_days' => 90,
                'enabled' => true,
            ],
            'email' => [
                'name' => 'Email Log',
                'description' => 'Email sends, SMTP debug, delivery status',
                'retention_days' => 7,
                'enabled' => true,
            ],
            'debug' => [
                'name' => 'Debug Log',
                'description' => 'Query counts, request payloads, performance metrics (only if APP_DEBUG=true)',
                'retention_days' => 7,
                'enabled' => true,
            ],
        ];
    }

    /**
     * Get configuration for a specific channel
     */
    public static function getChannelInfo($channel)
    {
        $config = self::getChannelConfig();
        return $config[$channel] ?? null;
    }

    /**
     * Get retention days for a channel
     */
    public static function getRetentionDays($channel, $default = 30)
    {
        $config = self::getChannelInfo($channel);
        return $config['retention_days'] ?? $default;
    }

    /**
     * Check if channel is enabled
     */
    public static function isChannelEnabled($channel)
    {
        $config = self::getChannelInfo($channel);
        return $config['enabled'] ?? true;
    }

    /**
     * Get all available log levels
     */
    public static function getLogLevels()
    {
        return [
            'DEBUG' => 'Debug - Detailed diagnostic information',
            'INFO' => 'Info - General informational messages',
            'WARNING' => 'Warning - Warning messages for potentially harmful situations',
            'ERROR' => 'Error - Error messages for error events',
            'CRITICAL' => 'Critical - Critical error messages',
        ];
    }

    /**
     * Validate log level
     */
    public static function isValidLogLevel($level)
    {
        return in_array($level, array_keys(self::getLogLevels()));
    }

    /**
     * Get default configuration
     */
    public static function getDefaults()
    {
        return [
            'log_level' => getenv('LOG_LEVEL') ?: 'WARNING',
            'log_max_size' => (int)getenv('LOG_MAX_SIZE') ?: 10485760, // 10MB
            'log_backup_count' => (int)getenv('LOG_BACKUP_COUNT') ?: 5,
            'log_retention_days' => (int)getenv('LOG_RETENTION_DAYS') ?: 30,
            'app_debug' => getenv('APP_DEBUG') === 'true',
            'app_env' => getenv('APP_ENV') ?: 'production',
        ];
    }

    /**
     * Get formatted size string (bytes to human-readable)
     */
    public static function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    /**
     * Get all log file metadata
     */
    public static function getLogFileStats()
    {
        $logDir = dirname(__DIR__, 2) . '/logs';
        $stats = [];

        if (!is_dir($logDir)) {
            return $stats;
        }

        $files = glob($logDir . '/*.log*');

        foreach ($files as $file) {
            $fileName = basename($file);
            $stats[$fileName] = [
                'size' => filesize($file),
                'size_formatted' => self::formatBytes(filesize($file)),
                'modified' => filemtime($file),
                'modified_formatted' => date('Y-m-d H:i:s', filemtime($file)),
                'lines' => (int)shell_exec('find ' . escapeshellarg($file) . ' -type f -exec wc -l {} \; 2>/dev/null | awk \'{print $1}\'') ?: 0,
            ];
        }

        uasort($stats, function ($a, $b) {
            return $b['modified'] <=> $a['modified'];
        });

        return $stats;
    }
}
