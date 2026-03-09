---
name: add-feature
description: 'Add a new feature to the LMS project end-to-end. Use when: adding an API endpoint, creating a new controller, adding a repository method, registering a route, or wiring a frontend page to the backend API. Covers the full stack: PHP Repository → Controller → Route → Frontend JS.'
argument-hint: 'Name or description of the feature to add (e.g. "attendance report export" or "student progress endpoint")'
---

# Add a New LMS Feature (End-to-End)

## Project Architecture

```
lms-api/src/
├── Controllers/     XController.php     — HTTP layer (validate, authorize, call repo, respond)
├── Repositories/    XRepository.php     — All SQL queries (extends BaseRepository)
├── Services/        (optional, rarely used; skip unless logic is complex)
├── Routes/          api.php             — Route table (METHOD /path => controller+method+auth)
├── Middleware/      RoleMiddleware.php  — Role-based access checks
└── Utils/           Response.php, Validator.php, UuidHelper.php

lms-frontend/
├── {role}/
│   ├── {role}.js          — Dashboard JS (auth guard + shared setup)
│   ├── {role}.css
│   ├── dashboard.html
│   └── page/              — Sub-pages for this role
└── assets/js/             — Shared utilities (Auth, API helpers)
```

## Step-by-Step Procedure

### 1. Repository (`lms-api/src/Repositories/`)

Create `XRepository.php` or add methods to an existing one.

- Extends `BaseRepository` — gets `$this->db` (PDO), `$this->table`, `getAll()` for free
- **Always use prepared statements** — never interpolate user input into SQL
- Wrap all queries in try/catch and `error_log()` the `PDOException`
- Return `null` on failure, empty array `[]` on zero results
- Use `PDO::FETCH_ASSOC` (already set as default)

```php
namespace App\Repositories;

use PDO;

class XRepository extends BaseRepository
{
    protected $table = 'your_table';
    protected $primaryKey = 'your_id';

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id");
            $stmt->execute(['id' => $id]);
            return $stmt->fetch() ?: null;
        } catch (\PDOException $e) {
            error_log("XRepository::findById error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("INSERT INTO {$this->table} (col1, col2) VALUES (:col1, :col2)");
            $stmt->execute(['col1' => $data['col1'], 'col2' => $data['col2']]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("XRepository::create error: " . $e->getMessage());
            return null;
        }
    }
}
```

### 2. Controller (`lms-api/src/Controllers/`)

Create `XController.php`. Controllers handle HTTP concerns only.

- Inject repository via constructor
- Use `RoleMiddleware` for auth checks — call `$roleMiddleware->requireRole([...])` which returns false and sends 403 automatically
- Use `Validator` for required fields and type checks
- Use `Response::` static methods for all output
- Read JSON body with `json_decode(file_get_contents('php://input'), true)`

```php
namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\XRepository;
use App\Middleware\RoleMiddleware;

class XController
{
    private XRepository $xRepo;

    public function __construct()
    {
        $this->xRepo = new XRepository();
    }

    public function index(array $user): void
    {
        $page  = (int) ($_GET['page']  ?? 1);
        $limit = (int) ($_GET['limit'] ?? 20);
        $items = $this->xRepo->getAll([], $limit, ($page - 1) * $limit);
        $total = $this->xRepo->count();
        Response::paginated($items, $total, $page, $limit);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher'])) return;

        $data = json_decode(file_get_contents('php://input'), true);
        $validator = new Validator($data);
        $validator->required(['field1', 'field2']);
        if ($validator->fails()) {
            Response::validationError($validator->errors());
            return;
        }

        $id = $this->xRepo->create($data);
        if (!$id) {
            Response::serverError('Failed to create record');
            return;
        }
        Response::created(['id' => $id]);
    }

    public function show(array $user, int $id): void
    {
        $item = $this->xRepo->findById($id);
        if (!$item) {
            Response::notFound('Record not found');
            return;
        }
        Response::success($item);
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin'])) return;

        $data = json_decode(file_get_contents('php://input'), true);
        $updated = $this->xRepo->update($id, $data);
        if (!$updated) {
            Response::serverError('Failed to update');
            return;
        }
        Response::success(['message' => 'Updated successfully']);
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin'])) return;

        $deleted = $this->xRepo->delete($id);
        if (!$deleted) {
            Response::notFound('Record not found or already deleted');
            return;
        }
        Response::success(['message' => 'Deleted successfully']);
    }
}
```

### 3. Route Registration (`lms-api/src/Routes/api.php`)

Add entries to the PHP array. Follow the exact pattern:

```php
// X routes
'GET /xs'          => ['controller' => 'XController', 'method' => 'index',  'auth' => true],
'GET /xs/{id}'     => ['controller' => 'XController', 'method' => 'show',   'auth' => true],
'POST /xs'         => ['controller' => 'XController', 'method' => 'create', 'auth' => true],
'PUT /xs/{id}'     => ['controller' => 'XController', 'method' => 'update', 'auth' => true],
'DELETE /xs/{id}'  => ['controller' => 'XController', 'method' => 'delete', 'auth' => true],
```

- `auth: false` for public endpoints (login, register, forgot-password)
- Use `{uuid}` instead of `{id}` when the route resolves by UUID
- Group related routes together with a comment block

### 4. Frontend Page (`lms-frontend/{role}/page/`)

For a new sub-page under a role:

1. **Create the HTML** at `lms-frontend/{role}/page/feature-name.html`
   - Copy a similar existing page as a starting point (e.g. `courses.html`)
   - Include the role's CSS and shared asset CSS
   - Include the API base URL script before your page JS

2. **Add the JS** inline in the page or in `lms-frontend/{role}/js/feature-name.js`

   ```js
   document.addEventListener('DOMContentLoaded', () => {
       // Require authentication for this role
       if (!Auth.requireAuth([USER_ROLES.ADMIN])) return;

       loadData();
   });

   async function loadData() {
       const res = await API.get('/xs');
       if (!res.success) {
           showToast(res.message || 'Failed to load data', 'error');
           return;
       }
       renderTable(res.data);
   }

   async function createItem(formData) {
       const res = await API.post('/xs', formData);
       if (!res.success) {
           showToast(res.message || 'Failed to create', 'error');
           return;
       }
       showToast('Created successfully', 'success');
       loadData();
   }

   function renderTable(items) {
       const tbody = document.querySelector('#dataTable tbody');
       tbody.innerHTML = items.map(item => `
           <tr>
               <td>${escapeHtml(item.name)}</td>
               <td>
                   <button onclick="openEdit(${item.id})">Edit</button>
                   <button onclick="deleteItem(${item.id})">Delete</button>
               </td>
           </tr>
       `).join('');
   }
   ```

3. **Escape all user-supplied output** — always call `escapeHtml()` when rendering data into the DOM to prevent XSS.

4. **Link to the page** from the role's sidebar in `dashboard.html` and `{role}.js`.

## Checklist Before Finishing

- [ ] Repository: all queries use prepared statements, errors are caught and logged
- [ ] Controller: role checks applied on mutating actions, validator used on POST/PUT
- [ ] Route: correct HTTP method, correct auth flag, correct `{id}` vs `{uuid}` placeholder
- [ ] Frontend: `Auth.requireAuth()` called on page load, user data escaped before rendering
- [ ] New files use the correct `namespace App\Controllers` / `namespace App\Repositories`

## Key Utilities Reference

| Utility | Usage |
|---------|-------|
| `Response::success($data)` | 200 JSON response |
| `Response::created($data)` | 201 JSON response |
| `Response::notFound($msg)` | 404 JSON response |
| `Response::forbidden($msg)` | 403 JSON response |
| `Response::serverError($msg)` | 500 JSON response |
| `Response::paginated($data, $total, $page, $limit)` | Paginated list response |
| `Response::validationError($errors)` | 422 validation error |
| `Validator->required([...])` | Assert required fields present |
| `Validator->numeric($field)` | Assert numeric |
| `Validator->max($field, $len)` | Assert max string length |
| `RoleMiddleware->requireRole([...])` | Returns false + sends 403 if not authorized |
| `RoleMiddleware->isStudent()` etc. | Role checks that return bool |
| `UuidHelper::generate()` | Generate a UUID |
