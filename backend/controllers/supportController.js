import pool from "../config/db.js";

const ROLES = { student: "students", school: "schools", owner: "owners" };

// Send a message from a logged-in student/school/owner to support
export const sendMessage = async (req, res) => {
  try {
    const { role } = req.user || req.owner || {};
    const id = req.user?.id ?? req.owner?.id;
    if (!ROLES[role] || !id) return res.status(401).json({ error: "Login required" });
    const { message } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ error: "Message cannot be empty" });

    await pool.query(
      "INSERT INTO support_messages (author_role, author_id, sender_name, message) VALUES (?,?,?,?)",
      [role, id, req.user?.name || req.owner?.name || "User", String(message).trim()],
    );
    res.json({ success: true, message: "Message sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a user's own support thread (their messages and any admin replies to them)
export const getMessages = async (req, res) => {
  try {
    const { role } = req.user || req.owner || {};
    const isAdmin = role === "owner";
    const id = req.user?.id ?? req.owner?.id;

    let rows;
    if (isAdmin) {
      rows = (await pool.query("SELECT * FROM support_messages ORDER BY id DESC LIMIT 300")).rows;
    } else {
      rows = (
        await pool.query(
          `SELECT * FROM support_messages
           WHERE author_role=? AND author_id=? OR recipient_id=?
           ORDER BY id DESC LIMIT 200`,
          [role, id, id],
        )
      ).rows;
    }
    res.json({ success: true, messages: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin replies to a user's support thread (permission gated upstream)
export const adminReply = async (req, res) => {
  try {
    if (!(req.owner && req.owner.id)) return res.status(401).json({ error: "Admin login required" });
    const { message, recipient_role, recipient_id } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ error: "Reply cannot be empty" });
    if (!recipient_id) return res.status(400).json({ error: "recipient_id is required" });

    await pool.query(
      `INSERT INTO support_messages
         (author_role, author_id, sender_name, recipient_role, recipient_id, message)
       VALUES ('owner', ?, ?, ?, ?, ?)`,
      [req.owner.id, req.owner.name || "Support", recipient_role || "student", recipient_id, String(message).trim()],
    );
    res.json({ success: true, message: "Reply sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};