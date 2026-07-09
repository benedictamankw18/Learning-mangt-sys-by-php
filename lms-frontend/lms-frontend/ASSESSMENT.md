#### 📚 Assessment Categories & Weights Management Guide

**Overview:**
Assessment Categories define the types of assessments used in grading (e.g., Class Tests, Assignments, Exams). Each category has a weight percentage that determines its contribution to the final grade. Weights must sum to 100% and each weight must be at least 1%.

**Access Point:**
Admin Dashboard → Assessments → Assessment Categories section (bottom of the admin/assessments.html page)

---

**Creating a New Assessment Category:**

1. Navigate to Admin Dashboard → Assessments page
2. Scroll to "Assessment Categories" section
3. Click the "Add Category" button (if visible) or fill the weight configuration table
4. Enter the following information:
   - **Category Name** — The type of assessment (e.g., "Quiz", "Midterm Exam", "Project")
   - **Weight Percentage** — The percentage this category contributes to final grade
     - Minimum: 1%
     - Must be a whole number or decimal (e.g., 15, 25.5)
     - All weights for all categories combined should equal 100%
5. Click "Save" to store in database
6. System will validate:
   - Weight must be ≥ 1% (if less, it will be set to 1%)
   - Weight cannot exceed 100%
7. Confirmation message appears: "Category saved successfully"

**Editing an Existing Assessment Category:**

1. Go to Admin Dashboard → Assessments page
2. Find the category in the Assessment Categories list
3. Click the weight value or "Edit" button for that category
4. Modify the weight percentage as needed
   - Minimum allowed: 1%
   - Can increase or decrease the percentage
5. Click "Update" or "Save Changes"
6. System validates the new weight
7. Changes are immediately reflected in the database
8. Confirmation: "Category updated successfully"

**Example Workflow:**

- Existing: "Class Test" = 15%
- Edit to: "Class Test" = 20%
- System auto-recalculates total weight display
- If total exceeds 100%, system shows warning

---

**Deleting an Assessment Category:**

1. Go to Admin Dashboard → Assessments page
2. Find the category to delete in Assessment Categories list
3. Click the "Delete" button (trash icon) for that category
4. Confirm deletion in popup dialog
   - Warning: "Deleting this category will affect existing assessments"
   - Confirmation required
5. Category is removed from database
6. Weights are recalculated
7. Message: "Category deleted successfully"

**Important Notes:**

- Cannot delete category if assessments exist with that category type
- Must maintain at least one category for each institution
- Deletion is permanent and cannot be undone

---

**Validation Rules:**

| Rule                  | Requirement          | Behavior                                  |
| --------------------- | -------------------- | ----------------------------------------- |
| **Weight Min**        | ≥ 1                  | Values < 1 auto-corrected to 1            |
| **Weight Max**        | ≤ 100                | Cannot save if > 100                      |
| **Weight Type**       | Numeric              | Decimal allowed (e.g., 15.5)              |
| **Category Name**     | Required             | Cannot be empty                           |
| **Total Weight**      | Should = 100%        | Optional; warning if not 100%             |
| **Institution Scope** | Institution-specific | Cannot see other institutions' categories |

---

**Technical Implementation:**

**Frontend Files:**

- `admin/page/assessments.html` — UI for category weight editor
- `admin/js/assessments.js` — Logic for load/save/delete operations

**Backend API Endpoints:**

```
GET    /api/assessment-categories             → Fetch all categories for institution
GET    /api/assessment-categories/{id}        → Fetch single category
POST   /api/assessment-categories             → Create new category
PUT    /api/assessment-categories/{id}        → Update existing category
DELETE /api/assessment-categories/{id}        → Delete category
```

**Database Table:** `assessment_categories`

```sql
Columns:
  - category_id (int, AUTO_INCREMENT)
  - category_name (varchar)
  - institution_id (int, NOT NULL) — Multi-tenant scoping
  - weight_percentage (decimal 5,2) — Stored as 15.00, 20.50, etc.
  - description (text, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)
```

**JavaScript API Helper:**

```javascript
// Load all categories for current institution
const categories = await AssessmentCategoryAPI.getAll();

// Fetch single category
const category = await AssessmentCategoryAPI.getById(categoryId);

// Create new category
await AssessmentCategoryAPI.create({
  category_name: "Quiz",
  weight_percentage: 15,
});

// Update category weights
await AssessmentCategoryAPI.update(categoryId, {
  weight_percentage: 20,
});

// Delete category
await AssessmentCategoryAPI.delete(categoryId);
```

**Error Handling:**

- **400 Bad Request** — Weight < 1% or > 100%, missing required fields
- **403 Forbidden** — Attempting to access category from different institution
- **404 Not Found** — Category doesn't exist
- **500 Server Error** — Database or validation failure

---

**Multi-Tenant Scoping (Important):**

- Each institution has its own set of assessment categories
- Categories created in Institution A are NOT visible to Institution B
- Weight percentages are calculated per institution
- API automatically filters by institution_id from authenticated user

---

Teacher Assessment Management Guide
let alter the table to fit this following, assessments admin create/edit/delete assessments_categories and can read-only assessments recorded and filter by classes and subjects, teacher recorded assessment, the teacher can select passed assignment, or passed quiz taken on the site as the assessment or manual enter the scores, how it happen, teacher enter the assessment page,
The page;

1. Display two combo box for classes/Subjects filter and Assessment Categories filter (Assessment mode)
   and a Submit button to apply the filters, Below display the institution Logo at the center of the page

2. When the teacher select a class/subjects and Assessment Category and click submit, the page will display the list of students in that class/subject and selected assessment category, with the following columns:

- Student Name
- Assessment Type 1 (e.g., Assignment, Quiz)
- Assessment Type 2 (e.g., Assignment, Quiz) (if Selected Assessment Category has more than one type)
- Assessment Type 3 (e.g., Assignment, Quiz) (if Selected Assessment Category has more than one type)
- Assessment Type 4 (e.g., Assignment, Quiz) (if Selected Assessment Category has more than one type)
  ***
  The Assessment category (mode) must be a combo box with checkboxes to select one or more assessment types (e.g., Assignment, Quiz, Midterm Exam, Final Exam) category. The teacher can select multiple assessment categories to display in the table. The system will display the corresponding assessment types as columns in the table based on the selected categories.
  When the submit button is clicked, the logo will be hidden and the search bar and table will be displayed with the students and their assessment scores for the selected categories. With a input box type=number under the assessment category headers each allowing user to enter max_score before removing the readonly/display attribute on the score cells of that assessment_category for each student. The teacher can then enter or edit the scores for each student and assessment type directly in the table cells. The scores will be saved automatically when the teacher moves to the next cell or clicks outside the cell. The system will validate the entered scores to ensure they are within the acceptable range (e.g., 0-max_score) and will display an error message if the input is invalid.

Each Assessment category (mode) must have an icon at the right side in the table header, if clicked, a popup will appear displaying "Auto Assessment " with description "Select one to Auto fill the Assessment mode" and populate all graded assignments or quizzes, for that selected class/subject, Single select,
Arrange in flexbox with the following:

- Assignment or Quiz icon with the label "Assignment" or "Quiz"
- Assignment or Quiz Title (e.g., "Assignment 1", "Quiz 2")
- Assignment or Quiz description (if available)
- with a radio button at the top left corner of each box to select one of the available assignments or quizzes for auto-filling the scores in the table.

Add a select button at the bottom of the popup to confirm the selection and auto-fill the scores in the table based on the selected assignment or quiz. The system will fetch the scores for the selected assignment or quiz and populate the corresponding cells in the table for each student. The teacher can then review and edit the scores as needed before saving.

3. For each student, the teacher can enter the scores for each assessment type directly in the table cells. The scores will be saved automatically when the teacher moves to the next cell or clicks outside the cell.
4. The system will validate the entered scores to ensure they are within the acceptable range (e.g., 0-max_score) and will display an error message if the input is invalid.

5. add a "Save All" button at the bottom of the page to allow the teacher to save all entered scores at once. When clicked, the system will validate all scores and save them to the database. If any score is invalid, an error message will be displayed indicating which scores need to be corrected before saving.

6. add publish button to allow the teacher to publish the entered scores. When clicked, the system will validate all scores and if valid, it will mark the scores as published and make them visible to students in their gradebook. If any score is invalid, an error message will be displayed indicating which scores need to be corrected before publishing.

**Technical Implementation:**
**Frontend Files:**

- `teacher/page/assessments.html` — UI for teacher to manage assessments and enter scores
- `teacher/js/assessments.js` — Logic for loading students, handling score entry, and saving/publishing scores
  **Backend API Endpoints:**

```
GET    /api/teacher/assessment-categories             → Fetch assessment categories for teacher's institution
GET    /api/teacher/students?class_id={classId}&subject_id={subjectId}        → Fetch students for selected class and subject
GET    /api/teacher/assessments?class_id={classId}&subject_id={subjectId}&category_id={categoryId}        → Fetch existing assessment scores for students in selected class, subject, and category
POST   /api/teacher/assessments             → Create or update assessment scores for students
POST   /api/teacher/assessments/publish     → Publish entered scores to students' gradebooks
```

- [ ] **Create** `student/assessments.html`
  - Upcoming assessments
  - Assessment schedule
  - Past assessments with results
  - Assessment preparation materials

  - [ ] **Create** `student/exams.html`
  - Exam timetable
  - Exam venues
  - Exam instructions
  - Past exam results
  - WASSCE preparation section
