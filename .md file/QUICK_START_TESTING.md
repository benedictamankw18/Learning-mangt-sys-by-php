# Quick Start: Testing New APIs

**Last Updated:** March 3, 2026

---

## 🚀 Quick Setup (5 minutes)

### 1. Start PHP Server

```powershell
cd d:\db\lms-api
php -S localhost:8000 -t public
```

### 2. Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `d:\db\lms-api\postman_collection.json`
4. Collection appears: **"Ghana SHS LMS REST API"**

### 3. Run Setup Requests

In Postman, run these in order:

**Folder: "Setup & Configuration"**

1. ✅ Login as Admin (Accra SHS)
2. ✅ Get Accra SHS Institution ID
3. ✅ Get Programs
4. ✅ Get Grade Levels
5. ✅ Get Classes
6. ✅ Get Class Subjects
7. ✅ Get Students
8. ✅ Get Teachers

**Result:** All collection variables auto-set ✅

---

## 🧪 Test the 6 New APIs (30 minutes)

### Test 1: Events & Calendar (5 min)

**Folder:** `Events & Calendar`

**Quick Test:**

1. Run: **Get Upcoming Events**
   - Should return events in next 30 days
2. Run: **Create Event (Admin)**
   - Creates test event
   - Save returned `event_id`

3. Run: **Get Calendar View**
   - Shows March 2026 calendar

**✅ Success:** Events appear, calendar formatted correctly

---

### Test 2: Grade Reports (10 min)

**Folder:** `Grade Reports & Transcripts`

**Quick Test:**

1. Run: **Get Student Report Card**
   - Uses `student_id = 1`
   - Shows subjects with grades (A1-F9)
   - Displays GPA and class position

2. Run: **Get Student Transcript**
   - Shows all semesters
   - Cumulative performance

3. Run: **Generate Grade Report**
   - Auto-calculates from results
   - Returns report with totals

**✅ Success:** Report card displays properly formatted grades, GPA calculated correctly

**⚠️ Note:** If no results, create assessment results first using existing Assessment API

---

### Test 3: User Activity (5 min)

**Folder:** `User Activity & Audit Trail`

**Quick Test:**

1. Run: **Get Recent Activities**
   - Shows last 100 actions
   - Includes your login

2. Run: **Get Activity Statistics**
   - Breakdown by action type
   - Most active users

3. Run: **Log Activity**
   - Manually create activity log
   - Verify it appears in recent

**✅ Success:** Activity tracking works, statistics accurate

---

### Test 4: Course Content (5 min)

**Folder:** `Course Content & Lesson Plans`

**Quick Test:**

1. Login as Teacher first:
   - Run: **Authentication > Login**
   - Use: `kofi.mensah / password`

2. Run: **Create Course Content (Teacher)**
   - Creates lesson plan
   - Returns `course_content_id`

3. Run: **Get Content by Class Subject**
   - Shows created lesson

**✅ Success:** Lesson plan created, teacher can manage content

---

### Test 5: Subscriptions (3 min)

**Folder:** `Subscriptions & Billing (Super Admin)`

**Quick Test:**

1. Login as Super Admin:
   - Run: **Setup > Login as Super Admin**
   - Use: `superadmin / password`

2. Run: **Get Subscription Plans**
   - Shows 3 plans (Basic/Standard/Premium)
   - GHS pricing

3. Run: **Check Subscription Status**
   - For Accra SHS
   - Shows days remaining, student limits

**✅ Success:** Plans displayed, status check accurate

---

### Test 6: File Upload (2 min)

**Folder:** `File Upload`

**Quick Test:**

1. Run: **Upload Single File**
   - Select a PDF file
   - Category: "assignments"
   - Returns file URL

2. Run: **Get File Info**
   - Shows file metadata
   - Upload date, size

**✅ Success:** File uploaded, metadata correct

**⚠️ Note:** Create uploads directory first:

```powershell
mkdir public\uploads
```

---

## 📊 Testing Progress Tracker

### New APIs Status

| API Section       | Endpoints | Tested   | Status         |
| ----------------- | --------- | -------- | -------------- |
| Events & Calendar | 9         | 0/9      | ⬜ Not Started |
| Grade Reports     | 11        | 0/11     | ⬜ Not Started |
| User Activity     | 10        | 0/10     | ⬜ Not Started |
| Course Content    | 9         | 0/9      | ⬜ Not Started |
| Subscriptions     | 10        | 0/10     | ⬜ Not Started |
| File Upload       | 4         | 0/4      | ⬜ Not Started |
| **TOTAL**         | **53**    | **0/53** | **0%**         |

---

## 🎯 Priority Testing Order

### High Priority (Test First)

1. ✅ **Grade Reports** - Core feature for schools
2. ✅ **Events & Calendar** - Frequently used
3. ✅ **File Upload** - Required for assignments

### Medium Priority

4. ✅ **Course Content** - Teacher workflows
5. ✅ **User Activity** - Audit compliance

### Low Priority (Test Last)

6. ✅ **Subscriptions** - Super Admin only

---

## 🐛 Common Issues

### Issue 1: Token Expired (401)

**Solution:** Re-run "Login as Admin"

### Issue 2: No Data Returned

**Solution:** Check sample data loaded:

```sql
-- Run this in MySQL
SELECT COUNT(*) FROM students;
-- Should return > 0
```

### Issue 3: File Upload Fails

**Solution:** Create uploads directory:

```powershell
mkdir public\uploads
mkdir public\uploads\assignments
mkdir public\uploads\materials
```

### Issue 4: Report Card Empty

**Solution:** Create assessment results first:

1. Go to **Assessments** folder
2. Run **Create Assessment**
3. Run **Submit Assessment** (as student)
4. Then test Grade Reports

---

## ✅ Success Criteria

All tests pass when you see:

✅ **Events:**

- Calendar displays properly
- Events created/updated successfully

✅ **Grade Reports:**

- Report card shows A1-F9 grades
- GPA calculated (0.0-4.0 scale)
- Class position shown

✅ **User Activity:**

- Activities logged automatically
- Statistics accurate

✅ **Course Content:**

- Teachers can create lessons
- Content displays in order

✅ **Subscriptions:**

- Plans display with GHS pricing
- Status checks accurate

✅ **File Upload:**

- Files upload successfully
- Metadata retrieved correctly

---

## 📝 Testing Checklist

### Before Testing

- [ ] PHP server running on localhost:8000
- [ ] Database has sample data
- [ ] Postman collection imported
- [ ] Setup requests completed
- [ ] Access token obtained

### During Testing

- [ ] Each endpoint returns `"success": true`
- [ ] Data validation works
- [ ] Error handling proper
- [ ] Response times acceptable

### After Testing

- [ ] All 53 endpoints tested
- [ ] Issues documented
- [ ] Test results recorded
- [ ] Ready for frontend integration

---

## 🔧 Troubleshooting Commands

### Check PHP Server

```powershell
# Should show server running
Get-Process php
```

### Check Database Connection

```powershell
# Test database
cd d:\db\lms-api
php -r "require 'src/Config/Database.php'; $db = new Config\Database(); echo $db->getConnection() ? 'Connected' : 'Failed';"
```

### View PHP Errors

```powershell
# Watch error log
Get-Content -Wait d:\db\lms-api\logs\error.log
```

---

## 📚 Full Documentation

For detailed testing instructions, see:

- **[API_TESTING_GUIDE.md](d:\db\API_TESTING_GUIDE.md)** - Complete guide with all scenarios
- **[NEW_API_ENDPOINTS_QUICK_REFERENCE.md](d:\db\NEW_API_ENDPOINTS_QUICK_REFERENCE.md)** - API reference with examples
- **[Ghana-SHS-LMS-API-Completion-Summary.md](d:\db\Ghana-SHS-LMS-API-Completion-Summary.md)** - Overview of all APIs

---

## 🎉 Ready to Test!

You're all set! Start with the Quick Tests above (30 minutes total), then move to comprehensive testing using the full guide.

**Happy Testing! 🚀**

---

**Last Updated:** March 3, 2026  
**Version:** 2.0  
**Estimated Time:** 30 minutes for quick tests, 2-3 hours for comprehensive testing
