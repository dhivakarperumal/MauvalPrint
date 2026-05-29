const db = require("../config/db");

exports.addWishlist = async (req, res) => {
  try {
    const pool = db.pool();

    if (!pool) {
      return res.status(500).json({
        success: false,
        message: "Database pool not initialized",
      });
    }

    const { user_id, product_id, item_data } = req.body;

    const [existing] = await pool.execute(
      `SELECT id
       FROM user_wishlist
       WHERE user_id = ? AND product_id = ?`,
      [user_id, product_id]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: "Already in wishlist",
      });
    }

    await pool.execute(
      `INSERT INTO user_wishlist
      (
        user_id,
        product_id,
        item_data,
        created_at
      )
      VALUES (?, ?, ?, ?)`,
      [
        user_id,
        product_id,
        JSON.stringify(item_data),
        new Date(),
      ]
    );

    res.json({
      success: true,
      message: "Wishlist added successfully",
    });
  } catch (error) {
    console.error("Add Wishlist Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const pool = db.pool();

    if (!pool) {
      return res.status(500).json({
        success: false,
        message: "Database pool not initialized",
      });
    }

    const { user_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT *
       FROM user_wishlist
       WHERE user_id = ?`,
      [user_id]
    );

    const wishlist = rows.map((item) => {
      try {
        return JSON.parse(item.item_data);
      } catch {
        return item.item_data;
      }
    });

    res.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.removeWishlist = async (req, res) => {
  try {
    const pool = db.pool();

    if (!pool) {
      return res.status(500).json({
        success: false,
        message: "Database pool not initialized",
      });
    }

    const { user_id, product_id } = req.params;

    await pool.execute(
      `DELETE FROM user_wishlist
       WHERE user_id = ? AND product_id = ?`,
      [user_id, product_id]
    );

    res.json({
      success: true,
      message: "Wishlist item removed",
    });
  } catch (error) {
    console.error("Remove Wishlist Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    const pool = db.pool();

    if (!pool) {
      return res.status(500).json({
        success: false,
        message: "Database pool not initialized",
      });
    }

    const { user_id } = req.params;

    await pool.execute(
      `DELETE FROM user_wishlist
       WHERE user_id = ?`,
      [user_id]
    );

    res.json({
      success: true,
      message: "Wishlist cleared",
    });
  } catch (error) {
    console.error("Clear Wishlist Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};