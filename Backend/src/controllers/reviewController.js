// GET /api/reviews
const getReviews = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [reviews] = await pool.query(
      "SELECT * FROM reviews ORDER BY date DESC, created_at DESC"
    );
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ success: false, message: "Could not fetch reviews." });
  }
};

// POST /api/reviews
const createReview = async (req, res) => {
  const { name, product, rating, comment, image, featured } = req.body;

  if (!name || !product || !comment || rating == null) {
    return res.status(400).json({ success: false, message: "Name, product, rating, and comment are required." });
  }

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const today = new Date().toISOString().split("T")[0];

    const [result] = await pool.query(
      `INSERT INTO reviews (name, product, rating, comment, image, date, featured, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, product, parseFloat(rating), comment, image || null, today, featured ? 1 : 0, timestamp, timestamp]
    );

    res.status(201).json({ success: true, message: "Review added.", id: result.insertId });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ success: false, message: "Could not create review." });
  }
};

// PUT /api/reviews/:id
const updateReview = async (req, res) => {
  const { id } = req.params;
  const { name, product, rating, comment, image, featured } = req.body;

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (product !== undefined) { fields.push("product = ?"); values.push(product); }
    if (rating !== undefined) { fields.push("rating = ?"); values.push(parseFloat(rating)); }
    if (comment !== undefined) { fields.push("comment = ?"); values.push(comment); }
    if (image !== undefined) { fields.push("image = ?"); values.push(image); }
    if (featured !== undefined) { fields.push("featured = ?"); values.push(featured ? 1 : 0); }

    fields.push("updated_at = ?");
    values.push(timestamp);
    values.push(id);

    const [result] = await pool.query(
      `UPDATE reviews SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    res.status(200).json({ success: true, message: "Review updated." });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ success: false, message: "Could not update review." });
  }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query("DELETE FROM reviews WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }
    res.status(200).json({ success: true, message: "Review deleted." });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ success: false, message: "Could not delete review." });
  }
};

// PATCH /api/reviews/:id/featured — toggle featured
const toggleFeatured = async (req, res) => {
  const { id } = req.params;
  const { featured } = req.body;
  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const [result] = await pool.query(
      "UPDATE reviews SET featured = ?, updated_at = ? WHERE id = ?",
      [featured ? 1 : 0, timestamp, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }
    res.status(200).json({ success: true, message: "Featured status updated." });
  } catch (error) {
    console.error("Toggle featured error:", error);
    res.status(500).json({ success: false, message: "Could not update featured status." });
  }
};

module.exports = { getReviews, createReview, updateReview, deleteReview, toggleFeatured };
