# LMS Logging System Setup

This document describes the logging system for the LMS API, including log channels, configuration, usage, and maintenance.

## Overview

The logging system provides centralized file-based logging with the following features:

- **Multiple channels** for different types of events (error, access, auth, audit, email, debug)
- **Severity levels** (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- **Automatic log rotation** when files exceed 10MB
- **Per-channel retention policies** (automatic cleanup of old logs)
- **Structured logging** with timestamps, request IDs, user info, and context
- **Conditional debug logging** (only enabled when APP_DEBUG=true)

## Log Channels

### 1. Error Log (`logs/error.log`)

**Purpose**: Uncaught exceptions, database failures, critical errors  
**Retention**: 30 days  
**Default Severity**: ERROR and CRITICAL  
**Usage**:

```php
use App\Utils\Logger;

$logger = new Logger();
$logger->error('Database connection failed', [
    'host' => 'localhost',
    'error' => 'Connection timeout',
]);

// Or using helper function
log_error('Failed to send notification', [
    'notification_id' => 123,
    'error' => $e->getMessage(),
]);
```

### 2. Access Log (`logs/access.log`)

**Purpose**: HTTP requests, response codes, response times  
**Retention**: 30 days  
**Default Severity**: INFO  
**Usage**:

```php
$logger->access('POST /api/students retrieved', [
    'method' => 'GET',
    'endpoint' => '/api/students',
    'status_code' => 200,
    'response_time_ms' => 145,
]);

// Or using helper
log_access('GET /api/grades completed', [
    'endpoint' => '/api/grades',
    'filters_applied' => ['semester_id', 'class_id'],
]);
```

### 3. Authentication Log (`logs/auth.log`)

**Purpose**: Login attempts, token validation failures, permission denials  
**Retention**: 30 days  
**Default Severity**: WARNING  
**Security**: Review regularly for suspicious login patterns  
**Usage**:

```php
$logger->auth('Login failed: invalid credentials', [
    'username' => 'john@example.com',
    'ip_address' => $_SERVER['REMOTE_ADDR'],
    'attempt' => 3,
]);

log_auth('Token validation failed', [
    'token_type' => 'JWT',
    'error' => 'Signature verification failed',
]);

log_auth('Permission denied: insufficient privileges', [
    'required_role' => 'admin',
    'user_role' => 'teacher',
    'resource' => 'user_management',
]);
```

### 4. Audit Log (`logs/audit.log`)

**Purpose**: High-value actions (users created, grades changed, announcements posted)  
**Retention**: 90 days  
**Default Severity**: INFO  
**Compliance**: Preserve for compliance and forensic analysis  
**Usage**:

```php
$logger->audit('User account created', [
    'new_user_id' => 456,
    'role' => 'teacher',
    'institution_id' => 1,
]);

log_audit('Announcement published', [
    'announcement_id' => 789,
    'audience' => 'class:101',
    'recipient_count' => 45,
]);

log_audit('Grade submitted for assignment', [
    'assignment_id' => 234,
    'student_id' => 567,
    'grade' => 85,
]);
```

### 5. Email Log (`logs/email.log`)

**Purpose**: Email sends, SMTP debug, delivery status  
**Retention**: 7 days  
**Default Severity**: INFO  
**Security Note**: May contain sensitive information (recipient emails, SMTP details)  
**Usage**:

```php
$logger->email('Notification email sent', [
    'to' => 'student@example.com',
    'template' => 'grade_notification',
    'subject' => 'Your assignment grade is ready',
]);

log_email('SMTP connection established', [
    'smtp_server' => 'smtp.gmail.com:587',
    'auth_method' => 'TLS',
]);

log_email('Email delivery failed', [
    'to' => 'invalid@example.com',
    'error' => 'Invalid recipient address',
    'retry_count' => 3,
]);
```

### 6. Debug Log (`logs/debug.log`)

**Purpose**: Query counts, request payloads, performance metrics  
**Retention**: 7 days  
**Default Severity**: DEBUG  
**Status**: Disabled by default (only enabled when `APP_DEBUG=true`)  
**Usage**:

```php
// Only logs if APP_DEBUG=true
$logger->debug('Database query executed', [
    'query' => 'SELECT * FROM users WHERE role = ?',
    'bindings' => ['teacher'],
    'execution_time_ms' => 23,
]);

log_debug('Request payload received', [
    'endpoint' => '/api/assignments',
    'payload_size_bytes' => 2048,
    'content_type' => 'application/json',
]);
```

## Configuration

### Environment Variables

Set these in `.env`:

```env
# Log level: DEBUG, INFO, WARNING, ERROR, CRITICAL (default: WARNING)
LOG_LEVEL=WARNING

# Max log file size in bytes before rotation (default: 10485760 = 10MB)
LOG_MAX_SIZE=10485760

# Number of backup log files to keep (default: 5)
LOG_BACKUP_COUNT=5

# Default retention days for log files per channel
LOG_RETENTION_DAYS=30

# Enable debug logging
APP_DEBUG=true

# Environment
APP_ENV=development
```

### Per-Channel Retention

The system respects different retention periods per channel (configured in `src/Config/LoggerConfig.php`):

- **Error**: 30 days
- **Access**: 30 days
- **Auth**: 30 days
- **Audit**: 90 days (extended for compliance)
- **Email**: 7 days
- **Debug**: 7 days

## Usage Examples

### Using the Logger class directly

```php
use App\Utils\Logger;

$logger = new Logger();

// Log with automatic severity detection
$logger->error('Something went wrong', ['code' => 500]);
$logger->warning('High memory usage detected', ['memory_mb' => 512]);
$logger->info('Process completed successfully', ['items_processed' => 100]);

// Or specify custom severity
$logger->log('error', 'CRITICAL', 'System is offline', []);
```

### Using helper functions

```php
// Global helper functions - convenient for quick logging
log_error('Database error', ['query' => '...']);
log_access('API call completed', ['endpoint' => '/api/users']);
log_auth('Login attempted', ['user' => 'john@example.com']);
log_audit('User created', ['user_id' => 123]);
log_email('Email sent', ['to' => 'student@example.com']);
log_debug('Debug info', ['query_count' => 5]);
log_critical('Critical failure', ['error' => 'Out of memory']);
log_channel('error', 'Custom channel log', ['context' => 'data']);
```

### In Controller Methods

```php
namespace App\Controllers;

use App\Utils\Logger;

class UserController
{
    private $logger;

    public function __construct()
    {
        $this->logger = new Logger();
    }

    public function createUser($request)
    {
        try {
            // Create user...
            $this->logger->audit('User created', [
                'new_user_id' => $userId,
                'role' => $userData['role'],
            ]);
            return Response::success(['id' => $userId]);
        } catch (\Exception $e) {
            $this->logger->error('Failed to create user', [
                'error' => $e->getMessage(),
                'request_data' => $request->getBody(),
            ]);
            return Response::error('Failed to create user', 500);
        }
    }
}
```

### In Middleware

```php
namespace App\Middleware;

use App\Utils\Logger;

class AuthMiddleware
{
    private $logger;

    public function __construct()
    {
        $this->logger = new Logger();
    }

    public function handle()
    {
        try {
            // Validate token...
            $this->logger->auth('Authentication successful', [
                'token_type' => 'JWT',
            ]);
        } catch (\Exception $e) {
            $this->logger->auth('Authentication failed', [
                'error' => 'Invalid token',
                'reason' => $e->getMessage(),
            ]);
        }
    }
}
```

### In Repositories

```php
namespace App\Repositories;

use App\Utils\Logger;

class UserRepository
{
    private $logger;

    public function __construct()
    {
        $this->logger = new Logger();
    }

    public function find($id)
    {
        try {
            $result = $this->db->query('SELECT * FROM users WHERE id = ?', [$id]);
            $this->logger->debug('User query executed', [
                'user_id' => $id,
                'found' => $result !== null,
            ]);
            return $result;
        } catch (\Exception $e) {
            $this->logger->error('Database error in UserRepository::find', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
```

## Log Rotation

The logging system automatically rotates files when they exceed 10MB.

### How Rotation Works

1. Before writing a log entry, the system checks file size
2. If file exceeds `LOG_MAX_SIZE` (default 10MB):
   - Current file is renamed to `.1` (e.g., `error.log` → `error.log.1`)
   - Older backups are shifted (`.4` → `.5`, `.5` → `.6`, etc.)
   - Backups older than `LOG_BACKUP_COUNT` are deleted
3. New log entry is written to fresh file

### Example Rotation Sequence

With default settings (5 backups, 10MB max):

```
error.log          (current - active)
error.log.1        (1st backup - most recent)
error.log.2        (2nd backup)
error.log.3        (3rd backup)
error.log.4        (4th backup)
error.log.5        (5th backup - oldest kept)
error.log.6        (deleted - exceeds backup count)
```

### Customizing Rotation

Update `.env`:

```env
# Increase max file size to 50MB
LOG_MAX_SIZE=52428800

# Keep 10 backups instead of 5
LOG_BACKUP_COUNT=10

# Set custom retention: 60 days
LOG_RETENTION_DAYS=60
```

## Log File Format

Each log entry follows this format:

```
[TIMESTAMP] [LEVEL] | REQ:[request_id] | USER:[user_id] | MESSAGE | CONTEXT_JSON
```

### Example Log Entries

```
2026-05-19 14:23:45.123456 [ERROR] | REQ:a1b2c3d4 | USER:42 | Database connection failed | {"host":"localhost","error":"Connection timeout","code":2002}

2026-05-19 14:24:12.654321 [INFO] | REQ:e5f6g7h8 | USER:42 | GET /api/students completed | {"method":"GET","endpoint":"/api/students","status_code":200,"response_time_ms":145}

2026-05-19 14:25:30.987654 [WARNING] | REQ:i9j0k1l2 | | Login failed: invalid credentials | {"username":"john@example.com","ip_address":"192.168.1.100","attempt":3}

2026-05-19 14:26:01.345678 [INFO] | REQ:m3n4o5p6 | USER:15 | User account created | {"new_user_id":456,"role":"teacher","institution_id":1}
```

### Field Breakdown

- **TIMESTAMP**: `YYYY-MM-DD HH:MM:SS.ffffff` (microseconds)
- **LEVEL**: DEBUG, INFO, WARNING, ERROR, or CRITICAL
- **REQ**: Request ID (8-char UUID for request correlation)
- **USER**: User ID (optional, omitted for anonymous requests)
- **MESSAGE**: Human-readable log message
- **CONTEXT_JSON**: Additional structured data (JSON format)

## Verification

Run the verification script to test the logging system:

```bash
php scripts/verify_logs.php
```

This script checks:
- ✓ Logger class instantiation
- ✓ Log directory existence and permissions
- ✓ All 6 log files exist and are writable
- ✓ Correct file permissions (644 on files, 755 on directory)
- ✓ Environment variables loaded correctly
- ✓ Log entries format correctly
- ✓ Rotation logic works as expected
- ✓ Logger configuration is valid

Expected output:

```
════════════════════════════════════════════════════════════════
  LMS Logger System Verification
════════════════════════════════════════════════════════════════

[TEST 1] Logger Instantiation
✓ Logger class instantiates successfully
...
[TEST 8] Logger Configuration
  Log Level: WARNING
  Max File Size: 10 MB
  ...

════════════════════════════════════════════════════════════════
  VERIFICATION SUMMARY
════════════════════════════════════════════════════════════════
  Tests Run: 8
  Tests Passed: 8
  Tests Failed: 0
  Status: ✓ ALL TESTS PASSED
```

## Monitoring & Maintenance

### View Log File Stats

```php
use App\Config\LoggerConfig;

$stats = LoggerConfig::getLogFileStats();
foreach ($stats as $filename => $info) {
    echo $filename . ': ' . $info['size_formatted'] . ' (' . $info['lines'] . ' lines)' . "\n";
}
```

### Manual Cleanup

```php
use App\Utils\Logger;

$logger = new Logger();

// Clean up error logs older than 30 days
$logger->cleanupOldLogs('error', 30);

// Clean up all logs older than 60 days
$logger->cleanupOldLogs(null, 60);
```

### Reading Logs

Use standard Unix tools:

```bash
# View recent error logs
tail -f logs/error.log

# Search for specific user
grep "USER:42" logs/access.log

# Count entries by level
grep -c "\[ERROR\]" logs/error.log

# Extract just messages (remove timestamps and metadata)
grep -oP '(?<= \| )[^|]*$' logs/error.log

# Watch logs in real-time (all channels)
tail -f logs/*.log
```

## Future Enhancements

### Phase 2: Integration with Existing Code

Once the Logger utility is stable, integrate it into existing code:

1. **AuthMiddleware** → Replace `error_log()` with `$logger->auth()`
2. **Repositories** → Replace `error_log()` with `$logger->error()` or `$logger->debug()`
3. **Controllers** → Add audit logging for high-value actions
4. **Services** → Add email and notification logging
5. **index.php** → Wire global exception handler to Logger

### Phase 3: Advanced Features

- **Centralized log aggregation** (ELK Stack, Splunk)
- **JSON output format** for log aggregation tools
- **PSR-3 Logger interface** for library compatibility
- **Real-time log dashboard** in admin panel
- **Alert system** for critical errors
- **Log analysis reports** (errors by endpoint, slow queries, etc.)

## Troubleshooting

### Logs not being created

- Check that `logs/` directory exists and is writable: `chmod 755 logs/`
- Verify environment variables are loaded: Check `.env` file
- Run verification script: `php scripts/verify_logs.php`

### Debug logs not appearing

- Set `APP_DEBUG=true` in `.env`
- Restart PHP/web server for changes to take effect

### Log files growing too large

- Reduce `LOG_MAX_SIZE` to rotate more frequently
- Increase `LOG_BACKUP_COUNT` to keep more backups
- Reduce `LOG_RETENTION_DAYS` to delete old logs faster

### Permission denied errors

- Ensure web server user can write to `logs/` directory
- Run: `chmod 755 logs/` and `chmod 644 logs/*.log`
- Check web server process user: `ps aux | grep httpd` or `ps aux | grep php-fpm`

### High disk usage

- Check log file sizes: `du -sh logs/`
- Review retention settings for high-volume channels
- Consider archiving old logs instead of deleting

## Related Files

- **Logger class**: [src/Utils/Logger.php](../src/Utils/Logger.php)
- **Logger config**: [src/Config/LoggerConfig.php](../src/Config/LoggerConfig.php)
- **Helper functions**: [src/Utils/helpers.php](../src/Utils/helpers.php)
- **Environment variables**: [.env](.env)
- **Log files**: [logs/](../logs/)
- **Verification script**: [scripts/verify_logs.php](./verify_logs.php)

## Support

For issues or questions about the logging system:
1. Review this documentation
2. Run the verification script
3. Check existing log files for clues
4. Consult relevant controller or middleware that uses logging
