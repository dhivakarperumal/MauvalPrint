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
      `SELECT id, quantity
       FROM user_cart
       WHERE user_id=? AND product_id=? AND COALESCE(selected_size,'')=? AND COALESCE(selected_color,'')=?`,
      [user_id, product_id, selected_size, selected_color]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE user_cart
         SET quantity = quantity + ?, updated_at = ?
         WHERE user_id=? AND product_id=? AND COALESCE(selected_size,'')=? AND COALESCE(selected_color,'')=?`,
        [quantity, new Date(), user_id, product_id, selected_size, selected_color]
      );

      return res.json({ success: true, message: "Cart updated" });
    }

    // Determine some friendly columns from item_data for easier querying
    const product_name = (item_data && (item_data.name || item_data.title || '')) || '';
    const mrp =
      item_data?.mrp ||
      item_data?.price ||
      0;

    const sale_price =
      item_data?.salePrice ||
      item_data?.sale_price ||
      item_data?.price ||
      0;
    const product_image = (item_data && item_data.images && item_data.images[0]) || (item_data && item_data.product_image) || '';

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
        product_name,
        mrp,
        sale_price,
        product_image,
        selected_size,
        selected_color,
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
        name: item.product_name || parsed.name || parsed.title || "",
        price: item.sale_price || parsed.salePrice || parsed.sale_price || parsed.price || parsed.mrp || 0,
        mrp: item.mrp || parsed.mrp || 0,
        image: item.product_image || (parsed.images && parsed.images[0]) || parsed.product_image || parsed.image || "",
        images: parsed.images || [],
        quantity: item.quantity,
        selectedSize: item.selected_size || parsed.selectedSize || parsed.selected_size || "",
        selectedColor: item.selected_color || parsed.selectedColor || parsed.selected_color || "",
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

    await pool.execute(
      `DELETE FROM user_cart
       WHERE user_id=? AND product_id=? AND COALESCE(selected_size,'')=? AND COALESCE(selected_color,'')=?`,
      [user_id, product_id, selected_size, selected_color]
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

exports.updateCart = async (req, res) => {
  try {
    const pool = db.pool();

    const { user_id, product_id, selectedSize, selected_color, selectedColor, quantity } = req.body;
    const selected_size = selectedSize || selected_color || selectedColor || '';

    await pool.execute(
      `UPDATE user_cart SET quantity = ?, updated_at = ? WHERE user_id=? AND product_id=? AND COALESCE(selected_size,'')=?`,
      [quantity, new Date(), user_id, product_id, selected_size]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};