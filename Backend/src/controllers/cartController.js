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
        product_name,
        mrp,
        sale_price,
        product_image,
        selected_size,
        selected_color,
        item_data,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        product_id,
        quantity,
        item_data.name || "",
        item_data.mrp || 0,
        item_data.salePrice || item_data.sale_price || 0,
        item_data.images?.[0] || "",
        item_data.selectedSize || "",
        item_data.selectedColor || "",
        JSON.stringify(item_data),
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

    const cart = rows.map(item => ({
      ...JSON.parse(item.item_data),
      quantity: item.quantity,
      selectedSize: item.selected_size,
      selectedColor: item.selected_color,
    }));

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