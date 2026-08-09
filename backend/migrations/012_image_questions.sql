-- ============================================================
-- Kenya Math Quest — image questions
-- Applied once via `node runMigrations.js`
-- ============================================================

-- A question may carry an optional image (diagram/figure). The column
-- stores just the uploaded file name; it is served through the
-- token-gated /api/uploads/questions/... route (never public).
ALTER TABLE questions ADD COLUMN question_image VARCHAR(255) NULL;