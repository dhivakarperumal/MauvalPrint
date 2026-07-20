const db = require("../config/db");

// Ensure the logo_cart table exists
const ensureTable = async (pool) => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS logo_cart (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT          NOT NULL,
      logo_id     INT          NOT NULL,
      quantity    INT          NOT NULL DEFAULT 1,
      item_data   JSON,
      created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME     ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_logo (user_id, logo_id)
    )
  `);
};

// POST /api/logo-cart/add
exports.addLogoCart = async (req, res) => {
  try {
    const pool = db.pool();
    await ensureTable(pool);

    const { user_id, logo_id, quantity = 1, item_data } = req.body;

    if (!user_id || !logo_id) {
      return res.status(400).json({ success: false, message: "user_id and logo_id are required" });
    }

    const [existing] = await pool.execute(
      `SELECT id, quantity FROM logo_cart WHERE user_id = ? AND logo_id = ?`,
      [user_id, logo_id]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE logo_cart SET quantity = quantity + ?, updated_at = ? WHERE id = ?`,
        [quantity, new Date(), existing[0].id]
      );
      return res.json({ success: true, message: "Logo cart updated" });
    }

    await pool.execute(
      `INSERT INTO logo_cart (user_id, logo_id, quantity, item_data, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, logo_id, quantity, JSON.stringify(item_data || {}), new Date()]
    );

    res.json({ success: true, message: "Logo added to cart" });
  } catch (error) {
    console.error("addLogoCart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/logo-cart/:user_id
exports.getLogoCart = async (req, res) => {
  try {
    const pool = db.pool();
    await ensureTable(pool);

    const { user_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT lc.*, l.name, l.image, l.mrp, l.offer, l.offer_price, l.width, l.height, l.description
       FROM logo_cart lc
       LEFT JOIN logos l ON l.id = lc.logo_id
       WHERE lc.user_id = ?`,
      [user_id]
    );

    const cart = rows.map((row) => ({
      id: row.logo_id,
      name: row.name || "",
      image: row.image || "",
      mrp: parseFloat(row.mrp || 0),
      offer: parseFloat(row.offer || 0),
      offer_price: parseFloat(row.offer_price || 0),
      price: parseFloat(row.offer_price || row.mrp || 0),
      width: row.width,
      height: row.height,
      description: row.description || "",
      quantity: row.quantity,
    }));

    res.json({ success: true, cart });
  } catch (error) {
    console.error("getLogoCart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/logo-cart/:user_id/:logo_id
exports.removeLogoCart = async (req, res) => {
  try {
    const pool = db.pool();
    await ensureTable(pool);

    const { user_id, logo_id } = req.params;

    await pool.execute(
      `DELETE FROM logo_cart WHERE user_id = ? AND logo_id = ?`,
      [user_id, logo_id]
    );

    res.json({ success: true, message: "Logo removed from cart" });
  } catch (error) {
    console.error("removeLogoCart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/logo-cart/update
exports.updateLogoCart = async (req, res) => {
  try {
    const pool = db.pool();
    await ensureTable(pool);

    const { user_id, logo_id, quantity } = req.body;

    if (!user_id || !logo_id || quantity === undefined) {
      return res.status(400).json({ success: false, message: "user_id, logo_id and quantity are required" });
    }

    await pool.execute(
      `UPDATE logo_cart SET quantity = ?, updated_at = ? WHERE user_id = ? AND logo_id = ?`,
      [quantity, new Date(), user_id, logo_id]
    );

    res.json({ success: true, message: "Logo cart quantity updated" });
  } catch (error) {
    console.error("updateLogoCart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
