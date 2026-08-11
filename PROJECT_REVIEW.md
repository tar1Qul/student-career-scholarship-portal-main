# Project Review / Fix Log

## Critical issues found
1. `register.html` and `login.html` used `../index.html` and other invalid parent-directory links even though they are already at the project root.
2. Register/login footer links pointed to pages that do not exist at those paths.
3. Admin pages referenced `js/admin.js` and `images/*.jpg` using paths that do not exist from the `Admin/` directory.
4. `Admin/admin_dashboard.html` contained links to `opportunity-verification.html` and `career-management.html`, which do not exist.
5. The project had authentication PHP files but almost no backend integration for the actual dashboard features.
6. Recruiter submit/delete/profile actions were demo-only JavaScript (`alert()`, `localStorage`) instead of database operations.
7. Student opportunity/scholarship/application/saved/notification pages were static/demo data.
8. There was no central API for CRUD operations.
9. Role pages had no reliable session/role protection.
10. The duplicate root recruiter pages could become inconsistent with the canonical `recruit/` pages.
11. Demo accounts did not include a student account.
12. There was no convenient first-time database setup/check page.

## Changes made
- Fixed all broken local HTML/CSS/JS/image references.
- Added `backend/setup.php`.
- Added `backend/health.php`.
- Added `backend/api.php` for authenticated student/recruiter/admin operations.
- Improved login handling and role redirects.
- Improved registration validation.
- Added student demo account.
- Added session/role guarding through `js/portal.js`.
- Connected student opportunities, scholarships, applications, saved items and notifications.
- Connected student profile update.
- Connected recruiter dashboard, opportunity submission and deletion.
- Connected recruiter profile update.
- Connected admin user status management.
- Connected admin opportunity approval/rejection.
- Connected admin scholarship approval/rejection and listing.
- Added notification creation for applications and opportunity status changes.
- Replaced duplicate root recruiter pages with redirects to the canonical recruiter module.
- Updated database README with exact XAMPP setup and testing instructions.

## Validation performed
- All PHP files pass `php -l`.
- All JavaScript files pass `node --check`.
- All local HTML `href`/`src` references resolve to existing project files after removing URL fragments.
- The database schema remains the source of truth for MySQL/MariaDB.
