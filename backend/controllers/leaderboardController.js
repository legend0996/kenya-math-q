import pool from "../config/db.js";

// 🏆 GET LEADERBOARD
export const getLeaderboard = async (req, res) => {
  try {
    const { contest_id, type, school, grade, student_id } = req.query;

    if (!contest_id) {
      return res.status(400).json({ error: "contest_id required" });
    }

    let query = `
      SELECT 
        students.id,
        students.full_name,
        students.school,
        students.grade,
        results.score
      FROM results
      JOIN students ON results.student_id = students.id
      WHERE results.contest_id = $1
    `;

    const values = [contest_id];

    // 🏫 SCHOOL FILTER
    if (type === "school" && school) {
      query += ` AND students.school = $${values.length + 1}`;
      values.push(school);
    }

    // 🎓 CLASS FILTER
    if (type === "class" && grade) {
      query += ` AND students.grade = $${values.length + 1}`;
      values.push(grade);
    }

    query += ` ORDER BY results.score DESC`;

    const result = await pool.query(query, values);

    // 🏆 ADD RANKING POSITION
    const ranked = result.rows.map((row, index) => ({
      rank: index + 1,
      ...row,
    }));

    // 🔍 FIND CURRENT USER RANK
    let myRank = null;

    if (student_id) {
      const found = ranked.find((r) => String(r.id) === String(student_id));

      if (found) {
        myRank = found;
      }
    }

    res.json({
      success: true,
      leaderboard: ranked,
      myRank,
    });
  } catch (error) {
    console.error("LEADERBOARD ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
