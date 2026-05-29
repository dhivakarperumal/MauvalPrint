const { randomUUID, randomBytes, scrypt: _scrypt } = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(_scrypt);

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
};

const verifyPassword = async (password, storedHash) => {
  if (!storedHash || !password) return false;
  const [salt, key] = storedHash.split(":" );
  if (!salt || !key) return false;
  const derived = await scrypt(password, salt, 64);
  return derived.toString("hex") === key;
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

    console.log(`Registered user_id: ${userId} for email: ${email}`);

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      user_id: userId,
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

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  if (!email.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  try {
    const pool = req.app.locals.pool;
    const [users] = await pool.query(
      "SELECT id, user_id, username, email, password_hash, role, status FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = users[0];
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [users] = await pool.query(
      "SELECT id, user_id, username, email, phone, role, status, created_at FROM users ORDER BY created_at DESC"
    );

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({
      success: false,
      message: "Could not fetch users.",
    });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, phone, role, status } = req.body;

  if (!username || !email || !phone || !role) {
    return res.status(400).json({
      success: false,
      message: "Please provide username, email, phone, and role.",
    });
  }

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    let query = "UPDATE users SET username = ?, email = ?, phone = ?, role = ?, updated_at = ? WHERE id = ?";
    let values = [username, email, phone, role, timestamp, id];

    if (status !== undefined) {
      query = "UPDATE users SET username = ?, email = ?, phone = ?, role = ?, status = ?, updated_at = ? WHERE id = ?";
      values = [username, email, phone, role, status, timestamp, id];
    }

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Could not update user.",
    });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Could not delete user.",
    });
  }
};

module.exports = { register, login, getUsers, updateUser, deleteUser };
