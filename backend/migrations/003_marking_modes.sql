-- ============================================================
-- Kenya Math Quest — marking modes, question working space, construction
-- ============================================================

-- Auto vs manual marking per contest ('auto' | 'manual')
ALTER TABLE contests ADD COLUMN marking_mode VARCHAR(10) NOT NULL DEFAULT 'auto';

-- Height of the student's working space per question (px), set by admin
ALTER TABLE questions ADD COLUMN working_space SMALLINT NOT NULL DEFAULT 240;

-- Student review: mark the exam paper as "can be reviewed by student"
ALTER TABLE results ADD COLUMN reviewable TINYINT(1) DEFAULT 0;
ALTER TABLE results ADD COLUMN marked_by INT NULL;