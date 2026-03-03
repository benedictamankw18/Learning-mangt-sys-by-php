# Quick Start Guide - API Test Script

## 🚀 Run Tests Immediately

### 1. Basic Test (All Endpoints)
```powershell
cd d:\db\lms-api
.\test-api.ps1
```

### 2. Quick Test (Skip CRUD, Faster)
```powershell
.\test-api.ps1 -QuickTest
```

### 3. Verbose Output (See All Requests)
```powershell
.\test-api.ps1 -Verbose
```

## 📋 Common Use Cases

### Test Specific Features
```powershell
# Test only student endpoints
.\test-api.ps1 -Category students

# Test only authentication
.\test-api.ps1 -Category auth

# Test academic structure
.\test-api.ps1 -Category academic-years

# Test assessments and grading
.\test-api.ps1 -Category assessments
```

### CI/CD Pipeline
```powershell
# Fast test for pipelines
.\test-api.ps1 -QuickTest -Category all
```

### Debugging Specific Issues
```powershell
# Detailed output + stop on first error
.\test-api.ps1 -Category notifications -Verbose -StopOnError
```

## 📊 Understanding Results

### Console Output
- ✓ Green = Success
- ✗ Red = Failed
- ⚠ Yellow = Skipped (expected)
- ℹ Blue = Info

### Exit Codes
- `0` = All tests passed
- `1` = Some tests failed

### Results File
After running, check: `test-results-YYYY-MM-DD-HHMMSS.json`

## 🔧 Prerequisites Checklist

Before running tests:

1. **API Server Running**
   ```powershell
   # Check if server is running
   Invoke-WebRequest -Uri "http://localhost:8000/api/subscriptions/plans" -Method GET
   ```

2. **Admin Account Exists**
   - Username: `admin`
   - Password: `admin123`
   - (Or update credentials in script)

3. **PowerShell Version**
   ```powershell
   # Check PowerShell version (need 5.1+)
   $PSVersionTable.PSVersion
   ```

## 📁 All Available Categories

```
all                  Test everything (200+ endpoints)
auth                 Login, logout, register, password reset
dashboard            All dashboard endpoints
students             Student management
teachers             Teacher management
users                User management
roles                Roles and permissions
system               System settings
notifications        Notification system
announcements        Announcements
institutions         Institution management
programs             Academic programs (Arts, Science, Business)
grade-levels         Grade levels (SHS 1, 2, 3)
classes              Class management
class-subjects       Class subjects
assessments          Assessments and submissions
attendance           Attendance tracking
academic-years       Academic year management
semesters            Semester management
subjects             Subject catalog
parents              Parent management
grade-scales         Grading scales (A1, B2, etc.)
results              Student results
assignments          Assignment management
quizzes              Quiz management
messages             Private messaging
login-activity       Login audit logs
error-logs           Error monitoring
events               Event calendar
grade-reports        Report cards and transcripts
user-activity        User activity tracking
course-content       Course content management
subscriptions        Billing and subscriptions
```

## 💡 Tips

1. **Start with Quick Test**
   ```powershell
   .\test-api.ps1 -QuickTest
   ```
   This gives you a fast overview without CRUD operations.

2. **Test Before Deploying**
   ```powershell
   .\test-api.ps1 -BaseUrl "http://staging:8000/api" -QuickTest
   ```

3. **Debug Failures**
   ```powershell
   .\test-api.ps1 -Category students -Verbose -StopOnError
   ```

4. **Check Results File**
   Open the generated JSON file for detailed request/response data.

## 🆘 Common Issues

### Issue: "Cannot connect"
**Solution**: Start the API server first
```powershell
cd d:\db\lms-api
php -S localhost:8000 -t public
```

### Issue: "Authentication failed"
**Solution**: Check admin credentials exist in database

### Issue: "Many skipped tests"
**Solution**: This is normal! Skipped tests are expected (404, validation, etc.)

### Issue: "Tests are slow"
**Solution**: Use `-QuickTest` flag to skip CRUD operations

## 🎯 Expected Results

### Healthy API
```
Total Tests:   234
Passed:        189
Failed:        0
Skipped:       45
Pass Rate:     80-90%
```

### What's Normal?
- **Skipped 40-60 tests** = Normal (auth required, resource-specific endpoints)
- **Pass rate 75-95%** = Good
- **0 hard failures** = Excellent

## 🏃 Run Your First Test Now!

```powershell
# Simple 3-step process:
cd d:\db\lms-api
.\test-api.ps1 -QuickTest -Verbose
# Review the output and JSON file
```

## 📖 Full Documentation
See `TEST-API-README.md` for complete documentation.
