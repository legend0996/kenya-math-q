-- ============================================================
-- Kenya Math Quest — Full MySQL schema (idempotent baseline)
-- Apply via: node runMigrations.js
-- ============================================================

CREATE TABLE IF NOT EXISTS owners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  county VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  school VARCHAR(255),
  school_id INT,
  grade VARCHAR(50),
  county VARCHAR(255),
  parent_phone VARCHAR(50),
  student_phone VARCHAR(50),
  paid TINYINT(1) DEFAULT 0,
  registered TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_students_school (school)
);

CREATE TABLE IF NOT EXISTS contests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contest_number VARCHAR(100),
  year VARCHAR(20),
  start_time DATETIME,
  end_time DATETIME,
  status VARCHAR(50) DEFAULT 'upcoming',
  registration_open TINYINT(1) DEFAULT 0,
  results_released TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_contests_open (registration_open)
);

CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  contest_id INT NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_registration (student_id, contest_id),
  KEY idx_reg_contest (contest_id),
  CONSTRAINT fk_reg_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_contest FOREIGN KEY (contest_id) REFERENCES contests (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contest_id INT NOT NULL,
  grade VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT,
  marks INT DEFAULT 1,
  type VARCHAR(50) DEFAULT 'mcq',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_questions_contest_grade (contest_id, grade)
);

CREATE TABLE IF NOT EXISTS answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  contest_id INT NOT NULL,
  question_id INT NOT NULL,
  answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_answers_student (student_id, contest_id)
);

CREATE TABLE IF NOT EXISTS results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  contest_id INT NOT NULL,
  score INT DEFAULT 0,
  grade VARCHAR(50),
  completed TINYINT(1) DEFAULT 0,
  timed_out TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_result (student_id, contest_id),
  KEY idx_result_contest_score (contest_id, score),
  CONSTRAINT fk_result_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  contest_id INT,
  registration_id INT,
  mpesa_code VARCHAR(100),
  proof_text TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  provider VARCHAR(50) DEFAULT 'manual',
  stk_phone VARCHAR(50),
  amount DECIMAL(10,2) DEFAULT 0,
  checkout_request_id VARCHAR(100),
  merchant_request_id VARCHAR(100),
  mpesa_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payments_mpesa_code (mpesa_code),
  KEY idx_payments_status (status)
);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  contest_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  current_index INT DEFAULT 0,
  answers JSON,
  time_remaining INT,
  total_seconds INT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  shuffle_seed INT DEFAULT 1,
  violations INT DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_exam_session (student_id, contest_id),
  KEY idx_session_expiry (status, expires_at),
  CONSTRAINT fk_session_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contest_papers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contest_id INT NOT NULL,
  grade VARCHAR(50) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 10,
  UNIQUE KEY uq_contest_paper (contest_id, grade)
);

CREATE TABLE IF NOT EXISTS certificate_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contest_id INT UNIQUE,
  title VARCHAR(255) DEFAULT 'Certificate of Achievement',
  subtitle VARCHAR(255) DEFAULT 'KENYA MATH QUEST',
  bg_color VARCHAR(50) DEFAULT '#ffffff',
  text_color VARCHAR(50) DEFAULT '#0f172a',
  accent_color VARCHAR(50) DEFAULT '#2563eb',
  logo_url VARCHAR(500),
  signature_url VARCHAR(500),
  stamp_url VARCHAR(500),
  elements JSON,
  published TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  contest_id INT NOT NULL,
  score INT,
  grade VARCHAR(50),
  password VARCHAR(50),
  file_url VARCHAR(500),
  sent_status VARCHAR(50) DEFAULT 'unsent',
  school VARCHAR(255),
  template_id INT,
  source VARCHAR(20) DEFAULT 'generated',  -- generated | manual
  notes VARCHAR(1000),
  is_visible TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_certificates_student (student_id, contest_id),
  CONSTRAINT fk_cert_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);
