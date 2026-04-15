import pool from "../config/db.js";

// 💰 SUBMIT PAYMENT (STUDENT)
export const submitPayment = async (req, res) => {
  try {
    const { registration_id, mpesa_message } = req.body;

    if (!registration_id || !mpesa_message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const result = await pool.query(
      `INSERT INTO payments (registration_id, mpesa_message, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [registration_id, mpesa_message],
    );

    res.json({
      message: "Payment submitted successfully",
      payment: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// 🧑‍💼 ADMIN VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const { payment_id, status } = req.body;

    const payment = await pool.query(
      `UPDATE payments 
       SET status=$1
       WHERE id=$2
       RETURNING *`,
      [status, payment_id],
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // If approved → update registration
    if (status === "paid") {
      await pool.query(
        `UPDATE registrations 
         SET payment_status='paid'
         WHERE id=$1`,
        [payment.rows[0].registration_id],
      );
    }

    res.json({
      message: "Payment updated",
      payment: payment.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// 📋 GET ALL PAYMENTS (ADMIN)
export const getAllPayments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT payments.*, students.full_name 
      FROM payments
      JOIN registrations ON payments.registration_id = registrations.id
      JOIN students ON registrations.student_id = students.id
      ORDER BY payments.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
export const submitPaymentProof = async (req, res) => {
  try {
    const { student_id, contest_id, mpesa_code, proof_text } = req.body;

    if (!student_id || !contest_id || !mpesa_code) {
      return res.status(400).json({
        error: "Missing payment details",
      });
    }

    await pool.query(
      `INSERT INTO payments (student_id, contest_id, mpesa_code, proof_text, status)
       VALUES ($1,$2,$3,$4,'pending')`,
      [student_id, contest_id, mpesa_code, proof_text],
    );

    res.json({
      success: true,
      message: "Payment proof submitted. Await approval.",
    });
  } catch (error) {
    console.error("PAYMENT PROOF ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
export const getQuestions = async (req, res) => {
  try {
    const { contest_id, student_id } = req.params;

    // 🔒 CHECK PAYMENT
    const payment = await pool.query(
      "SELECT status FROM payments WHERE student_id=$1 AND contest_id=$2",
      [student_id, contest_id],
    );

    if (payment.rows.length === 0 || payment.rows[0].status !== "paid") {
      return res.status(403).json({
        error: "You must pay before accessing exam",
      });
    }

    const result = await pool.query(
      "SELECT * FROM questions WHERE contest_id=$1",
      [contest_id],
    );

    res.json({
      success: true,
      questions: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
