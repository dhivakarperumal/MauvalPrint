const { randomUUID, randomBytes, scrypt: _scrypt } = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(_scrypt);

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
};

const register = async (req, res) => {
  const { username, email, phone, password, confirmPassword } = req.body;

  if (!username || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  if (!email.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match.",
    });
  }

  try {
    const pool = req.app.locals.pool;
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already in use.",
      });
    }

    const userId = randomUUID();
    const passwordHash = await hashPassword(password);
    const role =
      email.toLowerCase() === "admin@gmail.com"
        ? "admin"
        : "user";
    const status = "active";
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      "INSERT INTO users (user_id, username, email, phone, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        username,
        email,
        phone,
        passwordHash,
        role,
        status,
        timestamp,
        timestamp,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        user_id: userId,
        username,
        email,
        role,
        status,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

module.exports = { register };
