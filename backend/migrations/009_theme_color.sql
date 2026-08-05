-- ============================================================
-- Kenya Math Quest — per-student dashboard theme colour
-- Applied once via `node runMigrations.js`
-- ============================================================

ALTER TABLE students ADD COLUMN theme_color VARCHAR(20) NULL;
