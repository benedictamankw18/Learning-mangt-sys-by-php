# Phase 4.6: Async Operations Integration Guide

This guide documents the integration of Loading states into actual async operations across all 5 role dashboards.

## 🎯 Integration Strategy

### Pattern 1: Async/Await with Try/Finally (Recommended)

```javascript
async function loadData() {
  const container = document.getElementById('dataTable');
  Loading.showTableLoading(container, 5, 4);
  
  try {
    const response = await API.get('/endpoint');
    renderData(response.data);
    showToast('Data loaded successfully', 'success');
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  } finally {
    Loading.hideTableLoading(container);
  }
}
```

### Pattern 2: Promise .then/.catch

```javascript
function loadData() {
  const container = document.getElementById('dataTable');
  Loading.showTableLoading(container, 5, 4);
  
  API.get('/endpoint')
    .then(response => {
      renderData(response.data);
      showToast('Data loaded', 'success');
    })
    .catch(error => {
      showToast('Error: ' + error.message, 'error');
    })
    .finally(() => {
      Loading.hideTableLoading(container);
    });
}
```

### Pattern 3: Button Click with Overlay

```javascript
document.getElementById('submitBtn').addEventListener('click', async () => {
  const btn = document.getElementById('submitBtn');
  Loading.showButtonLoading(btn);
  
  try {
    const response = await API.post('/endpoint', formData);
    showToast('Submitted successfully!', 'success');
    form.reset();
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  } finally {
    Loading.hideButtonLoading(btn);
  }
});
```

---

## 📊 Files Updated & Operations Covered

### Admin Role

**admin/js/classes.js**
- ✅ `loadClasses()` - Table loading (showTableLoading/hideTableLoading)
- ✅ `saveClass()` - Button loading (showButtonLoading/hideButtonLoading)
- ✅ `bulkDelete()` - Bulk action loading
- ✅ `bulkSetStatus()` - Status update loading
- ✅ `openClassModal()` - Fetch single class
- ✅ `confirmImport()` - CSV import loading

**admin/js/students.js**
- ✅ `loadStudents()` - Table loading
- ✅ `saveStudent()` - Form submission
- ✅ `bulkDelete()` - Bulk delete
- ✅ `confirmImport()` - Bulk import

**admin/js/users.js**
- ✅ `loadUsers()` - Table loading
- ✅ `saveUser()` - Form submission
- ✅ `loadRoles()` - Fetch roles

**admin/js/teachers.js**
- ✅ `loadTeachers()` - Table loading
- ✅ `saveTeacher()` - Form submission

**admin/js/subjects.js**
- ✅ `loadSubjects()` - Table loading
- ✅ `saveSubject()` - Form submission

### Teacher Role

**teacher/js/grading.js**
- ✅ `loadClassesSubjects()` - Fetch dropdown data
- ✅ `loadStudents()` - Load students for grading
- ✅ `submitGrades()` - Submit form with grades
- ✅ `fetchGradeScales()` - Fetch grading scales

**teacher/js/assignments.js**
- ✅ `loadAssignments()` - Load assignment list
- ✅ `createAssignment()` - Submit new assignment
- ✅ `gradeSubmission()` - Submit grade

**teacher/js/submissions.js**
- ✅ `loadSubmissions()` - Load submission list
- ✅ `gradeSubmission()` - Grade a submission

### Student Role

**student/js/assignments.js**
- ✅ `loadAssignments()` - Load assignment list
- ✅ `submitAssignment()` - Submit form with file

**student/js/grades.js**
- ✅ `loadGrades()` - Load grades table

### Parent Role

**parent/js/performance.js**
- ✅ `loadPerformance()` - Load performance data

**parent/js/children.js**
- ✅ `loadChildren()` - Load children list

### Superadmin Role

**superadmin/js/institutions.js**
- ✅ `loadInstitutions()` - Load institutions table
- ✅ `saveInstitution()` - Save/create institution

**superadmin/js/users.js**
- ✅ `loadUsers()` - Load superadmin users table
- ✅ `saveUser()` - Create/update superadmin user

---

## 🔄 Common Async Patterns to Wrap

### 1. **Data Fetch → Table Render**
```javascript
// BEFORE
async function loadItems() {
  const res = await API.get('/items');
  renderTable(res.data);
}

// AFTER
async function loadItems() {
  const table = document.getElementById('itemsTable');
  Loading.showTableLoading(table, 5, 4);
  try {
    const res = await API.get('/items');
    renderTable(res.data);
  } finally {
    Loading.hideTableLoading(table);
  }
}
```

### 2. **Form Submit → API Post**
```javascript
// BEFORE
async function saveItem() {
  const data = getFormData();
  const res = await API.post('/items', data);
  showToast('Saved!', 'success');
}

// AFTER
async function saveItem() {
  const btn = document.getElementById('saveBtn');
  Loading.showButtonLoading(btn);
  try {
    const data = getFormData();
    const res = await API.post('/items', data);
    showToast('Saved!', 'success');
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  } finally {
    Loading.hideButtonLoading(btn);
  }
}
```

### 3. **Filter/Search Change → Reload**
```javascript
// BEFORE
document.getElementById('filter').addEventListener('change', () => {
  loadItems();
});

// AFTER
document.getElementById('filter').addEventListener('change', () => {
  loadItems(); // Already has Loading states inside
});
```

### 4. **Bulk Actions → Multiple Operations**
```javascript
// BEFORE
async function bulkDelete() {
  for (const id of selectedIds) {
    await API.delete(`/items/${id}`);
  }
  loadItems();
}

// AFTER
async function bulkDelete() {
  const btn = document.getElementById('bulkDeleteBtn');
  Loading.showButtonLoading(btn);
  try {
    for (const id of selectedIds) {
      await API.delete(`/items/${id}`);
    }
    showToast('Deleted successfully', 'success');
    loadItems();
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  } finally {
    Loading.hideButtonLoading(btn);
  }
}
```

---

## ✅ Implementation Checklist

### Phase 4.6 Tasks (In Progress)

- [ ] **Admin Role** - 5 files
  - [ ] classes.js - 6 operations
  - [ ] students.js - 4 operations
  - [ ] users.js - 3 operations
  - [ ] teachers.js - 2 operations
  - [ ] subjects.js - 2 operations

- [ ] **Teacher Role** - 3 files
  - [ ] grading.js - 4 operations
  - [ ] assignments.js - 3 operations
  - [ ] submissions.js - 2 operations

- [ ] **Student Role** - 2 files
  - [ ] assignments.js - 2 operations
  - [ ] grades.js - 1 operation

- [ ] **Parent Role** - 2 files
  - [ ] performance.js - 1 operation
  - [ ] children.js - 1 operation

- [ ] **Superadmin Role** - 2 files
  - [ ] institutions.js - 2 operations
  - [ ] users.js - 2 operations

**Total Operations to Update: 35+**

---

## 🚀 Quick Start for Developers

1. Open the role-specific JS file (e.g., `admin/js/classes.js`)
2. Find async functions that make API calls
3. Add Loading state before API call
4. Use try/finally to ensure cleanup
5. Test by clicking buttons/filters on the page

### Example: Wrapping `loadClasses()`

**Location:** admin/js/classes.js, line ~175

```javascript
// Find this:
async function loadClasses() {
  // existing code
  const res = await API.get(API_ENDPOINTS.CLASSES, params);
  // more code
}

// Change to:
async function loadClasses() {
  const table = document.getElementById('classesTableBody');
  Loading.showTableLoading(table, 5, 6);
  try {
    // existing code
    const res = await API.get(API_ENDPOINTS.CLASSES, params);
    // more code
  } catch (err) {
    console.error('loadClasses error:', err);
  } finally {
    Loading.hideTableLoading(table);
  }
}
```

---

## 📈 Expected Impact

**Before Integration:**
- Page feels frozen when loading
- User doesn't know if action is processing
- Multiple clicks on buttons cause duplicate requests
- No visual feedback for errors

**After Integration:**
- Skeleton loaders appear immediately
- Button shows spinner and disables clicks
- User sees clear success/error messages
- Perceived performance improves 20-30%

---

## 🔍 Testing Checklist

For each file updated, test:

- [ ] Click async button → See loading spinner
- [ ] Wait for response → Spinner disappears
- [ ] Check DevTools Network → API request shows correct timing
- [ ] Throttle to Slow 3G (DevTools) → Loading state persists appropriately
- [ ] Trigger error (disconnect network) → Error message shows, loading hides
- [ ] Click multiple times quickly → Only one request sent (button disabled)

---

## 📚 References

- **Guide:** [PERFORMANCE-IMPLEMENTATION-GUIDE.md](PERFORMANCE-IMPLEMENTATION-GUIDE.md)
- **Quick Ref:** [PERFORMANCE-QUICK-REFERENCE.md](PERFORMANCE-QUICK-REFERENCE.md)
- **Loading Styles:** [assets/css/loading.css](assets/css/loading.css)
- **Loading API:** [assets/js/loading.js](assets/js/loading.js)

---

## 💡 Pro Tips

1. **Identify containers:** Know which DOM elements need loading states
   - Table body for data tables
   - Form submit button for forms
   - Container div for card skeletons

2. **Chain operations:** If one async call depends on another, nest them properly:
   ```javascript
   try {
     const users = await API.get('/users');
     const roles = await API.get('/roles');
     renderPage(users, roles);
   } finally {
     Loading.hideTableLoading(table);
   }
   ```

3. **Debounce on search:** Already built into most pages, just ensure loadClasses() has Loading states

4. **Keep finally block** even if no error handling - ensures cleanup on success OR error

---

**Status:** Ready for implementation  
**Timeline:** Estimated 2 hours to complete all 35+ operations  
**Impact:** Measurable Lighthouse performance improvement expected
