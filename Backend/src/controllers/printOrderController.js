const { randomUUID } = require("crypto");

const parseJSON = (value, fallback) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

// Generate next print order ID like GOD001, GOD002
const generateNextPrintOrderId = async (pool) => {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(order_id, 4) AS UNSIGNED)) AS max_id FROM get_order_details WHERE order_id LIKE 'GOD%'"
  );
  const nextNumber = (rows?.[0]?.max_id || 0) + 1;
  return `GOD${String(nextNumber).padStart(3, "0")}`;
};

// POST /api/print-orders
const createPrintOrder = async (req, res) => {
  const { name, phone, email, testimonial, logo, products } = req.body;

  if (!name || !phone || !products || products.length === 0) {
    return res.status(400).json({ success: false, message: "Name, phone, and products are required." });
  }

  try {
    const pool = req.app.locals.pool;
    const orderId = await generateNextPrintOrderId(pool);
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    const details = { name, phone, email: email || "", testimonial: testimonial || "", logo: logo || "", products };

    await pool.query(
      `INSERT INTO get_order_details (order_id, details, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [orderId, JSON.stringify(details), "pending", timestamp, timestamp]
    );

    res.status(201).json({ success: true, message: "Print order created.", order_id: orderId });
  } catch (error) {
    console.error("Create print order error:", error);
    res.status(500).json({ success: false, message: "Could not create print order." });
  }
};

// GET /api/print-orders
const getPrintOrders = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query("SELECT * FROM get_order_details ORDER BY created_at DESC");

    const parsed = rows.map((r) => ({
      id: r.order_id,
      order_id: r.order_id,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      ...parseJSON(r.details, {}),
    }));

    res.status(200).json({ success: true, orders: parsed });
  } catch (error) {
    console.error("Get print orders error:", error);
    res.status(500).json({ success: false, message: "Could not fetch print orders." });
  }
};

// PUT /api/print-orders/:id
const updatePrintOrder = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, testimonial, logo, products, status } = req.body;

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Fetch current details first
    const [rows] = await pool.query("SELECT details FROM get_order_details WHERE order_id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Order not found." });

    const existing = parseJSON(rows[0].details, {});
    const details = {
      ...existing,
      name: name ?? existing.name,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      testimonial: testimonial ?? existing.testimonial,
      logo: logo ?? existing.logo,
      products: products ?? existing.products,
    };

    const fields = ["details = ?", "updated_at = ?"];
    const values = [JSON.stringify(details), timestamp];

    if (status) { fields.push("status = ?"); values.push(status); }
    values.push(id);

    await pool.query(`UPDATE get_order_details SET ${fields.join(", ")} WHERE order_id = ?`, values);

    res.status(200).json({ success: true, message: "Print order updated." });
  } catch (error) {
    console.error("Update print order error:", error);
    res.status(500).json({ success: false, message: "Could not update print order." });
  }
};

// DELETE /api/print-orders/:id
const deletePrintOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query("DELETE FROM get_order_details WHERE order_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Order not found." });
    res.status(200).json({ success: true, message: "Print order deleted." });
  } catch (error) {
    console.error("Delete print order error:", error);
    res.status(500).json({ success: false, message: "Could not delete print order." });
  }
};

module.exports = { createPrintOrder, getPrintOrders, updatePrintOrder, deletePrintOrder };
