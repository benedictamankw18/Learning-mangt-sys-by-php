/**
 * Logger Utility
 * Stores logs in localStorage and provides download functionality
 */

class Logger {
    constructor() {
        this.storageKey = 'lms_debug_logs';
        this.maxLogs = 500; // Keep last 500 log entries
    }

    /**
     * Get all logs from storage
     */
    getLogs() {
        try {
            const logs = localStorage.getItem(this.storageKey);
            return logs ? JSON.parse(logs) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Save logs to storage
     */
    saveLogs(logs) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(logs));
        } catch (e) {
            console.error('Failed to save logs:', e);
        }
    }

    /**
     * Add a log entry
     */
    log(level, category, message, data = null) {
        const logs = this.getLogs();
        
        const entry = {
            timestamp: new Date().toISOString(),
            level: level,
            category: category,
            message: message,
            data: data,
        };

        logs.push(entry);

        // Keep only last maxLogs entries
        if (logs.length > this.maxLogs) {
            logs.shift();
        }

        this.saveLogs(logs);

        // Also log to console with emoji
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'debug': '🔍',
            'auth': '🔐',
            'api': '📡',
            'storage': '💾',
        }[level] || '📝';

        if (data) {
            console.log(`${emoji} [${category}] ${message}`, data);
        } else {
            console.log(`${emoji} [${category}] ${message}`);
        }

        return entry;
    }

    /**
     * Log info
     */
    info(category, message, data = null) {
        return this.log('info', category, message, data);
    }

    /**
     * Log success
     */
    success(category, message, data = null) {
        return this.log('success', category, message, data);
    }

    /**
     * Log warning
     */
    warning(category, message, data = null) {
        return this.log('warning', category, message, data);
    }

    /**
     * Log error
     */
    error(category, message, data = null) {
        const entry = this.log('error', category, message, data);
        
        // Auto-export errors to file if enabled
        if (this.autoExportErrors) {
            this.exportErrorsToFile();
        }
        
        return entry;
    }

    /**
     * Log debug info
     */
    debug(category, message, data = null) {
        return this.log('debug', category, message, data);
    }

    /**
     * Log authentication events
     */
    auth(message, data = null) {
        return this.log('auth', 'AUTH', message, data);
    }

    /**
     * Log API calls
     */
    api(message, data = null) {
        return this.log('api', 'API', message, data);
    }

    /**
     * Log storage operations
     */
    storage(message, data = null) {
        return this.log('storage', 'STORAGE', message, data);
    }

    /**
     * Clear all logs
     */
    clear() {
        localStorage.removeItem(this.storageKey);
        console.clear();
        this.info('LOGGER', 'All logs cleared');
    }

    /**
     * Export logs as text file
     */
    exportToFile(filename = null) {
        const logs = this.getLogs();
        
        if (logs.length === 0) {
            alert('No logs to export');
            return;
        }

        // Format logs as text
        let content = '='.repeat(80) + '\n';
        content += 'LMS Frontend Debug Logs\n';
        content += 'Generated: ' + new Date().toISOString() + '\n';
        content += '='.repeat(80) + '\n\n';

        logs.forEach(log => {
            content += `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}]\n`;
            content += `${log.message}\n`;
            if (log.data) {
                content += `Data: ${JSON.stringify(log.data, null, 2)}\n`;
            }
            content += '-'.repeat(80) + '\n';
        });

        // Create download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const defaultFilename = `lms-debug-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
        a.href = url;
        a.download = filename || defaultFilename;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.success('LOGGER', `Exported ${logs.length} log entries to file`);
    }

    /**
     * Export only errors to file
     */
    exportErrorsToFile(filename = null) {
        const allLogs = this.getLogs();
        const errorLogs = allLogs.filter(log => log.level === 'error');
        
        if (errorLogs.length === 0) {
            console.log('No errors to export');
            return;
        }

        // Format errors as text
        let content = '='.repeat(80) + '\n';
        content += 'LMS Frontend ERROR LOGS\n';
        content += 'Generated: ' + new Date().toISOString() + '\n';
        content += `Total Errors: ${errorLogs.length}\n`;
        content += '='.repeat(80) + '\n\n';

        errorLogs.forEach((log, index) => {
            content += `ERROR #${index + 1}\n`;
            content += `Timestamp: ${log.timestamp}\n`;
            content += `Category:  ${log.category}\n`;
            content += `Message:   ${log.message}\n`;
            if (log.data) {
                content += `\nDetails:\n`;
                content += JSON.stringify(log.data, null, 2) + '\n';
            }
            content += '\n' + '='.repeat(80) + '\n\n';
        });

        // Create download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const defaultFilename = `errors-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
        a.href = url;
        a.download = filename || defaultFilename;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log(`✅ Exported ${errorLogs.length} error(s) to file: ${filename || defaultFilename}`);
    }

    /**
     * Get error count
     */
    getErrorCount() {
        const logs = this.getLogs();
        return logs.filter(log => log.level === 'error').length;
    }

    /**
     * Get recent errors (last N)
     */
    getRecentErrors(count = 10) {
        const allLogs = this.getLogs();
        const errorLogs = allLogs.filter(log => log.level === 'error');
        return errorLogs.slice(-count).reverse();
    }

    /**
     * Auto-export errors when they occur
     */
    enableAutoErrorExport() {
        this.autoExportErrors = true;
        this.info('LOGGER', 'Auto-export errors enabled');
    }

    /**
     * Disable auto-export errors
     */
    disableAutoErrorExport() {
        this.autoExportErrors = false;
        this.info('LOGGER', 'Auto-export errors disabled');
    }

    /**
     * Get logs as formatted HTML
     */
    getLogsAsHTML() {
        const logs = this.getLogs();
        
        if (logs.length === 0) {
            return '<p class="text-muted">No logs available</p>';
        }

        let html = '<div class="log-entries">';
        
        logs.reverse().forEach(log => {
            const levelClass = {
                'info': 'info',
                'success': 'success',
                'warning': 'warning',
                'error': 'danger',
                'debug': 'secondary',
                'auth': 'primary',
                'api': 'info',
                'storage': 'dark',
            }[log.level] || 'secondary';

            const emoji = {
                'info': 'ℹ️',
                'success': '✅',
                'warning': '⚠️',
                'error': '❌',
                'debug': '🔍',
                'auth': '🔐',
                'api': '📡',
                'storage': '💾',
            }[log.level] || '📝';

            html += `
                <div class="log-entry border-start border-${levelClass} border-3 mb-2 p-2 bg-light">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="badge bg-${levelClass}">${emoji} ${log.level.toUpperCase()}</span>
                            <span class="badge bg-secondary">${log.category}</span>
                            <small class="text-muted ms-2">${new Date(log.timestamp).toLocaleString()}</small>
                        </div>
                    </div>
                    <div class="mt-1">
                        <strong>${log.message}</strong>
                    </div>
                    ${log.data ? `
                        <details class="mt-1">
                            <summary class="text-muted small" style="cursor: pointer;">View Data</summary>
                            <pre class="mt-1 mb-0 p-2 bg-white border rounded small"><code>${JSON.stringify(log.data, null, 2)}</code></pre>
                        </details>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
}

// Create global logger instance
const logger = new Logger();
