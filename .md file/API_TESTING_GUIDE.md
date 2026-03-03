# Ghana SHS LMS - API Testing Guide

**Date:** March 3, 2026  
**Version:** 2.0  
**New Endpoints:** 67 (53 added to Postman collection)

---

## Overview

This guide provides step-by-step instructions for testing all new API endpoints using the updated Postman collection.

---

## Prerequisites

### 1. Environment Setup
- ✅ Database imported (`database_lms_api.sql`)
- ✅ Sample data loaded (`setup.sql`)
- ✅ PHP server running (`php -S localhost:8000 -t public`)
- ✅ Postman installed

### 2. Postman Collection Import
1. Open Postman
2. Click **Import** button
3. Select `postman_collection.json` from `d:\db\lms-api\`
4. Collection will appear as **"Ghana SHS LMS REST API"**

### 3. Initial Configuration
Run these requests in the **"Setup & Configuration"** folder:

1. **Login as Admin (Accra SHS)**
   - Sets `access_token` automatically
   - Confirms authentication is working

2. **Get Accra SHS Institution ID**
   - Auto-sets `institution_id` variable

3. **Get Programs, Grade Levels, Classes, etc.**
   - Auto-sets all required IDs
   - Run all requests in this folder

---

## Testing Checklist

### Phase 1: Events & Calendar API (9 endpoints)

**Folder:** `Events & Calendar`

| # | Endpoint | Method | Expected Result | Status |
|---|----------|--------|-----------------|--------|
| 1 | Get All Events | GET | Returns paginated events list | ⬜ |
| 2 | Get Upcoming Events | GET | Returns events in next 30 days | ⬜ |
| 3 | Get Calendar View | GET | Returns events for March 2026 | ⬜ |
| 4 | Get Academic Calendar | GET | Returns academic events only | ⬜ |
| 5 | Get Events by Type | GET | Returns exam-type events | ⬜ |
| 6 | Get Event by ID | GET | Returns single event details | ⬜ |
| 7 | Create Event (Admin) | POST | Creates new event, returns ID | ⬜ |
| 8 | Update Event | PUT | Updates event, confirms changes | ⬜ |
| 9 | Delete Event | DELETE | Deletes event, returns success | ⬜ |

**Testing Steps:**

1. **Test GET endpoints first** (requests 1-6)
   - Verify pagination works
   - Check date filtering
   - Confirm event types work

2. **Test CREATE** (request 7)
   - Create a test event
   - Save the returned `event_id`
   - Update collection variable `event_id`

3. **Test UPDATE** (request 8)
   - Use the created event ID
   - Modify title and dates
   - Verify changes persist

4. **Test DELETE** (request 9)
   - Delete the test event
   - Confirm it's gone with GET request

**Common Issues:**
- ❌ **401 Unauthorized:** Re-login to refresh token
- ❌ **Date format errors:** Use YYYY-MM-DD format
- ❌ **Missing institution_id:** Run Setup folder requests first

---

### Phase 2: Grade Reports & Transcripts API (11 endpoints)

**Folder:** `Grade Reports & Transcripts`

| # | Endpoint | Method | Expected Result | Status |
|---|----------|--------|-----------------|--------|
| 1 | Get All Grade Reports | GET | Returns all reports | ⬜ |
| 2 | Get Report Statistics | GET | Returns stats summary | ⬜ |
| 3 | Get Class Reports | GET | Returns class report list | ⬜ |
| 4 | Get Student Report Card | GET | Returns formatted report card | ⬜ |
| 5 | Get Student Transcript | GET | Returns full transcript (all semesters) | ⬜ |
| 6 | Get Grade Report by ID | GET | Returns single report | ⬜ |
| 7 | Generate Grade Report | POST | Creates new report with calculations | ⬜ |
| 8 | Bulk Generate Reports | POST | Creates reports for entire class | ⬜ |
| 9 | Update Grade Report | PUT | Updates report remarks | ⬜ |
| 10 | Publish/Unpublish Report | PUT | Changes publish status | ⬜ |
| 11 | Delete Grade Report | DELETE | Removes report | ⬜ |

**Testing Steps:**

1. **Verify Student Has Results First**
   - Run `Results > Get All Results`
   - Ensure student has assessment scores
   - If not, create some test results

2. **Test Report Card Generation** (request 4)
   - Use `student_id` from collection variables
   - Should show subjects with grades (A1-F9)
   - Verify GPA calculation
   - Check class position

3. **Test Transcript** (request 5)
   - Should show all semesters
   - Cumulative GPA
   - Overall performance

4. **Test Manual Generation** (request 7)
   - Creates report for specific student/semester
   - Auto-calculates totals, GPA, position
   - Returns generated report ID

5. **Test Bulk Generation** (request 8)
   - Generates for entire class
   - Returns count of reports created
   - Verify all students have reports

**Expected Data Structure (Report Card):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 1,
      "name": "Kwame Osei",
      "index_number": "12345678"
    },
    "semester": {
      "id": 1,
      "name": "First Semester",
      "academic_year": "2025/2026"
    },
    "subjects": [
      {
        "subject_name": "Mathematics",
        "score": 85,
        "grade": "A1",
        "remarks": "Excellent"
      }
    ],
    "total_score": 680,
    "average": 85.0,
    "gpa": 4.0,
    "position": 1,
    "total_students": 45
  }
}
```

**Common Issues:**
- ❌ **No results found:** Create assessment results first
- ❌ **GPA is 0:** Check grade scale configuration
- ❌ **Position null:** Ensure multiple students have reports

---

### Phase 3: User Activity & Audit Trail API (10 endpoints)

**Folder:** `User Activity & Audit Trail`

| # | Endpoint | Method | Expected Result | Status |
|---|----------|--------|-----------------|--------|
| 1 | Get All Activities | GET | Returns activity log | ⬜ |
| 2 | Get Recent Activities | GET | Last 100 activities | ⬜ |
| 3 | Get Activity Statistics | GET | Activity breakdown by type | ⬜ |
| 4 | Get Audit Trail (Admin) | GET | Compliance audit log | ⬜ |
| 5 | Get User History | GET | Specific user's activities | ⬜ |
| 6 | Get Activities by Action | GET | Filter by action (delete, etc.) | ⬜ |
| 7 | Get Activities by Entity | GET | Activities for specific entity | ⬜ |
| 8 | Get Activity by ID | GET | Single activity details | ⬜ |
| 9 | Log Activity | POST | Creates new activity log | ⬜ |
| 10 | Cleanup Old Activities | DELETE | Removes old records | ⬜ |

**Testing Steps:**

1. **Generate Some Activity First**
   - Perform various actions (view students, create classes, etc.)
   - Each action should auto-log activity

2. **Test Activity Retrieval** (requests 1-2)
   - Verify your recent actions appear
   - Check pagination works

3. **Test Statistics** (request 3)
   - Should show breakdown:
     - By action type (create, update, delete, view)
     - By entity type (student, teacher, class)
     - Most active users

4. **Test Filtering** (requests 5-7)
   - Filter by user
   - Filter by action type (e.g., "delete")
   - Filter by entity (e.g., student #123)

5. **Test Manual Logging** (request 9)
   - Create custom activity log entry
   - Verify it appears in activity list

**Expected Statistics Response:**
```json
{
  "success": true,
  "data": {
    "total_activities": 1250,
    "by_action": {
      "create": 320,
      "update": 450,
      "delete": 80,
      "view": 400
    },
    "by_entity": {
      "student": 500,
      "teacher": 200,
      "class": 150
    },
    "most_active_users": [
      {
        "user_id": 1,
        "name": "Admin User",
        "activity_count": 250
      }
    ]
  }
}
```

**Common Issues:**
- ❌ **Empty activity log:** Perform some actions first
- ❌ **Statistics all zeros:** No activities logged yet

---

### Phase 4: Course Content & Lesson Plans API (9 endpoints)

**Folder:** `Course Content & Lesson Plans`

| # | Endpoint | Method | Expected Result | Status |
|---|----------|--------|-----------------|--------|
| 1 | Get All Course Content | GET | Returns content list | ⬜ |
| 2 | Get Content by Class Subject | GET | Content for specific subject | ⬜ |
| 3 | Get Content by ID | GET | Single content details | ⬜ |
| 4 | Create Course Content | POST | Creates lesson/module | ⬜ |
| 5 | Duplicate Content | POST | Copies content to another subject | ⬜ |
| 6 | Reorder Content | PUT | Updates display order | ⬜ |
| 7 | Update Course Content | PUT | Modifies content | ⬜ |
| 8 | Publish/Unpublish | PUT | Changes visibility | ⬜ |
| 9 | Delete Course Content | DELETE | Removes content | ⬜ |

**Testing Steps:**

1. **Login as Teacher**
   - Use teacher credentials: `kofi.mensah / password`
   - Teacher can create lesson plans

2. **Create Lesson Plan** (request 4)
   - Type: "lesson"
   - Title: "Introduction to Quadratic Equations"
   - Content: HTML formatted lesson
   - Video URL (optional)
   - Duration in minutes
   - Save returned `course_content_id`

3. **Test Content Types**
   - Create different types:
     - `lesson` - Full lesson plan
     - `module` - Course module
     - `video` - Video content
     - `document` - PDF/document
     - `quiz` - Embedded quiz

4. **Test Reordering** (request 6)
   - Create 3+ content items
   - Change their order
   - Verify new order persists

5. **Test Duplication** (request 5)
   - Duplicate to another class subject
   - Verify copy exists
   - Check modifications applied

**Content Creation Example:**
```json
{
  "class_subject_id": 1,
  "teacher_id": 1,
  "type": "lesson",
  "title": "Introduction to Quadratic Equations",
  "description": "Learn quadratic equation basics",
  "content": "<h2>Objectives</h2><ul><li>Define quadratic equations</li><li>Solve simple equations</li></ul>",
  "video_url": "https://youtube.com/watch?v=example",
  "duration_minutes": 45,
  "order_position": 1,
  "is_published": true
}
```

**Common Issues:**
- ❌ **403 Forbidden:** Login as teacher
- ❌ **Invalid class_subject_id:** Use valid ID from Setup requests
- ❌ **Order conflicts:** Use reorder endpoint to fix

---

### Phase 5: Subscriptions & Billing API (10 endpoints)

**Folder:** `Subscriptions & Billing (Super Admin)`

| # | Endpoint | Method | Expected Result | Status |
|---|----------|--------|-----------------|--------|
| 1 | Get All Subscriptions | GET | All institution subscriptions | ⬜ |
| 2 | Get Subscription Plans | GET | Available plans (public) | ⬜ |
| 3 | Get Subscription Statistics | GET | Revenue/status stats | ⬜ |
| 4 | Get Institution Active Subscription | GET | Current active subscription | ⬜ |
| 5 | Check Subscription Status | GET | Status + days remaining | ⬜ |
| 6 | Get Subscription by ID | GET | Single subscription details | ⬜ |
| 7 | Create Subscription | POST | New subscription | ⬜ |
| 8 | Renew Subscription | POST | Extend subscription | ⬜ |
| 9 | Update Subscription | PUT | Modify subscription | ⬜ |
| 10 | Cancel Subscription | DELETE | Cancel subscription | ⬜ |

**Testing Steps:**

1. **Login as Super Admin**
   - Use: `superadmin / password`
   - Only Super Admin can manage subscriptions

2. **View Available Plans** (request 2)
   - No auth required
   - Should return 3 plans:
     - **Basic:** GHS 5,000/year (500 students)
     - **Standard:** GHS 10,000/year (1,000 students)
     - **Premium:** GHS 20,000/year (5,000 students)

3. **Check Current Status** (request 5)
   - For Accra SHS
   - Should show:
     - Status (active/expired/expiring_soon)
     - Days remaining
     - Student limit vs current count

4. **Create New Subscription** (request 7)
   - For a test institution
   - Plan: "Standard"
   - Payment details
   - Returns subscription ID

5. **Test Renewal** (request 8)
   - Renew existing subscription
   - Can upgrade plan
   - Extends end_date

**Subscription Plans Response:**
```json
[
  {
    "name": "Basic",
    "price": 5000,
    "currency": "GHS",
    "duration_months": 12,
    "student_limit": 500,
    "teacher_limit": 50,
    "features": [
      "Student Management",
      "Basic Attendance",
      "Basic Grading",
      "Email Support"
    ]
  },
  {
    "name": "Standard",
    "price": 10000,
    "currency": "GHS",
    "duration_months": 12,
    "student_limit": 1000,
    "teacher_limit": 100,
    "features": [
      "All Basic features",
      "Advanced Reporting",
      "Timetable Management",
      "Parent Portal",
      "Priority Support"
    ]
  },
  {
    "name": "Premium",
    "price": 20000,
    "currency": "GHS",
    "duration_months": 12,
    "student_limit": 5000,
    "teacher_limit": 500,
    "features": [
      "All Standard features",
      "Custom Branding",
      "API Access",
      "Advanced Analytics",
      "24/7 Support",
      "On-site Training"
    ]
  }
]
```

**Status Check Response:**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "days_remaining": 245,
    "expiry_date": "2027-02-28",
    "plan_name": "Standard",
    "student_limit": 1000,
    "current_students": 650,
    "can_add_students": true,
    "warning": null
  }
}
```

**Common Issues:**
- ❌ **403 Forbidden:** Only Super Admin can manage subscriptions
- ❌ **Subscription not found:** Create one first
- ❌ **Expired subscription:** Renew it

---

### Phase 6: File Upload API (4 endpoints)

**Folder:** `File Upload`

| # | Endpoint | Method | Expected Result | Status |
|---|----------|--------|-----------------|--------|
| 1 | Upload Single File | POST | Uploads file, returns path | ⬜ |
| 2 | Upload Multiple Files | POST | Uploads 2+ files | ⬜ |
| 3 | Get File Info | GET | File metadata | ⬜ |
| 4 | Delete File | DELETE | Removes file | ⬜ |

**Testing Steps:**

1. **Prepare Test Files**
   - PDF document (assignment.pdf)
   - Image file (profile.jpg)
   - Word document (notes.docx)
   - Video file (lesson.mp4) - optional

2. **Test Single Upload** (request 1)
   - Select a PDF file
   - Category: "assignments"
   - Uploader: student
   - Returns file URL and stored name

3. **Test Multiple Upload** (request 2)
   - Select 2-3 files
   - Category: "materials"
   - Uploader: teacher
   - Returns array of uploaded files

4. **Test File Info** (request 3)
   - Use stored filename from upload
   - Returns metadata:
     - Original filename
     - Size
     - Upload date
     - Uploader info

5. **Test Delete** (request 4)
   - Delete uploaded test file
   - Verify file removed

**Allowed File Types:**
- **Images:** jpg, jpeg, png, gif, webp
- **Documents:** pdf, doc, docx, xls, xlsx, ppt, pptx, txt
- **Videos:** mp4, avi, mov, wmv
- **Audio:** mp3, wav, ogg
- **Archives:** zip, rar, 7z

**File Categories:**
- `assignments` - Assignment submissions
- `materials` - Course materials
- `profiles` - Profile pictures
- `documents` - General documents
- `videos` - Video files
- `audio` - Audio files
- `images` - Image files
- `other` - Other files

**Upload Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "original_name": "assignment.pdf",
    "stored_name": "assignments/1_student_1_1709510400_assignment.pdf",
    "file_size": 245678,
    "file_type": "pdf",
    "category": "assignments",
    "url": "/uploads/assignments/1_student_1_1709510400_assignment.pdf"
  }
}
```

**Common Issues:**
- ❌ **File too large:** Max 10MB per file
- ❌ **Invalid file type:** Use allowed extensions only
- ❌ **Upload directory not writable:** Check folder permissions
- ❌ **File not found:** Create uploads directory: `mkdir -p public/uploads/{category}`

---

## Complete Testing Workflow

### Day 1: Setup & Core Features
1. **Import Postman collection**
2. **Run Setup & Configuration folder** (all requests)
3. **Test Authentication** (login/logout)
4. **Test existing endpoints** (Students, Teachers, Classes) to verify DB

### Day 2: Events & Reports
1. **Test Events API** (all 9 endpoints)
2. **Test Grade Reports API** (all 11 endpoints)
3. **Verify report card formatting**
4. **Test bulk operations**

### Day 3: Activity Tracking & Content
1. **Test User Activity API** (all 10 endpoints)
2. **Test Course Content API** (all 9 endpoints)
3. **Verify activity logging works automatically**
4. **Test lesson plan creation**

### Day 4: Subscriptions & Files
1. **Test Subscriptions API** (all 10 endpoints)
2. **Test File Upload API** (all 4 endpoints)
3. **Verify subscription status checks**
4. **Test file deletion**

### Day 5: Integration & Edge Cases
1. **Test cross-feature workflows:**
   - Create event → Check activity log
   - Upload file → Link to assignment
   - Generate report → Check statistics
2. **Test error scenarios:**
   - Invalid IDs
   - Missing required fields
   - Unauthorized access
3. **Test pagination on all list endpoints**
4. **Test filtering and search**

---

## Testing Checklist Summary

### ✅ Prerequisites
- [ ] Database imported and running
- [ ] PHP server started
- [ ] Postman collection imported
- [ ] Setup requests executed
- [ ] Access token obtained

### ✅ New API Testing
- [ ] Events & Calendar (9/9 passed)
- [ ] Grade Reports (11/11 passed)
- [ ] User Activity (10/10 passed)
- [ ] Course Content (9/9 passed)
- [ ] Subscriptions (10/10 passed)
- [ ] File Upload (4/4 passed)

### ✅ Integration Testing
- [ ] Activity auto-logging works
- [ ] Report generation accurate
- [ ] File uploads link to entities
- [ ] Subscription limits enforced
- [ ] Calendar events appear correctly

### ✅ Performance Testing
- [ ] Response times < 200ms (list endpoints)
- [ ] Response times < 100ms (single record)
- [ ] Pagination works efficiently
- [ ] Bulk operations complete successfully

### ✅ Security Testing
- [ ] Unauthorized requests blocked (401)
- [ ] Role-based access enforced (403)
- [ ] File upload validation works
- [ ] SQL injection prevented
- [ ] XSS protection active

---

## Common Errors & Solutions

### Error 401: Unauthorized
**Cause:** Token expired or missing  
**Solution:** Re-login using "Login as Admin"

### Error 403: Forbidden
**Cause:** Insufficient permissions  
**Solution:** Login with correct role (Teacher/Admin/Super Admin)

### Error 404: Not Found
**Cause:** Invalid ID or resource doesn't exist  
**Solution:** Verify ID exists using GET list endpoint

### Error 422: Validation Error
**Cause:** Missing or invalid fields  
**Solution:** Check request body matches expected format

### Error 500: Server Error
**Cause:** Database error or bug  
**Solution:** Check PHP error logs, verify database connection

### Empty Response Arrays
**Cause:** No data in database  
**Solution:** Run setup.sql to populate sample data

### File Upload Fails
**Cause:** Directory permissions or file size  
**Solution:**
- Create uploads directory: `mkdir -p public/uploads`
- Set permissions: `chmod 777 public/uploads`
- Check file size < 10MB

---

## Reporting Issues

If you encounter bugs during testing:

1. **Note the endpoint** (URL and method)
2. **Copy the request body** (if applicable)
3. **Copy the error response**
4. **Check PHP error logs:** `tail -f /path/to/php/error.log`
5. **Document steps to reproduce**

---

## Success Criteria

All tests pass when:

✅ All 53 new endpoint requests return `"success": true`  
✅ Data validation works correctly  
✅ Authentication enforced on all protected endpoints  
✅ Role-based access control working  
✅ Activity logging happens automatically  
✅ Report generation produces accurate results  
✅ File uploads save correctly  
✅ Subscription status checks accurate  
✅ No SQL errors or PHP warnings  
✅ Response times acceptable  

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Update API documentation with test results
2. ✅ Fix any discovered bugs
3. ⏳ Begin frontend integration
4. ⏳ Create frontend API service layer
5. ⏳ Implement calendar views
6. ⏳ Build report card displays
7. ⏳ Add file upload forms
8. ⏳ Create subscription management UI

---

**Prepared by:** GitHub Copilot  
**Date:** March 3, 2026  
**Version:** 2.0  
**Total New Endpoints:** 53 in Postman (67 total including backend-only)
