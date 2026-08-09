import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local/dev values first…
dotenv.config({ path: path.join(__dirname, "../.env") });

// …then the production config that ships in the deployment zip
// (.env.production: NODE_ENV=production + real credentials). If it exists on
// the server, its values are authoritative so production settings (DB, SMTP,
// OPENAI_API_KEY, …) are actually used.
const PROD_ENV_PATH = path.join(__dirname, "../.env.production");
if (fs.existsSync(PROD_ENV_PATH)) {
  try {
    const parsed = dotenv.parse(fs.readFileSync(PROD_ENV_PATH));
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined) process.env[key] = value;
    }
  } catch (e) {
    console.error("WARN: could not load .env.production:", e.message);
  }
}

const PROD = process.env.NODE_ENV === "production";

// Build the MySQL pool config, preferring a single connection URL
// (DATABASE_URL / MYSQL_URL) when individual DB_* credentials are not set.
function buildPoolConfig() {
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
        timezone: "Z",
        dateStrings: false,
        ssl: process.env.DB_SSL === "true" ? {} : undefined,
        ...(process.env.DB_SSL_CA
          ? { ssl: { ca: process.env.DB_SSL_CA } }
          : {}),
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
    timezone: "Z",
    dateStrings: false,
    ssl: process.env.DB_SSL === "true" ? {} : undefined,
    ...(process.env.DB_SSL_CA
      ? { ssl: { ca: process.env.DB_SSL_CA } }
      : {}),
  };
}

function validateConfig() {
  // Explicitly chosen TLS policy: cPanel same-host MySQL often has no TLS,
  // so DB_SSL=false is a valid production setting. Reject only an unset one.
  if (PROD && process.env.DB_SSL === undefined && !process.env.DB_SSL_CA) {
    throw new Error(
      "DB_SSL must be explicitly set to 'true' or 'false' in production (set DB_SSL=false for a same-host cPanel database without TLS).",
    );
  }
  if (PROD && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production.");
  }
}

validateConfig();

const pool = mysql.createPool(buildPoolConfig());

// Normalize common PostgreSQL-style placeholders and casts for MySQL compatibility.
function toMysql(sql, params = []) {
  let substituted = false;
  const outParams = [];
  const out = String(sql)
    .replace(/\$(\d+)/g, (_m, n) => {
      substituted = true;
      outParams.push(params[Number(n) - 1]);
      return "?";
    })
    .replace(/::(jsonb|json|text|integer|bigint|numeric|decimal|timestamp|boolean|interval)/g, "")
    .replace(/\bJSONB\b/g, "JSON")
    .replace(/\bBOOLEAN\b/g, "TINYINT(1)")
    .replace(/\bNULLS LAST\b/g, "")
    .replace(/\bNULLS FIRST\b/g, "")
    .replace(/\bILIKE\b/g, "LIKE");
  // If no $N placeholders were present, pass the original params through
  // so queries that already use MySQL's `?` still get their values bound.
  return { sql: out, params: substituted ? outParams : params };
}

// MySQL duplicate-key (errno 1062 / ER_DUP_ENTRY); also accepts PostgreSQL 23505.
export const isDuplicateKeyError = (e) => {
  if (!e) return false;
  return e.errno === 1062 || e.code === "ER_DUP_ENTRY" || e.code === "23505";
};

const db = {
  async query(sql, params = []) {
    const { sql: q, params: p } = toMysql(sql, params);
    const [result] = await pool.query(q, p);
    if (Array.isArray(result)) {
      return { rows: result, rowCount: result.length };
    }
    return { rows: [], rowCount: result.affectedRows, insertId: result.insertId, result };
  },
  async getConnection() {
    return pool.getConnection();
  },
  pool,
};

export default db;