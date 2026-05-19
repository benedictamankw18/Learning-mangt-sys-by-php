<?php

/**
 * Global helper functions for the LMS API
 */

use App\Utils\Logger;

/**
 * Log to a specific channel with convenience wrapper
 *
 * Example: log_channel('error', 'Database connection failed', ['error' => $e->getMessage()])
 *
 * @param string $channel Logger channel (error, access, auth, audit, email, debug)
 * @param string $message Log message
 * @param array $context Additional context data
 * @param string $level Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
 */
function log_channel($channel, $message, $context = [], $level = 'INFO')
{
    static $logger = null;

    if ($logger === null) {
        $logger = new Logger();
    }

    $logger->log($channel, $level, $message, $context);
}

/**
 * Log error convenience function
 *
 * Example: log_error('Failed to send email', ['user_id' => 123, 'error' => $e->getMessage()])
 *
 * @param string $message
 * @param array $context
 */
function log_error($message, $context = [])
{
    static $logger = null;
    if ($logger === null) {
        $logger = new Logger();
    }
    $logger->error($message, $context);
}

/**
 * Log access event
 *
 * @param string $message
 * @param array $context
 */
function log_access($message, $context = [])
{
    static $logger = null;
    if ($logger === null) {
        $logger = new Logger();
    }
    $logger->access($message, $context);
}

/**
 * Log authentication event
 *
 * @param string $message
 * @param array $context
 */
function log_auth($message, $context = [])
{
    static $logger = null;
    if ($logger === null) {
        $logger = new Logger();
    }
    $logger->auth($message, $context);
}

/**
 * Log audit event
 *
 * @param string $message
 * @param array $context
 */
function log_audit($message, $context = [])
{
    static $logger = null;
    if ($logger === null) {
        $logger = new Logger();
    }
    $logger->audit($message, $context);
}

/**
 * Log email event
 *
 * @param string $message
 * @param array $context
 */
function log_email($message, $context = [])
{
    static $logger = null;
    if ($logger === null) {
        $logger = new Logger();
    }
    $logger->email($message, $context);
}

/**
 * Log debug information
 *
 * @param string $message
 * @param array $context
 */
function log_debug($message, $context = [])
{
    static $logger = null;
    if ($logger === null) {
        $logger = new Logger();
    }
    $logger->debug($message, $context);
}

/**
 * Log critical error
 *
 * @param string $message
 * @param array $context
 */
function log_critical($message, $context = [])
{
    static $logger = null;
    if ($logger === null) {
        $logger = new Logger();
    }
    $logger->critical($message, $context);
}
