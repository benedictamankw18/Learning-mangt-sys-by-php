# Debug Logs

This folder contains the debug logging system for the LMS frontend.

## Files

- **viewer.html** - Web-based log viewer with filtering and export functionality
- **logger.js** - Logging utility (located in `../assets/js/logger.js`)
- **errors.log** - Template/example error log file (will be auto-generated)

## How to Use

### 1. View Logs in Real-Time

Open the log viewer in your browser:

```
file:///D:/db/lms-frontend/logs/viewer.html
```

Or click the "View Logs" button in the bottom-right corner of the login page (development mode only).

### 2. Features

The log viewer provides:

- ✅ **Real-time log display** - Auto-refreshes every 5 seconds
- ✅ **Filter by type** - All, Errors, Warnings, Auth, API
- ✅ **Statistics** - Total logs, error count, warning count, auth events
- ✅ **Download logs** - Export all logs as a .log file
- ✅ **Clear logs** - Remove all stored logs
- ✅ **Detailed view** - Expand log entries to see full data

### 3. Log Storage

Logs are stored in **localStorage** under the key `lms_debug_logs`.

- Maximum: 500 log entries (automatically rotates)
- Persists across page refreshes
- Shared across all pages of the app

### 4. What Gets Logged

The logger tracks:

- 🔐 **Auth Events** - Login, logout, token refresh, role checks
- 📡 **API Calls** - Requests and responses
- 💾 **Storage Operations** - localStorage/sessionStorage reads/writes
- ❌ **Errors** - All caught errors with stack traces
- ⚠️ **Warnings** - Potential issues
- ✅ **Success** - Successful operations
- 🔍 **Debug** - Detailed debugging information

### 5. Login Flow Debugging

When you click "Quick Login", you'll see:

1. Login attempt started
2. API response received
3. Token presence check (access + refresh)
4. Storage operations (where tokens are saved)
5. Verification (confirming save was successful)
6. Login success or error

### 6. Checking Storage Directly

**In Browser DevTools:**

1. Press **F12**
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Check both:
   - **Local Storage** → Should have: `lms_refresh_token`, `lms_debug_logs`
   - **Session Storage** → Should have: `lms_access_token`, `lms_user_data` (when remember = false)

### 7. Export Logs for Analysis

**Export All Logs:**
Click "Download All" button to export all logs as a text file:

- Filename: `lms-debug-YYYY-MM-DD-HH-MM-SS.log`
- Format: Human-readable text with timestamps
- Contains: All log entries with full data

**Export Errors Only:**
Click "Download Errors Only" button to export only error logs:

- Filename: `errors-YYYY-MM-DD-HH-MM-SS.log`
- Format: Detailed error report with full stack traces
- Contains: Only error-level log entries
- Useful for troubleshooting specific issues

**Console Commands:**

```javascript
// Export all logs
logger.exportToFile();

// Export errors only
logger.exportErrorsToFile();

// Auto-download errors when they occur
logger.enableAutoErrorExport();
```

### 8. Production Note

In production, you can disable console logging by setting:

```javascript
logger.silent = true; // TODO: Add this feature if needed
```

Or remove the logger.js script from production builds.

## Troubleshooting

**No logs appearing?**

- Check if logger.js is loaded (view page source)
- Open browser console - logs appear there too
- Try clicking "Refresh" in the log viewer

**Logs not saving?**

- Check localStorage quota (may be full)
- Try clearing old logs
- Check browser privacy settings (some block storage)

**Can't open viewer.html?**

- Make sure you're opening it from the `logs/` folder
- Check that `../assets/js/logger.js` exists
- Try opening with a different browser
