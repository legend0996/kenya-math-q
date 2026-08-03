import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

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
