<?php

namespace App\Utils;

use DateTime;

class Logger
{
    // Log channels
    public const CHANNEL_ERROR = 'error';
    public const CHANNEL_ACCESS = 'access';
    public const CHANNEL_AUTH = 'auth';
    public const CHANNEL_AUDIT = 'audit';
    public const CHANNEL_EMAIL = 'email';
    public const CHANNEL_DEBUG = 'debug';

    // Severity levels
    public const LEVEL_DEBUG = 'DEBUG';
    public const LEVEL_INFO = 'INFO';
    public const LEVEL_WARNING = 'WARNING';
    public const LEVEL_ERROR = 'ERROR';
    public const LEVEL_CRITICAL = 'CRITICAL';

    private $logDir;
    private $maxFileSize;
    private $backupCount;
    private $logLevel;
    private $requestId;
    private $userId;

    /**
     * Initialize logger with configuration
     */
    public function __construct()
    {
        $this->logDir = dirname(__DIR__, 2) . '/logs';
        $this->maxFileSize = (int)getenv('LOG_MAX_SIZE') ?: 10485760; // 10MB default
        $this->backupCount = (int)getenv('LOG_BACKUP_COUNT') ?: 5;
        $this->logLevel = getenv('LOG_LEVEL') ?: 'WARNING';
        $this->requestId = $this->getOrCreateRequestId();
        $this->userId = $this->getCurrentUserId();

        // Ensure logs directory exists
        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0755, true);
        }
    }

    /**
     * Log to a specific channel
     *
     * @param string $channel
     * @param string $level
     * @param string $message
     * @param array $context
     */
    public function log($channel, $level, $message, $context = [])
    {
        // Skip debug logs if APP_DEBUG is not true
        if ($channel === self::CHANNEL_DEBUG && getenv('APP_DEBUG') !== 'true') {
            return;
        }

        // Skip if severity level is below configured log level
        if (!$this->shouldLog($level)) {
            return;
        }

        $filePath = $this->logDir . '/' . $channel . '.log';
        $timestamp = (new DateTime())->format('Y-m-d H:i:s.u');

        // Build log entry
        $logEntry = $this->formatLogEntry($timestamp, $level, $message, $context);

        // Handle log rotation
        $this->rotateIfNeeded($filePath);

        // Write to file
        if (!is_writable($this->logDir)) {
            // Fallback to error_log if directory not writable
            error_log($logEntry);
            return;
        }

        file_put_contents($filePath, $logEntry . PHP_EOL, FILE_APPEND | LOCK_EX);
    }

    /**
     * Log error
     */
    public function error($message, $context = [])
    {
        $this->log(self::CHANNEL_ERROR, self::LEVEL_ERROR, $message, $context);
    }

    /**
     * Log access
     */
    public function access($message, $context = [])
    {
        $this->log(self::CHANNEL_ACCESS, self::LEVEL_INFO, $message, $context);
    }

    /**
     * Log authentication event
     */
    public function auth($message, $context = [])
    {
        $this->log(self::CHANNEL_AUTH, self::LEVEL_WARNING, $message, $context);
    }

    /**
     * Log audit event
     */
    public function audit($message, $context = [])
    {
        $this->log(self::CHANNEL_AUDIT, self::LEVEL_INFO, $message, $context);
    }

    /**
     * Log email event
     */
    public function email($message, $context = [])
    {
        $this->log(self::CHANNEL_EMAIL, self::LEVEL_INFO, $message, $context);
    }

    /**
     * Log debug information
     */
    public function debug($message, $context = [])
    {
        $this->log(self::CHANNEL_DEBUG, self::LEVEL_DEBUG, $message, $context);
    }

    /**
     * Log critical error
     */
    public function critical($message, $context = [])
    {
        $this->log(self::CHANNEL_ERROR, self::LEVEL_CRITICAL, $message, $context);
    }

    /**
     * Format log entry with timestamp, level, context, and message
     *
     * @param string $timestamp
     * @param string $level
     * @param string $message
     * @param array $context
     * @return string
     */
    private function formatLogEntry($timestamp, $level, $message, $context = [])
    {
        $parts = [
            $timestamp,
            '[' . $level . ']',
            'REQ:' . $this->requestId,
        ];

        if ($this->userId) {
            $parts[] = 'USER:' . $this->userId;
        }

        $parts[] = $message;

        if (!empty($context)) {
            $parts[] = json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        return implode(' | ', $parts);
    }

    /**
     * Check if log level should be logged based on configuration
     *
     * @param string $level
     * @return bool
     */
    private function shouldLog($level)
    {
        $levels = [
            self::LEVEL_DEBUG => 0,
            self::LEVEL_INFO => 1,
            self::LEVEL_WARNING => 2,
            self::LEVEL_ERROR => 3,
            self::LEVEL_CRITICAL => 4,
        ];

        $configLevel = $levels[$this->logLevel] ?? 2;
        $messageLevel = $levels[$level] ?? 2;

        return $messageLevel >= $configLevel;
    }

    /**
     * Rotate log file if it exceeds max size
     *
     * @param string $filePath
     */
    private function rotateIfNeeded($filePath)
    {
        if (!file_exists($filePath)) {
            return;
        }

        $fileSize = filesize($filePath);

        if ($fileSize >= $this->maxFileSize) {
            $this->rotateFile($filePath);
        }
    }

    /**
     * Rotate log file by renaming existing backups and archiving current file
     *
     * @param string $filePath
     */
    private function rotateFile($filePath)
    {
        // Shift existing backups: .5 -> .6, .4 -> .5, etc.
        for ($i = $this->backupCount; $i >= 1; $i--) {
            $oldFile = $filePath . '.' . $i;
            $newFile = $filePath . '.' . ($i + 1);

            if (file_exists($oldFile)) {
                if ($i >= $this->backupCount) {
                    // Delete oldest backup
                    unlink($oldFile);
                } else {
                    rename($oldFile, $newFile);
                }
            }
        }

        // Rename current file to .1
        if (file_exists($filePath)) {
            rename($filePath, $filePath . '.1');
        }
    }

    /**
     * Get or create request ID for tracking
     *
     * @return string
     */
    private function getOrCreateRequestId()
    {
        // Check for X-Request-ID header
        if (!empty($_SERVER['HTTP_X_REQUEST_ID'])) {
            return substr($_SERVER['HTTP_X_REQUEST_ID'], 0, 8); // Use first 8 chars
        }

        // Check for existing request ID in session
        if (!empty($_SERVER['REQUEST_ID'])) {
            return substr($_SERVER['REQUEST_ID'], 0, 8);
        }

        // Generate new UUID v4 (short form)
        $uuid = sprintf(
            '%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
        $_SERVER['REQUEST_ID'] = $uuid;

        return $uuid;
    }

    /**
     * Get current user ID from JWT token or session
     *
     * @return string|null
     */
    private function getCurrentUserId()
    {
        // Try to get from JWT token (via Authorization header)
        // Only available in web context (not CLI)
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (!empty($headers['Authorization'])) {
                $token = str_replace('Bearer ', '', $headers['Authorization']);
                try {
                    $jwtSecret = getenv('JWT_SECRET');
                    if ($jwtSecret) {
                        $decoded = \Firebase\JWT\JWT::decode(
                            $token,
                            new \Firebase\JWT\Key($jwtSecret, 'HS256')
                        );
                        return $decoded->user_id ?? $decoded->sub ?? null;
                    }
                } catch (\Exception $e) {
                    // Token invalid, continue
                }
            }
        }

        // Try to get from session
        if (!empty($_SESSION['user_id'])) {
            return $_SESSION['user_id'];
        }

        // Try to get from Authorization header in SERVER globals (alternative)
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
            try {
                $jwtSecret = getenv('JWT_SECRET');
                if ($jwtSecret) {
                    $decoded = \Firebase\JWT\JWT::decode(
                        $token,
                        new \Firebase\JWT\Key($jwtSecret, 'HS256')
                    );
                    return $decoded->user_id ?? $decoded->sub ?? null;
                }
            } catch (\Exception $e) {
                // Token invalid, continue
            }
        }

        return null;
    }

    /**
     * Get log directory path
     *
     * @return string
     */
    public function getLogDir()
    {
        return $this->logDir;
    }

    /**
     * Get all log files in directory
     *
     * @return array
     */
    public function getLogFiles()
    {
        $files = [];
        $logFiles = glob($this->logDir . '/*.log*');

        foreach ($logFiles as $file) {
            $files[] = [
                'name' => basename($file),
                'size' => filesize($file),
                'modified' => filemtime($file),
            ];
        }

        usort($files, function ($a, $b) {
            return $b['modified'] <=> $a['modified'];
        });

        return $files;
    }

    /**
     * Clean up old log files based on retention days per channel
     *
     * @param string $channel
     * @param int $retentionDays
     */
    public function cleanupOldLogs($channel = null, $retentionDays = 30)
    {
        $pattern = $channel ? $this->logDir . '/' . $channel . '.log*' : $this->logDir . '/*.log*';
        $cutoffTime = time() - ($retentionDays * 86400);

        $logFiles = glob($pattern);

        foreach ($logFiles as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
            }
        }
    }
}
