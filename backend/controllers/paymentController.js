import pool, { isDuplicateKeyError } from "../config/db.js";
import {
  darajaConfigured,
  paymentAmount,
  stkPush,
  stkQuery,
  normalizePhone,
  parseCallback,
} from "../utils/daraja.js";

// 🏦 Payment method availability (public)
export const getPaymentMethods = async (req, res) => {
  res.json({
    success: true,
    stk: darajaConfigured(),
    manual: true,
    amount: paymentAmount(),
  });
};

// 💰 SUBMIT PAYMENT PROOF (student, token) — manual fallback
export const submitPaymentProof = async (req, res) => {
  try {
    const { contest_id, mpesa_code, proof_text } = req.body;
    const student_id = req.user.id;

    if (!contest_id || !mpesa_code) {
      return res.status(400).json({ error: "contest_id and mpesa_code are required" });
    }

    const reg = (
      await pool.query(
        "SELECT * FROM registrations WHERE student_id=? AND contest_id=?",
        [student_id, contest_id],
      )
    ).rows[0];
    if (!reg) {
      return res.status(400).json({ error: "Register for the contest first" });
    }

    // prevent duplicate pending proof for the same student+contest
    const existing = await pool.query(
      "SELECT * FROM payments WHERE student_id=? AND contest_id=? AND status='pending'",
      [student_id, contest_id],
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Payment proof already submitted, awaiting approval" });
    }

    try {
      await pool.query(
        `INSERT INTO payments (student_id, contest_id, registration_id, mpesa_code, proof_text, status, provider)
         VALUES (?, ?, ?, ?, ?, 'pending', 'manual')`,
        [student_id, contest_id, reg.id, mpesa_code, proof_text || null],
      );
    } catch (e) {
      if (isDuplicateKeyError(e)) {
        return res.status(400).json({ error: "This M-PESA code has already been used" });
      }
      throw e;
    }

    res.json({ success: true, message: "Payment proof submitted. Await approval." });
  } catch (error) {
    console.error("PAYMENT PROOF ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 📲 INITIATE M-PESA STK PUSH (student, token)
export const initiateStkPush = async (req, res) => {
  try {
    const { contest_id, phone } = req.body;
    const student_id = req.user.id;

    if (!darajaConfigured()) {
      return res.status(400).json({ error: "M-Pesa STK is not available. Submit a payment code instead." });
    }
    if (!contest_id || !phone) {
      return res.status(400).json({ error: "contest_id and phone are required" });
    }

    const reg = (
      await pool.query(
        "SELECT * FROM registrations WHERE student_id=? AND contest_id=?",
        [student_id, contest_id],
      )
    ).rows[0];
    if (!reg) {
      return res.status(400).json({ error: "Register for the contest first" });
    }
    if (reg.payment_status === "paid") {
      return res.status(400).json({ error: "Payment already completed" });
    }

    const normPhone = normalizePhone(phone);
    if (!/^2547\d{8}$/.test(normPhone)) {
      return res.status(400).json({ error: "Enter a valid Safaricom phone number" });
    }

    const amount = (await pool.query("SELECT entry_fee FROM contests WHERE id=?", [contest_id])).rows[0]?.entry_fee || paymentAmount();
    const accountRef = `KMQ${contest_id}-${student_id}`;
    const callbackUrl = `${process.env.PUBLIC_URL || "https://api.kenyamathquest.co.ke"}/api/payment/stk/callback`;

    const result = await stkPush({ phone: normPhone, amount, accountRef, callbackUrl });

    if (String(result.ResponseCode) !== "0") {
      return res.status(400).json({ error: result.ResponseDescription || "STK push failed" });
    }

    await pool.query(
      `INSERT INTO payments (student_id, contest_id, registration_id, status, provider, stk_phone, amount,
         checkout_request_id, merchant_request_id)
       VALUES (?, ?, ?, 'stk_pending', 'stk', ?, ?, ?, ?)`,
      [student_id, contest_id, reg.id, normPhone, amount,
       result.CheckoutRequestID || null, result.MerchantRequestID || null],
    );

    res.json({
      success: true,
      message: "Check your phone and enter your M-Pesa PIN to complete payment.",
      checkout_request_id: result.CheckoutRequestID || null,
    });
  } catch (error) {
    console.error("STK PUSH ERROR:", error);
    res.status(500).json({ error: "Could not initiate M-Pesa payment" });
  }
};

// 🔔 M-PESA STK CALLBACK (public — Safaricom posts here)
// Security model:
//  - Only accepts payments currently in 'stk_pending' (rejects replays).
//  - Serializes handling with a row lock (SELECT ... FOR UPDATE) so two
//    concurrent callbacks for the same checkout can't double-settle.
//  - Verifies amount + the real transaction via the STK Query API.
//  - Any failure routes to 'review' (manual approval) instead of auto-approving.
export const handleStkCallback = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const info = parseCallback(req.body);
    if (!info) {
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid callback" });
    }

    await conn.beginTransaction();

    // Lock the exact checkout row for the duration of settlement.
    const [rows] = await conn.query(
      "SELECT * FROM payments WHERE checkout_request_id=? FOR UPDATE",
      [info.checkoutRequestId],
    );
    const payment = rows[0];

    if (!payment) {
      await conn.rollback();
      return res.status(404).json({ ResultCode: 1, ResultDesc: "Unknown checkout request" });
    }

    // 🔒 Already settled → idempotent success (prevents replay / double marking).
    if (payment.status !== "stk_pending") {
      await conn.commit();
      return res.json({ ResultCode: 0, ResultDesc: "Success" });
    }

    if (info.resultCode === 0 && info.mpesaCode) {
      // 🔒 Amount must match what was charged when the STK push was initiated
      const charged = Number(payment.amount);
      if (charged > 0 && info.amount != null && Number(info.amount) !== charged) {
        await conn.query("UPDATE payments SET status='review' WHERE id=?", [payment.id]);
        await conn.commit();
        return res.json({ ResultCode: 0, ResultDesc: "Success" });
      }

      // 🔒 Confirm with Safaricom before trusting the callback
      let verified = false;
      try {
        const q = await stkQuery({ checkoutRequestId: info.checkoutRequestId });
        verified = String(q.ResultCode) === "0" &&
          Number(q.Amount ?? info.amount ?? 0) === charged;
      } catch (e) {
        console.error("STK QUERY ERROR:", e.message);
      }

      if (!verified) {
        await conn.query(
          "UPDATE payments SET status='review', merchant_request_id=? WHERE id=?",
          [info.merchantRequestId || null, payment.id],
        );
        await conn.commit();
        return res.json({ ResultCode: 0, ResultDesc: "Success" });
      }

      try {
        await conn.query(
          "UPDATE payments SET status='paid', mpesa_code=? WHERE id=?",
          [info.mpesaCode, payment.id],
        );
      } catch (e) {
        // Code already used elsewhere → manual review (no auto-approve).
        if (isDuplicateKeyError(e)) {
          await conn.query(
            "UPDATE payments SET status='review', mpesa_code=? WHERE id=?",
            [info.mpesaCode, payment.id],
          );
        } else {
          throw e;
        }
      }

      await conn.query(
        "UPDATE registrations SET payment_status='paid' WHERE student_id=? AND contest_id=?",
        [payment.student_id, payment.contest_id],
      );
      await conn.query("UPDATE students SET paid=true WHERE id=?", [payment.student_id]);
    } else {
      await conn.query(
        "UPDATE payments SET status='rejected', merchant_request_id=? WHERE id=?",
        [info.merchantRequestId || null, payment.id],
      );
    }

    await conn.commit();
    res.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error("STK CALLBACK ERROR:", error);
    res.status(500).json({ ResultCode: 1, ResultDesc: error.message });
  } finally {
    conn.release();
  }
};

// 🧑‍💼 ADMIN VERIFY PAYMENT — transactional so registration/payment stay consistent
export const verifyPayment = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { payment_id, status } = req.body;

    if (!payment_id || !["paid", "rejected", "pending"].includes(status)) {
      await conn.release();
      return res.status(400).json({ error: "payment_id and valid status required" });
    }

    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT * FROM payments WHERE id=? FOR UPDATE", [payment_id]);
    const payment = rows[0];

    if (!payment) {
      await conn.rollback();
      await conn.release();
      return res.status(404).json({ error: "Payment not found" });
    }

    await conn.query("UPDATE payments SET status=? WHERE id=?", [status, payment.id]);

    // sync registration + student flags
    if (payment.student_id && payment.contest_id) {
      if (status === "paid") {
        await conn.query(
          "UPDATE registrations SET payment_status='paid' WHERE student_id=? AND contest_id=?",
          [payment.student_id, payment.contest_id],
        );
        await conn.query("UPDATE students SET paid=true WHERE id=?", [payment.student_id]);
      } else if (status === "rejected") {
        await conn.query(
          "UPDATE registrations SET payment_status='rejected' WHERE student_id=? AND contest_id=?",
          [payment.student_id, payment.contest_id],
        );
      }
    }

    await conn.commit();
    const fresh = (
      await pool.query("SELECT * FROM payments WHERE id=?", [payment_id])
    ).rows[0];

    res.json({ success: true, message: "Payment updated", payment: fresh });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({ error: "Could not update payment. Please try again." });
  } finally {
    conn.release();
  }
};

// 📋 GET ALL PAYMENTS (admin)
export const getAllPayments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT payments.*, students.full_name, students.school, registrations.contest_id
      FROM payments
      LEFT JOIN registrations ON payments.registration_id = registrations.id
      LEFT JOIN students ON payments.student_id = students.id OR registrations.student_id = students.id
      ORDER BY payments.created_at DESC
    `);

    res.json({ success: true, payments: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// 📋 GET PENDING PAYMENTS (admin)
export const getPendingPayments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT payments.*, students.full_name, students.school, registrations.contest_id
      FROM payments
      LEFT JOIN registrations ON payments.registration_id = registrations.id
      LEFT JOIN students ON payments.student_id = students.id OR registrations.student_id = students.id
      WHERE payments.status='pending'
      ORDER BY payments.created_at DESC
    `);

    res.json({ success: true, payments: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};