<?php

/**
 * UUID Helper - Quick Test
 * 
 * Run this file to test UuidHelper functionality
 * Usage: php tests/UuidHelperTest.php
 */

require_once __DIR__ . '/../src/Utils/UuidHelper.php';

use App\Utils\UuidHelper;

// Color output helpers
function green($text)
{
    return "\033[32m$text\033[0m";
}
function red($text)
{
    return "\033[31m$text\033[0m";
}
function yellow($text)
{
    return "\033[33m$text\033[0m";
}

$passed = 0;
$failed = 0;

function test($name, $condition)
{
    global $passed, $failed;
    if ($condition) {
        echo green("✓") . " $name\n";
        $passed++;
    } else {
        echo red("✗") . " $name\n";
        $failed++;
    }
}

echo "\n" . yellow("=== UUID Helper Tests ===") . "\n\n";

// Test 1: Generate UUID
$uuid = UuidHelper::generate();
test("Generate UUID returns string", is_string($uuid));
test("Generated UUID has correct length (36)", strlen($uuid) === 36);
test("Generated UUID is valid", UuidHelper::isValid($uuid));
test("Generated UUID is version 4", UuidHelper::getVersion($uuid) === 4);

// Test 2: Validate UUID
test("Valid UUID passes validation", UuidHelper::isValid('a3f9c8b2-4d6e-11ee-8c99-0242ac120002'));
test("Invalid UUID fails validation", !UuidHelper::isValid('not-a-uuid'));
test("Empty string fails validation", !UuidHelper::isValid(''));

// Test 3: Sanitize UUID
$sanitized = UuidHelper::sanitize('  A3F9C8B2-4D6E-11EE-8C99-0242AC120002  ');
test("Sanitize trims and lowercases", $sanitized === 'a3f9c8b2-4d6e-11ee-8c99-0242ac120002');
test("Sanitize returns null for invalid", UuidHelper::sanitize('invalid') === null);
test("Sanitize returns null for non-string", UuidHelper::sanitize(123) === null);

// Test 4: Identify type
test("Identify UUID type", UuidHelper::identifyType('a3f9c8b2-4d6e-11ee-8c99-0242ac120002') === 'uuid');
test("Identify integer ID type", UuidHelper::identifyType(123) === 'id');
test("Identify string ID type", UuidHelper::identifyType('123') === 'id');
test("Identify invalid type", UuidHelper::identifyType('invalid') === 'invalid');

// Test 5: Compare UUIDs
$uuid1 = 'a3f9c8b2-4d6e-11ee-8c99-0242ac120002';
$uuid2 = 'A3F9C8B2-4D6E-11EE-8C99-0242AC120002';
$uuid3 = 'b7d4e9f3-5e7f-22ff-9d10-1353bd231113';
test("Compare equal UUIDs (case-insensitive)", UuidHelper::equals($uuid1, $uuid2));
test("Compare different UUIDs", !UuidHelper::equals($uuid1, $uuid3));

// Test 6: Generate batch
$batch = UuidHelper::generateBatch(5);
test("Generate batch returns array", is_array($batch));
test("Generate batch returns correct count", count($batch) === 5);
test("All batch UUIDs are valid", count(array_filter($batch, fn($u) => UuidHelper::isValid($u))) === 5);
test("All batch UUIDs are unique", count($batch) === count(array_unique($batch)));

// Test 7: Ensure UUID
$existing = 'a3f9c8b2-4d6e-11ee-8c99-0242ac120002';
$ensured1 = UuidHelper::ensureUuid($existing);
$ensured2 = UuidHelper::ensureUuid(null);
$ensured3 = UuidHelper::ensureUuid('invalid');
test("Ensure UUID keeps valid UUID", $ensured1 === $existing);
test("Ensure UUID generates for null", UuidHelper::isValid($ensured2));
test("Ensure UUID generates for invalid", UuidHelper::isValid($ensured3));

// Test 8: Format UUID
$uuid = 'a3f9c8b2-4d6e-11ee-8c99-0242ac120002';
test("Format full returns full UUID", UuidHelper::format($uuid, false) === $uuid);
test("Format short returns first 8 chars", UuidHelper::format($uuid, true) === 'a3f9c8b2');
test("Format invalid returns error message", UuidHelper::format('invalid', false) === 'Invalid UUID');

// Test 9: Binary conversion
$uuid = 'a3f9c8b2-4d6e-11ee-8c99-0242ac120002';
$binary = UuidHelper::toBinary($uuid);
$back = UuidHelper::fromBinary($binary);
test("Binary conversion is reversible", $uuid === $back);
test("Binary is 16 bytes", strlen($binary) === 16);

// Test 10: UUID v5 (deterministic)
$uuid5a = UuidHelper::generateV5(UuidHelper::NAMESPACE_DNS, 'example.com');
$uuid5b = UuidHelper::generateV5(UuidHelper::NAMESPACE_DNS, 'example.com');
test("UUID v5 is deterministic", UuidHelper::equals($uuid5a, $uuid5b));
test("UUID v5 is valid", UuidHelper::isValid($uuid5a));
test("UUID v5 is version 5", UuidHelper::getVersion($uuid5a) === 5);

// Test 11: Nil UUID
test("Nil UUID is valid", UuidHelper::isValid(UuidHelper::NIL));
test("Nil UUID is recognized", UuidHelper::isNil(UuidHelper::NIL));
test("Generated UUID is not nil", !UuidHelper::isNil(UuidHelper::generate()));

// Test 12: Multiple generations are unique
$uuid1 = UuidHelper::generate();
$uuid2 = UuidHelper::generate();
$uuid3 = UuidHelper::generate();
test("Multiple UUIDs are unique", $uuid1 !== $uuid2 && $uuid2 !== $uuid3 && $uuid1 !== $uuid3);

// Summary
echo "\n" . yellow("=== Test Summary ===") . "\n";
echo green("Passed: $passed") . "\n";
if ($failed > 0) {
    echo red("Failed: $failed") . "\n";
    exit(1);
} else {
    echo green("All tests passed!") . "\n";
    exit(0);
}
