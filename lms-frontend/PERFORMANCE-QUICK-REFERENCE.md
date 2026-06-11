# Performance Quick Reference - Phase 4

**Use this card as a cheat sheet for loading states and lazy loading**

## 1-Minute Setup

```html
<!-- In <head> -->
<link rel="stylesheet" href="../assets/css/loading.css">

<!-- Before </body> -->
<script defer src="../assets/js/loading.js"></script>
<script defer src="../assets/js/lazy-loading.js"></script>
```

---

## Loading States: Common Patterns

### Pattern 1: Button Click → API Call

```javascript
button.addEventListener('click', async () => {
  Loading.showButtonLoading(button);
  try {
    await API.post('/endpoint', data);
  } finally {
    Loading.hideButtonLoading(button);
  }
});
```

### Pattern 2: Page Load → Fetch Table Data

```javascript
async function loadTable() {
  Loading.showTableLoading(table, 5, 4);
  try {
    const data = await API.get('/data');
    renderTable(data);
  } finally {
    Loading.hideTableLoading(table);
  }
}
```

### Pattern 3: Form Submit → Long Operation

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  Loading.showOverlay('Processing...');
  try {
    await API.post('/process', new FormData(form));
    showToast('Done!', 'success');
  } finally {
    Loading.hideOverlay();
  }
});
```

---

## Lazy Loading: Common Patterns

### Pattern 1: Simple Image

```html
<!-- Change src="..." to data-src="..." -->
<img data-src="/path/to/image.jpg" alt="Description">
```

### Pattern 2: Responsive Image

```html
<img 
  data-src="/path/image-default.jpg"
  data-srcset="/image-small.jpg 480w, /image-large.jpg 1200w"
  alt="Description"
>
```

### Pattern 3: Background Image

```html
<div data-bg="/path/to/background.jpg" style="height: 300px;"></div>
```

---

## Method Cheat Sheet

### Loading States

```javascript
// Buttons
Loading.showButtonLoading(element);
Loading.hideButtonLoading(element);

// Overlay (full screen)
Loading.showOverlay('Message');
Loading.hideOverlay();

// Container
Loading.showContainerLoading(element, 'Loading...');
Loading.hideContainerLoading(element);

// Forms
Loading.showFormLoading(form);
Loading.hideFormLoading(form);

// Tables
Loading.showTableLoading(table, 5, 4); // rows, cols
Loading.hideTableLoading(table);

// Cards
Loading.showCardSkeletons(container, 3);
Loading.hideCardSkeletons(container);

// Wrap any promise
await Loading.withLoading(promise, { overlay: true });
```

### Lazy Loading

```javascript
// Automatic with data-src / data-bg
// No code needed - LazyLoader handles it!

// Manual trigger
LazyLoad.loadNow(imageElement);

// Observe new elements (dynamic content)
LazyLoad.observe(newImages);

// Stop observing
LazyLoad.unobserve(element);
```

---

## Implementation Checklist

### Each Page Needs:

- [ ] loading.css in `<link>`
- [ ] loading.js in `<script defer>`
- [ ] lazy-loading.js in `<script defer>`

### Each Async Operation:

- [ ] Wrap in try/finally
- [ ] Show loading state before API call
- [ ] Hide loading state in finally

### Each Image:

- [ ] Change `src` to `data-src`
- [ ] Add `data-srcset` for responsive images
- [ ] Use `data-bg` for backgrounds

---

## Real Examples

### ✅ Loading Student Grades (Correct)

```javascript
async function refreshGrades() {
  const container = document.getElementById('gradesTable');
  Loading.showTableLoading(container, 8, 4);
  
  try {
    const response = await API.get(`/api/grades/${classId}`);
    renderGradesTable(response.data);
    showToast('Grades loaded!', 'success');
  } catch (error) {
    showToast('Error loading grades', 'error');
  } finally {
    Loading.hideTableLoading(container);
  }
}
```

### ✅ Submitting Assignment (Correct)

```javascript
document.getElementById('submitBtn').addEventListener('click', async () => {
  const btn = document.getElementById('submitBtn');
  Loading.showButtonLoading(btn);
  
  try {
    const file = document.getElementById('fileInput').files[0];
    const form = new FormData();
    form.append('assignment_id', assignmentId);
    form.append('file', file);
    
    await API.upload('/api/submissions', form);
    showToast('Assignment submitted!', 'success');
  } catch (error) {
    showToast('Submission failed: ' + error.message, 'error');
  } finally {
    Loading.hideButtonLoading(btn);
  }
});
```

### ✅ Lazy Loading Course Image (Correct)

```html
<!-- Before: -->
<img src="/courses/course-123.jpg" alt="Course">

<!-- After: -->
<img 
  data-src="/courses/course-123.jpg"
  data-srcset="/courses/course-123-small.jpg 400w, /courses/course-123-large.jpg 800w"
  alt="Course"
  style="width: 100%; height: auto;"
>
```

---

## CSS Classes for Manual Styling

```css
/* Loading spinner */
.loading-spinner
.loading-spinner.sm    /* small */
.loading-spinner.lg    /* large */
.loading-spinner.white /* white variant */

/* Skeleton loaders */
.skeleton                    /* generic */
.skeleton.text              /* text line */
.skeleton.text.title        /* title line */
.skeleton-card              /* card skeleton */
.skeleton-table-row         /* table row skeleton */

/* States */
.is-loading    /* element is loading */
.lazy-loading  /* image is loading */
.lazy-loaded   /* image loaded */
.lazy-error    /* image failed to load */
```

---

## Common Mistakes ❌

| Mistake | Problem | Fix |
|---------|---------|-----|
| Forgetting `finally` | Loading never hides | Use try/finally |
| Lazy loading hero image | LCP suffers | Keep src for above-fold |
| Not including loading.js | `Loading` undefined | Add script tag |
| Using `src` with `data-src` | Image loads twice | Remove src or use placeholder |
| Multiple overlays | UI confusion | Use only when needed |

---

## Testing

### Quick Test Checklist:

1. **Throttle Network** (Chrome DevTools > Network > Slow 3G)
2. **Click async button** → See loading state
3. **Scroll page** → See images load as they appear
4. **Check console** → No errors
5. **Run Lighthouse** → Performance should improve

### Debug Commands:

```javascript
// Force load an image
LazyLoad.loadNow(document.querySelector('img[data-src]'));

// Show overlay
Loading.showOverlay('Test message');

// Get loading stats
console.log(Loading.activeLoaders.size);
```

---

## Performance Metrics

```javascript
// Monitor image loading
const images = document.querySelectorAll('img[data-src]');
console.log(`${images.length} images lazy-loaded`);

// Check loading times
console.time('dataFetch');
const data = await API.get('/data');
console.timeEnd('dataFetch');
// Output: dataFetch: 234ms
```

---

## Need Help?

1. **Loading states not showing?**
   - Check that loading.js is included
   - Check browser console for errors
   - Verify element selectors are correct

2. **Images not lazy-loading?**
   - Check images have `data-src` (not `src`)
   - Check LazyLoader is running (no JS errors)
   - Test with `LazyLoad.loadNow(img)`

3. **Lighthouse score not improving?**
   - Ensure ALL scripts are included
   - Verify lazy loading on ALL images below fold
   - Add loading states to ALL async operations

See **PERFORMANCE-IMPLEMENTATION-GUIDE.md** for detailed documentation.
