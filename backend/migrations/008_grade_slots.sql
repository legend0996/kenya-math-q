-- ============================================================
-- Kenya Math Quest — per-grade contest day scheduling
-- Applied once via `node runMigrations.js` (tracked in schema_migrations)
-- ============================================================

-- Per-grade contest window. JSON object like:
--   {"Grade 7": {"start": "2026-08-10T09:00:00.000Z", "end": "2026-08-10T11:00:00.000Z"}, ...}
-- Grades missing from the map fall back to the contest's global start/end time.
ALTER TABLE contests ADD COLUMN grade_schedule JSON NULL;

-- Track how many retakes an admin has granted for a (student, contest) attempt.
ALTER TABLE results ADD COLUMN retake_count INT DEFAULT 0;
