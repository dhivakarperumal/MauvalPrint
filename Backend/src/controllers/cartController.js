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

    const selected_size = (item_data && (item_data.selectedSize || item_data.selected_size)) || '';
    const selected_color = (item_data && (item_data.selectedColor || item_data.selected_color)) || '';

    const [existing] = await pool.execute(
      `SELECT id, quantity, item_data
       FROM user_cart
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    let matchId = null;
    let matchQuantity = 0;

    for (const row of existing) {
      let parsed = {};
      try {
        parsed = JSON.parse(row.item_data || "{}");
      } catch (e) {}

      const rowSize = parsed.selectedSize || parsed.selected_size || "";
      const rowColor = parsed.selectedColor || parsed.selected_color || "";

      if (rowSize === selected_size && rowColor === selected_color) {
        matchId = row.id;
        matchQuantity = row.quantity;
        break;
      }
    }

    if (matchId) {
      await pool.execute(
        `UPDATE user_cart
         SET quantity = quantity + ?, updated_at = ?
         WHERE id=?`,
        [quantity, new Date(), matchId]
      );

      return res.json({ success: true, message: "Cart updated" });
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
        id: item.product_id,
        name: parsed.name || parsed.title || "",
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
    const selected_size = req.query.size || req.query.selectedSize || req.query.selected_size || '';
    const selected_color = req.query.color || req.query.selectedColor || req.query.selected_color || '';

    const [existing] = await pool.execute(
      `SELECT id, item_data
       FROM user_cart
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    let matchId = null;
    for (const row of existing) {
      let parsed = {};
      try {
        parsed = JSON.parse(row.item_data || "{}");
      } catch (e) {}

      const rowSize = parsed.selectedSize || parsed.selected_size || "";
      const rowColor = parsed.selectedColor || parsed.selected_color || "";

      if (rowSize === selected_size && rowColor === selected_color) {
        matchId = row.id;
        break;
      }
    }

    if (matchId) {
      await pool.execute(
        `DELETE FROM user_cart
         WHERE id=?`,
        [matchId]
      );
    }

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

exports.updateCart = async (req, res) => {
  try {
    const pool = db.pool();

    const { user_id, product_id, selectedSize, selected_color, selectedColor, quantity } = req.body;
    const selected_size = selectedSize || selected_color || selectedColor || '';

    const [existing] = await pool.execute(
      `SELECT id, item_data
       FROM user_cart
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    let matchId = null;
    for (const row of existing) {
      let parsed = {};
      try {
        parsed = JSON.parse(row.item_data || "{}");
      } catch (e) {}

      const rowSize = parsed.selectedSize || parsed.selected_size || "";
      const rowColor = parsed.selectedColor || parsed.selected_color || "";

      if (rowSize === selected_size) { // Wait, the original code had COALESCE(selected_size, '')=? which only checked selected_size. I will match that logic.
        matchId = row.id;
        break;
      }
    }

    if (matchId) {
      await pool.execute(
        `UPDATE user_cart SET quantity = ?, updated_at = ? WHERE id=?`,
        [quantity, new Date(), matchId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};