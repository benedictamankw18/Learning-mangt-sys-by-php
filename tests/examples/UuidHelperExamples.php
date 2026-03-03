<?php

/**
 * UUID Helper - Usage Examples
 * 
 * This file demonstrates how to use the UuidHelper class
 * in your repositories, controllers, and other components.
 */

require_once __DIR__ . '/../Utils/UuidHelper.php';

use App\Utils\UuidHelper;

echo "=== UUID Helper Usage Examples ===\n\n";

// ========================================
// 1. GENERATE NEW UUIDS
// ========================================
echo "1. Generating UUIDs:\n";
$uuid = UuidHelper::generate();
echo "   Single UUID: $uuid\n";

$batch = UuidHelper::generateBatch(3);
echo "   Batch of 3: " . implode(', ', $batch) . "\n\n";

// ========================================
// 2. VALIDATE UUIDS
// ========================================
echo "2. Validating UUIDs:\n";
$validUuid = 'a3f9c8b2-4d6e-11ee-8c99-0242ac120002';
$invalidUuid = 'not-a-uuid';

echo "   '$validUuid' is valid: " . (UuidHelper::isValid($validUuid) ? 'Yes' : 'No') . "\n";
echo "   '$invalidUuid' is valid: " . (UuidHelper::isValid($invalidUuid) ? 'Yes' : 'No') . "\n\n";

// ========================================
// 3. SANITIZE USER INPUT
// ========================================
echo "3. Sanitizing user input:\n";
$userInput1 = '  A3F9C8B2-4D6E-11EE-8C99-0242AC120002  '; // uppercase with spaces
$userInput2 = 'invalid-uuid-123';

$sanitized1 = UuidHelper::sanitize($userInput1);
$sanitized2 = UuidHelper::sanitize($userInput2);

echo "   Input: '$userInput1'\n";
echo "   Sanitized: " . ($sanitized1 ?? 'null') . "\n";
echo "   Input: '$userInput2'\n";
echo "   Sanitized: " . ($sanitized2 ?? 'null') . "\n\n";

// ========================================
// 4. IDENTIFY TYPE (UUID vs ID)
// ========================================
echo "4. Identifying type:\n";
$values = [
    'a3f9c8b2-4d6e-11ee-8c99-0242ac120002',
    '12345',
    123,
    'invalid'
];

foreach ($values as $value) {
    $type = UuidHelper::identifyType($value);
    echo "   '$value' is type: $type\n";
}
echo "\n";

// ========================================
// 5. COMPARE UUIDs
// ========================================
echo "5. Comparing UUIDs:\n";
$uuid1 = 'a3f9c8b2-4d6e-11ee-8c99-0242ac120002';
$uuid2 = 'A3F9C8B2-4D6E-11EE-8C99-0242AC120002'; // Same but uppercase
$uuid3 = 'b7d4e9f3-5e7f-22ff-9d10-1353bd231113'; // Different

echo "   UUID1 == UUID2 (case-insensitive): " . (UuidHelper::equals($uuid1, $uuid2) ? 'Yes' : 'No') . "\n";
echo "   UUID1 == UUID3: " . (UuidHelper::equals($uuid1, $uuid3) ? 'Yes' : 'No') . "\n\n";

// ========================================
// 6. FORMAT UUIDs
// ========================================
echo "6. Formatting UUIDs:\n";
$uuid = 'a3f9c8b2-4d6e-11ee-8c99-0242ac120002';
echo "   Full: " . UuidHelper::format($uuid, false) . "\n";
echo "   Short: " . UuidHelper::format($uuid, true) . "\n\n";

// ========================================
// 7. GET UUID VERSION
// ========================================
echo "7. Getting UUID version:\n";
$uuid4 = UuidHelper::generate(); // v4 (random)
echo "   Generated UUID: $uuid4\n";
echo "   Version: " . UuidHelper::getVersion($uuid4) . "\n\n";

// ========================================
// 8. GENERATE DETERMINISTIC UUID (v5)
// ========================================
echo "8. Generating deterministic UUIDs (v5):\n";
$namespace = UuidHelper::NAMESPACE_DNS;
$name = 'example.com';

$uuid5a = UuidHelper::generateV5($namespace, $name);
$uuid5b = UuidHelper::generateV5($namespace, $name); // Same input

echo "   Namespace: DNS ($namespace)\n";
echo "   Name: $name\n";
echo "   UUID v5 (first):  $uuid5a\n";
echo "   UUID v5 (second): $uuid5b\n";
echo "   Are they equal? " . (UuidHelper::equals($uuid5a, $uuid5b) ? 'Yes (deterministic!)' : 'No') . "\n\n";

// ========================================
// 9. CHECK NIL UUID
// ========================================
echo "9. Checking nil UUID:\n";
$nilUuid = UuidHelper::NIL;
$normalUuid = UuidHelper::generate();

echo "   Nil UUID: $nilUuid\n";
echo "   Is nil? " . (UuidHelper::isNil($nilUuid) ? 'Yes' : 'No') . "\n";
echo "   Normal UUID is nil? " . (UuidHelper::isNil($normalUuid) ? 'Yes' : 'No') . "\n\n";

// ========================================
// 10. PRACTICAL USAGE IN REPOSITORY
// ========================================
echo "10. Practical usage examples:\n\n";

echo "--- In Repository (findByUuid method) ---\n";
echo "public function findByUuid(string \$uuid): ?array\n";
echo "{\n";
echo "    // Validate UUID before querying\n";
echo "    if (!UuidHelper::isValid(\$uuid)) {\n";
echo "        return null;\n";
echo "    }\n\n";
echo "    \$stmt = \$this->db->prepare(\"SELECT * FROM {\$this->table} WHERE uuid = :uuid\");\n";
echo "    \$stmt->execute([':uuid' => \$uuid]);\n";
echo "    return \$stmt->fetch(PDO::FETCH_ASSOC) ?: null;\n";
echo "}\n\n";

echo "--- In Repository (create method) ---\n";
echo "public function create(array \$data): ?int\n";
echo "{\n";
echo "    // Auto-generate UUID if not provided\n";
echo "    if (!isset(\$data['uuid'])) {\n";
echo "        \$data['uuid'] = UuidHelper::generate();\n";
echo "    }\n\n";
echo "    // Insert record...\n";
echo "    \$id = \$this->db->lastInsertId();\n";
echo "    return \$id;\n";
echo "}\n\n";

echo "--- In Controller (validation) ---\n";
echo "public function show(array \$user, string \$uuid): void\n";
echo "{\n";
echo "    // Sanitize and validate UUID from request\n";
echo "    \$sanitizedUuid = UuidHelper::sanitize(\$uuid);\n";
echo "    if (!\$sanitizedUuid) {\n";
echo "        Response::badRequest('Invalid UUID format');\n";
echo "        return;\n";
echo "    }\n\n";
echo "    // Query by UUID\n";
echo "    \$record = \$this->repository->findByUuid(\$sanitizedUuid);\n";
echo "    if (!\$record) {\n";
echo "        Response::notFound();\n";
echo "        return;\n";
echo "    }\n\n";
echo "    Response::success(\$record);\n";
echo "}\n\n";

echo "--- In Migration/Seeder (ensure UUID exists) ---\n";
echo "// Ensure all records have UUIDs (useful during migration)\n";
echo "foreach (\$records as \$record) {\n";
echo "    \$record['uuid'] = UuidHelper::ensureUuid(\$record['uuid'] ?? null);\n";
echo "    // Update record...\n";
echo "}\n\n";

echo "=== All examples completed! ===\n";
