-- ============================================================
-- Kenya Math Quest — security hardening migration
-- Applied once via `node runMigrations.js`
-- ============================================================

-- Store a SHA-256 hash of password-reset codes (never the plaintext)
ALTER TABLE password_resets ADD COLUMN code_hash VARCHAR(64) NULL;
ALTER TABLE password_resets ADD COLUMN attempts INT DEFAULT 0;
CREATE INDEX idx_resets_email_used ON password_resets (email, used);

-- Certificates: store a hash of the download secret instead of plaintext.
-- The generated 8-char secret is 40-bit; SHA-256 makes DB leakage useless.
ALTER TABLE certificates ADD COLUMN password_hash VARCHAR(128) NULL;

-- Idempotency: only one payment row may own a given M-Pesa checkout request.
ALTER TABLE payments ADD UNIQUE KEY uq_payments_checkout_request (checkout_request_id);

-- Exam sessions record the grade at session creation so a mid-attempt
-- grade change cannot re-target the paper after the exam has started.
ALTER TABLE exam_sessions ADD COLUMN grade VARCHAR(50) NULL;

-- Parent-child links now require child consent. status:
--   'pending'  — consent requested, confirming
--   'confirmed'— shared with child
-- link_code_hash is a SHA-256 hash of the one-time secret shown to the student.
ALTER TABLE parent_links ADD COLUMN status VARCHAR(20) DEFAULT 'confirmed';
ALTER TABLE parent_links ADD COLUMN link_code_hash VARCHAR(64) NULL;
ALTER TABLE parent_links ADD COLUMN link_expires DATETIME NULL;
CREATE INDEX idx_parent_links_status ON parent_links (status);