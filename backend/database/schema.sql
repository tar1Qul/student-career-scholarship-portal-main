-- ============================================================
-- Student Career & Scholarship Portal
-- MySQL / MariaDB database schema
-- Import this file in phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_career_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE student_career_portal;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS saved_items;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS verifications;
DROP TABLE IF EXISTS career_resources;
DROP TABLE IF EXISTS scholarships;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS recruiter_profiles;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USERS
-- One authentication table for student / recruiter / admin
-- ============================================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student','recruiter','admin') NOT NULL DEFAULT 'student',
    phone VARCHAR(30) NULL,
    status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. STUDENT PROFILES
-- ============================================================

CREATE TABLE student_profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    university VARCHAR(180) NOT NULL,
    department VARCHAR(150) NOT NULL,
    cgpa DECIMAL(3,2) NULL,
    graduation_year YEAR NULL,
    bio TEXT NULL,
    skills TEXT NULL,
    resume_path VARCHAR(500) NULL,
    profile_image VARCHAR(500) NULL,
    linkedin_url VARCHAR(500) NULL,
    portfolio_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_profile_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_student_university (university),
    INDEX idx_student_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. RECRUITER PROFILES
-- ============================================================

CREATE TABLE recruiter_profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    company_name VARCHAR(180) NOT NULL,
    designation VARCHAR(120) NULL,
    company_email VARCHAR(190) NULL,
    company_phone VARCHAR(30) NULL,
    company_website VARCHAR(500) NULL,
    company_description TEXT NULL,
    company_logo VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_recruiter_profile_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. SCHOLARSHIPS
-- Admin-created scholarship listings
-- ============================================================

CREATE TABLE scholarships (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(220) NOT NULL,
    provider VARCHAR(180) NOT NULL,
    category VARCHAR(100) NULL,
    amount VARCHAR(120) NULL,
    description TEXT NULL,
    eligibility TEXT NULL,
    application_url VARCHAR(500) NULL,
    deadline DATE NULL,
    status ENUM('draft','pending','approved','rejected','closed') NOT NULL DEFAULT 'draft',
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_scholarship_creator
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_scholarship_status (status),
    INDEX idx_scholarship_deadline (deadline),
    INDEX idx_scholarship_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. CAREER / JOB / INTERNSHIP OPPORTUNITIES
-- Recruiters submit opportunities; admin approves them
-- ============================================================

CREATE TABLE opportunities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recruiter_id INT UNSIGNED NOT NULL,
    title VARCHAR(220) NOT NULL,
    organization VARCHAR(180) NOT NULL,
    category VARCHAR(100) NULL,
    opportunity_type ENUM('job','internship','research','competition','other')
        NOT NULL DEFAULT 'job',
    employment_type VARCHAR(80) NULL,
    location VARCHAR(180) NULL,
    work_mode ENUM('onsite','remote','hybrid') NULL,
    salary VARCHAR(120) NULL,
    description TEXT NULL,
    requirements TEXT NULL,
    benefits TEXT NULL,
    application_url VARCHAR(500) NULL,
    deadline DATE NULL,
    status ENUM('draft','pending','approved','rejected','closed') NOT NULL DEFAULT 'pending',
    admin_note TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_opportunity_recruiter
        FOREIGN KEY (recruiter_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_opportunity_recruiter (recruiter_id),
    INDEX idx_opportunity_status (status),
    INDEX idx_opportunity_type (opportunity_type),
    INDEX idx_opportunity_deadline (deadline),
    INDEX idx_opportunity_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. APPLICATIONS
-- A student can apply to either a scholarship OR an opportunity
-- ============================================================

CREATE TABLE applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    opportunity_id INT UNSIGNED NULL,
    scholarship_id INT UNSIGNED NULL,
    resume_path VARCHAR(500) NULL,
    cover_letter TEXT NULL,
    status ENUM('pending','under_review','accepted','rejected','withdrawn')
        NOT NULL DEFAULT 'pending',
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_application_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_application_opportunity
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_application_scholarship
        FOREIGN KEY (scholarship_id) REFERENCES scholarships(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_student_opportunity (student_id, opportunity_id),
    UNIQUE KEY uq_student_scholarship (student_id, scholarship_id),

    INDEX idx_application_student (student_id),
    INDEX idx_application_status (status),
    INDEX idx_application_opportunity (opportunity_id),
    INDEX idx_application_scholarship (scholarship_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. SAVED ITEMS
-- Student bookmarks scholarships/opportunities
-- ============================================================

CREATE TABLE saved_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    opportunity_id INT UNSIGNED NULL,
    scholarship_id INT UNSIGNED NULL,
    saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_saved_opportunity
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_saved_scholarship
        FOREIGN KEY (scholarship_id) REFERENCES scholarships(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_saved_opportunity (student_id, opportunity_id),
    UNIQUE KEY uq_saved_scholarship (student_id, scholarship_id),

    INDEX idx_saved_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. VERIFICATIONS
-- Student document verification + admin review records
-- ============================================================

CREATE TABLE verifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NULL,
    opportunity_id INT UNSIGNED NULL,
    scholarship_id INT UNSIGNED NULL,
    verification_type ENUM('student_document','opportunity','scholarship')
        NOT NULL,
    document_type VARCHAR(100) NULL,
    document_path VARCHAR(500) NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reviewed_by INT UNSIGNED NULL,
    review_note TEXT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,

    CONSTRAINT fk_verification_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT fk_verification_opportunity
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_verification_scholarship
        FOREIGN KEY (scholarship_id) REFERENCES scholarships(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_verification_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_verification_status (status),
    INDEX idx_verification_type (verification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. CAREER RESOURCES
-- Admin-managed resources/articles
-- ============================================================

CREATE TABLE career_resources (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(220) NOT NULL,
    category VARCHAR(100) NULL,
    description TEXT NULL,
    resource_url VARCHAR(500) NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_resource_creator
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_resource_status (status),
    INDEX idx_resource_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(220) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NULL,
    related_application_id INT UNSIGNED NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_notification_application
        FOREIGN KEY (related_application_id) REFERENCES applications(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_notification_user_read (user_id, is_read),
    INDEX idx_notification_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- OPTIONAL DEMO ADMIN
-- Password is intentionally not hard-coded here.
-- Use backend/create_demo_users.php to create demo accounts.
-- ============================================================

-- ============================================================
-- END OF SCHEMA
-- ============================================================
