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

async function ensureTables() {
  const statements = [
    `
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS categories (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        category_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        images JSON,
        subcategories JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS products (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        product_id VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255),
        name VARCHAR(255),
        category VARCHAR(255),
        subcategory VARCHAR(255),
        color JSON,
        size JSON,
        offer DECIMAL(10,2) DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        mrp DECIMAL(10,2) DEFAULT 0,
        sale_price DECIMAL(10,2) DEFAULT 0,
        stock INT DEFAULT 0,
        description TEXT,
        fabric_details TEXT,
        fabric_gsm JSON,
        images JSON,
        our_design BOOLEAN DEFAULT FALSE,
        keyword VARCHAR(255),
        washing_details JSON,
        notes TEXT,
        stock_by_variant JSON,
        size_chart_image TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS orders (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL UNIQUE,
        user_id VARCHAR(36),
        user_email VARCHAR(255),
        checkout JSON,
        cart JSON,
        total DECIMAL(12,2) DEFAULT 0,
        payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Placed',
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS reviews (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        product VARCHAR(255),
        rating INT DEFAULT 0,
        comment TEXT,
        date DATE,
        featured BOOLEAN DEFAULT FALSE,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS invoices (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        invoice_id VARCHAR(50) NOT NULL UNIQUE,
        order_id VARCHAR(50),
        user_id VARCHAR(36),
        amount DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        data JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS dealers (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        dealer_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        data JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS cancel_orders (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50),
        user_id VARCHAR(36),
        reason TEXT,
        status VARCHAR(50) DEFAULT 'cancelled',
        data JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS get_order_details (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL UNIQUE,
        details JSON,
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS our_designs (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        design_id VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255),
        images JSON,
        category VARCHAR(255),
        data JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS user_cart (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        product_id VARCHAR(50),
        quantity INT DEFAULT 1,
        item_data JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS user_wishlist (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        product_id VARCHAR(50),
        item_data JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
      CREATE TABLE IF NOT EXISTS user_addresses (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        address JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function connectDB() {
  if (!pool) {
    await ensureDatabaseExists();
    pool = mysql.createPool(poolConfig);
    await ensureTables();

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
