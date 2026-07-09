# Teacher Analytics Data Seeding Guide

## Overview
The teacher analytics dashboard displays course performance, subject trends, and student progress based on real assignment submission data. This guide helps you populate the database with sample data.

## What Gets Created

The seed script generates:
- **3 assignments per active course** with realistic titles and descriptions
- **Student submissions** for enrolled students in each course
- **Realistic score distribution**:
  - 5% fail range (40-60)
  - 10% below average (60-75)
  - 45% average range (75-90)
  - 40% above average (85-95)

## How to Run

### Option 1: PHP CLI (Recommended)
```bash
cd d:\db\lms-api
php scripts/seed_analytics_data.php
```

**Output will show:**
- ✓ Count of assignments created
- ✓ Count of submissions created
- ✓ Average scores and stats
- ✓ Top 5 courses by performance

### Option 2: MySQL/MariaDB Client
```bash
mysql -h 127.0.0.1 -u root -p lms < d:\db\lms-api\scripts\seed_analytics_data.sql
```

### Option 3: phpMyAdmin
1. Open phpMyAdmin
2. Select the `lms` database
3. Go to **SQL** tab
4. Paste contents of `seed_analytics_data.sql`
5. Click **Go**

## Verify the Data

After running the seed script, check the data:

```sql
-- Count total assignments
SELECT COUNT(*) as assignment_count FROM assignments WHERE status = 'active';

-- Count total submissions
SELECT COUNT(*) as submission_count FROM assignment_submissions;

-- View course performance
SELECT 
    s.subject_name,
    c.class_name,
    COUNT(a.assignment_id) as assignments,
    COUNT(asub.submission_id) as submissions,
    ROUND(AVG(asub.score), 1) as avg_score
FROM class_subjects cs
INNER JOIN subjects s ON cs.subject_id = s.subject_id
INNER JOIN classes c ON cs.class_id = c.class_id
LEFT JOIN assignments a ON a.course_id = cs.course_id
LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.assignment_id
WHERE cs.status = 'active'
GROUP BY cs.course_id
ORDER BY avg_score DESC;
```

## Refresh Analytics

1. **Log in** as a teacher
2. **Navigate** to the Dashboard
3. **Click** Analytics in the sidebar
4. **Wait** for charts to load with real data
5. **Refresh** (Ctrl+R) if needed

## Troubleshooting

**Q: "Canvas is already in use" error?**
- This is a Chart.js lifecycle issue when the fragment reloads
- Hard refresh the page: **Ctrl+Shift+R**
- Or clear browser cache and reload

**Q: Charts still show zeros?**
- Ensure all scripts finished running
- Check the database for assignments: `SELECT COUNT(*) FROM assignments;`
- Verify student enrollments exist: `SELECT COUNT(*) FROM student_enrollments;`

**Q: Want to reset and re-seed?**
```sql
-- Run before re-seeding to clear old data
TRUNCATE TABLE assignment_submissions;
DELETE FROM assignments WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY);
```

## Next Steps

After seeding data:
- ✓ Teacher analytics dashboard shows real performance metrics
- ✓ Charts display class averages, subject trends, and submission stats
- ✓ Teachers can see which assignments have submission data
- ✓ Grading features can be tested with real submission records

## Files Created

- `d:\db\lms-api\scripts\seed_analytics_data.sql` - SQL seed script
- `d:\db\lms-api\scripts\seed_analytics_data.php` - PHP runner script
- `README-ANALYTICS-SEEDING.md` - This guide

## Notes

- Seed data uses realistic randomization (different each run)
- Assignments span across all active courses
- Submissions are created for all enrolled active/completed students
- Scores follow a normal distribution (more realistic data)
- Feedback comments vary based on performance tiers
