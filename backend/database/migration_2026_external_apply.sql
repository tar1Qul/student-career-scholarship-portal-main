-- ============================================================
-- Migration: external application URL tracking
-- Run this ONLY if you already have an existing database created
-- from an older copy of schema.sql. A fresh import of schema.sql
-- already includes these changes and does not need this file.
-- ============================================================

USE student_career_portal;

-- opportunities.application_url already exists in older schema copies
-- in most cases; this is a safe no-op if it's already there. Requires
-- MySQL 8.0.29+ / MariaDB 10.0+. If your server is older, run
-- `ALTER TABLE opportunities ADD COLUMN application_url VARCHAR(500) NULL AFTER benefits;`
-- manually and ignore the duplicate-column error if it already exists.
ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS application_url VARCHAR(500) NULL AFTER benefits;

-- Add the 'redirected' status used when a student clicks an external
-- application link (see backend/api.php action=apply).
ALTER TABLE applications
    MODIFY COLUMN status ENUM('pending','under_review','shortlisted','accepted','rejected','withdrawn','redirected')
    NOT NULL DEFAULT 'pending';


