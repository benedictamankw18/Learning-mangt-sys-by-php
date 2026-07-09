# Tailwind CSS Setup Guide

## 🎨 Tailwind CSS is now integrated into the LMS project!

This guide explains how to use Tailwind CSS in the Ghana SHS LMS frontend.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Development Setup (CDN)](#development-setup-cdn)
- [Production Setup (CLI)](#production-setup-cli)
- [Custom Components](#custom-components)
- [Color Palette](#color-palette)
- [Usage Examples](#usage-examples)

---

## 🚀 Quick Start

### Option 1: CDN (Current - Easiest)

Add this to your HTML `<head>`:

```html
<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Tailwind Configuration -->
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          "ghana-red": "#d82434",
          "ghana-gold": "#d4af37",
          "ghana-green": "#006a3f",
          "lms-primary": "#3090cf",
          "lms-secondary": "#008c54",
        },
      },
    },
  };
</script>
```

✅ **Pros:** No build process, works immediately  
⚠️ **Cons:** Not optimized for production, larger file size

---

## 💻 Development Setup (CDN)

The project is currently configured to use Tailwind via CDN for rapid development.

**Current files:**

- ✅ `auth/login.html` - Already has Tailwind
- ✅ `tailwind-setup.html` - Component examples
- ✅ All new pages will use Tailwind

**To add Tailwind to existing pages:**

1. Open the HTML file
2. Add the Tailwind CDN script in the `<head>` section:
   ```html
   <script src="https://cdn.tailwindcss.com"></script>
   ```
3. (Optional) Add custom configuration after the CDN script

---

## 🏗️ Production Setup (CLI)

For production deployment, use Tailwind CLI for optimized builds.

### Prerequisites

- Node.js 14+ installed
- npm or yarn package manager

### Installation Steps

1. **Install Tailwind CSS:**

   ```bash
   npm install -D tailwindcss
   ```

2. **Initialize Tailwind (already done):**

   ```bash
   npx tailwindcss init
   ```

   This created `tailwind.config.js`

3. **Build CSS:**

   ```bash
   npx tailwindcss -i ./assets/css/tailwind-input.css -o ./assets/css/tailwind-output.css --watch
   ```

4. **In your HTML, replace CDN with:**
   ```html
   <link href="../assets/css/tailwind-output.css" rel="stylesheet" />
   ```

### Production Build

```bash
npx tailwindcss -i ./assets/css/tailwind-input.css -o ./assets/css/tailwind-output.css --minify
```

---

## 🧩 Custom Components

The project includes pre-built components in `assets/css/tailwind-input.css`:

### Buttons

```html
<button class="btn-primary">Primary Button</button>
<button class="btn-secondary">Secondary Button</button>
<button class="btn-accent">Accent Button</button>
<button class="btn-outline">Outline Button</button>
<button class="btn-danger">Danger Button</button>
<button class="btn-success">Success Button</button>

<!-- Sizes -->
<button class="btn-primary btn-sm">Small</button>
<button class="btn-primary btn-lg">Large</button>
```

### Cards

```html
<div class="card">
  <div class="card-header">
    <h2 class="card-title">Card Title</h2>
  </div>
  <div class="card-body">
    <p>Card content goes here</p>
  </div>
  <div class="card-footer">
    <button class="btn-primary">Action</button>
  </div>
</div>

<!-- Stat Card -->
<div class="stat-card">
  <div class="stat-value">1,234</div>
  <div class="stat-label">Total Students</div>
</div>
```

### Forms

```html
<div class="form-group">
  <label class="form-label">Email Address</label>
  <input type="email" class="form-input" placeholder="you@example.com" />
  <span class="form-help">We'll never share your email</span>
</div>

<div class="form-group">
  <label class="form-label">Password</label>
  <input type="password" class="form-input" />
  <span class="form-error">Password is required</span>
</div>

<div class="form-group">
  <label class="form-label">Message</label>
  <textarea class="form-textarea"></textarea>
</div>
```

### Alerts

```html
<div class="alert-success">
  <i class="fas fa-check-circle"></i>
  <span>Success! Your action was completed.</span>
</div>

<div class="alert-error">
  <i class="fas fa-exclamation-circle"></i>
  <span>Error! Something went wrong.</span>
</div>

<div class="alert-warning">
  <i class="fas fa-exclamation-triangle"></i>
  <span>Warning! Please check your input.</span>
</div>

<div class="alert-info">
  <i class="fas fa-info-circle"></i>
  <span>Info: Here's some helpful information.</span>
</div>
```

### Badges

```html
<span class="badge-success">Active</span>
<span class="badge-error">Inactive</span>
<span class="badge-warning">Pending</span>
<span class="badge-info">New</span>
<span class="badge-primary">Primary</span>
```

### Tables

```html
<table class="table">
  <thead class="table-header">
    <tr>
      <th class="table-header-cell">Name</th>
      <th class="table-header-cell">Email</th>
      <th class="table-header-cell">Role</th>
    </tr>
  </thead>
  <tbody class="table-body">
    <tr class="table-row">
      <td class="table-cell">John Doe</td>
      <td class="table-cell">john@example.com</td>
      <td class="table-cell">
        <span class="badge-success">Admin</span>
      </td>
    </tr>
  </tbody>
</table>
```

### Modal

```html
<!-- Modal Overlay -->
<div class="modal-overlay"></div>

<!-- Modal -->
<div class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">Modal Title</h3>
      <button class="btn-ghost">×</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here</p>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost">Cancel</button>
      <button class="btn-primary">Save</button>
    </div>
  </div>
</div>
```

### Loading Spinner

```html
<div class="spinner"></div>
<div class="spinner-sm"></div>
<div class="spinner-lg"></div>
```

---

## 🎨 Color Palette

### Ghana Flag Colors

```html
<div class="bg-ghana-red">Red</div>
<div class="bg-ghana-gold">Gold</div>
<div class="bg-ghana-green">Green</div>

<div class="text-ghana-red">Red Text</div>
```

### LMS Brand Colors

```html
<div class="bg-lms-primary">Primary Blue (#3090cf)</div>
<div class="bg-lms-secondary">Secondary Green (#008c54)</div>
<div class="bg-lms-accent">Accent Gold (#d4af37)</div>
<div class="bg-lms-dark">Dark (#1a1d29)</div>
<div class="bg-lms-light">Light (#f5f7fa)</div>
```

---

## 📖 Usage Examples

### Dashboard Stat Card

```html
<div
  class="stat-card bg-gradient-to-br from-lms-primary to-blue-600 text-white"
>
  <div class="flex items-center justify-between mb-4">
    <i class="fas fa-users text-4xl opacity-50"></i>
    <span class="badge bg-white text-lms-primary">+12%</span>
  </div>
  <div class="stat-value">1,234</div>
  <div class="stat-label text-blue-100">Total Students</div>
</div>
```

### Login Form

```html
<div class="card max-w-md mx-auto">
  <div class="card-body">
    <h2 class="text-2xl font-bold mb-6 text-center">Welcome Back</h2>

    <form>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-input" />
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" class="form-input" />
      </div>

      <button type="submit" class="btn-primary w-full">Sign In</button>
    </form>
  </div>
</div>
```

### Data Table with Actions

```html
<div class="card">
  <div class="card-header flex items-center justify-between">
    <h2 class="card-title">Students</h2>
    <button class="btn-primary btn-sm">
      <i class="fas fa-plus"></i>
      Add Student
    </button>
  </div>
  <div class="card-body">
    <table class="table">
      <thead class="table-header">
        <tr>
          <th class="table-header-cell">Name</th>
          <th class="table-header-cell">Class</th>
          <th class="table-header-cell">Status</th>
          <th class="table-header-cell">Actions</th>
        </tr>
      </thead>
      <tbody class="table-body">
        <tr class="table-row">
          <td class="table-cell">John Doe</td>
          <td class="table-cell">Form 1A</td>
          <td class="table-cell">
            <span class="badge-success">Active</span>
          </td>
          <td class="table-cell">
            <button class="btn-ghost btn-sm">Edit</button>
            <button class="btn-ghost btn-sm text-red-600">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 📚 Resources

- **Tailwind Documentation:** https://tailwindcss.com/docs
- **Component Examples:** Open `tailwind-setup.html` in your browser
- **Custom Components:** See `assets/css/tailwind-input.css`
- **Color Palette:** Defined in `tailwind.config.js`

---

## 🔄 Migration from Existing CSS

To migrate existing pages:

1. **Add Tailwind CDN** to the page
2. **Replace custom classes** with Tailwind utilities:
   - `.container` → `container mx-auto px-4`
   - `.button` → `btn-primary`
   - `.card` → `card`
3. **Keep existing CSS** if needed (custom animations, complex layouts)
4. **Test thoroughly** - check layout, colors, responsiveness

---

## ✅ Next Steps

1. ✅ **Tailwind is set up** - Already integrated in login.html
2. 📝 **Use custom components** - Pre-built components available
3. 🎨 **Follow color palette** - Ghana and LMS brand colors defined
4. 🚀 **Build new pages** - Use Tailwind from the start
5. 📦 **Production build** - Use Tailwind CLI when deploying

---

**Happy coding with Tailwind!** 🎉
