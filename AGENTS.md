# LMS Workspace Guidance

This repository is split into a PHP API in [lms-api](lms-api) and a static HTML/Tailwind frontend in [lms-frontend](lms-frontend). Prefer the existing docs over repeating them: [frontend README](lms-frontend/README.md), [frontend development plan](lms-frontend/DEVELOPMENT-PLAN.md), [assessment notes](lms-frontend/ASSESSMENT.md), and [email setup](lms-api/EMAIL-SETUP.md).

## Where to work

- API entry point: [lms-api/public/index.php](lms-api/public/index.php)
- API routes: [lms-api/src/Routes/api.php](lms-api/src/Routes/api.php)
- API controllers, repositories, middleware, and utilities live under [lms-api/src](lms-api/src)
- Frontend role pages live under [lms-frontend/admin](lms-frontend/admin), [lms-frontend/teacher](lms-frontend/teacher), [lms-frontend/student](lms-frontend/student), [lms-frontend/parent](lms-frontend/parent), and [lms-frontend/superadmin](lms-frontend/superadmin)
- Shared frontend assets are under [lms-frontend/assets](lms-frontend/assets)

## Working conventions

- Keep route names, controller names, and role prefixes aligned between the frontend and [lms-api/src/Routes/api.php](lms-api/src/Routes/api.php).
- Use the existing PHP response helpers, JWT auth middleware, and repository layer instead of adding parallel patterns.
- Treat announcement visibility as institution-scoped and audience-scoped; teacher announcements must not leak to admins unless the admin authored them.
- Preserve the existing audit and activity surfaces when touching logging: [user-activity](lms-api/src/Routes/api.php), [admin-activity](lms-api/src/Routes/api.php), [superadmin-activity](lms-api/src/Routes/api.php), [login-activity](lms-api/src/Routes/api.php), and the activity logging in [AuthMiddleware](lms-api/src/Middleware/AuthMiddleware.php).
- Keep frontend changes in the existing HTML and Tailwind workflow; do not invent a new SPA stack.
- If you change a page's behavior, update the matching API route, controller, and frontend call site together.

## Commands to remember

- Frontend CSS watch: `npm run tailwind:dev` from [lms-frontend](lms-frontend)
- Frontend CSS build: `npm run tailwind:build` from [lms-frontend](lms-frontend)
- Frontend vendor copy: `npm run vendor:copy` from [lms-frontend](lms-frontend)
- API local run: `php -S localhost:8000 router.php` from [lms-api/public](lms-api/public)
- API dependencies: `composer install` from [lms-api](lms-api)
- Windows helper scripts exist at the repo root, including [run_sever.bat](run_sever.bat) and [start_sever.bat](start_sever.bat)

## Pitfalls

- There are no automated tests wired up for most frontend work, so validate changes by checking the relevant page and API response path.
- Several pages are still incomplete; check [frontend README](lms-frontend/README.md) and [development plan](lms-frontend/DEVELOPMENT-PLAN.md) before filling gaps.
- Some scripts parse environment values that include inline comments; strip anything after `#` when reading those settings.