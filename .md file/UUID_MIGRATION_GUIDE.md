# UUID Migration - Quick Start Guide

## For Your Current Database (Already Running)

Since you already have the database running with data, follow these steps:

### Step 1: Backup Your Database

```bash
# Navigate to your database backup folder
cd D:\db\backups

# Create backup (Windows - use MySQL from XAMPP/WAMP)
"C:\xampp\mysql\bin\mysqldump.exe" -u root -p lms > lms_backup_before_uuid.sql

# Or if using command prompt in D:\db folder:
mysqldump -u root -p lms > backups\lms_backup_before_uuid.sql
```

### Step 2: Run the Migration

**Option A: Using MySQL Command Line**

```bash
# From D:\db folder
mysql -u root -p lms < migrations\001_add_uuids_for_security.sql
```

**Option B: Using phpMyAdmin**

1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Select `lms` database
3. Click "SQL" tab
4. Click "Choose File" and select `D:\db\migrations\001_add_uuids_for_security.sql`
5. Click "Go"
6. Wait for completion (should show green success messages)

**Option C: Using MySQL Workbench**

1. Open MySQL Workbench
2. Connect to your local database
3. File → Open SQL Script → Select `001_add_uuids_for_security.sql`
4. Execute (lightning bolt icon)

### Step 3: Verify Migration

Run this query to verify all records have UUIDs:

```sql
USE lms;

SELECT 'institutions' as table_name, COUNT(*) as total,
       SUM(CASE WHEN uuid IS NOT NULL THEN 1 ELSE 0 END) as with_uuid
FROM institutions
UNION ALL
SELECT 'users', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL THEN 1 ELSE 0 END) FROM users
UNION ALL
SELECT 'course_content', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL THEN 1 ELSE 0 END) FROM course_content;

-- Expected: total should equal with_uuid for all tables
```

### Step 4: Test Your API

After migration, test an endpoint to see the UUID:

```http
GET http://localhost:8000/api/subscriptions?status=active
Authorization: Bearer {{token}}
```

**Before Migration Response:**

```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "institution_id": 1, // ⚠️ Predictable!
        "institution_name": "Accra SHS"
      }
    ]
  }
}
```

**After PHP Updates (Next Step):**

```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "uuid": "a3f9c8b2-4d6e-11ee-8c99-0242ac120002", // ✅ Secure!
        "institution_name": "Accra SHS"
      }
    ]
  }
}
```

## What This Migration Does

1. ✅ Adds `uuid` column to 13 tables
2. ✅ Generates unique UUIDs for all existing records
3. ✅ Creates indexes for fast UUID lookups
4. ✅ Makes UUID column required and unique

## What This Does NOT Do

❌ Does NOT change your PHP code (repositories/controllers)
❌ Does NOT change your API routes
❌ Does NOT affect foreign key relationships

## Next Steps After Database Migration

You need to update the PHP application to USE the UUIDs. I'll help you with:

1. **Update Repositories** - Add `findByUuid()` methods
2. **Update Controllers** - Accept UUID parameters
3. **Update API Responses** - Return UUIDs instead of IDs
4. **Update Routes** - Change from `/api/content/{id}` to `/api/content/{uuid}`

Ready to update the PHP code?

## Rollback (If Needed)

If something goes wrong:

```bash
# Restore from backup
mysql -u root -p lms < backups\lms_backup_before_uuid.sql
```

## Estimated Time

- Backup: 10 seconds
- Migration: 30 seconds
- Verification: 5 seconds
- **Total: ~1 minute**

## Questions?

- **Q: Will this break my existing API?**
  A: Not until you update the PHP code. The migration only adds columns.

- **Q: Can I run this on production?**
  A: Yes, but backup first and run during low-traffic hours.

- **Q: Do I need to stop the PHP server?**
  A: No, the migration only affects database structure.

---

**Status:** Ready to run! 🚀

Once migration is complete, let me know and I'll help update the PHP repositories and controllers.
