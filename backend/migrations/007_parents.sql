-- ============================================================
-- Kenya Math Quest — parent accounts & child linking
-- Applied once via `node runMigrations.js`
-- ============================================================

CREATE TABLE IF NOT EXISTS parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  username VARCHAR(100) NULL,
  UNIQUE KEY uq_parents_username (username),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Links a parent account to a student account (verified by phone match)
CREATE TABLE IF NOT EXISTS parent_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NOT NULL,
  student_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_parent_link (parent_id, student_id),
  CONSTRAINT fk_pl_parent FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE,
  CONSTRAINT fk_pl_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);
