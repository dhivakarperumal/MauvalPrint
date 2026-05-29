const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const dbName = process.env.DB_NAME || 'mauvalprint_db';
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

let pool;

async function ensureDatabaseExists() {
  const adminConnection = await mysql.createConnection({
    host: poolConfig.host,
    user: poolConfig.user,
    password: poolConfig.password,
    port: poolConfig.port,
  });

  await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await adminConnection.end();
}

async function connectDB() {
  if (!pool) {
    await ensureDatabaseExists();
    pool = mysql.createPool(poolConfig);

    // Pool error handling
    pool.on('error', (err) => {
      console.error('❌ DB Pool Error:', err.message);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('  → Connection was closed by the server');
      } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.error('  → Cannot enqueue, connection closed due to fatal error');
      } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('  → Authentication failed - check DB credentials');
      } else if (err.code === 'ER_NO_DB_ERROR') {
        console.error('  → Database does not exist');
      }
    });
  }

  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  return pool;
}

module.exports = { connectDB, pool: () => pool };
