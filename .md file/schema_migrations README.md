# Database Migrations

This folder contains database migration scripts for the LMS system.

## Overview

Migrations are numbered sequentially and should be applied in order:

- `001_add_uuids_for_security.sql` - Adds UUID columns to prevent ID enumeration attacks

## Migration 001: Add UUIDs for Security

### Purpose

Adds UUID (Universally Unique Identifier) columns to all major tables to prevent predictable ID enumeration attacks. UUIDs are used in API endpoints while integer IDs remain for internal operations.

### Affected Tables

- institutions
- users
- students
- teachers
- classes
- subjects
- course_content
- assignments
- grade_reports
- messages
- notifications
- events
- announcements

### When to Run

**For Existing Databases:**

```bash
# 1. Backup your database first
mysqldump -u root -p lms > backups/lms_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run the migration
mysql -u root -p lms < migrations/001_add_uuids_for_security.sql

# 3. Verify the migration completed
# Check the output - all tables should show total = with_uuid
```

**For Fresh Installations:**
No action needed! The main `lms (1).sql` file already includes UUIDs.

### Rollback

If you need to rollback this migration:

```sql
USE lms;

SET FOREIGN_KEY_CHECKS=0;

-- Remove UUID columns
ALTER TABLE institutions DROP COLUMN uuid;
ALTER TABLE users DROP COLUMN uuid;
ALTER TABLE students DROP COLUMN uuid;
ALTER TABLE teachers DROP COLUMN uuid;
ALTER TABLE classes DROP COLUMN uuid;
ALTER TABLE subjects DROP COLUMN uuid;
ALTER TABLE course_content DROP COLUMN uuid;
ALTER TABLE assignments DROP COLUMN uuid;
ALTER TABLE grade_reports DROP COLUMN uuid;
ALTER TABLE messages DROP COLUMN uuid;
ALTER TABLE notifications DROP COLUMN uuid;
ALTER TABLE events DROP COLUMN uuid;
ALTER TABLE announcements DROP COLUMN uuid;

SET FOREIGN_KEY_CHECKS=1;
```

### Post-Migration Steps

After running this migration, you need to update the PHP application:

1. **Update Repositories** - Add UUID lookup methods
2. **Update Controllers** - Accept UUID parameters instead of integer IDs
3. **Update Routes** - Change route parameters from `{id}` to `{uuid}`
4. **Test API Endpoints** - Verify all CRUD operations work with UUIDs

See the application migration guide for detailed PHP changes.

## Migration Best Practices

1. **Always backup** before running migrations
2. **Test on staging** environment first
3. **Run during low-traffic** periods
4. **Monitor application logs** after migration
5. **Keep backups** for at least 30 days

## Migration Status Tracking

Create a migrations table to track which migrations have been applied:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description VARCHAR(255)
);

-- After successfully running a migration, record it:
INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Add UUIDs for security');
```

## Troubleshooting

### Migration fails with "Duplicate column" error

The column already exists. Either:

- Skip this migration (already applied)
- Check if migration was partially applied and needs manual cleanup

### UUIDs are NULL after migration

Rerun the UPDATE statements from Step 2 in the migration file.

### Application breaks after migration

Ensure you've updated the PHP repositories and controllers to use UUIDs. Check application logs for specific errors.

## Support

For issues with migrations:

1. Check the verification query results at the end of migration
2. Review MySQL error logs: `SHOW VARIABLES LIKE 'log_error';`
3. Restore from backup if needed: `mysql -u root -p lms < backups/your_backup.sql`
