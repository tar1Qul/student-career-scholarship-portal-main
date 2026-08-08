# Database Setup

This folder contains the MySQL/MariaDB schema for the Student Career & Scholarship Portal.

## Import

1. Start Apache and MySQL from XAMPP.
2. Open http://localhost/phpmyadmin/
3. Click **Import**.
4. Select `backend/database/schema.sql`.
5. Click **Import**.

The schema creates the database:

`student_career_portal`

Main tables:

- `users`
- `student_profiles`
- `recruiter_profiles`
- `scholarships`
- `opportunities`
- `applications`
- `saved_items`
- `verifications`
- `career_resources`
- `notifications`

## Important

The database is not a file that the browser can directly use. MySQL/MariaDB runs separately through XAMPP, while PHP in `backend/` connects to it through `backend/config.php`.

After importing the schema, test:

`http://localhost/student-career-scholarship-portal-main-main/backend/create_demo_users.php`

Then remove `create_demo_users.php` after creating the local demo accounts.

The current frontend is still mostly static. The next step is to connect individual pages to PHP APIs, starting with:

1. registration/login
2. student profile
3. opportunities/scholarships listing
4. applications
5. recruiter opportunity submission
6. admin verification/management
7. notifications
