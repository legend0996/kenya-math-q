-- Adds started_at/stopped_at to contests (used by instant test contests)
-- MySQL-compatible + idempotent (MySQL does not support ADD COLUMN IF NOT EXISTS).
SET @kmq_schema = DATABASE();
SET @kmq_has_started = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@kmq_schema AND TABLE_NAME='contests' AND COLUMN_NAME='started_at');
SET @kmq_has_stopped = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@kmq_schema AND TABLE_NAME='contests' AND COLUMN_NAME='stopped_at');
SET @kmq_sql = IF(@kmq_has_started = 0 AND @kmq_has_stopped = 0, 'ALTER TABLE contests ADD COLUMN started_at DATETIME NULL, ADD COLUMN stopped_at DATETIME NULL', 'SELECT 1');
PREPARE kmq_stmt FROM @kmq_sql;
EXECUTE kmq_stmt;
DEALLOCATE PREPARE kmq_stmt;
