<?php

namespace App\Utils;

/**
 * UUID Helper Utility
 * 
 * Provides UUID generation, validation, and conversion utilities
 * for secure API resource identification
 */
class UuidHelper
{
    /**
     * Generate a new UUID v4
     * 
     * @return string UUID in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
     */
    public static function generate(): string
    {
        // Generate 16 random bytes
        $data = random_bytes(16);

        // Set version (4) and variant bits
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // Version 4
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // Variant 10

        // Format as UUID string
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Validate UUID format
     * 
     * @param string $uuid UUID string to validate
     * @return bool True if valid UUID format
     */
    public static function isValid(string $uuid): bool
    {
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
        return (bool) preg_match($pattern, $uuid);
    }

    /**
     * Validate and sanitize UUID input
     * 
     * @param mixed $uuid UUID to validate
     * @return string|null Valid UUID or null if invalid
     */
    public static function sanitize($uuid): ?string
    {
        if (!is_string($uuid)) {
            return null;
        }

        $uuid = trim(strtolower($uuid));

        return self::isValid($uuid) ? $uuid : null;
    }

    /**
     * Check if value is a UUID or integer ID
     * 
     * @param mixed $value Value to check
     * @return string 'uuid', 'id', or 'invalid'
     */
    public static function identifyType($value): string
    {
        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            return 'id';
        }

        if (is_string($value) && self::isValid($value)) {
            return 'uuid';
        }

        return 'invalid';
    }

    /**
     * Convert UUID to binary for efficient database storage (optional)
     * MySQL BINARY(16) is more efficient than CHAR(36)
     * 
     * @param string $uuid UUID string
     * @return string Binary representation
     */
    public static function toBinary(string $uuid): string
    {
        return hex2bin(str_replace('-', '', $uuid));
    }

    /**
     * Convert binary UUID back to string format
     * 
     * @param string $binary Binary UUID
     * @return string UUID string
     */
    public static function fromBinary(string $binary): string
    {
        $hex = bin2hex($binary);
        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0, 8),
            substr($hex, 8, 4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20)
        );
    }

    /**
     * Generate multiple UUIDs
     * 
     * @param int $count Number of UUIDs to generate
     * @return array Array of UUIDs
     */
    public static function generateBatch(int $count): array
    {
        $uuids = [];
        for ($i = 0; $i < $count; $i++) {
            $uuids[] = self::generate();
        }
        return $uuids;
    }

    /**
     * Ensure a UUID exists for a record, generate if missing
     * Useful for migration scenarios
     * 
     * @param mixed $existingUuid Existing UUID value
     * @return string Valid UUID (existing or new)
     */
    public static function ensureUuid($existingUuid): string
    {
        if (empty($existingUuid) || !self::isValid($existingUuid)) {
            return self::generate();
        }
        return $existingUuid;
    }

    /**
     * Format UUID for display (optional grouping)
     * 
     * @param string $uuid UUID to format
     * @param bool $short Show only first 8 characters
     * @return string Formatted UUID
     */
    public static function format(string $uuid, bool $short = false): string
    {
        if (!self::isValid($uuid)) {
            return 'Invalid UUID';
        }

        return $short ? substr($uuid, 0, 8) : $uuid;
    }

    /**
     * Compare two UUIDs (case-insensitive)
     * 
     * @param string $uuid1 First UUID
     * @param string $uuid2 Second UUID
     * @return bool True if UUIDs match
     */
    public static function equals(string $uuid1, string $uuid2): bool
    {
        return strcasecmp($uuid1, $uuid2) === 0;
    }

    /**
     * Get UUID version
     * 
     * @param string $uuid UUID to check
     * @return int|null Version number (1-5) or null if invalid
     */
    public static function getVersion(string $uuid): ?int
    {
        if (!self::isValid($uuid)) {
            return null;
        }

        $versionChar = $uuid[14]; // 15th character (0-indexed)
        return (int) $versionChar;
    }

    /**
     * Extract timestamp from UUID v1 (time-based)
     * Note: Only works for UUID v1, returns null for other versions
     * 
     * @param string $uuid UUID v1
     * @return int|null Unix timestamp or null if not UUID v1
     */
    public static function extractTimestamp(string $uuid): ?int
    {
        if (self::getVersion($uuid) !== 1) {
            return null;
        }

        // Extract time components from UUID v1
        $parts = explode('-', $uuid);
        $timeLow = hexdec($parts[0]);
        $timeMid = hexdec($parts[1]);
        $timeHi = hexdec(substr($parts[2], 1));

        // Combine into 60-bit timestamp
        $timestamp = ($timeHi << 48) | ($timeMid << 32) | $timeLow;

        // UUID v1 uses 100-nanosecond intervals since 1582-10-15
        // Convert to Unix timestamp (seconds since 1970-01-01)
        $unixTimestamp = ($timestamp - 0x01b21dd213814000) / 10000000;

        return (int) $unixTimestamp;
    }

    /**
     * Create a deterministic UUID v5 from a namespace and name
     * Useful for generating consistent UUIDs from existing data
     * 
     * @param string $namespace Namespace UUID
     * @param string $name Name to hash
     * @return string UUID v5
     */
    public static function generateV5(string $namespace, string $name): string
    {
        // Validate namespace UUID
        if (!self::isValid($namespace)) {
            throw new \InvalidArgumentException('Invalid namespace UUID');
        }

        // Convert namespace UUID to binary
        $namespaceBinary = self::toBinary($namespace);

        // Hash namespace + name with SHA-1
        $hash = sha1($namespaceBinary . $name);

        // Format as UUID v5
        return sprintf(
            '%08s-%04s-%04x-%04x-%012s',
            substr($hash, 0, 8),
            substr($hash, 8, 4),
            (hexdec(substr($hash, 12, 4)) & 0x0fff) | 0x5000,
            (hexdec(substr($hash, 16, 4)) & 0x3fff) | 0x8000,
            substr($hash, 20, 12)
        );
    }

    /**
     * Common namespace UUIDs for UUID v5 generation
     */
    public const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    public const NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
    public const NAMESPACE_OID = '6ba7b812-9dad-11d1-80b4-00c04fd430c8';
    public const NAMESPACE_X500 = '6ba7b814-9dad-11d1-80b4-00c04fd430c8';

    /**
     * Nil UUID (all zeros)
     */
    public const NIL = '00000000-0000-0000-0000-000000000000';

    /**
     * Check if UUID is nil
     * 
     * @param string $uuid UUID to check
     * @return bool True if nil UUID
     */
    public static function isNil(string $uuid): bool
    {
        return self::equals($uuid, self::NIL);
    }
}
