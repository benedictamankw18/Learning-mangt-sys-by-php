# Postman Testing Guide - UUID Security Update

**Last Updated:** March 3, 2026  
**API Version:** v1.0 (UUID Security Enabled)

## Overview

The Ghana SHS LMS API has been updated to use UUIDs instead of integer IDs for enhanced security. This guide explains how to test the updated endpoints using the Postman collection.

---

## Quick Start

### 1. Import the Collection

1. Open Postman
2. Import `postman_collection.json`
3. The collection includes **230+ endpoints** across 25 categories

### 2. Run Setup Scripts

The collection includes automated setup scripts that retrieve UUIDs and populate variables:

#### Step 1: Login as Super Admin

```
POST /api/auth/login
```

- **Username:** `superadmin`
- **Password:** `password`
- ✅ Auto-saves `access_token` to collection variable

#### Step 2: Get Institution UUID

```
GET /api/institutions
```

- ✅ Auto-saves `institution_uuid` from first institution (Accra SHS)

#### Step 3: Get Student UUIDs

```
GET /api/students
```

- ✅ Auto-saves `student_uuid` from first student

#### Step 4: Get Teacher UUIDs

```
GET /api/teachers
```

- ✅ Auto-saves `teacher_uuid` from first teacher

#### Step 5: Get Class UUIDs

```
GET /api/classes
```

- ✅ Auto-saves `class_uuid` from first class

#### Step 6: Get Subject UUIDs

```
GET /api/subjects
```

- ✅ Auto-saves `subject_uuid` from first subject

**All other UUIDs are automatically retrieved by the setup scripts in the "Setup & Configuration" folder.**

---

## Collection Variables

### UUID Variables (Security Enhanced)

These variables use UUIDs from the database `uuid` column:

| Variable              | Example Value                          | Used In                  |
| --------------------- | -------------------------------------- | ------------------------ |
| `student_uuid`        | `550e8400-e29b-41d4-a716-446655440000` | Student endpoints        |
| `teacher_uuid`        | `6ba7b810-9dad-11d1-80b4-00c04fd430c8` | Teacher endpoints        |
| `user_uuid`           | `7c9e6679-7425-40de-944b-e07fc1f90ae7` | User management          |
| `institution_uuid`    | `3fa85f64-5717-4562-b3fc-2c963f66afa6` | Institution endpoints    |
| `class_uuid`          | `f47ac10b-58cc-4372-a567-0e02b2c3d479` | Class endpoints          |
| `subject_uuid`        | `c9bf9e57-1685-4c89-baf6-ff5af830be8a` | Subject endpoints        |
| `assignment_uuid`     | `a6b3e5d1-2a3b-4c5d-6e7f-8a9b0c1d2e3f` | Assignment endpoints     |
| `message_uuid`        | `b7c4f6e2-3b4c-5d6e-7f8a-9b0c1d2e3f4a` | Message endpoints        |
| `notification_uuid`   | `c8d5g7f3-4c5d-6e7f-8a9b-0c1d2e3f4a5b` | Notification endpoints   |
| `announcement_uuid`   | `d9e6h8g4-5d6e-7f8a-9b0c-1d2e3f4a5b6c` | Announcement endpoints   |
| `event_uuid`          | `e0f7i9h5-6e7f-8a9b-0c1d-2e3f4a5b6c7d` | Event endpoints          |
| `grade_report_uuid`   | `f1g8j0i6-7f8a-9b0c-1d2e-3f4a5b6c7d8e` | Grade report endpoints   |
| `course_content_uuid` | `g2h9k1j7-8a9b-0c1d-2e3f-4a5b6c7d8e9f` | Course content endpoints |

### Integer ID Variables (Unchanged)

These variables still use integer IDs (not UUID-enabled):

| Variable           | Example Value | Used In                        |
| ------------------ | ------------- | ------------------------------ |
| `course_id`        | `1`           | Course/class-subject endpoints |
| `assessment_id`    | `1`           | Assessment endpoints           |
| `parent_id`        | `1`           | Parent endpoints               |
| `role_id`          | `1`           | Role management                |
| `permission_id`    | `1`           | Permission management          |
| `academic_year_id` | `1`           | Academic year endpoints        |
| `semester_id`      | `1`           | Semester endpoints             |
| `program_id`       | `1`           | Program endpoints              |
| `grade_level_id`   | `1`           | Grade level endpoints          |
| `class_subject_id` | `1`           | Class-subject assignments      |

---

## Testing Workflow

### Example 1: Test Student Endpoints

1. **Login as Admin:**

   ```
   POST /api/auth/login
   Body: {"username": "admin", "password": "password"}
   ```

2. **Get All Students:**

   ```
   GET /api/students
   ```

   - Response includes `uuid` field for each student

3. **Get Specific Student:**

   ```
   GET /api/students/{{student_uuid}}
   ```

   - Uses UUID variable automatically

4. **Update Student:**

   ```
   PUT /api/students/{{student_uuid}}
   Body: {"first_name": "Updated Name"}
   ```

5. **Get Student Courses:**
   ```
   GET /api/students/{{student_uuid}}/courses
   ```

### Example 2: Test Institution Endpoints

1. **Get All Institutions:**

   ```
   GET /api/institutions
   ```

2. **Get Institution Details:**

   ```
   GET /api/institutions/{{institution_uuid}}
   ```

3. **Get Institution Statistics:**

   ```
   GET /api/institutions/{{institution_uuid}}/statistics
   ```

4. **Get Institution Users:**
   ```
   GET /api/institutions/{{institution_uuid}}/users
   ```

### Example 3: Test Authorization Middleware

The API now includes centralized authorization checks:

1. **Test Cross-Institution Access (Should Fail):**
   - Login as Admin of Institution A
   - Try to access data from Institution B
   - Expected: `403 Forbidden`

2. **Test Super Admin Bypass:**
   - Login as Super Admin
   - Access any institution/class/student
   - Expected: `200 OK` (super admin bypasses institution checks)

3. **Test Ownership Validation:**
   - Login as Teacher
   - Try to update another teacher's data
   - Expected: `403 Forbidden`

---

## Testing UUID Security

### ID Enumeration Attack Prevention

**Before UUID Update (Vulnerable):**

```
GET /api/students/1
GET /api/students/2
GET /api/students/3
```

✗ Attackers could enumerate all students by incrementing IDs

**After UUID Update (Secure):**

```
GET /api/students/550e8400-e29b-41d4-a716-446655440000
GET /api/students/invalid-uuid-here
```

✓ UUIDs are non-sequential and unpredictable  
✓ Invalid UUIDs return `400 Bad Request` (invalid format)  
✓ Valid but non-existent UUIDs return `404 Not Found`

### Testing Invalid UUIDs

1. **Invalid Format:**

   ```
   GET /api/students/12345
   Response: 400 Bad Request - "Invalid UUID format"
   ```

2. **Valid Format, Wrong Resource:**

   ```
   GET /api/students/00000000-0000-0000-0000-000000000000
   Response: 404 Not Found - "Student not found"
   ```

3. **Malformed UUID:**
   ```
   GET /api/students/not-a-valid-uuid
   Response: 400 Bad Request - "Invalid UUID format"
   ```

---

## Common Issues & Solutions

### Issue 1: Variables Not Populated

**Problem:** Collection variables are empty  
**Solution:** Run the "Setup & Configuration" folder requests in order

### Issue 2: 401 Unauthorized

**Problem:** API returns `401 Unauthorized`  
**Solution:**

1. Login using any authentication endpoint
2. Check that `access_token` variable is set
3. Verify Authorization header: `Bearer {{access_token}}`

### Issue 3: 403 Forbidden

**Problem:** API returns `403 Forbidden`  
**Solution:**

- Check user role/permissions
- Verify institution_id matches authenticated user
- Super Admin can bypass most authorization checks

### Issue 4: 400 Invalid UUID

**Problem:** API returns `400 Bad Request - Invalid UUID format`  
**Solution:**

- Ensure collection variables are populated with valid UUIDs
- Run setup scripts to retrieve UUIDs from database
- Check that you're using `{{student_uuid}}` not `{{student_id}}`

### Issue 5: 404 Not Found

**Problem:** Valid UUID but resource not found  
**Solution:**

- Verify the UUID exists in database
- Check institution filtering (resources may belong to different institution)
- Run setup scripts to get valid UUIDs

---

## Endpoint Categories

### 1. Authentication (7 endpoints)

- ✅ Register, Login, Logout
- ✅ Forgot Password, Reset Password
- ✅ Change Password
- ✅ Get Current User

### 2. Institutions (12 endpoints) 🔒 UUID

- ✅ CRUD operations
- ✅ Statistics, Users, Programs, Classes
- ✅ Settings management

### 3. Students (7 endpoints) 🔒 UUID

- ✅ CRUD operations
- ✅ Enrollment management
- ✅ Course listings

### 4. Teachers (7 endpoints) 🔒 UUID

- ✅ CRUD operations
- ✅ Course assignments
- ✅ Schedule management

### 5. Classes (9 endpoints) 🔒 UUID

- ✅ CRUD operations
- ✅ Student listings
- ✅ Subject assignments
- ✅ Schedule management

### 6. Subjects (6 endpoints) 🔒 UUID

- ✅ CRUD operations
- ✅ Core subjects listing

### 7. Assignments (8 endpoints) 🔒 UUID

- ✅ CRUD operations
- ✅ Submission management
- ✅ Grading

### 8. Messages (8 endpoints) 🔒 UUID

- ✅ Inbox/Sent messages
- ✅ Send, Read, Delete
- ✅ Conversation threads

### 9. Notifications (8 endpoints) 🔒 UUID

- ✅ CRUD operations
- ✅ Mark as read
- ✅ Unread count

### 10. Announcements (5 endpoints) 🔒 UUID

- ✅ CRUD operations
- ✅ Institution-wide announcements

### 11. Events (9 endpoints) 🔒 UUID

- ✅ CRUD operations
- ✅ Calendar views
- ✅ Upcoming events
- ✅ Event types

### 12. Grade Reports (11 endpoints) 🔒 UUID

- ✅ Generate reports
- ✅ Transcripts
- ✅ Publication management

### 13. Course Content (9 endpoints) 🔒 UUID

- ✅ Lesson plans
- ✅ Content management
- ✅ Reordering, Duplication

### Additional Categories:

- User Management (21 endpoints)
- Programs (7 endpoints)
- Grade Levels (7 endpoints)
- Class Subjects (20 endpoints)
- Courses (19 endpoints)
- Assessments (7 endpoints)
- Attendance (7 endpoints)
- Academic Years (6 endpoints)
- Semesters (6 endpoints)
- Parents (6 endpoints)
- Results (6 endpoints)
- Quizzes (11 endpoints)
- Login Activity (5 endpoints)
- Error Logs (7 endpoints)
- Subscriptions (10 endpoints)
- File Upload (4 endpoints)

---

## Security Testing Checklist

- [ ] Test UUID format validation (invalid UUIDs return 400)
- [ ] Test non-existent UUID (valid format returns 404)
- [ ] Test cross-institution access prevention (403 Forbidden)
- [ ] Test super admin bypass (200 OK for all institutions)
- [ ] Test ownership validation (users can't modify others' data)
- [ ] Test role-based access control (teachers vs students vs admins)
- [ ] Test JWT token expiration
- [ ] Test unauthorized access (missing/invalid token)

---

## Performance Testing

### Recommended Tests:

1. **Pagination:**

   ```
   GET /api/students?page=1&limit=20
   ```

2. **Filtering:**

   ```
   GET /api/students?institution_id={{institution_uuid}}&status=active
   ```

3. **Bulk Operations:**

   ```
   POST /api/attendance/bulk
   POST /api/grade-reports/bulk-generate
   ```

4. **Search:**
   ```
   GET /api/students?search=kwame
   ```

---

## Next Steps

1. ✅ Import the updated Postman collection
2. ✅ Run "Setup & Configuration" folder to populate UUIDs
3. ✅ Test authentication endpoints
4. ✅ Test UUID-enabled endpoints (13 resource types)
5. ✅ Test authorization middleware (cross-institution blocking)
6. ✅ Test invalid UUID handling
7. ✅ Run security testing checklist
8. ✅ Document any issues or bugs

---

## Support

For issues or questions:

- Check this guide first
- Review API route definitions in `src/Routes/api.php`
- Check authorization middleware in `src/Middleware/AuthorizationMiddleware.php`
- Review UUID helper methods in `src/Helpers/UuidHelper.php`

**Happy Testing! 🚀**
