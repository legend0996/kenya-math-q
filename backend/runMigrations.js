import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import db from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// Split raw SQL into statements: strip full-line comments, split on ";".
const splitStatements = (sql) =>
  sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const applyStatements = async (label, statements) => {
  let ok = 0;
  let err = 0;
  for (const stmt of statements) {
    try {
      await db.query(stmt);
      ok++;
      console.log("  ✔ " + stmt.split("\n")[0].slice(0, 78));
    } catch (e) {
      err++;
      console.error("  ✘ " + e.message);
    }
  }
  console.log(`  ${label}: ${ok} applied, ${err} failed`);
  return err;
};

const ensureMigrationsTable = async () => {
  await db.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(255) NOT NULL UNIQUE,
       applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )`,
  );
};

const isApplied = async (name) => {
  const r = await db.query("SELECT 1 FROM schema_migrations WHERE name=?", [name]);
  return r.rows.length > 0;
};

const markApplied = async (name) => {
  await db.query(
    "INSERT INTO schema_migrations (name) VALUES (?) ON DUPLICATE KEY UPDATE name=name",
    [name],
  );
};

const main = async () => {
  await ensureMigrationsTable();

  // ── Baseline: full MySQL schema ──
  const baselineName = "migrations.sql";
  if (!(await isApplied(baselineName))) {
    console.log(`Applying baseline ${baselineName}...`);
    const raw = fs.readFileSync(path.join(__dirname, baselineName), "utf-8");
    const err = await applyStatements(baselineName, splitStatements(raw));
    if (err === 0) await markApplied(baselineName);
    else console.error(`⚠ baseline had ${err} failures — will not record as applied`);
  } else {
    console.log(`Skipping ${baselineName} (already applied)`);
  }

  // ── Versioned migrations (migrations/*.sql), each applied once ──
  const dir = path.join(__dirname, "migrations");
  if (fs.existsSync(dir)) {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      if (await isApplied(file)) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }
      console.log(`Applying ${file}...`);
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        let failed = false;
        for (const stmt of splitStatements(raw)) {
          try {
            await conn.query(stmt);
            console.log("  ✔ " + stmt.split("\n")[0].slice(0, 78));
          } catch (e) {
            console.error("  ✘ " + e.message);
            failed = true;
            throw e;
          }
        }
        await conn.commit();
        await markApplied(file);
        console.log(`  ${file}: applied`);
      } catch (e) {
        await conn.rollback();
        console.error(`  ${file} FAILED and rolled back: ${e.message}`);
      } finally {
        conn.release();
      }
    }
  }

  await db.pool.end();
  console.log("✅ Migrations complete");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
