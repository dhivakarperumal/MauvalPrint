const mysql = require('mysql2/promise');
require('dotenv').config({path: './.env'});
async function run() {
  const pool = mysql.createPool({host: 'localhost', user: 'root', password: '', database: 'mauvalprint_db', port: 3306});
  try {
    const [rows] = await pool.query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    console.log(rows);
  } catch(e) {
    console.error(e.message);
  }
  pool.end();
}
run();
