import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const buildPoolConfig = () => {
  const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (mysqlUrl && /^mysql:\/\//i.test(mysqlUrl)) {
    try {
      const u = new URL(mysqlUrl);
      return {
        host: u.hostname,
        port: Number(u.port || 3306),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password || ""),
        database: decodeURIComponent(u.pathname.replace(/^\//, "")),
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_POOL_MAX || 50),
        queueLimit: 0,
      };
    } catch {
      // fall through to explicit env config below
    }
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_MAX || 50),
    queueLimit: 0,
    ssl: process.env.DB_SSL === "true" ? {} : undefined,
    ...(process.env.DB_SSL_CA ? { ssl: { ca: process.env.DB_SSL_CA } } : {}),
  };
};

const pool = mysql.createPool(buildPoolConfig());

const makePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let pw = "";
  const bytes = crypto.randomBytes(16);
  for (const b of bytes) pw += chars[b % chars.length];
  return pw;
};

const createOwner = async () => {
  try {
    const args = process.argv.slice(2);
    const argVal = (name) => {
      const hit = args.find((a) => a.startsWith(`--${name}=`));
      return hit ? hit.split("=").slice(1).join("=") : null;
    };

    const email = argVal("email") || process.env.OWNER_EMAIL;
    const password = argVal("password") || process.env.OWNER_PASSWORD || makePassword();

    if (!email) {
      console.error("❌ OWNER_EMAIL (or --email=) is required");
      process.exit(1);
    }
    if (password.length < 8) {
      console.error("❌ Owner password must be at least 8 characters");
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO owners (email, password) VALUES (?, ?) ON DUPLICATE KEY UPDATE password=VALUES(password)",
      [email, hashed],
    );

    console.log(`✅ Owner created successfully: ${email}`);
    if (!argVal("password") && !process.env.OWNER_PASSWORD) {
      console.log(`🔑 Generated password: ${password}`);
      console.log("   Save it now — it will not be shown again.");
    }
    process.exit();
  } catch (error) {
    console.error("❌ Error creating owner:", error.message || error);
    if (error.errors) error.errors.forEach((e) => console.error("  •", e.message));
    process.exit(1);
  }
};

createOwner();
