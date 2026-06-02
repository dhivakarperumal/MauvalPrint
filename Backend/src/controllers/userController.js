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

  console.log(`Update request - ID: ${id}, Body:`, req.body);

  // Allow updating either user fields or status alone
  if (!username && !email && !phone && !role && status === undefined) {
    return res.status(400).json({
      success: false,
      message: "Please provide at least one field to update.",
    });
  }

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    let query = "UPDATE users SET ";
    let values = [];
    let fields = [];

    if (username !== undefined) {
      fields.push("username = ?");
      values.push(username);
    }
    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }
    if (phone !== undefined) {
      fields.push("phone = ?");
      values.push(phone);
    }
    if (role !== undefined) {
      fields.push("role = ?");
      values.push(role);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    fields.push("updated_at = ?");
    values.push(timestamp);
    values.push(id);

    query += fields.join(", ") + " WHERE id = ?";

    console.log("Generated Query:", query);
    console.log("Query Values:", values);

    const [result] = await pool.query(query, values);

    console.log("Update Result:", result);

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
      message: "Could not update user. " + error.message,
    });
  }
};

const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log(`=== STATUS UPDATE REQUEST ===`);
  console.log(`User ID: ${id}`);
  console.log(`New Status: ${status}`);
  console.log(`Req Params:`, req.params);
  console.log(`Req Body:`, req.body);

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required.",
    });
  }

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be 'active' or 'inactive'.",
    });
  }

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    console.log(`Updating user ${id} status to ${status}`);

    // First check if user exists
    const [userCheck] = await pool.query("SELECT id FROM users WHERE id = ?", [id]);
    console.log(`User existence check:`, userCheck);

    if (userCheck.length === 0) {
      console.log(`User with ID ${id} not found in database`);
      return res.status(404).json({
        success: false,
        message: `User not found. ID: ${id}`,
      });
    }

    const [result] = await pool.query(
      "UPDATE users SET status = ?, updated_at = ? WHERE id = ?",
      [status, timestamp, id]
    );

    console.log(`Status update result:`, result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${status} successfully.`,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Could not update user status. " + error.message,
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

const getUserAddresses = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY created_at DESC",
      [id]
    );
    const addresses = rows.map((r) => {
      let parsed;
      try {
        parsed = typeof r.address === "string" ? JSON.parse(r.address) : r.address;
      } catch (e) {
        parsed = {};
      }
      return { id: r.id, ...parsed };
    });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error("Get user addresses error:", error);
    res.status(500).json({ success: false, message: "Could not fetch user addresses." });
  }
};

const addUserAddress = async (req, res) => {
  const { id } = req.params;
  const addressData = req.body;
  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const [result] = await pool.query(
      "INSERT INTO user_addresses (user_id, address, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [id, JSON.stringify(addressData), timestamp, timestamp]
    );
    res.status(201).json({ success: true, message: "Address added successfully.", address_id: result.insertId });
  } catch (error) {
    console.error("Add user address error:", error);
    res.status(500).json({ success: false, message: "Could not add user address." });
  }
};

module.exports = { register, login, getUsers, updateUser, updateUserStatus, deleteUser, getUserAddresses, addUserAddress };
