# Student Career & Scholarship Portal

A PHP/MySQL portal for students to discover scholarships and career opportunities, recruiters to publish openings, and administrators to review and manage portal data.

## Stack

HTML, CSS, vanilla JavaScript, PHP (PDO), and MySQL/MariaDB. No Node or npm is required.

## Run locally with XAMPP

1. Place this folder in `xampp/htdocs` and start Apache and MySQL.
2. Import `backend/database/schema.sql` in phpMyAdmin. It creates the `student_career_portal` database and starter scholarships.
3. In local development, set `APP_ENV=development` before using the optional `backend/setup.php` or demo-account scripts. Configure database values with `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASS` as needed; defaults are `127.0.0.1`, port `3306`, database `student_career_portal`, user `root`, and an empty password.
4. Optionally run `backend/create_demo_users.php` once to create demo accounts, then remove the file from deployed hosts.
5. Open `login.html`.

For an existing database, apply `backend/database/migration_2026_external_apply.sql` after backing it up. A fresh schema import already includes that migration.

## Demo accounts

- `admin@portal.local` / `Admin@123`
- `recruiter@portal.local` / `Recruiter@123`
- `student@portal.local` / `Student@123`

## Structure

- `backend/` — authentication, API, database setup, and role-protected operations
- `student/` — student pages
- `recruit/` — canonical recruiter pages
- `Admin/` — administration pages
- `css/`, `js/` — shared assets
- `uploads/profile/` — validated student profile images

The root `recruiter_dashboard.html` and `recruter_summit.html` are compatibility redirects to the canonical `recruit/` module. Do not edit them as separate dashboards.

## Security and deployment

Set `APP_ENV=production` and database credentials in your hosting environment. In production, setup and demo-account helper scripts are disabled; `backend/test.php` is intentionally unavailable. The health endpoint requires an authenticated admin and returns no server/database details. Use HTTPS and ensure `uploads/` is writable by PHP.

See `DEPLOYMENT_AND_CHANGES.md` for the feature and API changelog, and `PROJECT_REVIEW.md` for the audit history.
