-- ============================================================
-- Kenya Math Quest — instructions, revision materials, final answers
-- ============================================================

-- Student's typed FINAL answer, used by auto-marking (preferred over `answer`)
ALTER TABLE answers ADD COLUMN final_answer TEXT NULL AFTER answer;

-- Student has confirmed the compulsory paper instructions for a given attempt
ALTER TABLE exam_sessions ADD COLUMN instructions_accepted TINYINT(1) NOT NULL DEFAULT 0;

-- Compulsory written instructions, one per grade/form per contest.
-- Shown as the FIRST page when a student starts; they must agree before questions appear.
CREATE TABLE IF NOT EXISTS contest_instructions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contest_id INT NOT NULL,
  grade VARCHAR(20) NOT NULL,
  instructions LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_contest_grade (contest_id, grade),
  KEY idx_contest (contest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Revision / study materials uploaded by the admin, filtered by grade/form.
CREATE TABLE IF NOT EXISTS revision_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grade VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  content_type VARCHAR(20) NOT NULL DEFAULT 'link', -- 'link' | 'text' | 'file'
  content TEXT NULL,                                -- url / text body / file url
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_grade (grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;