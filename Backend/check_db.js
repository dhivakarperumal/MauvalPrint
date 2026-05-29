const mysql = require('mysql2/promise');
require('dotenv').config({path: './.env'});
async function run() {
  const pool = mysql.createPool({host: 'localhost', user: 'root', password: '', database: 'mauvalprint_db', port: 3306});
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM reviews LIKE 'image'");
    console.log('Image column exists:', rows.length > 0);
    if (rows.length === 0) {
      await pool.query("ALTER TABLE reviews ADD COLUMN image LONGTEXT AFTER comment");
      console.log('Added image column successfully.');
    }
  } catch(e) {
    console.error(e.message);
  }
  pool.end();
}
run();
