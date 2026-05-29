const getDealers = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [dealers] = await pool.query(
      "SELECT * FROM dealers ORDER BY created_at DESC"
    );
    res.status(200).json({ success: true, dealers });
  } catch (error) {
    console.error("Get dealers error:", error);
    res.status(500).json({ success: false, message: "Could not fetch dealers." });
  }
};

const createDealer = async (req, res) => {
  const { dealerName, email, phone, address, gstNumber, invoiceNumber } = req.body;

  if (!dealerName || !email || !phone || !address || !gstNumber || !invoiceNumber) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Generate dealer ID (e.g. MD001)
    const [countResult] = await pool.query("SELECT COUNT(*) as count FROM dealers");
    const count = countResult[0].count + 1;
    const dealerId = `MD${String(count).padStart(3, "0")}`;

    const data = JSON.stringify({ gstNumber, invoiceNumber });

    const [result] = await pool.query(
      `INSERT INTO dealers (dealer_id, name, email, phone, address, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dealerId, dealerName, email, phone, address, data, timestamp, timestamp]
    );

    res.status(201).json({ success: true, message: "Dealer added.", id: result.insertId });
  } catch (error) {
    console.error("Create dealer error:", error);
    res.status(500).json({ success: false, message: "Could not create dealer." });
  }
};

const updateDealer = async (req, res) => {
  const { id } = req.params;
  const { dealerName, email, phone, address, gstNumber, invoiceNumber } = req.body;

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    const fields = [];
    const values = [];

    if (dealerName !== undefined) { fields.push("name = ?"); values.push(dealerName); }
    if (email !== undefined) { fields.push("email = ?"); values.push(email); }
    if (phone !== undefined) { fields.push("phone = ?"); values.push(phone); }
    if (address !== undefined) { fields.push("address = ?"); values.push(address); }
    if (gstNumber !== undefined || invoiceNumber !== undefined) {
      // In a real application, you might fetch existing data and merge, but for this form,
      // we usually receive the whole payload anyway.
      fields.push("data = ?");
      values.push(JSON.stringify({ gstNumber, invoiceNumber }));
    }

    fields.push("updated_at = ?");
    values.push(timestamp);
    values.push(id);

    const [result] = await pool.query(
      `UPDATE dealers SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Dealer not found." });
    }

    res.status(200).json({ success: true, message: "Dealer updated." });
  } catch (error) {
    console.error("Update dealer error:", error);
    res.status(500).json({ success: false, message: "Could not update dealer." });
  }
};

const deleteDealer = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query("DELETE FROM dealers WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Dealer not found." });
    }
    res.status(200).json({ success: true, message: "Dealer deleted." });
  } catch (error) {
    console.error("Delete dealer error:", error);
    res.status(500).json({ success: false, message: "Could not delete dealer." });
  }
};

const getInvoicesOptions = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [invoices] = await pool.query("SELECT invoice_no FROM invoices ORDER BY created_at DESC");
    const invoiceNos = invoices.map(inv => inv.invoice_no).filter(Boolean);
    res.status(200).json({ success: true, invoices: invoiceNos });
  } catch (error) {
    console.error("Get invoice options error:", error);
    res.status(500).json({ success: false, message: "Could not fetch invoices." });
  }
};

module.exports = { getDealers, createDealer, updateDealer, deleteDealer, getInvoicesOptions };
