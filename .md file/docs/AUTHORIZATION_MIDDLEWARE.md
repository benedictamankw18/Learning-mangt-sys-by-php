# Authorization Middleware - Usage Guide

## Overview

The `AuthorizationMiddleware` class provides centralized authorization checks for your LMS API. It helps prevent common security issues like cross-institution data access and unauthorized resource modifications.

## Why Use This Middleware?

**Before (scattered authorization logic):**

```php
// In every controller method
if ($user['role'] !== 'super_admin' && $class['institution_id'] != $user['institution_id']) {
    Response::forbidden('You do not have access to this class');
    return;
}
```

**After (centralized middleware):**

```php
$authz = new AuthorizationMiddleware($user);
if (!$authz->requireInstitutionAccess($class, 'You do not have access to this class')) {
    return; // Response already sent
}
```

## Installation

The middleware is already installed at `src/Middleware/AuthorizationMiddleware.php`.

## Quick Start

```php
use App\Middleware\AuthorizationMiddleware;

// In your controller
$authz = new AuthorizationMiddleware($user);

// Check institution access
if (!$authz->requireInstitutionAccess($resource)) {
    return; // 403 response sent automatically
}

// Continue with authorized code...
```

## Core Methods

### 1. requireInstitutionAccess()

Ensures user belongs to the same institution as the resource. Super admins bypass this check.

```php
public function show(array $user, string $uuid): void
{
    $sanitizedUuid = UuidHelper::sanitize($uuid);
    if (!$sanitizedUuid) {
        Response::badRequest('Invalid UUID format');
        return;
    }

    $class = $this->repo->findByUuid($sanitizedUuid);
    if (!$class) {
        Response::notFound('Class not found');
        return;
    }

    // Authorization check
    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireInstitutionAccess($class, 'You do not have access to this class')) {
        return;
    }

    Response::success($class);
}
```

**Use cases:**

- Classes, courses, assignments
- Any resource tied to an institution
- Prevents cross-institution data leakage

---

### 2. requireOwnership()

Ensures user owns the resource.

```php
public function markAsRead(array $user, string $uuid): void
{
    $message = $this->repo->findByUuid($sanitizedUuid);

    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireOwnership($notification, 'user_id', 'You can only mark your own notifications')) {
        return;
    }

    // User owns the notification, proceed...
}
```

**Parameters:**

- `$resource` - The resource array
- `$ownerField` - Field name containing owner ID (default: `'user_id'`)
- `$errorMessage` - Custom error message

**Use cases:**

- Notifications
- User profiles
- Personal settings

---

### 3. requireOwnershipOrAdmin()

Allows access if user owns resource OR is an admin/super admin.

```php
public function update(array $user, string $uuid): void
{
    $student = $this->repo->findByUuid($sanitizedUuid);

    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireOwnershipOrAdmin($student, 'user_id', 'You can only update your own profile')) {
        return;
    }

    // Student owns profile OR user is admin - proceed...
}
```

**Use cases:**

- Student profiles (students edit own, admins edit any)
- Teacher profiles
- User settings

---

### 4. requireInstitutionAdmin()

Requires user to be admin AND belong to same institution as resource.

```php
public function delete(array $user, string $uuid): void
{
    $class = $this->repo->findByUuid($sanitizedUuid);

    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireInstitutionAdmin($class, 'You cannot delete this class')) {
        return;
    }

    // User is admin in same institution - proceed with deletion...
}
```

**Use cases:**

- Deletions
- Administrative actions
- Institution-wide operations

---

### 5. requireStudentOwnership()

Specialized method for student records. Students can view own profile, teachers/admins can view students in their institution.

```php
public function show(array $user, string $uuid): void
{
    $student = $this->studentRepo->findByUuid($sanitizedUuid);

    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireStudentOwnership($student)) {
        return;
    }

    Response::success($student);
}
```

**Access logic:**

- **Student role**: Can only access own profile
- **Teacher/Admin**: Can access students in same institution
- **Super Admin**: Can access any student

---

### 6. requireTeacherOwnership()

Similar to student ownership but for teacher records.

```php
public function getCourses(array $user, string $uuid): void
{
    $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireTeacherOwnership($teacher)) {
        return;
    }

    $courses = $this->courseRepo->getByTeacher($teacher['teacher_id']);
    Response::success($courses);
}
```

---

### 7. requireMessageAccess()

Ensures user is either sender or receiver of a message.

```php
public function show(array $user, string $uuid): void
{
    $message = $this->messageRepo->findByUuid($sanitizedUuid);

    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireMessageAccess($message)) {
        return;
    }

    Response::success($message);
}
```

---

### 8. requireAssignmentCreationAccess()

Complex authorization for assignment creation.

```php
public function create(array $user): void
{
    $data = $_POST;
    $course = $this->courseRepo->findById($data['course_id']);

    $authz = new AuthorizationMiddleware($user);

    // Get teacher ID if user is a teacher
    $teacherId = $this->getTeacherIdForUser($user['user_id']);

    if (!$authz->requireAssignmentCreationAccess($course, $teacherId)) {
        return;
    }

    // Create assignment...
}
```

**Access logic:**

- **Admin**: Can create for any course in their institution
- **Teacher**: Can only create for courses they teach
- **Others**: Denied

---

## Role Check Methods

Simple role checking:

```php
$authz = new AuthorizationMiddleware($user);

// Check single role
if ($authz->isAdmin()) {
    // User is admin
}

// Check multiple roles
if ($authz->hasRole(['admin', 'teacher'])) {
    // User has at least one of these roles
}

// Specific role checks
$authz->isStudent();
$authz->isTeacher();
$authz->isAdmin();
$authz->isSuperAdmin();
```

---

## Helper Methods

```php
$authz = new AuthorizationMiddleware($user);

// Get user data
$user = $authz->getUser();
$userId = $authz->getUserId();
$institutionId = $authz->getInstitutionId();
```

---

## Complete Example: ClassController Update

**Before (manual authorization):**

```php
public function show(array $user, string $uuid): void
{
    $sanitizedUuid = UuidHelper::sanitize($uuid);
    if (!$sanitizedUuid) {
        Response::badRequest('Invalid UUID format');
        return;
    }

    $class = $this->repo->findByUuid($sanitizedUuid);
    if (!$class) {
        Response::notFound('Class not found');
        return;
    }

    // Manual authorization check
    if ($user['role'] !== 'super_admin' && $class['institution_id'] != $user['institution_id']) {
        Response::forbidden('You do not have access to this class');
        return;
    }

    Response::success($class);
}
```

**After (using middleware):**

```php
use App\Middleware\AuthorizationMiddleware;

public function show(array $user, string $uuid): void
{
    $sanitizedUuid = UuidHelper::sanitize($uuid);
    if (!$sanitizedUuid) {
        Response::badRequest('Invalid UUID format');
        return;
    }

    $class = $this->repo->findByUuid($sanitizedUuid);
    if (!$class) {
        Response::notFound('Class not found');
        return;
    }

    // Clean authorization check
    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireInstitutionAccess($class, 'You do not have access to this class')) {
        return;
    }

    Response::success($class);
}
```

---

## Common Patterns

### Pattern 1: View Resource (Institution Check)

```php
use App\Middleware\AuthorizationMiddleware;

public function show(array $user, string $uuid): void
{
    // 1. Validate UUID
    $sanitizedUuid = UuidHelper::sanitize($uuid);
    if (!$sanitizedUuid) {
        Response::badRequest('Invalid UUID format');
        return;
    }

    // 2. Fetch resource
    $resource = $this->repo->findByUuid($sanitizedUuid);
    if (!$resource) {
        Response::notFound('Resource not found');
        return;
    }

    // 3. Authorize access
    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireInstitutionAccess($resource)) {
        return;
    }

    // 4. Return data
    Response::success($resource);
}
```

### Pattern 2: Update Resource (Admin + Institution)

```php
public function update(array $user, string $uuid): void
{
    // Check role first (optional, can be done in middleware too)
    $roleMiddleware = new RoleMiddleware($user);
    if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
        return;
    }

    $sanitizedUuid = UuidHelper::sanitize($uuid);
    if (!$sanitizedUuid) {
        Response::badRequest('Invalid UUID format');
        return;
    }

    $resource = $this->repo->findByUuid($sanitizedUuid);
    if (!$resource) {
        Response::notFound('Resource not found');
        return;
    }

    // Authorize institution access
    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireInstitutionAdmin($resource)) {
        return;
    }

    $resourceId = $resource['resource_id'];
    $data = $_POST;

    $this->repo->update($resourceId, $data);
    Response::success(null, 'Resource updated successfully');
}
```

### Pattern 3: Delete Resource (Admin + Institution)

```php
public function delete(array $user, string $uuid): void
{
    $roleMiddleware = new RoleMiddleware($user);
    if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
        return;
    }

    $sanitizedUuid = UuidHelper::sanitize($uuid);
    if (!$sanitizedUuid) {
        Response::badRequest('Invalid UUID format');
        return;
    }

    $resource = $this->repo->findByUuid($sanitizedUuid);
    if (!$resource) {
        Response::notFound('Resource not found');
        return;
    }

    $authz = new AuthorizationMiddleware($user);
    if (!$authz->requireInstitutionAdmin($resource)) {
        return;
    }

    $resourceId = $resource['resource_id'];
    $this->repo->delete($resourceId);

    Response::success(null, 'Resource deleted successfully');
}
```

---

## Security Benefits

1. **Prevents Cross-Institution Access**: Users can't access data from other institutions
2. **Enforces Ownership**: Users can only modify their own resources (unless admin)
3. **Consistent Authorization**: Same logic applied across all controllers
4. **Easier Auditing**: All authorization in one place
5. **Reduces Code Duplication**: No repeated if statements

---

## Migration Checklist

To update existing controllers:

- [ ] Add import: `use App\Middleware\AuthorizationMiddleware;`
- [ ] Find manual authorization checks (search: `institution_id`, `forbidden`)
- [ ] Replace with appropriate middleware method
- [ ] Test endpoint works correctly
- [ ] Verify unauthorized access is blocked

---

## Testing

Test authorization by:

1. **Same Institution**: User accesses resource in their institution ✓
2. **Different Institution**: User tries to access another institution's resource ✗
3. **Super Admin**: Can access any institution's resources ✓
4. **Ownership**: User accesses own resource ✓
5. **Non-Owner**: User tries to access others' resource ✗

---

## Troubleshooting

**Q: Authorization fails even for valid users**

- Check user array has `institution_id` field
- Verify resource has `institution_id` field
- Ensure UUID lookup returns full record

**Q: Super admins are blocked**

- Verify `is_super_admin` flag is set in user array
- Check `role` field contains `'super_admin'`

**Q: Response not sent**

- All `require*` methods return false and send Response
- Always check return value: `if (!$authz->requireX()) { return; }`

---

## Next Steps

1. Update ClassController (already shows pattern)
2. Update remaining controllers one by one
3. Test each controller after update
4. Remove duplicate authorization code
5. Add authorization to any missing endpoints

## Related Middleware

- **AuthMiddleware**: JWT authentication
- **RoleMiddleware**: Role and permission checks
- **AuthorizationMiddleware**: Resource-level authorization (this)
