# Performance Implementation Guide - Phase 4

**Goal:** Use loading states and lazy loading to improve Lighthouse scores and user experience

## Setup

### 1. Include CSS and JS Files in Your HTML

Add these to the `<head>` section before other CSS:

```html
<!-- Loading States -->
<link rel="stylesheet" href="../assets/css/loading.css">
<script defer src="../assets/js/loading.js"></script>

<!-- Lazy Loading -->
<script defer src="../assets/js/lazy-loading.js"></script>
```

**Important:** These should be included in every page that uses async operations or images.

---

## Part 1: Loading States

### Use Case: Show feedback during async operations

### Quick Usage Examples

#### 1. Show/Hide Loading on Button

```javascript
// When user clicks a button
const button = document.getElementById('saveBtn');
button.addEventListener('click', async () => {
  Loading.showButtonLoading(button);
  
  try {
    const result = await API.post('/api/endpoint', data);
    showToast('Saved successfully!', 'success');
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  } finally {
    Loading.hideButtonLoading(button);
  }
});
```

#### 2. Show Global Loading Overlay

```javascript
// For long operations
async function importData() {
  Loading.showOverlay('Importing students...');
  
  try {
    const result = await API.post('/api/students/import', formData);
    showToast('Import complete!', 'success');
  } catch (error) {
    showToast('Import failed', 'error');
  } finally {
    Loading.hideOverlay();
  }
}
```

#### 3. Show Loading in Container

```javascript
// When loading table data
async function loadStudentGrades() {
  const container = document.getElementById('gradesTableContainer');
  Loading.showTableLoading(container, 5, 4); // 5 rows, 4 columns
  
  try {
    const response = await API.get('/api/grades');
    // Render table with response data
    renderGradesTable(response.data);
  } finally {
    Loading.hideTableLoading(container);
  }
}
```

#### 4. Show Loading on Form

```javascript
// When submitting a form
const form = document.getElementById('studentForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  Loading.showFormLoading(form);
  
  try {
    const formData = new FormData(form);
    await API.post('/api/students', Object.fromEntries(formData));
    showToast('Student created!', 'success');
  } finally {
    Loading.hideFormLoading(form);
  }
});
```

### API Reference

#### Global Methods

```javascript
// Show/hide global overlay
Loading.showOverlay('Custom message');
Loading.hideOverlay();

// Button loading
Loading.showButtonLoading(buttonElement);
Loading.hideButtonLoading(buttonElement);

// Container loading with custom content
Loading.showContainerLoading(container, 'Loading data...');
Loading.hideContainerLoading(container);

// Form loading (disables all inputs)
Loading.showFormLoading(form);
Loading.hideFormLoading(form);

// Table skeleton loader
Loading.showTableLoading(table, 5, 4); // rows, columns
Loading.hideTableLoading(table);

// Card skeleton loaders
Loading.showCardSkeletons(container, 3); // 3 cards
Loading.hideCardSkeletons(container);

// Utility: Wrap promise with loading state
await Loading.withLoading(
  API.get('/api/data'),
  {
    overlay: true,
    message: 'Fetching data...'
  }
);
```

### Real-World Example: Loading Class Assignments

```javascript
async function loadAssignments(classId) {
  // Show skeleton in table
  const table = document.getElementById('assignmentsTable');
  Loading.showTableLoading(table, 3, 5);
  
  try {
    // Fetch from API
    const response = await API.get(`/api/classes/${classId}/assignments`);
    
    // Clear loading state
    Loading.hideTableLoading(table);
    
    // Render assignments
    renderAssignmentsTable(response.data);
    showToast('Assignments loaded!', 'success');
    
  } catch (error) {
    Loading.hideTableLoading(table);
    showToast('Failed to load assignments', 'error');
  }
}
```

---

## Part 2: Lazy Loading

### Use Case: Load images only when they enter viewport

### Quick Usage Examples

#### 1. Basic Image Lazy Loading

Change from:
```html
<img src="path/to/image.jpg" alt="Profile">
```

To:
```html
<img data-src="path/to/image.jpg" alt="Profile">
```

That's it! Images with `data-src` are automatically lazy-loaded.

#### 2. Responsive Images (srcset)

```html
<img 
  data-src="image-small.jpg"
  data-srcset="image-small.jpg 480w, image-large.jpg 1200w"
  alt="Hero Image"
>
```

#### 3. Background Images

```html
<div data-bg="path/to/background.jpg" style="width: 100%; height: 300px;">
  Content here
</div>
```

#### 4. Lazy Loading Iframes

```html
<iframe 
  data-src="https://example.com/embed"
  width="100%" 
  height="400"
>
</iframe>
```

### Implementation Checklist

- [ ] Add `data-src` to all non-critical images
- [ ] Use `data-srcset` for responsive images
- [ ] Use `data-bg` for background images
- [ ] Remove `src` attribute (or keep placeholder)
- [ ] Test on slow network (Chrome DevTools throttling)

### Real-World Examples

#### Student Avatar in List

```html
<!-- Before -->
<img src="/uploads/avatar-123.jpg" alt="John Doe">

<!-- After -->
<img data-src="/uploads/avatar-123.jpg" alt="John Doe">
```

#### Course Material Thumbnails

```html
<!-- Before -->
<img src="/materials/thumbnail.jpg" alt="Course Material">

<!-- After -->
<img 
  data-src="/materials/thumbnail.jpg"
  data-srcset="/materials/thumbnail-small.jpg 300w, /materials/thumbnail-large.jpg 800w"
  alt="Course Material"
>
```

#### Hero Section Background

```html
<!-- Before -->
<div style="background-image: url(/assets/hero.jpg);">

<!-- After -->
<div data-bg="/assets/hero.jpg">
```

---

## Part 3: CSS Styling

### Loading Spinner Sizes

```html
<!-- Default size (20px) -->
<div class="loading-spinner"></div>

<!-- Small (16px) -->
<div class="loading-spinner sm"></div>

<!-- Large (32px) -->
<div class="loading-spinner lg"></div>

<!-- White variant -->
<div class="loading-spinner white"></div>
```

### Skeleton Loaders

For more control, manually create skeleton loaders:

```html
<!-- Text skeleton -->
<div class="skeleton text"></div>

<!-- Title skeleton -->
<div class="skeleton text title"></div>

<!-- Card skeleton -->
<div class="skeleton-card">
  <div class="skeleton-card-header">
    <div class="skeleton skeleton-card-avatar"></div>
    <div class="skeleton-card-title" style="flex: 1;">
      <div class="skeleton" style="height: 1rem;"></div>
      <div class="skeleton" style="height: 0.875rem; width: 70%;"></div>
    </div>
  </div>
</div>

<!-- Table row skeleton -->
<div class="skeleton-table-row" style="--columns: 4">
  <div class="skeleton-table-cell">
    <div class="skeleton"></div>
  </div>
  <!-- repeat for each column -->
</div>
```

---

## Part 4: Best Practices

### ✅ DO:
- Show loading state for every async operation
- Use skeletons for table/card heavy content
- Lazy load images below the fold
- Use appropriate loading UI (overlay vs container vs button)
- Hide loading state even on error (in finally block)

### ❌ DON'T:
- Forget to hide loading state (causes frozen UI)
- Lazy load images above the fold (LCP issue)
- Show empty state without explanation
- Use multiple loading overlays simultaneously
- Lazy load critical images needed immediately

### Performance Impact

```
Before optimization:
- All images loaded at pageload
- No feedback during data fetching
- Lighthouse Performance: ~60

After optimization:
- Images loaded on-demand
- Clear loading feedback
- Lighthouse Performance: ~85+
```

---

## Part 5: Integration Checklist

### Pages Using Async Operations

- [ ] `admin/dashboard.html` - Add loading to data fetch
- [ ] `teacher/grading.html` - Add loading to grade submission
- [ ] `student/assignments.html` - Add loading to assignment load
- [ ] `parent/performance.html` - Add loading to performance fetch
- [ ] All form submissions - Add button loading

### Images to Lazy Load

- [ ] Logo images (not critical)
- [ ] User avatars in lists
- [ ] Course thumbnails
- [ ] Chart/icon graphics (below fold)
- [ ] Hero images (keep src as placeholder)

### Testing

1. **Slow Network**: Chrome DevTools > Network > Throttle to "Slow 3G"
2. **Lighthouse**: Run Lighthouse audit
3. **Visual**: Verify loading states appear/disappear correctly
4. **Accessibility**: Tab through and verify aria-busy attributes

---

## Part 6: Troubleshooting

### Loading State Doesn't Appear

**Problem:** Button shows no loading state  
**Solution:** Check if `loading.js` is loaded before your script

```html
<!-- Make sure loading.js is loaded first -->
<script defer src="../assets/js/loading.js"></script>
<script defer src="your-page.js"></script>
```

### Images Not Loading

**Problem:** Images stay as skeleton  
**Solution:** Check browser console for CORS errors, verify image paths

```javascript
// Debug: Force load an image
LazyLoad.loadNow(document.querySelector('img[data-src]'));
```

### Overlay Doesn't Hide

**Problem:** Loading overlay stuck on screen  
**Solution:** Ensure hideOverlay() is called in finally block

```javascript
// WRONG:
await API.get('/data');
Loading.hideOverlay(); // Not called on error

// CORRECT:
try {
  await API.get('/data');
} finally {
  Loading.hideOverlay(); // Always called
}
```

---

## Summary

| Feature | When to Use | Example |
|---------|------------|---------|
| `showButtonLoading()` | Form/action buttons | Save, Submit, Delete |
| `showOverlay()` | Long operations | Bulk import, Sync |
| `showTableLoading()` | Table data fetch | Load grades, Reports |
| `showCardSkeletons()` | Multiple cards | Dashboard stats |
| `img[data-src]` | Non-critical images | Avatars, thumbnails |
| `[data-bg]` | Background images | Hero sections |

---

## Next: Performance Metrics

Once implemented, measure impact:

```javascript
// Monitor Largest Contentful Paint (LCP)
new PerformanceObserver(list => {
  const entry = list.getEntries()[0];
  console.log('LCP:', entry.startTime);
}).observe({ entryTypes: ['largest-contentful-paint'] });

// Check loading time
console.time('dataFetch');
await API.get('/data');
console.timeEnd('dataFetch');
```

For Lighthouse audit: DevTools > Lighthouse > Generate Report
