const { connectDB, getPool } = require('./src/config/db');

async function test() {
  try {
    await connectDB();
    const pool = getPool();
    const [rows] = await pool.query('SHOW TABLES LIKE "logos"');
    console.log("Logos table exists:", rows.length > 0);
    
    // If it exists, describe it
    if (rows.length > 0) {
        const [desc] = await pool.query('DESCRIBE logos');
        console.log(desc);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();
