<?php

namespace App\Middleware;

use App\Utils\Response;
use App\Repositories\ErrorLogRepository;
use Exception;
use Throwable;

class ErrorHandler
{
    private ErrorLogRepository $errorLogRepo;

    public function __construct()
    {
        $this->errorLogRepo = new ErrorLogRepository();
    }

    /**
     * Register the error and exception handlers
     */
    public function register(): void
    {
        // Set custom error handler
        set_error_handler([$this, 'handleError']);

        // Set custom exception handler
        set_exception_handler([$this, 'handleException']);

        // Set shutdown handler to catch fatal errors
        register_shutdown_function([$this, 'handleShutdown']);
    }

    /**
     * Handle standard PHP errors
     */
    public function handleError(int $level, string $message, string $file = '', int $line = 0): bool
    {
        if (error_reporting() & $level) {
            throw new \ErrorException($message, 0, $level, $file, $line);
        }

        return true;
    }

    /**
     * Handle uncaught exceptions
     */
    public function handleException(Throwable $exception): void
    {
        // Log the error to database
        $this->logError($exception);

        // Return JSON error response
        http_response_code($this->getHttpStatusCode($exception));
        Response::error(
            $this->getErrorMessage($exception),
            $this->getHttpStatusCode($exception)
        );

        exit;
    }

    /**
     * Handle fatal errors during shutdown
     */
    public function handleShutdown(): void
    {
        $error = error_get_last();

        if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
            $exception = new \ErrorException(
                $error['message'],
                0,
                $error['type'],
                $error['file'],
                $error['line']
            );

            $this->handleException($exception);
        }
    }

    /**
     * Log error to database
     */
    private function logError(Throwable $exception): void
    {
        try {
            // Get current user info from session if available
            $userId = $_SESSION['user_id'] ?? null;

            // Determine severity level
            $severityLevel = $this->getSeverityLevel($exception);

            // Create error log record
            $this->errorLogRepo->create([
                'user_id' => $userId,
                'error_message' => $exception->getMessage(),
                'stack_trace' => $exception->getTraceAsString(),
                'source' => $exception->getFile() . ':' . $exception->getLine(),
                'severity_level' => $severityLevel,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'is_resolved' => 0
            ]);

            // Also log to file for debugging (optional)
            if (getenv('APP_ENV') === 'development' || getenv('APP_ENV') === 'local') {
                error_log(sprintf(
                    "[%s] %s in %s:%d\nStack trace:\n%s\nRequest: %s %s\nUser Agent: %s\n",
                    date('Y-m-d H:i:s'),
                    $exception->getMessage(),
                    $exception->getFile(),
                    $exception->getLine(),
                    $exception->getTraceAsString(),
                    $_SERVER['REQUEST_METHOD'] ?? 'N/A',
                    $_SERVER['REQUEST_URI'] ?? 'N/A',
                    $_SERVER['HTTP_USER_AGENT'] ?? 'N/A'
                ));
            }
        } catch (Exception $e) {
            // If logging fails, at least log to PHP error log
            error_log('Failed to log error to database: ' . $e->getMessage());
            error_log('Original error: ' . $exception->getMessage());
        }
    }

    /**
     * Determine severity level based on exception type
     */
    private function getSeverityLevel(Throwable $exception): string
    {
        $code = $exception->getCode();

        // For ErrorException, use the severity
        if ($exception instanceof \ErrorException) {
            $severity = $exception->getSeverity();

            if (in_array($severity, [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
                return 'critical';
            } elseif (in_array($severity, [E_WARNING, E_CORE_WARNING, E_COMPILE_WARNING])) {
                return 'warning';
            } elseif (in_array($severity, [E_NOTICE, E_USER_NOTICE, E_DEPRECATED])) {
                return 'info';
            }
        }

        // For HTTP-style exceptions
        if ($code >= 500) {
            return 'error';
        } elseif ($code >= 400) {
            return 'warning';
        }

        // Default to error for uncategorized exceptions
        return 'error';
    }

    /**
     * Get HTTP status code from exception
     */
    private function getHttpStatusCode(Throwable $exception): int
    {
        $code = $exception->getCode();

        // If code is a valid HTTP status code, use it
        if ($code >= 100 && $code < 600) {
            return $code;
        }

        // Default to 500 Internal Server Error
        return 500;
    }

    /**
     * Get user-friendly error message
     */
    private function getErrorMessage(Throwable $exception): string
    {
        // In production, hide detailed error messages
        if (getenv('APP_ENV') === 'production') {
            return 'An unexpected error occurred. Please try again later.';
        }

        // In development, show detailed error messages
        return $exception->getMessage();
    }

    /**
     * Wrap a callable with error handling
     */
    public function wrap(callable $callback): void
    {
        try {
            $callback();
        } catch (Throwable $e) {
            $this->handleException($e);
        }
    }
}
