---
name: responsive-design
description: "Mobile-first responsive design for HTML/CSS, Tailwind CSS, and modern web frameworks. Includes 5 breakpoint strategies, touch-friendly patterns, accessibility standards, performance optimization, and CSS-in-JS implementations. Use when: building responsive layouts, optimizing for mobile/tablet/desktop, fixing layout issues, implementing responsive components, or establishing breakpoint standards. Synthesizes ui-styling, ui-ux-pro-max, design-system, and Uncodixfy best practices."
argument-hint: "[layout type or component]"
license: MIT
metadata:
  author: responsive-design-team
  version: "1.0.0"
  skills-integrated: ["ui-styling", "ui-ux-pro-max", "design-system", "Uncodixfy"]
---

# Responsive Design Skill

Comprehensive guide for building mobile-first, touch-friendly, performant responsive interfaces across all breakpoints. Synthesizes Tailwind CSS utilities, accessibility standards (WCAG 2.1), and modern UI/UX patterns for the LMS platform (PHP backend, Tailwind frontend, 5 roles: admin, teacher, student, parent, superadmin).

## When to Use This Skill

Use this skill when:
- Building responsive layouts for web applications (admin panels, dashboards, SaaS, LMS)
- Creating mobile-first designs that scale from 320px (mobile) → 1536px+ (desktop)
- Fixing responsive design issues (horizontal overflow, unreadable text, broken tables)
- Implementing touch-friendly interactions (44px+ touch targets, hover states, gestures)
- Establishing responsive component patterns (tables, forms, grids, navigation, sidebars)
- Optimizing performance on slow networks (lazy loading, critical CSS, image optimization)
- Testing responsive behavior across breakpoints and real devices
- Converting desktop-first layouts to mobile-first architecture
- Building responsive design systems with consistent tokens
- Implementing mobile navigation patterns (hamburger menus, drawers, collapsible sections)

**Must Use** when visual layout changes across screen sizes or touch interactions are involved.

## Core Principles

### 1. Mobile-First Approach

The **unprefixed utilities are for mobile**. Breakpoint prefixes (sm:, md:, lg:, xl:, 2xl:) mean "this breakpoint and up."

```html
<!-- ✅ CORRECT: Mobile-first structure -->
<div class="w-full p-4 md:w-1/2 md:p-6 lg:w-1/3 lg:p-8">
  Stacks vertically on mobile (w-full)
  2 columns on tablet (md:w-1/2)
  3 columns on desktop (lg:w-1/3)
</div>

<!-- ✅ CORRECT: Mobile-only vs tablet+ -->
<div class="block md:hidden">Mobile navigation (hamburger)</div>
<div class="hidden md:block">Desktop navigation (sidebar)</div>

<!-- ❌ WRONG: Using sm: for mobile -->
<div class="hidden sm:block">This hides on mobile phones! sm = 640px+</div>
```

### 2. Breakpoint Strategy — 5 Approaches

**Strategy A: Standard 6 Breakpoints (Recommended for LMS)**
```
xs:  320px   (base, no prefix needed)
sm:  640px   (large phones landscape)
md:  768px   ⭐ CRITICAL FOR LMS (tablets, sidebar threshold)
lg:  1024px  (tablets landscape)
xl:  1280px  (standard desktop)
2xl: 1536px  (large desktop/4K)
```

| Breakpoint | Width | Use Case | Devices |
|---|---|---|---|
| **xs** | 320px–479px | Mobile default | iPhone SE, Galaxy A |
| **sm** | 640px–767px | Large phones landscape | iPhone 14 Pro landscape |
| **md** | 768px–1023px | **Tablets + sidebar breakpoint** | iPad, Android tablets |
| **lg** | 1024px–1279px | Tablets landscape + small laptops | iPad Pro landscape |
| **xl** | 1280px–1535px | Standard desktops | 13" laptops, 27" 1440p |
| **2xl** | 1536px+ | Large desktops | 32" 4K displays |

**⭐ LMS Critical Decision:** md (768px) is where:
- Sidebar transitions from mobile drawer → pinned sidebar
- Table layouts change from card → horizontal scroll
- Grids adjust from 1-2 columns → 3+ columns

**Strategy B: Mobile + Tablet + Desktop (Simplified)**
```html
<div class="flex flex-col md:flex-row"><!-- Stack mobile, row on tablet+ --></div>
```

**Strategy C: Tablet-First (When Desktop is Primary)**
```html
<div class="hidden lg:grid">Desktop grid</div>
<div class="grid md:hidden">Mobile stacked</div>
```

**Strategy D: Progressive Enhancement (Mobile > Tablet > Desktop)**
```html
<!-- Minimal mobile -->
<button class="px-2 py-1">Action</button>

<!-- Enhanced on tablet (more space) -->
<button class="px-2 py-1 md:px-4 md:py-2">Action</button>

<!-- Full desktop experience -->
<button class="px-2 py-1 md:px-4 md:py-2 lg:px-6 lg:py-3">Action</button>
```

**Strategy E: Container Queries (Advanced, Modern Browsers)**
```css
@container (min-width: 600px) {
  .card { display: grid; grid-template-columns: repeat(2, 1fr); }
}
```

### 3. Touch-Friendly Interaction Patterns

**Minimum Touch Targets: 44×44px (Apple HIG, Material Design 3)**

```html
<!-- ✅ Adequate: 44×44px minimum -->
<button class="px-4 py-3 rounded-lg font-medium">Action</button>

<!-- ✅ On mobile, make buttons taller -->
<button class="px-3 py-2 md:px-4 md:py-3">Action</button>

<!-- ❌ Too small - fails accessibility -->
<button class="px-1 py-0.5 text-xs">Action</button>

<!-- ✅ Touch-friendly form input (16px font prevents iOS zoom) -->
<input type="text" class="px-3 py-2 text-base border rounded" placeholder="Name" />

<!-- ⚠️ Risky: 14px font may trigger iOS auto-zoom on focus -->
<input type="text" class="text-sm" placeholder="Name" />
```

**Hover vs Touch Interaction:**

```css
/* ✅ CORRECT: Support both hover AND touch */
button:hover,
button:focus {
  background-color: #2d3748;
  outline: 2px solid #3182ce;
}

button:active {
  transform: scale(0.98);
  background-color: #1a202c;
}

/* ✅ CORRECT: Use media (hover: hover) to detect hover capability */
@media (hover: hover) {
  button:hover { background-color: #2d3748; }
}

/* ✅ CORRECT: Mobile-specific touch feedback */
@media (hover: none) {
  button:active { background-color: #1a202c; }
}

/* ❌ WRONG: Hover-only (no mobile feedback) */
button:hover { background-color: #2d3748; }
```

**Spacing for Touch:**

```css
/* ✅ Adequate spacing between touch targets */
.btn + .btn { margin-left: 0.75rem; }

/* ✅ Mobile: Increase spacing or stack */
@media (max-width: 767px) {
  .btn { display: block; width: 100%; margin-bottom: 0.5rem; }
}

/* ❌ Too tight - hard to tap individual buttons */
.btn + .btn { margin-left: 0.25rem; }
```

### 4. Responsive Layout Patterns

**Pattern A: Stack → Row (Most Common)**

```html
<!-- Mobile: stacked vertically, Desktop: side-by-side -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="flex-1">Column 1</div>
  <div class="flex-1">Column 2</div>
</div>
```

**Pattern B: Single → Multi-Column Grid**

```html
<!-- 1 col mobile, 2 cols sm, 3 cols md, 4 cols lg -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <div class="card">Item</div>
  <!-- ... -->
</div>
```

**Pattern C: KPI Grid (Dashboard Critical for LMS)**

```html
<!-- LMS dashboards: 1 col → 2 → 3 → 6 columns -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
  <div class="kpi-card">Total Students</div>
  <div class="kpi-card">Active Teachers</div>
  <!-- ... -->
</div>
```

**Pattern D: Auto-Fit Grid (Flexible Columns)**

```html
<!-- Columns automatically adjust width based on available space -->
<div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))">
  <div class="card">Flexible card</div>
  <!-- ... -->
</div>
```

**Pattern E: Sidebar + Main (Critical for LMS Navigation)**

```html
<!-- Mobile: Hamburger → drawer, Desktop: Sidebar → always visible -->
<div class="flex flex-col md:flex-row">
  <!-- Mobile drawer on top, desktop sidebar on left -->
  <aside class="sidebar-mobile md:sidebar-desktop md:w-64 md:flex-shrink-0">
    <nav>Navigation</nav>
  </aside>
  
  <!-- Main content takes remaining space -->
  <main class="flex-1">Content</main>
</div>
```

### 5. Data Tables — Mobile-Friendly Conversion (CRITICAL FOR LMS)

**Approach: Hide thead on Mobile, Display as Cards**

```html
<!-- Grades Table: Shows as normal table on desktop, cards on mobile -->
<table class="table-responsive w-full border-collapse">
  <thead class="hidden md:table-header-group bg-gray-100">
    <tr>
      <th class="px-4 py-2 text-left">Subject</th>
      <th class="px-4 py-2 text-left">Score</th>
      <th class="px-4 py-2 text-left">Grade</th>
      <th class="px-4 py-2 text-left">Action</th>
    </tr>
  </thead>
  
  <tbody class="block md:table-row-group">
    <!-- Mobile: Each row becomes a card -->
    <tr class="block md:table-row border md:border-none mb-4 md:mb-0 p-4 md:p-0 rounded md:rounded-none bg-white md:bg-transparent">
      <td data-label="Subject" class="block md:table-cell mb-2 md:mb-0 px-4 md:py-2 before:content-[attr(data-label)] before:font-bold before:mr-2 md:before:content-none">Mathematics</td>
      <td data-label="Score" class="block md:table-cell mb-2 md:mb-0 px-4 md:py-2 before:content-[attr(data-label)] before:font-bold before:mr-2 md:before:content-none">92</td>
      <td data-label="Grade" class="block md:table-cell mb-2 md:mb-0 px-4 md:py-2 before:content-[attr(data-label)] before:font-bold before:mr-2 md:before:content-none">A+</td>
      <td data-label="Action" class="block md:table-cell px-4 md:py-2 before:content-none">
        <button class="px-3 py-2 bg-blue-500 text-white rounded">Edit</button>
      </td>
    </tr>
  </tbody>
</table>

<style>
  /* Mobile: data-label displays as pseudo-element */
  @media (max-width: 767px) {
    tr { display: flex; flex-direction: column; }
    td { display: block; }
  }
</style>
```

### 6. Responsive Forms

```html
<!-- ✅ Mobile: Single column, Desktop: Two columns -->
<form class="space-y-4">
  <!-- Full-width on mobile, side-by-side on desktop -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium mb-1">First Name</label>
      <!-- 16px minimum font to prevent iOS auto-zoom -->
      <input type="text" class="w-full px-3 py-2 text-base border border-gray-300 rounded" />
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Last Name</label>
      <input type="text" class="w-full px-3 py-2 text-base border border-gray-300 rounded" />
    </div>
  </div>

  <!-- Full-width button -->
  <button type="submit" class="w-full px-4 py-3 bg-blue-500 text-white rounded font-medium">
    Submit
  </button>
</form>
```

### 7. Responsive Navigation (Hamburger + Sidebar)

```html
<!-- Mobile hamburger button (hidden on md+) -->
<button class="md:hidden hamburger-btn" id="hamburgerBtn">
  <span></span>
  <span></span>
  <span></span>
</button>

<!-- Mobile overlay (hidden on md+) -->
<div class="sidebar-overlay hidden md:hidden" id="sidebarOverlay"></div>

<!-- Sidebar: Mobile drawer on mobile, fixed on desktop -->
<aside class="sidebar-mobile md:sidebar-desktop">
  <nav class="flex flex-col space-y-2">
    <a href="/dashboard" class="px-4 py-2 rounded hover:bg-gray-100">Dashboard</a>
    <a href="/students" class="px-4 py-2 rounded hover:bg-gray-100">Students</a>
    <!-- ... -->
  </nav>
</aside>
```

```css
/* Mobile: Hidden drawer that slides in from left */
.sidebar-mobile {
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  height: 100vh;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 10;
}

.sidebar-mobile.active {
  transform: translateX(0);
}

/* Desktop: Always visible sidebar */
@media (min-width: 768px) {
  .sidebar-mobile {
    position: relative;
    transform: translateX(0);
    width: auto;
    height: auto;
  }
}
```

### 8. Accessibility Standards (WCAG 2.1)

```html
<!-- ✅ Semantic HTML -->
<button aria-label="Toggle navigation menu">☰</button>
<nav aria-label="Main navigation"><!-- ... --></nav>
<main role="main"><!-- ... --></main>

<!-- ✅ Focus visibility (critical for keyboard navigation) -->
<button class="focus:outline-2 focus:outline-offset-2 focus:outline-blue-500">Action</button>

<!-- ✅ Color contrast (4.5:1 for normal text) -->
<p class="text-gray-700 bg-white">Readable text</p>

<!-- ✅ Skip to main content link -->
<a href="#main" class="sr-only focus:not-sr-only">Skip to main content</a>

<!-- ✅ Responsive touch targets (44px minimum) -->
<a href="#" class="inline-block px-4 py-3 rounded">Link (44px touch target)</a>
```

```css
/* ✅ Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ✅ Visible focus ring for keyboard navigation */
:focus-visible {
  outline: 2px solid #3182ce;
  outline-offset: 2px;
}
```

### 9. Performance Optimization

**Lazy Loading Images on Mobile**

```html
<!-- ✅ Load images only when in viewport (mobile improves speed) -->
<img src="placeholder.jpg" data-src="image.jpg" loading="lazy" alt="Description" />

<!-- ✅ Responsive images with srcset -->
<img 
  src="image-small.jpg"
  srcset="image-small.jpg 320w, image-medium.jpg 768w, image-large.jpg 1280w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Description"
/>
```

**Critical CSS (Load essential styles first)**

```html
<!-- Load responsive CSS first (blocks rendering) -->
<link rel="stylesheet" href="responsive.css" />

<!-- Defer non-critical CSS (low priority) -->
<link rel="stylesheet" href="animations.css" media="print" onload="this.media='all'" />
```

**Mobile-Optimized JavaScript**

```javascript
// ✅ Debounce resize listener to avoid constant recalculations
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

window.addEventListener('resize', debounce(() => {
  // Recalculate on mobile-to-desktop transition (768px)
  if (window.innerWidth >= 768) {
    closeSidebar();
  }
}, 250));
```

### 10. CSS-in-JS Pattern (For Dynamic Responsive Styles)

```javascript
// ✅ Generate responsive classes dynamically
const responsiveClasses = {
  gridCols: {
    mobile: 'grid-cols-1',
    tablet: 'md:grid-cols-2',
    desktop: 'lg:grid-cols-3'
  }
};

// ✅ Tailwind: Don't use computed class names
// Tailwind needs to know class names at build time
const layout = `grid ${responsiveClasses.gridCols.mobile} ${responsiveClasses.gridCols.tablet} ${responsiveClasses.gridCols.desktop}`;
// ❌ This won't work: className={`grid grid-cols-${cols}`}

// ✅ Instead: Use inline styles or CSS variables for truly dynamic sizing
const style = `--grid-cols: ${gridColumns}; grid-template-columns: repeat(var(--grid-cols), 1fr);`;
```

## LMS-Specific Implementation Guide

### File Structure
```
lms-frontend/
  assets/css/
    responsive.css          ← Mobile-first utilities and patterns
    main.css               ← Global styles (loads after responsive.css)
    admin.css / teacher.css / etc. ← Role-specific styles
  
  common/js/
    navigation.js          ← Mobile sidebar + search toggle
    
  admin/dashboard.html     ← Example: Responsive dashboard
  teacher/dashboard.html
  student/dashboard.html
  parent/dashboard.html
  superadmin/dashboard.html
```

### Key Files & Patterns

**1. Responsive CSS (d:\db\lms-frontend\assets\css\responsive.css)**
- Breakpoint strategy with device mapping
- Touch utilities (44px buttons, 16px inputs)
- Layout patterns (stack-to-row, grids, KPI grid)
- Table card layout for mobile
- Mobile sidebar drawer CSS
- Hamburger animation

**2. Mobile Navigation JS (d:\db\lms-frontend\common\js\navigation.js)**
- MobileNavigation class
- Sidebar toggle with overlay
- Search bar collapse/expand
- Escape key handling
- LocalStorage persistence

**3. Dashboard Integration**
```html
<!-- Link responsive.css BEFORE role-specific CSS -->
<link rel="stylesheet" href="../assets/css/responsive.css" />
<link rel="stylesheet" href="admin.css" />

<!-- Add mobile viewport meta -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

<!-- Include navigation.js for sidebar/search -->
<script src="../common/js/navigation.js"></script>
```

## Quick Reference: Common Patterns

```html
<!-- Mobile-first responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div class="card">Item</div>
</div>

<!-- Hamburger menu (hidden on md+) -->
<button class="md:hidden hamburger-btn">☰</button>
<nav class="hidden md:block">Desktop navigation</nav>

<!-- Responsive sidebar -->
<aside class="sidebar-mobile md:sidebar-desktop">Navigation</aside>

<!-- Table as cards on mobile -->
<table class="table-responsive">
  <thead class="hidden md:table-header-group"><!-- ... --></thead>
  <tbody class="block md:table-row-group">
    <tr class="block md:table-row mb-4 md:mb-0">
      <td data-label="Column">Value</td>
    </tr>
  </tbody>
</table>

<!-- Touch-friendly button (44px) -->
<button class="px-4 py-3 rounded focus:outline-2">Action</button>

<!-- Responsive form (1 col mobile, 2 cols desktop) -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <input type="text" class="text-base py-2 px-3" />
</div>

<!-- Hide/show by breakpoint -->
<div class="hidden md:block">Desktop content</div>
<div class="md:hidden">Mobile content</div>
```

## Testing Checklist

- [ ] Test at 320px (iPhone SE), 480px (mobile landscape), 768px (tablet), 1024px (desktop)
- [ ] Verify hamburger menu shows/hides at md breakpoint (768px)
- [ ] Check touch targets are ≥44px (buttons, links, form inputs)
- [ ] Confirm form inputs use 16px+ font to prevent iOS auto-zoom
- [ ] Validate focus rings visible on keyboard navigation
- [ ] Test tables as cards on mobile (<768px), normal table on desktop (≥768px)
- [ ] Verify no horizontal overflow at any breakpoint
- [ ] Check sidebar drawer animation smooth (no jank on low-end devices)
- [ ] Test on real devices: iPhone, Android phone, iPad, laptop
- [ ] Browser compatibility: Chrome, Safari, Firefox, Edge
- [ ] Lighthouse score ≥90 for performance

## Resources

- Tailwind CSS Responsive Design: https://tailwindcss.com/docs/responsive-design
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Material Design 3: https://m3.material.io/
- Touch Target Size: https://www.nngroup.com/articles/touch-target-size/