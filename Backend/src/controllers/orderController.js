const { randomUUID } = require("crypto");

// Generate next order ID like ORD001, ORD002
const generateNextOrderId = async (pool) => {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(order_id, 4) AS UNSIGNED)) AS max_id FROM orders WHERE order_id LIKE 'ORD%'"
  );
  const nextNumber = (rows?.[0]?.max_id || 0) + 1;
  return `ORD${String(nextNumber).padStart(3, "0")}`;
};

// POST /api/orders — create a new order (used from Billing)
const createOrder = async (req, res) => {
  const {
    customerName,
    customerPhone,
    gstNumber,
    address,
    shopCustomerType,
    items,
    subtotal,
    total,
    status,
  } = req.body;

  if (!customerName || !customerPhone || !items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Customer name, phone, and items are required.",
    });
  }

  try {
    const pool = req.app.locals.pool;
    const orderId = await generateNextOrderId(pool);
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    const checkout = {
      customerName,
      customerPhone,
      gstNumber: gstNumber || "",
      address: address || "",
      shopCustomerType: shopCustomerType || "",
    };

    await pool.query(
      `INSERT INTO orders (order_id, checkout, cart, total, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        JSON.stringify(checkout),
        JSON.stringify(items),
        total || subtotal || 0,
        status || "Delivered",
        timestamp,
        timestamp,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order_id: orderId,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: "Could not create order." });
  }
};

// GET /api/orders — list all orders
const getOrders = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [orders] = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );

    const parsed = orders.map((o) => ({
      ...o,
      checkout: parseJSON(o.checkout, {}),
      cart: parseJSON(o.cart, []),
    }));

    res.status(200).json({ success: true, orders: parsed });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, message: "Could not fetch orders." });
  }
};

// GET /api/orders/user/:userId — get orders by user
const getOrdersByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    const parsed = orders.map((o) => ({
      ...o,
      checkout: parseJSON(o.checkout, {}),
      cart: parseJSON(o.cart, []),
    }));

    res.status(200).json({ success: true, orders: parsed });
  } catch (error) {
    console.error("Get orders by user error:", error);
    res.status(500).json({ success: false, message: "Could not fetch user orders." });
  }
};

// GET /api/orders/:id — get single order
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const order = rows[0];
    res.status(200).json({
      success: true,
      order: {
        ...order,
        checkout: parseJSON(order.checkout, {}),
        cart: parseJSON(order.cart, []),
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ success: false, message: "Could not fetch order." });
  }
};

// PUT /api/orders/:id/status — update order status
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: "Status is required." });
  }

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    let query = "UPDATE orders SET status = ?, updated_at = ? WHERE order_id = ?";
    let params = [status, timestamp, id];

    if (reason !== undefined) {
      query = "UPDATE orders SET status = ?, reason = ?, updated_at = ? WHERE order_id = ?";
      params = [status, reason, timestamp, id];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.status(200).json({ success: true, message: "Order status updated." });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ success: false, message: "Could not update order status." });
  }
};

// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query(
      "DELETE FROM orders WHERE order_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.status(200).json({ success: true, message: "Order deleted." });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ success: false, message: "Could not delete order." });
  }
};

const parseJSON = (value, fallback) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const createWebOrder = async (req, res) => {
  const { checkout, cart, total, paymentID, isCustomLogoPrint, userId, userEmail } = req.body;

  // Debug: log incoming request metadata to help troubleshoot 500s from frontend
  try {
    console.log(`[${new Date().toISOString()}] createWebOrder called. headers content-length=${req.headers['content-length'] || '(unknown)'} bodyKeys=${Object.keys(req.body || {}).join(',')}`);
    if (Array.isArray(cart)) {
      cart.forEach((it, idx) => {
        if (it && it.image && typeof it.image === 'string' && it.image.length > 2000) {
          console.log(`  cart[${idx}].image length=${it.image.length} (truncated)`);
        }
      });
    }
  } catch (e) {
    console.error('Failed to log createWebOrder request info', e);
  }

  // Basic validation to return clearer errors instead of generic 500s
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is required and must be a non-empty array." });
  }

  if (!checkout || typeof checkout !== 'object') {
    return res.status(400).json({ success: false, message: "Checkout information is required." });
  }

  try {
    const pool = req.app.locals.pool;
    const prefix = isCustomLogoPrint ? "OFP" : "ORD";
    
    // Generate order ID
    const [rows] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(order_id, 4) AS UNSIGNED)) AS max_id FROM orders WHERE order_id LIKE ?",
      [`${prefix}%`]
    );
    const nextNumber = (rows?.[0]?.max_id || 0) + 1;
    const orderId = `${prefix}${String(nextNumber).padStart(4, "0")}`;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query(
      `INSERT INTO orders (order_id, user_id, user_email, checkout, cart, total, payment_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        userId || null,
        userEmail || null,
        JSON.stringify(checkout || {}),
        JSON.stringify(cart || []),
        total || 0,
        paymentID || null,
        "Placed",
        timestamp,
        timestamp,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order_id: orderId,
    });
  } catch (error) {
    // Log full error details to help debugging (stack + request body)
    console.error("Create web order error:", error && error.stack ? error.stack : error);
    try {
      console.error("Request body for failed web-checkout:", JSON.stringify(req.body));
    } catch (e) {
      console.error("Could not stringify request body for logging.");
    }

    // Return helpful message in development; otherwise keep generic
    const clientMessage = process.env.NODE_ENV === 'production'
      ? 'Could not create web order.'
      : (error && error.message) ? `Could not create web order: ${error.message}` : 'Could not create web order.';

    res.status(500).json({ success: false, message: clientMessage });
  }
};

module.exports = {
  createOrder,
  createWebOrder,
  getOrders,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
