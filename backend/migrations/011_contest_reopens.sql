-- ============================================================
-- Kenya Math Quest — per-student reopen of an ended contest
-- An admin can grant a specific student access to a contest that
-- has already ended (e.g. the student never took it). The row is
-- checked by the exam window gates (getExamData / acceptInstructions).
-- ============================================================

CREATE TABLE IF NOT EXISTS contest_reopens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contest_id INT NOT NULL,
  student_id INT NOT NULL,
  opened_by INT NOT NULL,
  opens_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  UNIQUE KEY uq_contest_reopen (contest_id, student_id),
  KEY idx_reopens_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;