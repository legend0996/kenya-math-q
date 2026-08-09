-- ============================================================
-- Kenya Math Quest — extended features migration
-- Applied once via `node runMigrations.js` (tracked in schema_migrations)
-- ============================================================

-- ── Username-based login (email OR username) ────────────────

ALTER TABLE schools ADD COLUMN username VARCHAR(100) NULL;
ALTER TABLE schools ADD UNIQUE KEY uq_schools_username (username);

ALTER TABLE owners ADD COLUMN username VARCHAR(100) NULL;
ALTER TABLE owners ADD UNIQUE KEY uq_owners_username (username);

-- ── Test contests (started/stopped instantly by an admin) ──
ALTER TABLE contests ADD COLUMN is_test TINYINT(1) DEFAULT 0;
ALTER TABLE contests ADD COLUMN test_open TINYINT(1) DEFAULT 0;

-- ── Multi-admin + permissions ───────────────────────────────
ALTER TABLE owners ADD COLUMN is_primary TINYINT(1) DEFAULT 0;
ALTER TABLE owners ADD COLUMN permissions JSON NULL;

CREATE TABLE IF NOT EXISTS admin_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  token VARCHAR(100) NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_req_email (email)
);

-- ── Password reset (15-minute expiring code) ────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_resets_code (email, code)
);

-- ── Support chat (student <-> admins) ───────────────────────
CREATE TABLE IF NOT EXISTS support_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_role VARCHAR(10) NOT NULL,          -- 'student' | 'school' | 'owner'
  author_id INT NOT NULL,
  sender_name VARCHAR(255) NULL,
  recipient_role VARCHAR(10) NULL,           -- role of who the reply targets
  recipient_id INT NULL,
  reply_to INT NULL,
  message TEXT NOT NULL,
  read_flag TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_support_author (author_id),
  KEY idx_support_recipient (recipient_id),
  KEY idx_support_created (created_at)
);

-- ── AI assistant knowledge base (the "trained doc") ─────────
CREATE TABLE IF NOT EXISTS assistant_docs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keywords TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);