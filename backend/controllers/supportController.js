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
           ORDER BY id ASC LIMIT 500`,
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

    const role = recipient_role || "student";
    await pool.query(
      `INSERT INTO support_messages
         (author_role, author_id, sender_name, recipient_role, recipient_id, message, read_flag)
       VALUES ('owner', ?, ?, ?, ?, ?, 1)`,
      [req.owner.id, req.owner.name || "Support", role, recipient_id, String(message).trim()],
    );

    // Admin has now seen everything in this conversation
    await pool.query(
      "UPDATE support_messages SET read_flag=1 WHERE author_role=? AND author_id=? AND read_flag=0",
      [role, recipient_id],
    );

    res.json({ success: true, message: "Reply sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 💬 ADMIN CONVERSATIONS — one entry per user, newest activity first,
// with their name, last message and how many messages are unread.
export const getConversations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         m.author_role AS role,
         m.author_id   AS id,
         m.sender_name AS name,
         (SELECT s.message    FROM support_messages s WHERE s.author_role=m.author_role AND s.author_id=m.author_id ORDER BY s.id DESC LIMIT 1) AS last_message,
         (SELECT s.created_at FROM support_messages s WHERE s.author_role=m.author_role AND s.author_id=m.author_id ORDER BY s.id DESC LIMIT 1) AS last_time,
         (SELECT COUNT(*)     FROM support_messages s WHERE s.author_role=m.author_role AND s.author_id=m.author_id AND s.read_flag=0) AS unread
       FROM support_messages m
       WHERE m.author_role <> 'owner'
       GROUP BY m.author_role, m.author_id, m.sender_name
       ORDER BY (SELECT s.id FROM support_messages s WHERE s.author_role=m.author_role AND s.author_id=m.author_id ORDER BY s.id DESC LIMIT 1) DESC`,
    );
    res.json({ success: true, conversations: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 💬 MESSAGES OF ONE CONVERSATION (oldest → newest) — admin side
export const getConversationMessages = async (req, res) => {
  try {
    const { role, id } = req.params;
    if (!role || !id) return res.status(400).json({ error: "role and id required" });

    const rows = (
      await pool.query(
        `SELECT * FROM support_messages
         WHERE (author_role=? AND author_id=?) OR (recipient_role=? AND recipient_id=?)
         ORDER BY id ASC`,
        [role, Number(id), role, Number(id)],
      )
    ).rows;
    res.json({ success: true, messages: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👁️ MARK A CONVERSATION AS READ (admin opened it)
export const markConversationRead = async (req, res) => {
  try {
    const { role, id } = req.params;
    if (!role || !id) return res.status(400).json({ error: "role and id required" });

    await pool.query(
      "UPDATE support_messages SET read_flag=1 WHERE author_role=? AND author_id=? AND read_flag=0",
      [role, Number(id)],
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};