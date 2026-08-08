import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const verifyOwner = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    let token;
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json({ error: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Promoted owners get role "owner" in their token, but live in `students`.
    if (decoded.role === "admin") decoded.role = "owner";

    if (decoded.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Owners table (primary admins + owner-created admins)
    const ownerRow = (await pool.query("SELECT * FROM owners WHERE id=?", [decoded.id])).rows[0];
    if (ownerRow) {
      req.owner = {
        id: ownerRow.id,
        name: ownerRow.name,
        email: ownerRow.email,
        role: "owner",
        is_primary: !!ownerRow.is_primary,
        permissions: Array.isArray(ownerRow.permissions) ? ownerRow.permissions : [],
        via: "owners",
      };
      return next();
    }

    // Promoted student admin
    const studRow = (await pool.query("SELECT * FROM students WHERE id=? AND is_admin=1", [decoded.id])).rows[0];
    if (studRow) {
      req.owner = {
        id: studRow.id,
        name: studRow.full_name,
        email: studRow.email,
        role: "owner",
        is_primary: false,
        permissions: Array.isArray(studRow.permissions) ? studRow.permissions : [],
        grade: studRow.grade,
        via: "student",
      };
      return next();
    }

    return res.status(403).json({ error: "Admin access revoked" });
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Require a specific permission (primary admins can do everything)
export const requirePermission = (perm) => async (req, res, next) => {
  try {
    if (!req.owner) return res.status(401).json({ error: "Admin login required" });
    if (req.owner.is_primary || (req.owner.permissions || []).includes(perm)) {
      return next();
    }
    return res.status(403).json({ error: "You do not have permission to do this" });
  } catch {
    return res.status(403).json({ error: "Permission check failed" });
  }
};