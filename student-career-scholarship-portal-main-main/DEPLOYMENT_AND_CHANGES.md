# Deployment, Testing & Changelog

This file documents what changed in this pass and how to get the site running,
locally and on cloud hosting. See `PROJECT_REVIEW.md` for the state the
project was already in before this update.

## 1. What was broken / missing before this update

1. **`js/portal.js` was never included in most pages.** A working backend
   integration layer existed but wasn't wired into `student/student_*.html`,
   `recruit/recruit_post.html`, `recruit/recruiter_dashboard.html`, or any
   `Admin/*.html` page. Those pages showed static demo content only.
2. **No recruiter registration.** `register.html` only created students.
3. **No external-application-URL flow.** The spec requires that recruiters
   post a link to LinkedIn/Indeed/etc. and students get redirected there when
   they click Apply, with the click tracked on our side. This didn't exist.
4. **No opportunity edit**, and no way for a recruiter to open/close their own
   listing without an admin.
5. **`backend/config.php` hardcoded `localhost` / `root` / empty password**,
   which is fine for XAMPP but not deployable to cloud hosting as-is.
6. Two broken relative `<script src>` paths (`student/dashboard.html` and the
   five `Admin/*.html` pages).
7. Admin table rendering didn't match the number of columns in each page's
   `<thead>`.
8. The "Add Scholarship" button had no behaviour.

## 2. What changed

### Backend (`backend/`)
- **`config.php`** — rewritten to read `DB_HOST`, `DB_PORT`, `DB_NAME`,
  `DB_USER`, `DB_PASS`, `DB_CHARSET`, `APP_URL`, `APP_ENV` from real
  environment variables first, falling back to an optional `backend/.env`
  file (see `.env.example`), and only then to local XAMPP-style defaults.
  Also hardens the session cookie (`httponly`, `secure` on HTTPS,
  `samesite=Lax`).
- **`register.php`** — rewritten to accept a `role` field (`student` or
  `recruiter`) and create the matching profile row
  (`student_profiles` / `recruiter_profiles`).
- **`api.php`**:
  - `opportunity_create` / new `opportunity_update` now require and validate
    `application_url`.
  - New `opportunity_get` (recruiter: own only; admin: any).
  - New `opportunity_status` — lets a recruiter toggle their **already
    approved** listing between `approved` and `closed` without admin
    involvement (they still can't self-approve a pending/rejected one).
  - `apply` now looks up `application_url` on the opportunity/scholarship.
    If present, the application row is stored with `status = 'redirected'`
    and the response includes `redirect_url` so the frontend can send the
    student to the external site. If the student already applied, the same
    `redirect_url` is returned again instead of a hard error.
  - New `admin_scholarship_create` is now reachable from the UI.
- **`setup.php`** — no longer hardcodes DB credentials; uses the same
  env/.env resolution as `config.php`.
- **`login.php` / `logout.php` / `session_check.php` / `admin_session.php`**
  — reordered so `config.php` (and its cookie hardening) loads **before**
  `session_start()`.
- New `backend/.env.example`, `.gitignore`.
- New `backend/database/migration_2026_external_apply.sql` for existing
  databases (adds `application_url` if missing, extends the `applications`
  status enum with `redirected`). A fresh import of `schema.sql` already has
  both.

### Frontend
- Added `<script src="../js/portal.js"></script>` to every page that had no
  backend wiring at all (`student/student_applications.html`,
  `student_notifications.html`, `student_opportunities.html`,
  `student_saved.html`, `student_scholarships.html`, `student_settings.html`,
  `recruit/recruit_post.html`, `recruit/recruiter_dashboard.html`, all
  `Admin/*.html` pages). Deliberately **not** added to
  `student/dashboard.html`, `student/student_profile.html`, or
  `recruit/recruiter_profile.html`, which already had their own working,
  dedicated scripts — adding it there would have caused duplicate/competing
  API calls.
- `register.html` — added a Student/Recruiter tab toggle with recruiter-only
  fields (company name, designation, company website).
- `recruit/recruit_post.html` and the embedded "Post Opportunity" tab in
  `recruit/recruiter_dashboard.html` — added a required **External
  application URL** field and an `id="eligibility"` on the requirements
  textarea (it previously had no id and was silently ignored).
- `recruit/recruiter_dashboard.html` — table rows now include working
  View / Edit / Applicants / Open-Close / Delete actions.
- `js/portal.js`:
  - `applyAndRedirect()` — records the click via `apply`, then opens
    `redirect_url` in a new tab.
  - Recruiter opportunity form now supports both create and edit
    (`?id=` query param), shared between the standalone page and the
    dashboard's embedded tab.
  - Admin table rendering (`renderAdminTable`) rewritten so the column count
    and order match each page's actual `<thead>` (user-management,
    career-opportunities, Admin_verification, scholarship-management are all
    different).
  - "Add Scholarship" button now prompts for the fields and calls
    `admin_scholarship_create`.
- Fixed two broken script paths: `student/dashboard.html` was loading
  `../js/student_auth.js` (doesn't exist) instead of
  `../recruit/js/student_auth.js`; the five `Admin/*.html` pages were loading
  `js/admin.js` instead of `admin.js`.

## 3. Local setup (XAMPP-style)

1. Start Apache + MySQL.
2. Put the project folder under your web root (e.g. `htdocs/`).
3. Visit `backend/setup.php` once — it creates the database and tables using
   `backend/config.php`'s defaults (`127.0.0.1` / `root` / empty password).
4. (Optional) visit `backend/create_demo_users.php` once to create demo
   admin/recruiter/student accounts, then delete that file.
5. Visit `login.html` (or `register.html` to create a real student/recruiter
   account).

If your local MySQL needs different credentials, copy
`backend/.env.example` to `backend/.env` and edit it — no code changes
needed.

## 4. Cloud deployment

1. Set these as real environment variables on your host (preferred), or
   copy `backend/.env.example` to `backend/.env` and fill it in:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
   - `APP_URL` (your public site URL)
   - `APP_ENV=production` (hides raw DB errors from users)
2. Visit `/backend/setup.php` once to install the schema, then delete it
   (or block access to it) — same as local setup.
3. Make sure the `uploads/` directory (created automatically by
   `register.php` on first profile-image upload) is writable by PHP.
4. Serve the site over HTTPS — `config.php` automatically marks the session
   cookie `secure` when it detects HTTPS (`$_SERVER['HTTPS']` or the
   `X-Forwarded-Proto` header behind a reverse proxy).
5. Delete `backend/create_demo_users.php`, `backend/repair_demo_accounts.php`,
   and `backend/test.php` before going live — they're local/dev-only helpers.

## 5. New/changed API actions (`backend/api.php`, called as `?action=...`)

| Action | Role | Notes |
|---|---|---|
| `opportunity_get` | recruiter (own only), admin (any) | `{id}` — used by the edit form |
| `opportunity_update` | recruiter (own only) | Re-submits listing as `pending` |
| `opportunity_status` | recruiter (own only) | `{id, status}` — `approved` ↔ `closed` only |
| `apply` | student | Now returns `redirect_url` when the item has an external application URL |
| `admin_scholarship_create` | admin | Now reachable from the "Add Scholarship" button |

All existing actions from the previous build are unchanged in shape.

## 6. Testing checklist

- **Student**: register → login → browse opportunities → click Apply →
  confirm a new tab opens to the recruiter's external URL, and that the
  application shows up under "My Applications" with status `redirected`.
  Try applying twice to the same opportunity — should not error, should just
  redirect again.
- **Recruiter**: register (choose the Recruiter tab) → login → post an
  opportunity with an external URL → confirm it's `pending` → (as admin)
  approve it → confirm it appears to students → edit it as the recruiter →
  confirm it goes back to `pending` → close/reopen it → delete it.
- **Security**: as Recruiter A, try to call `opportunity_update` /
  `opportunity_status` / `opportunity_delete` with Recruiter B's opportunity
  `id` — should be rejected (403/404), never succeed.
- **Admin**: login → dashboard stats are non-zero after the above → approve/
  reject an opportunity → activate/deactivate a user → create a scholarship
  via "Add Scholarship" → approve/reject/close/delete it.
