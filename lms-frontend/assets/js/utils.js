/* ============================================
   Utility Functions
   Common helpers for date formatting, validation, etc.
============================================ */

/**
 * Date & Time Utilities
 */
const DateUtils = {
    /**
     * Format date to Ghana standard (DD/MM/YYYY)
     */
    formatDate(date, format = 'DD/MM/YYYY') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        switch (format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD MMM YYYY':
                return `${day} ${this.getMonthName(d.getMonth())} ${year}`;
            case 'DD/MM/YYYY HH:mm':
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            case 'DD MMM YYYY HH:mm':
                return `${day} ${this.getMonthName(d.getMonth())} ${year} ${hours}:${minutes}`;
            case 'HH:mm':
                return `${hours}:${minutes}`;
            case 'HH:mm:ss':
                return `${hours}:${minutes}:${seconds}`;
            default:
                return `${day}/${month}/${year}`;
        }
    },

    /**
     * Get month name
     */
    getMonthName(monthIndex, short = true) {
        const months = short
            ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthIndex] || '';
    },

    /**
     * Get relative time (e.g., "2 hours ago")
     */
    getRelativeTime(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        
        return this.formatDate(date);
    },

    /**
     * Check if date is today
     */
    isToday(date) {
        const d = new Date(date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },

    /**
     * Get academic year from date
     */
    getAcademicYear(date = new Date()) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth(); // 0-11

        // Academic year typically starts in September (month 8)
        if (month >= 8) {
            return `${year}/${year + 1}`;
        } else {
            return `${year - 1}/${year}`;
        }
    },
};

/**
 * Number & Grade Utilities
 */
const NumberUtils = {
    /**
     * Format number with commas
     */
    formatNumber(num, decimals = 0) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return Number(num).toLocaleString('en-GH', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    },

    /**
     * Format percentage
     */
    formatPercentage(value, total, decimals = 1) {
        if (!total || total === 0) return '0%';
        const percent = (value / total) * 100;
        return `${percent.toFixed(decimals)}%`;
    },

    /**
     * Calculate percentage
     */
    calculatePercentage(value, total) {
        if (!total || total === 0) return 0;
        return (value / total) * 100;
    },

    /**
     * Convert marks to WAEC grade (A1-F9)
     */
    marksToWAECGrade(marks) {
        const score = Number(marks);
        
        if (score >= 75) return 'A1';
        if (score >= 70) return 'B2';
        if (score >= 65) return 'B3';
        if (score >= 60) return 'C4';
        if (score >= 55) return 'C5';
        if (score >= 50) return 'C6';
        if (score >= 45) return 'D7';
        if (score >= 40) return 'E8';
        if (score >= 0) return 'F9';
        
        return 'N/A';
    },

    /**
     * Get grade description
     */
    getGradeDescription(grade) {
        const descriptions = {
            'A1': 'Excellent',
            'B2': 'Very Good',
            'B3': 'Good',
            'C4': 'Credit',
            'C5': 'Credit',
            'C6': 'Credit',
            'D7': 'Pass',
            'E8': 'Pass',
            'F9': 'Fail',
        };
        return descriptions[grade] || 'N/A';
    },

    /**
     * Get grade color class
     */
    getGradeColorClass(grade) {
        if (['A1', 'B2', 'B3'].includes(grade)) return 'grade-excellent';
        if (['C4', 'C5', 'C6'].includes(grade)) return 'grade-good';
        if (['D7', 'E8'].includes(grade)) return 'grade-pass';
        if (grade === 'F9') return 'grade-fail';
        return '';
    },

    /**
     * Calculate GPA from grades
     */
    calculateGPA(grades) {
        if (!grades || grades.length === 0) return 0;

        const gradePoints = {
            'A1': 4.0, 'B2': 3.5, 'B3': 3.0,
            'C4': 2.5, 'C5': 2.0, 'C6': 1.5,
            'D7': 1.0, 'E8': 0.5, 'F9': 0.0,
        };

        let totalPoints = 0;
        let count = 0;

        grades.forEach(grade => {
            if (gradePoints[grade] !== undefined) {
                totalPoints += gradePoints[grade];
                count++;
            }
        });

        return count > 0 ? (totalPoints / count).toFixed(2) : 0;
    },
};

/**
 * String Utilities
 */
const StringUtils = {
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Title case (capitalize each word)
     */
    titleCase(str) {
        if (!str) return '';
        return str.split(' ')
            .map(word => this.capitalize(word))
            .join(' ');
    },

    /**
     * Truncate text with ellipsis
     */
    truncate(str, maxLength = 50) {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
    },

    /**
     * Get initials from name
     */
    getInitials(name) {
        if (!name) return '';
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2);
    },

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Format role name for display
     */
    formatRole(role) {
        if (!role) return '';
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },
};

/**
 * Validation Utilities
 */
const ValidationUtils = {
    /**
     * Validate email
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate Ghana phone number
     */
    isValidGhanaPhone(phone) {
        // Ghana phone: +233XXXXXXXXX or 0XXXXXXXXX (10 digits after 0)
        const re = /^(\+233|0)[2-5]\d{8}$/;
        return re.test(phone.replace(/\s/g, ''));
    },

    /**
     * Validate password strength
     */
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    },

    /**
     * Check if form field is empty
     */
    isEmpty(value) {
        return value === null || value === undefined || value.trim() === '';
    },

    /**
     * Validate marks (0-100)
     */
    isValidMarks(marks) {
        const score = Number(marks);
        return !isNaN(score) && score >= 0 && score <= 100;
    },
};

/**
 * DOM & UI Utilities
 */
const UIUtils = {
    /**
     * Show alert message
     */
    showAlert(message, type = 'info', duration = 5000) {
        const container = document.getElementById('alertContainer') || document.body;
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${this.getAlertIcon(type)}
            <span>${StringUtils.sanitizeHTML(message)}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        container.appendChild(alertDiv);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                alertDiv.remove();
            }, duration);
        }

        return alertDiv;
    },

    /**
     * Get alert icon
     */
    getAlertIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
        };
        return icons[type] || icons.info;
    },

    /**
     * Show loading spinner
     */
    showLoading(element) {
        if (!element) return;
        element.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>';
    },

    /**
     * Show confirmation dialog
     */
    confirm(message, onConfirm, onCancel = null) {
        if (confirm(message)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    },

    /**
     * Disable button with loading state
     */
    setButtonLoading(button, isLoading, loadingText = 'Loading...') {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || 'Submit';
        }
    },

    /**
     * Create loading skeleton
     */
    createSkeleton(count = 3) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += '<div class="skeleton-item"></div>';
        }
        return html;
    },

    /**
     * Debounce function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Copy to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showAlert('Copied to clipboard!', 'success', 2000);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showAlert('Failed to copy to clipboard', 'error');
            return false;
        }
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Get file extension
     */
    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    },

    /**
     * Get file icon class
     */
    getFileIcon(filename) {
        const ext = this.getFileExtension(filename).toLowerCase();
        const icons = {
            'pdf': 'fa-file-pdf text-danger',
            'doc': 'fa-file-word text-primary',
            'docx': 'fa-file-word text-primary',
            'xls': 'fa-file-excel text-success',
            'xlsx': 'fa-file-excel text-success',
            'ppt': 'fa-file-powerpoint text-warning',
            'pptx': 'fa-file-powerpoint text-warning',
            'jpg': 'fa-file-image text-info',
            'jpeg': 'fa-file-image text-info',
            'png': 'fa-file-image text-info',
            'gif': 'fa-file-image text-info',
            'zip': 'fa-file-archive text-secondary',
            'rar': 'fa-file-archive text-secondary',
            'txt': 'fa-file-alt text-muted',
        };
        return icons[ext] || 'fa-file text-muted';
    },
};

/**
 * Data Table Utilities
 */
const TableUtils = {
    /**
     * Initialize DataTable with default settings
     */
    initDataTable(tableId, options = {}) {
        const defaultOptions = {
            responsive: true,
            pageLength: DEFAULT_PAGE_SIZE || 20,
            lengthMenu: [[10, 20, 50, 100, -1], [10, 20, 50, 100, 'All']],
            language: {
                search: '_INPUT_',
                searchPlaceholder: 'Search...',
                lengthMenu: 'Show _MENU_ entries',
                info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                infoEmpty: 'No entries found',
                infoFiltered: '(filtered from _MAX_ total entries)',
                zeroRecords: 'No matching records found',
                emptyTable: 'No data available in table',
                paginate: {
                    first: '<i class="fas fa-angle-double-left"></i>',
                    previous: '<i class="fas fa-angle-left"></i>',
                    next: '<i class="fas fa-angle-right"></i>',
                    last: '<i class="fas fa-angle-double-right"></i>',
                },
            },
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            ...options,
        };

        return $(`#${tableId}`).DataTable(defaultOptions);
    },

    /**
     * Export table to CSV
     */
    exportToCSV(tableId, filename = 'export.csv') {
        const table = document.getElementById(tableId);
        if (!table) return;

        let csv = [];
        const rows = table.querySelectorAll('tr');

        rows.forEach(row => {
            const cols = row.querySelectorAll('td, th');
            const rowData = Array.from(cols).map(col => {
                let data = col.innerText.replace(/"/g, '""');
                return `"${data}"`;
            });
            csv.push(rowData.join(','));
        });

        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },
};

/**
 * Chart Utilities (for Chart.js)
 */
const ChartUtils = {
    /**
     * Default chart colors
     */
    colors: {
        primary: '#4e73df',
        success: '#1cc88a',
        info: '#36b9cc',
        warning: '#f6c23e',
        danger: '#e74a3b',
        secondary: '#858796',
    },

    /**
     * Generate color palette
     */
    generateColors(count) {
        const baseColors = Object.values(this.colors);
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    },

    /**
     * Default chart options
     */
    getDefaultOptions(type = 'line') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
            },
        };
    },
};

/**
 * Export Utilities
 */
const ExportUtils = {
    /**
     * Export to PDF (requires jsPDF)
     */
    async exportToPDF(element, filename = 'document.pdf') {
        if (typeof jsPDF === 'undefined') {
            console.error('jsPDF library not loaded');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add content
        doc.html(element, {
            callback: function (doc) {
                doc.save(filename);
            },
            x: 10,
            y: 10,
        });
    },

    /**
     * Export to Excel (requires XLSX)
     */
    exportToExcel(data, filename = 'export.xlsx', sheetName = 'Sheet1') {
        if (typeof XLSX === 'undefined') {
            console.error('XLSX library not loaded');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);
    },
};

/**
 * Local Storage Utilities
 */
const StorageUtils = {
    /**
     * Set item in localStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },

    /**
     * Get item from localStorage
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },

    /**
     * Clear all localStorage
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    },
};

// Make utils globally available
window.DateUtils = DateUtils;
window.NumberUtils = NumberUtils;
window.StringUtils = StringUtils;
window.ValidationUtils = ValidationUtils;
window.UIUtils = UIUtils;
window.TableUtils = TableUtils;
window.ChartUtils = ChartUtils;
window.ExportUtils = ExportUtils;
window.StorageUtils = StorageUtils;

// Shorthand for common function
window.showAlert = UIUtils.showAlert.bind(UIUtils);
window.formatDate = DateUtils.formatDate.bind(DateUtils);
window.formatNumber = NumberUtils.formatNumber.bind(NumberUtils);
