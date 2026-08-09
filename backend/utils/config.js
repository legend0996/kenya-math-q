// Startup configuration validator — fails fast in production when critical
// settings are missing or insecure, instead of booting a half-configured app.
export const validateConfig = () => {
  if (process.env.NODE_ENV !== "production") return;

  const required = {
    JWT_SECRET: "token signing secret",
    DB_HOST: "database host",
    DB_NAME: "database name",
    PUBLIC_URL: "public backend URL (used for M-Pesa callbacks)",
  };

  const missing = Object.entries(required).filter(([k]) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing production configuration: ${missing
        .map(([, label]) => label)
        .join(", ")}. Set these env vars before starting.`,
    );
  }

  // Weak JWT secrets silently invalidate the auth model.
  if (String(process.env.JWT_SECRET).length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production.");
  }

  // DB_TLS is explicit: shared hosting (cPanel) MySQL on the same server
  // often has no TLS, so DB_SSL=false is legitimate in production. We just
  // require the operator to make the choice explicitly (no silent default).
  if (process.env.DB_SSL === undefined && !process.env.DB_SSL_CA) {
    throw new Error(
      "DB_SSL must be explicitly set to 'true' or 'false' in production (set DB_SSL=false for a same-host cPanel database without TLS).",
    );
  }

  // A plausible public URL is required for M-Pesa to call us back.
  if (!/^https:\/\/[^/\s]+/.test(String(process.env.PUBLIC_URL))) {
    throw new Error("PUBLIC_URL must be a full https URL in production.");
  }
};