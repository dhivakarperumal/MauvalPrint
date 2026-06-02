const mysql = require("mysql2/promise");
require("dotenv").config({ path: "./.env" });

async function checkAndAddColumn() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "mauvalprint",
    });

    // Check if column exists
    const [columns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'reason'");
    if (columns.length === 0) {
      console.log("Adding reason column to orders table...");
      await pool.query("ALTER TABLE orders ADD COLUMN reason TEXT");
      console.log("Added successfully.");
    } else {
      console.log("Column reason already exists.");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAndAddColumn();
