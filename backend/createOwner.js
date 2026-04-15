import bcrypt from "bcrypt";
import pool from "./config/db.js";

const createOwner = async () => {
  try {
    const email = "owner@kmq.com";
    const password = "12345678";

    const hashed = await bcrypt.hash(password, 10);

    await pool.query("INSERT INTO owners (email, password) VALUES ($1,$2)", [
      email,
      hashed,
    ]);

    console.log("✅ Owner created successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Error creating owner:", error.message);
    process.exit(1);
  }
};

createOwner();
