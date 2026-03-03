# UUID Helper Utility

Complete utility class for handling UUIDs in the LMS API to prevent ID enumeration security vulnerabilities.

## 📁 Files Created

- **`src/Utils/UuidHelper.php`** - Main utility class
- **`examples/UuidHelperExamples.php`** - Usage examples
- **`tests/UuidHelperTest.php`** - Unit tests

## 🚀 Quick Start

### 1. Run Tests

Verify the UuidHelper works correctly:

```bash
php tests/UuidHelperTest.php
```

Expected output:

```
=== UUID Helper Tests ===

✓ Generate UUID returns string
✓ Generated UUID has correct length (36)
✓ Generated UUID is valid
✓ Generated UUID is version 4
...
✓ All tests passed!
```

### 2. View Examples

Learn how to use UuidHelper:

```bash
php examples/UuidHelperExamples.php
```

## 📚 Core Methods

### Generation

```php
use App\Utils\UuidHelper;

// Generate single UUID
$uuid = UuidHelper::generate();
// Returns: 'a3f9c8b2-4d6e-11ee-8c99-0242ac120002'

// Generate multiple UUIDs
$uuids = UuidHelper::generateBatch(10);
// Returns: ['uuid1', 'uuid2', ...]

// Generate deterministic UUID (v5)
$uuid = UuidHelper::generateV5(UuidHelper::NAMESPACE_DNS, 'example.com');
// Same input always produces same UUID
```

### Validation

```php
// Validate UUID format
if (UuidHelper::isValid($uuid)) {
    // Valid UUID
}

// Sanitize user input (trim, lowercase, validate)
$sanitized = UuidHelper::sanitize($userInput);
if ($sanitized === null) {
    // Invalid UUID
}

// Identify if value is UUID or integer ID
$type = UuidHelper::identifyType($value);
// Returns: 'uuid', 'id', or 'invalid'
```

### Comparison

```php
// Case-insensitive comparison
if (UuidHelper::equals($uuid1, $uuid2)) {
    // UUIDs match
}

// Check if nil UUID
if (UuidHelper::isNil($uuid)) {
    // UUID is 00000000-0000-0000-0000-000000000000
}
```

### Utility

```php
// Format for display
$full = UuidHelper::format($uuid, false);   // Full UUID
$short = UuidHelper::format($uuid, true);   // First 8 chars

// Get UUID version (1-5)
$version = UuidHelper::getVersion($uuid);   // e.g., 4

// Ensure UUID exists (for migrations)
$uuid = UuidHelper::ensureUuid($existingUuid);
// Returns existing if valid, generates new if invalid/null
```

### Binary Conversion (Optional)

For efficient database storage using BINARY(16) instead of CHAR(36):

```php
// Convert to binary (16 bytes vs 36 chars)
$binary = UuidHelper::toBinary($uuid);

// Convert back to string
$uuid = UuidHelper::fromBinary($binary);
```

## 🔧 Integration Examples

### In Repositories

#### Add findByUuid Method

```php
public function findByUuid(string $uuid): ?array
{
    // Validate before querying
    if (!UuidHelper::isValid($uuid)) {
        return null;
    }

    $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE uuid = :uuid");
    $stmt->execute([':uuid' => $uuid]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}
```

#### Auto-generate UUID in Create

```php
public function create(array $data): ?int
{
    // Auto-generate UUID if not provided
    if (!isset($data['uuid'])) {
        $data['uuid'] = UuidHelper::generate();
    }

    // Build and execute INSERT statement
    // ...

    return (int) $this->db->lastInsertId();
}
```

#### Include UUID in Responses

```php
public function getAll(): array
{
    $stmt = $this->db->query("
        SELECT id, uuid, title, content, created_at
        FROM {$this->table}
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
```

### In Controllers

#### Validate UUID Parameter

```php
public function show(array $user, string $uuid): void
{
    // Sanitize and validate UUID
    $sanitizedUuid = UuidHelper::sanitize($uuid);
    if (!$sanitizedUuid) {
        Response::badRequest('Invalid UUID format');
        return;
    }

    // Find by UUID
    $record = $this->repository->findByUuid($sanitizedUuid);
    if (!$record) {
        Response::notFound('Record not found');
        return;
    }

    // Authorization check (CRITICAL!)
    if (!Authorization::canAccess($user, $record)) {
        Response::forbidden();
        return;
    }

    Response::success($record);
}
```

#### Update Method

```php
public function update(array $user, string $uuid): void
{
    // Validate UUID
    $sanitizedUuid = UuidHelper::sanitize($uuid);
    if (!$sanitizedUuid) {
        Response::badRequest('Invalid UUID format');
        return;
    }

    // Find record
    $record = $this->repository->findByUuid($sanitizedUuid);
    if (!$record) {
        Response::notFound();
        return;
    }

    // Authorization
    if (!Authorization::canUpdate($user, $record)) {
        Response::forbidden();
        return;
    }

    // Get request data
    $data = Request::getBody();

    // Update by integer ID internally (performance)
    $updated = $this->repository->update($record['id'], $data);

    Response::success($updated);
}
```

### In Routes

Update route patterns to expect UUIDs:

```php
// Before
$router->get('/course-content/{id}', [CourseContentController::class, 'show']);

// After
$router->get('/course-content/{uuid}', [CourseContentController::class, 'show']);
```

## 🛡️ Security Best Practices

### ⚠️ IMPORTANT: UUIDs Alone Are Not Enough!

UUIDs prevent **enumeration** attacks but don't prevent **unauthorized access**:

```php
// ❌ BAD - No authorization check
public function show(array $user, string $uuid): void
{
    $record = $this->repository->findByUuid($uuid);
    Response::success($record);  // Anyone can access any UUID!
}

// ✅ GOOD - Always check authorization
public function show(array $user, string $uuid): void
{
    $record = $this->repository->findByUuid($uuid);

    // Verify user can access this record
    if ($record['institution_id'] !== $user['institution_id']) {
        Response::forbidden();
        return;
    }

    // Additional role-based checks
    if (!Authorization::canView($user, $record)) {
        Response::forbidden();
        return;
    }

    Response::success($record);
}
```

### Always Validate UUIDs

```php
// ✅ Sanitize user input
$uuid = UuidHelper::sanitize($_GET['uuid']);
if (!$uuid) {
    Response::badRequest('Invalid UUID');
    return;
}

// ✅ Or validate explicitly
if (!UuidHelper::isValid($uuid)) {
    Response::badRequest('Invalid UUID format');
    return;
}
```

### Use Integer IDs Internally

```php
// ✅ Accept UUID in API
public function update(array $user, string $uuid): void
{
    $record = $this->repository->findByUuid($uuid);

    // Use integer ID for database operations (foreign keys, joins)
    $this->repository->update($record['id'], $data);
    $relatedRecords = $this->otherRepository->findByRecordId($record['id']);
}
```

## 📋 Next Steps

After implementing UuidHelper, you need to:

1. ✅ **UuidHelper created** (current step)
2. ⏳ **Update Repositories** - Add `findByUuid()` to 13 repositories
3. ⏳ **Update Controllers** - Change parameters from `int $id` to `string $uuid`
4. ⏳ **Add Authorization** - Implement permission checks (CRITICAL!)
5. ⏳ **Update Routes** - Change `{id}` to `{uuid}` in route patterns
6. ⏳ **Test All Endpoints** - Verify 230+ endpoints work with UUIDs

## 🔍 Constants

```php
// Nil UUID (all zeros)
UuidHelper::NIL  // '00000000-0000-0000-0000-000000000000'

// Namespace UUIDs for deterministic generation (v5)
UuidHelper::NAMESPACE_DNS   // For domain names
UuidHelper::NAMESPACE_URL   // For URLs
UuidHelper::NAMESPACE_OID   // For OIDs
UuidHelper::NAMESPACE_X500  // For X.500 DNs
```

## 🧪 Testing Checklist

- [x] Generate UUID returns valid UUID
- [x] Generated UUIDs are unique
- [x] Validation correctly identifies valid/invalid UUIDs
- [x] Sanitization trims and lowercases
- [x] Type identification works for UUID/ID/invalid
- [x] UUID comparison is case-insensitive
- [x] Batch generation creates unique UUIDs
- [x] Binary conversion is reversible
- [x] UUID v5 is deterministic
- [x] Nil UUID is recognized

## 📖 API Changes

### Before (Integer IDs)

```
GET /api/course-content/1
GET /api/subscriptions/2
POST /api/assignments/3/submit
```

**Problem**: Easy to enumerate (1, 2, 3, 4...)

### After (UUIDs)

```
GET /api/course-content/a3f9c8b2-4d6e-11ee-8c99-0242ac120002
GET /api/subscriptions/b7d4e9f3-5e7f-22ff-9d10-1353bd231113
POST /api/assignments/c8e5f0g4-6f8g-33hh-0e21-2464ce342224/submit
```

**Benefit**: Impossible to predict valid IDs

## ❓ FAQ

**Q: Should I replace integer IDs in the database?**  
A: No! Keep integer IDs as primary keys for performance. UUIDs are additional columns for external API use.

**Q: What about foreign keys?**  
A: Foreign keys remain integer-based (e.g., `user_id`, `class_id`). Only expose UUIDs in API responses.

**Q: Are UUIDs slower than integers?**  
A: Slightly, but we added indexes on UUID columns. For API lookups, the security benefit outweighs minimal performance cost.

**Q: Can users still access data they shouldn't?**  
A: YES if you don't implement authorization! UUIDs prevent guessing IDs, but you MUST check permissions.

**Q: What UUID version should I use?**  
A: UUID v4 (random) for most cases. Use v5 (deterministic) only if you need reproducible UUIDs from existing data.

---

**Status**: ✅ UuidHelper complete and tested  
**Next**: Update repositories with `findByUuid()` methods
