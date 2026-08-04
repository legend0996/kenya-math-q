-- Adds started_at/stopped_at to contests (used by instant test contests)
ALTER TABLE contests
  ADD COLUMN IF NOT EXISTS started_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS stopped_at DATETIME NULL;
