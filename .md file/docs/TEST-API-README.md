# LMS API Comprehensive Test Suite

## Overview
This PowerShell script automatically tests all 200+ endpoints defined in the LMS API. It provides comprehensive coverage of GET, POST, PUT, and DELETE operations across all controllers.

## Features
- ✅ Tests all public endpoints (no authentication required)
- ✅ Tests all protected endpoints (with authentication)
- ✅ CRUD operation testing for major resources
- ✅ Detailed JSON report generation
- ✅ Color-coded console output
- ✅ Pass/fail statistics
- ✅ Category-based filtering
- ✅ Quick test mode (skip CRUD operations)

## Prerequisites
- PowerShell 5.1 or higher
- API server running (default: `http://localhost:8000`)
- Valid admin credentials (default: admin/password)

## Usage

### Basic Usage
```powershell
# Test all endpoints
.\test-api.ps1

# Test with verbose output
.\test-api.ps1 -Verbose

# Stop on first error
.\test-api.ps1 -StopOnError

# Quick test (skip CRUD operations)
.\test-api.ps1 -QuickTest
```

### Category-Specific Testing
```powershell
# Test only authentication endpoints
.\test-api.ps1 -Category auth

# Test only student endpoints
.\test-api.ps1 -Category students

# Test only dashboard endpoints
.\test-api.ps1 -Category dashboard

# Available categories:
# all, public, auth, dashboard, students, teachers, users, roles,
# system, notifications, announcements, institutions, programs,
# grade-levels, classes, class-subjects, assessments, attendance,
# academic-years, semesters, subjects, parents, grade-scales,
# results, assignments, quizzes, messages, login-activity,
# error-logs, events, grade-reports, user-activity, course-content,
# subscriptions
```

### Custom Base URL
```powershell
# Test against production server
.\test-api.ps1 -BaseUrl "https://api.production.com/api"

# Test against staging
.\test-api.ps1 -BaseUrl "http://staging.example.com:8080/api"
```

### Combined Options
```powershell
# Quick test of students category with verbose output
.\test-api.ps1 -Category students -QuickTest -Verbose

# Test academic-years with full CRUD operations
.\test-api.ps1 -Category academic-years
```

## Test Categories

### Public Endpoints (No Auth Required)
- `/subscriptions/plans`

### Authentication & Authorization
- Login, logout, register, password reset
- User profile, change password
- Token refresh

### Dashboard
- Super admin dashboard
- Admin dashboard
- Teacher dashboard
- Student dashboard
- Parent dashboard

### Resource Management
- **Students**: CRUD, enrollments, courses
- **Teachers**: CRUD, courses, schedules
- **Users**: CRUD, roles, activity tracking
- **Roles & Permissions**: Full CRUD
- **Institutions**: CRUD, statistics, settings

### Academic Structure
- **Programs**: General Arts, General Science, Business, etc.
- **Grade Levels**: SHS 1, SHS 2, SHS 3
- **Classes**: CRUD, students, schedules
- **Class Subjects**: CRUD, assessments, materials
- **Subjects**: Core and elective subjects
- **Academic Years**: CRUD, current year tracking
- **Semesters**: CRUD, current semester tracking

### Assessment & Grading
- Assessments: CRUD, submissions, grading
- Assessment Categories
- Grade Scales: A1, B2, C3, etc.
- Grade Reports: Report cards, transcripts
- Results: Student results tracking

### Attendance
- Mark attendance
- Bulk attendance
- Student attendance history
- Course attendance reports

### Communication
- **Notifications**: CRUD, read/unread, summaries
- **Announcements**: CRUD
- **Messages**: Inbox, sent, conversations

### Events & Calendar
- Event management
- Academic calendar
- Upcoming events
- Event types: school, academic, sports, etc.

### Administrative
- Login Activity: Audit logs, failed attempts
- User Activity: Action tracking, audit trail
- Error Logs: Monitoring, resolution
- System Settings

### Parents & Relationships
- Parent management
- Parent-student relationships
- Teacher-subject assignments

### Content Management
- Course content CRUD
- Assignments: CRUD, submissions, grading
- Quizzes: CRUD, questions, attempts
- Course sections

### Billing
- Subscriptions
- Subscription plans
- Subscription statistics

### File Management
- File uploads (single and multiple)
- File deletion
- File information

## Output

### Console Output
The script provides color-coded console output:
- ✓ **Green**: Successful tests
- ✗ **Red**: Failed tests
- ⚠ **Yellow**: Skipped tests (auth required, not found, validation)
- ℹ **Cyan**: Information messages

### Test Results File
After execution, a detailed JSON file is generated:
```
test-results-2026-03-03-143052.json
```

The JSON file contains:
- Timestamp
- Base URL
- Test category
- Test duration
- Summary statistics
- Individual test results with:
  - Timestamp
  - HTTP method
  - Endpoint
  - Status (PASS/FAIL/SKIP)
  - Status code
  - Response data or error message

### Summary Report
```
================================================================================
  TEST SUMMARY - LMS API Comprehensive Test Suite
================================================================================

Execution Info:
  Base URL:      http://localhost:8000/api
  Duration:      02:15
  Category:      all

Test Results:
  Total Tests:   234
  Passed:        189
  Failed:        0
  Skipped:       45
  Pass Rate:     80.77%

Breakdown by Status:
  PASS                : 189
  SKIP_AUTH           : 25
  SKIP_404            : 15
  SKIP_VALIDATION     : 5

================================================================================
```

## CRUD Operations Tested

When not in QuickTest mode, the script performs full CRUD operations on:

### Academic Year
- **Create**: New academic year (2027/2028)
- **Read**: Fetch created academic year
- **Update**: Set as current year
- **Delete**: Cleanup

### Subject
- **Create**: New subject with random code
- **Read**: Fetch created subject
- **Update**: Update subject name
- **Delete**: Cleanup

### Grade Scale
- **Create**: New grade scale
- **Read**: Fetch created grade scale
- **Update**: Update remark
- **Delete**: Cleanup

## Exit Codes
- **0**: All tests passed (or only expected skips)
- **1**: One or more tests failed unexpectedly

## Troubleshooting

### Authentication Failures
```
✗ Authentication failed for admin
```
**Solution**: Verify admin credentials in the script or API

### Connection Refused
```
✗ POST /auth/login - 0 No connection could be made
```
**Solution**: Ensure the API server is running on the specified base URL

### High Skip Rate
```
Skipped: 150
```
**Solution**: Check if you're authenticated. Many endpoints require valid tokens.

### Timeout Errors
**Solution**: Increase timeout in the script or check server performance

## Customization

### Adding New Test Categories
Edit the `$testCategories` hashtable in the `Main` function:
```powershell
$testCategories = @{
    "my-category" = { Test-MyCategoryEndpoints $script:AuthToken }
}
```

### Modifying Test Data
Update the `Test-CrudOperations` calls in the `Main` function with your test data.

### Changing Default Credentials
Update the admin credentials in the `Main` function:
```powershell
$script:AuthToken = Get-AuthToken -User @{
    username = "your-admin"
    password = "your-password"
    role = "admin"
}
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run API Tests
  shell: pwsh
  run: |
    cd lms-api
    ./test-api.ps1 -BaseUrl "http://localhost:8000/api" -QuickTest
  continue-on-error: false
```

### Azure DevOps
```yaml
- task: PowerShell@2
  inputs:
    filePath: 'lms-api/test-api.ps1'
    arguments: '-BaseUrl "http://localhost:8000/api" -QuickTest'
    failOnStderr: true
```

## Best Practices
1. Run full tests (with CRUD) in development
2. Use QuickTest mode in CI/CD pipelines
3. Test category-by-category when debugging
4. Use -Verbose for detailed debugging
5. Review the JSON output for detailed failure analysis
6. Run tests before deploying to production

## Performance
- **Quick Test**: ~30-60 seconds (200+ endpoints)
- **Full Test** (with CRUD): ~2-5 minutes
- **Category Test**: ~5-30 seconds (depends on category size)

## Authors
LMS API Testing Suite - March 2026

## License
Internal use only - LMS Project
