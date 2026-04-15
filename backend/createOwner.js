import bcrypt from "bcrypt";
import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

// Use direct (non-pooler) endpoint for scripts — avoids PgBouncer routing issues
const directPool = new Pool({
  connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

const createOwner = async () => {
  try {
    const email = "owner@kmq.com";
    const password = "12345678";

    const hashed = await bcrypt.hash(password, 10);

    await directPool.query("INSERT INTO owners (email, password) VALUES ($1,$2)", [
      email,
      hashed,
    ]);

    console.log("✅ Owner created successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Error creating owner:", error.message || error);
    if (error.errors) error.errors.forEach(e => console.error("  •", e.message));
    process.exit(1);
  }
};

createOwner();
