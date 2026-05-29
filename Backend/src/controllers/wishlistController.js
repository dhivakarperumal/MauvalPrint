const pool = require("../config/db");

exports.addWishlist = async (req, res) => {
  try {
    const { user_id, product_id, item_data } = req.body;

    const [existing] = await pool.execute(
      `SELECT id
       FROM user_wishlist
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: "Already exists",
      });
    }

    await pool.execute(
      `INSERT INTO user_wishlist
      (user_id, product_id, item_data)
      VALUES (?, ?, ?)`,
      [
        user_id,
        product_id,
        JSON.stringify(item_data),
      ]
    );

    res.json({
      success: true,
      message: "Wishlist added",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT *
       FROM user_wishlist
       WHERE user_id=?`,
      [user_id]
    );

    const wishlist = rows.map((item) => ({
      ...JSON.parse(item.item_data),
    }));

    res.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
    });
  }
};

exports.removeWishlist = async (req, res) => {
  try {
    const { user_id, product_id } = req.params;

    await pool.execute(
      `DELETE FROM user_wishlist
       WHERE user_id=? AND product_id=?`,
      [user_id, product_id]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
    });
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    const { user_id } = req.params;

    await pool.execute(
      `DELETE FROM user_wishlist
       WHERE user_id=?`,
      [user_id]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
    });
  }
};