-- ============================================================
-- Kenya Math Quest — marking, admin promotion & contest fees
-- Applied once via `node runMigrations.js`
-- ============================================================

-- ── Contest entry fee (admin sets the payment amount per contest) ──
ALTER TABLE contests ADD COLUMN entry_fee DECIMAL(10,2) NULL;
ALTER TABLE contests ADD COLUMN cat_total DECIMAL(10,2) NULL;

-- ── Promote students to administrators (with permissions) ──
ALTER TABLE students ADD COLUMN is_admin TINYINT(1) DEFAULT 0;
ALTER TABLE students ADD COLUMN permissions JSON NULL;

-- ── Student "working" drawings (finger-written working per question) ──
ALTER TABLE answers ADD COLUMN working LONGTEXT NULL;

-- ── Per-question manual marking + final percentage ──
CREATE TABLE IF NOT EXISTS question_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  contest_id INT NOT NULL,
  question_id INT NOT NULL,
  marks_awarded DECIMAL(6,2) NOT NULL DEFAULT 0,
  annotation LONGTEXT NULL,            -- admin's red-pen overlay (tick/cross) dataURL
  corrected TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_qmark (student_id, contest_id, question_id)
);

ALTER TABLE results ADD COLUMN percentage DECIMAL(6,2) NULL;
ALTER TABLE results ADD COLUMN marked TINYINT(1) DEFAULT 0;
ALTER TABLE results ADD COLUMN cat_total DECIMAL(10,2) NULL;