const db = require("../config/db");

exports.addCart = async (req, res) => {
  try {
    const pool = db.pool();

    const {
      user_id,
      product_id,
      quantity,
      item_data
    } = req.body;

    const [existing] = await pool.execute(
      `SELECT id, quantity
       FROM user_cart
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE user_cart
         SET quantity = quantity + ?
         WHERE user_id=? AND product_id=?`,
        [quantity, user_id, product_id]
      );

      return res.json({
        success: true,
        message: "Cart updated"
      });
    }

    await pool.execute(
      `INSERT INTO user_cart
      (
        user_id,
        product_id,
        quantity,
        item_data,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        user_id,
        product_id,
        quantity,
        JSON.stringify(item_data || {}),
        new Date()
      ]
    );

    res.json({
      success: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const pool = db.pool();

    const { user_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT * FROM user_cart
       WHERE user_id=?`,
      [user_id]
    );

    const cart = rows.map(item => {
      let parsed = {};
      try {
        parsed = JSON.parse(item.item_data || "{}");
      } catch (e) {
        parsed = {};
      }

      return {
        id: item.product_id || item.id,
        name: parsed.name || parsed.title || parsed.product_name || "",
        price: parsed.salePrice || parsed.sale_price || parsed.price || parsed.mrp || 0,
        mrp: parsed.mrp || 0,
        image: (parsed.images && parsed.images[0]) || parsed.product_image || parsed.image || "",
        images: parsed.images || [],
        quantity: item.quantity,
        selectedSize: parsed.selectedSize || parsed.selected_size || "",
        selectedColor: parsed.selectedColor || parsed.selected_color || "",
        item_data: parsed,
      };
    });

    res.json({
      success: true,
      cart
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false
    });
  }
};

exports.removeCart = async (req, res) => {
  try {
    const pool = db.pool();

    const { user_id, product_id } = req.params;

    await pool.execute(
      `DELETE FROM user_cart
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    res.json({
      success: true
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false
    });
  }
};